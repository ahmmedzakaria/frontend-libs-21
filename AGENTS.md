# Frontend Libraries 21 Agent Guide

## Scope

This guide applies to shared Angular source libraries under
`frontendApplications/frontend-libs-21/`.

## Project Shape

- Angular 21-compatible source libraries consumed directly by sibling Angular
  applications through TypeScript path aliases.
- No root build package is required yet; consuming apps provide Angular
  dependencies.
- Published-style entry points are exposed through each library's
  `src/public-api.ts`.
- Current libraries:
  - `api-common`: API service, interceptors, response models, notification
    abstraction
  - `auth`: login component, auth service, route guards, SSO callback routes
  - `layout`: Angular 21 shell, header, rail navigation, status bar, theme and
    direction state
  - `shared`: reusable form controls, image preview, validation UI, legacy i18n
    helpers during migration
  - `assets-common`: app-neutral static assets

## Repository Boundary

- `frontend-libs-21/` contains its own `.git` directory. Do not edit nested
  repository metadata.
- Treat this folder as shared product infrastructure.
- Do not add app-specific business flows, pages, endpoint catalogs, or backend
  credentials here.
- Do not modify `../../v3` snapshots unless the task explicitly targets `v3`.

## Dependency Direction

- Angular apps may depend on `@nexacore/api-common`, `@nexacore/auth`,
  `@nexacore/layout`, and `@nexacore/shared`.
- Shared libraries must not import app-only modules from `kyc-frontend-21/src`.
- Avoid `@app-core/*` in shared libraries.
- Keep auth, layout, i18n, and API abstractions generic enough for future
  Angular 21 apps.

## Layout Rules

- New shell behavior belongs in `layout`.
- Follow the reference implementation in `frontendApplications/layout`:
  standalone components, Signals for local UI state, CDK overlays, custom SCSS
  tokens, custom SVG icons, Transloco, and RTL direction support.
- Keep business routes and feature pages in consuming apps.
- Do not add Angular Material, Bootstrap, or Font Awesome to the shared layout
  shell.

## API, Auth, And Security

- Keep JWT attachment, language propagation, response unwrapping, and API error
  normalization in `api-common`.
- Keep UI-specific notification rendering behind an abstraction; do not inject
  Angular Material snackbar directly in `api-common`.
- Keep login, logout, token storage, SSO callback, and route guard behavior in
  `auth`.
- Do not log raw tokens, OTPs, passwords, authorization headers, Firebase
  credentials, or full PII payloads.

## Internationalization

- Use Transloco for the Angular 21 layout shell.
- Existing custom `I18nService` and `TranslatePipe` may remain temporarily for
  legacy shared components until those components are migrated.
- Keep translation keys stable and coordinate key changes with consuming apps.

## Public API Rules

- Export new shared services, models, components, guards, pipes, and routes from
  the relevant `src/public-api.ts`.
- Preserve public names where possible. If a rename is necessary, update
  consuming apps in the same change.
- Prefer typed models and narrow service contracts over untyped objects or
  duplicated literals.

## Testing And Verification

- Verify shared-library changes from the consuming Angular 21 app:

```bash
cd ../kyc-frontend-21
npm run build
```

- Run app `npm test` commands when shared behavior has meaningful logic or
  branches.
- If browser, dependency, network, or environment issues prevent a check, report
  the exact command and failure clearly.
