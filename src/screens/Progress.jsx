import { useState, useEffect, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { TrendingUp, Flame, Dumbbell, Share2, Star, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getSarcasticFeedback, getExerciseFeedback } from '../lib/feedback'

const HYROX_STATIONS = [
  'SkiErg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump',
  'Row', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls'
]

function getWeekLabel(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getLast8Weeks() {
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (7 - i) * 7)
    return d
  })
}

function isSameWeek(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const startOf = (d) => {
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    return monday
  }
  return startOf(d1).getTime() === startOf(d2).getTime()
}

function calculateConsistencyScore(sessions, nutritionLogs, stepsHistory) {
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toDateString()
  })

  const sessionDays = new Set(sessions
    .filter(s => last7.includes(new Date(s.date).toDateString()))
    .map(s => new Date(s.date).toDateString())
  ).size

  const nutritionDays = nutritionLogs
    .filter(n => {
      const d = new Date(n.date)
      return last7.includes(d.toDateString())
    }).length

  const stepsDays = Object.entries(stepsHistory || {})
    .filter(([k]) => last7.includes(k)).length

  const score = Math.round(
    (sessionDays / 7) * 40 +
    (nutritionDays / 7) * 35 +
    (stepsDays / 7) * 25
  )
  return Math.min(score, 100)
}

function getScoreLabel(score) {
  if (score >= 85) return { label: 'Crushing it! 🔥', color: '#00E5A0' }
  if (score >= 65) return { label: 'On track 💪', color: '#3B9EFF' }
  if (score >= 45) return { label: 'Building momentum', color: '#A78BFA' }
  return { label: 'Time to level up', color: '#FF6B35' }
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px' }}>
        <p style={{ color: '#666', fontSize: 11 }}>{label}</p>
        <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{payload[0].value}{unit}</p>
      </div>
    )
  }
  return null
}

function ShareCard({ profile, stats, onClose }) {
  const sport = profile?.sport || 'general'
  const sportColors = {
    marathon: '#3B9EFF', hyrox: '#00E5A0', ocr: '#FF6B35',
    cycling: '#A78BFA', bodybuilding: '#A78BFA', crossfit: '#FF6B35',
    triathlon: '#3B9EFF', general: '#00E5A0',
  }
  const color = sportColors[sport] || '#00E5A0'
  const scoreInfo = getScoreLabel(stats.consistencyScore)
  const daysLeft = profile?.race_date
    ? Math.ceil((new Date(profile.race_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: 'My OneFitness Progress',
        text: `${profile?.name} — ${stats.consistencyScore}/100 consistency score this week! ${stats.topImprovement ? `${stats.topImprovement.exercise} up ${stats.topImprovement.pct}%! 💪` : ''} #OneFitness`,
      })
    } else {
      alert('Take a screenshot to share!')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-gradient-to-br from-[#111] to-[#0f0f0f] rounded-3xl p-6 border"
          style={{ borderColor: color + '40' }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#00E5A0] rounded-xl flex items-center justify-center">
                <span className="text-black font-bold text-sm">1F</span>
              </div>
              <span className="text-white font-bold">OneFitness</span>
            </div>
            {daysLeft && daysLeft > 0 && (
              <div className="rounded-xl px-3 py-1" style={{ background: color + '20' }}>
                <span className="text-xs font-medium" style={{ color }}>{daysLeft}d to go 🏁</span>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="mb-4">
            <p className="text-[#666] text-xs uppercase tracking-wider">Weekly Update</p>
            <h2 className="text-white text-2xl font-bold">{profile?.name}</h2>
            <p className="text-[#666] text-xs">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Consistency score — big hero number */}
          <div className="rounded-2xl p-4 mb-4 text-center"
            style={{ background: scoreInfo.color + '15', border: `1px solid ${scoreInfo.color}30` }}>
            <p className="text-[#666] text-xs uppercase tracking-wider mb-1">Weekly Consistency Score</p>
            <p className="font-bold" style={{ fontSize: 52, color: scoreInfo.color, lineHeight: 1 }}>
              {stats.consistencyScore}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: scoreInfo.color }}>
              {scoreInfo.label}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white/5 rounded-2xl p-3">
              <p className="text-[#FF6B35] text-xl font-bold">{stats.avgCalories}</p>
              <p className="text-[#666] text-xs mt-0.5">🔥 Avg kcal/day</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3">
              <p className="text-[#3B9EFF] text-xl font-bold">{stats.avgSteps.toLocaleString()}</p>
              <p className="text-[#666] text-xs mt-0.5">👟 Avg steps/day</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3">
              <p className="text-[#00E5A0] text-xl font-bold">{stats.sessionsThisWeek}</p>
              <p className="text-[#666] text-xs mt-0.5">💪 Sessions this week</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3">
              <p className="text-[#A78BFA] text-xl font-bold">{stats.avgProtein}g</p>
              <p className="text-[#666] text-xs mt-0.5">🥩 Avg protein/day</p>
            </div>
          </div>

          {/* Top improvement */}
          {stats.topImprovement && (
            <div className="rounded-2xl p-3 mb-4"
              style={{ background: color + '10', border: `1px solid ${color}30` }}>
              <p className="text-[#666] text-xs uppercase tracking-wider mb-1">🏆 Top improvement</p>
              <p className="text-white text-sm font-medium">{stats.topImprovement.exercise}</p>
              <p className="text-sm font-bold" style={{ color }}>
                +{stats.topImprovement.pct}% this week
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-[#444] text-xs">onefitness.in</p>
            <p className="text-[#444] text-xs">#OneFitness #Athletics</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleShare}
            className="bg-[#00E5A0] text-black font-medium py-3 rounded-2xl flex items-center justify-center gap-2">
            <Share2 size={16} /> Share
          </button>
          <button onClick={onClose}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium py-3 rounded-2xl">
            Close
          </button>
        </div>
        <p className="text-center text-[#444] text-xs">Screenshot → share on Instagram / WhatsApp</p>
      </div>
    </div>
  )
}

export default function Progress({ session, profile }) {
  const [sessions, setSessions] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [nutritionLogs, setNutritionLogs] = useState([])
  const [newWeight, setNewWeight] = useState('')
  const [activeChart, setActiveChart] = useState('exercise')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [loading, setLoading] = useState(true)
  const [showShareCard, setShowShareCard] = useState(false)
  const sport = profile?.sport || 'general'

  useEffect(() => { fetchAllData() }, [])

  async function fetchAllData() {
    setLoading(true)
    const [sessionsRes, weightRes, nutritionRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', session.user.id).order('date', { ascending: true }),
      supabase.from('weight_logs').select('*').eq('user_id', session.user.id).order('date', { ascending: true }),
      supabase.from('nutrition_logs').select('*').eq('user_id', session.user.id).order('date', { ascending: false }).limit(30),
    ])
    setSessions(sessionsRes.data || [])
    setWeightLogs(weightRes.data || [])
    setNutritionLogs(nutritionRes.data || [])
    setLoading(false)
  }

  async function logWeight() {
    if (!newWeight) return
    const { data } = await supabase
      .from('weight_logs')
      .insert({ user_id: session.user.id, weight: Number(newWeight), date: new Date().toISOString() })
      .select().single()
    if (data) setWeightLogs(prev => [...prev, data])
    setNewWeight('')
  }

  // Extract all exercises logged across all sessions
  const allExercises = sessions.flatMap(s =>
    (s.exercises || []).map(ex => ({ ...ex, date: s.date }))
  )

  // Get unique exercise names
  const exerciseNames = [...new Set(allExercises.map(e => e.name).filter(Boolean))]

  // Build exercise progress chart data
  function getExerciseChartData(exerciseName) {
    const logs = allExercises
      .filter(e => e.name === exerciseName && (e.weight || e.distance || e.duration))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-10)
    return logs.map(e => ({
      date: getWeekLabel(e.date),
      value: Number(e.weight || e.distance || e.duration || 0),
      label: e.weight ? `${e.weight}kg` : e.distance ? `${e.distance}km` : `${e.duration}min`
    }))
  }

  // Calculate improvement for an exercise
  function getImprovement(exerciseName) {
    const data = getExerciseChartData(exerciseName)
    if (data.length < 2) return null
    const first = data[0].value
    const last = data[data.length - 1].value
    if (!first || !last) return null
    const pct = Math.round(((last - first) / first) * 100)
    return { exercise: exerciseName, pct, from: first, to: last }
  }

  // Find top improvement across all exercises
  const improvements = exerciseNames
    .map(name => getImprovement(name))
    .filter(Boolean)
    .sort((a, b) => b.pct - a.pct)

  const topImprovement = improvements[0] || null

  // Weekly volume
  const weeklyData = getLast8Weeks().map(weekDate => {
    const count = sessions.filter(s => isSameWeek(s.date, weekDate)).length
    return { date: getWeekLabel(weekDate), sessions: count }
  })

  // Hyrox PBs
  const hyroxPBs = HYROX_STATIONS.map(station => {
    const allTimes = sessions
      .flatMap(s => s.hyrox_stations || [])
      .filter(st => st.name === station && st.time)
    return { station, pb: allTimes.length > 0 ? allTimes[allTimes.length - 1].time : null, count: allTimes.length }
  }).filter(s => s.pb)

  // Training breakdown
  const typeCount = {}
  sessions.forEach(s => { typeCount[s.type] = (typeCount[s.type] || 0) + 1 })
  const totalSessionsCount = sessions.length || 1

  // Nutrition averages
  const last7Nutrition = nutritionLogs.slice(0, 7)
  const avgCalories = last7Nutrition.length > 0
    ? Math.round(last7Nutrition.reduce((s, d) =>
        s + (d.meals || []).reduce((a, m) => a + Number(m.calories || 0), 0), 0
      ) / last7Nutrition.length)
    : 0
  const avgProtein = last7Nutrition.length > 0
    ? Math.round(last7Nutrition.reduce((s, d) =>
        s + (d.meals || []).reduce((a, m) => a + Number(m.protein || 0), 0), 0
      ) / last7Nutrition.length)
    : 0

  // Steps data
  const stepsHistory = JSON.parse(localStorage.getItem('stepsHistory') || '{}')
  const last7Steps = Object.entries(stepsHistory)
    .filter(([k]) => {
      const d = new Date(k)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return d >= weekAgo
    })
  const avgSteps = last7Steps.length > 0
    ? Math.round(last7Steps.reduce((s, [, v]) => s + v, 0) / last7Steps.length)
    : 0

  // Sessions this week
  const sessionsThisWeek = sessions.filter(s => {
    const d = new Date(s.date)
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    return d >= monday
  }).length

  // Consistency score
  const consistencyScore = calculateConsistencyScore(sessions, nutritionLogs, stepsHistory)
  const scoreInfo = getScoreLabel(consistencyScore)

  // Weight data
  const weightData = weightLogs.slice(-10).map(w => ({
    date: getWeekLabel(w.date),
    weight: w.weight
  }))

  // Total km
  const totalKm = Math.round(sessions.reduce((sum, s) =>
    sum + (s.exercises || []).reduce((a, e) => a + Number(e.distance || 0), 0), 0
  ) * 10) / 10

  // Share stats
  const shareStats = {
    consistencyScore,
    avgCalories,
    avgProtein,
    avgSteps,
    sessionsThisWeek,
    topImprovement,
    totalKm,
    topPBs: hyroxPBs.slice(0, 3),
  }

  const CHART_TABS = [
    { id: 'exercise', label: '📈 Exercise' },
    { id: 'volume', label: '📊 Volume' },
    { id: 'weight', label: '⚖️ Weight' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#666] text-sm">Loading progress...</p>
      </div>
    )
  }

  const exerciseChartData = selectedExercise ? getExerciseChartData(selectedExercise) : []
  const selectedImprovement = selectedExercise ? getImprovement(selectedExercise) : null

  return (
    <div className="p-4 space-y-4">
      {showShareCard && (
        <ShareCard profile={profile} stats={shareStats} onClose={() => setShowShareCard(false)} />
      )}

      <div className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Progress</h1>
          <p className="text-[#666] text-sm">Your numbers over time</p>
        </div>
        <button onClick={() => setShowShareCard(true)}
          className="flex items-center gap-2 bg-[#00E5A0] text-black text-sm font-medium px-4 py-2 rounded-xl">
          <Share2 size={14} /> Share
        </button>
      </div>

      {/* Consistency score card */}
      <div className="rounded-2xl p-4 border"
        style={{ background: scoreInfo.color + '10', borderColor: scoreInfo.color + '30' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#666] text-xs uppercase tracking-wider mb-1">Weekly Consistency Score</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold" style={{ color: scoreInfo.color }}>
                {consistencyScore}
              </span>
              <span className="text-[#666] text-sm mb-1">/100</span>
            </div>
            <p className="text-sm font-medium mt-1" style={{ color: scoreInfo.color }}>
              {scoreInfo.label}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[#666] text-xs">Training: {Math.round((consistencyScore * 0.4))}pts</p>
            <p className="text-[#666] text-xs">Nutrition: {Math.round((consistencyScore * 0.35))}pts</p>
            <p className="text-[#666] text-xs">Steps: {Math.round((consistencyScore * 0.25))}pts</p>
          </div>
        </div>
        <div className="w-full bg-[#2a2a2a] rounded-full h-2 mt-3">
          <div className="h-2 rounded-full transition-all"
            style={{ width: `${consistencyScore}%`, background: scoreInfo.color }} />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <Dumbbell size={16} className="text-[#00E5A0] mb-2" />
          <p className="text-2xl font-bold text-white">{sessionsThisWeek}</p>
          <p className="text-[#666] text-xs mt-1">Sessions this week</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <TrendingUp size={16} className="text-[#A78BFA] mb-2" />
          <p className="text-2xl font-bold text-white">{sessions.length}</p>
          <p className="text-[#666] text-xs mt-1">Total sessions</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <Flame size={16} className="text-[#FF6B35] mb-2" />
          <p className="text-2xl font-bold text-white">{avgCalories}</p>
          <p className="text-[#666] text-xs mt-1">Avg kcal/day (7d)</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <Star size={16} className="text-[#3B9EFF] mb-2" />
          <p className="text-2xl font-bold text-white">{avgSteps.toLocaleString()}</p>
          <p className="text-[#666] text-xs mt-1">Avg steps/day (7d)</p>
        </div>
      </div>

      {/* Top improvements */}
      {improvements.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <p className="text-white font-medium text-sm mb-3">🏆 Exercise improvements</p>
          {improvements.slice(0, 3).map(({ exercise, pct, from, to }) => (
            <div key={exercise} className="flex items-center justify-between py-2 border-b border-[#2a2a2a]">
              <div>
                <p className="text-white text-sm">{exercise}</p>
                <p className="text-[#666] text-xs">{from} → {to}</p>
              </div>
              <span className={`text-sm font-bold ${pct >= 0 ? 'text-[#00E5A0]' : 'text-red-400'}`}>
                {pct >= 0 ? '+' : ''}{pct}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chart tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {CHART_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveChart(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap
              ${activeChart === t.id ? 'bg-[#00E5A0] text-black' : 'bg-[#1a1a1a] text-[#666]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Exercise progress chart */}
      {activeChart === 'exercise' && (
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <p className="text-white font-medium text-sm mb-3">Exercise progress over time</p>

          {exerciseNames.length === 0 ? (
            <p className="text-[#444] text-sm">Log strength sessions with exercises to see progress charts</p>
          ) : (
            <>
              <select value={selectedExercise}
                onChange={e => setSelectedExercise(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none mb-3">
                <option value="">Select an exercise...</option>
                {exerciseNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              {selectedExercise && exerciseChartData.length > 0 ? (
                <>
                  {selectedImprovement && (
                    <div className="flex items-center justify-between mb-3 bg-[#2a2a2a] rounded-xl px-3 py-2">
                      <span className="text-white text-sm">{selectedExercise}</span>
                      <span className={`text-sm font-bold ${selectedImprovement.pct >= 0 ? 'text-[#00E5A0]' : 'text-red-400'}`}>
                        {selectedImprovement.pct >= 0 ? '+' : ''}{selectedImprovement.pct}% overall
                      </span>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={exerciseChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false}
                        domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip content={<CustomTooltip unit="" />} />
                      <Line type="monotone" dataKey="value" stroke="#00E5A0" strokeWidth={2}
                        dot={{ fill: '#00E5A0', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : selectedExercise ? (
                <p className="text-[#444] text-sm">Not enough data yet — log more sessions with this exercise!</p>
              ) : null}
            </>
          )}
        </div>
      )}

      {(() => {
      const fb = getExerciseFeedback(
      selectedExercise,
      selectedImprovement?.pct || 0,
      exerciseChartData.length
      )
      return (
      <div className="mt-3 p-3 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a]">
        <p className="text-xs leading-relaxed" style={{ color: fb.color }}>{fb.msg}</p>
      </div>
      )
      })()}

      {/* Volume chart */}
      {activeChart === 'volume' && (
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <p className="text-white font-medium text-sm mb-4">Weekly sessions</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip unit=" sessions" />} />
              <Bar dataKey="sessions" fill="#A78BFA" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Training breakdown */}
          <div className="mt-4 space-y-2">
            {Object.entries(typeCount)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const pct = Math.round((count / totalSessionsCount) * 100)
                const colors = {
                  Strength: '#A78BFA', Running: '#3B9EFF', HIIT: '#FF6B35',
                  Hyrox: '#00E5A0', Cycling: '#A78BFA', Swimming: '#3B9EFF',
                  'CrossFit WOD': '#FF6B35', Calisthenics: '#A78BFA',
                  'OCR Training': '#FF6B35', 'Sport Practice': '#3B9EFF',
                  Recovery: '#444', Rest: '#444',
                }
                const color = colors[type] || '#666'
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color }}>{type}</span>
                      <span className="text-[#666]">{count} · {pct}%</span>
                    </div>
                    <div className="w-full bg-[#2a2a2a] rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Weight chart */}
      {activeChart === 'weight' && (
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-medium text-sm">Weight trend (kg)</p>
            <div className="flex gap-2">
              <input type="number" placeholder="kg" value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                className="w-16 bg-[#2a2a2a] text-white text-sm rounded-lg px-2 py-1 outline-none placeholder-[#444]" />
              <button onClick={logWeight}
                className="bg-[#00E5A0] text-black text-xs font-medium px-3 py-1 rounded-lg">Log</button>
            </div>
          </div>
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false}
                  domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip content={<CustomTooltip unit="kg" />} />
                <Line type="monotone" dataKey="weight" stroke="#00E5A0" strokeWidth={2}
                  dot={{ fill: '#00E5A0', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-[#444] text-sm">Log your weight to see the trend</p>
            </div>
          )}
        </div>
      )}

      {/* Hyrox PBs — only show for relevant sports */}
      {['hyrox', 'ocr', 'crossfit', 'general'].includes(sport) && hyroxPBs.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <p className="text-white font-medium text-sm mb-3">⚡ Station PBs</p>
          {hyroxPBs.map(({ station, pb, count }) => (
            <div key={station} className="flex items-center justify-between py-2 border-b border-[#2a2a2a]">
              <span className="text-white text-sm">{station}</span>
              <div className="flex items-center gap-3">
                <span className="text-[#666] text-xs">{count}x logged</span>
                <span className="text-[#00E5A0] text-sm font-medium">{pb}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}