# Platform

A modular web platform: accounts, verified email signup, profiles, private
messaging, and a Super Admin dashboard — built as separate modules on top of
Next.js (App Router) and Supabase, not a chat app with features bolted on.

## Stack

- **Next.js 15** (App Router, Server Actions, TypeScript)
- **Supabase**: Postgres + Auth + Storage + Realtime
- **Tailwind CSS 4**

## Project layout

```
app/(auth)/...        signup, login, 6-digit verify, password reset
app/profile/...        view + edit your own profile, avatar upload
app/messages/...       search users, conversation list, live chat
app/admin/...           Super Admin dashboard (guarded route group)
lib/actions/...         Server Actions — all writes go through these
lib/supabase/...        browser / server / middleware / admin(service-role) clients
supabase/migrations/    SQL: tables, RLS policies, triggers
```

## 1. Create the Supabase project

1. Create a project at supabase.com.
2. In the SQL Editor, run `supabase/migrations/0001_init.sql` once. It creates:
   - `profiles`, `conversations`, `messages` tables
   - Row Level Security policies (users only ever see their own conversations;
     everyone can read public profile info to search/message; only the row
     owner or a `super_admin` can update a profile)
   - A trigger that auto-creates a profile the moment a user's email is
     confirmed, and auto-assigns the `super_admin` role to
     **marufmarufuf@gmail.com** — nobody else can get that role except by an
     existing Super Admin granting it from the dashboard.
   - A trigger that makes `email` immutable on `profiles` — even the Super
     Admin's own update path can't change it, it's enforced at the database
     level, not just in the UI.
   - The public `avatars` storage bucket with per-user folder policies.

## 2. Configure the 6-digit email code

Supabase Auth already supports OTP-style confirmation — you don't need a
separate email service to get a 6-digit code flow:

1. Supabase dashboard → **Authentication → Email Templates → Confirm signup**.
2. Replace the template body so it shows `{{ .Token }}` (the 6-digit code)
   instead of the default `{{ .ConfirmationURL }}` magic link.
3. Authentication → Providers → Email: confirm "Confirm email" is **on**.

The app calls `supabase.auth.signUp()` then `supabase.auth.verifyOtp({ email,
token, type: "signup" })` — that's the whole flow, see `lib/actions/auth.ts`.

**Optional — Resend for other transactional email:** once you have a Resend
account, wire it in as a [Supabase Auth SMTP
override](https://supabase.com/docs/guides/auth/auth-smtp) (Authentication →
Settings → SMTP) so *all* auth email — codes, password resets — sends from
your own domain instead of Supabase's shared sender. No app code changes
needed; it's a dashboard setting.

## 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project
  Settings → API.
- `SUPABASE_SERVICE_ROLE_KEY` — same page. **Server-only.** It powers the two
  admin actions that the anon key structurally cannot do (setting another
  user's password, uploading their avatar). Every function that uses it
  (`lib/actions/admin.ts`) re-checks `role === 'super_admin'` on the caller
  before touching anything — treat that key like a master password.
- `NEXT_PUBLIC_SITE_URL` — used to build the password-reset redirect link.

## 4. Run it

```bash
npm install
npm run dev
```

Sign up with **marufmarufuf@gmail.com** to become the Super Admin — the
database trigger checks for that exact address on account confirmation.
Every other address gets the default `User` tag.

## How the pieces stay separate

- **Auth** (`lib/actions/auth.ts`) only ever touches `auth.users` via the
  Supabase client — it knows nothing about messaging or admin.
- **Profiles** (`lib/actions/profile.ts`) is the self-service layer: a user
  can only ever update their own row, and the `email` field is stripped
  server-side even if someone tampers with the form.
- **Messaging** (`lib/actions/messaging.ts`) is entirely separate tables
  (`conversations`, `messages`) with their own RLS — deleting the whole
  `app/messages` folder would not affect auth, profiles, or admin at all.
- **Admin** (`lib/actions/admin.ts`) is the only module allowed to touch
  *other* users' rows, gated by an explicit `requireSuperAdmin()` check on
  every function, independent of the UI-level route guard in
  `middleware.ts` and `app/admin/layout.tsx`.

Adding a new feature later (notifications, groups, etc.) means adding a new
table + a new `lib/actions/<feature>.ts` + a new `app/<feature>/` route —
none of the existing modules need to change.

## Security model, in one place

| Rule | Where it's enforced |
|---|---|
| Email can never change, by anyone | Postgres trigger (`protect_profile_fields`) |
| Only `super_admin` can change any role | Postgres trigger + RLS |
| Users can only read/write their own messages | RLS on `conversations`/`messages` |
| Only `super_admin` reaches `/admin/*` | `middleware.ts` (UI) + `requireSuperAdmin()` in every admin action (data) |
| Usernames are unique | DB `unique` constraint on `profiles.username` |
| One account per email | Enforced natively by Supabase Auth |

Because the real checks live in Postgres (RLS + triggers) and in the Server
Actions, not just in page-level redirects, they hold even if someone calls
the API directly or a route guard is accidentally skipped.

## Next steps you'll likely want

- Rate-limit signup/login (Supabase has basic protections; consider adding
  Cloudflare Turnstile on the signup form for bot protection).
- Add an activity log table for the "account activity" admin item — a
  lightweight `audit_log` table + a trigger on the tables you care about.
- Swap the hand-written `types/database.ts` for generated types once the
  project is live: `npx supabase gen types typescript --project-id <ref>`.
