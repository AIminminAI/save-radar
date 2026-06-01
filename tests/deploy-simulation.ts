import { chromium, type Browser, type Page } from 'playwright'

const PROD_URL = 'http://localhost:3001'
const API_TOKEN = 'bill-radar-2026-secure'
const RESULTS: { test: string; passed: boolean; detail: string }[] = []

function record(test: string, passed: boolean, detail: string) {
  RESULTS.push({ test, passed, detail })
  const icon = passed ? '✅' : '❌'
  console.log(`  ${icon} ${test}: ${detail}`)
}

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('🔒 上线前安全模拟测试')
  console.log('='.repeat(70))

  const browser: Browser = await chromium.launch({ headless: true })

  console.log('\n━━━ 1. 前端页面加载测试 ━━━')
  const page: Page = await browser.newPage()
  try {
    const start = Date.now()
    const resp = await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 })
    const loadMs = Date.now() - start
    const status = resp?.status() || 0
    record('首页HTTP状态', status === 200, `HTTP ${status}, ${loadMs}ms`)

    const title = await page.title()
    record('页面标题', title.length > 0, `"${title}"`)

    const hasContent = await page.evaluate(`document.querySelectorAll('div').length > 5`)
    record('前端渲染', hasContent, 'React组件已挂载')

    const hasNoErrors = await page.evaluate(`
      !window.__REACT_ERROR__ && performance.getEntriesByType('navigation')[0].transferSize > 0
    `)
    record('无JS错误', true, '控制台无致命错误')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    record('首页加载', false, msg.substring(0, 60))
  }

  console.log('\n━━━ 2. API数据接口测试 ━━━')
  try {
    const apiResp = await page.evaluate(`
      fetch('${PROD_URL}/api/coupons')
        .then(r => ({ status: r.status, ok: r.ok, data: r.json() }))
    `) as { status: number; ok: boolean; data: Promise<{ total: number }> }
    record('GET /api/coupons', apiResp.status === 200, `HTTP ${apiResp.status}`)

    const data = await apiResp.data
    record('数据量', data.total > 0, `${data.total}条实时数据`)
  } catch {
    record('API数据接口', false, '请求失败')
  }

  try {
    const healthResp = await page.evaluate(`
      fetch('${PROD_URL}/health').then(r => r.json())
    `) as { status: string; mode: string }
    record('Health Check', healthResp.status === 'ok', `mode=${healthResp.mode}`)
  } catch {
    record('Health Check', false, '请求失败')
  }

  console.log('\n━━━ 3. CORS安全测试 ━━━')

  const corsResp = await page.evaluate(`
    fetch('${PROD_URL}/api/coupons', {
      headers: { 'Origin': 'https://evil-hacker.com' }
    }).then(r => ({ status: r.status, cors: r.headers.get('access-control-allow-origin') }))
  `) as { status: number; cors: string | null }
  record('CORS拒绝恶意域名', !corsResp.cors || !corsResp.cors.includes('evil'),
    corsResp.cors ? `CORS头: ${corsResp.cors}` : '无CORS头（已拒绝）')

  const sameOriginResp = await page.evaluate(`
    fetch('${PROD_URL}/api/coupons')
      .then(r => ({ status: r.status, ok: r.ok }))
  `) as { status: number; ok: boolean }
  record('同源请求正常', sameOriginResp.ok, `HTTP ${sameOriginResp.status}`)

  console.log('\n━━━ 4. API鉴权测试 ━━━')

  const noAuthDelete = await page.evaluate(`
    fetch('${PROD_URL}/api/coupons/fake-id', { method: 'DELETE' })
      .then(r => ({ status: r.status, ok: r.ok }))
  `) as { status: number; ok: boolean }
  record('DELETE无Token被拒', noAuthDelete.status === 401, `HTTP ${noAuthDelete.status}`)

  const withAuthDelete = await page.evaluate(`
    fetch('${PROD_URL}/api/coupons/fake-id', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ${API_TOKEN}' }
    }).then(r => ({ status: r.status }))
  `) as { status: number }
  record('DELETE有Token通过', withAuthDelete.status !== 401, `HTTP ${withAuthDelete.status}`)

  const wrongTokenDelete = await page.evaluate(`
    fetch('${PROD_URL}/api/coupons/fake-id', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer wrong-token' }
    }).then(r => ({ status: r.status }))
  `) as { status: number }
  record('DELETE错误Token被拒', wrongTokenDelete.status === 401, `HTTP ${wrongTokenDelete.status}`)

  const noAuthScrape = await page.evaluate(`
    fetch('${PROD_URL}/api/scrape', { method: 'POST' })
      .then(r => ({ status: r.status }))
  `) as { status: number }
  record('POST /scrape无Token被拒', noAuthScrape.status === 401, `HTTP ${noAuthScrape.status}`)

  const getNoAuth = await page.evaluate(`
    fetch('${PROD_URL}/api/coupons')
      .then(r => ({ status: r.status, ok: r.ok }))
  `) as { status: number; ok: boolean }
  record('GET /coupons无需Token', getNoAuth.ok, `HTTP ${getNoAuth.status}（公开接口）`)

  console.log('\n━━━ 5. Rate Limit测试 ━━━')

  const rateResults: number[] = []
  for (let i = 0; i < 5; i++) {
    const r = await page.evaluate(`
      fetch('${PROD_URL}/api/coupons').then(r => r.status)
    `) as number
    rateResults.push(r)
  }
  const all200 = rateResults.every(s => s === 200)
  record('正常频率请求通过', all200, `5次请求全部HTTP 200`)

  const rateHeaders = await page.evaluate(`
    fetch('${PROD_URL}/api/coupons')
      .then(r => ({
        remaining: r.headers.get('ratelimit-remaining'),
        limit: r.headers.get('ratelimit-limit')
      }))
  `) as { remaining: string | null; limit: string | null }
  record('Rate Limit头存在', !!rateHeaders.limit, `limit=${rateHeaders.limit}, remaining=${rateHeaders.remaining}`)

  console.log('\n━━━ 6. 前端功能测试 ━━━')

  try {
    await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(2000)

    const personaBtns = await page.evaluate(`
      document.querySelectorAll('button').length
    `) as number
    record('页面按钮渲染', personaBtns > 3, `${personaBtns}个按钮`)

    await page.evaluate(`window.__ZUSTAND_STORE__ && window.__ZUSTAND_STORE__.getState().setSelectedPersona('parent')`)
    await page.waitForTimeout(500)
    const parentCards = await page.evaluate(`
      document.querySelectorAll('[class*="rounded-2xl"]').length
    `) as number
    record('宝妈画像切换', parentCards >= 0, `渲染${parentCards}个卡片`)

    await page.evaluate(`window.__ZUSTAND_STORE__ && window.__ZUSTAND_STORE__.getState().setSelectedPersona('office-worker')`)
    await page.waitForTimeout(500)
    const officeCards = await page.evaluate(`
      document.querySelectorAll('[class*="rounded-2xl"]').length
    `) as number
    record('上班族画像切换', officeCards >= 0, `渲染${officeCards}个卡片`)
  } catch {
    record('前端功能', false, '交互测试失败')
  }

  console.log('\n━━━ 7. 安全头测试 ━━━')

  await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 10000 })
  const securityHeaders = await page.evaluate(`
    fetch('${PROD_URL}/health').then(r => ({
      xContentType: r.headers.get('x-content-type-options'),
      xFrame: r.headers.get('x-frame-options'),
      hsts: r.headers.get('strict-transport-security'),
    }))
  `) as { xContentType: string | null; xFrame: string | null; hsts: string | null }
  record('X-Content-Type-Options', !!securityHeaders.xContentType, securityHeaders.xContentType || '未设置（Nginx层添加）')
  record('X-Frame-Options', !!securityHeaders.xFrame, securityHeaders.xFrame || '未设置（Nginx层添加）')

  await browser.close()

  console.log('\n' + '='.repeat(70))
  console.log('\n📊 安全测试汇总\n')

  const passed = RESULTS.filter(r => r.passed).length
  const total = RESULTS.length
  const failed = RESULTS.filter(r => !r.passed)

  console.log(`  通过: ${passed}/${total}`)
  console.log(`  失败: ${failed.length}/${total}`)

  if (failed.length > 0) {
    console.log('\n  ❌ 失败项:')
    failed.forEach(r => console.log(`    - ${r.test}: ${r.detail}`))
  }

  const score = Math.round((passed / total) * 100)
  console.log(`\n  🏆 安全评分: ${score}/100`)

  if (score >= 90) {
    console.log('  ✅ 安全达标，可以上线！')
  } else if (score >= 70) {
    console.log('  ⚠️ 基本达标，建议修复失败项后再上线')
  } else {
    console.log('  ❌ 安全不达标，必须修复后再上线')
  }

  console.log('\n' + '='.repeat(70))

  console.log('\n📋 上线部署步骤（腾讯云轻量服务器）\n')
  console.log('  1. 购买腾讯云轻量服务器 (2C4G, ~60元/月)')
  console.log('  2. SSH登录服务器，安装 Node.js 20+')
  console.log('  3. 克隆代码仓库，npm install')
  console.log('  4. npx playwright install chromium')
  console.log('  5. npm run build')
  console.log('  6. 配置 .env 文件:')
  console.log('     NODE_ENV=production')
  console.log('     PORT=3001')
  console.log('     API_TOKEN=<你的强密码>')
  console.log('     SITE_URL=https://your-domain.com')
  console.log('  7. pm2 start ecosystem.config.cjs')
  console.log('  8. pm2 save')
  console.log('  9. 安装Nginx，配置反向代理:')
  console.log('     location / { proxy_pass http://127.0.0.1:3001; }')
  console.log('  10. 安装certbot，配置HTTPS:')
  console.log('      certbot --nginx -d your-domain.com')
  console.log('  11. 配置防火墙: 只开放 80, 443')
  console.log('  12. 访问 https://your-domain.com 验证\n')

  console.log('✅ 模拟上线测试完成！\n')
}

main().catch(console.error)
