import { Share2, Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface ShareCardProps {
  policyTitle: string
  summary: string
  policyId: string
  onClose?: () => void
}

export default function ShareCard({ policyTitle, summary, policyId, onClose }: ShareCardProps) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const { incrementShareCount } = useAppStore()

  const shareText = `【省钱雷达】${policyTitle} - ${summary}，快来看看影响你什么！`
  const shareUrl = `${window.location.origin}/policies?id=${policyId}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '省钱雷达 - 政策解读',
          text: shareText,
          url: shareUrl,
        })
        onShareSuccess()
      } catch {
        // 用户取消分享，不做处理
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        setCopied(true)
        onShareSuccess()
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // 剪贴板写入失败
      }
    }
  }

  const onShareSuccess = () => {
    if (!shared) {
      incrementShareCount()
      setShared(true)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
      <div className="mb-3">
        <h4 className="text-sm font-black text-gray-800 mb-1 line-clamp-2">{policyTitle}</h4>
        <p className="text-xs text-gray-500 line-clamp-2">{summary}</p>
      </div>

      <div className="bg-gradient-to-r from-[#1A1A2E] to-[#2D3561] rounded-xl p-3 mb-3">
        <p className="text-white text-xs font-bold mb-1">💡 分享给朋友，解锁完整解读</p>
        <p className="text-white/60 text-[10px]">每分享1次可解锁5条完整解读，分享3次解锁全部</p>
      </div>

      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
        style={{
          background: copied
            ? '#00D68F'
            : 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
        }}
      >
        {copied ? (
          <>
            <Check size={16} />
            已复制链接
          </>
        ) : (
          <>
            <Share2 size={16} />
            分享给朋友，解锁完整解读
          </>
        )}
      </button>

      {shared && (
        <p className="text-center text-[10px] text-[#00D68F] mt-2 font-bold">
          ✅ 分享成功！已解锁更多解读额度
        </p>
      )}

      {!navigator.share && (
        <p className="text-center text-[10px] text-gray-400 mt-2 flex items-center justify-center gap-1">
          <Copy size={10} />
          当前浏览器不支持分享，已复制链接到剪贴板
        </p>
      )}
    </div>
  )
}
