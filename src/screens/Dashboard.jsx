import { useState, useEffect } from 'react'
import { Flame, Droplets, Weight, ChevronRight, Zap } from 'lucide-react'

const RACE_DATE = new Date('2026-07-24')

function getDaysToRace() {
  const today = new Date()
  const diff = RACE_DATE - today
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getWeeksToRace() {
  return Math.ceil(getDaysToRace() / 7)
}

export default function Dashboard() {
  const daysLeft = getDaysToRace()
  const weeksLeft = getWeeksToRace()
  const progressPct = Math.round(((94 - daysLeft) / 94) * 100)

  const [todayLog] = useState(() => {
    const saved = localStorage.getItem('todayLog')
    return saved ? JSON.parse(saved) : {
      calories: 0, calorieGoal: 2800,
      protein: 0, proteinGoal: 180,
      water: 0, waterGoal: 3.5,
      weight: null,
    }
  })

  const [todaySession] = useState(() => {
    const saved = localStorage.getItem('sessions')
    const sessions = saved ? JSON.parse(saved) : []
    const today = new Date().toDateString()
    return sessions.find(s => new Date(s.date).toDateString() === today) || null
  })

  return (
    <div className="p-4 space-y-4">

      {/* Header */}
      <div className="pt-4">
        <p className="text-[#666] text-sm">Good morning, Sahil</p>
        <h1 className="text-2xl font-bold text-white">Race Day Countdown</h1>
      </div>

      {/* Countdown card */}
      <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a]">
        <div className="flex items-end gap-3 mb-3">
          <span className="text-6xl font-bold text-[#00E5A0]">{daysLeft}</span>
          <div className="mb-2">
            <p className="text-white font-medium">days to go</p>
            <p className="text-[#666] text-sm">{weeksLeft} weeks · 24 July 2026</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-[#2a2a2a] rounded-full h-2">
          <div
            className="bg-[#00E5A0] h-2 rounded-full transition-all"
            style={{ width: `${Math.max(progressPct, 2)}%` }}
          />
        </div>
        <p className="text-[#666] text-xs mt-2">{progressPct}% of prep complete</p>
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

        {/* Calories */}
        <div className="bg-[#1a1a1a] rounded-2xl p-3 border border-[#2a2a2a]">
          <Flame size={16} className="text-[#FF6B35] mb-2" />
          <p className="text-white font-bold text-lg leading-none">{todayLog.calories}</p>
          <p className="text-[#666] text-xs mt-1">of {todayLog.calorieGoal}</p>
          <p className="text-[#666] text-xs">kcal</p>
          <div className="w-full bg-[#2a2a2a] rounded-full h-1 mt-2">
            <div className="bg-[#FF6B35] h-1 rounded-full"
              style={{ width: `${Math.min((todayLog.calories / todayLog.calorieGoal) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Water */}
        <div className="bg-[#1a1a1a] rounded-2xl p-3 border border-[#2a2a2a]">
          <Droplets size={16} className="text-[#3B9EFF] mb-2" />
          <p className="text-white font-bold text-lg leading-none">{todayLog.water}L</p>
          <p className="text-[#666] text-xs mt-1">of {todayLog.waterGoal}L</p>
          <p className="text-[#666] text-xs">water</p>
          <div className="w-full bg-[#2a2a2a] rounded-full h-1 mt-2">
            <div className="bg-[#3B9EFF] h-1 rounded-full"
              style={{ width: `${Math.min((todayLog.water / todayLog.waterGoal) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Weight */}
        <div className="bg-[#1a1a1a] rounded-2xl p-3 border border-[#2a2a2a]">
          <Weight size={16} className="text-[#A78BFA] mb-2" />
          <p className="text-white font-bold text-lg leading-none">
            {todayLog.weight ? `${todayLog.weight}` : '--'}
          </p>
          <p className="text-[#666] text-xs mt-1">&nbsp;</p>
          <p className="text-[#666] text-xs">kg</p>
          <div className="w-full bg-[#2a2a2a] rounded-full h-1 mt-2">
            <div className="bg-[#A78BFA] h-1 rounded-full" style={{ width: '0%' }} />
          </div>
        </div>

      </div>

      {/* Hyrox tip */}
      <div className="bg-[#0d2d1f] rounded-2xl p-4 border border-[#1a4d35]">
        <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider mb-1">Hyrox Focus</p>
        <p className="text-white text-sm">First PT session starts Thursday. Log your baseline times for each station so you can track improvement.</p>
      </div>

    </div>
  )
}