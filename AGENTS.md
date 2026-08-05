# Frontend Libraries 21 Agent Guide

## Scope

This guide applies to shared Angular source libraries under
`frontendApplications/frontend-libs-21/`.

## Project Shape

- A single Angular 21-compatible source library, `platform`, built with
  `ng-packagr` and consumed by sibling Angular applications as the
  `@nexacore/platform` package (a `file:` dependency resolving to
  `dist/platform`). Originally shipped as four separate packages
  (`api-common`, `auth`, `layout`, `shared`); merged into one in
  `platform/CHANGELOG.md`'s `[0.1.0] - 2026-08-05` entry — their dependency
  graph was already fully linear and they were always installed/rebuilt
  together, so separate packages only added rebuild/versioning overhead with
  no real "install only what you need" payoff.
- The published entry point is `projects/platform/src/public-api.ts`, which
  re-exports four subfolder barrels under `projects/platform/src/lib/`, one
  per origin concern (internal organization only — not separately
  installable):
  - `api-common/`: API service, interceptors, response models, notification
    abstraction
  - `auth/`: login component, auth service, route guards, SSO callback routes
  - `layout/`: Angular 21 shell, header, rail navigation, mega panel, status
    bar, theme and direction state, SVG icon registry
  - `shared/`: reusable form controls (Tier 1 CVA components), list/data
    composites (`DataTable`, `FilterBar`, `SearchToolbar`, `Pagination`,
    `ExportButton`), workflow composites (`Wizard`, `WizardStep`, `Stepper`,
    `ApprovalActions`, `ActivityFeed`), feedback primitives (`Pill`,
    `StatusBadge`, `EmptyState`, `Modal`, `ConfirmDialog`), image preview,
    validation UI
  - Cross-subfolder references inside `platform` are plain relative imports
    (e.g. `shared`'s components import `IconComponent` via
    `'../../../layout/index'`) — there is no package boundary between them
    anymore, so no peer-dependency bookkeeping is needed for internal use.
  - `assets-common`: app-neutral static assets

## Repository Boundary

- `frontend-libs-21/` contains its own `.git` directory. Do not edit nested
  repository metadata.
- Treat this folder as shared product infrastructure.
- Do not add app-specific business flows, pages, endpoint catalogs, or backend
  credentials here.
- Do not modify `../../v3` snapshots unless the task explicitly targets `v3`.

## Dependency Direction

- Angular apps depend on the single `@nexacore/platform` package.
- `platform` must not import app-only modules from `kyc-frontend-21/src`.
- Avoid `@app-core/*` in `platform`.
- Keep auth, layout, i18n, and API abstractions generic enough for future
  Angular 21 apps.

## Layout Rules

- New shell behavior belongs in `lib/layout/`.
- Standalone components, Signals for local UI state, CDK overlays, custom SCSS
  tokens, the custom SVG icon registry (`lib/layout/shared/icon/icon-registry.ts`),
  Transloco, and RTL direction support.
- Keep business routes and feature pages in consuming apps.
- Do not add Angular Material, Bootstrap, or Font Awesome anywhere in
  `frontend-libs-21` or its consuming apps — the icon registry and design
  tokens fully replace them.

## Component Conventions

- All form controls in `lib/shared/` extend the abstract
  `BaseValueAccessor<T>` (`lib/shared/components/base/base-value-accessor.ts`),
  which implements `ControlValueAccessor` once so individual components don't
  hand-roll it.
- Use signal-based `input()`/`output()`/`computed()`/`effect()` — not decorator
  `@Input()`/`@Output()` — and prefer `inject()` over constructor injection.
- Style field-shaped components (label, container, error state) with the
  shared `_field-shell.scss` mixin (`lib/shared/styles/_field-shell.scss`)
  layered on top of `lib/layout/styles/_tokens.scss` custom properties. No raw
  hex, px, or `rgba()` literals in component styles.
- Anchored floating UI (dropdowns, date pickers, smart dropdowns) uses CDK
  `Overlay` + `a11y`, not hand-rolled `@HostListener('document:click')`
  listeners. Centered, non-anchored overlays (lightboxes, modals) may use
  plain `position: fixed` with a backdrop instead.
- Render all icons through `<app-icon name="...">` backed by the shared icon
  registry. Never use emoji or Font Awesome glyphs anywhere in this repo or
  its consuming apps.

## Workflow-Ready Scaffolding Convention

- Consuming apps may add optional fields (e.g. `status`, `activity`) to their
  own domain models ahead of a backend workflow module shipping, so the real
  API integration is additive later rather than a rework. Gate any UI built on
  those fields behind the field's presence (`@if (record.status)`), never a
  hardcoded flag — the panel must stay invisible until the backend actually
  populates the field, and must never fabricate placeholder data.
- `ApprovalActionsComponent`, `ActivityFeedComponent`, `Pill`, and
  `StatusBadge` are the components built for this pattern; see
  `kyc-frontend-21/src/app/pages/person/person-preview.component.html`'s
  `.workflow-card` for a worked example, including the `// TODO: wire to the
  workflow API` marker convention for the stub decision handler.

## API, Auth, And Security

- Keep JWT attachment, language propagation, response unwrapping, and API error
  normalization in `lib/api-common/`.
- Keep UI-specific notification rendering behind an abstraction; do not inject
  Angular Material snackbar directly in `lib/api-common/`.
- Keep login, logout, token storage, SSO callback, and route guard behavior in
  `lib/auth/`.
- Do not log raw tokens, OTPs, passwords, authorization headers, Firebase
  credentials, or full PII payloads.

## Internationalization

- Transloco is the sole i18n system across `frontend-libs-21` and its
  consuming apps. Do not reintroduce a parallel `I18nService`/`TranslatePipe`.
- Keep translation keys stable and coordinate key changes with consuming apps.

## Public API Rules

- Export new shared services, models, components, guards, pipes, and routes from
  the relevant `lib/<concern>/index.ts`, which the top-level
  `src/public-api.ts` re-exports.
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
