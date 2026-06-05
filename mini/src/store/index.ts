import { reactive } from 'vue'
import type { ScrapedCoupon } from '@/data/types'

interface AppState {
  selectedPersona: string
  favorites: string[]
  shareCount: number
  recentlyViewed: string[]
  policies: ScrapedCoupon[]
  loading: boolean
}

const state = reactive<AppState>({
  selectedPersona: uni.getStorageSync('selectedPersona') || 'office-worker',
  favorites: JSON.parse(uni.getStorageSync('favorites') || '[]'),
  shareCount: parseInt(uni.getStorageSync('shareCount') || '0', 10),
  recentlyViewed: JSON.parse(uni.getStorageSync('recentlyViewed') || '[]'),
  policies: [],
  loading: false,
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
  }
}
