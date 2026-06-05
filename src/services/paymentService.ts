export interface PaymentProduct {
  id: string
  name: string
  description: string
  price: number // in fen
  priceYuan: string
}

export interface PaymentResult {
  success: boolean
  orderId?: string
  errorMsg?: string
}

export interface PurchaseRecord {
  productId: string
  orderId: string
  purchasedAt: string
  expiresAt?: string
}

export const PRODUCTS = {
  SUBSIDY_FULL: {
    id: 'subsidy_full_unlock',
    name: '补贴计算器完整结果',
    description: '解锁全部补贴匹配结果及申请指南',
    price: 990,
    priceYuan: '9.9',
  },
  MONTHLY_PASS: {
    id: 'monthly_pass',
    name: '省钱雷达月卡',
    description: '30天内无限次查看所有政策解读',
    price: 1990,
    priceYuan: '19.9',
  },
}

const PURCHASES_KEY = 'sr_purchases'

function isWeChatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent)
}

async function mockPayment(product: PaymentProduct): Promise<PaymentResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const orderId = `SR${Date.now()}${Math.random().toString(36).substr(2, 6)}`
      resolve({ success: true, orderId })
    }, 1000)
  })
}

async function wechatH5Payment(product: PaymentProduct): Promise<PaymentResult> {
  try {
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        price: product.price,
      }),
    })

    if (!response.ok) {
      return { success: false, errorMsg: '创建订单失败' }
    }

    const payParams = await response.json()

    // Use WeChat JSAPI payment
    if (typeof (window as any).WeixinJSBridge !== 'undefined') {
      return new Promise((resolve) => {
        ;(window as any).WeixinJSBridge.invoke(
          'getBrandWCPayRequest',
          {
            appId: payParams.appId,
            timeStamp: payParams.timeStamp,
            nonceStr: payParams.nonceStr,
            package: payParams.package,
            signType: payParams.signType,
            paySign: payParams.paySign,
          },
          (res: any) => {
            if (res.err_msg === 'get_brand_wcpay_request:ok') {
              resolve({ success: true, orderId: payParams.outTradeNo })
            } else {
              resolve({ success: false, errorMsg: '支付取消或失败' })
            }
          }
        )
      })
    }

    // WeixinJSBridge not ready yet, wait for it
    return new Promise((resolve) => {
      if (typeof (window as any).WeixinJSBridge === 'undefined') {
        ;(document as any).addEventListener('WeixinJSBridgeReady', () => {
          ;(window as any).WeixinJSBridge.invoke(
            'getBrandWCPayRequest',
            {
              appId: payParams.appId,
              timeStamp: payParams.timeStamp,
              nonceStr: payParams.nonceStr,
              package: payParams.package,
              signType: payParams.signType,
              paySign: payParams.paySign,
            },
            (res: any) => {
              if (res.err_msg === 'get_brand_wcpay_request:ok') {
                resolve({ success: true, orderId: payParams.outTradeNo })
              } else {
                resolve({ success: false, errorMsg: '支付取消或失败' })
              }
            }
          )
        }, false)
      }
    })
  } catch {
    return { success: false, errorMsg: '支付请求失败' }
  }
}

async function genericPayment(product: PaymentProduct): Promise<PaymentResult> {
  // Non-WeChat browser: redirect or show QR code
  try {
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        productName: product.name,
        price: product.price,
      }),
    })

    if (!response.ok) {
      return { success: false, errorMsg: '创建订单失败' }
    }

    const data = await response.json()

    // If backend returns a redirect URL (H5 payment via MWEB)
    if (data.mwebUrl) {
      window.location.href = data.mwebUrl
      return { success: true, orderId: data.outTradeNo }
    }

    // Fallback: show QR code page or redirect
    if (data.payUrl) {
      window.location.href = data.payUrl
      return { success: true, orderId: data.outTradeNo }
    }

    // Payment URL not returned - payment failed
    return { success: false, errorMsg: '支付渠道暂不可用，请稍后重试' }
  } catch {
    return { success: false, errorMsg: '支付请求失败' }
  }
}

export async function requestPayment(product: PaymentProduct): Promise<PaymentResult> {
  const isDev = import.meta.env.DEV

  if (isDev) {
    console.warn('[Payment] 开发模式：使用模拟支付，生产环境将使用真实支付')
    const result = await mockPayment(product)
    if (result.success && result.orderId) {
      savePurchase(product, result.orderId)
    }
    return result
  }

  if (isWeChatBrowser()) {
    const result = await wechatH5Payment(product)
    if (result.success && result.orderId) {
      savePurchase(product, result.orderId)
    }
    return result
  }

  const result = await genericPayment(product)
  if (result.success && result.orderId) {
    savePurchase(product, result.orderId)
  }
  return result
}

export function savePurchase(product: PaymentProduct, orderId: string): void {
  const purchases = getPurchases()
  const record: PurchaseRecord = {
    productId: product.id,
    orderId,
    purchasedAt: new Date().toISOString(),
    expiresAt:
      product.id === PRODUCTS.MONTHLY_PASS.id
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
  }
  purchases.push(record)
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases))
}

export function hasPurchased(productId: string): boolean {
  const purchases = getPurchases()
  return purchases.some((p) => {
    if (p.productId !== productId) return false
    if (p.expiresAt) {
      return new Date(p.expiresAt) > new Date()
    }
    return true
  })
}

export function getPurchases(): PurchaseRecord[] {
  try {
    const raw = localStorage.getItem(PURCHASES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PurchaseRecord[]
  } catch {
    return []
  }
}

export function isSubsidyUnlocked(): boolean {
  return hasPurchased(PRODUCTS.SUBSIDY_FULL.id) || isMonthlyPassActive()
}

export function isMonthlyPassActive(): boolean {
  return hasPurchased(PRODUCTS.MONTHLY_PASS.id)
}
