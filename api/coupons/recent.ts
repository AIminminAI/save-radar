import type { VercelRequest, VercelResponse } from '@vercel/node'
import { loadData } from '../_lib/data'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  const { coupons } = loadData()
  const hours = parseInt(typeof req.query.hours === 'string' ? req.query.hours : '24') || 24
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const filtered = coupons.filter(c => c.scrapedAt >= cutoff)

  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
  res.json({ success: true, data: filtered, total: filtered.length })
}
