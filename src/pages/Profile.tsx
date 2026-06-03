import { User, Heart, TrendingDown, Shield, Clock, Database, CheckCircle2, XCircle, RefreshCw, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { useLiveCoupons, useLivePolicies, useScrapeStatus } from '@/hooks/useApi'
import { personas, getPersona } from '@/data/personas'

export default function Profile() {
  const navigate = useNavigate()
  const { totalSaved, favorites, selectedPersona, setSelectedPersona } = useAppStore()
  const { coupons, loading: couponsLoading, error: couponsError, refetch: refetchCoupons } = useLiveCoupons()
  const { policies, loading: policiesLoading, error: policiesError, refetch: refetchPolicies } = useLivePolicies()
  const { status: scrapeStatus } = useScrapeStatus()

  const persona = getPersona(selectedPersona)
  const favCoupons = coupons.filter(c => favorites.includes(c.id))
  const totalItems = coupons.length + policies.length

  const lastScrapeTime = scrapeStatus?.lastScrapeTime
    ? new Date(scrapeStatus.lastScrapeTime).toLocaleString('zh-CN')
    : '等待首次抓取'

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] px-4 pt-6 pb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8F5E] flex items-center justify-center shadow-lg shadow-[#FF6B35]/30 text-2xl">
            {persona.icon}
          </div>
          <div>
            <h2 className="text-white text-lg font-bold">{persona.name}</h2>
            <p className="text-gray-400 text-xs">{persona.description}</p>
            <p className="text-[#00D68F] text-xl font-black">{favorites.length} 收藏</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Heart size={18} className="text-[#FF6B35] mx-auto mb-1" />
            <p className="text-white text-lg font-black">{favorites.length}</p>
            <p className="text-gray-400 text-[10px]">收藏</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <TrendingDown size={18} className="text-[#00D68F] mx-auto mb-1" />
            <p className="text-white text-lg font-black">{favorites.length}</p>
            <p className="text-gray-400 text-[10px]">收藏</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Shield size={18} className="text-blue-400 mx-auto mb-1" />
            <p className="text-white text-lg font-black">{totalItems}</p>
            <p className="text-gray-400 text-[10px]">政策数据</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4 pb-24">
        {(couponsError || policiesError) && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <p className="text-red-500 text-xs font-bold mb-2">数据加载失败</p>
            <p className="text-red-400 text-[10px] mb-3">{couponsError || policiesError}</p>
            <div className="flex gap-2">
              {couponsError && (
                <button onClick={() => refetchCoupons()} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold active:scale-95 transition-transform">
                  重试优惠券
                </button>
              )}
              {policiesError && (
                <button onClick={() => refetchPolicies()} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold active:scale-95 transition-transform">
                  重试政策
                </button>
              )}
            </div>
          </div>
        )}

        {(couponsLoading || policiesLoading) && (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <RefreshCw size={24} className="text-gray-300 mx-auto mb-2 animate-spin" />
            <p className="text-gray-400 text-xs">正在加载数据...</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-gray-800">选择你的身份</h3>
          </div>
          <p className="text-xs text-gray-400 mb-3">我们会根据你的身份，只展示跟你有关的政策</p>
          <div className="grid grid-cols-2 gap-2">
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p.id)}
                className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all duration-200 active:scale-95 ${
                  selectedPersona === p.id
                    ? 'bg-[#1A1A2E] text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{p.icon}</span>
                <div>
                  <p className={`text-xs font-bold ${selectedPersona === p.id ? 'text-white' : 'text-gray-800'}`}>
                    {p.name}
                  </p>
                  <p className={`text-[10px] ${selectedPersona === p.id ? 'text-gray-300' : 'text-gray-400'}`}>
                    {p.concernAreas.slice(0, 2).join('·')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {favCoupons.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={16} className="text-[#FF6B35]" />
              <h3 className="text-sm font-bold text-gray-800">我的收藏</h3>
            </div>
            <div className="space-y-2">
              {favCoupons.map(coupon => (
                <div key={coupon.id} className="flex items-center gap-3 py-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: coupon.carrier === 'policy' ? '#2B7A9B' : '#E4393C' }}
                  >
                    {coupon.carrierName.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{coupon.title}</p>
                    <p className="text-[10px] text-gray-400">{coupon.expirationDate} 到期</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-[#1A1A2E]" />
            <h3 className="text-sm font-bold text-gray-800">我们 vs 通用AI</h3>
          </div>

          <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 gap-0 text-center">
              <div className="p-2.5 border-b border-white/10">
                <span className="text-gray-400 text-[10px] font-bold">对比项</span>
              </div>
              <div className="p-2.5 border-b border-white/10">
                <span className="text-[#00D68F] text-[10px] font-bold">省钱雷达</span>
              </div>
              <div className="p-2.5 border-b border-white/10">
                <span className="text-gray-400 text-[10px] font-bold">通用AI</span>
              </div>
            </div>

            {[
              { feature: '数据更新', us: '定期抓取', usOk: true, ai: '训练数据截止', aiOk: false },
              { feature: '个性化推荐', us: '按身份筛选', usOk: true, ai: '通用回答', aiOk: false },
              { feature: '政策来源', us: 'gov.cn官方', usOk: true, ai: '可能编造', aiOk: false },
              { feature: '通俗解读', us: 'AI白话解读', usOk: true, ai: '长篇大论', aiOk: false },
              { feature: '原文可验证', us: '直达原文', usOk: true, ai: '无法提供', aiOk: false },
              { feature: '行动指引', us: '告诉你做啥', usOk: true, ai: '泛泛而谈', aiOk: false },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 gap-0 text-center">
                <div className="p-2.5 border-b border-white/5">
                  <span className="text-gray-300 text-[10px]">{row.feature}</span>
                </div>
                <div className="p-2.5 border-b border-white/5 flex items-center justify-center gap-1">
                  {row.usOk ? <CheckCircle2 size={12} className="text-[#00D68F]" /> : <XCircle size={12} className="text-red-400" />}
                  <span className="text-[#00D68F] text-[10px]">{row.us}</span>
                </div>
                <div className="p-2.5 border-b border-white/5 flex items-center justify-center gap-1">
                  {row.aiOk ? <CheckCircle2 size={12} className="text-[#00D68F]" /> : <XCircle size={12} className="text-red-400" />}
                  <span className="text-red-400 text-[10px]">{row.ai}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-gray-400">
            <RefreshCw size={12} />
            <span className="text-[10px]">数据更新时间：{lastScrapeTime}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-gray-800">数据来源说明</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Database size={12} className="text-[#00D68F] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">
                所有政策来自政府官方网站定期抓取，每条附带原文链接可验证，绝不编造。政策解读基于标题自动推断，仅供参考，请以政策原文为准。
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Database size={12} className="text-[#00D68F] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">
                根据你的身份自动筛选相关政策，用白话解读"影响你什么"+"你需要做什么"，不是今日头条式的长篇大论。
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-[#2B7A9B]" />
            <h3 className="text-sm font-bold text-gray-800">法律信息</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/privacy')}
              className="w-full text-left px-3 py-2.5 bg-gray-50 rounded-xl text-xs text-gray-600 font-medium active:scale-95 transition-transform"
            >
              隐私政策
            </button>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              本产品政策解读基于标题自动推断，仅供参考，不构成法律建议。请以政策原文为准。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
