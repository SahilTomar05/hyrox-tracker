import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react'
import { ALL_EXERCISES } from '../../config/exercises'

const CAT_META = {
  'Strength': { icon: '💪', color: '#FF5A1F' },
  'Conditioning': { icon: '🔥', color: '#EF4444' },
  'Skills': { icon: '⚽', color: '#3B82F6' },
  'Mobility': { icon: '🧘', color: '#A855F7' },
  'Custom': { icon: '⭐', color: '#F59E0B' },
  'Mixed': { icon: '🎯', color: '#22C55E' },
}

export default function CoachClientDetail({ profile, session, client, onBack }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [sessions, setSessions] = useState([])
  const [nutritionLogs, setNutritionLogs] = useState([])
  const [todayLog, setTodayLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')

  // Assign form state
  const [sessionType, setSessionType] = useState('Strength')
  const [exercises, setExercises] = useState([])
  const [coachNotes, setCoachNotes] = useState('')
  const [duration, setDuration] = useState('')
  const [query, setQuery] = useState('')
  const [step, setStep] = useState('search') // 'search' | 'log'

  useEffect(() => { fetchClientData() }, [])

  async function fetchClientData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const [sRes, nRes, todayRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', client.id).order('date', { ascending: false }).limit(10),
      supabase.from('nutrition_logs').select('*').eq('user_id', client.id).order('date', { ascending: false }).limit(7),
      supabase.from('nutrition_logs').select('*').eq('user_id', client.id).eq('date', today).single(),
    ])
    setSessions(sRes.data || [])
    setNutritionLogs(nRes.data || [])
    setTodayLog(todayRes.data || null)
    setLoading(false)
  }

  async function assignSession() {
    if (!exercises.length) return
    setAssigning(true)
    const { error } = await supabase.from('sessions').insert({
      user_id: client.id,
      date: new Date().toISOString(),
      type: sessionType,
      notes: coachNotes,
      duration: Number(duration) || 60,
      rpe: 0,
      exercises: exercises.map(({ id, ...ex }) => ex),
      muscle_groups: [...new Set(exercises.map(e => e.cat))],
      assigned_by_coach: session.user.id,
    })
    if (!error) {
      setAssignMsg('✅ Session assigned!')
      await fetchClientData()
      setTimeout(() => {
        setShowAssign(false)
        setAssignMsg('')
        setExercises([])
        setCoachNotes('')
        setDuration('')
        setStep('search')
      }, 1200)
    } else {
      setAssignMsg('❌ Failed to assign. Try again.')
    }
    setAssigning(false)
  }

  const todaySession = sessions.find(s => new Date(s.date).toDateString() === new Date().toDateString())
  const todayCalories = todayLog ? Math.round((todayLog.meals || []).reduce((s, m) => s + Number(m.calories || 0), 0)) : 0
  const todayProtein = todayLog ? Math.round((todayLog.meals || []).reduce((s, m) => s + Number(m.protein || 0), 0)) : 0

  const filtered = ALL_EXERCISES
    .filter((ex, index, self) => index === self.findIndex(e => e.name === ex.name))
    .filter(e => query.trim() ? e.name.toLowerCase().includes(query.toLowerCase()) : false)
    .slice(0, 12)

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16, margin: '0 16px 12px' }
  const inp = { background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 10, padding: '9px 12px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Assign session modal */}
      {showAssign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => { setShowAssign(false); setStep('search') }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Assign Session</p>
                <p style={{ fontSize: 12, color: '#FF5A1F', marginTop: 2 }}>For {client.name}</p>
              </div>
              <button onClick={() => { setShowAssign(false); setStep('search') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>

            {step === 'search' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Session type */}
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Session type</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Strength', 'Conditioning', 'Mobility', 'Skills', 'Mixed'].map(t => (
                      <button key={t} onClick={() => setSessionType(t)}
                        style={{ padding: '6px 14px', borderRadius: 10, border: `1px solid ${sessionType === t ? '#FF5A1F' : 'var(--border)'}`, background: sessionType === t ? '#FF5A1F20' : 'transparent', color: sessionType === t ? '#FF5A1F' : 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {CAT_META[t]?.icon} {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search exercises */}
                <div style={{ position: 'relative' }}>
                  <input placeholder="Search exercises to add..."
                    value={query} onChange={e => setQuery(e.target.value)} style={inp} />
                </div>

                {/* Results */}
                {query && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                    {filtered.map((ex, idx) => {
                      const added = exercises.find(e => e.name === ex.name)
                      const m = CAT_META[ex.cat] || CAT_META['Custom']
                      return (
                        <button key={`${ex.name}-${idx}`} onClick={() => {
                          if (added) setExercises(p => p.filter(e => e.name !== ex.name))
                          else setExercises(p => [...p, { id: Date.now(), ...ex, sets: ex.fieldType === 'strength' ? [{ reps: '10', weight: '' }] : [] }])
                        }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1px solid ${added ? m.color + '40' : 'var(--border)'}`, background: added ? m.color + '10' : 'var(--card2)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                          <span style={{ fontSize: 16 }}>{m.icon}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: added ? m.color : 'var(--text)' }}>{ex.name}</p>
                            <p style={{ fontSize: 10, color: 'var(--muted)' }}>{ex.sub} · {ex.cat}</p>
                          </div>
                          {added && <span style={{ color: m.color, fontSize: 16 }}>✓</span>}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Added chips */}
                {exercises.length > 0 && (
                  <div style={{ background: 'var(--card2)', borderRadius: 12, padding: '10px 12px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Added · {exercises.length}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {exercises.map(ex => {
                        const m = CAT_META[ex.cat] || CAT_META['Custom']
                        return (
                          <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: m.color + '15', border: `1px solid ${m.color}30` }}>
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

                <button onClick={() => exercises.length > 0 && setStep('log')} disabled={!exercises.length}
                  style={{ width: '100%', background: exercises.length ? 'linear-gradient(135deg,#FF5A1F,#FF8C42)' : 'var(--card2)', border: 'none', borderRadius: 14, padding: 14, color: exercises.length ? '#fff' : 'var(--muted)', fontSize: 14, fontWeight: 700, cursor: exercises.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                  {exercises.length ? `Continue — ${exercises.length} exercise${exercises.length > 1 ? 's' : ''} →` : 'Search and add exercises'}
                </button>
              </div>
            )}

            {step === 'log' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => setStep('search')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                  <ArrowLeft size={14} /> Add more exercises
                </button>

                {/* Exercise targets */}
                {exercises.map(ex => {
                  const m = CAT_META[ex.cat] || CAT_META['Custom']
                  return (
                    <div key={ex.id} style={{ background: 'var(--card2)', border: `1px solid ${m.color}20`, borderRadius: 14, padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 18 }}>{m.icon}</span>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{ex.name}</p>
                        <button onClick={() => setExercises(p => p.filter(e => e.id !== ex.id))}
                          style={{ background: '#EF444415', border: '1px solid #EF444420', borderRadius: 8, padding: '4px 6px', cursor: 'pointer' }}>
                          <X size={12} color="#EF4444" />
                        </button>
                      </div>
                      {ex.fieldType === 'strength' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {(ex.sets || [{ reps: '', weight: '' }]).map((set, si) => (
                            <div key={si} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>{si + 1}</span>
                              <input type="number" placeholder="Reps" value={set.reps}
                                onChange={e => {
                                  const s = [...ex.sets]; s[si] = { ...s[si], reps: e.target.value }
                                  setExercises(p => p.map(ex2 => ex2.id === ex.id ? { ...ex2, sets: s } : ex2))
                                }}
                                style={{ ...inp, textAlign: 'center', padding: '7px 4px', fontSize: 14 }} />
                              <input type="number" placeholder="kg" value={set.weight}
                                onChange={e => {
                                  const s = [...ex.sets]; s[si] = { ...s[si], weight: e.target.value }
                                  setExercises(p => p.map(ex2 => ex2.id === ex.id ? { ...ex2, sets: s } : ex2))
                                }}
                                style={{ ...inp, textAlign: 'center', padding: '7px 4px', fontSize: 14 }} />
                              <button onClick={() => {
                                if (ex.sets.length > 1)
                                  setExercises(p => p.map(ex2 => ex2.id === ex.id ? { ...ex2, sets: ex2.sets.filter((_, i) => i !== si) } : ex2))
                              }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                <Trash2 size={12} color="var(--subtle)" />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => setExercises(p => p.map(ex2 => ex2.id === ex.id ? { ...ex2, sets: [...ex2.sets, { reps: '', weight: '' }] } : ex2))}
                            style={{ fontSize: 12, color: m.color, background: 'none', border: `1px dashed ${m.color}30`, borderRadius: 8, padding: '6px 0', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                            + Add set
                          </button>
                        </div>
                      )}
                      {ex.fieldType !== 'strength' && (
                        <input placeholder="Target (e.g. 5km, 30 min, 3 rounds)" style={{ ...inp }}
                          value={ex.target || ''}
                          onChange={e => setExercises(p => p.map(ex2 => ex2.id === ex.id ? { ...ex2, target: e.target.value } : ex2))} />
                      )}
                    </div>
                  )
                })}

                {/* Duration + notes */}
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Duration (min)</p>
                  <input type="number" placeholder="60" value={duration} onChange={e => setDuration(e.target.value)} style={inp} />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Coach notes for athlete</p>
                  <textarea placeholder="e.g. Focus on form, increase weight if comfortable..."
                    value={coachNotes} onChange={e => setCoachNotes(e.target.value)} rows={3}
                    style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
                </div>

                {assignMsg && <p style={{ fontSize: 13, color: assignMsg.includes('✅') ? '#22C55E' : '#EF4444', textAlign: 'center' }}>{assignMsg}</p>}

                <button onClick={assignSession} disabled={assigning}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 14, padding: 15, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: assigning ? 0.7 : 1 }}>
                  {assigning ? 'Assigning...' : `Assign Session to ${client.name?.split(' ')[0]}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack}
          style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={16} color="var(--text)" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{client.name}</h1>
          <p style={{ fontSize: 12, color: '#FF5A1F', marginTop: 2 }}>{client.sport || 'General'} {client.event_name ? `· ${client.event_name}` : ''}</p>
        </div>
        <button onClick={() => { setShowAssign(true); setStep('search') }}
          style={{ background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 12, padding: '9px 14px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Assign
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['overview', 'training', 'nutrition', 'progress'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: activeTab === t ? '#FF5A1F' : 'transparent', borderColor: activeTab === t ? '#FF5A1F' : 'var(--border)', color: activeTab === t ? '#fff' : 'var(--muted)', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--orange)', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <>
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              <div style={{ ...card, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                {[
                  { l: 'Sessions', v: sessions.length, c: '#FF5A1F' },
                  { l: 'This week', v: sessions.filter(s => { const d = new Date(s.date); const now = new Date(); return (now - d) / (1000*60*60*24) <= 7 }).length, c: '#22C55E' },
                  { l: 'Avg RPE', v: sessions.length ? (sessions.reduce((a, s) => a + (Number(s.rpe) || 0), 0) / sessions.length).toFixed(1) : '—', c: '#3B82F6' },
                  { l: 'Last active', v: sessions[0] ? new Date(sessions[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—', c: '#A855F7' },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ textAlign: 'center', flex: '1 1 60px' }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</p>
                    <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{l}</p>
                  </div>
                ))}
              </div>

              <div style={card}>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Today</p>
                {[
                  { icon: '💪', label: 'Workout', val: todaySession ? `${todaySession.type} · RPE ${todaySession.rpe || '--'}/10` : 'Rest day' },
                  { icon: '🔥', label: 'Calories', val: todayCalories ? `${todayCalories} kcal` : 'Not logged' },
                  { icon: '🥩', label: 'Protein', val: todayProtein ? `${todayProtein}g` : 'Not logged' },
                  { icon: '💧', label: 'Water', val: todayLog?.water ? `${todayLog.water}L` : 'Not logged' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, color: 'var(--muted)' }}>{item.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TRAINING */}
          {activeTab === 'training' && (
            <div style={card}>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Recent sessions</p>
              {sessions.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>No sessions logged yet</p>
              ) : sessions.map((s, i) => {
                const meta = CAT_META[s.type] || CAT_META['Mixed']
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: meta.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {meta.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.type}</p>
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {s.duration ? ` · ${s.duration}min` : ''}
                        {s.rpe ? ` · RPE ${s.rpe}/10` : ''}
                      </p>
                      {s.notes && <p style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginTop: 2 }}>"{s.notes}"</p>}
                      {s.assigned_by_coach && <p style={{ fontSize: 10, color: '#FF5A1F', marginTop: 2 }}>📋 Assigned by you</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* NUTRITION */}
          {activeTab === 'nutrition' && (
            <div style={card}>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>7-day nutrition log</p>
              {nutritionLogs.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>No nutrition logged yet</p>
              ) : nutritionLogs.slice(0, 7).map((log, i) => {
                const cals = Math.round((log.meals || []).reduce((s, m) => s + Number(m.calories || 0), 0))
                const prot = Math.round((log.meals || []).reduce((s, m) => s + Number(m.protein || 0), 0))
                return (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: i < nutritionLogs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {new Date(log.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {prot}g protein · {log.water || 0}L water
                      </p>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: cals > 0 ? '#FF5A1F' : 'var(--subtle)' }}>
                      {cals > 0 ? `${cals} kcal` : '—'}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* PROGRESS */}
          {activeTab === 'progress' && (
            <>
              <div style={card}>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Strength PRs</p>
                {(() => {
                  const strengthLogs = sessions.flatMap(s =>
                    (s.exercises || []).filter(e => e.fieldType === 'strength').map(ex => ({
                      name: ex.name,
                      best: Math.max(...(ex.sets || []).map(set => {
                        const r = Number(set.reps || 0)
                        const w = Number(set.weight || 0)
                        return r && w ? Math.round(w * (1 + r / 30)) : 0
                      }))
                    }))
                  )
                  const prs = [...new Map(strengthLogs.map(e => [e.name, e])).values()]
                    .filter(e => e.best > 0).sort((a, b) => b.best - a.best).slice(0, 6)
                  if (!prs.length) return <p style={{ color: 'var(--muted)', fontSize: 13 }}>No strength data yet</p>
                  return prs.map(pr => (
                    <div key={pr.name} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 20 }}>💪</span>
                      <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{pr.name}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#FF5A1F' }}>~{pr.best}kg 1RM</p>
                    </div>
                  ))
                })()}
              </div>
              <div style={card}>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Training Volume</p>
                <p style={{ fontSize: 36, fontWeight: 700, color: '#FF5A1F' }}>{sessions.length}</p>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>total sessions logged</p>
                <p style={{ fontSize: 13, color: '#22C55E', marginTop: 4 }}>
                  {sessions.filter(s => { const d = new Date(s.date); return (new Date() - d) / (1000*60*60*24) <= 7 }).length} this week
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}