import type { VercelRequest, VercelResponse } from '@vercel/node'

// TODO: 配置以下环境变量
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

  // TODO: 实际实现需要：
  // 1. 验证请求参数
  // 2. 调用微信支付统一下单API (https://api.mch.weixin.qq.com/v3/pay/transactions/h5)
  // 3. 返回支付参数

  // 开发模式返回模拟数据
  const outTradeNo = `SR${Date.now()}${Math.random().toString(36).substr(2, 6)}`

  return res.status(200).json({
    timeStamp: String(Math.floor(Date.now() / 1000)),
    nonceStr: Math.random().toString(36).substr(2, 15),
    package: `prepay_id=wx${Date.now()}`,
    signType: 'MD5',
    paySign: 'mock_sign',
    outTradeNo,
  })
}
