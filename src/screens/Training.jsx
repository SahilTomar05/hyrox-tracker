import { useState, useEffect, useRef } from 'react'
import { X, Check, Trash2, ChevronDown, ChevronUp, Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

const ALL_EXERCISES = [
  // Strength - Chest
  { name: 'Flat Bench Press', cat: 'Strength', sub: 'Chest' },
  { name: 'Incline Bench Press', cat: 'Strength', sub: 'Chest' },
  { name: 'Decline Bench Press', cat: 'Strength', sub: 'Chest' },
  { name: 'Dumbbell Chest Press', cat: 'Strength', sub: 'Chest' },
  { name: 'Incline Dumbbell Press', cat: 'Strength', sub: 'Chest' },
  { name: 'Chest Flyes', cat: 'Strength', sub: 'Chest' },
  { name: 'Cable Crossover', cat: 'Strength', sub: 'Chest' },
  { name: 'Pec Deck', cat: 'Strength', sub: 'Chest' },
  { name: 'Push Ups', cat: 'Strength', sub: 'Chest' },
  { name: 'Dips', cat: 'Strength', sub: 'Chest' },
  // Strength - Back
  { name: 'Deadlift', cat: 'Strength', sub: 'Back' },
  { name: 'Barbell Row', cat: 'Strength', sub: 'Back' },
  { name: 'Dumbbell Row', cat: 'Strength', sub: 'Back' },
  { name: 'Lat Pulldown', cat: 'Strength', sub: 'Back' },
  { name: 'Seated Cable Row', cat: 'Strength', sub: 'Back' },
  { name: 'T-Bar Row', cat: 'Strength', sub: 'Back' },
  { name: 'Face Pulls', cat: 'Strength', sub: 'Back' },
  { name: 'Pull Ups', cat: 'Strength', sub: 'Back' },
  { name: 'Chin Ups', cat: 'Strength', sub: 'Back' },
  { name: 'Rack Pull', cat: 'Strength', sub: 'Back' },
  // Strength - Shoulders
  { name: 'Overhead Press', cat: 'Strength', sub: 'Shoulders' },
  { name: 'Dumbbell Shoulder Press', cat: 'Strength', sub: 'Shoulders' },
  { name: 'Arnold Press', cat: 'Strength', sub: 'Shoulders' },
  { name: 'Lateral Raises', cat: 'Strength', sub: 'Shoulders' },
  { name: 'Front Raises', cat: 'Strength', sub: 'Shoulders' },
  { name: 'Rear Delt Flyes', cat: 'Strength', sub: 'Shoulders' },
  { name: 'Shrugs', cat: 'Strength', sub: 'Shoulders' },
  { name: 'Upright Row', cat: 'Strength', sub: 'Shoulders' },
  // Strength - Legs
  { name: 'Barbell Squat', cat: 'Strength', sub: 'Legs' },
  { name: 'Front Squat', cat: 'Strength', sub: 'Legs' },
  { name: 'Leg Press', cat: 'Strength', sub: 'Legs' },
  { name: 'Romanian Deadlift', cat: 'Strength', sub: 'Legs' },
  { name: 'Leg Curl', cat: 'Strength', sub: 'Legs' },
  { name: 'Leg Extension', cat: 'Strength', sub: 'Legs' },
  { name: 'Bulgarian Split Squat', cat: 'Strength', sub: 'Legs' },
  { name: 'Lunges', cat: 'Strength', sub: 'Legs' },
  { name: 'Hack Squat', cat: 'Strength', sub: 'Legs' },
  { name: 'Calf Raises', cat: 'Strength', sub: 'Legs' },
  { name: 'Hip Thrust', cat: 'Strength', sub: 'Legs' },
  { name: 'Glute Bridge', cat: 'Strength', sub: 'Legs' },
  // Strength - Arms
  { name: 'Barbell Curl', cat: 'Strength', sub: 'Arms' },
  { name: 'Dumbbell Curl', cat: 'Strength', sub: 'Arms' },
  { name: 'Hammer Curl', cat: 'Strength', sub: 'Arms' },
  { name: 'Preacher Curl', cat: 'Strength', sub: 'Arms' },
  { name: 'Cable Curl', cat: 'Strength', sub: 'Arms' },
  { name: 'Concentration Curl', cat: 'Strength', sub: 'Arms' },
  { name: 'Tricep Pushdown', cat: 'Strength', sub: 'Arms' },
  { name: 'Skull Crushers', cat: 'Strength', sub: 'Arms' },
  { name: 'Overhead Tricep Extension', cat: 'Strength', sub: 'Arms' },
  { name: 'Close Grip Bench', cat: 'Strength', sub: 'Arms' },
  // Strength - Power
  { name: 'Power Clean', cat: 'Strength', sub: 'Power' },
  { name: 'Clean & Jerk', cat: 'Strength', sub: 'Power' },
  { name: 'Snatch', cat: 'Strength', sub: 'Power' },
  { name: 'Hang Clean', cat: 'Strength', sub: 'Power' },
  { name: 'Push Press', cat: 'Strength', sub: 'Power' },
  { name: 'Thruster', cat: 'Strength', sub: 'Power' },
  { name: 'Farmers Walk', cat: 'Strength', sub: 'Power' },
  { name: 'Kettlebell Swing', cat: 'Strength', sub: 'Power' },
  { name: 'Turkish Get Up', cat: 'Strength', sub: 'Power' },
  { name: 'Sled Push', cat: 'Strength', sub: 'Power' },
  { name: 'Sled Pull', cat: 'Strength', sub: 'Power' },
  { name: 'Muscle Ups', cat: 'Strength', sub: 'Power' },
  { name: 'Handstand Push Ups', cat: 'Strength', sub: 'Power' },
  // Conditioning - Cardio
  { name: 'Easy Run', cat: 'Conditioning', sub: 'Running' },
  { name: 'Tempo Run', cat: 'Conditioning', sub: 'Running' },
  { name: 'Long Run', cat: 'Conditioning', sub: 'Running' },
  { name: 'Interval Run', cat: 'Conditioning', sub: 'Running' },
  { name: 'Hill Run', cat: 'Conditioning', sub: 'Running' },
  { name: 'Sprint Session', cat: 'Conditioning', sub: 'Running' },
  { name: 'Fartlek', cat: 'Conditioning', sub: 'Running' },
  { name: 'Recovery Jog', cat: 'Conditioning', sub: 'Running' },
  { name: 'Row Erg', cat: 'Conditioning', sub: 'Machine' },
  { name: 'SkiErg', cat: 'Conditioning', sub: 'Machine' },
  { name: 'Assault Bike', cat: 'Conditioning', sub: 'Machine' },
  { name: 'Stairmaster', cat: 'Conditioning', sub: 'Machine' },
  { name: 'Elliptical', cat: 'Conditioning', sub: 'Machine' },
  { name: 'Treadmill', cat: 'Conditioning', sub: 'Machine' },
  { name: 'Steady State Ride', cat: 'Conditioning', sub: 'Cycling' },
  { name: 'Interval Ride', cat: 'Conditioning', sub: 'Cycling' },
  { name: 'Indoor Cycling', cat: 'Conditioning', sub: 'Cycling' },
  { name: 'Burpees', cat: 'Conditioning', sub: 'HIIT' },
  { name: 'Box Jumps', cat: 'Conditioning', sub: 'HIIT' },
  { name: 'Jump Rope', cat: 'Conditioning', sub: 'HIIT' },
  { name: 'Battle Ropes', cat: 'Conditioning', sub: 'HIIT' },
  { name: 'Mountain Climbers', cat: 'Conditioning', sub: 'HIIT' },
  { name: 'Tabata', cat: 'Conditioning', sub: 'HIIT' },
  { name: 'AMRAP', cat: 'Conditioning', sub: 'HIIT' },
  { name: 'EMOM', cat: 'Conditioning', sub: 'HIIT' },
  // Conditioning - Core
  { name: 'Plank', cat: 'Conditioning', sub: 'Core' },
  { name: 'Side Plank', cat: 'Conditioning', sub: 'Core' },
  { name: 'Hollow Hold', cat: 'Conditioning', sub: 'Core' },
  { name: 'L-Sit', cat: 'Conditioning', sub: 'Core' },
  { name: 'Crunches', cat: 'Conditioning', sub: 'Core' },
  { name: 'Bicycle Crunches', cat: 'Conditioning', sub: 'Core' },
  { name: 'Leg Raises', cat: 'Conditioning', sub: 'Core' },
  { name: 'Hanging Leg Raises', cat: 'Conditioning', sub: 'Core' },
  { name: 'Ab Wheel Rollout', cat: 'Conditioning', sub: 'Core' },
  { name: 'Russian Twist', cat: 'Conditioning', sub: 'Core' },
  { name: 'Dragon Flag', cat: 'Conditioning', sub: 'Core' },
  { name: 'V Ups', cat: 'Conditioning', sub: 'Core' },
  { name: 'Dead Bug', cat: 'Conditioning', sub: 'Core' },
  // Skills
  { name: 'Football Drills', cat: 'Skills', sub: 'Team Sports' },
  { name: 'Cricket Batting', cat: 'Skills', sub: 'Team Sports' },
  { name: 'Cricket Bowling', cat: 'Skills', sub: 'Team Sports' },
  { name: 'Basketball Drills', cat: 'Skills', sub: 'Team Sports' },
  { name: 'Volleyball Practice', cat: 'Skills', sub: 'Team Sports' },
  { name: 'Tennis Drills', cat: 'Skills', sub: 'Racket' },
  { name: 'Badminton Practice', cat: 'Skills', sub: 'Racket' },
  { name: 'Squash', cat: 'Skills', sub: 'Racket' },
  { name: 'Boxing Sparring', cat: 'Skills', sub: 'Combat' },
  { name: 'MMA Sparring', cat: 'Skills', sub: 'Combat' },
  { name: 'Kickboxing', cat: 'Skills', sub: 'Combat' },
  { name: 'Muay Thai', cat: 'Skills', sub: 'Combat' },
  { name: 'Wrestling', cat: 'Skills', sub: 'Combat' },
  { name: 'BJJ Rolling', cat: 'Skills', sub: 'Combat' },
  { name: 'Pad Work', cat: 'Skills', sub: 'Combat' },
  { name: 'Heavy Bag', cat: 'Skills', sub: 'Combat' },
  { name: 'Gymnastics Practice', cat: 'Skills', sub: 'Movement' },
  { name: 'Parkour', cat: 'Skills', sub: 'Movement' },
  { name: 'Breakdancing', cat: 'Skills', sub: 'Movement' },
  { name: 'Freestyle Movement', cat: 'Skills', sub: 'Movement' },
  { name: 'Handstand Practice', cat: 'Skills', sub: 'Movement' },
  { name: 'Climbing', cat: 'Skills', sub: 'Movement' },
  { name: 'Dance Practice', cat: 'Skills', sub: 'Movement' },
  { name: 'Sport Practice', cat: 'Skills', sub: 'General' },
  { name: 'Scrimmage', cat: 'Skills', sub: 'General' },
  // Mobility
  { name: 'Sun Salutation', cat: 'Mobility', sub: 'Yoga' },
  { name: 'Yoga Flow', cat: 'Mobility', sub: 'Yoga' },
  { name: 'Yin Yoga', cat: 'Mobility', sub: 'Yoga' },
  { name: 'Hot Yoga', cat: 'Mobility', sub: 'Yoga' },
  { name: 'Power Yoga', cat: 'Mobility', sub: 'Yoga' },
  { name: 'Hip Flexor Stretch', cat: 'Mobility', sub: 'Stretch' },
  { name: 'Hamstring Stretch', cat: 'Mobility', sub: 'Stretch' },
  { name: 'Quad Stretch', cat: 'Mobility', sub: 'Stretch' },
  { name: 'IT Band Stretch', cat: 'Mobility', sub: 'Stretch' },
  { name: 'Full Body Stretch', cat: 'Mobility', sub: 'Stretch' },
  { name: 'Hip Mobility', cat: 'Mobility', sub: 'Mobility' },
  { name: 'Ankle Mobility', cat: 'Mobility', sub: 'Mobility' },
  { name: 'Shoulder Mobility', cat: 'Mobility', sub: 'Mobility' },
  { name: 'Thoracic Mobility', cat: 'Mobility', sub: 'Mobility' },
  { name: 'Cat Cow', cat: 'Mobility', sub: 'Mobility' },
  { name: "World's Greatest Stretch", cat: 'Mobility', sub: 'Mobility' },
  { name: 'Foam Rolling', cat: 'Mobility', sub: 'Recovery' },
  { name: 'Massage Gun', cat: 'Mobility', sub: 'Recovery' },
  { name: 'Ice Bath', cat: 'Mobility', sub: 'Recovery' },
  { name: 'Sauna', cat: 'Mobility', sub: 'Recovery' },
  { name: 'Walk', cat: 'Mobility', sub: 'Recovery' },
  { name: 'Meditation', cat: 'Mobility', sub: 'Recovery' },
  { name: 'Breathing Exercises', cat: 'Mobility', sub: 'Recovery' },
  { name: 'Glute Activation', cat: 'Mobility', sub: 'Prehab' },
  { name: 'Band Pull Aparts', cat: 'Mobility', sub: 'Prehab' },
  { name: 'Core Activation', cat: 'Mobility', sub: 'Prehab' },
]

const CAT_META = {
  'Strength':   { icon: '💪', color: '#FF5A1F', label: 'Strength' },
  'Conditioning':{ icon: '🔥', color: '#EF4444', label: 'Conditioning' },
  'Skills':     { icon: '⚽', color: '#3B82F6', label: 'Skills' },
  'Mobility':   { icon: '🧘', color: '#A855F7', label: 'Mobility' },
  'Custom':     { icon: '⭐', color: '#F59E0B', label: 'Custom' },
  'Mixed':      { icon: '🎯', color: '#22C55E', label: 'Mixed' },
}

const CATS = ['Strength','Conditioning','Skills','Mobility','Custom']

function detectType(exercises) {
  if (!exercises.length) return null
  const cats = [...new Set(exercises.map(e => e.cat))]
  return cats.length === 1 ? cats[0] : 'Mixed'
}

function getFieldType(cat) {
  if (cat === 'Mobility') return 'timed'
  if (cat === 'Skills') return 'timed'
  if (cat === 'Conditioning') return 'cardio'
  return 'strength'
}

function getScore(exercises, rpe, duration) {
  const isMobOnly = exercises.every(e => e.cat === 'Mobility')
  if (isMobOnly) return {
    isRecovery: true, emoji: '🧘', color: '#A855F7',
    msg: "Smart. Your body repairs during rest, not during reps. Keep this up.",
  }
  let s = 0
  const sets = exercises.reduce((a, e) => a + (e.sets?.length || 1), 0)
  if (sets >= 20) s += 30; else if (sets >= 12) s += 20; else if (sets >= 6) s += 10
  if (rpe >= 8) s += 30; else if (rpe >= 6) s += 20; else if (rpe >= 4) s += 10
  const d = Number(duration) || 0
  if (d >= 60) s += 25; else if (d >= 40) s += 15; else if (d >= 20) s += 8
  if (exercises.length >= 6) s += 15; else if (exercises.length >= 3) s += 8
  s = Math.min(s, 100)
  if (s >= 85) return { isRecovery:false, score:s, emoji:'🔥', color:'#22C55E', msg:`${s}/100. That was genuinely solid. Don't let it go to your head — but don't stop either.` }
  if (s >= 70) return { isRecovery:false, score:s, emoji:'💪', color:'#3B82F6', msg:`${s}/100. Decent session. Not hall-of-fame material but better than sitting on the couch.` }
  if (s >= 50) return { isRecovery:false, score:s, emoji:'😐', color:'#FF8C42', msg:`${s}/100. You showed up. That's… something. Your warm-up had more effort than this workout.` }
  if (s >= 30) return { isRecovery:false, score:s, emoji:'😬', color:'#FF5A1F', msg:`${s}/100. My house plant gets more exercise swaying in the breeze. Add weight. Add sets. Add something.` }
  return { isRecovery:false, score:s, emoji:'💀', color:'#EF4444', msg:`${s}/100. Respectfully — what was that? Come back when you're ready to actually train.` }
}

function isSameDay(a, b) { return new Date(a).toDateString() === new Date(b).toDateString() }

function getWeekDates() {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i)); return d
  })
}

export default function Training({ session, profile }) {
  const weekDates = getWeekDates()
  const today = new Date()
  const searchRef = useRef(null)

  const [selectedDay, setSelectedDay] = useState(today)
  const [sessions, setSessions] = useState([])
  const [customExercises, setCustomExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [scoreModal, setScoreModal] = useState(null)
  const [setsPicker, setSetsPicker] = useState(null)

  // Form
  const [activeCat, setActiveCat] = useState(null) // null = all
  const [query, setQuery] = useState('')
  const [exercises, setExercises] = useState([])
  const [notes, setNotes] = useState('')
  const [rpe, setRpe] = useState(7)
  const [duration, setDuration] = useState('')
  const [customName, setCustomName] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', session.user.id).order('date', { ascending: false }),
      supabase.from('custom_exercises').select('*').eq('user_id', session.user.id),
    ])
    if (s) setSessions(s)
    if (c) setCustomExercises(c)
    setLoading(false)
  }

  const daySessions = sessions.filter(s => isSameDay(s.date, selectedDay))

  // Search results
  const allEx = [
    ...ALL_EXERCISES,
    ...customExercises.map(e => ({ name: e.name, cat: e.category || 'Custom', sub: 'Custom', isCustom: true }))
  ]

  const filtered = (() => {
    let list = allEx
    if (activeCat) list = list.filter(e => e.cat === activeCat)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(e => e.name.toLowerCase().includes(q))
    } else if (!activeCat) {
      // No filter, no query — show nothing (prompt user to search or pick category)
      return []
    }
    return list.slice(0, 20) // max 20 results
  })()

  function tapResult(ex) {
    const already = exercises.find(e => e.name === ex.name)
    if (already) { setExercises(p => p.filter(e => e.name !== ex.name)); return }
    const ft = getFieldType(ex.cat)
    if (ft === 'strength') {
      setSetsPicker(ex)
    } else {
      setExercises(p => [...p, { id: Date.now(), ...ex, fieldType: ft, sets: [], duration: '', distance: '', pace: '', setsCount: '' }])
    }
  }

  function addWithSets(ex, n) {
    setExercises(p => [...p, {
      id: Date.now(), ...ex, fieldType: 'strength',
      sets: Array.from({ length: n }, () => ({ reps: '', weight: '' })),
    }])
    setSetsPicker(null)
  }

  function addSet(id) { setExercises(p => p.map(e => e.id === id ? { ...e, sets: [...e.sets, { reps: '', weight: '' }] } : e)) }
  function removeSet(id, si) { setExercises(p => p.map(e => e.id === id && e.sets.length > 1 ? { ...e, sets: e.sets.filter((_, i) => i !== si) } : e)) }
  function updSet(id, si, field, val) { setExercises(p => p.map(e => e.id === id ? { ...e, sets: e.sets.map((s, i) => i === si ? { ...s, [field]: val } : s) } : e)) }
  function updEx(id, field, val) { setExercises(p => p.map(e => e.id === id ? { ...e, [field]: val } : e)) }

  async function saveCustom() {
    if (!customName.trim()) return
    const cat = activeCat || 'Custom'
    const { data } = await supabase.from('custom_exercises').insert({
      user_id: session.user.id, name: customName.trim(), category: cat, sport_type: profile?.sport || 'general',
    }).select().single()
    if (data) {
      setCustomExercises(p => [...p, data])
      const ex = { name: customName.trim(), cat, sub: 'Custom', isCustom: true }
      const ft = getFieldType(cat)
      if (ft === 'strength') setSetsPicker(ex)
      else setExercises(p => [...p, { id: Date.now(), ...ex, fieldType: ft, sets: [], duration: '', distance: '', pace: '', setsCount: '' }])
    }
    setCustomName(''); setShowCustomInput(false)
  }

  async function save() {
    if (!exercises.length) return
    setSaving(true)
    const type = detectType(exercises) || 'Mixed'
    const result = getScore(exercises, rpe, duration)
    const { data, error } = await supabase.from('sessions').insert({
      user_id: session.user.id, date: selectedDay, type, notes, rpe, duration,
      exercises: exercises.map(({ id, ...ex }) => ex),
      hyrox_stations: [], muscle_groups: [...new Set(exercises.map(e => e.cat))],
    }).select().single()
    if (!error && data) { setSessions(p => [data, ...p]); setScoreModal(result) }
    setSaving(false); setShowForm(false); reset()
  }

  async function delSession(id) {
    if (!confirm('Delete this session?')) return
    await supabase.from('sessions').delete().eq('id', id)
    setSessions(p => p.filter(s => s.id !== id))
  }

  function reset() {
    setExercises([]); setNotes(''); setRpe(7); setDuration('')
    setActiveCat(null); setQuery(''); setShowCustomInput(false); setCustomName('')
  }

  function openForm() {
    setShowForm(true); setExpandedId(null)
    setTimeout(() => searchRef.current?.focus(), 100)
  }

  const detectedType = detectType(exercises)
  const typeMeta = detectedType ? CAT_META[detectedType] || CAT_META['Mixed'] : null

  const inp = {
    background: '#0f0f0f', border: '1px solid #252525',
    borderRadius: 10, padding: '10px 12px', color: '#fff',
    fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: '#080808', minHeight: '100vh' }}>

      {/* Sets Picker */}
      {setsPicker && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={() => setSetsPicker(null)}>
          <div style={{ background:'#0d0d0d', border:'1px solid #222', borderRadius:28, padding:28, width:'100%', maxWidth:290, textAlign:'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:13, color:'#555', marginBottom:6 }}>Adding</div>
            <p style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:4 }}>{setsPicker.name}</p>
            <p style={{ fontSize:12, color:'#444', marginBottom:24 }}>How many sets?</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
              {[1,2,3,4,5,6].map(n => (
                <button key={n} onClick={() => addWithSets(setsPicker, n)}
                  style={{ height:56, borderRadius:16, background:'#141414', border:'1px solid #222', color:'#fff', fontSize:22, fontWeight:700, cursor:'pointer', transition:'.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#FF5A1F'; e.currentTarget.style.borderColor='#FF5A1F' }}
                  onMouseLeave={e => { e.currentTarget.style.background='#141414'; e.currentTarget.style.borderColor='#222' }}>
                  {n}
                </button>
              ))}
            </div>
            <button onClick={() => setSetsPicker(null)} style={{ fontSize:13, color:'#333', background:'none', border:'none', cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Score Modal */}
      {scoreModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.94)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={() => setScoreModal(null)}>
          <div style={{ background:'#0a0a0a', border:`1px solid ${scoreModal.color}25`, borderRadius:28, padding:32, width:'100%', maxWidth:310, textAlign:'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:64, marginBottom:12 }}>{scoreModal.emoji}</div>
            {scoreModal.isRecovery ? (
              <>
                <p style={{ fontSize:20, fontWeight:700, color:'#A855F7', marginBottom:12 }}>Recovery Day</p>
                <p style={{ fontSize:14, color:'#777', lineHeight:1.7, marginBottom:24 }}>{scoreModal.msg}</p>
              </>
            ) : (
              <>
                <div style={{ fontSize:76, fontWeight:700, color:scoreModal.color, lineHeight:1, marginBottom:6 }}>{scoreModal.score}</div>
                <p style={{ fontSize:11, color:'#333', textTransform:'uppercase', letterSpacing:'.12em', fontWeight:600, marginBottom:20 }}>Training Score</p>
                <div style={{ background:'#111', borderRadius:14, padding:'14px 18px', marginBottom:24 }}>
                  <p style={{ fontSize:14, color:'#999', lineHeight:1.7 }}>{scoreModal.msg}</p>
                </div>
              </>
            )}
            <button onClick={() => setScoreModal(null)}
              style={{ width:'100%', background:'#FF5A1F', border:'none', borderRadius:14, padding:15, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
              {scoreModal.isRecovery ? 'Rest well 🙏' : 'Got it 💪'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding:'0 20px 16px' }}>
        <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:'-.5px' }}>Training</h1>
        <p style={{ fontSize:13, color:'#444', marginTop:3 }}>Log your sessions</p>
      </div>

      {/* Week strip */}
      <div style={{ display:'flex', gap:8, padding:'0 20px', marginBottom:16, overflowX:'auto', scrollbarWidth:'none' }}>
        {weekDates.map((date, i) => {
          const has = sessions.some(s => isSameDay(s.date, date))
          const isT = isSameDay(date, today)
          const isSel = isSameDay(date, selectedDay)
          const dn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]
          return (
            <button key={i} onClick={() => setSelectedDay(date)}
              style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 12px', borderRadius:16, cursor:'pointer', minWidth:46, border:'1px solid', transition:'.2s', background: isSel ? '#FF5A1F' : isT ? '#150800' : '#0d0d0d', borderColor: isSel ? '#FF5A1F' : isT ? '#FF5A1F40' : '#1a1a1a' }}>
              <span style={{ fontSize:10, fontWeight:600, color: isSel ? 'rgba(255,255,255,.6)' : '#333', marginBottom:4 }}>{dn}</span>
              <span style={{ fontSize:17, fontWeight:700, color: isSel ? '#fff' : isT ? '#FF5A1F' : '#fff' }}>{date.getDate()}</span>
              <div style={{ width:4, height:4, borderRadius:'50%', marginTop:5, background: has ? (isSel ? '#fff' : '#FF5A1F') : 'transparent' }} />
            </button>
          )
        })}
      </div>

      {/* Day row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', marginBottom:14 }}>
        <p style={{ fontSize:16, fontWeight:600 }}>
          {isSameDay(selectedDay, today) ? 'Today' : new Date(selectedDay).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'short' })}
        </p>
        <button onClick={openForm}
          style={{ display:'flex', alignItems:'center', gap:6, background:'#FF5A1F', border:'none', borderRadius:12, padding:'9px 18px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          <Plus size={14} strokeWidth={3} /> Add session
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'48px 0' }}>
          <div style={{ width:28, height:28, borderRadius:'50%', border:'2px solid #1a1a1a', borderTopColor:'#FF5A1F', margin:'0 auto', animation:'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Empty */}
      {!loading && daySessions.length === 0 && !showForm && (
        <div style={{ margin:'0 20px', background:'#0a0a0a', border:'1px solid #141414', borderRadius:20, padding:'36px 20px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🛌</div>
          <p style={{ color:'#333', fontSize:14, fontWeight:500 }}>No sessions logged</p>
        </div>
      )}

      {/* Session cards */}
      {daySessions.map(s => {
        const meta = CAT_META[s.type] || CAT_META['Mixed']
        const isExp = expandedId === s.id
        return (
          <div key={s.id} style={{ margin:'0 20px 10px', background:'#0a0a0a', border:`1px solid ${isExp ? meta.color+'30' : '#141414'}`, borderRadius:18, overflow:'hidden', transition:'.2s border-color' }}>
            <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}
              onClick={() => setExpandedId(isExp ? null : s.id)}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:13, background: meta.color+'15', border:`1px solid ${meta.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                  {meta.icon}
                </div>
                <div>
                  <p style={{ fontSize:15, fontWeight:700 }}>{s.type}</p>
                  <div style={{ display:'flex', gap:10, marginTop:3 }}>
                    {s.duration && <span style={{ fontSize:11, color:'#444' }}>⏱ {s.duration}m</span>}
                    {s.rpe && <span style={{ fontSize:11, color:'#444' }}>RPE {s.rpe}/10</span>}
                    <span style={{ fontSize:11, color:'#444' }}>{(s.exercises||[]).length} exercises</span>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={e => { e.stopPropagation(); delSession(s.id) }}
                  style={{ width:32, height:32, borderRadius:9, background:'#150000', border:'1px solid #EF444415', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <X size={13} color="#EF4444" />
                </button>
                <div style={{ color:'#2a2a2a' }}>{isExp ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</div>
              </div>
            </div>
            {isExp && (
              <div style={{ borderTop:'1px solid #111', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                {s.notes && <p style={{ fontSize:13, color:'#555', fontStyle:'italic', paddingBottom:8, borderBottom:'1px solid #111' }}>"{s.notes}"</p>}
                {(s.exercises||[]).map((ex, i) => (
                  <div key={i} style={{ background:'#0d0d0d', borderRadius:12, padding:'10px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:'#e0e0e0' }}>{ex.name}</p>
                      <span style={{ fontSize:10, color:'#333', background:'#141414', padding:'2px 8px', borderRadius:6 }}>{ex.sub || ex.cat}</span>
                    </div>
                    {ex.fieldType === 'strength' && (ex.sets||[]).map((set,si) => (
                      <p key={si} style={{ fontSize:12, color:'#555', marginTop:2 }}>
                        Set {si+1} · {set.reps||'—'} reps {set.weight ? `@ ${set.weight}kg` : ''}
                      </p>
                    ))}
                    {ex.fieldType === 'cardio' && (
                      <p style={{ fontSize:12, color:'#3B82F6' }}>
                        {[ex.distance&&`${ex.distance}km`, ex.duration&&`${ex.duration}min`, ex.pace&&`${ex.pace}/km`].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {ex.fieldType === 'timed' && (
                      <p style={{ fontSize:12, color:'#A855F7' }}>
                        {[ex.setsCount&&`${ex.setsCount}x`, ex.duration].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* ADD FORM */}
      {showForm && (
        <div style={{ margin:'0 20px 16px', background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:22, overflow:'hidden' }}>

          {/* Header */}
          <div style={{ padding:'14px 16px', background:'#0a0a0a', borderBottom:'1px solid #111', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:52, zIndex:20 }}>
            <div>
              <p style={{ fontSize:16, fontWeight:700 }}>New Session</p>
              {detectedType
                ? <p style={{ fontSize:11, color: typeMeta?.color, marginTop:2 }}>{typeMeta?.icon} {detectedType} · {exercises.length} exercise{exercises.length!==1?'s':''}</p>
                : <p style={{ fontSize:11, color:'#2a2a2a', marginTop:2 }}>Search and add exercises below</p>
              }
            </div>
            <button onClick={() => { setShowForm(false); reset() }}
              style={{ width:32, height:32, borderRadius:10, background:'#111', border:'1px solid #1e1e1e', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <X size={15} color="#444" />
            </button>
          </div>

          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>

            {/* SEARCH — the hero element */}
            <div style={{ position:'relative' }}>
              <Search size={16} color="#444" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input
                ref={searchRef}
                placeholder="Search any exercise... (bench, squat, run...)"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ ...inp, width:'100%', paddingLeft:42, boxSizing:'border-box', fontSize:15, padding:'13px 14px 13px 42px', borderRadius:14 }}
              />
              {query && (
                <button onClick={() => setQuery('')}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#444' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category filter pills */}
            <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none' }}>
              <button onClick={() => setActiveCat(null)}
                style={{ flexShrink:0, padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'1px solid', background: !activeCat ? '#FF5A1F' : 'transparent', borderColor: !activeCat ? '#FF5A1F' : '#1e1e1e', color: !activeCat ? '#fff' : '#444' }}>
                All
              </button>
              {CATS.map(cat => {
                const m = CAT_META[cat]
                const on = activeCat === cat
                return (
                  <button key={cat} onClick={() => setActiveCat(on ? null : cat)}
                    style={{ flexShrink:0, display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:'1px solid', whiteSpace:'nowrap', background: on ? m.color+'20' : 'transparent', borderColor: on ? m.color : '#1e1e1e', color: on ? m.color : '#444' }}>
                    {m.icon} {cat}
                  </button>
                )
              })}
            </div>

            {/* Prompt state */}
            {!query && !activeCat && (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>
                <p style={{ color:'#333', fontSize:14 }}>Type to search all exercises</p>
                <p style={{ color:'#222', fontSize:12, marginTop:4 }}>or tap a category to browse</p>
              </div>
            )}

            {/* Search results */}
            {(query || activeCat) && (
              <div>
                {filtered.length === 0 ? (
                  <div style={{ padding:'16px 0' }}>
                    <p style={{ color:'#333', fontSize:14, marginBottom:12 }}>
                      No results for "{query}" — add it as custom
                    </p>
                    {!showCustomInput ? (
                      <button onClick={() => { setCustomName(query); setShowCustomInput(true) }}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:12, border:'1px dashed #FF5A1F40', background:'#FF5A1F08', color:'#FF5A1F', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                        ⭐ Add "{query}" to my library
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    {filtered.map(ex => {
                      const isAdded = !!exercises.find(e => e.name === ex.name)
                      const m = CAT_META[ex.cat] || CAT_META['Custom']
                      return (
                        <button key={ex.name} onClick={() => tapResult(ex)}
                          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderRadius:12, border:`1px solid ${isAdded ? m.color+'30' : '#141414'}`, background: isAdded ? m.color+'10' : '#0d0d0d', cursor:'pointer', transition:'.15s', textAlign:'left' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ fontSize:16 }}>{m.icon}</span>
                            <div>
                              <p style={{ fontSize:14, fontWeight: isAdded ? 600 : 500, color: isAdded ? m.color : '#ddd' }}>{ex.name}</p>
                              <p style={{ fontSize:11, color:'#333', marginTop:1 }}>{ex.sub} · {ex.cat}</p>
                            </div>
                          </div>
                          {isAdded
                            ? <div style={{ width:24, height:24, borderRadius:'50%', background: m.color, display:'flex', alignItems:'center', justifyContent:'center' }}><Check size={12} color="#fff" strokeWidth={3}/></div>
                            : <Plus size={16} color="#333" />
                          }
                        </button>
                      )
                    })}
                    {filtered.length === 20 && (
                      <p style={{ fontSize:11, color:'#2a2a2a', textAlign:'center', padding:'8px 0' }}>Showing top 20 — type more to narrow down</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Custom input */}
            {showCustomInput && (
              <div style={{ display:'flex', gap:8, padding:'12px', background:'#0d0d0d', borderRadius:14, border:'1px solid #FF5A1F20' }}>
                <input
                  placeholder="Custom exercise name..."
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveCustom()}
                  autoFocus
                  style={{ ...inp, flex:1 }}
                />
                <button onClick={saveCustom} disabled={!customName.trim()}
                  style={{ background:'#FF5A1F', border:'none', borderRadius:10, padding:'0 16px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:!customName.trim()?0.4:1 }}>
                  Add
                </button>
                <button onClick={() => { setShowCustomInput(false); setCustomName('') }}
                  style={{ background:'#141414', border:'1px solid #1e1e1e', borderRadius:10, padding:'0 10px', color:'#444', cursor:'pointer' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Added exercises */}
            {exercises.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <p style={{ fontSize:10, color:'#333', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:700 }}>
                    Added · {exercises.length}
                  </p>
                </div>
                {exercises.map(ex => {
                  const m = CAT_META[ex.cat] || CAT_META['Custom']
                  return (
                    <div key={ex.id} style={{ background:'#0d0d0d', border:`1px solid ${m.color}15`, borderRadius:16, padding:14 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:18 }}>{m.icon}</span>
                          <div>
                            <p style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{ex.name}</p>
                            <p style={{ fontSize:11, color:'#333', marginTop:1 }}>{ex.sub} · {ex.cat}</p>
                          </div>
                        </div>
                        <button onClick={() => setExercises(p => p.filter(e => e.id !== ex.id))}
                          style={{ width:30, height:30, borderRadius:9, background:'#150000', border:'1px solid #EF444415', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                          <X size={12} color="#EF4444" />
                        </button>
                      </div>

                      {/* Strength sets */}
                      {ex.fieldType === 'strength' && (
                        <div>
                          <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 1fr 30px', gap:6, marginBottom:8 }}>
                            {['','Reps','kg',''].map((h,i) => (
                              <span key={i} style={{ fontSize:10, color:'#2a2a2a', textAlign:'center', fontWeight:700 }}>{h}</span>
                            ))}
                          </div>
                          {ex.sets.map((set, si) => (
                            <div key={si} style={{ display:'grid', gridTemplateColumns:'28px 1fr 1fr 30px', gap:6, marginBottom:6, alignItems:'center' }}>
                              <div style={{ height:38, background:'#080808', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#333', fontWeight:700 }}>{si+1}</div>
                              <input type="number" inputMode="numeric" placeholder="12" value={set.reps}
                                onChange={e => updSet(ex.id, si, 'reps', e.target.value)}
                                style={{ ...inp, height:38, textAlign:'center', padding:'0 6px', fontSize:16, fontWeight:700 }} />
                              <input type="number" inputMode="decimal" placeholder="—" value={set.weight}
                                onChange={e => updSet(ex.id, si, 'weight', e.target.value)}
                                style={{ ...inp, height:38, textAlign:'center', padding:'0 6px', fontSize:16, fontWeight:700 }} />
                              <button onClick={() => removeSet(ex.id, si)} disabled={ex.sets.length === 1}
                                style={{ height:30, width:30, borderRadius:8, background: ex.sets.length===1?'transparent':'#150000', border:`1px solid ${ex.sets.length===1?'transparent':'#EF444415'}`, display:'flex', alignItems:'center', justifyContent:'center', cursor: ex.sets.length===1?'not-allowed':'pointer' }}>
                                <Trash2 size={11} color={ex.sets.length===1?'#1a1a1a':'#EF4444'} />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => addSet(ex.id)}
                            style={{ width:'100%', padding:9, borderRadius:10, border:`1px dashed ${m.color}20`, background:'transparent', color: m.color, fontSize:12, fontWeight:600, cursor:'pointer', marginTop:4, opacity:.8 }}>
                            + Add set
                          </button>
                        </div>
                      )}

                      {/* Cardio */}
                      {ex.fieldType === 'cardio' && (
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                          {[['Distance (km)','distance','number','5.0'],['Duration (min)','duration','number','30'],['Pace (min/km)','pace','text','5:30']].map(([label,field,type,ph]) => (
                            <div key={field} style={{ gridColumn: field==='pace'?'span 2':'auto' }}>
                              <p style={{ fontSize:10, color:'#333', fontWeight:700, marginBottom:5 }}>{label}</p>
                              <input type={type} placeholder={ph} value={ex[field]}
                                onChange={e => updEx(ex.id, field, e.target.value)}
                                style={{ ...inp, width:'100%', boxSizing:'border-box' }} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Timed */}
                      {ex.fieldType === 'timed' && (
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                          {[['Sets / Rounds','setsCount','number','3'],['Duration / Notes','duration','text','30 min']].map(([label,field,type,ph]) => (
                            <div key={field}>
                              <p style={{ fontSize:10, color:'#333', fontWeight:700, marginBottom:5 }}>{label}</p>
                              <input type={type} placeholder={ph} value={ex[field]}
                                onChange={e => updEx(ex.id, field, e.target.value)}
                                style={{ ...inp, width:'100%', boxSizing:'border-box' }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Session meta */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <p style={{ fontSize:10, color:'#333', fontWeight:700, marginBottom:6 }}>Duration (min)</p>
                <input type="number" placeholder="60" value={duration}
                  onChange={e => setDuration(e.target.value)}
                  style={{ ...inp, width:'100%', boxSizing:'border-box' }} />
              </div>
              <div>
                <p style={{ fontSize:10, color:'#333', fontWeight:700, marginBottom:6 }}>Effort · {rpe}/10</p>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                  <input type="range" min="1" max="10" value={rpe}
                    onChange={e => setRpe(Number(e.target.value))}
                    style={{ flex:1, accentColor:'#FF5A1F' }} />
                  <span style={{ fontSize:15, fontWeight:700, color:'#FF5A1F', minWidth:20 }}>{rpe}</span>
                </div>
              </div>
            </div>

            <textarea placeholder="Notes (optional)" value={notes}
              onChange={e => setNotes(e.target.value)} rows={2}
              style={{ ...inp, width:'100%', resize:'none', lineHeight:1.6, boxSizing:'border-box' }} />

            {/* Save */}
            <button onClick={save} disabled={saving || !exercises.length}
              style={{ width:'100%', background: exercises.length ? 'linear-gradient(135deg,#FF5A1F,#FF8C42)' : '#0d0d0d', border:'none', borderRadius:14, padding:16, color: exercises.length ? '#fff' : '#2a2a2a', fontSize:15, fontWeight:700, cursor: exercises.length ? 'pointer' : 'not-allowed', letterSpacing:'.02em', boxShadow: exercises.length ? '0 4px 20px rgba(255,90,31,.3)' : 'none' }}>
              {saving ? 'Saving...' : !exercises.length ? 'Add at least one exercise' : `Save ${detectedType || 'Session'} · ${exercises.length} exercise${exercises.length>1?'s':''}`}
            </button>

          </div>
        </div>
      )}
    </div>
  )
}