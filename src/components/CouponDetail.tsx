import { useState } from 'react'
import { X, ExternalLink, Clock, MapPin, ShoppingBag, Share2, Lock, Sparkles, Bot, PlayCircle } from 'lucide-react'
import { ScrapedCoupon, getCarrier } from '@/data/types'
import { useAppStore } from '@/store/useAppStore'
import { affiliateLinks } from '@/config/affiliate'
import { useAccessControl } from '@/hooks/useAccessControl'
import { interpretPolicy } from '@/utils/policyInterpreter'
import { getPersona } from '@/data/personas'
import ShareCard from '@/components/ShareCard'
import SharePoster from '@/components/SharePoster'

export default function CouponDetail() {
  const { selectedCoupon, showDetail, setShowDetail, selectedPersona } = useAppStore()
  const { canViewFullInterpretation, getAccessStatus, unlockByAd, shareCount } = useAccessControl()
  const [showShareCard, setShowShareCard] = useState(false)
  const [adLoading, setAdLoading] = useState(false)

  if (!showDetail || !selectedCoupon) return null

  const coupon: ScrapedCoupon = selectedCoupon
  const carrier = getCarrier(coupon.carrier)
  const isPolicy = coupon.type === 'policy' || coupon.carrier === 'policy'
  const hasAIInterpretation = !!coupon.aiInterpretation
  const persona = getPersona(selectedPersona)
  const interp = isPolicy ? interpretPolicy(coupon, persona) : null

  const canView = canViewFullInterpretation(coupon.id)
  const accessStatus = getAccessStatus()

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setShowDetail(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[480px] bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-lg z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-800">{isPolicy ? '政策详情' : '优惠详情'}</h2>
            {isPolicy && (
              hasAIInterpretation ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00D68F]/15 text-[#00D68F] flex items-center gap-0.5">
                  <Bot size={10} />
                  AI解读
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 flex items-center gap-0.5">
                  <Sparkles size={10} />
                  自动推断
                </span>
              )
            )}
          </div>
          <button
            onClick={() => setShowDetail(false)}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: carrier.color }}
            >
              {isPolicy ? coupon.source : carrier.name}
            </span>
            {coupon.isHot && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FF6B35] text-white">热门</span>
            )}
            {coupon.isNew && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#00D68F] text-white">新上线</span>
            )}
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-4 leading-snug">
            {coupon.title}
          </h3>

          {isPolicy && interp && (
            <div className="mb-5">
              <div className={`rounded-2xl p-4 ${
                interp.urgency === 'high'
                  ? 'bg-gradient-to-r from-[#FFF5F0] to-[#FFF0E8] border border-[#FF6B35]/15'
                  : 'bg-[#F0F9F4] border border-[#00D68F]/10'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {hasAIInterpretation ? (
                    <span className="text-[11px] font-black text-[#00D68F] flex items-center gap-1">
                      <Bot size={14} />
                      AI解读
                    </span>
                  ) : (
                    <span className="text-[11px] font-black text-gray-400 flex items-center gap-1">
                      <Sparkles size={14} />
                      自动推断
                    </span>
                  )}
                </div>

                {canView ? (
                  <>
                    <p className={`text-sm font-black leading-snug mb-2 ${
                      interp.urgency === 'high' ? 'text-[#CC4400]' : 'text-[#2D6A4F]'
                    }`}>
                      {interp.impactOnYou}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">
                      {interp.whatChanged}
                    </p>
                    <div className="flex items-center gap-1.5 bg-white/60 rounded-lg px-2.5 py-2">
                      <span className="text-[11px] text-[#1A1A2E] font-bold">{interp.whatToDo}</span>
                    </div>
                    {interp.moneyImpact && !interp.moneyImpact.startsWith('待确认') && (
                      <p className="text-[11px] text-[#FF6B35] font-bold mt-2">
                        💰 {interp.moneyImpact}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-3">
                    <Lock size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-500 mb-1">{accessStatus.reason}</p>
                    <div className="flex flex-col gap-2 mt-3">
                      <button
                        onClick={async () => {
                          if (adLoading) return
                          setAdLoading(true)
                          const success = await unlockByAd()
                          setAdLoading(false)
                          if (success) {
                            // 广告成功后自动刷新显示解锁内容
                            setShowDetail(false)
                            setTimeout(() => setShowDetail(true), 50)
                          }
                        }}
                        disabled={adLoading}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] text-white text-sm font-bold active:scale-95 transition-transform disabled:opacity-60"
                      >
                        <PlayCircle size={16} />
                        {adLoading ? '加载中...' : '看广告解锁 · 30秒'}
                      </button>
                      <button
                        onClick={() => setShowShareCard(!showShareCard)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-[#FF6B35]/30 text-[#FF6B35] text-sm font-bold active:scale-95 transition-transform"
                      >
                        <Share2 size={14} />
                        分享解锁
                      </button>
                      <button
                        onClick={() => setShowDetail(false)}
                        className="text-gray-400 text-xs py-1"
                      >
                        明天再来
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 leading-relaxed">{interp.disclaimer}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[9px] text-gray-300">
                    <span>数据来源：{coupon.source}</span>
                    {coupon.scrapedAt && (
                      <span>· 更新于{new Date(coupon.scrapedAt).toLocaleDateString('zh-CN')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isPolicy && (
            <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-2xl p-5 mb-5">
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">优惠金额</p>
                <p className="text-[#00D68F] text-4xl font-black">
                  ¥{coupon.discountAmount}
                </p>
                {coupon.discountRate && (
                  <p className="text-[#FF6B35] text-sm font-bold mt-1">
                    {coupon.discountRate} 优惠
                  </p>
                )}
              </div>
              {coupon.originalPrice && coupon.discountPrice && (
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-gray-400 text-[10px]">原价</p>
                    <p className="text-gray-300 text-sm line-through">¥{coupon.originalPrice}</p>
                  </div>
                  <div className="text-[#00D68F] text-lg">→</div>
                  <div className="text-center">
                    <p className="text-gray-400 text-[10px]">优惠后</p>
                    <p className="text-[#00D68F] text-sm font-bold">¥{coupon.discountPrice}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isPolicy && (
            <div className="bg-gradient-to-r from-[#FF6B35]/10 to-[#FF8F5E]/10 rounded-2xl p-4 mb-5 border border-[#FF6B35]/20">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag size={14} className="text-[#FF6B35]" />
                <span className="text-xs font-bold text-[#FF6B35]">广告 · 充值优惠通道</span>
              </div>
              <p className="text-gray-600 text-xs mb-3">
                淘宝联盟: {affiliateLinks.taobao.description}
              </p>
              <div className="flex gap-2">
                <a
                  href={affiliateLinks.taobao.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] text-white text-xs font-bold active:scale-95 transition-transform"
                >
                  <ShoppingBag size={14} />
                  淘宝充值
                </a>
                <a
                  href={affiliateLinks.jd.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-[#E4393C] to-[#FF6B6B] text-white text-xs font-bold active:scale-95 transition-transform"
                >
                  <ShoppingBag size={14} />
                  京东充值
                </a>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mb-5 text-gray-500 text-xs">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{coupon.expirationDate} 到期</span>
            </div>
            {coupon.region && (
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>{coupon.region}</span>
              </div>
            )}
            {coupon.scrapedAt && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{new Date(coupon.scrapedAt).toLocaleString('zh-CN')} 抓取</span>
              </div>
            )}
          </div>

          <div className="mb-5">
            <h4 className="text-sm font-bold text-gray-800 mb-3">
              {isPolicy ? '政策指南' : '领取攻略'}
            </h4>
            <div className="space-y-2.5">
              {coupon.guide.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: isPolicy ? '#2B7A9B' : carrier.color }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600 leading-relaxed pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {coupon.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: carrier.bgColor, color: carrier.color }}
              >
                #{tag}
              </span>
            ))}
          </div>

          {isPolicy && (
            <div className="mb-4">
              {!canView ? (
                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      if (adLoading) return
                      setAdLoading(true)
                      const success = await unlockByAd()
                      setAdLoading(false)
                      if (success) {
                        setShowDetail(false)
                        setTimeout(() => setShowDetail(true), 50)
                      }
                    }}
                    disabled={adLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
                  >
                    <PlayCircle size={16} />
                    {adLoading ? '加载中...' : '看广告解锁 · 30秒'}
                  </button>
                  <button
                    onClick={() => setShowShareCard(!showShareCard)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-[#FF6B35]/30 text-[#FF6B35] font-bold text-sm transition-all active:scale-95"
                  >
                    <Share2 size={16} />
                    分享给朋友，解锁完整解读
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowShareCard(!showShareCard)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF8F5E] text-white font-bold text-sm transition-all active:scale-95"
                >
                  <Share2 size={16} />
                  分享给朋友，解锁完整解读
                </button>
              )}

              {showShareCard && (
                <div className="mt-3">
                  <ShareCard
                    policyTitle={coupon.title}
                    summary={interp?.impactOnYou || coupon.title}
                    policyId={coupon.id}
                  />
                  <div className="mt-3">
                    <SharePoster
                      policyTitle={coupon.title}
                      impactDesc={interp?.impactOnYou || '查看政策详情'}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <a
            href={coupon.claimUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${isPolicy ? '#2B7A9B' : carrier.color}, ${isPolicy ? '#1A5276' : carrier.color}cc)` }}
          >
            <ExternalLink size={16} />
            {isPolicy ? '查看政策原文' : '去运营商官方领取'}
          </a>
        </div>
      </div>
    </div>
  )
}
