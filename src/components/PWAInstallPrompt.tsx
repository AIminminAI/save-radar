import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    setIsStandalone(standalone)
    if (standalone) return

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    const firstVisit = localStorage.getItem('pwa-first-visit')
    if (!firstVisit) {
      localStorage.setItem('pwa-first-visit', Date.now().toString())
    }

    if (!dismissed) {
      const timer = setTimeout(() => setShow(true), 3000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handler)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShow(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  if (!show || isStandalone) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slideUp">
      <div className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] rounded-2xl p-4 shadow-xl border border-white/10">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X size={12} className="text-white/60" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#00D68F]/20 flex items-center justify-center">
            <Smartphone size={20} className="text-[#00D68F]" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">添加到主屏幕</p>
            <p className="text-gray-400 text-[10px]">像App一样使用，更快更方便</p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-white/5 rounded-xl p-3 mb-3">
            <p className="text-white/70 text-[11px] leading-relaxed">
              点击浏览器底部 <span className="inline-block px-1.5 py-0.5 bg-white/10 rounded text-white font-bold">↑</span> 分享按钮 → 选择「添加到主屏幕」
            </p>
          </div>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00D68F] to-[#00B377] text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Download size={16} />
            一键安装
          </button>
        ) : (
          <div className="bg-white/5 rounded-xl p-3 mb-3">
            <p className="text-white/70 text-[11px] leading-relaxed">
              点击浏览器菜单 → 选择「添加到主屏幕」或「安装应用」
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
