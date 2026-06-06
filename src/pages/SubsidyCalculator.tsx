import { useState, useMemo } from 'react'
import { Calculator as CalcIcon, Wallet, TrendingUp, Lock, ChevronRight, ArrowRight, RefreshCw } from 'lucide-react'
import { useLivePolicies } from '@/hooks/useApi'
import { getPersona } from '@/data/personas'
import { filterPoliciesForPersona, sortPoliciesByRelevance, interpretPolicy } from '@/utils/policyInterpreter'
import { ScrapedCoupon } from '@/data/types'
import { requestPayment, PRODUCTS, isSubsidyUnlocked } from '@/services/paymentService'
import { showInterstitialAd } from '@/services/adService'
import { BannerAd } from '@/components/BannerAd'
import {
  getSubscriptionConfig,
  saveSubscriptionConfig,
  requestBrowserNotification,
  getMatchedPolicyCount,
  isWeChatBrowser,
  type SubscriptionConfig
} from '@/services/subscriptionService'

const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '西安', '其他']

const EDUCATION_LEVELS = ['高中及以下', '大专', '本科', '硕士', '博士']

const EMPLOYMENT_STATUSES = ['在校学生', '应届毕业生', '在职', '自由职业', '退休']

const INCOME_RANGES = ['5万以下', '5-10万', '10-20万', '20万以上']

const FREE_RESULT_LIMIT = 3

interface MatchedPolicy {
  policy: ScrapedCoupon
  estimatedAmount: string
  urgency: 'high' | 'medium' | 'low'
  whatToDo: string
  impactOnYou: string
  whatChanged: string
}

function mapEmploymentToPersona(status: string): string {
  switch (status) {
    case '在校学生':
    case '应届毕业生':
      return 'student'
    case '在职':
      return 'office-worker'
    case '自由职业':
      return 'freelancer'
    case '退休':
      return 'elderly'
    default:
      return 'office-worker'
  }
}

function extractEstimatedAmount(moneyImpact: string, title: string): string {
  // Try to parse numbers from moneyImpact text
  // Patterns: "每月可能多拿200-500元", "200-500元/月", "可能多拿300元", etc.
  const combined = `${moneyImpact} ${title}`

  // Match patterns like "200-500元", "300元", "2000元/年"
  const rangeMatch = combined.match(/(\d+)[-~—](\d+)\s*元/)
  if (rangeMatch) {
    const period = combined.includes('每月') || combined.includes('/月') ? '/月' : combined.includes('每年') || combined.includes('/年') ? '/年' : ''
    return `${rangeMatch[1]}-${rangeMatch[2]}元${period}`
  }

  const singleMatch = combined.match(/(\d+)\s*元/)
  if (singleMatch) {
    const period = combined.includes('每月') || combined.includes('/月') ? '/月' : combined.includes('每年') || combined.includes('/年') ? '/年' : ''
    return `${singleMatch[1]}元${period}`
  }

  // Fallback: return the moneyImpact text or a generic label
  return moneyImpact || '待确认'
}

function matchPolicies(
  policies: ScrapedCoupon[],
  employmentStatus: string,
  _education: string,
  _city: string,
  _income: string
): MatchedPolicy[] {
  const personaId = mapEmploymentToPersona(employmentStatus)
  const persona = getPersona(personaId)

  const filtered = filterPoliciesForPersona(policies, persona)
  const sorted = sortPoliciesByRelevance(filtered, persona)

  return sorted.map((policy) => {
    const interp = interpretPolicy(policy, persona)
    return {
      policy,
      estimatedAmount: extractEstimatedAmount(interp.moneyImpact, policy.title),
      urgency: interp.urgency,
      whatToDo: interp.whatToDo,
      impactOnYou: interp.impactOnYou,
      whatChanged: interp.whatChanged,
    }
  })
}

export default function SubsidyCalculator() {
  const { policies, loading: policiesLoading, error: policiesError, refetch: refetchPolicies } = useLivePolicies()
  const [city, setCity] = useState('北京')
  const [education, setEducation] = useState('')
  const [employment, setEmployment] = useState('')
  const [income, setIncome] = useState('')
  const [calculated, setCalculated] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(isSubsidyUnlocked())
  const [payLoading, setPayLoading] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionConfig>(getSubscriptionConfig())

  const results = useMemo(() => {
    if (!calculated || !employment) return []
    return matchPolicies(policies, employment, education, city, income)
  }, [policies, employment, education, city, income, calculated])

  const canCalculate = employment !== ''

  const handleCalculate = () => {
    if (!canCalculate) return
    setCalculated(true)
    // 计算完成后展示插屏广告
    setTimeout(() => showInterstitialAd(), 500)
  }

  const handleUnlock = async () => {
    setPayLoading(true)
    try {
      const result = await requestPayment(PRODUCTS.SUBSIDY_FULL)
      if (result.success) {
        setIsUnlocked(true)
      } else {
        alert(result.errorMsg || '支付失败，请重试')
      }
    } catch {
      alert('支付出错，请重试')
    } finally {
      setPayLoading(false)
    }
  }

  const handleSubscribe = async () => {
    saveSubscriptionConfig({
      city,
      education,
      employment,
    })

    const success = await requestBrowserNotification()
    if (success) {
      setSubscription(getSubscriptionConfig())
    } else if (isWeChatBrowser()) {
      alert('请在微信中关注我们的公众号以接收推送')
    } else {
      alert('请允许浏览器通知以接收政策推送')
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/20 flex items-center justify-center">
            <CalcIcon size={20} className="text-[#FF6B35]" />
          </div>
          <div>
            <h1 className="text-white text-xl font-black">补贴计算器</h1>
            <p className="text-gray-400 text-xs">输入条件，估算你能拿的补贴</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          {/* City Selector */}
          <label className="text-gray-400 text-xs mb-2 block">所在城市</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 bg-white/10 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-[#FF6B35]/40 transition-all appearance-none cursor-pointer"
          >
            {CITIES.map((c) => (
              <option key={c} value={c} className="bg-[#1A1A2E] text-white">
                {c}
              </option>
            ))}
          </select>

          {/* Education Level */}
          <label className="text-gray-400 text-xs mb-2 block">学历</label>
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {EDUCATION_LEVELS.map((e) => (
              <button
                key={e}
                onClick={() => setEducation(e)}
                className={`py-2 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                  education === e
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-white/10 text-white/60 hover:bg-white/15'
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Employment Status */}
          <label className="text-gray-400 text-xs mb-2 block">就业状态</label>
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {EMPLOYMENT_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setEmployment(s)}
                className={`py-2 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                  employment === s
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-white/10 text-white/60 hover:bg-white/15'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Income Range */}
          <label className="text-gray-400 text-xs mb-2 block">年收入范围</label>
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {INCOME_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setIncome(r)}
                className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  income === r
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-white/10 text-white/60 hover:bg-white/15'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            disabled={!canCalculate}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] text-white font-bold text-sm shadow-lg shadow-[#FF6B35]/30 transition-all duration-200 hover:shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            <span className="flex items-center justify-center gap-2">
              <Wallet size={16} />
              开始估算
            </span>
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="px-4 -mt-4 pb-24">
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
        ) : policiesLoading ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <RefreshCw size={28} className="text-gray-300 mx-auto mb-3 animate-spin" />
            <p className="text-gray-400 text-sm">正在加载政策数据...</p>
          </div>
        ) : calculated ? (
          <>
            {/* Summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-[#00D68F]" />
                <span className="text-sm font-black text-gray-800">估算结果</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                根据您的条件，预计可享受{' '}
                <span className="text-[#00D68F] font-black text-base">{results.length}</span>{' '}
                项政策扶持
              </p>
            </div>

            {/* Policy Results */}
            {results.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Wallet size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm">暂无匹配的政策</p>
                <p className="text-gray-300 text-xs mt-1">试试调整就业状态或其他条件</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.slice(0, isUnlocked ? undefined : FREE_RESULT_LIMIT).map((item) => (
                  <div
                    key={item.policy.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50"
                  >
                    <div className="p-4">
                      {/* Title & Source */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-gray-400 font-bold">{item.policy.source}</span>
                        {item.policy.region && (
                          <>
                            <span className="text-[10px] text-gray-300">·</span>
                            <span className="text-[10px] text-gray-300">{item.policy.region}</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-gray-800 leading-snug mb-2">
                        {item.policy.title.length > 28 ? item.policy.title.slice(0, 28) + '...' : item.policy.title}
                      </h3>

                      {/* Estimated Amount */}
                      <div className={`rounded-xl p-2.5 mb-2 ${
                        item.urgency === 'high'
                          ? 'bg-gradient-to-r from-[#FFF5F0] to-[#FFF0E8]'
                          : 'bg-[#F0F9F4]'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          {item.urgency === 'high' ? (
                            <TrendingUp size={12} className="text-[#FF6B35]" />
                          ) : (
                            <Wallet size={12} className="text-[#00D68F]" />
                          )}
                          <span className={`text-[10px] font-black ${
                            item.urgency === 'high' ? 'text-[#FF6B35]' : 'text-[#00D68F]'
                          }`}>
                            {item.urgency === 'high' ? '可能影响你' : '跟你有关'}
                          </span>
                        </div>
                        <p className={`text-xs font-black leading-snug ${
                          item.urgency === 'high' ? 'text-[#CC4400]' : 'text-[#2D6A4F]'
                        }`}>
                          {item.impactOnYou}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-gray-400">预估金额：</span>
                          <span className="text-sm font-black text-[#00D68F]">{item.estimatedAmount}</span>
                        </div>
                      </div>

                      {/* What Changed */}
                      <p className="text-[11px] text-gray-500 leading-relaxed mb-1.5">
                        {item.whatChanged}
                      </p>

                      {/* What To Do */}
                      <div className="flex items-center gap-1.5">
                        <ArrowRight size={10} className="text-[#1A1A2E] flex-shrink-0" />
                        <p className="text-[10px] text-[#1A1A2E] font-bold">
                          {item.whatToDo}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Unlock More */}
                {!isUnlocked && results.length > FREE_RESULT_LIMIT && (
                  <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-2xl p-5 text-center">
                    <Lock size={24} className="text-[#FF6B35] mx-auto mb-2" />
                    <p className="text-white font-bold text-sm mb-1">解锁全部 {results.length} 条匹配结果</p>
                    <p className="text-gray-400 text-xs mb-3">9.9元查看全部补贴匹配结果及申请指南</p>
                    <button
                      onClick={handleUnlock}
                      disabled={payLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] text-white font-bold text-sm active:scale-95 transition-transform disabled:opacity-60"
                    >
                      {payLoading ? '支付中...' : '立即解锁 · ¥9.9'}
                    </button>
                    <p className="text-gray-500 text-[10px] mt-2">
                      支付即表示同意《用户协议》和《隐私政策》
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Subscription Prompt */}
            {results.length > 0 && !subscription.subscribed && (
              <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-2xl p-5 text-center mt-4">
                <span className="text-2xl">🔔</span>
                <p className="text-white font-bold text-sm mt-2 mb-1">不想错过新补贴？</p>
                <p className="text-gray-400 text-xs mb-3">
                  开启推送，有新政策自动提醒你 · 预计{getMatchedPolicyCount(policies || [], mapEmploymentToPersona(employment))}条政策与你有关
                </p>
                <button
                  onClick={handleSubscribe}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] text-white font-bold text-sm active:scale-95 transition-transform"
                >
                  开启政策推送
                </button>
                <p className="text-gray-500 text-[10px] mt-2">可随时关闭，不会打扰你</p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-4 space-y-1">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                以上估算基于政策标题匹配，实际补贴金额以当地政策为准。建议咨询当地人社部门确认。
              </p>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                数据来源：政府官方网站 · 每日自动更新
              </p>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Wallet size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">选择就业状态后</p>
            <p className="text-gray-400 text-sm">点击估算查看可享受的补贴政策</p>
          </div>
        )}
      </div>

      <BannerAd />
    </div>
  )
}
