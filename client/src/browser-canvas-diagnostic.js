// Script de diagnóstico para ejecutar en la consola del navegador
// Copia y pega este código en la consola del navegador (F12) cuando el problema ocurra

function diagnosticarCentradoCanvas() {
    console.log('=== DIAGNÓSTICO DE CENTRADO DEL CANVAS ===');
    
    // 1. Verificar estado del panel lateral
    const editorContainer = document.querySelector('.polotno-editor-isolation');
    const sidePanelState = editorContainer?.getAttribute('data-side-panel');
    console.log('Estado del panel lateral:', sidePanelState);
    
    // 2. Encontrar todos los elementos relevantes
    const workspace = document.querySelector('.polotno-workspace');
    const workspaceContainer = document.querySelector('.kaze-workspace-container');
    const konvaContent = document.querySelector('.konvajs-content');
    const canvas = document.querySelector('canvas');
    
    console.log('\n=== ELEMENTOS ENCONTRADOS ===');
    console.log('Workspace:', workspace);
    console.log('Workspace Container:', workspaceContainer);
    console.log('Konva Content:', konvaContent);
    console.log('Canvas:', canvas);
    
    // 3. Analizar posiciones y dimensiones
    function analizarElemento(elemento, nombre) {
        if (!elemento) {
            console.log(`${nombre}: NO ENCONTRADO`);
            return;
        }
        
        const rect = elemento.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(elemento);
        
        console.log(`\n=== ${nombre.toUpperCase()} ===`);
        console.log('BoundingClientRect:', {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom
        });
        
        console.log('Estilos computados relevantes:', {
            position: computedStyle.position,
            left: computedStyle.left,
            top: computedStyle.top,
            right: computedStyle.right,
            bottom: computedStyle.bottom,
            transform: computedStyle.transform,
            margin: computedStyle.margin,
            marginLeft: computedStyle.marginLeft,
            marginRight: computedStyle.marginRight,
            display: computedStyle.display,
            justifyContent: computedStyle.justifyContent,
            alignItems: computedStyle.alignItems,
            width: computedStyle.width,
            height: computedStyle.height,
            zIndex: computedStyle.zIndex
        });
        
        // Verificar estilos inline
        if (elemento.style.cssText) {
            console.log('Estilos inline:', elemento.style.cssText);
        }
        
        // Verificar clases CSS
        console.log('Clases CSS:', Array.from(elemento.classList));
    }
    
    // 4. Analizar cada elemento
    analizarElemento(workspaceContainer, 'WORKSPACE CONTAINER');
    analizarElemento(workspace, 'POLOTNO WORKSPACE');
    analizarElemento(konvaContent, 'KONVA CONTENT');
    analizarElemento(canvas, 'CANVAS');
    
    // 5. Verificar viewport y centrado
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    console.log('\n=== INFORMACIÓN DEL VIEWPORT ===');
    console.log('Ancho del viewport:', viewportWidth);
    console.log('Alto del viewport:', viewportHeight);
    console.log('Centro horizontal del viewport:', viewportWidth / 2);
    console.log('Centro vertical del viewport:', viewportHeight / 2);
    
    // 6. Calcular desplazamiento del canvas
    if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const canvasCenterX = canvasRect.left + (canvasRect.width / 2);
        const canvasCenterY = canvasRect.top + (canvasRect.height / 2);
        const viewportCenterX = viewportWidth / 2;
        const viewportCenterY = viewportHeight / 2;
        
        const desplazamientoX = canvasCenterX - viewportCenterX;
        const desplazamientoY = canvasCenterY - viewportCenterY;
        
        console.log('\n=== ANÁLISIS DE CENTRADO ===');
        console.log('Centro del canvas X:', canvasCenterX);
        console.log('Centro del viewport X:', viewportCenterX);
        console.log('Desplazamiento horizontal:', desplazamientoX);
        console.log('Centro del canvas Y:', canvasCenterY);
        console.log('Centro del viewport Y:', viewportCenterY);
        console.log('Desplazamiento vertical:', desplazamientoY);
        
        if (Math.abs(desplazamientoX) > 10) {
            console.warn('⚠️ PROBLEMA: El canvas NO está centrado horizontalmente');
            console.warn('Desplazamiento horizontal:', desplazamientoX + 'px');
        } else {
            console.log('✅ El canvas está centrado horizontalmente');
        }
        
        if (Math.abs(desplazamientoY) > 10) {
            console.warn('⚠️ PROBLEMA: El canvas NO está centrado verticalmente');
            console.warn('Desplazamiento vertical:', desplazamientoY + 'px');
        } else {
            console.log('✅ El canvas está centrado verticalmente');
        }
    }
    
    // 7. Buscar elementos que puedan estar interfiriendo
    console.log('\n=== ELEMENTOS QUE PUEDEN INTERFERIR ===');
    const elementosConLeft = document.querySelectorAll('[style*="left"]');
    const elementosConTransform = document.querySelectorAll('[style*="transform"]');
    const elementosConPosition = document.querySelectorAll('[style*="position"]');
    
    console.log('Elementos con left inline:', elementosConLeft.length);
    elementosConLeft.forEach((el, i) => {
        if (el.style.left) {
            console.log(`  ${i + 1}. ${el.tagName}.${el.className} - left: ${el.style.left}`);
        }
    });
    
    console.log('Elementos con transform inline:', elementosConTransform.length);
    elementosConTransform.forEach((el, i) => {
        if (el.style.transform) {
            console.log(`  ${i + 1}. ${el.tagName}.${el.className} - transform: ${el.style.transform}`);
        }
    });
    
    console.log('Elementos con position inline:', elementosConPosition.length);
    elementosConPosition.forEach((el, i) => {
        if (el.style.position) {
            console.log(`  ${i + 1}. ${el.tagName}.${el.className} - position: ${el.style.position}`);
        }
    });
    
    // 8. Verificar reglas CSS aplicadas
    console.log('\n=== VERIFICACIÓN DE REGLAS CSS ===');
    const stylesheets = Array.from(document.styleSheets);
    let reglasRelevantes = [];
    
    stylesheets.forEach(sheet => {
        try {
            const rules = Array.from(sheet.cssRules || sheet.rules || []);
            rules.forEach(rule => {
                if (rule.selectorText && (
                    rule.selectorText.includes('polotno-workspace') ||
                    rule.selectorText.includes('konvajs-content') ||
                    rule.selectorText.includes('kaze-workspace-container') ||
                    rule.selectorText.includes('data-side-panel="hidden"')
                )) {
                    reglasRelevantes.push({
                        selector: rule.selectorText,
                        cssText: rule.cssText
                    });
                }
            });
        } catch (e) {
            // Ignorar errores de CORS
        }
    });
    
    console.log('Reglas CSS relevantes encontradas:', reglasRelevantes.length);
    reglasRelevantes.forEach((regla, i) => {
        console.log(`${i + 1}. ${regla.selector}`);
        console.log(`   ${regla.cssText}`);
    });
    
    console.log('\n=== FIN DEL DIAGNÓSTICO ===');
    console.log('Copia toda esta información y compártela para análisis.');
}

// Función para probar corrección temporal
function aplicarCorreccionTemporal() {
    console.log('Aplicando corrección temporal...');
    
    const workspace = document.querySelector('.polotno-workspace');
    if (workspace) {
        // Remover todos los estilos inline problemáticos
        workspace.style.position = 'fixed';
        workspace.style.top = '50%';
        workspace.style.left = '50%';
        workspace.style.transform = 'translate(-50%, -50%)';
        workspace.style.zIndex = '1000';
        
        console.log('Corrección aplicada. ¿El canvas está centrado ahora?');
    } else {
        console.log('No se encontró el workspace');
    }
}

// Función para revertir corrección
function revertirCorreccion() {
    console.log('Revirtiendo corrección...');
    
    const workspace = document.querySelector('.polotno-workspace');
    if (workspace) {
        workspace.style.position = '';
        workspace.style.top = '';
        workspace.style.left = '';
        workspace.style.transform = '';
        workspace.style.zIndex = '';
        
        console.log('Corrección revertida.');
    }
}

console.log('=== SCRIPT DE DIAGNÓSTICO CARGADO ===');
console.log('Ejecuta: diagnosticarCentradoCanvas() - para diagnosticar el problema');
console.log('Ejecuta: aplicarCorreccionTemporal() - para probar una corrección');
console.log('Ejecuta: revertirCorreccion() - para revertir la corrección');

// Auto-ejecutar diagnóstico
diagnosticarCentradoCanvas();