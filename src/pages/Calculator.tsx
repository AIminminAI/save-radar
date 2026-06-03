import { useState } from 'react'
import { Calculator as CalcIcon, Sparkles } from 'lucide-react'
import { carriers } from '@/data/types'
import { calculateSavings, SavingsResult } from '@/utils/calculator'
import SavingsResultCard from '@/components/SavingsResultCard'
import { useLiveCoupons } from '@/hooks/useApi'
import { useAppStore } from '@/store/useAppStore'

export default function Calculator() {
  const { addSavings } = useAppStore()
  const { coupons, loading: couponsLoading, error: couponsError, refetch: refetchCoupons } = useLiveCoupons()
  const [amount, setAmount] = useState('')
  const [carrier, setCarrier] = useState<string>('all')
  const [result, setResult] = useState<SavingsResult | null>(null)

  const handleCalculate = () => {
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) return
    const res = calculateSavings(num, carrier, coupons)
    setResult(res)
    if (res.totalSavings > 0) {
      addSavings(res.totalSavings)
    }
  }

  const quickAmounts = [30, 50, 100, 200]

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/20 flex items-center justify-center">
            <CalcIcon size={20} className="text-[#FF6B35]" />
          </div>
          <div>
            <h1 className="text-white text-xl font-black">省钱计算器</h1>
            <p className="text-gray-400 text-xs">输入话费，智能匹配最优方案</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <label className="text-gray-400 text-xs mb-2 block">当前话费金额（元）</label>
          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-2xl font-black">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-xl text-white text-2xl font-black placeholder-white/20 outline-none focus:ring-2 focus:ring-[#FF6B35]/40 transition-all"
            />
          </div>

          <div className="flex gap-2 mb-4">
            {quickAmounts.map((qa) => (
              <button
                key={qa}
                onClick={() => setAmount(String(qa))}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  amount === String(qa)
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/15'
                }`}
              >
                ¥{qa}
              </button>
            ))}
          </div>

          <label className="text-gray-400 text-xs mb-2 block">选择运营商</label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button
              onClick={() => setCarrier('all')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                carrier === 'all'
                  ? 'bg-[#FF6B35] text-white shadow-md'
                  : 'bg-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              全部
            </button>
            {carriers.map((c) => (
              <button
                key={c.id}
                onClick={() => setCarrier(c.id)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  carrier === c.id
                    ? 'text-white shadow-md'
                    : 'bg-white/10 text-white/60 hover:bg-white/15'
                }`}
                style={carrier === c.id ? { background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)` } : {}}
              >
                {c.shortName}
              </button>
            ))}
          </div>

          <button
            onClick={handleCalculate}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] text-white font-bold text-sm shadow-lg shadow-[#FF6B35]/30 transition-all duration-200 hover:shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles size={16} />
              开始计算
            </span>
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-24">
        {couponsError ? (
          <div className="bg-red-50 rounded-2xl p-6 text-center border border-red-100">
            <p className="text-red-500 text-sm font-bold mb-2">数据加载失败</p>
            <p className="text-red-400 text-xs mb-3">{couponsError}</p>
            <button
              onClick={() => refetchCoupons()}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
            >
              重新加载
            </button>
          </div>
        ) : couponsLoading ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <CalcIcon size={28} className="text-gray-300 mx-auto mb-3 animate-spin" />
            <p className="text-gray-400 text-sm">正在加载数据...</p>
          </div>
        ) : result ? (
          <SavingsResultCard result={result} />
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <CalcIcon size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">输入话费金额后</p>
            <p className="text-gray-400 text-sm">点击计算查看最优省钱方案</p>
          </div>
        )}
      </div>
    </div>
  )
}
