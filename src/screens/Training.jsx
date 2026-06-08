import { useState, useEffect, useRef } from 'react'
import { X, Trash2, ChevronDown, ChevronUp, Plus, Search, ArrowLeft, Check } from 'lucide-react'
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

const CATS = ['Strength', 'Conditioning', 'Skills', 'Mobility', 'Custom']

function detectType(exs) {
  if (!exs.length) return null
  const cats = [...new Set(exs.map(e => e.cat))]
  return cats.length === 1 ? cats[0] : 'Mixed'
}

function getFieldType(cat, exerciseFieldType) {
  // Use the fieldType from the exercise database if available
  if (exerciseFieldType) return exerciseFieldType
  // Fallback
  if (cat === 'Mobility') return 'timed'
  if (cat === 'Skills') return 'sport'
  if (cat === 'Conditioning') return 'reps_only'
  return 'strength'
}

function getScore(exs, rpe, dur) {
  const mobOnly = exs.every(e => e.cat === 'Mobility')
  if (mobOnly) return {
    isRecovery: true, emoji: '🧘', color: '#A855F7',
    msg: 'Smart move. Recovery sessions are what separate serious athletes from the injured ones.',
  }
  let s = 0
  const sets = exs.reduce((a, e) => a + (e.sets?.length || 1), 0)
  if (sets >= 20) s += 30; else if (sets >= 12) s += 20; else if (sets >= 6) s += 10
  if (rpe >= 8) s += 30; else if (rpe >= 6) s += 20; else if (rpe >= 4) s += 10
  const d = Number(dur) || 0
  if (d >= 60) s += 25; else if (d >= 40) s += 15; else if (d >= 20) s += 8
  if (exs.length >= 6) s += 15; else if (exs.length >= 3) s += 8
  s = Math.min(s, 100)
  if (s >= 85) return { isRecovery: false, score: s, emoji: '🔥', color: '#22C55E', msg: `${s}/100. That was genuinely solid. Don't let it go to your head — but don't stop either.` }
  if (s >= 70) return { isRecovery: false, score: s, emoji: '💪', color: '#3B82F6', msg: `${s}/100. Solid effort. Not legendary, but consistent — and consistent wins.` }
  if (s >= 50) return { isRecovery: false, score: s, emoji: '😐', color: '#FF8C42', msg: `${s}/100. You showed up. That's the bare minimum. Push harder next time.` }
  if (s >= 30) return { isRecovery: false, score: s, emoji: '😬', color: '#FF5A1F', msg: `${s}/100. Your warm-up had more energy than this session. What happened?` }
  return { isRecovery: false, score: s, emoji: '💀', color: '#EF4444', msg: `${s}/100. Respectfully — what was that? Add weight, add sets, add effort.` }
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

  // Data
  const [selectedDay, setSelectedDay] = useState(today)
  const [sessions, setSessions] = useState([])
  const [customExercises, setCustomExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  // Modals
  const [scoreModal, setScoreModal] = useState(null)
  const [setsPicker, setSetsPicker] = useState(null)
  const [existingModal, setExistingModal] = useState(null)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState('search') // 'search' | 'log'
  const [activeCat, setActiveCat] = useState(null)
  const [query, setQuery] = useState('')
  const [exercises, setExercises] = useState([])
  const [notes, setNotes] = useState('')
  const [rpe, setRpe] = useState(7)
  const [duration, setDuration] = useState('')
  const [saving, setSaving] = useState(false)
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

  const allEx = [
    ...ALL_EXERCISES,
    ...customExercises.map(e => ({ name: e.name, cat: e.category || 'Custom', sub: 'Custom', isCustom: true }))
  ].filter((ex, index, self) => 
    index === self.findIndex(e => e.name === ex.name)
  )

  const filtered = (() => {
    let list = allEx
    if (activeCat) list = list.filter(e => e.cat === activeCat)
    if (query.trim()) list = list.filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
    else if (!activeCat) return []
    return list.slice(0, 20)
  })()

  function tapExercise(ex) {
  const already = exercises.find(e => e.name === ex.name)
  if (already) { setExercises(p => p.filter(e => e.name !== ex.name)); return }
  const ft = getFieldType(ex.cat, ex.fieldType)
  if (ft === 'strength') { setSetsPicker(ex); return }
  setExercises(p => [...p, {
    id: Date.now(), ...ex, fieldType: ft,
    sets: [], duration: '', distance: '', pace: '', setsCount: '',
    distanceM: '', // for machine (meters)
  }])
}

  function addWithSets(ex, n) {
    setExercises(p => [...p, {
      id: Date.now(), ...ex, fieldType: 'strength',
      sets: Array.from({ length: n }, () => ({ reps: '', weight: '' }))
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
      user_id: session.user.id, name: customName.trim(),
      category: cat, sport_type: profile?.sport || 'general',
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
    setActiveCat(null); setQuery(''); setShowCustomInput(false)
    setCustomName(''); setStep('search')
  }

  function openForm() {
    const existing = daySessions[0]
    if (existing) {
      setExistingModal(existing)
    } else {
      setShowForm(true)
      setExpandedId(null)
      setTimeout(() => searchRef.current?.focus(), 150)
    }
  }

  const detectedType = detectType(exercises)
  const typeMeta = detectedType ? CAT_META[detectedType] || CAT_META['Mixed'] : null

  const inp = {
    background: 'var(--input-bg)', border: '1px solid #252525', borderRadius: 10,
    padding: '10px 12px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── SETS PICKER MODAL ── */}
      {setsPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setSetsPicker(null)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid #222', borderRadius: 28, padding: 28, width: '100%', maxWidth: 290, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Adding</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{setsPicker.name}</p>
            <p style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 24 }}>How many sets?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <button key={n} onClick={() => addWithSets(setsPicker, n)}
                  style={{ height: 56, borderRadius: 16, background: 'var(--card)', border: '1px solid #222', color: 'var(--text)', fontSize: 22, fontWeight: 700, cursor: 'pointer', transition: '.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FF5A1F'; e.currentTarget.style.borderColor = '#FF5A1F' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.borderColor = '#222' }}>
                  {n}
                </button>
              ))}
            </div>
            <button onClick={() => setSetsPicker(null)}
              style={{ fontSize: 13, color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── EXISTING SESSION MODAL ── */}
      {existingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setExistingModal(null)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid #222', borderRadius: 24, padding: 24, width: '100%', maxWidth: 320, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💪</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Session already logged</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              You have a {existingModal.type} session today with {(existingModal.exercises || []).length} exercises.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => {
                setExercises((existingModal.exercises || []).map((ex, i) => ({ ...ex, id: Date.now() + i })))
                setStep('search')
                setShowForm(true)
                setExistingModal(null)
                setTimeout(() => searchRef.current?.focus(), 150)
              }}
                style={{ background: '#FF5A1F', border: 'none', borderRadius: 12, padding: 13, color: 'var(--text)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Add to existing session
              </button>
              <button onClick={() => {
                setShowForm(true)
                setExistingModal(null)
                setTimeout(() => searchRef.current?.focus(), 150)
              }}
                style={{ background: 'transparent', border: '1px solid #222', borderRadius: 12, padding: 13, color: '#888', fontSize: 14, cursor: 'pointer' }}>
                Log new separate session
              </button>
              <button onClick={() => setExistingModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', padding: 8 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCORE MODAL ── */}
      {scoreModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setScoreModal(null)}>
          <div style={{ background: 'var(--card)', border: `1px solid ${scoreModal.color}25`, borderRadius: 28, padding: 32, width: '100%', maxWidth: 310, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>{scoreModal.emoji}</div>
            {scoreModal.isRecovery ? (
              <>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#A855F7', marginBottom: 12 }}>Recovery Day</p>
                <p style={{ fontSize: 14, color: '#777', lineHeight: 1.7, marginBottom: 24 }}>{scoreModal.msg}</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 76, fontWeight: 700, color: scoreModal.color, lineHeight: 1, marginBottom: 6 }}>{scoreModal.score}</div>
                <p style={{ fontSize: 11, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600, marginBottom: 20 }}>Training Score</p>
                <div style={{ background: 'var(--card2)', borderRadius: 14, padding: '14px 18px', marginBottom: 24 }}>
                  <p style={{ fontSize: 14, color: '#999', lineHeight: 1.7 }}>{scoreModal.msg}</p>
                </div>
              </>
            )}
            <button onClick={() => setScoreModal(null)}
              style={{ width: '100%', background: '#FF5A1F', border: 'none', borderRadius: 14, padding: 15, color: 'var(--text)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {scoreModal.isRecovery ? 'Rest well 🙏' : 'Got it 💪'}
            </button>
          </div>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div style={{ padding: '0 20px 16px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.5px', color: 'var(--text)' }}>Training</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Log your sessions</p>
      </div>

      {/* ── WEEK STRIP ── */}
      <div style={{ display: 'flex', gap: 8, padding: '0 20px', marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {weekDates.map((date, i) => {
          const has = sessions.some(s => isSameDay(s.date, date))
          const isT = isSameDay(date, today)
          const isSel = isSameDay(date, selectedDay)
          const dn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
          return (
            <button key={i} onClick={() => setSelectedDay(date)}
              style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 12px', borderRadius: 16, cursor: 'pointer', minWidth: 46, border: '1px solid', transition: '.2s', background: isSel ? '#FF5A1F' : isT ? '#150800' : 'var(--bg2)', borderColor: isSel ? '#FF5A1F' : isT ? '#FF5A1F40' : 'var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: isSel ? 'rgba(255,255,255,.6)' : '#333', marginBottom: 4 }}>{dn}</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: isSel ? '#fff' : isT ? '#FF5A1F' : '#fff' }}>{date.getDate()}</span>
              <div style={{ width: 4, height: 4, borderRadius: '50%', marginTop: 5, background: has ? (isSel ? '#fff' : '#FF5A1F') : 'transparent' }} />
            </button>
          )
        })}
      </div>

      {/* ── DAY ROW ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 14 }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
          {isSameDay(selectedDay, today) ? 'Today' : new Date(selectedDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>
        <button onClick={openForm}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FF5A1F', border: 'none', borderRadius: 12, padding: '9px 18px', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} strokeWidth={3} /> Add session
        </button>
      </div>

      {/* ── LOADING ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#FF5A1F', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!loading && daySessions.length === 0 && !showForm && (
        <div style={{ margin: '0 20px', background: 'var(--card)', border: '1px solid #141414', borderRadius: 20, padding: '36px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🛌</div>
          <p style={{ color: 'var(--subtle)', fontSize: 14, fontWeight: 500 }}>No sessions logged</p>
          <p style={{ color: '#222', fontSize: 12, marginTop: 4 }}>Tap + Add session to get started</p>
        </div>
      )}

      {/* ── SESSION CARDS ── */}
      {daySessions.map(s => {
        const meta = CAT_META[s.type] || CAT_META['Mixed']
        const isExp = expandedId === s.id
        return (
          <div key={s.id} style={{ margin: '0 20px 10px', background: 'var(--card)', border: `1px solid ${isExp ? meta.color + '30' : 'var(--card)'}`, borderRadius: 18, overflow: 'hidden', transition: '.2s border-color' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setExpandedId(isExp ? null : s.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: meta.color + '15', border: `1px solid ${meta.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {meta.icon}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{s.type}</p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                    {s.duration && <span style={{ fontSize: 11, color: 'var(--muted)' }}>⏱ {s.duration}m</span>}
                    {s.rpe && <span style={{ fontSize: 11, color: 'var(--muted)' }}>RPE {s.rpe}/10</span>}
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{(s.exercises || []).length} exercises</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={e => { e.stopPropagation(); delSession(s.id) }}
                  style={{ width: 32, height: 32, borderRadius: 9, background: '#150000', border: '1px solid #EF444415', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={13} color="#EF4444" />
                </button>
                <div style={{ color: 'var(--border2)' }}>
                  {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </div>
            {isExp && (
              <div style={{ borderTop: '1px solid #111', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.notes && <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', paddingBottom: 8, borderBottom: '1px solid #111' }}>"{s.notes}"</p>}
                {(s.exercises || []).map((ex, i) => (
                  <div key={i} style={{ background: 'var(--bg2)', borderRadius: 12, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>{ex.name}</p>
                      <span style={{ fontSize: 10, color: 'var(--subtle)', background: 'var(--card)', padding: '2px 8px', borderRadius: 6 }}>{ex.sub || ex.cat}</span>
                    </div>
                    {ex.fieldType === 'strength' && (ex.sets || []).map((set, si) => (
                      <p key={si} style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        Set {si + 1} · {set.reps || '—'} reps {set.weight ? `@ ${set.weight}kg` : ''}
                      </p>
                    ))}
                    {ex.fieldType === 'cardio' && (
                      <p style={{ fontSize: 12, color: '#3B82F6' }}>
                        {[ex.distance && `${ex.distance}km`, ex.duration && `${ex.duration}min`, ex.pace && `${ex.pace}/km`].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {ex.fieldType === 'timed' && (
                      <p style={{ fontSize: 12, color: '#A855F7' }}>
                        {[ex.setsCount && `${ex.setsCount}x`, ex.duration].filter(Boolean).join(' · ')}
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
        <div style={{ margin: '0 20px 16px', background: 'var(--card)', border: '1px solid #1a1a1a', borderRadius: 22, overflow: 'hidden' }}>

          {/* Sticky header */}
          <div style={{ padding: '14px 16px', background: 'var(--card)', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {step === 'search' ? 'Add Exercises' : 'Log Your Sets'}
              </p>
              {detectedType
                ? <p style={{ fontSize: 11, color: typeMeta?.color, marginTop: 2 }}>{typeMeta?.icon} {detectedType} · {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</p>
                : <p style={{ fontSize: 11, color: 'var(--border2)', marginTop: 2 }}>Search or pick a category</p>
              }
            </div>
            <button onClick={() => { setShowForm(false); reset() }}
              style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--card2)', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={15} color="#444" />
            </button>
          </div>

          {/* ── STEP 1: SEARCH ── */}
          {step === 'search' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '65vh' }}>

              {/* Scrollable search area */}
              <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Search input */}
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#444" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    ref={searchRef}
                    placeholder="Search any exercise..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    style={{ ...inp, width: '100%', paddingLeft: 42, paddingTop: 13, paddingBottom: 13, borderRadius: 14, fontSize: 15, boxSizing: 'border-box' }}
                  />
                  {query && (
                    <button onClick={() => setQuery('')}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <X size={14} color="#444" />
                    </button>
                  )}
                </div>

                {/* Category pills */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                  <button onClick={() => setActiveCat(null)}
                    style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: !activeCat ? '#FF5A1F' : 'transparent', borderColor: !activeCat ? '#FF5A1F' : '#1e1e1e', color: !activeCat ? '#fff' : '#444' }}>
                    All
                  </button>
                  {CATS.map(cat => {
                    const m = CAT_META[cat]
                    const on = activeCat === cat
                    return (
                      <button key={cat} onClick={() => setActiveCat(on ? null : cat)}
                        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap', background: on ? m.color + '20' : 'transparent', borderColor: on ? m.color : '#1e1e1e', color: on ? m.color : '#444' }}>
                        {m.icon} {cat}
                      </button>
                    )
                  })}
                </div>

                {/* Prompt */}
                {!query && !activeCat && (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                    <p style={{ color: 'var(--subtle)', fontSize: 14 }}>Type to search exercises</p>
                    <p style={{ color: '#222', fontSize: 12, marginTop: 4 }}>or tap a category above</p>
                  </div>
                )}

                {/* Results */}
                {(query || activeCat) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {filtered.length === 0 ? (
                      <div style={{ padding: '12px 0' }}>
                        <p style={{ color: 'var(--subtle)', fontSize: 13, marginBottom: 10 }}>No results — add "{query}" as custom</p>
                        {!showCustomInput && (
                          <button onClick={() => { setCustomName(query); setShowCustomInput(true) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 12, border: '1px dashed #FF5A1F40', background: 'transparent', color: '#FF5A1F', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            ⭐ Add "{query}" to my library
                          </button>
                        )}
                      </div>
                    ) : filtered.map(ex => {
                      const isAdded = !!exercises.find(e => e.name === ex.name)
                      const m = CAT_META[ex.cat] || CAT_META['Custom']
                      return (
                        <button key={ex.name} onClick={() => tapExercise(ex)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, border: `1px solid ${isAdded ? m.color + '30' : 'var(--card)'}`, background: isAdded ? m.color + '10' : 'var(--bg2)', cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>{m.icon}</span>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: isAdded ? 600 : 500, color: isAdded ? m.color : '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</p>
                              <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 1 }}>{ex.sub} · {ex.cat}</p>
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, marginLeft: 8 }}>
                            {isAdded
                              ? <div style={{ width: 26, height: 26, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} color="#fff" strokeWidth={3} /></div>
                              : <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #252525', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={13} color="#444" /></div>
                            }
                          </div>
                        </button>
                      )
                    })}
                    {filtered.length === 20 && (
                      <p style={{ fontSize: 11, color: '#222', textAlign: 'center', padding: '6px 0' }}>Showing top 20 — type more to narrow down</p>
                    )}
                  </div>
                )}

                {/* Custom input */}
                {showCustomInput && (
                  <div style={{ display: 'flex', gap: 8, padding: 12, background: 'var(--bg2)', borderRadius: 14, border: '1px solid #FF5A1F20' }}>
                    <input placeholder="Custom exercise name..." value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveCustom()}
                      autoFocus
                      style={{ ...inp, flex: 1 }} />
                    <button onClick={saveCustom} disabled={!customName.trim()}
                      style={{ background: '#FF5A1F', border: 'none', borderRadius: 10, padding: '0 16px', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !customName.trim() ? 0.4 : 1 }}>
                      Add
                    </button>
                    <button onClick={() => { setShowCustomInput(false); setCustomName('') }}
                      style={{ background: 'var(--card)', border: '1px solid #1e1e1e', borderRadius: 10, padding: '0 10px', color: 'var(--muted)', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* STICKY BOTTOM — always visible */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid #111', background: 'var(--card)' }}>

                {/* Added chips */}
                {exercises.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {exercises.map(ex => {
                        const m = CAT_META[ex.cat] || CAT_META['Custom']
                        return (
                          <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: m.color + '15', border: `1px solid ${m.color}30` }}>
                            <span style={{ fontSize: 12 }}>{m.icon}</span>
                            <span style={{ fontSize: 11, color: m.color, fontWeight: 600 }}>{ex.name}</span>
                            <button onClick={() => setExercises(p => p.filter(e => e.id !== ex.id))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.color, padding: 0, display: 'flex', alignItems: 'center' }}>
                              <X size={10} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Continue button — ALWAYS VISIBLE */}
                <button
                  onClick={() => exercises.length > 0 && setStep('log')}
                  disabled={!exercises.length}
                  style={{
                    width: '100%',
                    background: exercises.length ? 'linear-gradient(135deg,#FF5A1F,#FF8C42)' : '#111',
                    border: 'none',
                    borderRadius: 14,
                    padding: 15,
                    color: exercises.length ? '#fff' : '#333',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: exercises.length ? 'pointer' : 'not-allowed',
                    boxShadow: exercises.length ? '0 4px 20px rgba(255,90,31,.25)' : 'none',
                  }}>
                  {exercises.length
                    ? `Continue — Log ${exercises.length} exercise${exercises.length > 1 ? 's' : ''} →`
                    : 'Search and add exercises above'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: LOG ── */}
          {step === 'log' && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto', scrollbarWidth: 'none' }}>

              {/* Back button */}
              <button onClick={() => setStep('search')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                <ArrowLeft size={14} /> Add more exercises
              </button>

              {/* Exercise blocks */}
              {exercises.map(ex => {
                const m = CAT_META[ex.cat] || CAT_META['Custom']
                return (
                  <div key={ex.id} style={{ background: 'var(--bg2)', border: `1px solid ${m.color}15`, borderRadius: 16, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{m.icon}</span>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{ex.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 1 }}>{ex.sub} · {ex.cat}</p>
                        </div>
                      </div>
                      <button onClick={() => setExercises(p => p.filter(e => e.id !== ex.id))}
                        style={{ width: 30, height: 30, borderRadius: 9, background: '#150000', border: '1px solid #EF444415', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={12} color="#EF4444" />
                      </button>
                    </div>

                    {/* STRENGTH */}
                    {/* STRENGTH: reps + weight */}
                    {ex.fieldType === 'strength' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ex.sets.map((set, si) => (
                          <div key={si} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                            <div style={{ width: 28, height: 40, borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--muted)', fontWeight: 700, flexShrink: 0 }}>{si + 1}</div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Reps</p>
                              <input type="number" inputMode="numeric" placeholder="12" value={set.reps}
                                onChange={e => updSet(ex.id, si, 'reps', e.target.value)}
                                style={{ ...inp, width: '100%', height: 40, textAlign: 'center', padding: 0, fontSize: 17, fontWeight: 700, boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>kg</p>
                              <input type="number" inputMode="decimal" placeholder="—" value={set.weight}
                                onChange={e => updSet(ex.id, si, 'weight', e.target.value)}
                                style={{ ...inp, width: '100%', height: 40, textAlign: 'center', padding: 0, fontSize: 17, fontWeight: 700, boxSizing: 'border-box' }} />
                            </div>
                            <button onClick={() => removeSet(ex.id, si)} disabled={ex.sets.length === 1}
                              style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: ex.sets.length === 1 ? 'transparent' : '#150000', border: `1px solid ${ex.sets.length === 1 ? 'transparent' : '#EF444415'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: ex.sets.length === 1 ? 'not-allowed' : 'pointer', marginBottom: 4 }}>
                              <Trash2 size={12} color={ex.sets.length === 1 ? 'var(--subtle)' : '#EF4444'} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addSet(ex.id)}
                          style={{ width: '100%', padding: 9, borderRadius: 10, border: `1px dashed ${m.color}25`, background: 'transparent', color: m.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: .7 }}>
                          + Add set
                        </button>
                      </div>
                    )}

                    {/* REPS ONLY: just reps, no weight */}
                    {ex.fieldType === 'reps_only' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(ex.sets?.length ? ex.sets : [{ reps: '' }]).map((set, si) => (
                          <div key={si} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                            <div style={{ width: 28, height: 40, borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--muted)', fontWeight: 700, flexShrink: 0 }}>{si + 1}</div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Reps</p>
                              <input type="number" inputMode="numeric" placeholder="15" value={set.reps}
                                onChange={e => {
                                  const newSets = [...(ex.sets || [{ reps: '' }])]
                                  newSets[si] = { reps: e.target.value }
                                  updEx(ex.id, 'sets', newSets)
                                }}
                                style={{ ...inp, width: '100%', height: 40, textAlign: 'center', padding: 0, fontSize: 17, fontWeight: 700, boxSizing: 'border-box' }} />
                            </div>
                            <button onClick={() => {
                              const newSets = (ex.sets || []).filter((_, i) => i !== si)
                              if (newSets.length > 0) updEx(ex.id, 'sets', newSets)
                            }} disabled={(ex.sets?.length || 1) <= 1}
                              style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: (ex.sets?.length || 1) <= 1 ? 'transparent' : '#150000', border: `1px solid ${(ex.sets?.length || 1) <= 1 ? 'transparent' : '#EF444415'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (ex.sets?.length || 1) <= 1 ? 'not-allowed' : 'pointer', marginBottom: 4 }}>
                              <Trash2 size={12} color={(ex.sets?.length || 1) <= 1 ? 'var(--subtle)' : '#EF4444'} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => updEx(ex.id, 'sets', [...(ex.sets || [{ reps: '' }]), { reps: '' }])}
                          style={{ width: '100%', padding: 9, borderRadius: 10, border: `1px dashed ${m.color}25`, background: 'transparent', color: m.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: .7 }}>
                          + Add set
                        </button>
                      </div>
                    )}

                    {/* CARDIO RUN: km + duration + pace */}
                    {ex.fieldType === 'cardio_run' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Distance (km)</p>
                            <input type="number" placeholder="5.0" value={ex.distance} onChange={e => updEx(ex.id, 'distance', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Duration (min)</p>
                            <input type="number" placeholder="30" value={ex.duration} onChange={e => updEx(ex.id, 'duration', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Pace (min/km) — optional</p>
                          <input placeholder="5:30" value={ex.pace} onChange={e => updEx(ex.id, 'pace', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    )}

                    {/* CARDIO MACHINE: meters + duration (rowing, skierg) */}
                    {ex.fieldType === 'cardio_machine' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Distance (m)</p>
                          <input type="number" placeholder="1000" value={ex.distanceM} onChange={e => updEx(ex.id, 'distanceM', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Time (min:sec)</p>
                          <input placeholder="4:32" value={ex.duration} onChange={e => updEx(ex.id, 'duration', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    )}

                    {/* CARDIO CYCLE: km + duration */}
                    {ex.fieldType === 'cardio_cycle' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Distance (km)</p>
                          <input type="number" placeholder="30" value={ex.distance} onChange={e => updEx(ex.id, 'distance', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Duration (min)</p>
                          <input type="number" placeholder="60" value={ex.duration} onChange={e => updEx(ex.id, 'duration', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    )}

                    {/* TIMED: duration only (plank, yoga, stretching) */}
                    {ex.fieldType === 'timed' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Duration (sec/min)</p>
                          <input placeholder="60 sec" value={ex.duration} onChange={e => updEx(ex.id, 'duration', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Sets / Rounds</p>
                          <input type="number" placeholder="3" value={ex.setsCount} onChange={e => updEx(ex.id, 'setsCount', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    )}

                    {/* SPORT: duration + notes */}
                    {ex.fieldType === 'sport' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Duration (min)</p>
                          <input type="number" placeholder="60" value={ex.duration} onChange={e => updEx(ex.id, 'duration', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--subtle)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Notes (optional)</p>
                          <input placeholder="e.g. 3 rounds, intense sparring" value={ex.pace} onChange={e => updEx(ex.id, 'pace', e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    )}
                    
                  </div>
                )
              })}

              {/* Session meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 9, color: 'var(--border2)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Duration (min)</p>
                  <input type="number" placeholder="60" value={duration}
                    onChange={e => setDuration(e.target.value)}
                    style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <p style={{ fontSize: 9, color: 'var(--border2)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Effort · {rpe}/10</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <input type="range" min="1" max="10" value={rpe}
                      onChange={e => setRpe(Number(e.target.value))}
                      style={{ flex: 1, accentColor: '#FF5A1F' }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#FF5A1F', minWidth: 20 }}>{rpe}</span>
                  </div>
                </div>
              </div>

              <textarea placeholder="Notes (optional)" value={notes}
                onChange={e => setNotes(e.target.value)} rows={2}
                style={{ ...inp, width: '100%', resize: 'none', lineHeight: 1.6, boxSizing: 'border-box' }} />

              {/* Save Session button */}
              <button onClick={save} disabled={saving}
                style={{ width: '100%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 14, padding: 16, color: 'var(--text)', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,90,31,.3)', letterSpacing: '.02em' }}>
                {saving ? 'Saving...' : `Save Session · ${exercises.length} exercise${exercises.length > 1 ? 's' : ''}`}
              </button>

            </div>
          )}
        </div>
      )}
    </div>
  )
}