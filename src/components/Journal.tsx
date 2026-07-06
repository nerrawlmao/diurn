import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useEntries } from '../hooks/useEntries'
import { todayKey, fromDateKey } from '../lib/dates'
import type { Settings } from '../hooks/useSettings'
import { Calendar } from './Calendar'
import { EntryForm } from './EntryForm'
import { EntryView } from './EntryView'
import { SettingsDialog } from './SettingsDialog'

interface JournalProps {
  user: User
  settings: Settings
  onSettingsChange: (patch: Partial<Settings>) => void
}

export function Journal({ user, settings, onSettingsChange }: JournalProps) {
  const { entries, loading, error, addEntry } = useEntries(user.id)

  const [selectedKey, setSelectedKey] = useState<string | null>(todayKey())
  const initial = fromDateKey(todayKey())
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())
  const [settingsOpen, setSettingsOpen] = useState(false)

  const selectedEntry = selectedKey ? entries.get(selectedKey) : undefined

  function handleNavigate(year: number, month: number) {
    setViewYear(year)
    setViewMonth(month)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="wordmark wordmark-small">Diurn</h1>
        <div className="app-header-right">
          <span className="user-email">{user.email}</span>
          <button
            type="button"
            className="link-button"
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
          <button
            type="button"
            className="link-button"
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="journal">
        <Calendar
          year={viewYear}
          month={viewMonth}
          selectedKey={selectedKey}
          entryDates={new Set(entries.keys())}
          fiveStarDates={
            new Set(
              [...entries.values()]
                .filter((entry) => entry.rating === 5)
                .map((entry) => entry.entry_date),
            )
          }
          onSelect={setSelectedKey}
          onNavigate={handleNavigate}
        />

        <section className="day-panel" aria-live="polite">
          {loading ? (
            <div className="panel-placeholder">
              <p>Opening your diary…</p>
            </div>
          ) : error ? (
            <div className="panel-placeholder">
              <p className="form-error">{error}</p>
            </div>
          ) : !selectedKey ? (
            <div className="panel-placeholder">
              <p>Select a day to read or write.</p>
            </div>
          ) : selectedEntry ? (
            <EntryView entry={selectedEntry} />
          ) : (
            <EntryForm
              userId={user.id}
              entryDate={selectedKey}
              onCreated={(entry) => addEntry(entry)}
            />
          )}
        </section>
      </main>

      {settingsOpen && (
        <SettingsDialog
          settings={settings}
          onChange={onSettingsChange}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
