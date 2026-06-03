import { useEffect, useState } from 'react'
import { useScrapeStatus } from '@/hooks/useApi'

export default function RadarAnimation() {
  const [pulse, setPulse] = useState(0)
  const { status } = useScrapeStatus()

  useEffect(() => {
    const timer = setInterval(() => {
      setPulse(p => (p + 1) % 3)
    }, 1200)
    return () => clearInterval(timer)
  }, [])

  const lastUpdateText = status?.lastGovScrapeTime
    ? `最后更新：${new Date(status.lastGovScrapeTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    : '正在获取最新数据...'

  return (
    <div className="relative flex flex-col items-center justify-center py-6 overflow-hidden">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-2 border-[#00D68F]/20"
          style={{ animation: 'radarPulse1 3s ease-out infinite' }}
        />
        <div
          className="absolute inset-2 rounded-full border-2 border-[#00D68F]/30"
          style={{ animation: 'radarPulse1 3s ease-out infinite 0.5s' }}
        />
        <div
          className="absolute inset-4 rounded-full border-2 border-[#00D68F]/40"
          style={{ animation: 'radarPulse1 3s ease-out infinite 1s' }}
        />

        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#00D68F]/10 to-[#00D68F]/5" />

        <div
          className="absolute w-full h-full"
          style={{ animation: 'radarSpin 4s linear infinite' }}
        >
          <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left bg-gradient-to-r from-[#00D68F] to-transparent" />
        </div>

        <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-[#00D68F] to-[#00B377] flex items-center justify-center shadow-lg shadow-[#00D68F]/30">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#00D68F]"
            style={{
              top: `${20 + Math.sin((pulse + i) * 2.1) * 30}%`,
              left: `${50 + Math.cos((pulse + i) * 1.7) * 35}%`,
              opacity: 0.6 + Math.sin(pulse + i) * 0.4,
              transition: 'all 1.2s ease-in-out',
            }}
          />
        ))}
      </div>

      <div className="mt-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00D68F] animate-pulse" />
          <span className="text-[#00D68F] text-xs font-medium tracking-wide">AI 实时扫描中</span>
        </div>
        <p className="text-gray-400 text-[10px] mt-1">
          {lastUpdateText}
        </p>
      </div>
    </div>
  )
}
