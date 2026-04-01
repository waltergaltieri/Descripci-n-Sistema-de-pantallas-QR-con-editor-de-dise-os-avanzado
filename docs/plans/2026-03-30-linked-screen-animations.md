# Linked Screen Animations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Activar las animaciones del editor real para que persistan en `custom.animation` y se reproduzcan en las pantallas vinculadas.

**Architecture:** El editor de usuario se apoyara en `PolotnoAnimationsPanel` y el backend seguira usando `konvaRenderer` y `konva-animations.js`. La extraccion de animaciones sera recursiva para incluir elementos anidados sin tocar el sistema paralelo viejo.

**Tech Stack:** React, Polotno, Jest, Testing Library, Node test runner, renderer HTML con Konva.

---

### Task 1: Cubrir el flujo real con tests

**Files:**
- Modify: `client/src/tests/polotno-editor-layout.test.js`
- Create: `server/tests/animations-engine.test.js`

**Step 1: Write the failing tests**

- Agregar un test que espere una entrada visible para animaciones en el editor real.
- Agregar un test que confirme que `extractAnimations()` devuelve animaciones de elementos anidados dentro de grupos.

**Step 2: Run tests to verify they fail**

Run: `npm test -- --watch=false --runInBand --runTestsByPath src/tests/polotno-editor-layout.test.js`

Run: `node --test tests/animations-engine.test.js`

**Step 3: Write minimal implementation**

- Integrar el panel correcto en `PolotnoEditor`.
- Volver recursiva la extraccion del backend.

**Step 4: Run tests to verify they pass**

Run the same commands and confirm green.

### Task 2: Integrar el panel de animaciones en el editor real

**Files:**
- Modify: `client/src/components/PolotnoEditor.tsx`
- Modify: `client/src/components/PolotnoAnimationsPanel.tsx`
- Modify: `client/src/components/PolotnoEditor.css`

**Step 1: Exponer la entrada de animaciones**

- Agregar una accion visible cuando exista seleccion.
- Renderizar `PolotnoAnimationsPanel` dentro del flujo real del editor.

**Step 2: Ajustar el panel al alcance de esta fase**

- Mostrar el estado actual cuando el primer elemento seleccionado ya tenga `custom.animation`.
- Guardar y remover animaciones usando `store.history.transaction`.
- Evitar mensajes que prometan preview dentro del editor.

### Task 3: Hacer recursiva la extraccion del backend

**Files:**
- Modify: `server/utils/animationsEngine.js`

**Step 1: Recorrer el arbol completo**

- Reemplazar el recorrido solo de `firstPage.children` por una caminata recursiva.
- Mantener `elementId`, `elementType` y `animation`.

**Step 2: Preservar compatibilidad**

- No cambiar el contrato de salida actual.

### Task 4: Verificar render y publicacion

**Files:**
- Modify: `server/tests/designs-routes.test.js`

**Step 1: Agregar una prueba de publicacion**

- Confirmar que un contenido con `custom.animation` llega a `renderWithKonva`.
- Confirmar que el HTML regenerado se propaga a pantallas vinculadas en la ruta correspondiente si ya existe cobertura adecuada en el mock.

### Task 5: Verificacion final

**Files:**
- No code changes expected

**Step 1: Run focused client tests**

Run: `npm test -- --watch=false --runInBand --runTestsByPath src/tests/polotno-editor-layout.test.js`

**Step 2: Run focused server tests**

Run: `node --test tests/animations-engine.test.js tests/designs-routes.test.js`

**Step 3: Review the diff**

- Confirmar que el cambio solo toca el flujo `custom.animation`.
- Confirmar que `.tmp-vercel` sigue fuera.
