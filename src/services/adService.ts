// 穿山甲H5激励视频广告服务
// 文档: https://www.csjplatform.com/union/media/union/download/H5SDK

const CSJ_RIT_ID = import.meta.env.VITE_CSJ_RIT_ID || '' // 穿山甲广告位ID，稍后填入

interface AdCallbacks {
  onReward: () => void    // 看完广告，发放奖励
  onClose: () => void     // 关闭广告
  onError: (msg: string) => void  // 广告加载失败
}

// 加载穿山甲H5 SDK
function loadCSJSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window._csj_sdk_loaded) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://sf-tk-sg.ibytedtos.com/obj/union-platform/union_sdk.js'
    script.onload = () => { window._csj_sdk_loaded = true; resolve() }
    script.onerror = () => reject(new Error('穿山甲SDK加载失败'))
    document.head.appendChild(script)
  })
}

// 显示激励视频广告
export async function showRewardedAd(callbacks: AdCallbacks): Promise<void> {
  if (!CSJ_RIT_ID) {
    // 没有配置广告位ID时，模拟成功（开发模式）
    console.warn('[AdService] 未配置穿山甲广告位ID，模拟广告成功')
    setTimeout(() => callbacks.onReward(), 1000)
    return
  }

  try {
    await loadCSJSDK()
    // 穿山甲H5激励视频调用
    const sdk = (window as any).unionSdk || (window as any).csjSdk
    if (!sdk) {
      callbacks.onError('SDK未加载')
      return
    }
    sdk.showRewardedVideoAd({
      ritId: CSJ_RIT_ID,
      success: () => callbacks.onReward(),
      fail: (err: any) => callbacks.onError(err?.errMsg || '广告展示失败'),
      close: () => callbacks.onClose(),
    })
  } catch (e) {
    callbacks.onError('广告加载失败')
  }
}

// 检查广告是否可用
export function isAdAvailable(): boolean {
  return !!CSJ_RIT_ID && typeof window !== 'undefined'
}

// 声明全局类型
declare global {
  interface Window {
    _csj_sdk_loaded?: boolean
  }
}
