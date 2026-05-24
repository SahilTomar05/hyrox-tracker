import { useState, useEffect } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Check, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Sport-aware workout categories
const SPORT_WORKOUTS = {
  hyrox: {
    categories: ['Hyrox Stations', 'Strength', 'Running', 'HIIT', 'Recovery', 'Custom'],
    exercises: {
      'Hyrox Stations': ['SkiErg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump', 'Row Erg', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls'],
      'Strength': ['Deadlift', 'Squat', 'Bench Press', 'Overhead Press', 'Pull Ups', 'Dips', 'Lunges', 'Romanian Deadlift'],
      'Running': ['Easy Run', 'Tempo Run', 'Interval Run', 'Long Run', 'Hill Run', 'Sprint Session'],
      'HIIT': ['Burpees', 'Box Jumps', 'Kettlebell Swings', 'Battle Ropes', 'Assault Bike', 'Jump Rope'],
      'Recovery': ['Foam Rolling', 'Stretching', 'Yoga', 'Ice Bath', 'Walk'],
    }
  },
  marathon: {
    categories: ['Running', 'Strength', 'Mobility', 'Cross Training', 'Recovery', 'Custom'],
    exercises: {
      'Running': ['Easy Run', 'Tempo Run', 'Long Run', 'Interval Run', 'Hill Run', 'Fartlek', 'Recovery Jog', 'Sprint Session'],
      'Strength': ['Squats', 'Lunges', 'Deadlift', 'Calf Raises', 'Glute Bridge', 'Single Leg RDL', 'Step Ups'],
      'Mobility': ['Hip Flexor Stretch', 'IT Band Stretch', 'Hamstring Stretch', 'Yoga Flow', 'Foam Rolling'],
      'Cross Training': ['Cycling', 'Swimming', 'Elliptical', 'Rowing'],
      'Recovery': ['Ice Bath', 'Compression', 'Massage', 'Walk', 'Rest'],
    }
  },
  bodybuilding: {
    categories: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Custom'],
    exercises: {
      'Chest': ['Flat Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Dumbbell Chest Press', 'Incline Dumbbell Press', 'Chest Flyes', 'Cable Crossover', 'Pec Deck', 'Push Ups', 'Dips'],
      'Back': ['Deadlift', 'Barbell Row', 'Dumbbell Row', 'Lat Pulldown', 'Seated Cable Row', 'T-Bar Row', 'Face Pulls', 'Pull Ups', 'Chin Ups'],
      'Legs': ['Barbell Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl', 'Leg Extension', 'Bulgarian Split Squat', 'Lunges', 'Hack Squat', 'Calf Raises'],
      'Shoulders': ['Overhead Press', 'Dumbbell Shoulder Press', 'Arnold Press', 'Lateral Raises', 'Front Raises', 'Rear Delt Flyes', 'Shrugs'],
      'Arms': ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl', 'Tricep Pushdown', 'Skull Crushers', 'Overhead Tricep Extension', 'Close Grip Bench'],
      'Core': ['Crunches', 'Plank', 'Russian Twist', 'Leg Raises', 'Ab Wheel Rollout', 'Cable Woodchop'],
      'Cardio': ['Treadmill', 'Cycling', 'Stairmaster', 'Elliptical', 'Jump Rope'],
    }
  },
  crossfit: {
    categories: ['WOD', 'Strength', 'Olympic Lifting', 'Gymnastics', 'Cardio', 'Custom'],
    exercises: {
      'WOD': ['Fran', 'Cindy', 'Murph', 'Grace', 'Helen', 'Jackie', 'Custom WOD'],
      'Strength': ['Back Squat', 'Front Squat', 'Deadlift', 'Press', 'Bench Press', 'Strict Pull Up'],
      'Olympic Lifting': ['Clean', 'Snatch', 'Clean & Jerk', 'Power Clean', 'Hang Clean', 'Push Press', 'Push Jerk'],
      'Gymnastics': ['Pull Ups', 'Muscle Ups', 'Handstand Push Up', 'Toes to Bar', 'Ring Dips', 'Box Jumps', 'Double Unders'],
      'Cardio': ['Row Erg', 'Assault Bike', 'SkiErg', 'Run', 'Jump Rope'],
    }
  },
  cycling: {
    categories: ['Road Ride', 'Indoor Cycling', 'Strength', 'Mobility', 'Recovery', 'Custom'],
    exercises: {
      'Road Ride': ['Steady State Ride', 'Interval Ride', 'Hill Climb', 'Recovery Ride', 'Long Ride', 'Race Simulation'],
      'Indoor Cycling': ['Zwift Session', 'Trainer Ride', 'Interval Trainer', 'FTP Test'],
      'Strength': ['Squats', 'Leg Press', 'Deadlift', 'Calf Raises', 'Core Work', 'Hip Flexor Work'],
      'Mobility': ['Hip Flexor Stretch', 'Quad Stretch', 'Foam Rolling', 'Yoga'],
      'Recovery': ['Easy Spin', 'Walk', 'Stretching', 'Massage'],
    }
  },
  triathlon: {
    categories: ['Swim', 'Bike', 'Run', 'Brick', 'Strength', 'Recovery', 'Custom'],
    exercises: {
      'Swim': ['Freestyle Laps', 'Open Water Swim', 'Drill Work', 'Pull Buoy', 'Kick Set', 'Interval Swim'],
      'Bike': ['Steady Ride', 'Interval Ride', 'Hill Climb', 'Recovery Ride', 'Long Ride'],
      'Run': ['Easy Run', 'Tempo Run', 'Long Run', 'Interval Run', 'Brick Run'],
      'Brick': ['Bike + Run', 'Swim + Bike', 'Full Brick Session'],
      'Strength': ['Squats', 'Core Work', 'Hip Work', 'Upper Body'],
      'Recovery': ['Stretching', 'Foam Rolling', 'Easy Swim', 'Walk'],
    }
  },
  ocr: {
    categories: ['OCR Training', 'Running', 'Strength', 'Grip Training', 'Obstacle Practice', 'Custom'],
    exercises: {
      'OCR Training': ['Devil Circuit Simulation', 'Yodha Race Prep', 'Spartan Training', 'Full OCR Practice'],
      'Running': ['Trail Run', 'Hill Run', 'Interval Run', 'Long Run', 'Recovery Jog'],
      'Strength': ['Deadlift', 'Pull Ups', 'Carries', 'Sandbag Work', 'Tire Flips', 'Sled Push'],
      'Grip Training': ['Dead Hangs', 'Monkey Bars', 'Rope Climb', 'Towel Pull Ups', 'Farmer Carries'],
      'Obstacle Practice': ['Rope Climb', 'Wall Climb', 'Spear Throw', 'Barbed Wire Crawl', 'Atlas Stone'],
    }
  },
  combat: {
    categories: ['Sparring', 'Pad Work', 'Bag Work', 'Conditioning', 'Strength', 'Recovery', 'Custom'],
    exercises: {
      'Sparring': ['Boxing Sparring', 'MMA Sparring', 'Kickboxing Sparring', 'Grappling', 'Wrestling'],
      'Pad Work': ['Boxing Combos', 'Kickboxing Combos', 'Muay Thai Combos', 'Defense Drills'],
      'Bag Work': ['Heavy Bag', 'Speed Bag', 'Double End Bag', 'Maize Bag'],
      'Conditioning': ['Roadwork', 'Jump Rope', 'Burpees', 'Sprints', 'Circuit Training'],
      'Strength': ['Squats', 'Deadlift', 'Pull Ups', 'Core Work', 'Explosive Work'],
      'Recovery': ['Light Bag Work', 'Stretching', 'Sauna', 'Ice Bath'],
    }
  },
  team: {
    categories: ['Sport Practice', 'Fitness', 'Strength', 'Agility', 'Recovery', 'Custom'],
    exercises: {
      'Sport Practice': ['Drills', 'Scrimmage', 'Shooting Practice', 'Passing Drills', 'Team Training'],
      'Fitness': ['Sprints', 'Interval Runs', 'Agility Ladder', 'Shuttle Runs', 'Beep Test'],
      'Strength': ['Squats', 'Deadlift', 'Bench Press', 'Pull Ups', 'Core Work'],
      'Agility': ['Cone Drills', 'Ladder Drills', 'Box Drills', 'Zig Zag Runs'],
      'Recovery': ['Cool Down', 'Stretching', 'Foam Rolling', 'Ice Bath'],
    }
  },
  calisthenics: {
    categories: ['Push', 'Pull', 'Legs', 'Core', 'Skills', 'Conditioning', 'Custom'],
    exercises: {
      'Push': ['Push Ups', 'Pike Push Ups', 'Dips', 'Handstand Push Ups', 'Archer Push Ups', 'Diamond Push Ups'],
      'Pull': ['Pull Ups', 'Chin Ups', 'Muscle Ups', 'Australian Pull Ups', 'L-Sit Pull Ups', 'Archer Pull Ups'],
      'Legs': ['Squats', 'Pistol Squats', 'Jump Squats', 'Lunges', 'Calf Raises', 'Nordic Curls'],
      'Core': ['Plank', 'L-Sit', 'Dragon Flag', 'Ab Wheel', 'Leg Raises', 'Human Flag Progression'],
      'Skills': ['Handstand', 'Front Lever', 'Back Lever', 'Planche Progression', 'Human Flag', 'Muscle Up'],
      'Conditioning': ['Burpees', 'Jump Rope', 'Box Jumps', 'Sprint', 'Circuit Training'],
    }
  },
  general: {
    categories: ['Strength', 'Cardio', 'Core', 'Yoga / Mobility', 'HIIT', 'Recovery', 'Custom'],
    exercises: {
      'Strength': ['Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Pull Ups', 'Rows', 'Lunges'],
      'Cardio': ['Running', 'Cycling', 'Swimming', 'Rowing', 'Jump Rope', 'Elliptical'],
      'Core': ['Plank', 'Crunches', 'Russian Twist', 'Leg Raises', 'Ab Wheel'],
      'Yoga / Mobility': ['Sun Salutation', 'Hip Flexor Stretch', 'Hamstring Stretch', 'Foam Rolling'],
      'HIIT': ['Burpees', 'Box Jumps', 'Mountain Climbers', 'Jumping Jacks', 'High Knees'],
      'Recovery': ['Walk', 'Stretching', 'Foam Rolling', 'Massage', 'Rest'],
    }
  },
}

// Default fallback
const DEFAULT_WORKOUTS = SPORT_WORKOUTS.general

function getWorkoutsForSport(sport) {
  return SPORT_WORKOUTS[sport] || DEFAULT_WORKOUTS
}

// Field type based on exercise
function getFieldType(category, exerciseName) {
  const cardioCategories = ['Running', 'Cardio', 'Road Ride', 'Indoor Cycling', 'Swim', 'Bike', 'Run']
  const timedCategories = ['Recovery', 'Mobility', 'Yoga / Mobility', 'WOD']
  const stationCategories = ['Hyrox Stations', 'OCR Training', 'Obstacle Practice', 'Grip Training']
  if (stationCategories.includes(category)) return 'station'
  if (cardioCategories.includes(category)) return 'cardio'
  if (timedCategories.includes(category)) return 'timed'
  return 'strength'
}

// Sarcastic score based on session
function getSarcasticScore(exercises, rpe, duration) {
  let score = 0
  let reasons = []

  // Volume score
  const totalSets = exercises.reduce((s, e) => s + (e.sets?.length || 1), 0)
  if (totalSets >= 20) { score += 30; reasons.push('solid volume') }
  else if (totalSets >= 12) { score += 20; reasons.push('decent volume') }
  else if (totalSets >= 6) { score += 10; reasons.push('light volume') }
  else { score += 0; reasons.push('barely any sets') }

  // RPE score
  if (rpe >= 8) { score += 30; reasons.push('high effort') }
  else if (rpe >= 6) { score += 20; reasons.push('moderate effort') }
  else if (rpe >= 4) { score += 10; reasons.push('easy effort') }
  else { score += 0; reasons.push('vacation effort') }

  // Duration score
  const dur = Number(duration) || 0
  if (dur >= 60) { score += 25; reasons.push('good duration') }
  else if (dur >= 40) { score += 15; reasons.push('ok duration') }
  else if (dur >= 20) { score += 8; reasons.push('short session') }
  else { score += 0; reasons.push('warmup-length session') }

  // Exercise variety
  if (exercises.length >= 6) { score += 15; }
  else if (exercises.length >= 3) { score += 8; }

  score = Math.min(score, 100)

  let roast = ''
  let color = '#FF5A1F'
  let emoji = '😤'

  if (score >= 85) {
    roast = `${score}/100. Okay fine, that was actually impressive. Don't let it go to your head.`
    color = '#22C55E'; emoji = '🔥'
  } else if (score >= 70) {
    roast = `${score}/100. Solid session. Not amazing, not terrible. The participation trophy of workouts.`
    color = '#3B82F6'; emoji = '💪'
  } else if (score >= 50) {
    roast = `${score}/100. You showed up, I'll give you that. But your grandma's morning walk had more intensity.`
    color = '#FF8C42'; emoji = '😐'
  } else if (score >= 30) {
    roast = `${score}/100. That was a workout? My plants get more exercise swaying in the breeze. Try harder.`
    color = '#FF5A1F'; emoji = '😬'
  } else {
    roast = `${score}/100. Stop. Just stop. Uninstall the app, do some Zumba, come back when you're serious.`
    color = '#EF4444'; emoji = '💀'
  }

  return { score, roast, color, emoji }
}

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((day + 6) % 7))
  // Show last 7 days from today
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d
  })
}

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0]
}

export default function Training({ session, profile }) {
  const weekDates = getWeekDates()
  const today = new Date()
  const sport = profile?.sport || 'general'
  const workouts = getWorkoutsForSport(sport)

  const [selectedDay, setSelectedDay] = useState(today)
  const [sessions, setSessions] = useState([])
  const [customExercises, setCustomExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedSession, setExpandedSession] = useState(null)
  const [saving, setSaving] = useState(false)
  const [scoreModal, setScoreModal] = useState(null)

  // Form state
  const [activeCategory, setActiveCategory] = useState(workouts.categories[0])
  const [exercises, setExercises] = useState([])
  const [notes, setNotes] = useState('')
  const [rpe, setRpe] = useState(7)
  const [sessionDuration, setSessionDuration] = useState('')

  // Custom exercise modal
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [savingCustom, setSavingCustom] = useState(false)

  useEffect(() => {
    fetchSessions()
    fetchCustomExercises()
  }, [])

  async function fetchSessions() {
    setLoading(true)
    const { data } = await supabase
      .from('sessions').select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
    if (data) setSessions(data)
    setLoading(false)
  }

  async function fetchCustomExercises() {
    const { data } = await supabase
      .from('custom_exercises').select('*')
      .eq('user_id', session.user.id)
    if (data) setCustomExercises(data)
  }

  const todaySessions = sessions.filter(s => isSameDay(s.date, selectedDay))

  // Get exercises for current category including custom ones
  function getExercisesForCategory(category) {
    const builtin = workouts.exercises?.[category] || []
    const custom = customExercises
      .filter(e => e.category === category || e.sport_type === sport)
      .map(e => e.name)
    return [...builtin, ...custom]
  }

  function addExercise(name) {
    if (exercises.find(e => e.name === name)) return
    const fieldType = getFieldType(activeCategory, name)
    setExercises(prev => [...prev, {
      id: Date.now(),
      name,
      category: activeCategory,
      fieldType,
      sets: fieldType === 'strength' ? [{ reps: '', weight: '' }] : [],
      duration: '',
      distance: '',
      pace: '',
      stationTime: '',
      setsCount: '',
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

  function removeSet(exerciseId, setIndex) {
    setExercises(prev => prev.map(e =>
      e.id === exerciseId
        ? { ...e, sets: e.sets.filter((_, i) => i !== setIndex) }
        : e
    ))
  }

  function updateSet(exerciseId, setIndex, field, value) {
    setExercises(prev => prev.map(e =>
      e.id === exerciseId
        ? { ...e, sets: e.sets.map((s, i) => i === setIndex ? { ...s, [field]: value } : s) }
        : e
    ))
  }

  function updateExercise(id, field, value) {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  async function saveCustomExercise() {
    if (!customName.trim()) return
    setSavingCustom(true)
    const cat = customCategory || activeCategory
    const { data } = await supabase.from('custom_exercises').insert({
      user_id: session.user.id,
      name: customName.trim(),
      sport_type: sport,
      category: cat,
    }).select().single()
    if (data) {
      setCustomExercises(prev => [...prev, data])
      addExercise(customName.trim())
    }
    setCustomName('')
    setCustomCategory('')
    setSavingCustom(false)
    setShowCustomModal(false)
  }

  async function deleteCustomExercise(id) {
    await supabase.from('custom_exercises').delete().eq('id', id)
    setCustomExercises(prev => prev.filter(e => e.id !== id))
  }

  async function saveSession() {
    if (exercises.length === 0) return
    setSaving(true)
    const result = getSarcasticScore(exercises, rpe, sessionDuration)
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
        fieldType: ex.fieldType,
        sets: ex.sets,
        duration: ex.duration,
        distance: ex.distance,
        pace: ex.pace,
        stationTime: ex.stationTime,
        setsCount: ex.setsCount,
      })),
      hyrox_stations: [],
      muscle_groups: [...new Set(exercises.map(e => e.category))],
    }
    const { data, error } = await supabase
      .from('sessions').insert(sessionData).select().single()
    if (!error && data) {
      setSessions(prev => [data, ...prev])
      setScoreModal(result)
    }
    setSaving(false)
    setShowForm(false)
    resetForm()
  }

  async function deleteSession(id) {
    if (!confirm('Delete this session?')) return
    await supabase.from('sessions').delete().eq('id', id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  function resetForm() {
  setExercises([])
  setNotes('')
  setRpe(7)
  setSessionDuration('')
  setActiveCategory(workouts.categories[0])
  }

  const exerciseList = getExercisesForCategory(activeCategory)

  const c = {
    page: { paddingTop: 52 },
    header: { padding: '0 16px 14px' },
    title: { fontSize: 22, fontWeight: 700 },
    sub: { fontSize: 13, color: '#666', marginTop: 2 },
    card: { margin: '0 16px 12px', background: '#131313', border: '1px solid #222', borderRadius: 18, padding: 16 },
    label: { fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 },
    input: { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none' },
    btn: { background: '#FF5A1F', border: 'none', borderRadius: 12, padding: '12px 20px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  }

  return (
    <div style={c.page}>

      {/* Score Modal */}
      {scoreModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setScoreModal(null)}>
          <div style={{ background: '#111', border: `1px solid ${scoreModal.color}40`, borderRadius: 24, padding: 28, width: '100%', maxWidth: 360, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{scoreModal.emoji}</div>
            <div style={{ fontSize: 64, fontWeight: 700, color: scoreModal.color, lineHeight: 1, marginBottom: 6 }}>
              {scoreModal.score}
            </div>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Training Score</p>
            <div style={{ background: '#1a1a1a', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.6 }}>{scoreModal.roast}</p>
            </div>
            <button onClick={() => setScoreModal(null)}
              style={{ ...c.btn, width: '100%', padding: 14 }}>
              Got it 😤
            </button>
          </div>
        </div>
      )}

      {/* Custom Exercise Modal */}
      {showCustomModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowCustomModal(false)}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 420 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2, margin: '0 auto 20px' }} />
            <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Add custom exercise</p>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
              It'll be saved to your library for next time under <span style={{ color: '#FF5A1F' }}>{activeCategory}</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ ...c.label, marginBottom: 6 }}>Exercise name</p>
                <input
                  placeholder={`e.g. Freestyle Drill, Breakdance Footwork...`}
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  style={c.input}
                  autoFocus
                />
              </div>
              <div>
                <p style={{ ...c.label, marginBottom: 6 }}>Category (optional)</p>
                <select
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  style={{ ...c.input, background: '#1a1a1a' }}>
                  <option value="">Use current: {activeCategory}</option>
                  {workouts.categories.filter(c => c !== 'Custom').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__new__">Create new category</option>
                </select>
              </div>
              {/* Existing custom exercises */}
              {customExercises.length > 0 && (
                <div>
                  <p style={{ ...c.label, marginBottom: 8 }}>Your library</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                    {customExercises.map(ex => (
                      <div key={ex.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', borderRadius: 10, padding: '8px 12px' }}>
                        <div>
                          <p style={{ fontSize: 13, color: '#fff' }}>{ex.name}</p>
                          <p style={{ fontSize: 11, color: '#555' }}>{ex.category || ex.sport_type}</p>
                        </div>
                        <button onClick={() => deleteCustomExercise(ex.id)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={saveCustomExercise} disabled={!customName.trim() || savingCustom}
                style={{ ...c.btn, width: '100%', padding: 14, opacity: !customName.trim() ? 0.4 : 1 }}>
                {savingCustom ? 'Saving...' : '+ Add to library & session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={c.header}>
        <h1 style={c.title}>Training</h1>
        <p style={c.sub}>
          {(() => {
            const sportEmojis = { hyrox: '⚡', marathon: '🏃', bodybuilding: '🏋️', crossfit: '🏇', cycling: '🚴', triathlon: '🏊', ocr: '🏔️', combat: '🥊', team: '⚽', calisthenics: '🤸', general: '🎯' }
            return `${sportEmojis[sport] || '🎯'} ${(sport.charAt(0).toUpperCase() + sport.slice(1))} training`
          })()}
        </p>
      </div>

      {/* Week strip — last 7 days */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 14, overflowX: 'auto' }}>
        {weekDates.map((date, i) => {
          const hasSesh = sessions.some(s => isSameDay(s.date, date))
          const isToday = isSameDay(date, today)
          const isSelected = isSameDay(date, selectedDay)
          const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]
          return (
            <button key={i} onClick={() => setSelectedDay(date)}
              style={{
                flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 10px', borderRadius: 14, cursor: 'pointer',
                minWidth: 44, border: '1px solid',
                background: isSelected ? '#FF5A1F' : isToday ? '#1a0800' : '#131313',
                borderColor: isSelected ? '#FF5A1F' : isToday ? '#FF5A1F60' : '#222',
                transition: '.15s',
              }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: isSelected ? '#fff' : '#666' }}>{dayName}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: isSelected ? '#fff' : isToday ? '#FF5A1F' : '#fff', marginTop: 2 }}>
                {date.getDate()}
              </span>
              {hasSesh && (
                <div style={{ width: 5, height: 5, borderRadius: '50%', marginTop: 4, background: isSelected ? '#fff' : '#FF5A1F' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Day label + add button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
          {isSameDay(selectedDay, today) ? 'Today'
            : new Date(selectedDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>
        <button onClick={() => { setShowForm(true); setExpandedSession(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FF5A1F', border: 'none', borderRadius: 12, padding: '8px 14px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Add session
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#555', fontSize: 14 }}>Loading sessions...</p>
        </div>
      )}

      {/* No sessions */}
      {!loading && todaySessions.length === 0 && !showForm && (
        <div style={{ ...c.card, textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>😴</p>
          <p style={{ color: '#555', fontSize: 14 }}>No sessions logged for this day</p>
          <p style={{ color: '#333', fontSize: 12, marginTop: 4 }}>Tap + Add session to log one</p>
        </div>
      )}

      {/* Session cards */}
      {todaySessions.map(s => (
        <div key={s.id} style={{ margin: '0 16px 10px', background: '#131313', border: '1px solid #222', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#1a0800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {(() => {
                  const icons = { 'Hyrox Stations': '⚡', 'Running': '🏃', 'Strength': '🏋️', 'Chest': '💪', 'Back': '🔙', 'Legs': '🦵', 'Cardio': '❤️', 'HIIT': '🔥', 'Recovery': '😌', 'Custom': '⭐', 'Swim': '🏊', 'Bike': '🚴', 'WOD': '🏇', 'OCR Training': '🏔️', 'Sparring': '🥊' }
                  return icons[s.type] || '🎯'
                })()}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{s.type}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  {s.duration && <span style={{ fontSize: 11, color: '#666' }}>⏱ {s.duration}min</span>}
                  {s.rpe && <span style={{ fontSize: 11, color: '#666' }}>RPE {s.rpe}/10</span>}
                  <span style={{ fontSize: 11, color: '#666' }}>{(s.exercises || []).length} exercises</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={e => { e.stopPropagation(); deleteSession(s.id) }}
                style={{ width: 30, height: 30, borderRadius: 8, background: '#2d0000', border: '1px solid #EF444430', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={13} color="#EF4444" />
              </button>
              {expandedSession === s.id
                ? <ChevronUp size={16} color="#555" />
                : <ChevronDown size={16} color="#555" />}
            </div>
          </div>

          {expandedSession === s.id && (
            <div style={{ borderTop: '1px solid #1a1a1a', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {s.notes && (
                <p style={{ fontSize: 13, color: '#888', fontStyle: 'italic' }}>"{s.notes}"</p>
              )}
              {(s.exercises || []).map((ex, i) => (
                <div key={i} style={{ background: '#1a1a1a', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{ex.name}</p>
                    <p style={{ fontSize: 11, color: '#555' }}>{ex.category}</p>
                  </div>
                  {ex.fieldType === 'strength' && (ex.sets || []).map((set, si) => (
                    <p key={si} style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      Set {si + 1}: {set.reps} reps {set.weight ? `@ ${set.weight}kg` : ''}
                    </p>
                  ))}
                  {ex.fieldType === 'cardio' && (
                    <p style={{ fontSize: 12, color: '#3B82F6' }}>
                      {ex.distance ? `${ex.distance}km` : ''} {ex.duration ? `· ${ex.duration}min` : ''} {ex.pace ? `· ${ex.pace}/km` : ''}
                    </p>
                  )}
                  {ex.fieldType === 'station' && (
                    <p style={{ fontSize: 12, color: '#FF5A1F' }}>
                      Time: {ex.stationTime || '--'}
                    </p>
                  )}
                  {ex.fieldType === 'timed' && (
                    <p style={{ fontSize: 12, color: '#A855F7' }}>
                      {ex.setsCount ? `${ex.setsCount} sets` : ''} {ex.duration ? `× ${ex.duration}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Add session form */}
      {showForm && (
        <div style={{ margin: '0 16px 12px', background: '#131313', border: '1px solid #222', borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Form header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>New Session</p>
            <button onClick={() => { setShowForm(false); resetForm() }}
              style={{ width: 30, height: 30, borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={14} color="#666" />
            </button>
          </div>

          {/* Category selector */}
          <div>
            <p style={{ ...c.label, marginBottom: 8 }}>Workout type</p>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {workouts.categories.map(cat => (
                <button key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    flexShrink: 0, padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: '.15s',
                    background: activeCategory === cat ? '#FF5A1F' : '#1a1a1a',
                    borderColor: activeCategory === cat ? '#FF5A1F' : '#2a2a2a',
                    color: activeCategory === cat ? '#fff' : '#666',
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise picker */}
          {activeCategory !== 'Custom' && (
            <div>
              <p style={{ ...c.label, marginBottom: 8 }}>
                Add exercises · <span style={{ color: '#FF5A1F' }}>{activeCategory}</span>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {exerciseList.map(name => {
                  const isAdded = exercises.find(e => e.name === name)
                  return (
                    <button key={name} onClick={() => addExercise(name)}
                      style={{
                        padding: '6px 12px', borderRadius: 10, fontSize: 12, cursor: 'pointer', border: '1px solid', transition: '.15s',
                        background: isAdded ? '#FF5A1F20' : '#1a1a1a',
                        borderColor: isAdded ? '#FF5A1F' : '#2a2a2a',
                        color: isAdded ? '#FF5A1F' : '#888',
                        fontWeight: isAdded ? 600 : 400,
                      }}>
                      {isAdded ? '✓ ' : '+ '}{name}
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setShowCustomModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer', border: '1px dashed #FF5A1F40', background: '#FF5A1F10', color: '#FF5A1F', fontWeight: 500 }}>
                ⭐ Add custom exercise to library
              </button>
            </div>
          )}

          {activeCategory === 'Custom' && (
            <button onClick={() => setShowCustomModal(true)}
              style={{ width: '100%', padding: 14, borderRadius: 14, border: '1px dashed #FF5A1F40', background: '#FF5A1F10', color: '#FF5A1F', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              ⭐ Add your custom exercise
            </button>
          )}

          {/* Exercise blocks with sets */}
          {exercises.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ ...c.label }}>Your exercises ({exercises.length})</p>
              {exercises.map(ex => (
                <div key={ex.id} style={{ background: '#1a1a1a', borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{ex.name}</p>
                      <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{ex.category} · {ex.fieldType}</p>
                    </div>
                    <button onClick={() => removeExercise(ex.id)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: '#2d0000', border: '1px solid #EF444430', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={12} color="#EF4444" />
                    </button>
                  </div>

                  {/* Strength: sets x reps x weight */}
                  {ex.fieldType === 'strength' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px', gap: 6 }}>
                        <span style={{ fontSize: 10, color: '#555', textAlign: 'center' }}>Set</span>
                        <span style={{ fontSize: 10, color: '#555', textAlign: 'center' }}>Reps</span>
                        <span style={{ fontSize: 10, color: '#555', textAlign: 'center' }}>kg</span>
                        <span></span>
                      </div>
                      {(ex.sets || []).map((set, si) => (
                        <div key={si} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px', gap: 6, alignItems: 'center' }}>
                          <div style={{ height: 34, background: '#131313', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#555' }}>{si + 1}</div>
                          <input type="number" placeholder="12" value={set.reps}
                            onChange={e => updateSet(ex.id, si, 'reps', e.target.value)}
                            style={{ height: 34, background: '#131313', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                          <input type="number" placeholder="50" value={set.weight}
                            onChange={e => updateSet(ex.id, si, 'weight', e.target.value)}
                            style={{ height: 34, background: '#131313', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                          <button onClick={() => removeSet(ex.id, si)} disabled={ex.sets.length === 1}
                            style={{ height: 34, width: 32, borderRadius: 8, background: ex.sets.length === 1 ? '#111' : '#2d0000', border: `1px solid ${ex.sets.length === 1 ? '#1a1a1a' : '#EF444430'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: ex.sets.length === 1 ? 'not-allowed' : 'pointer' }}>
                            <Trash2 size={11} color={ex.sets.length === 1 ? '#333' : '#EF4444'} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addSet(ex.id)}
                        style={{ width: '100%', padding: '8px', borderRadius: 10, border: '1px dashed #FF5A1F30', background: '#FF5A1F10', color: '#FF5A1F', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                        + Add set
                      </button>
                    </div>
                  )}

                  {/* Cardio */}
                  {ex.fieldType === 'cardio' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <p style={{ ...c.label, marginBottom: 4 }}>Distance (km)</p>
                        <input type="number" placeholder="5.0" value={ex.distance}
                          onChange={e => updateExercise(ex.id, 'distance', e.target.value)}
                          style={{ ...c.input, padding: '8px 12px' }} />
                      </div>
                      <div>
                        <p style={{ ...c.label, marginBottom: 4 }}>Duration (min)</p>
                        <input type="number" placeholder="30" value={ex.duration}
                          onChange={e => updateExercise(ex.id, 'duration', e.target.value)}
                          style={{ ...c.input, padding: '8px 12px' }} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <p style={{ ...c.label, marginBottom: 4 }}>Pace (min/km)</p>
                        <input placeholder="5:30" value={ex.pace}
                          onChange={e => updateExercise(ex.id, 'pace', e.target.value)}
                          style={{ ...c.input, padding: '8px 12px' }} />
                      </div>
                    </div>
                  )}

                  {/* Station (Hyrox) */}
                  {ex.fieldType === 'station' && (
                    <div>
                      <p style={{ ...c.label, marginBottom: 4 }}>Time (e.g. 4:32)</p>
                      <input placeholder="4:32" value={ex.stationTime}
                        onChange={e => updateExercise(ex.id, 'stationTime', e.target.value)}
                        style={c.input} />
                    </div>
                  )}

                  {/* Timed (recovery, yoga) */}
                  {ex.fieldType === 'timed' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <p style={{ ...c.label, marginBottom: 4 }}>Sets</p>
                        <input type="number" placeholder="3" value={ex.setsCount}
                          onChange={e => updateExercise(ex.id, 'setsCount', e.target.value)}
                          style={{ ...c.input, padding: '8px 12px' }} />
                      </div>
                      <div>
                        <p style={{ ...c.label, marginBottom: 4 }}>Duration</p>
                        <input placeholder="30 sec / 5 min" value={ex.duration}
                          onChange={e => updateExercise(ex.id, 'duration', e.target.value)}
                          style={{ ...c.input, padding: '8px 12px' }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Session details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={{ ...c.label, marginBottom: 6 }}>Duration (min)</p>
              <input type="number" placeholder="60" value={sessionDuration}
                onChange={e => setSessionDuration(e.target.value)}
                style={c.input} />
            </div>
            <div>
              <p style={{ ...c.label, marginBottom: 6 }}>Effort (RPE) — {rpe}/10</p>
              <input type="range" min="1" max="10" value={rpe}
                onChange={e => setRpe(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#FF5A1F', marginTop: 8 }} />
            </div>
          </div>

          <textarea placeholder="Session notes (optional)" value={notes}
            onChange={e => setNotes(e.target.value)} rows={2}
            style={{ ...c.input, resize: 'none', lineHeight: 1.5 }} />

          <button onClick={saveSession} disabled={saving || exercises.length === 0}
            style={{ ...c.btn, width: '100%', padding: 14, fontSize: 15, opacity: exercises.length === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Check size={16} />
            {saving ? 'Saving...' : exercises.length === 0 ? 'Add at least 1 exercise' : `Save Session (${exercises.length} exercises)`}
          </button>
        </div>
      )}

    </div>
  )
}