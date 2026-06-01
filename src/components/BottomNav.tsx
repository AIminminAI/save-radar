import { useNavigate, useLocation } from 'react-router-dom'
import { Radar, Ticket, Calculator, Landmark, User } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const tabs = [
  { id: 'home', label: '雷达', icon: Radar, path: '/' },
  { id: 'coupons', label: '优惠券', icon: Ticket, path: '/coupons' },
  { id: 'policies', label: '政策', icon: Landmark, path: '/policies' },
  { id: 'calculator', label: '计算器', icon: Calculator, path: '/calculator' },
  { id: 'profile', label: '我的', icon: User, path: '/profile' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setActiveTab } = useAppStore()

  const activeTab = tabs.find(t => t.path === location.pathname)?.id || 'home'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100 safe-area-bottom">
      <div className="max-w-[480px] mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                navigate(tab.path)
              }}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200"
            >
              <div className={`p-1.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-gradient-to-br from-[#FF6B35] to-[#FF8F5E] scale-110' : ''}`}>
                <Icon
                  size={20}
                  className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-400'}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-[#FF6B35]' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
