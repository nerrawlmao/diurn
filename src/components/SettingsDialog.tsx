import { useEffect } from 'react'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import {
  THEME_OPTIONS,
  MODE_OPTIONS,
  FONT_OPTIONS,
  SIZE_OPTIONS,
  type Settings,
} from '../hooks/useSettings'

interface SettingsDialogProps {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onClose: () => void
}

export function SettingsDialog({ settings, onChange, onClose }: SettingsDialogProps) {
  useLockBodyScroll()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="settings-title" className="dialog-title">
          Settings
        </h3>

        <div className="settings-group">
          <p className="field-label">Appearance</p>
          <div className="option-row">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="option-button"
                aria-pressed={settings.mode === option.id}
                onClick={() => onChange({ mode: option.id })}
              >
                {option.label}
              </button>
            ))}
          </div>
          {(settings.theme === 'white' || settings.theme === 'black') && (
            <p className="settings-note">
              The White and Black themes always keep their own look.
            </p>
          )}
        </div>

        <div className="settings-group">
          <p className="field-label">Color theme</p>
          <div className="option-row">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="option-button"
                aria-pressed={settings.theme === option.id}
                onClick={() => onChange({ theme: option.id })}
              >
                <span
                  className="theme-swatch"
                  style={{ background: option.swatch }}
                  aria-hidden="true"
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <p className="field-label">Font style</p>
          <div className="option-row">
            {FONT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="option-button"
                aria-pressed={settings.font === option.id}
                onClick={() => onChange({ font: option.id })}
              >
                <span
                  className="font-preview"
                  style={{ fontFamily: option.preview }}
                  aria-hidden="true"
                >
                  Aa
                </span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <p className="field-label">Font size</p>
          <div className="option-row">
            {SIZE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="option-button"
                aria-pressed={settings.fontSize === option.id}
                onClick={() => onChange({ fontSize: option.id })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dialog-actions">
          <button type="button" className="button-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
