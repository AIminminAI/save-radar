import path from 'path'
import fs from 'fs'

interface ScrapedCoupon {
  id: string
  title: string
  carrier: string
  carrierName: string
  discountAmount: number
  originalPrice?: number
  discountPrice?: number
  discountRate?: string
  expirationDate: string
  category: string
  type?: 'coupon' | 'policy'
  region?: string
  guide: string[]
  claimUrl: string
  isHot: boolean
  isNew: boolean
  tags: string[]
  source: string
  scrapedAt: string
}

interface ScrapeMeta {
  lastScrapeTime: string
  lastGovScrapeTime?: string
  results: unknown[]
}

let _couponsCache: ScrapedCoupon[] | null = null
let _metaCache: ScrapeMeta | null = null
let _cacheTime = 0
const CACHE_TTL = 30 * 1000

function resolveDataPath(filename: string): string {
  const candidates = [
    path.join(process.cwd(), 'data', filename),
    path.join(process.cwd(), 'api', 'data', filename),
    path.join(__dirname, '..', '..', 'data', filename),
    path.join(__dirname, '..', 'data', filename),
  ]

  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }

  return candidates[0]
}

function loadData() {
  const now = Date.now()
  if (_couponsCache && _metaCache && now - _cacheTime < CACHE_TTL) {
    return { coupons: _couponsCache, meta: _metaCache }
  }

  const couponsPath = resolveDataPath('scraped-coupons.json')
  const metaPath = resolveDataPath('scrape-meta.json')

  try {
    const couponsRaw = fs.readFileSync(couponsPath, 'utf-8')
    _couponsCache = JSON.parse(couponsRaw) as ScrapedCoupon[]
  } catch {
    _couponsCache = []
  }

  try {
    const metaRaw = fs.readFileSync(metaPath, 'utf-8')
    _metaCache = JSON.parse(metaRaw) as ScrapeMeta
  } catch {
    _metaCache = { lastScrapeTime: '', lastGovScrapeTime: '', results: [] }
  }

  _cacheTime = now
  return { coupons: _couponsCache, meta: _metaCache }
}

export { loadData }
export type { ScrapedCoupon, ScrapeMeta }
