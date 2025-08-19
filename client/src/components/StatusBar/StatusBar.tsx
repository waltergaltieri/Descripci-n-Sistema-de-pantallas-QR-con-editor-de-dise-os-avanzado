import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import './StatusBar.css';

export const StatusBar: React.FC = () => {
  const { 
    // Only use available store methods
  } = useEditorStore();

  // Mock data for now - in real implementation this would come from Polotno store
  const selection = { selectedIds: [] };
  const composition = { elements: {}, screens: [{ width: 1920, height: 1080 }] };
  const viewport = { zoom: 100 };
  const history = { canUndo: false, canRedo: false, past: [], future: [] };

  const selectedCount = selection.selectedIds.length;
  const totalElements = Object.keys(composition.elements || {}).length;
  const isAnimationPlaying = false;
  const activeAnimations = 0;

  const formatCoordinate = (value: number) => {
    return Math.round(value).toString();
  };

  const formatSize = (width: number, height: number) => {
    return `${Math.round(width)} × ${Math.round(height)}`;
  };

  const getSelectionInfo = () => {
    if (selectedCount === 0) {
      return 'Ningún elemento seleccionado';
    }
    if (selectedCount === 1) {
      return 'Element (unknown)';
    }
    return `${selectedCount} elementos seleccionados`;
  };

  const getSelectionBounds = () => {
    if (selectedCount === 0) return null;
    
    // Mock bounds for selected elements
    return {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    };
    

  };

  const selectionBounds = getSelectionBounds();

  return (
    <div className="status-bar">
      {/* Left section - Selection info */}
      <div className="status-section">
        <span className="status-item selection-info">
          📋 {getSelectionInfo()}
        </span>
        
        {selectionBounds && (
          <>
            <span className="status-separator">|</span>
            <span className="status-item coordinates">
              📍 X: {formatCoordinate(selectionBounds.x)}, Y: {formatCoordinate(selectionBounds.y)}
            </span>
            <span className="status-separator">|</span>
            <span className="status-item dimensions">
              📏 {formatSize(selectionBounds.width, selectionBounds.height)}
            </span>
          </>
        )}
      </div>

      {/* Center section - Composition info */}
      <div className="status-section center">
        <span className="status-item elements-count">
          📄 {totalElements} elemento{totalElements !== 1 ? 's' : ''}
        </span>
        
        <span className="status-separator">|</span>
        
        <span className="status-item canvas-size">
          🖼️ {formatSize(composition.screens[0]?.width || 1920, composition.screens[0]?.height || 1080)}
        </span>
        
        {activeAnimations > 0 && (
          <>
            <span className="status-separator">|</span>
            <span className={`status-item animations ${isAnimationPlaying ? 'playing' : 'paused'}`}>
              {isAnimationPlaying ? '▶️' : '⏸️'} {activeAnimations} animación{activeAnimations > 1 ? 'es' : ''}
            </span>
          </>
        )}
      </div>

      {/* Right section - Viewport and tools info */}
      <div className="status-section right">
        <span className="status-item zoom">
          🔍 {Math.round(viewport.zoom * 100)}%
        </span>
        
        <span className="status-separator">|</span>
        
        <span className="status-item viewport-offset">
          🎯 {formatCoordinate(0)}, {formatCoordinate(0)}
        </span>
        

        
        <span className="status-separator">|</span>
        
        <span className="status-item history">
          ↶ {history.past.length + 1}/{history.past.length + history.future.length + 1}
        </span>
      </div>
    </div>
  );
};