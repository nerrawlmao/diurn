import { useState } from 'react'
import { toDateKey, todayKey, fromDateKey, formatMonthTitle } from '../lib/dates'
import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from './icons'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface CalendarProps {
  year: number
  month: number // 0-based
  selectedKey: string | null
  entryDates: ReadonlySet<string>
  fiveStarDates: ReadonlySet<string>
  onSelect: (key: string) => void
  onNavigate: (year: number, month: number) => void
}

export function Calendar({
  year,
  month,
  selectedKey,
  entryDates,
  fiveStarDates,
  onSelect,
  onNavigate,
}: CalendarProps) {
  const today = todayKey()
  const [pickerOpen, setPickerOpen] = useState(false)
  // null while not editing; otherwise the raw text in the year field.
  const [yearDraft, setYearDraft] = useState<string | null>(null)

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Array<{ key: string; day: number } | null> = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ key: toDateKey(new Date(year, month, day)), day })
  }

  function goPrev() {
    onNavigate(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1)
  }
  function goNext() {
    onNavigate(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1)
  }

  function commitYearDraft() {
    if (yearDraft !== null) {
      const parsed = Number(yearDraft)
      if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 9999) {
        onNavigate(parsed, month)
      }
    }
    setYearDraft(null)
  }

  function pickMonth(nextMonth: number) {
    onNavigate(year, nextMonth)
    setPickerOpen(false)
  }

  function goToToday() {
    const now = fromDateKey(today)
    onNavigate(now.getFullYear(), now.getMonth())
    onSelect(today)
    setPickerOpen(false)
  }

  const todayDate = fromDateKey(today)

  return (
    <section className="calendar" aria-label="Calendar">
      <header className="calendar-header">
        <h2 className="calendar-title">
          <button
            type="button"
            className="calendar-title-button"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((open) => !open)}
          >
            {formatMonthTitle(year, month)}
            <span className="title-chevron" aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </button>
        </h2>
        {/* Kept in the layout (just invisible) while the picker is open,
            so the header doesn't change height and the title stays put. */}
        <div
          className="calendar-nav"
          style={pickerOpen ? { visibility: 'hidden' } : undefined}
        >
          <button
            type="button"
            className="nav-button"
            onClick={goPrev}
            aria-label="Previous month"
            tabIndex={pickerOpen ? -1 : 0}
          >
            <ArrowLeftIcon />
          </button>
          <button
            type="button"
            className="nav-button"
            onClick={goNext}
            aria-label="Next month"
            tabIndex={pickerOpen ? -1 : 0}
          >
            <ArrowRightIcon />
          </button>
        </div>
      </header>

      {pickerOpen ? (
        <div className="calendar-picker">
          <div className="picker-year-row">
            <button
              type="button"
              className="nav-button"
              onClick={() => onNavigate(year - 1, month)}
              aria-label="Previous year"
            >
              <ArrowLeftIcon />
            </button>
            <input
              className="picker-year-input"
              type="text"
              inputMode="numeric"
              aria-label="Year"
              value={yearDraft ?? String(year)}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setYearDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onBlur={commitYearDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') setYearDraft(null)
              }}
            />
            <button
              type="button"
              className="nav-button"
              onClick={() => onNavigate(year + 1, month)}
              aria-label="Next year"
            >
              <ArrowRightIcon />
            </button>
          </div>

          <div className="picker-month-grid">
            {MONTH_LABELS.map((label, m) => {
              const isThisMonth =
                year === todayDate.getFullYear() && m === todayDate.getMonth()
              const classes = [
                'picker-month',
                m === month ? 'is-current' : '',
                isThisMonth ? 'is-this-month' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <button
                  key={label}
                  type="button"
                  className={classes}
                  onClick={() => pickMonth(m)}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <button type="button" className="link-button picker-today" onClick={goToToday}>
            Go to today
          </button>
        </div>
      ) : (
        <div className="calendar-grid" role="grid">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="calendar-weekday" aria-hidden="true">
              {label}
            </div>
          ))}

          {cells.map((cell, index) => {
            if (!cell) {
              return <div key={`blank-${index}`} className="calendar-blank" />
            }

            const isFuture = cell.key > today
            const hasEntry = entryDates.has(cell.key)
            const classes = [
              'calendar-day',
              cell.key === today ? 'is-today' : '',
              cell.key === selectedKey ? 'is-selected' : '',
              hasEntry ? 'has-entry' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={cell.key}
                type="button"
                className={classes}
                disabled={isFuture}
                onClick={() => onSelect(cell.key)}
                aria-pressed={cell.key === selectedKey}
                aria-label={
                  cell.key + (hasEntry ? ', has an entry' : isFuture ? ', in the future' : '')
                }
              >
                <span className="calendar-day-number">{cell.day}</span>
                {hasEntry &&
                  (fiveStarDates.has(cell.key) ? (
                    <span className="entry-star" aria-hidden="true">
                      &#9733;
                    </span>
                  ) : (
                    <span className="entry-dot" aria-hidden="true" />
                  ))}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
