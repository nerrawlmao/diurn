import { useEffect, useState } from 'react'

export type ThemeId =
  | 'system'
  | 'ocean'
  | 'sage'
  | 'plum'
  | 'rose'
  | 'amber'
  | 'ink'
  | 'white'
  | 'black'
export type ModeId = 'light' | 'dark'
export type FontId =
  | 'system'
  | 'serif'
  | 'book'
  | 'sans'
  | 'rounded'
  | 'slab'
  | 'hand'
  | 'mono'
export type FontSizeId = 'small' | 'medium' | 'large'

export interface Settings {
  theme: ThemeId
  mode: ModeId
  font: FontId
  fontSize: FontSizeId
}

export const THEME_OPTIONS: Array<{ id: ThemeId; label: string; swatch: string }> = [
  { id: 'system', label: 'System', swatch: '#b3873a' },
  { id: 'ocean', label: 'Ocean', swatch: '#3e6b8c' },
  { id: 'sage', label: 'Sage', swatch: '#5c6c5b' },
  { id: 'plum', label: 'Plum', swatch: '#7a5c8c' },
  { id: 'rose', label: 'Rose', swatch: '#a35d66' },
  { id: 'amber', label: 'Amber', swatch: '#b0722a' },
  { id: 'ink', label: 'Ink', swatch: '#3b3b40' },
  { id: 'white', label: 'White', swatch: '#ffffff' },
  { id: 'black', label: 'Black', swatch: '#000000' },
]

export const MODE_OPTIONS: Array<{ id: ModeId; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

export const FONT_OPTIONS: Array<{ id: FontId; label: string; preview: string }> = [
  { id: 'system', label: 'System', preview: "'Newsreader', Georgia, serif" },
  { id: 'slab', label: 'Slab', preview: "'Roboto Slab', Georgia, serif" },
  { id: 'serif', label: 'Serif', preview: "'Newsreader', Georgia, serif" },
  { id: 'book', label: 'Book', preview: "'Lora', Georgia, serif" },
  { id: 'sans', label: 'Sans', preview: "'Inter', system-ui, sans-serif" },
  { id: 'rounded', label: 'Rounded', preview: "'Nunito', system-ui, sans-serif" },
  { id: 'hand', label: 'Handwritten', preview: "'Caveat', cursive" },
  { id: 'mono', label: 'Mono', preview: 'ui-monospace, Consolas, monospace' },
]

export const SIZE_OPTIONS: Array<{ id: FontSizeId; label: string }> = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
]

const DEFAULTS: Settings = {
  theme: 'system',
  mode: 'light',
  font: 'system',
  fontSize: 'medium',
}
const STORAGE_KEY = 'diurn-settings'

function isOneOf<T extends string>(value: unknown, options: Array<{ id: T }>): value is T {
  return options.some((option) => option.id === value)
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULTS
    const candidate = parsed as Record<string, unknown>
    return {
      theme: isOneOf(candidate.theme, THEME_OPTIONS) ? candidate.theme : DEFAULTS.theme,
      mode: isOneOf(candidate.mode, MODE_OPTIONS) ? candidate.mode : DEFAULTS.mode,
      font: isOneOf(candidate.font, FONT_OPTIONS) ? candidate.font : DEFAULTS.font,
      fontSize: isOneOf(candidate.fontSize, SIZE_OPTIONS) ? candidate.fontSize : DEFAULTS.fontSize,
    }
  } catch {
    return DEFAULTS
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', settings.theme)
    root.setAttribute('data-mode', settings.mode)
    root.setAttribute('data-font', settings.font)
    root.setAttribute('data-fontsize', settings.fontSize)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Private browsing or full storage — settings just won't persist.
    }
  }, [settings])

  function updateSettings(patch: Partial<Settings>) {
    setSettings((current) => ({ ...current, ...patch }))
  }

  return { settings, updateSettings }
}
