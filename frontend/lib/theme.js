export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
}

export const getSystemTheme = () => {
  if (typeof window === 'undefined') return THEMES.LIGHT
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT
}

export const applyTheme = (theme) => {
  const root = document.documentElement
  if (theme === THEMES.DARK) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
