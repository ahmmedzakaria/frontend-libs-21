# Frontend Libraries Agent Guide

## Scope

This guide applies to shared Angular libraries under `frontend-libs/`.

## Project Shape

- Local TypeScript/Angular shared-library source consumed directly by sibling Angular apps
- Path aliases are defined by the consuming apps and this folder's `tsconfig.json`
- Published-style entry points are exposed through each library's `src/public-api.ts`
- Current libraries:
  - `api-common`: shared API service, interceptors, response models, auth config models
  - `auth`: login component, auth service, route guards, SSO callback routes
  - `layout`: layout shell, sidebar, topbar, layout state, sidebar menu context
  - `shared`: i18n service, translate pipe, validation message service, shared UI concerns
  - `assets-common`: shared static assets copied by the Angular apps

## Repository Boundary

- `frontend-libs/` contains its own `.git` directory. Do not edit nested repository metadata.
- Treat this folder as shared product infrastructure: changes can affect both `frontend/` and `privilege-frontend/`.
- Do not add app-specific business flows, pages, or endpoint catalogs here.
- Do not modify `../v3` snapshots unless the task explicitly targets `v3`.

## Dependency Direction

- Angular apps may depend on `@nexacore/api-common`, `@nexacore/auth`, `@nexacore/layout`, and `@nexacore/shared`.
- Shared libraries should not import app-only modules from `frontend/src/app/pages` or `privilege-frontend/src/app/pages`.
- Avoid using `@app-core/*` in shared libraries unless there is no shared alternative; app-specific core dependencies make the library harder to reuse.
- Keep auth, layout, i18n, and API abstractions generic enough for both frontend applications.

## Public API Rules

- Export new shared services, models, components, guards, pipes, and routes from the relevant `src/public-api.ts`.
- Keep public names stable. If a rename is necessary, update both consuming apps in the same change.
- Prefer typed models and narrow service contracts over untyped objects or duplicated literals.
- Keep shared assets in `assets-common` only when they are app-neutral.

## API, Auth, And Security

- Keep JWT attachment, language propagation, response unwrapping, and API error normalization in `api-common`.
- Keep login, logout, token storage, SSO callback, and route guard behavior in `auth`.
- Do not log raw tokens, OTPs, passwords, authorization headers, Firebase credentials, or full PII payloads.
- Do not store secrets or environment-specific credentials in library code.
- Route guards improve UX only; backend authorization remains the source of truth.

## Layout And UI

- Keep reusable shell behavior in `layout`: authenticated layout state, sidebar menu state, topbar behavior, and shared navigation structure.
- Keep generic UI helpers, translation, and validation-message behavior in `shared`.
- Avoid app-specific wording, menu entries, and business-page assumptions in shared components.
- Match existing Angular standalone component and SCSS patterns.

## Internationalization

- Keep shared translation infrastructure in `shared`.
- Put shared translation bundles under `shared/src/lib/i18n/translations`.
- Use stable message keys. Do not introduce hard-coded reusable user-facing text when a translation key is appropriate.
- Coordinate translation key changes with both consuming apps.

## Testing And Verification

- Add focused tests for new shared services, guards, pipes, interceptors, and component behavior.
- Verify shared-library changes from each consuming app affected by the change:

```bash
cd ../frontend
npm run build

cd ../privilege-frontend
npm run build
```

- Run app `npm test` commands when shared behavior has meaningful logic or branches.
- If local browser, dependency, or environment issues prevent a check, report the command and failure clearly.
