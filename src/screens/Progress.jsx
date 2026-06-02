import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Share2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ── HELPERS ──────────────────────────────────────────────────────
function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d
  })
}

function getLast8Weeks() {
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (7 - i) * 7); return d
  })
}

function shortDay(date) {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][((new Date(date).getDay() + 6) % 7)]
}

function dayLabel(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function isThisWeek(date) {
  const d = new Date(date)
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 7)
  return d >= monday && d < sunday
}

function isSameWeek(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const startOf = d => {
    const m = new Date(d)
    m.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    m.setHours(0, 0, 0, 0)
    return m.getTime()
  }
  return startOf(d1) === startOf(d2)
}

function calc1RM(reps, weight) {
  if (!reps || !weight) return 0
  return Math.round(Number(weight) * (1 + Number(reps) / 30))
}

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '8px 14px' }}>
        <p style={{ color: '#555', fontSize: 11, marginBottom: 2 }}>{label}</p>
        <p style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{payload[0].value}{unit}</p>
      </div>
    )
  }
  return null
}

// ── SHARE MODAL ──────────────────────────────────────────────────
function ShareModal({ profile, stats, sessions, onClose }) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const daysLeft = profile?.race_date
    ? Math.ceil((new Date(profile.race_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  const todaySession = sessions.find(s =>
    new Date(s.date).toDateString() === new Date().toDateString()
  )

  const todayLifts = todaySession
    ? (todaySession.exercises || [])
        .filter(e => e.fieldType === 'strength')
        .map(ex => ({ name: ex.name, best: Math.max(...(ex.sets || []).map(s => Number(s.weight || 0))) }))
        .filter(e => e.best > 0).slice(0, 3)
    : []

  const scoreColor = stats.consistencyScore >= 80 ? '#22C55E'
    : stats.consistencyScore >= 60 ? '#FF5A1F' : '#EF4444'

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: 'My Pace4 Progress',
        text: `${profile?.name} — ${stats.consistencyScore}/100 consistency this week! #Pace4 #Athletics`,
        url: 'https://www.pace4.in',
      })
    } else {
      alert('Screenshot this card and share!')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}
      onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}
        onClick={e => e.stopPropagation()}>

        {/* Card */}
        <div style={{ background: 'linear-gradient(160deg,#0a0a0a,#141414)', border: '1px solid #FF5A1F25', borderRadius: 24, padding: 20 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>P4</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Pace4</p>
                <p style={{ fontSize: 9, color: '#FF5A1F', textTransform: 'uppercase', letterSpacing: '.06em' }}>pace4.in</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#555' }}>{today}</p>
              {daysLeft && daysLeft > 0 && (
                <p style={{ fontSize: 11, color: '#FF5A1F', fontWeight: 600, marginTop: 2 }}>🏁 {daysLeft}d to race</p>
              )}
            </div>
          </div>

          {/* Athlete */}
          <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{profile?.name}</p>
          <p style={{ fontSize: 12, color: '#FF5A1F', marginBottom: 16 }}>{profile?.event_name || 'Athlete'}</p>

          {/* Today's session */}
          <div style={{ background: '#ffffff08', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
            <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>💪 Today's Training</p>
            {todaySession ? (
              <>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{todaySession.type}</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {todaySession.duration && <span style={{ fontSize: 11, color: '#888' }}>⏱ {todaySession.duration}min</span>}
                  {todaySession.rpe && <span style={{ fontSize: 11, color: '#888' }}>RPE {todaySession.rpe}/10</span>}
                  <span style={{ fontSize: 11, color: '#888' }}>{(todaySession.exercises || []).length} exercises</span>
                </div>
                {todayLifts.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {todayLifts.map(ex => (
                      <span key={ex.name} style={{ fontSize: 11, color: '#FF5A1F', background: '#FF5A1F15', padding: '3px 8px', borderRadius: 6 }}>
                        {ex.name} {ex.best}kg
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: 13, color: '#555' }}>Rest day</p>
            )}
          </div>

          {/* Daily stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Calories', val: stats.todayCalories, unit: 'kcal', color: '#FF5A1F', icon: '🔥' },
              { label: 'Protein', val: `${stats.todayProtein}g`, color: '#22C55E', icon: '🥩' },
              { label: 'Steps', val: (stats.todaySteps || 0).toLocaleString(), color: '#3B82F6', icon: '👟' },
              { label: 'Water', val: `${stats.todayWater || 0}L`, color: '#3B82F6', icon: '💧' },
            ].map(({ label, val, color, icon }) => (
              <div key={label} style={{ background: '#ffffff06', borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{val}</p>
                <p style={{ fontSize: 11, color: '#444', marginTop: 3 }}>{icon} {label}</p>
              </div>
            ))}
          </div>

          {/* Consistency */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff06', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>Weekly Consistency</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                {stats.consistencyScore}<span style={{ fontSize: 14, fontWeight: 400, color: '#444' }}>/100</span>
              </p>
            </div>
            {stats.topImprovement && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>🏆 Top lift</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{stats.topImprovement.exercise}</p>
                <p style={{ fontSize: 12, color: '#22C55E', fontWeight: 700 }}>+{stats.topImprovement.pct}%</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 10, color: '#2a2a2a' }}>pace4.in</p>
            <p style={{ fontSize: 10, color: '#2a2a2a' }}>#Pace4 #IndianAthlete</p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={handleShare}
            style={{ background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 14, padding: 14, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Share2 size={15} /> Share
          </button>
          <button onClick={onClose}
            style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: 14, color: '#666', fontSize: 14, cursor: 'pointer' }}>
            Close
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#2a2a2a' }}>Screenshot → share on Instagram / WhatsApp</p>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
export default function Progress({ session, profile }) {
  const [sessions, setSessions] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [nutritionLogs, setNutritionLogs] = useState([])
  const [todayLog, setTodayLog] = useState({ calories: 0, protein: 0, water: 0 })
  const [loading, setLoading] = useState(true)
  const [newWeight, setNewWeight] = useState('')
  const [activeChart, setActiveChart] = useState('calories')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const todayDate = new Date().toISOString().split('T')[0]
    const [sRes, wRes, nRes, todayRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', session.user.id).order('date', { ascending: true }),
      supabase.from('weight_logs').select('*').eq('user_id', session.user.id).order('date', { ascending: true }),
      supabase.from('nutrition_logs').select('*').eq('user_id', session.user.id).order('date', { ascending: false }).limit(30),
      supabase.from('nutrition_logs').select('*').eq('user_id', session.user.id).eq('date', todayDate).single(),
    ])
    setSessions(sRes.data || [])
    setWeightLogs(wRes.data || [])
    setNutritionLogs(nRes.data || [])
    if (todayRes.data) {
      const meals = todayRes.data.meals || []
      setTodayLog({
        calories: Math.round(meals.reduce((s, m) => s + Number(m.calories || 0), 0)),
        protein: Math.round(meals.reduce((s, m) => s + Number(m.protein || 0), 0)),
        water: todayRes.data.water || 0,
      })
    }
    setLoading(false)
  }

  async function logWeight() {
    if (!newWeight) return
    const { data } = await supabase.from('weight_logs')
      .insert({ user_id: session.user.id, weight: Number(newWeight), date: new Date().toISOString() })
      .select().single()
    if (data) setWeightLogs(p => [...p, data])
    setNewWeight('')
  }

  // ── COMPUTED DATA ──────────────────────────────────────────────
  const last7Days = getLast7Days()

  // This week sessions
  const thisWeekSessions = sessions.filter(s => isThisWeek(s.date))

  // Calories by day (last 7)
  const caloriesByDay = last7Days.map(date => {
    const n = nutritionLogs.find(l => new Date(l.date).toDateString() === date.toDateString())
    const cals = n ? Math.round((n.meals || []).reduce((s, m) => s + Number(m.calories || 0), 0)) : 0
    return { date: shortDay(date), calories: cals }
  })

  // Weekly volume
  const weeklyVolume = getLast8Weeks().map(weekDate => ({
    date: dayLabel(weekDate),
    sessions: sessions.filter(s => isSameWeek(s.date, weekDate)).length,
  }))

  // Strength exercises — all 1RM logs
  const strengthLogs = sessions.flatMap(s =>
    (s.exercises || []).filter(e => e.fieldType === 'strength').map(ex => ({
      name: ex.name,
      date: s.date,
      bestSet: (ex.sets || []).reduce((best, set) => {
        const rm = calc1RM(set.reps, set.weight)
        return rm > best ? rm : best
      }, 0)
    }))
  )

  const exerciseNames = [...new Set(strengthLogs.map(e => e.name))]

  const strengthPRs = exerciseNames.map(name => {
    const logs = strengthLogs.filter(e => e.name === name).sort((a, b) => new Date(a.date) - new Date(b.date))
    const latest = logs[logs.length - 1]?.bestSet || 0
    const prev = logs.length > 1 ? logs[logs.length - 2]?.bestSet : null
    const delta = prev ? Number(((latest - prev) / prev * 100).toFixed(1)) : null
    return { name, rm: latest, delta, count: logs.length }
  }).filter(e => e.rm > 0).sort((a, b) => b.rm - a.rm)

  // Selected exercise chart
  const exerciseChartData = selectedExercise
    ? strengthLogs.filter(e => e.name === selectedExercise)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-10).map(e => ({ date: dayLabel(e.date), value: e.bestSet }))
    : []

  const selectedImprovement = (() => {
    if (!selectedExercise || exerciseChartData.length < 2) return null
    const first = exerciseChartData[0].value
    const last = exerciseChartData[exerciseChartData.length - 1].value
    if (!first) return null
    return { pct: Math.round((last - first) / first * 100), from: first, to: last }
  })()

  // Nutrition averages
  const last7Nutrition = nutritionLogs.slice(0, 7)
  const avgCalories = last7Nutrition.length > 0
    ? Math.round(last7Nutrition.reduce((s, d) => s + (d.meals || []).reduce((a, m) => a + Number(m.calories || 0), 0), 0) / last7Nutrition.length)
    : 0
  const avgProtein = last7Nutrition.length > 0
    ? Math.round(last7Nutrition.reduce((s, d) => s + (d.meals || []).reduce((a, m) => a + Number(m.protein || 0), 0), 0) / last7Nutrition.length)
    : 0

  // Steps
  const stepsHistory = (() => { try { return JSON.parse(localStorage.getItem('stepsHistory') || '{}') } catch { return {} } })()
  const last7StepsVals = last7Days.map(d => stepsHistory[d.toDateString()] || 0)
  const avgSteps = Math.round(last7StepsVals.reduce((a, v) => a + v, 0) / 7)
  const todaySteps = last7StepsVals[6] || 0

  // Consistency score
  const sessionDays = new Set(thisWeekSessions.map(s => new Date(s.date).toDateString())).size
  const nutritionDaysThisWeek = last7Nutrition.filter(n => isThisWeek(n.date)).length
  const stepsDays = last7StepsVals.filter(v => v > 0).length
  const consistencyScore = Math.min(
    Math.round((sessionDays / 7) * 40 + (nutritionDaysThisWeek / 7) * 35 + (stepsDays / 7) * 25),
    100
  )

  // Top improvement
  const topImprovement = (() => {
    const improvements = exerciseNames.map(name => {
      const all = strengthLogs.filter(e => e.name === name).sort((a, b) => new Date(a.date) - new Date(b.date))
      const thisWeek = all.filter(e => isThisWeek(e.date))
      if (!thisWeek.length || all.length < 2) return null
      const weekBest = Math.max(...thisWeek.map(e => e.bestSet))
      const prevBest = all.filter(e => !isThisWeek(e.date)).slice(-1)[0]?.bestSet
      if (!prevBest) return null
      const pct = Math.round((weekBest - prevBest) / prevBest * 100)
      return pct > 0 ? { exercise: name, pct } : null
    }).filter(Boolean)
    return improvements.sort((a, b) => b.pct - a.pct)[0] || null
  })()

  // Weight
  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : profile?.weight
  const weightData = weightLogs.slice(-10).map(w => ({ date: dayLabel(w.date), weight: w.weight }))

  // Training breakdown
  const typeCount = {}
  sessions.forEach(s => { typeCount[s.type] = (typeCount[s.type] || 0) + 1 })
  const totalCount = sessions.length || 1

  const scoreColor = consistencyScore >= 80 ? '#22C55E' : consistencyScore >= 60 ? '#FF5A1F' : '#EF4444'
  const scoreLabel = consistencyScore >= 80 ? 'Crushing it 🔥' : consistencyScore >= 60 ? 'On track 💪' : consistencyScore >= 40 ? 'Building' : 'Level up'

  const shareStats = {
    consistencyScore, avgCalories, avgProtein, avgSteps,
    sessionsThisWeek: thisWeekSessions.length,
    topImprovement,
    todayCalories: todayLog.calories,
    todayProtein: todayLog.protein,
    todaySteps,
    todayWater: todayLog.water,
  }

  const inp = { background: '#0f0f0f', border: '1px solid #252525', borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }

  if (loading) return (
    <div style={{ paddingTop: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', background: '#080808' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#FF5A1F', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: '#080808', minHeight: '100vh' }}>

      {showShare && (
        <ShareModal
          profile={profile}
          stats={shareStats}
          sessions={sessions}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Header */}
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.5px', color: '#fff' }}>Progress</h1>
          <p style={{ fontSize: 13, color: '#444', marginTop: 3 }}>Your numbers over time</p>
        </div>
        <button onClick={() => setShowShare(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FF5A1F', border: 'none', borderRadius: 12, padding: '9px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Share2 size={14} /> Share
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '0 20px', marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[{ id: 'overview', label: 'Overview' }, { id: 'strength', label: 'Strength' }, { id: 'charts', label: 'Charts' }, { id: 'body', label: 'Body' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: '.15s', background: activeTab === tab.id ? '#FF5A1F' : 'transparent', borderColor: activeTab === tab.id ? '#FF5A1F' : '#1e1e1e', color: activeTab === tab.id ? '#fff' : '#555' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <>
          {/* Weekly stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: '#0a0a0a', border: '1px solid #141414', borderRadius: 18, margin: '0 20px 14px', overflow: 'hidden' }}>
            {[
              { label: 'Workouts', val: thisWeekSessions.length, sub: `/${profile?.training_days_per_week?.split(' ')[0] || 5} planned`, color: '#FF5A1F' },
              { label: 'Calories', val: avgCalories || 0, sub: 'avg/day', color: '#EF4444' },
              { label: 'Steps', val: avgSteps >= 1000 ? `${Math.round(avgSteps / 100) / 10}K` : avgSteps, sub: 'avg/day', color: '#22C55E' },
              { label: 'Total', val: sessions.length, sub: 'sessions', color: '#A855F7' },
            ].map(({ label, val, sub, color }, i, arr) => (
              <div key={label} style={{ padding: '14px 8px', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid #141414' : 'none' }}>
                <p style={{ fontSize: 17, fontWeight: 700, color }}>{val}</p>
                <p style={{ fontSize: 9, color: '#333', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
                <div style={{ height: 2, background: '#111', borderRadius: 1, margin: '6px auto 0', width: '70%', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: color, width: '60%', borderRadius: 1 }} />
                </div>
                <p style={{ fontSize: 9, color: '#2a2a2a', marginTop: 4 }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Consistency score */}
          <div style={{ margin: '0 20px 14px', background: '#0a0a0a', border: `1px solid ${scoreColor}20`, borderRadius: 18, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: 4 }}>Weekly Consistency Score</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 48, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{consistencyScore}</span>
                  <span style={{ fontSize: 14, color: '#333' }}>/100</span>
                </div>
                <p style={{ fontSize: 13, color: scoreColor, fontWeight: 600, marginTop: 2 }}>{scoreLabel}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: '#333' }}>Training {Math.round(sessionDays / 7 * 100)}%</p>
                <p style={{ fontSize: 11, color: '#333', marginTop: 2 }}>Nutrition {Math.round(nutritionDaysThisWeek / 7 * 100)}%</p>
                <p style={{ fontSize: 11, color: '#333', marginTop: 2 }}>Steps {Math.round(stepsDays / 7 * 100)}%</p>
              </div>
            </div>
            <div style={{ height: 6, background: '#111', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${consistencyScore}%`, background: `linear-gradient(90deg,${scoreColor},${scoreColor}aa)`, borderRadius: 3, transition: '.5s' }} />
            </div>
          </div>

          {/* Calories chart */}
          <div style={{ margin: '0 20px 14px', background: '#0a0a0a', border: '1px solid #141414', borderRadius: 18, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Calories Consumed</p>
                <p style={{ fontSize: 11, color: '#444', marginTop: 2 }}>Last 7 days</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#FF5A1F' }}>{avgCalories}</p>
                <p style={{ fontSize: 11, color: '#444' }}>avg kcal/day</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={caloriesByDay} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip unit=" kcal" />} />
                <Bar dataKey="calories" fill="#FF5A1F" radius={[6, 6, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 3 metric rings */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '0 20px', marginBottom: 14 }}>
            {[
              { label: 'Consistency', val: `${consistencyScore}%`, color: '#FF5A1F', pct: consistencyScore, sub: `${thisWeekSessions.length} sessions` },
              { label: 'Streak', val: `${sessions.length}`, color: '#F59E0B', pct: Math.min(sessions.length * 5, 100), sub: 'total logged', icon: '🔥' },
              { label: 'Avg Protein', val: `${avgProtein}g`, color: '#A855F7', pct: Math.min((avgProtein / (profile?.goals?.protein || 180)) * 100, 100), sub: 'daily avg' },
            ].map(({ label, val, color, pct, sub, icon }) => {
              const r = 24; const circ = 2 * Math.PI * r; const dash = (pct / 100) * circ
              return (
                <div key={label} style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 8px' }}>
                    <svg width={56} height={56} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={28} cy={28} r={r} fill="none" stroke="#111" strokeWidth={7} />
                      <circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={7} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: icon ? 20 : 12, fontWeight: 700, color: '#fff' }}>
                      {icon || val}
                    </div>
                  </div>
                  {icon && <p style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 2 }}>{val}</p>}
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#ccc' }}>{label}</p>
                  <p style={{ fontSize: 10, color: '#333', marginTop: 2 }}>{sub}</p>
                </div>
              )
            })}
          </div>

          {/* Training breakdown */}
          <div style={{ margin: '0 20px 14px', background: '#0a0a0a', border: '1px solid #141414', borderRadius: 18, padding: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Training Breakdown</p>
            {Object.keys(typeCount).length === 0
              ? <p style={{ color: '#333', fontSize: 13 }}>No sessions logged yet</p>
              : Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const pct = Math.round((count / totalCount) * 100)
                const colors = { 'Strength': '#FF5A1F', 'Conditioning': '#EF4444', 'Skills': '#3B82F6', 'Mobility': '#A855F7', 'Mixed': '#22C55E' }
                const color = colors[type] || '#666'
                return (
                  <div key={type} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color, fontWeight: 600 }}>{type}</span>
                      <span style={{ fontSize: 12, color: '#444' }}>{count} sessions · {pct}%</span>
                    </div>
                    <div style={{ height: 6, background: '#111', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </>
      )}

      {/* ── STRENGTH TAB ── */}
      {activeTab === 'strength' && (
        <>
          <div style={{ margin: '0 20px 14px', background: '#0a0a0a', border: '1px solid #141414', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Strength Progress</p>
              <p style={{ fontSize: 11, color: '#444' }}>{strengthPRs.length} exercises tracked</p>
            </div>
            {strengthPRs.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>🏋️</p>
                <p style={{ color: '#333', fontSize: 13 }}>Log strength sessions to track 1RM progress</p>
              </div>
            ) : strengthPRs.map(({ name, rm, delta, count }) => (
              <div key={name}
                style={{ padding: '14px 16px', borderBottom: '1px solid #0d0d0d', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: selectedExercise === name ? '#FF5A1F10' : 'transparent' }}
                onClick={() => setSelectedExercise(selectedExercise === name ? '' : name)}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FF5A1F15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💪</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                  <p style={{ fontSize: 11, color: '#444', marginTop: 2 }}>Est. 1RM · {count}x logged</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#FF5A1F' }}>{rm} kg</p>
                  {delta !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 2 }}>
                      {delta > 0 ? <TrendingUp size={11} color="#22C55E" /> : delta < 0 ? <TrendingDown size={11} color="#EF4444" /> : <Minus size={11} color="#444" />}
                      <span style={{ fontSize: 11, color: delta > 0 ? '#22C55E' : delta < 0 ? '#EF4444' : '#444', fontWeight: 600 }}>
                        {delta > 0 ? '+' : ''}{delta}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedExercise && exerciseChartData.length > 0 && (
            <div style={{ margin: '0 20px 14px', background: '#0a0a0a', border: '1px solid #141414', borderRadius: 18, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{selectedExercise}</p>
                  <p style={{ fontSize: 11, color: '#444', marginTop: 2 }}>Estimated 1RM over time</p>
                </div>
                {selectedImprovement && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: selectedImprovement.pct >= 0 ? '#22C55E' : '#EF4444' }}>
                      {selectedImprovement.pct >= 0 ? '+' : ''}{selectedImprovement.pct}%
                    </p>
                    <p style={{ fontSize: 11, color: '#444' }}>{selectedImprovement.from}→{selectedImprovement.to}kg</p>
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={exerciseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} width={35} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip content={<CustomTooltip unit="kg" />} />
                  <Line type="monotone" dataKey="value" stroke="#FF5A1F" strokeWidth={2.5} dot={{ fill: '#FF5A1F', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#111', borderRadius: 12 }}>
                <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
                  {!selectedImprovement ? 'Log more sessions to see trends.'
                    : selectedImprovement.pct > 20 ? `🔥 ${selectedImprovement.pct}% improvement. That's actual progress.`
                    : selectedImprovement.pct > 5 ? `📈 ${selectedImprovement.pct}% progress. Solid. Add weight next session.`
                    : selectedImprovement.pct > 0 ? `${selectedImprovement.pct}% improvement. Push harder.`
                    : selectedImprovement.pct === 0 ? 'Same weight, same reps. Progressive overload is a thing.'
                    : `Getting weaker at ${selectedExercise}. Either injured or not trying hard enough.`}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── CHARTS TAB ── */}
      {activeTab === 'charts' && (
        <>
          <div style={{ display: 'flex', gap: 6, padding: '0 20px', marginBottom: 14 }}>
            {[{ id: 'calories', label: '📊 Calories' }, { id: 'volume', label: '💪 Volume' }, { id: 'weight', label: '⚖️ Weight' }].map(c => (
              <button key={c.id} onClick={() => setActiveChart(c.id)}
                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: activeChart === c.id ? '#FF5A1F' : 'transparent', borderColor: activeChart === c.id ? '#FF5A1F' : '#1e1e1e', color: activeChart === c.id ? '#fff' : '#555' }}>
                {c.label}
              </button>
            ))}
          </div>

          {activeChart === 'calories' && (
            <div style={{ margin: '0 20px 14px', background: '#0a0a0a', border: '1px solid #141414', borderRadius: 18, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div><p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Calories (7 days)</p><p style={{ fontSize: 11, color: '#444', marginTop: 2 }}>Daily intake</p></div>
                <div style={{ textAlign: 'right' }}><p style={{ fontSize: 18, fontWeight: 700, color: '#FF5A1F' }}>{avgCalories}</p><p style={{ fontSize: 11, color: '#444' }}>avg/day</p></div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={caloriesByDay} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip content={<CustomTooltip unit=" kcal" />} />
                  <Bar dataKey="calories" fill="#FF5A1F" radius={[6, 6, 0, 0]} opacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'volume' && (
            <div style={{ margin: '0 20px 14px', background: '#0a0a0a', border: '1px solid #141414', borderRadius: 18, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div><p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Weekly Sessions</p><p style={{ fontSize: 11, color: '#444', marginTop: 2 }}>Last 8 weeks</p></div>
                <div style={{ textAlign: 'right' }}><p style={{ fontSize: 18, fontWeight: 700, color: '#A855F7' }}>{sessions.length}</p><p style={{ fontSize: 11, color: '#444' }}>total</p></div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyVolume} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={20} />
                  <Tooltip content={<CustomTooltip unit=" sessions" />} />
                  <Bar dataKey="sessions" fill="#A855F7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'weight' && (
            <div style={{ margin: '0 20px 14px', background: '#0a0a0a', border: '1px solid #141414', borderRadius: 18, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div><p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Weight Trend</p><p style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{weightLogs.length} entries</p></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" placeholder="kg" value={newWeight} onChange={e => setNewWeight(e.target.value)}
                    style={{ width: 60, background: '#111', border: '1px solid #222', borderRadius: 9, padding: '6px 8px', color: '#fff', fontSize: 13, outline: 'none', textAlign: 'center' }} />
                  <button onClick={logWeight}
                    style={{ background: '#FF5A1F', border: 'none', borderRadius: 9, padding: '0 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Log</button>
                </div>
              </div>
              {weightData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} width={35} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip content={<CustomTooltip unit="kg" />} />
                    <Line type="monotone" dataKey="weight" stroke="#22C55E" strokeWidth={2.5} dot={{ fill: '#22C55E', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#2a2a2a', fontSize: 13 }}>Log your weight to see the trend</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── BODY TAB ── */}
      {activeTab === 'body' && (
        <>
          <div style={{ margin: '0 20px 14px', background: '#0a0a0a', border: '1px solid #141414', borderRadius: 18, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Weight Journey</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" placeholder="kg" value={newWeight} onChange={e => setNewWeight(e.target.value)}
                  style={{ width: 60, background: '#111', border: '1px solid #222', borderRadius: 9, padding: '6px 8px', color: '#fff', fontSize: 13, outline: 'none', textAlign: 'center' }} />
                <button onClick={logWeight}
                  style={{ background: '#FF5A1F', border: 'none', borderRadius: 9, padding: '0 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Log</button>
              </div>
            </div>

            {profile?.weight && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                {[
                  { label: 'Start', val: `${profile.weight}kg`, color: '#444' },
                  { label: 'Now', val: `${currentWeight || profile.weight}kg`, color: '#FF5A1F' },
                  { label: 'Goal', val: profile.goal_weight ? `${profile.goal_weight}kg` : '—', color: '#444' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#333', marginBottom: 3 }}>{label}</p>
                    <p style={{ fontSize: 17, fontWeight: 700, color }}>{val}</p>
                  </div>
                ))}
              </div>
            )}

            {profile?.weight && profile?.goal_weight && (
              <>
                <div style={{ height: 6, background: '#111', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', background: '#FF5A1F', borderRadius: 3, width: `${Math.min(Math.max(((profile.weight - (currentWeight || profile.weight)) / (profile.weight - profile.goal_weight)) * 100, 0), 100)}%`, transition: '.3s' }} />
                </div>
                <p style={{ fontSize: 11, color: '#333' }}>
                  {currentWeight && currentWeight < profile.weight
                    ? `${(profile.weight - currentWeight).toFixed(1)}kg lost so far`
                    : 'Start logging weight to track progress'}
                </p>
              </>
            )}
          </div>

          {weightData.length > 0 && (
            <div style={{ margin: '0 20px 14px', background: '#0a0a0a', border: '1px solid #141414', borderRadius: 18, padding: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Weight trend</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#333', fontSize: 10 }} axisLine={false} tickLine={false} width={35} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip content={<CustomTooltip unit="kg" />} />
                  <Line type="monotone" dataKey="weight" stroke="#22C55E" strokeWidth={2.5} dot={{ fill: '#22C55E', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 20px' }}>
            {[
              { label: 'Total sessions', val: sessions.length, color: '#FF5A1F', icon: '💪' },
              { label: 'This week', val: thisWeekSessions.length, color: '#22C55E', icon: '📅' },
              { label: 'Avg calories', val: `${avgCalories} kcal`, color: '#EF4444', icon: '🔥' },
              { label: 'Avg protein', val: `${avgProtein}g`, color: '#A855F7', icon: '🥩' },
            ].map(({ label, val, color, icon }) => (
              <div key={label} style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 16, padding: '14px 16px' }}>
                <p style={{ fontSize: 22, marginBottom: 8 }}>{icon}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color }}>{val}</p>
                <p style={{ fontSize: 11, color: '#333', marginTop: 3 }}>{label}</p>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  )
}