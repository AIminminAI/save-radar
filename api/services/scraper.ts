import axios from 'axios'
import https from 'https'
import * as cheerio from 'cheerio'
import { ScrapedCoupon, ScrapeResult } from '../types.js'

const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
})

interface GovScrapeSource {
  name: string
  url: string
  category: string
  selectors: {
    list: string
    title: string
    date: string
    link: string
  }
  baseUrl: string
  keywords: string[]
}

const GOV_URLS: GovScrapeSource[] = [
  {
    name: '中国政府网-政策文件',
    url: 'https://www.gov.cn/zhengce/',
    category: 'gov-policy',
    selectors: {
      list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .data-list li',
      title: 'a',
      date: 'span, .date, .time, em',
      link: 'a',
    },
    baseUrl: 'https://www.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '生育', '赡养', '子女', '婴幼儿', '保障', '调整', '提高', '降低', '优惠', '减免', '政策', '话费', '充值', '流量', '通信', '电信', '移动', '联通'],
  },
  {
    name: '国家医保局-政策法规',
    url: 'http://www.nhsa.gov.cn/col/col19/index.html',
    category: 'medical',
    selectors: {
      list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li',
      title: 'a',
      date: 'span, .date, .time',
      link: 'a',
    },
    baseUrl: 'http://www.nhsa.gov.cn',
    keywords: ['医保', '报销', '门诊', '住院', '大病', '保障', '调整', '政策', '药品', '异地'],
  },
  {
    name: '国家医保局-政策解读',
    url: 'http://www.nhsa.gov.cn/col/col20/index.html',
    category: 'medical',
    selectors: {
      list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li',
      title: 'a',
      date: 'span, .date, .time',
      link: 'a',
    },
    baseUrl: 'http://www.nhsa.gov.cn',
    keywords: ['医保', '报销', '门诊', '住院', '大病', '保障', '调整', '政策'],
  },
  {
    name: '国家税务总局-政策法规',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810755/index.html',
    category: 'tax',
    selectors: {
      list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li',
      title: 'a',
      date: 'span, .date, .time',
      link: 'a',
    },
    baseUrl: 'https://www.chinatax.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '赡养', '子女', '婴幼儿', '住房', '社保', '养老金', '政策'],
  },
  {
    name: '国家税务总局-通知公告',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810755/c10204/index.html',
    category: 'tax',
    selectors: {
      list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li',
      title: 'a',
      date: 'span, .date, .time',
      link: 'a',
    },
    baseUrl: 'https://www.chinatax.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '政策', '通知'],
  },
  {
    name: '陕西省人社厅-首页',
    url: 'https://rst.shaanxi.gov.cn/',
    category: 'social-insurance',
    selectors: {
      list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li',
      title: 'a',
      date: 'span, .date, .time, em',
      link: 'a',
    },
    baseUrl: 'https://rst.shaanxi.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '保障', '调整'],
  },
  {
    name: '住建部-首页',
    url: 'https://www.mohurd.gov.cn/',
    category: 'housing',
    selectors: {
      list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li',
      title: 'a',
      date: 'span, .date, .time',
      link: 'a',
    },
    baseUrl: 'https://www.mohurd.gov.cn',
    keywords: ['住房', '公积金', '保障', '租赁', '补贴', '政策', '调整'],
  },
  {
    name: '人社部-首页',
    url: 'http://www.mohrss.gov.cn/',
    category: 'social-insurance',
    selectors: {
      list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li',
      title: 'a',
      date: 'span, .date, .time, em',
      link: 'a',
    },
    baseUrl: 'http://www.mohrss.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '保障', '调整'],
  },
]

async function scrapeGovSource(govSource: GovScrapeSource): Promise<ScrapedCoupon[]> {
  const coupons: ScrapedCoupon[] = []
  const isMohrss = govSource.url.includes('mohrss.gov.cn')

  try {
    if (isMohrss) {
      console.log(`[Scraper][DEBUG] ${govSource.name}: 开始Playwright无头浏览器抓取`)
      const pwCoupons = await scrapeWithPlaywright(govSource)
      if (pwCoupons.length > 0) return pwCoupons
      console.log(`[Scraper][DEBUG] ${govSource.name}: Playwright未获取到数据，回退到axios`)
    }

    const response = await axios.get(govSource.url, {
      timeout: 20000,
      httpsAgent,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    })

    if (isMohrss) {
      console.log(`[Scraper][DEBUG] ${govSource.name}: axios返回状态=${response.status}, 数据长度=${response.data?.length || 0}`)
      console.log(`[Scraper][DEBUG] ${govSource.name}: HTML前200字符: ${String(response.data).substring(0, 200)}`)
    }

    const $ = cheerio.load(response.data)
    const items = $(govSource.selectors.list)

    if (isMohrss) {
      console.log(`[Scraper][DEBUG] ${govSource.name}: 选择器"${govSource.selectors.list}"匹配到${items.length}个元素`)
      const allAnchors = $('a')
      console.log(`[Scraper][DEBUG] ${govSource.name}: 页面共有${allAnchors.length}个<a>标签`)
      const keywordLinks = allAnchors.filter(function () {
        const text = $(this).text().trim()
        return govSource.keywords.some(kw => text.includes(kw))
      })
      console.log(`[Scraper][DEBUG] ${govSource.name}: 关键词匹配到${keywordLinks.length}个链接`)
    }

    if (items.length === 0) {
      const allLinks = $('a').filter(function () {
        const text = $(this).text().trim()
        return govSource.keywords.some(kw => text.includes(kw))
      })

      allLinks.each(function (i) {
        if (i >= 15) return false
        const title = $(this).text().trim()
        if (!title || title.length < 6 || title.length > 80) return

        const href = $(this).attr('href') || ''
        const dateEl = $(this).siblings('span, .date, .time, em').first()
        const dateText = dateEl.text().trim().replace(/[^\d\-\/]/g, '').substring(0, 10)

        coupons.push({
          id: `gov-${govSource.category}-${Date.now()}-${i}`,
          title,
          carrier: 'policy',
          carrierName: govSource.name,
          discountAmount: 0,
          expirationDate: dateText || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: govSource.category,
          type: 'policy',
          guide: [
            `访问${govSource.name}查看详情`,
            '阅读政策原文',
            '对照自身情况判断是否适用',
            '按政策要求准备申请材料',
            '向当地相关部门咨询办理',
          ],
          claimUrl: buildUrl(href, govSource.baseUrl),
          isHot: title.includes('调整') || title.includes('提高') || title.includes('降低'),
          isNew: true,
          tags: ['政策', govSource.category],
          source: govSource.name,
          scrapedAt: new Date().toISOString(),
        })
      })
    } else {
      items.each(function (i) {
        if (i >= 15) return false
        const titleEl = $(this).find(govSource.selectors.title)
        const dateEl = $(this).find(govSource.selectors.date)
        const linkEl = $(this).find(govSource.selectors.link)

        const title = titleEl.text().trim()
        if (!title || title.length < 6 || title.length > 80) return

        const dateText = dateEl.text().trim().replace(/[^\d\-\/]/g, '').substring(0, 10)
        const href = linkEl.attr('href') || titleEl.attr('href') || ''

        coupons.push({
          id: `gov-${govSource.category}-${Date.now()}-${i}`,
          title,
          carrier: 'policy',
          carrierName: govSource.name,
          discountAmount: 0,
          expirationDate: dateText || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: govSource.category,
          type: 'policy',
          guide: [
            `访问${govSource.name}查看详情`,
            '阅读政策原文',
            '对照自身情况判断是否适用',
            '按政策要求准备申请材料',
            '向当地相关部门咨询办理',
          ],
          claimUrl: buildUrl(href, govSource.baseUrl),
          isHot: title.includes('调整') || title.includes('提高') || title.includes('降低'),
          isNew: true,
          tags: ['政策', govSource.category],
          source: govSource.name,
          scrapedAt: new Date().toISOString(),
        })
      })
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[Scraper] 抓取 ${govSource.name} 失败:`, msg)
  }

  return coupons
}

function buildUrl(href: string, baseUrl: string): string {
  if (!href) return baseUrl
  if (href.startsWith('http')) return href
  if (href.startsWith('//')) return 'https:' + href
  if (href.startsWith('/')) return baseUrl + href
  return baseUrl + '/' + href
}

export async function scrapeAllSources(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = []

  console.log('[Scraper] ===== 开始全量抓取 =====')
  for (const govSource of GOV_URLS) {
    const start = Date.now()
    const coupons = await scrapeGovSource(govSource)
    const elapsed = Date.now() - start
    console.log(`[Scraper] ${govSource.name}: ${coupons.length > 0 ? '✅' : '❌'} ${coupons.length}条, 耗时${elapsed}ms`)
    results.push({
      success: coupons.length > 0,
      source: govSource.name,
      count: coupons.length,
      timestamp: new Date().toISOString(),
    })

    if (coupons.length > 0) {
      const { saveCoupons } = await import('../services/dataStore.js')
      saveCoupons(coupons)
    }
  }
  console.log('[Scraper] ===== 全量抓取结束 =====')

  const successCount = results.filter(r => r.success).length
  const totalCoupons = results.reduce((sum, r) => sum + r.count, 0)
  console.log(`[Scraper] 汇总: ${successCount}/${results.length} 个源成功, 共 ${totalCoupons} 条`)

  return results
}

export async function scrapeSingleCarrier(
  carrier: 'mobile' | 'unicom' | 'telecom'
): Promise<ScrapeResult[]> {
  return scrapeAllSources()
}

export async function scrapeGovPolicies(): Promise<ScrapeResult[]> {
  return scrapeAllSources()
}

export async function scrapeQuickSources(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = []
  const quickSources = GOV_URLS.filter(s => !s.url.includes('mohrss.gov.cn'))

  for (const govSource of quickSources) {
    const start = Date.now()
    const coupons = await scrapeGovSource(govSource)
    const elapsed = Date.now() - start
    console.log(`[Scraper] ${govSource.name}: ${coupons.length > 0 ? '✅' : '❌'} ${coupons.length}条, 耗时${elapsed}ms`)
    results.push({
      success: coupons.length > 0,
      source: govSource.name,
      count: coupons.length,
      timestamp: new Date().toISOString(),
    })

    if (coupons.length > 0) {
      const { saveCoupons } = await import('../services/dataStore.js')
      saveCoupons(coupons)
    }
  }

  const successCount = results.filter(r => r.success).length
  const totalCoupons = results.reduce((sum, r) => sum + r.count, 0)
  console.log(`[Scraper] 增量抓取汇总: ${successCount}/${results.length} 源成功, ${totalCoupons}条`)

  return results
}

let _browserInstance: import('playwright').Browser | null = null
let _browserLaunchPromise: Promise<import('playwright').Browser> | null = null

async function getSharedBrowser(): Promise<import('playwright').Browser> {
  if (_browserInstance && _browserInstance.isConnected()) {
    return _browserInstance
  }
  if (_browserLaunchPromise) {
    return _browserLaunchPromise
  }
  _browserLaunchPromise = (async () => {
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--no-first-run',
        '--disable-background-networking',
      ],
    })
    _browserInstance = browser
    _browserLaunchPromise = null
    browser.on('disconnected', () => {
      _browserInstance = null
    })
    return browser
  })()
  return _browserLaunchPromise
}

async function scrapeWithPlaywright(govSource: GovScrapeSource): Promise<ScrapedCoupon[]> {
  const coupons: ScrapedCoupon[] = []

  const attempt = async (timeoutMs: number): Promise<ScrapedCoupon[]> => {
    const result: ScrapedCoupon[] = []
    const browser = await getSharedBrowser()

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'zh-CN',
    })

    const page = await context.newPage()

    await page.route('**/*', (route) => {
      const resType = route.request().resourceType()
      if (['image', 'stylesheet', 'font', 'media'].includes(resType)) {
        route.abort()
      } else {
        route.continue()
      }
    })

    try {
      await page.goto(govSource.url, {
        waitUntil: 'domcontentloaded',
        timeout: timeoutMs,
      })

      await page.waitForSelector('a', { state: 'attached', timeout: Math.min(timeoutMs, 5000) })

      const html = await page.content()
      const $ = cheerio.load(html)

      const allAnchors = $('a')
      const keywordLinks = allAnchors.filter(function () {
        const text = $(this).text().trim()
        return govSource.keywords.some(kw => text.includes(kw))
      })

      keywordLinks.each(function (i) {
        if (i >= 15) return false
        const title = $(this).text().trim()
        if (!title || title.length < 6 || title.length > 80) return

        const href = $(this).attr('href') || ''
        const dateEl = $(this).siblings('span, .date, .time, em').first()
        const dateText = dateEl.text().trim().replace(/[^\d\-\/]/g, '').substring(0, 10)

        result.push({
          id: `pw-${govSource.category}-${Date.now()}-${i}`,
          title,
          carrier: 'policy',
          carrierName: govSource.name,
          discountAmount: 0,
          expirationDate: dateText || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: govSource.category,
          type: 'policy',
          guide: [
            `访问${govSource.name}查看详情`,
            '阅读政策原文',
            '对照自身情况判断是否适用',
            '按政策要求准备申请材料',
            '向当地相关部门咨询办理',
          ],
          claimUrl: buildUrl(href, govSource.baseUrl),
          isHot: title.includes('调整') || title.includes('提高') || title.includes('降低'),
          isNew: true,
          tags: ['政策', govSource.category],
          source: govSource.name,
          scrapedAt: new Date().toISOString(),
        })
      })
    } finally {
      await context.close()
    }

    return result
  }

  try {
    console.log(`[Scraper][Playwright] 访问 ${govSource.url} (优化模式)...`)
    const start = Date.now()

    try {
      const firstResult = await attempt(8000)
      const elapsed = Date.now() - start
      console.log(`[Scraper][Playwright] 首次尝试: ${firstResult.length}条, 耗时${elapsed}ms`)
      if (firstResult.length > 0) return firstResult
    } catch (e) {
      const elapsed = Date.now() - start
      console.log(`[Scraper][Playwright] 首次超时(${elapsed}ms)，启动重试...`)
    }

    const retryStart = Date.now()
    const retryResult = await attempt(12000)
    const retryElapsed = Date.now() - retryStart
    console.log(`[Scraper][Playwright] 重试: ${retryResult.length}条, 耗时${retryElapsed}ms`)
    return retryResult
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[Scraper][Playwright] 失败: ${msg}`)
  }

  return coupons
}
