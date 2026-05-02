import { useState, useEffect } from 'react'
import Dashboard from './screens/Dashboard'
import Training from './screens/Training'
import Nutrition from './screens/Nutrition'
import Progress from './screens/Progress'
import Onboarding from './components/Onboarding'
import Settings from './components/Settings'
import { LayoutDashboard, Dumbbell, Salad, TrendingUp, Settings as SettingsIcon } from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'nutrition', label: 'Nutrition', icon: Salad },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile')
    return saved ? JSON.parse(saved) : null
  })
  const [activeTab, setActiveTab] = useState('dashboard')

  function handleOnboardingComplete(newProfile) {
    setProfile(newProfile)
    setActiveTab('dashboard')
  }

  function handleProfileUpdate(updated) {
    setProfile(updated)
  }

  function handleReset() {
    setProfile(null)
    setActiveTab('dashboard')
  }

  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
      <div className="flex-1 pb-20">
        {activeTab === 'dashboard' && <Dashboard profile={profile} />}
        {activeTab === 'training' && <Training />}
        {activeTab === 'nutrition' && <Nutrition profile={profile} />}
        {activeTab === 'progress' && <Progress />}
        {activeTab === 'settings' && (
          <Settings profile={profile} onUpdate={handleProfileUpdate} onReset={handleReset} />
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#1a1a1a] border-t border-[#2a2a2a] flex z-50">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors
              ${activeTab === id ? 'text-[#00E5A0]' : 'text-[#666]'}`}>
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}