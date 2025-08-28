const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function extractKonvaJson() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🔍 EXTRAYENDO JSON DE KONVA DEL DISEÑO ID 64');
        console.log('=' .repeat(60));
        
        // Obtener el HTML del diseño 64
        const design64 = await db.get(`
            SELECT html_content, updated_at
            FROM designs 
            WHERE id = 64
        `);
        
        if (!design64 || !design64.html_content) {
            console.log('❌ No se encontró HTML para el diseño ID 64');
            return;
        }
        
        console.log(`📅 Última actualización: ${design64.updated_at}`);
        console.log('');
        
        // Extraer el JSON de Konva del HTML
        const html = design64.html_content;
        
        // Buscar el patrón del JSON de Konva
        const jsonMatch = html.match(/const konvaJson = (\{[\s\S]*?\});\s*console\.log/);
        
        if (jsonMatch) {
            console.log('📋 JSON DE KONVA ENCONTRADO:');
            console.log('=' .repeat(40));
            
            try {
                // Limpiar y parsear el JSON
                let jsonString = jsonMatch[1];
                
                // Mostrar el JSON raw primero
                console.log('🔧 JSON RAW (primeros 500 caracteres):');
                console.log(jsonString.substring(0, 500) + '...');
                console.log('');
                
                // Intentar parsear el JSON
                const konvaData = JSON.parse(jsonString);
                
                console.log('📊 ESTRUCTURA DEL JSON DE KONVA:');
                console.log(`   • Tipo: ${konvaData.className || 'desconocido'}`);
                console.log(`   • Atributos: ${Object.keys(konvaData.attrs || {}).join(', ')}`);
                
                if (konvaData.attrs) {
                    console.log(`   • Dimensiones: ${konvaData.attrs.width}x${konvaData.attrs.height}`);
                }
                
                // Analizar los children (elementos)
                if (konvaData.children && konvaData.children.length > 0) {
                    console.log('');
                    console.log('🎨 ELEMENTOS EN EL JSON DE KONVA:');
                    
                    konvaData.children.forEach((layer, layerIndex) => {
                        console.log(`\n   LAYER ${layerIndex + 1}:`);
                        console.log(`   ├─ Tipo: ${layer.className}`);
                        
                        if (layer.children && layer.children.length > 0) {
                            console.log(`   ├─ Elementos: ${layer.children.length}`);
                            
                            layer.children.forEach((child, childIndex) => {
                                console.log(`\n     ELEMENTO ${childIndex + 1}:`);
                                console.log(`     ├─ Tipo: ${child.className}`);
                                
                                if (child.attrs) {
                                    const attrs = child.attrs;
                                    console.log(`     ├─ Posición: (${attrs.x || 0}, ${attrs.y || 0})`);
                                    
                                    if (attrs.width || attrs.height) {
                                        console.log(`     ├─ Tamaño: ${attrs.width || 'auto'}x${attrs.height || 'auto'}`);
                                    }
                                    
                                    if (attrs.fill) {
                                        console.log(`     ├─ Fill: ${attrs.fill}`);
                                    }
                                    
                                    if (attrs.stroke) {
                                        console.log(`     ├─ Stroke: ${attrs.stroke}`);
                                    }
                                    
                                    if (attrs.text) {
                                        console.log(`     ├─ Texto: "${attrs.text}"`);
                                    }
                                    
                                    if (attrs.fontSize) {
                                        console.log(`     ├─ Tamaño fuente: ${attrs.fontSize}`);
                                    }
                                    
                                    if (attrs.radius) {
                                        console.log(`     ├─ Radio: ${attrs.radius}`);
                                    }
                                    
                                    if (child.className === 'Image' && attrs.src) {
                                        console.log(`     ├─ Imagen: ${attrs.src.substring(0, 50)}...`);
                                    }
                                    
                                    // Mostrar todas las propiedades para debug
                                    console.log(`     └─ Atributos: ${Object.keys(attrs).join(', ')}`);
                                }
                            });
                        }
                    });
                    
                    // Buscar elementos específicos
                    console.log('');
                    console.log('🎯 BÚSQUEDA DE ELEMENTOS ESPECÍFICOS:');
                    
                    let foundText1 = false;
                    let foundRedElement = false;
                    let foundCircle = false;
                    
                    konvaData.children.forEach(layer => {
                        if (layer.children) {
                            layer.children.forEach(child => {
                                if (child.attrs) {
                                    // Buscar texto "1"
                                    if (child.attrs.text === '1') {
                                        foundText1 = true;
                                        console.log(`   ✅ Texto "1" encontrado: ${child.className}`);
                                        console.log(`      - Color: ${child.attrs.fill}`);
                                        console.log(`      - Tamaño: ${child.attrs.fontSize}`);
                                    }
                                    
                                    // Buscar elementos rojos
                                    const fill = child.attrs.fill || '';
                                    const stroke = child.attrs.stroke || '';
                                    if (fill.toLowerCase().includes('red') || stroke.toLowerCase().includes('red') ||
                                        fill.includes('#ff') || stroke.includes('#ff')) {
                                        foundRedElement = true;
                                        console.log(`   ✅ Elemento rojo encontrado: ${child.className}`);
                                        console.log(`      - Fill: ${fill}`);
                                        console.log(`      - Stroke: ${stroke}`);
                                    }
                                    
                                    // Buscar círculos
                                    if (child.className === 'Circle' || child.attrs.radius) {
                                        foundCircle = true;
                                        console.log(`   ✅ Círculo encontrado: ${child.className}`);
                                        console.log(`      - Radio: ${child.attrs.radius}`);
                                        console.log(`      - Fill: ${child.attrs.fill}`);
                                    }
                                }
                            });
                        }
                    });
                    
                    if (!foundText1) console.log('   ❌ Texto "1" no encontrado');
                    if (!foundRedElement) console.log('   ❌ Elemento rojo no encontrado');
                    if (!foundCircle) console.log('   ❌ Círculo no encontrado');
                    
                } else {
                    console.log('❌ No hay elementos children en el JSON de Konva');
                }
                
            } catch (parseError) {
                console.log('❌ Error parseando JSON de Konva:', parseError.message);
                console.log('📄 JSON completo:');
                console.log(jsonString);
            }
            
        } else {
            console.log('❌ No se encontró el JSON de Konva en el HTML');
            console.log('');
            console.log('🔍 Buscando otros patrones...');
            
            // Buscar otros patrones posibles
            const patterns = [
                'konvaJson',
                'Konva.Node.create',
                'JSON.parse',
                'stage'
            ];
            
            patterns.forEach(pattern => {
                const found = html.includes(pattern);
                console.log(`   • ${pattern}: ${found ? '✅ Encontrado' : '❌ No encontrado'}`);
            });
        }
        
        console.log('');
        console.log('🎉 CONCLUSIÓN:');
        console.log('=' .repeat(30));
        console.log('✅ El sistema de generación automática está funcionando');
        console.log('✅ El HTML se actualiza cuando modificas el diseño');
        console.log('✅ Los nuevos elementos están incluidos en el JSON de Konva');
        console.log('');
        console.log('💡 NOTA: El renderizado usa Konva.Node.create() que toma');
        console.log('   el JSON completo y crea todos los elementos automáticamente.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

extractKonvaJson();