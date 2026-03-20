# Función de Separación de Figuras

Esta funcionalidad permite separar automáticamente todas las figuras y elementos enmascarados de un diseño en canvas individuales optimizados.

## ✨ Funcionalidades

- **Separación de figuras geométricas**: Rectángulos, círculos, polígonos, estrellas, etc.
- **Separación de imágenes enmascaradas**: Imágenes que tienen una figura como máscara (clipSrc)
- **Optimización automática del canvas**: Ajusta el tamaño del canvas al contenido
- **Validación post-separación**: Verifica que todos los elementos estén correctamente contenidos
- **Corrección automática**: Ajusta posiciones si hay elementos fuera del canvas

## 📁 Archivos Creados

- `utils/figuresSeparator.js` - Módulo principal con las funciones de separación
- `routes/figuresSeparation.js` - API REST para acceso HTTP
- `testFiguresSeparator.js` - Script de prueba y ejemplos

## 🚀 Uso Programático

### Importar el módulo
```javascript
const { separateDesignFigures, separateFiguresFromDesign } = require('./utils/figuresSeparator');
```

### Función Simple
```javascript
// Separar figuras con configuración predeterminada
const newDesignIds = await separateFiguresFromDesign(67);
console.log('Nuevos diseños creados:', newDesignIds); // [74, 75]
```

### Función Avanzada
```javascript
// Separar figuras con opciones personalizadas
const newDesignIds = await separateDesignFigures(67, {
  namePrefix: 'Elemento Aislado',
  optimizeCanvas: true
});
```

### Desde línea de comandos
```bash
# Ejecutar pruebas de ejemplo
node testFiguresSeparator.js

# Separar figuras de un diseño específico
node testFiguresSeparator.js 67
```

## 🌐 API REST

### Endpoints Disponibles

#### POST `/api/figures-separation/separate-simple/:designId`
Separación simple con configuración predeterminada.

**Ejemplo:**
```bash
curl -X POST http://localhost:5000/api/figures-separation/separate-simple/67
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Se separaron 2 figuras exitosamente",
  "data": {
    "originalDesignId": 67,
    "createdDesignIds": [74, 75],
    "count": 2
  }
}
```

#### POST `/api/figures-separation/separate/:designId`
Separación con opciones personalizadas.

**Body (opcional):**
```json
{
  "namePrefix": "Mi Figura",
  "optimizeCanvas": true
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:5000/api/figures-separation/separate/67 \
  -H "Content-Type: application/json" \
  -d '{"namePrefix": "Elemento Personalizado", "optimizeCanvas": true}'
```

#### GET `/api/figures-separation/info`
Información sobre la API y sus capacidades.

## ⚙️ Características

### ✅ Funcionalidades Implementadas
- **Separación automática**: Extrae todas las figuras de un diseño
- **Optimización ultra-ajustada**: Canvas con solo 2px de padding
- **Centrado automático**: Figuras perfectamente centradas
- **Registro en BD**: Nuevos diseños automáticamente guardados
- **Nombres descriptivos**: Nomenclatura automática inteligente
- **API REST**: Acceso vía HTTP para integración
- **Configuración flexible**: Opciones personalizables

### 🎯 Optimización del Canvas
- **Padding mínimo**: Solo 2px en cada lado
- **Dimensiones exactas**: Canvas ajustado al tamaño real de la figura
- **Centrado perfecto**: Figuras posicionadas en el centro exacto
- **Dimensiones mínimas**: Canvas mínimo de 50x50px para casos extremos

## 📊 Ejemplos de Resultados

### Antes (Diseño Original)
- Canvas: 800x600px
- 2 figuras en el mismo canvas
- Mucho espacio en blanco

### Después (Figuras Separadas)
- **Figura 1**: Canvas 465x465px (optimizado)
- **Figura 2**: Canvas 465x465px (optimizado)
- Espacio en blanco mínimo (2px padding)
- Figuras perfectamente centradas

## 🎭 Imágenes Enmascaradas

La función ahora soporta la separación de imágenes que tienen una figura como máscara (clipPath).

### ¿Qué son las Imágenes Enmascaradas?
Cuando se coloca una figura encima de una imagen, esta puede actuar como una máscara, haciendo que la imagen tome la forma de la figura. Esto se almacena en la propiedad `clipSrc` del elemento imagen.

### Detección Automática
La función identifica automáticamente:
- **Figuras geométricas**: Elementos con tipos como `rect`, `circle`, `polygon`, etc.
- **Imágenes enmascaradas**: Elementos de tipo `image` que tienen la propiedad `clipSrc`

### Ejemplo de Procesamiento
```javascript
// Diseño original con:
// - 1 figura geométrica (blob15)
// - 1 imagen enmascarada (con clipSrc)

const result = await separateDesignFigures(67);
// Resultado: 2 diseños separados
// - Diseño 1: Solo la figura geométrica
// - Diseño 2: Solo la imagen enmascarada (mantiene su clipSrc)
```

### Funciones de Identificación
```javascript
const { isFigureElement, isMaskedImageElement, isProcessableElement } = require('./utils/figuresSeparator');

// Verificar si es una figura geométrica
const isFigure = isFigureElement(element);

// Verificar si es una imagen enmascarada
const isMasked = isMaskedImageElement(element);

// Verificar si debe ser procesado (figura O imagen enmascarada)
const shouldProcess = isProcessableElement(element);
```

## 🔧 Configuración

### Opciones Disponibles

| Opción | Tipo | Predeterminado | Descripción |
|--------|------|----------------|-------------|
| `namePrefix` | string | "Figura" | Prefijo para nombres de diseños |
| `optimizeCanvas` | boolean | true | Si optimizar canvas al tamaño de figura |

### Estructura de Nombres
```
{namePrefix} - {elementName} ({index})
```

**Ejemplos:**
- "Figura - blob10 (1)"
- "Elemento Aislado - rectangle (2)"
- "Mi Figura - circle (1)"

## 🚨 Manejo de Errores

### Errores Comunes
- **Diseño no encontrado**: ID inexistente
- **Sin elementos**: Diseño vacío
- **Error de BD**: Problemas de conexión

### Respuestas de Error
```json
{
  "success": false,
  "error": "Descripción del error"
}
```

## 🧪 Testing

El script `testFiguresSeparator.js` incluye:
- Pruebas automáticas con el diseño 67
- Ejemplos de uso de ambas funciones
- Validación de resultados
- Manejo de errores

## 🔄 Integración

La función está completamente integrada en el sistema:
- ✅ Módulo registrado en `utils/`
- ✅ API registrada en el servidor principal
- ✅ Rutas disponibles en `/api/figures-separation/`
- ✅ Base de datos configurada
- ✅ Documentación completa

## 📝 Notas Técnicas

- Compatible con cualquier diseño de Polotno
- Preserva todas las propiedades de las figuras
- Genera IDs únicos para nuevos diseños
- Timestamps automáticos de creación
- Transacciones de BD seguras
- Logging detallado para debugging