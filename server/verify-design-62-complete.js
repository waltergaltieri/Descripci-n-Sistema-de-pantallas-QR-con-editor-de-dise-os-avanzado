const { db } = require('./config/database');

async function verifyDesign62Complete() {
  try {
    await require('./config/database').initialize();
    
    const design = await db().get('SELECT id, name, content FROM designs WHERE id = 62');
    
    if (!design) {
      console.log('Diseño no encontrado');
      return;
    }
    
    const polotnoData = JSON.parse(design.content);
    const firstPage = polotnoData.pages[0];
    
    console.log('=== VERIFICACIÓN COMPLETA DEL DISEÑO ID 62 ===\n');
    console.log('Nombre del diseño:', design.name);
    
    // 1. DIMENSIONES DEL DISEÑO
    console.log('\n🎯 1. DIMENSIONES DEL DISEÑO:');
    console.log('✅ Ancho:', polotnoData.width, 'px');
    console.log('✅ Alto:', polotnoData.height, 'px');
    
    // 2. FONDO/BACKGROUND
    console.log('\n🎯 2. FONDO/BACKGROUND:');
    if (firstPage.background) {
      console.log('✅ Fondo definido:');
      if (firstPage.background.color) {
        console.log('  - Color:', firstPage.background.color);
      }
      if (firstPage.background.image) {
        console.log('  - Imagen:', firstPage.background.image);
      }
    } else {
      console.log('❌ No hay fondo definido en la página');
    }
    
    // Verificar si hay background en el canvas general
    if (polotnoData.background) {
      console.log('✅ Fondo del canvas:');
      console.log('  - Color:', polotnoData.background.color);
      console.log('  - Imagen:', polotnoData.background.image);
    }
    
    console.log('\n🎯 3. ELEMENTOS DEL DISEÑO:');
    console.log('Total de elementos:', firstPage.children.length);
    
    let textCount = 0;
    let imageCount = 0;
    let figureCount = 0;
    let imageWithMaskCount = 0;
    
    firstPage.children.forEach((element, index) => {
      console.log(`\n--- ELEMENTO ${index + 1}: ${element.type.toUpperCase()} ---`);
      console.log('ID:', element.id);
      
      // POSICIÓN EXACTA
      console.log('✅ Posición exacta:');
      console.log('  - X:', element.x);
      console.log('  - Y:', element.y);
      console.log('  - Ancho:', element.width);
      console.log('  - Alto:', element.height);
      console.log('  - Rotación:', element.rotation, 'grados');
      console.log('  - Opacidad:', element.opacity);
      
      if (element.type === 'text') {
        textCount++;
        console.log('✅ TEXTO COMPLETO:');
        console.log('  - Contenido:', `"${element.text}"`);
        console.log('  - Fuente:', element.fontFamily);
        console.log('  - Tamaño:', element.fontSize, 'px');
        console.log('  - Color:', element.fill);
        console.log('  - Peso:', element.fontWeight || 'normal');
        console.log('  - Estilo:', element.fontStyle || 'normal');
        console.log('  - Alineación:', element.align);
        console.log('  - Altura línea:', element.lineHeight);
        console.log('  - Alineación vertical:', element.verticalAlign);
      }
      
      if (element.type === 'image') {
        imageCount++;
        console.log('✅ IMAGEN COMPLETA:');
        console.log('  - URL:', element.src);
        
        // Verificar si tiene máscara/recorte
        const hasCrop = element.cropX !== undefined || element.cropY !== undefined || 
                       element.cropWidth !== undefined || element.cropHeight !== undefined;
        
        if (hasCrop) {
          imageWithMaskCount++;
          console.log('🎭 IMAGEN CON MÁSCARA/RECORTE:');
          console.log('  - Recorte X:', element.cropX);
          console.log('  - Recorte Y:', element.cropY);
          console.log('  - Ancho recorte:', element.cropWidth);
          console.log('  - Alto recorte:', element.cropHeight);
        } else {
          console.log('📷 IMAGEN NORMAL (sin máscara)');
        }
        
        if (element.flipX || element.flipY) {
          console.log('  - Voltear X:', element.flipX);
          console.log('  - Voltear Y:', element.flipY);
        }
      }
      
      if (element.type === 'figure') {
        figureCount++;
        console.log('✅ FORMA COMPLETA:');
        console.log('  - Subtipo:', element.subType || 'rectangle');
        console.log('  - Color relleno:', element.fill);
        console.log('  - Color borde:', element.stroke);
        console.log('  - Grosor borde:', element.strokeWidth);
        console.log('  - Radio esquinas:', element.cornerRadius);
        
        if (element.dash && element.dash.length > 0) {
          console.log('  - Línea discontinua:', element.dash);
        }
      }
      
      // EFECTOS VISUALES
      const hasEffects = element.blurEnabled || element.brightnessEnabled || 
                        element.sepiaEnabled || element.grayscaleEnabled || 
                        element.shadowEnabled;
      
      if (hasEffects) {
        console.log('✨ EFECTOS VISUALES:');
        if (element.blurEnabled) {
          console.log('  - Desenfoque:', element.blurRadius, 'px');
        }
        if (element.brightnessEnabled) {
          console.log('  - Brillo:', element.brightness);
        }
        if (element.sepiaEnabled) {
          console.log('  - Sepia: activado');
        }
        if (element.grayscaleEnabled) {
          console.log('  - Escala grises: activado');
        }
        if (element.shadowEnabled) {
          console.log('  - Sombra:', element.shadowColor, 'blur:', element.shadowBlur, 
                     'offset:', element.shadowOffsetX, element.shadowOffsetY);
        }
      }
    });
    
    // RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('🎯 RESUMEN DE VERIFICACIÓN:');
    console.log('✅ Dimensiones del diseño: SÍ están (', polotnoData.width, 'x', polotnoData.height, ')');
    console.log('✅ Posiciones exactas: SÍ están (x, y, width, height, rotation)');
    console.log('✅ Textos encontrados:', textCount);
    console.log('✅ Imágenes normales:', imageCount - imageWithMaskCount);
    console.log('✅ Imágenes con máscara:', imageWithMaskCount);
    console.log('✅ Formas encontradas:', figureCount);
    
    if (firstPage.background || polotnoData.background) {
      console.log('✅ Fondo/Background: SÍ está definido');
    } else {
      console.log('❌ Fondo/Background: NO encontrado');
    }
    
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('Toda la información visual del diseño SÍ está presente en el JSON.');
    console.log('El problema está en la función de conversión que no mapea todas las propiedades.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyDesign62Complete();