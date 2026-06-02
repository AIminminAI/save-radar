import { useEffect, useState, ReactNode } from 'react'

function isWeChatBrowser(): boolean {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('micromessenger')
}

export default function WeChatGuard({ children }: { children: ReactNode }) {
  const [isWeChat, setIsWeChat] = useState(false)

  useEffect(() => {
    setIsWeChat(isWeChatBrowser())
  }, [])

  if (!isWeChat) return <>{children}</>

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1A1A2E] flex flex-col items-center justify-center px-8 text-center">
      {/* 右上角箭头指引 */}
      <div className="absolute top-4 right-6 animate-bounce">
        <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
          <path d="M30 0 L30 50 M15 35 L30 50 L45 35" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-white text-xs mt-1 font-bold">点这里</p>
      </div>

      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FFD700] flex items-center justify-center mb-6 shadow-lg">
        <span className="text-4xl">📡</span>
      </div>

      <h1 className="text-white text-2xl font-black mb-3">省钱雷达</h1>
      <p className="text-gray-300 text-sm mb-6 leading-relaxed">
        微信内无法直接使用<br/>
        请点击右上角 <span className="text-[#FFD700] font-bold">···</span> 按钮
      </p>

      <div className="bg-white/10 rounded-2xl p-5 w-full max-w-xs border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#00D68F]/20 flex items-center justify-center">
            <span className="text-sm">1</span>
          </div>
          <p className="text-white text-sm font-bold">点击右上角 ··· 按钮</p>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
            <span className="text-sm">2</span>
          </div>
          <p className="text-white text-sm font-bold">选择「在浏览器中打开」</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
            <span className="text-sm">3</span>
          </div>
          <p className="text-white text-sm font-bold">即可正常使用省钱雷达</p>
        </div>
      </div>

      <p className="text-gray-500 text-[10px] mt-6">
        也可复制链接到浏览器打开：save-radar-opal.vercel.app
      </p>
    </div>
  )
}
