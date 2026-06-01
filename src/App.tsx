import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Coupons from '@/pages/Coupons'
import Calculator from '@/pages/Calculator'
import Profile from '@/pages/Profile'
import Policies from '@/pages/Policies'
import NotFound from '@/pages/NotFound'
import BottomNav from '@/components/BottomNav'
import CouponDetail from '@/components/CouponDetail'

export default function App() {
  return (
    <Router>
      <div className="max-w-[480px] mx-auto min-h-screen bg-[#f5f5f5] relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
        <CouponDetail />
      </div>
    </Router>
  )
}
