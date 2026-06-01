import { chromium, type Browser, type Page } from 'playwright'

interface PerfResult {
  round: number
  persona: string
  switchMs: number
  renderMs: number
  cardCount: number
  fps: number
}

async function main() {
  console.log('\n🚀 画像切换性能测试开始\n')
  console.log('=' .repeat(60))

  const browser: Browser = await chromium.launch({ headless: true })
  const page: Page = await browser.newPage()

  const results: PerfResult[] = []

  await page.goto('http://localhost:5173/policies', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)

  console.log('✅ 页面加载完成，开始测试...\n')

  const personas = ['office-worker', 'parent']
  const personaNames = ['上班族', '宝妈']
  const ROUNDS = 10

  for (let i = 0; i < ROUNDS; i++) {
    const pIdx = i % 2
    const personaId = personas[pIdx]
    const personaName = personaNames[pIdx]

    const switchStart = Date.now()

    await page.evaluate(`window.__ZUSTAND_STORE__ && window.__ZUSTAND_STORE__.getState().setSelectedPersona('${personaId}')`)

    const switchMs = Date.now() - switchStart

    const renderStart = Date.now()
    await page.waitForTimeout(300)

    const cardCount = await page.evaluate(`document.querySelectorAll('[class*="rounded-2xl"]').length`)

    const renderMs = Date.now() - renderStart

    const fps = await page.evaluate(`
      new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();
        function count() {
          frames++;
          if (performance.now() - start < 500) {
            requestAnimationFrame(count);
          } else {
            resolve(Math.round(frames / ((performance.now() - start) / 1000)));
          }
        }
        requestAnimationFrame(count);
      })
    `)

    const result: PerfResult = {
      round: i + 1,
      persona: personaName,
      switchMs,
      renderMs,
      cardCount,
      fps,
    }
    results.push(result)

    const icon = personaId === 'office-worker' ? '💼' : '👶'
    console.log(
      `  第${String(i + 1).padStart(2, '0')}轮 ${icon} ${personaName} | ` +
      `切换: ${switchMs}ms | 渲染: ${renderMs}ms | ` +
      `卡片: ${cardCount}个 | FPS: ${fps}`
    )

    await page.waitForTimeout(200)
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n📊 测试结果汇总\n')

  const officeResults = results.filter(r => r.persona === '上班族')
  const parentResults = results.filter(r => r.persona === '宝妈')

  const avgSwitch = results.reduce((s, r) => s + r.switchMs, 0) / results.length
  const maxSwitch = Math.max(...results.map(r => r.switchMs))
  const minSwitch = Math.min(...results.map(r => r.switchMs))
  const avgFps = results.reduce((s, r) => s + r.fps, 0) / results.length
  const minFps = Math.min(...results.map(r => r.fps))

  console.log(`  平均切换耗时: ${avgSwitch.toFixed(1)}ms`)
  console.log(`  最大切换耗时: ${maxSwitch}ms`)
  console.log(`  最小切换耗时: ${minSwitch}ms`)
  console.log(`  平均 FPS: ${avgFps.toFixed(1)}`)
  console.log(`  最低 FPS: ${minFps}`)
  console.log()
  console.log(`  💼 上班族 - 平均卡片数: ${(officeResults.reduce((s, r) => s + r.cardCount, 0) / officeResults.length).toFixed(0)}`)
  console.log(`  👶 宝妈   - 平均卡片数: ${(parentResults.reduce((s, r) => s + r.cardCount, 0) / parentResults.length).toFixed(0)}`)

  const hasJank = maxSwitch > 100 || minFps < 30
  console.log()
  if (hasJank) {
    console.log('  ⚠️  检测到卡顿！最大切换耗时超过100ms或FPS低于30')
  } else {
    console.log('  ✅ 无明显卡顿，切换流畅！')
  }

  console.log('\n' + '='.repeat(60))

  console.log('\n📝 侧边栏动画测试\n')

  for (let i = 0; i < 3; i++) {
    const openStart = Date.now()
    await page.click('button:has(svg.lucide-users)') || await page.evaluate(() => {
      const btn = document.querySelector('button')
      document.querySelectorAll('button').forEach(b => {
        if (b.querySelector('svg.lucide-users')) b.click()
      })
    })
    await page.waitForTimeout(400)
    const openMs = Date.now() - openStart

    const sidebarVisible = await page.evaluate(`!!(document.querySelector('[style*="slideInLeft"]') || document.querySelector('.fixed.inset-0'))`)

    await page.evaluate(`(document.querySelector('.fixed.inset-0 > .absolute.inset-0') || {}).click?.()`)
    await page.waitForTimeout(300)

    console.log(`  第${i + 1}次 - 打开耗时: ${openMs}ms | 侧边栏可见: ${sidebarVisible ? '✅' : '❌'}`)
  }

  console.log('\n✅ 性能测试完成！\n')

  await browser.close()
}

main().catch(console.error)
