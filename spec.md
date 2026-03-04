# Unexpected Smile

## Current State

Full-stack app with Motoko backend + React frontend. The backend uses an Authorization mixin (Internet Identity principal-based role check via `_initializeAccessControlWithSecret`). The admin UI login is a pure localStorage flag (email/password hardcoded on the frontend). The `useActor` hook calls `_initializeAccessControlWithSecret` only when an II identity is present -- so on the admin dashboard, if no II session exists, all admin-protected backend calls (portfolio CRUD, bookings, packages) throw "Unauthorized".

Blob storage exists via `useBlobStorage`. Uploaded files return a hash. Currently the `thumbnailBlobId` field on `PortfolioEntry` and `Package` stores the raw hash, but the frontend renders `<img src={hash}>` directly, which is not a valid URL. The `getBlobURL(hash)` method in `useBlobStorage` converts the hash to a working HTTP URL but is not being called in rendering paths.

The `PortfolioEntry` type has a `videoBlobId` field in both backend and `backend.d.ts`, but the CMS form has no MP4 upload field and the public gallery does not use `videoBlobId` for rendering.

## Requested Changes (Diff)

### Add
- MP4 video file upload field to the portfolio CMS form (`PortfolioEntrySheet`)
- HTML5 `<video>` player rendering in the public Tribute Gallery cards when `videoBlobId` is set
- Auto-admin-token initialization in `useActor` so the backend grants admin role as soon as the actor is created (no II popup required for admin dashboard access)

### Modify
- `useActor`: Always call `_initializeAccessControlWithSecret` on every actor creation (not only when II identity is present), so the backend recognizes the admin principal immediately
- `PortfolioCard` (HomePage): Resolve `thumbnailBlobId` hash to HTTP URL via `getBlobURL` before rendering `<img>`. If `videoBlobId` is present, render a `<video>` player; if `embedUrl` is present, render an `<iframe>`
- `PricingCard` (HomePage): Resolve `thumbnailBlobId` hash to HTTP URL via `getBlobURL` before rendering package thumbnail
- `AdminDashboardPage` (PortfolioEntrySheet): Add MP4 file upload input alongside thumbnail upload. Store the video blob hash in `videoBlobId` on save. Show preview state for both thumbnail and video

### Remove
- Nothing removed

## Implementation Plan

1. Fix `useActor.ts`: Remove the condition `if (!isAuthenticated)` that skips `_initializeAccessControlWithSecret`. Always create actor and always call `_initializeAccessControlWithSecret` with the admin token regardless of II identity.

2. Fix blob URL resolution in `HomePage.tsx`:
   - Create a `BlobImage` helper component that takes a `blobId` (hash or null), calls `getBlobURL` async, and renders the resolved URL in an `<img>` tag.
   - In `PortfolioCard`: use `BlobImage` for thumbnail. Add logic: if `videoBlobId` → render `<video>` player with thumbnail as poster; else if `embedUrl` → render `<iframe>`; else → placeholder.
   - In `PricingCard`: use `BlobImage` for package thumbnail.

3. Fix blob URL resolution in `AdminDashboardPage.tsx`:
   - Portfolio card thumbnails in the admin list view should show resolved image URLs.

4. Add MP4 upload to `PortfolioEntrySheet`:
   - Add a video file input that accepts `video/mp4`.
   - Upload via `uploadBlob`, store hash in `videoBlobId` state.
   - Pass `videoBlobId` in the `PortfolioEntryInput` on save.
   - Show upload progress and confirmation state for video.
