import type { VercelRequest, VercelResponse } from '@vercel/node'

// 环境变量（配置后生效）：
// MCH_ID - 微信商户号
// API_KEY - 微信支付API密钥
// APP_ID - 小程序/H5 AppID

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { productId, productName, price } = req.body

  // 参数验证
  if (!productId || !productName || !price) {
    return res.status(400).json({ error: '缺少必要参数' })
  }

  // 验证商品价格（防止篡改）
  const VALID_PRODUCTS: Record<string, number> = {
    subsidy_full_unlock: 990,
    monthly_pass: 1990,
  }
  if (VALID_PRODUCTS[productId] !== price) {
    return res.status(400).json({ error: '商品价格不匹配' })
  }

  const mchId = process.env.MCH_ID
  const apiKey = process.env.API_KEY
  const appId = process.env.APP_ID

  // 未配置商户信息时，拒绝创建订单（防止伪造支付）
  if (!mchId || !apiKey || !appId) {
    return res.status(503).json({
      error: '支付服务暂未开通',
      message: '商户信息未配置，请联系管理员',
    })
  }

  // TODO: 实际实现需要：
  // 1. 调用微信支付统一下单API (https://api.mch.weixin.qq.com/v3/pay/transactions/h5)
  // 2. 返回真实支付参数
  // 3. 支付回调验证签名后才能确认支付成功

  return res.status(503).json({
    error: '支付服务暂未开通',
    message: '请稍后再试',
  })
}
