import { createContext, useContext, useState, useEffect } from 'react'
import { THEMES, BRAND } from '../config/theme'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('pace4_theme') === 'dark' } catch { return false }
  })

  const theme = isDark ? THEMES.dark : THEMES.light

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('pace4_theme', next ? 'dark' : 'light')
  }

  // Apply to body
  useEffect(() => {
    document.body.style.background = theme.bg
    document.body.style.color = theme.text
  }, [isDark])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme, brand: BRAND }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}