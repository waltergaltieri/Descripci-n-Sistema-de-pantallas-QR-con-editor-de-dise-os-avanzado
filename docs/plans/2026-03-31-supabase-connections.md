# Conexion Base con Supabase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Dejar conectados Supabase Postgres, Storage y el cliente JS del frontend sin migrar aun el flujo completo de autenticacion.

**Architecture:** El backend seguira usando el adaptador Postgres actual, pero ampliara la resolucion de entorno para derivar la conexion desde variables de Supabase y para aceptar la nueva clave secreta del proyecto. El frontend incorporara un cliente Supabase aislado en un modulo propio. La verificacion se apoyara en tests de configuracion backend/frontend y en el build del cliente.

**Tech Stack:** Node.js, Express, React, CRA, Jest, node:test, Supabase JS

---

### Task 1: Cubrir la resolucion de configuracion Supabase en backend

**Files:**
- Modify: `server/tests/database-provider.test.js`
- Modify: `server/tests/storage-provider.test.js`

**Step 1: Write the failing tests**

Agregar pruebas para:

- derivar `databaseUrl` desde `SUPABASE_PROJECT_ID` y `SUPABASE_DB_PASSWORD`,
- codificar passwords con caracteres especiales,
- aceptar `SUPABASE_SECRET_KEY` en storage.

**Step 2: Run tests to verify they fail**

Run: `node --test server/tests/database-provider.test.js server/tests/storage-provider.test.js`

Expected: FAIL porque el proyecto aun no soporta esas variables.

**Step 3: Write minimal implementation**

Actualizar la resolucion de configuracion para soportar las nuevas fuentes de entorno.

**Step 4: Run tests to verify they pass**

Run: `node --test server/tests/database-provider.test.js server/tests/storage-provider.test.js`

Expected: PASS.

### Task 2: Crear el modulo compartido de Supabase en backend

**Files:**
- Create: `server/config/supabase.js`
- Modify: `server/config/storage.js`

**Step 1: Write the failing test**

Agregar una prueba nueva de backend que valide que el modulo normaliza URL, project id y secret key correctamente.

**Step 2: Run test to verify it fails**

Run: `node --test server/tests/supabase-config.test.js`

Expected: FAIL porque el modulo todavia no existe.

**Step 3: Write minimal implementation**

Crear el modulo y hacer que storage reutilice la configuracion centralizada.

**Step 4: Run test to verify it passes**

Run: `node --test server/tests/supabase-config.test.js`

Expected: PASS.

### Task 3: Preparar el cliente Supabase del frontend

**Files:**
- Create: `client/src/services/supabase.js`
- Modify: `client/package.json`
- Modify: `client/package-lock.json`
- Create: `client/src/tests/supabase-config.test.js`

**Step 1: Write the failing test**

Crear una prueba que valide que el cliente resuelve URL y publishable key desde variables de entorno y expone un helper para saber si Supabase esta configurado.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand --watch=false src/tests/supabase-config.test.js`

Expected: FAIL porque el modulo todavia no existe.

**Step 3: Write minimal implementation**

Instalar `@supabase/supabase-js` en el cliente y crear el modulo de inicializacion.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand --watch=false src/tests/supabase-config.test.js`

Expected: PASS.

### Task 4: Ajustar ejemplos de entorno y despliegue

**Files:**
- Modify: `server/.env.example`
- Modify: `client/.env.example`
- Modify: `render.yaml`

**Step 1: Update example envs**

Agregar variables:

- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_PROJECT_ID`
- `REACT_APP_SUPABASE_PUBLISHABLE_KEY`

**Step 2: Update deploy config**

Hacer que `render.yaml` apunte a storage de Supabase y a variables de DB/secret en lugar de uploads locales efimeros.

**Step 3: Review for secret safety**

Verificar que no queden secretos hardcodeados en archivos versionados.

### Task 5: Configurar entorno local e integrar verificacion final

**Files:**
- Modify: `server/.env`
- Create: `client/.env.local`

**Step 1: Configure local env**

Poblar archivos locales ignorados por git con el project id, URL y claves entregadas por el usuario.

**Step 2: Run backend tests**

Run: `node --test server/tests/*.test.js`

Expected: PASS.

**Step 3: Run focused frontend tests**

Run: `npm test -- --watchAll=false`

Expected: PASS o, si hay fallos previos no relacionados, conservar solo los conocidos y no introducir regresiones nuevas.

**Step 4: Run frontend build**

Run: `npm run build`

Expected: exit 0.
