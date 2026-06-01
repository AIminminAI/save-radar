import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] to-[#16213E] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-4">📡</div>
        <h1 className="text-6xl font-black text-white mb-2">404</h1>
        <p className="text-gray-400 text-lg mb-1">雷达没扫描到这个页面</p>
        <p className="text-gray-500 text-sm mb-8">可能政策更新了，页面也跟着变了</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={16} />
            返回上一页
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00D68F] text-white text-sm font-bold hover:bg-[#00C07F] transition-colors"
          >
            <Home size={16} />
            回到首页
          </button>
        </div>
      </div>
    </div>
  )
}
