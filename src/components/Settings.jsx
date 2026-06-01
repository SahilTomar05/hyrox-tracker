import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import { Moon, Sun, LogOut, ChevronRight, User, Target, Bell, Dumbbell, Scale } from 'lucide-react'

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

export default function Settings({ profile, onUpdate, onReset }) {
  const { theme, brand, isDark, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('profile')
  const [form, setForm] = useState({
    name: profile?.name || '',
    sport: profile?.sport || 'general',
    event_name: profile?.event_name || '',
    race_date: profile?.race_date || '',
    has_race: profile?.has_race || false,
    weight: profile?.weight || '',
    goal_weight: profile?.goal_weight || '',
    height: profile?.height || '',
    age: profile?.age || '',
    gender: profile?.gender || '',
    primary_goal: profile?.primary_goal || '',
    training_days_per_week: profile?.training_days_per_week || '4 days',
    goals: profile?.goals || { calories: 2800, protein: 180, carbs: 300, fat: 80, water: 3 },
    step_goal: profile?.step_goal || 10000,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function update(field, value) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function save() {
    setSaving(true)
    await onUpdate(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const c = {
    page: { paddingTop: 52, paddingBottom: 24, background: theme.bg, minHeight: '100vh' },
    card: { margin: '0 16px 12px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 18, padding: 16 },
    label: { fontSize: 10, color: theme.muted, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: 6 },
    inp: { width: '100%', background: isDark ? '#0f0f0f' : '#f5f5f5', border: `1px solid ${theme.border}`, borderRadius: 10, padding: '10px 12px', color: theme.text, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
    sectionBtn: (id) => ({
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderBottom: `1px solid ${theme.border}`,
    }),
  }

  const SECTIONS = [
    { id: 'profile', icon: <User size={18}/>, label: 'Profile & Body' },
    { id: 'sport', icon: <Dumbbell size={18}/>, label: 'Sport & Race' },
    { id: 'goals', icon: <Target size={18}/>, label: 'Nutrition Goals' },
    { id: 'steps', icon: <Scale size={18}/>, label: 'Steps & Weight' },
    { id: 'notifications', icon: <Bell size={18}/>, label: 'Notifications' },
  ]

  return (
    <div style={c.page}>

      {/* Header */}
      <div style={{ padding: '0 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.5px', color: theme.text }}>Profile</h1>
          <p style={{ fontSize: 13, color: theme.muted, marginTop: 3 }}>Settings & preferences</p>
        </div>
        {/* Dark mode toggle */}
        <button onClick={toggleTheme}
          style={{ width: 44, height: 44, borderRadius: 14, background: isDark ? '#1a1a1a' : '#f0f0f0', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {isDark ? <Sun size={18} color={brand.orange}/> : <Moon size={18} color={brand.orange}/>}
        </button>
      </div>

      {/* Profile hero card */}
      <div style={{ ...c.card, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg,${brand.orange},${brand.orange2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {form.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>{form.name || 'Athlete'}</p>
          <p style={{ fontSize: 12, color: brand.orange, marginTop: 2 }}>
            {SPORTS.find(s => s.id === form.sport)?.icon} {SPORTS.find(s => s.id === form.sport)?.label}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {form.weight && <span style={{ fontSize: 11, color: theme.muted }}>{form.weight}kg</span>}
            {form.height && <span style={{ fontSize: 11, color: theme.muted }}>{form.height}cm</span>}
            {form.age && <span style={{ fontSize: 11, color: theme.muted }}>{form.age}y</span>}
          </div>
        </div>
      </div>

      {/* Section nav */}
      <div style={{ ...c.card, padding: 0, overflow: 'hidden' }}>
        {SECTIONS.map((sec, i) => (
          <button key={sec.id} onClick={() => setActiveSection(activeSection === sec.id ? null : sec.id)}
            style={{ ...c.sectionBtn(sec.id), borderBottom: i < SECTIONS.length - 1 ? `1px solid ${theme.border}` : 'none', background: activeSection === sec.id ? brand.orange + '10' : 'transparent' }}>
            <span style={{ color: activeSection === sec.id ? brand.orange : theme.muted }}>{sec.icon}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: theme.text, textAlign: 'left' }}>{sec.label}</span>
            <ChevronRight size={16} color={theme.muted} style={{ transform: activeSection === sec.id ? 'rotate(90deg)' : 'none', transition: '.2s' }} />
          </button>
        ))}
      </div>

      {/* Profile section */}
      {activeSection === 'profile' && (
        <div style={c.card}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Full name', field: 'name', placeholder: 'Your name' },
              { label: 'Age', field: 'age', placeholder: '25', type: 'number' },
              { label: 'Height (cm)', field: 'height', placeholder: '175', type: 'number' },
            ].map(({ label, field, placeholder, type }) => (
              <div key={field}>
                <p style={c.label}>{label}</p>
                <input type={type || 'text'} placeholder={placeholder} value={form[field]}
                  onChange={e => update(field, e.target.value)} style={c.inp} />
              </div>
            ))}
            <div>
              <p style={c.label}>Gender</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Male', 'Female', 'Other'].map(g => (
                  <button key={g} onClick={() => update('gender', g)}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: `1px solid ${form.gender === g ? brand.orange : theme.border}`, background: form.gender === g ? brand.orange + '20' : 'transparent', color: form.gender === g ? brand.orange : theme.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sport section */}
      {activeSection === 'sport' && (
        <div style={c.card}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p style={c.label}>Your sport</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SPORTS.map(s => (
                  <button key={s.id} onClick={() => update('sport', s.id)}
                    style={{ padding: '7px 12px', borderRadius: 10, border: `1px solid ${form.sport === s.id ? brand.orange : theme.border}`, background: form.sport === s.id ? brand.orange + '20' : 'transparent', color: form.sport === s.id ? brand.orange : theme.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={c.label}>Event / Race name</p>
              <input placeholder="e.g. Hyrox Delhi, Mumbai Marathon" value={form.event_name}
                onChange={e => update('event_name', e.target.value)} style={c.inp} />
            </div>
            <div>
              <p style={c.label}>Race date</p>
              <input type="date" value={form.race_date}
                onChange={e => update('race_date', e.target.value)} style={c.inp} />
            </div>
            <div>
              <p style={c.label}>Primary goal</p>
              <select value={form.primary_goal} onChange={e => update('primary_goal', e.target.value)}
                style={{ ...c.inp }}>
                <option value="">Select goal</option>
                <option value="Finish the race">Finish the race</option>
                <option value="Hit a PB">Hit a PB</option>
                <option value="Lose weight">Lose weight</option>
                <option value="Build muscle">Build muscle</option>
                <option value="Improve fitness">Improve fitness</option>
                <option value="Compete and win">Compete and win</option>
              </select>
            </div>
            <div>
              <p style={c.label}>Training days per week</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['3 days', '4 days', '5 days', '6 days', '7 days'].map(d => (
                  <button key={d} onClick={() => update('training_days_per_week', d)}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: `1px solid ${form.training_days_per_week === d ? brand.orange : theme.border}`, background: form.training_days_per_week === d ? brand.orange + '20' : 'transparent', color: form.training_days_per_week === d ? brand.orange : theme.muted, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    {d.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals section */}
      {activeSection === 'goals' && (
        <div style={c.card}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Daily calories (kcal)', field: 'calories', placeholder: '2800' },
              { label: 'Protein goal (g)', field: 'protein', placeholder: '180' },
              { label: 'Carbs goal (g)', field: 'carbs', placeholder: '300' },
              { label: 'Fat goal (g)', field: 'fat', placeholder: '80' },
              { label: 'Water goal (L)', field: 'water', placeholder: '3.0' },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <p style={c.label}>{label}</p>
                <input type="number" placeholder={placeholder}
                  value={form.goals[field] || ''}
                  onChange={e => update('goals', { ...form.goals, [field]: Number(e.target.value) })}
                  style={c.inp} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps & Weight section */}
      {activeSection === 'steps' && (
        <div style={c.card}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p style={c.label}>Daily step goal</p>
              <input type="number" placeholder="10000" value={form.step_goal}
                onChange={e => update('step_goal', Number(e.target.value))} style={c.inp} />
            </div>
            <div>
              <p style={c.label}>Current weight (kg)</p>
              <input type="number" placeholder="75" value={form.weight}
                onChange={e => update('weight', e.target.value)} style={c.inp} />
            </div>
            <div>
              <p style={c.label}>Goal weight (kg)</p>
              <input type="number" placeholder="70" value={form.goal_weight}
                onChange={e => update('goal_weight', e.target.value)} style={c.inp} />
            </div>
          </div>
        </div>
      )}

      {/* Notifications section */}
      {activeSection === 'notifications' && (
        <div style={c.card}>
          <p style={{ color: theme.muted, fontSize: 13 }}>Notification settings coming soon.</p>
        </div>
      )}

      {/* Save button */}
      <div style={{ padding: '0 16px 12px' }}>
        <button onClick={save} disabled={saving}
          style={{ width: '100%', background: saved ? brand.green : `linear-gradient(135deg,${brand.orange},${brand.orange2})`, border: 'none', borderRadius: 14, padding: 15, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 20px ${brand.orange}40`, transition: '.2s' }}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </div>

      {/* Sign out */}
      <div style={{ padding: '0 16px 24px' }}>
        <button onClick={onReset}
          style={{ width: '100%', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: 14, padding: 14, color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={16} color="#EF4444" /> Sign out
        </button>
      </div>

      {/* App info */}
      <div style={{ textAlign: 'center', padding: '0 16px 20px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${brand.orange},${brand.orange2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', boxShadow: `0 4px 16px ${brand.orange}40` }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>P4</span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: brand.orange }}>Pace4</p>
        <p style={{ fontSize: 10, color: theme.muted, marginTop: 2, letterSpacing: '.08em', textTransform: 'uppercase' }}>Progress · Action · Consistency · Evolution</p>
        <p style={{ fontSize: 10, color: theme.subtle, marginTop: 6 }}>v1.0.0 · pace4.in</p>
      </div>

    </div>
  )
}