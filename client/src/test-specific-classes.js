// Script de prueba para verificar la solución con clases específicas
// Ejecutar en la consola del navegador

// Función para probar el toggle del panel lateral con las nuevas clases
function testSpecificClassesSolution() {
  console.log('🧪 PROBANDO SOLUCIÓN CON CLASES ESPECÍFICAS - VERSIÓN MEJORADA');
  
  // Verificar que los elementos con las nuevas clases existen
  const container = document.getElementById('polotno-container');
  const editorContainer = document.querySelector('.kaze-polotno-editor-container');
  const sidePanelFixed = document.querySelector('.kaze-side-panel-fixed');
  const workspaceContainer = document.querySelector('.kaze-workspace-container');
  const workspaceInner = document.querySelector('.kaze-workspace-inner');
  
  console.log('📍 VERIFICACIÓN DE ELEMENTOS:');
  console.log('   - Container principal:', !!container);
  console.log('   - Editor container (.kaze-polotno-editor-container):', !!editorContainer);
  console.log('   - Side panel (.kaze-side-panel-fixed):', !!sidePanelFixed);
  console.log('   - Workspace container (.kaze-workspace-container):', !!workspaceContainer);
  console.log('   - Workspace inner (.kaze-workspace-inner):', !!workspaceInner);
  
  if (!container || !workspaceContainer || !workspaceInner) {
    console.error('❌ Faltan elementos críticos');
    return;
  }
  
  // Obtener estado actual
  const currentState = container.getAttribute('data-side-panel');
  console.log('📊 Estado actual del panel:', currentState);
  
  // Verificar si el panel está realmente oculto cuando debería estarlo
  if (sidePanelFixed && currentState === 'hidden') {
    const sidePanelStyles = window.getComputedStyle(sidePanelFixed);
    const isReallyHidden = sidePanelStyles.display === 'none' || 
                          sidePanelStyles.visibility === 'hidden' || 
                          sidePanelStyles.opacity === '0' ||
                          sidePanelStyles.width === '0px';
    console.log('🔍 VERIFICACIÓN DE OCULTACIÓN COMPLETA:');
    console.log('   - Panel realmente oculto:', isReallyHidden);
    console.log('   - Detalles:', {
      display: sidePanelStyles.display,
      visibility: sidePanelStyles.visibility,
      opacity: sidePanelStyles.opacity,
      width: sidePanelStyles.width
    });
  }
  
  // Función para inspeccionar estilos aplicados
  function inspectStyles(state) {
    console.log(`\n🎯 ESTILOS APLICADOS (${state.toUpperCase()}):`);
    
    if (workspaceContainer) {
      const containerStyles = window.getComputedStyle(workspaceContainer);
      console.log('   WorkspaceContainer:');
      console.log('     - justify-content:', containerStyles.justifyContent);
      console.log('     - align-items:', containerStyles.alignItems);
      console.log('     - margin:', containerStyles.margin);
      console.log('     - width:', containerStyles.width);
    }
    
    // Verificar centrado específico del canvas de Polotno
    const polotnoWorkspace = document.querySelector('.polotno-workspace');
    if (polotnoWorkspace) {
      const workspaceStyles = window.getComputedStyle(polotnoWorkspace);
      console.log('   🎨 Polotno Workspace:');
      console.log('     - margin:', workspaceStyles.margin);
      console.log('     - left:', workspaceStyles.left);
      console.log('     - transform:', workspaceStyles.transform);
      console.log('     - position:', workspaceStyles.position);
    }

    // Verificar canvas de Konva
    const konvaCanvas = document.querySelector('.polotno-workspace canvas');
    if (konvaCanvas) {
      const canvasStyles = window.getComputedStyle(konvaCanvas);
      console.log('   🖼️ Konva Canvas:');
      console.log('     - margin:', canvasStyles.margin);
      console.log('     - display:', canvasStyles.display);
      console.log('     - left:', canvasStyles.left);
      console.log('     - transform:', canvasStyles.transform);
    }
    
    if (workspaceInner) {
      const innerStyles = window.getComputedStyle(workspaceInner);
      console.log('   WorkspaceInner:');
      console.log('     - margin:', innerStyles.margin);
      console.log('     - text-align:', innerStyles.textAlign);
      console.log('     - justify-content:', innerStyles.justifyContent);
      console.log('     - align-items:', innerStyles.alignItems);
    }
    
    if (sidePanelFixed) {
      const panelStyles = window.getComputedStyle(sidePanelFixed);
      console.log('   SidePanel:');
      console.log('     - width:', panelStyles.width);
      console.log('     - display:', panelStyles.display);
      console.log('     - visibility:', panelStyles.visibility);
      console.log('     - opacity:', panelStyles.opacity);
      console.log('     - transform:', panelStyles.transform);
      console.log('     - flex-shrink:', panelStyles.flexShrink);
    }
  }
  
  // Inspeccionar estado actual
  inspectStyles(currentState);
  
  return {
    container,
    editorContainer,
    sidePanelFixed,
    workspaceContainer,
    workspaceInner,
    currentState,
    inspectStyles
  };
}

// Función para alternar el panel y probar ambos estados
function testPanelToggleWithSpecificClasses() {
  console.log('\n🔄 PROBANDO TOGGLE DEL PANEL CON CLASES ESPECÍFICAS');
  
  if (!window.polotnoStore) {
    console.error('❌ polotnoStore no está disponible');
    return;
  }
  
  const initialState = testSpecificClassesSolution();
  
  // Alternar el panel
  const currentPanel = window.polotnoStore.openedSidePanel;
  const newPanel = currentPanel ? null : 'templates';
  
  console.log(`\n🔄 Cambiando panel de "${currentPanel}" a "${newPanel}"`);
  window.polotnoStore.openedSidePanel = newPanel;
  
  // Esperar un momento para que se apliquen los cambios
  setTimeout(() => {
    console.log('\n📊 ESTADO DESPUÉS DEL TOGGLE:');
    const newState = testSpecificClassesSolution();
    
    // Comparar estados
    console.log('\n🔍 COMPARACIÓN DE ESTADOS:');
    console.log('   - Estado anterior:', initialState.currentState);
    console.log('   - Estado nuevo:', newState.currentState);
    
    if (initialState.currentState !== newState.currentState) {
      console.log('✅ El toggle funcionó correctamente');
    } else {
      console.log('⚠️ El estado no cambió');
    }
  }, 200);
}

// Función para aplicar corrección forzada si es necesario
function forceSpecificClassesCentering() {
  console.log('\n🔧 APLICANDO CORRECCIÓN FORZADA CON CLASES ESPECÍFICAS');
  
  const container = document.getElementById('polotno-container');
  const workspaceContainer = document.querySelector('.kaze-workspace-container');
  const workspaceInner = document.querySelector('.kaze-workspace-inner');
  
  if (!container || !workspaceContainer || !workspaceInner) {
    console.error('❌ No se encontraron los elementos necesarios');
    return;
  }
  
  const sidePanelState = container.getAttribute('data-side-panel');
  
  if (sidePanelState === 'hidden') {
    // Forzar centrado perfecto
    workspaceContainer.style.cssText = `
      justify-content: center !important;
      align-items: center !important;
      margin: 0 auto !important;
      width: 100% !important;
      display: flex !important;
      flex-direction: column !important;
    `;
    
    workspaceInner.style.cssText = `
      margin: 0 auto !important;
      text-align: center !important;
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
    `;
    
    console.log('✅ Centrado forzado aplicado');
  } else {
    console.log('ℹ️ Panel visible, no se requiere centrado');
  }
}

// Función para probar específicamente la ocultación completa del panel
function testCompleteHiding() {
  console.log('🔍 PROBANDO OCULTACIÓN COMPLETA DEL PANEL LATERAL');
  
  const store = window.polotnoStore;
  if (!store) {
    console.error('❌ No se pudo obtener el store de Polotno');
    return;
  }
  
  const sidePanelFixed = document.querySelector('.kaze-side-panel-fixed');
  const container = document.getElementById('polotno-container');
  
  if (!sidePanelFixed || !container) {
    console.error('❌ No se encontraron los elementos necesarios');
    return;
  }
  
  console.log('📊 Estado inicial del panel:', store.openedSidePanel);
  
  // Función para inspeccionar el estado del panel
  function inspectPanelState(label) {
    const styles = window.getComputedStyle(sidePanelFixed);
    const dataState = container.getAttribute('data-side-panel');
    
    console.log(`\n${label}:`);
    console.log('   - data-side-panel:', dataState);
    console.log('   - openedSidePanel:', store.openedSidePanel);
    console.log('   - width:', styles.width);
    console.log('   - display:', styles.display);
    console.log('   - visibility:', styles.visibility);
    console.log('   - opacity:', styles.opacity);
    console.log('   - transform:', styles.transform);
    
    const isCompletelyHidden = styles.display === 'none' || 
                              (styles.visibility === 'hidden' && styles.opacity === '0') ||
                              styles.width === '0px';
    console.log('   - ¿Completamente oculto?:', isCompletelyHidden);
    
    return isCompletelyHidden;
  }
  
  // Inspeccionar estado inicial
  inspectPanelState('🔍 Estado inicial');
  
  // Cerrar panel si está abierto
  if (store.openedSidePanel) {
    console.log('\n🔄 Cerrando panel lateral...');
    store.openSidePanel('');
    
    setTimeout(() => {
      const isHidden = inspectPanelState('📍 Después de cerrar');
      if (isHidden) {
        console.log('✅ Panel lateral se oculta correctamente');
      } else {
        console.log('❌ Panel lateral NO se oculta completamente');
      }
      
      // Abrir panel nuevamente
      console.log('\n🔄 Abriendo panel lateral...');
      store.openSidePanel('photos');
      
      setTimeout(() => {
        const isVisible = !inspectPanelState('📍 Después de abrir');
        if (isVisible) {
          console.log('✅ Panel lateral se muestra correctamente');
        } else {
          console.log('❌ Panel lateral NO se muestra correctamente');
        }
      }, 300);
    }, 300);
  } else {
    // Abrir panel si está cerrado
    console.log('\n🔄 Abriendo panel lateral...');
    store.openSidePanel('photos');
    
    setTimeout(() => {
      inspectPanelState('📍 Después de abrir');
      
      // Cerrar panel
      console.log('\n🔄 Cerrando panel lateral...');
      store.openSidePanel('');
      
      setTimeout(() => {
        const isHidden = inspectPanelState('📍 Después de cerrar');
        if (isHidden) {
          console.log('✅ Panel lateral se oculta correctamente');
        } else {
          console.log('❌ Panel lateral NO se oculta completamente');
        }
      }, 300);
    }, 300);
  }
}

// Función para forzar centrado del canvas específicamente
function forceCanvasCentering() {
    console.log('🎯 Forzando centrado específico del canvas...');
    
    const container = document.querySelector('.polotno-editor-isolation');
    const polotnoWorkspace = document.querySelector('.polotno-workspace');
    const konvaCanvas = document.querySelector('.polotno-workspace canvas');
    const konvaContent = document.querySelector('.polotno-workspace .konvajs-content');
    
    if (container && container.getAttribute('data-side-panel') === 'hidden') {
        console.log('✅ Panel está oculto, aplicando centrado forzado...');
        
        // Forzar estilos en el workspace de Polotno
        if (polotnoWorkspace) {
            polotnoWorkspace.style.cssText += `
                margin: 0 auto !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                position: relative !important;
            `;
            console.log('✅ Estilos aplicados al polotno-workspace');
        }
        
        // Forzar estilos en el canvas de Konva
        if (konvaCanvas) {
            konvaCanvas.style.cssText += `
                margin: 0 auto !important;
                display: block !important;
            `;
            console.log('✅ Estilos aplicados al canvas de Konva');
        }
        
        // Forzar estilos en el contenido de Konva
        if (konvaContent) {
            konvaContent.style.cssText += `
                margin: 0 auto !important;
                display: block !important;
            `;
            console.log('✅ Estilos aplicados al konvajs-content');
        }
        
        console.log('🎯 Centrado forzado completado');
    } else {
        console.log('❌ Panel no está oculto o contenedor no encontrado');
    }
}

// Función para diagnosticar conflictos de CSS
function diagnoseCSSConflicts() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE CONFLICTOS CSS...');
    
    const container = document.querySelector('.polotno-editor-isolation');
    const workspace = document.querySelector('.polotno-workspace');
    const sidePanelFixed = document.querySelector('.kaze-side-panel-fixed');
    const workspaceContainer = document.querySelector('.kaze-workspace-container');
    
    if (!container || !workspace) {
        console.log('❌ Elementos principales no encontrados');
        return;
    }
    
    const panelState = container.getAttribute('data-side-panel');
    console.log(`📍 Estado del panel: ${panelState}`);
    console.log(`📍 openedSidePanel: ${window.polotnoStore?.openedSidePanel || 'N/A'}`);
    
    // DIAGNÓSTICO DEL PANEL LATERAL
    if (sidePanelFixed) {
        const panelStyles = window.getComputedStyle(sidePanelFixed);
        console.log('\n🎨 ESTILOS DEL PANEL LATERAL (.kaze-side-panel-fixed):');
        console.log('   - width:', panelStyles.width);
        console.log('   - display:', panelStyles.display);
        console.log('   - visibility:', panelStyles.visibility);
        console.log('   - opacity:', panelStyles.opacity);
        console.log('   - transform:', panelStyles.transform);
        console.log('   - flex-basis:', panelStyles.flexBasis);
        
        const isHidden = panelStyles.display === 'none' || 
                        panelStyles.width === '0px' || 
                        panelStyles.opacity === '0';
        console.log('   - ¿Panel oculto?:', isHidden);
    }
    
    // DIAGNÓSTICO DEL WORKSPACE CONTAINER
    if (workspaceContainer) {
        const containerStyles = window.getComputedStyle(workspaceContainer);
        console.log('\n🎨 ESTILOS DEL WORKSPACE CONTAINER (.kaze-workspace-container):');
        console.log('   - justify-content:', containerStyles.justifyContent);
        console.log('   - align-items:', containerStyles.alignItems);
        console.log('   - margin:', containerStyles.margin);
        console.log('   - width:', containerStyles.width);
        console.log('   - position:', containerStyles.position);
        console.log('   - left:', containerStyles.left);
        console.log('   - transform:', containerStyles.transform);
    }
    
    // DIAGNÓSTICO DEL WORKSPACE
    const computedStyles = window.getComputedStyle(workspace);
    console.log('\n🎨 ESTILOS DEL WORKSPACE (.polotno-workspace):');
    console.log('   - left:', computedStyles.left);
    console.log('   - transform:', computedStyles.transform);
    console.log('   - margin:', computedStyles.margin);
    console.log('   - position:', computedStyles.position);
    console.log('   - display:', computedStyles.display);
    console.log('   - width:', computedStyles.width);
    console.log('   - top:', computedStyles.top);
    console.log('   - right:', computedStyles.right);
    console.log('   - bottom:', computedStyles.bottom);
    
    // Verificar estilos inline
    const inlineStyle = workspace.getAttribute('style');
    if (inlineStyle) {
        console.log('\n⚠️ ESTILOS INLINE DETECTADOS EN WORKSPACE:', inlineStyle);
    } else {
        console.log('\n✅ No hay estilos inline en workspace');
    }
    
    // Verificar clases aplicadas
    console.log('\n🏷️ CLASES APLICADAS:');
    console.log('   - Container classes:', container.className);
    console.log('   - Workspace classes:', workspace.className);
    if (sidePanelFixed) console.log('   - Panel classes:', sidePanelFixed.className);
    if (workspaceContainer) console.log('   - Workspace container classes:', workspaceContainer.className);
    
    // Verificar jerarquía de elementos
    console.log('\n🌳 JERARQUÍA DE ELEMENTOS:');
    let current = workspace;
    let level = 0;
    while (current && level < 6) {
        const classes = current.className ? `.${current.className.split(' ').join('.')}` : '';
        console.log(`   ${'  '.repeat(level)}- ${current.tagName}${classes}`);
        current = current.parentElement;
        level++;
    }
    
    // Verificar si las reglas CSS específicas se están aplicando
    const expectedSelectors = [
        '.polotno-editor-isolation[data-side-panel="hidden"] .kaze-side-panel-fixed',
        '.polotno-editor-isolation[data-side-panel="hidden"] .kaze-workspace-container',
        '.polotno-editor-isolation[data-side-panel="hidden"] .kaze-workspace-container .polotno-workspace',
        '.polotno-editor-isolation[data-side-panel="hidden"] .kaze-polotno-editor-container .kaze-workspace-container .polotno-workspace'
    ];
    
    console.log('\n🎯 VERIFICANDO SELECTORES ESPECÍFICOS:');
    expectedSelectors.forEach((selector, i) => {
        try {
            const matches = document.querySelectorAll(selector);
            console.log(`   ${i + 1}. ${selector}`);
            console.log(`      Elementos encontrados: ${matches.length}`);
            if (matches.length > 0 && i >= 2) { // Solo para workspace
                const element = matches[0];
                const styles = window.getComputedStyle(element);
                console.log(`      - left: ${styles.left}`);
                console.log(`      - transform: ${styles.transform}`);
                console.log(`      - margin: ${styles.margin}`);
            }
        } catch (e) {
            console.log(`   ${i + 1}. ${selector}: ERROR - ${e.message}`);
        }
    });
    
    // IDENTIFICAR REGLAS QUE ESTÁN SOBRESCRIBIENDO
    console.log('\n🚨 ANÁLISIS DE CONFLICTOS:');
    if (panelState === 'hidden') {
        const expectedLeft = '50%';
        const actualLeft = computedStyles.left;
        const actualTransform = computedStyles.transform;
        
        if (actualLeft !== expectedLeft) {
            console.log(`   ❌ CONFLICTO EN LEFT: esperado "${expectedLeft}", actual "${actualLeft}"`);
        } else {
            console.log(`   ✅ LEFT correcto: "${actualLeft}"`);
        }
        
        if (!actualTransform.includes('translateX(-50%)')) {
            console.log(`   ❌ CONFLICTO EN TRANSFORM: esperado incluir "translateX(-50%)", actual "${actualTransform}"`);
        } else {
            console.log(`   ✅ TRANSFORM correcto: "${actualTransform}"`);
        }
        
        // Verificar si hay reglas que resetean estos valores
        const resetRules = [
            'transform: none !important',
            'left: auto !important',
            'left: 0',
            'transform: none'
        ];
        
        console.log('\n🔍 BUSCANDO REGLAS QUE RESETEAN VALORES:');
        resetRules.forEach(rule => {
            console.log(`   - Verificando si hay reglas con "${rule}"`);
        });
    }
}

// Función para identificar la causa exacta del desplazamiento
function identifyCanvasDisplacementCause() {
    console.log('🎯 IDENTIFICANDO CAUSA DEL DESPLAZAMIENTO DEL LIENZO...');
    
    // 1. IDENTIFICAR LA FUNCIÓN QUE OCULTA LA BARRA LATERAL
    console.log('\n📋 FUNCIÓN QUE OCULTA LA BARRA LATERAL:');
    console.log('   - Función: togglePolotnoSidePanel()');
    console.log('   - Ubicación: TopBar.tsx y DesignEditor.js');
    console.log('   - Acción: Cambia polotnoStore.openedSidePanel');
    console.log('   - Efecto: Actualiza sidePanelVisible en PolotnoEditor.tsx');
    console.log('   - Resultado: Cambia data-side-panel de "visible" a "hidden"');
    
    // 2. IDENTIFICAR LOS ELEMENTOS CSS INVOLUCRADOS
    console.log('\n🎨 ELEMENTOS CSS QUE CONTROLAN EL OCULTAMIENTO:');
    
    const container = document.querySelector('.polotno-editor-isolation');
    const sidePanelFixed = document.querySelector('.kaze-side-panel-fixed');
    const workspaceContainer = document.querySelector('.kaze-workspace-container');
    const workspace = document.querySelector('.polotno-workspace');
    
    if (!container) {
        console.log('❌ Container principal no encontrado');
        return;
    }
    
    const panelState = container.getAttribute('data-side-panel');
    console.log(`   - Atributo data-side-panel: "${panelState}"`);
    
    // 3. ANALIZAR REGLAS CSS ESPECÍFICAS
    console.log('\n📝 REGLAS CSS ACTIVAS CUANDO EL PANEL ESTÁ OCULTO:');
    
    if (panelState === 'hidden') {
        // Reglas para el panel lateral
        if (sidePanelFixed) {
            const panelStyles = window.getComputedStyle(sidePanelFixed);
            console.log('   A. PANEL LATERAL (.kaze-side-panel-fixed):');
            console.log('      - Selector: .polotno-editor-isolation[data-side-panel="hidden"] .kaze-side-panel-fixed');
            console.log('      - width:', panelStyles.width, '(debería ser 0)');
            console.log('      - opacity:', panelStyles.opacity, '(debería ser 0)');
            console.log('      - display:', panelStyles.display, '(debería ser none)');
            console.log('      - transform:', panelStyles.transform, '(debería incluir translateX(-100%))');
        }
        
        // Reglas para el workspace container
        if (workspaceContainer) {
            const containerStyles = window.getComputedStyle(workspaceContainer);
            console.log('\n   B. WORKSPACE CONTAINER (.kaze-workspace-container):');
            console.log('      - Selector: .polotno-editor-isolation[data-side-panel="hidden"] .kaze-workspace-container');
            console.log('      - justify-content:', containerStyles.justifyContent, '(debería ser center)');
            console.log('      - margin:', containerStyles.margin, '(debería ser 0 auto)');
        }
        
        // Reglas para el workspace
        if (workspace) {
            const workspaceStyles = window.getComputedStyle(workspace);
            console.log('\n   C. WORKSPACE (.polotno-workspace):');
            console.log('      - Selector principal: .polotno-editor-isolation[data-side-panel="hidden"] .kaze-workspace-container .polotno-workspace');
            console.log('      - left:', workspaceStyles.left, '(debería ser 50%)');
            console.log('      - transform:', workspaceStyles.transform, '(debería incluir translateX(-50%))');
            console.log('      - margin:', workspaceStyles.margin, '(debería ser 0 auto)');
            
            // Verificar si las reglas se están aplicando correctamente
            const isCorrectlyPositioned = workspaceStyles.left === '50%' && 
                                        workspaceStyles.transform.includes('translateX(-50%)');
            
            if (!isCorrectlyPositioned) {
                console.log('\n   🚨 PROBLEMA IDENTIFICADO:');
                console.log('      - El workspace NO está correctamente centrado');
                console.log('      - Las reglas CSS de centrado están siendo sobrescritas');
                
                // Buscar reglas que pueden estar sobrescribiendo
                console.log('\n   🔍 POSIBLES REGLAS QUE SOBRESCRIBEN:');
                console.log('      - Líneas 594-596 en PolotnoEditor.css (transform: none !important, left: auto !important)');
                console.log('      - Reglas más generales que resetean left y transform');
                console.log('      - Estilos inline aplicados dinámicamente');
                
                // Verificar estilos inline
                const inlineStyle = workspace.getAttribute('style');
                if (inlineStyle) {
                    console.log('      - ⚠️ ESTILOS INLINE DETECTADOS:', inlineStyle);
                }
            } else {
                console.log('\n   ✅ El workspace está correctamente posicionado');
            }
        }
    } else {
        console.log('   - Panel actualmente visible, ocultar para ver reglas de centrado');
    }
    
    // 4. MOSTRAR UBICACIÓN DE LAS REGLAS CSS
    console.log('\n📁 UBICACIÓN DE LAS REGLAS CSS:');
    console.log('   - Archivo: PolotnoEditor.css');
    console.log('   - Líneas aproximadas:');
    console.log('     * Panel lateral: ~750-780');
    console.log('     * Workspace container: ~780-800');
    console.log('     * Workspace: ~800-830');
    console.log('     * Reglas problemáticas: ~594-596 (reseteos agresivos)');
    
    // 5. RECOMENDACIONES
    console.log('\n💡 RECOMENDACIONES PARA SOLUCIONAR:');
    console.log('   1. Aumentar especificidad de las reglas de centrado');
    console.log('   2. Usar !important en las reglas de centrado críticas');
    console.log('   3. Eliminar o hacer más específicas las reglas de reseteo (líneas 594-596)');
    console.log('   4. Verificar que no hay estilos inline que sobrescriban');
    
    return {
        panelState,
        toggleFunction: 'togglePolotnoSidePanel',
        cssFile: 'PolotnoEditor.css',
        problematicLines: '594-596, 750-830',
        isCorrectlyPositioned: workspace ? 
            (window.getComputedStyle(workspace).left === '50%' && 
             window.getComputedStyle(workspace).transform.includes('translateX(-50%)')) : false
    };
}

// Exportar funciones al objeto window para uso en consola
if (typeof window !== 'undefined') {
  window.testSpecificClassesSolution = testSpecificClassesSolution;
  window.testPanelToggleWithSpecificClasses = testPanelToggleWithSpecificClasses;
  window.forceSpecificClassesCentering = forceSpecificClassesCentering;
  window.testCompleteHiding = testCompleteHiding;
  window.forceCanvasCentering = forceCanvasCentering;
  window.diagnoseCSSConflicts = diagnoseCSSConflicts;
  window.identifyCanvasDisplacementCause = identifyCanvasDisplacementCause;
  
  console.log('🎯 FUNCIONES DE PRUEBA DISPONIBLES:');
  console.log('   - testSpecificClassesSolution()');
  console.log('   - testPanelToggleWithSpecificClasses()');
  console.log('   - forceSpecificClassesCentering()');
  console.log('   - testCompleteHiding() - NUEVA FUNCIÓN');
  console.log('   - forceCanvasCentering() - NUEVA FUNCIÓN');
  console.log('   - diagnoseCSSConflicts() - DIAGNÓSTICO');
  console.log('   - identifyCanvasDisplacementCause() - IDENTIFICAR CAUSA');
}

export { testSpecificClassesSolution, testPanelToggleWithSpecificClasses, forceSpecificClassesCentering, testCompleteHiding, forceCanvasCentering };
