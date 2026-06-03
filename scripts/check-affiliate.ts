/**
 * 推广链接有效性检测脚本
 * 检测淘宝联盟和京东联盟的推广链接是否仍然有效
 * 用法: npx tsx scripts/check-affiliate.ts
 */
import axios from 'axios'

const LINKS = [
  {
    name: '淘宝联盟-话费充值',
    url: 'https://s.click.taobao.com/rPV9SQl',
    platform: 'taobao',
    expectContains: ['taobao', 'tmall', '充值', '话费'],
  },
  {
    name: '京东联盟-话费充值',
    url: 'https://u.jd.com/ROtyYRy',
    platform: 'jd',
    expectContains: ['jd.com', '京东', '充值', '话费'],
  },
]

async function checkLink(link: typeof LINKS[0]) {
  console.log(`\n检查: ${link.name}`)
  console.log(`  URL: ${link.url}`)

  try {
    const response = await axios.get(link.url, {
      timeout: 15000,
      maxRedirects: 10,
      validateStatus: () => true, // 不抛异常，接受所有状态码
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    })

    const finalUrl = response.request?.res?.responseUrl || response.config?.url || link.url
    const statusCode = response.status
    const contentType = response.headers['content-type'] || ''
    const body = typeof response.data === 'string' ? response.data : ''

    console.log(`  状态码: ${statusCode}`)
    console.log(`  最终URL: ${finalUrl}`)
    console.log(`  Content-Type: ${contentType}`)

    // 判断链接是否有效
    const issues: string[] = []

    if (statusCode >= 400) {
      issues.push(`❌ HTTP ${statusCode} - 链接已失效`)
    }

    if (statusCode === 302 || statusCode === 301) {
      issues.push(`⚠️ 重定向未跟随 - 可能需要手动验证`)
    }

    // 检查最终URL是否包含期望的关键词
    const matchedKeywords = link.expectContains.filter(kw =>
      finalUrl.toLowerCase().includes(kw.toLowerCase()) ||
      body.includes(kw)
    )

    if (matchedKeywords.length === 0 && statusCode < 400) {
      issues.push(`⚠️ 最终页面不包含预期关键词(${link.expectContains.join('/')}) - 可能已更换落地页`)
    }

    // 检查是否跳转到错误页面
    if (body.includes('页面不存在') || body.includes('404') || body.includes('链接已失效') || body.includes('活动已结束')) {
      issues.push(`❌ 页面显示"不存在/已失效/已结束"`)
    }

    // 检查淘宝特有错误
    if (link.platform === 'taobao') {
      if (finalUrl.includes('error') || body.includes('链接已过期')) {
        issues.push(`❌ 淘宝推广链接已过期`)
      }
      if (finalUrl.includes('s.click.taobao.com') && !finalUrl.includes('taobao.com/item')) {
        // 短链接没有跳转到商品页
        if (statusCode === 200 && body.length < 500) {
          issues.push(`⚠️ 短链接未正确跳转到商品页`)
        }
      }
    }

    // 检查京东特有错误
    if (link.platform === 'jd') {
      if (finalUrl.includes('u.jd.com') && statusCode === 200 && body.length < 200) {
        issues.push(`⚠️ 京东短链接可能已失效`)
      }
      if (body.includes('商品已下架') || body.includes('活动已结束')) {
        issues.push(`❌ 京东商品已下架或活动已结束`)
      }
    }

    if (issues.length === 0) {
      console.log(`  ✅ 链接有效 - 跳转到: ${finalUrl.slice(0, 80)}...`)
      if (matchedKeywords.length > 0) {
        console.log(`  📌 匹配关键词: ${matchedKeywords.join(', ')}`)
      }
    } else {
      issues.forEach(issue => console.log(`  ${issue}`))
    }

    return { name: link.name, valid: issues.length === 0, issues }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.log(`  ❌ 请求失败: ${msg}`)
    return { name: link.name, valid: false, issues: [`请求失败: ${msg}`] }
  }
}

async function main() {
  console.log('========================================')
  console.log('  推广链接有效性检测')
  console.log('  检测时间: ' + new Date().toLocaleString('zh-CN'))
  console.log('========================================')

  const results = []
  for (const link of LINKS) {
    const result = await checkLink(link)
    results.push(result)
  }

  console.log('\n========================================')
  console.log('  检测结果汇总')
  console.log('========================================')

  const validCount = results.filter(r => r.valid).length
  results.forEach(r => {
    console.log(`  ${r.valid ? '✅' : '❌'} ${r.name} ${r.valid ? '有效' : '无效'}`)
    if (r.issues.length > 0) {
      r.issues.forEach(i => console.log(`     ${i}`))
    }
  })

  console.log(`\n  合计: ${validCount}/${results.length} 个链接有效`)

  if (validCount < results.length) {
    console.log('\n  ⚠️ 有链接已失效，请尽快更新 src/config/affiliate.ts 中的推广链接！')
    console.log('  淘宝联盟: https://pub.alimama.com/')
    console.log('  京东联盟: https://union.jd.com/')
  }
}

main().catch(console.error)
