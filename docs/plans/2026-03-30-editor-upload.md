# Restaurar Subida de Imagenes en el Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restaurar la opcion para subir imagenes propias dentro del editor canvas mediante una pestana lateral `Subir`.

**Architecture:** El rail lateral custom del editor debe volver a exponer el panel nativo `UploadSection.Panel` de Polotno. El cambio queda encapsulado en `PolotnoEditor.tsx` y cubierto por una prueba del layout para evitar regresiones futuras.

**Tech Stack:** React, TypeScript, Polotno, Jest, Testing Library

---

### Task 1: Cubrir la pestana Subir con una prueba del rail

**Files:**
- Modify: `client/src/tests/polotno-editor-layout.test.js`
- Test: `client/src/tests/polotno-editor-layout.test.js`

**Step 1: Write the failing test**

Agregar una expectativa para que el rail del editor muestre el boton `Subir`.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand --watch=false src/tests/polotno-editor-layout.test.js`

Expected: FAIL porque el rail actual no incluye `Subir`.

**Step 3: Write minimal implementation**

Actualizar mocks y expectativas segun el nuevo panel disponible.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand --watch=false src/tests/polotno-editor-layout.test.js`

Expected: PASS.

### Task 2: Reintroducir UploadSection en el editor

**Files:**
- Modify: `client/src/components/PolotnoEditor.tsx`
- Test: `client/src/tests/polotno-editor-layout.test.js`

**Step 1: Write the failing test**

Usar la prueba del Task 1 como cobertura de regresion.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand --watch=false src/tests/polotno-editor-layout.test.js`

Expected: FAIL por ausencia del panel `upload`.

**Step 3: Write minimal implementation**

- Importar `UploadSection` desde `polotno/side-panel`.
- Agregar `upload` a `PanelKey`.
- Registrar `UploadSection.Panel` en `PANEL_CONTENT`.
- Agregar metadata y orden del item `Subir` en el rail.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand --watch=false src/tests/polotno-editor-layout.test.js`

Expected: PASS con el rail actualizado y el panel disponible.

### Task 3: Verificacion final

**Files:**
- Modify: `client/src/components/PolotnoEditor.tsx`
- Modify: `client/src/tests/polotno-editor-layout.test.js`

**Step 1: Run focused verification**

Run: `npm test -- --runInBand --watch=false src/tests/polotno-editor-layout.test.js`

Expected: PASS.

**Step 2: Review diff**

Run: `git diff -- client/src/components/PolotnoEditor.tsx client/src/tests/polotno-editor-layout.test.js docs/plans/2026-03-30-editor-upload-design.md docs/plans/2026-03-30-editor-upload.md`

Expected: Cambio acotado a restaurar la pestana `Subir`.
