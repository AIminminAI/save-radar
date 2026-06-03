import { useRef, useCallback } from 'react'
import { Download } from 'lucide-react'

interface SharePosterProps {
  policyTitle: string
  impactDesc: string
  productName?: string
}

export default function SharePoster({ policyTitle, impactDesc, productName = '省钱雷达' }: SharePosterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generatePoster = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 375
    const height = 520
    canvas.width = width
    canvas.height = height

    // 背景
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#1A1A2E')
    gradient.addColorStop(1, '#2D3561')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // 产品名
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText(productName, 24, 50)

    // 分隔线
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(24, 70)
    ctx.lineTo(width - 24, 70)
    ctx.stroke()

    // 政策标题
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 18px sans-serif'
    const titleLines = wrapText(ctx, policyTitle, width - 48)
    titleLines.forEach((line, i) => {
      ctx.fillText(line, 24, 105 + i * 26)
    })

    // 影响描述
    const descY = 105 + titleLines.length * 26 + 20
    ctx.fillStyle = '#FF6B35'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('💡 影响你：', 24, descY)

    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '14px sans-serif'
    const descLines = wrapText(ctx, impactDesc, width - 48)
    descLines.forEach((line, i) => {
      ctx.fillText(line, 24, descY + 24 + i * 22)
    })

    // 二维码占位
    const qrY = height - 140
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.roundRect(24, qrY, width - 48, 116, 12)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText('扫码查看完整解读', 24, qrY + 30)

    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '11px sans-serif'
    ctx.fillText('长按保存图片，分享给朋友', 24, qrY + 52)

    // 二维码占位框
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(width - 100, qrY + 12, 60, 60, 8)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('二维码', width - 70, qrY + 47)
    ctx.textAlign = 'start'

    // 底部
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '10px sans-serif'
    ctx.fillText('由「省钱雷达」生成 · 仅供参考', 24, height - 12)
  }, [policyTitle, impactDesc, productName])

  const handleSave = () => {
    generatePoster()
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `省钱雷达-${policyTitle.slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={handleSave}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold active:scale-95 transition-transform"
      >
        <Download size={14} />
        生成分享海报
      </button>
    </div>
  )
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let currentLine = ''
  for (const char of text) {
    const testLine = currentLine + char
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine)
      currentLine = char
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines.slice(0, 5) // 最多5行
}
