/**
 * 云函数：发送政策推送通知
 *
 * 部署前需要：
 * 1. 在微信后台申请订阅消息模板，获取模板ID
 * 2. 将模板ID填入下方 TEMPLATE_IDS
 * 3. 开通云开发数据库，创建 subscribers 集合
 *
 * 数据库结构（subscribers 集合）：
 * {
 *   _id: string,
 *   openid: string,
 *   persona: string,
 *   city: string,
 *   education: string,
 *   employment: string,
 *   frequency: 'daily' | 'weekly' | 'important-only',
 *   subscribedAt: Date,
 *   lastPushAt: Date | null
 * }
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// TODO: 替换为你的订阅消息模板ID
const TEMPLATE_IDS = {
  NEW_POLICY: 'XXXX_NEW_POLICY_XXXX',
  IMPORTANT_POLICY: 'XXXX_IMPORTANT_POLICY_XXXX',
}

exports.main = async (event, context) => {
  const { newPolicies } = event

  if (!newPolicies || newPolicies.length === 0) {
    return { success: true, sent: 0, message: '没有新政策需要推送' }
  }

  // 获取所有订阅用户
  const { data: subscribers } = await db.collection('subscribers')
    .where({ frequency: db.RegExp({ regexp: 'daily|weekly|important-only' }) })
    .limit(1000)
    .get()

  let sentCount = 0
  const errors = []

  for (const subscriber of subscribers) {
    try {
      // 匹配该用户的相关政策
      const matchedPolicies = matchPoliciesForUser(newPolicies, subscriber)

      if (matchedPolicies.length === 0) continue

      // 检查推送频率
      if (!shouldPush(subscriber)) continue

      // 取最相关的一条政策推送
      const topPolicy = matchedPolicies[0]

      // 发送订阅消息
      const sendResult = await cloud.openapi.subscribeMessage.send({
        touser: subscriber.openid,
        templateId: topPolicy.urgency === 'high'
          ? TEMPLATE_IDS.IMPORTANT_POLICY
          : TEMPLATE_IDS.NEW_POLICY,
        page: `pages/calculator/index`,
        data: {
          thing1: { value: topPolicy.title.substring(0, 20) }, // 政策名称
          thing2: { value: topPolicy.impactText.substring(0, 20) }, // 影响说明
          thing3: { value: `预计${matchedPolicies.length}条政策与你有关` }, // 温馨提示
        },
      })

      if (sendResult.errCode === 0) {
        sentCount++
        // 更新最后推送时间
        await db.collection('subscribers').doc(subscriber._id).update({
          data: { lastPushAt: new Date() }
        })
      }
    } catch (err) {
      errors.push({ openid: subscriber.openid, error: err.message })
    }
  }

  return {
    success: true,
    sent: sentCount,
    total: subscribers.length,
    errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
  }
}

function matchPoliciesForUser(policies, user) {
  const personaCategories = {
    'office-worker': ['social-insurance', 'tax', 'housing', 'pension', 'medical'],
    'parent': ['medical', 'tax', 'social-insurance', 'child'],
    'student': ['education', 'employment', 'tax', 'gov-policy'],
    'elderly': ['social-insurance', 'medical', 'housing', 'pension', 'elderly'],
    'freelancer': ['social-insurance', 'tax', 'pension', 'medical', 'employment'],
  }

  const categories = personaCategories[user.persona] || []
  return policies.filter(p => categories.includes(p.category))
}

function shouldPush(subscriber) {
  if (!subscriber.lastPushAt) return true

  const now = new Date()
  const last = new Date(subscriber.lastPushAt)

  switch (subscriber.frequency) {
    case 'daily':
      return now.getDate() !== last.getDate()
    case 'weekly':
      return (now - last) > 7 * 24 * 60 * 60 * 1000
    case 'important-only':
      return true
    default:
      return false
  }
}
