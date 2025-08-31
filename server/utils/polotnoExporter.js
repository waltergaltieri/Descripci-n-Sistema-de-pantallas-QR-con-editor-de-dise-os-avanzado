const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * Servicio de exportación SVG usando Polotno nativo a través de Puppeteer
 * Ejecuta el editor interno de forma invisible para el usuario
 */
class PolotnoExporter {
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
        headless: true, // Invisible para el usuario
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
   * Crea y exporta una forma usando Polotno nativo
   * @param {Object} shapeConfig - Configuración de la forma
   * @param {string} shapeConfig.type - Tipo de forma ('rect', 'circle', 'triangle')
   * @param {Object} shapeConfig.properties - Propiedades de la forma
   * @returns {Promise<string>} - SVG generado
   */
  async createAndExportSVG(shapeConfig) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      console.log('🚀 Iniciando exportación SVG con Polotno nativo...');
      
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
      
      // Capturar logs del navegador
      page.on('console', msg => {
        console.log('🌐 Browser:', msg.text());
      });

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
      
      // Limpiar archivos anteriores
      const files = fs.readdirSync(downloadPath);
      files.forEach(file => {
        if (file.endsWith('.svg')) {
          fs.unlinkSync(path.join(downloadPath, file));
        }
      });

      // Ejecutar la creación de la forma en el contexto del navegador
       await page.evaluate((config) => {
         return new Promise((resolve) => {
           console.log('🎨 Creando forma con Polotno...');
           console.log('📋 Config recibida:', config);
           
           // Limpiar canvas
           window.polotnoStore.clear();
           console.log('🧹 Canvas limpiado');
           
           // Crear página
           const page = window.polotnoStore.addPage({
             width: config.pageWidth || 800,
             height: config.pageHeight || 600
           });
           console.log('📄 Página creada:', page ? 'exitosa' : 'falló');
           console.log('📏 Dimensiones página:', page ? `${page.width}x${page.height}` : 'N/A');
   
           // Configuración por defecto de formas (usando la misma estructura del editor interno)
            let shapeElement;
            
            switch(config.type) {
              case 'rect':
                shapeElement = {
                  type: 'rect',
                  x: 300,
                  y: 200,
                  width: 200,
                  height: 200,
                  fill: '#3B82F6',
                  stroke: '#1E40AF',
                  strokeWidth: 2
                };
                break;
              case 'circle':
                shapeElement = {
                  type: 'circle',
                  x: 300,
                  y: 200,
                  radius: 100,
                  fill: '#EF4444',
                  stroke: '#DC2626',
                  strokeWidth: 2
                };
                break;
              case 'triangle':
                shapeElement = {
                  type: 'svg',
                  x: 300,
                  y: 200,
                  width: 200,
                  height: 200,
                  src: 'data:image/svg+xml;base64,' + btoa(`
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="50,10 90,90 10,90" fill="#10B981" stroke="#059669" stroke-width="2"/>
                    </svg>
                  `)
                };
                break;
              default:
                shapeElement = {
                  type: 'rect',
                  x: 300,
                  y: 200,
                  width: 200,
                  height: 200,
                  fill: '#3B82F6',
                  stroke: '#1E40AF',
                  strokeWidth: 2
                };
            }
   
           // Aplicar propiedades personalizadas si existen
            if (config.properties) {
              Object.assign(shapeElement, config.properties);
            }
    
            // Añadir elemento al canvas
            console.log('➕ Añadiendo elemento a la página...');
            const addedElement = page.addElement(shapeElement);
            console.log('✅ Elemento añadido:', addedElement ? 'exitoso' : 'falló');
           
           console.log('🎯 Forma creada:', shapeElement);
           console.log('📊 Total elementos antes del timeout:', page.children.length);
           
           // Esperar un momento para que se renderice
           setTimeout(() => {
             console.log('📊 Elementos en página:', page.children.length);
             resolve();
           }, 500);
         });
       }, shapeConfig);
      
      // Esperar un momento para el renderizado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔄 Iniciando exportación SVG nativa con Polotno...');
      
      // Ejecutar saveAsSVG en el contexto del navegador
      await page.evaluate(async () => {
        await window.polotnoStore.saveAsSVG();
        console.log('✅ Descarga SVG iniciada desde el navegador');
      });
      
      console.log('✅ Descarga SVG iniciada, esperando archivo...');
      
      // Esperar a que aparezca el archivo descargado
      const svgData = await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 20;
        const checkInterval = 500;
        
        const checkForFile = () => {
          attempts++;
          const currentFiles = fs.readdirSync(downloadPath);
          const svgFile = currentFiles.find(file => file.endsWith('.svg'));
          
          if (svgFile) {
            const filePath = path.join(downloadPath, svgFile);
            const svgContent = fs.readFileSync(filePath, 'utf8');
            
            // Limpiar archivo temporal
            fs.unlinkSync(filePath);
            
            console.log('✅ SVG descargado y leído exitosamente');
            resolve(svgContent);
          } else if (attempts < maxAttempts) {
            setTimeout(checkForFile, checkInterval);
          } else {
            reject(new Error('Timeout: No se encontró el archivo SVG descargado'));
          }
        };
        
        setTimeout(checkForFile, checkInterval);
      });

      console.log('🎉 Exportación completada');
      return svgData;

    } catch (error) {
      console.error('❌ Error en exportación:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Guarda el SVG en un archivo
   * @param {string} svgData - Datos SVG
   * @param {string} filename - Nombre del archivo
   * @returns {Promise<string>} - Ruta del archivo guardado
   */
  async saveSVGToFile(svgData, filename) {
    const outputDir = path.join(__dirname, '../exports');
    
    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, svgData);
    
    console.log(`💾 SVG guardado en: ${filepath}`);
    return filepath;
  }

  /**
   * Método de conveniencia para crear y guardar SVG
   * @param {Object} shapeConfig - Configuración de la forma
   * @param {string} filename - Nombre del archivo (opcional)
   * @returns {Promise<Object>} - Resultado con SVG y ruta del archivo
   */
  async exportShape(shapeConfig, filename) {
    try {
      const svgData = await this.createAndExportSVG(shapeConfig);
      
      const finalFilename = filename || `${shapeConfig.type}-${Date.now()}.svg`;
      const filepath = await this.saveSVGToFile(svgData, finalFilename);
      
      return {
        success: true,
        svgData,
        filepath,
        filename: finalFilename
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Instancia singleton
const polotnoExporter = new PolotnoExporter();

// Limpiar al cerrar la aplicación
process.on('SIGINT', async () => {
  await polotnoExporter.closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await polotnoExporter.closeBrowser();
  process.exit(0);
});

module.exports = polotnoExporter;