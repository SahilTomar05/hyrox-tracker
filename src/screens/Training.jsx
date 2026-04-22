import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp, Check, X, Timer, Dumbbell, Wind, Footprints } from 'lucide-react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SESSION_TYPES = ['Strength', 'Cardio', 'Hyrox', 'Rest']
const HYROX_STATIONS = [
  'SkiErg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump',
  'Row', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls'
]

const TYPE_COLORS = {
  Strength: 'text-[#A78BFA] bg-[#1a1535]',
  Cardio: 'text-[#3B9EFF] bg-[#0d1f35]',
  Hyrox: 'text-[#00E5A0] bg-[#0d2d1f]',
  Rest: 'text-[#666] bg-[#1a1a1a]',
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

export default function Training() {
  const weekDates = getWeekDates()
  const today = new Date()
  const [selectedDay, setSelectedDay] = useState(today)
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('sessions')
    return saved ? JSON.parse(saved) : []
  })
  const [showForm, setShowForm] = useState(false)
  const [expandedSession, setExpandedSession] = useState(null)

  const [form, setForm] = useState({
    type: 'Strength', notes: '', rpe: 7,
    exercises: [], hyroxStations: []
  })
  const [newExercise, setNewExercise] = useState({ name: '', sets: '', reps: '', weight: '', duration: '', distance: '' })
  const [newStation, setNewStation] = useState({ name: HYROX_STATIONS[0], time: '', notes: '' })

  useEffect(() => {
    localStorage.setItem('sessions', JSON.stringify(sessions))
  }, [sessions])

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

  function removeExercise(id) {
    setForm(f => ({ ...f, exercises: f.exercises.filter(e => e.id !== id) }))
  }

  function removeStation(id) {
    setForm(f => ({ ...f, hyroxStations: f.hyroxStations.filter(s => s.id !== id) }))
  }

  function saveSession() {
    if (form.type === 'Rest') {
      setSessions(prev => [...prev, { id: Date.now(), date: selectedDay, type: 'Rest', notes: form.notes, exercises: [], hyroxStations: [], rpe: null }])
      setShowForm(false)
      resetForm()
      return
    }
    const session = { id: Date.now(), date: selectedDay, ...form }
    setSessions(prev => [...prev, session])
    setShowForm(false)
    resetForm()
  }

  function deleteSession(id) {
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  function resetForm() {
    setForm({ type: 'Strength', notes: '', rpe: 7, exercises: [], hyroxStations: [] })
    setNewExercise({ name: '', sets: '', reps: '', weight: '', duration: '', distance: '' })
    setNewStation({ name: HYROX_STATIONS[0], time: '', notes: '' })
  }

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
                ${isSelected ? 'bg-[#00E5A0] text-black' : isToday ? 'bg-[#1a1a1a] border border-[#00E5A0] text-white' : 'bg-[#1a1a1a] text-[#666]'}`}>
              <span>{DAYS[i]}</span>
              <span className="font-bold">{date.getDate()}</span>
              {hasSesh && <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-black' : 'bg-[#00E5A0]'}`} />}
            </button>
          )
        })}
      </div>

      {/* Selected day label */}
      <div className="flex items-center justify-between">
        <p className="text-white font-medium">
          {isSameDay(selectedDay, today) ? 'Today' : new Date(selectedDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>
        <button onClick={() => { setShowForm(true); setExpandedSession(null) }}
          className="flex items-center gap-1 bg-[#00E5A0] text-black text-sm font-medium px-3 py-1.5 rounded-xl">
          <Plus size={14} /> Add session
        </button>
      </div>

      {/* Sessions for selected day */}
      {todaySessions.length === 0 && !showForm && (
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] text-center">
          <p className="text-[#666] text-sm">No sessions logged for this day</p>
        </div>
      )}

      {todaySessions.map(session => (
        <div key={session.id} className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden">
          <div className="p-4 flex items-center justify-between cursor-pointer"
            onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${TYPE_COLORS[session.type]}`}>{session.type}</span>
              {session.rpe && <span className="text-[#666] text-xs">RPE {session.rpe}/10</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                className="text-[#444] hover:text-red-400 p-1"><X size={14} /></button>
              {expandedSession === session.id ? <ChevronUp size={16} className="text-[#444]" /> : <ChevronDown size={16} className="text-[#444]" />}
            </div>
          </div>

          {expandedSession === session.id && (
            <div className="px-4 pb-4 space-y-3 border-t border-[#2a2a2a] pt-3">
              {session.notes && <p className="text-[#999] text-sm">{session.notes}</p>}

              {session.exercises.length > 0 && (
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-wider mb-2">Exercises</p>
                  {session.exercises.map(ex => (
                    <div key={ex.id} className="flex justify-between items-center py-1.5 border-b border-[#2a2a2a]">
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

              {session.hyroxStations.length > 0 && (
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-wider mb-2">Hyrox Stations</p>
                  {session.hyroxStations.map(st => (
                    <div key={st.id} className="flex justify-between items-center py-1.5 border-b border-[#2a2a2a]">
                      <span className="text-white text-sm">{st.name}</span>
                      <span className="text-[#00E5A0] text-xs font-medium">{st.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add session form */}
      {showForm && (
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-medium">New Session</p>
            <button onClick={() => { setShowForm(false); resetForm() }}><X size={18} className="text-[#666]" /></button>
          </div>

          {/* Type selector */}
          <div className="grid grid-cols-4 gap-2">
            {SESSION_TYPES.map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`py-2 rounded-xl text-xs font-medium transition-all
                  ${form.type === t ? TYPE_COLORS[t] + ' ring-1 ring-current' : 'bg-[#2a2a2a] text-[#666]'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* RPE */}
          {form.type !== 'Rest' && (
            <div>
              <p className="text-[#666] text-xs mb-2">RPE (effort) — {form.rpe}/10</p>
              <input type="range" min="1" max="10" value={form.rpe}
                onChange={e => setForm(f => ({ ...f, rpe: Number(e.target.value) }))}
                className="w-full accent-[#00E5A0]" />
            </div>
          )}

          {/* Exercises — for Strength/Cardio */}
          {(form.type === 'Strength' || form.type === 'Cardio') && (
            <div className="space-y-2">
              <p className="text-[#666] text-xs uppercase tracking-wider">Exercises</p>
              {form.exercises.map(ex => (
                <div key={ex.id} className="flex justify-between items-center bg-[#2a2a2a] rounded-xl px-3 py-2">
                  <span className="text-white text-sm">{ex.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#666] text-xs">
                      {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}${ex.weight ? ` @ ${ex.weight}kg` : ''}` : ''}
                      {ex.duration ? `${ex.duration}min` : ''}
                      {ex.distance ? ` ${ex.distance}km` : ''}
                    </span>
                    <button onClick={() => removeExercise(ex.id)}><X size={12} className="text-[#444]" /></button>
                  </div>
                </div>
              ))}
              <div className="bg-[#2a2a2a] rounded-xl p-3 space-y-2">
                <input placeholder="Exercise name" value={newExercise.name}
                  onChange={e => setNewExercise(n => ({ ...n, name: e.target.value }))}
                  className="w-full bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                {form.type === 'Strength' ? (
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Sets" value={newExercise.sets} type="number"
                      onChange={e => setNewExercise(n => ({ ...n, sets: e.target.value }))}
                      className="bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                    <input placeholder="Reps" value={newExercise.reps} type="number"
                      onChange={e => setNewExercise(n => ({ ...n, reps: e.target.value }))}
                      className="bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                    <input placeholder="kg" value={newExercise.weight} type="number"
                      onChange={e => setNewExercise(n => ({ ...n, weight: e.target.value }))}
                      className="bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Duration (min)" value={newExercise.duration} type="number"
                      onChange={e => setNewExercise(n => ({ ...n, duration: e.target.value }))}
                      className="bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                    <input placeholder="Distance (km)" value={newExercise.distance} type="number"
                      onChange={e => setNewExercise(n => ({ ...n, distance: e.target.value }))}
                      className="bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-[#444]" />
                  </div>
                )}
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
                    <button onClick={() => removeStation(st.id)}><X size={12} className="text-[#444]" /></button>
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
                  <input placeholder="Notes (optional)" value={newStation.notes}
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

          {/* Notes */}
          <textarea placeholder="Session notes (optional)" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444] resize-none" />

          {/* Save */}
          <button onClick={saveSession}
            className="w-full bg-[#00E5A0] text-black font-medium py-3 rounded-xl flex items-center justify-center gap-2">
            <Check size={16} /> Save Session
          </button>
        </div>
      )}
    </div>
  )
}