const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { db } = require('../config/database');

/**
 * Exportador que separa formas de un diseño en canvas individuales
 */
class SeparateShapesExporter {
  constructor() {
    this.browser = null;
    this.clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';
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
   * Obtiene un diseño de la base de datos
   * @param {number} designId - ID del diseño
   * @returns {Promise<Object>} - Diseño con contenido parseado
   */
  async getDesignFromDatabase(designId) {
    try {
      const design = await db().get('SELECT id, name, content FROM designs WHERE id = ?', [designId]);
      
      if (!design) {
        throw new Error(`Diseño con ID ${designId} no encontrado`);
      }

      // Parsear el contenido JSON
      if (design.content && typeof design.content === 'string') {
        design.content = JSON.parse(design.content);
      }

      return design;
    } catch (error) {
      console.error('Error al obtener diseño:', error);
      throw error;
    }
  }

  /**
   * Extrae las formas (figures) de un diseño
   * @param {Object} designContent - Contenido del diseño
   * @returns {Array} - Array de formas encontradas
   */
  extractShapes(designContent) {
    const shapes = [];
    
    if (designContent.pages && designContent.pages.length > 0) {
      const page = designContent.pages[0]; // Tomar la primera página
      
      if (page.children && Array.isArray(page.children)) {
        // Filtrar solo las formas (figures)
        const figures = page.children.filter(child => child.type === 'figure');
        
        figures.forEach((figure, index) => {
          shapes.push({
            id: figure.id || `shape-${index}`,
            name: figure.name || `Forma ${index + 1}`,
            type: 'figure',
            properties: {
              x: figure.x || 0,
              y: figure.y || 0,
              width: figure.width || 100,
              height: figure.height || 100,
              fill: figure.fill || '#3B82F6',
              stroke: figure.stroke || '#1E40AF',
              strokeWidth: figure.strokeWidth || 2,
              rotation: figure.rotation || 0,
              opacity: figure.opacity || 1,
              subType: figure.subType || 'rect'
            }
          });
        });
      }
    }
    
    return shapes;
  }

  /**
   * Crea y exporta una forma individual como SVG
   * @param {Object} shape - Configuración de la forma
   * @param {string} filename - Nombre del archivo
   * @returns {Promise<Object>} - Resultado de la exportación
   */
  async exportSingleShape(shape, filename) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      console.log(`🎨 Exportando forma individual: ${shape.name}`);
      
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
      
      // Configurar directorio de descarga temporal
      const downloadPath = path.join(__dirname, '../temp-downloads');
      
      // Configurar el navegador para descargar en directorio específico
      const client = await page.target().createCDPSession();
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
      });
     
      // Crear directorio si no existe
      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
      }
      
      // Ejecutar la creación de la forma en el contexto del navegador
      await page.evaluate((shapeData) => {
        return new Promise((resolve) => {
          console.log('🎨 Creando forma individual con Polotno...');
          console.log('📋 Datos de forma:', shapeData);
          
          // Limpiar canvas
          window.polotnoStore.clear();
          console.log('🧹 Canvas limpiado');
          
          // Crear página con dimensiones ajustadas a la forma
          const pageWidth = Math.max(shapeData.properties.width + 100, 400);
          const pageHeight = Math.max(shapeData.properties.height + 100, 300);
          
          const page = window.polotnoStore.addPage({
            width: pageWidth,
            height: pageHeight
          });
          
          console.log('📄 Página creada:', page ? 'exitosa' : 'falló');
          console.log('📏 Dimensiones página:', page ? `${page.width}x${page.height}` : 'N/A');
  
          // Crear elemento basado en el subType de la forma
          let shapeElement;
          
          // Centrar la forma en el canvas
          const centerX = (pageWidth - shapeData.properties.width) / 2;
          const centerY = (pageHeight - shapeData.properties.height) / 2;
          
          // Para formas tipo 'figure', usar el tipo 'figure' de Polotno
          if (shapeData.type === 'figure') {
            shapeElement = {
              type: 'figure',
              x: centerX,
              y: centerY,
              width: shapeData.properties.width,
              height: shapeData.properties.height,
              fill: shapeData.properties.fill,
              stroke: shapeData.properties.stroke,
              strokeWidth: shapeData.properties.strokeWidth,
              rotation: shapeData.properties.rotation,
              opacity: shapeData.properties.opacity,
              subType: shapeData.properties.subType || 'rect'
            };
          } else {
            // Fallback para otros tipos
            switch(shapeData.properties.subType) {
              case 'blob15': // Forma orgánica/blob
                shapeElement = {
                  type: 'svg',
                  x: centerX,
                  y: centerY,
                  width: shapeData.properties.width,
                  height: shapeData.properties.height,
                  src: 'data:image/svg+xml;base64,' + btoa(`
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20,50 Q30,20 50,30 Q70,20 80,50 Q70,80 50,70 Q30,80 20,50 Z" 
                            fill="${shapeData.properties.fill}" 
                            stroke="${shapeData.properties.stroke}" 
                            stroke-width="${shapeData.properties.strokeWidth}"/>
                    </svg>
                  `),
                  rotation: shapeData.properties.rotation,
                  opacity: shapeData.properties.opacity
                };
                break;
              default:
                // Forma rectangular por defecto
                shapeElement = {
                  type: 'rect',
                  x: centerX,
                  y: centerY,
                  width: shapeData.properties.width,
                  height: shapeData.properties.height,
                  fill: shapeData.properties.fill,
                  stroke: shapeData.properties.stroke,
                  strokeWidth: shapeData.properties.strokeWidth,
                  rotation: shapeData.properties.rotation,
                  opacity: shapeData.properties.opacity
                };
            }
          }
  
          // Añadir elemento al canvas
          console.log('➕ Añadiendo elemento a la página...');
          const addedElement = page.addElement(shapeElement);
          console.log('✅ Elemento añadido:', addedElement ? 'exitoso' : 'falló');
         
          console.log('🎯 Forma creada:', shapeElement);
          
          // Esperar un momento para que se renderice
          setTimeout(() => {
            console.log('📊 Elementos en página:', page.children.length);
            resolve();
          }, 500);
        });
      }, shape);
      
      // Esperar un momento para el renderizado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔄 Iniciando exportación SVG...');
      
      // Ejecutar saveAsSVG en el contexto del navegador
      await page.evaluate(async () => {
        await window.polotnoStore.saveAsSVG();
        console.log('✅ Descarga SVG iniciada desde el navegador');
      });
      
      console.log('✅ Descarga SVG iniciada, esperando archivo...');
      
      // Esperar a que aparezca el archivo descargado
      const svgData = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout esperando descarga SVG'));
        }, 10000);
        
        const checkForFile = () => {
          const files = fs.readdirSync(downloadPath);
          const svgFile = files.find(file => file.endsWith('.svg'));
          
          if (svgFile) {
            clearTimeout(timeout);
            const filePath = path.join(downloadPath, svgFile);
            const svgContent = fs.readFileSync(filePath, 'utf8');
            resolve(svgContent);
          } else {
            setTimeout(checkForFile, 500);
          }
        };
        
        checkForFile();
      });
      
      console.log('✅ SVG generado exitosamente');
      return svgData;
      
    } catch (error) {
      console.error('❌ Error en exportación:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Guarda SVG en archivo
   * @param {string} svgData - Contenido SVG
   * @param {string} filename - Nombre del archivo
   * @returns {Promise<string>} - Ruta del archivo guardado
   */
  async saveSVGToFile(svgData, filename) {
    const exportsDir = path.join(__dirname, '../exports');
    
    // Crear directorio si no existe
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    const filepath = path.join(exportsDir, filename);
    fs.writeFileSync(filepath, svgData, 'utf8');
    
    console.log(`💾 SVG guardado en: ${filepath}`);
    return filepath;
  }

  /**
   * Exporta todas las formas de un diseño en canvas separados
   * @param {number} designId - ID del diseño
   * @returns {Promise<Array>} - Array con resultados de exportación
   */
  async exportDesignShapesSeparately(designId) {
    try {
      console.log(`🚀 Iniciando exportación separada de formas para diseño ID: ${designId}`);
      
      // Obtener diseño de la base de datos
      const design = await this.getDesignFromDatabase(designId);
      console.log(`📋 Diseño obtenido: ${design.name}`);
      
      // Extraer formas del diseño
      const shapes = this.extractShapes(design.content);
      console.log(`🔍 Formas encontradas: ${shapes.length}`);
      
      if (shapes.length === 0) {
        throw new Error('No se encontraron formas en el diseño');
      }
      
      const results = [];
      
      // Exportar cada forma por separado
      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const filename = `${design.name.replace(/\s+/g, '-').toLowerCase()}-forma-${i + 1}-${Date.now()}.svg`;
        
        console.log(`📤 Exportando forma ${i + 1}/${shapes.length}: ${shape.name}`);
        
        try {
          const svgData = await this.exportSingleShape(shape, filename);
          const filepath = await this.saveSVGToFile(svgData, filename);
          
          results.push({
            success: true,
            shapeId: shape.id,
            shapeName: shape.name,
            filename: filename,
            filepath: filepath,
            svgData: svgData
          });
          
          console.log(`✅ Forma ${i + 1} exportada exitosamente`);
        } catch (error) {
          console.error(`❌ Error exportando forma ${i + 1}:`, error);
          results.push({
            success: false,
            shapeId: shape.id,
            shapeName: shape.name,
            error: error.message
          });
        }
      }
      
      console.log(`🎉 Exportación completada. ${results.filter(r => r.success).length}/${results.length} formas exportadas exitosamente`);
      
      return {
        success: true,
        designId: designId,
        designName: design.name,
        totalShapes: shapes.length,
        results: results
      };
      
    } catch (error) {
      console.error('❌ Error en exportación separada:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SeparateShapesExporter();