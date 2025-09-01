# Exportación Automática SVG para Figuras Separadas

## Descripción

Este sistema permite separar figuras de un diseño y exportar automáticamente cada figura individual a archivos SVG, todo de forma programática y sin intervención del usuario.

## Características Principales

### 🔄 Separación Automática
- Separa figuras de un diseño original usando el sistema interno
- Crea nuevos diseños internos para cada figura separada
- Los diseños internos no aparecen en la lista del frontend

### 📤 Exportación SVG
- Exporta automáticamente cada figura separada a un archivo SVG
- Utiliza Puppeteer y el editor interno para generar los SVGs
- Guarda los archivos en el directorio `server/exports/`
- Nombres de archivo únicos con timestamp
- Limpieza automática de diseños temporales después de exportación exitosa

### 🎯 Proceso Completo

1. **Entrada**: ID del diseño original
2. **Separación**: Crea diseños internos para cada figura
3. **Exportación**: Genera archivos SVG individuales
4. **Limpieza**: Elimina automáticamente los canvas individuales
5. **Resultado**: Archivos SVG listos para usar

## Archivos del Sistema

### Utilidades Principales
- `server/utils/autoSvgExporter.js` - Clase principal del exportador automático
- `server/utils/figuresSeparator.js` - Funciones de separación interna

### API REST
- `server/routes/autoSvgExport.js` - Endpoints de la API
- Rutas disponibles:
  - `POST /api/auto-svg-export/separate-and-export/:designId`
  - `POST /api/auto-svg-export/quick/:designId`
  - `GET /api/auto-svg-export/info`

### Scripts de Prueba
- `server/testAutoSvgExport.js` - Pruebas completas del sistema
- `server/demoAutoSvgExport.js` - Demostración de la funcionalidad

## Uso Programático

### Importar el Exportador
```javascript
const autoSvgExporter = require('./utils/autoSvgExporter');
```

### Separar y Exportar
```javascript
// Exportación básica
const result = await autoSvgExporter.separateAndExportToSVG(designId);

// Exportación con opciones personalizadas
const result = await autoSvgExporter.separateAndExportToSVG(designId, {
  namePrefix: 'Mi Figura',
  exportPrefix: 'mi-export'
});

// Exportación rápida
const result = await autoSvgExporter.autoSeparateAndExport(designId);
```

### Resultado de la Exportación
```javascript
{
  success: true,
  originalDesignId: 67,
  separatedDesignIds: [464, 465],
  exportResults: [
    {
      success: true,
      designId: 464,
      filename: 'figura-1.svg',
      filepath: '/path/to/exports/figura-1.svg',
      svgData: '<svg>...</svg>'
    }
  ],
  statistics: {
    totalSeparated: 2,
    successfulExports: 2,
    failedExports: 0,
    successRate: '100.0%'
  }
}
```

## Uso via API REST

### Exportación Rápida
```bash
curl -X POST http://localhost:5000/api/auto-svg-export/quick/67
```

### Exportación Personalizada
```bash
curl -X POST http://localhost:5000/api/auto-svg-export/separate-and-export/67 \
  -H "Content-Type: application/json" \
  -d '{
    "namePrefix": "Mi Figura",
    "exportPrefix": "custom-export"
  }'
```

### Información de la API
```bash
curl http://localhost:5000/api/auto-svg-export/info
```

## Ejecutar Demostraciones

### Demostración Completa
```bash
node server/demoAutoSvgExport.js
```

### Pruebas del Sistema
```bash
node server/testAutoSvgExport.js
```

## Directorio de Exportación

Todos los archivos SVG se guardan en:
```
server/exports/
```

### Formato de Nombres de Archivo
- Formato: `{prefix}-{originalId}-figura-{numero}-{timestamp}.svg`
- Ejemplo: `demo-figura-67-figura-1-1756670683321.svg`

## Características Técnicas

### Tecnologías Utilizadas
- **Puppeteer**: Navegador headless para renderizado
- **Polotno**: Editor de diseño para generar SVGs
- **SQLite**: Base de datos para gestión de diseños
- **Express**: API REST

### Configuración del Navegador
- Modo headless para mejor rendimiento
- Configuración optimizada para servidores
- Manejo de errores robusto
- Limpieza automática del navegador después de exportación

### Gestión de Diseños Internos
- Los diseños separados se marcan como internos (`is_internal = 1`)
- No aparecen en las listas públicas del frontend
- Accesibles solo via endpoints administrativos
- Eliminación automática de canvas individuales después de exportación exitosa
- Optimización de base de datos con limpieza automática de diseños temporales

## Ventajas del Sistema

1. **Automatización Completa**: Sin intervención manual requerida
2. **Escalabilidad**: Puede procesar múltiples diseños
3. **Flexibilidad**: API REST y uso programático
4. **Organización**: Archivos con nombres únicos y organizados
5. **Integración**: Se integra con el sistema existente de separación
6. **Transparencia**: Logs detallados del proceso
7. **Optimización de Recursos**: Limpieza automática de diseños temporales
8. **Gestión de Espacio**: Eliminación automática de canvas individuales
9. **Eficiencia de Base de Datos**: Previene acumulación de diseños internos

## Casos de Uso

- **Procesamiento en Lote**: Exportar múltiples diseños automáticamente
- **Integración con Workflows**: Parte de pipelines de procesamiento
- **Backup Automático**: Generar copias SVG de diseños
- **Distribución**: Crear archivos individuales para distribución
- **Análisis**: Procesar diseños para análisis posterior

## Monitoreo y Logs

El sistema proporciona logs detallados:
- ✅ Operaciones exitosas
- ❌ Errores y fallos
- 📊 Estadísticas de rendimiento
- 🎯 Progreso del proceso

## Mantenimiento

### Limpieza de Archivos
Los archivos SVG se acumulan en `server/exports/`. Se recomienda implementar limpieza periódica según las necesidades.

### Monitoreo de Rendimiento
- Verificar uso de memoria con Puppeteer
- Monitorear tiempo de procesamiento
- Revisar logs de errores regularmente

---

**Nota**: Esta funcionalidad complementa el sistema de separación interna existente, agregando capacidades de exportación automática para un flujo de trabajo completo.