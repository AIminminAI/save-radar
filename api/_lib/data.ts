import couponsData from '../_data/coupons.json'
import metaData from '../_data/meta.json'

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

const coupons: ScrapedCoupon[] = couponsData as ScrapedCoupon[]
const meta: ScrapeMeta = metaData as ScrapeMeta

function loadData() {
  return { coupons, meta }
}

export { loadData }
export type { ScrapedCoupon, ScrapeMeta }
