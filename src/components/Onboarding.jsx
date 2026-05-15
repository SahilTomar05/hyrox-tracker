import { useState } from 'react'

const SPORTS = [
  { id: 'marathon', icon: '🏃', name: 'Marathon', desc: 'Road running events' },
  { id: 'hyrox', icon: '⚡', name: 'Hyrox', desc: 'Fitness racing' },
  { id: 'ocr', icon: '🏔️', name: 'OCR / Adventure', desc: 'Devil Circuit, Yodha, Spartan' },
  { id: 'cycling', icon: '🚴', name: 'Cycling', desc: 'Road, gravel, events' },
  { id: 'bodybuilding', icon: '🏋️', name: 'Bodybuilding', desc: 'Bulk, cut, compete' },
  { id: 'crossfit', icon: '🏇', name: 'CrossFit', desc: 'WODs & competitions' },
  { id: 'triathlon', icon: '🏊', name: 'Triathlon', desc: 'Sprint to Ironman' },
  { id: 'combat', icon: '🥊', name: 'Combat Sports', desc: 'MMA, boxing, wrestling' },
  { id: 'team', icon: '⚽', name: 'Team Sports', desc: 'Football, cricket, basketball' },
  { id: 'calisthenics', icon: '🤸', name: 'Calisthenics', desc: 'Skills & bodyweight' },
  { id: 'general', icon: '🎯', name: 'General Fitness', desc: 'Stay fit, no event' },
  { id: 'custom', icon: '🏄', name: 'Custom Sport', desc: 'Define your own' },
]

const INDIAN_EVENTS = {
  marathon: [
    'Tata Mumbai Marathon', 'Delhi Half Marathon (ADHM)', 'Ladakh Marathon',
    'Bengaluru Marathon', 'Pune Marathon', 'Airtel Hyderabad Marathon',
    'Vedanta Chennai Marathon', 'Kolkata Marathon', 'Satara Hill Marathon',
    'Kaveri Trail Marathon', 'Custom Marathon Event',
  ],
  hyrox: [
    'Hyrox Mumbai', 'Hyrox Delhi', 'Hyrox Bengaluru', 'Hyrox Chennai',
    'Hyrox Hyderabad', 'Custom Hyrox Event',
  ],
  ocr: [
    'Devil Circuit', 'Yodha Race', 'Spartan India', 'Tough Mudder India',
    'Guerrilla Race India', 'Iron Gladiator', 'Custom OCR Event',
  ],
  cycling: [
    'Tour of Nilgiris', 'Mumbai Cyclothon', 'Delhi Cyclothon',
    'Dirty Dozen Shimla', 'Ladakh Cycling Expedition',
    'Tour de India', 'Custom Cycling Event',
  ],
  triathlon: [
    'Ironman India', 'Ironman 70.3 Goa', 'Mumbai Triathlon',
    'Delhi Triathlon', 'Custom Triathlon Event',
  ],
  crossfit: [
    'CrossFit Open', 'CrossFit Sanctional India', 'Local Box Competition',
    'Custom CrossFit Event',
  ],
  bodybuilding: [
    'Mr. India', 'IBBF National Championship', 'State Championship',
    'Physique Competition', 'No competition — personal goal',
  ],
  combat: [
    'Amateur MMA bout', 'Boxing tournament', 'Wrestling competition',
    'Kickboxing event', 'No event — fitness only',
  ],
  team: [
    'Football league', 'Cricket tournament', 'Basketball league',
    'No event — fitness only',
  ],
  calisthenics: [
    'Calisthenics competition', 'Street workout event',
    'No event — skill goals',
  ],
  general: ['No event — just staying fit'],
  custom: ['Custom event'],
}

const GOALS_BY_SPORT = {
  marathon: ['Finish my first marathon', 'Improve my PB', 'Run sub-4 hours', 'Run sub-3:30', 'Build base fitness'],
  hyrox: ['Finish my first Hyrox', 'Improve my time', 'Go sub-1 hour', 'Build strength & endurance'],
  ocr: ['Finish the race', 'Improve obstacle completion', 'Build grip & strength', 'Top 10% finish'],
  cycling: ['Complete the event', 'Improve avg speed', 'Build endurance', 'Lose weight while cycling'],
  bodybuilding: ['Lean bulk', 'Cut for competition', 'Body recomposition', 'Improve symmetry'],
  crossfit: ['Finish RX', 'Improve benchmark WODs', 'Build strength', 'Compete at local level'],
  triathlon: ['Finish my first triathlon', 'Improve overall time', 'Build swim/bike/run base'],
  combat: ['Improve cardio', 'Build fight-specific fitness', 'Lose weight for category', 'Build strength'],
  team: ['Improve sport performance', 'Build stamina', 'Lose weight', 'Build strength'],
  calisthenics: ['Learn muscle up', 'Build static holds', 'Improve handstand', 'Full planche goal'],
  general: ['Lose weight', 'Build muscle', 'Improve fitness', 'Stay active & healthy'],
  custom: ['Custom goal'],
}

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise', multiplier: 1.2 },
  { id: 'light', label: 'Lightly Active', desc: '1-3 days/week', multiplier: 1.375 },
  { id: 'moderate', label: 'Moderately Active', desc: '3-5 days/week', multiplier: 1.55 },
  { id: 'very', label: 'Very Active', desc: '6-7 days/week', multiplier: 1.725 },
]

const TRAINING_DAYS = ['1 day', '2 days', '3 days', '4 days', '5 days', '6 days']

function calculateGoals(data) {
  const { age, gender, weight, height, activityLevel, sport, primaryGoal } = data
  const activity = ACTIVITY_LEVELS.find(a => a.id === activityLevel)
  const multiplier = activity ? activity.multiplier : 1.55
  let bmr
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161
  }
  const tdee = Math.round(bmr * multiplier)

  // Adjust calories based on goal
  let calorieAdjust = 0
  if (primaryGoal?.toLowerCase().includes('lose') || primaryGoal?.toLowerCase().includes('cut')) {
    calorieAdjust = -400
  } else if (primaryGoal?.toLowerCase().includes('bulk') || primaryGoal?.toLowerCase().includes('muscle')) {
    calorieAdjust = 300
  }

  const calories = tdee + calorieAdjust

  // Protein based on sport
  let proteinMultiplier = 1.8
  if (['bodybuilding', 'crossfit', 'hyrox'].includes(sport)) proteinMultiplier = 2.2
  if (['marathon', 'cycling', 'triathlon'].includes(sport)) proteinMultiplier = 1.6
  if (['combat'].includes(sport)) proteinMultiplier = 2.0

  const protein = Math.round(weight * proteinMultiplier)
  const fat = Math.round((calories * 0.25) / 9)
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4)

  return {
    calories,
    protein,
    carbs: Math.max(carbs, 100),
    fat,
    water: Math.round(weight * 0.035 * 10) / 10,
  }
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const [form, setForm] = useState({
    sport: '',
    eventName: '',
    primaryGoal: '',
    hasEvent: 'yes',
    eventDate: '',
    name: '',
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    goalWeight: '',
    activityLevel: 'moderate',
    trainingDaysPerWeek: '4 days',
    experienceLevel: 'intermediate',
  })

  function update(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function canNext() {
    if (step === 1) return form.sport !== ''
    if (step === 2) return form.primaryGoal !== '' && (form.hasEvent === 'no' || form.eventDate !== '')
    if (step === 3) return form.name.trim().length > 0
    if (step === 4) return form.age && form.height && form.weight
    return true
  }

  async function handleComplete() {
    const goals = calculateGoals({
      age: Number(form.age),
      gender: form.gender,
      weight: Number(form.weight),
      height: Number(form.height),
      activityLevel: form.activityLevel,
      sport: form.sport,
      primaryGoal: form.primaryGoal,
    })

    const profile = {
      name: form.name,
      age: Number(form.age),
      gender: form.gender,
      height: Number(form.height),
      weight: Number(form.weight),
      goal_weight: Number(form.goalWeight) || null,
      activity_level: form.activityLevel,
      experience_level: form.experienceLevel,
      race_date: form.hasEvent === 'yes' && form.eventDate ? form.eventDate : null,
      has_race: form.hasEvent === 'yes',
      step_goal: 10000,
      goals,
      sport: form.sport,
      event_name: form.eventName,
      primary_goal: form.primaryGoal,
      training_days_per_week: form.trainingDaysPerWeek,
    }
    onComplete(profile)
  }

  const selectedSport = SPORTS.find(s => s.id === form.sport)
  const events = form.sport ? INDIAN_EVENTS[form.sport] || [] : []
  const goalOptions = form.sport ? GOALS_BY_SPORT[form.sport] || [] : []

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-[#1a1a1a] h-1">
        <div className="bg-[#00E5A0] h-1 transition-all duration-500"
          style={{ width: `${(step / totalSteps) * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
        <p className="text-[#666] text-xs mt-6 mb-2">Step {step} of {totalSteps}</p>

        {/* Step 1 — Sport selection */}
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-1">What are you training for? 🎯</h1>
            <p className="text-[#666] text-sm mb-6">We'll personalise everything based on your sport.</p>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto">
              {SPORTS.map(sport => (
                <button key={sport.id} onClick={() => update('sport', sport.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all
                    ${form.sport === sport.id
                      ? 'bg-[#0d2d1f] border-[#00E5A0]'
                      : 'bg-[#1a1a1a] border-[#2a2a2a]'}`}>
                  <span className="text-2xl">{sport.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${form.sport === sport.id ? 'text-[#00E5A0]' : 'text-white'}`}>
                      {sport.name}
                    </p>
                    <p className="text-[#666] text-xs">{sport.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Event & Goal */}
        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{selectedSport?.icon}</span>
              <h1 className="text-3xl font-bold text-white">{selectedSport?.name}</h1>
            </div>
            <p className="text-[#666] text-sm mb-6">Tell us about your goal and event.</p>

            <div className="space-y-4 overflow-y-auto">
              {/* Primary goal */}
              <div>
                <label className="text-[#666] text-sm mb-2 block">What's your primary goal?</label>
                <div className="space-y-2">
                  {goalOptions.map(goal => (
                    <button key={goal} onClick={() => update('primaryGoal', goal)}
                      className={`w-full text-left px-4 py-3 rounded-2xl border text-sm transition-all
                        ${form.primaryGoal === goal
                          ? 'bg-[#0d2d1f] border-[#00E5A0] text-[#00E5A0]'
                          : 'bg-[#1a1a1a] border-[#2a2a2a] text-white'}`}>
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Has event */}
              <div>
                <label className="text-[#666] text-sm mb-2 block">Do you have an event coming up?</label>
                <div className="grid grid-cols-2 gap-2">
                  {['yes', 'no'].map(opt => (
                    <button key={opt} onClick={() => update('hasEvent', opt)}
                      className={`py-3 rounded-2xl text-sm font-medium capitalize transition-all
                        ${form.hasEvent === opt ? 'bg-[#00E5A0] text-black' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#666]'}`}>
                      {opt === 'yes' ? '🏆 Yes!' : '🎯 Not yet'}
                    </button>
                  ))}
                </div>
              </div>

              {form.hasEvent === 'yes' && (
                <>
                  <div>
                    <label className="text-[#666] text-sm mb-2 block">Select your event</label>
                    <select value={form.eventName} onChange={e => update('eventName', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none focus:border-[#00E5A0] text-sm">
                      <option value="">Choose event...</option>
                      {events.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[#666] text-sm mb-2 block">Event date</label>
                    <input type="date" value={form.eventDate}
                      onChange={e => update('eventDate', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none focus:border-[#00E5A0] text-sm" />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Name & Gender */}
        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-2">About you 👋</h1>
            <p className="text-[#666] mb-6 text-sm">Let's personalise your experience.</p>
            <div className="space-y-4">
              <div>
                <label className="text-[#666] text-sm mb-2 block">Your name</label>
                <input placeholder="e.g. Sahil"
                  value={form.name} onChange={e => update('name', e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-lg rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0]" />
              </div>
              <div>
                <label className="text-[#666] text-sm mb-2 block">Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  {['male', 'female'].map(g => (
                    <button key={g} onClick={() => update('gender', g)}
                      className={`py-3 rounded-2xl text-sm font-medium capitalize transition-all
                        ${form.gender === g ? 'bg-[#00E5A0] text-black' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#666]'}`}>
                      {g === 'male' ? '♂ Male' : '♀ Female'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[#666] text-sm mb-2 block">Experience level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                    <button key={level} onClick={() => update('experienceLevel', level.toLowerCase())}
                      className={`py-2 rounded-2xl text-xs font-medium transition-all
                        ${form.experienceLevel === level.toLowerCase() ? 'bg-[#00E5A0] text-black' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#666]'}`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Body Stats */}
        {step === 4 && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-2">Body Stats 📊</h1>
            <p className="text-[#666] mb-6 text-sm">Used to calculate your personalised nutrition goals.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#666] text-xs mb-1 block">Age</label>
                  <input type="number" placeholder="25" value={form.age}
                    onChange={e => update('age', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0]" />
                </div>
                <div>
                  <label className="text-[#666] text-xs mb-1 block">Height (cm)</label>
                  <input type="number" placeholder="175" value={form.height}
                    onChange={e => update('height', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#666] text-xs mb-1 block">Current weight (kg)</label>
                  <input type="number" placeholder="75" value={form.weight}
                    onChange={e => update('weight', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0]" />
                </div>
                <div>
                  <label className="text-[#666] text-xs mb-1 block">Goal weight (kg)</label>
                  <input type="number" placeholder="70" value={form.goalWeight}
                    onChange={e => update('goalWeight', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0]" />
                </div>
              </div>
              <div>
                <label className="text-[#666] text-xs mb-2 block">Activity level</label>
                <div className="space-y-2">
                  {ACTIVITY_LEVELS.map(level => (
                    <button key={level.id} onClick={() => update('activityLevel', level.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all
                        ${form.activityLevel === level.id
                          ? 'bg-[#0d2d1f] border-[#00E5A0]'
                          : 'bg-[#1a1a1a] border-[#2a2a2a]'}`}>
                      <div className="text-left">
                        <p className={`text-sm font-medium ${form.activityLevel === level.id ? 'text-[#00E5A0]' : 'text-white'}`}>
                          {level.label}
                        </p>
                        <p className="text-xs text-[#666]">{level.desc}</p>
                      </div>
                      {form.activityLevel === level.id && (
                        <div className="w-5 h-5 rounded-full bg-[#00E5A0] flex items-center justify-center">
                          <span className="text-black text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — Training days + Summary */}
        {step === 5 && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-2">Almost there! 🚀</h1>
            <p className="text-[#666] mb-5 text-sm">How many days a week can you train?</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {TRAINING_DAYS.map(d => (
                <button key={d} onClick={() => update('trainingDaysPerWeek', d)}
                  className={`py-3 rounded-2xl text-sm font-medium transition-all
                    ${form.trainingDaysPerWeek === d ? 'bg-[#00E5A0] text-black' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#666]'}`}>
                  {d}
                </button>
              ))}
            </div>

            {/* Goals summary card */}
            <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
              <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider mb-3">
                Your personalised plan
              </p>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#2a2a2a]">
                <span className="text-xl">{selectedSport?.icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{selectedSport?.name}</p>
                  <p className="text-[#666] text-xs">{form.primaryGoal}</p>
                </div>
              </div>
              {(() => {
                const goals = calculateGoals({
                  age: Number(form.age), gender: form.gender,
                  weight: Number(form.weight), height: Number(form.height),
                  activityLevel: form.activityLevel, sport: form.sport,
                  primaryGoal: form.primaryGoal,
                })
                return (
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
                )
              })()}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6 mb-4">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-2xl border border-[#2a2a2a] text-[#666] text-sm font-medium">
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button onClick={() => canNext() && setStep(s => s + 1)}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all
                ${canNext() ? 'bg-[#00E5A0] text-black' : 'bg-[#1a1a1a] text-[#444] cursor-not-allowed'}`}>
              Continue →
            </button>
          ) : (
            <button onClick={handleComplete}
              className="flex-1 py-3 rounded-2xl bg-[#00E5A0] text-black text-sm font-medium">
              Let's go! 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  )
}