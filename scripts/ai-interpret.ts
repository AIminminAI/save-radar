import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface AIInterpretation {
  summary: string
  impactOnYou: Record<string, string>
  whatToDo: Record<string, string>
  moneyImpact: string
  urgency: 'high' | 'medium' | 'low'
  interpretedAt: string
}

interface ScrapedCoupon {
  id: string
  title: string
  carrier: string
  carrierName: string
  discountAmount: number
  originalPrice?: number
  discountPrice?: number
  discountRate?: string
  expirationDate: string
  category: string
  type?: 'coupon' | 'policy'
  region?: string
  guide: string[]
  claimUrl: string
  isHot: boolean
  isNew: boolean
  tags: string[]
  source: string
  scrapedAt: string
  aiInterpretation?: AIInterpretation
}

const COUPON_FILES = [
  path.join(__dirname, '..', 'public', 'data', 'coupons.json'),
  path.join(__dirname, '..', 'data', 'coupons.json'),
]

const API_KEY = process.env.DEEPSEEK_API_KEY
if (!API_KEY) {
  console.error('[AI] 错误: 未设置 DEEPSEEK_API_KEY 环境变量')
  process.exit(1)
}

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: 'https://api.deepseek.com',
})

function buildPrompt(coupon: ScrapedCoupon): string {
  return `你是一个民生政策解读专家。请对以下政策标题进行解读，生成5种人群的个性化影响分析。

政策标题：${coupon.title}
政策来源：${coupon.source}
政策分类：${coupon.category}

请返回严格的JSON格式（不要markdown代码块）：
{
  "summary": "一句话概括政策核心内容（15字内）",
  "impactOnYou": {
    "office-worker": "对上班族的影响（20字内，用大白话）",
    "parent": "对宝妈/家长的影响（20字内，用大白话）",
    "student": "对学生的影响（20字内，用大白话）",
    "elderly": "对老年人的影响（20字内，用大白话）",
    "freelancer": "对自由职业者的影响（20字内，用大白话）"
  },
  "whatToDo": {
    "office-worker": "上班族该做什么（15字内）",
    "parent": "宝妈该做什么（15字内）",
    "student": "学生该做什么（15字内）",
    "elderly": "老人该做什么（15字内）",
    "freelancer": "自由职业者该做什么（15字内）"
  },
  "moneyImpact": "对钱包的影响描述（20字内，如'每月到手可能多200元'或'看病自付可能减少'）",
  "urgency": "high或medium或low"
}

要求：
1. 用大白话，不要官话套话
2. 如果该政策对某类人群影响不大，写"跟你关系不大"
3. moneyImpact要具体，不要"待确认"
4. urgency: 直接影响钱包的=high，间接影响=medium，关系不大=low`
}

function isWithin24Hours(isoString: string): boolean {
  try {
    const interpretedAt = new Date(isoString)
    const now = new Date()
    const hoursDiff = (now.getTime() - interpretedAt.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  } catch {
    return false
  }
}

function parseAIResponse(text: string): Omit<AIInterpretation, 'interpretedAt'> | null {
  try {
    // 尝试直接解析
    return JSON.parse(text)
  } catch {
    // 尝试去除 markdown 代码块
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim())
      } catch {
        return null
      }
    }
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function interpretOne(coupon: ScrapedCoupon): Promise<AIInterpretation | null> {
  const prompt = buildPrompt(coupon)

  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      console.error(`  [AI] 政策 "${coupon.title}" 返回内容为空`)
      return null
    }

    const parsed = parseAIResponse(content)
    if (!parsed) {
      console.error(`  [AI] 政策 "${coupon.title}" 解析JSON失败`)
      return null
    }

    // 验证必要字段
    if (!parsed.summary || !parsed.impactOnYou || !parsed.whatToDo || !parsed.moneyImpact || !parsed.urgency) {
      console.error(`  [AI] 政策 "${coupon.title}" 返回数据缺少必要字段`)
      return null
    }

    // 校验 urgency 值
    if (!['high', 'medium', 'low'].includes(parsed.urgency)) {
      parsed.urgency = 'low'
    }

    return {
      ...parsed,
      interpretedAt: new Date().toISOString(),
    } as AIInterpretation
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`  [AI] 政策 "${coupon.title}" 调用失败: ${msg}`)
    return null
  }
}

async function main() {
  console.log('[AI] DeepSeek 政策解读脚本启动')

  // 读取数据（以 public/data/coupons.json 为主）
  const primaryFile = COUPON_FILES[0]
  if (!fs.existsSync(primaryFile)) {
    console.error(`[AI] 数据文件不存在: ${primaryFile}`)
    process.exit(1)
  }

  const coupons: ScrapedCoupon[] = JSON.parse(fs.readFileSync(primaryFile, 'utf-8'))
  console.log(`[AI] 共读取 ${coupons.length} 条数据`)

  let success = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < coupons.length; i++) {
    const coupon = coupons[i]

    // 跳过已有且在24小时内的解读
    if (coupon.aiInterpretation?.interpretedAt && isWithin24Hours(coupon.aiInterpretation.interpretedAt)) {
      console.log(`[${i + 1}/${coupons.length}] 跳过: ${coupon.title}`)
      skipped++
      continue
    }

    console.log(`[${i + 1}/${coupons.length}] 解读中: ${coupon.title}`)

    const interpretation = await interpretOne(coupon)

    if (interpretation) {
      coupon.aiInterpretation = interpretation
      success++
      console.log(`  -> 成功: ${interpretation.summary}`)
    } else {
      failed++
    }

    // 限流：每秒最多1次请求（最后一条不需要等待）
    if (i < coupons.length - 1) {
      await sleep(1000)
    }
  }

  // 写回文件
  const jsonContent = JSON.stringify(coupons, null, 2)
  for (const filePath of COUPON_FILES) {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, jsonContent, 'utf-8')
    console.log(`[AI] 已写入: ${filePath}`)
  }

  console.log('\n[AI] ========== 执行完成 ==========')
  console.log(`[AI] 总计: ${coupons.length} 条`)
  console.log(`[AI] 成功: ${success} 条`)
  console.log(`[AI] 失败: ${failed} 条`)
  console.log(`[AI] 跳过: ${skipped} 条`)
}

main().catch(err => {
  console.error('[AI] 脚本异常退出:', err)
  process.exit(1)
})
