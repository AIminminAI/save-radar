import { useNavigate } from 'react-router-dom'
import { ChevronRight, RefreshCw, ArrowRight, TrendingUp, Wallet, Sparkles, Eye, Share2 } from 'lucide-react'
import RadarAnimation from '@/components/RadarAnimation'
import MoneyChallenge from '@/components/MoneyChallenge'
import SavingsRank from '@/components/SavingsRank'
import { useAppStore } from '@/store/useAppStore'
import { useScrapeStatus, useLivePolicies } from '@/hooks/useApi'
import { useAccessControl } from '@/hooks/useAccessControl'
import { getPersona, personas } from '@/data/personas'
import { filterPoliciesForPersona, sortPoliciesByRelevance, interpretPolicy } from '@/utils/policyInterpreter'
import { policyCategories } from '@/data/policies'

const CATEGORY_NAMES: Record<string, string> = {
  'gov-policy': '国家政策',
  'medical': '看病报销',
  'tax': '交税扣税',
  'social-insurance': '社保公积金',
  'housing': '买房租房',
  'pension': '养老金',
  'child': '子女教育',
  'elderly': '赡养老人',
}

const PERSONA_BG: Record<string, string> = {
  'office-worker': 'from-[#1A1A2E] to-[#2D3561]',
  'parent': 'from-[#FF6B9D] to-[#C44569]',
  'student': 'from-[#4ECDC4] to-[#2C7873]',
  'elderly': 'from-[#F9A825] to-[#E65100]',
  'freelancer': 'from-[#7C4DFF] to-[#4A148C]',
}

export default function Home() {
  const navigate = useNavigate()
  const { selectedPersona, setSelectedCoupon, setShowDetail } = useAppStore()
  const { policies, loading: policiesLoading, error: policiesError, lastUpdate: policyUpdate, refetch: refetchPolicies } = useLivePolicies()
  const { status: scrapeStatus } = useScrapeStatus()
  const { getTodayViewedCount, getTotalLimit, shareCount } = useAccessControl()

  const persona = getPersona(selectedPersona)
  const myPolicies = sortPoliciesByRelevance(
    filterPoliciesForPersona(policies, persona),
    persona
  )
  const topPolicies = myPolicies.slice(0, 5)

  const lastUpdateTime = scrapeStatus?.lastScrapeTime
    ? new Date(scrapeStatus.lastScrapeTime).toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : policyUpdate || '等待首次抓取'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] via-[#1A1A2E] to-[#f5f5f5]">
      <div className="bg-[#1A1A2E] pb-8 pt-2">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-black">省钱雷达</h1>
              <p className="text-gray-400 text-xs mt-0.5">定期更新 · 只看跟你有关的</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
              {persona.icon}
            </div>
          </div>
        </div>

        <RadarAnimation />
      </div>

      <MoneyChallenge />

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-[#FFD700]" />
            <span className="text-xs font-black text-gray-800">你是谁？选一个最像你的</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => useAppStore.getState().setSelectedPersona(p.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 ${
                  selectedPersona === p.id
                    ? `bg-gradient-to-r ${PERSONA_BG[p.id]} text-white shadow-md`
                    : 'bg-gray-100 text-gray-500 active:scale-95'
                }`}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">{persona.catchphrase}</p>
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-2 border border-[#00D68F]/20">
          <span className="text-xs text-gray-600">
            最近更新: <span className="text-[#00D68F] font-bold">{lastUpdateTime}</span>
            {scrapeStatus?.isRunning && (
              <span className="ml-2 text-[#FF6B35] animate-pulse">抓取中...</span>
            )}
          </span>
          <span className="ml-auto text-[10px] text-gray-400">
            跟你有关 {myPolicies.length} 条
          </span>
        </div>
      </div>

      <div className="px-4 mt-2">
        <div className={`rounded-2xl p-3 flex items-center gap-2 border ${
          !getTotalLimit() || (getTodayViewedCount() >= getTotalLimit() && shareCount < 3)
            ? 'bg-[#FFF5F0] border-[#FF6B35]/20'
            : 'bg-white/80 border-[#00D68F]/20'
        }`}>
          <Eye size={14} className={!getTotalLimit() || (getTodayViewedCount() >= getTotalLimit() && shareCount < 3) ? 'text-[#FF6B35]' : 'text-[#00D68F]'} />
          <span className={`text-xs font-bold ${
            !getTotalLimit() || (getTodayViewedCount() >= getTotalLimit() && shareCount < 3) ? 'text-[#FF6B35]' : 'text-gray-600'
          }`}>
            今日已看 {getTodayViewedCount()}/{shareCount >= 3 ? '∞' : getTotalLimit()} 条完整解读
          </span>
          {getTodayViewedCount() >= getTotalLimit() && shareCount < 3 && (
            <span className="ml-auto text-[10px] text-[#FF6B35] font-bold flex items-center gap-0.5">
              <Share2 size={10} />
              分享解锁更多
            </span>
          )}
          {shareCount >= 3 && (
            <span className="ml-auto text-[10px] text-[#00D68F] font-bold">已解锁全部</span>
          )}
        </div>
      </div>

      <div className="mt-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-800 text-base font-bold">
            {persona.icon} {persona.name}，这些跟你有关
          </h2>
          <button
            onClick={() => navigate('/policies')}
            className="flex items-center gap-0.5 text-[#FF6B35] text-xs font-bold"
          >
            查看全部
            <ChevronRight size={14} />
          </button>
        </div>

        {policiesError ? (
          <div className="bg-red-50 rounded-2xl p-6 text-center border border-red-100">
            <p className="text-red-500 text-sm font-bold mb-2">数据加载失败</p>
            <p className="text-red-400 text-xs mb-3">{policiesError}</p>
            <button
              onClick={() => refetchPolicies()}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
            >
              重新加载
            </button>
          </div>
        ) : policiesLoading && myPolicies.length === 0 ? (
          <div className="bg-white/80 rounded-2xl p-8 text-center">
            <RefreshCw size={28} className="text-gray-300 mx-auto mb-3 animate-spin" />
            <p className="text-gray-400 text-sm">正在获取政策数据...</p>
            <p className="text-gray-300 text-xs mt-1">数据来源于gov.cn等官方源</p>
          </div>
        ) : topPolicies.length === 0 ? (
          <div className="bg-white/80 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm">暂无与你相关的政策</p>
            <p className="text-gray-300 text-xs mt-1">试试切换其他画像，或等待抓取更新</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topPolicies.map((policy) => {
              const interp = interpretPolicy(policy, persona)
              const catName = CATEGORY_NAMES[policy.category] || policy.category
              return (
                <div
                  key={policy.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50 cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => {
                    setSelectedCoupon(policy)
                    setShowDetail(true)
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-gray-400 font-bold">{catName}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-300">{policy.source}</span>
                    </div>

                    <div className={`rounded-xl p-2.5 mb-2 ${
                      interp.urgency === 'high'
                        ? 'bg-gradient-to-r from-[#FFF5F0] to-[#FFF0E8]'
                        : 'bg-[#F0F9F4]'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {interp.urgency === 'high' ? (
                          <TrendingUp size={12} className="text-[#FF6B35]" />
                        ) : (
                          <Wallet size={12} className="text-[#00D68F]" />
                        )}
                        <span className={`text-[10px] font-black ${interp.urgency === 'high' ? 'text-[#FF6B35]' : 'text-[#00D68F]'}`}>
                          {interp.urgency === 'high' ? '可能影响你' : '跟你有关'}
                        </span>
                      </div>
                      <p className={`text-xs font-black leading-snug ${interp.urgency === 'high' ? 'text-[#CC4400]' : 'text-[#2D6A4F]'}`}>
                        {interp.impactOnYou}
                      </p>
                    </div>

                    <p className="text-[11px] text-gray-500 leading-relaxed mb-1.5">
                      {interp.whatChanged}
                    </p>

                    <div className="flex items-center gap-1.5">
                      <ArrowRight size={10} className="text-[#1A1A2E] flex-shrink-0" />
                      <p className="text-[10px] text-[#1A1A2E] font-bold">
                        {interp.whatToDo}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-800 text-base font-bold">政策分类</h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {policyCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate('/policies')}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl bg-white transition-all duration-200 active:scale-95 shadow-sm"
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="text-[10px] font-bold text-gray-600">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <SavingsRank />

      <div className="mt-4 px-4 pb-24">
        <div
          className="bg-gradient-to-br from-[#2B7A9B] to-[#1A5276] rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => navigate('/policies')}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-sm mb-1">全部政策一览</h3>
              <p className="text-gray-300 text-xs">共 {policies.length} 条政策 · 按画像筛选</p>
            </div>
            <ChevronRight size={20} className="text-white/50" />
          </div>
        </div>
      </div>
    </div>
  )
}
