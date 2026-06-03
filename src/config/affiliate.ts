export const affiliateLinks = {
  taobao: {
    name: '淘宝联盟',
    description: '手机话费充值 - 全国通用 + 自动充值 + 快速到账',
    url: 'https://s.click.taobao.com/rPV9SQl',
  },
  jd: {
    name: '京东联盟',
    description: '手机话费充值优惠',
    url: 'https://u.jd.com/ROtyYRy',
  },
}

export function getAffiliateLink(carrier: string): string {
  if (carrier === 'mobile') return affiliateLinks.taobao.url
  if (carrier === 'unicom') return affiliateLinks.jd.url
  if (carrier === 'telecom') return affiliateLinks.jd.url
  return affiliateLinks.taobao.url
}

export function getAllAffiliateLinks() {
  return affiliateLinks
}
