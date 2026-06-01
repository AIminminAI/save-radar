import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', 'api', 'data')
const DB_PATH = path.join(DATA_DIR, 'bill-radar.db')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    carrier TEXT NOT NULL,
    carrierName TEXT NOT NULL,
    discountAmount REAL DEFAULT 0,
    originalPrice REAL,
    discountPrice REAL,
    discountRate TEXT,
    expirationDate TEXT,
    category TEXT NOT NULL,
    type TEXT DEFAULT 'coupon',
    region TEXT,
    guide TEXT,
    claimUrl TEXT,
    isHot INTEGER DEFAULT 0,
    isNew INTEGER DEFAULT 1,
    tags TEXT,
    source TEXT,
    scrapedAt TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS scrape_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`)

const couponsFile = path.join(DATA_DIR, 'coupons.json')
const metaFile = path.join(DATA_DIR, 'scrape-meta.json')

if (fs.existsSync(couponsFile)) {
  const raw = fs.readFileSync(couponsFile, 'utf-8')
  const coupons = JSON.parse(raw)

  if (Array.isArray(coupons) && coupons.length > 0) {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO coupons
      (id, title, carrier, carrierName, discountAmount, originalPrice, discountPrice, discountRate,
       expirationDate, category, type, region, guide, claimUrl, isHot, isNew, tags, source, scrapedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const transaction = db.transaction(() => {
      for (const c of coupons) {
        insert.run(
          c.id, c.title, c.carrier, c.carrierName, c.discountAmount || 0,
          c.originalPrice ?? null, c.discountPrice ?? null, c.discountRate ?? null,
          c.expirationDate || '', c.category, c.type ?? 'coupon', c.region ?? null,
          JSON.stringify(c.guide || []), c.claimUrl || '', c.isHot ? 1 : 0, c.isNew ? 1 : 0,
          JSON.stringify(c.tags || []), c.source || '', c.scrapedAt || new Date().toISOString()
        )
      }
    })

    transaction()
    console.log(`✅ 迁移了 ${coupons.length} 条优惠券/政策数据到SQLite`)
  }
} else {
  console.log('ℹ️ 未找到coupons.json，跳过数据迁移')
}

if (fs.existsSync(metaFile)) {
  const raw = fs.readFileSync(metaFile, 'utf-8')
  const meta = JSON.parse(raw)

  const upsert = db.prepare('INSERT OR REPLACE INTO scrape_meta (key, value) VALUES (?, ?)')
  const transaction = db.transaction(() => {
    if (meta.lastScrapeTime) upsert.run('lastScrapeTime', meta.lastScrapeTime)
    if (meta.lastGovScrapeTime) upsert.run('lastGovScrapeTime', meta.lastGovScrapeTime)
    if (meta.results) upsert.run('results', JSON.stringify(meta.results))
  })
  transaction()
  console.log('✅ 迁移了抓取元数据到SQLite')
} else {
  console.log('ℹ️ 未找到scrape-meta.json，跳过元数据迁移')
}

const count = (db.prepare('SELECT COUNT(*) as cnt FROM coupons').get() as { cnt: number }).cnt
console.log(`\n📊 SQLite数据库中共有 ${count} 条数据`)
console.log(`📁 数据库路径: ${DB_PATH}`)

db.close()
