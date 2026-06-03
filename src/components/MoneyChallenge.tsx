import { useState, useMemo } from 'react'
import { Share2, Flame, Trophy, Sparkles } from 'lucide-react'
import { useLivePolicies } from '@/hooks/useApi'
import { useAppStore } from '@/store/useAppStore'
import { getPersona } from '@/data/personas'
import { interpretPolicy } from '@/utils/policyInterpreter'

interface ChallengeRecord {
  streak: number
  lastAnswerDate: string
  totalCorrect: number
  totalAnswered: number
}

const STORAGE_KEY = 'money_challenge_record'

function getRecord(): ChallengeRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { streak: 0, lastAnswerDate: '', totalCorrect: 0, totalAnswered: 0 }
}

function saveRecord(record: ChallengeRecord) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

export default function MoneyChallenge() {
  const { policies } = useLivePolicies()
  const { selectedPersona } = useAppStore()
  const persona = getPersona(selectedPersona)

  const [record, setRecord] = useState<ChallengeRecord>(getRecord)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showCoins, setShowCoins] = useState(false)
  const [shakeWrong, setShakeWrong] = useState(false)

  const today = getTodayStr()
  const alreadyAnsweredToday = record.lastAnswerDate === today

  // Use today's date as seed so the question is consistent for the day
  const challengeData = useMemo(() => {
    if (policies.length < 3) return null

    const rng = seededRandom(today)
    const randVal = rng()
    const policyIndex = Math.floor(randVal * policies.length)
    const targetPolicy = policies[policyIndex]

    const interp = interpretPolicy(targetPolicy, persona)
    const correctAnswer = interp.impactOnYou

    // Collect wrong answers from other policies
    const otherImpacts = policies
      .filter((_, i) => i !== policyIndex)
      .map(p => interpretPolicy(p, persona).impactOnYou)
      .filter(imp => imp !== correctAnswer)

    if (otherImpacts.length < 2) return null

    // Pick 2 random wrong answers
    const shuffledOthers = shuffleArray(otherImpacts)
    const wrongAnswers = shuffledOthers.slice(0, 2)

    // Create options array and shuffle
    const options = shuffleArray([correctAnswer, ...wrongAnswers])
    const correctIndex = options.indexOf(correctAnswer)

    return {
      policy: targetPolicy,
      interp,
      options,
      correctIndex,
      correctAnswer,
    }
  }, [policies, today, persona])

  // Generate a consistent "beat percentage" based on today + streak
  const beatPercent = useMemo(() => {
    const rng = seededRandom(today + 'beat')
    return Math.floor(60 + rng() * 35)
  }, [today])

  const handleSelect = (index: number) => {
    if (showResult || alreadyAnsweredToday) return
    setSelectedOption(index)
    setShowResult(true)

    const isCorrect = index === challengeData?.correctIndex
    const newRecord = { ...record, lastAnswerDate: today, totalAnswered: record.totalAnswered + 1 }

    if (isCorrect) {
      newRecord.totalCorrect = record.totalCorrect + 1
      // Check if yesterday was answered (streak continuation)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      if (record.lastAnswerDate === yesterdayStr || record.streak === 0) {
        newRecord.streak = record.streak + 1
      } else {
        newRecord.streak = 1
      }
      setShowCoins(true)
      setTimeout(() => setShowCoins(false), 2000)
    } else {
      newRecord.streak = 0
      setShakeWrong(true)
      setTimeout(() => setShakeWrong(false), 600)
    }

    setRecord(newRecord)
    saveRecord(newRecord)
  }

  const handleShare = () => {
    const text = `我在省钱雷达答对了${record.totalCorrect}题，击败了${beatPercent}%的人！你能答对吗？`
    if (navigator.share) {
      navigator.share({ title: '省钱挑战', text }).catch(() => { /* ignore */ })
    } else {
      navigator.clipboard.writeText(text).catch(() => { /* ignore */ })
    }
    useAppStore.getState().incrementShareCount()
  }

  // Don't render if no challenge data
  if (!challengeData) return null

  const isCorrect = selectedOption === challengeData.correctIndex

  return (
    <div className="px-4 mt-3">
      <div
        className={`relative overflow-hidden rounded-2xl p-4 ${
          showResult
            ? isCorrect
              ? 'bg-gradient-to-br from-[#00C853] to-[#1B5E20]'
              : 'bg-gradient-to-br from-[#FF5252] to-[#B71C1C]'
            : 'bg-gradient-to-br from-[#FF6B35] to-[#E4393C]'
        } transition-all duration-500`}
      >
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />

        {/* Header */}
        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-yellow-300" />
            <span className="text-white font-black text-base">今日挑战</span>
          </div>
          {record.streak > 0 && (
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
              <Flame size={12} className="text-yellow-300" />
              <span className="text-white text-[11px] font-bold">连对{record.streak}天</span>
            </div>
          )}
        </div>

        {/* Question */}
        <div className="relative mb-3">
          <p className="text-white/80 text-xs mb-1.5">
            📋 {challengeData.interp.plainTitle}
          </p>
          <p className="text-white font-bold text-sm">
            这条政策，对你有什么影响？
          </p>
        </div>

        {/* Options */}
        {!alreadyAnsweredToday || showResult ? (
          <div className="relative space-y-2">
            {challengeData.options.map((option, idx) => {
              const isSelected = selectedOption === idx
              const isCorrectOption = idx === challengeData.correctIndex
              let optionStyle = 'bg-white/20 text-white border-white/30'

              if (showResult || alreadyAnsweredToday) {
                if (isCorrectOption) {
                  optionStyle = 'bg-[#00E676] text-[#1B5E20] border-[#00E676]'
                } else if (isSelected && !isCorrect) {
                  optionStyle = 'bg-[#FF8A80] text-[#B71C1C] border-[#FF8A80]'
                } else {
                  optionStyle = 'bg-white/10 text-white/50 border-white/10'
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={showResult || alreadyAnsweredToday}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-300 active:scale-[0.98] ${
                    optionStyle
                  } ${shakeWrong && isSelected ? 'animate-shake' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs font-bold leading-snug">{option}</span>
                    {showResult && isCorrectOption && (
                      <span className="ml-auto text-lg">✅</span>
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <span className="ml-auto text-lg">❌</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          /* Already answered today - show compact result */
          <div className="relative bg-white/15 rounded-xl p-3">
            <p className="text-white text-xs font-bold">
              ✅ 今天已答过！明天再来挑战
            </p>
            <p className="text-white/70 text-[10px] mt-1">
              已连续答对 {record.streak} 天 · 累计答对 {record.totalCorrect}/{record.totalAnswered} 题
            </p>
          </div>
        )}

        {/* Result feedback */}
        {showResult && (
          <div
            className="relative mt-3"
            style={{ animation: 'fadeInUp 0.4s ease-out' }}
          >
            {isCorrect ? (
              <div className="bg-white/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Trophy size={16} className="text-yellow-300" />
                  <span className="text-white font-black text-sm">你真懂！</span>
                </div>
                <p className="text-white/90 text-xs mb-2">
                  击败了 <span className="text-yellow-300 font-black text-base">{beatPercent}%</span> 的人
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 rounded-full text-white text-[11px] font-bold active:scale-95 transition-transform"
                  >
                    <Share2 size={12} />
                    分享挑战给朋友
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-white font-bold text-xs mb-1">
                  答错了！正确答案是：
                </p>
                <p className="text-yellow-300 text-xs font-bold mb-2">
                  {challengeData.correctAnswer}
                </p>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/25 rounded-full text-white text-[11px] font-bold active:scale-95 transition-transform"
                >
                  <Share2 size={12} />
                  分享给朋友，看看他们知不知道
                </button>
              </div>
            )}
          </div>
        )}

        {/* Coin animation */}
        {showCoins && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${15 + Math.random() * 70}%`,
                  bottom: '-10%',
                  animation: `coinFly ${1 + Math.random() * 0.5}s ease-out forwards`,
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                🎉
              </span>
            ))}
          </div>
        )}

        {/* Stats bar at bottom */}
        <div className="relative mt-3 flex items-center justify-between text-white/60 text-[10px]">
          <div className="flex items-center gap-1">
            <Sparkles size={10} />
            <span>累计答对 {record.totalCorrect} 题</span>
          </div>
          <span>每天一题 · 涨知识省钱</span>
        </div>
      </div>

      {/* Inline style for coin animation */}
      <style>{`
        @keyframes coinFly {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) scale(1.2);
            opacity: 0;
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
