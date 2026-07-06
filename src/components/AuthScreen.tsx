import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Step = 'email' | 'code' | 'link'
type Status = 'idle' | 'sending' | 'verifying' | 'error'

/**
 * A strong random password for passwordless sign-up. signUp requires one,
 * but the user never sees or uses it — they always sign in with a code.
 * A single UUID (~122 bits) plus one of each character class, kept well
 * under Supabase's 72-character (bcrypt) limit.
 */
function randomPassword(): string {
  return crypto.randomUUID() + 'Xy9!'
}

/** Supabase sometimes returns an empty ("{}") or blank error; show fallback. */
function friendlyError(message: string | undefined, fallback: string): string {
  const trimmed = message?.trim()
  if (!trimmed || trimmed === '{}') return fallback
  return trimmed
}

/**
 * Email-based auth. An existing account gets a 6-digit code to sign in;
 * a new email is treated as sign-up and gets a confirmation link to open.
 */
export function AuthCard() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setStatus('sending')
    setErrorMessage('')

    // Existing accounts only: sends a 6-digit sign-in code, errors if none.
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: false },
    })

    if (!error) {
      setStatus('idle')
      setStep('code')
      return
    }

    // No account yet → sign up, which sends the "Confirm signup" email.
    // Passwordless: a random password is set that the user never uses
    // (they always sign in later with a code).
    const { error: signUpError } = await supabase.auth.signUp({
      email: trimmed,
      password: randomPassword(),
      options: { emailRedirectTo: window.location.origin },
    })

    if (signUpError) {
      setStatus('error')
      setErrorMessage(
        friendlyError(
          signUpError.message,
          "We couldn't send your confirmation email. Please try again in a moment.",
        ),
      )
    } else {
      setStatus('idle')
      setStep('link')
    }
  }

  async function handleCodeSubmit(event: FormEvent) {
    event.preventDefault()
    const token = code.trim()
    // Supabase's OTP length is configurable (6–8+); accept whatever fits.
    if (token.length < 6) return

    setStatus('verifying')
    setErrorMessage('')

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: 'email',
    })

    if (error) {
      setStatus('error')
      setErrorMessage(
        friendlyError(error.message, 'That code is not valid. Please try again.'),
      )
    }
    // On success the auth listener swaps the whole app to the diary.
  }

  function backToEmail() {
    setStep('email')
    setCode('')
    setStatus('idle')
    setErrorMessage('')
  }

  return (
    <div className="auth-card">
      <h1 className="wordmark">Diurn</h1>
      {step === 'email' && (
        <p className="auth-tagline">Continue with your email.</p>
      )}

      {step === 'link' ? (
        <div className="auth-form auth-link-sent" role="status">
          <p className="auth-code-lead">
            Almost there — we sent a confirmation link to{' '}
            <strong>{email.trim()}</strong>. Open it on this device to confirm
            your sign-up and start your diary.
          </p>
          <button type="button" className="link-button" onClick={backToEmail}>
            Use a different email
          </button>
        </div>
      ) : step === 'code' ? (
        <form className="auth-form" onSubmit={handleCodeSubmit}>
          <p className="auth-code-lead">
            Enter the code we sent to <strong>{email.trim()}</strong>.
          </p>
          <div className="auth-field">
            <label className="field-label" htmlFor="auth-code">
              Verification code
            </label>
            <input
              id="auth-code"
              className="text-input auth-code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, '').slice(0, 8))
              }
              disabled={status === 'verifying'}
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="button-primary"
            disabled={status === 'verifying' || code.length < 6}
          >
            {status === 'verifying' ? 'Verifying…' : 'Continue'}
          </button>
          {status === 'error' && (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          )}
          <button type="button" className="link-button" onClick={backToEmail}>
            Use a different email
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleEmailSubmit}>
          <div className="auth-field">
            <label className="field-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              className="text-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'sending'}
            />
          </div>
          <button
            type="submit"
            className="button-primary"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Sending…' : 'Continue'}
          </button>
          {status === 'error' && (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          )}
          <p className="auth-agree-note">
            By continuing, you agree to our{' '}
            <a href="/terms.html" target="_blank" rel="noopener noreferrer">
              Terms of Use
            </a>{' '}
            and{' '}
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            .
          </p>
        </form>
      )}
    </div>
  )
}
