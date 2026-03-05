# Unexpected Smile

## Current State

The app has a full Motoko backend with:
- Bookings, Portfolio, Packages, and ClientMessages data models
- Authorization via the `authorization` Caffeine component (`AccessControl.hasPermission(caller, #admin)`)
- Blob storage for media uploads
- 3 packages seeded by default

The frontend has:
- Full homepage (Hero, Services/Values, Portfolio Gallery, Pricing, FAQ, Reviews, Contact)
- Booking/Checkout/Confirmation flow with UPI payment
- Admin Login page at `/admin/login` with hardcoded credential check (email + password)
- Admin Dashboard with Orders, Portfolio CMS, Pricing CMS, and Messages tabs
- `useAuth.ts` stores admin session in localStorage only (does NOT trigger II)
- `useActor.ts` calls `_initializeAccessControlWithSecret(adminToken)` with II identity — this is how the backend grants admin role

**Root Cause of "Unauthorized" errors:** The backend's `AccessControl.hasPermission(caller, #admin)` checks the Internet Identity principal. The frontend never completes the II login + `_initializeAccessControlWithSecret` step after credential check, so all admin backend calls fail.

## Requested Changes (Diff)

### Add
- Language Switcher toggle in header (English / Telugu) with translations for key UI strings
- Reviews CMS tab in Admin Dashboard (approve/reject static reviews)
- Seamless admin auth flow: after credentials match, auto-trigger II login + `_initializeAccessControlWithSecret` silently, show a compact "Securing session..." inline state — no blocking full-page screen

### Modify
- `useAuth.ts` and `AdminLoginPage.tsx`: after credential check passes, trigger `useInternetIdentity.login()` and wait for `isLoginSuccess` before navigating to dashboard
- `AdminDashboardPage.tsx`: on mount, check if admin role is confirmed via `isCallerAdmin()`; if not and II is idle, re-trigger II login automatically; show a loading state rather than a redirect loop
- Admin Dashboard: ensure all mutation hooks (create/update/delete portfolio, packages, update booking status) use the authenticated II actor (already done via `useActor`), but only after II is `success`
- Nav links: add language toggle button (EN / TE) next to the "Book Your Surprise" CTA

### Remove
- The "Step 1 of 2 / Step 2 of 2" multi-step login UI from previous version (if any remnants remain)
- Any blocking intermediate auth screens that prevent reaching the dashboard

## Implementation Plan

1. **Language context**: Add a `LanguageContext` (React context) with `lang: 'en' | 'te'` and a translations map for key strings. Add a toggle button in the header (EN|TE pill).

2. **Admin auth fix**: 
   - `AdminLoginPage.tsx`: after credential check, call `iiLogin()` (from `useInternetIdentity`). Show an inline spinner "Securing your session..." while II is in `logging-in` state. On `isLoginSuccess`, call `useAuth.login()` and navigate to `/admin`.
   - `AdminDashboardPage.tsx`: on mount, call `isCallerAdmin()` from the actor. If returns false and II status is `idle`, re-trigger `iiLogin()`. Show a loading skeleton while confirming. Remove any redirect loops.

3. **Reviews CMS**: Add a "Reviews" tab to the Admin Dashboard. Static review data (the 3 reviews from HomePage) managed in a `reviews` state array with approve/reject toggle. Approved reviews show on the public homepage (store approved state in backend via a simple flag — or manage purely in frontend state using localStorage for simplicity if backend changes are not needed).

4. **Image generation**: Generate 3 cinematic package thumbnail images for Basic, Family Special, and Grand Cinematic packages.

5. **Deploy**.
