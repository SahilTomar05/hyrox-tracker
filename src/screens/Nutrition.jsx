import { useState, useEffect, useRef } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Flame, Droplets, Check, Search } from 'lucide-react'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

const GOALS = {
  calories: 2800,
  protein: 180,
  carbs: 300,
  fat: 80,
  water: 3.5,
}

// Indian food database — per 100g unless noted
const FOOD_DB = [
  // Grains & Rice
  { name: 'Cooked White Rice', cal: 130, p: 2.7, c: 28, f: 0.3, unit: '100g' },
  { name: 'Cooked Brown Rice', cal: 123, p: 2.6, c: 26, f: 1, unit: '100g' },
  { name: 'Roti (Wheat Chapati)', cal: 104, p: 3.1, c: 18, f: 2.5, unit: '1 roti (40g)' },
  { name: 'Paratha (Plain)', cal: 260, p: 5, c: 36, f: 10, unit: '1 paratha (80g)' },
  { name: 'Aloo Paratha', cal: 300, p: 6, c: 42, f: 12, unit: '1 paratha (100g)' },
  { name: 'Naan', cal: 310, p: 9, c: 55, f: 6, unit: '1 naan (100g)' },
  { name: 'Puri', cal: 150, p: 2.5, c: 18, f: 7, unit: '1 puri (35g)' },
  { name: 'Idli', cal: 39, p: 1.8, c: 8, f: 0.2, unit: '1 idli (30g)' },
  { name: 'Dosa (Plain)', cal: 168, p: 3.9, c: 28, f: 4.5, unit: '1 dosa (70g)' },
  { name: 'Masala Dosa', cal: 215, p: 4.5, c: 32, f: 8, unit: '1 dosa (100g)' },
  { name: 'Upma', cal: 170, p: 4, c: 28, f: 5, unit: '1 bowl (150g)' },
  { name: 'Poha', cal: 180, p: 3, c: 35, f: 4, unit: '1 bowl (150g)' },
  { name: 'Bread (White)', cal: 265, p: 9, c: 49, f: 3.2, unit: '1 slice (30g)' },
  { name: 'Bread (Brown)', cal: 243, p: 10, c: 44, f: 3.5, unit: '1 slice (30g)' },

  // Lentils & Dal
  { name: 'Dal Tadka', cal: 115, p: 6.5, c: 16, f: 3, unit: '1 bowl (200g)' },
  { name: 'Dal Makhani', cal: 180, p: 8, c: 20, f: 7, unit: '1 bowl (200g)' },
  { name: 'Chana Dal', cal: 164, p: 9, c: 27, f: 2.5, unit: '1 bowl (150g)' },
  { name: 'Rajma', cal: 140, p: 8.7, c: 22, f: 1.5, unit: '1 bowl (200g)' },
  { name: 'Chole (Chickpea Curry)', cal: 180, p: 9, c: 25, f: 5, unit: '1 bowl (200g)' },
  { name: 'Moong Dal', cal: 104, p: 7, c: 18, f: 0.4, unit: '1 bowl (150g)' },
  { name: 'Sambar', cal: 90, p: 4, c: 14, f: 2, unit: '1 bowl (200g)' },

  // Vegetables
  { name: 'Aloo Sabzi', cal: 150, p: 2.5, c: 22, f: 5, unit: '1 bowl (150g)' },
  { name: 'Palak Paneer', cal: 220, p: 10, c: 8, f: 16, unit: '1 bowl (200g)' },
  { name: 'Paneer Butter Masala', cal: 280, p: 12, c: 10, f: 22, unit: '1 bowl (200g)' },
  { name: 'Matar Paneer', cal: 240, p: 11, c: 14, f: 16, unit: '1 bowl (200g)' },
  { name: 'Bhindi Sabzi', cal: 90, p: 2, c: 10, f: 4, unit: '1 bowl (150g)' },
  { name: 'Baingan Bharta', cal: 100, p: 2.5, c: 10, f: 5, unit: '1 bowl (150g)' },
  { name: 'Aloo Gobi', cal: 130, p: 3, c: 18, f: 5, unit: '1 bowl (150g)' },
  { name: 'Mixed Veg Curry', cal: 120, p: 3, c: 15, f: 5, unit: '1 bowl (150g)' },
  { name: 'Paneer (Raw)', cal: 265, p: 18, c: 4, f: 20, unit: '100g' },

  // Non-Veg
  { name: 'Chicken Breast (Grilled)', cal: 165, p: 31, c: 0, f: 3.6, unit: '100g' },
  { name: 'Chicken Curry', cal: 200, p: 18, c: 5, f: 12, unit: '1 bowl (200g)' },
  { name: 'Butter Chicken', cal: 250, p: 20, c: 8, f: 16, unit: '1 bowl (200g)' },
  { name: 'Chicken Biryani', cal: 290, p: 15, c: 38, f: 8, unit: '1 plate (300g)' },
  { name: 'Egg (Boiled)', cal: 78, p: 6, c: 0.6, f: 5, unit: '1 egg (50g)' },
  { name: 'Egg (Scrambled)', cal: 148, p: 10, c: 1.6, f: 11, unit: '2 eggs' },
  { name: 'Egg Bhurji', cal: 180, p: 12, c: 3, f: 13, unit: '2 eggs' },
  { name: 'Omelette (2 eggs)', cal: 190, p: 13, c: 2, f: 14, unit: '2 eggs' },
  { name: 'Fish Curry', cal: 180, p: 20, c: 5, f: 8, unit: '1 bowl (200g)' },
  { name: 'Mutton Curry', cal: 260, p: 22, c: 4, f: 17, unit: '1 bowl (200g)' },
  { name: 'Keema', cal: 230, p: 20, c: 5, f: 14, unit: '1 bowl (150g)' },

  // Snacks & Street Food
  { name: 'Samosa', cal: 150, p: 3, c: 18, f: 7, unit: '1 samosa (60g)' },
  { name: 'Pakora (Veg)', cal: 120, p: 3, c: 14, f: 6, unit: '4 pieces (80g)' },
  { name: 'Pav Bhaji', cal: 380, p: 9, c: 55, f: 14, unit: '1 plate' },
  { name: 'Vada Pav', cal: 290, p: 6, c: 42, f: 10, unit: '1 piece' },
  { name: 'Bhel Puri', cal: 180, p: 4, c: 30, f: 5, unit: '1 plate (150g)' },
  { name: 'Dhokla', cal: 160, p: 5, c: 28, f: 3, unit: '4 pieces (100g)' },

  // Dairy
  { name: 'Whole Milk', cal: 61, p: 3.2, c: 4.8, f: 3.3, unit: '100ml' },
  { name: 'Curd / Dahi', cal: 60, p: 3.5, c: 4.7, f: 3.3, unit: '100g' },
  { name: 'Lassi (Sweet)', cal: 150, p: 4, c: 24, f: 4, unit: '1 glass (200ml)' },
  { name: 'Chaas / Buttermilk', cal: 40, p: 2, c: 4.8, f: 1, unit: '1 glass (200ml)' },
  { name: 'Ghee', cal: 112, p: 0, c: 0, f: 12.7, unit: '1 tbsp (14g)' },
  { name: 'Paneer Tikka', cal: 260, p: 16, c: 6, f: 18, unit: '6 pieces (150g)' },

  // Protein & Health Foods
  { name: 'Whey Protein Shake', cal: 130, p: 25, c: 5, f: 2, unit: '1 scoop (35g)' },
  { name: 'Boiled Chickpeas', cal: 164, p: 8.9, c: 27, f: 2.6, unit: '100g' },
  { name: 'Boiled Lentils', cal: 116, p: 9, c: 20, f: 0.4, unit: '100g' },
  { name: 'Oats (Cooked)', cal: 71, p: 2.5, c: 12, f: 1.5, unit: '100g' },
  { name: 'Banana', cal: 89, p: 1.1, c: 23, f: 0.3, unit: '1 medium (100g)' },
  { name: 'Apple', cal: 52, p: 0.3, c: 14, f: 0.2, unit: '1 medium (150g)' },
  { name: 'Mango', cal: 60, p: 0.8, c: 15, f: 0.4, unit: '100g' },
  { name: 'Peanut Butter', cal: 188, p: 8, c: 6, f: 16, unit: '2 tbsp (32g)' },
  { name: 'Almonds', cal: 164, p: 6, c: 6, f: 14, unit: '28g (handful)' },
  { name: 'Sweet Potato (Boiled)', cal: 86, p: 1.6, c: 20, f: 0.1, unit: '100g' },

  // Drinks
  { name: 'Chai (with milk & sugar)', cal: 60, p: 1.5, c: 9, f: 2, unit: '1 cup (150ml)' },
  { name: 'Black Coffee', cal: 2, p: 0.3, c: 0, f: 0, unit: '1 cup' },
  { name: 'Fresh Lime Water', cal: 20, p: 0, c: 5, f: 0, unit: '1 glass' },
  { name: 'Coconut Water', cal: 46, p: 1.7, c: 9, f: 0.5, unit: '1 glass (240ml)' },
  { name: 'Orange Juice', cal: 112, p: 1.7, c: 26, f: 0.5, unit: '1 glass (240ml)' },
]

function today() {
  return new Date().toDateString()
}

function loadTodayData() {
  const saved = localStorage.getItem('nutrition_' + today())
  return saved ? JSON.parse(saved) : { meals: [], water: 0 }
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
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedFood, setSelectedFood] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [manualMode, setManualMode] = useState(false)
  const [manualForm, setManualForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const searchRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('nutrition_' + today(), JSON.stringify(data))
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

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    const q = query.toLowerCase()
    setSuggestions(FOOD_DB.filter(f => f.name.toLowerCase().includes(q)).slice(0, 6))
  }, [query])

  const tabMeals = data.meals.filter(m => m.type === activeTab)
  const totalCals = data.meals.reduce((s, m) => s + Number(m.calories || 0), 0)
  const totalProtein = data.meals.reduce((s, m) => s + Number(m.protein || 0), 0)
  const totalCarbs = data.meals.reduce((s, m) => s + Number(m.carbs || 0), 0)
  const totalFat = data.meals.reduce((s, m) => s + Number(m.fat || 0), 0)
  const calPct = Math.min(Math.round((totalCals / GOALS.calories) * 100), 100)

  function selectFood(food) {
    setSelectedFood(food)
    setQuery(food.name)
    setSuggestions([])
    setQuantity(1)
  }

  function getScaled(val) {
    return Math.round(val * quantity)
  }

  function addFoodMeal() {
    if (!selectedFood) return
    const meal = {
      id: Date.now(),
      type: activeTab,
      name: `${selectedFood.name}${quantity !== 1 ? ` ×${quantity}` : ''} (${selectedFood.unit})`,
      calories: getScaled(selectedFood.cal),
      protein: getScaled(selectedFood.p),
      carbs: getScaled(selectedFood.c),
      fat: getScaled(selectedFood.f),
    }
    setData(d => ({ ...d, meals: [...d.meals, meal] }))
    resetForm()
  }

  function addManualMeal() {
    if (!manualForm.name || !manualForm.calories) return
    setData(d => ({ ...d, meals: [...d.meals, { id: Date.now(), type: activeTab, ...manualForm }] }))
    setManualForm({ name: '', calories: '', protein: '', carbs: '', fat: '' })
    resetForm()
  }

  function deleteMeal(id) {
    setData(d => ({ ...d, meals: d.meals.filter(m => m.id !== id) }))
  }

  function addWater(amount) {
    setData(d => ({ ...d, water: Math.max(0, Math.round((d.water + amount) * 10) / 10) }))
  }

  function resetForm() {
    setShowForm(false)
    setQuery('')
    setSelectedFood(null)
    setQuantity(1)
    setManualMode(false)
    setSuggestions([])
    setManualForm({ name: '', calories: '', protein: '', carbs: '', fat: '' })
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
          <div className="bg-[#FF6B35] h-2 rounded-full transition-all" style={{ width: `${calPct}%` }} />
        </div>
        <p className="text-[#666] text-xs mt-2">
          {GOALS.calories - totalCals > 0 ? `${GOALS.calories - totalCals} kcal remaining` : 'Goal reached!'}
        </p>
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
              className="w-8 h-8 rounded-full bg-[#2a2a2a] text-white flex items-center justify-center text-lg">−</button>
            <button onClick={() => addWater(0.25)}
              className="w-8 h-8 rounded-full bg-[#3B9EFF] text-white flex items-center justify-center text-lg">+</button>
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
            <button key={t} onClick={() => { setActiveTab(t); resetForm() }}
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
                {meal.protein > 0 && <span className="text-[#A78BFA] text-xs">{meal.protein}g P</span>}
                {meal.carbs > 0 && <span className="text-[#3B9EFF] text-xs">{meal.carbs}g C</span>}
                {meal.fat > 0 && <span className="text-[#FF6B35] text-xs">{meal.fat}g F</span>}
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
            <button onClick={resetForm}><X size={18} className="text-[#666]" /></button>
          </div>

          {/* Toggle manual/search */}
          <div className="flex gap-2">
            <button onClick={() => setManualMode(false)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all
                ${!manualMode ? 'bg-[#00E5A0] text-black' : 'bg-[#2a2a2a] text-[#666]'}`}>
              Search foods
            </button>
            <button onClick={() => setManualMode(true)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all
                ${manualMode ? 'bg-[#00E5A0] text-black' : 'bg-[#2a2a2a] text-[#666]'}`}>
              Enter manually
            </button>
          </div>

          {!manualMode ? (
            <div className="space-y-3">
              {/* Search input */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-[#444]" />
                <input
                  ref={searchRef}
                  placeholder="Search Indian foods (e.g. Dal, Roti, Chicken...)"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelectedFood(null) }}
                  className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl pl-8 pr-3 py-2.5 outline-none placeholder-[#444]"
                />
              </div>

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="bg-[#2a2a2a] rounded-xl overflow-hidden border border-[#3a3a3a]">
                  {suggestions.map((food, i) => (
                    <button key={i} onClick={() => selectFood(food)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#3a3a3a] transition-colors border-b border-[#3a3a3a] last:border-0">
                      <div className="text-left">
                        <p className="text-white text-sm">{food.name}</p>
                        <p className="text-[#666] text-xs">{food.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#FF6B35] text-xs font-medium">{food.cal} kcal</p>
                        <p className="text-[#A78BFA] text-xs">{food.p}g protein</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected food preview */}
              {selectedFood && (
                <div className="bg-[#0d2d1f] rounded-xl p-3 border border-[#1a4d35] space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white text-sm font-medium">{selectedFood.name}</p>
                      <p className="text-[#666] text-xs">{selectedFood.unit}</p>
                    </div>
                    <button onClick={() => { setSelectedFood(null); setQuery('') }}>
                      <X size={14} className="text-[#666]" />
                    </button>
                  </div>

                  {/* Quantity */}
                  <div>
                    <p className="text-[#666] text-xs mb-2">Servings — {quantity}×</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setQuantity(q => Math.max(0.5, q - 0.5))}
                        className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center">−</button>
                      <div className="flex-1 bg-[#1a1a1a] rounded-xl px-3 py-2 text-center">
                        <span className="text-white text-sm font-medium">{quantity} serving{quantity !== 1 ? 's' : ''}</span>
                      </div>
                      <button onClick={() => setQuantity(q => q + 0.5)}
                        className="w-8 h-8 rounded-full bg-[#00E5A0] text-black flex items-center justify-center">+</button>
                    </div>
                  </div>

                  {/* Scaled macros */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-[#1a1a1a] rounded-lg py-2">
                      <p className="text-[#FF6B35] text-sm font-medium">{getScaled(selectedFood.cal)}</p>
                      <p className="text-[#666] text-xs">kcal</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg py-2">
                      <p className="text-[#A78BFA] text-sm font-medium">{getScaled(selectedFood.p)}g</p>
                      <p className="text-[#666] text-xs">protein</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg py-2">
                      <p className="text-[#3B9EFF] text-sm font-medium">{getScaled(selectedFood.c)}g</p>
                      <p className="text-[#666] text-xs">carbs</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg py-2">
                      <p className="text-[#FF6B35] text-sm font-medium">{getScaled(selectedFood.f)}g</p>
                      <p className="text-[#666] text-xs">fat</p>
                    </div>
                  </div>

                  <button onClick={addFoodMeal}
                    className="w-full bg-[#00E5A0] text-black font-medium py-2.5 rounded-xl flex items-center justify-center gap-2">
                    <Check size={16} /> Add to {activeTab}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Manual entry */
            <div className="space-y-2">
              <input placeholder="Meal name"
                value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none placeholder-[#444]" />
              <input placeholder="Calories (required)" type="number"
                value={manualForm.calories} onChange={e => setManualForm(f => ({ ...f, calories: e.target.value }))}
                className="w-full bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 outline-none placeholder-[#444]" />
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="Protein g" type="number"
                  value={manualForm.protein} onChange={e => setManualForm(f => ({ ...f, protein: e.target.value }))}
                  className="bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444]" />
                <input placeholder="Carbs g" type="number"
                  value={manualForm.carbs} onChange={e => setManualForm(f => ({ ...f, carbs: e.target.value }))}
                  className="bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444]" />
                <input placeholder="Fat g" type="number"
                  value={manualForm.fat} onChange={e => setManualForm(f => ({ ...f, fat: e.target.value }))}
                  className="bg-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-[#444]" />
              </div>
              <button onClick={addManualMeal}
                className="w-full bg-[#00E5A0] text-black font-medium py-3 rounded-xl flex items-center justify-center gap-2">
                <Check size={16} /> Save Meal
              </button>
            </div>
          )}
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