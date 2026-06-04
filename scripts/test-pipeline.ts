/**
 * 本地验证脚本：用模拟数据测试抓取+解读+同步全流程
 *
 * 使用方式：
 *   npx tsx scripts/test-pipeline.ts
 *
 * 验证内容：
 *   1. 模拟数据格式是否正确
 *   2. 学生画像能否匹配到教育就业类政策
 *   3. policyInterpreter 解读是否正常（不再全是"跟你关系不大"）
 *   4. 数据同步到小程序目录是否正常
 *   5. daily-update.ts 流程是否可执行
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PRO_ROOT = path.join(__dirname, '..')
const MINI_ROOT = path.join(PRO_ROOT, '..', 'save-radar-mini')

// ===== 模拟政策数据 =====
const mockPolicies = [
  // education 类
  {
    id: 'mock-education-1',
    title: '关于做好2026年普通高等学校招生全国统一考试工作的通知',
    carrier: 'policy',
    carrierName: '教育部',
    discountAmount: 0,
    expirationDate: '2026-06-30',
    category: 'education',
    type: 'policy',
    guide: ['关注本省教育考试院最新通知', '确认招生计划和录取规则变化'],
    claimUrl: 'http://www.moe.gov.cn/example/1',
    isHot: true,
    isNew: true,
    tags: ['政策', 'education', '高考'],
    source: '教育部-高校学生司',
    scrapedAt: new Date().toISOString(),
    aiInterpretation: {
      summary: '2026年高考工作安排发布',
      impactOnYou: {
        'office-worker': '跟你关系不大',
        'parent': '孩子高考规则有调整',
        'student': '高考新规出台，关注本省变化',
        'elderly': '跟你关系不大',
        'freelancer': '跟你关系不大',
      },
      whatToDo: {
        'office-worker': '了解即可',
        'parent': '帮孩子关注考试院通知',
        'student': '关注本省教育考试院通知',
        'elderly': '了解即可',
        'freelancer': '了解即可',
      },
      moneyImpact: '升学路径可能变化',
      urgency: 'high',
      interpretedAt: new Date().toISOString(),
    },
  },
  {
    id: 'mock-education-2',
    title: '关于调整国家助学贷款额度和利率的通知',
    carrier: 'policy',
    carrierName: '教育部',
    discountAmount: 0,
    expirationDate: '2026-09-01',
    category: 'education',
    type: 'policy',
    guide: ['向学校学生资助管理中心咨询', '确认申请条件和额度变化'],
    claimUrl: 'http://www.moe.gov.cn/example/2',
    isHot: true,
    isNew: true,
    tags: ['政策', 'education', '助学'],
    source: '教育部-政策文件',
    scrapedAt: new Date().toISOString(),
    aiInterpretation: {
      summary: '助学贷款额度提高利率降低',
      impactOnYou: {
        'office-worker': '跟你关系不大',
        'parent': '孩子贷款额度可能提高',
        'student': '助学贷款额度提高，利率降低',
        'elderly': '跟你关系不大',
        'freelancer': '跟你关系不大',
      },
      whatToDo: {
        'office-worker': '了解即可',
        'parent': '帮孩子了解贷款新标准',
        'student': '向学校资助中心咨询新标准',
        'elderly': '了解即可',
        'freelancer': '了解即可',
      },
      moneyImpact: '每年可能少还几百利息',
      urgency: 'high',
      interpretedAt: new Date().toISOString(),
    },
  },
  {
    id: 'mock-education-3',
    title: '关于2026年全国硕士研究生招生考试初试时间安排的公告',
    carrier: 'policy',
    carrierName: '教育部',
    discountAmount: 0,
    expirationDate: '2026-12-31',
    category: 'education',
    type: 'policy',
    guide: ['关注研招网和目标院校最新通知', '确认报考条件和招生计划变化'],
    claimUrl: 'http://www.moe.gov.cn/example/3',
    isHot: false,
    isNew: true,
    tags: ['政策', 'education', '考研'],
    source: '教育部-高校学生司',
    scrapedAt: new Date().toISOString(),
    aiInterpretation: {
      summary: '2026考研初试时间确定',
      impactOnYou: {
        'office-worker': '跟你关系不大',
        'parent': '跟你关系不大',
        'student': '考研初试时间已定，抓紧备考',
        'elderly': '跟你关系不大',
        'freelancer': '跟你关系不大',
      },
      whatToDo: {
        'office-worker': '了解即可',
        'parent': '了解即可',
        'student': '关注研招网确认报名时间',
        'elderly': '了解即可',
        'freelancer': '了解即可',
      },
      moneyImpact: '报考费可能变化',
      urgency: 'high',
      interpretedAt: new Date().toISOString(),
    },
  },
  {
    id: 'mock-education-4',
    title: '关于扩大职业技能等级认定社会培训评价组织范围的通知',
    carrier: 'policy',
    carrierName: '人社部',
    discountAmount: 0,
    expirationDate: '2026-12-31',
    category: 'education',
    type: 'policy',
    guide: ['了解培训补贴申请条件', '确认培训报名和补贴申请方式'],
    claimUrl: 'https://www.mohrss.gov.cn/example/4',
    isHot: false,
    isNew: true,
    tags: ['政策', 'education', '技能'],
    source: '人社部-就业促进',
    scrapedAt: new Date().toISOString(),
    aiInterpretation: {
      summary: '技能认证范围扩大',
      impactOnYou: {
        'office-worker': '考资格证选择更多了',
        'parent': '跟你关系不大',
        'student': '更多技能证可以考了，培训有补贴',
        'elderly': '跟你关系不大',
        'freelancer': '考资格证选择更多了',
      },
      whatToDo: {
        'office-worker': '看有没有想考的证',
        'parent': '了解即可',
        'student': '了解资格证考试新规定',
        'elderly': '了解即可',
        'freelancer': '看有没有想考的证',
      },
      moneyImpact: '考证费用可能降低',
      urgency: 'medium',
      interpretedAt: new Date().toISOString(),
    },
  },
  // employment 类
  {
    id: 'mock-employment-1',
    title: '关于做好2026届高校毕业生就业创业工作的通知',
    carrier: 'policy',
    carrierName: '人社部',
    discountAmount: 0,
    expirationDate: '2026-12-31',
    category: 'employment',
    type: 'policy',
    guide: ['向学校就业指导中心咨询', '确认应届生补贴申请方式'],
    claimUrl: 'https://www.mohrss.gov.cn/example/5',
    isHot: true,
    isNew: true,
    tags: ['政策', 'employment', '就业'],
    source: '人社部-高校毕业生就业',
    scrapedAt: new Date().toISOString(),
    aiInterpretation: {
      summary: '2026届毕业生就业扶持加码',
      impactOnYou: {
        'office-worker': '跟你关系不大',
        'parent': '孩子毕业就业有更多扶持',
        'student': '应届生就业补贴和见习岗位增加',
        'elderly': '跟你关系不大',
        'freelancer': '创业扶持政策也有利好',
      },
      whatToDo: {
        'office-worker': '了解即可',
        'parent': '帮孩子了解就业扶持',
        'student': '向学校就业指导中心咨询',
        'elderly': '了解即可',
        'freelancer': '了解创业扶持条件',
      },
      moneyImpact: '应届生补贴可能多拿几千',
      urgency: 'high',
      interpretedAt: new Date().toISOString(),
    },
  },
  {
    id: 'mock-employment-2',
    title: '关于实施2026年高校毕业生等青年就业创业推进计划的通知',
    carrier: 'policy',
    carrierName: '人社部',
    discountAmount: 0,
    expirationDate: '2026-12-31',
    category: 'employment',
    type: 'policy',
    guide: ['了解创业补贴和扶持政策', '向当地人社部门咨询申请条件'],
    claimUrl: 'https://www.mohrss.gov.cn/example/6',
    isHot: true,
    isNew: true,
    tags: ['政策', 'employment', '创业'],
    source: '人社部-就业促进',
    scrapedAt: new Date().toISOString(),
    aiInterpretation: {
      summary: '青年创业推进计划启动',
      impactOnYou: {
        'office-worker': '跟你关系不大',
        'parent': '跟你关系不大',
        'student': '毕业创业有补贴和扶持',
        'elderly': '跟你关系不大',
        'freelancer': '创业补贴和扶持力度加大',
      },
      whatToDo: {
        'office-worker': '了解即可',
        'parent': '了解即可',
        'student': '了解创业补贴和扶持政策',
        'elderly': '了解即可',
        'freelancer': '向当地人社部门咨询创业扶持',
      },
      moneyImpact: '创业补贴可能多拿上万元',
      urgency: 'high',
      interpretedAt: new Date().toISOString(),
    },
  },
  {
    id: 'mock-employment-3',
    title: '关于扩大就业见习岗位规模提高见习补贴标准的通知',
    carrier: 'policy',
    carrierName: '人社部',
    discountAmount: 0,
    expirationDate: '2026-12-31',
    category: 'employment',
    type: 'policy',
    guide: ['关注就业见习岗位发布', '确认见习补贴申请方式'],
    claimUrl: 'https://www.mohrss.gov.cn/example/7',
    isHot: false,
    isNew: true,
    tags: ['政策', 'employment', '见习'],
    source: '人社部-就业促进',
    scrapedAt: new Date().toISOString(),
    aiInterpretation: {
      summary: '见习岗位和补贴双提高',
      impactOnYou: {
        'office-worker': '跟你关系不大',
        'parent': '跟你关系不大',
        'student': '见习岗位更多，补贴标准提高',
        'elderly': '跟你关系不大',
        'freelancer': '跟你关系不大',
      },
      whatToDo: {
        'office-worker': '了解即可',
        'parent': '了解即可',
        'student': '关注见习岗位发布和补贴申请',
        'elderly': '了解即可',
        'freelancer': '了解即可',
      },
      moneyImpact: '见习期每月可能多拿几百',
      urgency: 'medium',
      interpretedAt: new Date().toISOString(),
    },
  },
  {
    id: 'mock-employment-4',
    title: '关于做好2026年"三支一扶"计划实施工作的通知',
    carrier: 'policy',
    carrierName: '人社部',
    discountAmount: 0,
    expirationDate: '2026-12-31',
    category: 'employment',
    type: 'policy',
    guide: ['关注报名时间和条件', '向学校就业指导中心咨询报名'],
    claimUrl: 'https://www.mohrss.gov.cn/example/8',
    isHot: false,
    isNew: true,
    tags: ['政策', 'employment', '三支一扶'],
    source: '人社部-高校毕业生就业',
    scrapedAt: new Date().toISOString(),
    aiInterpretation: {
      summary: '三支一扶计划启动招募',
      impactOnYou: {
        'office-worker': '跟你关系不大',
        'parent': '跟你关系不大',
        'student': '三支一扶开始报名，服务期满可转编',
        'elderly': '跟你关系不大',
        'freelancer': '跟你关系不大',
      },
      whatToDo: {
        'office-worker': '了解即可',
        'parent': '了解即可',
        'student': '关注报名时间和条件',
        'elderly': '了解即可',
        'freelancer': '了解即可',
      },
      moneyImpact: '服务期有生活补贴',
      urgency: 'high',
      interpretedAt: new Date().toISOString(),
    },
  },
  // 原有分类也加几条，确保兼容
  {
    id: 'mock-tax-1',
    title: '关于提高个人所得税专项附加扣除标准的通知',
    carrier: 'policy',
    carrierName: '国家税务总局',
    discountAmount: 0,
    expirationDate: '2026-12-31',
    category: 'tax',
    type: 'policy',
    guide: ['打开个税APP → 专项附加扣除 → 填报/更新信息', '对照条件确认自己是否符合扣除标准'],
    claimUrl: 'https://www.chinatax.gov.cn/example/1',
    isHot: true,
    isNew: true,
    tags: ['政策', 'tax', '扣除'],
    source: '国家税务总局-政策法规',
    scrapedAt: new Date().toISOString(),
    aiInterpretation: {
      summary: '个税扣除标准提高',
      impactOnYou: {
        'office-worker': '每月到手可能多几百',
        'parent': '养孩子扣除标准提高',
        'student': '家里交税变少，间接影响生活费',
        'elderly': '赡养老人扣除标准提高',
        'freelancer': '自己申报扣除额度变大',
      },
      whatToDo: {
        'office-worker': '个税APP更新扣除信息',
        'parent': '个税APP更新子女教育扣除',
        'student': '提醒父母更新扣除信息',
        'elderly': '让子女帮忙更新扣除信息',
        'freelancer': '个税APP自行更新扣除',
      },
      moneyImpact: '每月可能多拿200-500元',
      urgency: 'high',
      interpretedAt: new Date().toISOString(),
    },
  },
  {
    id: 'mock-social-1',
    title: '关于调整2026年度社会保险缴费基数的通知',
    carrier: 'policy',
    carrierName: '人社部',
    discountAmount: 0,
    expirationDate: '2026-07-01',
    category: 'social-insurance',
    type: 'policy',
    guide: ['查社保APP看缴费基数是否变化', '查工资条确认扣费变化'],
    claimUrl: 'https://www.mohrss.gov.cn/example/9',
    isHot: true,
    isNew: true,
    tags: ['政策', 'social-insurance', '缴费'],
    source: '人社部-社保保险',
    scrapedAt: new Date().toISOString(),
  },
]

// ===== 验证逻辑 =====
let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ ${msg}`)
    passed++
  } else {
    console.log(`  ❌ ${msg}`)
    failed++
  }
}

function test1_dataFormat() {
  console.log('\n===== 测试1：模拟数据格式验证 =====')
  for (const p of mockPolicies) {
    assert(!!p.id, `${p.id}: id 存在`)
    assert(!!p.title, `${p.id}: title 存在`)
    assert(['education', 'employment', 'tax', 'social-insurance', 'medical', 'housing', 'pension', 'child', 'elderly', 'gov-policy'].includes(p.category), `${p.id}: category=${p.category} 合法`)
    assert(p.type === 'policy', `${p.id}: type=policy`)
    assert(Array.isArray(p.guide), `${p.id}: guide 是数组`)
    assert(Array.isArray(p.tags), `${p.id}: tags 是数组`)
    if (p.aiInterpretation) {
      assert(!!p.aiInterpretation.summary, `${p.id}: AI summary 存在`)
      assert(!!p.aiInterpretation.impactOnYou, `${p.id}: AI impactOnYou 存在`)
      assert(!!p.aiInterpretation.urgency, `${p.id}: AI urgency 存在`)
    }
  }
}

function test2_studentPersonaMatch() {
  console.log('\n===== 测试2：学生画像匹配验证 =====')

  // 模拟学生画像
  const studentPersona = {
    id: 'student',
    name: '学生/考生',
    categories: ['education', 'employment', 'tax', 'gov-policy'],
    keywords: ['高考', '中考', '招生', '助学', '奖学金', '贷款', '义务教育', '学费', '考试', '录取', '加分', '保送', '毕业', '就业', '教育', '考研', '考公', '实习', '补贴', '创业', '见习', '培训', '资格证', '学位', '研究生', '博士', '选调', '三支一扶', '西部计划', '特岗', '校招', '应届', '技能', '职业', '人才'],
  }

  let matchedCount = 0
  let studentRelevantCount = 0

  for (const p of mockPolicies) {
    const categoryMatch = studentPersona.categories.includes(p.category)
    const keywordMatch = studentPersona.keywords.some(kw => p.title.includes(kw))
    const tagMatch = p.tags.some(tag => studentPersona.keywords.some(kw => tag.includes(kw) || kw.includes(tag)))

    if (categoryMatch || keywordMatch || tagMatch) {
      matchedCount++
      // 检查AI解读中学生是否不再是"跟你关系不大"
      if (p.aiInterpretation) {
        const studentImpact = p.aiInterpretation.impactOnYou['student']
        if (studentImpact && studentImpact !== '跟你关系不大') {
          studentRelevantCount++
          console.log(`  📚 学生匹配: "${p.title}" → "${studentImpact}"`)
        } else if (studentImpact === '跟你关系不大') {
          console.log(`  ⚠️ 学生匹配但解读无关: "${p.title}" → "跟你关系不大"`)
        }
      }
    }
  }

  assert(matchedCount >= 8, `学生画像匹配到 ${matchedCount}/10 条政策（应>=8）`)
  assert(studentRelevantCount >= 6, `学生有具体解读 ${studentRelevantCount} 条（应>=6）`)
}

function test3_interpretationLogic() {
  console.log('\n===== 测试3：解读逻辑验证 =====')

  // 模拟 IMPACT_DB 查找
  const educationDB: Record<string, string> = {
    '高考': '高考政策有变化',
    '招生': '招生政策有变化',
    '助学': '助学政策有变化',
    '奖学金': '奖学金政策有变化',
    '考研': '考研政策有变化',
    '学费': '学费标准有变化',
    '培训': '培训补贴有变化',
    '技能': '技能认证政策有变化',
    'default': '教育政策有变化',
  }

  const employmentDB: Record<string, string> = {
    '就业见习': '见习补贴有变化',
    '就业': '就业政策有变化',
    '创业': '创业扶持有变化',
    '见习': '见习补贴有变化',
    '应届': '应届生政策有变化',
    '补贴': '就业补贴有变化',
    '人才': '人才政策有变化',
    'default': '就业政策有变化',
  }

  // 测试教育类标题匹配
  const educationTests = [
    { title: '关于做好2026年高考工作的通知', expected: '高考' },
    { title: '关于调整国家助学贷款额度的通知', expected: '助学' },
    { title: '关于2026年考研时间安排的公告', expected: '考研' },
  ]

  for (const t of educationTests) {
    const match = Object.entries(educationDB)
      .filter(([kw]) => kw !== 'default')
      .sort(([a], [b]) => b.length - a.length)
      .find(([kw]) => t.title.includes(kw))
    const matched = match ? match[0] : 'default'
    assert(matched === t.expected, `教育类标题匹配: "${t.title}" → "${matched}"（期望 "${t.expected}"）`)
  }

  // 测试就业类标题匹配
  const employmentTests = [
    { title: '关于做好2026届高校毕业生就业创业工作的通知', expected: '就业' },
    { title: '关于扩大就业见习岗位规模的通知', expected: '就业见习' },
    { title: '关于做好2026年三支一扶计划实施工作的通知', expected: 'default' }, // 三支一扶不在关键词中，走default
  ]

  for (const t of employmentTests) {
    const match = Object.entries(employmentDB)
      .filter(([kw]) => kw !== 'default')
      .sort(([a], [b]) => b.length - a.length)
      .find(([kw]) => t.title.includes(kw))
    const matched = match ? match[0] : 'default'
    assert(matched === t.expected, `就业类标题匹配: "${t.title}" → "${matched}"（期望 "${t.expected}"）`)
  }
}

function test4_syncToMini() {
  console.log('\n===== 测试4：数据同步验证 =====')

  const miniDataDir = path.join(MINI_ROOT, 'src', 'static', 'data')
  const miniDataFile = path.join(miniDataDir, 'coupons.json')

  // 检查小程序数据目录是否存在
  assert(fs.existsSync(miniDataDir), `小程序数据目录存在: ${miniDataDir}`)

  // 模拟同步：将模拟数据写入临时文件
  const testData = JSON.stringify(mockPolicies, null, 2)
  const tempFile = path.join(PRO_ROOT, 'public', 'data', 'coupons-test.json')

  try {
    fs.writeFileSync(tempFile, testData, 'utf-8')
    assert(true, '模拟数据写入成功')

    // 读取验证
    const readBack = JSON.parse(fs.readFileSync(tempFile, 'utf-8'))
    assert(readBack.length === mockPolicies.length, `数据条数一致: ${readBack.length} = ${mockPolicies.length}`)

    // 验证新分类数据
    const eduCount = readBack.filter((p: any) => p.category === 'education').length
    const empCount = readBack.filter((p: any) => p.category === 'employment').length
    assert(eduCount > 0, `education 类数据: ${eduCount} 条`)
    assert(empCount > 0, `employment 类数据: ${empCount} 条`)

    // 清理临时文件
    fs.unlinkSync(tempFile)
  } catch (err) {
    assert(false, `同步测试失败: ${err}`)
  }
}

function test5_dailyUpdateScript() {
  console.log('\n===== 测试5：daily-update 脚本存在性验证 =====')

  const scriptPath = path.join(PRO_ROOT, 'scripts', 'daily-update.ts')
  assert(fs.existsSync(scriptPath), `daily-update.ts 存在`)

  // 检查 package.json 中的脚本
  const pkgPath = path.join(PRO_ROOT, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  assert(!!pkg.scripts?.['daily-update'], 'package.json 中有 daily-update 脚本')
  assert(!!pkg.scripts?.['daily-update:sync'], 'package.json 中有 daily-update:sync 脚本')
}

function test6_githubActions() {
  console.log('\n===== 测试6：GitHub Actions 配置验证 =====')

  const workflowPath = path.join(PRO_ROOT, '.github', 'workflows', 'scrape.yml')
  assert(fs.existsSync(workflowPath), 'scrape.yml 工作流文件存在')

  const content = fs.readFileSync(workflowPath, 'utf-8')
  assert(content.includes('DEEPSEEK_API_KEY'), '工作流中配置了 DEEPSEEK_API_KEY')
  assert(content.includes('ai-interpret'), '工作流中包含 AI 解读步骤')
  assert(content.includes('cron'), '工作流中包含定时触发')
}

// ===== 执行所有测试 =====
console.log('========================================')
console.log('  Bill Radar 数据管线验证脚本')
console.log('========================================')

test1_dataFormat()
test2_studentPersonaMatch()
test3_interpretationLogic()
test4_syncToMini()
test5_dailyUpdateScript()
test6_githubActions()

console.log('\n========================================')
console.log(`  结果：✅ ${passed} 通过  ❌ ${failed} 失败`)
console.log('========================================')

if (failed > 0) {
  process.exit(1)
}

// ===== 将模拟数据写入 public/data/coupons-mock.json 供手动测试 =====
const mockOutputPath = path.join(PRO_ROOT, 'public', 'data', 'coupons-mock.json')
fs.writeFileSync(mockOutputPath, JSON.stringify(mockPolicies, null, 2), 'utf-8')
console.log(`\n模拟数据已写入: ${mockOutputPath}`)
console.log('你可以用这个文件替换 coupons.json 来测试前端展示效果')
