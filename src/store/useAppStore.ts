import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ScrapedCoupon, CarrierConfig, carriers } from '@/data/types'
import { Persona } from '@/data/personas'

interface AppState {
  activeTab: string
  setActiveTab: (tab: string) => void
  selectedCarrier: string
  setSelectedCarrier: (carrier: string) => void
  selectedPersona: string
  setSelectedPersona: (persona: string) => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  selectedCoupon: ScrapedCoupon | null
  setSelectedCoupon: (coupon: ScrapedCoupon | null) => void
  showDetail: boolean
  setShowDetail: (show: boolean) => void
  totalSaved: number
  addSavings: (amount: number) => void
  carriers: CarrierConfig[]
  recentlyViewed: string[]
  addRecentlyViewed: (id: string) => void
  shareCount: number
  incrementShareCount: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),
      selectedCarrier: 'all',
      setSelectedCarrier: (carrier) => set({ selectedCarrier: carrier }),
      selectedPersona: 'office-worker',
      setSelectedPersona: (persona) => set({ selectedPersona: persona }),
      favorites: [],
      toggleFavorite: (id) => {
        const favs = get().favorites
        if (favs.includes(id)) {
          set({ favorites: favs.filter(f => f !== id) })
        } else {
          set({ favorites: [...favs, id] })
        }
      },
      isFavorite: (id) => get().favorites.includes(id),
      selectedCoupon: null,
      setSelectedCoupon: (coupon) => set({ selectedCoupon: coupon }),
      showDetail: false,
      setShowDetail: (show) => set({ showDetail: show }),
      totalSaved: 0,
      addSavings: (amount) => set({ totalSaved: get().totalSaved + amount }),
      carriers,
      recentlyViewed: [],
      addRecentlyViewed: (id) => {
        const viewed = get().recentlyViewed.filter(v => v !== id)
        set({ recentlyViewed: [id, ...viewed].slice(0, 20) })
      },
      shareCount: 0,
      incrementShareCount: () => set({ shareCount: get().shareCount + 1 }),
    }),
    {
      name: 'bill-radar-store',
      partialize: (state) => ({
        favorites: state.favorites,
        totalSaved: state.totalSaved,
        recentlyViewed: state.recentlyViewed,
        shareCount: state.shareCount,
        selectedPersona: state.selectedPersona,
      }),
    }
  )
)

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  ;(window as any).__ZUSTAND_STORE__ = useAppStore
}
