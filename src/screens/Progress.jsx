import { useState, useEffect, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { TrendingUp, Weight, Flame, Dumbbell, Share2, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'

const HYROX_STATIONS = [
  'SkiErg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump',
  'Row', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls'
]

function getWeekLabel(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getLast8Weeks() {
  const weeks = []
  const today = new Date()
  for (let i = 7; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i * 7)
    weeks.push(d)
  }
  return weeks
}

function isSameWeek(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const startOf = (d) => {
    const day = d.getDay()
    const diff = (day + 6) % 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  }
  return startOf(d1).getTime() === startOf(d2).getTime()
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
  const config = {
    marathon: { icon: '🏃', color: '#3B9EFF', statLabel: 'km logged', statKey: 'totalKm' },
    hyrox: { icon: '⚡', color: '#00E5A0', statLabel: 'Station PBs', statKey: 'topPBs' },
    ocr: { icon: '🏔️', color: '#FF6B35', statLabel: 'Obstacles', statKey: 'topPBs' },
    cycling: { icon: '🚴', color: '#A78BFA', statLabel: 'km logged', statKey: 'totalKm' },
    bodybuilding: { icon: '🏋️', color: '#A78BFA', statLabel: 'Sessions', statKey: null },
    crossfit: { icon: '🏇', color: '#FF6B35', statLabel: 'WODs done', statKey: null },
    triathlon: { icon: '🏊', color: '#3B9EFF', statLabel: 'Sessions', statKey: null },
    general: { icon: '🎯', color: '#00E5A0', statLabel: 'Sessions', statKey: null },
  }[sport] || { icon: '🎯', color: '#00E5A0' }

  const daysLeft = profile?.race_date
    ? Math.ceil((new Date(profile.race_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: 'My OneFitness Progress',
        text: `${profile?.name}'s training update — ${stats.totalSessions} sessions, crushing ${profile?.event_name || 'my goals'} prep! 💪 #OneFitness`,
      })
    } else {
      alert('Take a screenshot to share!')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-gradient-to-br from-[#0d2d1f] to-[#0f0f0f] rounded-3xl p-6 border"
          style={{ borderColor: config.color + '40' }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#00E5A0] rounded-xl flex items-center justify-center">
                <span className="text-black font-bold text-sm">1F</span>
              </div>
              <span className="text-white font-bold text-sm">OneFitness</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{config.icon}</span>
              {daysLeft && (
                <div className="rounded-xl px-3 py-1" style={{ background: config.color + '20', border: `1px solid ${config.color}40` }}>
                  <span className="text-xs font-medium" style={{ color: config.color }}>{daysLeft}d to go 🏁</span>
                </div>
              )}
            </div>
          </div>

          {/* Name & sport */}
          <div className="mb-5">
            <p className="text-[#666] text-xs uppercase tracking-wider">Training Update</p>
            <h2 className="text-white text-2xl font-bold">{profile?.name}</h2>
            {profile?.event_name && (
              <p className="text-xs mt-1" style={{ color: config.color }}>{profile.event_name}</p>
            )}
            <p className="text-[#666] text-xs mt-1">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-2xl p-3">
              <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
              <p className="text-[#666] text-xs mt-1">💪 Sessions logged</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3">
              <p className="text-3xl font-bold" style={{ color: config.color }}>
                {stats.weightLost > 0 ? `-${stats.weightLost}kg` : `${stats.currentWeight}kg`}
              </p>
              <p className="text-[#666] text-xs mt-1">
                ⚖️ {stats.weightLost > 0 ? 'Weight lost' : 'Current weight'}
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3">
              <p className="text-3xl font-bold text-[#FF6B35]">{stats.avgCalories}</p>
              <p className="text-[#666] text-xs mt-1">🔥 Avg kcal/day</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3">
              <p className="text-3xl font-bold text-[#A78BFA]">{stats.avgProtein}g</p>
              <p className="text-[#666] text-xs mt-1">🥩 Avg protein/day</p>
            </div>
          </div>

          {/* Sport specific stats */}
          {['hyrox', 'ocr'].includes(sport) && stats.topPBs && stats.topPBs.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-3 mb-4">
              <p className="text-[#666] text-xs uppercase tracking-wider mb-2">🏆 Station PBs</p>
              {stats.topPBs.map((pb, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="text-white text-xs">{pb.station}</span>
                  <span className="text-xs font-medium" style={{ color: config.color }}>{pb.time}</span>
                </div>
              ))}
            </div>
          )}

          {['marathon', 'cycling', 'triathlon'].includes(sport) && (
            <div className="bg-white/5 rounded-2xl p-3 mb-4">
              <p className="text-[#666] text-xs uppercase tracking-wider mb-1">
                {config.icon} Distance logged
              </p>
              <p className="text-2xl font-bold" style={{ color: config.color }}>
                {stats.totalKm || 0} km
              </p>
            </div>
          )}

          {sport === 'bodybuilding' && (
            <div className="bg-white/5 rounded-2xl p-3 mb-4">
              <p className="text-[#666] text-xs uppercase tracking-wider mb-1">💪 Phase</p>
              <p className="text-lg font-bold text-[#A78BFA]">
                {profile?.primary_goal?.toLowerCase().includes('cut') ? 'Cut Phase' : 'Bulk Phase'}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-[#444] text-xs">onefitness.app</p>
            <div className="flex gap-1">
              <span className="text-[#444] text-xs">#OneFitness</span>
              <span className="text-[#444] text-xs">#Athletics</span>
            </div>
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
        <p className="text-center text-[#444] text-xs">Screenshot to share on Instagram / WhatsApp</p>
      </div>
    </div>
  )
}

export default function Progress({ session, profile }) {
  const [sessions, setSessions] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [nutritionLogs, setNutritionLogs] = useState([])
  const [newWeight, setNewWeight] = useState('')
  const [activeChart, setActiveChart] = useState('weight')
  const [loading, setLoading] = useState(true)
  const [showShareCard, setShowShareCard] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [])

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
      .select()
      .single()
    if (data) setWeightLogs(prev => [...prev, data])
    setNewWeight('')
  }

  // Weight chart data
  const weightData = weightLogs.slice(-10).map(w => ({
    date: getWeekLabel(w.date),
    weight: w.weight
  }))

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
    return {
      station,
      pb: allTimes.length > 0 ? allTimes[allTimes.length - 1].time : null,
      count: allTimes.length
    }
  }).filter(s => s.pb)

  // Training breakdown
  const typeCount = { Strength: 0, Cardio: 0, Hyrox: 0, Rest: 0 }
  sessions.forEach(s => { if (typeCount[s.type] !== undefined) typeCount[s.type]++ })
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

  // Share card stats
  const startWeight = profile?.weight || 0
  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : startWeight
  const weightLost = Math.max(0, Math.round((startWeight - currentWeight) * 10) / 10)
  const totalKm = sessions.reduce((sum, s) => {
  return sum + (s.exercises || []).reduce((a, e) => a + Number(e.distance || 0), 0)
}, 0)

  const shareStats = {
  totalSessions: sessions.length,
  weightLost,
  currentWeight,
  avgCalories,
  avgProtein,
  topPBs: hyroxPBs.slice(0, 3),
  totalKm: Math.round(totalKm * 10) / 10,
}

  const CHART_TABS = [
    { id: 'weight', label: 'Weight' },
    { id: 'volume', label: 'Volume' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#666] text-sm">Loading progress...</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">

      {showShareCard && (
        <ShareCard
          profile={profile}
          stats={shareStats}
          onClose={() => setShowShareCard(false)}
        />
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

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <Dumbbell size={16} className="text-[#00E5A0] mb-2" />
          <p className="text-2xl font-bold text-white">{sessions.length}</p>
          <p className="text-[#666] text-xs mt-1">Total sessions</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <TrendingUp size={16} className="text-[#A78BFA] mb-2" />
          <p className="text-2xl font-bold text-white">{hyroxPBs.length}</p>
          <p className="text-[#666] text-xs mt-1">Hyrox stations logged</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <Flame size={16} className="text-[#FF6B35] mb-2" />
          <p className="text-2xl font-bold text-white">{avgCalories}</p>
          <p className="text-[#666] text-xs mt-1">Avg kcal / day (7d)</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <Weight size={16} className="text-[#3B9EFF] mb-2" />
          <p className="text-2xl font-bold text-white">{avgProtein}g</p>
          <p className="text-[#666] text-xs mt-1">Avg protein / day (7d)</p>
        </div>
      </div>

      {/* Weight progress bar */}
      {profile?.goal_weight && currentWeight && (
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <p className="text-[#666] text-xs uppercase tracking-wider mb-3">Weight journey</p>
          <div className="flex items-center justify-between mb-2">
            <div className="text-center">
              <p className="text-[#666] text-xs">Start</p>
              <p className="text-white font-bold">{profile.weight}kg</p>
            </div>
            <div className="text-center">
              <p className="text-[#666] text-xs">Now</p>
              <p className="text-[#00E5A0] font-bold text-lg">{currentWeight}kg</p>
            </div>
            <div className="text-center">
              <p className="text-[#666] text-xs">Goal</p>
              <p className="text-white font-bold">{profile.goal_weight}kg</p>
            </div>
          </div>
          <div className="w-full bg-[#2a2a2a] rounded-full h-2">
            <div className="bg-[#A78BFA] h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(Math.max(
                  ((profile.weight - currentWeight) / (profile.weight - profile.goal_weight)) * 100, 0
                ), 100)}%`
              }} />
          </div>
          <p className="text-[#666] text-xs mt-1">
            {currentWeight > profile.goal_weight
              ? `${(currentWeight - profile.goal_weight).toFixed(1)}kg to goal`
              : 'Goal reached! 🎉'}
          </p>
        </div>
      )}

      {/* Chart tabs */}
      <div className="flex gap-2">
        {CHART_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveChart(t.id)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all
              ${activeChart === t.id ? 'bg-[#00E5A0] text-black' : 'bg-[#1a1a1a] text-[#666]'}`}>
            {t.label}
          </button>
        ))}
      </div>

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
                className="bg-[#00E5A0] text-black text-xs font-medium px-3 py-1 rounded-lg">
                Log
              </button>
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
        </div>
      )}

      {/* Training breakdown */}
      <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
        <p className="text-white font-medium text-sm mb-3">Training breakdown</p>
        {[
          { type: 'Strength', color: '#A78BFA' },
          { type: 'Cardio', color: '#3B9EFF' },
          { type: 'Hyrox', color: '#00E5A0' },
          { type: 'Rest', color: '#444' },
        ].map(({ type, color }) => {
          const pct = Math.round((typeCount[type] / totalSessionsCount) * 100)
          return (
            <div key={type} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color }}>{type}</span>
                <span className="text-[#666]">{typeCount[type]} sessions · {pct}%</span>
              </div>
              <div className="w-full bg-[#2a2a2a] rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Hyrox PBs */}
      <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
        <p className="text-white font-medium text-sm mb-3">Hyrox station PBs</p>
        {hyroxPBs.length === 0 ? (
          <p className="text-[#444] text-sm">Log a Hyrox session to see your PBs</p>
        ) : (
          hyroxPBs.map(({ station, pb, count }) => (
            <div key={station} className="flex items-center justify-between py-2 border-b border-[#2a2a2a]">
              <span className="text-white text-sm">{station}</span>
              <div className="flex items-center gap-3">
                <span className="text-[#666] text-xs">{count}x logged</span>
                <span className="text-[#00E5A0] text-sm font-medium">{pb}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}