import data from './_data/coupons.json'

export default function handler(_req: any, res: any) {
  res.json({ total: (data as any[]).length, first: (data as any[])[0]?.title || 'none' })
}
