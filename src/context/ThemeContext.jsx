import { createContext, useContext, useState, useEffect } from 'react'

const THEMES = {
  light: {
    bg: '#FFFFFF', bg2: '#F5F5F5', card: '#FFFFFF', card2: '#F0F0F0',
    border: '#E5E5E5', text: '#0A0A0A', muted: '#888888', subtle: '#BBBBBB',
  },
  dark: {
    bg: '#080808', bg2: '#0d0d0d', card: '#0a0a0a', card2: '#111111',
    border: '#1a1a1a', text: '#FFFFFF', muted: '#666666', subtle: '#333333',
  },
}

const BRAND = {
  orange: '#FF5A1F', orange2: '#FF8C42',
  green: '#22C55E', blue: '#3B82F6',
  purple: '#A855F7', red: '#EF4444',
}

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('pace4_theme') !== 'light' } catch { return true }
  })

  const theme = isDark ? THEMES.dark : THEMES.light

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('pace4_theme', next ? 'dark' : 'light')
  }

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