# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm start                  # Dev server at http://localhost:4200

# Build & Deploy
npm run build              # Production build → dist/redi-research-template-web
bash build-deploy.sh       # Build + sync to S3 (redi-research-web) + CloudFront invalidation

# Testing
npm test                   # Karma/Jasmine unit tests (watch mode)
npm test -- --include="**/api.service.spec.ts"  # Run a single spec file
```

## Architecture

Angular 17 SPA for research workflow tracking. Backend: `https://templateserver.redicatylist.com` (prod), `http://localhost:8080` (dev), configured in `src/environments/`.

**Core pattern**: All HTTP communication flows through a single `ApiService` (`src/app/services/api.service.ts`). Components inject this service and subscribe to observables directly (no async pipe). JWT token stored in `localStorage` alongside `userId` and `admin` flag; sent as `Authorization: Bearer <token>` on every protected call. There are no HTTP interceptors — headers are set manually per request.

**Auth & RBAC**: Login → `ApiService.login()` → localStorage. Admin flag controls data filtering and UI visibility throughout components. No route guards — access control is enforced in-component. Routing uses `useHash: true`, so URLs are `/#/spreadsheet`, `/#/history`, etc.

**Main routes**:
- `/spreadsheet` — primary ag-Grid data view, loads `forkJoin(users, workflowData)` and maps `ImportData → WorkflowRow`; non-admin users only see rows where `Researcher` matches their username; grid filter/column state persisted to `localStorage` keys `filterState` / `columnState` on `beforeunload`
- `/dataimport` — CSV → `ImportData` objects → batch `importData()` API call
- `/usermanagement` — CRUD on Cognito-backed users
- `/history` — read-only archived workflow records

**Models** live in `src/app/models/` — `User`, `ImportData`, `WorkflowRow`, `Company`. `WorkflowRow` is the UI model derived from `ImportData`; its extra fields are `Day45Target` and `Day60Target` (computed from `LastUpdate + 45/60 days`) and a numeric `id`. `ImportData` is the authoritative API shape with ~42 fields covering company info, contact info, workflow status booleans, dates, and researcher assignment.

**ag-Grid** (v30): custom date-picker cell that acts as both a `cellRenderer` and `cellEditor` at `src/app/components/aggrid-date-picker-compponent/`. When `LastUpdate` changes, it recalculates `Day45Target` and `Day60Target` and calls `gridApi.refreshCells()`. Row color coding in the spreadsheet is applied via `getRowStyle`: red/yellow/clear based on days elapsed since `LastUpdate`. Checking `Completed45` or `Completed60` triggers an auto-archive API call.

**Notifications**: ngx-toastr for user feedback; injected as `ToastrService`.
