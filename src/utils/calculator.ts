import { ScrapedCoupon } from '@/data/mockCoupons'

export interface SavingsResult {
  originalAmount: number
  totalSavings: number
  finalAmount: number
  savingsPercent: number
  appliedCoupons: ScrapedCoupon[]
  strategy: string
}

export function calculateSavings(
  amount: number,
  carrier: string,
  coupons: ScrapedCoupon[]
): SavingsResult {
  const filtered = carrier === 'all'
    ? coupons
    : coupons.filter(c => c.carrier === carrier)

  const applicableCoupons = filtered.filter(c => {
    if (c.discountAmount <= 0) return false
    if (c.originalPrice && amount >= c.originalPrice) return true
    if (!c.originalPrice && amount >= c.discountAmount) return true
    return false
  })

  const sorted = [...applicableCoupons].sort((a, b) => b.discountAmount - a.discountAmount)

  const appliedCoupons: ScrapedCoupon[] = []
  let totalSavings = 0
  let remaining = amount

  for (const coupon of sorted) {
    if (appliedCoupons.length >= 3) break
    if (coupon.originalPrice && remaining >= coupon.originalPrice) {
      appliedCoupons.push(coupon)
      totalSavings += coupon.discountAmount
      remaining -= coupon.discountAmount
    } else if (!coupon.originalPrice && remaining >= coupon.discountAmount) {
      appliedCoupons.push(coupon)
      totalSavings += coupon.discountAmount
      remaining -= coupon.discountAmount
    }
  }

  const finalAmount = Math.max(0, amount - totalSavings)
  const savingsPercent = amount > 0 ? Math.round((totalSavings / amount) * 100) : 0

  let strategy = ''
  if (applicableCoupons.length === 0) {
    strategy = '暂无适用优惠，建议关注后续活动更新'
  } else if (appliedCoupons.length === 0) {
    strategy = '当前金额暂无匹配优惠，可尝试调整金额'
  } else if (appliedCoupons.length === 1) {
    strategy = `推荐使用「${appliedCoupons[0].title}」，可节省¥${appliedCoupons[0].discountAmount}`
  } else {
    const names = appliedCoupons.map(c => `「${c.title}」`).join(' + ')
    strategy = `组合使用${names}，最大化省钱效果`
  }

  return {
    originalAmount: amount,
    totalSavings,
    finalAmount,
    savingsPercent,
    appliedCoupons,
    strategy,
  }
}
