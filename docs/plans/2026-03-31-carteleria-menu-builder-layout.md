# Reorganizacion del Editor de Menus Digitales Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganizar el modal de menus digitales para priorizar el constructor por arrastre, compactar la configuracion general y reducir el espacio ocupado por opciones secundarias.

**Architecture:** El cambio se concentra en `MenuEditorModal.js`. Se mantendra la logica actual de guardado y normalizacion de bloques, pero se reemplazara la composicion visual por una barra superior compacta, un constructor central con acciones de alta prioridad y una vista previa lateral mas contenida. La cobertura de regresion se apoyara en `carteleria-menu-editor.test.js`.

**Tech Stack:** React, JavaScript, Tailwind utility classes, dnd-kit, Jest, Testing Library

---

### Task 1: Cubrir el nuevo layout del constructor con una prueba

**Files:**
- Modify: `client/src/tests/carteleria-menu-editor.test.js`
- Test: `client/src/tests/carteleria-menu-editor.test.js`

**Step 1: Write the failing test**

Agregar una prueba que abra el editor y espere:

- un resumen de configuracion general visible,
- una seccion principal orientada a construir y ordenar el menu,
- una barra compacta de acciones para agregar bloques,
- y la vista previa.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand --watch=false src/tests/carteleria-menu-editor.test.js`

Expected: FAIL porque el modal todavia responde a la jerarquia anterior.

**Step 3: Write minimal implementation**

Actualizar solo la prueba con selectores y textos que representen la nueva experiencia.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand --watch=false src/tests/carteleria-menu-editor.test.js`

Expected: PASS.

### Task 2: Compactar la configuracion global del menu

**Files:**
- Modify: `client/src/components/Carteleria/Menus/MenuEditorModal.js`
- Test: `client/src/tests/carteleria-menu-editor.test.js`

**Step 1: Write the failing test**

Usar la cobertura del Task 1 para exigir un bloque compacto de configuracion global.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand --watch=false src/tests/carteleria-menu-editor.test.js`

Expected: FAIL mientras siga existiendo el formulario superior expandido como layout primario.

**Step 3: Write minimal implementation**

- Reemplazar la grilla superior por una banda compacta de configuracion.
- Conservar labels actuales para `Nombre del menu`, `Nombre del local`, `Logo del menu`, `Estilo visual` y `Estado`.
- Mejorar jerarquia con una presentacion mas corta y menos dominante.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand --watch=false src/tests/carteleria-menu-editor.test.js`

Expected: PASS.

### Task 3: Convertir el centro en un constructor protagonista

**Files:**
- Modify: `client/src/components/Carteleria/Menus/MenuEditorModal.js`
- Test: `client/src/tests/carteleria-menu-editor.test.js`

**Step 1: Write the failing test**

Extender la prueba para esperar una seccion de constructor con acciones compactas de alta prioridad.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand --watch=false src/tests/carteleria-menu-editor.test.js`

Expected: FAIL porque hoy los botones de agregado viven en una columna separada.

**Step 3: Write minimal implementation**

- Mover los botones `Agregar` al area central en formato compacto.
- Dar mas ancho visual a la estructura del menu.
- Mantener `DndContext` y `SortableContext` intactos.
- Reescribir el copy de la seccion para enfatizar arrastrar y ordenar.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand --watch=false src/tests/carteleria-menu-editor.test.js`

Expected: PASS.

### Task 4: Reducir la ocupacion visual de cada bloque

**Files:**
- Modify: `client/src/components/Carteleria/Menus/MenuEditorModal.js`
- Test: `client/src/tests/carteleria-menu-editor.test.js`

**Step 1: Write the failing test**

Agregar una expectativa para que el editor permita resumir o expandir bloques de forma mas compacta.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand --watch=false src/tests/carteleria-menu-editor.test.js`

Expected: FAIL porque todos los bloques muestran sus controles completos al mismo tiempo.

**Step 3: Write minimal implementation**

- Introducir expansion por bloque con estado local controlado.
- Dejar el handle de arrastre, el tipo y el resumen siempre visibles.
- Mantener el bloque header fijo y no eliminable.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand --watch=false src/tests/carteleria-menu-editor.test.js`

Expected: PASS.

### Task 5: Verificacion final

**Files:**
- Modify: `client/src/components/Carteleria/Menus/MenuEditorModal.js`
- Modify: `client/src/tests/carteleria-menu-editor.test.js`
- Modify: `docs/plans/2026-03-31-carteleria-menu-builder-layout-design.md`
- Modify: `docs/plans/2026-03-31-carteleria-menu-builder-layout.md`

**Step 1: Run focused tests**

Run: `npm test -- --runInBand --watch=false src/tests/carteleria-menu-editor.test.js`

Expected: PASS.

**Step 2: Run frontend build**

Run: `npm run build`

Expected: exit 0.

**Step 3: Review diff**

Run: `git diff -- client/src/components/Carteleria/Menus/MenuEditorModal.js client/src/tests/carteleria-menu-editor.test.js docs/plans/2026-03-31-carteleria-menu-builder-layout-design.md docs/plans/2026-03-31-carteleria-menu-builder-layout.md`

Expected: Cambio limitado al rediseño del constructor de menus y su cobertura.
