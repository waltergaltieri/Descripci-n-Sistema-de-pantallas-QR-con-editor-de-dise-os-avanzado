const fs = require('fs');
const path = require('path');

// Función para migrar un archivo de PostgreSQL a SQLite
function migrateFile(filePath) {
  console.log(`Migrando ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Reemplazar importaciones
  content = content.replace(
    /const \{ pool \} = require\('\.\.\/config\/database'\);/g,
    "const { db } = require('../config/database');"
  );
  
  // Reemplazar patrones de PostgreSQL
  content = content.replace(
    /const client = await pool\.connect\(\);[\s\S]*?try \{/g,
    ''
  );
  
  content = content.replace(
    /\} finally \{[\s\S]*?client\.release\(\);[\s\S]*?\}/g,
    ''
  );
  
  // Reemplazar consultas
  content = content.replace(
    /await client\.query\(/g,
    'await db().run('
  );
  
  content = content.replace(
    /client\.query\(/g,
    'db().get('
  );
  
  // Reemplazar parámetros $1, $2, etc. con ?
  content = content.replace(/\$\d+/g, '?');
  
  // Reemplazar result.rows con result
  content = content.replace(/result\.rows/g, 'result');
  
  // Reemplazar result.rows[0] con result
  content = content.replace(/result\[0\]/g, 'result');
  
  fs.writeFileSync(filePath, content);
  console.log(`✓ ${filePath} migrado`);
}

// Migrar archivos de rutas
const routesDir = path.join(__dirname, 'routes');
const routeFiles = ['designs.js', 'screens.js', 'uploads.js'];

routeFiles.forEach(file => {
  const filePath = path.join(routesDir, file);
  if (fs.existsSync(filePath)) {
    migrateFile(filePath);
  }
});

console.log('\n✅ Migración completada!');
console.log('Nota: Revisa manualmente los archivos para ajustes específicos.');