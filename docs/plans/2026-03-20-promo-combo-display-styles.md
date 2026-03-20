# Promo Combo Display Styles Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agregar estilos visuales seleccionables para bloques de promociones y combos dentro del creador de menus, con preview y render publico consistentes.

**Architecture:** La seleccion se guardara en `block.config.display_style`. Se centralizara el catalogo y la logica de resolucion en un helper compartido para que editor, preview y menu publico usen las mismas reglas. El backend no necesita cambios de contrato porque `config` ya persiste JSON libre.

**Tech Stack:** React, Jest, Testing Library, componentes actuales de Carteleria, config JSON de bloques ya existente.

---

### Task 1: Cubrir selector de estilos en tests

**Files:**
- Modify: `client/src/tests/carteleria-menu-editor.test.js`
- Modify: `client/src/tests/carteleria-menu-preview.test.js`
- Modify: `client/src/tests/carteleria-public-menu.test.js`

**Step 1: Write failing tests**

- Verificar que un bloque `promotion` pueda guardar `config.display_style`
- Verificar que un bloque `combo` pueda guardar `config.display_style`
- Verificar que preview y menu publico muestren señales visuales del estilo elegido

**Step 2: Run tests to verify they fail**

Run: `npm test -- --watch=false --runInBand --runTestsByPath src/tests/carteleria-menu-editor.test.js src/tests/carteleria-menu-preview.test.js src/tests/carteleria-public-menu.test.js`

**Step 3: Implement minimal behavior**

- Agregar catalogo de estilos y selector en el editor
- Usar estilos elegidos en preview y menu publico

**Step 4: Run tests to verify they pass**

Run the same command and confirm green.

### Task 2: Crear helper compartido de estilos

**Files:**
- Create: `client/src/components/Carteleria/shared/promoComboDisplayStyles.js`

**Step 1: Write minimal shared API**

- catalogos de estilos para promociones y combos
- resolucion de estilo final desde `auto`
- helpers para badge principal, urgencia y metadata comercial

**Step 2: Reuse helper from preview and public render**

### Task 3: Agregar selector visual en Menu Editor

**Files:**
- Modify: `client/src/components/Carteleria/Menus/MenuEditorModal.js`

**Step 1: Add display_style defaults**

- `promotion` => `auto`
- `combo` => `auto`

**Step 2: Add gallery picker**

- selector visual con cards/botones
- una grilla para promociones
- una grilla para combos

### Task 4: Aplicar estilos en Preview

**Files:**
- Modify: `client/src/components/Carteleria/Menus/renderMenuPreview.js`

**Step 1: Map selected style to visual emphasis**

- cinta
- sello
- countdown hero
- urgente
- ahorro
- featured/premium/compact

### Task 5: Aplicar estilos en Menu Publico

**Files:**
- Modify: `client/src/components/Carteleria/Public/PublicMenuPage.js`

**Step 1: Reuse same helper**

- mostrar badges y composicion visual segun `display_style`
- respetar countdowns, fechas limite, 2x1 y ahorro

### Task 6: Verificacion

**Files:**
- No code changes expected

**Step 1: Run client tests**

Run: `npm test -- --watch=false --runInBand --runTestsByPath src/tests/carteleria-menu-editor.test.js src/tests/carteleria-menu-preview.test.js src/tests/carteleria-public-menu.test.js`

**Step 2: Run build**

Run: `npm run build`

**Step 3: Manual smoke check**

- abrir creador de menus
- agregar bloque promocion
- cambiar estilo
- verificar preview
- publicar y revisar menu publico
