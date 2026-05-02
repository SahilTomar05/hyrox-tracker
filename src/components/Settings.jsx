import { useState } from 'react'
import { Save, LogOut } from 'lucide-react'

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', multiplier: 1.2 },
  { id: 'light', label: 'Lightly Active', multiplier: 1.375 },
  { id: 'moderate', label: 'Moderately Active', multiplier: 1.55 },
  { id: 'very', label: 'Very Active', multiplier: 1.725 },
]

function calculateGoals(data) {
  const { age, gender, weight, height, activityLevel } = data
  const activity = ACTIVITY_LEVELS.find(a => a.id === activityLevel)
  const multiplier = activity ? activity.multiplier : 1.55
  let bmr
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161
  }
  const tdee = Math.round(bmr * multiplier)
  const protein = Math.round(weight * 2.2)
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

export default function Settings({ profile, onUpdate, onReset }) {
  const [form, setForm] = useState({ ...profile })
  const [saved, setSaved] = useState(false)

  function update(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleSave() {
    const goals = calculateGoals({
      age: Number(form.age),
      gender: form.gender,
      weight: Number(form.weight),
      height: Number(form.height),
      activityLevel: form.activityLevel,
    })
    const updated = { ...form, goals, weight: Number(form.weight), height: Number(form.height), age: Number(form.age) }
    localStorage.setItem('userProfile', JSON.stringify(updated))
    onUpdate(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    if (confirm('This will clear all your data and restart the setup. Are you sure?')) {
      localStorage.clear()
      onReset()
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#666] text-sm">Update your profile & goals</p>
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] space-y-4">
        <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider">Personal Info</p>

        <div>
          <label className="text-[#666] text-xs mb-1 block">Name</label>
          <input value={form.name} onChange={e => update('name', e.target.value)}
            className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[#666] text-xs mb-1 block">Age</label>
            <input type="number" value={form.age} onChange={e => update('age', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
          </div>
          <div>
            <label className="text-[#666] text-xs mb-1 block">Height (cm)</label>
            <input type="number" value={form.height} onChange={e => update('height', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[#666] text-xs mb-1 block">Current weight (kg)</label>
            <input type="number" value={form.weight} onChange={e => update('weight', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
          </div>
          <div>
            <label className="text-[#666] text-xs mb-1 block">Goal weight (kg)</label>
            <input type="number" value={form.goalWeight} onChange={e => update('goalWeight', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
          </div>
        </div>

        <div>
          <label className="text-[#666] text-xs mb-2 block">Activity level</label>
          <div className="grid grid-cols-2 gap-2">
            {ACTIVITY_LEVELS.map(level => (
              <button key={level.id} onClick={() => update('activityLevel', level.id)}
                className={`py-2 rounded-xl text-xs font-medium transition-all
                  ${form.activityLevel === level.id ? 'bg-[#00E5A0] text-black' : 'bg-[#2a2a2a] text-[#666]'}`}>
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[#666] text-xs mb-1 block">Race date</label>
          <input type="date" value={form.raceDate} onChange={e => update('raceDate', e.target.value)}
            className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none" />
        </div>
      </div>

      {/* Calculated goals preview */}
      <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
        <p className="text-[#00E5A0] text-xs font-medium uppercase tracking-wider mb-3">Calculated goals</p>
        {(() => {
          const goals = calculateGoals({
            age: Number(form.age), gender: form.gender,
            weight: Number(form.weight), height: Number(form.height),
            activityLevel: form.activityLevel,
          })
          return (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#0f0f0f] rounded-xl p-2">
                <p className="text-[#FF6B35] text-sm font-bold">{goals.calories}</p>
                <p className="text-[#666] text-xs">kcal</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-xl p-2">
                <p className="text-[#A78BFA] text-sm font-bold">{goals.protein}g</p>
                <p className="text-[#666] text-xs">protein</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-xl p-2">
                <p className="text-[#3B9EFF] text-sm font-bold">{goals.carbs}g</p>
                <p className="text-[#666] text-xs">carbs</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-xl p-2">
                <p className="text-white text-sm font-bold">{goals.water}L</p>
                <p className="text-[#666] text-xs">water</p>
              </div>
            </div>
          )
        })()}
      </div>

      <button onClick={handleSave}
        className={`w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all
          ${saved ? 'bg-[#0d2d1f] text-[#00E5A0] border border-[#00E5A0]' : 'bg-[#00E5A0] text-black'}`}>
        <Save size={16} />
        {saved ? 'Saved!' : 'Save changes'}
      </button>

      <button onClick={handleReset}
        className="w-full py-3 rounded-2xl border border-red-900 text-red-500 text-sm flex items-center justify-center gap-2">
        <LogOut size={16} />
        Reset & start over
      </button>
    </div>
  )
}