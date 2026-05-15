import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp, Check, X, Timer } from 'lucide-react'
import { supabase } from '../lib/supabase'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SESSION_TYPES = [
  { id: 'Strength', icon: '🏋️', color: 'text-[#A78BFA] bg-[#1a1535]' },
  { id: 'Running', icon: '🏃', color: 'text-[#3B9EFF] bg-[#0d1f35]' },
  { id: 'HIIT', icon: '⚡', color: 'text-[#FF6B35] bg-[#2d1a0d]' },
  { id: 'Hyrox', icon: '🏆', color: 'text-[#00E5A0] bg-[#0d2d1f]' },
  { id: 'OCR Training', icon: '🏔️', color: 'text-[#FF6B35] bg-[#2d1a0d]' },
  { id: 'Cycling', icon: '🚴', color: 'text-[#A78BFA] bg-[#1a1535]' },
  { id: 'Swimming', icon: '🏊', color: 'text-[#3B9EFF] bg-[#0d1f35]' },
  { id: 'Yoga / Mobility', icon: '🧘', color: 'text-[#00E5A0] bg-[#0d2d1f]' },
  { id: 'CrossFit WOD', icon: '🏇', color: 'text-[#FF6B35] bg-[#2d1a0d]' },
  { id: 'Calisthenics', icon: '🤸', color: 'text-[#A78BFA] bg-[#1a1535]' },
  { id: 'Sport Practice', icon: '⚽', color: 'text-[#3B9EFF] bg-[#0d1f35]' },
  { id: 'Recovery', icon: '💆', color: 'text-[#666] bg-[#1a1a1a]' },
  { id: 'Rest', icon: '😴', color: 'text-[#666] bg-[#1a1a1a]' },
  { id: 'Custom', icon: '🎯', color: 'text-[#00E5A0] bg-[#0d2d1f]' },
]

const HYROX_STATIONS = [
  'SkiErg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump',
  'Row', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls'
]

const OCR_OBSTACLES = [
  'Rope Climb', 'Monkey Bars', 'Wall Climb', 'Mud Run',
  'Tyre Flip', 'Sandbag Carry', 'Spear Throw', 'Barbed Wire Crawl',
  'Atlas Stone', 'Bucket Carry', 'Z-Wall', 'Custom Obstacle'
]

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Legs', 'Glutes', 'Core', 'Full Body'
]

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

export default function Training({ session, profile }) {
  const weekDates = getWeekDates()
  const today = new Date()
  const sport = profile?.sport || 'general'

  const [selectedDay, setSelectedDay] = useState(today)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedSession, setExpandedSession] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    type: 'Strength',
    notes: '',
    rpe: 7,
    exercises: [],
    hyroxStations: [],
    ocrObstacles: [],
    muscleGroups: [],
    duration: '',
    distance: '',
    customWorkout: '',
  })

  const [newExercise, setNewExercise] = useState({
    name: '', sets: '', reps: '', weight: '', duration: '', distance: ''
  })
  const [newStation, setNewStation] = useState({
    name: HYROX_STATIONS[0], time: '', notes: ''
  })
  const [newObstacle, setNewObstacle] = useState({
    name: OCR_OBSTACLES[0], completed: true, notes: ''
  })

  useEffect(() => { fetchSessions() }, [])

  async function fetchSessions() {
    setLoading(true)
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
    if (data) setSessions(data)
    setLoading(false)
  }

  const todaySessions = sessions.filter(s => isSameDay(s.date, selectedDay))

  function addExercise() {
    if (!newExercise.name) return
    setForm(f => ({ ...f, exercises: [...f.exercises, { ...newExercise, id: Date.now() }] }))
    setNewExercise({ name: '', sets: '', reps: '', weight: '', duration: '', distance: '' })
  }

  function addStation() {
    if (!newStation.time) return
    setForm(f => ({ ...f, hyroxStations: [...f.hyroxStations, { ...newStation, id: Date.now() }] }))
    setNewStation({ name: HYROX_STATIONS[0], time: '', notes: '' })
  }

  function addObstacle() {
    setForm(f => ({ ...f, ocrObstacles: [...f.ocrObstacles, { ...newObstacle, id: Date.now() }] }))
    setNewObstacle({ name: OCR_OBSTACLES[0], completed: true, notes: '' })
  }

  function toggleMuscleGroup(group) {
    setForm(f => ({
      ...f,
      muscleGroups: f.muscleGroups.includes(group)
        ? f.muscleGroups.filter(g => g !== group)
        : [...f.muscleGroups, group]
    }))
  }

  async function saveSession() {
    setSaving(true)
    const sessionData = {
      user_id: session.user.id,
      date: selectedDay,
      type: form.type,
      notes: form.notes,
      rpe: !['Rest', 'Recovery'].includes(form.type) ? form.rpe : null,
      exercises: form.exercises,
      hyrox_stations: form.hyroxStations,
      ocr_obstacles: form.ocrObstacles,
      muscle_groups: form.muscleGroups,
      duration: form.duration,
      distance: form.distance,
    }
    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single()
    if (!error && data) setSessions(prev => [data, ...prev])
    setSaving(false)
    setShowForm(false)
    resetForm()
  }

  async function deleteSession(id) {
    await supabase.from('sessions').delete().eq('id', id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  function resetForm() {
    setForm({
      type: 'Strength', notes: '', rpe: 7,
      exercises: [], hyroxStations: [], ocrObstacles: [],
      muscleGroups: [], duration: '', distance: '', customWorkout: ''
    })
    setNewExercise({ name: '', sets: '', reps: '', weight: '', duration: '', distance: '' })
    setNewStation({ name: HYROX_STATIONS[0], time: '', notes: '' })
    setNewObstacle({ name: OCR_OBSTACLES[0], completed: true, notes: '' })
  }

  // Get suggested session types based on sport
  function getSuggestedTypes() {
    const suggestions = {
      marathon: ['Running', 'Strength', 'Yoga / Mobility', 'Recovery'],
      hyrox: ['Hyrox', 'Strength', 'Running', 'HIIT'],
      ocr: ['OCR Training', 'Strength', 'Running', 'HIIT'],
      cycling: ['Cycling', 'Strength', 'Yoga / Mobility', 'Recovery'],
      bodybuilding: ['Strength', 'HIIT', 'Yoga / Mobility', 'Recovery'],
      crossfit: ['CrossFit WOD', 'Strength', 'Running', 'Recovery'],
      triathlon: ['Swimming', 'Cycling', 'Running', 'Strength'],
      combat: ['Sport Practice', 'HIIT', 'Strength', 'Recovery'],
      team: ['Sport Practice', 'Strength', 'Running', 'Recovery'],
      calisthenics: ['Calisthenics', 'Strength', 'Yoga / Mobility', 'Recovery'],
      general: ['Strength', 'Running', 'HIIT', 'Yoga / Mobility'],
    }
    return suggestions[sport] || SESSION_TYPES.map(t => t.id)
  }

  const suggestedTypes = getSuggestedTypes()
  const currentType = SESSION_TYPES.find(t => t.id === form.type)

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">Training</h1>
        <p className="text-[#666] text-sm">Plan & log your sessions</p>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, i) => {
          const hasSesh = sessions.some(s => isSameDay(s.date, date))
          const isToday = isSameDay(date, today)
          const isSelected = isSameDay(date, selectedDay)
          return (
            <button key={i} onClick={() => setSelectedDay(date)}
              className={`flex flex-col items-center py-2 rounded-xl text-xs transition-all
                ${isSelected ? 'bg-[#00E5A0] text-black' : isToday
                  ? 'bg-[#1a1a1a] border border-[#00E5A0] text-white'
                  : 'bg-[#1a1a1a] text-[#666]'}`}>
              <span>{DAYS[i]}</span>
              <span className="font-bold">{date.getDate()}</span>
              {hasSesh && (
                <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-black' : 'bg-[#00E5A0]'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Day label + add button */}
      <div className="flex items-center justify-between">
        <p className="text-white font-medium">
          {isSameDay(selectedDay, today) ? 'Today'
            : new Date(selectedDay).toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'short'
              })}
        </p>
        <button onClick={() => { setShowForm(true); setExpandedSession(null) }}
          className="flex items-center gap-1 bg-[#00E5A0] text-black text-sm font-medium px-3 py-1.5 rounded-xl">
          <Plus size={14} /> Add session
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-[#666] text-sm">Loading sessions...</p>
        </div>
      )}

      {/* No sessions */}
      {!loading && todaySessions.length === 0 && !showForm && (
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] text-center">
          <p className="text-[#666] text-sm">No sessions logged for this day</p>
        </div>
      )}

      {/* Session cards */}
      {todaySessions.map(s => {
        const typeConfig = SESSION_TYPES.find(t => t.id === s.type) || SESSION_TYPES[0]
        return (
          <div key={s.id} className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden">
            <div className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{typeConfig.icon}</span>
                <div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${typeConfig.color}`}>
                    {s.type}
                  </span>
                  {s.rpe && <span className="text-[#666] text-xs ml-2">RPE {s.rpe}/10</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.duration && <span className="text-[#666] text-xs">{s.duration}min</span>}
                {s.distance && <span className="text-[#666] text-xs">{s.distance}km</span>}
                <button onClick={e => { e.stopPropagation(); deleteSession(s.id) }}
                  className="text-[#444] hover:text-red-400 p-1">
                  <X size={14} />
                </button>
                {expandedSession === s.id
                  ? <ChevronUp size={16} className="text-[#444]" />
                  : <ChevronDown size={16} className="text-[#444]" />}
              </div>
            </div>

            {expandedSession === s.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-[#2a2a2a] pt-3">
                {s.notes && <p className="text-[#999] text-sm">{s.notes}</p>}
                {s.muscle_groups && s.muscle_groups.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.muscle_groups.map(g => (
                      <span key={g} className="text-xs bg-[#2a2a2a] text-[#666] px-2 py-1 rounded-lg">{g}</span>
                    ))}
                  </div>
                )}
                {s.exercises && s.exercises.length > 0 && (
                  <div>
                    <p className="text-[#666] text-xs uppercase tracking-wider mb-2">Exercises</p>
                    {s.exercises.map((ex, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 border-b border-[#2a2a2a]">
                        <span className="text-white text-sm">{ex.name}</span>
                        <span className="text-[#666] text-xs">
                          {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}${ex.weight ? ` @ ${ex.weight}kg` : ''}` : ''}
                          {ex.duration ? `${ex.duration}min` : ''}
                          {ex.distance ? ` ${ex.distance}km` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {s.hyrox_stations && s.hyrox_stations.length > 0 && (
                  <div>
                    <p className="text-[#666] text-xs uppercase tracking-wider mb-2">Hyrox Stations</p>
                    {s.hyrox_stations.map((st, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 border-b border-[#2a2a2a]">
                        <span className="text-white text-sm">{st.name}</span>
                        <span className="text-[#00E5A0] text-xs font-medium">{st.time}</span>
                      </div>
                    ))}
                  </div>
                )}
                {s.ocr_obstacles && s.ocr_obstacles.length > 0 && (
                  <div>
                    <p className="text-[#666] text-xs uppercase tracking-wider mb-2">Obstacles</p>
                    {s.ocr_obstacles.map((ob, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 border-b border-[#2a2a2a]">
                        <span className="text-white text-sm">{ob.name}</span>
                        <span className={`text-xs ${ob.completed ? 'text-[#00E5A0]' : 'text-red-400'}`}>
                          {ob.completed ? '✓ Done' : '✗ Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Add session form */}
      {showForm && (
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-medium">New Session</p>
            <button onClick={() => { setShowForm(false); resetForm() }}>
              <X size={18} className="text-[#666]" />
            </button>
          </div>

          {/* Suggested types for your sport */}
          <div>
            <p className="text-[#666] text-xs mb-2">Suggested for {profile?.sport || 'your sport'}</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestedTypes.map(typeId => {
                const t = SESSION_TYPES.find(s => s.id === typeId)
                if (!t) return null
                return (
                  <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
                    className={`flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-medium transition-all
                      ${form.type === t.id ? t.color + ' ring-1 ring-current' : 'bg-[#2a2a2a] text-[#666]'}`}>
                    <span>{t.icon}</span> {t.id}
                  </button>
                )
              })}
            </div>
          </div>

          {/* All types expandable */}
          <details className="group">
            <summary className="text-[#666] text-xs cursor-pointer list-none flex items-center gap-1">
              <ChevronDown size={12} /> All workout types
            </summary>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SESSION_TYPES.map(t => (
                <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
                  className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition-all
                    ${form.type === t.id ? t.color + ' ring-1 ring-current' : 'bg-[#2a2a2a] text-[#666]'}`}>
                  <span>{t.icon}</span> {t.id}
                </button>
              ))}
            </div>
          </details>

          {/* Duration & Distance for cardio types */}
          {['Running', 'Cycling', 'Swimming', 'HIIT', 'CrossFit WOD', 'Sport Practice'].includes(form.type) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#666] text-xs mb-1 block">Duration (min)</label>
                <input type="number" placeholder="45" value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444]" />
              </div>
              <div>
                <label className="text-[#666] text-xs mb-1 block">Distance (km)</label>
                <input type="number" placeholder="10" value={form.distance}
                  onChange={e => setForm(f => ({ ...f, distance: e.target.value }))}
                  className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444]" />
              </div>
            </div>
          )}

          {/* Muscle groups for strength */}
          {['Strength', 'Calisthenics', 'CrossFit WOD'].includes(form.type) && (
            <div>
              <p className="text-[#666] text-xs mb-2">Muscle groups targeted</p>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map(g => (
                  <button key={g} onClick={() => toggleMuscleGroup(g)}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all
                      ${form.muscleGroups.includes(g)
                        ? 'bg-[#A78BFA] text-black font-medium'
                        : 'bg-[#2a2a2a] text-[#666]'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* RPE slider */}
          {!['Rest', 'Recovery'].includes(form.type) && (
            <div>
              <p className="text-[#666] text-xs mb-2">Effort (RPE) — {form.rpe}/10</p>
              <input type="range" min="1" max="10" value={form.rpe}
                onChange={e => setForm(f => ({ ...f, rpe: Number(e.target.value) }))}
                className="w-full accent-[#00E5A0]" />
              <div className="flex justify-between text-xs text-[#444] mt-1">
                <span>Easy</span><span>Moderate</span><span>Max effort</span>
              </div>
            </div>
          )}

          {/* Exercises for strength types */}
          {['Strength', 'Calisthenics', 'HIIT', 'CrossFit WOD'].includes(form.type) && (
            <div className="space-y-2">
              <p className="text-[#666] text-xs uppercase tracking-wider">Exercises</p>
              {form.exercises.map(ex => (
                <div key={ex.id} className="flex justify-between items-center bg-[#2a2a2a] rounded-xl px-3 py-2">
                  <span className="text-white text-sm">{ex.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#666] text-xs">
                      {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}${ex.weight ? ` @ ${ex.weight}kg` : ''}` : ''}
                      {ex.duration ? `${ex.duration}min` : ''}
                    </span>
                    <button onClick={() => setForm(f => ({ ...f, exercises: f.exercises.filter(e => e.id !== ex.id) }))}>
                      <X size={12} className="text-[#444]" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-[#2a2a2a] rounded-xl p-3 space-y-2">
                <input placeholder="Exercise name" value={newExercise.name}
                  onChange={e => setNewExercise(n => ({ ...n, name: e.target.value }))}
                  className="w-full bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="Sets" type="number" value={newExercise.sets}
                    onChange={e => setNewExercise(n => ({ ...n, sets: e.target.value }))}
                    className="bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                  <input placeholder="Reps" type="number" value={newExercise.reps}
                    onChange={e => setNewExercise(n => ({ ...n, reps: e.target.value }))}
                    className="bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                  <input placeholder="kg" type="number" value={newExercise.weight}
                    onChange={e => setNewExercise(n => ({ ...n, weight: e.target.value }))}
                    className="bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                </div>
                <button onClick={addExercise}
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#00E5A0] text-sm py-2 rounded-lg">
                  + Add exercise
                </button>
              </div>
            </div>
          )}

          {/* Hyrox stations */}
          {form.type === 'Hyrox' && (
            <div className="space-y-2">
              <p className="text-[#666] text-xs uppercase tracking-wider">Hyrox Stations</p>
              {form.hyroxStations.map(st => (
                <div key={st.id} className="flex justify-between items-center bg-[#2a2a2a] rounded-xl px-3 py-2">
                  <span className="text-white text-sm">{st.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#00E5A0] text-xs">{st.time}</span>
                    <button onClick={() => setForm(f => ({ ...f, hyroxStations: f.hyroxStations.filter(s => s.id !== st.id) }))}>
                      <X size={12} className="text-[#444]" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-[#2a2a2a] rounded-xl p-3 space-y-2">
                <select value={newStation.name}
                  onChange={e => setNewStation(n => ({ ...n, name: e.target.value }))}
                  className="w-full bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none">
                  {HYROX_STATIONS.map(s => <option key={s}>{s}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Time (e.g. 4:32)" value={newStation.time}
                    onChange={e => setNewStation(n => ({ ...n, time: e.target.value }))}
                    className="bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                  <input placeholder="Notes" value={newStation.notes}
                    onChange={e => setNewStation(n => ({ ...n, notes: e.target.value }))}
                    className="bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                </div>
                <button onClick={addStation}
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#00E5A0] text-sm py-2 rounded-lg">
                  + Add station
                </button>
              </div>
            </div>
          )}

          {/* OCR obstacles */}
          {form.type === 'OCR Training' && (
            <div className="space-y-2">
              <p className="text-[#666] text-xs uppercase tracking-wider">Obstacles</p>
              {form.ocrObstacles.map(ob => (
                <div key={ob.id} className="flex justify-between items-center bg-[#2a2a2a] rounded-xl px-3 py-2">
                  <span className="text-white text-sm">{ob.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${ob.completed ? 'text-[#00E5A0]' : 'text-red-400'}`}>
                      {ob.completed ? '✓' : '✗'}
                    </span>
                    <button onClick={() => setForm(f => ({ ...f, ocrObstacles: f.ocrObstacles.filter(o => o.id !== ob.id) }))}>
                      <X size={12} className="text-[#444]" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-[#2a2a2a] rounded-xl p-3 space-y-2">
                <select value={newObstacle.name}
                  onChange={e => setNewObstacle(n => ({ ...n, name: e.target.value }))}
                  className="w-full bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none">
                  {OCR_OBSTACLES.map(o => <option key={o}>{o}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setNewObstacle(n => ({ ...n, completed: !n.completed }))}
                    className={`py-2 rounded-lg text-xs font-medium transition-all
                      ${newObstacle.completed ? 'bg-[#00E5A0] text-black' : 'bg-[#1a1a1a] text-red-400 border border-red-900'}`}>
                    {newObstacle.completed ? '✓ Completed' : '✗ Failed'}
                  </button>
                  <input placeholder="Notes" value={newObstacle.notes}
                    onChange={e => setNewObstacle(n => ({ ...n, notes: e.target.value }))}
                    className="bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                </div>
                <button onClick={addObstacle}
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#FF6B35] text-sm py-2 rounded-lg">
                  + Add obstacle
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          <textarea placeholder="Session notes (optional)" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444] resize-none" />

          {/* Save */}
          <button onClick={saveSession} disabled={saving}
            className="w-full bg-[#00E5A0] text-black font-medium py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
            <Check size={16} />
            {saving ? 'Saving...' : 'Save Session'}
          </button>
        </div>
      )}
    </div>
  )
}