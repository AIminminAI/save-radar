import { filterPoliciesForPersona } from '@/utils/policyInterpreter'
import { getPersona } from '@/data/personas'

/**
 * H5端政策推送订阅服务
 *
 * 支持两种推送方式：
 * 1. 浏览器通知（Notification API）— 需要用户授权
 * 2. 微信公众号模板消息 — 如果用户在微信浏览器中打开
 */

export interface SubscriptionConfig {
  frequency: 'daily' | 'weekly' | 'important-only'
  city: string
  education: string
  employment: string
  subscribed: boolean
  browserNotificationEnabled: boolean
  lastPushAt: string | null
}

const SUBSCRIPTION_KEY = 'subscriptionConfig'

export function getDefaultConfig(): SubscriptionConfig {
  return {
    frequency: 'important-only',
    city: '',
    education: '',
    employment: '',
    subscribed: false,
    browserNotificationEnabled: false,
    lastPushAt: null,
  }
}

export function saveSubscriptionConfig(config: Partial<SubscriptionConfig>): void {
  const current = getSubscriptionConfig()
  const merged = { ...current, ...config }
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(merged))
}

export function getSubscriptionConfig(): SubscriptionConfig {
  const raw = localStorage.getItem(SUBSCRIPTION_KEY)
  if (raw) {
    try {
      return { ...getDefaultConfig(), ...JSON.parse(raw) }
    } catch {
      return getDefaultConfig()
    }
  }
  return getDefaultConfig()
}

/** 请求浏览器通知权限 */
export async function requestBrowserNotification(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('浏览器不支持通知')
    return false
  }

  if (Notification.permission === 'granted') {
    saveSubscriptionConfig({ browserNotificationEnabled: true, subscribed: true })
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  if (permission === 'granted') {
    saveSubscriptionConfig({ browserNotificationEnabled: true, subscribed: true })
    return true
  }
  return false
}

/** 发送浏览器通知 */
export function sendBrowserNotification(title: string, body: string, onClick?: () => void): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const notification = new Notification(title, {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'policy-update',
    requireInteraction: false,
  })

  if (onClick) {
    notification.onclick = () => {
      window.focus()
      onClick()
      notification.close()
    }
  }
}

/** 检查是否在微信浏览器中 */
export function isWeChatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent)
}

/** 注册到后端（用于服务端推送） */
export async function registerSubscription(config: SubscriptionConfig): Promise<boolean> {
  try {
    const response = await fetch('/api/register-subscriber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config,
        userAgent: navigator.userAgent,
        isWeChat: isWeChatBrowser(),
      }),
    })
    return response.ok
  } catch {
    console.log('注册推送失败，使用本地模式')
    return false
  }
}

/** 获取匹配政策数量 */
export function getMatchedPolicyCount(policies: any[], personaId: string): number {
  const persona = getPersona(personaId)
  if (persona) {
    return filterPoliciesForPersona(policies, persona).length
  }
  return 0
}

/** 检查是否需要推送 */
export function shouldPushNow(config: SubscriptionConfig): boolean {
  if (!config.subscribed) return false
  const now = new Date()
  const lastPush = config.lastPushAt ? new Date(config.lastPushAt) : null

  switch (config.frequency) {
    case 'daily':
      if (!lastPush) return true
      return now.toISOString().split('T')[0] !== lastPush.toISOString().split('T')[0]
    case 'weekly':
      if (!lastPush) return true
      return (now.getTime() - lastPush.getTime()) > 7 * 24 * 60 * 60 * 1000
    case 'important-only':
      return true
    default:
      return false
  }
}

/** 记录推送时间 */
export function recordPushTime(): void {
  saveSubscriptionConfig({ lastPushAt: new Date().toISOString() })
}
