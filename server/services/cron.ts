import nodeCron from 'node-cron'
import { scrapeAllSources, scrapeGovPolicies, scrapeQuickSources } from '../services/scraper.js'
import { saveScrapeMeta, loadScrapeMeta, loadScrapedCoupons } from '../services/dataStore.js'

let isRunning = false
let isGovRunning = false
let isQuickRunning = false
const scheduledTasks: import('node-cron').ScheduledTask[] = []
let quickInterval: ReturnType<typeof setInterval> | null = null

export async function runScheduledScrape() {
  if (isRunning) {
    console.log('[Cron] 上一轮抓取仍在进行中，跳过本次')
    return
  }

  isRunning = true
  console.log(`[Cron] 开始全量抓取 - ${new Date().toISOString()}`)

  try {
    const results = await scrapeAllSources()
    const successCount = results.filter(r => r.success).length
    const totalCoupons = results.reduce((sum, r) => sum + r.count, 0)

    console.log(`[Cron] 全量抓取完成: ${successCount}/${results.length} 个源成功, 共 ${totalCoupons} 条`)

    saveScrapeMeta({
      lastScrapeTime: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error('[Cron] 全量抓取出错:', error)
  } finally {
    isRunning = false
  }
}

export async function runGovScrape() {
  if (isGovRunning) {
    console.log('[Cron] 政府网站抓取仍在进行中，跳过本次')
    return
  }

  isGovRunning = true
  console.log(`[Cron] 开始政府网站专项抓取 - ${new Date().toISOString()}`)

  try {
    const results = await scrapeGovPolicies()
    const successCount = results.filter(r => r.success).length
    const totalCoupons = results.reduce((sum, r) => sum + r.count, 0)

    console.log(`[Cron] 政府网站专项抓取完成: ${successCount}/${results.length} 个源成功, 共 ${totalCoupons} 条`)

    const existingMeta = loadScrapeMeta()
    saveScrapeMeta({
      lastScrapeTime: new Date().toISOString(),
      lastGovScrapeTime: new Date().toISOString(),
      results: [...(existingMeta.results || []), ...results],
    })
  } catch (error) {
    console.error('[Cron] 政府网站专项抓取出错:', error)
  } finally {
    isGovRunning = false
  }
}

export async function runQuickScrape() {
  if (isQuickRunning || isRunning || isGovRunning) {
    return
  }

  isQuickRunning = true

  try {
    const results = await scrapeQuickSources()
    const successCount = results.filter(r => r.success).length
    const totalCoupons = results.reduce((sum, r) => sum + r.count, 0)

    if (totalCoupons > 0) {
      console.log(`[Cron] 30秒增量抓取完成: ${successCount}/${results.length} 源成功, ${totalCoupons}条`)
    }

    const existingMeta = loadScrapeMeta()
    saveScrapeMeta({
      ...existingMeta,
      lastScrapeTime: new Date().toISOString(),
      results,
    })
  } catch {
    // silent fail for quick scrape
  } finally {
    isQuickRunning = false
  }
}

export function startCronJobs() {
  console.log('[Cron] ===== 注册定时任务 =====')

  const fullScrape = nodeCron.schedule('0 2 * * *', () => {
    console.log('[Cron] 触发: 每天凌晨2:00全量抓取')
    runScheduledScrape()
  })
  scheduledTasks.push(fullScrape)
  console.log('[Cron] ✅ 每天凌晨 2:00 - 全量抓取（运营商+政府网站）')

  const govMorning = nodeCron.schedule('0 3 * * *', () => {
    console.log('[Cron] 触发: 每天凌晨3:00政府网站专项抓取')
    runGovScrape()
  })
  scheduledTasks.push(govMorning)
  console.log('[Cron] ✅ 每天凌晨 3:00 - 政府网站专项抓取（确保政策数据最新）')

  const govNoon = nodeCron.schedule('0 12 * * *', () => {
    console.log('[Cron] 触发: 每天中午12:00政府网站增量抓取')
    runGovScrape()
  })
  scheduledTasks.push(govNoon)
  console.log('[Cron] ✅ 每天中午 12:00 - 政府网站增量抓取（午间更新）')

  const govEvening = nodeCron.schedule('0 18 * * *', () => {
    console.log('[Cron] 触发: 每天傍晚18:00政府网站增量抓取')
    runGovScrape()
  })
  scheduledTasks.push(govEvening)
  console.log('[Cron] ✅ 每天傍晚 18:00 - 政府网站增量抓取（晚间更新）')

  console.log('[Cron] ✅ 每30秒 - 增量抓取（分钟级实时更新）')

  console.log('[Cron] ===== 定时任务注册完成 =====')
  console.log('[Cron] 政府网站每天4次全量: 02:00/03:00/12:00/18:00')
  console.log('[Cron] 增量抓取: 每30秒自动执行')
  console.log('[Cron] 服务启动5秒后执行首次全量抓取...')

  setTimeout(runScheduledScrape, 5000)

  setTimeout(() => {
    const count = loadScrapedCoupons().length
    console.log(`[Cron] 当前本地缓存: ${count} 条优惠/政策数据`)
  }, 2000)

  quickInterval = setInterval(runQuickScrape, 30 * 1000)
}

export function stopCronJobs() {
  scheduledTasks.forEach(task => task.stop())
  scheduledTasks.length = 0
  if (quickInterval) {
    clearInterval(quickInterval)
    quickInterval = null
  }
  console.log('[Cron] 已停止所有定时任务')
}

export function getScrapeStatus() {
  const meta = loadScrapeMeta()
  return {
    isRunning,
    isGovRunning,
    isQuickRunning,
    lastScrapeTime: meta.lastScrapeTime,
    lastGovScrapeTime: meta.lastGovScrapeTime || '',
    results: meta.results,
    schedule: {
      fullScrape: '每天 02:00',
      govScrape: '每天 03:00, 12:00, 18:00',
      quickScrape: '每30秒',
    },
  }
}
