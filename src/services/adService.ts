/**
 * H5广告服务 - 支持穿山甲(字节跳动)广告
 *
 * 广告位申请：
 * 1. 注册穿山甲开发者：https://www.csjplatform.com
 * 2. 创建应用 → 创建广告位 → 获取广告位ID(ritId)
 * 3. 将广告位ID填入下方 AD_CONFIG
 * 4. 设置环境变量 VITE_CSJ_BANNER_ID, VITE_CSJ_INTERSTITIAL_ID, VITE_CSJ_REWARDED_ID
 */

// 广告位配置 - 优先从环境变量读取
const AD_CONFIG = {
  bannerRitId: import.meta.env.VITE_CSJ_BANNER_ID || '',
  interstitialRitId: import.meta.env.VITE_CSJ_INTERSTITIAL_ID || '',
  rewardedRitId: import.meta.env.VITE_CSJ_REWARDED_ID || import.meta.env.VITE_CSJ_RIT_ID || '',
}

interface AdCallbacks {
  onReward?: () => void
  onClose?: () => void
  onError?: (msg: string) => void
  onShow?: () => void
  onClick?: () => void
}

// 加载穿山甲H5 SDK
function loadCSJSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any)._csj_sdk_loaded) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://sf-tk-sg.ibytedtos.com/obj/union-platform/union_sdk.js'
    script.onload = () => { (window as any)._csj_sdk_loaded = true; resolve() }
    script.onerror = () => reject(new Error('穿山甲SDK加载失败'))
    document.head.appendChild(script)
  })
}

/** 检查广告是否可用 */
export function isAdAvailable(): boolean {
  return !!(AD_CONFIG.rewardedRitId || AD_CONFIG.bannerRitId || AD_CONFIG.interstitialRitId)
}

/** 显示激励视频广告 */
export async function showRewardedAd(callbacks: AdCallbacks = {}): Promise<boolean> {
  if (!AD_CONFIG.rewardedRitId) {
    console.warn('[AdService] 未配置激励视频广告位ID，模拟成功')
    setTimeout(() => callbacks.onReward?.(), 1000)
    return true
  }

  try {
    await loadCSJSDK()
    const sdk = (window as any).unionSdk || (window as any).csjSdk
    if (!sdk) {
      callbacks.onError?.('SDK未加载')
      return false
    }

    return new Promise((resolve) => {
      sdk.showRewardedVideoAd({
        ritId: AD_CONFIG.rewardedRitId,
        success: () => {
          callbacks.onReward?.()
          resolve(true)
        },
        fail: (err: any) => {
          callbacks.onError?.(err?.errMsg || '广告展示失败')
          resolve(false)
        },
        close: () => {
          callbacks.onClose?.()
        },
      })
    })
  } catch {
    callbacks.onError?.('广告加载失败')
    return false
  }
}

/** 显示Banner广告（在指定容器中） */
export async function showBannerAd(containerId: string): Promise<void> {
  if (!AD_CONFIG.bannerRitId) return

  try {
    await loadCSJSDK()
    const sdk = (window as any).unionSdk || (window as any).csjSdk
    if (!sdk) return

    const container = document.getElementById(containerId)
    if (!container) return

    sdk.showBannerAd({
      ritId: AD_CONFIG.bannerRitId,
      container,
      success: () => console.log('[AdService] Banner广告展示成功'),
      fail: (err: any) => console.warn('[AdService] Banner广告展示失败:', err),
    })
  } catch (e) {
    console.warn('[AdService] Banner广告加载失败:', e)
  }
}

/** 显示插屏广告 */
export async function showInterstitialAd(): Promise<boolean> {
  if (!AD_CONFIG.interstitialRitId) return false

  try {
    await loadCSJSDK()
    const sdk = (window as any).unionSdk || (window as any).csjSdk
    if (!sdk) return false

    return new Promise((resolve) => {
      sdk.showInterstitialAd({
        ritId: AD_CONFIG.interstitialRitId,
        success: () => resolve(true),
        fail: () => resolve(false),
        close: () => {},
      })
    })
  } catch {
    return false
  }
}

/** 获取广告配置状态（用于调试） */
export function getAdConfigStatus() {
  return {
    banner: !!AD_CONFIG.bannerRitId,
    interstitial: !!AD_CONFIG.interstitialRitId,
    rewarded: !!AD_CONFIG.rewardedRitId,
    sdkLoaded: !!(window as any)._csj_sdk_loaded,
  }
}
