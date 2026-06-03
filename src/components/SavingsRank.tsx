import { useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

interface RankUser {
  name: string
  icon: string
  score: number
}

const VIRTUAL_TOP3: RankUser[] = [
  { name: '省钱小能手', icon: '💰', score: 9800 },
  { name: '政策达人', icon: '📋', score: 8650 },
  { name: '精打细算王', icon: '🧮', score: 7200 },
]

export default function SavingsRank() {
  const { favorites, shareCount } = useAppStore()

  // Read challenge record from localStorage
  const challengeRecord = useMemo(() => {
    try {
      const raw = localStorage.getItem('money_challenge_record')
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return { streak: 0, totalCorrect: 0, totalAnswered: 0 }
  }, [])

  // Calculate user score: answer correct * 100 + share * 200 + favorites * 50
  const userScore = useMemo(() => {
    return challengeRecord.totalCorrect * 100 + shareCount * 200 + favorites.length * 50
  }, [challengeRecord.totalCorrect, shareCount, favorites.length])

  // Generate rank based on score (deterministic based on score)
  const { rank, totalUsers } = useMemo(() => {
    // Base rank calculation - higher score = lower rank number
    const base = Math.max(1, 50000 - userScore * 5)
    const noise = ((userScore * 7 + 13) % 100)
    const rank = Math.max(1, Math.floor(base + noise))
    const totalUsers = 328000 + Math.floor(((userScore * 3 + 7) % 500))
    return { rank, totalUsers }
  }, [userScore])

  const rankPercent = ((1 - rank / totalUsers) * 100).toFixed(1)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="px-4 mt-4">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A1A2E] to-[#2D3561] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={18} className="text-yellow-400" />
            <span className="text-white font-black text-base">省钱排行榜</span>
          </div>
          <p className="text-white/50 text-[10px]">答题 · 分享 · 收藏 = 排名</p>
        </div>

        {/* User rank */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-[10px] mb-0.5">你的排名</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[#FF6B35] font-black text-2xl">
                  {rank.toLocaleString()}
                </span>
                <span className="text-gray-400 text-xs">/ {totalUsers.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-[10px] mb-0.5">超越了</p>
              <span className="text-[#00D68F] font-black text-lg">{rankPercent}%</span>
              <span className="text-gray-400 text-xs"> 的用户</span>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="mt-3 flex gap-3">
            <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400">答题</p>
              <p className="text-xs font-black text-[#1A1A2E]">{challengeRecord.totalCorrect}</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400">分享</p>
              <p className="text-xs font-black text-[#1A1A2E]">{shareCount}</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400">收藏</p>
              <p className="text-xs font-black text-[#1A1A2E]">{favorites.length}</p>
            </div>
            <div className="flex-1 bg-[#FFF5F0] rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400">总分</p>
              <p className="text-xs font-black text-[#FF6B35]">{userScore}</p>
            </div>
          </div>
        </div>

        {/* Top 3 */}
        <div className="p-4">
          <p className="text-[10px] text-gray-400 font-bold mb-3">🏆 排行榜 TOP 3</p>
          <div className="space-y-2.5">
            {VIRTUAL_TOP3.map((user, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50"
              >
                <span className="text-xl flex-shrink-0">{medals[idx]}</span>
                <span className="text-lg flex-shrink-0">{user.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{user.name}</p>
                </div>
                <span className="text-xs font-black text-[#FF6B35] flex-shrink-0">
                  {user.score.toLocaleString()}分
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
