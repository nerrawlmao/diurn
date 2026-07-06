import { isSupabaseConfigured } from './lib/supabase'
import { ConfigNotice } from './components/ConfigNotice'
import { LandingPage } from './components/LandingPage'
import { Journal } from './components/Journal'
import { useAuth } from './hooks/useAuth'
import { useSettings, type Settings } from './hooks/useSettings'

export default function App() {
  const { settings, updateSettings } = useSettings()

  if (!isSupabaseConfigured) {
    return <ConfigNotice />
  }
  return <AuthedApp settings={settings} onSettingsChange={updateSettings} />
}

interface AuthedAppProps {
  settings: Settings
  onSettingsChange: (patch: Partial<Settings>) => void
}

function AuthedApp({ settings, onSettingsChange }: AuthedAppProps) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <main className="auth-screen">
        <p className="loading-text">Diurn</p>
      </main>
    )
  }

  if (!session) {
    return <LandingPage />
  }

  return (
    <Journal
      user={session.user}
      settings={settings}
      onSettingsChange={onSettingsChange}
    />
  )
}
