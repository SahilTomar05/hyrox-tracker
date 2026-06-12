import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Plus, X, Trash2, Search } from 'lucide-react'

const CAT_META = {
  'Strength':    { icon: '💪', color: '#FF5A1F' },
  'Conditioning':{ icon: '🔥', color: '#EF4444' },
  'Skills':      { icon: '⚽', color: '#3B82F6' },
  'Mobility':    { icon: '🧘', color: '#A855F7' },
  'Custom':      { icon: '⭐', color: '#F59E0B' },
  'Mixed':       { icon: '🎯', color: '#22C55E' },
}

const QUICK_EXERCISES = {
  Strength: ['Deadlift','Squat','Bench Press','Overhead Press','Pull Ups','Barbell Row','Lunges','Romanian Deadlift','Dumbbell Curl','Tricep Pushdown'],
  Conditioning: ['Easy Run','Tempo Run','Interval Run','Row Erg','Assault Bike','Jump Rope','Burpees','Box Jumps'],
  Mobility: ['Foam Rolling','Stretching','Yoga Flow','Hip Flexor Stretch','Hamstring Stretch'],
  Skills: ['Sport Practice','Drills','Scrimmage','Technique Work'],
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
  const [sessionType, setSessionType] = useState('Strength')
  const [exercises, setExercises] = useState([])
  const [coachNotes, setCoachNotes] = useState('')
  const [duration, setDuration] = useState('60')
  const [query, setQuery] = useState('')
  const [step, setStep] = useState('search')
  const [assigning, setAssigning] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')

  useEffect(() => { fetchClientData() }, [])

  async function deleteAssignedSession(id) {
    if (!confirm('Delete this assigned session?')) return
    await supabase.from('sessions').delete().eq('id', id)
    setSessions(p => p.filter(s => s.id !== id))
  }

  async function fetchClientData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    try {
      const [sRes, nRes, todayRes, sleepRes] = await Promise.all([
        supabase.from('sessions').select('*').eq('user_id', client.id).order('date', { ascending: false }).limit(20),
        supabase.from('nutrition_logs').select('*').eq('user_id', client.id).order('date', { ascending: false }).limit(7),
        supabase.from('nutrition_logs').select('*').eq('user_id', client.id).eq('date', today).maybeSingle(),
        supabase.from('sleep_logs').select('*').eq('user_id', client.id).eq('date', today).maybeSingle(),
      ])
      setSessions(sRes.data || [])
      setNutritionLogs(nRes.data || [])
      setTodayLog(todayRes.data || null)
      setTodaySleep(sleepRes.data || null)
    } catch (e) { console.error('fetchClientData error:', e) }
    setLoading(false)
  }

  const todaySession = sessions.find(s => new Date(s.date).toDateString() === new Date().toDateString())
  const todayCalories = todayLog ? Math.round((todayLog.meals || []).reduce((a, m) => a + Number(m.calories || 0), 0)) : 0
  const todayProtein = todayLog ? Math.round((todayLog.meals || []).reduce((a, m) => a + Number(m.protein || 0), 0)) : 0

  const qLabels = { 1: 'Terrible', 2: 'Poor', 3: 'OK', 4: 'Good', 5: 'Great 🔥' }

  function addExercise(name) {
    if (exercises.find(e => e.name === name)) return
    const m = CAT_META[sessionType] || CAT_META['Custom']
    setExercises(p => [...p, {
      id: Date.now(), name, cat: sessionType,
      sets: sessionType === 'Strength' ? [{ reps: '10', weight: '' }] : [],
      target: '',
    }])
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
        setAssignMsg('✅ Session assigned!')
        await fetchClientData()
        setTimeout(() => {
          setShowAssign(false); setAssignMsg('')
          setExercises([]); setCoachNotes(''); setDuration('60')
          setStep('search'); setQuery('')
        }, 1500)
      }
    } catch (e) { setAssignMsg('❌ Error: ' + e.message) }
    setAssigning(false)
  }

  const exerciseList = QUICK_EXERCISES[sessionType] || []
  const filteredExercises = query.trim()
    ? exerciseList.filter(n => n.toLowerCase().includes(query.toLowerCase()))
    : exerciseList

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 16, margin: '0 16px 12px' }
  const inp = { background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Assign Session Bottom Sheet */}
      {showAssign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => { setShowAssign(false); setStep('search') }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Assign Session</p>
                <p style={{ fontSize: 12, color: '#FF5A1F', marginTop: 2 }}>For {client.name}</p>
              </div>
              <button onClick={() => { setShowAssign(false); setStep('search') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--muted)" />
              </button>
            </div>

            {step === 'search' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Date picker — calendar input */}
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Session date</p>
                  <input type="date" value={assignDate} onChange={e => setAssignDate(e.target.value)}
                    style={{ ...inp, fontSize: 16 }} />
                </div>

                {/* Session type */}
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Session type</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Strength', 'Conditioning', 'Mobility', 'Skills', 'Mixed'].map(t => {
                      const m = CAT_META[t]
                      const on = sessionType === t
                      return (
                        <button key={t} onClick={() => setSessionType(t)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 20, border: `1px solid ${on ? m.color : 'var(--border)'}`, background: on ? m.color + '20' : 'transparent', color: on ? m.color : 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {m.icon} {t}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Search + exercise list */}
                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Add exercises</p>
                  <input placeholder={`Search ${sessionType} exercises...`} value={query}
                    onChange={e => setQuery(e.target.value)} style={{ ...inp, marginBottom: 10 }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {filteredExercises.map(name => {
                      const added = exercises.find(e => e.name === name)
                      const m = CAT_META[sessionType]
                      return (
                        <button key={name} onClick={() => added ? setExercises(p => p.filter(e => e.name !== name)) : addExercise(name)}
                          style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${added ? m.color : 'var(--border)'}`, background: added ? m.color + '15' : 'var(--bg2)', color: added ? m.color : 'var(--muted)', fontSize: 12, fontWeight: added ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {added ? '✓ ' : ''}{name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Added exercises chips */}
                {exercises.length > 0 && (
                  <div style={{ background: 'var(--card2)', borderRadius: 14, padding: '12px 14px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Added · {exercises.length}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {exercises.map(ex => {
                        const m = CAT_META[ex.cat] || CAT_META['Custom']
                        return (
                          <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: m.color + '15', border: `1px solid ${m.color}30` }}>
                            <span style={{ fontSize: 12, color: m.color, fontWeight: 600 }}>{ex.name}</span>
                            <button onClick={() => setExercises(p => p.filter(e => e.id !== ex.id))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.color, padding: 0, display: 'flex', alignItems: 'center' }}>
                              <X size={11} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <button onClick={() => exercises.length > 0 && setStep('details')} disabled={!exercises.length}
                  style={{ width: '100%', background: exercises.length ? 'linear-gradient(135deg,#FF5A1F,#FF8C42)' : 'var(--card2)', border: 'none', borderRadius: 14, padding: 14, color: exercises.length ? '#fff' : 'var(--muted)', fontSize: 14, fontWeight: 700, cursor: exercises.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                  {exercises.length ? `Continue — ${exercises.length} exercise${exercises.length > 1 ? 's' : ''} →` : 'Add exercises above'}
                </button>
              </div>
            )}

            {step === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <button onClick={() => setStep('search')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                  <ArrowLeft size={14} /> Back to exercises
                </button>

                {/* Set targets for each exercise */}
                {exercises.map(ex => {
                  const m = CAT_META[ex.cat] || CAT_META['Custom']
                  return (
                    <div key={ex.id} style={{ background: 'var(--card2)', border: `1px solid ${m.color}20`, borderRadius: 14, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 18 }}>{m.icon}</span>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{ex.name}</p>
                        <button onClick={() => setExercises(p => p.filter(e => e.id !== ex.id))}
                          style={{ background: '#EF444415', border: '1px solid #EF444420', borderRadius: 8, padding: '4px 6px', cursor: 'pointer' }}>
                          <X size={12} color="#EF4444" />
                        </button>
                      </div>
                      {sessionType === 'Strength' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {(ex.sets || []).map((set, si) => (
                            <div key={si} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>{si+1}</span>
                              <input type="number" placeholder="Reps" value={set.reps}
                                onChange={e => {
                                  const s = [...ex.sets]; s[si] = { ...s[si], reps: e.target.value }
                                  setExercises(p => p.map(e2 => e2.id === ex.id ? { ...e2, sets: s } : e2))
                                }} style={{ ...inp, textAlign: 'center', padding: '8px 4px', fontSize: 14 }} />
                              <input type="number" placeholder="kg" value={set.weight}
                                onChange={e => {
                                  const s = [...ex.sets]; s[si] = { ...s[si], weight: e.target.value }
                                  setExercises(p => p.map(e2 => e2.id === ex.id ? { ...e2, sets: s } : e2))
                                }} style={{ ...inp, textAlign: 'center', padding: '8px 4px', fontSize: 14 }} />
                              <button onClick={() => ex.sets.length > 1 && setExercises(p => p.map(e2 => e2.id === ex.id ? { ...e2, sets: e2.sets.filter((_, i) => i !== si) } : e2))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                <Trash2 size={12} color="var(--subtle)" />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => setExercises(p => p.map(e2 => e2.id === ex.id ? { ...e2, sets: [...e2.sets, { reps: '', weight: '' }] } : e2))}
                            style={{ fontSize: 12, color: m.color, background: 'none', border: `1px dashed ${m.color}30`, borderRadius: 8, padding: '7px 0', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                            + Add set
                          </button>
                        </div>
                      ) : (
                        <input placeholder="Target (e.g. 5km, 30 min, 3 rounds)" value={ex.target || ''}
                          onChange={e => setExercises(p => p.map(e2 => e2.id === ex.id ? { ...e2, target: e.target.value } : e2))}
                          style={inp} />
                      )}
                    </div>
                  )
                })}

                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Duration (min)</p>
                  <input type="number" placeholder="60" value={duration} onChange={e => setDuration(e.target.value)} style={inp} />
                </div>

                <div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Notes for athlete</p>
                  <textarea placeholder="e.g. Focus on form, increase weight if comfortable..." value={coachNotes}
                    onChange={e => setCoachNotes(e.target.value)} rows={3}
                    style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
                </div>

                <div style={{ background: 'var(--card2)', borderRadius: 14, padding: '12px 14px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Assigning to</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    {client.name} · {new Date(assignDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>

                {assignMsg && (
                  <p style={{ fontSize: 14, color: assignMsg.includes('✅') ? '#22C55E' : '#EF4444', textAlign: 'center', fontWeight: 600 }}>
                    {assignMsg}
                  </p>
                )}

                <button onClick={assignSession} disabled={assigning}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: assigning ? 0.7 : 1 }}>
                  {assigning ? 'Assigning...' : `Assign to ${client.name?.split(' ')[0]} 🚀`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
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
        <button onClick={() => { setShowAssign(true); setStep('search') }}
          style={{ background: 'linear-gradient(135deg,#FF5A1F,#FF8C42)', border: 'none', borderRadius: 12, padding: '9px 14px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          + Assign
        </button>
      </div>

      {/* Tabs */}
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
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '0 16px', marginBottom: 14 }}>
                {[
                  { l: 'Sessions', v: sessions.length, c: '#FF5A1F' },
                  { l: 'This week', v: sessions.filter(s => (new Date()-new Date(s.date))/(1000*60*60*24) <= 7).length, c: '#22C55E' },
                  { l: 'Avg RPE', v: sessions.length ? (sessions.reduce((a,s) => a+(Number(s.rpe)||0),0)/sessions.length).toFixed(1) : '—', c: '#3B82F6' },
                  { l: 'Streak', v: `${sessions.filter(s => (new Date()-new Date(s.date))/(1000*60*60*24) <= 30).length}`, c: '#A855F7' },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 6px', textAlign: 'center' }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: c }}>{v}</p>
                    <p style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{l}</p>
                  </div>
                ))}
              </div>

              {/* Today at a glance */}
              <div style={card}>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Today</p>
                {[
                  { icon: '💪', label: 'Workout', val: todaySession ? `${todaySession.type} · RPE ${todaySession.rpe || '—'}/10 · ${(todaySession.exercises||[]).length} exercises` : 'Rest day', color: todaySession ? '#22C55E' : 'var(--muted)' },
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

              {/* Assigned sessions */}
              {sessions.filter(s => s.assigned_by_coach).length > 0 && (
                <div style={card}>
                  <p style={{ fontSize: 10, color: '#FF5A1F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>📋 Sessions you assigned</p>
                  {sessions.filter(s => s.assigned_by_coach).slice(0, 3).map((s, i, arr) => (
                    <div key={s.id} style={{ paddingBottom: i < arr.length-1 ? 10 : 0, marginBottom: i < arr.length-1 ? 10 : 0, borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.type}</p>
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {new Date(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {s.rpe ? ` · RPE ${s.rpe}/10 (completed)` : ' · Not logged yet'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TRAINING */}
          {activeTab === 'training' && (
            <div style={card}>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Recent sessions</p>
              {sessions.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>No sessions logged yet</p>
              ) : (
                <>
                  {/* Pending assigned sessions */}
                  {sessions.filter(s => s.rpe === 0).length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 10, color: '#FF5A1F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>📋 Assigned — awaiting completion</p>
                      {sessions.filter(s => s.rpe === 0).map(s => {
                        const meta = CAT_META[s.type] || CAT_META['Mixed']
                        return (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: '1px solid #FF5A1F25', background: '#FF5A1F08', marginBottom: 6 }}>
                            <span style={{ fontSize: 20 }}>{meta.icon}</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.type}</p>
                              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                                {new Date(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                {` · ${(s.exercises||[]).length} exercises · Pending`}
                              </p>
                            </div>
                            <button onClick={() => deleteAssignedSession(s.id)}
                              style={{ width: 30, height: 30, borderRadius: 8, background: '#EF444415', border: '1px solid #EF444430', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                              <X size={13} color="#EF4444" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Completed sessions */}
                  {sessions.filter(s => s.rpe > 0).map((s, i, arr) => {
                    const meta = CAT_META[s.type] || CAT_META['Mixed']
                    return (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 13, background: meta.color+'15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                          {meta.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.type}</p>
                            {s.assigned_by_coach && <span style={{ fontSize: 10, color: '#22C55E', background: '#22C55E15', padding: '2px 8px', borderRadius: 6 }}>✅ Done</span>}
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                            {new Date(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {s.duration ? ` · ${s.duration}min` : ''}
                            {s.rpe ? ` · RPE ${s.rpe}/10` : ''}
                            {` · ${(s.exercises||[]).length} exercises`}
                          </p>
                          {s.notes && <p style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginTop: 2 }}>"{s.notes}"</p>}
                        </div>
                      </div>
                    )
                  })}
                  {sessions.filter(s => s.rpe > 0).length === 0 && sessions.filter(s => s.rpe === 0).length === 0 && (
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>No sessions yet</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* NUTRITION */}
          {activeTab === 'nutrition' && (
            <div style={card}>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>7-day log</p>
              {nutritionLogs.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>No nutrition logged yet</p>
              ) : nutritionLogs.map((log, i, arr) => {
                const cals = Math.round((log.meals||[]).reduce((a,m) => a+Number(m.calories||0),0))
                const prot = Math.round((log.meals||[]).reduce((a,m) => a+Number(m.protein||0),0))
                return (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
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

          {/* PROGRESS */}
          {activeTab === 'progress' && (
            <>
              <div style={card}>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Training volume</p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 40, fontWeight: 700, color: '#FF5A1F', lineHeight: 1 }}>{sessions.length}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>total sessions</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 40, fontWeight: 700, color: '#22C55E', lineHeight: 1 }}>
                      {sessions.filter(s => (new Date()-new Date(s.date))/(1000*60*60*24) <= 7).length}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>this week</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 40, fontWeight: 700, color: '#3B82F6', lineHeight: 1 }}>
                      {sessions.filter(s => s.assigned_by_coach).length}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>assigned</p>
                  </div>
                </div>
              </div>

              <div style={card}>
                <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Strength PRs (est. 1RM)</p>
                {(() => {
                  const prs = []
                  sessions.forEach(s => {
                    (s.exercises||[]).filter(e => e.fieldType === 'strength' || (!e.fieldType && e.sets)).forEach(ex => {
                      const best = Math.max(0, ...(ex.sets||[]).map(set => {
                        const r = Number(set.reps||0), w = Number(set.weight||0)
                        return r && w ? Math.round(w * (1 + r/30)) : 0
                      }))
                      if (best > 0) {
                        const existing = prs.find(p => p.name === ex.name)
                        if (!existing) prs.push({ name: ex.name, best })
                        else if (best > existing.best) existing.best = best
                      }
                    })
                  })
                  prs.sort((a,b) => b.best - a.best)
                  if (!prs.length) return <p style={{ color: 'var(--muted)', fontSize: 13 }}>No strength data yet</p>
                  return prs.slice(0,6).map(pr => (
                    <div key={pr.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{pr.name}</p>
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