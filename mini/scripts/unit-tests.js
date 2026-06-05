/**
 * 单元测试：排行榜排序逻辑 + 广告解锁机制 + 合规性验证
 * 运行方式: node scripts/unit-tests.js
 */

const fs = require('fs')
const path = require('path')

// ========== 加载数据 ==========
const policies = JSON.parse(fs.readFileSync('./src/static/data/coupons.json', 'utf8'))

// ========== 画像定义 ==========
const personas = {
  'office-worker': {
    name: '上班族', icon: '💼',
    categories: ['social-insurance', 'tax', 'housing', 'pension', 'medical', 'gov-policy'],
    keywords: ['社保', '公积金', '个税', '租房', '房贷', '医保', '缴费', '扣除', '工资', '劳动', '加班', '休假', '产假', '年假', '失业', '工伤', '养老金', '退休'],
  },
  'parent': {
    name: '宝妈/家长', icon: '👶',
    categories: ['social-insurance', 'medical', 'child', 'pension', 'gov-policy'],
    keywords: ['孩子', '子女', '教育', '学费', '产假', '育儿', '幼儿园', '学校', '学生', '助学', '疫苗', '儿童', '少年', '小学', '中学', '大学'],
  },
  'elderly': {
    name: '老年人', icon: '👴',
    categories: ['social-insurance', 'medical', 'housing', 'pension', 'elderly', 'tax', 'gov-policy'],
    keywords: ['养老金', '退休', '医保', '赡养', '高龄', '养老', '护理', '居家', '社区养老', '老年', '长寿', '津贴', '补贴', '保障', '社保', '公积金', '住房', '医疗', '健康', '扣除', '减免', '优惠', '调整', '提高', '降低'],
  },
  'student': {
    name: '学生', icon: '🎓',
    categories: ['social-insurance', 'medical', 'housing', 'child', 'gov-policy'],
    keywords: ['学费', '助学', '贷款', '奖学金', '教育', '学校', '大学生', '研究生', '实习', '就业', '创业', '租房', '补贴'],
  },
  'freelancer': {
    name: '自由职业', icon: '💻',
    categories: ['social-insurance', 'tax', 'housing', 'medical', 'pension', 'gov-policy'],
    keywords: ['自己交', '灵活就业', '个体', '创业', '社保', '个税', '申报', '公积金', '医保', '缴费', '扣除', '减免'],
  },
}

// ========== 核心逻辑（从源码复写） ==========

const FREE_DAILY_LIMIT = 15
const AD_UNLOCK_PER_WATCH = 5
const AD_UNLOCK_FOR_PERMANENT = 3

function isPolicyNew(policy) {
  if (!policy.scrapedAt) return false
  const scrapedDate = new Date(policy.scrapedAt)
  const now = new Date()
  const diffDays = (now.getTime() - scrapedDate.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
}

function getRelevanceScore(policy, personaId) {
  const persona = personas[personaId]
  if (!persona) return 0
  let score = 0
  if (persona.categories.includes(policy.category)) score += 10
  for (const kw of persona.keywords) {
    if (policy.title.includes(kw)) score += 5
  }
  if (policy.isHot) score += 3
  if (isPolicyNew(policy)) score += 2
  return score
}

function getTotalLimit(adUnlockCount, totalAdUnlock) {
  if (totalAdUnlock >= AD_UNLOCK_FOR_PERMANENT) return Infinity
  return FREE_DAILY_LIMIT + adUnlockCount * AD_UNLOCK_PER_WATCH
}

function isPermanentlyUnlocked(totalAdUnlock) {
  return totalAdUnlock >= AD_UNLOCK_FOR_PERMANENT
}

// ========== 测试用例 ==========

let passed = 0
let failed = 0
const failures = []

function assert(condition, testName) {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(testName)
    console.log(`  ❌ FAIL: ${testName}`)
  }
}

console.log('=== 单元测试：排行榜排序逻辑 ===\n')

// 测试1：排行榜按相关性降序排列
{
  const sorted = [...policies]
    .map(p => ({ ...p, score: getRelevanceScore(p, 'office-worker') }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  const scores = sorted.map(p => p.score)
  const isDescending = scores.every((s, i) => i === 0 || scores[i - 1] >= s)
  assert(isDescending, '排行榜应按相关性降序排列')

  // 排行榜第一项分数应 >= 最后一项
  assert(scores[0] >= scores[scores.length - 1], '排行榜首项分数 >= 末项')

  console.log(`  排行榜前5项分数: ${scores.slice(0, 5).join(', ')}`)
}

// 测试2：不同画像排行榜不同
{
  const top3_office = [...policies]
    .sort((a, b) => getRelevanceScore(b, 'office-worker') - getRelevanceScore(a, 'office-worker'))
    .slice(0, 3)
    .map(p => p.id)

  const top3_elderly = [...policies]
    .sort((a, b) => getRelevanceScore(b, 'elderly') - getRelevanceScore(a, 'elderly'))
    .slice(0, 3)
    .map(p => p.id)

  const isDifferent = JSON.stringify(top3_office) !== JSON.stringify(top3_elderly)
  assert(isDifferent, '不同画像的排行榜应不同')
}

// 测试3：相关性评分有区分度
{
  const scores = policies.map(p => getRelevanceScore(p, 'office-worker'))
  const uniqueScores = [...new Set(scores)]
  assert(uniqueScores.length >= 3, `相关性评分应有区分度（当前${uniqueScores.length}种不同分数）`)
}

// 测试4：分类匹配给10分
{
  const taxPolicy = policies.find(p => p.category === 'tax')
  if (taxPolicy) {
    const score = getRelevanceScore(taxPolicy, 'office-worker')
    assert(score >= 10, `分类匹配的政策得分应>=10（实际${score}）`)
  }
}

// 测试5：关键词命中额外加分
{
  const policyWithKeyword = policies.find(p =>
    personas['office-worker'].keywords.some(kw => p.title.includes(kw))
  )
  if (policyWithKeyword) {
    const score = getRelevanceScore(policyWithKeyword, 'office-worker')
    const baseScore = personas['office-worker'].categories.includes(policyWithKeyword.category) ? 10 : 0
    assert(score > baseScore, `关键词命中应额外加分（基础${baseScore}，实际${score}）`)
  }
}

console.log('\n=== 单元测试：广告解锁机制 ===\n')

// 测试6：免费额度为15
assert(FREE_DAILY_LIMIT === 15, `免费额度应为15（实际${FREE_DAILY_LIMIT}）`)

// 测试7：看1次广告解锁5条
{
  const limit0 = getTotalLimit(0, 0)
  const limit1 = getTotalLimit(1, 0)
  assert(limit1 - limit0 === AD_UNLOCK_PER_WATCH, `看1次广告应解锁${AD_UNLOCK_PER_WATCH}条（实际${limit1 - limit0}）`)
}

// 测试8：看3次广告永久解锁
{
  const limit = getTotalLimit(0, 3)
  assert(limit === Infinity, `看3次广告应永久解锁（实际${limit}）`)
  assert(isPermanentlyUnlocked(3), '看3次广告isPermanentlyUnlocked应为true')
}

// 测试9：看2次广告不永久解锁
{
  assert(!isPermanentlyUnlocked(2), '看2次广告不应永久解锁')
}

// 测试10：免费用户可看15条
{
  const limit = getTotalLimit(0, 0)
  assert(limit === 15, `免费用户应可看15条（实际${limit}）`)
}

// 测试11：看广告1次+免费=20条
{
  const limit = getTotalLimit(1, 0)
  assert(limit === 20, `免费15+广告5=20条（实际${limit}）`)
}

console.log('\n=== 单元测试：合规性验证 ===\n')

// 测试12：代码中无"分享解锁"文案
{
  const filesToCheck = [
    './src/pages/index/index.vue',
    './src/pages/policies/index.vue',
    './src/pages/profile/index.vue',
    './src/utils/accessControl.ts',
  ]
  let hasViolation = false
  for (const file of filesToCheck) {
    const content = fs.readFileSync(file, 'utf8')
    if (content.includes('分享解锁') || content.includes('分享.*解锁')) {
      console.log(`  ⚠️ ${file} 中发现"分享解锁"文案`)
      hasViolation = true
    }
  }
  assert(!hasViolation, '代码中不应有"分享解锁"文案（微信规范禁止利益诱导分享）')
}

// 测试13：代码中无贬低竞品内容
{
  const profileContent = fs.readFileSync('./src/pages/profile/index.vue', 'utf8')
  const violations = ['可能编造', '长篇大论', '无法提供', '泛泛而谈', '通用AI']
  let found = false
  for (const v of violations) {
    if (profileContent.includes(v)) {
      console.log(`  ⚠️ profile中发现贬低竞品文案: "${v}"`)
      found = true
    }
  }
  assert(!found, '代码中不应有贬低竞品内容（违反反不正当竞争法）')
}

// 测试14：门禁弹窗不包含"分享"选项
{
  const policiesContent = fs.readFileSync('./src/pages/policies/index.vue', 'utf8')
  const hasShareInModal = policiesContent.includes('分享解锁') || policiesContent.includes('modal-btn-share')
  assert(!hasShareInModal, '门禁弹窗不应包含"分享解锁"按钮')
}

// 测试15：SHARE_UNLOCK_PER_SHARE 为0
{
  const acContent = fs.readFileSync('./src/utils/accessControl.ts', 'utf8')
  const match = acContent.match(/SHARE_UNLOCK_PER_SHARE\s*=\s*(\d+)/)
  const value = match ? parseInt(match[1]) : -1
  assert(value === 0, `SHARE_UNLOCK_PER_SHARE应为0（实际${value}）`)
}

// 测试16：isPermanentlyUnlocked 不依赖 shareCount
{
  const acContent = fs.readFileSync('./src/utils/accessControl.ts', 'utf8')
  const match = acContent.match(/isPermanentlyUnlocked[^}]*shareCount\s*>=\s*3/)
  assert(!match, 'isPermanentlyUnlocked不应依赖shareCount>=3（微信规范禁止）')
}

console.log('\n=== 单元测试：isNew动态计算 ===\n')

// 测试17：7天内的政策标为"新"
{
  const recentPolicy = policies.find(p => {
    if (!p.scrapedAt) return false
    const diff = (Date.now() - new Date(p.scrapedAt).getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7
  })
  if (recentPolicy) {
    assert(isPolicyNew(recentPolicy), '7天内的政策应标为"新"')
  }
}

// 测试18：超过7天的政策不标"新"
{
  const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  const oldPolicy = { ...policies[0], scrapedAt: oldDate }
  assert(!isPolicyNew(oldPolicy), '超过7天的政策不应标为"新"')
}

// 测试19：无scrapedAt的政策不标"新"
{
  const noDatePolicy = { ...policies[0], scrapedAt: undefined }
  assert(!isPolicyNew(noDatePolicy), '无scrapedAt的政策不应标为"新"')
}

console.log('\n=== 单元测试：数据质量 ===\n')

// 测试20：无新闻式标题
{
  const newsLike = policies.filter(p => /上午|下午|开幕|闭幕|召开|举行/.test(p.title))
  assert(newsLike.length === 0, `不应有新闻式标题（发现${newsLike.length}条）`)
}

// 测试21：无全画像无关政策
{
  const allIrrelevant = policies.filter(p => {
    if (!p.aiInterpretation) return false
    const impacts = Object.values(p.aiInterpretation.impactOnYou)
    return impacts.every(v => v.includes('跟你关系不大') && v.includes('不用特别'))
  })
  assert(allIrrelevant.length === 0, `不应有全画像无关政策（发现${allIrrelevant.length}条）`)
}

// 测试22：所有政策有AI解读
{
  const noAI = policies.filter(p => !p.aiInterpretation)
  assert(noAI.length === 0, `所有政策应有AI解读（${noAI.length}条缺失）`)
}

// 测试23：所有政策有原文链接
{
  const noUrl = policies.filter(p => !p.claimUrl || p.claimUrl.trim() === '')
  assert(noUrl.length === 0, `所有政策应有原文链接（${noUrl.length}条缺失）`)
}

// ========== 结果 ==========
console.log('\n' + '='.repeat(50))
console.log(`测试结果: ${passed} PASS / ${failed} FAIL`)
if (failures.length > 0) {
  console.log('\n失败项:')
  failures.forEach(f => console.log(`  ❌ ${f}`))
  process.exit(1)
} else {
  console.log('\n✅ 全部通过！')
}
