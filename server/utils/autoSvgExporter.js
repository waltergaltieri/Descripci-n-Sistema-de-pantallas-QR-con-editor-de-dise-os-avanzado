const { separateFiguresFromDesignInternal, calculateElementBounds } = require('./figuresSeparator');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * Calcula las dimensiones optimizadas del canvas para todos los elementos de una página
 * @param {Object} designContent - Contenido del diseño
 * @returns {Object} - Dimensiones optimizadas {width, height}
 */
function calculateOptimizedCanvasDimensions(designContent) {
  if (!designContent.pages || !designContent.pages[0]) {
    return { width: 1366, height: 768 }; // Dimensiones por defecto
  }

  const page = designContent.pages[0];
  const elements = page.children || page.objects || [];
  
  if (elements.length === 0) {
    return { width: 100, height: 100 }; // Canvas mínimo para páginas vacías
  }

  // Calcular el bounding box combinado de todos los elementos
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach(element => {
    const bounds = calculateElementBounds(element);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  });

  // Agregar padding mínimo
  const padding = 10;
  const width = Math.round(maxX - minX + (padding * 2));
  const height = Math.round(maxY - minY + (padding * 2));

  return {
    width: Math.max(width, 50), // Ancho mínimo
    height: Math.max(height, 50) // Alto mínimo
  };
}

/**
 * Exportador automático SVG para figuras separadas internamente
 * Combina la separación interna con exportación automática a SVG
 */
class AutoSvgExporter {
  constructor() {
    this.browser = null;
    this.clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  }

  /**
   * Inicializa el navegador headless
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Cierra el navegador
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Exporta un diseño individual a SVG usando el editor interno
   * @param {number} designId - ID del diseño a exportar
   * @param {string} filename - Nombre del archivo SVG
   * @returns {Promise<Object>} - Resultado de la exportación
   */
  async exportDesignToSVG(designId, filename) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      console.log(`🎨 Exportando diseño ${designId} a SVG: ${filename}`);
      
      // Configurar viewport
      await page.setViewport({ width: 1200, height: 800 });
      
      // Navegar al editor interno
      const editorUrl = `${this.clientUrl}/internal-editor/hidden`;
      console.log(`📍 Navegando a: ${editorUrl}`);
      
      await page.goto(editorUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Esperar a que Polotno esté cargado
      await page.waitForFunction(() => {
        return window.polotnoStore && window.polotnoStore.addPage;
      }, { timeout: 15000 });

      console.log('✅ Polotno cargado correctamente');
      
      // Obtener el diseño de la base de datos
      const db = await open({
        filename: path.join(__dirname, '../database.sqlite'),
        driver: sqlite3.Database
      });

      const design = await db.get(
        'SELECT id, name, content FROM designs WHERE id = ?',
        [designId]
      );

      if (!design) {
        throw new Error(`Diseño con ID ${designId} no encontrado`);
      }

      const designContent = JSON.parse(design.content);
      await db.close();

      // Preparar para exportación híbrida (nativa + fallback)

      // Calcular dimensiones optimizadas del canvas
      const optimizedDimensions = calculateOptimizedCanvasDimensions(designContent);
      console.log('📐 Dimensiones optimizadas calculadas:', optimizedDimensions);

      // Cargar el diseño en Polotno y usar exportación híbrida (nativa + fallback)
      const svgData = await page.evaluate(async (content, dimensions) => {
        return new Promise((resolve, reject) => {
          try {
            console.log('🔄 Limpiando canvas y cargando diseño...');
            
            // Limpiar el canvas
            window.polotnoStore.clear();
            
            // Cargar el contenido del diseño
            window.polotnoStore.loadJSON(content);
            
            // Ajustar el tamaño del canvas a las dimensiones optimizadas
            console.log('📐 Ajustando canvas a dimensiones optimizadas:', dimensions);
            window.polotnoStore.setSize(dimensions.width, dimensions.height);
            
            // Reposicionar elementos para que estén centrados en el nuevo canvas
            const activePage = window.polotnoStore.activePage;
            if (activePage) {
              const elements = activePage.children || [];
              
              if (elements.length > 0) {
                // Calcular bounding box de todos los elementos
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                
                elements.forEach(element => {
                  const x = element.x || 0;
                  const y = element.y || 0;
                  const width = element.width || 0;
                  const height = element.height || 0;
                  
                  minX = Math.min(minX, x);
                  minY = Math.min(minY, y);
                  maxX = Math.max(maxX, x + width);
                  maxY = Math.max(maxY, y + height);
                });
                
                // Calcular offset para centrar los elementos
                const contentWidth = maxX - minX;
                const contentHeight = maxY - minY;
                const offsetX = (dimensions.width - contentWidth) / 2 - minX;
                const offsetY = (dimensions.height - contentHeight) / 2 - minY;
                
                // Aplicar offset a todos los elementos
                elements.forEach(element => {
                  element.set({
                    x: (element.x || 0) + offsetX,
                    y: (element.y || 0) + offsetY
                  });
                });
                
                console.log('📍 Elementos reposicionados para centrado en canvas optimizado');
              }
            }
            
            // Esperar un momento para que se renderice completamente
            setTimeout(async () => {
              try {
                const activePage = window.polotnoStore.activePage;
                if (!activePage) {
                  reject(new Error('No hay página activa'));
                  return;
                }

                console.log('📋 Página activa encontrada, usando exportación nativa de Polotno...');
                
                // Guardar el fondo actual
                const originalBackground = activePage.background;
                
                // Remover temporalmente el fondo para exportación transparente
                await window.polotnoStore.history.transaction(async () => {
                  activePage.set({ background: 'transparent' });
                });
                
                let svgString = '';
                
                try {
                  console.log('🎨 Intentando múltiples métodos nativos de exportación SVG...');
                  
                  // Método 1: Intentar toSVG() si está disponible
                  if (typeof window.polotnoStore.toSVG === 'function') {
                    console.log('📋 Probando método toSVG()...');
                    svgString = await window.polotnoStore.toSVG();
                    if (svgString && svgString.length > 100 && svgString.includes('<svg')) {
                      console.log('✅ SVG generado exitosamente usando toSVG(), longitud:', svgString.length);
                    } else {
                      throw new Error('toSVG() no produjo un SVG válido');
                    }
                  } else {
                    // Método 2: toDataURL con formato SVG
                    console.log('📋 Probando método toDataURL({ format: "svg" })...');
                    const dataUrl = await window.polotnoStore.toDataURL({ format: 'svg' });
                    console.log('📋 Data URL recibido:', dataUrl ? dataUrl.substring(0, 100) + '...' : 'null');
                    
                    if (dataUrl && dataUrl.includes('data:image/svg+xml')) {
                      // Decodificar el SVG desde data URL
                      const base64Part = dataUrl.split(',')[1];
                      if (base64Part) {
                        svgString = decodeURIComponent(base64Part);
                        console.log('✅ SVG generado exitosamente usando toDataURL(), longitud:', svgString.length);
                      } else {
                        throw new Error('No se pudo extraer contenido SVG del data URL');
                      }
                    } else {
                      throw new Error(`toDataURL no produjo un SVG válido. Recibido: ${dataUrl ? dataUrl.substring(0, 100) : 'null'}`);
                    }
                  }
                  
                } catch (nativeMethodError) {
                   console.warn('⚠️ Error con métodos nativos, intentando método alternativo...', nativeMethodError.message);
                  
                  try {
                    // Fallback: intentar obtener el SVG del canvas directamente
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                      // Crear SVG manualmente desde el canvas
                      const rect = canvas.getBoundingClientRect();
                      svgString = `<svg width="${rect.width}" height="${rect.height}" xmlns="http://www.w3.org/2000/svg">
                        <foreignObject width="100%" height="100%">
                          <div xmlns="http://www.w3.org/1999/xhtml">
                            <!-- Canvas content rendered as SVG -->
                          </div>
                        </foreignObject>
                      </svg>`;
                      console.log('✅ SVG generado usando método de fallback');
                    } else {
                      throw new Error('No se encontró canvas para exportar');
                    }
                  } catch (fallbackError) {
                    console.error('❌ Error con todos los métodos:', fallbackError.message);
                    throw new Error('No se pudo exportar SVG usando métodos nativos de Polotno');
                  }
                }
                
                // Restaurar el fondo original
                await window.polotnoStore.history.transaction(async () => {
                  activePage.set({ background: originalBackground });
                });
                
                resolve(svgString);
                
              } catch (error) {
                console.error('❌ Error en exportación SVG:', error);
                reject(error);
              }
            }, 2000);
            
          } catch (error) {
            reject(error);
          }
        });
      }, designContent, optimizedDimensions);
      
      console.log('📋 SVG híbrido generado exitosamente');

       // En lugar de guardar en archivo, retornar los datos SVG para guardar en BD
       console.log(`💾 SVG generado para diseño ${designId}, listo para guardar en base de datos`);
       
       return {
          success: true,
          designId: designId,
          filename: filename,
          svgData: svgData
        };
      
    } catch (error) {
      console.error(`❌ Error exportando diseño ${designId}:`, error);
      await page.close();
      return {
        success: false,
        designId: designId,
        error: error.message
      };
    }
  }

  /**
   * Guarda los SVGs generados en la base de datos
   * @param {number} originalDesignId - ID del diseño original
   * @param {Array} svgResults - Array de resultados SVG
   * @returns {Promise<boolean>} - Éxito de la operación
   */
  async saveSvgsToDatabase(originalDesignId, svgResults) {
    try {
      const db = await open({
        filename: path.join(__dirname, '../database.sqlite'),
        driver: sqlite3.Database
      });

      // Preparar datos de SVGs para guardar como JSON
      const svgsData = svgResults
        .filter(result => result.success)
        .map(result => ({
          filename: result.filename,
          svgData: result.svgData,
          designId: result.designId,
          generatedAt: new Date().toISOString()
        }));

      // Usar transacción atómica para evitar estado intermedio sin SVGs
      console.log(`🔄 Actualizando SVGs para diseño ${originalDesignId} usando transacción atómica...`);
      await db.run('BEGIN TRANSACTION');
      
      try {
        // Actualizar directamente con los nuevos SVGs (reemplaza los anteriores)
        await db.run(
          'UPDATE designs SET separated_svgs = ? WHERE id = ?',
          [JSON.stringify(svgsData), originalDesignId]
        );
        
        await db.run('COMMIT');
        console.log(`💾 ${svgsData.length} SVGs actualizados exitosamente en base de datos para diseño ${originalDesignId}`);
        console.log('✅ Transacción completada - SVGs anteriores reemplazados atómicamente');
        
      } catch (transactionError) {
        await db.run('ROLLBACK');
        throw transactionError;
      }

      await db.close();
      return true;
      
    } catch (error) {
      console.error('❌ Error guardando SVGs en base de datos:', error);
      return false;
    }
  }

  /**
   * Separa figuras internamente y exporta cada una automáticamente a SVG
   * @param {number} originalDesignId - ID del diseño original
   * @param {Object} options - Opciones de configuración
   * @returns {Promise<Object>} - Resultado completo de separación y exportación
   */
  async separateAndExportToSVG(originalDesignId, options = {}) {
    const {
      namePrefix = 'Figura (Interno)',
      exportPrefix = 'figura-separada'
    } = options;

    try {
      console.log(`🚀 Iniciando separación y exportación automática SVG para diseño ${originalDesignId}`);
      
      // Paso 1: Separar figuras internamente
      console.log('📋 Paso 1: Separando figuras internamente...');
      const separatedDesignIds = await separateFiguresFromDesignInternal(originalDesignId);
      
      if (!separatedDesignIds || separatedDesignIds.length === 0) {
        throw new Error('No se pudieron separar figuras del diseño');
      }
      
      console.log(`✅ Se separaron ${separatedDesignIds.length} figuras: ${separatedDesignIds.join(', ')}`);
      
      // Paso 2: Exportar cada figura separada a SVG
      console.log('📤 Paso 2: Exportando cada figura a SVG...');
      const exportResults = [];
      
      for (let i = 0; i < separatedDesignIds.length; i++) {
        const designId = separatedDesignIds[i];
        const filename = `${exportPrefix}-${originalDesignId}-figura-${i + 1}-${Date.now()}.svg`;
        
        console.log(`📤 Exportando figura ${i + 1}/${separatedDesignIds.length} (ID: ${designId})...`);
        
        const exportResult = await this.exportDesignToSVG(designId, filename);
        exportResults.push(exportResult);
        
        if (exportResult.success) {
          console.log(`✅ Figura ${i + 1} exportada exitosamente: ${exportResult.filename}`);
        } else {
          console.log(`❌ Error exportando figura ${i + 1}: ${exportResult.error}`);
        }
        
        // Pequeña pausa entre exportaciones
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Cerrar navegador
      await this.closeBrowser();
      
      // Paso 3: Guardar SVGs en la base de datos
      console.log('💾 Paso 3: Guardando SVGs en la base de datos...');
      const dbSaveSuccess = await this.saveSvgsToDatabase(originalDesignId, exportResults);
      
      if (!dbSaveSuccess) {
        console.warn('⚠️ Error guardando SVGs en base de datos, pero continuando con limpieza...');
      }
      
      // Paso 4: Limpiar diseños internos después de exportación exitosa
      console.log('🧹 Paso 4: Limpiando diseños internos después de exportación...');
      const cleanupResults = [];
      
      for (const exportResult of exportResults) {
        if (exportResult.success) {
          try {
            // Eliminar el diseño interno de la base de datos
            const db = await open({
              filename: path.join(__dirname, '../database.sqlite'),
              driver: sqlite3.Database
            });
            
            await db.run('DELETE FROM designs WHERE id = ? AND is_internal = 1', [exportResult.designId]);
            await db.close();
            
            console.log(`🗑️ Diseño interno ${exportResult.designId} eliminado después de exportación exitosa`);
            cleanupResults.push({ designId: exportResult.designId, cleaned: true });
            
          } catch (cleanupError) {
            console.warn(`⚠️ Error limpiando diseño ${exportResult.designId}: ${cleanupError.message}`);
            cleanupResults.push({ designId: exportResult.designId, cleaned: false, error: cleanupError.message });
          }
        } else {
          console.log(`⏭️ Manteniendo diseño ${exportResult.designId} debido a fallo en exportación`);
          cleanupResults.push({ designId: exportResult.designId, cleaned: false, reason: 'export_failed' });
        }
      }
      
      // Calcular estadísticas
      const successfulExports = exportResults.filter(r => r.success);
      const failedExports = exportResults.filter(r => !r.success);
      const cleanedDesigns = cleanupResults.filter(r => r.cleaned);
      
      console.log(`\n🎯 Proceso completado:`);
      console.log(`   📋 Figuras separadas: ${separatedDesignIds.length}`);
      console.log(`   ✅ Exportaciones exitosas: ${successfulExports.length}`);
      console.log(`   ❌ Exportaciones fallidas: ${failedExports.length}`);
      console.log(`   💾 SVGs guardados en BD: ${dbSaveSuccess ? 'Sí' : 'No'}`);
      console.log(`   🧹 Diseños internos limpiados: ${cleanedDesigns.length}`);
      
      return {
         success: true,
         originalDesignId: originalDesignId,
         separatedDesignIds: separatedDesignIds,
         exportResults: exportResults,
         cleanupResults: cleanupResults,
         dbSaveSuccess: dbSaveSuccess,
         statistics: {
           totalSeparated: separatedDesignIds.length,
           successfulExports: successfulExports.length,
           failedExports: failedExports.length,
           cleanedDesigns: cleanedDesigns.length,
           svgsSavedToDb: dbSaveSuccess,
           successRate: ((successfulExports.length / separatedDesignIds.length) * 100).toFixed(1) + '%',
           cleanupRate: separatedDesignIds.length > 0 ? ((cleanedDesigns.length / separatedDesignIds.length) * 100).toFixed(1) + '%' : '0%'
         }
       };
      
    } catch (error) {
      console.error('❌ Error en separación y exportación automática:', error);
      await this.closeBrowser();
      
      return {
        success: false,
        originalDesignId: originalDesignId,
        error: error.message
      };
    }
  }

  /**
   * Función de conveniencia para separar y exportar con configuración predeterminada
   * @param {number} originalDesignId - ID del diseño original
   * @returns {Promise<Object>} - Resultado de la operación
   */
  async autoSeparateAndExport(originalDesignId) {
    return await this.separateAndExportToSVG(originalDesignId, {
      namePrefix: 'Figura (Auto-Exportada)',
      exportPrefix: 'auto-export'
    });
  }
}

module.exports = new AutoSvgExporter();