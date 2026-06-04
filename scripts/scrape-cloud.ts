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
  /** 主URL失败时的备用URL列表 */
  fallbackUrls?: string[]
}

const GOV_URLS: GovScrapeSource[] = [
  {
    name: '中国政府网-政策文件',
    url: 'https://www.gov.cn/zhengce/zuixin/',
    category: 'gov-policy',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .data-list li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '生育', '赡养', '子女', '婴幼儿', '保障', '调整', '提高', '降低', '优惠', '减免', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '网站地图', '联系我们', '关于', '版权', '备案', '无障碍', '国务院政策文件', '行政法规', '部门规章'],
    minTitleLength: 10,
    fallbackUrls: ['https://www.gov.cn/zhengce/content_1/', 'https://www.gov.cn/zhengce/'],
  },
  {
    name: '国家医保局-政策法规',
    url: 'http://www.nhsa.gov.cn/col/col19/index.html',
    category: 'medical',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.nhsa.gov.cn',
    keywords: ['医保', '报销', '门诊', '住院', '大病', '保障', '调整', '政策', '药品', '异地'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '政策法规和动态', '联系我们', '网站地图', '国家谈判药品落地', '药品和耗材集中带量采购', '药品目录', '医疗服务价格'],
    minTitleLength: 8,
  },
  {
    name: '国家医保局-政策解读',
    url: 'http://www.nhsa.gov.cn/col/col20/index.html',
    category: 'medical',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.nhsa.gov.cn',
    keywords: ['医保', '报销', '门诊', '住院', '大病', '保障', '调整', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '国家谈判药品落地', '药品和耗材集中带量采购'],
    minTitleLength: 8,
  },
  {
    name: '国家税务总局-政策法规',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810755/index.html',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.chinatax.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '赡养', '子女', '婴幼儿', '住房', '社保', '养老金', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '印花税票'],
    minTitleLength: 8,
  },
  {
    name: '国家税务总局-通知公告',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810755/c10204/index.html',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.chinatax.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '政策', '通知'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '印花税票'],
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
    url: 'https://www.mohrss.gov.cn/SYrlzyhshbzb/zcfg/SYrlzyhshbzb/',
    category: 'social-insurance',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mohrss.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '保障', '调整', '工伤', '失业', '生育'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '国家社保平台'],
    minTitleLength: 8,
    fallbackUrls: ['https://www.mohrss.gov.cn/SYrlzyhshbzb/zcfg/', 'https://www.mohrss.gov.cn/'],
  },
  {
    name: '中国政府网-最新政策',
    url: 'https://www.gov.cn/zhengce/zuixin/',
    category: 'gov-policy',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '生育', '赡养', '子女', '婴幼儿', '保障', '调整', '提高', '降低', '优惠', '减免', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 10,
  },
  {
    name: '中国政府网-政策解读',
    url: 'https://www.gov.cn/zhengce/jiedu/',
    category: 'gov-policy',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '生育', '赡养', '子女', '婴幼儿', '保障', '调整', '提高', '降低', '优惠', '减免', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 10,
  },
  {
    name: '国家税务总局-政策解读',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810755/c10155/index.html',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.chinatax.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '赡养', '子女', '婴幼儿', '住房', '社保', '养老金', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
  },
  {
    name: '住建部-政策文件',
    url: 'https://www.mohurd.gov.cn/gongkai/zhengce/',
    category: 'housing',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mohurd.gov.cn',
    keywords: ['住房', '公积金', '保障', '租赁', '补贴', '政策', '调整', '贷款', '利率'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
  },
  {
    name: '人社部-政策解读',
    url: 'https://www.mohrss.gov.cn/SYrlzyhshbzb/zcjd/',
    category: 'social-insurance',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mohrss.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '保障', '调整', '工伤', '失业', '生育'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
  },
  {
    name: '人社部-通知公告',
    url: 'https://www.mohrss.gov.cn/SYrlzyhshbzb/tzgg/',
    category: 'social-insurance',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mohrss.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '保障', '调整', '工伤', '失业', '生育', '通知'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
  },
  {
    name: '陕西省人社厅-政策文件',
    url: 'https://rst.shaanxi.gov.cn/zcfg/',
    category: 'social-insurance',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://rst.shaanxi.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '保障', '调整', '工伤', '失业', '生育'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
  },
  {
    name: '陕西省人社厅-通知公告',
    url: 'https://rst.shaanxi.gov.cn/sy/tzgg/',
    category: 'social-insurance',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://rst.shaanxi.gov.cn',
    keywords: ['社保', '养老金', '医保', '公积金', '住房', '补贴', '扣除', '缴费', '退休', '保障', '调整', '通知'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
  },
  {
    name: '国家医保局-通知公告',
    url: 'http://www.nhsa.gov.cn/col/col21/index.html',
    category: 'medical',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'http://www.nhsa.gov.cn',
    keywords: ['医保', '报销', '门诊', '住院', '大病', '保障', '调整', '政策', '药品', '异地'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
  },
  {
    name: '民政部-政策文件',
    url: 'https://www.mca.gov.cn/article/zcfg/',
    category: 'elderly',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mca.gov.cn',
    keywords: ['养老', '补贴', '保障', '低保', '救助', '福利', '护理', '津贴', '调整', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
  },
  {
    name: '民政部-通知公告',
    url: 'https://www.mca.gov.cn/article/tzgg/',
    category: 'elderly',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mca.gov.cn',
    keywords: ['养老', '补贴', '保障', '低保', '救助', '福利', '护理', '津贴', '调整', '政策', '通知'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
  },
  {
    name: '财政部-政策文件',
    url: 'https://www.mof.gov.cn/zhengwuxinxi/caizhengwengao/',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mof.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '补贴', '财政', '政策', '调整', '缴费'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
  },
  {
    name: '教育部-政策文件',
    url: 'http://www.moe.gov.cn/jyb_xxgk/s5743/s5981/',
    category: 'education',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'http://www.moe.gov.cn',
    keywords: ['教育', '高考', '招生', '学费', '助学', '奖学金', '贷款', '政策', '调整', '义务教育', '考研', '学位', '毕业', '考试', '录取', '培训', '技能', '资格'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
    fallbackUrls: ['http://www.moe.gov.cn/jyb_xxgk/', 'http://www.moe.gov.cn/'],
  },
  {
    name: '教育部-通知公告',
    url: 'http://www.moe.gov.cn/jyb_xxgk/s5743/',
    category: 'education',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'http://www.moe.gov.cn',
    keywords: ['教育', '高考', '招生', '学费', '助学', '奖学金', '贷款', '政策', '调整', '通知', '考试', '录取', '考研'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
  },
  {
    name: '卫健委-政策文件',
    url: 'http://www.nhc.gov.cn/zwgk/zcjd/',
    category: 'medical',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'http://www.nhc.gov.cn',
    keywords: ['医疗', '医保', '药品', '报销', '门诊', '住院', '保障', '政策', '调整', '公共卫生'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案', '无障碍'],
    minTitleLength: 8,
    fallbackUrls: ['http://www.nhc.gov.cn/zhjcj/s7692/', 'http://www.nhc.gov.cn/'],
  },
  // ===== 新增第二批数据源 =====
  {
    name: '中国政府网-国务院政策',
    url: 'https://www.gov.cn/zhengce/content/',
    category: 'gov-policy',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.gov.cn',
    keywords: ['政策', '调整', '保障', '补贴', '减免', '优惠', '改革', '实施'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图', '版权', '备案'],
    minTitleLength: 8,
  },
  {
    name: '国家税务总局-税收政策',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810755/c10156/index.html',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.chinatax.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '政策', '增值税', '企业所得税', '个人所得税'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '印花税票'],
    minTitleLength: 8,
  },
  {
    name: '住建部-政策法规',
    url: 'https://www.mohurd.gov.cn/gongkai/zcjd/',
    category: 'housing',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.mohurd.gov.cn',
    keywords: ['住房', '公积金', '保障', '租赁', '补贴', '政策', '调整', '贷款'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '民政部-养老服务',
    url: 'https://www.mca.gov.cn/article/zcjd/',
    category: 'elderly',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.mca.gov.cn',
    keywords: ['养老', '补贴', '保障', '高龄', '护理', '政策', '调整', '服务'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '财政部-政策解读',
    url: 'https://www.mof.gov.cn/zhengwuxinxi/caizhengxinwen/',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.mof.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '财政', '补贴', '政策', '调整'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '社保局-社保政策',
    url: 'https://www.mohrss.gov.cn/SYrlzyhshbzb/renshenbaosho/',
    category: 'social-insurance',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mohrss.gov.cn',
    keywords: ['社保', '养老金', '医保', '缴费', '退休', '保障', '调整', '工伤', '失业'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://www.mohrss.gov.cn/SYrlzyhshbzb/', 'https://www.mohrss.gov.cn/'],
  },
  {
    name: '教育部-政策解读',
    url: 'http://www.moe.gov.cn/jyb_xxgk/s5743/s5982/',
    category: 'education',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.moe.gov.cn',
    keywords: ['教育', '高考', '招生', '助学', '义务', '学前', '考研', '政策', '补贴', '学位', '毕业', '考试', '录取', '培训'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['http://www.moe.gov.cn/jyb_xxgk/s5743/', 'http://www.moe.gov.cn/'],
  },
  {
    name: '卫健委-政策解读',
    url: 'http://www.nhc.gov.cn/zwgk/zcjd/',
    category: 'medical',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.nhc.gov.cn',
    keywords: ['医疗', '医保', '药品', '报销', '门诊', '住院', '保障', '政策', '公共卫生'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['http://www.nhc.gov.cn/zhjcj/s7692/', 'http://www.nhc.gov.cn/'],
  },
  {
    name: '国家医保局-医保动态',
    url: 'http://www.nhsa.gov.cn/col/col22/index.html',
    category: 'medical',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.nhsa.gov.cn',
    keywords: ['医保', '报销', '门诊', '住院', '大病', '保障', '调整', '政策', '药品'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '陕西省政府-政策文件',
    url: 'https://www.shaanxi.gov.cn/zfxxgk/fdzdnknr/',
    category: 'gov-policy',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.shaanxi.gov.cn',
    keywords: ['政策', '补贴', '保障', '调整', '社保', '医保', '住房', '养老金'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://www.shaanxi.gov.cn/'],
  },
  // ===== 第三批：补充社保/教育/养老金 =====
  {
    name: '人社部-养老保险',
    url: 'https://www.mohrss.gov.cn/SYrlzyhshbzb/laorenshebao/',
    category: 'pension',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mohrss.gov.cn',
    keywords: ['养老金', '退休', '养老', '保障', '调整', '补贴', '社保'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://www.mohrss.gov.cn/SYrlzyhshbzb/', 'https://www.mohrss.gov.cn/'],
  },
  {
    name: '人社部-社保保险',
    url: 'https://www.mohrss.gov.cn/SYrlzyhshbzb/shehuibaoxian/',
    category: 'social-insurance',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mohrss.gov.cn',
    keywords: ['社保', '医保', '缴费', '保障', '调整', '工伤', '失业', '生育'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://www.mohrss.gov.cn/SYrlzyhshbzb/', 'https://www.mohrss.gov.cn/'],
  },
  {
    name: '教育部-新闻通气',
    url: 'http://www.moe.gov.cn/jyb_xwfb/xw_fb/moe_1911/',
    category: 'education',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.moe.gov.cn',
    keywords: ['教育', '高考', '招生', '助学', '义务', '学前', '考研', '政策', '补贴', '双减', '学位', '毕业', '考试'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['http://www.moe.gov.cn/jyb_xxgk/', 'http://www.moe.gov.cn/'],
  },
  {
    name: '教育部-政策法规',
    url: 'http://www.moe.gov.cn/s78/A02/',
    category: 'education',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.moe.gov.cn',
    keywords: ['教育', '高考', '招生', '助学', '义务', '学前', '考研', '政策', '双减', '幼儿园', '学位', '毕业', '考试', '培训'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['http://www.moe.gov.cn/'],
  },
  {
    name: '陕西省人社厅-社保服务',
    url: 'https://rst.shaanxi.gov.cn/shbx/',
    category: 'social-insurance',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://rst.shaanxi.gov.cn',
    keywords: ['社保', '医保', '缴费', '保障', '调整', '养老金', '退休'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://rst.shaanxi.gov.cn/'],
  },
  {
    name: '陕西省人社厅-养老保险',
    url: 'https://rst.shaanxi.gov.cn/ylbx/',
    category: 'pension',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://rst.shaanxi.gov.cn',
    keywords: ['养老金', '退休', '养老', '保障', '调整', '补贴'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://rst.shaanxi.gov.cn/'],
  },
  {
    name: '国家医保局-药品目录',
    url: 'http://www.nhsa.gov.cn/col/col23/index.html',
    category: 'medical',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.nhsa.gov.cn',
    keywords: ['医保', '药品', '报销', '目录', '保障', '调整', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '住建部-住房公积金',
    url: 'https://www.mohurd.gov.cn/gongkai/zhuantizhuanlan/gjjj/',
    category: 'housing',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.mohurd.gov.cn',
    keywords: ['公积金', '住房', '贷款', '缴存', '提取', '保障', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://www.mohurd.gov.cn/'],
  },
  // ===== 第四批：补充到200+ =====
  {
    name: '中国政府网-国务院令',
    url: 'https://www.gov.cn/zhengce/content/zuixin/',
    category: 'gov-policy',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.gov.cn',
    keywords: ['政策', '条例', '规定', '办法', '保障', '补贴', '调整'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '国家税务总局-增值税',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810755/c10157/index.html',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.chinatax.gov.cn',
    keywords: ['增值税', '税', '扣除', '减免', '优惠', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '印花税票'],
    minTitleLength: 8,
  },
  {
    name: '国家税务总局-所得税',
    url: 'https://www.chinatax.gov.cn/chinatax/n810341/n810755/c10158/index.html',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.chinatax.gov.cn',
    keywords: ['所得税', '个税', '扣除', '减免', '优惠', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '印花税票'],
    minTitleLength: 8,
  },
  {
    name: '财政部-综合政策',
    url: 'https://www.mof.gov.cn/zhengwuxinxi/zonghexinxi/',
    category: 'tax',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.mof.gov.cn',
    keywords: ['税', '扣除', '减免', '优惠', '财政', '补贴', '政策', '调整', '保障'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '民政部-社会救助',
    url: 'https://www.mca.gov.cn/article/zwfg/',
    category: 'elderly',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.mca.gov.cn',
    keywords: ['养老', '补贴', '保障', '高龄', '护理', '政策', '救助', '低保'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '民政部-社会福利',
    url: 'https://www.mca.gov.cn/article/shfl/',
    category: 'elderly',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.mca.gov.cn',
    keywords: ['养老', '补贴', '保障', '高龄', '护理', '政策', '福利'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '住建部-住房保障',
    url: 'https://www.mohurd.gov.cn/gongkai/zhuantizhuanlan/zfbz/',
    category: 'housing',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'https://www.mohurd.gov.cn',
    keywords: ['住房', '保障', '租赁', '补贴', '政策', '公租房', '廉租房'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://www.mohurd.gov.cn/'],
  },
  {
    name: '陕西省人社厅-就业创业',
    url: 'https://rst.shaanxi.gov.cn/jycy/',
    category: 'employment',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://rst.shaanxi.gov.cn',
    keywords: ['就业', '补贴', '保障', '创业', '政策', '调整', '培训', '见习', '招聘', '人才', '应届', '校招'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://rst.shaanxi.gov.cn/'],
  },
  {
    name: '国家医保局-医保改革',
    url: 'http://www.nhsa.gov.cn/col/col24/index.html',
    category: 'medical',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.nhsa.gov.cn',
    keywords: ['医保', '改革', '报销', '门诊', '住院', '保障', '调整', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
  },
  {
    name: '中国政府网-民生政策',
    url: 'https://www.gov.cn/zhengce/content/minsheng/',
    category: 'gov-policy',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.gov.cn',
    keywords: ['民生', '社保', '医保', '住房', '教育', '养老', '补贴', '保障', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://www.gov.cn/zhengce/'],
  },
  // ===== 第五批：教育升学+就业创业专项 =====
  {
    name: '人社部-就业促进',
    url: 'https://www.mohrss.gov.cn/SYrlzyhshbzb/jycjs/',
    category: 'employment',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mohrss.gov.cn',
    keywords: ['就业', '创业', '补贴', '培训', '见习', '招聘', '人才', '应届', '政策', '保障', '扶持'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://www.mohrss.gov.cn/SYrlzyhshbzb/', 'https://www.mohrss.gov.cn/'],
  },
  {
    name: '人社部-高校毕业生就业',
    url: 'https://www.mohrss.gov.cn/SYrlzyhshbzb/kaoshi/',
    category: 'employment',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mohrss.gov.cn',
    keywords: ['毕业', '就业', '应届', '校招', '见习', '补贴', '创业', '政策', '三支一扶', '西部计划', '特岗', '选调'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://www.mohrss.gov.cn/SYrlzyhshbzb/', 'https://www.mohrss.gov.cn/'],
  },
  {
    name: '教育部-高校学生司',
    url: 'http://www.moe.gov.cn/s78/A15/',
    category: 'education',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.moe.gov.cn',
    keywords: ['高考', '招生', '录取', '考研', '保送', '加分', '学位', '毕业', '助学', '奖学金', '贷款', '政策'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['http://www.moe.gov.cn/'],
  },
  {
    name: '教育部-职业教育',
    url: 'http://www.moe.gov.cn/s78/A07/',
    category: 'education',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time', link: 'a' },
    baseUrl: 'http://www.moe.gov.cn',
    keywords: ['职业', '技能', '培训', '资格证', '中职', '高职', '技校', '政策', '补贴', '人才'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['http://www.moe.gov.cn/'],
  },
  {
    name: '中国政府网-就业政策',
    url: 'https://www.gov.cn/zhengce/content/jiuye/',
    category: 'employment',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.gov.cn',
    keywords: ['就业', '创业', '补贴', '培训', '见习', '招聘', '人才', '应届', '政策', '保障', '扶持', '毕业'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://www.gov.cn/zhengce/'],
  },
  {
    name: '人社部-人才流动',
    url: 'https://www.mohrss.gov.cn/SYrlzyhshbzb/rencailiudong/',
    category: 'employment',
    selectors: { list: '.list li, .news-list li, .content-list li, ul.list li, .info-list li, .article-list li, .fl li', title: 'a', date: 'span, .date, .time, em', link: 'a' },
    baseUrl: 'https://www.mohrss.gov.cn',
    keywords: ['人才', '就业', '创业', '补贴', '政策', '引进', '落户', '扶持'],
    excludeKeywords: ['登录', '注册', '搜索', '导航', '首页', '联系我们', '网站地图'],
    minTitleLength: 8,
    fallbackUrls: ['https://www.mohrss.gov.cn/SYrlzyhshbzb/', 'https://www.mohrss.gov.cn/'],
  },
]

function buildUrl(href: string, baseUrl: string): string {
  if (!href) return baseUrl
  // 清理换行符和多余空白
  href = href.replace(/[\r\n]/g, '').trim()
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
  // 栏目分类名称（如"国家谈判药品落地与医保支付方式改革"是栏目名不是政策）
  if (/^(国家谈判|药品和耗材|药品目录|医疗服务价格|定点|目录)/.test(title) && title.length < 20) return false
  // 非政策内容：新闻/会议/人事/招聘/活动/图片报道
  if (/^(组图|图解|一图读懂|视频|海报|H5)/.test(title)) return false
  if (/会[议見]在京召开|座谈会|推进会|部署会|调度会|视频会/.test(title) && title.length < 30) return false
  if (/会见|接见|调研|考察|慰问|出访/.test(title) && /局长|部长|司长|主任|代表/.test(title)) return false
  if (/拟聘用|招聘|录用|笔试|面试|选拔/.test(title)) return false
  if (/大讲堂|活动周|宣传月|竞赛|比赛|技能大赛/.test(title) && !/政策|补贴|标准/.test(title)) return false
  if (/新闻发布会|记者会/.test(title) && !/政策|补贴|标准|调整/.test(title)) return false
  if (/学习|教育|党建|廉政|纪检|巡视|指导组/.test(title) && !/政策|补贴|标准/.test(title)) return false
  // 印花税票发行（非民生政策）
  if (/印花税票/.test(title)) return false
  // 国际税收协定（与普通纳税人无关）
  if (/协定.*生效|避免双重征税/.test(title)) return false
  // 冬奥会等已过时政策
  if (/2022年冬奥|2021年/.test(title)) return false
  // 政务公开领导小组等内部人事
  if (/政务公开领导小组|领军人才/.test(title)) return false
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
  // 排除栏目页（/col/col数字）
  if (/\/col\/col\d+/.test(href)) return false
  // 排除纯索引页
  if (/\/index\.html?$/.test(href)) return false
  // 包含具体文章标识的链接
  if (/\/t\d{6,}/.test(href)) return true
  if (/\/content[_-]?\d+/.test(href)) return true
  if (/\/art[_-]?\d+/.test(href)) return true
  if (/\/\d{4}\//.test(href)) return true
  if (/\.html?$/.test(href)) return true
  return true
}

/** 提取并规范化日期字符串 */
function normalizeDate(rawDate: string): string {
  if (!rawDate) return ''
  // 尝试多种日期格式匹配
  // 格式1: 2026-05-20 或 2026/05/20
  const ymdMatch = rawDate.match(/(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})/)
  if (ymdMatch) {
    const y = ymdMatch[1]
    const m = ymdMatch[2].padStart(2, '0')
    const d = ymdMatch[3].padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  // 格式2: 05-20 或 5月20日（无年份，用当前年份）
  const mdMatch = rawDate.match(/(\d{1,2})[-\/月](\d{1,2})/)
  if (mdMatch) {
    const y = new Date().getFullYear()
    const m = mdMatch[1].padStart(2, '0')
    const d = mdMatch[2].padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  // 格式3: 纯数字如 20260520
  const numMatch = rawDate.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (numMatch) {
    return `${numMatch[1]}-${numMatch[2]}-${numMatch[3]}`
  }
  // 无法解析，返回空
  return ''
}

/** 根据政策标题和分类生成个性化指引 */
function generateGuide(title: string, category: string, sourceName: string): string[] {
  const guides: string[] = []

  // 通用第一步
  guides.push(`阅读政策原文，了解具体内容`)

  // 根据分类给出针对性建议
  if (category === 'tax') {
    if (title.includes('扣除') || title.includes('专项')) {
      guides.push('打开个税APP → 专项附加扣除 → 填报/更新信息')
      guides.push('对照条件确认自己是否符合扣除标准')
    } else if (title.includes('减免') || title.includes('优惠')) {
      guides.push('确认自己是否符合减免/优惠条件')
      guides.push('向单位财务或税务部门咨询申请')
    } else {
      guides.push('计算新政策下自己的税负变化')
      guides.push('如有疑问拨打12366纳税服务热线')
    }
  } else if (category === 'social-insurance') {
    if (title.includes('养老金') || title.includes('退休')) {
      guides.push('查社保APP核算养老金变化')
      guides.push('确认退休时间是否受影响')
    } else if (title.includes('医保')) {
      guides.push('查医保APP看报销变化')
      guides.push('下次就医时注意报销比例调整')
    } else if (title.includes('缴费')) {
      guides.push('查工资条确认社保扣费变化')
      guides.push('确认缴费基数是否调整')
    } else {
      guides.push('查社保APP确认权益变化')
      guides.push('如有疑问拨打12333社保热线')
    }
  } else if (category === 'medical') {
    if (title.includes('药品') || title.includes('目录')) {
      guides.push('查看常用药是否纳入医保目录')
      guides.push('咨询医生是否有医保替代药品')
    } else if (title.includes('报销') || title.includes('门诊') || title.includes('住院')) {
      guides.push('了解报销比例和起付线变化')
      guides.push('下次就医时注意报销调整')
    } else if (title.includes('异地')) {
      guides.push('在医保APP备案异地就医')
      guides.push('享受跨省直接结算')
    } else {
      guides.push('了解医保政策变化对自己看病的影响')
      guides.push('查医保APP确认最新报销标准')
    }
  } else if (category === 'housing') {
    if (title.includes('公积金')) {
      guides.push('查公积金APP看贷款额度变化')
      guides.push('确认缴存比例是否调整')
    } else if (title.includes('租赁') || title.includes('租房')) {
      guides.push('查看是否符合租房补贴条件')
      guides.push('了解保障性租赁住房申请方式')
    } else if (title.includes('贷款') || title.includes('利率')) {
      guides.push('咨询银行最新房贷政策')
      guides.push('计算月供变化')
    } else {
      guides.push('了解住房政策变化对自己的影响')
      guides.push('关注当地住建部门通知')
    }
  } else if (category === 'pension') {
    guides.push('查社保APP确认养老金变化')
    guides.push('了解退休条件是否调整')
  } else if (category === 'child') {
    if (title.includes('扣除') || title.includes('专项')) {
      guides.push('个税APP → 专项附加扣除 → 子女教育/婴幼儿照护')
      guides.push('确认扣除标准和条件')
    } else {
      guides.push('了解政策对子女教育/养育的影响')
      guides.push('关注当地教育局或民政部门通知')
    }
  } else if (category === 'elderly') {
    if (title.includes('扣除') || title.includes('赡养')) {
      guides.push('个税APP → 专项附加扣除 → 赡养老人')
      guides.push('确认扣除标准和条件')
    } else {
      guides.push('了解养老补贴和护理政策变化')
      guides.push('关注当地民政部门通知')
    }
  } else if (category === 'education') {
    if (title.includes('高考') || title.includes('招生') || title.includes('录取')) {
      guides.push('关注本省教育考试院最新通知')
      guides.push('确认招生计划和录取规则变化')
    } else if (title.includes('助学') || title.includes('贷款') || title.includes('奖学金')) {
      guides.push('向学校学生资助管理中心咨询')
      guides.push('确认申请条件和额度变化')
    } else if (title.includes('考研') || title.includes('研究生') || title.includes('学位')) {
      guides.push('关注研招网和目标院校最新通知')
      guides.push('确认报考条件和招生计划变化')
    } else if (title.includes('职业') || title.includes('技能') || title.includes('培训')) {
      guides.push('了解职业培训补贴和资格证政策')
      guides.push('确认培训报名和补贴申请方式')
    } else {
      guides.push('了解教育政策变化对自己学业的影响')
      guides.push('关注学校和教育部门通知')
    }
  } else if (category === 'employment') {
    if (title.includes('创业') || title.includes('扶持')) {
      guides.push('了解创业补贴和扶持政策')
      guides.push('向当地人社部门咨询申请条件')
    } else if (title.includes('见习') || title.includes('实习')) {
      guides.push('关注就业见习岗位发布')
      guides.push('确认见习补贴申请方式')
    } else if (title.includes('补贴') || title.includes('津贴')) {
      guides.push('确认自己是否符合补贴条件')
      guides.push('向学校就业指导中心或人社部门咨询')
    } else if (title.includes('三支一扶') || title.includes('西部计划') || title.includes('特岗')) {
      guides.push('关注报名时间和条件')
      guides.push('向学校就业指导中心咨询报名')
    } else {
      guides.push('了解就业政策变化对自己求职的影响')
      guides.push('关注学校就业信息网和人社部门通知')
    }
  } else {
    guides.push('对照自身情况判断是否适用')
    guides.push('关注具体实施时间和条件')
  }

  return guides
}

/** 带重试的HTTP请求，超时30秒，最多重试2次 */
async function fetchWithRetry(url: string, retries = 2): Promise<{ data: string; status: number }> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        httpsAgent,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
        headers: {
          'User-Agent': 'BillRadarBot/1.0 (+https://save-radar-opal.vercel.app)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
      })
      return { data: typeof response.data === 'string' ? response.data : JSON.stringify(response.data), status: response.status }
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < retries) {
        // 短暂等待后重试
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }
  throw lastError!
}

/** 尝试从HTML的<script>标签中提取JSON数据 */
function extractJsonFromScripts(html: string): any[] {
  const results: any[] = []
  // 匹配 window.__INITIAL_STATE__ = {...} 或 var data = [...] 等模式
  const patterns = [
    /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});?\s*<\/script>/,
    /window\.__NUXT__\s*=\s*({[\s\S]*?});?\s*<\/script>/,
    /window\.__DATA__\s*=\s*({[\s\S]*?});?\s*<\/script>/,
    /var\s+data\s*=\s*(\[[\s\S]*?\]);?\s*<\/script>/,
    /var\s+listData\s*=\s*(\[[\s\S]*?\]);?\s*<\/script>/,
    /var\s+pageData\s*=\s*({[\s\S]*?});?\s*<\/script>/,
    /"data"\s*:\s*(\[[\s\S]*?\])\s*[,}]/,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) {
      try {
        const parsed = JSON.parse(match[1])
        results.push(parsed)
      } catch {
        // JSON解析失败，忽略
      }
    }
  }
  return results
}

/** 尝试从JSON API获取数据 */
async function tryJsonApi(baseUrl: string, originalUrl: string): Promise<any[] | null> {
  // 构造可能的API端点
  const apiUrls: string[] = []
  try {
    const urlObj = new URL(originalUrl)
    const origin = urlObj.origin
    const pathname = urlObj.pathname

    // 常见政府网站API模式
    apiUrls.push(`${origin}/api${pathname}`)
    apiUrls.push(`${origin}/api${pathname.replace(/\.html?$/, '')}`)
    apiUrls.push(`${origin}/api${pathname.replace(/\/index\.html?$/, '')}`)
    apiUrls.push(`${origin}/api/article/list`)
    apiUrls.push(`${origin}/api/policy/list`)
    apiUrls.push(`${origin}/api/v1/list`)
  } catch {
    // URL解析失败，忽略
  }

  for (const apiUrl of apiUrls) {
    try {
      const response = await axios.get(apiUrl, {
        timeout: 10000,
        httpsAgent,
        headers: {
          'User-Agent': 'BillRadarBot/1.0',
          Accept: 'application/json, text/javascript, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          Referer: originalUrl,
        },
        validateStatus: (status) => status < 400,
      })
      if (response.data && typeof response.data === 'object') {
        return Array.isArray(response.data) ? response.data : [response.data]
      }
    } catch {
      // 忽略失败的API尝试
    }
  }
  return null
}

/** 从JSON数据中提取政策条目 */
function extractFromJsonData(jsonData: any, source: GovScrapeSource): Array<{ title: string; url: string; date: string }> {
  const items: Array<{ title: string; url: string; date: string }> = []

  const extract = (obj: any) => {
    if (!obj || typeof obj !== 'object') return
    // 尝试从对象中提取标题、链接、日期
    const title = obj.title || obj.name || obj.articleTitle || obj.fileName || obj.zlmc || ''
    const url = obj.url || obj.link || obj.href || obj.articleUrl || obj.wzlj || obj.fwdt || ''
    const date = obj.date || obj.publishDate || obj.time || obj.createTime || obj.fbrq || obj.releaseTime || ''
    if (title && typeof title === 'string' && title.length >= source.minTitleLength) {
      items.push({ title, url: typeof url === 'string' ? url : '', date: typeof date === 'string' ? date : String(date) })
    }
    // 递归搜索嵌套数组
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any) => extract(item))
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        extract(obj[key])
      }
    }
  }

  if (Array.isArray(jsonData)) {
    jsonData.forEach(item => extract(item))
  } else {
    extract(jsonData)
  }

  return items.slice(0, 20)
}

/** 生成URL变体用于重试 */
function generateUrlVariants(url: string, baseUrl: string): string[] {
  const variants: string[] = []
  // 去掉 index.html
  if (/\/index\.html?$/.test(url)) {
    variants.push(url.replace(/\/index\.html?$/, '/'))
  }
  // 去掉末尾路径段
  const pathParts = url.replace(baseUrl, '').split('/').filter(Boolean)
  if (pathParts.length > 1) {
    const parentUrl = baseUrl + '/' + pathParts.slice(0, -1).join('/') + '/'
    if (parentUrl !== url) variants.push(parentUrl)
  }
  // 首页
  if (url !== baseUrl + '/' && url !== baseUrl) {
    variants.push(baseUrl + '/')
  }
  return variants
}

/** 增强的全页面链接搜索 */
function searchAllPageLinks($: cheerio.CheerioAPI, source: GovScrapeSource): Array<{ title: string; href: string; rawDate: string }> {
  const results: Array<{ title: string; href: string; rawDate: string }> = []
  const seenHrefs = new Set<string>()

  // 搜索整个页面中所有包含政策关键词的链接
  $('a').each(function () {
    if (results.length >= 20) return false
    const title = $(this).text().trim()
    const href = $(this).attr('href') || ''

    // 标题必须包含至少一个关键词
    if (!source.keywords.some(kw => title.includes(kw))) return
    // 去重
    if (seenHrefs.has(href)) return
    seenHrefs.add(href)

    // 链接应指向详情页
    const fullUrl = buildUrl(href, source.baseUrl)
    if (!isValidPolicyUrl(fullUrl)) return

    // 尝试从多个位置获取日期
    let rawDate = ''
    // 1. 兄弟元素
    const siblingDate = $(this).siblings('span, .date, .time, em, .pub-date, .list-date').first().text().trim()
    if (siblingDate) rawDate = siblingDate
    // 2. 父元素中的日期
    if (!rawDate) {
      const parentDate = $(this).parent().find('span, .date, .time, em, .pub-date, .list-date').not($(this)).first().text().trim()
      if (parentDate) rawDate = parentDate
    }
    // 3. 链接文本本身可能包含日期
    if (!rawDate) {
      const dateInText = title.match(/(\d{4}[-\/年]\d{1,2}[-\/月]\d{1,2})/)
      if (dateInText) rawDate = dateInText[1]
    }

    results.push({ title, href, rawDate })
  })

  return results
}

async function scrapeGovSource(govSource: GovScrapeSource) {
  const coupons: any[] = []

  const processItem = (title: string, href: string, rawDate: string, index: number) => {
    if (!isValidPolicyTitle(title, govSource)) return
    const fullUrl = buildUrl(href, govSource.baseUrl)
    if (!isValidPolicyUrl(fullUrl)) return

    const dateText = normalizeDate(rawDate)
    const guide = generateGuide(title, govSource.category, govSource.name)

    coupons.push({
      id: `gov-${govSource.category}-${Date.now()}-${index}`,
      title,
      carrier: 'policy',
      carrierName: govSource.name,
      discountAmount: 0,
      expirationDate: dateText || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: govSource.category,
      type: 'policy',
      guide,
      claimUrl: fullUrl,
      isHot: title.includes('调整') || title.includes('提高') || title.includes('降低') || title.includes('减免'),
      isNew: true,
      tags: ['政策', govSource.category],
      source: govSource.name,
      scrapedAt: new Date().toISOString(),
    })
  }

  // 收集所有要尝试的URL（主URL + fallbackUrls + 自动生成的变体）
  const urlsToTry: string[] = [govSource.url]
  if (govSource.fallbackUrls) {
    urlsToTry.push(...govSource.fallbackUrls)
  }
  // 自动生成URL变体
  const autoVariants = generateUrlVariants(govSource.url, govSource.baseUrl)
  for (const v of autoVariants) {
    if (!urlsToTry.includes(v)) urlsToTry.push(v)
  }

  for (const currentUrl of urlsToTry) {
    if (coupons.length > 0) break // 已经有结果，不需要继续尝试

    try {
      const { data: html } = await fetchWithRetry(currentUrl)
      const $ = cheerio.load(html)
      const items = $(govSource.selectors.list)

      // 策略1: 使用选择器匹配列表
      if (items.length > 0) {
        items.each(function (i) {
          if (i >= 20) return false
          const titleEl = $(this).find(govSource.selectors.title)
          const dateEl = $(this).find(govSource.selectors.date)
          const linkEl = $(this).find(govSource.selectors.link)
          const title = titleEl.text().trim()
          const rawDate = dateEl.text().trim()
          const href = linkEl.attr('href') || titleEl.attr('href') || ''
          processItem(title, href, rawDate, i)
        })
      }

      // 策略2: 增强的全页面链接搜索
      if (coupons.length === 0) {
        const linkResults = searchAllPageLinks($, govSource)
        for (let i = 0; i < linkResults.length; i++) {
          processItem(linkResults[i].title, linkResults[i].href, linkResults[i].rawDate, i)
        }
      }

      // 策略3: 从<script>标签中提取JSON数据
      if (coupons.length === 0) {
        const jsonDatas = extractJsonFromScripts(html)
        for (const jsonData of jsonDatas) {
          const extracted = extractFromJsonData(jsonData, govSource)
          for (let i = 0; i < extracted.length; i++) {
            processItem(extracted[i].title, extracted[i].url, extracted[i].date, i)
          }
          if (coupons.length > 0) break
        }
      }

      // 策略4: 尝试JSON API
      if (coupons.length === 0) {
        const apiData = await tryJsonApi(govSource.baseUrl, currentUrl)
        if (apiData) {
          const extracted = extractFromJsonData(apiData, govSource)
          for (let i = 0; i < extracted.length; i++) {
            processItem(extracted[i].title, extracted[i].url, extracted[i].date, i)
          }
        }
      }

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`[Scraper] 抓取 ${govSource.name} (${currentUrl}) 失败:`, msg)
    }
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
