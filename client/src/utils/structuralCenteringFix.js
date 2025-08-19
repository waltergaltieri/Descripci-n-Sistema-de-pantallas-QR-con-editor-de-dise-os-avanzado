// ========================================
// CORRECCIÓN ESTRUCTURAL DEL CENTRADO
// Solución JavaScript que complementa el CSS estructural
// ========================================

let structuralObserver = null;
let structuralInterval = null;
let isStructuralFixActive = false;

// Función principal para configurar la corrección estructural
export function setupStructuralCenteringFix() {
  console.log('🏗️ Configurando corrección estructural del centrado...');
  
  if (isStructuralFixActive) {
    console.log('⚠️ Corrección estructural ya está activa');
    return cleanupStructuralFix;
  }
  
  isStructuralFixActive = true;
  
  // 1. Aplicar corrección inmediata
  applyStructuralFix();
  
  // 2. Configurar observer para cambios en el panel lateral
  setupStructuralObserver();
  
  // 3. Configurar verificación periódica
  setupStructuralMonitoring();
  
  // 4. Configurar listener para resize
  window.addEventListener('resize', handleStructuralResize);
  
  console.log('✅ Corrección estructural configurada');
  
  return cleanupStructuralFix;
}

// Función para aplicar la corrección estructural
function applyStructuralFix() {
  console.log('🔧 Aplicando corrección estructural...');
  
  const container = document.querySelector('.polotno-editor-isolation');
  if (!container) {
    console.warn('⚠️ Contenedor principal no encontrado');
    return;
  }
  
  const isPanelHidden = container.getAttribute('data-side-panel') === 'hidden';
  
  if (!isPanelHidden) {
    console.log('📋 Panel lateral visible, no se requiere corrección');
    return;
  }
  
  console.log('🎯 Panel lateral oculto, aplicando corrección estructural...');
  
  // Elementos clave de la estructura
  const workspaceContainer = container.querySelector('.kaze-workspace-container');
  const workspaceInner = container.querySelector('.kaze-workspace-inner');
  const polotnoWorkspace = container.querySelector('.polotno-workspace');
  const konvaCanvas = container.querySelector('.polotno-workspace canvas');
  const konvaContent = container.querySelector('.polotno-workspace .konvajs-content');
  
  // Aplicar clases de depuración
  if (workspaceContainer) workspaceContainer.classList.add('structural-fix-applied');
  if (workspaceInner) workspaceInner.classList.add('structural-fix-applied');
  if (polotnoWorkspace) polotnoWorkspace.classList.add('structural-fix-applied');
  
  // Limpiar estilos inline problemáticos
  cleanInlineStyles(polotnoWorkspace);
  cleanInlineStyles(konvaCanvas);
  cleanInlineStyles(konvaContent);
  
  // Verificar si el centrado es efectivo
  setTimeout(() => {
    const isCorrectlyCentered = verifyStructuralCentering();
    if (!isCorrectlyCentered) {
      console.log('⚠️ Centrado CSS no efectivo, aplicando corrección JavaScript...');
      applyJavaScriptStructuralFix();
    } else {
      console.log('✅ Centrado estructural CSS efectivo');
    }
  }, 100);
}

// Función para limpiar estilos inline problemáticos
function cleanInlineStyles(element) {
  if (!element) return;
  
  const problematicStyles = ['left', 'transform', 'margin-left', 'margin-right', 'position'];
  
  problematicStyles.forEach(style => {
    if (element.style[style]) {
      console.log(`🧹 Limpiando estilo inline problemático: ${style}`);
      element.style[style] = '';
    }
  });
}

// Función para verificar si el centrado estructural es efectivo
function verifyStructuralCentering() {
  const polotnoWorkspace = document.querySelector('.polotno-workspace');
  if (!polotnoWorkspace) return false;
  
  const rect = polotnoWorkspace.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const workspaceCenter = rect.left + (rect.width / 2);
  const viewportCenter = viewportWidth / 2;
  
  // Considerar centrado si está dentro de 50px del centro
  const offset = Math.abs(workspaceCenter - viewportCenter);
  const isCentered = offset <= 50;
  
  console.log(`📏 Verificación de centrado estructural:`);
  console.log(`   - Centro del workspace: ${workspaceCenter}px`);
  console.log(`   - Centro del viewport: ${viewportCenter}px`);
  console.log(`   - Desplazamiento: ${offset}px`);
  console.log(`   - ¿Centrado?: ${isCentered ? '✅' : '❌'}`);
  
  return isCentered;
}

// Función para aplicar corrección JavaScript como respaldo
function applyJavaScriptStructuralFix() {
  console.log('🚨 Aplicando corrección JavaScript estructural de emergencia...');
  
  const polotnoWorkspace = document.querySelector('.polotno-workspace');
  if (!polotnoWorkspace) return;
  
  // Aplicar centrado JavaScript directo
  polotnoWorkspace.style.cssText += `
    position: relative !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    margin: 0 !important;
    z-index: 1 !important;
  `;
  
  // Marcar como corregido por JavaScript
  polotnoWorkspace.classList.add('js-structural-fix-applied');
  
  console.log('✅ Corrección JavaScript estructural aplicada');
}

// Función para configurar el observer de cambios estructurales
function setupStructuralObserver() {
  const container = document.querySelector('.polotno-editor-isolation');
  if (!container) return;
  
  structuralObserver = new MutationObserver((mutations) => {
    let shouldApplyFix = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-side-panel') {
        shouldApplyFix = true;
      }
    });
    
    if (shouldApplyFix) {
      console.log('🔄 Cambio en panel lateral detectado, reaplicando corrección estructural...');
      setTimeout(applyStructuralFix, 100);
    }
  });
  
  structuralObserver.observe(container, {
    attributes: true,
    attributeFilter: ['data-side-panel']
  });
  
  console.log('👁️ Observer estructural configurado');
}

// Función para configurar monitoreo periódico
function setupStructuralMonitoring() {
  structuralInterval = setInterval(() => {
    const container = document.querySelector('.polotno-editor-isolation');
    if (!container) return;
    
    const isPanelHidden = container.getAttribute('data-side-panel') === 'hidden';
    if (!isPanelHidden) return;
    
    const isCentered = verifyStructuralCentering();
    if (!isCentered) {
      console.log('🔄 Monitoreo: Recentrando workspace...');
      applyStructuralFix();
    }
  }, 3000); // Verificar cada 3 segundos
  
  console.log('⏰ Monitoreo estructural configurado');
}

// Función para manejar resize de ventana
function handleStructuralResize() {
  console.log('📐 Resize detectado, reaplicando corrección estructural...');
  setTimeout(applyStructuralFix, 200);
}

// Función para limpiar la corrección estructural
export function cleanupStructuralFix() {
  console.log('🧹 Limpiando corrección estructural...');
  
  isStructuralFixActive = false;
  
  if (structuralObserver) {
    structuralObserver.disconnect();
    structuralObserver = null;
  }
  
  if (structuralInterval) {
    clearInterval(structuralInterval);
    structuralInterval = null;
  }
  
  window.removeEventListener('resize', handleStructuralResize);
  
  // Limpiar clases de depuración
  document.querySelectorAll('.structural-fix-applied, .js-structural-fix-applied').forEach(el => {
    el.classList.remove('structural-fix-applied', 'js-structural-fix-applied');
  });
  
  console.log('✅ Corrección estructural limpiada');
}

// Funciones de testing para depuración
export function testStructuralCentering() {
  console.log('🧪 TESTING CORRECCIÓN ESTRUCTURAL');
  console.log('================================');
  
  const container = document.querySelector('.polotno-editor-isolation');
  const workspaceContainer = document.querySelector('.kaze-workspace-container');
  const workspaceInner = document.querySelector('.kaze-workspace-inner');
  const polotnoWorkspace = document.querySelector('.polotno-workspace');
  
  console.log('📋 Estado de elementos:');
  console.log('   - Container:', !!container, container?.getAttribute('data-side-panel'));
  console.log('   - Workspace Container:', !!workspaceContainer);
  console.log('   - Workspace Inner:', !!workspaceInner);
  console.log('   - Polotno Workspace:', !!polotnoWorkspace);
  
  if (polotnoWorkspace) {
    const rect = polotnoWorkspace.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(polotnoWorkspace);
    
    console.log('📏 Información del workspace:');
    console.log('   - Posición:', rect.left, rect.top);
    console.log('   - Tamaño:', rect.width, rect.height);
    console.log('   - Margin:', computedStyle.margin);
    console.log('   - Left:', computedStyle.left);
    console.log('   - Transform:', computedStyle.transform);
    console.log('   - Position:', computedStyle.position);
  }
  
  const isCentered = verifyStructuralCentering();
  console.log('🎯 Resultado:', isCentered ? 'CENTRADO ✅' : 'NO CENTRADO ❌');
  
  return {
    container: !!container,
    workspaceContainer: !!workspaceContainer,
    workspaceInner: !!workspaceInner,
    polotnoWorkspace: !!polotnoWorkspace,
    isCentered
  };
}

export function forceStructuralFix() {
  console.log('🚨 FORZANDO CORRECCIÓN ESTRUCTURAL');
  applyStructuralFix();
  setTimeout(() => {
    applyJavaScriptStructuralFix();
  }, 100);
}

// Hacer funciones disponibles globalmente para testing
if (typeof window !== 'undefined') {
  window.testStructuralCentering = testStructuralCentering;
  window.forceStructuralFix = forceStructuralFix;
  window.setupStructuralCenteringFix = setupStructuralCenteringFix;
  window.cleanupStructuralFix = cleanupStructuralFix;
}