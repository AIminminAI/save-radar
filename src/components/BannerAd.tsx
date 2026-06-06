import { useEffect, useRef } from 'react'

/**
 * 广告组件
 *
 * 优先展示Google AdSense自动广告
 * 如果未配置，不显示任何内容
 */
export function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null)
  const adRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    // Google AdSense自动广告：脚本已在index.html加载
    // 只需推送广告请求即可
    if (adRef.current) {
      try {
        // @ts-expect-error adsbygoogle is injected by AdSense script
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch {
        // AdSense not loaded yet, ignore
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center justify-center my-2"
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-4017542001161004"
        data-ad-slot="auto"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}

/**
 * 信息流广告 - 插入在政策列表中间
 */
export function InFeedAd({ index }: { index: number }) {
  const adRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    if (adRef.current) {
      try {
        // @ts-expect-error adsbygoogle is injected by AdSense script
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch {
        // ignore
      }
    }
  }, [])

  // 每5条政策插入一个广告
  if (index % 5 !== 0 || index === 0) return null

  return (
    <div className="w-full my-2">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-4017542001161004"
        data-ad-slot="auto"
        data-ad-format="fluid"
        data-ad-layout-key="-6t+ed+2i-1n-4w"
      />
    </div>
  )
}
