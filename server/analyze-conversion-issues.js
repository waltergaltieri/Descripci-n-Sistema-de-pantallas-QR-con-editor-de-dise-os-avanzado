const { db } = require('./config/database');

async function analyzeConversionIssues() {
  try {
    await require('./config/database').initialize();
    
    const design = await db().get('SELECT id, name, content FROM designs WHERE id = 62');
    
    if (!design) {
      console.log('Diseño no encontrado');
      return;
    }
    
    const polotnoData = JSON.parse(design.content);
    const firstPage = polotnoData.pages[0];
    
    console.log('=== ANÁLISIS DE PROPIEDADES PERDIDAS EN LA CONVERSIÓN ===\n');
    
    firstPage.children.forEach((element, index) => {
      console.log(`--- ELEMENTO ${index + 1}: ${element.type.toUpperCase()} ---`);
      console.log('ID:', element.id);
      
      // Propiedades básicas que SÍ se mapean
      console.log('✅ Propiedades mapeadas:');
      console.log('  - Posición (x, y):', element.x, element.y);
      console.log('  - Dimensiones (width, height):', element.width, element.height);
      console.log('  - Rotación:', element.rotation);
      console.log('  - Opacidad:', element.opacity);
      console.log('  - Visible:', element.visible);
      
      // Propiedades específicas por tipo
      if (element.type === 'text') {
        console.log('  - Texto:', element.text);
        console.log('  - Tamaño fuente:', element.fontSize);
        console.log('  - Familia fuente:', element.fontFamily);
        console.log('  - Color:', element.fill);
        console.log('  - Alineación:', element.align);
      }
      
      if (element.type === 'image') {
        console.log('  - Fuente:', element.src);
      }
      
      if (element.type === 'figure') {
        console.log('  - Relleno:', element.fill);
        console.log('  - Borde:', element.stroke);
        console.log('  - Grosor borde:', element.strokeWidth);
        console.log('  - Radio esquinas:', element.cornerRadius);
      }
      
      // Propiedades que NO se están mapeando
      console.log('\n❌ Propiedades NO mapeadas (posibles causas de diferencias):');
      
      // Efectos y filtros
      if (element.blurEnabled) console.log('  - Desenfoque habilitado:', element.blurEnabled, 'Radio:', element.blurRadius);
      if (element.brightnessEnabled) console.log('  - Brillo habilitado:', element.brightnessEnabled, 'Valor:', element.brightness);
      if (element.sepiaEnabled) console.log('  - Sepia habilitado:', element.sepiaEnabled);
      if (element.grayscaleEnabled) console.log('  - Escala grises habilitado:', element.grayscaleEnabled);
      
      // Sombras
      if (element.shadowEnabled) {
        console.log('  - Sombra habilitada:', element.shadowEnabled);
        console.log('    - Desenfoque sombra:', element.shadowBlur);
        console.log('    - Offset X:', element.shadowOffsetX);
        console.log('    - Offset Y:', element.shadowOffsetY);
        console.log('    - Color sombra:', element.shadowColor);
        console.log('    - Opacidad sombra:', element.shadowOpacity);
      }
      
      // Propiedades de texto avanzadas
      if (element.type === 'text') {
        if (element.fontWeight) console.log('  - Peso fuente:', element.fontWeight);
        if (element.fontStyle) console.log('  - Estilo fuente:', element.fontStyle);
        if (element.textDecoration) console.log('  - Decoración texto:', element.textDecoration);
        if (element.lineHeight) console.log('  - Altura línea:', element.lineHeight);
        if (element.letterSpacing) console.log('  - Espaciado letras:', element.letterSpacing);
        if (element.verticalAlign) console.log('  - Alineación vertical:', element.verticalAlign);
      }
      
      // Propiedades de imagen avanzadas
      if (element.type === 'image') {
        if (element.cropX) console.log('  - Recorte X:', element.cropX);
        if (element.cropY) console.log('  - Recorte Y:', element.cropY);
        if (element.cropWidth) console.log('  - Ancho recorte:', element.cropWidth);
        if (element.cropHeight) console.log('  - Alto recorte:', element.cropHeight);
        if (element.flipX) console.log('  - Voltear X:', element.flipX);
        if (element.flipY) console.log('  - Voltear Y:', element.flipY);
      }
      
      // Propiedades de figura avanzadas
      if (element.type === 'figure') {
        if (element.dash && element.dash.length > 0) console.log('  - Línea discontinua:', element.dash);
        if (element.subType) console.log('  - Subtipo figura:', element.subType);
      }
      
      // Animaciones
      if (element.animations && element.animations.length > 0) {
        console.log('  - Animaciones:', element.animations.length, 'definidas');
      }
      
      // Propiedades de interacción
      if (element.draggable !== undefined) console.log('  - Arrastrable:', element.draggable);
      if (element.resizable !== undefined) console.log('  - Redimensionable:', element.resizable);
      if (element.contentEditable !== undefined) console.log('  - Contenido editable:', element.contentEditable);
      if (element.styleEditable !== undefined) console.log('  - Estilo editable:', element.styleEditable);
      
      console.log('\n' + '='.repeat(60) + '\n');
    });
    
    // Analizar propiedades del canvas
    console.log('=== PROPIEDADES DEL CANVAS ===');
    console.log('Dimensiones:', polotnoData.width, 'x', polotnoData.height);
    console.log('Fuentes:', polotnoData.fonts);
    
    // Verificar si hay fondo del canvas
    if (firstPage.background) {
      console.log('❌ Fondo del canvas NO mapeado:');
      console.log('  - Color fondo:', firstPage.background.color);
      console.log('  - Imagen fondo:', firstPage.background.image);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

analyzeConversionIssues();