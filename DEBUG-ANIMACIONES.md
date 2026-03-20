# 🐛 Guía de Debug - Animaciones

## Problema Actual

Las animaciones se configuran pero no se visualizan en el canvas ni en el HTML.

## Pasos de Debug

### 1. Verificar que el sistema está cargado

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Verificar que el store está disponible
console.log('Store:', window.polotnoStore);

// Verificar que el script de debug está cargado
console.log('Test function:', typeof window.testAnimation);
```

**Resultado esperado:**
- `Store:` debe mostrar el objeto del store de Polotno
- `Test function:` debe mostrar `"function"`

### 2. Seleccionar un elemento y aplicar animación

1. En el editor, agrega un elemento (texto o forma)
2. Selecciona el elemento
3. Abre el panel de animaciones (botón 🎬)
4. Aplica una animación (ej: Pulso)
5. Observa la consola

**Mensajes esperados en consola:**
```
✅ Aplicando animación en canvas: pulse a elemento element_xxx
```

**Si ves:**
```
⚠️ Stage de Konva no disponible en el DOM
```
→ El problema es que no se puede acceder al stage

**Si ves:**
```
⚠️ Nodo Konva no encontrado para elemento: element_xxx
IDs disponibles: [...]
```
→ El problema es que el ID del elemento no coincide con el ID del nodo Konva

### 3. Probar animación manualmente

En la consola, ejecuta:

```javascript
// Selecciona un elemento en el canvas primero
window.testAnimation();
```

**Resultado esperado:**
- El elemento seleccionado debe animarse (escalar)
- Deberías ver mensajes en consola indicando el progreso

**Si funciona:**
✅ El acceso al stage de Konva está funcionando
→ El problema está en cómo se están guardando/aplicando las animaciones

**Si NO funciona:**
❌ Hay un problema con el acceso al stage de Konva
→ Necesitamos otro método para acceder al stage

### 4. Verificar que las animaciones se guardan

```javascript
// Ver el primer elemento de la página
const element = window.polotnoStore.activePage.children[0];
console.log('Elemento:', element);
console.log('Custom data:', element.custom);
console.log('Animación:', element.custom?.animation);
```

**Resultado esperado:**
```javascript
{
  type: "pulse",
  duration: 2000,
  delay: 0,
  loop: true
}
```

### 5. Verificar el HTML exportado

1. Publica un diseño con animaciones
2. Abre la URL del diseño publicado
3. Abre la consola (F12)
4. Busca estos mensajes:

```
🎬 Aplicando X animación(es) con Konva...
✅ Aplicando animación: pulse a elemento element_xxx
```

**Si NO ves estos mensajes:**
- Verifica que `/konva-animations.js` se está cargando
- Abre `http://localhost:5000/konva-animations.js` en el navegador
- Debe mostrar el código JavaScript

## Soluciones Comunes

### Problema: Stage no disponible

**Solución 1:** Esperar más tiempo
```typescript
// En canvasAnimations.ts, aumentar el timeout
setTimeout(() => {
  applyCanvasAnimation(store, element.id, animationConfig);
}, 500); // Aumentar de 100 a 500
```

**Solución 2:** Usar un observer
```typescript
// Esperar a que el canvas esté listo
const waitForCanvas = () => {
  return new Promise((resolve) => {
    const check = () => {
      const canvas = document.querySelector('.konvajs-content canvas');
      if (canvas && canvas._konva) {
        resolve(canvas._konva);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};
```

### Problema: IDs no coinciden

**Verificar IDs:**
```javascript
// En consola
const element = window.polotnoStore.selectedElements[0];
console.log('ID del elemento:', element.id);

const canvas = document.querySelector('.konvajs-content canvas');
const stage = canvas._konva;
const allNodes = stage.find('*');
console.log('IDs de nodos:', allNodes.map(n => n.id() || n.getAttr('id')));
```

**Si los IDs no coinciden:**
- Polotno puede estar usando un formato diferente para los IDs
- Necesitamos buscar por otro atributo

### Problema: Konva no está disponible

**Verificar:**
```javascript
console.log('Konva:', window.Konva);
```

**Si es undefined:**
- Polotno incluye Konva internamente
- Necesitamos importarlo correctamente

## Información del Sistema

### Acceso al Stage de Konva

Polotno usa Konva internamente pero no expone el stage directamente. Métodos para acceder:

1. **Desde el DOM:**
```javascript
const canvas = document.querySelector('.konvajs-content canvas');
const stage = canvas._konva;
```

2. **Desde el store (si está disponible):**
```javascript
const stage = window.polotnoStore.stage;
```

3. **Desde un nodo:**
```javascript
const node = /* obtener nodo */;
const stage = node.getStage();
```

### Estructura de Nodos

Polotno crea una jerarquía de nodos de Konva:
```
Stage
└── Layer
    └── Group (por cada elemento)
        └── Shape/Text/Image
```

Los IDs pueden estar en:
- El Group
- El Shape/Text/Image interno
- Ambos

## Próximos Pasos

1. Ejecuta los pasos de debug en orden
2. Anota qué mensajes ves en la consola
3. Comparte los resultados para identificar el problema exacto

---

**Última actualización:** Debug en progreso
