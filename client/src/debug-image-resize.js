// Script de depuración para investigar el problema de redimensionamiento de imágenes
// Ejecutar en la consola del navegador cuando el editor esté cargado

function debugImageResizeIssue() {
  console.log('🔍 Iniciando depuración del problema de redimensionamiento de imágenes...');
  
  // Verificar que el store esté disponible
  if (!window.polotnoStore) {
    console.error('❌ polotnoStore no está disponible en window');
    return;
  }
  
  const store = window.polotnoStore;
  
  // Obtener todos los elementos de la página activa
  const elements = store.activePage?.children || [];
  console.log(`📊 Total de elementos en la página: ${elements.length}`);
  
  // Filtrar elementos de imagen
  const imageElements = elements.filter(el => el.type === 'image');
  console.log(`🖼️ Elementos de imagen encontrados: ${imageElements.length}`);
  
  if (imageElements.length === 0) {
    console.log('ℹ️ No hay elementos de imagen para analizar. Agrega una imagen al canvas primero.');
    return;
  }
  
  // Analizar cada elemento de imagen
  imageElements.forEach((element, index) => {
    console.log(`\n🔍 Analizando elemento de imagen ${index + 1}:`);
    console.log('  ID:', element.id);
    console.log('  Tipo:', element.type);
    console.log('  Propiedades de bloqueo:');
    console.log('    - draggable:', element.draggable);
    console.log('    - resizable:', element.resizable);
    console.log('    - removable:', element.removable);
    console.log('    - selectable:', element.selectable);
    console.log('    - contentEditable:', element.contentEditable);
    console.log('    - styleEditable:', element.styleEditable);
    console.log('    - locked:', element.locked);
    
    // Verificar si la propiedad resizable está definida
    if (element.resizable === undefined) {
      console.log('⚠️ La propiedad resizable no está definida (debería ser true por defecto)');
    } else if (element.resizable === false) {
      console.log('❌ La propiedad resizable está establecida en false');
    } else {
      console.log('✅ La propiedad resizable está establecida en true');
    }
  });
  
  return {
    totalElements: elements.length,
    imageElements: imageElements.length,
    elements: imageElements
  };
}

function enableResizeForAllImages() {
  console.log('🔧 Habilitando redimensionamiento para todas las imágenes...');
  
  if (!window.polotnoStore) {
    console.error('❌ polotnoStore no está disponible en window');
    return;
  }
  
  const store = window.polotnoStore;
  const elements = store.activePage?.children || [];
  const imageElements = elements.filter(el => el.type === 'image');
  
  if (imageElements.length === 0) {
    console.log('ℹ️ No hay elementos de imagen para modificar.');
    return;
  }
  
  let modifiedCount = 0;
  
  imageElements.forEach((element, index) => {
    try {
      // Establecer todas las propiedades de edición en true
      element.set({
        draggable: true,
        resizable: true,
        removable: true,
        selectable: true,
        contentEditable: true,
        styleEditable: true,
        locked: false
      });
      
      console.log(`✅ Elemento de imagen ${index + 1} modificado exitosamente`);
      modifiedCount++;
    } catch (error) {
      console.error(`❌ Error modificando elemento de imagen ${index + 1}:`, error);
    }
  });
  
  console.log(`🎉 Se modificaron ${modifiedCount} de ${imageElements.length} elementos de imagen`);
  
  // Forzar actualización del canvas
  try {
    store.selectElements([]);
    console.log('🔄 Canvas actualizado');
  } catch (error) {
    console.warn('⚠️ Error actualizando canvas:', error);
  }
  
  return modifiedCount;
}

function createTestImage() {
  console.log('🖼️ Creando imagen de prueba...');
  
  if (!window.polotnoStore) {
    console.error('❌ polotnoStore no está disponible en window');
    return;
  }
  
  const store = window.polotnoStore;
  
  if (!store.activePage) {
    console.error('❌ No hay página activa');
    return;
  }
  
  try {
    // Crear una imagen de prueba con una URL de ejemplo
    const testImageElement = {
      type: 'image',
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      src: 'https://via.placeholder.com/200x200/3b82f6/ffffff?text=Test+Image',
      // Asegurar que todas las propiedades de edición estén habilitadas
      draggable: true,
      resizable: true,
      removable: true,
      selectable: true,
      contentEditable: true,
      styleEditable: true,
      locked: false
    };
    
    store.activePage.addElement(testImageElement);
    console.log('✅ Imagen de prueba creada exitosamente');
    
    // Seleccionar la imagen recién creada después de un breve delay
    setTimeout(() => {
      const elements = store.activePage.children;
      const lastElement = elements[elements.length - 1];
      if (lastElement && lastElement.type === 'image') {
        store.selectElements([lastElement.id]);
        console.log('🎯 Imagen de prueba seleccionada');
      }
    }, 500);
    
  } catch (error) {
    console.error('❌ Error creando imagen de prueba:', error);
  }
}

// Hacer las funciones disponibles globalmente
window.debugImageResizeIssue = debugImageResizeIssue;
window.enableResizeForAllImages = enableResizeForAllImages;
window.createTestImage = createTestImage;

console.log('🔧 Script de depuración de redimensionamiento de imágenes cargado');
console.log('💡 Funciones disponibles:');
console.log('  - debugImageResizeIssue(): Analiza las propiedades de elementos de imagen');
console.log('  - enableResizeForAllImages(): Habilita redimensionamiento para todas las imágenes');
console.log('  - createTestImage(): Crea una imagen de prueba con redimensionamiento habilitado');