export interface AIInterpretation {
  summary: string
  impactOnYou: Record<string, string>
  whatToDo: Record<string, string>
  moneyImpact: string
  urgency: 'high' | 'medium' | 'low'
  interpretedAt: string
}

export interface ScrapedCoupon {
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
  aiInterpretation?: AIInterpretation
}

export interface ScrapeResult {
  success: boolean
  source: string
  count: number
  timestamp: string
  error?: string
}
