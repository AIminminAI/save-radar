import { useState, useEffect, useCallback } from 'react'
import { ScrapedCoupon } from '@/data/mockCoupons'

const DATA_BASE = '/data'

export type { ScrapedCoupon }

export interface ScrapeStatus {
  isRunning: boolean
  isGovRunning: boolean
  lastScrapeTime: string
  lastGovScrapeTime: string
  results: unknown[]
  schedule: {
    fullScrape: string
    govScrape: string
  }
}

interface ScrapeMeta {
  lastScrapeTime: string
  lastGovScrapeTime?: string
  results: unknown[]
}

let _allDataCache: ScrapedCoupon[] | null = null
let _metaCache: ScrapeMeta | null = null

async function loadAllData(): Promise<{ coupons: ScrapedCoupon[]; meta: ScrapeMeta }> {
  if (_allDataCache && _metaCache) {
    return { coupons: _allDataCache, meta: _metaCache }
  }

  try {
    const [couponsRes, metaRes] = await Promise.all([
      fetch(`${DATA_BASE}/coupons.json`),
      fetch(`${DATA_BASE}/meta.json`),
    ])

    if (!couponsRes.ok || !metaRes.ok) {
      throw new Error('数据加载失败')
    }

    _allDataCache = (await couponsRes.json()) as ScrapedCoupon[]
    _metaCache = (await metaRes.json()) as ScrapeMeta

    return { coupons: _allDataCache, meta: _metaCache }
  } catch {
    return { coupons: [], meta: { lastScrapeTime: '', lastGovScrapeTime: '', results: [] } }
  }
}

export function clearDataCache() {
  _allDataCache = null
  _metaCache = null
}

export function useLiveCoupons(carrier?: string) {
  const [coupons, setCoupons] = useState<ScrapedCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchCoupons = useCallback(async () => {
    setError(null)
    try {
      const { coupons: all } = await loadAllData()
      let filtered = all.filter(
        c => c.type === 'coupon' || (!c.type && c.carrier !== 'policy')
      )
      if (carrier && carrier !== 'all') {
        filtered = filtered.filter(c => c.carrier === carrier)
      }
      setCoupons(filtered)
      setLastUpdate(new Date().toLocaleString('zh-CN'))
    } catch {
      setError('数据加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [carrier])

  useEffect(() => {
    fetchCoupons()
    const interval = setInterval(fetchCoupons, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchCoupons])

  return { coupons, loading, error, lastUpdate, refetch: fetchCoupons }
}

export function useLivePolicies(category?: string) {
  const [policies, setPolicies] = useState<ScrapedCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchPolicies = useCallback(async () => {
    setError(null)
    try {
      const { coupons: all } = await loadAllData()
      let filtered = all.filter(
        c => c.type === 'policy' || c.carrier === 'policy'
      )
      if (category && category !== 'all') {
        filtered = filtered.filter(c => c.category === category)
      }
      setPolicies(filtered)
      setLastUpdate(new Date().toLocaleString('zh-CN'))
    } catch {
      setError('政策数据加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    fetchPolicies()
    const interval = setInterval(fetchPolicies, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchPolicies])

  return { policies, loading, error, lastUpdate, refetch: fetchPolicies }
}

export function useScrapeStatus() {
  const [status, setStatus] = useState<ScrapeStatus | null>(null)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const { meta } = await loadAllData()
        setStatus({
          isRunning: false,
          isGovRunning: false,
          lastScrapeTime: meta.lastScrapeTime,
          lastGovScrapeTime: meta.lastGovScrapeTime || '',
          results: meta.results,
          schedule: {
            fullScrape: '每天 02:00',
            govScrape: '每天 03:00, 12:00, 18:00',
          },
        })
      } catch {
        // ignore
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return { status }
}

export async function refreshData(): Promise<boolean> {
  clearDataCache()
  return true
}
