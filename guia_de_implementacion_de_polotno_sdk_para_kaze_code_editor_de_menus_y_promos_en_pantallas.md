# Guía de implementación de Polotno SDK para KazeCode

**Objetivo:** Integrar un editor visual (tipo Canva) basado en **Polotno SDK** dentro del sistema de menús/promociones de KazeCode y conectarlo con un **player fullscreen** para televisores/monitores. Incluye instalación, arquitectura, ejemplos, buenas prácticas, solución de errores visuales y publicación a imagen/JSON.

---

## 1) Qué es Polotno y cuándo usarlo

- **Polotno SDK**: librería comercial (React + Konva) para embutir un editor completo en tu app.
- **Polotno Studio**: app open source de ejemplo (sirve para aprender/potar UI, no sustituye la licencia del SDK en producción).
- **Cuándo usarlo**: cuando necesitás lanzar rápido un editor con capas, texto, imágenes, undo/redo, export, paneles y extensibilidad.

> **Licencia**: Dev/trials gratis; producción requiere plan (Team/Business). El costo es **por aplicación/dominio**, NO por usuario final.

---

## 2) Arquitectura recomendada (alto nivel)

**Módulos**

1. **Admin (dashboard)**: Editor embebido (Polotno) para crear/editar diseños.
2. **API**: Persistencia de JSON/miniaturas; endpoint de publicación; opcional WebSocket para avisos en vivo.
3. **Player**: Ruta pública `/player/:screenId` que muestra imagen/JSON a pantalla completa en la TV/monitor.

**Modelo de datos**

- `designs(id, name, json, thumbnailUrl, updatedAt)`
- `screens(id, name, width, height, orientation, designId, version)`
- `publications(id, designId, screenId, imageUrl, jsonSnapshot, version, createdAt)`

---

## 3) Instalación y arranque mínimo

```bash
npm install polotno react react-dom
```

```tsx
// src/editor/EditorApp.tsx
import { createDemoApp } from 'polotno/polotno-app'

export function mountPolotno(container: HTMLElement, apiKey?: string) {
  const { store, app } = createDemoApp({
    container,
    key: apiKey || process.env.NEXT_PUBLIC_POLOTNO_KEY,
  })
  return { store, app }
}
```

```tsx
// src/pages/editor/[designId].tsx (Next.js) – versión básica
import { useEffect, useRef } from 'react'
import { mountPolotno } from '@/editor/EditorApp'

export default function EditorPage() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const { store } = mountPolotno(ref.current)

    // Carga inicial
    fetch('/api/designs/123').then(r => r.json()).then(d => store.loadJSON(d.json))

    // Auto-guardado (usar debounce en real)
    const unsub = store.on('change', () => {
      const json = store.toJSON()
      fetch('/api/designs/123', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json })
      })
    })
    return () => unsub?.()
  }, [])
  return <div style={{ height: '100vh' }} ref={ref} />
}
```

**Claves de entorno**

- `NEXT_PUBLIC_POLOTNO_KEY` (si corresponde a la licencia/clave del SDK).
- Asegurar que el editor se sirve en el dominio autorizado por el plan.

---

## 4) Mapeo a pantallas (TVs) y composiciones

- **Cada TV = una Page** en Polotno (`width`, `height`, `orientation`).
- **Diseños extendidos (2+ TVs contiguas)**:
  - Opción A: una Page “grande” (p. ej. 3840×1080) + crop por pantalla al publicar.
  - Opción B: varias Pages y reglas de posición; menos flexible para cruzar bordes.

Crear una Page:

```ts
const page = store.addPage({ width: 1920, height: 1080, background: 'black' })
store.currentPage = page
```

---

## 5) Personalización de UI que pediste

**Panel izquierdo en dos secciones**

- **Arriba: Paleta** (Texto, Imagen URL/subida, Forma, Contenedor, QR) → arrastrar al lienzo.
- **Abajo: Capas (árbol)** con jerarquía por `z-index` (más arriba = mayor prioridad). Funciones: renombrar, ocultar, bloquear, duplicar, eliminar, drag&drop para reordenar y anidar en **grupos**.

**Panel derecho (Propiedades)**

- **General**: posición (x/y), tamaño (w/h), rotación, opacidad, visibilidad, lock, z-index.
- **Fondo** de la composición: sólido, gradiente linear/radial (stops), imagen (fit/pos/opacidad/blur).
- **Animaciones** por elemento: fade/slide/scale/rotate/pulse/bounce/marquee/motionPath con `duration`, `delay`, `easing`, `repeat`, `direction`, `autoplay`. *Para exportar video, usar Cloud Render; para runtime, animar en el Player.*

**Máscaras (clip/mask)**

- Acción “Crear máscara” combinando **forma + imagen/contenedor**. Editar/invertir y mantener undo/redo.

**Atajos**

- Ctrl/Cmd+C/V/X, Supr, Alt+drag (duplicar), Shift (proporción), Flechas (nudge 1px) y Shift+Flechas (10px), Ctrl/Cmd+G (agrupar), Ctrl/Cmd+Shift+G (desagrupar), F2 (renombrar), Space (pan).

---

## 6) Persistencia, export y publicación

**Guardar diseño**

```ts
const json = store.toJSON()
const thumb = await store.saveAsDataURL({ pixelRatio: 0.2 })
await fetch('/api/designs/:id', {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ json, thumbnail: thumb })
})
```

**Cargar diseño**

```ts
store.loadJSON(json)
```

**Publicar a PNG (simple y robusto)**

```ts
const png = await store.saveAsDataURL({ pixelRatio: 1 }) // 1:1 nativo
await fetch('/api/publish', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ designId, png })
})
```

**Composición extendida**

- Exportás PNG “grande” y en backend hacés **crop** para cada TV:
  - TV1: `(0, 0, 1920, 1080)`
  - TV2: `(1920, 0, 1920, 1080)`

**Player fullscreen**

- Ruta `/player/:screenId` que llama `GET /api/screens/:id/live` → `{ imageUrl, version }` y muestra un `<img>` fullscreen con `object-fit: cover`.
- Polling cada 15s + (opcional) WebSocket para actualizaciones instantáneas.

---

## 7) Player dinámico (JSON) para animaciones

- Alternativa al PNG: el Player carga `jsonSnapshot` y renderiza con Konva (read-only) aplicando animaciones (slide, fade, marquee, etc.).
- Ventaja: dinamismo; Contras: más CPU/GPU en la TV. Recomendado solo si necesitás movimiento o datos en vivo.

---

## 8) Buenas prácticas de estilo (evitar glitches visuales)

Los **errores visuales** (íconos encimados, tipografías raras, espaciados rotos) suelen venir de **conflictos CSS** (Tailwind/global resets) y de **carga de fuentes/íconos**.

**Checklist CSS**

1. **Aísla** el editor en un contenedor con `all: initial;` o un **Shadow DOM** (si tu app mete resets globales). Alternativa: añade un **namespace CSS** para el editor y evita clases globales.
2. **box-sizing**: asegurar `box-sizing: border-box;` dentro del editor.
3. **line-height** y **font-family**: no sobreescalar. Define explícito en el contenedor del editor para que no herede un `line-height` global.
4. **Iconos**: si tu proyecto usa otra librería de íconos (Font Awesome, etc.), puede colisionar. Cargá iconos del editor namespaced o usa SVG inline.
5. **Tailwind**: desactiva `preflight` dentro del ámbito del editor o utiliza un layout wrapper que neutralice ese reset.
6. **Scroll/overflow**: el workspace debe controlar su propio scroll; evita `overflow: hidden` en ancestros.
7. **Z-index**: tooltips/menus del editor requieren contexto; define un stacking context claro (`position: relative` + `z-index` del wrapper) para evitar que queden detrás de tu layout.

**Fuentes (Google Fonts)**

- Precargar las familias usadas por los usuarios para evitar saltos FOUT (Flash Of Unstyled Text). Usa `rel="preconnect"` y `display=swap`.

**Render/escala**

- Para miniaturas usa `pixelRatio: 0.2–0.5`; para publicación 1–2 según nitidez y tamaño objetivo.

---

## 9) Next.js / SSR – Notas

- Renderiza el editor **solo en cliente** (chequear `window` antes de montar).
- Si usás `app/` router, crea un **Client Component** para el editor.
- Evita hidratar componentes de Polotno en SSR para no romper estilos/medidas.

---

## 10) Cloud Rendering y polotno-node

- **Cloud Render**: servicio de Polotno para export masivo de imágenes o **video** (si necesitás MP4 para animaciones).
- **polotno-node**: render desde tu servidor (control total; más trabajo de infra).
- Estrategia: empezar con **export en cliente** para PNG y pasar a Cloud Render si escalás.

---



