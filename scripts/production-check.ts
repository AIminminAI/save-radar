/**
 * 生产环境部署前检查脚本
 *
 * 使用方式：npx tsx scripts/production-check.ts
 *
 * 检查所有必须配置的项目是否已就绪
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.join(__dirname, '..')

let errors = 0
let warnings = 0

function check(condition: boolean, msg: string, level: 'error' | 'warn' = 'error') {
  if (condition) {
    console.log(`  ✅ ${msg}`)
  } else if (level === 'error') {
    console.log(`  ❌ ${msg}`)
    errors++
  } else {
    console.log(`  ⚠️ ${msg}`)
    warnings++
  }
}

console.log('\n========================================')
console.log('  省钱雷达 - 生产环境部署检查')
console.log('========================================\n')

// 1. 检查关键配置文件
console.log('📋 1. 配置文件检查')
check(fs.existsSync(path.join(ROOT, '.env.production')), '生产环境变量文件存在', 'warn')
check(!fs.existsSync(path.join(ROOT, 'public', 'data', 'coupons-mock.json')), 'mock数据文件已删除')

// 2. 检查支付配置
console.log('\n💰 2. 支付功能检查')
const createOrderCloud = fs.readFileSync(path.join(ROOT, 'mini', 'cloudfunctions', 'createOrder', 'index.js'), 'utf-8')
check(!createOrderCloud.includes("const MCH_ID = ''"), '商户号(MCH_ID)已配置')
check(!createOrderCloud.includes("const API_KEY = ''"), 'API密钥(API_KEY)已配置')
check(!createOrderCloud.includes('prepay_id=wx${Date.now()}'), '统一下单API已实现（非mock）')

const createOrderApi = fs.readFileSync(path.join(ROOT, 'api', 'create-order.ts'), 'utf-8')
check(!createOrderApi.includes("paySign: 'mock_sign'"), 'Vercel支付API已实现（非mock）')

// 3. 检查订阅消息配置
console.log('\n🔔 3. 推送订阅检查')
const subService = fs.readFileSync(path.join(ROOT, 'mini', 'src', 'services', 'subscriptionService.ts'), 'utf-8')
check(!subService.includes('XXXX_NEW_POLICY_XXXX'), '订阅消息模板ID已配置（NEW_POLICY）')
check(!subService.includes('XXXX_IMPORTANT_POLICY_XXXX'), '订阅消息模板ID已配置（IMPORTANT_POLICY）')

const sendNotif = fs.readFileSync(path.join(ROOT, 'mini', 'cloudfunctions', 'sendNotifications', 'index.js'), 'utf-8')
check(!sendNotif.includes('XXXX_NEW_POLICY_XXXX'), '云函数模板ID已配置（NEW_POLICY）')
check(!sendNotif.includes('XXXX_IMPORTANT_POLICY_XXXX'), '云函数模板ID已配置（IMPORTANT_POLICY）')

// 4. 检查小程序配置
console.log('\n📱 4. 小程序配置检查')
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'mini', 'src', 'manifest.json'), 'utf-8'))
check(manifest.appid !== '', `小程序AppID已配置: ${manifest.appid}`)
const mpWeixin = manifest['mp-weixin'] || {}
check(mpWeixin.appid !== '' && mpWeixin.appid !== undefined, 'mp-weixin.appid已配置', 'warn')

// 5. 检查隐私政策
console.log('\n🔒 5. 隐私与合规检查')
check(fs.existsSync(path.join(ROOT, 'mini', 'src', 'pages', 'privacy', 'index.vue')), '隐私政策页面存在')
check(fs.existsSync(path.join(ROOT, 'mini', 'src', 'pages', 'agreement', 'index.vue')), '用户协议页面存在')

// 6. 检查数据来源
console.log('\n📊 6. 数据来源检查')
const coupons = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'data', 'coupons.json'), 'utf-8'))
const mockEntries = coupons.filter((p: any) => p.id.startsWith('mock-'))
check(mockEntries.length === 0, `coupons.json 无mock数据（发现${mockEntries.length}条）`)
const withSource = coupons.filter((p: any) => p.source && p.source.length > 0)
check(withSource.length === coupons.length, `所有政策都有数据来源（${withSource.length}/${coupons.length}）`)
const withClaimUrl = coupons.filter((p: any) => p.claimUrl && !p.claimUrl.includes('/example/'))
check(withClaimUrl.length >= coupons.length * 0.8, `至少80%政策有有效原文链接（${withClaimUrl.length}/${coupons.length}）`, 'warn')

// 7. 检查GitHub Actions
console.log('\n⚙️ 7. 自动化检查')
check(fs.existsSync(path.join(ROOT, '.github', 'workflows', 'scrape.yml')), 'GitHub Actions工作流存在')
const workflow = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'scrape.yml'), 'utf-8')
check(workflow.includes('DEEPSEEK_API_KEY'), 'DEEPSEEK_API_KEY已在工作流中配置')
check(workflow.includes('ai-interpret'), 'AI解读步骤已配置')

// 结果
console.log('\n========================================')
if (errors === 0) {
  console.log(`  ✅ 检查通过！${warnings}个警告，0个错误`)
  console.log('  可以部署到生产环境')
} else {
  console.log(`  ❌ 检查未通过！${errors}个错误，${warnings}个警告`)
  console.log('  请修复上述错误后再部署')
}
console.log('========================================\n')

process.exit(errors > 0 ? 1 : 0)
