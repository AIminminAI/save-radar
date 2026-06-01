import { X, ExternalLink, Clock, MapPin, ShoppingBag } from 'lucide-react'
import { ScrapedCoupon, getCarrier } from '@/data/mockCoupons'
import { useAppStore } from '@/store/useAppStore'
import { affiliateLinks } from '@/config/affiliate'

export default function CouponDetail() {
  const { selectedCoupon, showDetail, setShowDetail } = useAppStore()

  if (!showDetail || !selectedCoupon) return null

  const coupon: ScrapedCoupon = selectedCoupon
  const carrier = getCarrier(coupon.carrier)
  const isPolicy = coupon.type === 'policy' || coupon.carrier === 'policy'

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setShowDetail(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[480px] bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-lg z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">{isPolicy ? '政策详情' : '优惠详情'}</h2>
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
                <span className="text-xs font-bold text-[#FF6B35]">充值优惠通道</span>
              </div>
              <p className="text-gray-600 text-xs mb-3">
                淘宝联盟: {affiliateLinks.taobao.description}，到手价仅 {affiliateLinks.taobao.price}
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
