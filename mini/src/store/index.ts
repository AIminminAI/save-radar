import { reactive } from 'vue'
import type { ScrapedCoupon } from '@/data/types'
import type { PurchaseRecord } from '@/services/paymentService'
import { PRODUCTS, savePurchase as savePurchaseRecord } from '@/services/paymentService'

interface AppState {
  selectedPersona: string
  favorites: string[]
  shareCount: number
  recentlyViewed: string[]
  policies: ScrapedCoupon[]
  loading: boolean
  subsidyUnlocked: boolean
  monthlyPassExpiry: string | null
  purchases: PurchaseRecord[]
}

const state = reactive<AppState>({
  selectedPersona: uni.getStorageSync('selectedPersona') || 'office-worker',
  favorites: JSON.parse(uni.getStorageSync('favorites') || '[]'),
  shareCount: parseInt(uni.getStorageSync('shareCount') || '0', 10),
  recentlyViewed: JSON.parse(uni.getStorageSync('recentlyViewed') || '[]'),
  policies: [],
  loading: false,
  subsidyUnlocked: false,
  monthlyPassExpiry: null,
  purchases: [],
})

function persist() {
  uni.setStorageSync('selectedPersona', state.selectedPersona)
  uni.setStorageSync('favorites', JSON.stringify(state.favorites))
  uni.setStorageSync('shareCount', String(state.shareCount))
  uni.setStorageSync('recentlyViewed', JSON.stringify(state.recentlyViewed))
}

export function useStore() {
  return {
    state,
    setPersona(id: string) { state.selectedPersona = id; persist() },
    toggleFavorite(id: string) {
      const idx = state.favorites.indexOf(id)
      if (idx >= 0) state.favorites.splice(idx, 1)
      else state.favorites.push(id)
      persist()
    },
    incrementShare() { state.shareCount++; persist() },
    addRecentlyViewed(id: string) {
      if (!state.recentlyViewed.includes(id)) {
        state.recentlyViewed.unshift(id)
        if (state.recentlyViewed.length > 20) state.recentlyViewed.pop()
        persist()
      }
    },
    setPolicies(policies: ScrapedCoupon[]) { state.policies = policies },
    setLoading(loading: boolean) { state.loading = loading },
    unlockSubsidy(orderId: string) {
      state.subsidyUnlocked = true
      savePurchaseRecord(PRODUCTS.SUBSIDY_FULL, orderId)
      const now = new Date().toISOString()
      state.purchases.push({ productId: PRODUCTS.SUBSIDY_FULL.id, orderId, purchasedAt: now })
    },
    activateMonthlyPass(orderId: string) {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 30)
      const expiryStr = expiry.toISOString()
      state.monthlyPassExpiry = expiryStr
      savePurchaseRecord(PRODUCTS.MONTHLY_PASS, orderId)
      const now = new Date().toISOString()
      state.purchases.push({ productId: PRODUCTS.MONTHLY_PASS.id, orderId, purchasedAt: now, expiresAt: expiryStr })
    },
    loadPurchases() {
      const raw = uni.getStorageSync('purchaseRecords')
      if (raw) {
        try {
          state.purchases = JSON.parse(raw) as PurchaseRecord[]
        } catch {
          state.purchases = []
        }
      }
      // Derive unlock state from purchase records
      const now = new Date()
      state.subsidyUnlocked = state.purchases.some(
        (p) => p.productId === PRODUCTS.SUBSIDY_FULL.id
      )
      const monthlyRecord = state.purchases.find(
        (p) => p.productId === PRODUCTS.MONTHLY_PASS.id && p.expiresAt && new Date(p.expiresAt) > now
      )
      state.monthlyPassExpiry = monthlyRecord?.expiresAt || null
      if (state.monthlyPassExpiry) {
        state.subsidyUnlocked = true
      }
    },
  }
}
