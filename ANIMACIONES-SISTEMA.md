# 🎬 Sistema de Animaciones en Bucle

## Descripción General

Sistema completo de animaciones para elementos del canvas que funciona tanto en el editor como en el HTML exportado. Todas las animaciones se reproducen en **bucle infinito**.

## ✨ Características

### En el Editor (Canvas)
- **Botón de animaciones** en la toolbar cuando hay un elemento seleccionado
- **Panel de configuración** con presets rápidos y opciones personalizadas
- **Vista previa en tiempo real** de las animaciones aplicadas
- **Indicador visual** de animación activa en el elemento

### En el HTML Exportado
- **Animaciones automáticas** que se aplican al cargar la página
- **Bucle infinito** garantizado para todas las animaciones
- **Sincronización perfecta** con Konva.js
- **Rendimiento optimizado** usando Konva Tween

## 🎨 Tipos de Animaciones Disponibles

### Animaciones de Entrada
- **fadeIn**: Aparece gradualmente
- **slideInLeft**: Desliza desde la izquierda
- **slideInRight**: Desliza desde la derecha
- **slideInUp**: Desliza desde abajo
- **slideInDown**: Desliza desde arriba
- **scaleIn**: Escala hacia adentro
- **bounceIn**: Rebota hacia adentro
- **rotateIn**: Rota hacia adentro

### Animaciones Continuas (Recomendadas para Bucle)
- **pulse**: Pulsa suavemente
- **bounce**: Rebota verticalmente
- **rotate**: Rotación continua 360°
- **swing**: Balancea de lado a lado
- **wobble**: Tambalea con rotación
- **flash**: Parpadea cambiando opacidad
- **shake**: Sacude horizontalmente

## 📋 Cómo Usar

### 1. Aplicar Animación en el Editor

1. Selecciona un elemento en el canvas
2. Haz clic en el botón de **video** (🎬) en la toolbar
3. Selecciona una categoría:
   - **Continuas (Bucle)**: Para animaciones que se repiten infinitamente
   - **Entrada**: Para animaciones de aparición
4. Elige una animación del menú desplegable
5. Ajusta la duración (ms) y el retraso inicial (ms)
6. Haz clic en "Aplicar Animación"

### 2. Usar Presets Rápidos

El panel incluye 4 presets rápidos:
- 💓 **Pulso**: Animación suave de pulsación (2000ms)
- 🏀 **Rebote**: Rebote vertical continuo (1200ms)
- 🔄 **Rotar**: Rotación completa continua (3000ms)
- 🎪 **Balanceo**: Balanceo lateral suave (1000ms)

### 3. Eliminar Animación

Si un elemento tiene una animación activa, verás un indicador verde en el panel. Haz clic en el botón de **basura** (🗑️) para eliminarla.

## 🔧 Arquitectura Técnica

### Frontend (Editor)

#### Archivos Principales
- `client/src/components/PolotnoAnimationsPanel.tsx`: Panel de configuración de animaciones
- `client/src/components/PolotnoEditor.tsx`: Integración del botón de animaciones

#### Almacenamiento
Las animaciones se guardan en el `custom` data del elemento:
```javascript
element.custom = {
  animation: {
    type: 'pulse',
    duration: 2000,
    delay: 0,
    loop: true // Siempre true
  }
}
```

### Backend (Exportación HTML)

#### Archivos Principales
- `server/utils/animationsEngine.js`: Extracción y generación de CSS
- `server/utils/konvaRenderer.js`: Integración en el HTML generado
- `server/public/konva-animations.js`: Motor de animaciones Konva

#### Flujo de Exportación

1. **Extracción**: `extractAnimations()` busca elementos con animaciones en el diseño
2. **CSS**: `generateAnimationKeyframes()` genera los @keyframes necesarios
3. **HTML**: Se inyecta el script de animaciones en el HTML
4. **Inicialización**: Al cargar la página, se aplican las animaciones a los nodos Konva

#### Código de Ejemplo (HTML Generado)
```html
<head>
  <script src="https://unpkg.com/konva@9/konva.min.js"></script>
  <script src="/konva-animations.js"></script>
  <style>
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  </style>
</head>
<body>
  <script>
    // Después de crear el stage...
    window.applyKonvaAnimations(stage, animationsData);
  </script>
</body>
```

## 🎯 Implementación de Bucle Infinito

### En Animaciones Continuas
Las animaciones continuas (pulse, bounce, rotate, etc.) tienen bucle infinito incorporado mediante `onFinish` callbacks:

```javascript
new Konva.Tween({
  node: node,
  duration: durationSec / 2,
  scaleX: originalProps.scaleX * 1.05,
  onFinish: function() {
    new Konva.Tween({
      node: node,
      duration: durationSec / 2,
      scaleX: originalProps.scaleX,
      onFinish: runAnimation // ← Bucle infinito
    }).play();
  }
}).play();
```

### En Animaciones de Entrada
Las animaciones de entrada se ejecutan una vez al cargar, pero pueden configurarse para repetirse si es necesario.

## 🚀 Ventajas del Sistema

1. **Sin romper funcionalidades**: Las animaciones se agregan sin afectar otras características del editor
2. **Persistencia**: Las animaciones se guardan en el JSON del diseño
3. **Rendimiento**: Usa Konva Tween nativo para animaciones fluidas
4. **Flexibilidad**: Fácil agregar nuevos tipos de animaciones
5. **Bucle garantizado**: Todas las animaciones continuas se repiten infinitamente
6. **Sincronización**: Las animaciones se aplican después de que todos los elementos estén cargados

## 📝 Agregar Nuevas Animaciones

### 1. Agregar en el Panel (Frontend)
```typescript
// En PolotnoAnimationsPanel.tsx
const ANIMATION_TYPES = {
  continuous: [
    // ... animaciones existentes
    { value: 'miAnimacion', label: 'Mi Animación', duration: 1500 }
  ]
};
```

### 2. Agregar Keyframes CSS (Backend)
```javascript
// En animationsEngine.js - generateContinuousAnimations()
@keyframes miAnimacion {
  0% { /* estado inicial */ }
  50% { /* estado intermedio */ }
  100% { /* estado final */ }
}
```

### 3. Implementar en Konva (Backend)
```javascript
// En server/public/konva-animations.js
case 'miAnimacion':
  new Konva.Tween({
    node: node,
    duration: durationSec,
    // ... propiedades de la animación
    onFinish: runAnimation // Para bucle infinito
  }).play();
  break;
```

## 🔍 Debugging

### Ver Animaciones en Consola
El sistema registra información útil en la consola del navegador:
```
🎬 Inicializando animaciones con Konva...
✅ Aplicando animación: pulse a elemento element_abc123
```

### Verificar Animaciones en el Diseño
```javascript
// En la consola del navegador
const design = polotnoStore.toJSON();
design.pages[0].children.forEach(child => {
  if (child.custom?.animation) {
    console.log(child.id, child.custom.animation);
  }
});
```

## ⚠️ Notas Importantes

1. **Orden de carga**: Las animaciones se aplican 500ms después de crear el stage para asegurar que todos los elementos estén listos
2. **IDs únicos**: Cada elemento debe tener un `elementId` único para que las animaciones funcionen
3. **Compatibilidad**: Requiere Konva.js 9.x o superior
4. **Rendimiento**: Demasiadas animaciones simultáneas pueden afectar el rendimiento en dispositivos lentos

## 🎉 Resultado Final

Con este sistema, los usuarios pueden:
- ✅ Agregar animaciones fácilmente desde el editor
- ✅ Ver las animaciones en tiempo real en el canvas
- ✅ Exportar diseños con animaciones que funcionan automáticamente
- ✅ Tener animaciones en bucle infinito garantizado
- ✅ Usar presets rápidos para animaciones comunes
- ✅ Personalizar duración y retraso de cada animación

---

**Última actualización**: Sistema completamente funcional y probado
