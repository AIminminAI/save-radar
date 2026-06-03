import { useState, useRef, useEffect } from 'react'
import { Search, ExternalLink, Calendar, Building2, RefreshCw, ArrowRight, Filter, X, Users, TrendingDown, TrendingUp, Wallet, Sparkles, Zap, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLivePolicies } from '@/hooks/useApi'
import { ScrapedCoupon } from '@/data/types'
import { useAppStore } from '@/store/useAppStore'
import { getPersona, personas, Persona } from '@/data/personas'
import { filterPoliciesForPersona, sortPoliciesByRelevance, interpretPolicy } from '@/utils/policyInterpreter'

const CATEGORY_META: Record<string, { name: string; icon: string; color: string }> = {
  'gov-policy': { name: '国家政策', icon: '📋', color: '#1A1A2E' },
  'medical': { name: '看病报销', icon: '🏥', color: '#FF6B35' },
  'tax': { name: '交税扣税', icon: '💰', color: '#E4393C' },
  'social-insurance': { name: '社保公积金', icon: '🛡️', color: '#2B7A9B' },
  'housing': { name: '买房租房', icon: '🏠', color: '#00D68F' },
  'pension': { name: '养老金', icon: '👴', color: '#8B5CF6' },
}

const PERSONA_BG: Record<string, string> = {
  'office-worker': 'from-[#1A1A2E] to-[#2D3561]',
  'parent': 'from-[#FF6B9D] to-[#C44569]',
  'student': 'from-[#4ECDC4] to-[#2C7873]',
  'elderly': 'from-[#F9A825] to-[#E65100]',
  'freelancer': 'from-[#7C4DFF] to-[#4A148C]',
}

export default function Policies() {
  const { selectedPersona } = useAppStore()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [usePersonaFilter, setUsePersonaFilter] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [speedReadMode, setSpeedReadMode] = useState(false)
  const [swipedCount, setSwipedCount] = useState(0)
  const [showShareUnlock, setShowShareUnlock] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { policies, loading, error, lastUpdate, refetch } = useLivePolicies(
    activeCategory === 'all' ? undefined : activeCategory
  )

  const persona = getPersona(selectedPersona)

  let displayPolicies = activeCategory === 'all' ? policies : policies.filter(p => p.category === activeCategory)

  if (usePersonaFilter) {
    displayPolicies = filterPoliciesForPersona(displayPolicies, persona)
    displayPolicies = sortPoliciesByRelevance(displayPolicies, persona)
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    displayPolicies = displayPolicies.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.source.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    )
  }

  const toggleExpand = (id: string) => {
    if (expandedId !== id) {
      useAppStore.getState().addRecentlyViewed(id)
    }
    setExpandedId(expandedId === id ? null : id)
  }

  const allCategories = [
    { id: 'all', name: '全部', icon: '📰', color: '#1A1A2E' },
    ...Object.entries(CATEGORY_META).map(([id, meta]) => ({ id, ...meta })),
  ]

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div
            className="relative w-[280px] bg-white h-full shadow-2xl overflow-y-auto"
            style={{ animation: 'slideInLeft 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] p-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#FFD700]" />
                  <h2 className="text-base font-black text-white">你是谁？</h2>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X size={14} className="text-white/70" />
                </button>
              </div>
              <p className="text-[11px] text-white/50">选一个最像你的，只看跟你有关的 ✨</p>
            </div>

            <div className="p-3 space-y-2">
              <button
                onClick={() => {
                  setUsePersonaFilter(false)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 ${
                  !usePersonaFilter
                    ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl">📰</span>
                <div className="text-left">
                  <p className={`text-xs font-black ${!usePersonaFilter ? 'text-white' : 'text-gray-800'}`}>
                    我全都要看
                  </p>
                  <p className={`text-[10px] ${!usePersonaFilter ? 'text-white/70' : 'text-gray-400'}`}>
                    不挑食，全部 {policies.length} 条政策
                  </p>
                </div>
              </button>

              <div className="pt-1 pb-0.5">
                <p className="text-[10px] text-gray-300 font-bold px-1">👇 选一个最像你的</p>
              </div>

              {personas.map((p) => {
                const isActive = usePersonaFilter && selectedPersona === p.id
                const matchedCount = filterPoliciesForPersona(policies, p).length
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      useAppStore.getState().setSelectedPersona(p.id)
                      setUsePersonaFilter(true)
                      setSidebarOpen(false)
                    }}
                    className={`w-full text-left rounded-2xl transition-all duration-300 overflow-hidden ${
                      isActive
                        ? 'shadow-lg scale-[1.02]'
                        : 'hover:scale-[1.01]'
                    }`}
                    style={isActive ? { boxShadow: '0 8px 24px rgba(0,0,0,0.15)' } : {}}
                  >
                    <div className={`bg-gradient-to-r ${PERSONA_BG[p.id] || 'from-gray-700 to-gray-900'} p-3 ${isActive ? '' : 'opacity-70'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-white">{p.name}</p>
                            {isActive && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white/90">
                                已选
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/60 truncate">{p.catchphrase}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-black text-white">{matchedCount}</p>
                          <p className="text-[9px] text-white/50">条相关</p>
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <div className="bg-white px-3 py-2 border-t border-white/10">
                        <p className="text-[10px] text-gray-400 mb-1.5">
                          🎯 {p.scene}，这些政策跟你有关
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {p.concernAreas.slice(0, 3).map((area) => (
                            <span
                              key={area}
                              className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="p-4 mt-2">
              <p className="text-[10px] text-gray-300 text-center">选完就能看到专属你的政策解读 ✨</p>
            </div>

            {/* Speed read mode toggle in sidebar */}
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setSpeedReadMode(!speedReadMode)
                  setSwipedCount(0)
                  setShowShareUnlock(false)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 ${
                  speedReadMode
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#E4393C] text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Zap size={18} className={speedReadMode ? 'text-yellow-300' : 'text-gray-400'} />
                <div className="text-left">
                  <p className={`text-xs font-black ${speedReadMode ? 'text-white' : 'text-gray-800'}`}>
                    速读模式
                  </p>
                  <p className={`text-[10px] ${speedReadMode ? 'text-white/70' : 'text-gray-400'}`}>
                    像刷抖音一样看政策
                  </p>
                </div>
                <div className={`ml-auto w-8 h-5 rounded-full transition-all duration-200 flex items-center ${
                  speedReadMode ? 'bg-white/30 justify-end' : 'bg-gray-300 justify-start'
                }`}>
                  <div className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    speedReadMode ? 'bg-white mr-0.5' : 'bg-white ml-0.5'
                  }`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`p-2 rounded-xl text-white active:scale-95 transition-transform bg-gradient-to-r ${PERSONA_BG[selectedPersona] || 'from-[#1A1A2E] to-[#2D3561]'} shadow-md`}
              >
                <Users size={16} />
              </button>
              <div>
                <h1 className="text-xl font-black text-gray-900">民生政策雷达</h1>
                <p className="text-gray-400 text-xs mt-0.5">
                  {loading ? '正在获取...' : `${usePersonaFilter ? persona.icon + ' ' + persona.name + ' · ' : ''}${displayPolicies.length} 条跟你有关`}
                  {lastUpdate && <span className="ml-1 text-[#00D68F]">· 已更新</span>}
                </p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-full bg-gray-100 active:scale-95 transition-transform"
              disabled={loading}
            >
              <RefreshCw size={16} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索政策关键词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#00D68F]/20 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                useAppStore.getState().setSelectedPersona(p.id)
                setUsePersonaFilter(true)
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 ${
                usePersonaFilter && selectedPersona === p.id
                  ? 'bg-[#1A1A2E] text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {p.icon} {p.name}
            </button>
          ))}
          <button
            onClick={() => setUsePersonaFilter(!usePersonaFilter)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 flex items-center gap-1 ${
              !usePersonaFilter
                ? 'bg-[#FF6B35] text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <Filter size={10} />
            全部
          </button>
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
              style={activeCategory === cat.id ? { backgroundColor: cat.color } : {}}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
          <button
            onClick={() => {
              setSpeedReadMode(!speedReadMode)
              setSwipedCount(0)
              setShowShareUnlock(false)
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1 ${
              speedReadMode
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#E4393C] text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <Zap size={10} />
            速读
          </button>
        </div>
      </div>

      {usePersonaFilter && displayPolicies.length > 0 && (
        <div className="mx-4 mt-2 mb-1">
          <div className={`bg-gradient-to-r ${PERSONA_BG[selectedPersona] || 'from-[#1A1A2E] to-[#2D3561]'} rounded-xl px-3 py-2 flex items-center gap-2`}>
            <span className="text-lg">{persona.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/80 truncate">{persona.catchphrase}</p>
            </div>
            <span className="text-[10px] text-white/50 flex-shrink-0">{displayPolicies.length}条</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-red-500 text-xs">{error}</p>
          <button onClick={() => refetch()} className="text-red-600 text-xs font-bold mt-1">重试</button>
        </div>
      )}

      <div className="px-4 pt-2 pb-24 space-y-3">
        {loading && policies.length === 0 ? (
          <div className="text-center py-16">
            <RefreshCw size={32} className="text-gray-300 mx-auto mb-3 animate-spin" />
            <p className="text-gray-400 text-sm">正在从政府网站获取最新政策...</p>
            <p className="text-gray-300 text-xs mt-1">数据来源于gov.cn、医保局、税务总局等官方源</p>
          </div>
        ) : displayPolicies.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">
              {searchQuery ? '暂无匹配的政策信息' : usePersonaFilter ? '暂无与你相关的政策' : '暂无政策数据'}
            </p>
            <p className="text-gray-300 text-xs mt-1">
              {searchQuery ? '试试其他关键词' : usePersonaFilter ? '试试切换画像或点击"全部"查看' : '请等待后端抓取任务执行'}
            </p>
          </div>
        ) : speedReadMode ? (
          <SpeedReadList
            policies={displayPolicies}
            persona={persona}
            swipedCount={swipedCount}
            setSwipedCount={setSwipedCount}
            showShareUnlock={showShareUnlock}
            setShowShareUnlock={setShowShareUnlock}
            scrollContainerRef={scrollContainerRef}
          />
        ) : (
          displayPolicies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              persona={persona}
              isExpanded={expandedId === policy.id}
              onToggle={() => toggleExpand(policy.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function PolicyCard({
  policy,
  persona,
  isExpanded,
  onToggle,
}: {
  policy: ScrapedCoupon
  persona: Persona
  isExpanded: boolean
  onToggle: () => void
}) {
  const cat = CATEGORY_META[policy.category] || { name: policy.category, icon: '📄', color: '#666' }
  const interp = interpretPolicy(policy, persona)
  const scrapedTime = policy.scrapedAt
    ? new Date(policy.scrapedAt).toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  const isPositive = interp.impactOnYou.includes('多拿') || interp.impactOnYou.includes('少交') || interp.impactOnYou.includes('降低') || interp.impactOnYou.includes('提高') || interp.impactOnYou.includes('更便宜') || interp.impactOnYou.includes('更方便')
  const isNegative = interp.impactOnYou.includes('多扣') || interp.impactOnYou.includes('多交') || interp.impactOnYou.includes('增加')

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50 transition-all duration-300"
      style={{ animation: 'fadeInUp 0.4s ease-out both' }}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: cat.color }}
          >
            {cat.icon} {cat.name}
          </span>
          {policy.isNew && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00D68F] text-white">新</span>
          )}
          <span className="text-[10px] text-gray-300 ml-auto">{policy.source}</span>
        </div>

        <div className={`rounded-xl p-3 mb-3 ${
          interp.urgency === 'high'
            ? 'bg-gradient-to-r from-[#FFF5F0] to-[#FFF0E8] border border-[#FF6B35]/15'
            : 'bg-[#F0F9F4] border border-[#00D68F]/10'
        }`}>
          <div className="flex items-center gap-2 mb-1.5">
            {interp.urgency === 'high' ? (
              <div className="flex items-center gap-1">
                <TrendingUp size={14} className="text-[#FF6B35]" />
                <span className="text-[11px] font-black text-[#FF6B35]">可能影响你</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Wallet size={14} className="text-[#00D68F]" />
                <span className="text-[11px] font-black text-[#00D68F]">跟你有关</span>
              </div>
            )}
            {isPositive && <TrendingUp size={12} className="text-[#00D68F]" />}
            {isNegative && <TrendingDown size={12} className="text-[#E4393C]" />}
          </div>
          <p className={`text-sm font-black leading-snug ${
            interp.urgency === 'high' ? 'text-[#CC4400]' : 'text-[#2D6A4F]'
          }`}>
            {interp.impactOnYou}
          </p>
          {interp.moneyImpact && !interp.moneyImpact.startsWith('待确认') && (
            <p className="text-[11px] text-[#FF6B35] font-bold mt-1 flex items-center gap-1">
              <Wallet size={10} />
              {interp.moneyImpact}
            </p>
          )}
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-2">
          {interp.whatChanged}
        </p>

        <h3
          className="text-[11px] text-gray-400 leading-snug mb-2 cursor-pointer hover:text-[#FF6B35] transition-colors line-clamp-2"
          onClick={onToggle}
        >
          政策原文：{interp.plainTitle}
        </h3>

        <div className="flex items-center gap-1.5 bg-[#1A1A2E]/5 rounded-lg px-2.5 py-2">
          <ArrowRight size={12} className="text-[#1A1A2E] flex-shrink-0" />
          <p className="text-[11px] text-[#1A1A2E] font-bold flex-1">
            {interp.whatToDo}
          </p>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <p className="text-[10px] text-gray-500 font-bold mb-1">政策原文标题</p>
              <p className="text-xs text-gray-700 leading-relaxed">{policy.title}</p>
            </div>

            {policy.guide.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-3 mb-3">
                <p className="text-[10px] text-blue-600 font-bold mb-1.5">操作指南</p>
                <div className="space-y-1.5">
                  {policy.guide.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="text-xs text-blue-700 leading-relaxed pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-gray-400 text-[10px] mb-3">
              <div className="flex items-center gap-1">
                <Building2 size={12} />
                <span>{policy.source}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{scrapedTime} 抓取</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {policy.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${cat.color}10`, color: cat.color }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            <a
              href={policy.claimUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)` }}
            >
              <ExternalLink size={14} />
              查看政策原文
            </a>
          </div>
        )}

        {!isExpanded && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-gray-400 text-[10px]">
              <Calendar size={10} />
              {scrapedTime && <span>{scrapedTime}</span>}
            </div>
            <button
              onClick={onToggle}
              className="text-[10px] font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              展开详情
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SpeedReadList({
  policies,
  persona,
  swipedCount,
  setSwipedCount,
  showShareUnlock,
  setShowShareUnlock,
  scrollContainerRef,
}: {
  policies: ScrapedCoupon[]
  persona: Persona
  swipedCount: number
  setSwipedCount: (n: number) => void
  showShareUnlock: boolean
  setShowShareUnlock: (b: boolean) => void
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartY = useRef(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<'up' | 'down'>('up')

  const handleShare = () => {
    const text = '我在省钱雷达速读了最新政策，快来看看跟你有关的政策解读！'
    if (navigator.share) {
      navigator.share({ title: '省钱雷达', text }).catch(() => { /* ignore */ })
    } else {
      navigator.clipboard.writeText(text).catch(() => { /* ignore */ })
    }
    useAppStore.getState().incrementShareCount()
    setShowShareUnlock(false)
  }

  const goToNext = () => {
    if (isAnimating || currentIndex >= policies.length - 1) return
    setIsAnimating(true)
    setDirection('up')

    const newCount = swipedCount + 1
    setSwipedCount(newCount)
    if (newCount >= 5 && !showShareUnlock) {
      setShowShareUnlock(true)
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setIsAnimating(false)
    }, 200)
  }

  const goToPrev = () => {
    if (isAnimating || currentIndex <= 0) return
    setIsAnimating(true)
    setDirection('down')
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1)
      setIsAnimating(false)
    }, 200)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext()
      else goToPrev()
    }
  }

  const policy = policies[currentIndex]
  if (!policy) return null

  const interp = interpretPolicy(policy, persona)
  const cat = CATEGORY_META[policy.category] || { name: policy.category, icon: '📄', color: '#666' }

  return (
    <div className="-mx-4">
      {/* Progress bar */}
      <div className="px-4 mb-2">
        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
          <span>{currentIndex + 1} / {policies.length}</span>
          <span>上下滑动切换 · 已刷 {swipedCount} 条</span>
        </div>
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF6B35] to-[#E4393C] rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / policies.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Swipeable card */}
      <div
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="px-4"
        style={{ minHeight: 'calc(100vh - 300px)' }}
      >
        <div
          className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50 transition-all duration-200 ${
            isAnimating
              ? direction === 'up'
                ? 'opacity-0 -translate-y-4'
                : 'opacity-0 translate-y-4'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="p-4">
            {/* Category tag */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: cat.color }}
              >
                {cat.icon} {cat.name}
              </span>
              {policy.isNew && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00D68F] text-white">新</span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm font-black text-gray-800 leading-snug mb-3">
              {interp.plainTitle}
            </h3>

            {/* Impact - the key info */}
            <div className={`rounded-xl p-3 mb-3 ${
              interp.urgency === 'high'
                ? 'bg-gradient-to-r from-[#FFF5F0] to-[#FFF0E8] border border-[#FF6B35]/15'
                : 'bg-[#F0F9F4] border border-[#00D68F]/10'
            }`}>
              <p className={`text-sm font-black leading-snug ${
                interp.urgency === 'high' ? 'text-[#CC4400]' : 'text-[#2D6A4F]'
              }`}>
                {interp.impactOnYou}
              </p>
              {interp.moneyImpact && !interp.moneyImpact.startsWith('待确认') && (
                <p className="text-[11px] text-[#FF6B35] font-bold mt-1">
                  💰 {interp.moneyImpact}
                </p>
              )}
            </div>

            {/* What to do */}
            <div className="flex items-center gap-1.5 bg-[#1A1A2E]/5 rounded-lg px-2.5 py-2">
              <ArrowRight size={12} className="text-[#1A1A2E] flex-shrink-0" />
              <p className="text-[11px] text-[#1A1A2E] font-bold flex-1">
                {interp.whatToDo}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-center gap-6 mt-4 px-4">
        <button
          onClick={goToPrev}
          disabled={currentIndex <= 0}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            currentIndex <= 0
              ? 'bg-gray-100 text-gray-300'
              : 'bg-gray-200 text-gray-600 active:scale-90'
          }`}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-[10px] text-gray-400">
          {currentIndex + 1}/{policies.length}
        </div>
        <button
          onClick={goToNext}
          disabled={currentIndex >= policies.length - 1}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            currentIndex >= policies.length - 1
              ? 'bg-gray-100 text-gray-300'
              : 'bg-gradient-to-r from-[#FF6B35] to-[#E4393C] text-white active:scale-90 shadow-md'
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Share unlock modal */}
      {showShareUnlock && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ animation: 'fadeInUp 0.3s ease-out' }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowShareUnlock(false)} />
          <div className="relative w-full max-w-[480px] bg-white rounded-t-2xl p-5 pb-8">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="text-center mb-4">
              <span className="text-4xl">🔥</span>
              <h3 className="text-lg font-black text-gray-800 mt-2">已速读5条政策！</h3>
              <p className="text-sm text-gray-500 mt-1">分享给朋友，解锁更多政策速读</p>
            </div>
            <button
              onClick={handleShare}
              className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#E4393C] text-white rounded-xl text-sm font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Share2 size={16} />
              分享解锁更多
            </button>
            <button
              onClick={() => setShowShareUnlock(false)}
              className="w-full py-2.5 text-gray-400 text-xs font-bold mt-2"
            >
              稍后再说
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
