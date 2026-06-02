import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '..', 'server', 'data', 'bill-radar.db')
const OUTPUT_DIRS = [
  path.join(__dirname, '..', 'data'),
  path.join(__dirname, '..', 'public', 'data'),
]

for (const dir of OUTPUT_DIRS) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

if (!fs.existsSync(DB_PATH)) {
  console.error('[Export] SQLite数据库不存在:', DB_PATH)
  console.error('[Export] 请先运行本地爬虫生成数据')
  process.exit(1)
}

const db = new Database(DB_PATH, { readonly: true })

const rows = db.prepare('SELECT * FROM coupons ORDER BY scrapedAt DESC').all() as Record<string, unknown>[]

const coupons = rows.map(row => ({
  id: row.id as string,
  title: row.title as string,
  carrier: row.carrier as string,
  carrierName: row.carrierName as string,
  discountAmount: row.discountAmount as number,
  originalPrice: row.originalPrice as number | undefined,
  discountPrice: row.discountPrice as number | undefined,
  discountRate: row.discountRate as string | undefined,
  expirationDate: row.expirationDate as string,
  category: row.category as string,
  type: row.type as 'coupon' | 'policy' | undefined,
  region: row.region as string | undefined,
  guide: JSON.parse((row.guide as string) || '[]'),
  claimUrl: row.claimUrl as string,
  isHot: !!row.isHot,
  isNew: !!row.isNew,
  tags: JSON.parse((row.tags as string) || '[]'),
  source: row.source as string,
  scrapedAt: row.scrapedAt as string,
}))

const metaRows = db.prepare('SELECT key, value FROM scrape_meta').all() as { key: string; value: string }[]
const metaMap: Record<string, string> = {}
for (const row of metaRows) {
  metaMap[row.key] = row.value
}

const meta = {
  lastScrapeTime: metaMap.lastScrapeTime || '',
  lastGovScrapeTime: metaMap.lastGovScrapeTime || '',
  results: metaMap.results ? JSON.parse(metaMap.results) : [],
}

const couponsJson = JSON.stringify(coupons, null, 2)
const metaJson = JSON.stringify(meta, null, 2)

for (const dir of OUTPUT_DIRS) {
  fs.writeFileSync(path.join(dir, 'coupons.json'), couponsJson, 'utf-8')
  fs.writeFileSync(path.join(dir, 'meta.json'), metaJson, 'utf-8')
}

db.close()

console.log(`[Export] 导出完成: ${coupons.length} 条数据`)
for (const dir of OUTPUT_DIRS) {
  console.log(`[Export] 输出: ${dir}`)
}
