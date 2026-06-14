import { useState, useEffect, useRef } from 'react'
import { X, Plus, Search, Check, ChevronDown, ChevronUp, Trash2, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ALL_EXERCISES } from '../config/exercises'

const CAT_META = {
  'Strength':    { icon: '💪', color: '#FF5A1F' },
  'Conditioning':{ icon: '🔥', color: '#EF4444' },
  'Skills':      { icon: '⚽', color: '#3B82F6' },
  'Mobility':    { icon: '🧘', color: '#A855F7' },
  'Custom':      { icon: '⭐', color: '#F59E0B' },
  'Mixed':       { icon: '🎯', color: '#22C55E' },
}

const PRESETS = [
  { label: '3×10', sets: 3, reps: '10' },
  { label: '4×8',  sets: 4, reps: '8'  },
  { label: '5×5',  sets: 5, reps: '5'  },
  { label: '3×12', sets: 3, reps: '12' },
  { label: '4×12', sets: 4, reps: '12' },
  { label: '3×15', sets: 3, reps: '15' },
]

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function getWeekDates() {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d
  })
}

function getFieldType(ex) {
  if (ex.fieldType) return ex.fieldType
  if (ex.cat === 'Mobility') return 'timed'
  if (ex.cat === 'Skills') return 'sport'
  if (ex.cat === 'Conditioning') return 'reps_only'
  return 'strength'
}

function getSarcasticScore(exercises, rpe, duration) {
  const mobOnly = exercises.every(e => e.cat === 'Mobility')
  if (mobOnly) return { isRecovery: true, emoji: '🧘', color: '#A855F7', msg: 'Smart move. Recovery sessions are what separate serious athletes from the injured ones.' }
  let s = 0
  const sets = exercises.reduce((a, e) => a + (e.sets?.length || 1), 0)
  if (sets >= 20) s += 30; else if (sets >= 12) s += 20; else if (sets >= 6) s += 10
  if (rpe >= 8) s += 30; else if (rpe >= 6) s += 20; else if (rpe >= 4) s += 10
  const d = Number(duration) || 0
  if (d >= 60) s += 25; else if (d >= 40) s += 15; else if (d >= 20) s += 8
  if (exercises.length >= 6) s += 15; else if (exercises.length >= 3) s += 8
  s = Math.min(s, 100)
  if (s >= 85) return { isRecovery: false, score: s, emoji: '🔥', color: '#22C55E', msg: `${s}/100 — That was genuinely solid. Don't stop now.` }
  if (s >= 70) return { isRecovery: false, score: s, emoji: '💪', color: '#3B82F6', msg: `${s}/100 — Solid effort. Consistent beats perfect.` }
  if (s >= 50) return { isRecovery: false, score: s, emoji: '😐', color: '#FF8C42', msg: `${s}/100 — You showed up. Push harder next time.` }
  if (s >= 30) return { isRecovery: false, score: s, emoji: '😬', color: '#FF5A1F', msg: `${s}/100 — Your warm-up had more energy. What happened?` }
  return { isRecovery: false, score: s, emoji: '💀', color: '#EF4444', msg: `${s}/100 — Respectfully, what was that? Add weight, add sets, add effort.` }
}

export default function Training({ session, profile }) {
  const weekDates = getWeekDates()
  const today = new Date()
  const searchRef = useRef(null)

  const [selectedDay, setSelectedDay] = useState(today)
  const [sessions, setSessions] = useState([])
  const [customExercises, setCustomExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState(null)
  const [exercises, setExercises] = useState([]) // added exercises
  const [activeExId, setActiveExId] = useState(null) // which chip is open
  const [notes, setNotes] = useState('')
  const [rpe, setRpe] = useState(7)
  const [duration, setDuration] = useState('')
  const [saving, setSaving] = useState(false)
  const [scoreModal, setScoreModal] = useState(null)
  const [existingModal, setExistingModal] = useState(null)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customName, setCustomName] = useState('')

  // Assigned sessions — only for athletes with a coach
  const [assignedSessions, setAssignedSessions] = useState([])
  const [hasCoach, setHasCoach] = useState(false)
  const [completingSession, setCompletingSession] = useState(null)
  const [completingStep, setCompletingStep] = useState('exercises') // 'exercises' | 'confirm'
  const [completeRpe, setCompleteRpe] = useState(7)
  const [completeNotes, setCompleteNotes] = useState('')
  const [completing, setCompleting] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString()

    // Check if athlete has a coach
    const { data: coachLink } = await supabase
      .from('coach_clients').select('id')
      .eq('client_id', session.user.id).maybeSingle()
    const athleteHasCoach = !!coachLink
    setHasCoach(athleteHasCoach)

    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', session.user.id)
        .neq('rpe', 0).order('date', { ascending: false }),
      supabase.from('custom_exercises').select('*').eq('user_id', session.user.id),
    ])
    if (s) setSessions(s)
    if (c) setCustomExercises(c)

    // Only fetch assigned sessions if athlete has a coach
    if (athleteHasCoach) {
      const { data: assigned, error: aErr } = await supabase
        .from('sessions').select('*').eq('user_id', session.user.id)
        .eq('rpe', 0).gte('date', sevenDaysAgo).order('date', { ascending: false })
      console.log('Assigned sessions:', assigned, aErr)
      if (assigned) setAssignedSessions(assigned)
    }
    setLoading(false)
  }

  async function completeAssigned() {
    if (!completingSession) return
    setCompleting(true)
    const { error } = await supabase
      .from('sessions')
      .update({ rpe: completeRpe, notes: completeNotes || completingSession.notes })
      .eq('id', completingSession.id)
    if (!error) {
      // Move from assigned → completed
      setAssignedSessions(p => p.filter(s => s.id !== completingSession.id))
      setSessions(p => [{ ...completingSession, rpe: completeRpe, notes: completeNotes }, ...p])
      const score = getSarcasticScore(completingSession.exercises || [], completeRpe, completingSession.duration)
      setScoreModal(score)
    }
    setCompletingSession(null)
    setCompleting(false)
    setCompleteRpe(7)
    setCompleteNotes('')
  }

  async function dismissAssigned(id) {
    await supabase.from('sessions').delete().eq('id', id)
    setAssignedSessions(p => p.filter(s => s.id !== id))
  }

  const daySessions = sessions.filter(s => isSameDay(s.date, selectedDay))

  const allEx = [
    ...ALL_EXERCISES,
    ...customExercises.map(e => ({ name: e.name, cat: e.category || 'Custom', sub: 'Custom', isCustom: true }))
  ].filter((ex, i, self) => i === self.findIndex(e => e.name === ex.name))

  const filtered = (() => {
    let list = allEx
    if (activeCat) list = list.filter(e => e.cat === activeCat)
    if (query.trim()) list = list.filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
    else if (!activeCat) return []
    return list.slice(0, 25)
  })()

  function tapExercise(ex) {
    const already = exercises.find(e => e.name === ex.name)
    if (already) {
      setActiveExId(already.id)
      return
    }
    const ft = getFieldType(ex)
    const id = Date.now()
    const newEx = {
      id, ...ex, fieldType: ft,
      sets: ft === 'strength' ? [{ reps: '', weight: '' }] : ft === 'reps_only' ? [{ reps: '' }] : [],
      duration: '', distance: '', pace: '', setsCount: '', distanceM: '',
      completed: false,
    }
    setExercises(p => [...p, newEx])
    setActiveExId(id) // auto-open log sheet
  }

  function updSet(id, si, field, val) {
    setExercises(p => p.map(e => e.id === id ? { ...e, sets: e.sets.map((s, i) => i === si ? { ...s, [field]: val } : s) } : e))
  }

  function addSet(id) {
    setExercises(p => p.map(e => {
      if (e.id !== id) return e
      const newSet = e.fieldType === 'reps_only' ? { reps: '' } : { reps: '', weight: '' }
      return { ...e, sets: [...e.sets, newSet] }
    }))
  }

  function removeSet(id, si) {
    setExercises(p => p.map(e => e.id === id && e.sets.length > 1 ? { ...e, sets: e.sets.filter((_, i) => i !== si) } : e))
  }

  function updEx(id, field, val) {
    setExercises(p => p.map(e => e.id === id ? { ...e, [field]: val } : e))
  }

  function applyPreset(id, preset) {
    setExercises(p => p.map(e => {
      if (e.id !== id) return e
      return { ...e, sets: Array.from({ length: preset.sets }, () => ({ reps: preset.reps, weight: e.sets[0]?.weight || '' })) }
    }))
  }

  function markDone(id) {
    setExercises(p => p.map(e => e.id === id ? { ...e, completed: true } : e))
    setActiveExId(null)
  }

  async function saveCustom() {
    if (!customName.trim()) return
    const cat = activeCat || 'Custom'
    const { data } = await supabase.from('custom_exercises').insert({
      user_id: session.user.id, name: customName.trim(), category: cat,
    }).select().single()
    if (data) {
      setCustomExercises(p => [...p, data])
      tapExercise({ name: customName.trim(), cat, sub: 'Custom', isCustom: true })
    }
    setCustomName(''); setShowCustomInput(false)
  }

  function openForm() {
    const existing = daySessions[0]
    if (existing) setExistingModal(existing)
    else { setShowForm(true); setTimeout(() => searchRef.current?.focus(), 150) }
  }

  async function save() {
    if (!exercises.length) return
    setSaving(true)
    const cats = [...new Set(exercises.map(e => e.cat))]
    const type = cats.length === 1 ? cats[0] : 'Mixed'
    const result = getSarcasticScore(exercises, rpe, duration)
    const { data, error } = await supabase.from('sessions').insert({
      user_id: session.user.id, date: selectedDay, type, notes, rpe, duration,
      exercises: exercises.map(({ id, completed, ...ex }) => ex),
      muscle_groups: cats, hyrox_stations: [],
    }).select().single()
    if (!error && data) { setSessions(p => [data, ...p]); setScoreModal(result) }
    setSaving(false); setShowForm(false)
    setExercises([]); setNotes(''); setRpe(7); setDuration('')
    setQuery(''); setActiveCat(null); setActiveExId(null)
  }

  async function delSession(id) {
    if (!confirm('Delete this session?')) return
    await supabase.from('sessions').delete().eq('id', id)
    setSessions(p => p.filter(s => s.id !== id))
  }

  const activeEx = exercises.find(e => e.id === activeExId)
  const m = activeEx ? CAT_META[activeEx.cat] || CAT_META['Custom'] : null

  const inp = {
    background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 10,
    padding: '10px 12px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── SCORE MODAL ── */}
      {scoreModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setScoreModal(null)}>
          <div style={{ background: 'var(--card)', border: `1px solid ${scoreModal.color}30`, borderRadius: 28, padding: 28, width: '100%', maxWidth: 320, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{scoreModal.emoji}</div>
            {scoreModal.isRecovery ? (
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 24 }}>{scoreModal.msg}</p>
            ) : (
              <>
                <div style={{ fontSize: 72, fontWeight: 700, color: scoreModal.color, lineHeight: 1, marginBottom: 6 }}>{scoreModal.score}</div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.1em' }}>Training Score</p>
                <div style={{ background: 'var(--card2)', borderRadius: 14, padding: '12px 16px', marginBottom: 24 }}>
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{scoreModal.msg}</p>
                </div>
              </>
            )}
            <button onClick={() => setScoreModal(null)}
              style={{ width: '100%', background: '#FF5A1F', border: 'none', borderRadius: 14, padding: 14, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Got it 💪
            </button>
          </div>
        </div>
      )}

      {/* ── EXISTING SESSION MODAL ── */}
      {existingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setExistingModal(null)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, width: '100%', maxWidth: 320, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💪</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Session already logged</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              You have a {existingModal.type} session today with {(existingModal.exercises||[]).length} exercises.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => {
                setExercises((existingModal.exercises||[]).map((ex,i) => ({ ...ex, id: Date.now()+i, completed: true })))
                setShowForm(true); setExistingModal(null)
              }}
                style={{ background: '#FF5A1F', border: 'none', borderRadius: 12, padding: 13, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Add more exercises
              </button>
              <button onClick={() => { setShowForm(true); setExistingModal(null) }}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, padding: 13, color: 'var(--muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                Log new separate session
              </button>
              <button onClick={() => setExistingModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--subtle)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 8 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EXERCISE LOG SHEET (bottom sheet) ── */}
      {activeEx && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setActiveExId(null)}>
          <div style={{ width: '100%', maxWidth: 420, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>

            {/* Handle */}
            <div style={{ width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '0 auto 16px' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>{m?.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{activeEx.name}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>{activeEx.sub} · {activeEx.cat}</p>
              </div>
              <button onClick={() => { setExercises(p => p.filter(e => e.id !== activeEx.id)); setActiveExId(null) }}
                style={{ width: 32, height: 32, borderRadius: 10, background: '#15000015', border: '1px solid #EF444420', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Trash2 size={14} color="#EF4444" />
              </button>
            </div>

            {/* STRENGTH */}
            {activeEx.fieldType === 'strength' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Quick presets */}
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Quick presets</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PRESETS.map(pr => (
                      <button key={pr.label} onClick={() => applyPreset(activeEx.id, pr)}
                        style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card2)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {pr.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sets table */}
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 28px', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>SET</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>REPS</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>KG</span>
                    <span></span>
                  </div>
                  {activeEx.sets.map((set, si) => (
                    <div key={si} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 28px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <div style={{ height: 42, background: 'var(--bg2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{si+1}</div>
                      <input type="number" inputMode="numeric" placeholder="12" value={set.reps}
                        onChange={e => updSet(activeEx.id, si, 'reps', e.target.value)}
                        style={{ ...inp, height: 42, textAlign: 'center', padding: 0, fontSize: 18, fontWeight: 700, boxSizing: 'border-box', width: '100%' }} />
                      <input type="number" inputMode="decimal" placeholder="—" value={set.weight}
                        onChange={e => updSet(activeEx.id, si, 'weight', e.target.value)}
                        style={{ ...inp, height: 42, textAlign: 'center', padding: 0, fontSize: 18, fontWeight: 700, boxSizing: 'border-box', width: '100%' }} />
                      <button onClick={() => removeSet(activeEx.id, si)} disabled={activeEx.sets.length === 1}
                        style={{ height: 42, width: 28, borderRadius: 8, background: activeEx.sets.length === 1 ? 'transparent' : '#15000015', border: `1px solid ${activeEx.sets.length === 1 ? 'transparent' : '#EF444420'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: activeEx.sets.length === 1 ? 'not-allowed' : 'pointer' }}>
                        <Trash2 size={11} color={activeEx.sets.length === 1 ? 'var(--subtle)' : '#EF4444'} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addSet(activeEx.id)}
                    style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px dashed ${m?.color}40`, background: 'transparent', color: m?.color, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 2 }}>
                    + Add set
                  </button>
                </div>
              </div>
            )}

            {/* REPS ONLY */}
            {activeEx.fieldType === 'reps_only' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeEx.sets.map((set, si) => (
                  <div key={si} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 28px', gap: 8, alignItems: 'center' }}>
                    <div style={{ height: 42, background: 'var(--bg2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{si+1}</div>
                    <input type="number" inputMode="numeric" placeholder="15" value={set.reps}
                      onChange={e => {
                        const s = [...activeEx.sets]; s[si] = { reps: e.target.value }
                        updEx(activeEx.id, 'sets', s)
                      }}
                      style={{ ...inp, height: 42, textAlign: 'center', padding: 0, fontSize: 18, fontWeight: 700, boxSizing: 'border-box', width: '100%' }} />
                    <button onClick={() => removeSet(activeEx.id, si)} disabled={activeEx.sets.length === 1}
                      style={{ height: 42, width: 28, borderRadius: 8, background: activeEx.sets.length === 1 ? 'transparent' : '#15000015', border: `1px solid ${activeEx.sets.length === 1 ? 'transparent' : '#EF444420'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: activeEx.sets.length === 1 ? 'not-allowed' : 'pointer' }}>
                      <Trash2 size={11} color={activeEx.sets.length === 1 ? 'var(--subtle)' : '#EF4444'} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addSet(activeEx.id)}
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px dashed ${m?.color}40`, background: 'transparent', color: m?.color, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  + Add set
                </button>
              </div>
            )}

            {/* CARDIO RUN */}
            {activeEx.fieldType === 'cardio_run' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Distance (km)</p>
                    <input type="number" placeholder="5.0" value={activeEx.distance} onChange={e => updEx(activeEx.id,'distance',e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Duration (min)</p>
                    <input type="number" placeholder="30" value={activeEx.duration} onChange={e => updEx(activeEx.id,'duration',e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Pace (min/km)</p>
                  <input placeholder="5:30" value={activeEx.pace} onChange={e => updEx(activeEx.id,'pace',e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            {/* CARDIO MACHINE */}
            {activeEx.fieldType === 'cardio_machine' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Distance (m)</p>
                  <input type="number" placeholder="1000" value={activeEx.distanceM} onChange={e => updEx(activeEx.id,'distanceM',e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Time (min:sec)</p>
                  <input placeholder="4:32" value={activeEx.duration} onChange={e => updEx(activeEx.id,'duration',e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            {/* CARDIO CYCLE */}
            {activeEx.fieldType === 'cardio_cycle' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Distance (km)</p>
                  <input type="number" placeholder="30" value={activeEx.distance} onChange={e => updEx(activeEx.id,'distance',e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Duration (min)</p>
                  <input type="number" placeholder="60" value={activeEx.duration} onChange={e => updEx(activeEx.id,'duration',e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            {/* TIMED */}
            {activeEx.fieldType === 'timed' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Sets / Rounds</p>
                  <input type="number" placeholder="3" value={activeEx.setsCount} onChange={e => updEx(activeEx.id,'setsCount',e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Duration</p>
                  <input placeholder="60 sec" value={activeEx.duration} onChange={e => updEx(activeEx.id,'duration',e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            {/* SPORT */}
            {activeEx.fieldType === 'sport' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Duration (min)</p>
                  <input type="number" placeholder="60" value={activeEx.duration} onChange={e => updEx(activeEx.id,'duration',e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Notes</p>
                  <input placeholder="e.g. 3 rounds, intense sparring" value={activeEx.pace} onChange={e => updEx(activeEx.id,'pace',e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            {/* Done button */}
            <button onClick={() => markDone(activeEx.id)}
              style={{ width: '100%', background: `linear-gradient(135deg,${m?.color},${m?.color}cc)`, border: 'none', borderRadius: 14, padding: 15, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 20, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Check size={18} /> Done — log next exercise
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ padding: '0 16px 14px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.5px', color: 'var(--text)' }}>Training</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Log your sessions</p>
      </div>

      {/* ── WEEK STRIP ── */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px', marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {weekDates.map((date, i) => {
          const has = sessions.some(s => isSameDay(s.date, date))
          const isT = isSameDay(date, today)
          const isSel = isSameDay(date, selectedDay)
          const dn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]
          return (
            <button key={i} onClick={() => setSelectedDay(date)}
              style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 12px', borderRadius: 16, cursor: 'pointer', minWidth: 46, border: '1px solid', transition: '.2s', background: isSel ? '#FF5A1F' : isT ? '#150800' : 'var(--bg2)', borderColor: isSel ? '#FF5A1F' : isT ? '#FF5A1F40' : 'var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: isSel ? 'rgba(255,255,255,.6)' : 'var(--muted)', marginBottom: 4 }}>{dn}</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: isSel ? '#fff' : isT ? '#FF5A1F' : 'var(--text)' }}>{date.getDate()}</span>
              <div style={{ width: 4, height: 4, borderRadius: '50%', marginTop: 5, background: has ? (isSel ? '#fff' : '#FF5A1F') : 'transparent' }} />
            </button>
          )
        })}
      </div>

      {/* ── DAY ROW ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 14 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
          {isSameDay(selectedDay, today) ? 'Today' : new Date(selectedDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>
        <button onClick={openForm}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FF5A1F', border: 'none', borderRadius: 12, padding: '9px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={14} strokeWidth={3} /> Add session
        </button>
      </div>

      {/* ── LOADING ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: '#FF5A1F', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── COMPLETION MODAL — 2 steps: view exercises → confirm ── */}
      {completingSession && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
          onClick={() => { setCompletingSession(null); setCompletingStep('exercises') }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px 24px 0 0', padding: '20px 20px 44px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '0 auto 16px' }} />

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
              {['exercises','confirm'].map((s, i) => (
                <div key={s} style={{ height: 4, borderRadius: 2, transition: '.3s', background: completingStep === s ? '#FF5A1F' : 'var(--border)', width: completingStep === s ? 24 : 16 }} />
              ))}
            </div>

            {/* STEP 1 — Editable exercises */}
            {completingStep === 'exercises' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FF5A1F15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    {CAT_META[completingSession.type]?.icon || '💪'}
                  </div>
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{completingSession.type} Session</p>
                    <p style={{ fontSize: 12, color: '#FF5A1F' }}>📋 Assigned by your coach{completingSession.duration ? ` · ${completingSession.duration} min` : ''}</p>
                  </div>
                </div>

                {/* Coach note */}
                {completingSession.notes && (
                  <div style={{ background: '#FF5A1F10', border: '1px solid #FF5A1F25', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: '#FF5A1F', fontWeight: 600, marginBottom: 3 }}>Coach says:</p>
                    <p style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic' }}>"{completingSession.notes}"</p>
                  </div>
                )}

                {/* Editable hint */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '8px 12px', background: '#22C55E10', border: '1px solid #22C55E25', borderRadius: 10 }}>
                  <span style={{ fontSize: 14 }}>✏️</span>
                  <p style={{ fontSize: 12, color: '#22C55E', fontWeight: 500 }}>Edit weights & reps to match what you actually did</p>
                </div>

                {/* EDITABLE exercise list */}
                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                  Your workout · {(completingSession.exercises||[]).length} exercises
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {(completingSession.exercises || []).map((ex, ei) => {
                    const m = CAT_META[ex.cat] || CAT_META['Custom']
                    return (
                      <div key={ei} style={{ background: 'var(--card2)', border: `1px solid ${m.color}20`, borderRadius: 14, padding: '12px 14px' }}>
                        {/* Exercise header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 18 }}>{m.icon}</span>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{ex.name}</p>
                          <span style={{ fontSize: 10, color: m.color, background: m.color+'15', padding: '2px 8px', borderRadius: 6 }}>{ex.cat}</span>
                        </div>

                        {/* Editable sets */}
                        {ex.sets?.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Column headers */}
                            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', gap: 8 }}>
                              <span style={{ fontSize: 9, color: 'var(--muted)', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase' }}>SET</span>
                              <span style={{ fontSize: 9, color: 'var(--muted)', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase' }}>REPS</span>
                              <span style={{ fontSize: 9, color: 'var(--muted)', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase' }}>KG</span>
                            </div>
                            {ex.sets.map((set, si) => (
                              <div key={si} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', gap: 8, alignItems: 'center' }}>
                                <div style={{ height: 40, background: 'var(--bg2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>{si+1}</div>
                                <input
                                  type="number" inputMode="numeric"
                                  placeholder="reps"
                                  defaultValue={set.reps || ''}
                                  onChange={e => {
                                    const updated = JSON.parse(JSON.stringify(completingSession))
                                    updated.exercises[ei].sets[si].reps = e.target.value
                                    setCompletingSession(updated)
                                  }}
                                  style={{ height: 40, background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 8, textAlign: 'center', color: 'var(--text)', fontSize: 16, fontWeight: 700, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
                                />
                                <input
                                  type="number" inputMode="decimal"
                                  placeholder="kg"
                                  defaultValue={set.weight || ''}
                                  onChange={e => {
                                    const updated = JSON.parse(JSON.stringify(completingSession))
                                    updated.exercises[ei].sets[si].weight = e.target.value
                                    setCompletingSession(updated)
                                  }}
                                  style={{ height: 40, background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 8, textAlign: 'center', color: 'var(--text)', fontSize: 16, fontWeight: 700, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Cardio / timed fields */}
                        {!ex.sets?.length && (ex.target || ex.duration || ex.distance) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {ex.target && (
                              <div>
                                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Target</p>
                                <input defaultValue={ex.target}
                                  onChange={e => {
                                    const updated = JSON.parse(JSON.stringify(completingSession))
                                    updated.exercises[ei].target = e.target.value
                                    setCompletingSession(updated)
                                  }}
                                  style={{ width: '100%', height: 40, background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 8, padding: '0 12px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                              </div>
                            )}
                            {ex.duration !== undefined && (
                              <div>
                                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Duration</p>
                                <input defaultValue={ex.duration} placeholder="e.g. 30 min"
                                  onChange={e => {
                                    const updated = JSON.parse(JSON.stringify(completingSession))
                                    updated.exercises[ei].duration = e.target.value
                                    setCompletingSession(updated)
                                  }}
                                  style={{ width: '100%', height: 40, background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 8, padding: '0 12px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <button onClick={() => setCompletingStep('confirm')}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
                  Done — rate my session →
                </button>
                <button onClick={() => { setCompletingSession(null); setCompletingStep('exercises') }}
                  style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: 14, padding: 13, color: 'var(--muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Do it later
                </button>
              </>
            )}

            {/* STEP 2 — Rate & confirm completion */}
            {completingStep === 'confirm' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🏁</div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Session done?</p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Rate your effort and save it</p>
                </div>

                {/* RPE slider */}
                <div style={{ background: 'var(--card2)', borderRadius: 16, padding: '16px 14px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>How hard was it?</p>
                    <div style={{ background: '#FF5A1F', borderRadius: 10, padding: '4px 12px' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{completeRpe}/10</span>
                    </div>
                  </div>
                  <input type="range" min="1" max="10" value={completeRpe}
                    onChange={e => setCompleteRpe(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#FF5A1F', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>😌 Easy</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#FF5A1F' }}>
                      {completeRpe >= 9 ? '🔥 Max effort' : completeRpe >= 7 ? '💪 Hard' : completeRpe >= 5 ? '😤 Moderate' : '😌 Light'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>🔥 Max</span>
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Notes for your coach (optional)</p>
                  <textarea placeholder="How did it go? Any PRs? Anything your coach should know..."
                    value={completeNotes} onChange={e => setCompleteNotes(e.target.value)} rows={3}
                    style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 12, padding: '10px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
                </div>

                <button onClick={completeAssigned} disabled={completing}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#22C55E,#16A34A)', border: 'none', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, opacity: completing ? 0.7 : 1 }}>
                  {completing ? 'Saving...' : '✅ Yes, I completed this session!'}
                </button>
                <button onClick={() => setCompletingStep('exercises')}
                  style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: 14, padding: 13, color: 'var(--muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ← Back to exercises
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ASSIGNED SESSIONS (coach-assigned, pending) ── */}
      {assignedSessions.length > 0 && (
        <div style={{ margin: '0 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5A1F', animation: 'pulse 2s infinite' }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Assigned by Coach</p>
            <span style={{ background: '#FF5A1F', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{assignedSessions.length}</span>
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
          {assignedSessions.map(s => {
            const meta = CAT_META[s.type] || CAT_META['Mixed']
            const sessionDate = new Date(s.date)
            const isToday = isSameDay(sessionDate, new Date())
            const isPast = sessionDate < new Date() && !isToday
            return (
              <div key={s.id} style={{ background: 'var(--card)', border: `2px solid #FF5A1F30`, borderRadius: 18, padding: 16, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
                {/* Orange glow top */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#FF5A1F,#FF8C42)' }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: meta.color+'15', border: `1px solid ${meta.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{s.type}</p>
                      <span style={{ fontSize: 10, color: '#FF5A1F', background: '#FF5A1F15', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                        📋 Coach assigned
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {isToday ? 'For today' : isPast ? `${sessionDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} (overdue)` : sessionDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {s.duration ? ` · ${s.duration} min` : ''}
                      {` · ${(s.exercises||[]).length} exercises`}
                    </p>
                    {s.notes && <p style={{ fontSize: 11, color: '#FF5A1F', marginTop: 4, fontStyle: 'italic' }}>"{s.notes}"</p>}
                  </div>
                  <button onClick={() => dismissAssigned(s.id)}
                    style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--card2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <X size={12} color="var(--muted)" />
                  </button>
                </div>

                {/* Exercise preview pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                  {(s.exercises || []).slice(0, 4).map((ex, i) => (
                    <span key={i} style={{ fontSize: 11, color: meta.color, background: meta.color+'15', padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
                      {ex.name}
                    </span>
                  ))}
                  {(s.exercises||[]).length > 4 && (
                    <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--card2)', padding: '3px 10px', borderRadius: 20 }}>
                      +{(s.exercises||[]).length - 4} more
                    </span>
                  )}
                </div>

                <button onClick={() => { setCompletingSession(s); setCompleteRpe(7); setCompleteNotes('') }}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#22C55E,#16A34A)', border: 'none', borderRadius: 12, padding: '12px 0', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✅ I did this session!
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!loading && daySessions.length === 0 && assignedSessions.filter(s => isSameDay(s.date, selectedDay)).length === 0 && !showForm && (
        <div style={{ margin: '0 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '36px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🛌</div>
          <p style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>No sessions logged</p>
          <p style={{ color: 'var(--subtle)', fontSize: 12, marginTop: 4 }}>Tap + Add session to get started</p>
        </div>
      )}

      {/* ── SESSION CARDS ── */}
      {daySessions.map(s => {
        const meta = CAT_META[s.type] || CAT_META['Mixed']
        const isExp = expandedId === s.id
        return (
          <div key={s.id} style={{ margin: '0 16px 10px', background: 'var(--card)', border: `1px solid ${isExp ? meta.color+'30' : 'var(--border)'}`, borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setExpandedId(isExp ? null : s.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: meta.color+'15', border: `1px solid ${meta.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{meta.icon}</div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{s.type}</p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                    {s.duration && <span style={{ fontSize: 11, color: 'var(--muted)' }}>⏱ {s.duration}m</span>}
                    {s.rpe && <span style={{ fontSize: 11, color: 'var(--muted)' }}>RPE {s.rpe}/10</span>}
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{(s.exercises||[]).length} exercises</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={e => { e.stopPropagation(); delSession(s.id) }}
                  style={{ width: 32, height: 32, borderRadius: 9, background: '#15000015', border: '1px solid #EF444415', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={13} color="#EF4444" />
                </button>
                {isExp ? <ChevronUp size={16} color="var(--subtle)" /> : <ChevronDown size={16} color="var(--subtle)" />}
              </div>
            </div>
            {isExp && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.notes && <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>"{s.notes}"</p>}
                {(s.exercises||[]).map((ex,i) => (
                  <div key={i} style={{ background: 'var(--bg2)', borderRadius: 12, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{ex.name}</p>
                      <span style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--card)', padding: '2px 8px', borderRadius: 6 }}>{ex.sub || ex.cat}</span>
                    </div>
                    {ex.fieldType === 'strength' && (ex.sets||[]).map((set,si) => (
                      <p key={si} style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        Set {si+1} · {set.reps||'—'} reps {set.weight ? `@ ${set.weight}kg` : ''}
                      </p>
                    ))}
                    {ex.fieldType === 'reps_only' && (ex.sets||[]).map((set,si) => (
                      <p key={si} style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        Set {si+1} · {set.reps||'—'} reps
                      </p>
                    ))}
                    {(ex.fieldType === 'cardio_run' || ex.fieldType === 'cardio_cycle') && (
                      <p style={{ fontSize: 12, color: '#3B82F6' }}>
                        {[ex.distance&&`${ex.distance}km`, ex.duration&&`${ex.duration}min`, ex.pace&&`${ex.pace}/km`].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {ex.fieldType === 'cardio_machine' && (
                      <p style={{ fontSize: 12, color: '#3B82F6' }}>
                        {[ex.distanceM&&`${ex.distanceM}m`, ex.duration&&`${ex.duration}`].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {(ex.fieldType === 'timed' || ex.fieldType === 'sport') && (
                      <p style={{ fontSize: 12, color: '#A855F7' }}>
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

      {/* ── ADD SESSION FORM ── */}
      {showForm && (
        <div style={{ margin: '0 16px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 22, overflow: 'hidden' }}>

          {/* Form header */}
          <div style={{ padding: '14px 16px', background: 'var(--card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Add Exercises</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {exercises.length === 0 ? 'Search or pick a category' : `${exercises.length} exercise${exercises.length > 1 ? 's' : ''} added`}
              </p>
            </div>
            <button onClick={() => { setShowForm(false); setExercises([]); setQuery(''); setActiveCat(null); setActiveExId(null) }}
              style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={15} color="var(--muted)" />
            </button>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Added exercise chips */}
            {exercises.length > 0 && (
              <div>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
                  Tap to log sets ↓
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {exercises.map(ex => {
                    const cm = CAT_META[ex.cat] || CAT_META['Custom']
                    const isDone = ex.completed
                    return (
                      <button key={ex.id} onClick={() => setActiveExId(ex.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, border: `2px solid ${isDone ? '#22C55E' : cm.color}`, background: isDone ? '#22C55E15' : cm.color+'15', cursor: 'pointer', fontFamily: 'inherit', transition: '.15s' }}>
                        {isDone ? <Check size={13} color="#22C55E" strokeWidth={3} /> : <span style={{ fontSize: 14 }}>{cm.icon}</span>}
                        <span style={{ fontSize: 13, fontWeight: 600, color: isDone ? '#22C55E' : cm.color }}>{ex.name}</span>
                        <button onClick={e => { e.stopPropagation(); setExercises(p => p.filter(e2 => e2.id !== ex.id)) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDone ? '#22C55E' : cm.color, padding: 0, display: 'flex', alignItems: 'center', marginLeft: 2 }}>
                          <X size={11} />
                        </button>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Search bar */}
            <div style={{ position: 'relative' }}>
              <Search size={15} color="var(--muted)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input ref={searchRef} placeholder="Search any exercise..." value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ ...inp, width: '100%', paddingLeft: 40, paddingTop: 12, paddingBottom: 12, borderRadius: 14, fontSize: 14, boxSizing: 'border-box' }}
              />
              {query && (
                <button onClick={() => setQuery('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={14} color="var(--muted)" />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
              <button onClick={() => setActiveCat(null)}
                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', fontFamily: 'inherit', background: !activeCat ? '#FF5A1F' : 'transparent', borderColor: !activeCat ? '#FF5A1F' : 'var(--border)', color: !activeCat ? '#fff' : 'var(--muted)' }}>
                All
              </button>
              {Object.entries(CAT_META).filter(([k]) => k !== 'Mixed').map(([cat, meta]) => {
                const on = activeCat === cat
                return (
                  <button key={cat} onClick={() => setActiveCat(on ? null : cat)}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', fontFamily: 'inherit', background: on ? meta.color+'20' : 'transparent', borderColor: on ? meta.color : 'var(--border)', color: on ? meta.color : 'var(--muted)' }}>
                    {meta.icon} {cat}
                  </button>
                )
              })}
            </div>

            {/* Prompt when nothing typed */}
            {!query && !activeCat && exercises.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>Type to search or pick a category</p>
              </div>
            )}

            {/* Search results */}
            {(query || activeCat) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filtered.length === 0 ? (
                  <div>
                    <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>No results for "{query}"</p>
                    {!showCustomInput && (
                      <button onClick={() => { setCustomName(query); setShowCustomInput(true) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 12, border: '1px dashed #FF5A1F40', background: 'transparent', color: '#FF5A1F', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        ⭐ Add "{query}" to my library
                      </button>
                    )}
                  </div>
                ) : filtered.map(ex => {
                  const isAdded = !!exercises.find(e => e.name === ex.name)
                  const em = CAT_META[ex.cat] || CAT_META['Custom']
                  return (
                    <button key={ex.name} onClick={() => tapExercise(ex)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, border: `1px solid ${isAdded ? em.color+'40' : 'var(--border)'}`, background: isAdded ? em.color+'10' : 'var(--bg2)', cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{em.icon}</span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: isAdded ? 600 : 500, color: isAdded ? em.color : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{ex.sub} · {ex.cat}</p>
                        </div>
                      </div>
                      {isAdded
                        ? <div style={{ width: 26, height: 26, borderRadius: '50%', background: em.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={12} color="#fff" strokeWidth={3} /></div>
                        : <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Plus size={12} color="var(--muted)" /></div>
                      }
                    </button>
                  )
                })}
                {filtered.length === 25 && <p style={{ fontSize: 11, color: 'var(--subtle)', textAlign: 'center' }}>Showing top 25 — type more to narrow down</p>}
              </div>
            )}

            {/* Custom exercise input */}
            {showCustomInput && (
              <div style={{ display: 'flex', gap: 8, padding: 12, background: 'var(--bg2)', borderRadius: 14, border: '1px solid #FF5A1F20' }}>
                <input placeholder="Exercise name..." value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveCustom()}
                  autoFocus
                  style={{ ...inp, flex: 1 }} />
                <button onClick={saveCustom} disabled={!customName.trim()}
                  style={{ background: '#FF5A1F', border: 'none', borderRadius: 10, padding: '0 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !customName.trim() ? 0.4 : 1 }}>
                  Add
                </button>
                <button onClick={() => { setShowCustomInput(false); setCustomName('') }}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 10px', color: 'var(--muted)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Session meta — only show when exercises added */}
            {exercises.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Duration (min)</p>
                    <input type="number" placeholder="60" value={duration} onChange={e => setDuration(e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Effort · {rpe}/10</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <input type="range" min="1" max="10" value={rpe} onChange={e => setRpe(Number(e.target.value))} style={{ flex: 1, accentColor: '#FF5A1F' }} />
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#FF5A1F', minWidth: 20 }}>{rpe}</span>
                    </div>
                  </div>
                </div>
                <textarea placeholder="Session notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  style={{ ...inp, width: '100%', resize: 'none', lineHeight: 1.6, boxSizing: 'border-box' }} />
                <button onClick={save} disabled={saving}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(255,90,31,.3)', letterSpacing: '.02em' }}>
                  {saving ? 'Saving...' : `Save Session · ${exercises.length} exercise${exercises.length > 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}