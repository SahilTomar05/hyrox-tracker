// Brutal & savage feedback engine 😈

export function getSarcasticFeedback(data) {
  const { sessions, nutritionLogs, steps, avgCalories, avgProtein, goals, consistencyScore, improvements } = data
  const feedbacks = []

  // Session feedback
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toDateString()
  })
  const sessionDaysThisWeek = new Set(
    sessions.filter(s => last7Days.includes(new Date(s.date).toDateString()))
      .map(s => new Date(s.date).toDateString())
  ).size

  if (sessionDaysThisWeek === 0) {
    feedbacks.push({ type: 'training', level: 'savage', msg: "Zero sessions this week. Absolutely zero. Your couch has seen more action than your gym." })
  } else if (sessionDaysThisWeek === 1) {
    feedbacks.push({ type: 'training', level: 'savage', msg: "1 session this week. You showed up once and apparently decided that was enough. Bold." })
  } else if (sessionDaysThisWeek === 2) {
    feedbacks.push({ type: 'training', level: 'honest', msg: "2 sessions this week. That's not a training plan, that's a hobby. Pick a lane." })
  } else if (sessionDaysThisWeek >= 5) {
    feedbacks.push({ type: 'training', level: 'good', msg: `${sessionDaysThisWeek} sessions this week. Now we're talking. Don't ruin it by skipping tomorrow.` })
  }

  // Calorie feedback
  if (avgCalories > 0 && goals?.calories) {
    const diff = avgCalories - goals.calories
    if (diff > 500) {
      feedbacks.push({ type: 'nutrition', level: 'savage', msg: `You're eating ${diff} kcal over your goal daily. Your gut is filing a formal complaint.` })
    } else if (diff < -600) {
      feedbacks.push({ type: 'nutrition', level: 'honest', msg: `${avgCalories} kcal average? You're not cutting, you're disappearing. Eat something.` })
    } else if (avgCalories < 100) {
      feedbacks.push({ type: 'nutrition', level: 'savage', msg: "You haven't logged a single meal today. Either you forgot or you survived on air and delusion." })
    }
  }

  // Protein feedback
  if (avgProtein > 0 && goals?.protein) {
    const proteinDiff = goals.protein - avgProtein
    if (proteinDiff > 50) {
      feedbacks.push({ type: 'nutrition', level: 'savage', msg: `${avgProtein}g protein vs ${goals.protein}g goal. Your muscles are so confused right now. Feed them.` })
    } else if (proteinDiff > 20) {
      feedbacks.push({ type: 'nutrition', level: 'honest', msg: `${proteinDiff}g short on protein today. At this rate, you'll lose the muscle you never built.` })
    }
  }

  // Steps feedback
  if (steps !== undefined && steps < 2000) {
    feedbacks.push({ type: 'steps', level: 'savage', msg: `${steps.toLocaleString()} steps. Did you walk to the bathroom and count it? Get up.` })
  } else if (steps < 5000) {
    feedbacks.push({ type: 'steps', level: 'honest', msg: `${steps.toLocaleString()} steps. A grandma with a walker is lapping you. Move.` })
  } else if (steps > 12000) {
    feedbacks.push({ type: 'steps', level: 'good', msg: `${steps.toLocaleString()} steps. One thing you're actually doing right. Don't celebrate too hard.` })
  }

  // Exercise improvement feedback
  if (improvements && improvements.length > 0) {
    const top = improvements[0]
    if (top.pct > 20) {
      feedbacks.push({ type: 'progress', level: 'good', msg: `${top.exercise} up ${top.pct}% — that's actual progress. Shocking, I know.` })
    } else if (top.pct < 0) {
      feedbacks.push({ type: 'progress', level: 'savage', msg: `Your ${top.exercise} is going backwards. That's a new skill — getting weaker. Impressive, honestly.` })
    } else if (top.pct === 0) {
      feedbacks.push({ type: 'progress', level: 'honest', msg: `Same weight, same reps, same results. Definition of insanity applies here.` })
    }
  }

  // Consistency score feedback
  if (consistencyScore < 30) {
    feedbacks.push({ type: 'overall', level: 'savage', msg: `${consistencyScore}/100 consistency. That's not a score, that's a cry for help.` })
  } else if (consistencyScore >= 80) {
    feedbacks.push({ type: 'overall', level: 'good', msg: `${consistencyScore}/100. Fine. You're doing fine. Don't let it go to your head.` })
  }

  // Return most relevant feedback
  const savage = feedbacks.filter(f => f.level === 'savage')
  const honest = feedbacks.filter(f => f.level === 'honest')
  const good = feedbacks.filter(f => f.level === 'good')

  if (savage.length > 0) return savage[Math.floor(Math.random() * savage.length)]
  if (honest.length > 0) return honest[Math.floor(Math.random() * honest.length)]
  if (good.length > 0) return good[Math.floor(Math.random() * good.length)]

  return { type: 'overall', level: 'honest', msg: "Log your workouts and meals so I can roast you properly." }
}

export function getExerciseFeedback(exerciseName, pct, dataPoints) {
  if (dataPoints < 2) return {
    msg: "Not enough data yet. Log this exercise a few more times and I'll tell you if you're actually improving or just showing up.",
    color: '#666'
  }
  if (pct > 30) return {
    msg: `🔥 ${pct}% improvement on ${exerciseName}. That's actually impressive. Keep pushing.`,
    color: '#00E5A0'
  }
  if (pct > 10) return {
    msg: `📈 ${pct}% progress on ${exerciseName}. Solid. Don't plateau now — add weight next session.`,
    color: '#3B9EFF'
  }
  if (pct > 0) return {
    msg: `${pct}% improvement. Technically progress. Technically. Push harder.`,
    color: '#A78BFA'
  }
  if (pct === 0) return {
    msg: `Zero improvement on ${exerciseName}. Same weight, same reps, same excuses. Progressive overload is a thing. Look it up.`,
    color: '#FF6B35'
  }
  return {
    msg: `You're getting WEAKER at ${exerciseName}. Down ${Math.abs(pct)}%. Either you're injured or your effort is. Which is it?`,
    color: '#FF4444'
  }
}