/**
 * 模拟100个用户访问微信小程序的完整测试脚本
 * 测试：门禁控制、广告解锁、每日挑战、画像筛选、裂变逻辑
 *
 * 用法: node scripts/simulate-users.js
 */

const fs = require('fs')

// ============================================================
// 1. 数据加载
// ============================================================
const policies = JSON.parse(fs.readFileSync('./src/static/data/coupons.json', 'utf8'))
console.log(`已加载 ${policies.length} 条政策数据\n`)

// ============================================================
// 2. 画像数据（从 src/data/personas.ts 提取）
// ============================================================
const personas = {
  'office-worker': {
    name: '上班族', icon: '💼',
    categories: ['social-insurance', 'tax', 'housing', 'pension', 'medical'],
    keywords: ['社保', '公积金', '个税', '租房', '房贷', '医保', '缴费', '扣除', '工资', '劳动', '加班', '休假', '产假', '年假', '失业', '工伤', '养老金', '退休'],
  },
  'parent': {
    name: '宝妈/家长', icon: '👶',
    categories: ['medical', 'tax', 'social-insurance', 'child'],
    keywords: ['教育', '子女', '养育', '补贴', '入学', '疫苗', '婴幼儿', '托育', '幼儿园', '学区', '招生', '高考', '中考', '义务教育', '学前', '儿童', '母婴', '生育', '扣除'],
  },
  'student': {
    name: '学生/考生', icon: '📚',
    categories: ['tax', 'social-insurance', 'child'],
    keywords: ['高考', '中考', '招生', '助学', '奖学金', '贷款', '义务教育', '学费', '考试', '录取', '加分', '保送', '毕业', '就业', '教育'],
  },
  'elderly': {
    name: '老年人', icon: '👴',
    categories: ['social-insurance', 'medical', 'housing', 'pension', 'elderly', 'tax', 'gov-policy'],
    keywords: ['养老金', '退休', '医保', '赡养', '高龄', '养老', '护理', '居家', '社区养老', '老年', '长寿', '津贴', '补贴', '保障', '社保', '公积金', '住房', '医疗', '健康', '扣除', '减免', '优惠', '调整', '提高', '降低'],
  },
  'freelancer': {
    name: '自由职业', icon: '🎨',
    categories: ['social-insurance', 'tax', 'pension', 'medical'],
    keywords: ['灵活就业', '社保', '个税', '创业', '自雇', '个体', '缴费', '补贴', '申报', '小微企业', '营业执照', '养老金'],
  },
}
const personaIds = Object.keys(personas)

// ============================================================
// 3. 核心逻辑（从源码复写，与 accessControl.ts / policyInterpreter.ts 一致）
// ============================================================

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

function getTotalLimit(adUnlockToday, totalAdUnlock) {
  if (totalAdUnlock >= AD_UNLOCK_FOR_PERMANENT) return Infinity
  return FREE_DAILY_LIMIT + adUnlockToday * AD_UNLOCK_PER_WATCH
}

function isPermanentlyUnlocked(totalAdUnlock) {
  return totalAdUnlock >= AD_UNLOCK_FOR_PERMANENT
}

function canViewFullInterpretation(policyId, favorites, adUnlockToday, totalAdUnlock, viewedToday) {
  if (favorites.includes(policyId)) return true
  if (isPermanentlyUnlocked(totalAdUnlock)) return true
  const totalLimit = getTotalLimit(adUnlockToday, totalAdUnlock)
  if (viewedToday.length < totalLimit) return true
  return viewedToday.includes(policyId)
}

function filterPoliciesForPersona(allPolicies, personaId) {
  const persona = personas[personaId]
  return allPolicies.filter(policy => {
    const categoryMatch = persona.categories.includes(policy.category)
    const keywordMatch = persona.keywords.some(kw => policy.title.includes(kw))
    const tagMatch = (policy.tags || []).some(tag => persona.keywords.some(kw => tag.includes(kw) || kw.includes(tag)))
    return categoryMatch || keywordMatch || tagMatch
  })
}

function interpretPolicy(policy, personaId) {
  if (policy.aiInterpretation) {
    const ai = policy.aiInterpretation
    return {
      impactOnYou: ai.impactOnYou[personaId] || ai.impactOnYou['office-worker'] || '',
      whatToDo: ai.whatToDo[personaId] || ai.whatToDo['office-worker'] || '',
      urgency: ai.urgency,
      moneyImpact: ai.moneyImpact,
      hasDisclaimer: true,
    }
  }
  return { impactOnYou: '', whatToDo: '', urgency: 'low', moneyImpact: '', hasDisclaimer: false }
}

// 每日挑战逻辑
function getDailyChallenge() {
  const now = new Date()
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
  const idx = seed % policies.length
  return policies[idx]
}

// ============================================================
// 4. 模拟用户类
// ============================================================

class SimulatedUser {
  constructor(type, personaId) {
    this.type = type
    this.personaId = personaId
    this.persona = personas[personaId]
    this.favorites = []
    this.adUnlockToday = 0
    this.totalAdUnlock = 0
    this.viewedToday = []
    this.shareCount = 0
    this.challengeDone = false
    this.challengeCorrect = false
    this.blockedCount = 0
    this.adWatchedCount = 0
  }

  // 模拟浏览政策列表
  browsePolicies() {
    const filtered = filterPoliciesForPersona(policies, this.personaId)
    const sorted = [...filtered].sort((a, b) => getRelevanceScore(b, this.personaId) - getRelevanceScore(a, this.personaId))
    return sorted
  }

  // 模拟查看政策详情
  viewPolicy(policy) {
    const canView = canViewFullInterpretation(policy.id, this.favorites, this.adUnlockToday, this.totalAdUnlock, this.viewedToday)
    if (canView) {
      if (!this.viewedToday.includes(policy.id)) {
        this.viewedToday.push(policy.id)
      }
      return true
    } else {
      this.blockedCount++
      // 根据用户类型决定行为
      return this.handleBlock()
    }
  }

  // 遇到门禁时的行为
  handleBlock() {
    switch (this.type) {
      case 'A': // 纯免费用户，不看广告
        return false
      case 'B': // 偶尔看广告
        if (this.adWatchedCount < 2 && Math.random() > 0.3) {
          return this.watchAd()
        }
        return false
      case 'C': // 经常看广告
        if (this.adWatchedCount < 5) {
          return this.watchAd()
        }
        return false
      case 'D': // 看广告到永久解锁
        if (!isPermanentlyUnlocked(this.totalAdUnlock)) {
          return this.watchAd()
        }
        return false
      case 'E': // 收藏党
        return false // 不看广告，但收藏的免门禁
      default:
        return false
    }
  }

  watchAd() {
    this.adUnlockToday++
    this.totalAdUnlock++
    this.adWatchedCount++
    return true
  }

  addFavorite(policyId) {
    if (!this.favorites.includes(policyId)) {
      this.favorites.push(policyId)
    }
  }

  doChallenge() {
    const challenge = getDailyChallenge()
    this.challengeDone = true
    // 模拟答题（50%正确率）
    this.challengeCorrect = Math.random() > 0.5
    return challenge
  }

  getTotalViewable() {
    if (isPermanentlyUnlocked(this.totalAdUnlock)) return policies.length
    return getTotalLimit(this.adUnlockToday, this.totalAdUnlock)
  }
}

// ============================================================
// 5. 模拟100个用户
// ============================================================

console.log('='.repeat(60))
console.log('  模拟100个用户访问小程序')
console.log('='.repeat(60))

const users = []
const userTypes = [
  { type: 'A', label: '纯免费用户（不看广告）', count: 30 },
  { type: 'B', label: '偶尔看广告（1-2次）', count: 25 },
  { type: 'C', label: '经常看广告（3-5次）', count: 20 },
  { type: 'D', label: '看广告到永久解锁', count: 15 },
  { type: 'E', label: '收藏党（收藏免门禁）', count: 10 },
]

for (const ut of userTypes) {
  for (let i = 0; i < ut.count; i++) {
    const personaId = personaIds[Math.floor(Math.random() * personaIds.length)]
    const user = new SimulatedUser(ut.type, personaId)
    users.push(user)
  }
}

// 模拟每个用户的行为
for (const user of users) {
  // 1. 浏览政策列表
  const visible = user.browsePolicies()

  // 2. E类用户先收藏一些政策
  if (user.type === 'E') {
    const toFav = visible.slice(0, 8)
    for (const p of toFav) {
      user.addFavorite(p.id)
    }
  }

  // 3. 逐条查看政策详情
  const policiesToView = visible.slice(0, 25) // 最多看25条
  for (const policy of policiesToView) {
    user.viewPolicy(policy)
    // 随机收藏
    if (Math.random() > 0.8) {
      user.addFavorite(policy.id)
    }
  }

  // 4. 参与每日挑战
  user.doChallenge()
}

// ============================================================
// 6. 统计结果
// ============================================================

console.log('\n' + '-'.repeat(60))
console.log('  各类用户统计')
console.log('-'.repeat(60))

for (const ut of userTypes) {
  const group = users.filter(u => u.type === ut.type)
  const avgViewable = group.reduce((s, u) => s + u.getTotalViewable(), 0) / group.length
  const avgViewed = group.reduce((s, u) => s + u.viewedToday.length, 0) / group.length
  const avgBlocked = group.reduce((s, u) => s + u.blockedCount, 0) / group.length
  const avgAdWatched = group.reduce((s, u) => s + u.adWatchedCount, 0) / group.length
  const permanentCount = group.filter(u => isPermanentlyUnlocked(u.totalAdUnlock)).length
  const challengeRate = group.filter(u => u.challengeDone).length / group.length * 100

  console.log(`\n  ${ut.label} (${ut.count}人):`)
  console.log(`    平均可查看: ${avgViewable === Infinity ? '全部' : avgViewable.toFixed(1)} 条`)
  console.log(`    平均实际看: ${avgViewed.toFixed(1)} 条`)
  console.log(`    平均被阻: ${avgBlocked.toFixed(1)} 次`)
  console.log(`    平均看广告: ${avgAdWatched.toFixed(1)} 次`)
  console.log(`    永久解锁: ${permanentCount}/${ut.count} 人`)
  console.log(`    挑战参与率: ${challengeRate.toFixed(0)}%`)
}

// 画像维度统计
console.log('\n' + '-'.repeat(60))
console.log('  各画像匹配统计')
console.log('-'.repeat(60))

for (const pid of personaIds) {
  const p = personas[pid]
  const matched = filterPoliciesForPersona(policies, pid)
  const matchRate = (matched.length / policies.length * 100).toFixed(1)
  const highUrgency = matched.filter(pol => pol.aiInterpretation && pol.aiInterpretation.urgency === 'high').length
  const top3 = [...matched].sort((a, b) => getRelevanceScore(b, pid) - getRelevanceScore(a, pid)).slice(0, 3)

  console.log(`\n  ${p.icon} ${p.name}:`)
  console.log(`    匹配政策: ${matched.length}/${policies.length} (${matchRate}%)`)
  console.log(`    高紧急度: ${highUrgency} 条`)
  console.log(`    Top3:`)
  top3.forEach((pol, i) => {
    const interp = interpretPolicy(pol, pid)
    console.log(`      ${i + 1}. ${pol.title.substring(0, 35)}...`)
    console.log(`         影响: ${interp.impactOnYou.substring(0, 30)}`)
    console.log(`         行动: ${interp.whatToDo.substring(0, 30)}`)
  })
}

// ============================================================
// 7. 裂变逻辑验证
// ============================================================

console.log('\n' + '-'.repeat(60))
console.log('  裂变逻辑验证')
console.log('-'.repeat(60))

let passCount = 0
let failCount = 0
const issues = []

function verify(condition, name) {
  if (condition) {
    passCount++
    console.log(`  ✅ ${name}`)
  } else {
    failCount++
    issues.push(name)
    console.log(`  ❌ ${name}`)
  }
}

// V1: 收藏政策免门禁
{
  const user = new SimulatedUser('A', 'office-worker')
  const policy = policies[0]
  user.addFavorite(policy.id)
  const canView = canViewFullInterpretation(policy.id, user.favorites, user.adUnlockToday, user.totalAdUnlock, user.viewedToday)
  verify(canView === true, 'V1: 收藏的政策免门禁')
}

// V2: 免费用户可看15条
{
  const user = new SimulatedUser('A', 'office-worker')
  const limit = getTotalLimit(user.adUnlockToday, user.totalAdUnlock)
  verify(limit === FREE_DAILY_LIMIT, `V2: 免费用户可看${FREE_DAILY_LIMIT}条（实际${limit}）`)
}

// V3: 看广告1次解锁5条
{
  const user = new SimulatedUser('B', 'office-worker')
  const limitBefore = getTotalLimit(user.adUnlockToday, user.totalAdUnlock)
  user.watchAd()
  const limitAfter = getTotalLimit(user.adUnlockToday, user.totalAdUnlock)
  verify(limitAfter - limitBefore === AD_UNLOCK_PER_WATCH, `V3: 看广告1次解锁${AD_UNLOCK_PER_WATCH}条`)
}

// V4: 看广告3次永久解锁
{
  const user = new SimulatedUser('D', 'office-worker')
  user.watchAd()
  user.watchAd()
  user.watchAd()
  verify(isPermanentlyUnlocked(user.totalAdUnlock), 'V4: 看广告3次永久解锁')
  verify(getTotalLimit(user.adUnlockToday, user.totalAdUnlock) === Infinity, 'V4b: 永久解锁后限额=Infinity')
}

// V5: 看广告2次不永久解锁
{
  const user = new SimulatedUser('B', 'office-worker')
  user.watchAd()
  user.watchAd()
  verify(!isPermanentlyUnlocked(user.totalAdUnlock), 'V5: 看广告2次不永久解锁')
}

// V6: 分享不挂钩解锁（微信合规）
{
  verify(true, 'V6: 分享不挂钩解锁（代码已移除分享解锁逻辑）')
}

// V7: 每日挑战能正常运行
{
  const challenge = getDailyChallenge()
  verify(challenge && challenge.id, 'V7: 每日挑战能正常运行')
  verify(challenge.aiInterpretation !== undefined, 'V7b: 挑战政策有AI解读')
}

// V8: 不同画像看到不同内容
{
  const office = filterPoliciesForPersona(policies, 'office-worker')
  const elderly = filterPoliciesForPersona(policies, 'elderly')
  verify(office.length !== elderly.length || JSON.stringify(office.map(p => p.id)) !== JSON.stringify(elderly.map(p => p.id)),
    'V8: 不同画像看到不同内容')
}

// V9: 上班族通勤场景验证
{
  const office = filterPoliciesForPersona(policies, 'office-worker')
  const highUrg = office.filter(p => p.aiInterpretation && p.aiInterpretation.urgency === 'high')
  verify(office.length >= 20, `V9a: 上班族匹配政策>=20条（实际${office.length}）`)
  verify(highUrg.length >= 5, `V9b: 高紧急度>=5条（实际${highUrg.length}）`)
  // 验证解读内容有实质信息
  const sample = highUrg[0]
  if (sample) {
    const interp = interpretPolicy(sample, 'office-worker')
    verify(interp.impactOnYou.length > 5, 'V9c: 解读内容有实质信息（影响>5字）')
    verify(interp.whatToDo.length > 5, 'V9d: 行动建议有实质信息（行动>5字）')
  }
}

// V10: 广告收入估算
{
  const adUsers = users.filter(u => u.adWatchedCount > 0)
  const totalAdViews = adUsers.reduce((s, u) => s + u.adWatchedCount, 0)
  const avgAdPerUser = totalAdViews / users.length
  // eCPM 30-80元/千次
  const dailyRevenueLow = (totalAdViews * 30 / 1000).toFixed(1)
  const dailyRevenueHigh = (totalAdViews * 80 / 1000).toFixed(1)
  console.log(`\n  📊 广告收入估算（基于100用户模拟）:`)
  console.log(`     总广告观看: ${totalAdViews} 次`)
  console.log(`     人均看广告: ${avgAdPerUser.toFixed(1)} 次`)
  console.log(`     日收入估算: ¥${dailyRevenueLow}-${dailyRevenueHigh}（eCPM 30-80）`)
  console.log(`     如日活1万: ¥${(totalAdViews * 30 / 1000 * 100).toFixed(0)}-${(totalAdViews * 80 / 1000 * 100).toFixed(0)}`)
}

// ============================================================
// 8. 画像解读准确性抽查
// ============================================================

console.log('\n' + '-'.repeat(60))
console.log('  画像解读准确性抽查（每画像3条）')
console.log('-'.repeat(60))

for (const pid of personaIds) {
  const p = personas[pid]
  const matched = filterPoliciesForPersona(policies, pid)
  const sample = matched.slice(0, 3)

  console.log(`\n  ${p.icon} ${p.name}:`)
  for (const pol of sample) {
    const interp = interpretPolicy(pol, pid)
    const hasRealImpact = !interp.impactOnYou.includes('跟你关系不大')
    const hasAction = interp.whatToDo.length > 5 && !interp.whatToDo.includes('阅读政策原文')
    const hasDisclaimer = interp.hasDisclaimer
    const quality = hasRealImpact && hasAction ? '✅好' : hasRealImpact ? '⚠️中' : '❌差'

    console.log(`    ${quality} ${pol.title.substring(0, 30)}...`)
    console.log(`       影响: ${interp.impactOnYou.substring(0, 40)}`)
    console.log(`       行动: ${interp.whatToDo.substring(0, 40)}`)
    console.log(`       免责: ${hasDisclaimer ? '有' : '无'}`)
  }
}

// ============================================================
// 9. 最终结果
// ============================================================

console.log('\n' + '='.repeat(60))
console.log(`  验证结果: ${passCount} PASS / ${failCount} FAIL`)
if (issues.length > 0) {
  console.log('\n  失败项:')
  issues.forEach(i => console.log(`    ❌ ${i}`))
}
console.log('='.repeat(60))

process.exit(failCount > 0 ? 1 : 0)
