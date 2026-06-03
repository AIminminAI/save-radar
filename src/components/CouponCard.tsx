import { Clock, Heart, ChevronRight } from 'lucide-react'
import { ScrapedCoupon, getCarrier } from '@/data/types'
import { useAppStore } from '@/store/useAppStore'

interface CouponCardProps {
  coupon: ScrapedCoupon
  index?: number
  compact?: boolean
}

export default function CouponCard({ coupon, index = 0, compact = false }: CouponCardProps) {
  const carrier = getCarrier(coupon.carrier)
  const { toggleFavorite, isFavorite, setSelectedCoupon, setShowDetail } = useAppStore()
  const fav = isFavorite(coupon.id)

  const handleClick = () => {
    setSelectedCoupon(coupon)
    setShowDetail(true)
  }

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className="min-w-[200px] bg-white rounded-2xl p-3.5 shadow-sm border border-gray-50 cursor-pointer hover:shadow-md transition-all duration-300 active:scale-[0.98]"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: carrier.color }}
          >
            {carrier.shortName}
          </span>
          {coupon.isNew && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00D68F] text-white">
              新
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-gray-800 leading-tight line-clamp-2 mb-2">
          {coupon.title}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-[#FF6B35] text-xl font-black">¥{coupon.discountAmount}</span>
          <span className="text-gray-400 text-[10px]">优惠</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50 hover:shadow-md transition-all duration-300 active:scale-[0.99]"
      style={{ animation: `fadeInUp 0.4s ease-out ${index * 60}ms both` }}
    >
      <div className="flex">
        <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: carrier.color }} />

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: carrier.color }}
              >
                {carrier.shortName}
              </span>
              {coupon.isHot && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B35] text-white">
                  热门
                </span>
              )}
              {coupon.isNew && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00D68F] text-white">
                  新
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(coupon.id)
              }}
              className="p-1 -mr-1"
            >
              <Heart
                size={16}
                className={`transition-colors duration-200 ${fav ? 'text-[#FF6B35] fill-[#FF6B35]' : 'text-gray-300'}`}
              />
            </button>
          </div>

          <h3
            className="text-sm font-bold text-gray-800 leading-snug mb-2 cursor-pointer hover:text-[#FF6B35] transition-colors"
            onClick={handleClick}
          >
            {coupon.title}
          </h3>

          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex items-baseline gap-1">
              <span className="text-[#FF6B35] text-xl font-black">¥{coupon.discountAmount}</span>
              <span className="text-gray-400 text-[10px]">优惠</span>
            </div>
            {coupon.discountRate && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0E6] text-[#FF6B35]">
                {coupon.discountRate}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-gray-400">
              <Clock size={12} />
              <span className="text-[10px]">{coupon.expirationDate} 到期</span>
            </div>

            <button
              onClick={handleClick}
              className="flex items-center gap-0.5 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all duration-200 hover:shadow-md active:scale-95"
              style={{ background: `linear-gradient(135deg, ${carrier.color}, ${carrier.color}dd)` }}
            >
              去领取
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
