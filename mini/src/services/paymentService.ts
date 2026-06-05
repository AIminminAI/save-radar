export interface PaymentProduct {
  id: string
  name: string
  description: string
  price: number // in fen (分)
  priceYuan: string // display price in yuan
}

export const PRODUCTS = {
  SUBSIDY_FULL: {
    id: 'subsidy_full_unlock',
    name: '补贴计算器完整结果',
    description: '解锁全部补贴匹配结果及申请指南',
    price: 990, // 9.9元
    priceYuan: '9.9',
  },
  MONTHLY_PASS: {
    id: 'monthly_pass',
    name: '省钱雷达月卡',
    description: '30天内无限次查看所有政策解读',
    price: 1990, // 19.9元
    priceYuan: '19.9',
  },
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
  expiresAt?: string // for monthly pass
}

const PURCHASES_STORAGE_KEY = 'purchaseRecords'

function isDevMode(): boolean {
  // @ts-expect-error wx is WeChat Mini Program global
  return typeof wx === 'undefined' || typeof wx.cloud === 'undefined'
}

async function mockPayment(product: PaymentProduct): Promise<PaymentResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const orderId = `MOCK${Date.now()}${Math.random().toString(36).substr(2, 6)}`
      resolve({ success: true, orderId })
    }, 1000)
  })
}

async function cloudPayment(product: PaymentProduct): Promise<PaymentResult> {
  try {
    // @ts-expect-error wx is WeChat Mini Program global
    const { result } = await wx.cloud.callFunction({
      name: 'createOrder',
      data: {
        productId: product.id,
        productName: product.name,
        price: product.price,
      },
    })

    if (!result || !result.package) {
      return { success: false, errorMsg: '创建订单失败' }
    }

    return new Promise((resolve) => {
      // @ts-expect-error wx is WeChat Mini Program global
      wx.requestPayment({
        timeStamp: result.timeStamp,
        nonceStr: result.nonceStr,
        package: result.package,
        signType: result.signType as 'MD5' | 'HMAC-SHA256',
        paySign: result.paySign,
        success: () => {
          resolve({ success: true, orderId: result.outTradeNo })
        },
        fail: (err: { errMsg?: string }) => {
          const msg = err.errMsg || '支付失败'
          if (msg.includes('cancel')) {
            resolve({ success: false, errorMsg: '支付已取消' })
          } else {
            resolve({ success: false, errorMsg: msg })
          }
        },
      })
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '支付服务异常'
    return { success: false, errorMsg: message }
  }
}

export async function requestPayment(product: PaymentProduct): Promise<PaymentResult> {
  if (isDevMode()) {
    return mockPayment(product)
  }
  return cloudPayment(product)
}

export function savePurchase(product: PaymentProduct, orderId: string): void {
  const records = getPurchases()
  const now = new Date().toISOString()
  const record: PurchaseRecord = {
    productId: product.id,
    orderId,
    purchasedAt: now,
  }

  if (product.id === PRODUCTS.MONTHLY_PASS.id) {
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)
    record.expiresAt = expiry.toISOString()
  }

  records.push(record)
  uni.setStorageSync(PURCHASES_STORAGE_KEY, JSON.stringify(records))
}

export function hasPurchased(productId: string): boolean {
  const records = getPurchases()
  return records.some((r) => r.productId === productId)
}

export function getPurchases(): PurchaseRecord[] {
  try {
    const raw = uni.getStorageSync(PURCHASES_STORAGE_KEY)
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
  const records = getPurchases()
  const now = new Date()
  return records.some((r) => {
    if (r.productId !== PRODUCTS.MONTHLY_PASS.id || !r.expiresAt) return false
    return new Date(r.expiresAt) > now
  })
}
