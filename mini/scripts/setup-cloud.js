/**
 * 微信云开发环境配置脚本
 *
 * 使用方式：node scripts/setup-cloud.js
 *
 * 前置条件：
 * 1. 已安装微信开发者工具
 * 2. 已注册微信小程序账号
 * 3. 已开通云开发服务
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve))
}

async function main() {
  console.log('\n========================================')
  console.log('  省钱雷达 - 微信云开发配置向导')
  console.log('========================================\n')

  // Track what was configured for the summary
  const configured = {
    envId: false,
    newPolicyTemplateId: false,
    importantPolicyTemplateId: false,
    mchId: false,
    apiKey: false,
    appVue: false,
    subscriptionService: false,
    sendNotifications: false,
    createOrder: false,
  }

  // Step 1: Cloud Environment ID
  console.log('📋 步骤1：配置云开发环境ID')
  console.log('获取方式：微信开发者工具 → 云开发 → 设置 → 环境ID\n')
  const envId = await question('请输入云开发环境ID: ')

  if (!envId.trim()) {
    console.log('❌ 环境ID不能为空')
    process.exit(1)
  }
  configured.envId = true

  // Step 2: Subscribe Message Template IDs
  console.log('\n📋 步骤2：配置订阅消息模板ID')
  console.log('获取方式：微信公众平台 → 功能 → 订阅消息 → 添加模板')
  console.log('需要添加以下2个模板：\n')
  console.log('  模板1：新政策提醒')
  console.log('    - 模板名称建议：新政策提醒')
  console.log('    - 所需字段：政策名称(thing)、影响说明(thing)、温馨提示(thing)')
  console.log('  模板2：重要政策提醒')
  console.log('    - 模板名称建议：重要政策提醒')
  console.log('    - 所需字段：政策名称(thing)、影响说明(thing)、温馨提示(thing)\n')

  const newPolicyTemplateId = await question('请输入"新政策提醒"模板ID: ')
  if (newPolicyTemplateId.trim()) {
    configured.newPolicyTemplateId = true
  } else {
    console.log('  ⚠️ 未输入"新政策提醒"模板ID，将保留占位符')
  }

  const importantPolicyTemplateId = await question('请输入"重要政策提醒"模板ID: ')
  if (importantPolicyTemplateId.trim()) {
    configured.importantPolicyTemplateId = true
  } else {
    console.log('  ⚠️ 未输入"重要政策提醒"模板ID，将保留占位符')
  }

  // Step 3: Merchant Configuration
  console.log('\n📋 步骤3：配置微信支付商户信息')
  console.log('获取方式：微信商户平台 pay.weixin.qq.com\n')
  const mchId = await question('请输入商户号(mchId，没有可跳过）: ')
  const apiKey = await question('请输入API密钥(apiKey，没有可跳过）: ')
  if (mchId.trim()) configured.mchId = true
  if (apiKey.trim()) configured.apiKey = true

  // Step 4: Update subscriptionService.ts
  console.log('\n🔧 正在更新配置文件...')

  const subServicePath = path.join(__dirname, '..', 'src', 'services', 'subscriptionService.ts')
  if (fs.existsSync(subServicePath)) {
    let content = fs.readFileSync(subServicePath, 'utf-8')
    content = content.replace(/XXXX_NEW_POLICY_XXXX/g, newPolicyTemplateId || 'XXXX_NEW_POLICY_XXXX')
    content = content.replace(/XXXX_IMPORTANT_POLICY_XXXX/g, importantPolicyTemplateId || 'XXXX_IMPORTANT_POLICY_XXXX')
    fs.writeFileSync(subServicePath, content, 'utf-8')
    console.log('  ✅ subscriptionService.ts 模板ID已更新')
    configured.subscriptionService = true
  } else {
    console.log('  ⚠️ subscriptionService.ts 未找到，跳过')
  }

  // Step 5: Update cloud function - sendNotifications
  const sendNotifPath = path.join(__dirname, '..', 'cloudfunctions', 'sendNotifications', 'index.js')
  if (fs.existsSync(sendNotifPath)) {
    let content = fs.readFileSync(sendNotifPath, 'utf-8')
    content = content.replace(/XXXX_NEW_POLICY_XXXX/g, newPolicyTemplateId || 'XXXX_NEW_POLICY_XXXX')
    content = content.replace(/XXXX_IMPORTANT_POLICY_XXXX/g, importantPolicyTemplateId || 'XXXX_IMPORTANT_POLICY_XXXX')
    fs.writeFileSync(sendNotifPath, content, 'utf-8')
    console.log('  ✅ sendNotifications 云函数模板ID已更新')
    configured.sendNotifications = true
  } else {
    console.log('  ⚠️ sendNotifications 云函数未找到，跳过')
  }

  // Step 6: Update cloud function - createOrder
  const createOrderPath = path.join(__dirname, '..', 'cloudfunctions', 'createOrder', 'index.js')
  if (fs.existsSync(createOrderPath)) {
    let content = fs.readFileSync(createOrderPath, 'utf-8')
    if (mchId.trim()) {
      content = content.replace(/const MCH_ID = ''/, `const MCH_ID = '${mchId.trim()}'`)
    }
    if (apiKey.trim()) {
      content = content.replace(/const API_KEY = ''/, `const API_KEY = '${apiKey.trim()}'`)
    }
    fs.writeFileSync(createOrderPath, content, 'utf-8')
    console.log('  ✅ createOrder 云函数商户配置已更新')
    configured.createOrder = true
  } else {
    console.log('  ⚠️ createOrder 云函数未找到，跳过')
  }

  // Step 7: Update App.vue cloud environment ID
  const appVuePath = path.join(__dirname, '..', 'src', 'App.vue')
  if (fs.existsSync(appVuePath)) {
    let content = fs.readFileSync(appVuePath, 'utf-8')
    if (content.includes('cloud1-xxxx')) {
      content = content.replace(/cloud1-xxxx/g, envId.trim())
      fs.writeFileSync(appVuePath, content, 'utf-8')
      console.log('  ✅ App.vue 云开发环境ID已更新')
      configured.appVue = true
    } else if (content.includes('wx.cloud.init')) {
      // Already configured, try to update the env value
      content = content.replace(/env:\s*'[^']*'/, `env: '${envId.trim()}'`)
      fs.writeFileSync(appVuePath, content, 'utf-8')
      console.log('  ✅ App.vue 云开发环境ID已更新')
      configured.appVue = true
    } else {
      console.log('  ⚠️ App.vue 未找到云开发初始化代码，请手动配置')
    }
  } else {
    console.log('  ⚠️ App.vue 未找到，跳过')
  }

  // Summary
  console.log('\n========================================')
  console.log('  ✅ 配置完成！')
  console.log('========================================\n')
  console.log('📋 配置摘要：')
  console.log(`  云开发环境ID:    ${configured.envId ? '✅ ' + envId.trim() : '❌ 未配置'}`)
  console.log(`  新政策提醒模板ID: ${configured.newPolicyTemplateId ? '✅ ' + newPolicyTemplateId.trim() : '⚠️ 未配置'}`)
  console.log(`  重要政策提醒模板ID: ${configured.importantPolicyTemplateId ? '✅ ' + importantPolicyTemplateId.trim() : '⚠️ 未配置'}`)
  console.log(`  商户号(mchId):   ${configured.mchId ? '✅ ' + mchId.trim() : '⚠️ 未配置'}`)
  console.log(`  API密钥(apiKey): ${configured.apiKey ? '✅ 已配置' : '⚠️ 未配置'}`)
  console.log('')
  console.log('📝 已更新的文件：')
  if (configured.subscriptionService) console.log('  ✅ subscriptionService.ts')
  if (configured.sendNotifications) console.log('  ✅ sendNotifications/index.js')
  if (configured.createOrder) console.log('  ✅ createOrder/index.js')
  if (configured.appVue) console.log('  ✅ App.vue')
  console.log('')
  console.log('下一步操作：')
  console.log('1. 在微信开发者工具中打开项目')
  console.log('2. 右键 cloudfunctions 目录 → 上传并部署所有云函数')
  console.log('3. 在云开发控制台创建 subscribers 数据库集合')
  console.log('4. 在云开发控制台设置定时触发器：')
  console.log('   - 函数名：sendNotifications')
  console.log('   - 触发周期：每天')
  console.log('   - 触发时间：10:00')
  console.log('5. 运行 npx tsx scripts/production-check.ts 检查部署就绪状态')
  console.log('')

  rl.close()
}

main().catch(console.error)
