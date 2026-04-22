import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { TrendingUp, Weight, Flame, Dumbbell } from 'lucide-react'

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

export default function Progress() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('sessions')
    return saved ? JSON.parse(saved) : []
  })

  const [weightLogs, setWeightLogs] = useState(() => {
    const saved = localStorage.getItem('weightLogs')
    return saved ? JSON.parse(saved) : []
  })

  const [newWeight, setNewWeight] = useState('')
  const [activeChart, setActiveChart] = useState('weight')

  // Weight trend data
  const weightData = weightLogs.slice(-10).map(w => ({
    date: getWeekLabel(w.date),
    weight: w.weight
  }))

  // Weekly volume data
  const weeklyData = getLast8Weeks().map(weekDate => {
    const count = sessions.filter(s => isSameWeek(s.date, weekDate)).length
    return { date: getWeekLabel(weekDate), sessions: count }
  })

  // Hyrox PBs
  const hyroxPBs = HYROX_STATIONS.map(station => {
    const allTimes = sessions
      .flatMap(s => s.hyroxStations || [])
      .filter(st => st.name === station && st.time)
    return { station, pb: allTimes.length > 0 ? allTimes[allTimes.length - 1].time : null, count: allTimes.length }
  }).filter(s => s.pb)

  // Training breakdown
  const typeCount = { Strength: 0, Cardio: 0, Hyrox: 0, Rest: 0 }
  sessions.forEach(s => { if (typeCount[s.type] !== undefined) typeCount[s.type]++ })
  const totalSessions = sessions.length || 1

  // Weekly avg calories
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toDateString()
  })
  const calAvg = Math.round(
    last7Days.reduce((sum, day) => {
      const saved = localStorage.getItem('nutrition_' + day)
      if (!saved) return sum
      const data = JSON.parse(saved)
      return sum + data.meals.reduce((s, m) => s + Number(m.calories || 0), 0)
    }, 0) / 7
  )
  const proteinAvg = Math.round(
    last7Days.reduce((sum, day) => {
      const saved = localStorage.getItem('nutrition_' + day)
      if (!saved) return sum
      const data = JSON.parse(saved)
      return sum + data.meals.reduce((s, m) => s + Number(m.protein || 0), 0)
    }, 0) / 7
  )

  function logWeight() {
    if (!newWeight) return
    const entry = { date: new Date().toISOString(), weight: Number(newWeight) }
    const updated = [...weightLogs, entry]
    setWeightLogs(updated)
    localStorage.setItem('weightLogs', JSON.stringify(updated))
    // sync to todayLog
    const existing = localStorage.getItem('todayLog')
    const log = existing ? JSON.parse(existing) : {}
    localStorage.setItem('todayLog', JSON.stringify({ ...log, weight: Number(newWeight) }))
    setNewWeight('')
  }

  const CHART_TABS = [
    { id: 'weight', label: 'Weight' },
    { id: 'volume', label: 'Volume' },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">Progress</h1>
        <p className="text-[#666] text-sm">Your numbers over time</p>
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
          <p className="text-2xl font-bold text-white">{calAvg}</p>
          <p className="text-[#666] text-xs mt-1">Avg kcal / day (7d)</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <Weight size={16} className="text-[#3B9EFF] mb-2" />
          <p className="text-2xl font-bold text-white">{proteinAvg}g</p>
          <p className="text-[#666] text-xs mt-1">Avg protein / day (7d)</p>
        </div>
      </div>

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
          const pct = Math.round((typeCount[type] / totalSessions) * 100)
          return (
            <div key={type} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color }}>{type}</span>
                <span className="text-[#666]">{typeCount[type]} sessions · {pct}%</span>
              </div>
              <div className="w-full bg-[#2a2a2a] rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
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