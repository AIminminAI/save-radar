/**
 * 每日自动化脚本：抓取新政策 → AI解读 → 同步到小程序数据文件
 *
 * 使用方式：
 *   npx tsx scripts/daily-update.ts          # 手动执行一次
 *   npx tsx scripts/daily-update.ts --sync   # 执行并同步到小程序
 *
 * 定时执行（Windows 任务计划程序）：
 *   schtasks /create /tn "BillRadarDailyUpdate" /tr "node D:\Huhb\AIProject\HelperForBusyUByHY\bill-radar\bill-radar-pro\node_modules\.bin\tsx D:\Huhb\AIProject\HelperForBusyUByHY\bill-radar\bill-radar-pro\scripts\daily-update.ts --sync" /sc daily /st 02:00
 *
 * 或使用 package.json 脚本：
 *   npm run daily-update
 *   npm run daily-update:sync
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PRO_ROOT = path.join(__dirname, '..')
const MINI_ROOT = path.join(PRO_ROOT, 'mini')

const PRO_DATA_DIR = path.join(PRO_ROOT, 'public', 'data')
const PRO_DATA_DIR2 = path.join(PRO_ROOT, 'data')
const MINI_STATIC_DATA = path.join(MINI_ROOT, 'src', 'static', 'data')

const shouldSync = process.argv.includes('--sync')

function log(msg: string) {
  const ts = new Date().toISOString()
  console.log(`[${ts}] ${msg}`)
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function step1_scrape() {
  log('===== 第1步：抓取政府网站新政策 =====')
  try {
    execSync('npx tsx scripts/scrape-cloud.ts', {
      cwd: PRO_ROOT,
      stdio: 'inherit',
      timeout: 10 * 60 * 1000, // 10分钟超时
    })
    log('抓取完成')
  } catch (err) {
    log('抓取过程中出现错误，继续执行后续步骤: ' + (err instanceof Error ? err.message : String(err)))
  }
}

function step2_aiInterpret() {
  log('===== 第2步：AI解读新政策 =====')
  if (!process.env.DEEPSEEK_API_KEY) {
    log('警告：未设置 DEEPSEEK_API_KEY，跳过AI解读')
    return
  }
  try {
    execSync('npx tsx scripts/ai-interpret.ts', {
      cwd: PRO_ROOT,
      stdio: 'inherit',
      timeout: 30 * 60 * 1000, // 30分钟超时（AI解读较慢）
    })
    log('AI解读完成')
  } catch (err) {
    log('AI解读过程中出现错误: ' + (err instanceof Error ? err.message : String(err)))
  }
}

function step3_syncToMini() {
  if (!shouldSync) {
    log('===== 第3步：跳过同步（未指定 --sync 参数）=====')
    return
  }

  log('===== 第3步：同步数据到小程序 =====')

  const sourceFile = path.join(PRO_DATA_DIR, 'coupons.json')
  if (!fs.existsSync(sourceFile)) {
    log('错误：源数据文件不存在 ' + sourceFile)
    return
  }

  ensureDir(MINI_STATIC_DATA)

  // 复制 coupons.json 到小程序静态数据目录
  const data = fs.readFileSync(sourceFile, 'utf-8')
  fs.writeFileSync(path.join(MINI_STATIC_DATA, 'coupons.json'), data, 'utf-8')
  log(`已同步 ${JSON.parse(data).length} 条数据到小程序`)

  // 同步 meta.json（如果存在）
  const metaFile = path.join(PRO_DATA_DIR, 'meta.json')
  if (fs.existsSync(metaFile)) {
    fs.copyFileSync(metaFile, path.join(MINI_STATIC_DATA, 'meta.json'))
    log('已同步 meta.json 到小程序')
  }

  log('数据同步完成')
}

function step4_summary() {
  log('===== 执行摘要 =====')

  const couponsFile = path.join(PRO_DATA_DIR, 'coupons.json')
  if (fs.existsSync(couponsFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(couponsFile, 'utf-8'))
      const total = data.length
      const withAI = data.filter((c: any) => c.aiInterpretation).length
      const categories: Record<string, number> = {}
      for (const c of data) {
        categories[c.category] = (categories[c.category] || 0) + 1
      }
      log(`总政策数: ${total}`)
      log(`已AI解读: ${withAI}/${total} (${Math.round(withAI / total * 100)}%)`)
      log('分类统计:')
      for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
        log(`  ${cat}: ${count}条`)
      }
    } catch {
      log('无法解析数据文件')
    }
  }

  if (shouldSync) {
    const miniFile = path.join(MINI_STATIC_DATA, 'coupons.json')
    if (fs.existsSync(miniFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(miniFile, 'utf-8'))
        log(`小程序数据: ${data.length}条`)
      } catch {
        log('小程序数据文件解析失败')
      }
    }
  }
}

async function main() {
  log('Bill Radar 每日自动更新脚本启动')
  log(`同步到小程序: ${shouldSync ? '是' : '否'}`)

  step1_scrape()
  step2_aiInterpret()
  step3_syncToMini()
  step4_summary()

  log('全部流程执行完毕')
}

main().catch(err => {
  log('脚本异常退出: ' + (err instanceof Error ? err.message : String(err)))
  process.exit(1)
})
