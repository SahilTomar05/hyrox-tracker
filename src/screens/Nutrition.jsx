import { useState, useEffect } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Flame, Droplets, Check } from 'lucide-react'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

const GOALS = {
  calories: 2800,
  protein: 180,
  carbs: 300,
  fat: 80,
  water: 3.5,
}

function today() {
  return new Date().toDateString()
}

function loadTodayData() {
  const saved = localStorage.getItem('nutrition_' + today())
  return saved ? JSON.parse(saved) : {
    meals: [],
    water: 0,
  }
}

function MacroRing({ value, goal, color, label }) {
  const pct = Math.min(value / goal, 1)
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#2a2a2a" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 36 36)" />
        <text x="36" y="36" textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize="12" fontWeight="500">{value}</text>
        <text x="36" y="49" textAnchor="middle" dominantBaseline="middle"
          fill="#666" fontSize="9">/{goal}g</text>
      </svg>
      <span className="text-[#666] text-xs">{label}</span>
    </div>
  )
}

export default function Nutrition() {
  const [data, setData] = useState(loadTodayData)
  const [activeTab, setActiveTab] = useState('Breakfast')
  const [showForm, setShowForm] = useState(false)
  const [expandMacros, setExpandMacros] = useState(false)
  const [form, setForm] = useState({
    name: '', calories: '', protein: '', carbs: '', fat: ''
  })

  useEffect(() => {
    localStorage.setItem('nutrition_' + today(), JSON.stringify(data))
    // sync to todayLog for dashboard
    const totalCals = data.meals.reduce((s, m) => s + Number(m.calories || 0), 0)
    const totalProtein = data.meals.reduce((s, m) => s + Number(m.protein || 0), 0)
    const existing = localStorage.getItem('todayLog')
    const log = existing ? JSON.parse(existing) : {}
    localStorage.setItem('todayLog', JSON.stringify({
      ...log,
      calories: totalCals,
      protein: totalProtein,
      water: data.water,
      calorieGoal: GOALS.calories,
      proteinGoal: GOALS.protein,
      waterGoal: GOALS.water,
    }))
  }, [data])

  const tabMeals = data.meals.filter(m => m.type === activeTab)
  const totalCals = data.meals.reduce((s, m) => s + Number(m.calories || 0), 0)
  const totalProtein = data.meals.reduce((s, m) => s + Number(m.protein || 0), 0)
  const totalCarbs = data.meals.reduce((s, m) => s + Number(m.carbs || 0), 0)
  const totalFat = data.meals.reduce((s, m) => s + Number(m.fat || 0), 0)
  const calPct = Math.min(Math.round((totalCals / GOALS.calories) * 100), 100)

  function addMeal() {
    if (!form.name || !form.calories) return
    const meal = { id: Date.now(), type: activeTab, ...form }
    setData(d => ({ ...d, meals: [...d.meals, meal] }))
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '' })
    setShowForm(false)
    setExpandMacros(false)
  }

  function deleteMeal(id) {
    setData(d => ({ ...d, meals: d.meals.filter(m => m.id !== id) }))
  }

  function addWater(amount) {
    setData(d => ({ ...d, water: Math.max(0, Math.round((d.water + amount) * 10) / 10) }))
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-white">Nutrition</h1>
        <p className="text-[#666] text-sm">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>
      </div>

      {/* Calorie summary */}
      <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-[#FF6B35]" />
            <span className="text-white font-medium">{totalCals}</span>
            <span className="text-[#666] text-sm">/ {GOALS.calories} kcal</span>
          </div>
          <span className="text-[#666] text-sm">{calPct}%</span>
        </div>
        <div className="w-full bg-[#2a2a2a] rounded-full h-2">
          <div className="bg-[#FF6B35] h-2 rounded-full transition-all"
            style={{ width: `${calPct}%` }} />
        </div>
        <p className="text-[#666] text-xs mt-2">{GOALS.calories - totalCals > 0 ? `${GOALS.calories - totalCals} kcal remaining` : 'Goal reached!'}</p>
      </div>

      {/* Macro rings */}
      <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
        <div className="flex justify-around">
          <MacroRing value={totalProtein} goal={GOALS.protein} color="#A78BFA" label="Protein" />
          <MacroRing value={totalCarbs} goal={GOALS.carbs} color="#3B9EFF" label="Carbs" />
          <MacroRing value={totalFat} goal={GOALS.fat} color="#FF6B35" label="Fat" />
        </div>
      </div>

      {/* Water tracker */}
      <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-[#3B9EFF]" />
            <span className="text-white font-medium">{data.water}L</span>
            <span className="text-[#666] text-sm">/ {GOALS.water}L</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => addWater(-0.25)}
              className="w-8 h-8 rounded-full bg-[#2a2a2a] text-white flex items-center justify-center text-lg font-bold">−</button>
            <button onClick={() => addWater(0.25)}
              className="w-8 h-8 rounded-full bg-[#3B9EFF] text-white flex items-center justify-center text-lg font-bold">+</button>
          </div>
        </div>
        <div className="w-full bg-[#2a2a2a] rounded-full h-1.5 mt-3">
          <div className="bg-[#3B9EFF] h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min((data.water / GOALS.water) * 100, 100)}%` }} />
        </div>
        <p className="text-[#666] text-xs mt-1">Each tap = 250ml</p>
      </div>

      {/* Meal tabs */}
      <div className="grid grid-cols-4 gap-1">
        {MEAL_TYPES.map(t => {
          const count = data.meals.filter(m => m.type === t).length
          return (
            <button key={t} onClick={() => { setActiveTab(t); setShowForm(false) }}
              className={`py-2 rounded-xl text-xs font-medium transition-all relative
                ${activeTab === t ? 'bg-[#00E5A0] text-black' : 'bg-[#1a1a1a] text-[#666]'}`}>
              {t}
              {count > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center
                  ${activeTab === t ? 'bg-black text-[#00E5A0]' : 'bg-[#00E5A0] text-black'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Meal list */}
      <div className="space-y-2">
        {tabMeals.length === 0 && !showForm && (
          <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a] text-center">
            <p className="text-[#666] text-sm">No {activeTab.toLowerCase()} logged yet</p>
          </div>
        )}

        {tabMeals.map(meal => (
          <div key={meal.id} className="bg-[#1a1a1a] rounded-2xl px-4 py-3 border border-[#2a2a2a] flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">{meal.name}</p>
              <div className="flex gap-3 mt-0.5">
                <span className="text-[#FF6B35] text-xs">{meal.calories} kcal</span>
                {meal.protein && <span className="text-[#A78BFA] text-xs">{meal.protein}g P</span>}
                {meal.carbs && <span className="text-[#3B9EFF] text-xs">{meal.carbs}g C</span>}
                {meal.fat && <span className="text-[#FF6B35] text-xs">{meal.fat}g F</span>}
              </div>
            </div>
            <button onClick={() => deleteMeal(meal.id)}>
              <X size={14} className="text-[#444]" />
            </button>
          </div>
        ))}
      </div>

      {/* Add meal form */}
      {showForm && (
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-white font-medium">Add to {activeTab}</p>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-[#666]" /></button>
          </div>

          <input placeholder="Meal name (e.g. Chicken rice bowl)"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none placeholder-[#444]" />

          <input placeholder="Calories (required)" type="number"
            value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
            className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none placeholder-[#444]" />

          {/* Optional macros toggle */}
          <button onClick={() => setExpandMacros(e => !e)}
            className="flex items-center gap-1 text-[#666] text-xs">
            {expandMacros ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expandMacros ? 'Hide' : 'Add'} macros (optional)
          </button>

          {expandMacros && (
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Protein g" type="number"
                value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))}
                className="bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444]" />
              <input placeholder="Carbs g" type="number"
                value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))}
                className="bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444]" />
              <input placeholder="Fat g" type="number"
                value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))}
                className="bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444]" />
            </div>
          )}

          <button onClick={addMeal}
            className="w-full bg-[#00E5A0] text-black font-medium py-3 rounded-xl flex items-center justify-center gap-2">
            <Check size={16} /> Save Meal
          </button>
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full border border-dashed border-[#3a3a3a] text-[#666] py-3 rounded-2xl flex items-center justify-center gap-2 text-sm">
          <Plus size={16} /> Add {activeTab}
        </button>
      )}

    </div>
  )
}