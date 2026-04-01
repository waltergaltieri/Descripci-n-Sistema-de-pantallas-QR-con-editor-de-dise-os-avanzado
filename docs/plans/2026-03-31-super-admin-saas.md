# Super Admin SaaS con Supabase Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Incorporar Supabase Auth, un modulo de super admin y una base multi-tenant basica donde cada negocio tenga un usuario principal, control manual de acceso y seguimiento manual de pagos.

**Architecture:** La implementacion se hara en capas. Primero se agregara la infraestructura de autenticacion con Supabase y el nuevo modelo de datos (`super_admin_users`, `business_accounts`, `business_users`, `billing_profiles`, `billing_events`). Luego se creara un tenant por defecto para la data actual y se incorporara el panel de super admin. Por ultimo se movera la autorizacion del backend para depender del perfil resuelto desde Supabase y del `business_account_id`.

**Tech Stack:** Node.js, Express, React, Supabase Auth, Supabase JS, SQLite/Postgres adapters existentes, Jest, node:test

---

### Task 1: Cubrir la nueva resolucion de identidad de aplicacion

**Files:**
- Create: `server/tests/app-auth-profile.test.js`
- Modify: `server/tests/database-provider.test.js`

**Step 1: Write the failing test**

Agregar una prueba que exija resolver un perfil de aplicacion a partir de un `supabase_user_id`, distinguiendo:

- super admin,
- usuario de negocio activo,
- usuario de negocio suspendido.

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/app-auth-profile.test.js`

Expected: FAIL porque todavia no existe la capa que resuelve el perfil de sesion.

**Step 3: Write minimal implementation**

Crear la base de utilidades que resuelven el perfil de aplicacion desde las tablas nuevas.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/app-auth-profile.test.js`

Expected: PASS.

### Task 2: Crear el esquema base del modulo SaaS

**Files:**
- Modify: `server/config/database.js`
- Modify: `server/config/postgresSchema.js`
- Create: `server/tests/saas-schema.test.js`

**Step 1: Write the failing test**

Agregar pruebas para exigir que existan las tablas:

- `super_admin_users`
- `business_accounts`
- `business_users`
- `billing_profiles`
- `billing_events`

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/saas-schema.test.js`

Expected: FAIL porque el esquema todavia no contempla estas entidades.

**Step 3: Write minimal implementation**

Agregar las tablas y relaciones en SQLite y Postgres.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/saas-schema.test.js`

Expected: PASS.

### Task 3: Preparar un tenant por defecto para la data existente

**Files:**
- Modify: `server/config/database.js`
- Create: `server/tests/default-business-account.test.js`

**Step 1: Write the failing test**

Agregar una prueba que exija:

- crear un `business_account` por defecto al inicializar,
- crear un `billing_profile` default para ese tenant si no existe,
- dejar lista la migracion de datos legacy a ese tenant.

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/default-business-account.test.js`

Expected: FAIL porque todavia no hay tenant por defecto.

**Step 3: Write minimal implementation**

Crear el tenant inicial y preparar helper para asociar datos legacy.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/default-business-account.test.js`

Expected: PASS.

### Task 4: Implementar cliente y helpers de Supabase Auth en backend

**Files:**
- Modify: `server/config/supabase.js`
- Create: `server/utils/supabaseAuth.js`
- Create: `server/tests/supabase-auth.test.js`

**Step 1: Write the failing test**

Agregar pruebas para:

- validar token de Supabase,
- extraer `supabase_user_id`,
- fallar correctamente cuando el token no es valido.

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/supabase-auth.test.js`

Expected: FAIL porque aun no existe la utilidad de auth de Supabase.

**Step 3: Write minimal implementation**

Crear helper de validacion de token y resolucion de usuario autenticado.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/supabase-auth.test.js`

Expected: PASS.

### Task 5: Reemplazar el middleware JWT por middleware de perfil de aplicacion

**Files:**
- Modify: `server/middleware/auth.js`
- Create: `server/tests/auth-middleware.test.js`

**Step 1: Write the failing test**

Agregar pruebas para exigir:

- `authenticateToken` usando bearer de Supabase,
- `requireAdmin` para super admin,
- `optionalAuth` con resolucion de usuario de negocio o super admin.

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/auth-middleware.test.js`

Expected: FAIL porque el middleware hoy sigue acoplado a JWT propio y tabla `users`.

**Step 3: Write minimal implementation**

Reescribir middleware para usar el perfil de aplicacion.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/auth-middleware.test.js`

Expected: PASS.

### Task 6: Crear las rutas de sesion con Supabase

**Files:**
- Modify: `server/routes/auth.js`
- Create: `server/tests/auth-routes.test.js`

**Step 1: Write the failing test**

Agregar pruebas para:

- `GET /api/auth/verify` devolviendo perfil de aplicacion,
- `POST /api/auth/logout` manteniendo respuesta compatible,
- `POST /api/auth/change-password` usando Supabase o quedando deshabilitado temporalmente con respuesta clara.

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/auth-routes.test.js`

Expected: FAIL porque las rutas todavia esperan username/password propio.

**Step 3: Write minimal implementation**

Eliminar login/password local del backend y dejar solo rutas compatibles con sesion Supabase.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/auth-routes.test.js`

Expected: PASS.

### Task 7: Agregar el modulo backend de super admin

**Files:**
- Create: `server/routes/superAdmin.js`
- Modify: `server/index.js`
- Create: `server/tests/super-admin-routes.test.js`

**Step 1: Write the failing test**

Agregar pruebas para rutas como:

- `GET /api/super-admin/dashboard`
- `GET /api/super-admin/clients`
- `GET /api/super-admin/clients/:id`
- `POST /api/super-admin/clients`
- `POST /api/super-admin/clients/:id/mark-payment`
- `POST /api/super-admin/clients/:id/access-status`

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/super-admin-routes.test.js`

Expected: FAIL porque el router aun no existe.

**Step 3: Write minimal implementation**

Crear el router y conectarlo en el servidor.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/super-admin-routes.test.js`

Expected: PASS.

### Task 8: Crear el flujo de alta manual de cliente

**Files:**
- Modify: `server/routes/superAdmin.js`
- Modify: `server/config/supabase.js`
- Create: `server/tests/client-onboarding.test.js`

**Step 1: Write the failing test**

Agregar prueba para exigir que el alta manual:

- cree usuario en Supabase Auth,
- cree `business_account`,
- cree `business_user`,
- cree `billing_profile`,
- registre evento inicial.

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/client-onboarding.test.js`

Expected: FAIL porque el flujo aun no existe.

**Step 3: Write minimal implementation**

Agregar alta de cliente con password seteado por super admin.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/client-onboarding.test.js`

Expected: PASS.

### Task 9: Incorporar el cliente Supabase Auth en frontend

**Files:**
- Modify: `client/src/services/supabase.js`
- Modify: `client/src/contexts/AuthContext.js`
- Create: `client/src/tests/auth-context-supabase.test.js`

**Step 1: Write the failing test**

Agregar prueba para:

- iniciar sesion con email/password via Supabase,
- escuchar cambios de sesion,
- consumir `/api/auth/verify` para construir perfil,
- cerrar sesion correctamente.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand --watch=false src/tests/auth-context-supabase.test.js`

Expected: FAIL porque el contexto aun usa login propio.

**Step 3: Write minimal implementation**

Reescribir `AuthContext` para usar Supabase como fuente de sesion.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand --watch=false src/tests/auth-context-supabase.test.js`

Expected: PASS.

### Task 10: Corregir la pantalla de login para usar email y Supabase Auth

**Files:**
- Modify: `client/src/components/Auth/Login.js`
- Modify: `client/src/tests/login.test.js`

**Step 1: Write the failing test**

Actualizar la prueba para exigir:

- login por email,
- no navegar cuando falla,
- navegar solo cuando la respuesta del contexto es exitosa.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand --watch=false src/tests/login.test.js`

Expected: FAIL porque hoy navega aun con login fallido y usa usuario/password legacy.

**Step 3: Write minimal implementation**

Reescribir `Login.js` para depender del resultado real del login con Supabase.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand --watch=false src/tests/login.test.js`

Expected: PASS.

### Task 11: Crear el shell de super admin en frontend

**Files:**
- Modify: `client/src/App.js`
- Create: `client/src/components/SuperAdmin/SuperAdminLayout.js`
- Create: `client/src/components/SuperAdmin/SuperAdminDashboard.js`
- Create: `client/src/components/SuperAdmin/ClientsManager.js`
- Create: `client/src/components/SuperAdmin/ClientDetail.js`
- Create: `client/src/tests/super-admin-routes.test.js`

**Step 1: Write the failing test**

Agregar pruebas de routing para:

- acceso al dashboard de super admin,
- acceso al listado de clientes,
- acceso al detalle.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand --watch=false src/tests/super-admin-routes.test.js`

Expected: FAIL porque aun no existen estas rutas.

**Step 3: Write minimal implementation**

Agregar layout, rutas y placeholders funcionales.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand --watch=false src/tests/super-admin-routes.test.js`

Expected: PASS.

### Task 12: Implementar el listado y alertas de clientes

**Files:**
- Modify: `client/src/services/api.js`
- Modify: `client/src/components/SuperAdmin/SuperAdminDashboard.js`
- Modify: `client/src/components/SuperAdmin/ClientsManager.js`
- Create: `client/src/tests/super-admin-clients.test.js`

**Step 1: Write the failing test**

Agregar pruebas para ver:

- contadores del dashboard,
- alertas por vencimiento en 7 dias,
- filtro por estado.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand --watch=false src/tests/super-admin-clients.test.js`

Expected: FAIL porque todavia no existe consumo real del backend nuevo.

**Step 3: Write minimal implementation**

Conectar dashboard y tabla al API de super admin.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand --watch=false src/tests/super-admin-clients.test.js`

Expected: PASS.

### Task 13: Implementar el detalle del cliente y acciones manuales

**Files:**
- Modify: `client/src/components/SuperAdmin/ClientDetail.js`
- Create: `client/src/tests/super-admin-client-detail.test.js`

**Step 1: Write the failing test**

Agregar pruebas para:

- ver datos del negocio,
- ver estado de acceso,
- marcar pago,
- suspender/reactivar,
- ver historial.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand --watch=false src/tests/super-admin-client-detail.test.js`

Expected: FAIL porque la pantalla aun no implementa esas acciones.

**Step 3: Write minimal implementation**

Completar la pantalla de detalle y acciones manuales.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand --watch=false src/tests/super-admin-client-detail.test.js`

Expected: PASS.

### Task 14: Preparar la aplicacion actual para filtrar por tenant

**Files:**
- Modify: `server/routes/screens.js`
- Modify: `server/routes/designs.js`
- Modify: `server/routes/uploads.js`
- Modify: `server/routes/carteleria.js`
- Create: `server/tests/tenant-scoping.test.js`

**Step 1: Write the failing test**

Agregar pruebas para asegurar que un usuario de negocio solo ve y modifica recursos de su `business_account_id`.

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/tenant-scoping.test.js`

Expected: FAIL porque las rutas actuales siguen siendo globales.

**Step 3: Write minimal implementation**

Agregar scoping por tenant en las consultas principales.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/tenant-scoping.test.js`

Expected: PASS.

### Task 15: Verificacion final

**Files:**
- Modify: `docs/plans/2026-03-31-super-admin-saas-design.md`
- Modify: `docs/plans/2026-03-31-super-admin-saas.md`

**Step 1: Run backend tests**

Run: `node --test server/tests/*.test.js`

Expected: PASS.

**Step 2: Run frontend tests**

Run: `npm test -- --watchAll=false`

Expected: PASS o, si quedan warnings legacy, sin nuevos fallos relacionados al cambio.

**Step 3: Run frontend build**

Run: `npm run build`

Expected: exit 0.

**Step 4: Review diff**

Run: `git diff -- docs/plans/2026-03-31-super-admin-saas-design.md docs/plans/2026-03-31-super-admin-saas.md server client`

Expected: cambios consistentes con Supabase Auth, panel super admin y tenanting basico.
