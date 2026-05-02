import { useState } from 'react'

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise', multiplier: 1.2 },
  { id: 'light', label: 'Lightly Active', desc: '1-3 days/week', multiplier: 1.375 },
  { id: 'moderate', label: 'Moderately Active', desc: '3-5 days/week', multiplier: 1.55 },
  { id: 'very', label: 'Very Active', desc: '6-7 days/week', multiplier: 1.725 },
]

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'Less than 1 year training' },
  { id: 'intermediate', label: 'Intermediate', desc: '1-3 years training' },
  { id: 'advanced', label: 'Advanced', desc: '3+ years training' },
]

function calculateGoals(data) {
  const { age, gender, weight, height, activityLevel } = data
  const activity = ACTIVITY_LEVELS.find(a => a.id === activityLevel)
  const multiplier = activity ? activity.multiplier : 1.55

  // Mifflin-St Jeor BMR
  let bmr
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161
  }

  const tdee = Math.round(bmr * multiplier)
  const protein = Math.round(weight * 2.2) // 2.2g per kg for athletes
  const fat = Math.round((tdee * 0.25) / 9)
  const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4)

  return {
    calories: tdee,
    protein,
    carbs: Math.max(carbs, 100),
    fat,
    water: Math.round(weight * 0.035 * 10) / 10,
  }
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    goalWeight: '',
    activityLevel: 'moderate',
    experienceLevel: 'intermediate',
    raceDate: '2026-07-24',
    hasRace: 'yes',
  })

  const totalSteps = 4

  function update(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleComplete() {
    const goals = calculateGoals({
      age: Number(form.age),
      gender: form.gender,
      weight: Number(form.weight),
      height: Number(form.height),
      activityLevel: form.activityLevel,
    })

    const profile = {
      ...form,
      weight: Number(form.weight),
      goalWeight: Number(form.goalWeight),
      height: Number(form.height),
      age: Number(form.age),
      goals,
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem('userProfile', JSON.stringify(profile))
    localStorage.setItem('todayLog', JSON.stringify({
      calories: 0,
      calorieGoal: goals.calories,
      protein: 0,
      proteinGoal: goals.protein,
      water: 0,
      waterGoal: goals.water,
      weight: Number(form.weight),
    }))

    // save initial weight log
    const weightLogs = [{ date: new Date().toISOString(), weight: Number(form.weight) }]
    localStorage.setItem('weightLogs', JSON.stringify(weightLogs))

    onComplete(profile)
  }

  const canNext = () => {
    if (step === 1) return form.name.trim().length > 0
    if (step === 2) return form.age && form.height && form.weight && form.goalWeight
    if (step === 3) return form.activityLevel && form.experienceLevel
    return true
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-[#1a1a1a] h-1">
        <div className="bg-[#00E5A0] h-1 transition-all duration-500"
          style={{ width: `${(step / totalSteps) * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
        {/* Step indicator */}
        <p className="text-[#666] text-xs mt-6 mb-2">Step {step} of {totalSteps}</p>

        {/* Step 1 — Name & Gender */}
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome! 👋</h1>
            <p className="text-[#666] mb-8">Let's set up your personal training tracker.</p>

            <div className="space-y-4">
              <div>
                <label className="text-[#666] text-sm mb-2 block">Your name</label>
                <input
                  placeholder="e.g. Sahil"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-lg rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0]"
                />
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
            </div>
          </div>
        )}

        {/* Step 2 — Body Stats */}
        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-2">Body Stats 📊</h1>
            <p className="text-[#666] mb-8">Used to calculate your personalised calorie & macro goals.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#666] text-sm mb-2 block">Age</label>
                  <input type="number" placeholder="25" value={form.age}
                    onChange={e => update('age', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0]" />
                </div>
                <div>
                  <label className="text-[#666] text-sm mb-2 block">Height (cm)</label>
                  <input type="number" placeholder="175" value={form.height}
                    onChange={e => update('height', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#666] text-sm mb-2 block">Current weight (kg)</label>
                  <input type="number" placeholder="75" value={form.weight}
                    onChange={e => update('weight', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0]" />
                </div>
                <div>
                  <label className="text-[#666] text-sm mb-2 block">Goal weight (kg)</label>
                  <input type="number" placeholder="70" value={form.goalWeight}
                    onChange={e => update('goalWeight', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none placeholder-[#444] focus:border-[#00E5A0]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Activity & Experience */}
        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-2">Your Training 💪</h1>
            <p className="text-[#666] mb-6">Helps us set the right intensity for you.</p>

            <div className="space-y-5">
              <div>
                <label className="text-[#666] text-sm mb-3 block">Activity level</label>
                <div className="space-y-2">
                  {ACTIVITY_LEVELS.map(level => (
                    <button key={level.id} onClick={() => update('activityLevel', level.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all
                        ${form.activityLevel === level.id
                          ? 'bg-[#0d2d1f] border-[#00E5A0] text-white'
                          : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#666]'}`}>
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

              <div>
                <label className="text-[#666] text-sm mb-3 block">Experience level</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE_LEVELS.map(level => (
                    <button key={level.id} onClick={() => update('experienceLevel', level.id)}
                      className={`py-3 px-2 rounded-2xl text-xs font-medium transition-all
                        ${form.experienceLevel === level.id
                          ? 'bg-[#00E5A0] text-black'
                          : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#666]'}`}>
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Race Date */}
        {step === 4 && (
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-2">Race Day 🏁</h1>
            <p className="text-[#666] mb-8">Do you have a Hyrox race coming up?</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {['yes', 'no'].map(opt => (
                  <button key={opt} onClick={() => update('hasRace', opt)}
                    className={`py-3 rounded-2xl text-sm font-medium capitalize transition-all
                      ${form.hasRace === opt ? 'bg-[#00E5A0] text-black' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#666]'}`}>
                    {opt === 'yes' ? '🏆 Yes!' : '🎯 Not yet'}
                  </button>
                ))}
              </div>

              {form.hasRace === 'yes' && (
                <div>
                  <label className="text-[#666] text-sm mb-2 block">Race date</label>
                  <input type="date" value={form.raceDate}
                    onChange={e => update('raceDate', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-2xl px-4 py-3 outline-none focus:border-[#00E5A0]" />
                </div>
              )}

              {/* Summary card */}
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] mt-4">
                <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider mb-3">Your personalised goals</p>
                {(() => {
                  const goals = calculateGoals({
                    age: Number(form.age),
                    gender: form.gender,
                    weight: Number(form.weight),
                    height: Number(form.height),
                    activityLevel: form.activityLevel,
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
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8 mb-4">
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