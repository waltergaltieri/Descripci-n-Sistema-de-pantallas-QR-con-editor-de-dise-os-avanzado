import React, { useEffect } from 'react';
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Workspace } from 'polotno/canvas/workspace';
import { SidePanel } from 'polotno/side-panel';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { createStore } from 'polotno/model/store';
import { observer } from 'mobx-react-lite';

// Crear store global para Puppeteer
const store = createStore({
  width: 800,
  height: 600,
  // Configuración mínima para exportación
});

// Exponer store globalmente para Puppeteer
if (typeof window !== 'undefined') {
  window.polotnoStore = store;
}

/**
 * Editor interno oculto para uso exclusivo de Puppeteer
 * No tiene interfaz visible para el usuario final
 */
const HiddenInternalEditor = observer(() => {
  useEffect(() => {
    console.log('🔧 Editor interno oculto inicializado');
    console.log('📦 Store disponible globalmente como window.polotnoStore');
    
    // Configurar página inicial
    if (store.pages.length === 0) {
      store.addPage({
        width: 800,
        height: 600
      });
    }
    
    // Señal para Puppeteer de que está listo
    window.polotnoReady = true;
    
    return () => {
      console.log('🧹 Limpiando editor interno oculto');
    };
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      background: '#f0f0f0',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header oculto */}
      <div style={{ 
        height: '40px', 
        background: '#333', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '20px',
        fontSize: '14px'
      }}>
        🤖 Editor Interno - Modo Headless
      </div>
      
      <PolotnoContainer style={{ flex: 1 }}>
        <SidePanelWrap>
          <SidePanel store={store} />
        </SidePanelWrap>
        
        <WorkspaceWrap>
          <Toolbar store={store} />
          <Workspace store={store} />
          <ZoomButtons store={store} />
        </WorkspaceWrap>
      </PolotnoContainer>
      
      {/* Información de estado */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        Store: {store.pages.length} páginas | Elementos: {store.activePage?.children?.length || 0}
      </div>
    </div>
  );
});

export default HiddenInternalEditor;