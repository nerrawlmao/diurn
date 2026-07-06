import { useEffect, useRef } from 'react'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useLockBodyScroll()

  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel, busy])

  return (
    <div
      className="dialog-backdrop"
      onClick={() => {
        if (!busy) onCancel()
      }}
    >
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="dialog-title" className="dialog-title">
          {title}
        </h3>
        <p id="dialog-message" className="dialog-message">
          {message}
        </p>
        <div className="dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="button-ghost"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Sealing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
