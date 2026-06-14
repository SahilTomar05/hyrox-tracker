import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Plus, X, Trash2, Search, Check } from 'lucide-react'
import { ALL_EXERCISES } from '../../config/exercises'

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

export default function CoachClientDetail({ profile, session, client, onBack }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [sessions, setSessions] = useState([])
  const [nutritionLogs, setNutritionLogs] = useState([])
  const [todayLog, setTodayLog] = useState(null)
  const [todaySleep, setTodaySleep] = useState(null)
  const [loading, setLoading] = useState(true)

  // Assign session state
  const [showAssign, setShowAssign] = useState(false)
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split('T')[0])
  const [assignStep, setAssignStep] = useState('search') // 'search' | 'log'
  const [sessionType, setSessionType] = useState('Strength')
  const [exercises, setExercises] = useState([])
  const [activeExId, setActiveExId] = useState(null)
  const [coachNotes, setCoachNotes] = useState('')
  const [duration, setDuration] = useState('60')
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState(null)
  const [assigning, setAssigning] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')

  // View sessions per day
  const [selectedDay, setSelectedDay] = useState(new Date())
  const weekDates = getWeekDates()

  useEffect(() => { fetchClientData() }, [])

  async function fetchClientData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    try {
      const [sRes, nRes, todayRes, sleepRes] = await Promise.all([
        supabase.from('sessions').select('*').eq('user_id', client.id).order('date', { ascending: false }),
        supabase.from('nutrition_logs').select('*').eq('user_id', client.id).order('date', { ascending: false }).limit(7),
        supabase.from('nutrition_logs').select('*').eq('user_id', client.id).eq('date', today).maybeSingle(),
        supabase.from('sleep_logs').select('*').eq('user_id', client.id).eq('date', today).maybeSingle(),
      ])
      setSessions(sRes.data || [])
      setNutritionLogs(nRes.data || [])
      setTodayLog(todayRes.data || null)
      setTodaySleep(sleepRes.data || null)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function deleteSession(id) {
    if (!confirm('Delete this session?')) return
    await supabase.from('sessions').delete().eq('id', id)
    setSessions(p => p.filter(s => s.id !== id))
  }

  // Exercise search
  const filtered = (() => {
    let list = ALL_EXERCISES
    if (activeCat) list = list.filter(e => e.cat === activeCat)
    if (query.trim()) list = list.filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
    else if (!activeCat) return []
    return list.slice(0, 20)
  })()

  function tapExercise(ex) {
    const already = exercises.find(e => e.name === ex.name)
    if (already) { setActiveExId(already.id); return }
    const id = Date.now()
    setExercises(p => [...p, {
      id, ...ex,
      sets: ex.cat === 'Strength' ? [{ reps: '10', weight: '' }] : [],
      target: '', duration: '', distance: '',
    }])
    setActiveExId(id)
  }

  function applyPreset(id, pr) {
    setExercises(p => p.map(e => e.id === id
      ? { ...e, sets: Array.from({ length: pr.sets }, () => ({ reps: pr.reps, weight: e.sets[0]?.weight || '' })) }
      : e
    ))
  }

  function updSet(id, si, field, val) {
    setExercises(p => p.map(e => e.id === id
      ? { ...e, sets: e.sets.map((s, i) => i === si ? { ...s, [field]: val } : s) }
      : e
    ))
  }

  function addSet(id) {
    setExercises(p => p.map(e => e.id === id ? { ...e, sets: [...e.sets, { reps: '', weight: '' }] } : e))
  }

  function removeSet(id, si) {
    setExercises(p => p.map(e => e.id === id && e.sets.length > 1 ? { ...e, sets: e.sets.filter((_, i) => i !== si) } : e))
  }

  async function assignSession() {
    if (!exercises.length) return
    setAssigning(true)
    setAssignMsg('')
    try {
      const { error } = await supabase.from('sessions').insert({
        user_id: client.id,
        date: assignDate,
        type: sessionType,
        notes: coachNotes,
        duration: Number(duration) || 60,
        rpe: 0,
        exercises: exercises.map(({ id, ...ex }) => ex),
        muscle_groups: [sessionType],
        hyrox_stations: [],
        assigned_by_coach: session.user.id,
      })
      if (error) {
        setAssignMsg('❌ Failed: ' + error.message)
      } else {
        setAssignMsg('✅ Session assigned to ' + client.name.split(' ')[0] + '!')
        await fetchClientData()
        setTimeout(() => {
          setShowAssign(false); setAssignMsg('')
          setExercises([]); setCoachNotes(''); setDuration('60')
          setAssignStep('search'); setQuery(''); setActiveCat(null)
          setActiveExId(null)
        }, 1500)
      }
    } catch (e) { setAssignMsg('❌ Error: ' + e.message) }
    setAssigning(false)
  }

  const daySessions = sessions.filter(s => isSameDay(s.date, selectedDay))
  const todaySession = sessions.find(s => isSameDay(s.date, new Date()))
  const todayCalories = todayLog ? Math.round((todayLog.meals || []).reduce((a, m) => a + Number(m.calories || 0), 0)) : 0
  const todayProtein = todayLog ? Math.round((todayLog.meals || []).reduce((a, m) => a + Number(m.protein || 0), 0)) : 0
  const activeEx = exercises.find(e => e.id === activeExId)
  const m = activeEx ? CAT_META[activeEx.cat] || CAT_META['Custom'] : null
  const qLabels = { 1: 'Terrible', 2: 'Poor', 3: 'OK', 4: 'Good', 5: 'Great 🔥' }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16, margin: '0 16px 12px' }
  const inp = { background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── EXERCISE LOG SHEET ── */}
      {activeEx && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setActiveExId(null)}>
          <div style={{ width: '100%', maxWidth: 420, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>{m?.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{activeEx.name}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>{activeEx.sub} · {activeEx.cat}</p>
              </div>
              <button onClick={() => { setExercises(p => p.filter(e => e.id !== activeEx.id)); setActiveExId(null) }}
                style={{ width: 32, height: 32, borderRadius: 10, background: '#EF444415', border: '1px solid #EF444420', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Trash2 size={14} color="#EF4444" />
              </button>
            </div>

            {/* Presets */}
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Quick presets</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {PRESETS.map(pr => (
                  <button key={pr.label} onClick={() => applyPreset(activeEx.id, pr)}
                    style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card2)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sets */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 28px', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>SET</span>
                <span style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>REPS</span>
                <span style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>KG</span>
                <span></span>
              </div>
              {(activeEx.sets || []).map((set, si) => (
                <div key={si} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 28px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <div style={{ height: 42, background: 'var(--bg2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{si+1}</div>
                  <input type="number" inputMode="numeric" placeholder="10" value={set.reps}
                    onChange={e => updSet(activeEx.id, si, 'reps', e.target.value)}
                    style={{ ...inp, height: 42, textAlign: 'center', padding: 0, fontSize: 18, fontWeight: 700 }} />
                  <input type="number" inputMode="decimal" placeholder="—" value={set.weight}
                    onChange={e => updSet(activeEx.id, si, 'weight', e.target.value)}
                    style={{ ...inp, height: 42, textAlign: 'center', padding: 0, fontSize: 18, fontWeight: 700 }} />
                  <button onClick={() => removeSet(activeEx.id, si)} disabled={(activeEx.sets || []).length === 1}
                    style={{ height: 42, width: 28, borderRadius: 8, background: (activeEx.sets||[]).length === 1 ? 'transparent' : '#EF444415', border: `1px solid ${(activeEx.sets||[]).length === 1 ? 'transparent' : '#EF444420'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (activeEx.sets||[]).length === 1 ? 'not-allowed' : 'pointer' }}>
                    <Trash2 size={11} color={(activeEx.sets||[]).length === 1 ? 'var(--subtle)' : '#EF4444'} />
                  </button>
                </div>
              ))}
              <button onClick={() => addSet(activeEx.id)}
                style={{ width: '100%', padding: 10, borderRadius: 10, border: `1px dashed ${m?.color}40`, background: 'transparent', color: m?.color, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
                + Add set
              </button>
            </div>

            <button onClick={() => setActiveExId(null)}
              style={{ width: '100%', background: `linear-gradient(135deg,${m?.color},${m?.color}cc)`, border: 'none', borderRadius: 14, padding: 14, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
              <Check size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Done — add more exercises
            </button>
          </div>
        </div>
      )}

      {/* ── ASSIGN SESSION SHEET ── */}
      {showAssign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 150, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => { setShowAssign(false); setAssignStep('search') }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '0 auto 16px' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Assign Session</p>
                <p style={{ fontSize: 12, color: '#FF5A1F', marginTop: 2 }}>For {client.name}</p>
              </div>
              <button onClick={() => { setShowAssign(false); setAssignStep('search') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--muted)" />
              </button>
            </div>

            {assignStep === 'search' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Date picker */}
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Session date</p>
                  <input type="date" value={assignDate} onChange={e => setAssignDate(e.target.value)} style={{ ...inp, fontSize: 16 }} />
                </div>

                {/* Session type */}
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Session type</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Object.entries(CAT_META).filter(([k]) => k !== 'Mixed').map(([t, meta]) => {
                      const on = sessionType === t
                      return (
                        <button key={t} onClick={() => setSessionType(t)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 20, border: `1px solid ${on ? meta.color : 'var(--border)'}`, background: on ? meta.color + '20' : 'transparent', color: on ? meta.color : 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {meta.icon} {t}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Search exercises */}
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Add exercises</p>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <Search size={14} color="var(--muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input placeholder="Search exercises..." value={query} onChange={e => setQuery(e.target.value)}
                      style={{ ...inp, paddingLeft: 36 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    <button onClick={() => setActiveCat(null)}
                      style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${!activeCat ? '#FF5A1F' : 'var(--border)'}`, background: !activeCat ? '#FF5A1F20' : 'transparent', color: !activeCat ? '#FF5A1F' : 'var(--muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      All
                    </button>
                    {Object.entries(CAT_META).filter(([k]) => k !== 'Mixed').map(([cat, meta]) => {
                      const on = activeCat === cat
                      return (
                        <button key={cat} onClick={() => setActiveCat(on ? null : cat)}
                          style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${on ? meta.color : 'var(--border)'}`, background: on ? meta.color + '15' : 'transparent', color: on ? meta.color : 'var(--muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {meta.icon} {cat}
                        </button>
                      )
                    })}
                  </div>
                  {/* Results */}
                  {(query || activeCat) && (
                    <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {filtered.map(ex => {
                        const isAdded = !!exercises.find(e => e.name === ex.name)
                        const em = CAT_META[ex.cat] || CAT_META['Custom']
                        return (
                          <button key={ex.name} onClick={() => tapExercise(ex)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1px solid ${isAdded ? em.color + '40' : 'var(--border)'}`, background: isAdded ? em.color + '10' : 'var(--card2)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                            <span style={{ fontSize: 16 }}>{em.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: isAdded ? 600 : 400, color: isAdded ? em.color : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</p>
                              <p style={{ fontSize: 10, color: 'var(--muted)' }}>{ex.sub} · {ex.cat}</p>
                            </div>
                            {isAdded
                              ? <Check size={14} color={em.color} />
                              : <Plus size={14} color="var(--muted)" />
                            }
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Added chips */}
                {exercises.length > 0 && (
                  <div style={{ background: 'var(--card2)', borderRadius: 14, padding: '12px 14px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
                      Tap to log sets · {exercises.length} added
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {exercises.map(ex => {
                        const em = CAT_META[ex.cat] || CAT_META['Custom']
                        const hasSets = (ex.sets || []).some(s => s.reps)
                        return (
                          <button key={ex.id} onClick={() => setActiveExId(ex.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, border: `2px solid ${hasSets ? '#22C55E' : em.color}`, background: hasSets ? '#22C55E15' : em.color + '15', cursor: 'pointer', fontFamily: 'inherit' }}>
                            {hasSets ? <Check size={12} color="#22C55E" strokeWidth={3} /> : <span style={{ fontSize: 13 }}>{em.icon}</span>}
                            <span style={{ fontSize: 12, fontWeight: 600, color: hasSets ? '#22C55E' : em.color }}>{ex.name}</span>
                            <button onClick={e => { e.stopPropagation(); setExercises(p => p.filter(e2 => e2.id !== ex.id)) }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: hasSets ? '#22C55E' : em.color, padding: 0, display: 'flex', alignItems: 'center' }}>
                              <X size={11} />
                            </button>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <button onClick={() => exercises.length > 0 && setAssignStep('details')} disabled={!exercises.length}
                  style={{ width: '100%', background: exercises.length ? 'linear-gradient(135deg,#FF5A1F,#FF8C42)' : 'var(--card2)', border: 'none', borderRadius: 14, padding: 14, color: exercises.length ? '#fff' : 'var(--muted)', fontSize: 14, fontWeight: 700, cursor: exercises.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                  {exercises.length ? `Continue — ${exercises.length} exercise${exercises.length > 1 ? 's' : ''} →` : 'Search and add exercises above'}
                </button>
              </div>
            )}

            {assignStep === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <button onClick={() => setAssignStep('search')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                  <ArrowLeft size={14} /> Back to exercises
                </button>

                {/* Summary confirm */}
                <div style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px' }}>
                  <p style={{ fontSize: 12, color: '#FF5A1F', fontWeight: 600, marginBottom: 8 }}>
                    📋 Assigning to {client.name} · {new Date(assignDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {exercises.map(ex => {
                      const em = CAT_META[ex.cat] || CAT_META['Custom']
                      const setsInfo = (ex.sets || []).filter(s => s.reps).length
                      return (
                        <span key={ex.id} style={{ fontSize: 11, color: em.color, background: em.color + '15', padding: '3px 10px', borderRadius: 20 }}>
                          {ex.name}{setsInfo > 0 ? ` (${setsInfo} sets)` : ''}
                        </span>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Duration (min)</p>
                  <input type="number" placeholder="60" value={duration} onChange={e => setDuration(e.target.value)} style={inp} />
                </div>

                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Notes for athlete</p>
                  <textarea placeholder="e.g. Focus on form, increase weight if comfortable..." value={coachNotes}
                    onChange={e => setCoachNotes(e.target.value)} rows={3}
                    style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
                </div>

                {assignMsg && (
                  <p style={{ fontSize: 14, color: assignMsg.includes('✅') ? '#22C55E' : '#EF4444', textAlign: 'center', fontWeight: 600 }}>{assignMsg}</p>
                )}

                <button onClick={assignSession} disabled={assigning}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: assigning ? 0.7 : 1 }}>
                  {assigning ? 'Assigning...' : `Assign to ${client.name.split(' ')[0]} 🚀`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack}
          style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={17} color="var(--text)" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</h1>
          <p style={{ fontSize: 12, color: '#FF5A1F', marginTop: 2 }}>
            {client.sport || 'General'}{client.event_name ? ` · ${client.event_name}` : ''}
          </p>
        </div>
        <button onClick={() => { setShowAssign(true); setAssignStep('search') }}
          style={{ background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 12, padding: '9px 14px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          + Assign
        </button>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['overview', 'training', 'nutrition', 'progress'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ flexShrink: 0, padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: activeTab === t ? '#FF5A1F' : 'transparent', borderColor: activeTab === t ? '#FF5A1F' : 'var(--border)', color: activeTab === t ? '#fff' : 'var(--muted)', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: '#FF5A1F', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '0 16px', marginBottom: 14 }}>
                {[
                  { l: 'Sessions', v: sessions.filter(s => s.rpe > 0).length, c: '#FF5A1F' },
                  { l: 'This week', v: sessions.filter(s => (new Date()-new Date(s.date))/(1000*60*60*24) <= 7 && s.rpe > 0).length, c: '#22C55E' },
                  { l: 'Avg RPE', v: sessions.filter(s=>s.rpe>0).length ? (sessions.filter(s=>s.rpe>0).reduce((a,s) => a+(Number(s.rpe)||0),0)/sessions.filter(s=>s.rpe>0).length).toFixed(1) : '—', c: '#3B82F6' },
                  { l: 'Assigned', v: sessions.filter(s => s.assigned_by_coach).length, c: '#A855F7' },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 6px', textAlign: 'center' }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: c }}>{v}</p>
                    <p style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{l}</p>
                  </div>
                ))}
              </div>

              <div style={card}>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Today</p>
                {[
                  { icon: '💪', label: 'Workout', val: todaySession ? `${todaySession.type} · RPE ${todaySession.rpe || '—'}/10 · ${(todaySession.exercises||[]).length} exercises` : 'Rest day', color: todaySession?.rpe > 0 ? '#22C55E' : todaySession ? '#FF5A1F' : 'var(--muted)' },
                  { icon: '🔥', label: 'Calories', val: todayCalories ? `${todayCalories} kcal` : 'Not logged', color: todayCalories ? '#FF5A1F' : 'var(--subtle)' },
                  { icon: '🥩', label: 'Protein', val: todayProtein ? `${todayProtein}g` : 'Not logged', color: todayProtein ? '#22C55E' : 'var(--subtle)' },
                  { icon: '💧', label: 'Water', val: todayLog?.water ? `${todayLog.water}L` : 'Not logged', color: todayLog?.water ? '#3B82F6' : 'var(--subtle)' },
                  { icon: '😴', label: 'Sleep', val: todaySleep ? `${todaySleep.hours}h · ${qLabels[todaySleep.quality] || '—'}` : 'Not logged', color: todaySleep ? '#A855F7' : 'var(--subtle)' },
                ].map((item, i, arr) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: i < arr.length-1 ? 12 : 0, marginBottom: i < arr.length-1 ? 12 : 0, borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, color: 'var(--muted)' }}>{item.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── TRAINING ── */}
          {activeTab === 'training' && (
            <>
              {/* Week strip for date picking */}
              <div style={{ display: 'flex', gap: 8, padding: '0 16px', marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {weekDates.map((date, i) => {
                  const has = sessions.some(s => isSameDay(s.date, date))
                  const isT = isSameDay(date, new Date())
                  const isSel = isSameDay(date, selectedDay)
                  const dn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]
                  return (
                    <button key={i} onClick={() => setSelectedDay(date)}
                      style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 12px', borderRadius: 16, cursor: 'pointer', minWidth: 46, border: '1px solid', background: isSel ? '#FF5A1F' : isT ? '#150800' : 'var(--bg2)', borderColor: isSel ? '#FF5A1F' : isT ? '#FF5A1F40' : 'var(--border)' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: isSel ? 'rgba(255,255,255,.6)' : 'var(--muted)', marginBottom: 4 }}>{dn}</span>
                      <span style={{ fontSize: 17, fontWeight: 700, color: isSel ? '#fff' : isT ? '#FF5A1F' : 'var(--text)' }}>{date.getDate()}</span>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', marginTop: 5, background: has ? (isSel ? '#fff' : '#FF5A1F') : 'transparent' }} />
                    </button>
                  )
                })}
              </div>

              {daySessions.length === 0 ? (
                <div style={{ ...card, textAlign: 'center', padding: '32px 20px' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>🛌</p>
                  <p style={{ color: 'var(--muted)', fontSize: 14 }}>No sessions on this day</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {daySessions.map((s, i) => {
                    const meta = CAT_META[s.type] || CAT_META['Mixed']
                    const isPending = s.rpe === 0
                    return (
                      <div key={s.id} style={{ ...card, border: `1px solid ${isPending ? '#FF5A1F30' : 'var(--border)'}`, background: isPending ? '#FF5A1F05' : 'var(--card)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 13, background: meta.color+'15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                            {meta.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.type}</p>
                              {s.assigned_by_coach && (
                                <span style={{ fontSize: 10, color: isPending ? '#FF5A1F' : '#22C55E', background: isPending ? '#FF5A1F15' : '#22C55E15', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                                  {isPending ? '📋 Assigned — pending' : '✅ Assigned — done'}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                              {s.duration ? `${s.duration}min` : ''}
                              {s.rpe > 0 ? ` · RPE ${s.rpe}/10` : ''}
                              {` · ${(s.exercises||[]).length} exercises`}
                            </p>
                            {s.notes && <p style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginTop: 4 }}>"{s.notes}"</p>}
                            {/* Exercise list */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                              {(s.exercises||[]).map((ex, ei) => {
                                const em = CAT_META[ex.cat] || CAT_META['Custom']
                                return (
                                  <span key={ei} style={{ fontSize: 10, color: em.color, background: em.color+'15', padding: '2px 8px', borderRadius: 10 }}>
                                    {ex.name}
                                    {ex.sets?.length > 0 && ex.sets[0]?.reps ? ` ${ex.sets.length}×${ex.sets[0].reps}` : ''}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                          <button onClick={() => deleteSession(s.id)}
                            style={{ width: 30, height: 30, borderRadius: 8, background: '#EF444415', border: '1px solid #EF444425', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            <X size={13} color="#EF4444" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── NUTRITION ── */}
          {activeTab === 'nutrition' && (
            <div style={card}>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>7-day log</p>
              {nutritionLogs.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>No nutrition logged yet</p>
              ) : nutritionLogs.map((log, i, arr) => {
                const cals = Math.round((log.meals||[]).reduce((a,m) => a+Number(m.calories||0),0))
                const prot = Math.round((log.meals||[]).reduce((a,m) => a+Number(m.protein||0),0))
                return (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i < arr.length-1 ? 12 : 0, marginBottom: i < arr.length-1 ? 12 : 0, borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {new Date(log.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {prot}g protein · {log.water || 0}L water
                      </p>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: cals > 0 ? '#FF5A1F' : 'var(--subtle)' }}>
                      {cals > 0 ? `${cals} kcal` : '—'}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── PROGRESS ── */}
          {activeTab === 'progress' && (
            <>
              <div style={card}>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Training volume</p>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div>
                    <p style={{ fontSize: 40, fontWeight: 700, color: '#FF5A1F', lineHeight: 1 }}>{sessions.filter(s=>s.rpe>0).length}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>completed sessions</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 40, fontWeight: 700, color: '#22C55E', lineHeight: 1 }}>
                      {sessions.filter(s => s.rpe > 0 && (new Date()-new Date(s.date))/(1000*60*60*24) <= 7).length}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>this week</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 40, fontWeight: 700, color: '#FF5A1F', lineHeight: 1 }}>
                      {sessions.filter(s => s.rpe === 0 && s.assigned_by_coach).length}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>pending</p>
                  </div>
                </div>
              </div>

              <div style={card}>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Strength PRs (est. 1RM)</p>
                {(() => {
                  const prs = []
                  sessions.filter(s=>s.rpe>0).forEach(s => {
                    (s.exercises||[]).filter(e => e.fieldType === 'strength' || (!e.fieldType && (e.sets||[]).some(set=>set.weight))).forEach(ex => {
                      const best = Math.max(0, ...(ex.sets||[]).map(set => {
                        const r = Number(set.reps||0), w = Number(set.weight||0)
                        return r && w ? Math.round(w * (1 + r/30)) : 0
                      }))
                      if (best > 0) {
                        const ex2 = prs.find(p => p.name === ex.name)
                        if (!ex2) prs.push({ name: ex.name, best })
                        else if (best > ex2.best) ex2.best = best
                      }
                    })
                  })
                  prs.sort((a,b) => b.best - a.best)
                  if (!prs.length) return <p style={{ color: 'var(--muted)', fontSize: 13 }}>No strength data yet</p>
                  return prs.slice(0,6).map(pr => (
                    <div key={pr.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>💪 {pr.name}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#FF5A1F' }}>~{pr.best}kg</p>
                    </div>
                  ))
                })()}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}