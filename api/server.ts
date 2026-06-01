import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import path from 'path'
import fs from 'fs'
import apiRouter from './routes/api.js'
import { startCronJobs } from './services/cron.js'

const app = express()
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  `http://localhost:${PORT}`,
  process.env.SITE_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined,
].filter(Boolean) as string[]

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true
  if (ALLOWED_ORIGINS.includes(origin)) return true
  if (origin.endsWith('.vercel.app')) return true
  if (origin.endsWith('.railway.app')) return true
  if (origin.endsWith('.up.railway.app')) return true
  return false
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true)
    } else {
      console.log(`[CORS] 拒绝来源: ${origin}`)
      callback(null, false)
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
  maxAge: 86400,
}))

app.use(express.json({ limit: '1mb' }))

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: '请求过于频繁，请稍后再试' },
})

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: '写操作过于频繁，请稍后再试' },
})

app.use('/api/coupons', apiLimiter)
app.use('/api/scrape/status', apiLimiter)
app.use('/api/meta', apiLimiter)
app.use('/api/scrape', writeLimiter)
app.use('/api/coupons/:id', writeLimiter)

const API_TOKEN = process.env.API_TOKEN || ''

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!API_TOKEN) return next()

  const auth = req.headers.authorization
  if (auth === `Bearer ${API_TOKEN}`) return next()

  res.status(401).json({ success: false, error: '未授权访问' })
}

app.use('/api/scrape', requireAuth)
app.use('/api/coupons/:id', requireAuth)
app.use('/api/coupons', (req, res, next) => {
  if (req.method !== 'GET') return requireAuth(req, res, next)
  next()
})

app.use('/api', apiRouter)

if (isProd) {
  const distPath = path.join(process.cwd(), 'dist')
  if (!fs.existsSync(distPath)) {
    console.error('[Server] 错误: dist/目录不存在，请先运行 npm run build')
    process.exit(1)
  }

  app.use(express.static(distPath, {
    maxAge: isProd ? 86400000 : 0,
    etag: true,
  }))

  app.get('{*splat}', (_req, res) => {
    const indexPath = path.join(distPath, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath)
    } else {
      res.status(404).json({ error: '页面未找到' })
    }
  })
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: isProd ? 'production' : 'development',
    port: PORT,
  })
})

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 Bill Radar 生产服务器已启动')
  console.log('='.repeat(60))
  console.log(`  模式:     ${isProd ? '生产环境 ✅' : '开发模式 ⚠️'}`)
  console.log(`  地址:     http://localhost:${PORT}`)
  console.log(`  前端:     ${isProd ? '静态文件服务 ✅' : 'Vite开发服务器'}`)
  console.log(`  CORS:     ${ALLOWED_ORIGINS.join(', ')}`)
  console.log(`  鉴权:     ${API_TOKEN ? `Bearer Token 已配置 (${API_TOKEN.substring(0,10)}...)` : '⚠️ 未配置API_TOKEN'}`)
  console.log(`  限流:     读 120次/分钟 | 写 20次/分钟`)
  console.log(`  SSL:      ${isProd ? '生产环境验证开启 ✅' : '开发环境关闭 ⚠️'}`)
  console.log('='.repeat(60))
  startCronJobs()
})
