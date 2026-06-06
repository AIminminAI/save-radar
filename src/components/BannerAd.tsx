import { useEffect, useRef } from 'react'
import { showBannerAd, isAdAvailable } from '@/services/adService'

/**
 * Banner广告组件
 *
 * 放在页面底部，自动展示穿山甲Banner广告
 * 如果未配置广告位ID，不显示任何内容
 */
export function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null)
  const adId = 'banner-ad-container'

  useEffect(() => {
    if (isAdAvailable()) {
      // 延迟加载，等页面渲染完
      const timer = setTimeout(() => {
        showBannerAd(adId)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!isAdAvailable()) return null

  return (
    <div
      id={adId}
      ref={containerRef}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white flex items-center justify-center"
      style={{ minHeight: '50px' }}
    />
  )
}
