import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './screens/Auth'
import Dashboard from './screens/Dashboard'
import Training from './screens/Training'
import Nutrition from './screens/Nutrition'
import Progress from './screens/Progress'
import Onboarding from './components/Onboarding'
import Profile from './screens/Profile'
import Settings from './screens/Settings'
import CoachDashboard from './screens/coach/CoachDashboard'
import CoachClients from './screens/coach/CoachClients'
import CoachClientDetail from './screens/coach/CoachClientDetail'
import CoachProfile from './screens/coach/CoachProfile'
import { Home, BarChart2, User, Settings as SettingsIcon, Plus, Users } from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(undefined) // undefined = loading, null = no profile
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [coachMode, setCoachMode] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

  useEffect(() => {
    // Check for coach code in URL (QR scan)
    const params = new URLSearchParams(window.location.search)
    const coachCode = params.get('coach')
    if (coachCode) localStorage.setItem('pending_coach_code', coachCode)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setLoading(false); setProfile(null) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setCoachMode(false); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()  // won't throw 406 if no row found

    if (!data || !data.name) {
      setProfile(null)
    } else {
      setProfile(data)
      if (data?.role?.toLowerCase() === 'coach') setCoachMode(true)
    }
  } catch {
    setProfile(null)
  }
  setLoading(false)
}

  async function handleOnboardingComplete(profileData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...profileData })
      .select()
      .single()
    
    if (error) {
      alert('Setup failed: ' + error.message)
      return
    }
    setProfile(data)
    if (data?.role?.toLowerCase() === 'coach') setCoachMode(true)
  } catch (e) {
    alert('Error: ' + e.message)
  }
}

  async function handleProfileUpdate(updated) {
    const { data } = await supabase.from('profiles')
      .upsert({ id: session.user.id, ...updated }).select().single()
    if (data) setProfile(data)
  }

  async function handleReset() {
    await supabase.auth.signOut()
    setProfile(null); setSession(null); setCoachMode(false)
  }

  function toggleMode() {
    setCoachMode(p => !p)
    setActiveTab('dashboard')
    setSelectedClient(null)
  }

  // Loading spinner
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/icon-512.png" alt="Pace4" style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px', display: 'block', boxShadow: '0 8px 32px rgba(255,90,31,.4)' }} />
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--orange)', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (!session) return <Auth />
  if (profile === null) return <Onboarding onComplete={handleOnboardingComplete} />

  // Coach mode
  if (coachMode && profile?.role?.toLowerCase() === 'coach') {
    return (
      <div style={{ maxWidth: 420, margin: '0 auto', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ paddingBottom: 90 }}>
          {activeTab === 'dashboard' && <CoachDashboard profile={profile} session={session} onSelectClient={c => { setSelectedClient(c); setActiveTab('client') }} />}
          {activeTab === 'clients' && <CoachClients profile={profile} session={session} onSelectClient={c => { setSelectedClient(c); setActiveTab('client') }} />}
          {activeTab === 'client' && selectedClient && <CoachClientDetail profile={profile} session={session} client={selectedClient} onBack={() => setActiveTab('clients')} />}
          {activeTab === 'coachprofile' && <CoachProfile profile={profile} session={session} onToggleMode={toggleMode} onReset={handleReset} onUpdate={handleProfileUpdate} />}
          {activeTab === 'coachsettings' && <Settings profile={profile} onUpdate={handleProfileUpdate} onReset={handleReset} onToggleCoach={toggleMode} />}
        </div>
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: 'var(--card)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(20px)', zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0 24px' }}>
            <NavBtn icon={<Home size={21}/>} label="Home" active={activeTab==='dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavBtn icon={<Users size={21}/>} label="Clients" active={activeTab==='clients'} onClick={() => setActiveTab('clients')} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => setActiveTab('clients')}
                style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -22, boxShadow: '0 4px 20px rgba(255,90,31,.5)', cursor: 'pointer' }}>
                <Plus size={24} color="#fff" strokeWidth={2.5} />
              </button>
            </div>
            <NavBtn icon={<User size={21}/>} label="Profile" active={activeTab==='coachprofile'} onClick={() => setActiveTab('coachprofile')} />
            <NavBtn icon={<SettingsIcon size={21}/>} label="Settings" active={activeTab==='coachsettings'} onClick={() => setActiveTab('coachsettings')} />
          </div>
        </div>
      </div>
    )
  }

  // Athlete mode
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ paddingBottom: 90 }}>
        {activeTab === 'dashboard' && <Dashboard profile={profile} session={session} />}
        {activeTab === 'training' && <Training profile={profile} session={session} />}
        {activeTab === 'nutrition' && <Nutrition profile={profile} session={session} />}
        {activeTab === 'progress' && <Progress profile={profile} session={session} />}
        {activeTab === 'profile' && <Profile profile={profile} onUpdate={handleProfileUpdate} session={session} />}
        {activeTab === 'settings' && <Settings profile={profile} onUpdate={handleProfileUpdate} onReset={handleReset} onToggleCoach={profile?.role?.toLowerCase() === 'coach' ? toggleMode : null} />}
      </div>

      {showQuickLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowQuickLog(false)}>
          <div style={{ width: '100%', maxWidth: 420, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '0 auto 24px' }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 20 }}>What are you logging?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => { setShowQuickLog(false); setActiveTab('training') }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 16px', borderRadius: 20, background: 'var(--card2)', border: '1px solid #FF5A1F30', cursor: 'pointer' }}>
                <span style={{ fontSize: 36 }}>🏋️</span>
                <div><p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Workout</p><p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Log training session</p></div>
              </button>
              <button onClick={() => { setShowQuickLog(false); setActiveTab('nutrition') }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 16px', borderRadius: 20, background: 'var(--card2)', border: '1px solid #22C55E30', cursor: 'pointer' }}>
                <span style={{ fontSize: 36 }}>🥗</span>
                <div><p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Nutrition</p><p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Add meals & macros</p></div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: 'var(--card)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(20px)', zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0 24px' }}>
          <NavBtn icon={<Home size={21}/>} label="Home" active={activeTab==='dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavBtn icon={<BarChart2 size={21}/>} label="Progress" active={activeTab==='progress'} onClick={() => setActiveTab('progress')} />
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => setShowQuickLog(true)}
              style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -22, boxShadow: '0 4px 20px rgba(255,90,31,.5)', cursor: 'pointer' }}>
              <Plus size={24} color="#fff" strokeWidth={2.5} />
            </button>
          </div>
          <NavBtn icon={<User size={21}/>} label="Profile" active={activeTab==='profile'} onClick={() => setActiveTab('profile')} />
          <NavBtn icon={<SettingsIcon size={21}/>} label="Settings" active={activeTab==='settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </div>
    </div>
  )
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', flex: 1 }}>
      <span style={{ color: active ? 'var(--orange)' : 'var(--muted)' }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: active ? 'var(--orange)' : 'var(--muted)' }}>{label}</span>
    </button>
  )
}