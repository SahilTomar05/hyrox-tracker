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
import { useTheme } from './context/ThemeContext'

export default function App() {
  const { theme, brand, isDark } = useTheme()
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

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#080808' : '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        {/* P4 Logo */}
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(255,90,31,.4)' }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 28, letterSpacing: '-1px' }}>P4</span>
        </div>
        <p style={{ fontSize: 20, fontWeight: 700, color: brand.orange, letterSpacing: '-.5px' }}>Pace4</p>
        <p style={{ fontSize: 11, color: isDark ? '#444' : '#aaa', marginTop: 4, letterSpacing: '.1em', textTransform: 'uppercase' }}>Progress · Action · Consistency · Evolution</p>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isDark ? '#1a1a1a' : '#eee'}`, borderTopColor: brand.orange, margin: '20px auto 0', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (!session) return <Auth />
  if (!profile?.name) return <Onboarding onComplete={handleOnboardingComplete} />

  const navBg = isDark ? 'rgba(8,8,8,0.95)' : 'rgba(255,255,255,0.95)'
  const navBorder = isDark ? '#1a1a1a' : '#eeeeee'

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', minHeight: '100vh', background: theme.bg, position: 'relative' }}>
      <div style={{ paddingBottom: 90 }}>
        {activeTab === 'dashboard' && <Dashboard profile={profile} session={session} />}
        {activeTab === 'training' && <Training profile={profile} session={session} />}
        {activeTab === 'nutrition' && <Nutrition profile={profile} session={session} />}
        {activeTab === 'progress' && <Progress profile={profile} session={session} />}
        {activeTab === 'settings' && <Settings profile={profile} onUpdate={handleProfileUpdate} onReset={handleReset} />}
      </div>

      {/* Quick Log Modal */}
      {showQuickLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowQuickLog(false)}>
          <div style={{ width: '100%', maxWidth: 420, background: isDark ? '#111' : '#fff', border: `1px solid ${navBorder}`, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: isDark ? '#333' : '#ddd', borderRadius: 2, margin: '0 auto 24px' }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: theme.text, textAlign: 'center', marginBottom: 20 }}>What are you logging?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: '🏋️', label: 'Workout', sub: 'Log training session', tab: 'training', bg: '#FF5A1F15', border: '#FF5A1F30' },
                { icon: '🥗', label: 'Nutrition', sub: 'Add meals & macros', tab: 'nutrition', bg: '#22C55E15', border: '#22C55E30' },
              ].map(({ icon, label, sub, tab, bg, border }) => (
                <button key={tab} onClick={() => { setShowQuickLog(false); setActiveTab(tab) }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 16px', borderRadius: 20, background: bg, border: `1px solid ${border}`, cursor: 'pointer' }}>
                  <span style={{ fontSize: 36 }}>{icon}</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{label}</p>
                    <p style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: navBg, borderTop: `1px solid ${navBorder}`, backdropFilter: 'blur(20px)', zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 20px 24px' }}>
          <button onClick={() => setActiveTab('dashboard')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Home size={22} color={activeTab === 'dashboard' ? brand.orange : theme.muted} />
            <span style={{ fontSize: 10, fontWeight: 600, color: activeTab === 'dashboard' ? brand.orange : theme.muted }}>Home</span>
          </button>

          <button onClick={() => setActiveTab('progress')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' }}>
            <BarChart2 size={22} color={activeTab === 'progress' ? brand.orange : theme.muted} />
            <span style={{ fontSize: 10, fontWeight: 600, color: activeTab === 'progress' ? brand.orange : theme.muted }}>Progress</span>
          </button>

          {/* FAB */}
          <button onClick={() => setShowQuickLog(true)}
            style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -20, boxShadow: '0 6px 24px rgba(255,90,31,.5)', cursor: 'pointer' }}>
            <Plus size={26} color="#fff" strokeWidth={2.5} />
          </button>

          <button onClick={() => setActiveTab('settings')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' }}>
            <User size={22} color={activeTab === 'settings' ? brand.orange : theme.muted} />
            <span style={{ fontSize: 10, fontWeight: 600, color: activeTab === 'settings' ? brand.orange : theme.muted }}>Profile</span>
          </button>

          <button onClick={() => setActiveTab('settings')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width={22} height={22} fill="none" stroke={activeTab === 'settings' ? brand.orange : theme.muted} strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            <span style={{ fontSize: 10, fontWeight: 600, color: activeTab === 'settings' ? brand.orange : theme.muted }}>Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}