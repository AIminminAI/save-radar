import { useAppStore } from '@/store/useAppStore'

const FREE_DAILY_LIMIT = 3

export function useAccessControl() {
  const { favorites, shareCount } = useAppStore()

  const canViewFullInterpretation = (policyId: string): boolean => {
    // 已收藏的政策可以看
    if (favorites.includes(policyId)) return true
    // 分享3次以上可以看全部
    if (shareCount >= 3) return true
    // 否则受每日限额限制
    const todayKey = `viewed_${new Date().toISOString().split('T')[0]}`
    const viewedToday: string[] = JSON.parse(localStorage.getItem(todayKey) || '[]')
    if (viewedToday.length < FREE_DAILY_LIMIT) {
      if (!viewedToday.includes(policyId)) {
        viewedToday.push(policyId)
        localStorage.setItem(todayKey, JSON.stringify(viewedToday))
      }
      return true
    }
    return viewedToday.includes(policyId)
  }

  const getAccessStatus = (): { canView: boolean; reason: string; action: string } => {
    if (shareCount >= 3) return { canView: true, reason: '', action: '' }
    const todayKey = `viewed_${new Date().toISOString().split('T')[0]}`
    const viewedToday: string[] = JSON.parse(localStorage.getItem(todayKey) || '[]')
    if (viewedToday.length < FREE_DAILY_LIMIT) return { canView: true, reason: '', action: '' }
    if (shareCount > 0) return { canView: false, reason: '今日免费额度已用完', action: `再分享${3 - shareCount}次解锁全部` }
    return { canView: false, reason: '今日免费额度已用完', action: '分享1次解锁5条' }
  }

  const getTodayViewedCount = (): number => {
    const todayKey = `viewed_${new Date().toISOString().split('T')[0]}`
    const viewedToday: string[] = JSON.parse(localStorage.getItem(todayKey) || '[]')
    return viewedToday.length
  }

  return { canViewFullInterpretation, getAccessStatus, getTodayViewedCount, shareCount, FREE_DAILY_LIMIT }
}
