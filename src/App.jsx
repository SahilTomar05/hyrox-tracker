import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './screens/Auth'
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
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function handleOnboardingComplete(profileData) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...profileData })
    .select()
    .single()
  if (error) {
    console.error('Profile save error:', error)
    return
  }
  setProfile(data)
  }

  async function handleProfileUpdate(updated) {
    const { data } = await supabase
      .from('profiles')
      .upsert({ id: session.user.id, ...updated })
      .select()
      .single()
    setProfile(data)
  }

  async function handleReset() {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#00E5A0] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-2xl">1F</span>
          </div>
          <p className="text-[#666] text-sm">Loading OneFitness...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Auth />

  if (!profile?.name) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
      <div className="flex-1 pb-20">
        {activeTab === 'dashboard' && <Dashboard profile={profile} session={session} />}
        {activeTab === 'training' && <Training session={session} profile={profile} />}
        {activeTab === 'nutrition' && <Nutrition profile={profile} session={session} />}
        {activeTab === 'progress' && <Progress session={session} profile={profile} />}
        {activeTab === 'settings' && (
          <Settings
            profile={profile}
            onUpdate={handleProfileUpdate}
            onReset={handleReset}
          />
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