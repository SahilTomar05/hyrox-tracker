// Push notification system

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export function sendNotification(title, body, icon = '/icon-192.png') {
  if (Notification.permission !== 'granted') return
  new Notification(title, { body, icon, badge: '/icon-192.png' })
}

export function scheduleNotifications(settings) {
  // Clear existing
  const existing = JSON.parse(localStorage.getItem('notificationIntervals') || '[]')
  existing.forEach(id => clearInterval(id))
  localStorage.setItem('notificationIntervals', '[]')

  const intervals = []

  // Check every minute if it's time for a notification
  const checkInterval = setInterval(() => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

    // Meal reminders
    if (settings.mealReminders) {
      if (timeStr === '09:00') {
        sendNotification('🍳 Breakfast time!', "Log your breakfast. Your macros won't track themselves.", '/icon-192.png')
      }
      if (timeStr === '13:00') {
        sendNotification('🥗 Lunch check!', "Have you eaten lunch? Log it before you forget.", '/icon-192.png')
      }
      if (timeStr === '19:00') {
        sendNotification('🍽️ Dinner time!', "Dinner o'clock. Keep it clean — you've come this far.", '/icon-192.png')
      }
    }

    // Water reminders every 2 hours
    if (settings.waterReminders) {
      if (minutes === 0 && [8, 10, 12, 14, 16, 18, 20].includes(hours)) {
        sendNotification('💧 Drink water!', "You're probably dehydrated. Drink 250ml right now.", '/icon-192.png')
      }
    }

    // Workout reminder
    if (settings.workoutReminder && settings.workoutTime && timeStr === settings.workoutTime) {
      sendNotification('💪 Workout time!', "No excuses. The gym is waiting. Go.", '/icon-192.png')
    }

    // Steps reminder at 7pm
    if (settings.stepsReminder && timeStr === '19:00') {
      const steps = Number(localStorage.getItem('steps_' + new Date().toDateString()) || 0)
      const goal = settings.stepGoal || 10000
      if (steps < goal) {
        const remaining = goal - steps
        sendNotification('👟 Step it up!', `${remaining.toLocaleString()} steps to go. Get moving before midnight.`, '/icon-192.png')
      }
    }
  }, 60000)

  intervals.push(checkInterval)
  localStorage.setItem('notificationIntervals', JSON.stringify(intervals))
}

export function saveNotificationSettings(settings) {
  localStorage.setItem('notificationSettings', JSON.stringify(settings))
}

export function loadNotificationSettings() {
  const saved = localStorage.getItem('notificationSettings')
  return saved ? JSON.parse(saved) : {
    mealReminders: false,
    waterReminders: false,
    workoutReminder: false,
    workoutTime: '07:00',
    stepsReminder: false,
    stepGoal: 10000,
  }
}