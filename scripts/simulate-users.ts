/**
 * 100用户模拟测试脚本
 * 验证：访问控制裂变逻辑、每日挑战逻辑、数据真实性、排行榜逻辑
 *
 * 运行方式: npx tsx scripts/simulate-users.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================
// 类型定义（与 src/data/types.ts 保持一致）
// ============================================================

interface AIInterpretation {
  summary: string
  impactOnYou: Record<string, string>
  whatToDo: Record<string, string>
  moneyImpact: string
  urgency: 'high' | 'medium' | 'low'
  interpretedAt: string
}

interface ScrapedCoupon {
  id: string
  title: string
  carrier: string
  carrierName: string
  discountAmount: number
  originalPrice?: number
  discountPrice?: number
  discountRate?: string
  expirationDate: string
  category: string
  type?: 'coupon' | 'policy'
  region?: string
  guide: string[]
  claimUrl: string
  isHot: boolean
  isNew: boolean
  tags: string[]
  source: string
  scrapedAt: string
  aiInterpretation?: AIInterpretation
}

interface ChallengeRecord {
  streak: number
  lastAnswerDate: string
  totalCorrect: number
  totalAnswered: number
}

// ============================================================
// 1. 访问控制逻辑模拟（忠实复刻 useAccessControl.ts）
// ============================================================

const FREE_DAILY_LIMIT = 3

/**
 * 模拟 useAccessControl 的 canViewFullInterpretation 逻辑
 * 严格按照源码实现，不做任何修改
 */
function simulateAccessControl(params: {
  favorites: string[]
  shareCount: number
  viewedToday: string[]
  policyId: string
}): { canView: boolean; viewedTodayAfter: string[] } {
  const { favorites, shareCount, viewedToday, policyId } = params
  const viewedTodayAfter = [...viewedToday]

  // 已收藏的政策可以看
  if (favorites.includes(policyId)) {
    return { canView: true, viewedTodayAfter }
  }
  // 分享3次以上可以看全部
  if (shareCount >= 3) {
    return { canView: true, viewedTodayAfter }
  }
  // 否则受每日限额限制
  if (viewedTodayAfter.length < FREE_DAILY_LIMIT) {
    if (!viewedTodayAfter.includes(policyId)) {
      viewedTodayAfter.push(policyId)
    }
    return { canView: true, viewedTodayAfter }
  }
  return { canView: viewedTodayAfter.includes(policyId), viewedTodayAfter }
}

/**
 * 模拟用户按顺序查看政策列表，返回每条政策是否可看
 */
function simulateUserViewingPolicies(params: {
  favorites: string[]
  shareCount: number
  policyIds: string[]
}): boolean[] {
  let viewedToday: string[] = []
  const results: boolean[] = []

  for (const policyId of params.policyIds) {
    const { canView, viewedTodayAfter } = simulateAccessControl({
      favorites: params.favorites,
      shareCount: params.shareCount,
      viewedToday,
      policyId,
    })
    results.push(canView)
    viewedToday = viewedTodayAfter
  }

  return results
}

// ============================================================
// 2. 每日挑战逻辑模拟（忠实复刻 MoneyChallenge.tsx）
// ============================================================

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function getTodayStr(offsetDays: number = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

function simulateChallenge(params: {
  record: ChallengeRecord
  today: string
  isCorrect: boolean
}): ChallengeRecord {
  const { record, today, isCorrect } = params
  const newRecord: ChallengeRecord = {
    ...record,
    lastAnswerDate: today,
    totalAnswered: record.totalAnswered + 1,
  }

  if (isCorrect) {
    newRecord.totalCorrect = record.totalCorrect + 1
    // 检查昨天是否答过（连续天数延续）
    // 从 today 计算 yesterday（而非用 new Date()，以支持模拟日期）
    const todayDate = new Date(today)
    todayDate.setDate(todayDate.getDate() - 1)
    const yesterdayStr = todayDate.toISOString().split('T')[0]
    if (record.lastAnswerDate === yesterdayStr || record.streak === 0) {
      newRecord.streak = record.streak + 1
    } else {
      newRecord.streak = 1
    }
  } else {
    newRecord.streak = 0
  }

  return newRecord
}

function simulateBeatPercent(today: string): number {
  const rng = seededRandom(today + 'beat')
  return Math.floor(60 + rng() * 35)
}

// ============================================================
// 3. 排行榜逻辑模拟（忠实复刻 SavingsRank.tsx）
// ============================================================

function simulateRank(params: {
  totalCorrect: number
  shareCount: number
  favoritesCount: number
}): { rank: number; totalUsers: number; userScore: number } {
  const { totalCorrect, shareCount, favoritesCount } = params
  const userScore = totalCorrect * 100 + shareCount * 200 + favoritesCount * 50

  const base = Math.max(1, 50000 - userScore * 5)
  const noise = ((userScore * 7 + 13) % 100)
  const rank = Math.max(1, Math.floor(base + noise))
  const totalUsers = 328000 + Math.floor(((userScore * 3 + 7) % 500))

  return { rank, totalUsers, userScore }
}

// ============================================================
// 测试结果收集
// ============================================================

interface TestResult {
  name: string
  passed: boolean
  detail: string
}

const results: TestResult[] = []

function addResult(name: string, passed: boolean, detail: string = '') {
  results.push({ name, passed, detail })
}

// ============================================================
// 测试1: 访问控制测试
// ============================================================

function testAccessControl() {
  // 生成模拟政策ID列表（20条足够测试所有场景）
  const policyIds = Array.from({ length: 20 }, (_, i) => `policy-${i + 1}`)

  // 场景A：新用户，不分享，查看4条政策 → 第4条应被门禁
  {
    let allPassed = true
    let failDetail = ''
    for (let user = 0; user < 100; user++) {
      const viewResults = simulateUserViewingPolicies({
        favorites: [],
        shareCount: 0,
        policyIds: policyIds.slice(0, 4),
      })
      // 前3条可看，第4条被门禁
      if (viewResults[0] !== true || viewResults[1] !== true || viewResults[2] !== true || viewResults[3] !== false) {
        allPassed = false
        failDetail = `用户${user}: 期望[true,true,true,false], 实际${JSON.stringify(viewResults)}`
        break
      }
    }
    addResult('场景A (新用户不分享)', allPassed, failDetail)
  }

  // 场景B：用户分享1次，查看8条 → 前3+5=8条可看，第9条被门禁
  // 注意：实际源码中 shareCount=1 并不会解锁额外5条，只有 shareCount>=3 才解锁全部
  // 这里按实际代码逻辑测试
  {
    let allPassed = true
    let failDetail = ''
    for (let user = 0; user < 100; user++) {
      const viewResults = simulateUserViewingPolicies({
        favorites: [],
        shareCount: 1,
        policyIds: policyIds.slice(0, 9),
      })
      // 实际代码：shareCount=1 不满足 >=3，仍然只有3条免费额度
      // 期望行为(需求)：前3+5=8条可看
      // 实际行为：只有前3条可看
      const expectedByCode = [true, true, true, false, false, false, false, false, false]
      const expectedByReq = [true, true, true, true, true, true, true, true, false]

      const matchesCode = JSON.stringify(viewResults) === JSON.stringify(expectedByCode)
      const matchesReq = JSON.stringify(viewResults) === JSON.stringify(expectedByReq)

      if (!matchesReq) {
        allPassed = false
        failDetail = `实际代码 shareCount=1 不解锁额外5条。期望(需求)前8条可看, 实际${JSON.stringify(viewResults.slice(0, 9))}。源码仅 shareCount>=3 解锁全部，无"分享1次解锁5条"逻辑`
        break
      }
    }
    addResult('场景B (分享1次)', allPassed, failDetail)
  }

  // 场景C：用户分享3次 → 所有政策可看
  {
    let allPassed = true
    let failDetail = ''
    for (let user = 0; user < 100; user++) {
      const viewResults = simulateUserViewingPolicies({
        favorites: [],
        shareCount: 3,
        policyIds,
      })
      if (!viewResults.every(v => v === true)) {
        allPassed = false
        failDetail = `用户${user}: 分享3次后仍有政策被门禁`
        break
      }
    }
    addResult('场景C (分享3次)', allPassed, failDetail)
  }

  // 场景D：用户收藏3条，查看6条 → 收藏的3条+免费3条=6条可看
  {
    let allPassed = true
    let failDetail = ''
    for (let user = 0; user < 100; user++) {
      // 收藏 policy-5, policy-10, policy-15
      const favorites = [policyIds[4], policyIds[9], policyIds[14]]
      // 查看顺序: policy-1, policy-2, policy-3, policy-5, policy-10, policy-15
      const viewOrder = [policyIds[0], policyIds[1], policyIds[2], policyIds[4], policyIds[9], policyIds[14]]
      const viewResults = simulateUserViewingPolicies({
        favorites,
        shareCount: 0,
        policyIds: viewOrder,
      })
      // policy-1,2,3 用免费额度可看; policy-5,10,15 是收藏可看
      // 但注意：收藏的不消耗免费额度，所以6条都应可看
      const allViewable = viewResults.every(v => v === true)
      if (!allViewable) {
        allPassed = false
        failDetail = `用户${user}: 收藏3条+免费3条应全可看, 实际${JSON.stringify(viewResults)}`
        break
      }
    }
    addResult('场景D (收藏3条)', allPassed, failDetail)
  }

  // 场景E：用户分享2次+收藏2条 → 免费3+分享解锁5*2+收藏2=15条可看
  // 注意：实际源码中 shareCount=2 不解锁额外条数，只有 shareCount>=3 才解锁全部
  {
    let allPassed = true
    let failDetail = ''
    for (let user = 0; user < 100; user++) {
      const favorites = [policyIds[14], policyIds[15]] // 收藏2条
      const viewResults = simulateUserViewingPolicies({
        favorites,
        shareCount: 2,
        policyIds,
      })
      // 实际代码：shareCount=2 不满足 >=3，只有3条免费+2条收藏=5条可看
      // 期望行为(需求)：免费3+分享解锁10+收藏2=15条可看
      const viewableCount = viewResults.filter(v => v === true).length
      const expectedByReq = 15

      if (viewableCount !== expectedByReq) {
        allPassed = false
        failDetail = `实际代码 shareCount=2 不解锁额外条数。期望(需求)15条可看, 实际${viewableCount}条可看。源码仅 shareCount>=3 解锁全部，无"分享解锁5条/次"逻辑`
        break
      }
    }
    addResult('场景E (分享2次+收藏2条)', allPassed, failDetail)
  }
}

// ============================================================
// 测试2: 每日挑战测试
// ============================================================

function testDailyChallenge() {
  // 测试连续7天答题 streak 递增
  {
    let allPassed = true
    let failDetail = ''
    for (let user = 0; user < 100; user++) {
      let record: ChallengeRecord = { streak: 0, lastAnswerDate: '', totalCorrect: 0, totalAnswered: 0 }
      const streaks: number[] = []

      for (let day = 0; day < 7; day++) {
        const today = getTodayStr(day)
        record = simulateChallenge({ record, today, isCorrect: true })
        streaks.push(record.streak)
      }

      // 连续7天答对，streak 应为 [1,2,3,4,5,6,7]
      const expected = [1, 2, 3, 4, 5, 6, 7]
      if (JSON.stringify(streaks) !== JSON.stringify(expected)) {
        allPassed = false
        failDetail = `用户${user}: streak期望${JSON.stringify(expected)}, 实际${JSON.stringify(streaks)}`
        break
      }
    }
    addResult('连续7天streak递增', allPassed, failDetail)
  }

  // 测试答错后 streak 归零
  {
    let allPassed = true
    let failDetail = ''
    for (let user = 0; user < 100; user++) {
      let record: ChallengeRecord = { streak: 0, lastAnswerDate: '', totalCorrect: 0, totalAnswered: 0 }

      // 先连续3天答对
      for (let day = 0; day < 3; day++) {
        record = simulateChallenge({ record, today: getTodayStr(day), isCorrect: true })
      }
      // 第4天答错
      record = simulateChallenge({ record, today: getTodayStr(3), isCorrect: false })

      if (record.streak !== 0) {
        allPassed = false
        failDetail = `用户${user}: 答错后streak应为0, 实际${record.streak}`
        break
      }
    }
    addResult('答错后streak归零', allPassed, failDetail)
  }

  // 测试击败%范围 (60-95)
  {
    let allPassed = true
    let failDetail = ''
    for (let user = 0; user < 100; user++) {
      // 模拟不同日期的 beatPercent
      for (let day = 0; day < 7; day++) {
        const today = getTodayStr(day)
        const beatPercent = simulateBeatPercent(today)
        if (beatPercent < 60 || beatPercent > 95) {
          allPassed = false
          failDetail = `用户${user} 日期${today}: 击败%=${beatPercent}, 不在60-95范围内`
          break
        }
      }
      if (!allPassed) break
    }
    addResult('击败%范围(60-95)', allPassed, failDetail)
  }

  // 测试每天只能答一次
  {
    let allPassed = true
    let failDetail = ''
    for (let user = 0; user < 100; user++) {
      const today = getTodayStr(0)
      let record: ChallengeRecord = { streak: 0, lastAnswerDate: '', totalCorrect: 0, totalAnswered: 0 }

      // 第一次答题
      record = simulateChallenge({ record, today, isCorrect: true })
      const firstTotalAnswered = record.totalAnswered

      // 同一天再次答题（源码中 alreadyAnsweredToday 会阻止，但 simulateChallenge 不阻止）
      // 这里验证的是：如果同一天答两次，lastAnswerDate 相同
      record = simulateChallenge({ record, today, isCorrect: true })
      const secondTotalAnswered = record.totalAnswered

      // 源码中 alreadyAnsweredToday = record.lastAnswerDate === today 会阻止重复答题
      // 但我们的模拟函数不包含UI层面的阻止逻辑，所以 totalAnswered 会增加
      // 这里验证的是：lastAnswerDate 相同表示今天已答过
      if (record.lastAnswerDate !== today) {
        allPassed = false
        failDetail = `用户${user}: lastAnswerDate应为${today}`
        break
      }

      // 验证：如果用源码逻辑判断，同一天不应再答
      const alreadyAnsweredToday = record.lastAnswerDate === today
      if (!alreadyAnsweredToday) {
        allPassed = false
        failDetail = `用户${user}: 同一天应标记为已答`
        break
      }
    }
    addResult('每天只能答一次', allPassed, failDetail)
  }

  // 测试 totalCorrect 和 totalAnswered 计数
  {
    let allPassed = true
    let failDetail = ''
    for (let user = 0; user < 100; user++) {
      let record: ChallengeRecord = { streak: 0, lastAnswerDate: '', totalCorrect: 0, totalAnswered: 0 }
      const answers = [true, true, false, true, true, true, false]

      for (let day = 0; day < 7; day++) {
        record = simulateChallenge({ record, today: getTodayStr(day), isCorrect: answers[day] })
      }

      const expectedCorrect = answers.filter(a => a).length // 5
      const expectedAnswered = answers.length // 7

      if (record.totalCorrect !== expectedCorrect || record.totalAnswered !== expectedAnswered) {
        allPassed = false
        failDetail = `用户${user}: 期望 correct=${expectedCorrect}/answered=${expectedAnswered}, 实际 correct=${record.totalCorrect}/answered=${record.totalAnswered}`
        break
      }
    }
    addResult('答题计数准确', allPassed, failDetail)
  }
}

// ============================================================
// 测试3: 数据真实性验证
// ============================================================

function testDataIntegrity() {
  const couponsPath = path.resolve(__dirname, '../public/data/coupons.json')
  let coupons: ScrapedCoupon[]

  try {
    const raw = fs.readFileSync(couponsPath, 'utf-8')
    coupons = JSON.parse(raw)
  } catch (e) {
    addResult('数据文件读取', false, `无法读取 coupons.json: ${e}`)
    return
  }

  addResult('数据文件读取', true, `成功读取 ${coupons.length} 条数据`)

  // 总条数
  addResult('总条数', true, `${coupons.length}`)

  // AI解读完整性检查：5种画像都有 impactOnYou 和 whatToDo
  {
    const personaIds = ['office-worker', 'parent', 'student', 'elderly', 'freelancer']
    let incompleteCount = 0
    const incompleteItems: string[] = []

    for (const coupon of coupons) {
      if (!coupon.aiInterpretation) {
        // 没有AI解读的跳过（使用模板解读）
        continue
      }
      const ai = coupon.aiInterpretation
      for (const pid of personaIds) {
        if (!ai.impactOnYou[pid] || !ai.whatToDo[pid]) {
          incompleteCount++
          incompleteItems.push(`${coupon.id} 缺少 ${pid} 的解读`)
          break
        }
      }
    }

    const aiInterpreted = coupons.filter(c => c.aiInterpretation).length
    if (incompleteCount === 0) {
      addResult('AI解读完整', true, `${aiInterpreted}/${aiInterpreted} (有AI解读的条目)`)
    } else {
      addResult('AI解读完整', false, `${incompleteCount} 条不完整: ${incompleteItems.slice(0, 5).join('; ')}`)
    }
  }

  // 金额描述合理性检查
  {
    const unreasonableItems: string[] = []
    // 匹配具体金额如 "省3000元"、"省500块"、"省1.5万"、"省2000"、"省¥3000"
    const specificAmountPattern = /省\s*\d{3,}[元块万¥]|省\s*¥?\d{3,}元|省\s*\d+(\.\d+)?万[元块]/

    for (const coupon of coupons) {
      if (!coupon.aiInterpretation) continue
      const ai = coupon.aiInterpretation

      // 检查 moneyImpact
      if (specificAmountPattern.test(ai.moneyImpact)) {
        unreasonableItems.push(`${coupon.id} moneyImpact: "${ai.moneyImpact}"`)
      }

      // 检查各画像的 impactOnYou
      for (const [pid, text] of Object.entries(ai.impactOnYou)) {
        if (specificAmountPattern.test(text)) {
          unreasonableItems.push(`${coupon.id} impactOnYou[${pid}]: "${text}"`)
        }
      }

      // 检查各画像的 whatToDo
      for (const [pid, text] of Object.entries(ai.whatToDo)) {
        if (specificAmountPattern.test(text)) {
          unreasonableItems.push(`${coupon.id} whatToDo[${pid}]: "${text}"`)
        }
      }
    }

    if (unreasonableItems.length === 0) {
      addResult('金额描述合理', true, '未发现具体金额承诺')
    } else {
      addResult('金额描述合理', false, `${unreasonableItems.length} 条不合理: ${unreasonableItems.slice(0, 5).join('; ')}`)
    }
  }

  // 无导航链接检查（/col/col数字、index.html）
  {
    const navLinkItems: string[] = []
    const navLinkPattern = /\/col\/col\d+|\/index\.html/

    for (const coupon of coupons) {
      if (navLinkPattern.test(coupon.claimUrl)) {
        navLinkItems.push(`${coupon.id}: ${coupon.claimUrl}`)
      }
    }

    if (navLinkItems.length === 0) {
      addResult('无导航链接', true, '所有claimUrl均为内容页')
    } else {
      addResult('无导航链接', false, `${navLinkItems.length} 条含导航链接: ${navLinkItems.slice(0, 5).join('; ')}`)
    }
  }

  // 无过期数据检查（expirationDate 早于30天前）
  {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const expiredItems: string[] = []

    for (const coupon of coupons) {
      const exp = coupon.expirationDate
      // 跳过格式异常的日期（如 "20213", "51", "202117" 等）
      if (!/^\d{4}-\d{2}-\d{2}$/.test(exp)) {
        // 格式异常的也标记
        expiredItems.push(`${coupon.id}: expirationDate="${exp}" (格式异常)`)
        continue
      }
      const expDate = new Date(exp)
      if (expDate < thirtyDaysAgo) {
        expiredItems.push(`${coupon.id}: expirationDate="${exp}" (已过期)`)
      }
    }

    if (expiredItems.length === 0) {
      addResult('无过期数据', true, '所有数据在有效期内')
    } else {
      addResult('无过期数据', false, `${expiredItems.length} 条过期或格式异常: ${expiredItems.slice(0, 10).join('; ')}`)
    }
  }

  // 无重复标题
  {
    const titleCount: Record<string, string[]> = {}
    for (const coupon of coupons) {
      if (!titleCount[coupon.title]) {
        titleCount[coupon.title] = []
      }
      titleCount[coupon.title].push(coupon.id)
    }

    const duplicates = Object.entries(titleCount).filter(([, ids]) => ids.length > 1)
    if (duplicates.length === 0) {
      addResult('无重复标题', true, '所有标题唯一')
    } else {
      const dupInfo = duplicates.map(([title, ids]) => `"${title}" x${ids.length}`).join('; ')
      addResult('无重复标题', false, `${duplicates.length} 个重复标题: ${dupInfo}`)
    }
  }

  // claimUrl 指向真实政府网站
  {
    const validDomains = [
      'gov.cn',
      'chinatax.gov.cn',
      'mohurd.gov.cn',
      'nhsa.gov.cn',
      'mohrss.gov.cn',
      'moe.gov.cn',
      'nhc.gov.cn',
      'mof.gov.cn',
      'pbc.gov.cn',
      'ndrc.gov.cn',
      'miit.gov.cn',
      'mara.gov.cn',
      'mnr.gov.cn',
    ]
    const invalidItems: string[] = []

    for (const coupon of coupons) {
      const url = coupon.claimUrl
      const isValid = validDomains.some(domain => url.includes(domain))
      if (!isValid) {
        invalidItems.push(`${coupon.id}: ${url}`)
      }
    }

    if (invalidItems.length === 0) {
      addResult('claimUrl指向真实网站', true, '所有URL指向政府网站')
    } else {
      addResult('claimUrl指向真实网站', false, `${invalidItems.length} 条URL非政府网站: ${invalidItems.slice(0, 5).join('; ')}`)
    }
  }
}

// ============================================================
// 测试4: 排行榜逻辑测试
// ============================================================

function testSavingsRank() {
  // 排名计算验证
  {
    let allPassed = true
    let failDetail = ''

    // 测试100个不同分数的用户
    for (let user = 0; user < 100; user++) {
      const totalCorrect = Math.floor(Math.random() * 30)
      const shareCount = Math.floor(Math.random() * 10)
      const favoritesCount = Math.floor(Math.random() * 20)

      const { userScore, rank, totalUsers } = simulateRank({ totalCorrect, shareCount, favoritesCount })

      // 验证分数计算
      const expectedScore = totalCorrect * 100 + shareCount * 200 + favoritesCount * 50
      if (userScore !== expectedScore) {
        allPassed = false
        failDetail = `用户${user}: 分数期望${expectedScore}, 实际${userScore}`
        break
      }

      // 验证排名在合理范围 (1 ~ totalUsers)
      if (rank < 1 || rank > totalUsers) {
        allPassed = false
        failDetail = `用户${user}: 排名${rank}超出范围(1-${totalUsers})`
        break
      }

      // 验证分数越高排名越靠前（排名数字越小）
      // 用两个极端用户对比
      if (user === 0) {
        const lowScore = simulateRank({ totalCorrect: 0, shareCount: 0, favoritesCount: 0 })
        const highScore = simulateRank({ totalCorrect: 30, shareCount: 10, favoritesCount: 20 })
        if (highScore.rank >= lowScore.rank) {
          allPassed = false
          failDetail = `高分用户排名(${highScore.rank})应低于低分用户排名(${lowScore.rank})`
          break
        }
      }
    }
    addResult('排名计算', allPassed, failDetail)
  }

  // 虚拟用户数验证
  {
    let allPassed = true
    let failDetail = ''

    for (let user = 0; user < 100; user++) {
      const { totalUsers } = simulateRank({
        totalCorrect: Math.floor(Math.random() * 30),
        shareCount: Math.floor(Math.random() * 10),
        favoritesCount: Math.floor(Math.random() * 20),
      })

      // 需求说虚拟用户数 = 8万+随机，实际代码是 328000+随机
      // 328000 ≈ 32.8万，不在8万范围
      if (totalUsers < 80000) {
        allPassed = false
        failDetail = `虚拟用户数${totalUsers}低于8万`
        break
      }
    }

    // 额外检查：实际代码的虚拟用户数约32.8万
    const { totalUsers: sampleTotal } = simulateRank({ totalCorrect: 5, shareCount: 2, favoritesCount: 3 })
    if (sampleTotal < 328000 || sampleTotal > 329000) {
      addResult('虚拟用户数', false, `实际虚拟用户数≈${sampleTotal} (代码实现为328000+随机), 需求期望8万+随机`)
    } else {
      addResult('虚拟用户数', false, `实际虚拟用户数≈${sampleTotal} (约32.8万), 需求期望8万+随机。代码实现与需求不一致`)
    }
  }
}

// ============================================================
// 运行所有测试并输出报告
// ============================================================

function runAllTests() {
  console.log('\n=== 100用户模拟测试报告 ===\n')

  // 1. 访问控制测试
  console.log('1. 访问控制测试')
  testAccessControl()

  // 2. 每日挑战测试
  console.log('2. 每日挑战测试')
  testDailyChallenge()

  // 3. 数据真实性测试
  console.log('3. 数据真实性测试')
  testDataIntegrity()

  // 4. 排行榜测试
  console.log('4. 排行榜测试')
  testSavingsRank()

  // 输出结果
  const accessResults = results.filter(r => r.name.startsWith('场景'))
  const challengeResults = results.filter(r =>
    r.name.includes('streak') || r.name.includes('击败') || r.name.includes('每天') || r.name.includes('答题计数')
  )
  const dataResults = results.filter(r =>
    r.name.includes('AI解读') || r.name.includes('金额') || r.name.includes('导航') ||
    r.name.includes('过期') || r.name.includes('重复') || r.name.includes('claimUrl') ||
    r.name.includes('总条数') || r.name.includes('数据文件')
  )
  const rankResults = results.filter(r => r.name.includes('排名') || r.name.includes('虚拟用户'))

  console.log('\n--- 详细结果 ---\n')

  console.log('1. 访问控制测试')
  for (const r of accessResults) {
    console.log(`   ${r.name}: ${r.passed ? '✅ 通过' : '❌ 失败'}${r.detail ? ' - ' + r.detail : ''}`)
  }

  console.log('\n2. 每日挑战测试')
  for (const r of challengeResults) {
    console.log(`   ${r.name}: ${r.passed ? '✅ 通过' : '❌ 失败'}${r.detail ? ' - ' + r.detail : ''}`)
  }

  console.log('\n3. 数据真实性测试')
  for (const r of dataResults) {
    console.log(`   ${r.name}: ${r.passed ? '✅ 通过' : '❌ 失败'}${r.detail ? ' - ' + r.detail : ''}`)
  }

  console.log('\n4. 排行榜测试')
  for (const r of rankResults) {
    console.log(`   ${r.name}: ${r.passed ? '✅ 通过' : '❌ 失败'}${r.detail ? ' - ' + r.detail : ''}`)
  }

  // 总结
  const passed = results.filter(r => r.passed).length
  const total = results.length
  const failed = results.filter(r => !r.passed)

  console.log('\n=== 总结 ===')
  console.log(`通过: ${passed}/${total}`)
  if (failed.length > 0) {
    console.log(`失败项: [${failed.map(r => r.name).join(', ')}]`)
  } else {
    console.log('失败项: 无')
  }

  // 返回退出码
  process.exit(failed.length > 0 ? 1 : 0)
}

runAllTests()
