import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronRight, ChevronLeft } from 'lucide-react'

const SPORTS = [
  { id: 'hyrox', icon: '⚡', label: 'Hyrox' },
  { id: 'marathon', icon: '🏃', label: 'Marathon' },
  { id: 'bodybuilding', icon: '🏋️', label: 'Bodybuilding' },
  { id: 'crossfit', icon: '🏇', label: 'CrossFit' },
  { id: 'cycling', icon: '🚴', label: 'Cycling' },
  { id: 'triathlon', icon: '🏊', label: 'Triathlon' },
  { id: 'ocr', icon: '🏔️', label: 'OCR' },
  { id: 'combat', icon: '🥊', label: 'Combat Sports' },
  { id: 'team', icon: '⚽', label: 'Team Sports' },
  { id: 'calisthenics', icon: '🤸', label: 'Calisthenics' },
  { id: 'general', icon: '🎯', label: 'General Fitness' },
  { id: 'custom', icon: '🏄', label: 'Other' },
]

const GOALS = [
  { id: 'finish', icon: '🏁', label: 'Finish my first race' },
  { id: 'pb', icon: '⏱️', label: 'Hit a personal best' },
  { id: 'lose', icon: '🔥', label: 'Lose weight' },
  { id: 'muscle', icon: '💪', label: 'Build muscle' },
  { id: 'fitness', icon: '❤️', label: 'Improve fitness' },
  { id: 'compete', icon: '🏆', label: 'Compete & win' },
]

const DAYS = ['3 days', '4 days', '5 days', '6 days', '7 days']

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    role: '',
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    goal_weight: '',
    sport: '',
    event_name: '',
    race_date: '',
    has_race: false,
    primary_goal: '',
    training_days_per_week: '4 days',
    goals: { calories: 2500, protein: 150, carbs: 300, fat: 70, water: 3 },
    step_goal: 10000,
  })

  function upd(field, val) { setForm(p => ({ ...p, [field]: val })) }

  const totalSteps = form.role === 'coach' ? 3 : 6

  async function handleComplete() {
    const data = { ...form }
    if (form.role === 'coach') {
      const base = (form.name || 'COACH').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)
      const rand = Math.floor(Math.random() * 900 + 100)
      data.coach_code = `${base}-${rand}`
    }
    // Auto-calculate nutrition goals based on body stats
    if (form.weight && form.age && form.height) {
      const w = Number(form.weight)
      const h = Number(form.height)
      const a = Number(form.age)
      const isMale = form.gender !== 'Female'
      const bmr = isMale ? 10*w + 6.25*h - 5*a + 5 : 10*w + 6.25*h - 5*a - 161
      const tdee = Math.round(bmr * 1.55) // moderate activity
      const protein = Math.round(w * 2.0)
      const fat = Math.round(w * 0.9)
      const carbs = Math.round((tdee - protein*4 - fat*9) / 4)
      data.goals = {
        calories: tdee,
        protein,
        carbs: Math.max(carbs, 100),
        fat,
        water: w > 80 ? 3.5 : 3,
      }
    }
    onComplete(data)
  }

  const inp = {
    width: '100%', background: '#0f0f0f', border: '1px solid #252525',
    borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 15,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const progress = ((step) / totalSteps) * 100

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column' }}>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#1a1a1a', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#FF5A1F,#FF8C42)', borderRadius: 2, transition: '.4s' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 420, margin: '0 auto', width: '100%', padding: '60px 20px 100px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/icon-512.png" alt="Pace4" style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 10px', display: 'block', boxShadow: '0 4px 20px rgba(255,90,31,.4)' }} />
          <p style={{ fontSize: 11, color: '#444', letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Step {step + 1} of {totalSteps}
          </p>
        </div>

        {/* ── STEP 0 — Role ── */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-.3px' }}>Welcome to Pace4</h2>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 28, lineHeight: 1.6 }}>How will you use the app?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { role: 'athlete', icon: '🏃', title: 'I am an Athlete', sub: 'Track training, nutrition, sleep and progress' },
                { role: 'coach', icon: '🏅', title: 'I am a Coach', sub: 'Manage athletes, assign workouts, track their progress' },
              ].map(({ role, icon, title, sub }) => (
                <button key={role} onClick={() => { upd('role', role); setStep(1) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 18px', borderRadius: 18, border: `2px solid ${form.role === role ? '#FF5A1F' : '#1a1a1a'}`, background: form.role === role ? '#FF5A1F10' : '#0a0a0a', cursor: 'pointer', textAlign: 'left', transition: '.15s' }}>
                  <span style={{ fontSize: 40, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{title}</p>
                    <p style={{ fontSize: 12, color: '#555', marginTop: 4, lineHeight: 1.5 }}>{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1 — Name & Basic ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-.3px' }}>
              {form.role === 'coach' ? 'Your details' : 'Tell us about yourself'}
            </h2>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 28 }}>We'll personalise your experience</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Full name *</p>
                <input placeholder="Your name" value={form.name} onChange={e => upd('name', e.target.value)} style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Age</p>
                  <input type="number" placeholder="25" value={form.age} onChange={e => upd('age', e.target.value)} style={inp} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Gender</p>
                  <select value={form.gender} onChange={e => upd('gender', e.target.value)} style={{ ...inp }}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Height (cm)</p>
                  <input type="number" placeholder="175" value={form.height} onChange={e => upd('height', e.target.value)} style={inp} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Weight (kg)</p>
                  <input type="number" placeholder="70" value={form.weight} onChange={e => upd('weight', e.target.value)} style={inp} />
                </div>
              </div>
              {form.role === 'athlete' && (
                <div>
                  <p style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Goal weight (kg)</p>
                  <input type="number" placeholder="65" value={form.goal_weight} onChange={e => upd('goal_weight', e.target.value)} style={inp} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2 — Sport (athletes only) ── */}
        {step === 2 && form.role === 'athlete' && (
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-.3px' }}>Your sport</h2>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>What are you training for?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {SPORTS.map(s => (
                <button key={s.id} onClick={() => upd('sport', s.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 16, border: `2px solid ${form.sport === s.id ? '#FF5A1F' : '#1a1a1a'}`, background: form.sport === s.id ? '#FF5A1F10' : '#0a0a0a', cursor: 'pointer', textAlign: 'left', transition: '.15s' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: form.sport === s.id ? '#FF5A1F' : '#ccc' }}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3 — Race/Event (athletes only) ── */}
        {step === 3 && form.role === 'athlete' && (
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-.3px' }}>Any upcoming race?</h2>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>We'll build a countdown for you</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {[{ v: true, l: 'Yes, I have one!' }, { v: false, l: 'No race planned' }].map(({ v, l }) => (
                <button key={String(v)} onClick={() => upd('has_race', v)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: `2px solid ${form.has_race === v ? '#FF5A1F' : '#1a1a1a'}`, background: form.has_race === v ? '#FF5A1F10' : '#0a0a0a', color: form.has_race === v ? '#FF5A1F' : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: '.15s' }}>
                  {l}
                </button>
              ))}
            </div>
            {form.has_race && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Event name</p>
                  <input placeholder="e.g. Hyrox Delhi, Mumbai Marathon" value={form.event_name} onChange={e => upd('event_name', e.target.value)} style={inp} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Race date</p>
                  <input type="date" value={form.race_date} onChange={e => upd('race_date', e.target.value)} style={inp} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4 — Goal (athletes only) ── */}
        {step === 4 && form.role === 'athlete' && (
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-.3px' }}>Primary goal</h2>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>What's the main thing you want to achieve?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {GOALS.map(g => (
                <button key={g.id} onClick={() => upd('primary_goal', g.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, border: `2px solid ${form.primary_goal === g.id ? '#FF5A1F' : '#1a1a1a'}`, background: form.primary_goal === g.id ? '#FF5A1F10' : '#0a0a0a', cursor: 'pointer', textAlign: 'left', transition: '.15s' }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{g.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: form.primary_goal === g.id ? '#FF5A1F' : '#ccc' }}>{g.label}</span>
                  {form.primary_goal === g.id && <span style={{ marginLeft: 'auto', color: '#FF5A1F', fontSize: 18 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 5 — Training schedule (athletes only) ── */}
        {step === 5 && form.role === 'athlete' && (
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-.3px' }}>Training schedule</h2>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>How many days a week do you train?</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
              {DAYS.map(d => (
                <button key={d} onClick={() => upd('training_days_per_week', d)}
                  style={{ flex: '1 1 80px', padding: '14px 0', borderRadius: 14, border: `2px solid ${form.training_days_per_week === d ? '#FF5A1F' : '#1a1a1a'}`, background: form.training_days_per_week === d ? '#FF5A1F10' : '#0a0a0a', color: form.training_days_per_week === d ? '#FF5A1F' : '#555', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: '.15s' }}>
                  {d.split(' ')[0]}
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Daily step goal</h3>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>How many steps a day?</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
              {[5000, 8000, 10000, 12000, 15000].map(s => (
                <button key={s} onClick={() => upd('step_goal', s)}
                  style={{ flex: '1 1 70px', padding: '10px 0', borderRadius: 12, border: `2px solid ${form.step_goal === s ? '#FF5A1F' : '#1a1a1a'}`, background: form.step_goal === s ? '#FF5A1F10' : '#0a0a0a', color: form.step_goal === s ? '#FF5A1F' : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: '.15s' }}>
                  {(s/1000).toFixed(0)}K
                </button>
              ))}
            </div>

            {/* Summary card */}
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 18, padding: 16 }}>
              <p style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Your personalised plan</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { l: 'Sport', v: SPORTS.find(s => s.id === form.sport)?.label || '—' },
                  { l: 'Goal', v: GOALS.find(g => g.id === form.primary_goal)?.label?.split(' ').slice(0, 2).join(' ') || '—' },
                  { l: 'Training', v: form.training_days_per_week },
                  { l: 'Steps/day', v: `${(form.step_goal/1000).toFixed(0)}K` },
                ].map(({ l, v }) => (
                  <div key={l} style={{ background: '#0d0d0d', borderRadius: 10, padding: '10px 12px' }}>
                    <p style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{l}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#FF5A1F' }}>{v}</p>
                  </div>
                ))}
              </div>
              {form.weight && form.height && form.age && (
                <div style={{ marginTop: 10, padding: '10px 12px', background: '#0d0d0d', borderRadius: 10 }}>
                  <p style={{ fontSize: 11, color: '#22C55E' }}>
                    ✓ Nutrition goals will be auto-calculated from your body stats
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2 Coach — specialization ── */}
        {step === 2 && form.role === 'coach' && (
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-.3px' }}>Your specialization</h2>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>What sports do you coach?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {SPORTS.map(s => (
                <button key={s.id} onClick={() => upd('sport', s.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 16, border: `2px solid ${form.sport === s.id ? '#FF5A1F' : '#1a1a1a'}`, background: form.sport === s.id ? '#FF5A1F10' : '#0a0a0a', cursor: 'pointer', textAlign: 'left', transition: '.15s' }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: form.sport === s.id ? '#FF5A1F' : '#ccc' }}>{s.label}</span>
                </button>
              ))}
            </div>

            {/* Coach summary */}
            <div style={{ background: '#0a0a0a', border: '1px solid #FF5A1F20', borderRadius: 18, padding: 16 }}>
              <p style={{ fontSize: 11, color: '#FF5A1F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>🏅 Coach Account Setup</p>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
                You'll get a unique coach code your athletes can use to connect with you instantly. You can view their progress and assign workouts from your coach dashboard.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav buttons */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, padding: '16px 20px 32px', background: 'rgba(8,8,8,.97)', borderTop: '1px solid #1a1a1a', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ width: 48, height: 52, borderRadius: 14, background: '#0f0f0f', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <ChevronLeft size={20} color="#666" />
            </button>
          )}
          <button
            onClick={() => {
              const isLastStep = (form.role === 'coach' && step === 2) || (form.role === 'athlete' && step === 5)
              if (step === 0 && !form.role) return
              if (step === 1 && !form.name.trim()) return
              if (isLastStep) handleComplete()
              else setStep(s => s + 1)
            }}
            disabled={
              (step === 0 && !form.role) ||
              (step === 1 && !form.name.trim()) ||
              (step === 2 && form.role === 'athlete' && !form.sport) ||
              (step === 4 && !form.primary_goal)
            }
            style={{
              flex: 1, height: 52, borderRadius: 14,
              background: ((step === 0 && !form.role) || (step === 1 && !form.name.trim()) || (step === 2 && form.role === 'athlete' && !form.sport) || (step === 4 && !form.primary_goal))
                ? '#111' : 'linear-gradient(135deg,#FF5A1F,#FF8C42)',
              border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: '.2s', boxShadow: '0 4px 20px rgba(255,90,31,.3)',
            }}>
            {(form.role === 'coach' && step === 2) || (form.role === 'athlete' && step === 5)
              ? "Let's go! 🚀"
              : step === 0 ? 'Get started' : 'Continue'}
            {!((form.role === 'coach' && step === 2) || (form.role === 'athlete' && step === 5)) && step > 0 && (
              <ChevronRight size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}