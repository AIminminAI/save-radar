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
  /** 需要过滤掉的非政策标题关键词 */
  excludeKeywords: string[]
  /** 标题最小长度（低于此长度的通常是导航链接） */
  minTitleLength: number
}

const GOV_URLS: GovScrapeSource[] = [
  {
    name: '中国政府网-政策文件',
    url: 'https://www.gov.cn/zhengce/',
    category: 'gov-policy',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .data-list li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '生育', '赡养', '子女', '婴幼儿', '保障', '调整', '提高', '降低', '优惠', '减免', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '网站地图', '联系我们', '关于', '版权', '备案', '无障碍', '国务院政策文件', '行政法规', '部门规章'],
    minTitleLength: 10,
  },
  {
    name: '国家医保局-政策法规',
    url: 'http://www.nhsa.gov.cn/col/col19/index.html',
    category: 'medical',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.nhsa.gov.cn',
    keywords: ['医保', '报销', '门诊', '住院', '大病', '保障', '调整', '政策', '药品', '异地'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '政策法规和动态', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '国家医保局-政策解读',
    url: 'http://www.nhsa.gov.cn/col/col20/index.html',
    category: 'medical',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.nhsa.gov.cn',
    keywords: ['医保', '报销', '门诊', '住院', '大病', '保障', '调整', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们'],
    minTitleLength: 8,
  },
  {
    name: '国家税务总局-政策法规',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810755/index.html',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.chinatax.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '赡养', '子女', '婴幼儿', '住房', '社保', '养老金', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '国家税务总局-通知公告',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810755/c10204/index.html',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.chinatax.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '政策', '通知'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们'],
    minTitleLength: 8,
  },
  {
    name: '陕西省人社厅-首页',
    url: 'https://rst.shaanxi.gov.cn/',
    category: 'social-insurance',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://rst.shaanxi.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '保障', '调整'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '省医疗保障局', '省住房和城乡建设厅', '人力资源和社会保障部', '网站地图', '无障碍'],
    minTitleLength: 8,
  },
  {
    name: '住建部-首页',
    url: 'https://www.mohurd.gov.cn/',
    category: 'housing',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.mohurd.gov.cn',
    keywords: ['住房', '公积金', '保障', '租赁', '补贴', '政策', '调整'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '人社部-政策文件',
    url: 'https://www.mohrss.gov.cn/SYrlzyhshbzb/zcfg/',
    category: 'social-insurance',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mohrss.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '保障', '调整', '工伤', '失业', '生育'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '国家社保平台'],
    minTitleLength: 8,
  },
]

function buildUrl(href: string, baseUrl: string): string {
  if (!href) return baseUrl
  if (href.startsWith('http')) return href
  if (href.startsWith('//')) return 'https:' + href
  if (href.startsWith('/')) return baseUrl + href
  return baseUrl + '/' + href
}

/** 判断标题是否是有效的政策标题 */
function isValidPolicyTitle(title: string, source: GovScrapeSource): boolean {
  // 长度检查：太短通常是导航链接
  if (title.length < source.minTitleLength) return false
  // 太长也不合理
  if (title.length > 100) return false
  // 排除关键词检查
  if (source.excludeKeywords.some(kw => title.includes(kw))) return false
  // 纯数字或纯符号
  if (/^[\d\s\-\/\.]+$/.test(title)) return false
  // 只有部门名称没有具体内容的（如"省医疗保障局"、"人力资源和社会保障部"）
  if (/^(省|国家|中国|中华|人力|社会|医疗|住房|城乡|税务|财政|民政)/.test(title) && title.length < 15) return false
  // 常见导航模式
  if (/^(关于我们|联系方式|网站地图|版权|备案|ICP|技术支持|更多|详情|下载|返回|上一页|下一页)/.test(title)) return false
  return true
}

/** 判断链接是否指向政策详情页（而非首页或导航页） */
function isValidPolicyUrl(href: string): boolean {
  if (!href) return false
  // 排除首页链接
  if (href === '/' || href === '#' || href === '') return false
  // 排除纯栏目首页
  if (/^https?:\/\/[^\/]+\/?$/.test(href)) return false
  // 排除只有一级路径的（通常是栏目首页）
  if (/^https?:\/\/[^\/]+\/[^\/]+\/?$/.test(href)) return false
  // 包含具体文章标识的链接（如 t20260428_575058.html, content_7068345.htm 等）
  if (/\/t\d{6,}/.test(href)) return true
  if (/\/content[_-]?\d+/.test(href)) return true
  if (/\/art[_-]?\d+/.test(href)) return true
  if (/\/\d{4}\//.test(href)) return true  // 包含年份路径
  if (/\.html?$/.test(href)) return true   // 以.html/.htm结尾
  if (/\/col\/col\d+/.test(href)) return false  // 栏目页
  return true
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

    const processItem = (title: string, href: string, dateText: string, index: number) => {
      if (!isValidPolicyTitle(title, govSource)) return
      const fullUrl = buildUrl(href, govSource.baseUrl)
      if (!isValidPolicyUrl(fullUrl)) return

      coupons.push({
        id: `gov-${govSource.category}-${Date.now()}-${index}`,
        title,
        carrier: 'policy',
        carrierName: govSource.name,
        discountAmount: 0,
        expirationDate: dateText || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: govSource.category,
        type: 'policy',
        guide: [`访问${govSource.name}查看详情`, '阅读政策原文', '对照自身情况判断是否适用', '按政策要求准备申请材料', '向当地相关部门咨询办理'],
        claimUrl: fullUrl,
        isHot: title.includes('调整') || title.includes('提高') || title.includes('降低') || title.includes('减免'),
        isNew: true,
        tags: ['政策', govSource.category],
        source: govSource.name,
        scrapedAt: new Date().toISOString(),
      })
    }

    if (items.length === 0) {
      const allLinks = $('a').filter(function () {
        const text = $(this).text().trim()
        return govSource.keywords.some(kw => text.includes(kw))
      })
      allLinks.each(function (i) {
        if (i >= 15) return false
        const title = $(this).text().trim()
        const href = $(this).attr('href') || ''
        const dateEl = $(this).siblings('span, .date, .time, em').first()
        const dateText = dateEl.text().trim().replace(/[^\d\-\/]/g, '').substring(0, 10)
        processItem(title, href, dateText, i)
      })
    } else {
      items.each(function (i) {
        if (i >= 15) return false
        const titleEl = $(this).find(govSource.selectors.title)
        const dateEl = $(this).find(govSource.selectors.date)
        const linkEl = $(this).find(govSource.selectors.link)
        const title = titleEl.text().trim()
        const dateText = dateEl.text().trim().replace(/[^\d\-\/]/g, '').substring(0, 10)
        const href = linkEl.attr('href') || titleEl.attr('href') || ''
        processItem(title, href, dateText, i)
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

  // 用新数据完全替换旧数据（而非增量合并），确保过滤后的数据质量
  const seenTitles = new Set<string>()
  const deduped = allNewCoupons.filter(c => {
    if (seenTitles.has(c.title)) return false
    seenTitles.add(c.title)
    return true
  })

  const merged = [...deduped, ...existingCoupons.filter(c => !seenTitles.has(c.title))].slice(0, 500)

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
  console.log(`\n汇总: ${successCount}/${results.length} 个源成功, 新增${deduped.length}条, 总计${merged.length}条`)
}

main().catch(console.error)
