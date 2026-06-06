import { useState, useEffect } from 'react'

const CONSENT_KEY = 'cookie-consent-accepted'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem(CONSENT_KEY)
    if (!accepted) {
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 px-4 pb-2 max-w-[480px] mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
        <p className="text-xs text-gray-600 leading-relaxed mb-3">
          本网站使用 Cookie 和类似技术来提供广告服务（Google AdSense）并优化您的浏览体验。
          继续使用即表示您同意我们的{' '}
          <a href="/privacy" className="text-[#1A1A2E] underline font-bold">隐私政策</a>
          {' '}和{' '}
          <a href="/about" className="text-[#1A1A2E] underline font-bold">关于我们</a>。
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 py-2.5 rounded-xl bg-[#1A1A2E] text-white text-xs font-bold active:scale-95 transition-transform"
          >
            同意并继续
          </button>
        </div>
      </div>
    </div>
  )
}
