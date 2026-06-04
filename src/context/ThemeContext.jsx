import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('pace4_theme') !== 'light' } catch { return true }
  })

  useEffect(() => {
    if (isDark) document.documentElement.classList.remove('light')
    else document.documentElement.classList.add('light')
  }, [isDark])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('pace4_theme', next ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }