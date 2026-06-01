import { useEffect, useState } from 'react'
import { TrendingDown, Sparkles } from 'lucide-react'
import { SavingsResult as SavingsResultType } from '@/utils/calculator'

interface SavingsResultProps {
  result: SavingsResultType | null
}

export default function SavingsResult({ result }: SavingsResultProps) {
  const [displaySavings, setDisplaySavings] = useState(0)
  const [displayPercent, setDisplayPercent] = useState(0)

  useEffect(() => {
    if (!result) return

    const targetSavings = result.totalSavings
    const targetPercent = result.savingsPercent
    const duration = 800
    const steps = 30
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplaySavings(Math.round(targetSavings * eased * 100) / 100)
      setDisplayPercent(Math.round(targetPercent * eased))

      if (step >= steps) {
        clearInterval(timer)
        setDisplaySavings(targetSavings)
        setDisplayPercent(targetPercent)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [result])

  if (!result) return null

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
      <div className="bg-gradient-to-br from-[#00D68F] to-[#00B377] rounded-3xl p-5 text-white shadow-lg shadow-[#00D68F]/20">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} />
          <span className="text-sm font-bold">智能省钱结果</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-white/70 text-[10px] mb-1">原价金额</p>
            <p className="text-lg font-black">¥{result.originalAmount}</p>
          </div>
          <div className="text-center">
            <p className="text-white/70 text-[10px] mb-1">可省金额</p>
            <p className="text-2xl font-black text-yellow-200">¥{displaySavings.toFixed(0)}</p>
          </div>
          <div className="text-center">
            <p className="text-white/70 text-[10px] mb-1">省钱比例</p>
            <p className="text-2xl font-black text-yellow-200">{displayPercent}%</p>
          </div>
        </div>

        <div className="bg-white/15 rounded-2xl p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} />
            <span className="text-xs font-bold">优化后实付</span>
          </div>
          <p className="text-3xl font-black">¥{result.finalAmount}</p>
        </div>
      </div>

      {result.appliedCoupons.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-bold text-gray-800 mb-3">推荐优惠组合</h4>
          <div className="space-y-2">
            {result.appliedCoupons.map((coupon, i) => (
              <div
                key={coupon.id}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-50 shadow-sm"
                style={{ animation: `fadeInUp 0.4s ease-out ${i * 100}ms both` }}
              >
                <span className="w-6 h-6 rounded-full bg-[#00D68F]/10 text-[#00D68F] flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{coupon.title}</p>
                  <p className="text-[10px] text-gray-400">{coupon.carrierName}</p>
                </div>
                <span className="text-[#FF6B35] text-sm font-black flex-shrink-0">
                  -¥{coupon.discountAmount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 bg-[#1A1A2E] rounded-2xl p-4">
        <p className="text-[#00D68F] text-xs font-bold mb-1">省钱策略</p>
        <p className="text-white text-sm leading-relaxed">{result.strategy}</p>
      </div>
    </div>
  )
}
