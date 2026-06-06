import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Coupons from '@/pages/Coupons'
import Calculator from '@/pages/Calculator'
import Profile from '@/pages/Profile'
import Policies from '@/pages/Policies'
import NotFound from '@/pages/NotFound'
import Privacy from '@/pages/Privacy'
import About from '@/pages/About'
import SubsidyCalculator from '@/pages/SubsidyCalculator'
import BottomNav from '@/components/BottomNav'
import CouponDetail from '@/components/CouponDetail'
import WeChatGuard from '@/components/WeChatGuard'
import CookieConsent from '@/components/CookieConsent'

export default function App() {
  return (
    <WeChatGuard>
    <Router>
      <div className="max-w-[480px] mx-auto min-h-screen bg-[#f5f5f5] relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/subsidy-calculator" element={<SubsidyCalculator />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
        <CouponDetail />
        <CookieConsent />
      </div>
    </Router>
    </WeChatGuard>
  )
}
