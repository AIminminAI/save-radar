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

  // Step 1: Cloud Environment ID
  console.log('📋 步骤1：配置云开发环境ID')
  console.log('获取方式：微信开发者工具 → 云开发 → 设置 → 环境ID\n')
  const envId = await question('请输入云开发环境ID: ')

  if (!envId.trim()) {
    console.log('❌ 环境ID不能为空')
    process.exit(1)
  }

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
  const importantPolicyTemplateId = await question('请输入"重要政策提醒"模板ID: ')

  // Step 3: Merchant Configuration
  console.log('\n📋 步骤3：配置微信支付商户信息')
  console.log('获取方式：微信商户平台 pay.weixin.qq.com\n')
  const mchId = await question('请输入商户号(mchId，没有可跳过）: ')
  const apiKey = await question('请输入API密钥(apiKey，没有可跳过）: ')

  // Step 4: Update subscriptionService.ts
  console.log('\n🔧 正在更新配置文件...')

  const subServicePath = path.join(__dirname, '..', 'src', 'services', 'subscriptionService.ts')
  if (fs.existsSync(subServicePath)) {
    let content = fs.readFileSync(subServicePath, 'utf-8')
    content = content.replace(/XXXX_NEW_POLICY_XXXX/g, newPolicyTemplateId || 'XXXX_NEW_POLICY_XXXX')
    content = content.replace(/XXXX_IMPORTANT_POLICY_XXXX/g, importantPolicyTemplateId || 'XXXX_IMPORTANT_POLICY_XXXX')
    fs.writeFileSync(subServicePath, content, 'utf-8')
    console.log('  ✅ subscriptionService.ts 模板ID已更新')
  }

  // Step 5: Update cloud function - sendNotifications
  const sendNotifPath = path.join(__dirname, '..', 'cloudfunctions', 'sendNotifications', 'index.js')
  if (fs.existsSync(sendNotifPath)) {
    let content = fs.readFileSync(sendNotifPath, 'utf-8')
    content = content.replace(/XXXX_NEW_POLICY_XXXX/g, newPolicyTemplateId || 'XXXX_NEW_POLICY_XXXX')
    content = content.replace(/XXXX_IMPORTANT_POLICY_XXXX/g, importantPolicyTemplateId || 'XXXX_IMPORTANT_POLICY_XXXX')
    fs.writeFileSync(sendNotifPath, content, 'utf-8')
    console.log('  ✅ sendNotifications 云函数模板ID已更新')
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
  }

  // Step 7: Create cloud config file for the mini program
  const appVuePath = path.join(__dirname, '..', 'src', 'App.vue')
  if (fs.existsSync(appVuePath)) {
    let content = fs.readFileSync(appVuePath, 'utf-8')
    // Check if wx.cloud.init already exists
    if (!content.includes('wx.cloud.init')) {
      content = content.replace(
        'onLaunch()',
        `onLaunch() {
    // 初始化云开发
    // @ts-expect-error wx.cloud
    if (typeof wx !== 'undefined' && wx.cloud) {
      wx.cloud.init({
        env: '${envId.trim()}',
        traceUser: true,
      })
      console.log('[Cloud] 云开发初始化成功')
    }`
      )
      fs.writeFileSync(appVuePath, content, 'utf-8')
      console.log('  ✅ App.vue 云开发初始化已添加')
    } else {
      console.log('  ⚠️ App.vue 已包含云开发初始化，跳过')
    }
  }

  console.log('\n========================================')
  console.log('  ✅ 配置完成！')
  console.log('========================================\n')
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
