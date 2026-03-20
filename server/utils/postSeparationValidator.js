/**
 * Validador Post-Separación de Figuras
 * 
 * Esta función se ejecuta después del proceso de separación de figuras
 * para verificar que todas las figuras estén correctamente contenidas
 * dentro de sus canvas y corregir automáticamente cualquier problema.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Calcula los bounds de un elemento usando método simplificado compatible con frontend
 * @param {Object} element - El elemento a analizar
 * @returns {Object} - Los bounds calculados {minX, maxX, minY, maxY}
 */
function calculateElementBounds(element) {
    const rotation = element.rotation || 0;
    
    // Aplicar escala si existe
    const scaleX = element.scaleX || 1;
    const scaleY = element.scaleY || 1;
    let effectiveWidth = element.width * scaleX;
    let effectiveHeight = element.height * scaleY;
    
    // Para rotaciones de 90 y 270 grados, intercambiar dimensiones
    // Este método simplificado coincide mejor con el comportamiento del frontend
    if (Math.abs((rotation % 360) - 90) < 0.01 || Math.abs((rotation % 360) - 270) < 0.01) {
        const temp = effectiveWidth;
        effectiveWidth = effectiveHeight;
        effectiveHeight = temp;
    }
    
    // Para otras rotaciones, usar cálculo completo solo si es necesario
    if (Math.abs(rotation % 90) > 0.01) {
        // Cálculo completo para rotaciones no múltiplos de 90°
        const centerX = element.width / 2;
        const centerY = element.height / 2;
        const radians = (rotation * Math.PI) / 180;
        
        const corners = [
            { x: element.x, y: element.y },
            { x: element.x + element.width, y: element.y },
            { x: element.x + element.width, y: element.y + element.height },
            { x: element.x, y: element.y + element.height }
        ];
        
        const rotatedCorners = corners.map(corner => {
            const dx = corner.x - (element.x + centerX);
            const dy = corner.y - (element.y + centerY);
            return {
                x: (element.x + centerX) + dx * Math.cos(radians) - dy * Math.sin(radians),
                y: (element.y + centerY) + dx * Math.sin(radians) + dy * Math.cos(radians)
            };
        });
        
        const minX = Math.min(...rotatedCorners.map(c => c.x));
        const maxX = Math.max(...rotatedCorners.map(c => c.x));
        const minY = Math.min(...rotatedCorners.map(c => c.y));
        const maxY = Math.max(...rotatedCorners.map(c => c.y));
        
        return { minX, maxX, minY, maxY };
    }
    
    // Cálculo simplificado para rotaciones de 0°, 90°, 180°, 270°
    const minX = element.x;
    const maxX = element.x + effectiveWidth;
    const minY = element.y;
    const maxY = element.y + effectiveHeight;
    
    return { minX, maxX, minY, maxY };
}

/**
 * Detecta si un elemento tiene coordenadas negativas (problema visual común)
 * @param {Object} element - El elemento a verificar
 * @returns {Object} - Información sobre coordenadas negativas
 */
function hasNegativeCoordinates(element) {
    const hasNegativeX = element.x < 0;
    const hasNegativeY = element.y < 0;
    
    return {
        hasNegative: hasNegativeX || hasNegativeY,
        negativeX: hasNegativeX,
        negativeY: hasNegativeY,
        x: element.x,
        y: element.y
    };
}

/**
 * Verifica si un elemento está contenido dentro del canvas
 * @param {Object} element - El elemento a verificar
 * @param {number} canvasWidth - Ancho del canvas
 * @param {number} canvasHeight - Alto del canvas
 * @returns {Object} - Resultado de la verificación
 */
function isElementContained(element, canvasWidth, canvasHeight) {
    const bounds = calculateElementBounds(element);
    const negativeCoords = hasNegativeCoordinates(element);
    
    const leftOk = bounds.minX >= 0;
    const topOk = bounds.minY >= 0;
    const rightOk = bounds.maxX <= canvasWidth;
    const bottomOk = bounds.maxY <= canvasHeight;
    
    // Un elemento con coordenadas negativas siempre se considera problemático visualmente
    // incluso si matemáticamente sus bounds rotados están dentro del canvas
    const isContained = leftOk && topOk && rightOk && bottomOk && !negativeCoords.hasNegative;
    
    return {
        isContained,
        bounds,
        negativeCoords,
        violations: {
            left: !leftOk ? Math.abs(bounds.minX) : 0,
            top: !topOk ? Math.abs(bounds.minY) : 0,
            right: !rightOk ? bounds.maxX - canvasWidth : 0,
            bottom: !bottomOk ? bounds.maxY - canvasHeight : 0,
            negativeX: negativeCoords.negativeX ? Math.abs(element.x) : 0,
            negativeY: negativeCoords.negativeY ? Math.abs(element.y) : 0
        }
    };
}

/**
 * Centra un elemento en el canvas usando método simplificado compatible con frontend
 * @param {Object} element - El elemento a centrar
 * @param {number} currentWidth - Ancho actual del canvas
 * @param {number} currentHeight - Alto actual del canvas
 * @param {number} padding - Padding adicional (por defecto 10px)
 * @returns {Object} - Nuevas dimensiones y ajustes del elemento
 */
function centerElementInCanvas(element, currentWidth, currentHeight, padding = 10) {
    const rotation = element.rotation || 0;
    
    // Calcular dimensiones efectivas considerando rotación
    let effectiveWidth = element.width;
    let effectiveHeight = element.height;
    
    // Para rotaciones de 90 y 270 grados, intercambiar dimensiones
    if (Math.abs((rotation % 360) - 90) < 0.01 || Math.abs((rotation % 360) - 270) < 0.01) {
        effectiveWidth = element.height;
        effectiveHeight = element.width;
    }
    
    // Calcular las dimensiones mínimas necesarias del canvas
    const minCanvasWidth = effectiveWidth + (padding * 2);
    const minCanvasHeight = effectiveHeight + (padding * 2);
    
    // Usar las dimensiones mínimas necesarias
    const newWidth = Math.ceil(minCanvasWidth);
    const newHeight = Math.ceil(minCanvasHeight);
    
    // Calcular posición centrada simple
    const newX = (newWidth - effectiveWidth) / 2;
    const newY = (newHeight - effectiveHeight) / 2;
    
    // Calcular ajustes necesarios
    const adjustX = newX - element.x;
    const adjustY = newY - element.y;
    
    return {
        newWidth,
        newHeight,
        adjustX,
        adjustY,
        newPosition: { x: newX, y: newY },
        elementDimensions: { width: effectiveWidth, height: effectiveHeight },
        centerCalculation: {
            canvasCenter: { x: newWidth / 2, y: newHeight / 2 },
            elementCenter: { x: newX + effectiveWidth / 2, y: newY + effectiveHeight / 2 },
            adjustment: { x: adjustX, y: adjustY }
        },
        correctionReason: 'simplified_centering_with_rotation_support'
    };
}

/**
 * Corrige la posición de un elemento que está fuera del canvas
 * @param {Object} element - El elemento a corregir
 * @param {number} currentWidth - Ancho actual del canvas
 * @param {number} currentHeight - Alto actual del canvas
 * @param {number} padding - Padding adicional (por defecto 10px)
 * @returns {Object} - Ajustes necesarios para corregir el elemento
 */
function fixElementPosition(element, currentWidth, currentHeight, padding = 10) {
    const bounds = calculateElementBounds(element);
    
    // Calcular ajustes necesarios para que el elemento esté dentro del canvas
    let adjustX = 0;
    let adjustY = 0;
    
    // Si se extiende hacia la izquierda
    if (bounds.minX < 0) {
        adjustX = -bounds.minX + padding;
    }
    
    // Si se extiende hacia arriba
    if (bounds.minY < 0) {
        adjustY = -bounds.minY + padding;
    }
    
    // Si se extiende hacia la derecha
    if (bounds.maxX > currentWidth) {
        adjustX = currentWidth - bounds.maxX - padding;
    }
    
    // Si se extiende hacia abajo
    if (bounds.maxY > currentHeight) {
        adjustY = currentHeight - bounds.maxY - padding;
    }
    
    // Si el elemento es más grande que el canvas, centrarlo
    const elementWidth = bounds.maxX - bounds.minX;
    const elementHeight = bounds.maxY - bounds.minY;
    
    if (elementWidth > currentWidth || elementHeight > currentHeight) {
        // Expandir canvas si es necesario
        const newWidth = Math.max(currentWidth, elementWidth + padding * 2);
        const newHeight = Math.max(currentHeight, elementHeight + padding * 2);
        
        // Centrar el elemento
        const centerX = newWidth / 2;
        const centerY = newHeight / 2;
        const elementCenterX = bounds.minX + elementWidth / 2;
        const elementCenterY = bounds.minY + elementHeight / 2;
        
        adjustX = centerX - elementCenterX;
        adjustY = centerY - elementCenterY;
        
        return {
            newWidth,
            newHeight,
            adjustX,
            adjustY,
            newPosition: { x: element.x + adjustX, y: element.y + adjustY },
            correctionReason: 'element_larger_than_canvas_centered'
        };
    }
    
    return {
        newWidth: currentWidth,
        newHeight: currentHeight,
        adjustX,
        adjustY,
        newPosition: { x: element.x + adjustX, y: element.y + adjustY },
        correctionReason: 'element_repositioned_within_canvas'
    };
}

/**
 * Optimiza el canvas para contener completamente un elemento (función legacy)
 * @param {Object} element - El elemento a contener
 * @param {number} currentWidth - Ancho actual del canvas
 * @param {number} currentHeight - Alto actual del canvas
 * @param {number} padding - Padding adicional (por defecto 10px)
 * @returns {Object} - Nuevas dimensiones y ajustes del elemento
 */
function optimizeCanvasForElement(element, currentWidth, currentHeight, padding = 10) {
    // Usar la función de corrección de posición para elementos fuera del canvas
    return fixElementPosition(element, currentWidth, currentHeight, padding);
}

/**
 * Valida y corrige un diseño separado
 * @param {number} designId - ID del diseño a validar
 * @param {boolean} autoFix - Si debe corregir automáticamente los problemas
 * @returns {Promise<Object>} - Resultado de la validación
 */
async function validateAndFixDesign(designId, autoFix = true) {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, '..', 'database.sqlite');
        const db = new sqlite3.Database(dbPath);
        
        // Obtener el diseño
        db.get('SELECT * FROM designs WHERE id = ?', [designId], (err, design) => {
            if (err) {
                db.close();
                reject(err);
                return;
            }
            
            if (!design) {
                db.close();
                reject(new Error(`Diseño con ID ${designId} no encontrado`));
                return;
            }
            
            try {
                const content = JSON.parse(design.content);
                const result = {
                    designId,
                    designName: design.name,
                    issues: [],
                    fixed: false,
                    originalContent: content
                };
                
                // Verificar si tiene páginas
                if (!content.pages || content.pages.length === 0) {
                    result.issues.push('No se encontraron páginas en el diseño');
                    db.close();
                    resolve(result);
                    return;
                }
                
                let hasIssues = false;
                let contentModified = false;
                
                // Verificar cada página
                content.pages.forEach((page, pageIndex) => {
                    if (!page.children || page.children.length === 0) {
                        return;
                    }
                    
                    // Verificar cada elemento en la página
                    page.children.forEach((element, elementIndex) => {
                        const containmentCheck = isElementContained(element, page.width, page.height);
                        
                        if (!containmentCheck.isContained) {
                            hasIssues = true;
                            const issue = {
                                pageIndex,
                                elementIndex,
                                elementId: element.id,
                                elementType: element.type,
                                bounds: containmentCheck.bounds,
                                violations: containmentCheck.violations,
                                canvasSize: { width: page.width, height: page.height }
                            };
                            
                            result.issues.push(issue);
                            
                            // Aplicar corrección automática si está habilitada
                            if (autoFix) {
                                const optimization = optimizeCanvasForElement(element, page.width, page.height);
                                
                                // Actualizar dimensiones del canvas
                                page.width = optimization.newWidth;
                                page.height = optimization.newHeight;
                                
                                // Ajustar posición del elemento
                                element.x += optimization.adjustX;
                                element.y += optimization.adjustY;
                                
                                issue.fixed = true;
                                issue.newCanvasSize = { width: page.width, height: page.height };
                                issue.elementAdjustment = { x: optimization.adjustX, y: optimization.adjustY };
                                
                                contentModified = true;
                            }
                        }
                    });
                });
                
                // Guardar cambios si se modificó el contenido
                if (contentModified && autoFix) {
                    const updatedContent = JSON.stringify(content);
                    const updateQuery = 'UPDATE designs SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
                    
                    db.run(updateQuery, [updatedContent, designId], function(updateErr) {
                        if (updateErr) {
                            db.close();
                            reject(updateErr);
                            return;
                        }
                        
                        result.fixed = true;
                        result.updatedContent = content;
                        db.close();
                        resolve(result);
                    });
                } else {
                    db.close();
                    resolve(result);
                }
                
            } catch (parseError) {
                db.close();
                reject(new Error(`Error al parsear contenido del diseño ${designId}: ${parseError.message}`));
            }
        });
    });
}

/**
 * Valida todos los diseños separados (aquellos que contienen "Figura -" en el nombre)
 * @param {boolean} autoFix - Si debe corregir automáticamente los problemas
 * @returns {Promise<Array>} - Array con los resultados de validación
 */
async function validateAllSeparatedDesigns(autoFix = true) {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, '..', 'database.sqlite');
        const db = new sqlite3.Database(dbPath);
        
        // Obtener todos los diseños separados
        const query = "SELECT id, name FROM designs WHERE name LIKE 'Figura -%' ORDER BY created_at DESC";
        
        db.all(query, [], async (err, designs) => {
            if (err) {
                db.close();
                reject(err);
                return;
            }
            
            db.close();
            
            const results = [];
            
            // Validar cada diseño
            for (const design of designs) {
                try {
                    const result = await validateAndFixDesign(design.id, autoFix);
                    results.push(result);
                } catch (error) {
                    results.push({
                        designId: design.id,
                        designName: design.name,
                        error: error.message
                    });
                }
            }
            
            resolve(results);
        });
    });
}

/**
 * Genera un reporte detallado de la validación
 * @param {Array} validationResults - Resultados de la validación
 * @returns {string} - Reporte formateado
 */
function generateValidationReport(validationResults) {
    let report = '=== REPORTE DE VALIDACIÓN POST-SEPARACIÓN ===\n\n';
    
    const totalDesigns = validationResults.length;
    const designsWithIssues = validationResults.filter(r => r.issues && r.issues.length > 0).length;
    const designsFixed = validationResults.filter(r => r.fixed).length;
    const designsWithErrors = validationResults.filter(r => r.error).length;
    
    report += `📊 RESUMEN:\n`;
    report += `- Total de diseños validados: ${totalDesigns}\n`;
    report += `- Diseños con problemas: ${designsWithIssues}\n`;
    report += `- Diseños corregidos: ${designsFixed}\n`;
    report += `- Diseños con errores: ${designsWithErrors}\n\n`;
    
    validationResults.forEach((result, index) => {
        report += `--- DISEÑO ${index + 1} (ID: ${result.designId}) ---\n`;
        report += `Nombre: ${result.designName}\n`;
        
        if (result.error) {
            report += `❌ Error: ${result.error}\n`;
        } else if (result.issues && result.issues.length > 0) {
            report += `⚠️  Problemas encontrados: ${result.issues.length}\n`;
            
            result.issues.forEach((issue, issueIndex) => {
                report += `\n  Problema ${issueIndex + 1}:\n`;
                report += `  - Elemento: ${issue.elementId} (${issue.elementType})\n`;
                report += `  - Canvas: ${issue.canvasSize.width}x${issue.canvasSize.height}\n`;
                report += `  - Bounds: (${issue.bounds.minX.toFixed(2)}, ${issue.bounds.minY.toFixed(2)}) a (${issue.bounds.maxX.toFixed(2)}, ${issue.bounds.maxY.toFixed(2)})\n`;
                
                if (issue.violations.left > 0) report += `  - Se extiende ${issue.violations.left.toFixed(2)}px hacia la izquierda\n`;
                if (issue.violations.top > 0) report += `  - Se extiende ${issue.violations.top.toFixed(2)}px hacia arriba\n`;
                if (issue.violations.right > 0) report += `  - Se extiende ${issue.violations.right.toFixed(2)}px hacia la derecha\n`;
                if (issue.violations.bottom > 0) report += `  - Se extiende ${issue.violations.bottom.toFixed(2)}px hacia abajo\n`;
                
                if (issue.fixed) {
                    report += `  ✅ CORREGIDO:\n`;
                    report += `  - Nuevo canvas: ${issue.newCanvasSize.width}x${issue.newCanvasSize.height}\n`;
                    report += `  - Ajuste del elemento: x+${issue.elementAdjustment.x.toFixed(2)}, y+${issue.elementAdjustment.y.toFixed(2)}\n`;
                }
            });
            
            if (result.fixed) {
                report += `\n✅ Diseño corregido y guardado en la base de datos\n`;
            }
        } else {
            report += `✅ Sin problemas detectados\n`;
        }
        
        report += `\n${'='.repeat(60)}\n\n`;
    });
    
    return report;
}

module.exports = {
    calculateElementBounds,
    isElementContained,
    centerElementInCanvas,
    fixElementPosition,
    optimizeCanvasForElement,
    validateAndFixDesign,
    validateAllSeparatedDesigns,
    generateValidationReport
};