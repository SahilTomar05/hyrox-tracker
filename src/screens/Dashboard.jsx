import { useState, useEffect } from 'react'
import { Flame, Droplets, Weight, ChevronRight, Zap, Footprints } from 'lucide-react'

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

export default function Dashboard({ profile }) {
  const [todayLog, setTodayLog] = useState(() => {
    return JSON.parse(localStorage.getItem('todayLog') || '{}')
  })
  const [steps, setSteps] = useState(() => {
    const saved = localStorage.getItem('steps_' + todayKey())
    return saved ? Number(saved) : 0
  })
  const [stepsInput, setStepsInput] = useState('')
  const [showStepsInput, setShowStepsInput] = useState(false)

  const sessions = JSON.parse(localStorage.getItem('sessions') || '[]')
  const todaySession = sessions.find(s =>
    new Date(s.date).toDateString() === new Date().toDateString()
  )

  const goals = profile?.goals || {}
  const stepGoal = profile?.stepGoal || 10000
  const daysLeft = profile?.hasRace === 'yes' ? getDaysToRace(profile?.raceDate) : null
  const weeksLeft = daysLeft ? Math.ceil(daysLeft / 7) : null

  const startDate = profile?.createdAt ? new Date(profile.createdAt) : new Date()
  const totalDays = daysLeft
    ? Math.ceil((new Date(profile.raceDate) - startDate) / (1000 * 60 * 60 * 24))
    : 100
  const progressPct = daysLeft
    ? Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100))
    : 0

  const calorieGoal = goals.calories || todayLog.calorieGoal || 2800
  const waterGoal = goals.water || todayLog.waterGoal || 3.5
  const calories = todayLog.calories || 0
  const water = todayLog.water || 0
  const weight = todayLog.weight || profile?.weight || null
  const stepPct = Math.min(Math.round((steps / stepGoal) * 100), 100)

  useEffect(() => {
    const interval = setInterval(() => {
      setTodayLog(JSON.parse(localStorage.getItem('todayLog') || '{}'))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  function saveSteps() {
    const val = Number(stepsInput)
    if (!val) return
    setSteps(val)
    localStorage.setItem('steps_' + todayKey(), String(val))
    // save to history
    const history = JSON.parse(localStorage.getItem('stepsHistory') || '{}')
    history[todayKey()] = val
    localStorage.setItem('stepsHistory', JSON.stringify(history))
    setStepsInput('')
    setShowStepsInput(false)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <p className="text-[#666] text-sm">{getGreeting()},</p>
        <h1 className="text-2xl font-bold text-white">{profile?.name || 'Athlete'} 👋</h1>
      </div>

      {/* Countdown */}
      {daysLeft !== null ? (
        <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a]">
          <div className="flex items-end gap-3 mb-3">
            <span className="text-6xl font-bold text-[#00E5A0]">{daysLeft}</span>
            <div className="mb-2">
              <p className="text-white font-medium">days to race</p>
              <p className="text-[#666] text-sm">
                {weeksLeft} weeks · {new Date(profile.raceDate).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="w-full bg-[#2a2a2a] rounded-full h-2">
            <div className="bg-[#00E5A0] h-2 rounded-full transition-all"
              style={{ width: `${Math.max(progressPct, 2)}%` }} />
          </div>
          <p className="text-[#666] text-xs mt-2">{progressPct}% of prep complete</p>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a]">
          <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider mb-1">Training streak</p>
          <p className="text-4xl font-bold text-white">
            {sessions.length} <span className="text-lg text-[#666]">sessions logged</span>
          </p>
          <p className="text-[#666] text-sm mt-1">Keep the momentum going 💪</p>
        </div>
      )}

      {/* Weight progress */}
      {profile?.goalWeight && weight && (
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <p className="text-[#666] text-xs uppercase tracking-wider mb-3">Weight progress</p>
          <div className="flex items-center justify-between mb-2">
            <div className="text-center">
              <p className="text-[#666] text-xs">Start</p>
              <p className="text-white font-bold">{profile.weight}kg</p>
            </div>
            <div className="text-center">
              <p className="text-[#666] text-xs">Current</p>
              <p className="text-[#00E5A0] font-bold text-lg">{weight}kg</p>
            </div>
            <div className="text-center">
              <p className="text-[#666] text-xs">Goal</p>
              <p className="text-white font-bold">{profile.goalWeight}kg</p>
            </div>
          </div>
          <div className="w-full bg-[#2a2a2a] rounded-full h-2">
            <div className="bg-[#A78BFA] h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(Math.max(
                  ((profile.weight - weight) / (profile.weight - profile.goalWeight)) * 100, 0
                ), 100)}%`
              }} />
          </div>
          <p className="text-[#666] text-xs mt-1">
            {weight > profile.goalWeight
              ? `${(weight - profile.goalWeight).toFixed(1)}kg to goal`
              : 'Goal reached! 🎉'}
          </p>
        </div>
      )}

      {/* Steps card */}
      <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Footprints size={16} className="text-[#00E5A0]" />
            <span className="text-white font-medium">{steps.toLocaleString()}</span>
            <span className="text-[#666] text-sm">/ {stepGoal.toLocaleString()} steps</span>
          </div>
          <button onClick={() => setShowStepsInput(s => !s)}
            className="text-[#00E5A0] text-xs border border-[#00E5A0] px-3 py-1 rounded-lg">
            {showStepsInput ? 'Cancel' : 'Log'}
          </button>
        </div>
        <div className="w-full bg-[#2a2a2a] rounded-full h-2 mb-1">
          <div className="bg-[#00E5A0] h-2 rounded-full transition-all"
            style={{ width: `${stepPct}%` }} />
        </div>
        <p className="text-[#666] text-xs">{stepPct}% of daily goal</p>

        {showStepsInput && (
          <div className="flex gap-2 mt-3">
            <input
              type="number"
              placeholder="Enter steps (e.g. 8500)"
              value={stepsInput}
              onChange={e => setStepsInput(e.target.value)}
              className="flex-1 bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444]"
            />
            <button onClick={saveSteps}
              className="bg-[#00E5A0] text-black text-sm font-medium px-4 py-2 rounded-xl">
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

      {/* Daily focus */}
      <div className="bg-[#0d2d1f] rounded-2xl p-4 border border-[#1a4d35]">
        <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider mb-1">Daily Focus</p>
        <p className="text-white text-sm">
          {!daysLeft
            ? 'Stay consistent — every session counts. 💪'
            : daysLeft > 60
            ? 'Build your base — focus on consistency over intensity right now.'
            : daysLeft > 30
            ? 'Race-specific training phase — push your Hyrox station times.'
            : daysLeft > 7
            ? 'Final push — taper down volume, keep intensity sharp.'
            : 'Race week — rest, eat well, trust your preparation. 🏁'}
        </p>
      </div>
    </div>
  )
}