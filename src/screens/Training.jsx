import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp, Check, X, Dumbbell, Heart, Target } from 'lucide-react'
import { supabase } from '../lib/supabase'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const CATEGORIES = [
  { id: 'Strength', icon: '🏋️', color: '#A78BFA', bg: '#1a1535', label: 'Strength' },
  { id: 'Cardio', icon: '🏃', color: '#3B9EFF', bg: '#0d1f35', label: 'Cardio' },
  { id: 'Core', icon: '🎯', color: '#00E5A0', bg: '#0d2d1f', label: 'Core' },
]

const EXERCISES = {
  Strength: {
    Chest: [
      'Flat Bench Press', 'Incline Bench Press', 'Decline Bench Press',
      'Dumbbell Chest Press', 'Incline Dumbbell Press', 'Chest Flyes',
      'Cable Crossover', 'Pec Deck Machine', 'Push Ups', 'Dips',
    ],
    Back: [
      'Deadlift', 'Barbell Row', 'Dumbbell Row', 'Lat Pulldown',
      'Seated Cable Row', 'T-Bar Row', 'Face Pulls', 'Pull Ups',
      'Chin Ups', 'Rack Pull', 'Good Morning',
    ],
    Shoulders: [
      'Overhead Press (Barbell)', 'Dumbbell Shoulder Press', 'Arnold Press',
      'Lateral Raises', 'Front Raises', 'Rear Delt Flyes', 'Upright Row',
      'Shrugs', 'Cable Lateral Raises',
    ],
    Legs: [
      'Barbell Squat', 'Front Squat', 'Leg Press', 'Romanian Deadlift',
      'Leg Curl', 'Leg Extension', 'Bulgarian Split Squat', 'Lunges',
      'Hack Squat', 'Calf Raises', 'Sumo Squat', 'Step Ups',
    ],
    Biceps: [
      'Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl',
      'Cable Curl', 'Incline Dumbbell Curl', 'Concentration Curl',
      'Reverse Curl', 'Spider Curl',
    ],
    Triceps: [
      'Tricep Pushdown', 'Skull Crushers', 'Overhead Tricep Extension',
      'Close Grip Bench Press', 'Dips', 'Kickbacks', 'Cable Overhead Extension',
    ],
    'Full Body': [
      'Power Clean', 'Clean and Press', 'Thruster', 'Farmers Walk',
      'Sled Push', 'Kettlebell Swing', 'Turkish Get Up', 'Battle Ropes',
    ],
  },
  Cardio: {
    Running: [
      'Easy Run', 'Tempo Run', 'Interval Run', 'Long Run',
      'Hill Run', 'Fartlek', 'Sprint Session', 'Recovery Jog',
    ],
    Cycling: [
      'Steady State Ride', 'Interval Cycling', 'Hill Climb', 'Recovery Ride',
      'Spin Class', 'Indoor Cycling',
    ],
    Rowing: [
      'Steady State Row', 'Interval Row', '500m Row', '1000m Row',
      '2000m Row', 'SkiErg',
    ],
    Other: [
      'Jump Rope', 'Stairmaster', 'Elliptical', 'Swimming Laps',
      'Box Jumps', 'Assault Bike', 'Treadmill Incline Walk',
    ],
  },
  Core: {
    Abs: [
      'Crunches', 'Bicycle Crunches', 'Reverse Crunches', 'Sit Ups',
      'V Ups', 'Toe Touches', 'Russian Twist', 'Dead Bug',
    ],
    Planks: [
      'Plank', 'Side Plank', 'Hollow Hold', 'RKC Plank',
      'Plank with Reach', 'Bear Crawl', 'Stir the Pot',
    ],
    'Lower Abs': [
      'Leg Raises', 'Hanging Leg Raises', 'Flutter Kicks', 'Scissor Kicks',
      'Dragon Flag', 'Ab Wheel Rollout', 'Mountain Climbers',
    ],
    Stability: [
      'Bird Dog', 'Pallof Press', 'Suitcase Carry', 'Single Leg RDL',
      'Glute Bridge', 'Hip Thrust', 'Cable Woodchop',
    ],
  },
}

const MUSCLE_GROUPS = {
  Strength: ['Chest', 'Back', 'Shoulders', 'Legs', 'Biceps', 'Triceps', 'Full Body'],
  Cardio: ['Running', 'Cycling', 'Rowing', 'Other'],
  Core: ['Abs', 'Planks', 'Lower Abs', 'Stability'],
}

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
  const [selectedDay, setSelectedDay] = useState(today)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedSession, setExpandedSession] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Strength')
  const [activeMuscleGroup, setActiveMuscleGroup] = useState('Chest')
  const [exercises, setExercises] = useState([])
  const [notes, setNotes] = useState('')
  const [rpe, setRpe] = useState(7)
  const [sessionDuration, setSessionDuration] = useState('')

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

  function addExercise(name) {
    if (exercises.find(e => e.name === name)) return
    const isCardio = activeCategory === 'Cardio'
    const isCore = activeCategory === 'Core'
    setExercises(prev => [...prev, {
      id: Date.now(),
      name,
      category: activeCategory,
      muscleGroup: activeMuscleGroup,
      sets: isCardio || isCore ? '' : [{ reps: '', weight: '' }],
      duration: isCardio ? '' : '',
      distance: isCardio ? '' : '',
      isCardio,
      isCore,
    }])
  }

  function removeExercise(id) {
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  function addSet(exerciseId) {
    setExercises(prev => prev.map(e =>
      e.id === exerciseId
        ? { ...e, sets: [...e.sets, { reps: '', weight: '' }] }
        : e
    ))
  }

  function updateSet(exerciseId, setIndex, field, value) {
    setExercises(prev => prev.map(e =>
      e.id === exerciseId
        ? {
            ...e, sets: e.sets.map((s, i) =>
              i === setIndex ? { ...s, [field]: value } : s
            )
          }
        : e
    ))
  }

  function updateExerciseField(exerciseId, field, value) {
    setExercises(prev => prev.map(e =>
      e.id === exerciseId ? { ...e, [field]: value } : e
    ))
  }

  async function saveSession() {
    if (exercises.length === 0) return
    setSaving(true)
    const sessionData = {
      user_id: session.user.id,
      date: selectedDay,
      type: activeCategory,
      notes,
      rpe,
      duration: sessionDuration,
      exercises: exercises.map(ex => ({
        name: ex.name,
        category: ex.category,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets,
        duration: ex.duration,
        distance: ex.distance,
      })),
      hyrox_stations: [],
      muscle_groups: [...new Set(exercises.map(e => e.muscleGroup))],
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
    setExercises([])
    setNotes('')
    setRpe(7)
    setSessionDuration('')
    setActiveCategory('Strength')
    setActiveMuscleGroup('Chest')
  }

  const muscleGroups = MUSCLE_GROUPS[activeCategory] || []
  const exerciseList = EXERCISES[activeCategory]?.[activeMuscleGroup] || []

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">Training</h1>
        <p className="text-[#666] text-sm">Log your sessions</p>
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
                ${isSelected ? 'bg-[#00E5A0] text-black'
                  : isToday ? 'bg-[#1a1a1a] border border-[#00E5A0] text-white'
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
          <p className="text-[#444] text-xs mt-1">Tap + Add session to get started</p>
        </div>
      )}

      {/* Session cards */}
      {todaySessions.map(s => {
        const cat = CATEGORIES.find(c => c.id === s.type) || CATEGORIES[0]
        return (
          <div key={s.id} className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden">
            <div className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="text-white font-medium text-sm">{s.type}</p>
                  <div className="flex gap-2 mt-0.5">
                    {s.duration && <span className="text-[#666] text-xs">{s.duration}min</span>}
                    {s.rpe && <span className="text-[#666] text-xs">RPE {s.rpe}/10</span>}
                    <span className="text-[#666] text-xs">{(s.exercises || []).length} exercises</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
              <div className="px-4 pb-4 border-t border-[#2a2a2a] pt-3 space-y-3">
                {s.notes && <p className="text-[#999] text-sm italic">"{s.notes}"</p>}
                {(s.exercises || []).map((ex, i) => (
                  <div key={i} className="bg-[#2a2a2a] rounded-xl p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-white text-sm font-medium">{ex.name}</p>
                      <span className="text-[#666] text-xs">{ex.muscleGroup}</span>
                    </div>
                    {ex.isCardio ? (
                      <p className="text-[#3B9EFF] text-xs">
                        {ex.duration ? `${ex.duration} min` : ''}
                        {ex.distance ? ` · ${ex.distance} km` : ''}
                      </p>
                    ) : ex.isCore ? (
                      <p className="text-[#00E5A0] text-xs">
                        {ex.duration ? `${ex.duration} sec hold` : ''}
                        {ex.sets && Array.isArray(ex.sets) ? `${ex.sets.length} sets` : ''}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {(ex.sets || []).map((set, si) => (
                          <div key={si} className="flex gap-3 text-xs">
                            <span className="text-[#444]">Set {si + 1}</span>
                            <span className="text-white">{set.reps} reps</span>
                            {set.weight && <span className="text-[#A78BFA]">@ {set.weight}kg</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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

          {/* Category selector */}
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id)
                  setActiveMuscleGroup(MUSCLE_GROUPS[cat.id][0])
                  setExercises([])
                }}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all"
                style={{
                  background: activeCategory === cat.id ? cat.bg : '#2a2a2a',
                  borderColor: activeCategory === cat.id ? cat.color : '#3a3a3a',
                }}>
                <span className="text-xl">{cat.icon}</span>
                <span className="text-xs font-medium"
                  style={{ color: activeCategory === cat.id ? cat.color : '#666' }}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>

          {/* Muscle group / subcategory tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {muscleGroups.map(group => (
              <button key={group}
                onClick={() => setActiveMuscleGroup(group)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all
                  ${activeMuscleGroup === group ? 'bg-[#00E5A0] text-black' : 'bg-[#2a2a2a] text-[#666]'}`}>
                {group}
              </button>
            ))}
          </div>

          {/* Exercise list */}
          <div>
            <p className="text-[#666] text-xs mb-2">Tap to add exercises</p>
            <div className="flex flex-wrap gap-2">
              {exerciseList.map(name => {
                const isAdded = exercises.find(e => e.name === name)
                return (
                  <button key={name} onClick={() => addExercise(name)}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all border
                      ${isAdded
                        ? 'bg-[#00E5A0] text-black border-[#00E5A0] font-medium'
                        : 'bg-[#2a2a2a] text-[#666] border-[#3a3a3a]'}`}>
                    {isAdded ? '✓ ' : '+ '}{name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Added exercises with sets */}
          {exercises.length > 0 && (
            <div className="space-y-3">
              <p className="text-[#666] text-xs uppercase tracking-wider">Your exercises</p>
              {exercises.map(ex => (
                <div key={ex.id} className="bg-[#2a2a2a] rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">{ex.name}</p>
                      <p className="text-[#666] text-xs">{ex.muscleGroup}</p>
                    </div>
                    <button onClick={() => removeExercise(ex.id)}>
                      <X size={14} className="text-[#444]" />
                    </button>
                  </div>

                  {/* Cardio fields */}
                  {ex.isCardio && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[#666] text-xs">Duration (min)</label>
                        <input type="number" placeholder="30" value={ex.duration}
                          onChange={e => updateExerciseField(ex.id, 'duration', e.target.value)}
                          className="w-full bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444] mt-1" />
                      </div>
                      <div>
                        <label className="text-[#666] text-xs">Distance (km)</label>
                        <input type="number" placeholder="5" value={ex.distance}
                          onChange={e => updateExerciseField(ex.id, 'distance', e.target.value)}
                          className="w-full bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444] mt-1" />
                      </div>
                    </div>
                  )}

                  {/* Core fields */}
                  {ex.isCore && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[#666] text-xs">Sets</label>
                        <input type="number" placeholder="3" value={ex.setsCount}
                          onChange={e => updateExerciseField(ex.id, 'setsCount', e.target.value)}
                          className="w-full bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444] mt-1" />
                      </div>
                      <div>
                        <label className="text-[#666] text-xs">Reps / Duration (sec)</label>
                        <input type="number" placeholder="30" value={ex.duration}
                          onChange={e => updateExerciseField(ex.id, 'duration', e.target.value)}
                          className="w-full bg-[#1a1a1a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444] mt-1" />
                      </div>
                    </div>
                  )}

                  {/* Strength sets */}
                  {!ex.isCardio && !ex.isCore && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1 text-xs text-[#666] px-1">
                        <span>Set</span><span>Reps</span><span>Weight (kg)</span>
                      </div>
                      {(ex.sets || []).map((set, si) => (
                        <div key={si} className="grid grid-cols-3 gap-1 items-center">
                          <span className="text-[#666] text-xs text-center bg-[#1a1a1a] rounded-lg py-2">
                            {si + 1}
                          </span>
                          <input type="number" placeholder="12" value={set.reps}
                            onChange={e => updateSet(ex.id, si, 'reps', e.target.value)}
                            className="bg-[#1a1a1a] text-white text-sm rounded-lg px-2 py-2 outline-none placeholder-[#444] text-center" />
                          <input type="number" placeholder="50" value={set.weight}
                            onChange={e => updateSet(ex.id, si, 'weight', e.target.value)}
                            className="bg-[#1a1a1a] text-white text-sm rounded-lg px-2 py-2 outline-none placeholder-[#444] text-center" />
                        </div>
                      ))}
                      <button onClick={() => addSet(ex.id)}
                        className="w-full text-xs text-[#00E5A0] border border-dashed border-[#00E5A0]/30 py-1.5 rounded-xl">
                        + Add set
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Session details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#666] text-xs mb-1 block">Session duration (min)</label>
              <input type="number" placeholder="60" value={sessionDuration}
                onChange={e => setSessionDuration(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444]" />
            </div>
            <div>
              <label className="text-[#666] text-xs mb-1 block">RPE — {rpe}/10</label>
              <input type="range" min="1" max="10" value={rpe}
                onChange={e => setRpe(Number(e.target.value))}
                className="w-full accent-[#00E5A0] mt-2" />
            </div>
          </div>

          <textarea placeholder="Session notes (optional)" value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444] resize-none" />

          <button onClick={saveSession} disabled={saving || exercises.length === 0}
            className="w-full bg-[#00E5A0] text-black font-medium py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
            <Check size={16} />
            {saving ? 'Saving...' : exercises.length === 0 ? 'Add at least one exercise' : `Save Session (${exercises.length} exercises)`}
          </button>
        </div>
      )}
    </div>
  )
}