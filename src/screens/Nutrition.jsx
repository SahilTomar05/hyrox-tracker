import { useState, useEffect, useRef } from 'react'
import { Search, X, Plus, Heart, Droplets, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── FOOD DATABASE ────────────────────────────────────────────────────
import { FOOD_DB } from '../config/foods'

const MEAL_TABS = ['Breakfast','Lunch','Dinner','Snacks']

const MEAL_ICONS = {
  Breakfast: '🌅',
  Lunch: '☀️',
  Dinner: '🌙',
  Snacks: '🍎',
}

function todayDate() { return new Date().toISOString().split('T')[0] }
function todayKey() { return new Date().toDateString() }

function getWeekDates() {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d
  })
}

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0]
}

function Ring({ pct, size = 80, stroke = 8, color = '#FF5A1F', children }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.max((pct / 100) * circ, 0)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a1a" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

export default function Nutrition({ session, profile }) {
  const weekDates = getWeekDates()
  const today = new Date()
  const searchRef = useRef(null)

  const [selectedDay, setSelectedDay] = useState(today)
  const [activeMeal, setActiveMeal] = useState('Breakfast')
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Search
  const [query, setQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [servingPicker, setServingPicker] = useState(null) // food item

  // Favourites
  const [favourites, setFavourites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nutritionFavourites') || '[]') } catch { return [] }
  })

  // Custom foods
  const [savingCustom, setSavingCustom] = useState(false)
  const [customFood, setCustomFood] = useState({ name: '', cal: '', protein: '', carbs: '', fat: '' })
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customFoods, setCustomFoods] = useState([])

  useEffect(() => { fetchLog() }, [selectedDay])
  useEffect(() => { fetchCustomFoods() }, [])

  async function fetchLog() {
    setLoading(true)
    const { data } = await supabase.from('nutrition_logs')
      .select('*').eq('user_id', session.user.id)
      .eq('date', formatDate(selectedDay)).maybeSingle()
    setLog(data || { meals: [], water: 0 })
    setLoading(false)
  }

  async function fetchCustomFoods() {
    const { data } = await supabase
      .from('custom_foods')
      .select('*')
      .eq('user_id', session.user.id)
    if (data) setCustomFoods(data)
  }

  async function saveLog(newLog) {
    setSaving(true)
    const { data } = await supabase.from('nutrition_logs')
      .upsert({ user_id: session.user.id, date: formatDate(selectedDay), ...newLog }, { onConflict: 'user_id,date' })
      .select().maybeSingle()
    if (data) setLog(data)
    setSaving(false)
  }

  async function addFood(food, servings) {
    console.log('Adding food:', food)
    const newMeal = {
      id: Date.now(),
      name: food.name,
      mealType: activeMeal,
      servings,
      calories: Math.round(food.cal * servings),
      protein: Math.round(food.protein * servings),
      carbs: Math.round(food.carbs * servings),
      fat: Math.round(food.fat * servings),
    }
    const currentMeals = log?.meals || []
    await saveLog({ meals: [...currentMeals, newMeal], water: log?.water || 0 })
    setServingPicker(null)
    setShowSearch(false)
    setQuery('')
  }

  async function removeFood(id) {
    const newMeals = (log?.meals || []).filter(m => m.id !== id)
    await saveLog({ meals: newMeals, water: log?.water || 0 })
  }

  async function updateWater(delta) {
    const newWater = Math.max(0, Math.round(((log?.water || 0) + delta) * 10) / 10)
    await saveLog({ meals: log?.meals || [], water: newWater })
  }

  async function saveCustomFood() {
    if (!customFood.name.trim()) return
    setSavingCustom(true)
    
  const { data, error } = await supabase
  .from('custom_foods')
  .insert({
    user_id: session.user.id,
    name: customFood.name.trim(),
    cal: Number(customFood.cal) || 0,
    p: Number(customFood.protein) || 0,
    c: Number(customFood.carbs) || 0,
    f: Number(customFood.fat) || 0,
  })
  .select().maybeSingle()

    if (error) {
      console.error('Custom food error:', error)
      alert('Failed to save: ' + error.message)
      setSavingCustom(false)
      return
    }

    // Add to local list immediately
    setCustomFoods(prev => [...prev, data])
    
    // Show confirmation
    alert(`✅ "${customFood.name}" added to your food library!`)
    
    // Reset form
    setCustomFood({ name: '', cal: '', protein: '', carbs: '', fat: '' })
    setShowCustomInput(false)
    setSavingCustom(false)
    
    // Auto-add to current meal
    if (data) {
      addFood({
        name: data.name,
        cal: data.cal || 0,
        protein: data.p || 0,
        carbs: data.c || 0,
        fat: data.f || 0,
      },1)
    }
  }

  function toggleFavourite(foodName) {
    const newFavs = favourites.includes(foodName)
      ? favourites.filter(f => f !== foodName)
      : [...favourites, foodName]
    setFavourites(newFavs)
    localStorage.setItem('nutritionFavourites', JSON.stringify(newFavs))
  }

  // ── COMPUTED ──
  const goals = profile?.goals || {}
  const calorieGoal = goals.calories || 2800
  const proteinGoal = goals.protein || 180
  const carbsGoal = goals.carbs || 300
  const fatGoal = goals.fat || 80
  const waterGoal = goals.water || 3.0

  const meals = log?.meals || []
  const water = log?.water || 0

  const totals = meals.reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const calPct = Math.min((totals.calories / calorieGoal) * 100, 100)
  const waterPct = Math.min((water / waterGoal) * 100, 100)

  const mealMeals = meals.filter(m => m.mealType === activeMeal)

  // Search results
  const allFoods = [
    ...FOOD_DB,
    ...(customFoods || []).map(f => ({
  name: f.name,
  cal: f.cal || 0,
  protein: f.p || 0,
  carbs: f.c || 0,
  fat: f.f || 0,
  isCustom: true,
    }))
  ]

  const searchResults = (() => {
    if (!query.trim()) {
      // Show favourites first when no query
      const favFoods = allFoods.filter(f => favourites.includes(f.name))
      return favFoods.slice(0, 10)
    }
    const q = query.toLowerCase()
    return allFoods.filter(f => f.name.toLowerCase().includes(q)).slice(0, 15)
  })()

  const inp = {
    background: 'var(--input-bg)', border: '1px solid #252525', borderRadius: 10,
    padding: '9px 12px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ paddingTop: 52, paddingBottom: 24, background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Serving Picker Modal */}
      {servingPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setServingPicker(null)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid #222', borderRadius: 28, padding: 28, width: '100%', maxWidth: 320, textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Adding to {activeMeal}</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{servingPicker.name}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{servingPicker.cal} kcal per serving</p>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
              {[
                { label: 'P', val: servingPicker.protein, color: '#22C55E' },
                { label: 'C', val: servingPicker.carbs, color: '#3B82F6' },
                { label: 'F', val: servingPicker.fat, color: '#FF8C42' },
              ].map(({ label, val, color }) => (
                <span key={label} style={{ fontSize: 11, color, background: color + '15', padding: '3px 10px', borderRadius: 8 }}>
                  {label} {val}g
                </span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>How many servings?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              {[0.5, 1, 1.5, 2, 2.5, 3].map(n => (
                <button key={n} onClick={() => addFood(servingPicker, n)}
                  style={{ height: 52, borderRadius: 14, background: 'var(--card)', border: '1px solid #222', color: 'var(--text)', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: '.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FF5A1F'; e.currentTarget.style.borderColor = '#FF5A1F' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.borderColor = '#222' }}>
                  {n}x
                </button>
              ))}
            </div>
            <button onClick={() => setServingPicker(null)}
              style={{ fontSize: 13, color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '0 20px 14px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.5px' }}>Nutrition</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Track your fuel</p>
      </div>

      {/* Week strip */}
      <div style={{ display: 'flex', gap: 8, padding: '0 20px', marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {weekDates.map((date, i) => {
          const hasLog = false // could check nutrition_logs if needed
          const isToday = isSameDay(date, today)
          const isSel = isSameDay(date, selectedDay)
          const dn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]
          return (
            <button key={i} onClick={() => setSelectedDay(date)}
              style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 12px', borderRadius: 16, cursor: 'pointer', minWidth: 46, border: '1px solid', transition: '.2s', background: isSel ? '#FF5A1F' : isToday ? '#150800' : 'var(--bg2)', borderColor: isSel ? '#FF5A1F' : isToday ? '#FF5A1F40' : 'var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: isSel ? 'rgba(255,255,255,.6)' : '#333', marginBottom: 4 }}>{dn}</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: isSel ? '#fff' : isToday ? '#FF5A1F' : '#fff' }}>{date.getDate()}</span>
              <div style={{ width: 4, height: 4, borderRadius: '50%', marginTop: 5, background: 'transparent' }} />
            </button>
          )
        })}
      </div>

      {/* Daily summary card */}
      <div style={{ margin: '0 20px 14px', background: 'var(--card)', border: '1px solid #141414', borderRadius: 20, padding: 16 }}>

        {/* Top row: ring + macros */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
          {/* Calorie ring */}
          <Ring pct={calPct} size={90} stroke={9} color="#FF5A1F">
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{totals.calories}</span>
            <span style={{ fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>kcal</span>
          </Ring>

          {/* Macro bars */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>{totals.calories} / {calorieGoal} kcal</span>
              <span style={{ color: '#FF5A1F' }}>{Math.max(0, calorieGoal - totals.calories)} left</span>
            </div>
            {[
              { label: 'Protein', val: totals.protein, goal: proteinGoal, color: '#22C55E' },
              { label: 'Carbs', val: totals.carbs, goal: carbsGoal, color: '#3B82F6' },
              { label: 'Fats', val: totals.fat, goal: fatGoal, color: '#FF8C42' },
            ].map(({ label, val, goal, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{label}</span>
                  <span style={{ fontSize: 10, color }}>{val}/{goal}g</span>
                </div>
                <div style={{ height: 4, background: 'var(--card2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((val/goal)*100,100)}%`, background: color, borderRadius: 2, transition: '.3s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Water row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card2)', borderRadius: 14, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Droplets size={16} color="#3B82F6" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#3B82F6' }}>{water}L</p>
              <p style={{ fontSize: 10, color: 'var(--muted)' }}>/ {waterGoal}L goal</p>
            </div>
            <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${waterPct}%`, background: '#3B82F6', borderRadius: 2, transition: '.3s' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => updateWater(-0.25)}
              style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--border)', border: '1px solid #252525', color: 'var(--text)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 300 }}>−</button>
            <button onClick={() => updateWater(0.25)}
              style={{ width: 32, height: 32, borderRadius: 9, background: '#3B82F6', border: 'none', color: 'var(--text)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 300 }}>+</button>
          </div>
        </div>
      </div>

      {/* Meal tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '0 20px', marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {MEAL_TABS.map(meal => {
          const mealCals = meals.filter(m => m.mealType === meal).reduce((s, m) => s + (m.calories || 0), 0)
          const on = activeMeal === meal
          return (
            <button key={meal} onClick={() => setActiveMeal(meal)}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 14, cursor: 'pointer', border: '1px solid', transition: '.15s', background: on ? '#FF5A1F' : 'var(--bg2)', borderColor: on ? '#FF5A1F' : 'var(--border)' }}>
              <span style={{ fontSize: 14 }}>{MEAL_ICONS[meal]}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: on ? '#fff' : '#666', lineHeight: 1 }}>{meal}</p>
                {mealCals > 0 && <p style={{ fontSize: 10, color: on ? 'rgba(255,255,255,.7)' : '#444', marginTop: 1 }}>{mealCals} kcal</p>}
              </div>
            </button>
          )
        })}
      </div>

      {/* Add food section */}
      <div style={{ margin: '0 20px 12px' }}>
        {!showSearch ? (
          <button onClick={() => { setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 100) }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)', border: '1px solid #1a1a1a', borderRadius: 14, padding: '12px 16px', cursor: 'pointer' }}>
            <Search size={16} color="#444" />
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>Search food to add to {activeMeal}...</span>
            <div style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: 8, background: '#FF5A1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={14} color="#fff" strokeWidth={3} />
            </div>
          </button>
        ) : (
          <div style={{ background: 'var(--card)', border: '1px solid #1a1a1a', borderRadius: 18, overflow: 'hidden' }}>

            {/* Search header */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Search size={16} color="#444" />
              <input
                ref={searchRef}
                placeholder={`Search food for ${activeMeal}...`}
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ ...inp, flex: 1, background: 'transparent', border: 'none', padding: '0', fontSize: 15 }}
              />
              {query && (
                <button onClick={() => setQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                  <X size={14} />
                </button>
              )}
              <button onClick={() => { setShowSearch(false); setQuery(''); setShowCustomInput(false) }}
                style={{ background: 'var(--card2)', border: '1px solid #1e1e1e', borderRadius: 8, padding: '4px 10px', color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>

            {/* Favourites label or search hint */}
            {!query && (
              <div style={{ padding: '8px 14px 4px' }}>
                <p style={{ fontSize: 10, color: 'var(--subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  {favourites.length > 0 ? '⭐ Favourites' : 'Start typing to search...'}
                </p>
              </div>
            )}

            {/* Results */}
            <div style={{ maxHeight: 320, overflowY: 'auto', scrollbarWidth: 'none' }}>
              {searchResults.map(food => {
                const isFav = favourites.includes(food.name)
                return (
                  <div key={food.name}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '1px solid #0d0d0d', cursor: 'pointer' }}
                    onClick={() => setServingPicker(food)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{food.name}</p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: '#FF5A1F', fontWeight: 600 }}>{food.cal} kcal</span>
                        <span style={{ fontSize: 11, color: '#22C55E' }}>P {food.protein}g</span>
                        <span style={{ fontSize: 11, color: '#3B82F6' }}>C {food.carbs}g</span>
                        <span style={{ fontSize: 11, color: '#FF8C42' }}>F {food.fat}g</span>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggleFavourite(food.name) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                      <Heart size={15} fill={isFav ? '#EF4444' : 'none'} color={isFav ? '#EF4444' : '#333'} />
                    </button>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FF5A1F20', border: '1px solid #FF5A1F30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Plus size={13} color="#FF5A1F" strokeWidth={3} />
                    </div>
                  </div>
                )
              })}

              {/* No results */}
              {query && searchResults.length === 0 && (
                <div style={{ padding: '16px 14px' }}>
                  <p style={{ color: 'var(--subtle)', fontSize: 13, marginBottom: 10 }}>No results for "{query}"</p>
                  {!showCustomInput && (
                    <button onClick={() => { setShowCustomInput(true); setCustomFood(p => ({ ...p, name: query })) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 12, border: '1px dashed #FF5A1F40', background: 'transparent', color: '#FF5A1F', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      ⭐ Add "{query}" as custom food
                    </button>
                  )}
                </div>
              )}

              {/* Custom food form */}
              {showCustomInput && (
                <div style={{ padding: 14, background: 'var(--bg2)', borderTop: '1px solid #111' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#FF5A1F', marginBottom: 10 }}>Add custom food</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input placeholder="Food name" value={customFood.name}
                      onChange={e => setCustomFood(p => ({ ...p, name: e.target.value }))}
                      style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input type="number" placeholder="Calories" value={customFood.cal}
                        onChange={e => setCustomFood(p => ({ ...p, cal: e.target.value }))}
                        style={{ ...inp, boxSizing: 'border-box' }} />
                      <input type="number" placeholder="Protein (g)" value={customFood.protein}
                        onChange={e => setCustomFood(p => ({ ...p, protein: e.target.value }))}
                        style={{ ...inp, boxSizing: 'border-box' }} />
                      <input type="number" placeholder="Carbs (g)" value={customFood.carbs}
                        onChange={e => setCustomFood(p => ({ ...p, carbs: e.target.value }))}
                        style={{ ...inp, boxSizing: 'border-box' }} />
                      <input type="number" placeholder="Fat (g)" value={customFood.fat}
                        onChange={e => setCustomFood(p => ({ ...p, fat: e.target.value }))}
                        style={{ ...inp, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveCustomFood} disabled={!customFood.name || !customFood.cal}
                        style={{ flex: 1, background: '#FF5A1F', border: 'none', borderRadius: 10, padding: 10, color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !customFood.name || !customFood.cal ? 0.4 : 1 }}>
                        Save & Add
                      </button>
                      <button onClick={() => setShowCustomInput(false)}
                        style={{ background: 'var(--card)', border: '1px solid #1e1e1e', borderRadius: 10, padding: '0 14px', color: 'var(--muted)', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Meal log */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#FF5A1F', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : mealMeals.length === 0 ? (
        <div style={{ margin: '0 20px', background: 'var(--card)', border: '1px solid #141414', borderRadius: 18, padding: '28px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>{MEAL_ICONS[activeMeal]}</p>
          <p style={{ color: 'var(--subtle)', fontSize: 14, fontWeight: 500 }}>Nothing logged for {activeMeal}</p>
          <p style={{ color: '#222', fontSize: 12, marginTop: 4 }}>Tap the search bar above to add food</p>
        </div>
      ) : (
        <div style={{ margin: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Meal total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', marginBottom: 4 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{activeMeal}</p>
            <p style={{ fontSize: 12, color: '#FF5A1F', fontWeight: 600 }}>
              {mealMeals.reduce((s, m) => s + (m.calories || 0), 0)} kcal
            </p>
          </div>
          {mealMeals.map(meal => (
            <div key={meal.id} style={{ background: 'var(--card)', border: '1px solid #141414', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meal.name}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: '#FF5A1F', fontWeight: 600 }}>{meal.calories} kcal</span>
                  <span style={{ fontSize: 11, color: '#22C55E' }}>P {meal.protein}g</span>
                  <span style={{ fontSize: 11, color: '#3B82F6' }}>C {meal.carbs}g</span>
                  <span style={{ fontSize: 11, color: '#FF8C42' }}>F {meal.fat}g</span>
                  {meal.servings !== 1 && <span style={{ fontSize: 11, color: 'var(--muted)' }}>×{meal.servings}</span>}
                </div>
              </div>
              <button onClick={() => removeFood(meal.id)}
                style={{ width: 28, height: 28, borderRadius: 8, background: '#150000', border: '1px solid #EF444415', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <X size={12} color="#EF4444" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}