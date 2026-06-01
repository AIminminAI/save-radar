import { chromium, type Browser, type Page } from 'playwright'

interface DayResult {
  day: number
  session: 'morning' | 'evening'
  pageLoadMs: number
  apiDataCount: number
  personaSwitchMs: number[]
  sidebarOpenMs: number
  sidebarVisible: boolean
  dataFreshness: string
  errors: string[]
  fps: number
}

async function main() {
  console.log('\n📅 7天稳定性模拟测试')
  console.log('   模拟真实用户：每天早晚各访问一次，切换画像，检查数据更新\n')
  console.log('='.repeat(70))

  const browser: Browser = await chromium.launch({ headless: true })
  const allResults: DayResult[] = []

  const personas = ['office-worker', 'parent']
  const personaNames: Record<string, string> = {
    'office-worker': '💼 上班族',
    'parent': '👶 宝妈',
  }

  for (let day = 1; day <= 7; day++) {
    for (const session of ['morning', 'evening'] as const) {
      const sessionLabel = session === 'morning' ? '🌅 早间' : '🌙 晚间'
      console.log(`\n--- 第${day}天 ${sessionLabel}访问 ---`)

      const result: DayResult = {
        day,
        session,
        pageLoadMs: 0,
        apiDataCount: 0,
        personaSwitchMs: [],
        sidebarOpenMs: 0,
        sidebarVisible: false,
        dataFreshness: '',
        errors: [],
        fps: 0,
      }

      const page: Page = await browser.newPage()

      try {
        const loadStart = Date.now()
        await page.goto('http://localhost:5173/policies', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        })
        await page.waitForTimeout(2000)
        result.pageLoadMs = Date.now() - loadStart
        console.log(`  页面加载: ${result.pageLoadMs}ms`)

        const apiData = await page.evaluate(`
          fetch('/api/coupons')
            .then(r => r.json())
            .then(d => ({ total: d.total, lastScrape: d.meta?.lastScrapeTime || 'unknown' }))
            .catch(() => ({ total: 0, lastScrape: 'error' }))
        `) as { total: number; lastScrape: string }
        result.apiDataCount = apiData.total
        result.dataFreshness = apiData.lastScrape
        console.log(`  API数据: ${apiData.total}条 | 最后抓取: ${apiData.lastScrape.substring(0, 19)}`)

        for (const pid of personas) {
          const swStart = Date.now()
          await page.evaluate(`window.__ZUSTAND_STORE__ && window.__ZUSTAND_STORE__.getState().setSelectedPersona('${pid}')`)
          await page.waitForTimeout(200)
          const swMs = Date.now() - swStart
          result.personaSwitchMs.push(swMs)
          console.log(`  切换${personaNames[pid]}: ${swMs}ms`)
        }

        const sbStart = Date.now()
        await page.evaluate(`document.querySelectorAll('button').forEach(b => { if(b.querySelector('svg.lucide-users')) b.click() })`)
        await page.waitForTimeout(500)
        result.sidebarOpenMs = Date.now() - sbStart
        result.sidebarVisible = await page.evaluate(`!!document.querySelector('.fixed.inset-0')`)
        console.log(`  侧边栏打开: ${result.sidebarOpenMs}ms | 可见: ${result.sidebarVisible ? '✅' : '❌'}`)

        await page.evaluate(`(document.querySelector('.fixed.inset-0 > .absolute.inset-0') || {}).click?.()`)
        await page.waitForTimeout(300)

        result.fps = await page.evaluate(`
          new Promise(resolve => {
            let f = 0; const s = performance.now();
            function c() { f++; if(performance.now()-s<500) requestAnimationFrame(c); else resolve(Math.round(f/((performance.now()-s)/1000))); }
            requestAnimationFrame(c);
          })
        `) as number
        console.log(`  FPS: ${result.fps}`)

      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        result.errors.push(msg)
        console.log(`  ❌ 错误: ${msg.substring(0, 80)}`)
      }

      await page.close()
      allResults.push(result)

      await new Promise(r => setTimeout(r, 500))
    }
  }

  await browser.close()

  console.log('\n' + '='.repeat(70))
  console.log('\n📊 7天稳定性测试汇总\n')

  const totalSessions = allResults.length
  const successSessions = allResults.filter(r => r.errors.length === 0).length
  const avgLoad = allResults.reduce((s, r) => s + r.pageLoadMs, 0) / totalSessions
  const avgSwitch = allResults.flatMap(r => r.personaSwitchMs).reduce((s, v) => s + v, 0) / allResults.flatMap(r => r.personaSwitchMs).length
  const maxSwitch = Math.max(...allResults.flatMap(r => r.personaSwitchMs))
  const avgFps = allResults.reduce((s, r) => s + r.fps, 0) / totalSessions
  const minFps = Math.min(...allResults.filter(r => r.fps > 0).map(r => r.fps))
  const sidebarOk = allResults.filter(r => r.sidebarVisible).length
  const avgData = allResults.reduce((s, r) => s + r.apiDataCount, 0) / totalSessions
  const dataStable = allResults.every(r => r.apiDataCount > 0)

  console.log(`  总会话数: ${totalSessions} (7天 × 2次/天)`)
  console.log(`  成功会话: ${successSessions}/${totalSessions} (${(successSessions/totalSessions*100).toFixed(0)}%)`)
  console.log(`  平均页面加载: ${avgLoad.toFixed(0)}ms`)
  console.log(`  平均画像切换: ${avgSwitch.toFixed(1)}ms (最大${maxSwitch}ms)`)
  console.log(`  平均FPS: ${avgFps.toFixed(1)} (最低${minFps})`)
  console.log(`  侧边栏正常: ${sidebarOk}/${totalSessions}`)
  console.log(`  平均数据量: ${avgData.toFixed(0)}条`)
  console.log(`  数据始终可用: ${dataStable ? '✅' : '❌'}`)

  const errors = allResults.filter(r => r.errors.length > 0)
  if (errors.length > 0) {
    console.log(`\n  ⚠️ 错误会话:`)
    errors.forEach(r => {
      console.log(`    第${r.day}天${r.session === 'morning' ? '早' : '晚'}: ${r.errors[0].substring(0, 60)}`)
    })
  }

  const stabilityScore = [
    successSessions / totalSessions >= 0.95 ? 25 : (successSessions / totalSessions) * 25,
    avgSwitch < 50 ? 25 : Math.max(0, 25 - (avgSwitch - 50)),
    minFps >= 55 ? 25 : (minFps / 55) * 25,
    dataStable ? 25 : 0,
  ].reduce((s, v) => s + v, 0)

  console.log(`\n  🏆 综合稳定性评分: ${stabilityScore.toFixed(0)}/100`)
  if (stabilityScore >= 90) console.log('  ✅ 优秀！可上线生产环境')
  else if (stabilityScore >= 70) console.log('  ⚠️ 良好，但需优化部分指标')
  else console.log('  ❌ 需要修复后再上线')

  console.log('\n' + '='.repeat(70))

  console.log('\n📋 每日详细数据:\n')
  console.log('  天  时段  加载ms  数据量  切换ms  侧边栏  FPS  状态')
  console.log('  ' + '-'.repeat(60))
  allResults.forEach(r => {
    const avgSw = r.personaSwitchMs.length > 0
      ? (r.personaSwitchMs.reduce((s, v) => s + v, 0) / r.personaSwitchMs.length).toFixed(0)
      : '-'
    const status = r.errors.length === 0 ? '✅' : '❌'
    console.log(
      `  D${r.day}  ${r.session === 'morning' ? '早间' : '晚间'}  ` +
      `${String(r.pageLoadMs).padStart(5)}   ${String(r.apiDataCount).padStart(3)}条  ` +
      `${String(avgSw).padStart(5)}   ${r.sidebarVisible ? '✅' : '❌'}     ` +
      `${String(r.fps).padStart(2)}   ${status}`
    )
  })

  console.log('\n✅ 7天稳定性测试完成！\n')
}

main().catch(console.error)
