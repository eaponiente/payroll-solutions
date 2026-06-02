# AGENTS.md

## Tech stack
- **Backend**: Laravel 13 (PHP ^8.3), Inertia v3, Fortify (auth)
- **Frontend**: React 19, TypeScript 5.7 strict, Vite 8, Tailwind CSS v4, shadcn/ui (New York style)[cite: 1]
- **Testing**: Pest PHP[cite: 1]
- **Server**: Docker / Sail[cite: 1]

## Key commands

```bash
composer setup          # full first-time setup
composer dev            # start all dev servers (laravel serve + queue + logs + vite)
composer test           # lint check + pest
./vendor/bin/pest       # run tests directly
./vendor/bin/pest --filter=ClassName  # single test
composer lint           # PHP formatting (Pint)
composer lint:check     # PHP formatting dry-run
npm run lint            # ESLint fix
npm run lint:check      # ESLint check only
npm run format          # Prettier write
npm run format:check    # Prettier dry-run
npm run types:check     # tsc --noEmit
npm run build           # Vite production build
npm run build:ssr       # build + SSR bundle
```[cite: 1]

## CI check order
`composer ci:check` runs: Prettier check → ESLint check → TypeScript check → Pest tests[cite: 1]

## Architecture

- **Entrypoints**: `public/index.php` → `bootstrap/app.php`; frontend renders through `resources/views/app.blade.php` (Inertia SSR shell)[cite: 1]
- **Page components**: `resources/js/pages/` — Inertia auto-maps these; new pages are discovered automatically[cite: 1]
- **Route files**: `routes/web.php` (main web), `routes/tenant.php` (tenant-specific routes), `routes/settings.php` (profile/security)
- **Auth**: Headless Fortify with Inertia React views in `resources/js/pages/auth/`. Support multi-tenant isolation during authentication scopes.

## Multi-Tenancy Architecture & Constraints

### Global Tenant Scoping
- **Database Strategy**: Multi-tenant database isolation. All tenant-specific tables must include a `tenant_id` column.
- **Automatic Scoping**: All tenant-aware Eloquent models must implement a `TenantScoped` trait or include a global scope that automatically restricts queries to `current_tenant_id()`.
- **Bypassing Scoping**: Bypassing tenant scopes (e.g., central admin billing panels) must explicitly use `withoutTenancy()` or a designated central model class to prevent accidental data leaks.
- **Tenant Resolution**: Tenants are resolved via request subdomains or identification headers in early middleware (`TenantResolutionMiddleware`).

### Multi-Tenant Shared Resource Safety
- **Unique Validation**: Never use standard unique rules like `'unique:users,email'`. Always scope to the tenant: `'unique:users,email,NULL,id,tenant_id,' . current_tenant_id()`.
- **File Storage**: All file uploads via AWS S3 must be explicitly prefixed by tenant identifiers: `tenants/{tenant_id}/media/`.
- **Cache Isolation**: All cache tags, keys, and background jobs must be tagged or prefixed with the tenant ID to prevent cross-tenant cache contamination.

## Auto-generated / gitignored code

These directories are gitignored and auto-generated — **do not edit**:
- `resources/js/actions/`[cite: 1]
- `resources/js/components/ui/` (shadcn/ui)[cite: 1]
- `resources/js/routes/`[cite: 1]
- `resources/js/wayfinder/`[cite: 1]

ESLint also ignores these plus `vite.config.ts`.[cite: 1]

## Database constraints

- **Default dev**: SQLite (`database/database.sqlite`)[cite: 1]
- **Production / Scale**: PostgreSQL (with multi-tenant indexing patterns optimization).
- **SQLite compatibility**: Use `$table->string()` instead of `$table->enum()` in migrations. Transaction mode is `DEFERRED`. Foreign keys must explicitly support cascading deletions or nullification rules per tenant.[cite: 1]
- **Testing**: SQLite in-memory (`DB_DATABASE=testing`) with automated tenant initialization seeds per test isolate.[cite: 1]

## The spec

`payroll.md` (945 lines) is the complete architecture specification — not just docs. It defines the domain models, business rules, API routes, and edge cases. **All domain decisions should reference this file.**[cite: 1]

## Conventions

- TypeScript: `consistent-type-imports` enforced, import ordering alphabetically grouped[cite: 1]
- PHP: Laravel Pint with `"laravel"` preset[cite: 1]
- JSX: `curly: 'error'` (always use braces), `brace-style: '1tbs'` (no single-line)[cite: 1]
- `.npmrc`: `ignore-scripts=true` — post-install lifecycle scripts are disabled[cite: 1]
- `pnpm-workspace.yaml`: root-only package, `@inertiajs/core` is publicly hoisted for SSR/HMR[cite: 1]
- Prettier: 4-space tabs, single quotes, semicolons[cite: 1]

## CI

- Branches: `develop`, `main`, `master`, `workos`[cite: 1]
- `lint.yml`: runs Pint + Prettier + ESLint (formatting, no tests)[cite: 1]
- `tests.yml`: matrix PHP 8.3/8.4/8.5, runs `npm run build` then `./vendor/bin/pest`[cite: 1]

## Pest usage

- `tests/Pest.php` extends `Tests\TestCase` for Feature tests[cite: 1]
- `RefreshDatabase` is available but **commented out** by default — opt in per-test[cite: 1]
- `TestCase::skipUnlessFortifyHas()` helper for conditional Fortify feature tests[cite: 1]
- Multi-tenancy tests must utilize the `InteractsWithTenancy` trait to set up isolated workspace environments automatically.

### Workflow Constraints
1. **No Explanations:** Provide code directly. Do not explain standard Laravel features, basic React hooks, or how Tailwind works unless explicitly asked.[cite: 1]
2. **Partial Code Blocks:** If editing an existing file, only output the changed sections with `// ... existing code ...` placeholders. Never reprint a 300-line file for a 5-line change.[cite: 1]
3. **No Placeholders in Logic:** Write the full logic for calculations (e.g., Invoice totals, tax computations, tenant quota limits). Do not leave `// TODO: add logic here`.[cite: 1]

## React / Typescript 
- If the component is already over 300 lines split it into multiple sub-components.[cite: 1]
- **Tenancy Context**: Ensure all hooks context maps back to an explicit tenant store (`useTenant()`) instead of checking route params directly.

## Laravel
- If the function is more than 130 lines, move the logic to a dedicated domain service class.[cite: 1]
- **Job Deserialization**: All queued jobs must accept tenant model identifiers or tenant IDs and explicitly bootstrap the tenant environment during processing execution.
- Apply SOLID principle.
- If the method has store / update / delete, make sure it has audit log.

## Notes
- Make sure if you update a bug or add a new feature, you don't break existing components or cross-tenant validation structures.[cite: 1]
- Request validation should be in its own form request class, dynamically adding tenant context constraints where necessary.[cite: 1]
- Make sure date and datetime show as Y-m-d if date or Y-m-d h:i a if datetime.[cite: 1]
- Spin up multiple sub-agents if the solution is too big but make sure the files that agents work on do not overlap with each other.[cite: 1]