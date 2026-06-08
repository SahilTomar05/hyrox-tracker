import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronRight, RotateCcw } from 'lucide-react'

export default function Profile({ profile, onUpdate, session }) {
const [coachCodeInput, setCoachCodeInput] = useState(() => {
  return localStorage.getItem('pending_coach_code') || ''
})
const [connectingCoach, setConnectingCoach] = useState(false)
const [coachMsg, setCoachMsg] = useState('')
const [coachConnected, setCoachConnected] = useState(false)

// Check if already connected to a coach
useEffect(() => {
  checkCoachConnection()
}, [])

async function checkCoachConnection() {
  const { data } = await supabase
    .from('coach_clients')
    .select('*')
    .eq('client_id', session.user.id)
    .single()
  if (data) setCoachConnected(true)
}

async function connectToCoach() {
  setConnectingCoach(true)
  setCoachMsg('')

  try {
    // Use maybeSingle() instead of single() to avoid 406
    const { data: coaches, error: searchError } = await supabase
      .from('profiles')
      .select('id, name, coach_code')
      .ilike('coach_code', coachCodeInput.trim())
      .limit(1)

    console.log('Coach search result:', coaches, searchError)

    if (searchError || !coaches || coaches.length === 0) {
      setCoachMsg('❌ Coach not found. Check the code.')
      setConnectingCoach(false)
      return
    }

    const coachProfile = coaches[0]

    const { error } = await supabase.from('coach_clients').insert({
      coach_id: coachProfile.id,
      client_id: session.user.id,
    })

    if (error) {
      setCoachMsg(error.code === '23505' ? '⚠️ Already connected to this coach.' : '❌ Failed to connect.')
    } else {
      setCoachMsg(`✅ Connected to ${coachProfile.name}!`)
      setCoachConnected(true)
      localStorage.removeItem('pending_coach_code')
    }
  } catch (e) {
    console.error(e)
    setCoachMsg('❌ Something went wrong. Try again.')
  }

  setConnectingCoach(false)
}

async function disconnectCoach() {
  await supabase.from('coach_clients').delete().eq('client_id', session.user.id)
  setCoachConnected(false)
  setCoachMsg('')
}

const SPORTS = [
  { id: 'hyrox', icon: '⚡', label: 'Hyrox' },
  { id: 'marathon', icon: '🏃', label: 'Marathon' },
  { id: 'bodybuilding', icon: '🏋️', label: 'Bodybuilding' },
  { id: 'crossfit', icon: '🏇', label: 'CrossFit' },
  { id: 'cycling', icon: '🚴', label: 'Cycling' },
  { id: 'triathlon', icon: '🏊', label: 'Triathlon' },
  { id: 'ocr', icon: '🏔️', label: 'OCR' },
  { id: 'combat', icon: '🥊', label: 'Combat' },
  { id: 'team', icon: '⚽', label: 'Team Sports' },
  { id: 'calisthenics', icon: '🤸', label: 'Calisthenics' },
  { id: 'general', icon: '🎯', label: 'General Fitness' },
  { id: 'custom', icon: '🏄', label: 'Custom' },
]

  const [activeSection, setActiveSection] = useState(null)
  const [form, setForm] = useState({
    name: profile?.name || '',
    age: profile?.age || '',
    height: profile?.height || '',
    weight: profile?.weight || '',
    goal_weight: profile?.goal_weight || '',
    gender: profile?.gender || '',
    sport: profile?.sport || 'general',
    event_name: profile?.event_name || '',
    race_date: profile?.race_date || '',
    primary_goal: profile?.primary_goal || '',
    training_days_per_week: profile?.training_days_per_week || '4 days',
    goals: profile?.goals || { calories: 2800, protein: 180, carbs: 300, fat: 80, water: 3 },
    step_goal: profile?.step_goal || 10000,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)

  function upd(field, val) { setForm(p => ({ ...p, [field]: val })) }

  async function save() {
    setSaving(true)
    await onUpdate(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function resetData() {
    setResetting(true)
    await Promise.all([
      supabase.from('sessions').delete().eq('user_id', session.user.id),
      supabase.from('nutrition_logs').delete().eq('user_id', session.user.id),
      supabase.from('weight_logs').delete().eq('user_id', session.user.id),
      supabase.from('sleep_logs').delete().eq('user_id', session.user.id),
    ])
    localStorage.clear()
    setResetting(false)
    setShowResetConfirm(false)
    alert('All data reset! Refreshing...')
    window.location.reload()
  }

  const sport = SPORTS.find(s => s.id === form.sport)
  const c = {
    card: { margin: '0 16px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' },
    inp: { width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
    label: { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: 6, display: 'block' },
    section: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  }

  const sections = [
    { id: 'personal', icon: '👤', label: 'Personal Details' },
    { id: 'sport', icon: '🏋️', label: 'Sport & Race' },
    { id: 'goals', icon: '🎯', label: 'Nutrition Goals' },
    { id: 'body', icon: '⚖️', label: 'Body & Weight' },
  ]

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Reset confirm modal */}
      {showResetConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowResetConfirm(false)}>
          <div style={{ background: 'var(--card)', border: '1px solid #EF444430', borderRadius: 24, padding: 28, width: '100%', maxWidth: 320, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Reset all data?</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
              This will delete ALL your sessions, nutrition logs, weight entries and sleep data. This cannot be undone.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={resetData} disabled={resetting}
                style={{ background: '#EF4444', border: 'none', borderRadius: 12, padding: 13, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {resetting ? 'Resetting...' : 'Yes, reset everything'}
              </button>
              <button onClick={() => setShowResetConfirm(false)}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, padding: 13, color: 'var(--muted)', fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '0 16px 16px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.5px', color: 'var(--text)' }}>Profile</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Manage your details & goals</p>
      </div>

      {/* Profile hero */}
      <div style={{ ...c.card, overflow: 'visible' }}>
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {form.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{form.name || 'Athlete'}</p>
            <p style={{ fontSize: 12, color: '#FF5A1F', marginTop: 2 }}>{sport?.icon} {sport?.label}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              {form.weight && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{form.weight}kg</span>}
              {form.height && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{form.height}cm</span>}
              {form.age && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{form.age}y</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {sections.map(sec => (
        <div key={sec.id} style={c.card}>
          <button
            onClick={() => setActiveSection(activeSection === sec.id ? null : sec.id)}
            style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 20 }}>{sec.icon}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{sec.label}</span>
            <ChevronRight size={16} color="var(--muted)" style={{ transform: activeSection === sec.id ? 'rotate(90deg)' : 'none', transition: '.2s' }} />
          </button>

          {activeSection === sec.id && (
            <div style={{ borderTop: '1px solid var(--border)', ...c.section }}>

              {sec.id === 'personal' && (
                <>
                  {[{ l: 'Full name', f: 'name', p: 'Your name' }, { l: 'Age', f: 'age', p: '25', t: 'number' }, { l: 'Height (cm)', f: 'height', p: '175', t: 'number' }].map(({ l, f, p, t }) => (
                    <div key={f}>
                      <label style={c.label}>{l}</label>
                      <input type={t || 'text'} placeholder={p} value={form[f]} onChange={e => upd(f, e.target.value)} style={c.inp} />
                    </div>
                  ))}
                  <div>
                    <label style={c.label}>Gender</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['Male', 'Female', 'Other'].map(g => (
                        <button key={g} onClick={() => upd('gender', g)}
                          style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: `1px solid ${form.gender === g ? '#FF5A1F' : 'var(--border)'}`, background: form.gender === g ? '#FF5A1F20' : 'transparent', color: form.gender === g ? '#FF5A1F' : 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {sec.id === 'sport' && (
                <>
                  <div>
                    <label style={c.label}>Your sport</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {SPORTS.map(s => (
                        <button key={s.id} onClick={() => upd('sport', s.id)}
                          style={{ padding: '6px 12px', borderRadius: 10, border: `1px solid ${form.sport === s.id ? '#FF5A1F' : 'var(--border)'}`, background: form.sport === s.id ? '#FF5A1F20' : 'transparent', color: form.sport === s.id ? '#FF5A1F' : 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {s.icon} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={c.label}>Event / Race name</label>
                    <input placeholder="e.g. Hyrox Delhi" value={form.event_name} onChange={e => upd('event_name', e.target.value)} style={c.inp} />
                  </div>
                  <div>
                    <label style={c.label}>Race date</label>
                    <input type="date" value={form.race_date} onChange={e => upd('race_date', e.target.value)} style={c.inp} />
                  </div>
                  <div>
                    <label style={c.label}>Primary goal</label>
                    <select value={form.primary_goal} onChange={e => upd('primary_goal', e.target.value)} style={c.inp}>
                      <option value="">Select goal</option>
                      {['Finish the race', 'Hit a PB', 'Lose weight', 'Build muscle', 'Improve fitness', 'Compete and win'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={c.label}>Training days per week</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['3 days', '4 days', '5 days', '6 days', '7 days'].map(d => (
                        <button key={d} onClick={() => upd('training_days_per_week', d)}
                          style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: `1px solid ${form.training_days_per_week === d ? '#FF5A1F' : 'var(--border)'}`, background: form.training_days_per_week === d ? '#FF5A1F20' : 'transparent', color: form.training_days_per_week === d ? '#FF5A1F' : 'var(--muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          {d.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {sec.id === 'goals' && (
                <>
                  {[
                    { l: 'Daily calories (kcal)', f: 'calories', p: '2800' },
                    { l: 'Protein goal (g)', f: 'protein', p: '180' },
                    { l: 'Carbs goal (g)', f: 'carbs', p: '300' },
                    { l: 'Fat goal (g)', f: 'fat', p: '80' },
                    { l: 'Water goal (L)', f: 'water', p: '3.0' },
                  ].map(({ l, f, p }) => (
                    <div key={f}>
                      <label style={c.label}>{l}</label>
                      <input type="number" placeholder={p} value={form.goals[f] || ''}
                        onChange={e => upd('goals', { ...form.goals, [f]: Number(e.target.value) })} style={c.inp} />
                    </div>
                  ))}
                  <div>
                    <label style={c.label}>Daily step goal</label>
                    <input type="number" placeholder="10000" value={form.step_goal} onChange={e => upd('step_goal', Number(e.target.value))} style={c.inp} />
                  </div>
                </>
              )}

              {sec.id === 'body' && (
                <>
                  {[{ l: 'Current weight (kg)', f: 'weight', p: '75' }, { l: 'Goal weight (kg)', f: 'goal_weight', p: '70' }].map(({ l, f, p }) => (
                    <div key={f}>
                      <label style={c.label}>{l}</label>
                      <input type="number" placeholder={p} value={form[f]} onChange={e => upd(f, e.target.value)} style={c.inp} />
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Save button */}
      <div style={{ padding: '0 16px 12px' }}>
        <button onClick={save} disabled={saving}
          style={{ width: '100%', background: saved ? '#22C55E' : 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 14, padding: 15, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,90,31,.3)', transition: '.2s' }}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </div>

      {/* Connect to coach */}
      {profile?.role !== 'coach' && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
            <button onClick={() => setActiveSection(activeSection === 'coach' ? null : 'coach')}
              style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 20 }}>🏅</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Connect to Coach</span>
              <ChevronRight size={16} color="var(--muted)" style={{ transform: activeSection === 'coach' ? 'rotate(90deg)' : 'none', transition: '.2s' }} />
            </button>
            {activeSection === 'coach' && (
              <div style={{ borderTop: '1px solid var(--border)', padding: 16 }}>
                {coachConnected ? (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <p style={{ fontSize: 14, color: '#22C55E', fontWeight: 600 }}>✅ Connected to your coach</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Your coach can view your progress and assign workouts</p>
                    <button onClick={disconnectCoach}
                      style={{ marginTop: 12, background: 'transparent', border: '1px solid #EF444430', borderRadius: 10, padding: '8px 16px', color: '#EF4444', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Disconnect coach
                    </button>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>
                      Enter your coach's code to connect. They can then view your progress and assign workouts.
                    </p>
                    <input
                      placeholder="Enter coach code (e.g. RAHUL-123)"
                      value={coachCodeInput}
                      onChange={e => setCoachCodeInput(e.target.value.toUpperCase())}
                      style={{ ...c.inp, marginBottom: 8, letterSpacing: '.08em', fontWeight: 600 }}
                    />
                    {coachMsg && <p style={{ fontSize: 13, color: coachMsg.includes('✅') ? '#22C55E' : '#EF4444', marginBottom: 8 }}>{coachMsg}</p>}
                    <button onClick={connectToCoach} disabled={connectingCoach || !coachCodeInput.trim()}
                      style={{ width: '100%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: connectingCoach || !coachCodeInput.trim() ? 0.6 : 1 }}>
                      {connectingCoach ? 'Connecting...' : 'Connect to Coach'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reset data */}
      <div style={{ padding: '0 16px' }}>
        <button onClick={() => setShowResetConfirm(true)}
          style={{ width: '100%', background: 'transparent', border: '1px solid #EF444430', borderRadius: 14, padding: 14, color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <RotateCcw size={15} /> Reset all my data
        </button>
      </div>
    </div>
  )
}