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

exports.main = async (event) => {
  const { productId, productName, price, openid } = event

  // 生成订单号
  const outTradeNo = `SR${Date.now()}${Math.random().toString(36).substr(2, 6)}`

  // 调用微信支付统一下单API
  // 完整实现需要：
  // 1. 构造统一下单请求参数
  //    - appid: 小程序AppID
  //    - mch_id: 商户号
  //    - nonce_str: 随机字符串
  //    - body: 商品描述
  //    - out_trade_no: 商户订单号
  //    - total_fee: 金额（分）
  //    - spbill_create_ip: 终端IP
  //    - notify_url: 支付结果通知回调地址
  //    - trade_type: 交易类型（JSAPI）
  //    - openid: 用户标识
  // 2. 签名：将参数按字典序排列，拼接API密钥，做MD5签名
  // 3. 发送请求到微信支付统一下单API：https://api.mch.weixin.qq.com/pay/unifiedorder
  // 4. 解析返回的prepay_id
  // 5. 生成前端支付参数并签名

  // 返回支付参数给前端
  return {
    timeStamp: String(Math.floor(Date.now() / 1000)),
    nonceStr: Math.random().toString(36).substr(2, 15),
    package: `prepay_id=wx${Date.now()}`, // 实际应从统一下单API获取
    signType: 'MD5',
    paySign: '', // 实际应根据参数生成签名
    outTradeNo,
  }
}
