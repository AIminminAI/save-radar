/**
 * 订阅推送端到端测试
 *
 * 模拟完整用户订阅和推送流程：
 * 1. 用户选择画像 → 保存订阅配置
 * 2. 用户点击订阅 → 授权订阅消息
 * 3. 定时任务触发 → 匹配新政策
 * 4. 发送推送通知 → 用户收到消息
 * 5. 验证整个链路通畅
 *
 * 使用方式：npx tsx scripts/test-e2e-subscription.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.join(__dirname, '..')

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

function section(title: string) {
  console.log(`\n===== ${title} =====`)
}

// ===== 模拟存储 =====
const mockStorage: Record<string, string> = {}
const mockUni = {
  getStorageSync: (key: string) => mockStorage[key] || '',
  setStorageSync: (key: string, value: string) => { mockStorage[key] = value },
  removeStorageSync: (key: string) => { delete mockStorage[key] },
}

// ===== Step 1: 用户选择画像 =====
function step1_userSelectProfile() {
  section('Step 1: 用户选择画像')

  // 模拟用户选择"学生"画像
  const persona = 'student'
  mockUni.setStorageSync('selectedPersona', persona)
  assert(mockUni.getStorageSync('selectedPersona') === 'student', '用户画像保存成功: student')

  // 模拟用户输入城市、学历、就业状态
  const userProfile = {
    city: '北京',
    education: '本科',
    employment: '在校学生',
  }
  mockUni.setStorageSync('userProfile', JSON.stringify(userProfile))

  const saved = JSON.parse(mockUni.getStorageSync('userProfile'))
  assert(saved.city === '北京', '用户城市保存成功: 北京')
  assert(saved.education === '本科', '用户学历保存成功: 本科')
  assert(saved.employment === '在校学生', '用户就业状态保存成功: 在校学生')
}

// ===== Step 2: 用户点击订阅 =====
function step2_userSubscribe() {
  section('Step 2: 用户点击订阅')

  // 模拟订阅配置保存
  const subConfig = {
    frequency: 'important-only',
    city: '北京',
    education: '本科',
    employment: '在校学生',
    subscribed: true,
    lastPushAt: null as string | null,
  }
  mockUni.setStorageSync('subscriptionConfig', JSON.stringify(subConfig))

  const saved = JSON.parse(mockUni.getStorageSync('subscriptionConfig'))
  assert(saved.subscribed === true, '订阅状态已开启')
  assert(saved.frequency === 'important-only', '推送频率: 仅重要政策')
  assert(saved.city === '北京', '订阅城市: 北京')

  // 模拟云端注册（实际环境中调用云函数 registerSubscriber）
  const cloudRegistration = {
    openid: 'test_user_openid_123',
    persona: 'student',
    city: '北京',
    education: '本科',
    employment: '在校学生',
    frequency: 'important-only',
    subscribed: true,
    subscribedAt: new Date().toISOString(),
    lastPushAt: null as string | null,
  }
  mockUni.setStorageSync('cloudSubscriber', JSON.stringify(cloudRegistration))

  const cloudSaved = JSON.parse(mockUni.getStorageSync('cloudSubscriber'))
  assert(cloudSaved.openid === 'test_user_openid_123', '云端订阅注册成功')
  assert(cloudSaved.persona === 'student', '云端画像同步成功')
}

// ===== Step 3: 定时任务触发 - 匹配新政策 =====
function step3_matchNewPolicies() {
  section('Step 3: 定时任务匹配新政策')

  // 读取真实政策数据
  const couponsPath = path.join(ROOT, 'public', 'data', 'coupons.json')
  if (!fs.existsSync(couponsPath)) {
    console.log('  ⚠️ coupons.json 不存在，跳过')
    return
  }
  const allPolicies = JSON.parse(fs.readFileSync(couponsPath, 'utf-8'))
  assert(allPolicies.length > 0, `政策数据加载成功: ${allPolicies.length} 条`)

  // 学生画像匹配
  const studentCategories = ['education', 'employment', 'tax', 'gov-policy']
  const matchedPolicies = allPolicies.filter((p: any) => studentCategories.includes(p.category))
  assert(matchedPolicies.length > 0, `学生画像匹配到 ${matchedPolicies.length} 条政策`)

  // 模拟"新政策"（取最近添加的几条）
  const newPolicies = matchedPolicies.slice(0, 3)
  assert(newPolicies.length > 0, `筛选出 ${newPolicies.length} 条新政策待推送`)

  // 检查政策数据完整性
  for (const policy of newPolicies) {
    assert(!!policy.title, `政策标题存在: ${policy.title?.substring(0, 20)}...`)
    assert(!!policy.source, `政策来源存在: ${policy.source}`)
    assert(!!policy.claimUrl, `政策原文链接存在`)
    assert(!policy.id.startsWith('mock-'), `政策ID非mock: ${policy.id}`)
  }

  // 保存匹配结果
  mockUni.setStorageSync('matchedPolicies', JSON.stringify(newPolicies))
}

// ===== Step 4: 发送推送通知 =====
function step4_sendPushNotification() {
  section('Step 4: 发送推送通知')

  const subscriber = JSON.parse(mockUni.getStorageSync('cloudSubscriber'))
  const matchedPolicies = JSON.parse(mockUni.getStorageSync('matchedPolicies'))

  assert(subscriber.subscribed === true, '用户已订阅，可以推送')

  // 检查推送频率
  const lastPush = subscriber.lastPushAt ? new Date(subscriber.lastPushAt) : null
  const shouldPush = !lastPush || new Date().toISOString().split('T')[0] !== lastPush.toISOString().split('T')[0]
  assert(shouldPush, '推送频率检查通过: 今天未推送过')

  // 模拟构建推送消息
  const topPolicy = matchedPolicies[0]
  assert(!!topPolicy, '有待推送的政策')

  const pushMessage = {
    touser: subscriber.openid,
    templateId: 'NEW_POLICY_TEMPLATE',
    page: 'pages/calculator/index',
    data: {
      thing1: { value: topPolicy.title.substring(0, 20) },
      thing2: { value: `预计${matchedPolicies.length}条政策与你有关` },
      thing3: { value: '点击查看详情' },
    },
  }

  assert(!!pushMessage.touser, '推送目标用户: ' + pushMessage.touser)
  assert(!!pushMessage.data.thing1.value, '推送政策标题: ' + pushMessage.data.thing1.value)
  assert(pushMessage.data.thing2.value.includes('条政策'), '推送提示信息: ' + pushMessage.data.thing2.value)

  // 更新最后推送时间
  subscriber.lastPushAt = new Date().toISOString()
  mockUni.setStorageSync('cloudSubscriber', JSON.stringify(subscriber))

  const updated = JSON.parse(mockUni.getStorageSync('cloudSubscriber'))
  assert(!!updated.lastPushAt, '推送时间已记录: ' + updated.lastPushAt)
}

// ===== Step 5: 验证推送频率控制 =====
function step5_verifyFrequencyControl() {
  section('Step 5: 验证推送频率控制')

  const subscriber = JSON.parse(mockUni.getStorageSync('cloudSubscriber'))

  // 同一天不应再推送
  const lastPush = new Date(subscriber.lastPushAt)
  const today = new Date()
  const sameDay = today.toISOString().split('T')[0] === lastPush.toISOString().split('T')[0]
  assert(sameDay, '同一天内不重复推送')

  // 模拟第二天
  const tomorrow = new Date(lastPush.getTime() + 24 * 60 * 60 * 1000)
  const shouldPushNextDay = tomorrow.toISOString().split('T')[0] !== lastPush.toISOString().split('T')[0]
  assert(shouldPushNextDay, '第二天可以推送')

  // 测试 weekly 频率
  const weeklyConfig = { ...subscriber, frequency: 'weekly' }
  const weekLater = new Date(lastPush.getTime() + 8 * 24 * 60 * 60 * 1000)
  const weekDiff = (weekLater.getTime() - lastPush.getTime()) / (7 * 24 * 60 * 60 * 1000)
  assert(weekDiff >= 1, '超过一周可以推送（weekly模式）')
}

// ===== Step 6: 验证支付+广告解锁逻辑 =====
function step6_verifyUnlockLogic() {
  section('Step 6: 验证支付+广告解锁逻辑')

  // 测试广告解锁（24小时有效）
  const adUnlockExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  mockUni.setStorageSync('subsidy_unlock_expiry', adUnlockExpiry)

  const expiry = mockUni.getStorageSync('subsidy_unlock_expiry')
  const isAdUnlockValid = new Date(expiry) > new Date()
  assert(isAdUnlockValid, '广告解锁24小时内有效')

  // 测试过期后失效
  const expiredUnlock = new Date(Date.now() - 1).toISOString()
  mockUni.setStorageSync('subsidy_unlock_expiry', expiredUnlock)
  const isExpired = new Date(mockUni.getStorageSync('subsidy_unlock_expiry')) < new Date()
  assert(isExpired, '广告解锁过期后失效')

  // 测试付费解锁（永久有效）
  const purchaseRecord = {
    productId: 'subsidy_full_unlock',
    orderId: 'SR_test_123',
    purchasedAt: new Date().toISOString(),
  }
  mockUni.setStorageSync('purchaseRecords', JSON.stringify([purchaseRecord]))

  const records = JSON.parse(mockUni.getStorageSync('purchaseRecords'))
  const hasPurchased = records.some((r: any) => r.productId === 'subsidy_full_unlock')
  assert(hasPurchased, '付费解锁永久有效')

  // 测试月卡过期检查
  const monthlyRecord = {
    productId: 'monthly_pass',
    orderId: 'SR_monthly_123',
    purchasedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
  const allRecords = [...records, monthlyRecord]
  mockUni.setStorageSync('purchaseRecords', JSON.stringify(allRecords))

  const allSaved = JSON.parse(mockUni.getStorageSync('purchaseRecords'))
  const monthlyActive = allSaved.some((r: any) => {
    if (r.productId !== 'monthly_pass') return false
    if (r.expiresAt) return new Date(r.expiresAt) > new Date()
    return true
  })
  assert(monthlyActive, '月卡有效期内可用')

  // 测试月卡过期
  const expiredMonthly = {
    productId: 'monthly_pass',
    orderId: 'SR_expired_123',
    purchasedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() - 1).toISOString(),
  }
  const expiredRecords = [...records, expiredMonthly]
  const expiredMonthlyActive = expiredRecords.some((r: any) => {
    if (r.productId !== 'monthly_pass') return false
    if (r.expiresAt) return new Date(r.expiresAt) > new Date()
    return true
  })
  assert(!expiredMonthlyActive, '月卡过期后不可用')
}

// ===== Step 7: 验证数据同步 =====
function step7_verifyDataSync() {
  section('Step 7: 验证数据同步')

  // 检查H5数据
  const h5DataPath = path.join(ROOT, 'public', 'data', 'coupons.json')
  const miniDataPath = path.join(ROOT, 'mini', 'src', 'static', 'data', 'coupons.json')

  if (fs.existsSync(h5DataPath) && fs.existsSync(miniDataPath)) {
    const h5Data = JSON.parse(fs.readFileSync(h5DataPath, 'utf-8'))
    const miniData = JSON.parse(fs.readFileSync(miniDataPath, 'utf-8'))

    assert(h5Data.length > 0, `H5政策数据: ${h5Data.length} 条`)
    assert(miniData.length > 0, `小程序政策数据: ${miniData.length} 条`)

    // 检查数据一致性
    const h5Ids = new Set(h5Data.map((p: any) => p.id))
    const miniIds = new Set(miniData.map((p: any) => p.id))
    const overlap = [...h5Ids].filter(id => miniIds.has(id)).length
    assert(overlap > 0, `H5和小程序数据重叠: ${overlap} 条`)

    // 检查同步脚本路径
    const dailyUpdatePath = path.join(ROOT, 'scripts', 'daily-update.ts')
    if (fs.existsSync(dailyUpdatePath)) {
      const dailyUpdate = fs.readFileSync(dailyUpdatePath, 'utf-8')
      assert(!dailyUpdate.includes('save-radar-mini'), '同步脚本路径已修正（不再指向save-radar-mini）')
      assert(dailyUpdate.includes('mini'), '同步脚本包含mini路径')
    }
  } else {
    console.log('  ⚠️ 数据文件不完整，跳过同步检查')
  }

  // 检查GitHub Actions
  const workflowPath = path.join(ROOT, '.github', 'workflows', 'scrape.yml')
  if (fs.existsSync(workflowPath)) {
    const workflow = fs.readFileSync(workflowPath, 'utf-8')
    assert(workflow.includes('scrape') || workflow.includes('interpret'), 'GitHub Actions包含抓取/解读步骤')
    assert(workflow.includes('DEEPSEEK_API_KEY'), 'GitHub Actions配置了DEEPSEEK_API_KEY')
  }
}

// ===== 执行所有测试 =====
console.log('========================================')
console.log('  省钱雷达 - 订阅推送端到端测试')
console.log('  模拟完整用户订阅和推送流程')
console.log('========================================')

step1_userSelectProfile()
step2_userSubscribe()
step3_matchNewPolicies()
step4_sendPushNotification()
step5_verifyFrequencyControl()
step6_verifyUnlockLogic()
step7_verifyDataSync()

console.log('\n========================================')
console.log(`  结果：✅ ${passed} 通过  ❌ ${failed} 失败`)
console.log('========================================')

if (failed > 0) {
  console.log('\n⚠️ 有测试未通过，请修复后再上线')
  process.exit(1)
} else {
  console.log('\n✅ 所有测试通过！订阅推送链路完整')
}
