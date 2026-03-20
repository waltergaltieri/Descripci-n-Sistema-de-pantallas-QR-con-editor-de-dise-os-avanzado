import React, { useState, useCallback } from 'react';
import { ElementsPalette } from './ElementsPalette';
import { LayersTree } from './LayersTree';
import './LeftPanel.css';

export const LeftPanel: React.FC = () => {
  const [paletteHeight, setPaletteHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const leftPanel = document.querySelector('.left-panel') as HTMLElement;
    if (!leftPanel) return;
    
    const rect = leftPanel.getBoundingClientRect();
    const newHeight = e.clientY - rect.top;
    
    // Limitar altura mínima y máxima
    const minHeight = 200;
    const maxHeight = rect.height - 200;
    
    setPaletteHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="left-panel">
      {/* Sección de elementos */}
      <div 
        className="elements-section"
        style={{ height: paletteHeight }}
      >
        <div className="section-header">
          <h3>Elementos</h3>
        </div>
        <div className="section-content">
          <ElementsPalette />
        </div>
      </div>
      
      {/* Divisor redimensionable */}
      <div 
        className={`panel-divider ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="divider-handle" />
      </div>
      
      {/* Sección de capas */}
      <div className="layers-section">
        <div className="section-header">
          <h3>Capas</h3>
        </div>
        <div className="section-content">
          <LayersTree />
        </div>
      </div>
    </div>
  );
};