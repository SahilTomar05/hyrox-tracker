import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './screens/Auth'
import Dashboard from './screens/Dashboard'
import Training from './screens/Training'
import Nutrition from './screens/Nutrition'
import Progress from './screens/Progress'
import Onboarding from './components/Onboarding'
import Settings from './components/Settings'
import { Home, BarChart2, User, Plus } from 'lucide-react'

const isDark = true
const brand = { orange: '#FF5A1F', orange2: '#FF8C42' }

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
    const { data } = await supabase.from('profiles')
      .upsert({ id: user.id, ...profileData }).select().single()
    setProfile(data)
  }

  async function handleProfileUpdate(updated) {
    const { data } = await supabase.from('profiles')
      .upsert({ id: session.user.id, ...updated }).select().single()
    setProfile(data)
  }

  async function handleReset() {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(255,90,31,.4)' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 28, letterSpacing: '-1px' }}>P4</span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#FF5A1F', letterSpacing: '-.5px' }}>Pace4</p>
          <p style={{ fontSize: 11, color: '#444', marginTop: 4, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Progress · Action · Consistency · Evolution
          </p>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#FF5A1F', margin: '20px auto 0', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    )
  }

  if (!session) return <Auth />
  if (!profile?.name) return <Onboarding onComplete={handleOnboardingComplete} />

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', minHeight: '100vh', background: '#080808', position: 'relative' }}>

      {/* Screen content */}
      <div style={{ paddingBottom: 90 }}>
        {activeTab === 'dashboard' && <Dashboard profile={profile} session={session} />}
        {activeTab === 'training' && <Training profile={profile} session={session} />}
        {activeTab === 'nutrition' && <Nutrition profile={profile} session={session} />}
        {activeTab === 'progress' && <Progress profile={profile} session={session} />}
        {activeTab === 'settings' && (
          <Settings profile={profile} onUpdate={handleProfileUpdate} onReset={handleReset} />
        )}
      </div>

      {/* Quick Log Modal */}
      {showQuickLog && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowQuickLog(false)}>
          <div
            style={{ width: '100%', maxWidth: 420, background: '#111', border: '1px solid #1e1e1e', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2, margin: '0 auto 24px' }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 20 }}>
              What are you logging?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={() => { setShowQuickLog(false); setActiveTab('training') }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 16px', borderRadius: 20, background: '#FF5A1F15', border: '1px solid #FF5A1F30', cursor: 'pointer' }}>
                <span style={{ fontSize: 36 }}>🏋️</span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Workout</p>
                  <p style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Log training session</p>
                </div>
              </button>
              <button
                onClick={() => { setShowQuickLog(false); setActiveTab('nutrition') }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 16px', borderRadius: 20, background: '#22C55E15', border: '1px solid #22C55E30', cursor: 'pointer' }}>
                <span style={{ fontSize: 36 }}>🥗</span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Nutrition</p>
                  <p style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Add meals & macros</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: 'rgba(8,8,8,0.97)', borderTop: '1px solid #1a1a1a', backdropFilter: 'blur(20px)', zIndex: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 0 28px' }}>

        <button onClick={() => setActiveTab('dashboard')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', flex: 1 }}>
          <Home size={22} color={activeTab === 'dashboard' ? '#FF5A1F' : '#444'} />
          <span style={{ fontSize: 10, fontWeight: 600, color: activeTab === 'dashboard' ? '#FF5A1F' : '#444' }}>Home</span>
        </button>

        <button onClick={() => setActiveTab('progress')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', flex: 1 }}>
          <BarChart2 size={22} color={activeTab === 'progress' ? '#FF5A1F' : '#444'} />
          <span style={{ fontSize: 10, fontWeight: 600, color: activeTab === 'progress' ? '#FF5A1F' : '#444' }}>Progress</span>
        </button>

        {/* Center FAB — perfectly centered */}
        <button onClick={() => setShowQuickLog(true)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', flex: 1 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(255,90,31,.5)', marginTop: -24 }}>
            <Plus size={24} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#444' }}>Log</span>
        </button>

        <button onClick={() => setActiveTab('settings')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', flex: 1 }}>
          <User size={22} color={activeTab === 'settings' ? '#FF5A1F' : '#444'} />
          <span style={{ fontSize: 10, fontWeight: 600, color: activeTab === 'settings' ? '#FF5A1F' : '#444' }}>Profile</span>
        </button>

      </div>
    </div>


    </div>
  )
}