import axios from 'axios'
import https from 'https'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', 'data')
const PUBLIC_DATA_DIR = path.join(__dirname, '..', 'public', 'data')

const httpsAgent = new https.Agent({ rejectUnauthorized: true })

interface GovScrapeSource {
  name: string
  url: string
  category: string
  selectors: { list: string; title: string; date: string; link: string }
  baseUrl: string
  keywords: string[]
}

const GOV_URLS: GovScrapeSource[] = [
  {
    name: '中国政府网-政策文件',
    url: 'https://www.gov.cn/zhengce/',
    category: 'gov-policy',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .data-list li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '生育', '赡养', '子女', '婴幼儿', '保障', '调整', '提高', '降低', '优惠', '减免', '政策'],
  },
  {
    name: '国家医保局-政策法规',
    url: 'http://www.nhsa.gov.cn/col/col19/index.html',
    category: 'medical',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.nhsa.gov.cn',
    keywords: ['医保', '报销', '门诊', '住院', '大病', '保障', '调整', '政策', '药品', '异地'],
  },
  {
    name: '国家医保局-政策解读',
    url: 'http://www.nhsa.gov.cn/col/col20/index.html',
    category: 'medical',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.nhsa.gov.cn',
    keywords: ['医保', '报销', '门诊', '住院', '大病', '保障', '调整', '政策'],
  },
  {
    name: '国家税务总局-政策法规',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810755/index.html',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.chinatax.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '赡养', '子女', '婴幼儿', '住房', '社保', '养老金', '政策'],
  },
  {
    name: '国家税务总局-通知公告',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810755/c10204/index.html',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.chinatax.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '政策', '通知'],
  },
  {
    name: '陕西省人社厅-首页',
    url: 'https://rst.shaanxi.gov.cn/',
    category: 'social-insurance',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://rst.shaanxi.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '保障', '调整'],
  },
  {
    name: '住建部-首页',
    url: 'https://www.mohurd.gov.cn/',
    category: 'housing',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.mohurd.gov.cn',
    keywords: ['住房', '公积金', '保障', '租赁', '补贴', '政策', '调整'],
  },
]

function buildUrl(href: string, baseUrl: string): string {
  if (!href) return baseUrl
  if (href.startsWith('http')) return href
  if (href.startsWith('//')) return 'https:' + href
  if (href.startsWith('/')) return baseUrl + href
  return baseUrl + '/' + href
}

async function scrapeGovSource(govSource: GovScrapeSource) {
  const coupons: any[] = []

  try {
    const response = await axios.get(govSource.url, {
      timeout: 20000,
      httpsAgent,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    })

    const $ = cheerio.load(response.data)
    const items = $(govSource.selectors.list)

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
          title, carrier: 'policy', carrierName: govSource.name, discountAmount: 0,
          expirationDate: dateText || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: govSource.category, type: 'policy',
          guide: [`访问${govSource.name}查看详情`, '阅读政策原文', '对照自身情况判断是否适用', '按政策要求准备申请材料', '向当地相关部门咨询办理'],
          claimUrl: buildUrl(href, govSource.baseUrl),
          isHot: title.includes('调整') || title.includes('提高') || title.includes('降低'),
          isNew: true, tags: ['政策', govSource.category], source: govSource.name,
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
          title, carrier: 'policy', carrierName: govSource.name, discountAmount: 0,
          expirationDate: dateText || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: govSource.category, type: 'policy',
          guide: [`访问${govSource.name}查看详情`, '阅读政策原文', '对照自身情况判断是否适用', '按政策要求准备申请材料', '向当地相关部门咨询办理'],
          claimUrl: buildUrl(href, govSource.baseUrl),
          isHot: title.includes('调整') || title.includes('提高') || title.includes('降低'),
          isNew: true, tags: ['政策', govSource.category], source: govSource.name,
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

async function main() {
  for (const dir of [DATA_DIR, PUBLIC_DATA_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  let existingCoupons: any[] = []
  const couponsPath = path.join(DATA_DIR, 'coupons.json')
  if (fs.existsSync(couponsPath)) {
    existingCoupons = JSON.parse(fs.readFileSync(couponsPath, 'utf-8'))
  }

  const allNewCoupons: any[] = []
  const results: any[] = []

  for (const govSource of GOV_URLS) {
    const start = Date.now()
    const coupons = await scrapeGovSource(govSource)
    const elapsed = Date.now() - start
    console.log(`${govSource.name}: ${coupons.length > 0 ? '✅' : '❌'} ${coupons.length}条, 耗时${elapsed}ms`)
    results.push({ success: coupons.length > 0, source: govSource.name, count: coupons.length, timestamp: new Date().toISOString() })
    allNewCoupons.push(...coupons)
  }

  const existingTitles = new Set(existingCoupons.map((c: any) => c.title))
  const uniqueNew = allNewCoupons.filter(c => !existingTitles.has(c.title))
  const merged = [...uniqueNew, ...existingCoupons].slice(0, 500)

  const couponsJson = JSON.stringify(merged, null, 2)
  const meta = {
    lastScrapeTime: new Date().toISOString(),
    lastGovScrapeTime: new Date().toISOString(),
    results,
  }
  const metaJson = JSON.stringify(meta, null, 2)

  for (const dir of [DATA_DIR, PUBLIC_DATA_DIR]) {
    fs.writeFileSync(path.join(dir, 'coupons.json'), couponsJson, 'utf-8')
    fs.writeFileSync(path.join(dir, 'meta.json'), metaJson, 'utf-8')
  }

  const successCount = results.filter((r: any) => r.success).length
  console.log(`\n汇总: ${successCount}/${results.length} 个源成功, 新增${uniqueNew.length}条, 总计${merged.length}条`)
}

main().catch(console.error)
