/**
 * 广告位配置
 *
 * 使用方式：
 * 1. 在微信后台 https://mp.weixin.qq.com → 流量主 → 广告位管理 中创建广告位
 * 2. 将生成的广告位ID填入下方对应位置
 * 3. 重新编译小程序即可生效
 *
 * 注意：需要先开通流量主（累计独立访客UV >= 1000）
 * 如果UV不够1000，可以先填空字符串，小程序不会展示广告但也不会报错
 */

export const AD_CONFIG = {
  /** 首页banner广告位ID */
  bannerHome: '',

  /** 政策详情页banner广告位ID */
  bannerPolicy: '',

  /** 补贴计算器激励视频广告位ID（看广告解锁） */
  rewardedCalculator: '',

  /** 政策列表插屏广告位ID（每查看5条政策展示一次） */
  interstitialPolicies: '',

  /** 通用激励视频广告位ID（看广告增加免费额度） */
  rewardedGeneral: '',
}

/** 检查是否有任何广告位已配置 */
export function hasAnyAdConfigured(): boolean {
  return Object.values(AD_CONFIG).some(id => id.length > 0)
}
