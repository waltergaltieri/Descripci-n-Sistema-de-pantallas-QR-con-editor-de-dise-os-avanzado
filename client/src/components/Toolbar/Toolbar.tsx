import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import './Toolbar.css';

export const Toolbar: React.FC = () => {
  const { 
    undo,
    redo,
    setZoom,
    addElement,
    groupElements,
    ungroupElements,
    duplicateElement,
    deleteElement,
    selectMultiple,
    clearSelection,
    toggleLeftPanel,
    toggleRightPanel
  } = useEditorStore();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showAnimationsPanel, setShowAnimationsPanel] = useState(false);

  // Mock selection data for now - in real implementation this would come from Polotno store
  const selection = { selectedIds: [] };
  const hasSelection = selection.selectedIds.length > 0;
  const hasMultipleSelection = selection.selectedIds.length > 1;

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const zoom = parseFloat(e.target.value);
    setZoom(zoom);
  };

  // Mock viewport and composition data
  const viewport = { zoom: 100 };
  const composition = { 
    name: 'Untitled',
    screens: [{ width: 1920, height: 1080 }]
  };

  const getElementInfo = (elementId: string) => {
    // Mock implementation - in real app this would get element from Polotno store
    return {
      type: 'unknown',
      name: 'Element',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    };
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          // Funcionalidad de importar por implementar
        } catch (error) {
          console.error('Error importing file:', error);
          alert('Error al importar el archivo. Verifica que sea un archivo válido.');
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleExport = (format: 'json' | 'png' | 'svg') => {
    // Funcionalidad de exportación por implementar
    setShowExportMenu(false);
  };

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (hasMultipleSelection) {
      // Funcionalidad de alineación por implementar
    }
    setShowAlignMenu(false);
  };

  const handleDistribute = (type: 'horizontal' | 'vertical') => {
    if (hasMultipleSelection) {
      // Funcionalidad de distribución por implementar
    }
  };

  return (
    <div className="toolbar">

      {/* File operations */}
      <div className="toolbar-group">
        <button
          onClick={() => {
            // Funcionalidad de nuevo archivo por implementar
          }}
          className="toolbar-btn"
          title="Nuevo (Ctrl+N)"
        >
          📄
        </button>
        
        <label className="toolbar-btn file-input-label" title="Abrir archivo">
          📁
          <input
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="file-input"
          />
        </label>
        
        <button
          onClick={() => {
            // Funcionalidad de guardar por implementar
          }}
          className="toolbar-btn"
          title="Guardar (Ctrl+S)"
        >
          💾
        </button>
        
        <div className="dropdown">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="toolbar-btn dropdown-toggle"
            title="Exportar"
          >
            📤
          </button>
          {showExportMenu && (
            <div className="dropdown-menu">
              <button onClick={() => handleExport('json')} className="dropdown-item">
                📄 JSON
              </button>
              <button onClick={() => handleExport('png')} className="dropdown-item">
                🖼️ PNG
              </button>
              <button onClick={() => handleExport('svg')} className="dropdown-item">
                🎨 SVG
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-separator" />

      {/* Undo/Redo */}
      <div className="toolbar-group">
        <button
          onClick={undo}
          className="toolbar-btn"
          title="Deshacer (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          onClick={redo}
          className="toolbar-btn"
          title="Rehacer (Ctrl+Y)"
        >
          ↷
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Selection operations - OCULTO POR SOLICITUD DEL USUARIO */}
      {/* {hasSelection && (
        <>
          <div className="toolbar-group">
            <button
              onClick={() => {
                selection.selectedIds.forEach((id: string) => duplicateElement(id));
              }}
              className="toolbar-btn"
              title="Duplicar (Ctrl+D)"
            >
              📋
            </button>
            <button
              onClick={() => {
                selection.selectedIds.forEach((id: string) => deleteElement(id));
              }}
              className="toolbar-btn"
              title="Eliminar (Delete)"
            >
              🗑️
            </button>
            
            {hasMultipleSelection && (
              <>
                <button
                  onClick={() => groupElements()}
                  className="toolbar-btn"
                  title="Agrupar (Ctrl+G)"
                >
                  📁
                </button>
                
                <div className="dropdown">
                  <button
                    onClick={() => setShowAlignMenu(!showAlignMenu)}
                    className="toolbar-btn dropdown-toggle"
                    title="Alinear elementos"
                  >
                    ⚏
                  </button>
                  {showAlignMenu && (
                    <div className="dropdown-menu">
                      <button onClick={() => handleAlign('left')} className="dropdown-item">
                        ⬅️ Izquierda
                      </button>
                      <button onClick={() => handleAlign('center')} className="dropdown-item">
                        ↔️ Centro
                      </button>
                      <button onClick={() => handleAlign('right')} className="dropdown-item">
                        ➡️ Derecha
                      </button>
                      <div className="dropdown-separator" />
                      <button onClick={() => handleAlign('top')} className="dropdown-item">
                        ⬆️ Arriba
                      </button>
                      <button onClick={() => handleAlign('middle')} className="dropdown-item">
                        ↕️ Medio
                      </button>
                      <button onClick={() => handleAlign('bottom')} className="dropdown-item">
                        ⬇️ Abajo
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="toolbar-separator" />
        </>
      )} */}

      {/* Animations - Show when elements are selected - OCULTO POR SOLICITUD DEL USUARIO */}
      {/* {hasSelection && (
        <>
          <div className="toolbar-group">
            <button
              onClick={() => setShowAnimationsPanel(!showAnimationsPanel)}
              className={`toolbar-btn ${showAnimationsPanel ? 'active' : ''}`}
              title="Panel de Animaciones"
            >
              🎬
            </button>
          </div>
          <div className="toolbar-separator" />
        </>
      )} */}

      {/* Zoom controls */}
      <div className="toolbar-group zoom-group">
        <button
          onClick={() => setZoom(viewport.zoom / 1.2)}
          className="toolbar-btn zoom-btn"
          title="Alejar (Ctrl+-)"
        >
          🔍➖
        </button>
        
        <div className="zoom-control">
          <span className="zoom-value">{Math.round(viewport.zoom)}%</span>
        </div>
        
        <button
          onClick={() => setZoom(viewport.zoom * 1.2)}
          className="toolbar-btn zoom-btn"
          title="Acercar (Ctrl++)"
        >
          🔍➕
        </button>
        
        <button
          onClick={() => setZoom(100)}
          className="toolbar-btn"
          title="Zoom 100% (Ctrl+0)"
        >
          100%
        </button>
      </div>

      {/* Composition info */}
      <div className="toolbar-spacer" />
      
      <div className="toolbar-group composition-info">
        <span className="composition-name">{composition.name}</span>
        <span className="composition-size">
          {composition.screens[0]?.width || 1920} × {composition.screens[0]?.height || 1080}px
        </span>
      </div>
    </div>
  );
};