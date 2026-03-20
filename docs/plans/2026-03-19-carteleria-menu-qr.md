# Carteleria Menu QR Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a new `Carteleria` module inside the existing app so a business can manage products, promotions, combos, web menus, and persistent menu links/QR codes without changing printed URLs.

**Architecture:** Keep the existing React + Express + SQLite app and add a second bounded context with shared shell, separate routes, separate API endpoints, and a custom block-based menu editor. Public menu rendering resolves live data from catalog entities and link schedules instead of storing static snapshots.

**Tech Stack:** React 18, React Router 6, Tailwind CSS, existing auth/socket/layout system, Express.js, SQLite, existing uploads flow, dnd-kit for menu blocks, client-side QR styling/export.

---

### Task 1: Add Carteleria shell routing and mode switching

**Files:**
- Modify: `client/src/App.js`
- Modify: `client/src/components/Layout/Layout.js`
- Modify: `client/src/components/Layout/Header.js`
- Modify: `client/src/components/Layout/Sidebar.js`
- Create: `client/src/components/Carteleria/Layout/CarteleriaLayout.js`
- Create: `client/src/components/Carteleria/Layout/carteleriaNavigation.js`
- Test: `client/src/tests/carteleria-shell.test.js`

**Step 1: Write the failing test**

```js
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

test('shows carteleria routes inside shared shell', async () => {
  render(
    <MemoryRouter initialEntries={['/carteleria/dashboard']}>
      <App />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Carteleria/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-shell.test.js`
Expected: FAIL because carteleria routes and labels do not exist yet.

**Step 3: Write minimal implementation**

- Add a carteleria route group under the current protected shell.
- Add module mode switch in `Header.js`.
- Make `Sidebar.js` read the current module and show `Pantallas` or `Carteleria` navigation items.
- Keep all visual primitives shared.

**Step 4: Run test to verify it passes**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-shell.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add client/src/App.js client/src/components/Layout/Layout.js client/src/components/Layout/Header.js client/src/components/Layout/Sidebar.js client/src/components/Carteleria/Layout/CarteleriaLayout.js client/src/components/Carteleria/Layout/carteleriaNavigation.js client/src/tests/carteleria-shell.test.js
git commit -m "feat: add carteleria shell navigation"
```

### Task 2: Add database schema for carteleria entities

**Files:**
- Modify: `server/config/database.js`
- Create: `server/utils/carteleriaSchema.js`
- Test: `server/tests/carteleria-schema.test.js`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { initialize, db } = require('../config/database');

test('carteleria tables exist after initialization', async () => {
  await initialize();
  const row = await db().get("SELECT name FROM sqlite_master WHERE type='table' AND name='catalog_products'");
  assert.equal(row.name, 'catalog_products');
});
```

**Step 2: Run test to verify it fails**

Run: `cd server; node --test tests/carteleria-schema.test.js`
Expected: FAIL because catalog tables do not exist.

**Step 3: Write minimal implementation**

- Extract carteleria table creation into `server/utils/carteleriaSchema.js`.
- Call it from `createTables()` in `server/config/database.js`.
- Add tables for business profile, categories, products, product images, promotions, combos, menus, menu blocks, links, schedule rules, QR styles, and menu views.

**Step 4: Run test to verify it passes**

Run: `cd server; node --test tests/carteleria-schema.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/config/database.js server/utils/carteleriaSchema.js server/tests/carteleria-schema.test.js
git commit -m "feat: add carteleria database schema"
```

### Task 3: Add carteleria backend helpers for status and schedule resolution

**Files:**
- Create: `server/utils/carteleriaStatus.js`
- Create: `server/utils/menuResolver.js`
- Create: `server/utils/scheduleValidator.js`
- Test: `server/tests/menuResolver.test.js`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveMenuForLink } = require('../utils/menuResolver');

test('manual override wins over schedule and default menu', () => {
  const resolved = resolveMenuForLink({
    status: 'active',
    default_menu_id: 1,
    manual_override_menu_id: 2,
    rules: [{ menu_id: 3 }]
  }, new Date('2026-03-19T10:00:00-03:00'));

  assert.equal(resolved.menuId, 2);
});
```

**Step 2: Run test to verify it fails**

Run: `cd server; node --test tests/menuResolver.test.js`
Expected: FAIL because resolver utilities do not exist.

**Step 3: Write minimal implementation**

- Implement product status visibility rules.
- Implement schedule overlap validation.
- Implement menu resolution priority:
  - paused link
  - manual override
  - active matching rule
  - default menu

**Step 4: Run test to verify it passes**

Run: `cd server; node --test tests/menuResolver.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/utils/carteleriaStatus.js server/utils/menuResolver.js server/utils/scheduleValidator.js server/tests/menuResolver.test.js
git commit -m "feat: add carteleria status and resolver utilities"
```

### Task 4: Add products and categories API

**Files:**
- Create: `server/routes/carteleriaProducts.js`
- Create: `server/routes/carteleriaCategories.js`
- Modify: `server/index.js`
- Create: `client/src/services/api/carteleriaProducts.js`
- Create: `client/src/services/api/carteleriaCategories.js`
- Test: `server/tests/carteleria-products-routes.test.js`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('products route module exports a router', async () => {
  const router = require('../routes/carteleriaProducts');
  assert.equal(typeof router.use, 'function');
});
```

**Step 2: Run test to verify it fails**

Run: `cd server; node --test tests/carteleria-products-routes.test.js`
Expected: FAIL because the routes do not exist.

**Step 3: Write minimal implementation**

- Add CRUD for categories and products.
- Reuse current auth middleware and uploads conventions.
- Support filters: search, category, status, view mode pagination.
- Return normalized product records with image collections.

**Step 4: Run test to verify it passes**

Run: `cd server; node --test tests/carteleria-products-routes.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/routes/carteleriaProducts.js server/routes/carteleriaCategories.js server/index.js client/src/services/api/carteleriaProducts.js client/src/services/api/carteleriaCategories.js server/tests/carteleria-products-routes.test.js
git commit -m "feat: add carteleria products and categories api"
```

### Task 5: Build products UI and hidden create/edit screens

**Files:**
- Create: `client/src/components/Carteleria/Dashboard/CarteleriaDashboard.js`
- Create: `client/src/components/Carteleria/Products/ProductsManager.js`
- Create: `client/src/components/Carteleria/Products/ProductFormPage.js`
- Create: `client/src/components/Carteleria/Products/ProductCard.js`
- Create: `client/src/components/Carteleria/Products/ProductTable.js`
- Create: `client/src/components/Carteleria/Products/ProductFilters.js`
- Test: `client/src/tests/carteleria-products.test.js`

**Step 1: Write the failing test**

```js
import { render, screen } from '@testing-library/react';
import ProductsManager from '../components/Carteleria/Products/ProductsManager';

test('products manager shows create button and search input', () => {
  render(<ProductsManager />);
  expect(screen.getByText(/Nuevo Producto/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Buscar productos/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-products.test.js`
Expected: FAIL because products UI does not exist.

**Step 3: Write minimal implementation**

- Add dashboard with base metrics.
- Add product list with table/card toggle, pagination, filters, search, pause, sold-out, edit.
- Add hidden route form for create/edit product.
- Support category creation inline inside form.

**Step 4: Run test to verify it passes**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-products.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add client/src/components/Carteleria/Dashboard/CarteleriaDashboard.js client/src/components/Carteleria/Products/ProductsManager.js client/src/components/Carteleria/Products/ProductFormPage.js client/src/components/Carteleria/Products/ProductCard.js client/src/components/Carteleria/Products/ProductTable.js client/src/components/Carteleria/Products/ProductFilters.js client/src/tests/carteleria-products.test.js
git commit -m "feat: add carteleria product management ui"
```

### Task 6: Add promotions and combos API plus UI

**Files:**
- Create: `server/routes/carteleriaPromotions.js`
- Create: `server/routes/carteleriaCombos.js`
- Modify: `server/index.js`
- Create: `client/src/services/api/carteleriaPromotions.js`
- Create: `client/src/services/api/carteleriaCombos.js`
- Create: `client/src/components/Carteleria/Promotions/PromotionsManager.js`
- Create: `client/src/components/Carteleria/Promotions/PromotionFormPage.js`
- Create: `client/src/components/Carteleria/Promotions/ComboFormPage.js`
- Test: `client/src/tests/carteleria-promotions.test.js`

**Step 1: Write the failing test**

```js
import { render, screen } from '@testing-library/react';
import PromotionsManager from '../components/Carteleria/Promotions/PromotionsManager';

test('promotions screen renders create action', () => {
  render(<PromotionsManager />);
  expect(screen.getByText(/Nueva Promocion/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-promotions.test.js`
Expected: FAIL because promotions UI does not exist.

**Step 3: Write minimal implementation**

- Add promotion CRUD with rule types required by the approved design.
- Add combo CRUD with image fallback to first product.
- Add filtering, search, card/list view.
- Keep combo management reachable from promotions section, even if backend entities are separate.

**Step 4: Run test to verify it passes**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-promotions.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/routes/carteleriaPromotions.js server/routes/carteleriaCombos.js server/index.js client/src/services/api/carteleriaPromotions.js client/src/services/api/carteleriaCombos.js client/src/components/Carteleria/Promotions/PromotionsManager.js client/src/components/Carteleria/Promotions/PromotionFormPage.js client/src/components/Carteleria/Promotions/ComboFormPage.js client/src/tests/carteleria-promotions.test.js
git commit -m "feat: add carteleria promotions and combos"
```

### Task 7: Add menus persistence and menu block API

**Files:**
- Create: `server/routes/carteleriaMenus.js`
- Create: `server/utils/menuAssembler.js`
- Modify: `server/index.js`
- Create: `client/src/services/api/carteleriaMenus.js`
- Test: `server/tests/carteleria-menus-routes.test.js`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { assembleMenuPayload } = require('../utils/menuAssembler');

test('menu assembler keeps header as first block', () => {
  const output = assembleMenuPayload([{ block_type: 'category' }, { block_type: 'header' }]);
  assert.equal(output[0].block_type, 'header');
});
```

**Step 2: Run test to verify it fails**

Run: `cd server; node --test tests/carteleria-menus-routes.test.js`
Expected: FAIL because menu assembler and route do not exist.

**Step 3: Write minimal implementation**

- Add CRUD for menus and menu blocks.
- Normalize block ordering and guarantee header-first behavior.
- Persist theme key plus block config JSON.
- Keep menu content data-driven by storing references to entities instead of snapshots.

**Step 4: Run test to verify it passes**

Run: `cd server; node --test tests/carteleria-menus-routes.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/routes/carteleriaMenus.js server/utils/menuAssembler.js server/index.js client/src/services/api/carteleriaMenus.js server/tests/carteleria-menus-routes.test.js
git commit -m "feat: add carteleria menus api"
```

### Task 8: Build the custom menu editor

**Files:**
- Create: `client/src/components/Carteleria/Menus/MenusManager.js`
- Create: `client/src/components/Carteleria/Menus/MenuEditorPage.js`
- Create: `client/src/components/Carteleria/Menus/BlockLibrary.js`
- Create: `client/src/components/Carteleria/Menus/MenuCanvas.js`
- Create: `client/src/components/Carteleria/Menus/BlockInspector.js`
- Create: `client/src/components/Carteleria/Menus/themePresets.js`
- Create: `client/src/components/Carteleria/Menus/renderMenuPreview.js`
- Test: `client/src/tests/carteleria-menu-editor.test.js`

**Step 1: Write the failing test**

```js
import { render, screen } from '@testing-library/react';
import MenuEditorPage from '../components/Carteleria/Menus/MenuEditorPage';

test('menu editor exposes block library and preview', () => {
  render(<MenuEditorPage />);
  expect(screen.getByText(/Bloques/i)).toBeInTheDocument();
  expect(screen.getByText(/Vista previa/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-menu-editor.test.js`
Expected: FAIL because editor files do not exist.

**Step 3: Write minimal implementation**

- Build custom drag-and-drop editor with dnd-kit.
- Add fixed header block.
- Add category, featured product, promotions, combos and separator blocks.
- Add 6 theme presets over one preview renderer.
- Always show search and filters in preview shell.

**Step 4: Run test to verify it passes**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-menu-editor.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add client/src/components/Carteleria/Menus/MenusManager.js client/src/components/Carteleria/Menus/MenuEditorPage.js client/src/components/Carteleria/Menus/BlockLibrary.js client/src/components/Carteleria/Menus/MenuCanvas.js client/src/components/Carteleria/Menus/BlockInspector.js client/src/components/Carteleria/Menus/themePresets.js client/src/components/Carteleria/Menus/renderMenuPreview.js client/src/tests/carteleria-menu-editor.test.js
git commit -m "feat: add carteleria menu editor"
```

### Task 9: Add persistent links API and schedule validation

**Files:**
- Create: `server/routes/carteleriaLinks.js`
- Modify: `server/index.js`
- Create: `client/src/services/api/carteleriaLinks.js`
- Test: `server/tests/carteleria-links-routes.test.js`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { hasScheduleConflicts } = require('../utils/scheduleValidator');

test('overlapping rules on same weekday are rejected', () => {
  const hasConflict = hasScheduleConflicts([
    { days: [1], start_time: '06:00', end_time: '08:00' },
    { days: [1], start_time: '07:30', end_time: '09:00' }
  ]);
  assert.equal(hasConflict, true);
});
```

**Step 2: Run test to verify it fails**

Run: `cd server; node --test tests/carteleria-links-routes.test.js`
Expected: FAIL because links route and validation are incomplete.

**Step 3: Write minimal implementation**

- Add link CRUD with immutable slug.
- Add schedule CRUD and validation endpoint.
- Add manual override endpoint.
- Add pause/archive behavior without deleting published links.

**Step 4: Run test to verify it passes**

Run: `cd server; node --test tests/carteleria-links-routes.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/routes/carteleriaLinks.js server/index.js client/src/services/api/carteleriaLinks.js server/tests/carteleria-links-routes.test.js
git commit -m "feat: add persistent menu links api"
```

### Task 10: Build links and QR management UI

**Files:**
- Create: `client/src/components/Carteleria/Links/LinksManager.js`
- Create: `client/src/components/Carteleria/Links/LinkFormPage.js`
- Create: `client/src/components/Carteleria/Links/ScheduleBuilder.js`
- Create: `client/src/components/Carteleria/Links/QrCustomizer.js`
- Create: `client/src/components/Carteleria/Links/useQrExport.js`
- Test: `client/src/tests/carteleria-links.test.js`

**Step 1: Write the failing test**

```js
import { render, screen } from '@testing-library/react';
import LinksManager from '../components/Carteleria/Links/LinksManager';

test('links manager exposes create action and qr label', () => {
  render(<LinksManager />);
  expect(screen.getByText(/Nuevo Link/i)).toBeInTheDocument();
  expect(screen.getByText(/QR/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-links.test.js`
Expected: FAIL because links UI does not exist.

**Step 3: Write minimal implementation**

- Add list/table-card switch, filters, search.
- Add link form with menu default, schedule rules, pause and override.
- Add QR visual customization and client-side SVG/PNG export.
- Show generated stable URL inside the form.

**Step 4: Run test to verify it passes**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-links.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add client/src/components/Carteleria/Links/LinksManager.js client/src/components/Carteleria/Links/LinkFormPage.js client/src/components/Carteleria/Links/ScheduleBuilder.js client/src/components/Carteleria/Links/QrCustomizer.js client/src/components/Carteleria/Links/useQrExport.js client/src/tests/carteleria-links.test.js
git commit -m "feat: add links and qr management ui"
```

### Task 11: Add public menu resolution endpoint and mobile viewer

**Files:**
- Create: `server/routes/carteleriaPublic.js`
- Modify: `server/index.js`
- Create: `client/src/components/Carteleria/Public/PublicMenuPage.js`
- Create: `client/src/components/Carteleria/Public/renderResolvedMenu.js`
- Modify: `client/src/App.js`
- Test: `client/src/tests/carteleria-public-menu.test.js`

**Step 1: Write the failing test**

```js
import { render, screen } from '@testing-library/react';
import PublicMenuPage from '../components/Carteleria/Public/PublicMenuPage';

test('public menu page renders search and filters shell', () => {
  render(<PublicMenuPage />);
  expect(screen.getByPlaceholderText(/Buscar en el menu/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-public-menu.test.js`
Expected: FAIL because the public menu page does not exist.

**Step 3: Write minimal implementation**

- Add public route like `/m/:slug`.
- Resolve current menu via backend using default menu, override and schedule rules.
- Render mobile-first web menu with product status badges, promos and combos.
- Track menu views in `catalog_menu_views`.

**Step 4: Run test to verify it passes**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-public-menu.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/routes/carteleriaPublic.js server/index.js client/src/components/Carteleria/Public/PublicMenuPage.js client/src/components/Carteleria/Public/renderResolvedMenu.js client/src/App.js client/src/tests/carteleria-public-menu.test.js
git commit -m "feat: add public menu viewer"
```

### Task 12: Add dashboard metrics, polish, and regression checks

**Files:**
- Create: `server/routes/carteleriaDashboard.js`
- Modify: `server/index.js`
- Modify: `client/src/components/Carteleria/Dashboard/CarteleriaDashboard.js`
- Create: `client/src/tests/carteleria-dashboard.test.js`
- Modify: `README.md`

**Step 1: Write the failing test**

```js
import { render, screen } from '@testing-library/react';
import CarteleriaDashboard from '../components/Carteleria/Dashboard/CarteleriaDashboard';

test('dashboard shows metrics cards for products, menus and links', () => {
  render(<CarteleriaDashboard />);
  expect(screen.getByText(/Productos/i)).toBeInTheDocument();
  expect(screen.getByText(/Menus/i)).toBeInTheDocument();
  expect(screen.getByText(/Links/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-dashboard.test.js`
Expected: FAIL because dashboard metrics endpoint/UI is incomplete.

**Step 3: Write minimal implementation**

- Add backend metrics aggregation endpoint.
- Complete the dashboard cards and recent activity.
- Update README with the new module and routes.
- Run a manual regression pass over:
  - pantallas routes
  - designs routes
  - carteleria admin routes
  - public menu route

**Step 4: Run test to verify it passes**

Run: `cd client; npm test -- --watch=false src/tests/carteleria-dashboard.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/routes/carteleriaDashboard.js server/index.js client/src/components/Carteleria/Dashboard/CarteleriaDashboard.js client/src/tests/carteleria-dashboard.test.js README.md
git commit -m "feat: finish carteleria dashboard and docs"
```

### Verification Checklist

- Run: `cd client; npm test -- --watch=false`
- Run: `cd server; node --test tests/*.test.js`
- Run: `npm run build`
- Run manual smoke flow:
  - login
  - switch to carteleria
  - create category
  - create product
  - create promotion
  - create combo
  - create menu
  - create persistent link and QR
  - open public slug and confirm schedule resolution

### Notes For Execution

- Prefer shared UI patterns over new visual systems.
- Do not reuse Polotno for menus.
- Keep links immutable and avoid destructive delete semantics.
- Keep menu rendering data-driven so future ordering can be layered later.

### Baseline Prerequisite

Before Task 1, fix the current client test baseline:

- `client/src/tests/editor.test.js` currently fails because CRA Jest cannot parse ESM-only `polotno` from `node_modules`.
- Stabilize the test by mocking the Polotno boundary expected by the app test suite.
- Verify: `cd client; $env:CI='true'; npm test -- --watchAll=false --runInBand`
