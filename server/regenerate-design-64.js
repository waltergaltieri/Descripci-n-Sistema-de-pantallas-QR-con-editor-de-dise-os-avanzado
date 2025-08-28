const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { generateKonvaHtml } = require('./utils/konvaRenderer');

console.log('🔄 REGENERANDO DISEÑO 64 CON CORRECCIÓN APLICADA...');
console.log('============================================================');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Obtener el diseño 64
db.get('SELECT * FROM designs WHERE id = ?', [64], async (err, design) => {
    if (err) {
        console.error('❌ Error al obtener el diseño:', err);
        return;
    }
    
    if (!design) {
        console.error('❌ Diseño 64 no encontrado');
        return;
    }
    
    console.log('📄 Diseño encontrado:', design.name);
    console.log('📐 Dimensiones:', design.width + 'x' + design.height);
    
    try {
        // Generar HTML con la corrección aplicada
        const timestamp = Date.now();
        const filename = `design-64-corrected-${timestamp}.html`;
        const filepath = path.join(__dirname, filename);
        
        await generateKonvaHtml(64, filepath);
        
        // Leer el contenido generado
        const htmlContent = fs.readFileSync(filepath, 'utf8');
        
        fs.writeFileSync(filepath, htmlContent);
        
        console.log('✅ HTML regenerado exitosamente');
        console.log('📁 Archivo:', filename);
        
        // Actualizar la base de datos con el nuevo HTML
        db.run('UPDATE designs SET html_content = ? WHERE id = ?', [htmlContent, 64], (updateErr) => {
            if (updateErr) {
                console.error('❌ Error al actualizar la base de datos:', updateErr);
            } else {
                console.log('✅ Base de datos actualizada');
            }
            
            db.close();
            
            console.log('\n🎯 VERIFICACIÓN RÁPIDA:');
            console.log('--------------------------------------------------');
            
            // Extraer y analizar el JSON de Konva
            const jsonMatch = htmlContent.match(/const konvaJson = `([^`]+)`;/);
            if (jsonMatch) {
                try {
                    const konvaData = JSON.parse(jsonMatch[1]);
                    const textElement = konvaData.children[0].children.find(child => 
                        child.className === 'Text' && child.attrs.text === '1'
                    );
                    
                    if (textElement) {
                        console.log('📝 Texto "1" encontrado:');
                        console.log('   • Posición X:', textElement.attrs.x);
                        console.log('   • Posición Y:', textElement.attrs.y);
                        console.log('   • Alineación:', textElement.attrs.align);
                        
                        const canvasCenter = design.width / 2;
                        const difference = Math.abs(textElement.attrs.x - canvasCenter);
                        
                        console.log('   • Centro del lienzo:', canvasCenter);
                        console.log('   • Diferencia:', difference.toFixed(2) + 'px');
                        
                        if (difference < 5) {
                            console.log('🎉 ¡CENTRADO PERFECTO!');
                        } else {
                            console.log('⚠️  Aún necesita ajustes');
                        }
                    }
                } catch (parseErr) {
                    console.log('❌ Error al analizar JSON:', parseErr.message);
                }
            }
        });
        
    } catch (genErr) {
        console.error('❌ Error al generar HTML:', genErr);
        db.close();
    }
});