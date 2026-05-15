import { useState } from 'react'
import { Save, LogOut } from 'lucide-react'

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', multiplier: 1.2 },
  { id: 'light', label: 'Lightly Active', multiplier: 1.375 },
  { id: 'moderate', label: 'Moderately Active', multiplier: 1.55 },
  { id: 'very', label: 'Very Active', multiplier: 1.725 },
]

const SPORTS = [
  { id: 'marathon', icon: '🏃', name: 'Marathon' },
  { id: 'hyrox', icon: '⚡', name: 'Hyrox' },
  { id: 'ocr', icon: '🏔️', name: 'OCR / Adventure' },
  { id: 'cycling', icon: '🚴', name: 'Cycling' },
  { id: 'bodybuilding', icon: '🏋️', name: 'Bodybuilding' },
  { id: 'crossfit', icon: '🏇', name: 'CrossFit' },
  { id: 'triathlon', icon: '🏊', name: 'Triathlon' },
  { id: 'combat', icon: '🥊', name: 'Combat Sports' },
  { id: 'team', icon: '⚽', name: 'Team Sports' },
  { id: 'calisthenics', icon: '🤸', name: 'Calisthenics' },
  { id: 'general', icon: '🎯', name: 'General Fitness' },
  { id: 'custom', icon: '🏄', name: 'Custom Sport' },
]

const INDIAN_EVENTS = {
  marathon: ['Tata Mumbai Marathon', 'Delhi Half Marathon (ADHM)', 'Ladakh Marathon', 'Bengaluru Marathon', 'Pune Marathon', 'Airtel Hyderabad Marathon', 'Vedanta Chennai Marathon', 'Kolkata Marathon', 'Satara Hill Marathon', 'Custom Marathon Event'],
  hyrox: ['Hyrox Mumbai', 'Hyrox Delhi', 'Hyrox Bengaluru', 'Hyrox Chennai', 'Hyrox Hyderabad', 'Custom Hyrox Event'],
  ocr: ['Devil Circuit', 'Yodha Race', 'Spartan India', 'Tough Mudder India', 'Guerrilla Race India', 'Custom OCR Event'],
  cycling: ['Tour of Nilgiris', 'Mumbai Cyclothon', 'Delhi Cyclothon', 'Dirty Dozen Shimla', 'Ladakh Cycling Expedition', 'Custom Cycling Event'],
  triathlon: ['Ironman India', 'Ironman 70.3 Goa', 'Mumbai Triathlon', 'Delhi Triathlon', 'Custom Triathlon Event'],
  crossfit: ['CrossFit Open', 'CrossFit Sanctional India', 'Local Box Competition', 'Custom CrossFit Event'],
  bodybuilding: ['Mr. India', 'IBBF National Championship', 'State Championship', 'Physique Competition', 'No competition — personal goal'],
  combat: ['Amateur MMA bout', 'Boxing tournament', 'Wrestling competition', 'No event — fitness only'],
  team: ['Football league', 'Cricket tournament', 'Basketball league', 'No event — fitness only'],
  calisthenics: ['Calisthenics competition', 'Street workout event', 'No event — skill goals'],
  general: ['No event — just staying fit'],
  custom: ['Custom event'],
}

function calculateGoals({ age, gender, weight, height, activityLevel, sport, primaryGoal }) {
  const activity = ACTIVITY_LEVELS.find(a => a.id === activityLevel)
  const multiplier = activity ? activity.multiplier : 1.55
  let bmr
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161
  }
  const tdee = Math.round(bmr * multiplier)
  let calorieAdjust = 0
  if (primaryGoal?.toLowerCase().includes('cut') || primaryGoal?.toLowerCase().includes('lose')) calorieAdjust = -400
  if (primaryGoal?.toLowerCase().includes('bulk') || primaryGoal?.toLowerCase().includes('muscle')) calorieAdjust = 300
  const calories = tdee + calorieAdjust
  let proteinMultiplier = 1.8
  if (['bodybuilding', 'crossfit', 'hyrox'].includes(sport)) proteinMultiplier = 2.2
  if (['marathon', 'cycling', 'triathlon'].includes(sport)) proteinMultiplier = 1.6
  if (['combat'].includes(sport)) proteinMultiplier = 2.0
  const protein = Math.round(weight * proteinMultiplier)
  const fat = Math.round((calories * 0.25) / 9)
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4)
  return { calories, protein, carbs: Math.max(carbs, 100), fat, water: Math.round(weight * 0.035 * 10) / 10 }
}

export default function Settings({ profile, onUpdate, onReset }) {
  const [form, setForm] = useState({ ...profile })
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave() {
    const goals = calculateGoals({
      age: Number(form.age), gender: form.gender,
      weight: Number(form.weight), height: Number(form.height),
      activityLevel: form.activity_level, sport: form.sport,
      primaryGoal: form.primary_goal,
    })
    const updated = {
      ...form,
      goals,
      weight: Number(form.weight),
      height: Number(form.height),
      age: Number(form.age),
      goal_weight: Number(form.goal_weight),
      step_goal: Number(form.step_goal),
    }
    onUpdate(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    if (confirm('This will sign you out and clear your session. Your cloud data stays safe. Continue?')) {
      onReset()
    }
  }

  const events = form.sport ? (INDIAN_EVENTS[form.sport] || []) : []
  const goals = calculateGoals({
    age: Number(form.age), gender: form.gender,
    weight: Number(form.weight), height: Number(form.height),
    activityLevel: form.activity_level, sport: form.sport,
    primaryGoal: form.primary_goal,
  })

  const sections = ['profile', 'sport', 'goals', 'nutrition']

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#666] text-sm">Update your profile & goals</p>
      </div>

      {/* Section tabs */}
      <div className="grid grid-cols-4 gap-1">
        {sections.map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`py-2 rounded-xl text-xs font-medium capitalize transition-all
              ${activeSection === s ? 'bg-[#00E5A0] text-black' : 'bg-[#1a1a1a] text-[#666]'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Profile section */}
      {activeSection === 'profile' && (
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] space-y-4">
          <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider">Personal Info</p>
          <div>
            <label className="text-[#666] text-xs mb-1 block">Name</label>
            <input value={form.name || ''} onChange={e => update('name', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#666] text-xs mb-1 block">Age</label>
              <input type="number" value={form.age || ''} onChange={e => update('age', e.target.value)}
                className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
            </div>
            <div>
              <label className="text-[#666] text-xs mb-1 block">Height (cm)</label>
              <input type="number" value={form.height || ''} onChange={e => update('height', e.target.value)}
                className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#666] text-xs mb-1 block">Current weight (kg)</label>
              <input type="number" value={form.weight || ''} onChange={e => update('weight', e.target.value)}
                className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
            </div>
            <div>
              <label className="text-[#666] text-xs mb-1 block">Goal weight (kg)</label>
              <input type="number" value={form.goal_weight || ''} onChange={e => update('goal_weight', e.target.value)}
                className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[#666] text-xs mb-2 block">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {['male', 'female'].map(g => (
                <button key={g} onClick={() => update('gender', g)}
                  className={`py-2 rounded-xl text-sm font-medium capitalize transition-all
                    ${form.gender === g ? 'bg-[#00E5A0] text-black' : 'bg-[#2a2a2a] text-[#666]'}`}>
                  {g === 'male' ? '♂ Male' : '♀ Female'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[#666] text-xs mb-1 block">Daily step goal</label>
            <input type="number" value={form.step_goal || 10000} onChange={e => update('step_goal', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
          </div>
        </div>
      )}

      {/* Sport section */}
      {activeSection === 'sport' && (
        <div className="space-y-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] space-y-3">
            <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider">Your Sport</p>
            <div className="grid grid-cols-2 gap-2">
              {SPORTS.map(sport => (
                <button key={sport.id} onClick={() => update('sport', sport.id)}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all
                    ${form.sport === sport.id ? 'bg-[#0d2d1f] border-[#00E5A0]' : 'bg-[#2a2a2a] border-[#3a3a3a]'}`}>
                  <span>{sport.icon}</span>
                  <span className={`text-xs font-medium ${form.sport === sport.id ? 'text-[#00E5A0]' : 'text-white'}`}>
                    {sport.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] space-y-3">
            <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider">Event</p>
            <div className="grid grid-cols-2 gap-2">
              {['yes', 'no'].map(opt => (
                <button key={opt} onClick={() => update('has_race', opt === 'yes')}
                  className={`py-2 rounded-xl text-sm font-medium transition-all
                    ${form.has_race === (opt === 'yes') ? 'bg-[#00E5A0] text-black' : 'bg-[#2a2a2a] text-[#666]'}`}>
                  {opt === 'yes' ? '🏆 Have event' : '🎯 No event'}
                </button>
              ))}
            </div>
            {form.has_race && (
              <>
                <div>
                  <label className="text-[#666] text-xs mb-1 block">Event name</label>
                  <select value={form.event_name || ''}
                    onChange={e => update('event_name', e.target.value)}
                    className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none">
                    <option value="">Select event...</option>
                    {events.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[#666] text-xs mb-1 block">Event date</label>
                  <input type="date" value={form.race_date || ''}
                    onChange={e => update('race_date', e.target.value)}
                    className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
                </div>
              </>
            )}
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] space-y-3">
            <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider">Experience</p>
            <div className="grid grid-cols-3 gap-2">
              {['beginner', 'intermediate', 'advanced'].map(level => (
                <button key={level} onClick={() => update('experience_level', level)}
                  className={`py-2 rounded-xl text-xs font-medium capitalize transition-all
                    ${form.experience_level === level ? 'bg-[#00E5A0] text-black' : 'bg-[#2a2a2a] text-[#666]'}`}>
                  {level}
                </button>
              ))}
            </div>
            <div>
              <label className="text-[#666] text-xs mb-2 block">Training days per week</label>
              <div className="grid grid-cols-3 gap-2">
                {['2 days', '3 days', '4 days', '5 days', '6 days', '7 days'].map(d => (
                  <button key={d} onClick={() => update('training_days_per_week', d)}
                    className={`py-2 rounded-xl text-xs font-medium transition-all
                      ${form.training_days_per_week === d ? 'bg-[#00E5A0] text-black' : 'bg-[#2a2a2a] text-[#666]'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals section */}
      {activeSection === 'goals' && (
        <div className="space-y-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] space-y-3">
            <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider">Activity Level</p>
            {ACTIVITY_LEVELS.map(level => (
              <button key={level.id} onClick={() => update('activity_level', level.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all
                  ${form.activity_level === level.id ? 'bg-[#0d2d1f] border-[#00E5A0]' : 'bg-[#2a2a2a] border-[#3a3a3a]'}`}>
                <span className={`text-sm font-medium ${form.activity_level === level.id ? 'text-[#00E5A0]' : 'text-white'}`}>
                  {level.label}
                </span>
                {form.activity_level === level.id && (
                  <div className="w-5 h-5 rounded-full bg-[#00E5A0] flex items-center justify-center">
                    <span className="text-black text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Calculated goals preview */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
            <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider mb-3">
              Calculated goals
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0f0f0f] rounded-xl p-3 text-center">
                <p className="text-[#FF6B35] text-lg font-bold">{goals.calories}</p>
                <p className="text-[#666] text-xs">kcal / day</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-xl p-3 text-center">
                <p className="text-[#A78BFA] text-lg font-bold">{goals.protein}g</p>
                <p className="text-[#666] text-xs">protein / day</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-xl p-3 text-center">
                <p className="text-[#3B9EFF] text-lg font-bold">{goals.carbs}g</p>
                <p className="text-[#666] text-xs">carbs / day</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-xl p-3 text-center">
                <p className="text-white text-lg font-bold">{goals.water}L</p>
                <p className="text-[#666] text-xs">water / day</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nutrition section */}
      {activeSection === 'nutrition' && (
        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] space-y-4">
          <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider">Nutrition Goals</p>
          <p className="text-[#666] text-xs">These are auto-calculated from your stats. Update your body stats in Profile tab to recalculate.</p>
          <div className="space-y-3">
            {[
              { label: 'Daily calories (kcal)', val: goals.calories, color: '#FF6B35' },
              { label: 'Protein (g)', val: goals.protein, color: '#A78BFA' },
              { label: 'Carbs (g)', val: goals.carbs, color: '#3B9EFF' },
              { label: 'Fat (g)', val: goals.fat, color: '#FF6B35' },
              { label: 'Water (L)', val: goals.water, color: '#3B9EFF' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between bg-[#2a2a2a] rounded-xl px-4 py-3">
                <span className="text-white text-sm">{label}</span>
                <span className="font-bold text-sm" style={{ color }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      <button onClick={handleSave}
        className={`w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all
          ${saved ? 'bg-[#0d2d1f] text-[#00E5A0] border border-[#00E5A0]' : 'bg-[#00E5A0] text-black'}`}>
        <Save size={16} />
        {saved ? 'Saved! ✓' : 'Save changes'}
      </button>

      <button onClick={handleReset}
        className="w-full py-3 rounded-2xl border border-red-900 text-red-500 text-sm flex items-center justify-center gap-2">
        <LogOut size={16} /> Sign out
      </button>
    </div>
  )
}