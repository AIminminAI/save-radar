import type { VercelRequest, VercelResponse } from '@vercel/node'
import { loadData } from './_lib/data'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  const { meta } = loadData()

  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
  res.json({ success: true, data: meta })
}
