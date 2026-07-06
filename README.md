# Diurn

A private online diary for writing and keeping your days.
Pick a date, write what happened, add photos, rate your day, and seal it.

Sealed entries can never be edited or deleted — by design, and enforced by the
database.

![Diurn landing page](docs/preview.png)

## Stack

- **React 19 + TypeScript + Vite**
- **Supabase** — passwordless auth, Postgres with row-level security, private image storage

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project, and wait for it
to provision.

### 2. Run the schema

Open the **SQL Editor** in your Supabase dashboard and run the contents of
[`supabase/schema.sql`](supabase/schema.sql). This creates:

- the `entries` table (one entry per user per day, immutable — there are
  intentionally **no** `UPDATE`/`DELETE` policies),
- the private `diary-images` storage bucket with per-user folder policies.

### 3. Configure auth

In **Authentication → URL Configuration**, set the **Site URL** to where the
app runs (e.g. `http://localhost:5173` during development). Sign-up confirmation
links redirect there.

Paste the templates in [`supabase/email-templates/`](supabase/email-templates)
into **Authentication → Email Templates** (Confirm signup and Magic Link). The
Magic Link template must include `{{ .Token }}` so the sign-in code is emailed.

### 4. Environment variables

```sh
cp .env.example .env.local
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
**Project Settings → API**.

### 5. Run

```sh
npm install
npm run dev
```

## How it works

- **Auth** — passwordless email. Existing accounts sign in with a one-time code
  (`signInWithOtp`); a new email is signed up via a confirmation link
  (`signUp`). No passwords are ever shown to the user.
- **Calendar-first** — the home screen is a month calendar with a month/year
  picker. Days with entries show a dot (a star for five-star days); future days
  are disabled. Clicking a day with an entry opens it read-only; clicking an
  empty day opens the writing form.
- **Writing** — a lightweight rich-text editor (bold/italic/underline/strike,
  per-selection size and color). Content is sanitized to a safe HTML subset on
  both save and render.
- **Ratings & photos** — rate the day out of five stars and attach photos
  (compressed client-side, ≤ 5 MB total), stored in a private bucket under
  `<user_id>/…` and displayed via short-lived signed URLs.
- **Drafts** — unsealed text and photos are kept only on the device
  (localStorage + IndexedDB) until the entry is sealed; nothing reaches the
  server before then.
- **Sealing** — submitting shows a confirmation dialog warning that entries are
  permanent. Immutability is enforced server-side: the `entries` table has
  row-level security with `SELECT` and `INSERT` policies only.
- **Privacy** — every query is scoped by RLS to `auth.uid()`; users can only
  ever see their own entries and images.

## Project structure

```
supabase/schema.sql          Database schema, RLS policies, storage bucket
supabase/email-templates/    Branded confirm-signup and sign-in-code emails
public/terms.html            Terms of Use
public/privacy.html          Privacy Policy
src/
  lib/supabase.ts            Supabase client + config check
  lib/entries.ts             Data access: fetch, create (with image upload), signed URLs, download
  lib/drafts.ts              On-device drafts (text, photos, rating)
  lib/images.ts              Client-side image compression + JPEG export
  lib/richtext.ts            HTML sanitizer for entry content
  lib/dates.ts               Local-time date-key helpers and formatting
  hooks/useAuth.ts           Session state
  hooks/useEntries.ts        Entry map keyed by date
  hooks/useSettings.ts       Theme / appearance / font / size preferences
  hooks/useLockBodyScroll.ts Scroll lock for modals
  components/
    LandingPage.tsx          Signed-out landing page + sign-in modal
    AuthScreen.tsx           Email code / confirm-signup card
    Journal.tsx              Main layout: calendar + day panel
    Calendar.tsx             Month grid + month/year picker
    EntryForm.tsx            Draft, rich editor, photos, rating, seal
    EntryView.tsx            Read-only sealed entry
    RichTextEditor.tsx       contentEditable rich-text editor
    ImageLightbox.tsx        Full-screen photo viewer + download
    SettingsDialog.tsx       Appearance / theme / font settings
    ConfirmDialog.tsx        Accessible modal
    ConfigNotice.tsx         Shown when env vars are missing
    icons.tsx                Inline SVG icons
```

## License

Released under the [MIT License](LICENSE). © 2026 Diurn.
