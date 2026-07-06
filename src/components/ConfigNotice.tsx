export function ConfigNotice() {
  return (
    <main className="auth-screen">
      <div className="auth-card">
        <h1 className="wordmark">Diurn</h1>
        <p className="auth-tagline">Almost there — connect your Supabase project.</p>
        <ol className="config-steps">
          <li>
            Create a project at <strong>supabase.com</strong>.
          </li>
          <li>
            Run <code>supabase/schema.sql</code> in the SQL Editor.
          </li>
          <li>
            Copy <code>.env.example</code> to <code>.env.local</code> and fill in
            your project URL and anon key.
          </li>
          <li>Restart the dev server.</li>
        </ol>
      </div>
    </main>
  )
}
