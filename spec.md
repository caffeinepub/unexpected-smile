# Unexpected Smile

## Current State
- Full-stack app with Motoko backend + React frontend
- Backend has: Booking CRUD, PortfolioEntry CRUD (with sortOrder, embedUrl, thumbnailBlobId), hardcoded `packages` array (immutable, 3 packages), ClientMessage CRUD
- Frontend has: Admin dashboard with Orders, Portfolio, Messages tabs
- Portfolio admin: Add/Edit/Delete via Sheet form, sort order via numeric input (no Up/Down buttons)
- Pricing section on homepage reads from `getPackages()` backend call, but packages are hardcoded in Motoko -- changes require code edits
- No Pricing CMS tab in admin dashboard
- blob-storage and authorization components are already selected

## Requested Changes (Diff)

### Add
- Dynamic package management in backend: convert hardcoded `packages` array to a mutable `Map<PackageId, Package>` with seed data pre-loaded
- New backend methods: `createPackage`, `updatePackage`, `deletePackage`, `reorderPackage` (admin-only)
- Package model gains: `thumbnailBlobId: ?Text`, `isHidden: Bool`, `sortOrder: Nat` fields
- Up/Down reorder buttons for portfolio entries in admin (replace reliance on manual sort order number input)
- `reorderPortfolioEntry(id, direction: {#up; #down})` backend method for simple up/down swap
- New "Pricing & Packages" tab in admin dashboard with full CRUD interface per package
- Package cards in admin: editable Name, Price 1 (Video Only), Price 2 (Voice Addon), Details/Description, Thumbnail upload, Hide/Show toggle, Up/Down reorder

### Modify
- Backend: `packages` constant becomes mutable Map seeded with the 3 existing packages (exact pricing: ₹1000/₹1500, ₹2000/₹2500, ₹3000/₹3500) plus new fields (thumbnailBlobId=null, isHidden=false, sortOrder=1/2/3)
- Backend: `getPackages()` returns only non-hidden packages sorted by sortOrder (public endpoint unchanged)
- Backend: add `getAllPackages()` admin-only endpoint that returns all packages including hidden ones
- Portfolio admin: replace manual "Sort Order" number input with Up/Down arrow buttons in the card grid
- Admin dashboard Tabs: add "Pricing" tab between Portfolio and Messages
- Homepage pricing section: already reads dynamically from `getPackages()` -- no change needed to wiring, only backend behavior changes

### Remove
- Manual sort order number input field from portfolio entry Sheet form (replaced by Up/Down buttons in the card list)

## Implementation Plan
1. Update `main.mo`: convert packages to mutable Map, seed with exact 3 packages + new fields, add createPackage/updatePackage/deletePackage/getAllPackages methods, add reorderPortfolioEntry method
2. Regenerate backend.d.ts via generate_motoko_code
3. Generate 3 cinematic placeholder images for package thumbnails (amber/gold/dark theme)
4. Frontend: add Up/Down reorder buttons to portfolio cards in AdminDashboardPage, wire to reorderPortfolioEntry
5. Frontend: add "Pricing" tab to AdminDashboardPage with PackageSheet form (name, prices, details, thumbnail upload, hide toggle, up/down reorder)
6. Frontend: update homepage PricingCard to use dynamic thumbnailBlobId if present, fallback to gradient placeholder
7. Deploy
