import { useState, useEffect, useCallback } from 'react'
import { ScrapedCoupon } from '@/data/mockCoupons'

const API_BASE = '/api'

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

export function useLiveCoupons(carrier?: string) {
  const [coupons, setCoupons] = useState<ScrapedCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchCoupons = useCallback(async () => {
    setError(null)
    try {
      const url = carrier
        ? `${API_BASE}/coupons?carrier=${carrier}`
        : `${API_BASE}/coupons`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        const couponData = (data.data as ScrapedCoupon[]).filter(
          c => c.type === 'coupon' || (!c.type && c.carrier !== 'policy')
        )
        setCoupons(couponData)
        setLastUpdate(new Date().toLocaleString('zh-CN'))
      }
    } catch {
      setError('后端服务未启动，无法获取实时数据')
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
      const res = await fetch(`${API_BASE}/coupons`)
      const data = await res.json()
      if (data.success) {
        let filtered = (data.data as ScrapedCoupon[]).filter(
          c => c.type === 'policy' || c.carrier === 'policy'
        )
        if (category && category !== 'all') {
          filtered = filtered.filter(c => c.category === category)
        }
        setPolicies(filtered)
        setLastUpdate(new Date().toLocaleString('zh-CN'))
      }
    } catch {
      setError('后端服务未启动，无法获取实时政策')
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
        const res = await fetch(`${API_BASE}/scrape/status`)
        const data = await res.json()
        if (data.success) {
          setStatus(data.data)
        }
      } catch {
        // backend not running
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return { status }
}

export async function triggerScrape(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/scrape/trigger`, { method: 'POST' })
    const data = await res.json()
    return data.success
  } catch {
    return false
  }
}
