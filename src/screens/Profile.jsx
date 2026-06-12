import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronRight, User, Target, Calendar, Activity, Copy, Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const SPORTS = [
  { id: 'hyrox', label: 'Hyrox' }, { id: 'marathon', label: 'Marathon' },
  { id: 'bodybuilding', label: 'Bodybuilding' }, { id: 'crossfit', label: 'CrossFit' },
  { id: 'cycling', label: 'Cycling' }, { id: 'triathlon', label: 'Triathlon' },
  { id: 'ocr', label: 'OCR' }, { id: 'combat', label: 'Combat Sports' },
  { id: 'team', label: 'Team Sports' }, { id: 'calisthenics', label: 'Calisthenics' },
  { id: 'general', label: 'General Fitness' }, { id: 'custom', label: 'Other' },
]

export default function Profile({ profile, onUpdate, session }) {
  const { isDark, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Edit form
  const [form, setForm] = useState({
    name: profile?.name || '',
    age: profile?.age || '',
    gender: profile?.gender || '',
    height: profile?.height || '',
    weight: profile?.weight || '',
    goal_weight: profile?.goal_weight || '',
    sport: profile?.sport || 'general',
    event_name: profile?.event_name || '',
    race_date: profile?.race_date || '',
    step_goal: profile?.step_goal || 10000,
    training_days_per_week: profile?.training_days_per_week || '4 days',
  })

  // Coach connection
  const [coachConnected, setCoachConnected] = useState(false)
  const [coachInfo, setCoachInfo] = useState(null)
  const [coachCodeInput, setCoachCodeInput] = useState('')
  const [connectingCoach, setConnectingCoach] = useState(false)
  const [coachMsg, setCoachMsg] = useState('')
  const [checkingCoach, setCheckingCoach] = useState(true)

  useEffect(() => {
    checkCoachConnection()
    // Pre-fill coach code from localStorage (QR scan)
    const pending = localStorage.getItem('pending_coach_code')
    if (pending) { setCoachCodeInput(pending); localStorage.removeItem('pending_coach_code') }
  }, [])

  async function checkCoachConnection() {
    setCheckingCoach(true)
    try {
      // Step 1: check if connection exists
      const { data: link } = await supabase
        .from('coach_clients')
        .select('coach_id')
        .eq('client_id', session.user.id)
        .maybeSingle()

      if (!link) {
        setCoachConnected(false)
        setCoachInfo(null)
        setCheckingCoach(false)
        return
      }

      // Step 2: get coach profile
      const { data: coach } = await supabase
        .from('profiles')
        .select('name, coach_code')
        .eq('id', link.coach_id)
        .maybeSingle()

      setCoachConnected(true)
      setCoachInfo(coach || null)
    } catch (e) {
      console.error('checkCoachConnection error:', e)
      setCoachConnected(false)
    }
    setCheckingCoach(false)
  }

  async function connectToCoach() {
    if (!coachCodeInput.trim()) return
    setConnectingCoach(true)
    setCoachMsg('')
    try {
      // Find coach by coach_code (case insensitive)
      const { data: coachProfile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('coach_code', coachCodeInput.trim())
        .maybeSingle()

      if (!coachProfile) {
        setCoachMsg('❌ Coach not found. Check the code and try again.')
        setConnectingCoach(false)
        return
      }

      const { error } = await supabase.from('coach_clients').insert({
        coach_id: coachProfile.id,
        client_id: session.user.id,
      })

      if (error) {
        if (error.code === '23505') {
          setCoachMsg('⚠️ Already connected to this coach.')
          setCoachConnected(true)
          setCoachInfo(coachProfile)
        } else {
          setCoachMsg('❌ Failed to connect: ' + error.message)
        }
      } else {
        setCoachMsg(`✅ Connected to ${coachProfile.name}!`)
        setCoachConnected(true)
        setCoachInfo(coachProfile)
        setCoachCodeInput('')
      }
    } catch (e) {
      setCoachMsg('❌ Error: ' + e.message)
    }
    setConnectingCoach(false)
  }

  async function disconnectCoach() {
    if (!confirm('Disconnect from your coach? They will lose access to your data.')) return
    await supabase.from('coach_clients').delete().eq('client_id', session.user.id)
    setCoachConnected(false)
    setCoachInfo(null)
    setCoachMsg('')
  }

  async function saveProfile() {
    setSaving(true)
    const clean = { ...form }
    const nums = ['age', 'height', 'weight', 'goal_weight', 'step_goal']
    nums.forEach(k => { clean[k] = clean[k] !== '' ? Number(clean[k]) : null })
    if (!clean.race_date) clean.race_date = null
    await onUpdate({ ...profile, ...clean })
    setSaving(false)
    setActiveSection(null)
  }

  function copyUserId() {
    navigator.clipboard.writeText(session.user.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inp = {
    width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border2)',
    borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 14,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, margin: '0 16px 12px', overflow: 'hidden' }

  function Section({ id, icon, title, sub, children }) {
    const open = activeSection === id
    return (
      <div style={card}>
        <button onClick={() => setActiveSection(open ? null : id)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</p>
          </div>
          <ChevronRight size={16} color="var(--subtle)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: '.2s' }} />
        </button>
        {open && <div style={{ borderTop: '1px solid var(--border)', padding: 16 }}>{children}</div>}
      </div>
    )
  }

  const daysLeft = profile?.race_date
    ? Math.ceil((new Date(profile.race_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '0 16px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.3px' }}>Profile</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Your settings & stats</p>
      </div>

      {/* Profile hero */}
      <div style={{ margin: '0 16px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {profile?.name?.charAt(0) || '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{profile?.name}</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {SPORTS.find(s => s.id === profile?.sport)?.label || 'General Fitness'}
            {profile?.weight ? ` · ${profile.weight}kg` : ''}
          </p>
          {daysLeft && daysLeft > 0 && (
            <p style={{ fontSize: 11, color: '#FF5A1F', marginTop: 4, fontWeight: 600 }}>
              🏁 {daysLeft} days to {profile?.event_name || 'race'}
            </p>
          )}
        </div>
        {coachConnected && (
          <div style={{ background: '#22C55E15', border: '1px solid #22C55E30', borderRadius: 10, padding: '4px 10px', flexShrink: 0 }}>
            <p style={{ fontSize: 10, color: '#22C55E', fontWeight: 700 }}>🏅 Coached</p>
          </div>
        )}
      </div>

      {/* ── CONNECT TO COACH ── */}
      {profile?.role !== 'coach' && (
        <Section id="coach" icon="🏅" title="Connect to Coach"
          sub={coachConnected ? `✅ Connected${coachInfo?.name ? ` to ${coachInfo.name}` : ''}` : 'Link with your coach for assigned workouts'}>
          {checkingCoach ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: '#FF5A1F', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : coachConnected ? (
            <div>
              <div style={{ background: '#22C55E10', border: '1px solid #22C55E25', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#22C55E', marginBottom: 4 }}>✅ Connected to your coach</p>
                {coachInfo?.name && <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{coachInfo.name}</p>}
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
                  Your coach can view your training, nutrition and progress, and assign workouts to you.
                </p>
              </div>
              <button onClick={disconnectCoach}
                style={{ width: '100%', background: 'transparent', border: '1px solid #EF444430', borderRadius: 12, padding: 12, color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Disconnect from coach
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
                Enter your coach's code to connect. They can then view your progress and assign workouts.
              </p>
              <input placeholder="Enter coach code (e.g. RAHUL-123)"
                value={coachCodeInput}
                onChange={e => setCoachCodeInput(e.target.value.toUpperCase())}
                style={{ ...inp, marginBottom: 8, letterSpacing: '.08em', fontWeight: 600, textTransform: 'uppercase' }} />
              {coachMsg && (
                <p style={{ fontSize: 13, color: coachMsg.includes('✅') ? '#22C55E' : '#EF4444', marginBottom: 10, fontWeight: 500 }}>
                  {coachMsg}
                </p>
              )}
              <button onClick={connectToCoach} disabled={connectingCoach || !coachCodeInput.trim()}
                style={{ width: '100%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 12, padding: 13, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: connectingCoach || !coachCodeInput.trim() ? 0.6 : 1 }}>
                {connectingCoach ? 'Connecting...' : 'Connect to Coach'}
              </button>
            </div>
          )}
        </Section>
      )}

      {/* ── PERSONAL DETAILS ── */}
      <Section id="personal" icon="👤" title="Personal Details"
        sub={`${profile?.age || '—'} yrs · ${profile?.gender || '—'} · ${profile?.height || '—'}cm · ${profile?.weight || '—'}kg`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Name</p>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Age</p>
              <input type="number" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} style={inp} />
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Gender</p>
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} style={inp}>
                <option value="">Select</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Height (cm)</p>
              <input type="number" value={form.height} onChange={e => setForm(p => ({ ...p, height: e.target.value }))} style={inp} />
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Weight (kg)</p>
              <input type="number" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} style={inp} />
            </div>
          </div>
          <div>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Goal weight (kg)</p>
            <input type="number" value={form.goal_weight} onChange={e => setForm(p => ({ ...p, goal_weight: e.target.value }))} style={inp} />
          </div>
          <button onClick={saveProfile} disabled={saving}
            style={{ background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </Section>

      {/* ── SPORT & RACE ── */}
      <Section id="sport" icon="🏃" title="Sport & Race"
        sub={`${SPORTS.find(s => s.id === profile?.sport)?.label || 'General'} ${profile?.event_name ? `· ${profile.event_name}` : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Sport</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {SPORTS.map(s => (
                <button key={s.id} onClick={() => setForm(p => ({ ...p, sport: s.id }))}
                  style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${form.sport === s.id ? '#FF5A1F' : 'var(--border)'}`, background: form.sport === s.id ? '#FF5A1F15' : 'var(--card2)', color: form.sport === s.id ? '#FF5A1F' : 'var(--muted)', fontSize: 12, fontWeight: form.sport === s.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Event name</p>
            <input placeholder="e.g. Hyrox Delhi, Mumbai Marathon" value={form.event_name}
              onChange={e => setForm(p => ({ ...p, event_name: e.target.value }))} style={inp} />
          </div>
          <div>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Race date</p>
            <input type="date" value={form.race_date || ''}
              onChange={e => setForm(p => ({ ...p, race_date: e.target.value }))} style={inp} />
          </div>
          <button onClick={saveProfile} disabled={saving}
            style={{ background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </Section>

      {/* ── TRAINING SCHEDULE ── */}
      <Section id="schedule" icon="📅" title="Training Schedule"
        sub={`${profile?.training_days_per_week || '4 days'} · ${((profile?.step_goal || 10000)/1000).toFixed(0)}K steps/day`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Days per week</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {['3 days','4 days','5 days','6 days','7 days'].map(d => (
                <button key={d} onClick={() => setForm(p => ({ ...p, training_days_per_week: d }))}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${form.training_days_per_week === d ? '#FF5A1F' : 'var(--border)'}`, background: form.training_days_per_week === d ? '#FF5A1F15' : 'var(--card2)', color: form.training_days_per_week === d ? '#FF5A1F' : 'var(--muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {d.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Daily step goal</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[5000,8000,10000,12000,15000].map(s => (
                <button key={s} onClick={() => setForm(p => ({ ...p, step_goal: s }))}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${form.step_goal === s ? '#FF5A1F' : 'var(--border)'}`, background: form.step_goal === s ? '#FF5A1F15' : 'var(--card2)', color: form.step_goal === s ? '#FF5A1F' : 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {(s/1000).toFixed(0)}K
                </button>
              ))}
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving}
            style={{ background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </Section>

      {/* ── USER ID ── */}
      <div style={{ margin: '0 16px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }}>
        <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Your User ID</p>
        <p style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 10 }}>{session.user.id}</p>
        <button onClick={copyUserId}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: copied ? '#22C55E' : 'var(--card2)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', color: copied ? '#fff' : 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy ID'}
        </button>
        <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 8, lineHeight: 1.5 }}>
          Share this with your coach if they need to add you manually.
        </p>
      </div>

      {/* App info */}
      <div style={{ textAlign: 'center', padding: '20px 16px 8px' }}>
        <img src="/icon-512.png" alt="Pace4" style={{ width: 44, height: 44, borderRadius: 13, margin: '0 auto 8px', display: 'block' }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: '#FF5A1F' }}>Pace4</p>
        <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, letterSpacing: '.08em', textTransform: 'uppercase' }}>Progress · Action · Consistency · Evolution</p>
      </div>
    </div>
  )
}