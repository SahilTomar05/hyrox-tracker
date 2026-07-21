import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Share2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import DayPicker from '../components/DayPicker'

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d
  })
}

function getLast8Weeks() {
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (7 - i) * 7); return d
  })
}

function shortDay(date) {
  return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][((new Date(date).getDay()+6)%7)]
}

function dayLabel(date) {
  return new Date(date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
}

function isThisWeek(date) {
  const d = new Date(date), now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate()-((now.getDay()+6)%7))
  monday.setHours(0,0,0,0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate()+7)
  return d >= monday && d < sunday
}

function isSameWeek(d1, d2) {
  const startOf = d => {
    const m = new Date(d); m.setDate(d.getDate()-((d.getDay()+6)%7)); m.setHours(0,0,0,0); return m.getTime()
  }
  return startOf(new Date(d1)) === startOf(new Date(d2))
}

function calc1RM(reps, weight) {
  if (!reps || !weight) return 0
  return Math.round(Number(weight) * (1 + Number(reps)/30))
}

const Tip = ({ active, payload, label, unit='' }) => {
  if (active && payload?.length) return (
    <div style={{ background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:10, padding:'8px 14px' }}>
      <p style={{ color:'#555', fontSize:11, marginBottom:2 }}>{label}</p>
      <p style={{ color:'#fff', fontSize:15, fontWeight:700 }}>{payload[0].value}{unit}</p>
    </div>
  )
  return null
}

// ── VIBRANT SHARE MODAL ────────────────────────────────────────────────
function ShareModal({ profile, stats, sessions, nutritionLogs, selectedDate, onClose }) {
  const { isDark } = useTheme()

  // Fix: use selectedDate not new Date()
  const logDate = selectedDate ? new Date(selectedDate) : (() => {
    const now = new Date()
    if (now.getHours() < 4) {
      const y = new Date(now); y.setDate(y.getDate()-1)
      if (sessions.some(s => new Date(s.date).toDateString()===y.toDateString() && s.rpe>0)) return y
    }
    return now
  })()

  const dateStr = logDate.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })
  const logDateStr = logDate.toDateString()
  const isToday = logDateStr === new Date().toDateString()

  const daysLeft = profile?.race_date
    ? Math.ceil((new Date(profile.race_date)-new Date())/(1000*60*60*24))
    : null

  const daySession = sessions.find(s => new Date(s.date).toDateString()===logDateStr && s.rpe>0)
  const dayNutrition = nutritionLogs?.find(n => new Date(n.date).toDateString()===logDateStr)

  // Smart score — RPE drives it, sport/freestyle understood
  const score = (() => {
    const daySessions = sessions.filter(s => new Date(s.date).toDateString()===logDateStr && s.rpe>0)
    if (!daySessions.length) return null
    let total = 0
    daySessions.forEach(s => {
      const rpe = Number(s.rpe)||7
      const dur = Number(s.duration)||45
      const exCount = (s.exercises||[]).length
      const rpeScore = (rpe/10)*50
      const durScore = Math.min((dur/60)*20, 25)
      const exScore = exCount>=6?25:exCount>=3?20:exCount>=1?15:0
      const isSport = ['Skills','Mixed'].includes(s.type)||(s.exercises||[]).some(e=>e.cat==='Skills'||e.fieldType==='sport')
      const sportBonus = isSport ? 15 : 0
      total += rpeScore + durScore + exScore + sportBonus
    })
    return Math.min(Math.round(total/daySessions.length), 100)
  })()

  // Always encouraging
  const enc = (() => {
    if (score===null) return { emoji:'🌅', color:'#FF5A1F', msg:'Rest day — recovery is training too!', label:'Rest' }
    if (score>=90) return { emoji:'🔥', color:'#FF5A1F', msg:"Absolute beast! Champions are built exactly like this!", label:'Elite' }
    if (score>=80) return { emoji:'⚡', color:'#F59E0B', msg:"Outstanding session! You're consistently pushing limits!", label:'Outstanding' }
    if (score>=70) return { emoji:'💪', color:'#22C55E', msg:"Strong work! Every rep builds a better version of you!", label:'Strong' }
    if (score>=60) return { emoji:'✅', color:'#3B82F6', msg:"Solid effort! Consistency over perfection — keep going!", label:'Solid' }
    if (score>=40) return { emoji:'🌱', color:'#22C55E', msg:"Progress is progress! Keep showing up — results are coming!", label:'Progress' }
    return { emoji:'🚀', color:'#FF5A1F', msg:"Showing up is 90% of it — you did that! Build on this!", label:'Building' }
  })()

  const caloriesBurned = (() => {
    const weight = Number(profile?.weight)||70
    return sessions.filter(s=>new Date(s.date).toDateString()===logDateStr&&s.rpe>0).reduce((t,s)=>{
      const dur=Number(s.duration)||45, rpe=Number(s.rpe)||6
      const met = s.type==='Strength'?3.5+rpe*0.3:s.type==='Conditioning'?6+rpe*0.5:s.type==='Skills'?5+rpe*0.4:4+rpe*0.3
      return t+Math.round(met*weight*(dur/60))
    },0)
  })()

  const dayCalories = dayNutrition ? Math.round((dayNutrition.meals||[]).reduce((a,m)=>a+Number(m.calories||0),0)) : 0
  const dayProtein = dayNutrition ? Math.round((dayNutrition.meals||[]).reduce((a,m)=>a+Number(m.protein||0),0)) : 0
  const dayWater = dayNutrition?.water || 0
  const waterGoal = profile?.goals?.water || 3
  const proteinGoal = profile?.goals?.protein || 150

  async function saveAndShare(mode) {
    const card = document.getElementById('pace4-share-card')
    if (!card) return
    try {
      const h2c = (await import('html2canvas')).default
      const canvas = await h2c(card, { backgroundColor:'#0a0a0a', scale:2, useCORS:true, logging:false })
      canvas.toBlob(async blob => {
        const file = new File([blob], 'pace4-progress.png', { type:'image/png' })
        if (mode==='share') {
          if (navigator.canShare?.({files:[file]})) { await navigator.share({files:[file],title:'My Pace4 Progress'}); return }
          if (navigator.share) { await navigator.share({title:'My Pace4 Progress',text:`${enc.label} session! RPE ${daySession?.rpe||0}/10 · ${caloriesBurned} kcal burned #Pace4`,url:'https://www.pace4.in'}); return }
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href=url; a.download=`pace4-${logDate.toISOString().split('T')[0]}.png`
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
      },'image/png')
    } catch { alert('📸 Screenshot this card to save it!') }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflowY:'auto' }}
      onClick={onClose}>
      <div style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:12 }}
        onClick={e=>e.stopPropagation()}>

        {/* Share card — always dark */}
        <div id="pace4-share-card"
          style={{ background:'linear-gradient(145deg,#0a0a0a,#111)', border:`1px solid ${enc.color}25`, borderRadius:24, padding:20, position:'relative', overflow:'hidden' }}>

          {/* Gradient top bar */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg,#FF5A1F,#FF8C42,#F59E0B)', borderRadius:'24px 24px 0 0' }} />
          <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:enc.color+'08', filter:'blur(50px)', pointerEvents:'none' }} />

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, marginTop:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <img src="/icon-512.png" alt="P4" style={{ width:34, height:34, borderRadius:10, boxShadow:'0 2px 12px rgba(255,90,31,.5)' }} />
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:'#fff', lineHeight:1 }}>Pace4</p>
                <p style={{ fontSize:9, color:'#FF5A1F', letterSpacing:'.08em', textTransform:'uppercase', marginTop:2 }}>pace4.in</p>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:10, color:'#555' }}>{dateStr}</p>
              {!isToday && <p style={{ fontSize:9, color:'#444', marginTop:2 }}>Logged entry</p>}
              {daysLeft > 0 && <p style={{ fontSize:10, color:'#FF5A1F', fontWeight:600, marginTop:2 }}>🏁 {daysLeft}d to race</p>}
            </div>
          </div>

          {/* Name */}
          <p style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:2, letterSpacing:'-.3px' }}>{profile?.name}</p>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <p style={{ fontSize:11, color:'#FF5A1F' }}>{profile?.event_name || profile?.sport || 'Athlete'}</p>
            {profile?.fitness_level && (
              <span style={{ fontSize:10, color:'#555', background:'#ffffff06', padding:'2px 8px', borderRadius:10 }}>
                {profile.fitness_level.charAt(0).toUpperCase()+profile.fitness_level.slice(1)}
              </span>
            )}
          </div>

          {/* Score hero */}
          <div style={{ background:`linear-gradient(135deg,${enc.color}18,${enc.color}06)`, border:`1px solid ${enc.color}25`, borderRadius:18, padding:'14px 14px', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:42, lineHeight:1, flexShrink:0 }}>{enc.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  {score !== null && <span style={{ fontSize:24, fontWeight:800, color:enc.color }}>{score}</span>}
                  {score !== null && <span style={{ fontSize:11, color:'#555' }}>/100</span>}
                  <span style={{ fontSize:11, fontWeight:700, color:enc.color, background:enc.color+'20', padding:'2px 10px', borderRadius:20 }}>{enc.label}</span>
                </div>
                {daySession?.rpe > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:5 }}>
                    <span style={{ fontSize:10, color:'#666' }}>RPE</span>
                    <div style={{ display:'flex', gap:2 }}>
                      {Array.from({length:10},(_,i)=>(
                        <div key={i} style={{ width:12, height:5, borderRadius:2, background:i<daySession.rpe?enc.color:'#ffffff10' }} />
                      ))}
                    </div>
                    <span style={{ fontSize:10, color:enc.color, fontWeight:700 }}>{daySession.rpe}/10</span>
                  </div>
                )}
                <p style={{ fontSize:11, color:'#ccc', lineHeight:1.5 }}>{enc.msg}</p>
              </div>
            </div>
          </div>

          {/* Session */}
          {daySession && (
            <div style={{ background:'#ffffff06', borderRadius:12, padding:'8px 12px', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{daySession.type}</p>
                  <p style={{ fontSize:10, color:'#555', marginTop:1 }}>
                    {[daySession.duration&&`${daySession.duration}min`, daySession.exercises?.length&&`${daySession.exercises.length} exercises`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span style={{ fontSize:22 }}>
                  {daySession.type==='Strength'?'🏋️':daySession.type==='Conditioning'?'🔥':daySession.type==='Skills'?'⚡':daySession.type==='Mobility'?'🧘':'💪'}
                </span>
              </div>
            </div>
          )}

          {/* Progress bars */}
          <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:10 }}>
            {[
              { icon:'🔥', label:'Cal Burned', val:caloriesBurned, unit:'kcal', color:'#FF5A1F', max:800 },
              { icon:'🥩', label:'Protein', val:dayProtein, unit:'g', color:'#22C55E', max:proteinGoal },
              { icon:'💧', label:'Water', val:dayWater, unit:'L', color:'#3B82F6', max:waterGoal },
            ].map(({ icon, label, val, unit, color, max }) => {
              const pct = Math.min((val/(max||1))*100, 100)
              return (
                <div key={label}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontSize:9, color:'#555' }}>{icon} {label}</span>
                    <span style={{ fontSize:10, fontWeight:700, color }}>{val}{unit}</span>
                  </div>
                  <div style={{ height:5, background:'#ffffff08', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}aa)`, borderRadius:3 }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7, marginBottom:10 }}>
            {[
              { icon:'🔥', label:'Burned', val:caloriesBurned||'—', unit:'kcal', color:'#FF5A1F' },
              { icon:'🍽️', label:'Consumed', val:dayCalories||'—', unit:'kcal', color:'#F59E0B' },
              { icon:'💧', label:'Water', val:dayWater||'—', unit:'L', color:'#3B82F6' },
            ].map(({ icon, label, val, unit, color }) => (
              <div key={label} style={{ background:'#ffffff06', borderRadius:10, padding:'8px 6px', textAlign:'center' }}>
                <p style={{ fontSize:16, fontWeight:800, color, lineHeight:1 }}>
                  {val}<span style={{ fontSize:9, fontWeight:400, color:'#444' }}>{unit}</span>
                </p>
                <p style={{ fontSize:9, color:'#444', marginTop:2 }}>{icon} {label}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ borderTop:'1px solid #ffffff08', paddingTop:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <p style={{ fontSize:9, color:'#333' }}>pace4.in</p>
            <p style={{ fontSize:9, color:'#333' }}>#Pace4 #P4Athlete #IndianAthlete</p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button onClick={() => saveAndShare('save')}
            style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:14, color:'var(--text)', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            💾 Save
          </button>
          <button onClick={() => saveAndShare('share')}
            style={{ background:'linear-gradient(135deg,#FF5A1F,#FF8C42)', border:'none', borderRadius:14, padding:14, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            📤 Share
          </button>
        </div>
        <button onClick={onClose}
          style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:14, padding:12, color:'var(--muted)', fontSize:14, cursor:'pointer' }}>
          Close
        </button>
        <p style={{ textAlign:'center', fontSize:11, color:'var(--subtle)' }}>Save → share on Instagram Stories or WhatsApp 🔥</p>
      </div>
    </div>
  )
}

// ── MAIN PROGRESS ──────────────────────────────────────────────────────
export default function Progress({ session, profile }) {
  const [sessions, setSessions] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [nutritionLogs, setNutritionLogs] = useState([])
  const [todayLog, setTodayLog] = useState({ calories:0, protein:0, water:0 })
  const [loading, setLoading] = useState(true)
  const [newWeight, setNewWeight] = useState('')
  const [activeChart, setActiveChart] = useState('calories')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const todayDate = new Date(new Date().getTime()+(5.5*60*60*1000)).toISOString().split('T')[0]
    const [sRes, wRes, nRes, todayRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', session.user.id).order('date', { ascending:true }),
      supabase.from('weight_logs').select('*').eq('user_id', session.user.id).order('date', { ascending:true }),
      supabase.from('nutrition_logs').select('*').eq('user_id', session.user.id).order('date', { ascending:false }).limit(30),
      supabase.from('nutrition_logs').select('*').eq('user_id', session.user.id).eq('date', todayDate).maybeSingle(),
    ])
    setSessions(sRes.data || [])
    setWeightLogs(wRes.data || [])
    setNutritionLogs(nRes.data || [])
    if (todayRes.data) {
      const meals = todayRes.data.meals || []
      setTodayLog({
        calories: Math.round(meals.reduce((s,m)=>s+Number(m.calories||0),0)),
        protein: Math.round(meals.reduce((s,m)=>s+Number(m.protein||0),0)),
        water: todayRes.data.water || 0,
      })
    }
    setLoading(false)
  }

  async function logWeight() {
    if (!newWeight) return
    const { data } = await supabase.from('weight_logs')
      .insert({ user_id:session.user.id, weight:Number(newWeight), date:new Date().toISOString() })
      .select().single()
    if (data) setWeightLogs(p => [...p, data])
    setNewWeight('')
  }

  const last7Days = getLast7Days()
  const thisWeekSessions = sessions.filter(s => isThisWeek(s.date) && s.rpe > 0)

  const caloriesByDay = last7Days.map(date => {
    const n = nutritionLogs.find(l => new Date(l.date).toDateString()===date.toDateString())
    return { date:shortDay(date), calories: n ? Math.round((n.meals||[]).reduce((s,m)=>s+Number(m.calories||0),0)):0 }
  })

  const weeklyVolume = getLast8Weeks().map(weekDate => ({
    date: dayLabel(weekDate),
    sessions: sessions.filter(s => isSameWeek(s.date, weekDate) && s.rpe>0).length,
  }))

  const strengthLogs = sessions.filter(s=>s.rpe>0).flatMap(s =>
    (s.exercises||[]).filter(e=>e.fieldType==='strength'||(e.sets||[]).some(set=>set.weight)).map(ex => ({
      name: ex.name, date: s.date,
      bestSet: (ex.sets||[]).reduce((best,set)=>{ const rm=calc1RM(set.reps,set.weight); return rm>best?rm:best },0)
    }))
  )

  const exerciseNames = [...new Set(strengthLogs.map(e=>e.name))]

  const strengthPRs = exerciseNames.map(name => {
    const logs = strengthLogs.filter(e=>e.name===name).sort((a,b)=>new Date(a.date)-new Date(b.date))
    const latest = logs[logs.length-1]?.bestSet||0
    const prev = logs.length>1?logs[logs.length-2]?.bestSet:null
    const delta = prev?Number(((latest-prev)/prev*100).toFixed(1)):null
    return { name, rm:latest, delta, count:logs.length }
  }).filter(e=>e.rm>0).sort((a,b)=>b.rm-a.rm)

  const exerciseChartData = selectedExercise
    ? strengthLogs.filter(e=>e.name===selectedExercise)
        .sort((a,b)=>new Date(a.date)-new Date(b.date))
        .slice(-10).map(e=>({ date:dayLabel(e.date), value:e.bestSet }))
    : []

  const selectedImprovement = (() => {
    if (!selectedExercise||exerciseChartData.length<2) return null
    const first=exerciseChartData[0].value, last=exerciseChartData[exerciseChartData.length-1].value
    if (!first) return null
    return { pct:Math.round((last-first)/first*100), from:first, to:last }
  })()

  const last7Nutrition = nutritionLogs.slice(0,7)
  const avgCalories = last7Nutrition.length>0
    ? Math.round(last7Nutrition.reduce((s,d)=>s+(d.meals||[]).reduce((a,m)=>a+Number(m.calories||0),0),0)/last7Nutrition.length)
    : 0
  const avgProtein = last7Nutrition.length>0
    ? Math.round(last7Nutrition.reduce((s,d)=>s+(d.meals||[]).reduce((a,m)=>a+Number(m.protein||0),0),0)/last7Nutrition.length)
    : 0

  const stepsHistory = (() => { try { return JSON.parse(localStorage.getItem('stepsHistory')||'{}') } catch { return {} } })()
  const last7StepsVals = last7Days.map(d=>stepsHistory[d.toDateString()]||0)
  const avgSteps = Math.round(last7StepsVals.reduce((a,v)=>a+v,0)/7)
  const todaySteps = last7StepsVals[6]||0

  const sessionDays = new Set(thisWeekSessions.map(s=>new Date(s.date).toDateString())).size
  const nutritionDaysThisWeek = last7Nutrition.filter(n=>isThisWeek(n.date)).length
  const stepsDays = last7StepsVals.filter(v=>v>0).length
  const consistencyScore = Math.min(Math.round((sessionDays/7)*40+(nutritionDaysThisWeek/7)*35+(stepsDays/7)*25),100)

  const topImprovement = (() => {
    const improvements = exerciseNames.map(name => {
      const all = strengthLogs.filter(e=>e.name===name).sort((a,b)=>new Date(a.date)-new Date(b.date))
      const thisWeek = all.filter(e=>isThisWeek(e.date))
      if (!thisWeek.length||all.length<2) return null
      const weekBest = Math.max(...thisWeek.map(e=>e.bestSet))
      const prevBest = all.filter(e=>!isThisWeek(e.date)).slice(-1)[0]?.bestSet
      if (!prevBest) return null
      const pct = Math.round((weekBest-prevBest)/prevBest*100)
      return pct>0?{ exercise:name, pct }:null
    }).filter(Boolean)
    return improvements.sort((a,b)=>b.pct-a.pct)[0]||null
  })()

  const currentWeight = weightLogs.length>0?weightLogs[weightLogs.length-1].weight:profile?.weight
  const weightData = weightLogs.slice(-10).map(w=>({ date:dayLabel(w.date), weight:w.weight }))
  const typeCount = {}
  sessions.filter(s=>s.rpe>0).forEach(s=>{ typeCount[s.type]=(typeCount[s.type]||0)+1 })
  const totalCount = sessions.filter(s=>s.rpe>0).length||1
  const scoreColor = consistencyScore>=80?'#22C55E':consistencyScore>=60?'#FF5A1F':'#EF4444'
  const scoreLabel = consistencyScore>=80?'Crushing it 🔥':consistencyScore>=60?'On track 💪':consistencyScore>=40?'Building':'Level up'

  const inp = { background:'var(--input-bg)', border:'1px solid var(--border2)', borderRadius:10, padding:'9px 12px', color:'var(--text)', fontSize:14, outline:'none', fontFamily:'inherit' }

  if (loading) return (
    <div style={{ paddingTop:52, display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', background:'var(--bg)' }}>
      <div style={{ width:28, height:28, borderRadius:'50%', border:'2px solid var(--border)', borderTopColor:'#FF5A1F', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ paddingTop:52, paddingBottom:24, background:'var(--bg)', minHeight:'100vh' }}>

      {showShare && (
        <ShareModal
          profile={profile}
          stats={{ consistencyScore, avgCalories, avgProtein, avgSteps, sessionsThisWeek:thisWeekSessions.length, topImprovement, todayCalories:todayLog.calories, todayProtein:todayLog.protein, todaySteps, todayWater:todayLog.water }}
          sessions={sessions}
          nutritionLogs={nutritionLogs}
          selectedDate={selectedDate}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Header */}
      <div style={{ padding:'0 16px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:'-.5px', color:'var(--text)' }}>Progress</h1>
          <p style={{ fontSize:13, color:'var(--muted)', marginTop:3 }}>Your numbers over time</p>
        </div>
        <button onClick={() => setShowShare(true)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'#FF5A1F', border:'none', borderRadius:12, padding:'9px 16px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          <Share2 size={14} /> Share
        </button>
      </div>

      {/* Day picker */}
      <div style={{ padding:'0 16px', marginBottom:14 }}>
        <DayPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, padding:'0 16px', marginBottom:16, overflowX:'auto', scrollbarWidth:'none' }}>
        {[{id:'overview',label:'Overview'},{id:'strength',label:'Strength'},{id:'charts',label:'Charts'},{id:'body',label:'Body'}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flexShrink:0, padding:'7px 16px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', border:'1px solid', background:activeTab===tab.id?'#FF5A1F':'transparent', borderColor:activeTab===tab.id?'#FF5A1F':'var(--border)', color:activeTab===tab.id?'#fff':'var(--muted)', fontFamily:'inherit' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, margin:'0 16px 14px', overflow:'hidden' }}>
            {[
              { label:'Workouts', val:thisWeekSessions.length, sub:`/${profile?.training_days_per_week?.split(' ')[0]||5} planned`, color:'#FF5A1F' },
              { label:'Calories', val:avgCalories||0, sub:'avg/day', color:'#EF4444' },
              { label:'Steps', val:avgSteps>=1000?`${Math.round(avgSteps/100)/10}K`:avgSteps, sub:'avg/day', color:'#22C55E' },
              { label:'Total', val:sessions.filter(s=>s.rpe>0).length, sub:'sessions', color:'#A855F7' },
            ].map(({ label, val, sub, color }, i, arr) => (
              <div key={label} style={{ padding:'14px 8px', textAlign:'center', borderRight:i<arr.length-1?'1px solid var(--border)':'none' }}>
                <p style={{ fontSize:17, fontWeight:700, color }}>{val}</p>
                <p style={{ fontSize:9, color:'var(--muted)', marginTop:3, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</p>
                <p style={{ fontSize:9, color:'var(--subtle)', marginTop:4 }}>{sub}</p>
              </div>
            ))}
          </div>

          <div style={{ margin:'0 16px 14px', background:'var(--card)', border:`1px solid ${scoreColor}20`, borderRadius:18, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div>
                <p style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600, marginBottom:4 }}>Weekly Consistency</p>
                <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                  <span style={{ fontSize:48, fontWeight:700, color:scoreColor, lineHeight:1 }}>{consistencyScore}</span>
                  <span style={{ fontSize:14, color:'var(--subtle)' }}>/100</span>
                </div>
                <p style={{ fontSize:13, color:scoreColor, fontWeight:600, marginTop:2 }}>{scoreLabel}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:11, color:'var(--muted)' }}>Training {Math.round(sessionDays/7*100)}%</p>
                <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Nutrition {Math.round(nutritionDaysThisWeek/7*100)}%</p>
                <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Steps {Math.round(stepsDays/7*100)}%</p>
              </div>
            </div>
            <div style={{ height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${consistencyScore}%`, background:`linear-gradient(90deg,${scoreColor},${scoreColor}aa)`, borderRadius:3, transition:'.5s' }} />
            </div>
          </div>

          <div style={{ margin:'0 16px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Calories Consumed</p>
                <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Last 7 days</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:20, fontWeight:700, color:'#FF5A1F' }}>{avgCalories}</p>
                <p style={{ fontSize:11, color:'var(--muted)' }}>avg kcal/day</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={caloriesByDay} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<Tip unit=" kcal" />} />
                <Bar dataKey="calories" fill="#FF5A1F" radius={[6,6,0,0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ margin:'0 16px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:16 }}>
            <p style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:14 }}>Training Breakdown</p>
            {Object.keys(typeCount).length===0
              ? <p style={{ color:'var(--muted)', fontSize:13 }}>No sessions logged yet</p>
              : Object.entries(typeCount).sort((a,b)=>b[1]-a[1]).map(([type,count]) => {
                const pct=Math.round((count/totalCount)*100)
                const colors={'Strength':'#FF5A1F','Conditioning':'#EF4444','Skills':'#3B82F6','Mobility':'#A855F7','Mixed':'#22C55E'}
                const color=colors[type]||'#666'
                return (
                  <div key={type} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:13, color, fontWeight:600 }}>{type}</span>
                      <span style={{ fontSize:12, color:'var(--muted)' }}>{count} · {pct}%</span>
                    </div>
                    <div style={{ height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3 }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </>
      )}

      {/* STRENGTH */}
      {activeTab === 'strength' && (
        <>
          <div style={{ margin:'0 16px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
              <p style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>Strength Progress</p>
              <p style={{ fontSize:11, color:'var(--muted)' }}>{strengthPRs.length} exercises</p>
            </div>
            {strengthPRs.length===0 ? (
              <div style={{ padding:'32px 20px', textAlign:'center' }}>
                <p style={{ fontSize:32, marginBottom:8 }}>🏋️</p>
                <p style={{ color:'var(--muted)', fontSize:13 }}>Log strength sessions to track 1RM</p>
              </div>
            ) : strengthPRs.map(({ name, rm, delta, count }) => (
              <div key={name}
                style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, cursor:'pointer', background:selectedExercise===name?'#FF5A1F10':'transparent' }}
                onClick={() => setSelectedExercise(selectedExercise===name?'':name)}>
                <div style={{ width:38, height:38, borderRadius:10, background:'#FF5A1F15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>💪</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</p>
                  <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Est. 1RM · {count}x logged</p>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ fontSize:16, fontWeight:700, color:'#FF5A1F' }}>{rm}kg</p>
                  {delta!==null && (
                    <div style={{ display:'flex', alignItems:'center', gap:3, justifyContent:'flex-end', marginTop:2 }}>
                      {delta>0?<TrendingUp size={11} color="#22C55E"/>:delta<0?<TrendingDown size={11} color="#EF4444"/>:<Minus size={11} color="var(--muted)"/>}
                      <span style={{ fontSize:11, color:delta>0?'#22C55E':delta<0?'#EF4444':'var(--muted)', fontWeight:600 }}>
                        {delta>0?'+':''}{delta}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedExercise && exerciseChartData.length>0 && (
            <div style={{ margin:'0 16px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{selectedExercise}</p>
                  <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Estimated 1RM over time</p>
                </div>
                {selectedImprovement && (
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:16, fontWeight:700, color:selectedImprovement.pct>=0?'#22C55E':'#EF4444' }}>
                      {selectedImprovement.pct>=0?'+':''}{selectedImprovement.pct}%
                    </p>
                    <p style={{ fontSize:11, color:'var(--muted)' }}>{selectedImprovement.from}→{selectedImprovement.to}kg</p>
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={exerciseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} width={35} domain={['dataMin - 5','dataMax + 5']} />
                  <Tooltip content={<Tip unit="kg" />} />
                  <Line type="monotone" dataKey="value" stroke="#FF5A1F" strokeWidth={2.5} dot={{ fill:'#FF5A1F', r:4 }} activeDot={{ r:6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* CHARTS */}
      {activeTab === 'charts' && (
        <>
          <div style={{ display:'flex', gap:6, padding:'0 16px', marginBottom:14 }}>
            {[{id:'calories',label:'📊 Calories'},{id:'volume',label:'💪 Volume'},{id:'weight',label:'⚖️ Weight'}].map(c => (
              <button key={c.id} onClick={() => setActiveChart(c.id)}
                style={{ flexShrink:0, padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', border:'1px solid', background:activeChart===c.id?'#FF5A1F':'transparent', borderColor:activeChart===c.id?'#FF5A1F':'var(--border)', color:activeChart===c.id?'#fff':'var(--muted)', fontFamily:'inherit' }}>
                {c.label}
              </button>
            ))}
          </div>

          {activeChart==='calories' && (
            <div style={{ margin:'0 16px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                <div><p style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Calories (7 days)</p></div>
                <div style={{ textAlign:'right' }}><p style={{ fontSize:18, fontWeight:700, color:'#FF5A1F' }}>{avgCalories}</p><p style={{ fontSize:11, color:'var(--muted)' }}>avg/day</p></div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={caloriesByDay} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip content={<Tip unit=" kcal" />} />
                  <Bar dataKey="calories" fill="#FF5A1F" radius={[6,6,0,0]} opacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart==='volume' && (
            <div style={{ margin:'0 16px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                <div><p style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Weekly Sessions</p></div>
                <div style={{ textAlign:'right' }}><p style={{ fontSize:18, fontWeight:700, color:'#A855F7' }}>{sessions.filter(s=>s.rpe>0).length}</p><p style={{ fontSize:11, color:'var(--muted)' }}>total</p></div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyVolume} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} allowDecimals={false} width={20} />
                  <Tooltip content={<Tip unit=" sessions" />} />
                  <Bar dataKey="sessions" fill="#A855F7" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart==='weight' && (
            <div style={{ margin:'0 16px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div><p style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Weight Trend</p><p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{weightLogs.length} entries</p></div>
                <div style={{ display:'flex', gap:8 }}>
                  <input type="number" placeholder="kg" value={newWeight} onChange={e=>setNewWeight(e.target.value)}
                    style={{ width:60, ...inp, textAlign:'center', padding:'6px 8px' }} />
                  <button onClick={logWeight}
                    style={{ background:'#FF5A1F', border:'none', borderRadius:9, padding:'0 12px', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>Log</button>
                </div>
              </div>
              {weightData.length>0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} width={35} domain={['dataMin - 2','dataMax + 2']} />
                    <Tooltip content={<Tip unit="kg" />} />
                    <Line type="monotone" dataKey="weight" stroke="#22C55E" strokeWidth={2.5} dot={{ fill:'#22C55E', r:4 }} activeDot={{ r:6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <p style={{ color:'var(--muted)', fontSize:13 }}>Log your weight to see the trend</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* BODY */}
      {activeTab === 'body' && (
        <>
          <div style={{ margin:'0 16px 14px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <p style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>Weight Journey</p>
              <div style={{ display:'flex', gap:8 }}>
                <input type="number" placeholder="kg" value={newWeight} onChange={e=>setNewWeight(e.target.value)}
                  style={{ width:60, ...inp, textAlign:'center', padding:'6px 8px' }} />
                <button onClick={logWeight}
                  style={{ background:'#FF5A1F', border:'none', borderRadius:9, padding:'0 12px', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>Log</button>
              </div>
            </div>
            {profile?.weight && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                {[
                  { label:'Start', val:`${profile.weight}kg`, color:'var(--muted)' },
                  { label:'Now', val:`${currentWeight||profile.weight}kg`, color:'#FF5A1F' },
                  { label:'Goal', val:profile.goal_weight?`${profile.goal_weight}kg`:'—', color:'var(--muted)' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ textAlign:'center' }}>
                    <p style={{ fontSize:11, color:'var(--muted)', marginBottom:3 }}>{label}</p>
                    <p style={{ fontSize:17, fontWeight:700, color }}>{val}</p>
                  </div>
                ))}
              </div>
            )}
            {profile?.weight && profile?.goal_weight && (
              <>
                <div style={{ height:6, background:'var(--border)', borderRadius:3, overflow:'hidden', marginBottom:6 }}>
                  <div style={{ height:'100%', background:'#FF5A1F', borderRadius:3, width:`${Math.min(Math.max(((profile.weight-(currentWeight||profile.weight))/(profile.weight-profile.goal_weight))*100,0),100)}%`, transition:'.3s' }} />
                </div>
                <p style={{ fontSize:11, color:'var(--muted)' }}>
                  {currentWeight&&currentWeight<profile.weight?`${(profile.weight-currentWeight).toFixed(1)}kg lost so far`:'Start logging weight to track progress'}
                </p>
              </>
            )}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'0 16px' }}>
            {[
              { label:'Total sessions', val:sessions.filter(s=>s.rpe>0).length, color:'#FF5A1F', icon:'💪' },
              { label:'This week', val:thisWeekSessions.length, color:'#22C55E', icon:'📅' },
              { label:'Avg calories', val:`${avgCalories} kcal`, color:'#EF4444', icon:'🔥' },
              { label:'Avg protein', val:`${avgProtein}g`, color:'#A855F7', icon:'🥩' },
            ].map(({ label, val, color, icon }) => (
              <div key={label} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:'14px 16px' }}>
                <p style={{ fontSize:22, marginBottom:8 }}>{icon}</p>
                <p style={{ fontSize:20, fontWeight:700, color }}>{val}</p>
                <p style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}