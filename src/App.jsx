import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './screens/Auth'
import Dashboard from './screens/Dashboard'
import Training from './screens/Training'
import Nutrition from './screens/Nutrition'
import Progress from './screens/Progress'
import Onboarding from './components/Onboarding'
import Settings from './components/Settings'
import { Home, BarChart2, Settings as SettingsIcon, Plus } from 'lucide-react'
import { useState as useStateModal } from 'react'

const MAIN_TABS = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'progress', label: 'Progress', icon: BarChart2 },
  { id: 'settings', label: 'Profile', icon: SettingsIcon },
]

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showQuickLog, setShowQuickLog] = useState(false)

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
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  async function handleOnboardingComplete(profileData) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('profiles').upsert({ id: user.id, ...profileData }).select().single()
    setProfile(data)
  }

  async function handleProfileUpdate(updated) {
    const { data } = await supabase.from('profiles').upsert({ id: session.user.id, ...updated }).select().single()
    setProfile(data)
  }

  async function handleReset() {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #FF5A1F, #FF8C42)' }}>
            <span className="text-black font-bold text-2xl">1F</span>
          </div>
          <p style={{ color: '#555' }} className="text-sm">Loading OneFitness...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Auth />
  if (!profile?.name) return <Onboarding onComplete={handleOnboardingComplete} />

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
      <div className="flex-1 pb-24">
        {activeTab === 'dashboard' && <Dashboard profile={profile} session={session} />}
        {activeTab === 'training' && <Training profile={profile} session={session} />}
        {activeTab === 'nutrition' && <Nutrition profile={profile} session={session} />}
        {activeTab === 'progress' && <Progress session={session} profile={profile} />}
        {activeTab === 'settings' && (
          <Settings profile={profile} onUpdate={handleProfileUpdate} onReset={handleReset} />
        )}
      </div>

      {/* Quick log modal */}
      {showQuickLog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowQuickLog(false)}>
          <div className="w-full max-w-md p-5 pb-10 rounded-t-3xl"
            style={{ background: '#111', border: '1px solid #222' }}
            onClick={e => e.stopPropagation()}>
            <div className="w-9 h-1 rounded-full mx-auto mb-6" style={{ background: '#333' }} />
            <p className="text-white font-bold text-lg text-center mb-5">What are you logging?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setShowQuickLog(false); setActiveTab('training') }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all"
                style={{ background: '#1a0800', borderColor: '#FF5A1F30' }}>
                <span className="text-4xl">🏋️</span>
                <div>
                  <p className="text-white font-semibold text-sm">Workout</p>
                  <p className="text-xs mt-0.5" style={{ color: '#666' }}>Log training session</p>
                </div>
              </button>
              <button onClick={() => { setShowQuickLog(false); setActiveTab('nutrition') }}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all"
                style={{ background: '#001a08', borderColor: '#22C55E30' }}>
                <span className="text-4xl">🥗</span>
                <div>
                  <p className="text-white font-semibold text-sm">Nutrition</p>
                  <p className="text-xs mt-0.5" style={{ color: '#666' }}>Add meals & macros</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40"
        style={{ background: 'rgba(10,10,10,0.95)', borderTop: '1px solid #1a1a1a', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-around px-4 pb-6 pt-2">
          {/* Home */}
          <button onClick={() => setActiveTab('dashboard')}
            className="flex flex-col items-center gap-1 py-1 px-4 transition-all">
            <Home size={22} style={{ color: activeTab === 'dashboard' ? '#FF5A1F' : '#555' }} />
            <span className="text-xs" style={{ color: activeTab === 'dashboard' ? '#FF5A1F' : '#555' }}>Home</span>
          </button>

          {/* Progress */}
          <button onClick={() => setActiveTab('progress')}
            className="flex flex-col items-center gap-1 py-1 px-4 transition-all">
            <BarChart2 size={22} style={{ color: activeTab === 'progress' ? '#FF5A1F' : '#555' }} />
            <span className="text-xs" style={{ color: activeTab === 'progress' ? '#FF5A1F' : '#555' }}>Progress</span>
          </button>

          {/* FAB */}
          <button onClick={() => setShowQuickLog(true)}
            className="flex items-center justify-center rounded-full w-14 h-14 -mt-5 shadow-lg transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FF5A1F, #FF8C42)', boxShadow: '0 6px 24px rgba(255,90,31,0.5)' }}>
            <Plus size={26} color="white" strokeWidth={2.5} />
          </button>

          {/* Profile */}
          <button onClick={() => setActiveTab('settings')}
            className="flex flex-col items-center gap-1 py-1 px-4 transition-all">
            <SettingsIcon size={22} style={{ color: activeTab === 'settings' ? '#FF5A1F' : '#555' }} />
            <span className="text-xs" style={{ color: activeTab === 'settings' ? '#FF5A1F' : '#555' }}>Profile</span>
          </button>

          {/* Settings - hidden but accessible */}
          <button onClick={() => setActiveTab('settings')}
            className="flex flex-col items-center gap-1 py-1 px-3 transition-all">
            <svg width="22" height="22" fill="none" stroke={activeTab === 'settings' ? '#FF5A1F' : '#555'} strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            <span className="text-xs" style={{ color: activeTab === 'settings' ? '#FF5A1F' : '#555' }}>Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}