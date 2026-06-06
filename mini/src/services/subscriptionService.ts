/**
 * 政策推送订阅服务
 *
 * 微信小程序订阅消息说明：
 * 1. 需要在微信后台申请订阅消息模板
 * 2. 用户每次需要主动点击授权才能订阅（一次性订阅）
 * 3. 长期订阅需要用户每次打开小程序时重新授权
 * 4. 每次授权只能发一条消息，需要用户多次授权才能发多条
 */

import { filterPoliciesForPersona } from '@/utils/policyInterpreter'
import { getPersona } from '@/data/personas'

export interface SubscriptionConfig {
  /** 用户选择的推送频率 */
  frequency: 'daily' | 'weekly' | 'important-only'
  /** 用户关注的城市 */
  city: string
  /** 用户关注的教育等级 */
  education: string
  /** 用户就业状态 */
  employment: string
  /** 是否已授权订阅消息 */
  subscribed: boolean
  /** 上次推送时间 */
  lastPushAt: string | null
  /** 订阅消息模板ID列表 */
  templateIds: string[]
}

// 微信订阅消息模板ID
// TODO: 在微信后台申请后替换为真实模板ID
// 申请路径：微信公众平台 → 功能 → 订阅消息 → 添加模板
export const TEMPLATE_IDS = {
  // 新政策提醒模板
  NEW_POLICY: 'XXXX_NEW_POLICY_XXXX', // TODO: 替换
  // 重要政策提醒模板
  IMPORTANT_POLICY: 'XXXX_IMPORTANT_POLICY_XXXX', // TODO: 替换
}

const SUBSCRIPTION_KEY = 'subscriptionConfig'

/** 获取默认订阅配置 */
export function getDefaultConfig(): SubscriptionConfig {
  return {
    frequency: 'important-only',
    city: '',
    education: '',
    employment: '',
    subscribed: false,
    lastPushAt: null,
    templateIds: [],
  }
}

/** 保存订阅配置 */
export function saveSubscriptionConfig(config: Partial<SubscriptionConfig>): void {
  const current = getSubscriptionConfig()
  const merged = { ...current, ...config }
  uni.setStorageSync(SUBSCRIPTION_KEY, JSON.stringify(merged))
}

/** 获取订阅配置 */
export function getSubscriptionConfig(): SubscriptionConfig {
  const raw = uni.getStorageSync(SUBSCRIPTION_KEY)
  if (raw) {
    try {
      return { ...getDefaultConfig(), ...JSON.parse(raw) }
    } catch {
      return getDefaultConfig()
    }
  }
  return getDefaultConfig()
}

/** 请求订阅消息授权 */
export async function requestSubscribe(): Promise<boolean> {
  // #ifdef MP-WEIXIN
  return new Promise((resolve) => {
    // @ts-expect-error wx is WeChat Mini Program global
    if (typeof wx === 'undefined' || !wx.requestSubscribeMessage) {
      console.log('订阅消息不可用，使用开发模式')
      saveSubscriptionConfig({ subscribed: true })
      resolve(true)
      return
    }

    // @ts-expect-error wx is WeChat Mini Program global
    wx.requestSubscribeMessage({
      tmplIds: [TEMPLATE_IDS.NEW_POLICY, TEMPLATE_IDS.IMPORTANT_POLICY],
      success(res: any) {
        const accepted = Object.values(res).some(
          (v: any) => v === 'accept'
        )
        if (accepted) {
          saveSubscriptionConfig({ subscribed: true })
        }
        resolve(accepted)
      },
      fail() {
        resolve(false)
      },
    })
  })
  // #endif

  // #ifndef MP-WEIXIN
  // 非微信环境，模拟订阅成功
  saveSubscriptionConfig({ subscribed: true })
  return true
  // #endif
}

/** 检查是否需要推送（根据频率配置） */
export function shouldPushNow(config: SubscriptionConfig): boolean {
  if (!config.subscribed) return false

  const now = new Date()
  const lastPush = config.lastPushAt ? new Date(config.lastPushAt) : null

  switch (config.frequency) {
    case 'daily':
      // 每天推送一次
      if (!lastPush) return true
      return now.toISOString().split('T')[0] !== lastPush.toISOString().split('T')[0]
    case 'weekly':
      // 每周推送一次
      if (!lastPush) return true
      const weekDiff = (now.getTime() - lastPush.getTime()) / (7 * 24 * 60 * 60 * 1000)
      return weekDiff >= 1
    case 'important-only':
      // 仅重要政策推送，由后端判断
      return true
    default:
      return false
  }
}

/** 记录推送时间 */
export function recordPushTime(): void {
  saveSubscriptionConfig({ lastPushAt: new Date().toISOString() })
}

/** 获取用户的匹配政策数量（用于展示订阅价值） */
export function getMatchedPolicyCount(policies: any[], personaId: string): number {
  const persona = getPersona(personaId)
  if (persona) {
    return filterPoliciesForPersona(policies, persona).length
  }
  return 0
}
