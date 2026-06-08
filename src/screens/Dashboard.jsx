import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Droplets, Moon, Footprints } from 'lucide-react'

function todayDate() { return new Date().toISOString().split('T')[0] }
function todayKey() { return new Date().toDateString() }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getDaysToRace(raceDate) {
  if (!raceDate) return null
  const diff = new Date(raceDate) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Calories burned calculation
function calcCaloriesBurned(sessions, profile) {
  const weight = Number(profile?.weight) || 70
  const today = new Date().toDateString()
  const todaySessions = sessions.filter(s =>
    new Date(s.date).toDateString() === today
  )

  // Only count calories if there are actual logged sessions today
  if (todaySessions.length === 0) return 0

  let burned = 0
  todaySessions.forEach(s => {
    const dur = Number(s.duration) || 45
    const rpe = Number(s.rpe) || 6
    const met = s.type === 'Strength' ? 3.5 + rpe * 0.3
      : s.type === 'Conditioning' ? 6 + rpe * 0.5
      : s.type === 'Skills' ? 4 + rpe * 0.2
      : s.type === 'Mobility' ? 2.5
      : 4 + rpe * 0.3
    burned += Math.round(met * weight * (dur / 60))
  })

  return burned
}

// Daily rating (1-5)
function calcDailyRating(data) {
  const { calories, calorieGoal, protein, proteinGoal, water, waterGoal, steps, stepGoal, sleep, sessions } = data
  let score = 0; let max = 0
  // Nutrition (0-2 points)
  max += 2
  if (calories > 0) score += Math.min(calories / calorieGoal, 1.2) > 0.8 ? 1 : 0.5
  if (protein > 0) score += (protein / proteinGoal) > 0.8 ? 1 : 0.5
  // Workout (0-1 point)
  max += 1
  if (sessions > 0) score += 1
  // Steps (0-1 point)
  max += 1
  if (steps > 0) score += Math.min(steps / stepGoal, 1)
  // Water (0-0.5 point)
  max += 0.5
  if (water > 0) score += Math.min(water / waterGoal, 1) * 0.5
  // Sleep (0-0.5 point)
  max += 0.5
  if (sleep >= 7) score += 0.5
  else if (sleep >= 6) score += 0.3
  const rating = Math.round((score / max) * 5)
  return Math.max(1, Math.min(5, rating))
}

const SPORT_CONFIG = {
  marathon: { icon: '🏃', name: 'Marathon', color: '#3B82F6' },
  hyrox: { icon: '⚡', name: 'Hyrox', color: '#FF5A1F' },
  ocr: { icon: '🏔️', name: 'OCR', color: '#FF8C42' },
  cycling: { icon: '🚴', name: 'Cycling', color: '#A855F7' },
  bodybuilding: { icon: '🏋️', name: 'Bodybuilding', color: '#A855F7' },
  crossfit: { icon: '🏇', name: 'CrossFit', color: '#FF5A1F' },
  triathlon: { icon: '🏊', name: 'Triathlon', color: '#3B82F6' },
  combat: { icon: '🥊', name: 'Combat', color: '#FF5A1F' },
  team: { icon: '⚽', name: 'Team Sports', color: '#3B82F6' },
  calisthenics: { icon: '🤸', name: 'Calisthenics', color: '#22C55E' },
  general: { icon: '🎯', name: 'General Fitness', color: '#FF5A1F' },
  custom: { icon: '🏄', name: 'Custom', color: '#A855F7' },
}

function getSarcasticMsg(burned, burnGoal, steps, water, waterGoal) {
  if (burned < burnGoal * 0.2) return "You've barely moved today. The couch called — apparently you answered."
  if (steps < 2000 && steps > 0) return `${steps.toLocaleString()} steps. Did you walk to the fridge and count it?`
  if (water < waterGoal * 0.3) return `${water}L water. You're basically a raisin at this point. Drink something.`
  if (burned > burnGoal * 1.2) return `${burned} kcal burned. Now that's what we're talking about. Don't ruin it at dinner.`
  const defaults = [
    "Log your meals so I can roast you properly.",
    "Average effort. Acceptable. But we both know you can do better.",
    "Still waiting for something worth commenting on.",
  ]
  return defaults[new Date().getDate() % defaults.length]
}

function Ring({ pct, size = 110, stroke = 11, color = '#FF5A1F', children }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.max((Math.min(pct, 100) / 100) * circ, 0)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

function SleepCard({ userId }) {
  const [sleepLog, setSleepLog] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [hours, setHours] = useState('')
  const [quality, setQuality] = useState(3)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSleep() }, [])

  async function fetchSleep() {
    const { data } = await supabase.from('sleep_logs').select('*')
      .eq('user_id', userId).eq('date', todayDate()).single()
    if (data) setSleepLog(data)
  }

  async function saveSleep() {
    if (!hours) return
    setSaving(true)
    const { data } = await supabase.from('sleep_logs')
      .upsert({ user_id: userId, date: todayDate(), hours: Number(hours), quality }, { onConflict: 'user_id,date' })
      .select().single()
    if (data) setSleepLog(data)
    setSaving(false); setShowForm(false); setHours('')
  }

  const qColors = { 1: '#EF4444', 2: '#FF8C42', 3: '#A855F7', 4: '#3B82F6', 5: '#22C55E' }
  const qLabels = { 1: 'Terrible 😵', 2: 'Poor 😴', 3: 'OK 😐', 4: 'Good 😊', 5: 'Great 🔥' }

  return (
    <div style={{ margin: '0 16px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sleepLog && !showForm ? 12 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#12082030', border: '1px solid #A855F730', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌙</div>
          <div>
            <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14 }}>Sleep</p>
            {sleepLog && !showForm && <p style={{ color: 'var(--muted)', fontSize: 11 }}>Last night</p>}
          </div>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ fontSize: 12, color: '#A855F7', border: '1px solid #A855F740', borderRadius: 8, padding: '5px 12px', background: '#12082015', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : sleepLog ? 'Update' : 'Log sleep'}
        </button>
      </div>
      {sleepLog && !showForm && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <p style={{ fontSize: 26, fontWeight: 700, color: '#A855F7', lineHeight: 1 }}>{sleepLog.hours}h</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>hours slept</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: qColors[sleepLog.quality] }}>{qLabels[sleepLog.quality]}</p>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(sleepLog.hours / 9) * 100}%`, background: qColors[sleepLog.quality], borderRadius: 2 }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              {sleepLog.hours >= 7 ? '✓ Well rested' : sleepLog.hours >= 6 ? 'Could be better' : '⚠ Need more sleep'}
            </p>
          </div>
        </div>
      )}
      {!sleepLog && !showForm && <p style={{ color: 'var(--subtle)', fontSize: 13, marginTop: 8 }}>No sleep logged yet</p>}
      {showForm && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Hours slept</p>
            <input type="number" placeholder="7.5" value={hours} onChange={e => setHours(e.target.value)} step="0.5" min="1" max="12"
              style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 12, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Sleep quality</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1,2,3,4,5].map(q => (
                <button key={q} onClick={() => setQuality(q)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: quality === q ? 600 : 400, cursor: 'pointer', background: quality === q ? qColors[q] + '20' : 'var(--card2)', border: `1px solid ${quality === q ? qColors[q] : 'var(--border)'}`, color: quality === q ? qColors[q] : 'var(--muted)' }}>
                  {q}★
                </button>
              ))}
            </div>
          </div>
          <button onClick={saveSleep} disabled={saving || !hours}
            style={{ width: '100%', background: '#A855F7', border: 'none', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving || !hours ? 0.5 : 1 }}>
            {saving ? 'Saving...' : 'Save sleep'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ profile, session }) {
  const [nutrition, setNutrition] = useState({ calories: 0, protein: 0, water: 0 })
  const [steps, setSteps] = useState(0)
  const [stepsInput, setStepsInput] = useState('')
  const [showStepsInput, setShowStepsInput] = useState(false)
  const [sessions, setSessions] = useState([])
  const [sleepHours, setSleepHours] = useState(0)

  const sport = profile?.sport || 'general'
  const config = SPORT_CONFIG[sport] || SPORT_CONFIG.general
  const goals = profile?.goals || {}
  const calorieGoal = goals.calories || 2800
  const proteinGoal = goals.protein || 180
  const waterGoal = goals.water || 3.0
  const stepGoal = profile?.step_goal || 10000

  const daysLeft = profile?.has_race && profile?.race_date ? getDaysToRace(profile.race_date) : null
  const startDate = profile?.created_at ? new Date(profile.created_at) : new Date()
  const totalDays = daysLeft ? Math.ceil((new Date(profile.race_date) - startDate) / (1000*60*60*24)) : 100
  const progressPct = daysLeft ? Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100)) : 0

  const caloriesBurned = calcCaloriesBurned(sessions, profile)
  const burnGoal = calorieGoal * 1.2 // burn target slightly above intake goal
  const burnPct = Math.min((caloriesBurned / burnGoal) * 100, 100)
  const waterPct = Math.min((nutrition.water / waterGoal) * 100, 100)
  const stepPct = Math.min(Math.round((steps / stepGoal) * 100), 100)
  const sessionToday = sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length
  const workoutPct = Math.min(sessionToday * 50, 100)
  const overallPct = Math.round((burnPct + waterPct + workoutPct) / 3)

  const dailyRating = calcDailyRating({
    calories: nutrition.calories, calorieGoal,
    protein: nutrition.protein, proteinGoal,
    water: nutrition.water, waterGoal,
    steps, stepGoal,
    sleep: sleepHours,
    sessions: sessionToday,
  })

  const sarcasticMsg = getSarcasticMsg(caloriesBurned, burnGoal, steps, nutrition.water, waterGoal)
  const todaySession = sessions.find(s => new Date(s.date).toDateString() === new Date().toDateString())

  useEffect(() => {
    fetchNutrition()
    fetchSessions()
    fetchSleep()
    const saved = localStorage.getItem('steps_' + todayKey())
    if (saved) setSteps(Number(saved))
    const interval = setInterval(fetchNutrition, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchNutrition() {
    const { data } = await supabase.from('nutrition_logs').select('*')
      .eq('user_id', session.user.id).eq('date', todayDate()).single()
    if (data) {
      const meals = data.meals || []
      setNutrition({
        calories: Math.round(meals.reduce((s, m) => s + Number(m.calories || 0), 0)),
        protein: Math.round(meals.reduce((s, m) => s + Number(m.protein || 0), 0)),
        water: data.water || 0,
      })
    }
  }

  async function fetchSessions() {
    const { data } = await supabase.from('sessions').select('*')
      .eq('user_id', session.user.id).order('date', { ascending: false })
    if (data) setSessions(data)
  }

  async function fetchSleep() {
    const { data } = await supabase.from('sleep_logs').select('hours')
      .eq('user_id', session.user.id).eq('date', todayDate()).single()
    if (data) setSleepHours(data.hours || 0)
  }

  function saveSteps() {
    const val = Number(stepsInput)
    if (!val) return
    setSteps(val)
    localStorage.setItem('steps_' + todayKey(), String(val))
    const history = JSON.parse(localStorage.getItem('stepsHistory') || '{}')
    history[todayKey()] = val
    localStorage.setItem('stepsHistory', JSON.stringify(history))
    setStepsInput('')
    setShowStepsInput(false)
  }

  const card = { margin: '0 16px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16 }
  const label = { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>{getGreeting()},</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.3px', color: 'var(--text)' }}>
            {profile?.name || 'Athlete'} 👋
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, marginTop: 4, border: '1px solid', color: config.color, borderColor: config.color + '40', background: config.color + '15' }}>
            {config.icon} {config.name}
            {profile?.event_name && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {profile.event_name}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a080015', border: '1px solid #FF5A1F40', borderRadius: 12, padding: '7px 12px', fontSize: 13, fontWeight: 700, color: '#FF5A1F' }}>
          🔥 {sessions.length}
          <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--muted)' }}>sessions</span>
        </div>
      </div>

      {/* Progress Ring */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 18 }}>
        <Ring pct={overallPct} color="#FF5A1F">
          <span style={{ fontWeight: 700, fontSize: 26, color: 'var(--text)', lineHeight: 1 }}>{overallPct}%</span>
          <span style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Today</span>
        </Ring>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Calories BURNED */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#1a080015', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🔥</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#FF5A1F' }}>
                {caloriesBurned} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>kcal burned</span>
              </p>
              <p style={{ fontSize: 10, color: 'var(--muted)' }}>Calories burned today</p>
              <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${burnPct}%`, background: '#FF5A1F', borderRadius: 2 }} />
              </div>
            </div>
          </div>
          {/* Water */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#001020', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>💧</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#3B82F6' }}>
                {nutrition.water}L <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>/ {waterGoal}L</span>
              </p>
              <p style={{ fontSize: 10, color: 'var(--muted)' }}>Water intake</p>
              <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${waterPct}%`, background: '#3B82F6', borderRadius: 2 }} />
              </div>
            </div>
          </div>
          {/* Workout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#001a08', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>💪</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#22C55E' }}>
                {todaySession ? todaySession.type : 'Rest day'}
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>
                  {todaySession ? ` · RPE ${todaySession.rpe || '--'}/10` : ''}
                </span>
              </p>
              <p style={{ fontSize: 10, color: 'var(--muted)' }}>Today's session</p>
              <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${workoutPct}%`, background: '#22C55E', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sarcastic + Daily Rating */}
    <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 4 }}>Today's Rating</p>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ fontSize: 22, opacity: i <= dailyRating ? 1 : 0.15 }}>⭐</span>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
        {dailyRating >= 5 ? 'Perfect day 🔥' : dailyRating >= 4 ? 'Great effort 💪' : dailyRating >= 3 ? 'On track 👍' : dailyRating >= 2 ? 'Keep pushing 🎯' : 'Room to improve 📈'}
      </p>
      </div>
    <div style={{ fontSize: 48, fontWeight: 700, color: dailyRating >= 4 ? '#22C55E' : dailyRating >= 3 ? '#FF5A1F' : '#EF4444', lineHeight: 1 }}>
      {dailyRating}<span style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 400 }}>/5</span>
    </div>
    </div>

      {/* Nutrition + Water */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px', marginBottom: 12 }}>
        {/* Nutrition */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 14 }}>
          <p style={{ ...label, marginBottom: 10 }}>Nutrition</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Ring pct={Math.min((nutrition.calories / calorieGoal) * 100, 100)} size={62} stroke={8} color="#FF5A1F">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{nutrition.calories}</span>
            </Ring>
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)' }}>/ {calorieGoal}</p>
              <p style={{ fontSize: 11, color: '#FF5A1F', fontWeight: 600, marginTop: 2 }}>
                {Math.max(0, calorieGoal - nutrition.calories)} left
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { l: 'Protein', v: nutrition.protein, g: proteinGoal, c: '#22C55E' },
              { l: 'Carbs', v: 0, g: goals.carbs || 300, c: '#3B82F6' },
              { l: 'Fats', v: 0, g: goals.fat || 80, c: '#FF8C42' },
            ].map(({ l, v, g, c }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0 }} />
                <span style={{ color: 'var(--muted)', flex: 1 }}>{l}</span>
                <span style={{ color: 'var(--text2)' }}>{v}/{g}g</span>
              </div>
            ))}
          </div>
        </div>

        {/* Water */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column' }}>
          <p style={{ ...label, marginBottom: 6 }}>Water 💧</p>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Ring pct={waterPct} size={76} stroke={9} color="#3B82F6">
              <span style={{ fontSize: 17, fontWeight: 700, color: '#3B82F6', lineHeight: 1 }}>{nutrition.water}</span>
              <span style={{ fontSize: 9, color: 'var(--muted)' }}>/ {waterGoal}L</span>
            </Ring>
          </div>
          <p style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', margin: '6px 0 10px' }}>
            {waterPct >= 100 ? '✓ Goal reached!' : `${Math.round((waterGoal - nutrition.water) * 10) / 10}L to go`}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={async () => {
              const nw = Math.max(0, Math.round((nutrition.water - 0.25) * 10) / 10)
              setNutrition(n => ({ ...n, water: nw }))
              await supabase.from('nutrition_logs').upsert({ user_id: session.user.id, date: todayDate(), water: nw, meals: [] }, { onConflict: 'user_id,date' })
            }}
              style={{ flex: 1, height: 36, background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 22, cursor: 'pointer', fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <button onClick={async () => {
              const nw = Math.round((nutrition.water + 0.25) * 10) / 10
              setNutrition(n => ({ ...n, water: nw }))
              await supabase.from('nutrition_logs').upsert({ user_id: session.user.id, date: todayDate(), water: nw, meals: [] }, { onConflict: 'user_id,date' })
            }}
              style={{ flex: 1, height: 36, background: '#3B82F6', border: 'none', borderRadius: 10, color: '#fff', fontSize: 22, cursor: 'pointer', fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 32, fontWeight: 700, color: '#22C55E', lineHeight: 1 }}>{steps.toLocaleString()}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>steps · goal {stepGoal.toLocaleString()}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 28 }}>🏃</span>
            <button onClick={() => setShowStepsInput(s => !s)}
              style={{ fontSize: 11, color: '#FF5A1F', border: '1px solid #FF5A1F40', borderRadius: 8, padding: '4px 10px', background: '#FF5A1F15', cursor: 'pointer' }}>
              {showStepsInput ? 'Cancel' : 'Log steps'}
            </button>
          </div>
        </div>
        <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${stepPct}%`, background: 'linear-gradient(90deg,#22C55E,#4ADE80)', borderRadius: 4, transition: '.3s' }} />
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)' }}>{stepPct}% · {Math.max(0, stepGoal - steps).toLocaleString()} to go</p>
        {showStepsInput && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input type="number" placeholder="e.g. 8500" value={stepsInput} onChange={e => setStepsInput(e.target.value)}
              style={{ flex: 1, background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 12, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none' }} />
            <button onClick={saveSteps}
              style={{ background: '#FF5A1F', border: 'none', borderRadius: 12, padding: '10px 18px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Save
            </button>
          </div>
        )}
      </div>

      {/* Sleep */}
      <SleepCard userId={session.user.id} />

      {/* Race countdown */}
      {daysLeft !== null && daysLeft > 0 && (
        <div style={{ ...card, background: config.color + '08', borderColor: config.color + '25' }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: config.color, marginBottom: 6 }}>
            {config.icon} {profile?.event_name || 'Race'} · Countdown
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 52, fontWeight: 700, color: config.color, lineHeight: 1 }}>{daysLeft}</span>
            <span style={{ color: 'var(--subtle)', fontSize: 14 }}>
              days · {new Date(profile.race_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: config.color, borderRadius: 2 }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>{progressPct}% of prep complete</p>
        </div>
      )}

      {/* Weight progress */}
      {profile?.goal_weight && profile?.weight && Number(profile.weight) !== Number(profile.goal_weight) && (
        <div style={{ ...card, marginBottom: 14 }}>
          <p style={{ ...label, marginBottom: 10 }}>Weight progress</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: 11 }}>Start</p>
              <p style={{ color: 'var(--text)', fontWeight: 700 }}>{profile.weight}kg</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: 11 }}>Goal</p>
              <p style={{ color: 'var(--text)', fontWeight: 700 }}>{profile.goal_weight}kg</p>
            </div>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '8%', background: '#FF5A1F', borderRadius: 3 }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
            {Math.abs(Number(profile.weight) - Number(profile.goal_weight)).toFixed(1)}kg to goal
          </p>
        </div>
      )}

    </div>
  )
}