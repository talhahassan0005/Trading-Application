# Backend setup (Supabase)

The mobile app (`mobile-app/`) and the admin panel (`admin-panel-web/`) share one
Supabase project: one user database, one login system, one private file store.

| Feature | Mobile app | Admin panel |
|---|---|---|
| Sign up / sign in | Email + password, 6-digit email code | Staff-only login (`role = 'admin'`) |
| Users | — | Live user list, search, user details |
| Account freeze | Frozen users are signed out instantly and can't sign in | Freeze / unfreeze button on a user |
| KYC | Upload ID + proof of address photos | Review queue, view photos, approve / reject with a reason |
| Account deletion | "Delete My account" sends a request | Approve (deletes everything) or reject |

Still sample data in the admin panel (not connected yet): withdrawals, ledger,
disputes, overview numbers and notifications — they need the app's wallet on a
real backend first.

## One-time setup (about 15 minutes)

### 1. Create the project

1. Sign up at [supabase.com](https://supabase.com) (free plan is enough) and click **New project**.
2. Pick a name (e.g. `trynex`), a strong database password (save it), and the region closest to your users.

### 2. Create the database

1. In the project, open **SQL Editor → New query**.
2. Paste the whole of [`schema.sql`](schema.sql) and click **Run**. It should say "Success. No rows returned".

### 3. Make sign-up send a 6-digit code

By default Supabase emails a link; the app expects a code.

1. **Authentication → Emails → Templates → Confirm signup**. Replace the message body with:

   ```html
   <h2>Your Trynex verification code</h2>
   <p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
   <p>It expires in 1 hour. If you didn't sign up, ignore this email.</p>
   ```

2. **Authentication → Sign In / Providers → Email**: make sure **Confirm email** is on and
   **Email OTP Length** is `6`.

### 4. Set up email sending (needed for real users)

Supabase's built-in email only delivers to your own project team's addresses and only a few
emails per hour — fine for your own testing, not for real customers.

- **For testing right now:** sign up in the app with the same email you used for your
  Supabase account.
- **For real users:** **Authentication → Emails → SMTP Settings** → enable custom SMTP with a
  free provider such as [Resend](https://resend.com) or [Brevo](https://brevo.com).

> Shortcut for quick testing only: turning **Confirm email** off skips the code step entirely
> (sign-up logs straight in). Turn it back on before real users sign up.

### 5. Connect the apps

In **Project Settings → API Keys** copy the **Project URL** and the **Publishable key**
(`sb_publishable_...`; on older projects it's the **anon public** key). Never use the
`service_role` / secret key in either app.

```bash
cp mobile-app/.env.example mobile-app/.env.local
cp admin-panel-web/.env.example admin-panel-web/.env.local
# then paste the URL and key into both .env.local files
```

`.env.local` files are git-ignored, so the keys never get committed.

### 6. Create the first admin

1. **Authentication → Users → Add user → Create new user**: enter the staff email and a
   password, tick **Auto Confirm User**.
2. **SQL Editor**, run (with that email):

   ```sql
   update public.profiles set role = 'admin' where email = 'staff@example.com';
   ```

Repeat for every staff member. Admin accounts don't appear in the panel's Users list and
can't be frozen or deleted from it. Use a separate email for staff; don't make your customer
app account an admin.

### 7. Run

```bash
# Admin panel
cd admin-panel-web && npm install && npm run dev

# Mobile app (Expo)
cd mobile-app && npm install && npx expo start
```

The app's keys are baked in when it's built, so **build a new APK after filling in
`mobile-app/.env.local`** — an APK built before that can't reach the backend.

## How security works

- Each user can only read and edit their own profile, and only their personal-data fields.
  Role, freeze status, KYC status and balance can only be changed by an admin.
- KYC photos go to a **private** bucket in a folder per user. Only that user and admins can
  read them; the admin panel opens them with links that expire after 5 minutes.
- Admin actions are database functions that check `role = 'admin'` themselves, so a
  modified app can't call them successfully.

## Moving to your own Node.js server later

This is a standard PostgreSQL database. When you build the Node.js server:

- Point it at the same database (**Project Settings → Database → Connection string**) —
  all existing users and data stay.
- Every backend call is isolated in one file per app — `mobile-app/src/api/backend.ts` and
  `admin-panel-web/src/api/adminService.ts` (+ `AuthContext.tsx`). Rewrite those to call your
  API; screens and pages don't change.
