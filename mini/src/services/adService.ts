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

/** 创建banner广告组件 */
export function createBannerAd(adUnitId: string): any {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.createBannerAd) {
    // @ts-expect-error wx.createBannerAd
    const bannerAd = wx.createBannerAd({
      adUnitId,
      style: {
        left: 0,
        top: 0,
        width: 300,
      }
    })
    bannerAd.onError((err: any) => {
      console.error('[AdService] Banner广告错误:', err)
    })
    return bannerAd
  }
  // #endif
  return null
}

/** 创建插屏广告 */
export function createInterstitialAd(adUnitId: string): any {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.createInterstitialAd) {
    // @ts-expect-error wx.createInterstitialAd
    const interstitialAd = wx.createInterstitialAd({ adUnitId })
    interstitialAd.onError((err: any) => {
      console.error('[AdService] 插屏广告错误:', err)
    })
    return interstitialAd
  }
  // #endif
  return null
}
