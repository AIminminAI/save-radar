const FREE_DAILY_LIMIT = 15
const SHARE_UNLOCK_PER_SHARE = 0 // 分享不再解锁额度（微信规范禁止利益诱导分享）
const AD_UNLOCK_PER_WATCH = 5
const AD_UNLOCK_FOR_PERMANENT = 3 // 看广告3次永久解锁

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

// 获取累计广告解锁次数（用于判断永久解锁）
function getTotalAdUnlockCount(): number {
  return parseInt(uni.getStorageSync('total_ad_unlock') || '0', 10)
}

function isPermanentlyUnlocked(shareCount: number): boolean {
  return getTotalAdUnlockCount() >= AD_UNLOCK_FOR_PERMANENT
}

export function canViewFullInterpretation(policyId: string, favorites: string[], shareCount: number): boolean {
  if (favorites.includes(policyId)) return true
  if (isPermanentlyUnlocked(shareCount)) return true
  const todayKey = `viewed_${getToday()}`
  const viewedToday: string[] = JSON.parse(uni.getStorageSync(todayKey) || '[]')
  const totalLimit = FREE_DAILY_LIMIT + getAdUnlockCount() * AD_UNLOCK_PER_WATCH
  if (viewedToday.length < totalLimit) {
    if (!viewedToday.includes(policyId)) {
      viewedToday.push(policyId)
      uni.setStorageSync(todayKey, JSON.stringify(viewedToday))
    }
    return true
  }
  return viewedToday.includes(policyId)
}

export function getTodayViewedCount(): number {
  const todayKey = `viewed_${getToday()}`
  return JSON.parse(uni.getStorageSync(todayKey) || '[]').length
}

export function getTotalLimit(shareCount: number): number {
  if (isPermanentlyUnlocked(shareCount)) return Infinity
  return FREE_DAILY_LIMIT + getAdUnlockCount() * AD_UNLOCK_PER_WATCH
}

export function getAdUnlockCount(): number {
  const key = `ad_unlock_${getToday()}`
  return parseInt(uni.getStorageSync(key) || '0', 10)
}

export function addAdUnlock(): void {
  const key = `ad_unlock_${getToday()}`
  uni.setStorageSync(key, String(getAdUnlockCount() + 1))
  // 累计广告解锁次数
  uni.setStorageSync('total_ad_unlock', String(getTotalAdUnlockCount() + 1))
}

export function getAccessStatus(shareCount: number): { canView: boolean; reason: string; action: string } {
  if (isPermanentlyUnlocked(shareCount)) return { canView: true, reason: '', action: '' }
  const todayKey = `viewed_${getToday()}`
  const viewedToday: string[] = JSON.parse(uni.getStorageSync(todayKey) || '[]')
  const totalLimit = getTotalLimit(shareCount)
  if (viewedToday.length < totalLimit) return { canView: true, reason: '', action: '' }
  return { canView: false, reason: '今日额度已用完', action: '看广告可解锁更多' }
}

export { FREE_DAILY_LIMIT, SHARE_UNLOCK_PER_SHARE }
