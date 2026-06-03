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

export interface CarrierConfig {
  id: string
  name: string
  shortName: string
  color: string
  bgColor: string
  lightBg: string
}

export const carriers: CarrierConfig[] = [
  { id: 'mobile', name: '中国移动', shortName: '移动', color: '#E4393C', bgColor: '#FFF0F0', lightBg: '#FFF5F5' },
  { id: 'unicom', name: '中国联通', shortName: '联通', color: '#FF8C00', bgColor: '#FFF5E6', lightBg: '#FFFAF0' },
  { id: 'telecom', name: '中国电信', shortName: '电信', color: '#2B7A9B', bgColor: '#E8F4F8', lightBg: '#F0F8FF' },
]

export function getCarrier(id: string): CarrierConfig {
  return carriers.find(c => c.id === id) || carriers[0]
}
