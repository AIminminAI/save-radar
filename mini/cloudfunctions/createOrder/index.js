// 云函数：创建支付订单
// 部署前需要配置：
// 1. 在微信商户平台获取商户号(mchId)和API密钥(apiKey)
// 2. 在微信开放平台绑定小程序AppID和商户号
// 3. 上传商户证书到云函数目录

const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// TODO: 替换为你的商户号和API密钥
const MCH_ID = '' // 商户号
const API_KEY = '' // API密钥
const APP_ID = 'wx37ad636fcc51ce5f' // 小程序AppID

// 合法商品价格表（防止价格篡改）
const VALID_PRODUCTS = {
  subsidy_full_unlock: 990,
  monthly_pass: 1990,
}

exports.main = async (event) => {
  const { productId, price, openid } = event

  // 验证商品价格
  if (!productId || VALID_PRODUCTS[productId] !== price) {
    return { error: '商品价格不匹配' }
  }

  // 未配置商户信息时，拒绝创建订单（防止伪造支付）
  if (!MCH_ID || !API_KEY) {
    return { error: '支付服务暂未开通，请联系管理员' }
  }

  // 生成订单号
  const outTradeNo = `SR${Date.now()}${Math.random().toString(36).substr(2, 6)}`

  // 调用微信支付统一下单API
  // 完整实现需要：
  // 1. 构造统一下单请求参数
  // 2. 签名：将参数按字典序排列，拼接API密钥，做MD5签名
  // 3. 发送请求到微信支付统一下单API
  // 4. 解析返回的prepay_id
  // 5. 生成前端支付参数并签名

  return { error: '支付服务暂未开通，请稍后再试' }
}
