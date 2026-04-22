import { useState } from 'react'
import Dashboard from './screens/Dashboard'
import Training from './screens/Training'
import Nutrition from './screens/Nutrition'
import Progress from './screens/Progress'
import { LayoutDashboard, Dumbbell, Salad, TrendingUp } from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'nutrition', label: 'Nutrition', icon: Salad },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
      <div className="flex-1 pb-20">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'training' && <Training />}
        {activeTab === 'nutrition' && <Nutrition />}
        {activeTab === 'progress' && <Progress />}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#1a1a1a] border-t border-[#2a2a2a] flex z-50">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors
              ${activeTab === id ? 'text-[#00E5A0]' : 'text-[#666]'}`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}