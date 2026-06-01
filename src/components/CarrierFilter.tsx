import { carriers } from '@/data/mockCoupons'
import { useAppStore } from '@/store/useAppStore'

const tabs = [
  { id: 'all', label: '全部' },
  ...carriers.map(c => ({ id: c.id, label: c.shortName })),
]

export default function CarrierFilter() {
  const { selectedCarrier, setSelectedCarrier } = useAppStore()

  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = selectedCarrier === tab.id
        const carrier = carriers.find(c => c.id === tab.id)
        const activeColor = carrier?.color || '#FF6B35'

        return (
          <button
            key={tab.id}
            onClick={() => setSelectedCarrier(tab.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
              isActive
                ? 'text-white shadow-md'
                : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
            }`}
            style={isActive ? { background: `linear-gradient(135deg, ${activeColor}, ${activeColor}dd)` } : {}}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
