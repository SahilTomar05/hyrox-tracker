import { useState, useEffect } from 'react'
import { Flame, Droplets, Weight, ChevronRight, Zap, Footprints } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getSarcasticFeedback } from '../lib/feedback'

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

function todayKey() {
  return new Date().toDateString()
}

const SPORT_CONFIG = {
  marathon: {
    icon: '🏃',
    name: 'Marathon',
    color: '#3B9EFF',
    focusByWeeks: (w) => {
      if (w > 12) return 'Base building phase — focus on easy runs and weekly mileage.'
      if (w > 8) return 'Build phase — add tempo runs and long run progression.'
      if (w > 4) return 'Peak phase — your longest runs are coming up. Trust the process.'
      if (w > 2) return 'Taper time — reduce volume, keep intensity. You are ready.'
      return 'Race week — rest, hydrate, carb load. Go get that PB! 🏁'
    },
    metric1: { label: 'Weekly km', key: 'weeklyKm', color: '#3B9EFF', icon: '🏃' },
    metric2: { label: 'Long run', key: 'longRun', color: '#00E5A0', icon: '📏' },
  },
  hyrox: {
    icon: '⚡',
    name: 'Hyrox',
    color: '#00E5A0',
    focusByWeeks: (w) => {
      if (w > 8) return 'Build your base — focus on consistency over intensity.'
      if (w > 4) return 'Race-specific training — push your station times.'
      if (w > 1) return 'Final push — taper volume, keep intensity sharp.'
      return 'Race week — rest, eat well, trust your prep. 🏁'
    },
  },
  ocr: {
    icon: '🏔️',
    name: 'OCR / Adventure',
    color: '#FF6B35',
    focusByWeeks: (w) => {
      if (w > 8) return 'Build base strength and running endurance.'
      if (w > 4) return 'Obstacle-specific training — grip, carry, climb.'
      if (w > 1) return 'Sharpen race skills — practice obstacles and terrain.'
      return 'Race week — visualise the course, trust your training. 🏁'
    },
  },
  cycling: {
    icon: '🚴',
    name: 'Cycling',
    color: '#A78BFA',
    focusByWeeks: (w) => {
      if (w > 10) return 'Base miles — long easy rides to build aerobic base.'
      if (w > 6) return 'Build phase — add intervals and climbing.'
      if (w > 2) return 'Peak phase — race-pace efforts and final long ride.'
      return 'Taper week — short spins only. Save legs for race day. 🚴'
    },
  },
  bodybuilding: {
    icon: '🏋️',
    name: 'Bodybuilding',
    color: '#A78BFA',
    focusByWeeks: (w) => {
      if (!w) return 'Stay consistent with your split and hit your protein target daily.'
      if (w > 12) return 'Bulk phase — hit your surplus, progressive overload every session.'
      if (w > 8) return 'Transition phase — start dialling in nutrition.'
      if (w > 4) return 'Peak week prep — reduce sodium, increase water.'
      return 'Peak week — follow your protocol. You\'ve done the work. 💪'
    },
  },
  crossfit: {
    icon: '🏇',
    name: 'CrossFit',
    color: '#FF6B35',
    focusByWeeks: (w) => {
      if (w > 6) return 'Build engine — focus on benchmark WODs and strength.'
      if (w > 3) return 'Sharpen skills — practice movement standards.'
      if (w > 1) return 'Taper and practise — short workouts, stay sharp.'
      return 'Competition week — warm up well, pace your efforts. 🏁'
    },
  },
  triathlon: {
    icon: '🏊',
    name: 'Triathlon',
    color: '#3B9EFF',
    focusByWeeks: (w) => {
      if (w > 10) return 'Base phase — build all three disciplines consistently.'
      if (w > 6) return 'Build phase — brick sessions and open water swims.'
      if (w > 2) return 'Race prep — practice transitions and race pace.'
      return 'Race week — rest, check gear, visualise the course. 🏁'
    },
  },
  combat: {
    icon: '🥊',
    name: 'Combat Sports',
    color: '#FF6B35',
    focusByWeeks: (w) => {
      if (!w) return 'Focus on sport-specific conditioning and recovery.'
      if (w > 6) return 'General conditioning phase — build cardio and strength base.'
      if (w > 3) return 'Fight camp — sport-specific drills and sparring.'
      return 'Fight week — light training, mental prep. Trust your camp. 🥊'
    },
  },
  team: {
    icon: '⚽',
    name: 'Team Sports',
    color: '#3B9EFF',
    focusByWeeks: (w) => 'Focus on sport-specific fitness — agility, speed, endurance.',
  },
  calisthenics: {
    icon: '🤸',
    name: 'Calisthenics',
    color: '#00E5A0',
    focusByWeeks: (w) => 'Skill work first, conditioning second. Consistency beats intensity.',
  },
  general: {
    icon: '🎯',
    name: 'General Fitness',
    color: '#00E5A0',
    focusByWeeks: (w) => 'Stay consistent — every session and every meal counts. 💪',
  },
  custom: {
    icon: '🏄',
    name: 'Custom',
    color: '#A78BFA',
    focusByWeeks: (w) => 'Define your goals, track your progress, trust the process.',
  },
}

// Sport specific dashboard sections
function MarathonSection({ sessions }) {
  const runningSessions = sessions.filter(s =>
    s.type === 'Cardio' || s.type === 'Running'
  )
  const thisWeek = runningSessions.filter(s => {
    const d = new Date(s.date)
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    return d >= monday
  })
  const weeklyKm = thisWeek.reduce((sum, s) => {
    const ex = (s.exercises || []).reduce((a, e) => a + Number(e.distance || 0), 0)
    return sum + ex
  }, 0)

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
      <p className="text-[#666] text-xs uppercase tracking-wider mb-3">This week</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0d1f35] rounded-xl p-3 text-center">
          <p className="text-[#3B9EFF] text-2xl font-bold">{weeklyKm.toFixed(1)}</p>
          <p className="text-[#666] text-xs mt-1">km logged</p>
        </div>
        <div className="bg-[#0d1f35] rounded-xl p-3 text-center">
          <p className="text-[#3B9EFF] text-2xl font-bold">{thisWeek.length}</p>
          <p className="text-[#666] text-xs mt-1">runs this week</p>
        </div>
      </div>
    </div>
  )
}

function BodybuildingSection({ profile, todayLog, goals }) {
  const calorieGoal = goals?.calories || 2800
  const calories = todayLog?.calories || 0
  const diff = calories - calorieGoal
  const isGoalLose = profile?.primary_goal?.toLowerCase().includes('cut')
  const phase = isGoalLose ? 'Cut Phase' : 'Bulk Phase'
  const phaseColor = isGoalLose ? '#FF6B35' : '#00E5A0'

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#666] text-xs uppercase tracking-wider">Today's nutrition</p>
        <span className="text-xs font-medium px-2 py-1 rounded-lg"
          style={{ color: phaseColor, background: phaseColor + '20' }}>
          {phase}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0f0f0f] rounded-xl p-3 text-center">
          <p className="font-bold text-xl" style={{ color: diff >= 0 ? '#00E5A0' : '#FF6B35' }}>
            {diff >= 0 ? '+' : ''}{diff}
          </p>
          <p className="text-[#666] text-xs mt-1">kcal {diff >= 0 ? 'surplus' : 'deficit'}</p>
        </div>
        <div className="bg-[#0f0f0f] rounded-xl p-3 text-center">
          <p className="text-[#A78BFA] font-bold text-xl">{todayLog?.protein || 0}g</p>
          <p className="text-[#666] text-xs mt-1">protein today</p>
        </div>
      </div>
    </div>
  )
}

function HyroxSection({ sessions }) {
  const STATIONS = ['SkiErg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump', 'Row', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls']
  const hyroxSessions = sessions.filter(s => s.type === 'Hyrox')
  const pbs = STATIONS.map(station => {
    const times = hyroxSessions.flatMap(s => (s.hyrox_stations || []).filter(st => st.name === station && st.time))
    return { station, pb: times.length > 0 ? times[times.length - 1].time : null }
  }).filter(s => s.pb).slice(0, 3)

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
      <p className="text-[#666] text-xs uppercase tracking-wider mb-3">Station PBs</p>
      {pbs.length === 0 ? (
        <p className="text-[#444] text-sm">Log a Hyrox session to see your PBs</p>
      ) : (
        pbs.map(({ station, pb }) => (
          <div key={station} className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
            <span className="text-white text-sm">{station}</span>
            <span className="text-[#00E5A0] text-sm font-medium">{pb}</span>
          </div>
        ))
      )}
    </div>
  )
}

function GeneralSection({ sessions }) {
  const thisWeek = sessions.filter(s => {
    const d = new Date(s.date)
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    return d >= monday
  })
  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
      <p className="text-[#666] text-xs uppercase tracking-wider mb-3">This week</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0d2d1f] rounded-xl p-3 text-center">
          <p className="text-[#00E5A0] text-2xl font-bold">{thisWeek.length}</p>
          <p className="text-[#666] text-xs mt-1">sessions done</p>
        </div>
        <div className="bg-[#0d2d1f] rounded-xl p-3 text-center">
          <p className="text-[#00E5A0] text-2xl font-bold">{sessions.length}</p>
          <p className="text-[#666] text-xs mt-1">total sessions</p>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ profile, session }) {
  const [todayLog, setTodayLog] = useState({})
  const [steps, setSteps] = useState(0)
  const [stepsInput, setStepsInput] = useState('')
  const [showStepsInput, setShowStepsInput] = useState(false)
  const [sessions, setSessions] = useState([])

  const sport = profile?.sport || 'general'
  const config = SPORT_CONFIG[sport] || SPORT_CONFIG.general
  const goals = profile?.goals || {}
  const daysLeft = profile?.has_race && profile?.race_date ? getDaysToRace(profile.race_date) : null
  const weeksLeft = daysLeft ? Math.ceil(daysLeft / 7) : null
  const startDate = profile?.created_at ? new Date(profile.created_at) : new Date()
  const totalDays = daysLeft ? Math.ceil((new Date(profile.race_date) - startDate) / (1000 * 60 * 60 * 24)) : 100
  const progressPct = daysLeft ? Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100)) : 0

  const calorieGoal = goals.calories || 2800
  const waterGoal = goals.water || 3.5
  const calories = todayLog.calories || 0
  const water = todayLog.water || 0
  const weight = todayLog.weight || profile?.weight || null
  const stepGoal = profile?.step_goal || 10000
  const stepPct = Math.min(Math.round((steps / stepGoal) * 100), 100)

  const focusMessage = config.focusByWeeks(weeksLeft)

  useEffect(() => {
    fetchTodayData()
    fetchSessions()
    const savedSteps = localStorage.getItem('steps_' + todayKey())
    if (savedSteps) setSteps(Number(savedSteps))
  }, [])

  async function fetchTodayData() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('date', today)
      .single()
    if (data) {
      const totalCals = (data.meals || []).reduce((s, m) => s + Number(m.calories || 0), 0)
      const totalProtein = (data.meals || []).reduce((s, m) => s + Number(m.protein || 0), 0)
      setTodayLog({ calories: totalCals, protein: totalProtein, water: data.water || 0 })
    }
    const { data: weightData } = await supabase
      .from('weight_logs')
      .select('weight')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .limit(1)
      .single()
    if (weightData) setTodayLog(prev => ({ ...prev, weight: weightData.weight }))
  }

  async function fetchSessions() {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
    if (data) setSessions(data)
  }

  const todaySession = sessions.find(s =>
    new Date(s.date).toDateString() === new Date().toDateString()
  )

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

  return (
    <div className="p-4 space-y-4">

      {/* Header */}
      <div className="pt-4 flex items-start justify-between">
        <div>
          <p className="text-[#666] text-sm">{getGreeting()},</p>
          <h1 className="text-2xl font-bold text-white">{profile?.name || 'Athlete'} 👋</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{config.icon}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-lg"
              style={{ color: config.color, background: config.color + '20' }}>
              {config.name}
            </span>
            {profile?.event_name && (
              <span className="text-[#666] text-xs">· {profile.event_name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Countdown or streak */}
      {daysLeft !== null ? (
        <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a]"
          style={{ borderColor: config.color + '40' }}>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-6xl font-bold" style={{ color: config.color }}>{daysLeft}</span>
            <div className="mb-2">
              <p className="text-white font-medium">days to {profile?.event_name || 'race'}</p>
              <p className="text-[#666] text-sm">
                {weeksLeft} weeks · {new Date(profile.race_date).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="w-full bg-[#2a2a2a] rounded-full h-2">
            <div className="h-2 rounded-full transition-all"
              style={{ width: `${Math.max(progressPct, 2)}%`, background: config.color }} />
          </div>
          <p className="text-[#666] text-xs mt-2">{progressPct}% of prep complete</p>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a]">
          <p className="text-xs font-medium uppercase tracking-wider mb-1"
            style={{ color: config.color }}>Training streak</p>
          <p className="text-4xl font-bold text-white">
            {sessions.length} <span className="text-lg text-[#666]">sessions logged</span>
          </p>
          <p className="text-[#666] text-sm mt-1">Keep the momentum going 💪</p>
        </div>
      )}

      {/* Weight progress */}
      {profile?.goal_weight && weight && profile.weight !== profile.goal_weight && (
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <p className="text-[#666] text-xs uppercase tracking-wider mb-3">Weight progress</p>
          <div className="flex items-center justify-between mb-2">
            <div className="text-center">
              <p className="text-[#666] text-xs">Start</p>
              <p className="text-white font-bold">{profile.weight}kg</p>
            </div>
            <div className="text-center">
              <p className="text-[#666] text-xs">Now</p>
              <p className="font-bold text-lg" style={{ color: config.color }}>{weight}kg</p>
            </div>
            <div className="text-center">
              <p className="text-[#666] text-xs">Goal</p>
              <p className="text-white font-bold">{profile.goal_weight}kg</p>
            </div>
          </div>
          <div className="w-full bg-[#2a2a2a] rounded-full h-2">
            <div className="h-2 rounded-full transition-all"
              style={{
                background: config.color,
                width: `${Math.min(Math.max(
                  ((profile.weight - weight) / (profile.weight - profile.goal_weight)) * 100, 0
                ), 100)}%`
              }} />
          </div>
          <p className="text-[#666] text-xs mt-1">
            {weight > profile.goal_weight
              ? `${(weight - profile.goal_weight).toFixed(1)}kg to goal`
              : 'Goal reached! 🎉'}
          </p>
        </div>
      )}

      {/* Sport specific section */}
      {sport === 'marathon' && <MarathonSection sessions={sessions} />}
      {sport === 'hyrox' && <HyroxSection sessions={sessions} />}
      {sport === 'ocr' && <HyroxSection sessions={sessions} />}
      {sport === 'bodybuilding' && (
        <BodybuildingSection profile={profile} todayLog={todayLog} goals={goals} />
      )}
      {['crossfit', 'triathlon', 'cycling', 'combat', 'team', 'calisthenics', 'general', 'custom'].includes(sport) && (
        <GeneralSection sessions={sessions} />
      )}

      {/* Steps */}
      <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Footprints size={16} style={{ color: config.color }} />
            <span className="text-white font-medium">{steps.toLocaleString()}</span>
            <span className="text-[#666] text-sm">/ {stepGoal.toLocaleString()} steps</span>
          </div>
          <button onClick={() => setShowStepsInput(s => !s)}
            className="text-xs border px-3 py-1 rounded-lg"
            style={{ color: config.color, borderColor: config.color }}>
            {showStepsInput ? 'Cancel' : 'Log'}
          </button>
        </div>
        <div className="w-full bg-[#2a2a2a] rounded-full h-2 mb-1">
          <div className="h-2 rounded-full transition-all"
            style={{ width: `${stepPct}%`, background: config.color }} />
        </div>
        <p className="text-[#666] text-xs">{stepPct}% of daily goal</p>
        {showStepsInput && (
          <div className="flex gap-2 mt-3">
            <input type="number" placeholder="Enter steps (e.g. 8500)"
              value={stepsInput} onChange={e => setStepsInput(e.target.value)}
              className="flex-1 bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444]" />
            <button onClick={saveSteps}
              className="text-black text-sm font-medium px-4 py-2 rounded-xl"
              style={{ background: config.color }}>
              Save
            </button>
          </div>
        )}
      </div>

      {/* Today's session */}
      <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[#666] text-xs uppercase tracking-wider">Today's Session</p>
          <ChevronRight size={16} className="text-[#444]" />
        </div>
        {todaySession ? (
          <div>
            <p className="text-white font-medium">{todaySession.type}</p>
            <p className="text-[#666] text-sm">{todaySession.notes || 'No notes'}</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center">
              <Zap size={14} className="text-[#444]" />
            </div>
            <div>
              <p className="text-white text-sm">No session planned</p>
              <p className="text-[#666] text-xs">Go to Training to add one</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1a1a] rounded-2xl p-3 border border-[#2a2a2a]">
          <Flame size={16} className="text-[#FF6B35] mb-2" />
          <p className="text-white font-bold text-lg leading-none">{calories}</p>
          <p className="text-[#666] text-xs mt-1">of {calorieGoal}</p>
          <p className="text-[#666] text-xs">kcal</p>
          <div className="w-full bg-[#2a2a2a] rounded-full h-1 mt-2">
            <div className="bg-[#FF6B35] h-1 rounded-full"
              style={{ width: `${Math.min((calories / calorieGoal) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-3 border border-[#2a2a2a]">
          <Droplets size={16} className="text-[#3B9EFF] mb-2" />
          <p className="text-white font-bold text-lg leading-none">{water}L</p>
          <p className="text-[#666] text-xs mt-1">of {waterGoal}L</p>
          <p className="text-[#666] text-xs">water</p>
          <div className="w-full bg-[#2a2a2a] rounded-full h-1 mt-2">
            <div className="bg-[#3B9EFF] h-1 rounded-full"
              style={{ width: `${Math.min((water / waterGoal) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-2xl p-3 border border-[#2a2a2a]">
          <Weight size={16} className="text-[#A78BFA] mb-2" />
          <p className="text-white font-bold text-lg leading-none">{weight || '--'}</p>
          <p className="text-[#666] text-xs mt-1">&nbsp;</p>
          <p className="text-[#666] text-xs">kg</p>
          <div className="w-full bg-[#2a2a2a] rounded-full h-1 mt-2">
            <div className="bg-[#A78BFA] h-1 rounded-full" style={{ width: '0%' }} />
          </div>
        </div>
      </div>
      
      {/* Sarcastic feedback */}
      {(() => {
        const stepsHistory = JSON.parse(localStorage.getItem('stepsHistory') || '{}')
        const improvements = []
        const fb = getSarcasticFeedback({
        sessions,
        nutritionLogs: [],
        steps,
        avgCalories: calories,
        avgProtein: todayLog.protein || 0,
        goals,
        consistencyScore: 50,
        improvements,
      })
        const bgColor = fb.level === 'savage' ? '#2d0d0d' : fb.level === 'good' ? '#0d2d1f' : '#1a1a1a'
        const borderColor = fb.level === 'savage' ? '#FF444430' : fb.level === 'good' ? '#00E5A030' : '#2a2a2a'
        const textColor = fb.level === 'savage' ? '#FF6666' : fb.level === 'good' ? '#00E5A0' : '#999'
        return (
          <div className="rounded-2xl p-4 border" style={{ background: bgColor, borderColor }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: textColor }}>
              🤖 OneFitness says
            </p>
            <p className="text-white text-sm">{fb.msg}</p>
          </div>
        )
      })()}

      {/* Daily focus — sport specific */}
      <div className="rounded-2xl p-4 border"
        style={{ background: config.color + '10', borderColor: config.color + '30' }}>
        <p className="text-xs font-medium uppercase tracking-wider mb-1"
          style={{ color: config.color }}>
          {config.icon} Daily Focus
        </p>
        <p className="text-white text-sm">{focusMessage}</p>
      </div>

    </div>
  )
}