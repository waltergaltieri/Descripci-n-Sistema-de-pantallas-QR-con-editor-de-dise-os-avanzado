# Supabase Backend Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hacer que el backend actual pueda correr con SQLite/local o con Supabase Postgres + Supabase Storage sin reescribir todas las rutas.

**Architecture:** Se agrega una capa adaptadora para base de datos y otra para storage. Las rutas siguen usando la API existente `db().get/all/run/exec`, mientras la infraestructura decide si operar con SQLite o Postgres. Los uploads pasan a un adaptador que soporta disco local o Supabase Storage.

**Tech Stack:** Node.js, Express, sqlite, pg, Supabase Storage, multer, node:test

---

### Task 1: Probar y definir la configuracion de proveedores

**Files:**
- Create: `server/tests/database-provider.test.js`
- Modify: `server/config/database.js`

**Step 1: Write the failing test**

Probar que el modulo de database pueda seleccionar proveedor SQLite o Postgres por env y que soporte `SQLITE_PATH`.

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/database-provider.test.js`

**Step 3: Write minimal implementation**

Separar configuracion de proveedor y path/URL.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/database-provider.test.js`

### Task 2: Implementar adaptador Postgres compatible

**Files:**
- Create: `server/config/database/postgresAdapter.js`
- Create: `server/config/database/queryTranslator.js`
- Modify: `server/config/database.js`
- Test: `server/tests/postgres-adapter.test.js`

**Step 1: Write the failing test**

Cubrir traduccion de placeholders `? -> $1`, `run` con `lastID/changes` y `get/all`.

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/postgres-adapter.test.js`

**Step 3: Write minimal implementation**

Crear adaptador compatible con la interfaz actual.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/postgres-adapter.test.js`

### Task 3: Implementar esquema Postgres

**Files:**
- Create: `server/config/database/postgresSchema.js`
- Modify: `server/config/database.js`
- Test: `server/tests/postgres-schema.test.js`

**Step 1: Write the failing test**

Verificar que el inicializador Postgres emita el esquema esperado y soporte tablas principales del sistema.

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/postgres-schema.test.js`

**Step 3: Write minimal implementation**

Agregar DDL Postgres para tablas y columnas del sistema.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/postgres-schema.test.js`

### Task 4: Implementar storage adapter local o Supabase

**Files:**
- Create: `server/config/storage.js`
- Modify: `server/routes/uploads.js`
- Modify: `server/index.js`
- Test: `server/tests/storage-provider.test.js`

**Step 1: Write the failing test**

Verificar seleccion de proveedor local o Supabase y formato de URL devuelto.

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/storage-provider.test.js`

**Step 3: Write minimal implementation**

Crear adaptador de storage y usarlo desde uploads.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/storage-provider.test.js`

### Task 5: Actualizar envars y verificar regresion

**Files:**
- Modify: `server/.env.example`
- Possibly create: `server/.env.supabase.example`
- Modify: `docs/plans/2026-03-20-supabase-backend-phase-1-design.md`

**Step 1: Run focused regression tests**

Run: `node --test server/tests/*.test.js`

**Step 2: Run frontend regression tests**

Run: `cd client && npm test -- --watchAll=false --runInBand --runTestsByPath src/tests/carteleria-menu-editor.test.js src/tests/carteleria-menu-preview.test.js src/tests/carteleria-public-menu.test.js`

**Step 3: Run build**

Run: `cd client && npm run build`

**Step 4: Commit**

```bash
git add server client docs
git commit -m "feat: add supabase-ready backend adapters"
```
