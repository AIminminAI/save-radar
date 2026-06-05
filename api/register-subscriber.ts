import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * 注册推送订阅用户
 *
 * 实际部署需要：
 * 1. 连接数据库（MongoDB/PostgreSQL）存储订阅用户
 * 2. 集成邮件服务或Web Push服务
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { frequency, city, education, employment, isWeChat } = req.body

  // TODO: 存储到数据库
  // 目前仅返回成功，实际需要持久化订阅信息
  console.log('New subscriber:', { frequency, city, education, employment, isWeChat })

  return res.status(200).json({
    success: true,
    message: '订阅成功',
  })
}
