import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import DayPicker from '../components/DayPicker'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getDaysToRace(raceDate) {
  if (!raceDate) return null
  return Math.ceil((new Date(raceDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function calcCaloriesBurned(sessions, profile, date) {
  const weight = Number(profile?.weight) || 70
  const dateStr = new Date(date).toDateString()
  return sessions
    .filter(s => new Date(s.date).toDateString() === dateStr && s.rpe > 0)
    .reduce((total, s) => {
      const dur = Number(s.duration) || 45
      const rpe = Number(s.rpe) || 6
      const met = s.type === 'Strength' ? 3.5 + rpe * 0.3
        : s.type === 'Conditioning' ? 6 + rpe * 0.5
        : s.type === 'Skills' ? 5 + rpe * 0.4
        : s.type === 'Mobility' ? 2.5
        : 4 + rpe * 0.3
      return total + Math.round(met * weight * (dur / 60))
    }, 0)
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

function SleepCard({ userId, selectedDate }) {
  const [sleepLog, setSleepLog] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [hours, setHours] = useState('')
  const [quality, setQuality] = useState(3)
  const [saving, setSaving] = useState(false)

  const dateStr = new Date(selectedDate).toISOString().split('T')[0]

  useEffect(() => { fetchSleep() }, [selectedDate])

  async function fetchSleep() {
    const { data } = await supabase.from('sleep_logs').select('*')
      .eq('user_id', userId).eq('date', dateStr).maybeSingle()
    setSleepLog(data || null)
  }

  async function saveSleep() {
    if (!hours) return
    setSaving(true)
    const { data } = await supabase.from('sleep_logs')
      .upsert({ user_id: userId, date: dateStr, hours: Number(hours), quality }, { onConflict: 'user_id,date' })
      .select().single()
    if (data) setSleepLog(data)
    setSaving(false); setShowForm(false); setHours('')
  }

  const qColors = { 1:'#EF4444', 2:'#FF8C42', 3:'#A855F7', 4:'#3B82F6', 5:'#22C55E' }
  const qLabels = { 1:'Terrible 😵', 2:'Poor 😴', 3:'OK 😐', 4:'Good 😊', 5:'Great 🔥' }

  return (
    <div style={{ margin:'0 16px 12px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: sleepLog && !showForm ? 12 : 0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'#12082030', border:'1px solid #A855F730', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🌙</div>
          <div>
            <p style={{ color:'var(--text)', fontWeight:600, fontSize:14 }}>Sleep</p>
            {sleepLog && !showForm && <p style={{ color:'var(--muted)', fontSize:11 }}>{new Date(selectedDate).toDateString() === new Date().toDateString() ? 'Last night' : new Date(selectedDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</p>}
          </div>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ fontSize:12, color:'#A855F7', border:'1px solid #A855F740', borderRadius:8, padding:'5px 12px', background:'#12082015', cursor:'pointer' }}>
          {showForm ? 'Cancel' : sleepLog ? 'Update' : 'Log sleep'}
        </button>
      </div>
      {sleepLog && !showForm && (
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div>
            <p style={{ fontSize:26, fontWeight:700, color:'#A855F7', lineHeight:1 }}>{sleepLog.hours}h</p>
            <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>hours slept</p>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:13, fontWeight:600, color:qColors[sleepLog.quality] }}>{qLabels[sleepLog.quality]}</p>
            <div style={{ height:4, background:'var(--border)', borderRadius:2, marginTop:8, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(sleepLog.hours/9)*100}%`, background:qColors[sleepLog.quality], borderRadius:2 }} />
            </div>
            <p style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>
              {sleepLog.hours >= 7 ? '✓ Well rested' : sleepLog.hours >= 6 ? 'Could be better' : '⚠ Need more sleep'}
            </p>
          </div>
        </div>
      )}
      {!sleepLog && !showForm && <p style={{ color:'var(--subtle)', fontSize:13, marginTop:8 }}>No sleep logged yet</p>}
      {showForm && (
        <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <p style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>Hours slept</p>
            <input type="number" placeholder="7.5" value={hours} onChange={e => setHours(e.target.value)} step="0.5" min="1" max="12"
              style={{ width:'100%', background:'var(--input-bg)', border:'1px solid var(--border2)', borderRadius:12, padding:'10px 14px', color:'var(--text)', fontSize:14, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <p style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>Sleep quality</p>
            <div style={{ display:'flex', gap:6 }}>
              {[1,2,3,4,5].map(q => (
                <button key={q} onClick={() => setQuality(q)}
                  style={{ flex:1, padding:'8px 4px', borderRadius:10, fontSize:12, fontWeight:quality===q?600:400, cursor:'pointer', background:quality===q?qColors[q]+'20':'var(--card2)', border:`1px solid ${quality===q?qColors[q]:'var(--border)'}`, color:quality===q?qColors[q]:'var(--muted)' }}>
                  {q}★
                </button>
              ))}
            </div>
          </div>
          <button onClick={saveSleep} disabled={saving || !hours}
            style={{ width:'100%', background:'#A855F7', border:'none', borderRadius:12, padding:12, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', opacity:saving||!hours?0.5:1 }}>
            {saving ? 'Saving...' : 'Save sleep'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ profile, session }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [nutrition, setNutrition] = useState({ calories:0, protein:0, water:0 })
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

  const dateStr = new Date(selectedDate).toISOString().split('T')[0]
  const dateKey = new Date(selectedDate).toDateString()
  const isToday = dateKey === new Date().toDateString()

  const caloriesBurned = calcCaloriesBurned(sessions, profile, selectedDate)
  const burnGoal = calorieGoal * 1.2
  const burnPct = Math.min(Math.round((caloriesBurned / burnGoal) * 100), 100)
  const waterPct = Math.min(Math.round((nutrition.water / waterGoal) * 100), 100)
  const stepPct = Math.min(Math.round((steps / stepGoal) * 100), 100)
  const sessionToday = sessions.filter(s => new Date(s.date).toDateString() === dateKey && s.rpe > 0).length
  const workoutPct = sessionToday > 0 ? 100 : 0
  const overallPct = Math.round(burnPct * 0.35 + workoutPct * 0.30 + waterPct * 0.20 + stepPct * 0.15)
  const todaySession = sessions.find(s => new Date(s.date).toDateString() === dateKey && s.rpe > 0)

  // Daily rating 1-5
  const dailyRating = (() => {
    let score = 0; let max = 0
    max += 2
    if (nutrition.calories > 0) score += (nutrition.calories / calorieGoal) > 0.8 ? 1 : 0.5
    if (nutrition.protein > 0) score += (nutrition.protein / proteinGoal) > 0.8 ? 1 : 0.5
    max += 1; if (sessionToday > 0) score += 1
    max += 1; if (steps > 0) score += Math.min(steps / stepGoal, 1)
    max += 0.5; if (nutrition.water > 0) score += Math.min(nutrition.water / waterGoal, 1) * 0.5
    max += 0.5; if (sleepHours >= 7) score += 0.5; else if (sleepHours >= 6) score += 0.3
    return Math.max(1, Math.min(5, Math.round((score / max) * 5)))
  })()

  const ratingMsg = dailyRating >= 5 ? 'Perfect day! 🔥 You are unstoppable!'
    : dailyRating >= 4 ? 'Strong day! 💪 Keep this momentum going!'
    : dailyRating >= 3 ? 'Solid effort! ✅ Every step counts!'
    : dailyRating >= 2 ? 'Good start! 🌱 Tomorrow push a little harder!'
    : 'Keep going! 🚀 Every champion started somewhere!'

  useEffect(() => {
    fetchNutrition()
    fetchSessions()
    fetchSleep()
    const saved = localStorage.getItem('steps_' + dateKey)
    if (saved) setSteps(Number(saved))
    else {
      const history = JSON.parse(localStorage.getItem('stepsHistory') || '{}')
      setSteps(history[dateKey] || 0)
    }
  }, [selectedDate])

  async function fetchNutrition() {
    const { data } = await supabase.from('nutrition_logs').select('*')
      .eq('user_id', session.user.id).eq('date', dateStr).maybeSingle()
    if (data) {
      const meals = data.meals || []
      setNutrition({
        calories: Math.round(meals.reduce((s, m) => s + Number(m.calories || 0), 0)),
        protein: Math.round(meals.reduce((s, m) => s + Number(m.protein || 0), 0)),
        water: data.water || 0,
      })
    } else {
      setNutrition({ calories: 0, protein: 0, water: 0 })
    }
  }

  async function fetchSessions() {
    const { data } = await supabase.from('sessions').select('*')
      .eq('user_id', session.user.id).order('date', { ascending: false })
    if (data) setSessions(data)
  }

  async function fetchSleep() {
    const { data } = await supabase.from('sleep_logs').select('hours')
      .eq('user_id', session.user.id).eq('date', dateStr).maybeSingle()
    setSleepHours(data?.hours || 0)
  }

  async function updateWater(delta) {
    const nw = Math.max(0, Math.round((nutrition.water + delta) * 10) / 10)
    setNutrition(n => ({ ...n, water: nw }))
    const { data: existing } = await supabase.from('nutrition_logs').select('meals')
      .eq('user_id', session.user.id).eq('date', dateStr).maybeSingle()
    await supabase.from('nutrition_logs').upsert({
      user_id: session.user.id, date: dateStr,
      water: nw, meals: existing?.meals || []
    }, { onConflict: 'user_id,date' })
  }

  function saveSteps() {
    const val = Number(stepsInput)
    if (!val) return
    setSteps(val)
    localStorage.setItem('steps_' + dateKey, String(val))
    const history = JSON.parse(localStorage.getItem('stepsHistory') || '{}')
    history[dateKey] = val
    localStorage.setItem('stepsHistory', JSON.stringify(history))
    setStepsInput(''); setShowStepsInput(false)
  }

  const card = { margin:'0 16px 12px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:16 }
  const lbl = { fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }

  return (
    <div style={{ paddingTop:52, paddingBottom:24, background:'var(--bg)', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ padding:'0 16px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <p style={{ fontSize:13, color:'var(--muted)' }}>{getGreeting()},</p>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-.3px', color:'var(--text)' }}>
            {profile?.name || 'Athlete'} 👋
          </h1>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:8, marginTop:4, border:'1px solid', color:config.color, borderColor:config.color+'40', background:config.color+'15' }}>
            {config.icon} {config.name}
            {profile?.event_name && <span style={{ color:'var(--muted)', fontWeight:400 }}>· {profile.event_name}</span>}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'#1a080015', border:'1px solid #FF5A1F40', borderRadius:12, padding:'7px 12px', fontSize:13, fontWeight:700, color:'#FF5A1F' }}>
            🔥 {sessions.filter(s=>s.rpe>0).length}
            <span style={{ fontSize:10, fontWeight:400, color:'var(--muted)' }}>sessions</span>
          </div>
        </div>
      </div>

      {/* Day Picker */}
      <div style={{ padding:'0 16px', marginBottom:14 }}>
        <DayPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {/* Progress Ring */}
      <div style={{ ...card, display:'flex', alignItems:'center', gap:18 }}>
        <Ring pct={overallPct} color="#FF5A1F">
          <span style={{ fontWeight:700, fontSize:26, color:'var(--text)', lineHeight:1 }}>{overallPct}%</span>
          <span style={{ fontSize:10, color:'var(--muted)', marginTop:2 }}>{isToday ? 'Today' : 'Day'}</span>
        </Ring>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { icon:'🔥', label:'Cal burned', val:`${caloriesBurned} kcal`, pct:burnPct, color:'#FF5A1F' },
            { icon:'💧', label:'Water', val:`${nutrition.water}L / ${waterGoal}L`, pct:waterPct, color:'#3B82F6' },
            { icon:'💪', label:'Workout', val:todaySession ? `${todaySession.type} · RPE ${todaySession.rpe}/10` : 'Rest day', pct:workoutPct, color:'#22C55E' },
          ].map(({ icon, label, val, pct, color }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:9, background:color+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{icon}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:600, color, lineHeight:1 }}>{val}</p>
                <p style={{ fontSize:10, color:'var(--muted)', marginTop:1 }}>{label}</p>
                <div style={{ height:3, background:'var(--border)', borderRadius:2, marginTop:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2, transition:'.3s' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Rating + Encouragement */}
      <div style={{ ...card, background:'var(--card)', borderColor:'#FF5A1F20' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'#FF8C42', marginBottom:5 }}>
              ✨ Pace4 says
            </p>
            <p style={{ fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{ratingMsg}</p>
          </div>
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontSize:28, fontWeight:700, color:dailyRating>=4?'#22C55E':dailyRating>=3?'#FF5A1F':'#EF4444', lineHeight:1 }}>
              {dailyRating}
            </div>
            <div style={{ display:'flex', gap:2, marginTop:4, justifyContent:'center' }}>
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{ fontSize:10, opacity:i<=dailyRating?1:0.2 }}>⭐</span>
              ))}
            </div>
            <p style={{ fontSize:9, color:'var(--muted)', marginTop:3, textTransform:'uppercase', letterSpacing:'.05em' }}>Daily rating</p>
          </div>
        </div>
      </div>

      {/* Nutrition + Water Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'0 16px', marginBottom:12 }}>
        {/* Nutrition */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:14 }}>
          <p style={{ ...lbl, marginBottom:10 }}>Nutrition</p>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <Ring pct={Math.min((nutrition.calories/calorieGoal)*100,100)} size={62} stroke={8} color="#FF5A1F">
              <span style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>{nutrition.calories}</span>
            </Ring>
            <div>
              <p style={{ fontSize:10, color:'var(--muted)' }}>/ {calorieGoal}</p>
              <p style={{ fontSize:11, color:'#FF5A1F', fontWeight:600, marginTop:2 }}>
                {Math.max(0, calorieGoal-nutrition.calories)} left
              </p>
            </div>
          </div>
          {[
            { l:'Protein', v:nutrition.protein, g:proteinGoal, c:'#22C55E' },
            { l:'Carbs', v:0, g:goals.carbs||300, c:'#3B82F6' },
            { l:'Fats', v:0, g:goals.fat||80, c:'#FF8C42' },
          ].map(({ l, v, g, c }) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, marginBottom:4 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:c, flexShrink:0 }} />
              <span style={{ color:'var(--muted)', flex:1 }}>{l}</span>
              <span style={{ color:'var(--text2)' }}>{v}/{g}g</span>
            </div>
          ))}
        </div>

        {/* Water */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:14, display:'flex', flexDirection:'column' }}>
          <p style={{ ...lbl, marginBottom:6 }}>Water 💧</p>
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <Ring pct={waterPct} size={76} stroke={9} color="#3B82F6">
              <span style={{ fontSize:17, fontWeight:700, color:'#3B82F6', lineHeight:1 }}>{nutrition.water}</span>
              <span style={{ fontSize:9, color:'var(--muted)' }}>/ {waterGoal}L</span>
            </Ring>
          </div>
          <p style={{ fontSize:10, color:'var(--muted)', textAlign:'center', margin:'6px 0 10px' }}>
            {waterPct >= 100 ? '✓ Goal reached!' : `${Math.round((waterGoal-nutrition.water)*10)/10}L to go`}
          </p>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => updateWater(-0.25)}
              style={{ flex:1, height:34, background:'var(--card2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
            <button onClick={() => updateWater(0.25)}
              style={{ flex:1, height:34, background:'#3B82F6', border:'none', borderRadius:10, color:'#fff', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <p style={{ fontSize:32, fontWeight:700, color:'#22C55E', lineHeight:1 }}>{steps.toLocaleString()}</p>
            <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>steps · goal {stepGoal.toLocaleString()}</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
            <span style={{ fontSize:28 }}>🏃</span>
            <button onClick={() => setShowStepsInput(s => !s)}
              style={{ fontSize:11, color:'#FF5A1F', border:'1px solid #FF5A1F40', borderRadius:8, padding:'4px 10px', background:'#FF5A1F15', cursor:'pointer' }}>
              {showStepsInput ? 'Cancel' : 'Log steps'}
            </button>
          </div>
        </div>
        <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden', marginBottom:6 }}>
          <div style={{ height:'100%', width:`${stepPct}%`, background:'linear-gradient(90deg,#22C55E,#4ADE80)', borderRadius:4, transition:'.3s' }} />
        </div>
        <p style={{ fontSize:11, color:'var(--muted)' }}>
          {stepPct}% · {Math.max(0, stepGoal-steps).toLocaleString()} to go
        </p>
        {showStepsInput && (
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <input type="number" placeholder="e.g. 8500" value={stepsInput} onChange={e => setStepsInput(e.target.value)}
              style={{ flex:1, background:'var(--input-bg)', border:'1px solid var(--border2)', borderRadius:12, padding:'10px 14px', color:'var(--text)', fontSize:14, outline:'none' }} />
            <button onClick={saveSteps}
              style={{ background:'#FF5A1F', border:'none', borderRadius:12, padding:'10px 18px', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              Save
            </button>
          </div>
        )}
      </div>

      {/* Sleep */}
      <SleepCard userId={session.user.id} selectedDate={selectedDate} />

      {/* Race countdown — only show on today */}
      {isToday && daysLeft !== null && daysLeft > 0 && (
        <div style={{ ...card, background:config.color+'08', borderColor:config.color+'25' }}>
          <p style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:config.color, marginBottom:6 }}>
            {config.icon} {profile?.event_name || 'Race'} · Countdown
          </p>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
            <span style={{ fontSize:52, fontWeight:700, color:config.color, lineHeight:1 }}>{daysLeft}</span>
            <span style={{ color:'var(--subtle)', fontSize:14 }}>
              days · {new Date(profile.race_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
            </span>
          </div>
          <div style={{ height:4, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progressPct}%`, background:config.color, borderRadius:2 }} />
          </div>
          <p style={{ fontSize:11, color:'var(--muted)', marginTop:5 }}>{progressPct}% of prep complete</p>
        </div>
      )}
    </div>
  )
}
