import { useState } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import CarrierFilter from '@/components/CarrierFilter'
import CouponCard from '@/components/CouponCard'
import CouponDetail from '@/components/CouponDetail'
import { useLiveCoupons } from '@/hooks/useApi'
import { useAppStore } from '@/store/useAppStore'

export default function Coupons() {
  const { selectedCarrier } = useAppStore()
  const { coupons, loading, error, lastUpdate, refetch } = useLiveCoupons(
    selectedCarrier === 'all' ? undefined : selectedCarrier
  )
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCoupons = coupons.filter(coupon => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      coupon.title.toLowerCase().includes(q) ||
      coupon.carrierName.toLowerCase().includes(q) ||
      coupon.category.toLowerCase().includes(q) ||
      coupon.tags.some(tag => tag.toLowerCase().includes(q))
    )
  })

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-gray-900">全部优惠券</h1>
              <p className="text-gray-400 text-xs mt-0.5">
                {loading ? '正在获取实时数据...' : `共 ${coupons.length} 条实时优惠`}
                {lastUpdate && <span className="ml-1 text-[#00D68F]">· 更新于 {lastUpdate}</span>}
              </p>
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
              placeholder="搜索优惠、运营商、分类..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#FF6B35]/20 transition-all"
            />
          </div>
        </div>

        <CarrierFilter />
      </div>

      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-red-500 text-xs">{error}</p>
          <button
            onClick={() => refetch()}
            className="text-red-600 text-xs font-bold mt-1"
          >
            重试
          </button>
        </div>
      )}

      <div className="px-4 pt-2 pb-24 space-y-3">
        {loading && coupons.length === 0 ? (
          <div className="text-center py-16">
            <RefreshCw size={32} className="text-gray-300 mx-auto mb-3 animate-spin" />
            <p className="text-gray-400 text-sm">正在从后端获取实时数据...</p>
            <p className="text-gray-300 text-xs mt-1">数据来源于政府网站实时抓取</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">
              {searchQuery ? '暂无匹配的优惠信息' : '暂无话费优惠券数据'}
            </p>
            <p className="text-gray-300 text-xs mt-1">
              {searchQuery ? '试试其他筛选条件' : '当前仅提供政策类信息，请前往「政策雷达」查看'}
            </p>
          </div>
        ) : (
          filteredCoupons.map((coupon, i) => (
            <CouponCard key={coupon.id} coupon={coupon} index={i} />
          ))
        )}
      </div>

      <CouponDetail />
    </div>
  )
}
