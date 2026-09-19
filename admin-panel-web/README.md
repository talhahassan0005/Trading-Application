# Vertex Admin — web admin panel

React + TypeScript + Tailwind CSS back-office app for staff: withdrawal approvals, user
management, KYC review, ledger, and dispute handling. Desktop-first web app, matching
the `Trading_App_Screen_Designs.pdf` "Admin panel · Desktop" design — this is the
industry-standard shape for an admin panel (see the note below).

This is a demo / simulated prototype: auth and all data come from an in-memory mock
service (`src/api/`), not a real backend.

## Running it

```bash
npm install
npm run dev
```

Open the printed `http://localhost:5173` URL in a browser. Sign in with any
email/password (mock auth, e.g. `amir.k@vertex.internal`).

## Why web, not mobile, for the admin panel

Professional admin panels are built as browser-based web apps, not native mobile apps:
staff work from desktop computers, admin work is dense tables and bulk actions that
need keyboard + mouse, and a web app deploys instantly with no app-store step. Your own
PDF design agrees — the "Vertex Admin" section is explicitly labelled *"Admin panel ·
Desktop ... own login, own API, internal-only"*, with no mobile version designed for it.

## Folder structure

```
src/
  api/          Mock backend — mockData.ts (fixtures) + adminService.ts (async calls).
                Swap the function bodies for real fetch() calls later; pages never
                change because they only import from adminService.
  components/   Every reusable UI primitive (Button, Card, Text, StatusPill, TextField,
                Textarea, Avatar, StatCard, Switch, Dialog, Table, ...). Pages are built
                ONLY out of these — never raw Tailwind classes for anything that repeats
                across screens.
  context/      ThemeContext (dark/light, persisted to localStorage), AuthContext
                (session, persisted to sessionStorage), and ConfirmDialogContext
                (app-wide `useConfirm()` — await a yes/no answer before any irreversible
                action instead of each page managing its own modal state).
  hooks/        useAsyncData, useBadgeCounts, useSidebarCollapsed — shared patterns.
  layouts/      AdminLayout (TopBar + Sidebar + <Outlet/>), NotificationPanel (the bell
                dropdown), navConfig.ts (the single list driving sidebar items/icons/routes).
  pages/        One file per screen (SignIn, Overview, Withdrawals, Users, UserDetail,
                Kyc — queue + detail split view, Ledger, Disputes, Settings). Pages fetch
                data via api/adminService and render using src/components only.
  types/        Shared TypeScript interfaces for domain data (models.ts).
  utils/        formatters.ts (currency), status.ts (status string → tone), activity.ts
                (activity feed dot colors).
  index.css     The design system — see below.
```

## Design system — change once, applies everywhere

Every color in the app is a CSS custom property defined once in `src/index.css`
(`:root` for light, `.dark` for dark), registered as Tailwind utilities via `@theme
inline`. Pages and components use semantic classes (`bg-surface`, `text-ink`,
`border-border`, `bg-accent`, `text-success`, ...) — never a raw hex value or Tailwind's
default color palette (`bg-blue-500`, `text-gray-400`, etc).

| Concern | File | How to change it |
|---|---|---|
| Colors (dark + light) | `src/index.css` | Edit the CSS variables under `:root` (light) / `.dark` (dark). Every component using the matching class updates in both themes immediately. |
| Fonts (size/weight/line-height) | `src/components/Text.tsx` | Edit `VARIANT_CLASSES`. Every `<Text variant="...">` across the app updates — there is only one `Text` component, pages never use a raw `<p>`/`<span>` with ad-hoc text classes. |
| Button sizes/colors | `src/components/Button.tsx` | Edit `SIZE_CLASSES` / `VARIANT_CLASSES`. Every button ("Approve", "Sign in", "Resolve", ...) updates together. |
| Status colors (verified/pending/frozen/...) | `src/utils/status.ts` + `src/components/StatusPill.tsx` | Map a new status string to a tone in `status.ts`; the 5 tone→color pairs live only in `StatusPill.tsx`. |

Example — if a wrong font was used everywhere, fix it in one place:

```ts
// src/components/Text.tsx
body: 'text-sm leading-5 font-normal',
```

## Theming

`ThemeProvider` (`src/context/ThemeContext.tsx`) resolves `light` / `dark` / `system`
preference, persists it to `localStorage`, and toggles the `.dark` class on
`<html>`. Toggle it from the sun/moon icon in the top bar, or call
`setPreference('light' | 'dark' | 'system')` from anywhere via `useTheme()`.

## Adding a new page

1. Add the page component under `src/pages/`.
2. Register its route in `src/App.tsx`.
3. Add a sidebar entry in `src/layouts/navConfig.ts` if it needs one.
4. Build the UI only from `src/components` — add a new shared component there first if
   something reusable is missing, rather than styling one-off inside the page.
