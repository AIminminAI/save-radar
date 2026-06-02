import { Router, Request, Response } from 'express'
import { getCouponsByCarrier, getRecentCoupons, deleteCoupon, loadScrapeMeta, saveCoupons } from '../services/dataStore.js'
import { scrapeAllSources, scrapeSingleCarrier, scrapeGovPolicies } from '../services/scraper.js'
import { getScrapeStatus, runScheduledScrape } from '../services/cron.js'
import { ScrapedCoupon } from '../types.js'

const router = Router()

router.get('/coupons', (req: Request, res: Response) => {
  const carrier = typeof req.query.carrier === 'string' ? req.query.carrier : undefined
  const coupons = getCouponsByCarrier(carrier)
  res.json({ success: true, data: coupons, total: coupons.length })
})

router.get('/coupons/recent', (req: Request, res: Response) => {
  const hours = parseInt(typeof req.query.hours === 'string' ? req.query.hours : '24') || 24
  const coupons = getRecentCoupons(hours)
  res.json({ success: true, data: coupons, total: coupons.length })
})

router.delete('/coupons/:id', (req: Request<{ id: string }>, res: Response) => {
  deleteCoupon(req.params.id)
  res.json({ success: true })
})

router.post('/coupons', (req: Request, res: Response) => {
  try {
    const coupon = req.body as ScrapedCoupon
    if (!coupon.title) {
      res.status(400).json({ success: false, error: '缺少必要字段: title' })
      return
    }
    coupon.id = coupon.id || `manual-${coupon.carrier}-${Date.now()}`
    coupon.scrapedAt = new Date().toISOString()
    coupon.isNew = true
    coupon.source = coupon.source || '手动录入'
    saveCoupons([coupon])
    res.json({ success: true, data: coupon })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: msg })
  }
})

router.post('/scrape', async (req: Request, res: Response) => {
  try {
    const carrier = req.body?.carrier as string | undefined
    const results = carrier
      ? await scrapeSingleCarrier(carrier as 'mobile' | 'unicom' | 'telecom')
      : await scrapeAllSources()
    res.json({ success: true, results })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: msg })
  }
})

router.get('/scrape/status', (_req: Request, res: Response) => {
  const status = getScrapeStatus()
  res.json({ success: true, data: status })
})

router.get('/meta', (_req: Request, res: Response) => {
  const meta = loadScrapeMeta()
  res.json({ success: true, data: meta })
})

router.post('/scrape/trigger', async (_req: Request, res: Response) => {
  runScheduledScrape()
  res.json({ success: true, message: '抓取任务已触发' })
})

router.post('/scrape/gov', async (_req: Request, res: Response) => {
  try {
    const results = await scrapeGovPolicies()
    res.json({ success: true, results })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: msg })
  }
})

export default router
