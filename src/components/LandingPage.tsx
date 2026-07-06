import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AuthCard } from './AuthScreen'
import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from './icons'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
// July 2026 starts on a Wednesday (3 empty leading cells), 31 days.
const PREVIEW_LEADING_BLANKS = 3
const PREVIEW_DAYS = 31

const SAMPLE_TEXT =
  'Today I doomscrolled, played games, and did nothing I actually planned to do. I feel disappointed in myself. I really need to change.'

// A static month used purely for the preview illustration.
// "Today" is the 21st: it's the day being written, and days after it
// haven't happened yet (grayed out, like the real calendar).
const PREVIEW_TODAY = 21
const PREVIEW_SELECTED_DAY = 21
const PREVIEW_STAR_DAYS = new Set([4, 12, 18])
const PREVIEW_DOT_DAYS = new Set([
  1, 2, 3, 5, 7, 8, 9, 10, 11, 14, 15, 17, 19, 20,
])

/** Types `text` one character at a time after `startDelay` ms. */
function useTypewriter(text: string, startDelay: number, speed: number) {
  const [started, setStarted] = useState(false)
  const [length, setLength] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), startDelay)
    return () => clearTimeout(timer)
  }, [startDelay])

  useEffect(() => {
    if (!started || length >= text.length) return
    const timer = setTimeout(() => setLength((l) => l + 1), speed)
    return () => clearTimeout(timer)
  }, [started, length, text.length, speed])

  return { typed: text.slice(0, length), done: length >= text.length }
}

/** Fades content up into view the first time it scrolls into the viewport. */
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('is-revealed')
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  )
}

export function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false)
  const { typed, done } = useTypewriter(SAMPLE_TEXT, 1100, 32)

  return (
    <div className="landing">
      <header className="lp-header">
        <span className="lp-wordmark">Diurn</span>
        <button
          type="button"
          className="lp-login"
          onClick={() => setAuthOpen(true)}
        >
          Log in
        </button>
      </header>

      <main>
        {/* 1 · Hero */}
        <section className="lp-hero lp-container">
          <h1 className="lp-title">
            Your online <em>diary.</em>
          </h1>
          <p className="lp-sub">
            Pick a date, write what happened, add photos, rate your day, and
            seal it forever.
          </p>
          <button
            type="button"
            className="lp-button"
            onClick={() => setAuthOpen(true)}
          >
            Start writing
          </button>

          <div className="lp-preview" aria-hidden="true">
            <div className="lp-preview-float">
              <div className="lp-window">
                <div className="lp-app-header">
                  <span className="lp-app-wordmark">Diurn</span>
                  <div className="lp-app-links">
                    <span>Settings</span>
                    <span>Sign out</span>
                  </div>
                </div>
                <div className="lp-window-body">
                  <div className="lp-cal">
                    <div className="lp-cal-header">
                      <span className="lp-cal-title">
                        July 2026 <ChevronDownIcon size={11} />
                      </span>
                      <div className="lp-cal-nav">
                        <span className="lp-cal-navbtn">
                          <ArrowLeftIcon size={13} />
                        </span>
                        <span className="lp-cal-navbtn">
                          <ArrowRightIcon size={13} />
                        </span>
                      </div>
                    </div>
                    <div className="lp-cal-grid">
                      {WEEKDAYS.map((d) => (
                        <span key={d} className="lp-weekday">
                          {d}
                        </span>
                      ))}
                      {Array.from({ length: PREVIEW_LEADING_BLANKS }, (_, i) => (
                        <span key={`b${i}`} />
                      ))}
                      {Array.from({ length: PREVIEW_DAYS }, (_, i) => i + 1).map(
                        (day) => {
                          const isFuture = day > PREVIEW_TODAY
                          const classes = [
                            'lp-day',
                            day === PREVIEW_SELECTED_DAY ? 'is-selected' : '',
                            isFuture ? 'is-future' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')
                          return (
                            <span
                              key={day}
                              className={classes}
                              style={{ animationDelay: `${0.4 + day * 0.02}s` }}
                            >
                              {day}
                              {PREVIEW_DOT_DAYS.has(day) && (
                                <i className="lp-mark lp-mark-dot" />
                              )}
                              {PREVIEW_STAR_DAYS.has(day) && (
                                <i className="lp-mark lp-mark-star">★</i>
                              )}
                            </span>
                          )
                        },
                      )}
                    </div>
                  </div>
                  <div className="lp-entry">
                    <p className="lp-entry-date">Tuesday, July 21, 2026</p>

                    <div className="lp-toolbar">
                      <span className="lp-fmt-btn"><b>B</b></span>
                      <span className="lp-fmt-btn"><i>I</i></span>
                      <span className="lp-fmt-btn"><u>U</u></span>
                      <span className="lp-fmt-btn"><s>S</s></span>
                      <span className="lp-fmt-trigger">
                        Normal <ChevronDownIcon size={9} />
                      </span>
                      <span className="lp-fmt-trigger">
                        <span className="lp-fmt-color">A</span>
                        <ChevronDownIcon size={9} />
                      </span>
                    </div>

                    <p className="lp-entry-text">
                      {typed}
                      <span className="lp-caret" aria-hidden="true" />
                    </p>

                    <div className={`lp-entry-after${done ? ' is-visible' : ''}`}>
                      <span className="lp-attach">+ Attach photos</span>
                      <div className="lp-form-footer">
                        <div className="lp-rating">
                          <span className="lp-rating-label">How was your day?</span>
                          <span className="lp-rating-stars">
                            ★★★★<span className="lp-star-empty">☆</span>
                          </span>
                        </div>
                        <span className="lp-seal-btn">Seal this entry</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2 · Emotional */}
        <section className="lp-emotion">
          <Reveal>
            <span className="lp-emotion-spark" aria-hidden="true">✦</span>
            <p className="lp-emotion-quote">
              One day, you&rsquo;ll look back and see how far you&rsquo;ve come.
            </p>
            <p className="lp-emotion-line">
              A simple way to remember what you lived, felt, and learned.
            </p>
          </Reveal>
        </section>

        {/* 3 · Privacy note */}
        <section className="lp-privacy lp-container">
          <Reveal>
            <h2 className="lp-privacy-title">Private by default.</h2>
            <p className="lp-privacy-text">
              Your entries are saved for your account only. We don&rsquo;t read,
              analyze, or share your diary entries.
            </p>
          </Reveal>
        </section>
      </main>

      <footer className="lp-footer">
        <a
          className="lp-footer-github"
          href="https://github.com/nerrawlmao/diurn"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View Diurn on GitHub"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.05.78 2.12 0 1.53-.01 2.77-.01 3.15 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"
            />
          </svg>
        </a>
        <p className="lp-footer-copy">© 2026 Diurn</p>
      </footer>

      {authOpen && <LoginModal onClose={() => setAuthOpen(false)} />}
    </div>
  )
}

function LoginModal({ onClose }: { onClose: () => void }) {
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
        className="login-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to Diurn"
        onClick={(e) => e.stopPropagation()}
      >
        <AuthCard />
      </div>
    </div>
  )
}
