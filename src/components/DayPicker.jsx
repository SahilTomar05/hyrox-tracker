// ── DayPicker component ──
// Add this to src/components/DayPicker.jsx
// Import it in Dashboard.jsx and Progress.jsx

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DayPicker({ selectedDate, onDateChange }) {
  const [showCalendar, setShowCalendar] = useState(false)

  const today = new Date()
  today.setHours(0,0,0,0)

  const selected = new Date(selectedDate)
  selected.setHours(0,0,0,0)

  const isToday = selected.toDateString() === today.toDateString()
  const isYesterday = (() => {
    const y = new Date(today); y.setDate(today.getDate()-1)
    return selected.toDateString() === y.toDateString()
  })()

  function prevDay() {
    const d = new Date(selectedDate)
    d.setDate(d.getDate()-1)
    onDateChange(d)
  }

  function nextDay() {
    const d = new Date(selectedDate)
    d.setDate(d.getDate()+1)
    if (d <= today) onDateChange(d)
  }

  function getLabel() {
    if (isToday) return 'Today'
    if (isYesterday) return 'Yesterday'
    return selected.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
  }

  // Last 7 days for quick select
  const last7 = Array.from({length:7}, (_,i) => {
    const d = new Date(today)
    d.setDate(today.getDate()-i)
    return d
  }).reverse()

  return (
    <div style={{ position:'relative' }}>
      {/* Main pill */}
      <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'6px 10px' }}>
        <button onClick={prevDay}
          style={{ background:'none', border:'none', cursor:'pointer', padding:2, display:'flex', alignItems:'center' }}>
          <ChevronLeft size={16} color="var(--muted)" />
        </button>
        <button onClick={() => setShowCalendar(p => !p)}
          style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 6px', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:14 }}>📅</span>
          <span style={{ fontSize:13, fontWeight:700, color: isToday ? 'var(--orange)' : 'var(--text)', minWidth:80, textAlign:'center' }}>
            {getLabel()}
          </span>
        </button>
        <button onClick={nextDay} disabled={isToday}
          style={{ background:'none', border:'none', cursor: isToday ? 'not-allowed' : 'pointer', padding:2, display:'flex', alignItems:'center', opacity: isToday ? 0.3 : 1 }}>
          <ChevronRight size={16} color="var(--muted)" />
        </button>
        {!isToday && (
          <button onClick={() => onDateChange(new Date())}
            style={{ background:'var(--orange)', border:'none', borderRadius:8, padding:'3px 8px', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Today
          </button>
        )}
      </div>

      {/* Quick 7-day picker */}
      {showCalendar && (
        <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:12, zIndex:100, boxShadow:'0 8px 32px rgba(0,0,0,.3)' }}
          onClick={e => e.stopPropagation()}>
          <p style={{ fontSize:10, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>Select day</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {last7.map(d => {
              const isSel = d.toDateString() === selected.toDateString()
              const isTd = d.toDateString() === today.toDateString()
              const isYd = (() => { const y=new Date(today); y.setDate(today.getDate()-1); return d.toDateString()===y.toDateString() })()
              return (
                <button key={d.toISOString()} onClick={() => { onDateChange(d); setShowCalendar(false) }}
                  style={{ flex:'1 1 60px', padding:'8px 4px', borderRadius:12, border:`2px solid ${isSel?'var(--orange)':'var(--border)'}`, background:isSel?'var(--orange)15':'var(--card2)', cursor:'pointer', textAlign:'center', fontFamily:'inherit' }}>
                  <p style={{ fontSize:10, color: isSel ? 'var(--orange)' : 'var(--muted)', fontWeight:600, marginBottom:2 }}>
                    {isTd ? 'Today' : isYd ? 'Yest' : d.toLocaleDateString('en-GB',{weekday:'short'})}
                  </p>
                  <p style={{ fontSize:15, fontWeight:700, color: isSel ? 'var(--orange)' : 'var(--text)' }}>
                    {d.getDate()}
                  </p>
                </button>
              )
            })}
          </div>
          <button onClick={() => setShowCalendar(false)}
            style={{ width:'100%', marginTop:10, background:'none', border:'1px solid var(--border)', borderRadius:10, padding:'7px 0', color:'var(--muted)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Close
          </button>
        </div>
      )}
    </div>
  )
}