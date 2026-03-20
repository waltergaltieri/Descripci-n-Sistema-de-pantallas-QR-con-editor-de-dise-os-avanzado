const fs = require('fs');
const path = require('path');
const { db } = require('../config/database');

/**
 * Identifica si un elemento es una figura/forma geométrica
 * @param {Object} element - Elemento a evaluar
 * @returns {boolean} - true si es una figura, false si no
 */
function isFigureElement(element) {
  if (!element || !element.type) {
    return false;
  }
  
  // Tipos de elementos que consideramos figuras/formas
  const figureTypes = [
    'rect',           // Rectángulos
    'circle',         // Círculos
    'ellipse',        // Elipses
    'triangle',       // Triángulos
    'polygon',        // Polígonos
    'star',           // Estrellas
    'arrow',          // Flechas
    'line',           // Líneas
    'path',           // Paths/trazos
    'shape'           // Formas genéricas
  ];
  
  // Verificar tipo directo
  if (figureTypes.includes(element.type)) {
    return true;
  }
  
  // Verificar si tiene propiedades de forma geométrica
  if (element.type === 'group' && element.children) {
    // Si es un grupo, verificar si contiene solo figuras
    return element.children.every(child => isFigureElement(child));
  }
  
  // Excluir explícitamente elementos que NO son figuras
  const nonFigureTypes = [
    'text',           // Texto
    'textbox',        // Cajas de texto
    'image',          // Imágenes
    'svg',            // SVGs complejos
    'video',          // Videos
    'audio',          // Audio
    'iframe',         // iFrames
    'qr',             // Códigos QR
    'barcode'         // Códigos de barras
  ];
  
  if (nonFigureTypes.includes(element.type)) {
    return false;
  }
  
  // Si no está en ninguna lista, verificar propiedades geométricas básicas
  return element.hasOwnProperty('width') && 
         element.hasOwnProperty('height') && 
         element.hasOwnProperty('x') && 
         element.hasOwnProperty('y');
}

/**
 * Identifica si un elemento es una imagen enmascarada por una figura
 * @param {Object} element - Elemento a evaluar
 * @returns {boolean} - true si es una imagen con máscara de figura, false si no
 */
function isMaskedImageElement(element) {
  if (!element || element.type !== 'image') {
    return false;
  }
  
  // Verificar si tiene clipSrc (máscara)
  return element.clipSrc && element.clipSrc.trim() !== '';
}

/**
 * Identifica si un elemento debe ser procesado por el separador de figuras
 * Incluye tanto figuras normales como imágenes enmascaradas por figuras
 * @param {Object} element - Elemento a evaluar
 * @returns {boolean} - true si debe ser procesado, false si no
 */
function isProcessableElement(element) {
  return isFigureElement(element) || isMaskedImageElement(element);
}

/**
 * Calcula el bounding box exacto de un elemento
 */
function calculateElementBounds(element) {
  const { x = 0, y = 0, width = 0, height = 0 } = element;
  
  // Obtener transformaciones del objeto transform si existe
  const transform = element.transform || {};
  const rotation = transform.rotation || element.rotation || 0;
  const scaleX = transform.scaleX || element.scaleX || 1;
  const scaleY = transform.scaleY || element.scaleY || 1;
  const skewX = transform.skewX || element.skewX || 0;
  const skewY = transform.skewY || element.skewY || 0;
  
  // Aplicar escalado
  const scaledWidth = width * Math.abs(scaleX);
  const scaledHeight = height * Math.abs(scaleY);
  
  // Si no hay transformaciones, usar cálculo simple
  if (rotation === 0 && skewX === 0 && skewY === 0) {
    return {
      minX: x,
      minY: y,
      maxX: x + scaledWidth,
      maxY: y + scaledHeight,
      width: scaledWidth,
      height: scaledHeight
    };
  }
  
  // Para elementos transformados, calcular las 4 esquinas transformadas
  const rotRad = (rotation * Math.PI) / 180;
  const skewXRad = (skewX * Math.PI) / 180;
  const skewYRad = (skewY * Math.PI) / 180;
  
  // Centro del elemento (punto de transformación)
  const centerX = x + scaledWidth / 2;
  const centerY = y + scaledHeight / 2;
  
  // Las 4 esquinas relativas al centro
  const corners = [
    { x: -scaledWidth / 2, y: -scaledHeight / 2 }, // top-left
    { x: scaledWidth / 2, y: -scaledHeight / 2 },  // top-right
    { x: scaledWidth / 2, y: scaledHeight / 2 },   // bottom-right
    { x: -scaledWidth / 2, y: scaledHeight / 2 }   // bottom-left
  ];
  
  // Aplicar todas las transformaciones a cada esquina
  const transformedCorners = corners.map(corner => {
    let { x: cx, y: cy } = corner;
    
    // Aplicar skew
    const skewedX = cx + cy * Math.tan(skewXRad);
    const skewedY = cy + cx * Math.tan(skewYRad);
    
    // Aplicar rotación
    const cos = Math.cos(rotRad);
    const sin = Math.sin(rotRad);
    const rotatedX = skewedX * cos - skewedY * sin;
    const rotatedY = skewedX * sin + skewedY * cos;
    
    // Convertir a coordenadas absolutas
    return {
      x: centerX + rotatedX,
      y: centerY + rotatedY
    };
  });
  
  // Encontrar el bounding box que contiene todas las esquinas transformadas
  const minX = Math.min(...transformedCorners.map(c => c.x));
  const minY = Math.min(...transformedCorners.map(c => c.y));
  const maxX = Math.max(...transformedCorners.map(c => c.x));
  const maxY = Math.max(...transformedCorners.map(c => c.y));
  
  return {
    minX: minX,
    minY: minY,
    maxX: maxX,
    maxY: maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Optimiza las dimensiones del canvas con padding ultra-mínimo
 */
function optimizeCanvasForElement(designContent, originalElement) {
  if (!designContent.pages || !designContent.pages[0]) {
    return designContent;
  }

  const page = designContent.pages[0];
  
  // Crear una copia profunda del elemento para preservar todas sus propiedades originales
  const elementCopy = JSON.parse(JSON.stringify(originalElement));
  
  // Mantener solo el elemento copiado
  if (page.children) {
    page.children = [elementCopy];
  } else {
    page.objects = [elementCopy];
  }
  
  // Calcular bounding box del elemento
  const bounds = calculateElementBounds(elementCopy);
  
  // Calcular ratio de aspecto para detectar figuras muy alargadas
  const aspectRatio = Math.max(bounds.width, bounds.height) / Math.min(bounds.width, bounds.height);
  
  // Padding uniforme para todos los elementos (sin distinción por rotación)
  let padding = 2;
  
  // Ajustar padding según ratio de aspecto para figuras alargadas
  if (aspectRatio > 15) {
    // Líneas muy delgadas - padding ultra-mínimo
    padding = Math.max(0.3, padding * 0.2);
  } else if (aspectRatio > 10) {
    // Figuras muy alargadas
    padding = Math.max(0.4, padding * 0.3);
  } else if (aspectRatio > 5) {
    // Figuras alargadas
    padding = Math.max(0.5, padding * 0.5);
  }
  
  // CORRECCIÓN CRÍTICA: Primero posicionar el elemento en (0,0) y luego calcular canvas
  // Esto asegura que el elemento esté siempre dentro del canvas
  
  // Mover el elemento para que su bounding box comience en (padding, padding)
  const offsetX = padding - bounds.minX;
  const offsetY = padding - bounds.minY;
  
  // Aplicar el offset al elemento
  elementCopy.x = elementCopy.x + offsetX;
  elementCopy.y = elementCopy.y + offsetY;
  
  // Recalcular bounds después del movimiento
  const adjustedBounds = calculateElementBounds(elementCopy);
  
  // Calcular dimensiones del canvas basadas en el elemento ya posicionado
  const canvasWidth = Math.round(adjustedBounds.maxX + padding);
  const canvasHeight = Math.round(adjustedBounds.maxY + padding);
  
  // Ahora centrar el elemento en el canvas calculado
  const targetCenterX = canvasWidth / 2;
  const targetCenterY = canvasHeight / 2;
  
  const currentCenterX = adjustedBounds.minX + (adjustedBounds.width / 2);
  const currentCenterY = adjustedBounds.minY + (adjustedBounds.height / 2);
  
  const centerOffsetX = targetCenterX - currentCenterX;
  const centerOffsetY = targetCenterY - currentCenterY;
  
  // Aplicar centrado final
  elementCopy.x = elementCopy.x + centerOffsetX;
  elementCopy.y = elementCopy.y + centerOffsetY;
  
  // Verificación final: asegurar que el elemento esté completamente dentro del canvas
  const finalBounds = calculateElementBounds(elementCopy);
  
  // Si aún hay problemas, ajustar canvas o posición
  let finalWidth = canvasWidth;
  let finalHeight = canvasHeight;
  
  if (finalBounds.minX < 0) {
    elementCopy.x = elementCopy.x - finalBounds.minX + 1;
    finalWidth = Math.max(finalWidth, finalBounds.maxX - finalBounds.minX + 2);
  }
  
  if (finalBounds.minY < 0) {
    elementCopy.y = elementCopy.y - finalBounds.minY + 1;
    finalHeight = Math.max(finalHeight, finalBounds.maxY - finalBounds.minY + 2);
  }
  
  if (finalBounds.maxX > finalWidth) {
    finalWidth = Math.round(finalBounds.maxX + 1);
  }
  
  if (finalBounds.maxY > finalHeight) {
    finalHeight = Math.round(finalBounds.maxY + 1);
  }
  
  // Establecer dimensiones finales del canvas
  page.width = finalWidth;
  page.height = finalHeight;
   
   return designContent;
}

/**
 * Separa todas las figuras de un diseño en canvas individuales
 * @param {number} designId - ID del diseño a procesar
 * @param {Object} options - Opciones de configuración
 * @param {string} options.namePrefix - Prefijo para los nombres de los nuevos diseños
 * @param {boolean} options.optimizeCanvas - Si optimizar el canvas al tamaño de la figura
 * @returns {Promise<Array>} Array con los IDs de los nuevos diseños creados
 */
async function separateDesignFigures(designId, options = {}) {
  const {
    namePrefix = 'Figura separada',
    optimizeCanvas = true
  } = options;

  try {
    // Conectar a la base de datos
    const database = db();

    // Obtener el diseño original
    const originalDesign = await database.get(
      'SELECT id, name, content FROM designs WHERE id = ?',
      [designId]
    );

    if (!originalDesign) {
      throw new Error(`Diseño con ID ${designId} no encontrado`);
    }

    const originalContent = JSON.parse(originalDesign.content);
    
    if (!originalContent.pages || !originalContent.pages[0]) {
      throw new Error('El diseño no contiene páginas válidas');
    }

    const page = originalContent.pages[0];
    const allElements = page.children || page.objects || [];
    
    if (!allElements || allElements.length === 0) {
      throw new Error('El diseño no contiene elementos válidos');
    }
    
    // Filtrar elementos que son figuras/formas o imágenes enmascaradas
    const processableElements = allElements.filter(element => isProcessableElement(element));
    const figureElements = allElements.filter(element => isFigureElement(element));
    const maskedImageElements = allElements.filter(element => isMaskedImageElement(element));
    
    if (processableElements.length === 0) {
      throw new Error('El diseño no contiene figuras o imágenes enmascaradas para separar. Solo se encontraron elementos de texto, imágenes simples u otros tipos no geométricos.');
    }

    console.log(`Encontrados ${allElements.length} elementos totales:`);
    console.log(`  - ${figureElements.length} figuras geométricas`);
    console.log(`  - ${maskedImageElements.length} imágenes enmascaradas`);
    console.log(`  - ${processableElements.length} elementos procesables en total`);
    console.log(`Separando ${processableElements.length} elementos del diseño "${originalDesign.name}" (ID: ${designId})`);
    
    const createdDesignIds = [];
    
    // Procesar cada elemento (figuras e imágenes enmascaradas)
    for (let i = 0; i < processableElements.length; i++) {
      const element = processableElements[i];
      
      // Crear una copia del contenido original
      const newContent = JSON.parse(JSON.stringify(originalContent));
      
      // Crear nombre descriptivo usando el ID del elemento original
      const elementId = element.id || `${element.type}-${i + 1}`;
      const elementName = element.name || elementId;
      const designName = `${namePrefix} - ${elementId}`;
      
      // Crear una copia del elemento sin rotación
      const elementWithoutRotation = JSON.parse(JSON.stringify(element));
      
      // Eliminar completamente la rotación para evitar problemas de posicionamiento
      elementWithoutRotation.rotation = 0;
      if (elementWithoutRotation.transform) {
        elementWithoutRotation.transform.rotation = 0;
      }
      if (elementWithoutRotation.angle) {
        elementWithoutRotation.angle = 0;
      }
      
      // Optimizar canvas si está habilitado
      if (optimizeCanvas) {
        optimizeCanvasForElement(newContent, elementWithoutRotation);
      } else {
        // Solo mantener el elemento actual sin rotación
        const newPage = newContent.pages[0];
        if (newPage.children) {
          newPage.children = [elementWithoutRotation];
        } else {
          newPage.objects = [elementWithoutRotation];
        }
      }
      
      // Insertar nuevo diseño en la base de datos
      const result = await database.run(
        `INSERT INTO designs (name, description, content, thumbnail, created_at, updated_at) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          designName,
          `Figura separada automáticamente del diseño "${originalDesign.name}"`,
          JSON.stringify(newContent),
          null // thumbnail se puede generar después si es necesario
        ]
      );
      
      createdDesignIds.push(result.lastID);
      
      console.log(`✅ Creado: ${designName} (ID: ${result.lastID})`);
    }
    
    
    console.log(`\n🎯 Separación completada. Se crearon ${createdDesignIds.length} nuevos diseños.`);
    console.log(`IDs de los nuevos diseños: ${createdDesignIds.join(', ')}`);
    
    // Ejecutar validación post-separación automáticamente
    console.log(`\n🔍 Ejecutando validación post-separación...`);
    try {
      const { validateAndFixDesign } = require('./postSeparationValidator');
      
      let totalIssuesFound = 0;
      let totalIssuesFixed = 0;
      
      for (const designId of createdDesignIds) {
        const validationResult = await validateAndFixDesign(designId, true);
        
        if (validationResult.issues && validationResult.issues.length > 0) {
          totalIssuesFound += validationResult.issues.length;
          
          if (validationResult.fixed) {
            totalIssuesFixed += validationResult.issues.length;
            console.log(`✅ Corregido: ${validationResult.designName} (${validationResult.issues.length} problemas)`);
          } else {
            console.log(`⚠️  Problemas detectados en: ${validationResult.designName} (${validationResult.issues.length} problemas)`);
          }
        }
      }
      
      if (totalIssuesFound > 0) {
        console.log(`\n📊 Validación completada: ${totalIssuesFixed}/${totalIssuesFound} problemas corregidos automáticamente`);
      } else {
        console.log(`\n✅ Validación completada: Todas las figuras están correctamente contenidas`);
      }
      
    } catch (validationError) {
      console.warn(`⚠️  Error en validación post-separación: ${validationError.message}`);
      console.warn(`Los diseños fueron creados exitosamente, pero la validación falló.`);
    }
    
    return createdDesignIds;
    
  } catch (error) {
    console.error('Error en separateDesignFigures:', error);
    throw error;
  }
}

/**
 * Separa figuras usando el editor interno (sin interfaz visible)
 * @param {number} designId - ID del diseño a procesar
 * @param {Object} options - Opciones de configuración
 * @param {string} options.namePrefix - Prefijo para los nombres de los nuevos diseños
 * @param {boolean} options.optimizeCanvas - Si optimizar el canvas al tamaño de la figura
 * @param {boolean} options.useInternalEditor - Si usar el editor interno (por defecto true)
 * @returns {Promise<Array>} Array con los IDs de los nuevos diseños creados
 */
async function separateDesignFiguresInternal(designId, options = {}) {
  const {
    namePrefix = 'Figura separada (Interno)',
    optimizeCanvas = true,
    useInternalEditor = true
  } = options;

  try {
    console.log(`🔧 Iniciando separación INTERNA de figuras para diseño ${designId}`);
    console.log(`📋 Configuración: namePrefix="${namePrefix}", optimizeCanvas=${optimizeCanvas}, useInternalEditor=${useInternalEditor}`);
    
    // Conectar a la base de datos
    const database = db();

    // Obtener el diseño original
    const originalDesign = await database.get(
      'SELECT id, name, content FROM designs WHERE id = ?',
      [designId]
    );

    if (!originalDesign) {
      throw new Error(`Diseño con ID ${designId} no encontrado`);
    }

    const originalContent = JSON.parse(originalDesign.content);
    
    if (!originalContent.pages || !originalContent.pages[0]) {
      throw new Error('El diseño no contiene páginas válidas');
    }

    const page = originalContent.pages[0];
    const allElements = page.children || page.objects || [];
    
    if (!allElements || allElements.length === 0) {
      throw new Error('El diseño no contiene elementos válidos');
    }
    
    // Filtrar elementos que son figuras/formas o imágenes enmascaradas
    const processableElements = allElements.filter(element => isProcessableElement(element));
    const figureElements = allElements.filter(element => isFigureElement(element));
    const maskedImageElements = allElements.filter(element => isMaskedImageElement(element));
    
    if (processableElements.length === 0) {
      throw new Error('El diseño no contiene figuras o imágenes enmascaradas para separar. Solo se encontraron elementos de texto, imágenes simples u otros tipos no geométricos.');
    }

    console.log(`🎯 MODO INTERNO - Encontrados ${allElements.length} elementos totales:`);
    console.log(`  - ${figureElements.length} figuras geométricas`);
    console.log(`  - ${maskedImageElements.length} imágenes enmascaradas`);
    console.log(`  - ${processableElements.length} elementos procesables en total`);
    console.log(`🔄 Procesando ${processableElements.length} elementos del diseño "${originalDesign.name}" (ID: ${designId}) en MODO INTERNO`);
    
    const createdDesignIds = [];
    
    // Procesar cada elemento (figuras e imágenes enmascaradas) en modo interno
    for (let i = 0; i < processableElements.length; i++) {
      const element = processableElements[i];
      
      // Crear una copia del contenido original
      const newContent = JSON.parse(JSON.stringify(originalContent));
      
      // Crear nombre descriptivo usando el ID del elemento original
      const elementId = element.id || `${element.type}-${i + 1}`;
      const elementName = element.name || elementId;
      const designName = `${namePrefix} - ${elementId}`;
      
      // Crear una copia del elemento sin rotación
      const elementWithoutRotation = JSON.parse(JSON.stringify(element));
      
      // Eliminar completamente la rotación para evitar problemas de posicionamiento
      elementWithoutRotation.rotation = 0;
      if (elementWithoutRotation.transform) {
        elementWithoutRotation.transform.rotation = 0;
      }
      if (elementWithoutRotation.angle) {
        elementWithoutRotation.angle = 0;
      }
      
      // Optimizar canvas si está habilitado
      if (optimizeCanvas) {
        optimizeCanvasForElement(newContent, elementWithoutRotation);
      } else {
        // Solo mantener el elemento actual sin rotación
        const newPage = newContent.pages[0];
        if (newPage.children) {
          newPage.children = [elementWithoutRotation];
        } else {
          newPage.objects = [elementWithoutRotation];
        }
      }
      
      // Marcar el diseño como procesado internamente
      if (!newContent.metadata) {
        newContent.metadata = {};
      }
      newContent.metadata.processedInternally = true;
      newContent.metadata.originalDesignId = designId;
      newContent.metadata.separationMode = 'internal';
      newContent.metadata.processedAt = new Date().toISOString();
      
      // Insertar nuevo diseño en la base de datos (marcado como interno)
      const result = await database.run(
        `INSERT INTO designs (name, description, content, thumbnail, is_internal, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          designName,
          `Figura separada automáticamente (MODO INTERNO) del diseño "${originalDesign.name}"`,
          JSON.stringify(newContent),
          null, // thumbnail se puede generar después si es necesario
          1 // is_internal = 1 para diseños creados internamente
        ]
      );
      
      createdDesignIds.push(result.lastID);
      
      console.log(`✅ INTERNO: Creado ${designName} (ID: ${result.lastID})`);
    }
    
    
    console.log(`\n🎯 Separación INTERNA completada. Se crearon ${createdDesignIds.length} nuevos diseños.`);
    console.log(`📋 IDs de los nuevos diseños (MODO INTERNO): ${createdDesignIds.join(', ')}`);
    
    // Ejecutar validación post-separación automáticamente
    console.log(`\n🔍 Ejecutando validación post-separación (MODO INTERNO)...`);
    try {
      const { validateAndFixDesign } = require('./postSeparationValidator');
      
      let totalIssuesFound = 0;
      let totalIssuesFixed = 0;
      
      for (const designId of createdDesignIds) {
        const validationResult = await validateAndFixDesign(designId, true);
        
        if (validationResult.issues && validationResult.issues.length > 0) {
          totalIssuesFound += validationResult.issues.length;
          
          if (validationResult.fixed) {
            totalIssuesFixed += validationResult.issues.length;
            console.log(`✅ INTERNO: Corregido ${validationResult.designName} (${validationResult.issues.length} problemas)`);
          } else {
            console.log(`⚠️  INTERNO: Problemas detectados en ${validationResult.designName} (${validationResult.issues.length} problemas)`);
          }
        }
      }
      
      if (totalIssuesFound > 0) {
        console.log(`\n📊 Validación INTERNA completada: ${totalIssuesFixed}/${totalIssuesFound} problemas corregidos automáticamente`);
      } else {
        console.log(`\n✅ Validación INTERNA completada: Todas las figuras están correctamente contenidas`);
      }
      
    } catch (validationError) {
      console.warn(`⚠️  Error en validación post-separación (MODO INTERNO): ${validationError.message}`);
      console.warn(`Los diseños fueron creados exitosamente, pero la validación falló.`);
    }
    
    return createdDesignIds;
    
  } catch (error) {
    console.error('Error en separateDesignFiguresInternal:', error);
    throw error;
  }
}

/**
 * Función de conveniencia para separar figuras con configuración predeterminada (MODO NORMAL)
 * @param {number} designId - ID del diseño a procesar
 * @returns {Promise<Array>} Array con los IDs de los nuevos diseños creados
 */
async function separateFiguresFromDesign(designId) {
  return await separateDesignFigures(designId, {
    namePrefix: 'Figura',
    optimizeCanvas: true
  });
}

/**
 * Función de conveniencia para separar figuras usando el editor interno (SIN INTERFAZ VISIBLE)
 * @param {number} designId - ID del diseño a procesar
 * @returns {Promise<Array>} Array con los IDs de los nuevos diseños creados
 */
async function separateFiguresFromDesignInternal(designId) {
  return await separateDesignFiguresInternal(designId, {
    namePrefix: 'Figura (Interno)',
    optimizeCanvas: true,
    useInternalEditor: true
  });
}

module.exports = {
  separateDesignFigures,
  separateFiguresFromDesign,
  separateDesignFiguresInternal,
  separateFiguresFromDesignInternal,
  calculateElementBounds,
  optimizeCanvasForElement,
  isFigureElement,
  isMaskedImageElement,
  isProcessableElement
};
