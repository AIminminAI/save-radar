/* eslint-disable @typescript-eslint/no-explicit-any */

interface RewardedVideoAd {
  show(): Promise<void>
  load(): Promise<void>
  onClose(callback: (res: { isEnded: boolean }) => void): void
  onError(callback: (err: any) => void): void
}

let rewardedVideoAd: RewardedVideoAd | null = null

export function initAd(adUnitId: string) {
  // @ts-expect-error wx is WeChat Mini Program global
  if (typeof wx === 'undefined' || !wx.createRewardedVideoAd) return
  // @ts-expect-error wx is WeChat Mini Program global
  rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId })
  if (rewardedVideoAd) {
    rewardedVideoAd.onError((err: any) => console.error('[AdService] 广告错误:', err))
  }
}

export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!rewardedVideoAd) {
      console.warn('[AdService] 广告未初始化')
      uni.showToast({ title: '广告服务暂未开通', icon: 'none' })
      resolve(false)
      return
    }
    rewardedVideoAd.show().catch(() => {
      rewardedVideoAd!.load().then(() => rewardedVideoAd!.show()).catch(() => resolve(false))
    })
    rewardedVideoAd.onClose((res: { isEnded: boolean }) => {
      if (res && res.isEnded) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}
