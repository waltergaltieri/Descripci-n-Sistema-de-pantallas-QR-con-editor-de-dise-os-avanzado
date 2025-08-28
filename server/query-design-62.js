const { db } = require('./config/database');

async function queryDesign62() {
  try {
    // Inicializar la base de datos
    await require('./config/database').initialize();
    
    const design = await db().get('SELECT id, name, content, enhanced_content FROM designs WHERE id = 62');
    
    console.log('=== DISEÑO ID 62 ===');
    console.log('ID:', design?.id);
    console.log('Nombre:', design?.name);
    
    console.log('\n=== ANÁLISIS COMPARATIVO ===');
    console.log('CONTENT longitud:', design?.content ? design.content.length : 0);
    console.log('ENHANCED_CONTENT longitud:', design?.enhanced_content ? design.enhanced_content.length : 0);
    
    console.log('\n=== CONTENT (JSON original de Polotno) - primeros 300 caracteres ===');
    if (design?.content) {
      console.log(design.content.substring(0, 300) + '...');
    }
    
    console.log('\n=== ENHANCED_CONTENT (JSON mejorado) - primeros 500 caracteres ===');
    if (design?.enhanced_content) {
      console.log(design.enhanced_content.substring(0, 500) + '...');
    }
    
    // Analizar la estructura de enhanced_content
    if (design?.enhanced_content) {
      try {
        const enhancedData = JSON.parse(design.enhanced_content);
        console.log('\n=== ESTRUCTURA DE ENHANCED_CONTENT ===');
        console.log('Versión:', enhancedData.version);
        console.log('Timestamp:', enhancedData.timestamp);
        console.log('Tiene original:', !!enhancedData.original);
        console.log('Tiene computed:', !!enhancedData.computed);
        console.log('Tiene metadata:', !!enhancedData.metadata);
        
        if (enhancedData.metadata) {
          console.log('\n=== METADATA EN ENHANCED_CONTENT ===');
          console.log('Total elementos:', enhancedData.metadata.totalElements);
          console.log('Tipos de elementos:', enhancedData.metadata.elementTypes);
          console.log('Dimensiones:', enhancedData.metadata.dimensions);
        }
      } catch (error) {
        console.log('Error parseando enhanced_content:', error.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

queryDesign62();