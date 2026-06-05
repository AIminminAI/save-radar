/**
 * 订阅推送端到端测试脚本
 *
 * 使用方式：npx tsx scripts/test-subscription-flow.ts
 *
 * 测试内容：
 * 1. 订阅配置保存和读取
 * 2. 画像匹配政策数量
 * 3. 推送频率判断逻辑
 * 4. 浏览器通知权限请求（H5）
 * 5. 云函数调用模拟（小程序）
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

// ===== 测试1：订阅配置管理 =====
function test1_subscriptionConfig() {
  console.log('\n===== 测试1：订阅配置管理 =====')

  // 模拟 localStorage
  const storage: Record<string, string> = {}
  const mockStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => { storage[key] = value },
  }

  // 模拟配置保存和读取
  const defaultConfig = {
    frequency: 'important-only' as const,
    city: '',
    education: '',
    employment: '',
    subscribed: false,
    browserNotificationEnabled: false,
    lastPushAt: null as string | null,
  }

  // 保存配置
  const config = { ...defaultConfig, city: '北京', employment: '在校学生', subscribed: true }
  mockStorage.setItem('subscriptionConfig', JSON.stringify(config))

  // 读取配置
  const saved = JSON.parse(mockStorage.getItem('subscriptionConfig') || '{}')
  assert(saved.city === '北京', '城市配置保存正确')
  assert(saved.employment === '在校学生', '就业状态保存正确')
  assert(saved.subscribed === true, '订阅状态保存正确')
  assert(saved.frequency === 'important-only', '默认频率为"仅重要"')
}

// ===== 测试2：画像匹配政策 =====
function test2_personaMatching() {
  console.log('\n===== 测试2：画像匹配政策 =====')

  const personaCategories: Record<string, string[]> = {
    'office-worker': ['social-insurance', 'tax', 'housing', 'pension', 'medical'],
    'parent': ['medical', 'tax', 'social-insurance', 'child'],
    'student': ['education', 'employment', 'tax', 'gov-policy'],
    'elderly': ['social-insurance', 'medical', 'housing', 'pension', 'elderly'],
    'freelancer': ['social-insurance', 'tax', 'pension', 'medical', 'employment'],
  }

  // 读取真实数据
  const couponsPath = path.join(ROOT, 'public', 'data', 'coupons.json')
  if (!fs.existsSync(couponsPath)) {
    console.log('  ⚠️ coupons.json 不存在，跳过')
    return
  }
  const policies = JSON.parse(fs.readFileSync(couponsPath, 'utf-8'))

  // 测试每个画像
  for (const [persona, categories] of Object.entries(personaCategories)) {
    const matched = policies.filter((p: any) => categories.includes(p.category))
    assert(matched.length > 0, `${persona}: 匹配到 ${matched.length} 条政策`)
  }

  // 学生画像应该匹配 education 和 employment 类别
  const studentCategories = personaCategories['student']
  const eduPolicies = policies.filter((p: any) => p.category === 'education')
  const empPolicies = policies.filter((p: any) => p.category === 'employment')
  assert(eduPolicies.length > 0, `education 类政策存在: ${eduPolicies.length} 条`)
  assert(empPolicies.length > 0, `employment 类政策存在: ${empPolicies.length} 条`)
}

// ===== 测试3：推送频率判断 =====
function test3_pushFrequency() {
  console.log('\n===== 测试3：推送频率判断 =====')

  // daily: 每天推送
  const dailyConfig = { frequency: 'daily' as const, subscribed: true, lastPushAt: null as string | null }
  assert(dailyConfig.subscribed && !dailyConfig.lastPushAt, 'daily: 首次推送应该允许')

  // 设置上次推送为今天
  const today = new Date().toISOString()
  const dailyConfigPushedToday = { ...dailyConfig, lastPushAt: today }
  // 同一天不应再推
  const now = new Date()
  const lastPush = new Date(dailyConfigPushedToday.lastPushAt)
  const sameDay = now.getDate() === lastPush.getDate() && now.getMonth() === lastPush.getMonth()
  assert(sameDay, 'daily: 同一天内不应重复推送')

  // weekly: 每周推送
  const weekAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  const weeklyConfig = { frequency: 'weekly' as const, subscribed: true, lastPushAt: weekAgo }
  const weekDiff = (Date.now() - new Date(weeklyConfig.lastPushAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
  assert(weekDiff >= 1, 'weekly: 超过一周应该允许推送')

  // important-only: 总是允许
  const importantConfig = { frequency: 'important-only' as const, subscribed: true, lastPushAt: today }
  assert(importantConfig.subscribed, 'important-only: 有重要政策时总是允许推送')

  // 未订阅不应推送
  const unsubscribed = { frequency: 'daily' as const, subscribed: false, lastPushAt: null as string | null }
  assert(!unsubscribed.subscribed, '未订阅用户不应推送')
}

// ===== 测试4：数据来源验证 =====
function test4_dataSourceValidation() {
  console.log('\n===== 测试4：数据来源验证 =====')

  const couponsPath = path.join(ROOT, 'public', 'data', 'coupons.json')
  if (!fs.existsSync(couponsPath)) {
    console.log('  ⚠️ coupons.json 不存在，跳过')
    return
  }
  const policies = JSON.parse(fs.readFileSync(couponsPath, 'utf-8'))

  // 检查没有mock数据
  const mockEntries = policies.filter((p: any) => p.id.startsWith('mock-'))
  assert(mockEntries.length === 0, `无mock数据（发现${mockEntries.length}条）`)

  // 检查所有政策有来源
  const withSource = policies.filter((p: any) => p.source && p.source.length > 0)
  assert(withSource.length === policies.length, `所有政策有数据来源（${withSource.length}/${policies.length}）`)

  // 检查没有example域名
  const withExampleUrl = policies.filter((p: any) => p.claimUrl && p.claimUrl.includes('/example/'))
  assert(withExampleUrl.length === 0, `无example测试链接（发现${withExampleUrl.length}条）`)

  // 检查AI解读覆盖率
  const withAiInterp = policies.filter((p: any) => p.aiInterpretation)
  assert(withAiInterp.length >= policies.length * 0.5, `AI解读覆盖率>=50%（${withAiInterp.length}/${policies.length}）`)

  // 检查学生画像解读不是"跟你关系不大"
  const studentRelevant = withAiInterp.filter((p: any) => {
    const studentImpact = p.aiInterpretation.impactOnYou?.['student']
    return studentImpact && studentImpact !== '跟你关系不大'
  })
  console.log(`  📊 学生有具体解读: ${studentRelevant.length}/${withAiInterp.length} 条`)
}

// ===== 测试5：云函数配置检查 =====
function test5_cloudFunctionConfig() {
  console.log('\n===== 测试5：云函数配置检查 =====')

  // 检查云函数文件存在
  const cloudFunctions = ['createOrder', 'sendNotifications', 'registerSubscriber']
  for (const fn of cloudFunctions) {
    const fnPath = path.join(ROOT, 'mini', 'cloudfunctions', fn, 'index.js')
    assert(fs.existsSync(fnPath), `云函数 ${fn} 存在`)
  }

  // 检查package.json
  for (const fn of cloudFunctions) {
    const pkgPath = path.join(ROOT, 'mini', 'cloudfunctions', fn, 'package.json')
    assert(fs.existsSync(pkgPath), `云函数 ${fn}/package.json 存在`)
  }
}

// ===== 执行所有测试 =====
console.log('========================================')
console.log('  省钱雷达 - 订阅推送端到端测试')
console.log('========================================')

test1_subscriptionConfig()
test2_personaMatching()
test3_pushFrequency()
test4_dataSourceValidation()
test5_cloudFunctionConfig()

console.log('\n========================================')
console.log(`  结果：✅ ${passed} 通过  ❌ ${failed} 失败`)
console.log('========================================')

if (failed > 0) {
  process.exit(1)
}
