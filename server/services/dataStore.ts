import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { ScrapedCoupon } from '../types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', 'data')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, 'bill-radar.db')

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')

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

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_coupons_carrier ON coupons(carrier)
`)
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_coupons_category ON coupons(category)
`)
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_coupons_scraped_at ON coupons(scrapedAt)
`)
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_coupons_title ON coupons(title)
`)

interface ScrapeMeta {
  lastScrapeTime: string
  lastGovScrapeTime?: string
  results: unknown[]
}

function rowToCoupon(row: Record<string, unknown>): ScrapedCoupon {
  return {
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
  }
}

export function loadScrapedCoupons(): ScrapedCoupon[] {
  const rows = db.prepare('SELECT * FROM coupons ORDER BY scrapedAt DESC').all() as Record<string, unknown>[]
  return rows.map(rowToCoupon)
}

export function saveCoupons(newCoupons: ScrapedCoupon[]) {
  const existing = db.prepare('SELECT title FROM coupons').all() as { title: string }[]
  const existingTitles = new Set(existing.map(r => r.title))

  const insert = db.prepare(`
    INSERT OR IGNORE INTO coupons
    (id, title, carrier, carrierName, discountAmount, originalPrice, discountPrice, discountRate,
     expirationDate, category, type, region, guide, claimUrl, isHot, isNew, tags, source, scrapedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    for (const c of newCoupons) {
      if (existingTitles.has(c.title)) continue
      insert.run(
        c.id, c.title, c.carrier, c.carrierName, c.discountAmount,
        c.originalPrice ?? null, c.discountPrice ?? null, c.discountRate ?? null,
        c.expirationDate, c.category, c.type ?? 'coupon', c.region ?? null,
        JSON.stringify(c.guide), c.claimUrl, c.isHot ? 1 : 0, c.isNew ? 1 : 0,
        JSON.stringify(c.tags), c.source, c.scrapedAt
      )
    }
  })

  transaction()

  const count = (db.prepare('SELECT COUNT(*) as cnt FROM coupons').get() as { cnt: number }).cnt
  if (count > 500) {
    db.prepare(`DELETE FROM coupons WHERE id NOT IN (SELECT id FROM coupons ORDER BY scrapedAt DESC LIMIT 500)`).run()
  }
}

export function loadScrapeMeta(): ScrapeMeta {
  const rows = db.prepare('SELECT key, value FROM scrape_meta').all() as { key: string; value: string }[]
  const map: Record<string, string> = {}
  for (const row of rows) {
    map[row.key] = row.value
  }
  return {
    lastScrapeTime: map.lastScrapeTime || '',
    lastGovScrapeTime: map.lastGovScrapeTime || '',
    results: map.results ? JSON.parse(map.results) : [],
  }
}

export function saveScrapeMeta(meta: ScrapeMeta) {
  const upsert = db.prepare('INSERT OR REPLACE INTO scrape_meta (key, value) VALUES (?, ?)')
  const transaction = db.transaction(() => {
    upsert.run('lastScrapeTime', meta.lastScrapeTime)
    if (meta.lastGovScrapeTime) upsert.run('lastGovScrapeTime', meta.lastGovScrapeTime)
    upsert.run('results', JSON.stringify(meta.results))
  })
  transaction()
}

export function getCouponsByCarrier(carrier?: string): ScrapedCoupon[] {
  if (!carrier || carrier === 'all') {
    return loadScrapedCoupons()
  }
  const rows = db.prepare('SELECT * FROM coupons WHERE carrier = ? ORDER BY scrapedAt DESC').all(carrier) as Record<string, unknown>[]
  return rows.map(rowToCoupon)
}

export function getRecentCoupons(hours: number = 24): ScrapedCoupon[] {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const rows = db.prepare('SELECT * FROM coupons WHERE scrapedAt >= ? ORDER BY scrapedAt DESC').all(cutoff) as Record<string, unknown>[]
  return rows.map(rowToCoupon)
}

export function deleteCoupon(id: string) {
  db.prepare('DELETE FROM coupons WHERE id = ?').run(id)
}
