import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
// import { SetBackgroundCommand } from '../../commands'; // Commented out - not implemented yet
import type { Background } from '../../types/editor';
import './BackgroundPanel.css';

type BackgroundType = 'solid' | 'linear-gradient' | 'radial-gradient' | 'image';

interface ColorStopEditorProps {
  stops: Array<{ offset: number; color: string }>;
  onChange: (stops: Array<{ offset: number; color: string }>) => void;
}

const ColorStopEditor: React.FC<ColorStopEditorProps> = ({ stops, onChange }) => {
  const addStop = () => {
    const newStops = [...stops, { offset: 0.5, color: '#ffffff' }];
    onChange(newStops);
  };

  const removeStop = (index: number) => {
    if (stops.length > 2) {
      const newStops = stops.filter((_, i) => i !== index);
      onChange(newStops);
    }
  };

  const updateStop = (index: number, updates: Partial<{ offset: number; color: string }>) => {
    const newStops = stops.map((stop, i) => 
      i === index ? { ...stop, ...updates } : stop
    );
    onChange(newStops);
  };

  return (
    <div className="color-stops-editor">
      <div className="stops-list">
        {stops.map((stop, index) => (
          <div key={index} className="color-stop">
            <input
              type="color"
              value={stop.color}
              onChange={(e) => updateStop(index, { color: e.target.value })}
              className="color-input"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={stop.offset}
              onChange={(e) => updateStop(index, { offset: parseFloat(e.target.value) })}
              className="offset-input"
            />
            {stops.length > 2 && (
              <button
                onClick={() => removeStop(index)}
                className="remove-stop-btn"
                title="Eliminar parada"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button onClick={addStop} className="add-stop-btn">
        + Agregar parada
      </button>
    </div>
  );
};

export const BackgroundPanel: React.FC = () => {
  // Mock data for now - in real implementation this would come from Polotno store
  const composition = { background: null };
  const executeCommand = (command: any) => console.log('Execute command:', command);
  
  const background: Background = composition.background || {
    type: 'solid',
    color: '#ffffff'
  };

  const [localBackground, setLocalBackground] = useState<Background>(background);

  const updateBackground = (newBackground: Background) => {
    setLocalBackground(newBackground);
    // executeCommand(new SetBackgroundCommand(newBackground)); // Command not implemented yet
    console.log('Update background:', newBackground);
  };

  const handleTypeChange = (type: BackgroundType) => {
    let newBackground: Background;
    
    switch (type) {
      case 'solid':
        newBackground = {
          type: 'solid',
          color: '#ffffff'
        };
        break;
      case 'linear-gradient':
        newBackground = {
          type: 'linear-gradient',
          angle: 0,
          stops: [
            { offset: 0, color: '#ffffff' },
            { offset: 1, color: '#000000' }
          ]
        };
        break;
      case 'radial-gradient':
        newBackground = {
          type: 'radial-gradient',
          centerX: 960,
          centerY: 540,
          radius: 500,
          stops: [
            { offset: 0, color: '#ffffff' },
            { offset: 1, color: '#000000' }
          ]
        };
        break;
      case 'image':
        newBackground = {
          type: 'image',
          src: '',
          fit: 'cover',
          position: { x: 0, y: 0 },
          opacity: 1
        };
        break;
      default:
        return;
    }
    
    updateBackground(newBackground);
  };

  const renderSolidControls = () => {
    if (localBackground.type !== 'solid') return null;
    
    return (
      <div className="background-controls">
        <div className="control-group">
          <label className="control-label">Color</label>
          <input
            type="color"
            value={localBackground.color}
            onChange={(e) => updateBackground({ ...localBackground, color: e.target.value })}
            className="color-input"
          />
        </div>
      </div>
    );
  };

  const renderLinearControls = () => {
    if (localBackground.type !== 'linear-gradient') return null;
    
    return (
      <div className="background-controls">
        <div className="control-group">
          <label className="control-label">Ángulo</label>
          <input
            type="number"
            min="0"
            max="360"
            value={(localBackground as any).angle}
            onChange={(e) => updateBackground({
              ...(localBackground as any),
              angle: parseInt(e.target.value) || 0
            })}
            className="number-input"
          />
          <span className="unit">°</span>
        </div>
        
        <div className="control-group">
          <label className="control-label">Paradas de color</label>
          <ColorStopEditor
            stops={(localBackground as any).stops}
            onChange={(stops) => updateBackground({ ...(localBackground as any), stops })}
          />
        </div>
      </div>
    );
  };

  const renderRadialControls = () => {
    if (localBackground.type !== 'radial-gradient') return null;
    
    return (
      <div className="background-controls">
        <div className="control-row">
          <div className="control-group">
            <label className="control-label">Centro X</label>
            <input
              type="number"
              value={(localBackground as any).centerX}
              onChange={(e) => updateBackground({
                ...(localBackground as any),
                centerX: parseInt(e.target.value) || 0
              })}
              className="number-input"
            />
          </div>
          
          <div className="control-group">
            <label className="control-label">Centro Y</label>
            <input
              type="number"
              value={(localBackground as any).centerY}
              onChange={(e) => updateBackground({
                ...(localBackground as any),
                centerY: parseInt(e.target.value) || 0
              })}
              className="number-input"
            />
          </div>
        </div>
        
        <div className="control-group">
          <label className="control-label">Radio</label>
          <input
            type="number"
            min="1"
            value={(localBackground as any).radius}
            onChange={(e) => updateBackground({
              ...(localBackground as any),
              radius: Math.max(1, parseInt(e.target.value) || 1)
            })}
            className="number-input"
          />
        </div>
        
        <div className="control-group">
          <label className="control-label">Paradas de color</label>
          <ColorStopEditor
            stops={(localBackground as any).stops}
            onChange={(stops) => updateBackground({ ...(localBackground as any), stops })}
          />
        </div>
      </div>
    );
  };

  const renderImageControls = () => {
    if (localBackground.type !== 'image') return null;
    
    return (
      <div className="background-controls">
        <div className="control-group">
          <label className="control-label">URL de imagen</label>
          <input
            type="url"
            value={localBackground.src}
            onChange={(e) => updateBackground({ ...localBackground, src: e.target.value })}
            className="text-input"
            placeholder="https://ejemplo.com/imagen.jpg"
          />
        </div>
        
        <div className="control-group">
          <label className="control-label">Ajuste</label>
          <select
            value={localBackground.fit}
            onChange={(e) => updateBackground({ 
              ...localBackground, 
              fit: e.target.value as 'cover' | 'contain' | 'fill' 
            })}
            className="select-input"
          >
            <option value="cover">Cubrir</option>
            <option value="contain">Contener</option>
            <option value="fill">Rellenar</option>
          </select>
        </div>
        
        <div className="control-group">
          <label className="control-label">Opacidad</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localBackground.opacity}
            onChange={(e) => updateBackground({ 
              ...localBackground, 
              opacity: parseFloat(e.target.value) 
            })}
            className="range-input"
          />
          <span className="range-value">{Math.round(localBackground.opacity * 100)}%</span>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    const previewStyle: React.CSSProperties = {
      width: '100%',
      height: '80px',
      borderRadius: '4px',
      border: '1px solid #e9ecef',
      marginBottom: '16px'
    };

    switch (localBackground.type) {
      case 'solid':
        Object.assign(previewStyle, { backgroundColor: localBackground.color });
        break;
      case 'linear-gradient':
        const linearStops = (localBackground as any).stops
          .map((stop: any) => `${stop.color} ${stop.offset * 100}%`)
          .join(', ');
        Object.assign(previewStyle, { background: `linear-gradient(${(localBackground as any).angle}deg, ${linearStops})` });
        break;
      case 'radial-gradient':
        const radialStops = (localBackground as any).stops
          .map((stop: any) => `${stop.color} ${stop.offset * 100}%`)
          .join(', ');
        Object.assign(previewStyle, { background: `radial-gradient(circle at ${(localBackground as any).centerX}px ${(localBackground as any).centerY}px, ${radialStops})` });
        break;
      case 'image':
        if (localBackground.src) {
          Object.assign(previewStyle, {
            backgroundImage: `url(${localBackground.src})`,
            backgroundSize: localBackground.fit,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: localBackground.opacity
          });
        } else {
          Object.assign(previewStyle, {
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d',
            fontSize: '12px'
          });
        }
        break;
    }

    return (
      <div style={previewStyle}>
        {localBackground.type === 'image' && !localBackground.src && 'Sin imagen'}
      </div>
    );
  };

  return (
    <div className="background-panel">
      <div className="panel-section">
        <h3 className="section-title">Fondo del Canvas</h3>
        
        {/* Preview */}
        {renderPreview()}
        
        {/* Type selector */}
        <div className="control-group">
          <label className="control-label">Tipo de fondo</label>
          <select
            value={localBackground.type}
            onChange={(e) => handleTypeChange(e.target.value as BackgroundType)}
            className="select-input"
          >
            <option value="solid">Color sólido</option>
            <option value="linear-gradient">Gradiente lineal</option>
            <option value="radial-gradient">Gradiente radial</option>
            <option value="image">Imagen</option>
          </select>
        </div>
        
        {/* Type-specific controls */}
        {renderSolidControls()}
        {renderLinearControls()}
        {renderRadialControls()}
        {renderImageControls()}
      </div>
      
      {/* Presets */}
      <div className="panel-section">
        <h4 className="section-subtitle">Presets</h4>
        <div className="preset-grid">
          <button
            onClick={() => updateBackground({ type: 'solid', color: '#ffffff' })}
            className="preset-btn"
            style={{ backgroundColor: '#ffffff' }}
            title="Blanco"
          />
          <button
            onClick={() => updateBackground({ type: 'solid', color: '#000000' })}
            className="preset-btn"
            style={{ backgroundColor: '#000000' }}
            title="Negro"
          />
          <button
            onClick={() => updateBackground({ type: 'solid', color: '#f8f9fa' })}
            className="preset-btn"
            style={{ backgroundColor: '#f8f9fa' }}
            title="Gris claro"
          />
          <button
            onClick={() => updateBackground({
              type: 'linear-gradient',
              angle: 45,
              stops: [
                { offset: 0, color: '#667eea' },
                { offset: 1, color: '#764ba2' }
              ]
            })}
            className="preset-btn"
            style={{ background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)' }}
            title="Gradiente azul-púrpura"
          />
          <button
            onClick={() => updateBackground({
              type: 'linear-gradient',
              angle: 90,
              stops: [
                { offset: 0, color: '#ffecd2' },
                { offset: 1, color: '#fcb69f' }
              ]
            })}
            className="preset-btn"
            style={{ background: 'linear-gradient(90deg, #ffecd2 0%, #fcb69f 100%)' }}
            title="Gradiente naranja"
          />
          <button
            onClick={() => updateBackground({
              type: 'radial-gradient',
              centerX: 960,
              centerY: 540,
              radius: 800,
              stops: [
                { offset: 0, color: '#ffffff' },
                { offset: 1, color: '#e9ecef' }
              ]
            })}
            className="preset-btn"
            style={{ background: 'radial-gradient(circle, #ffffff 0%, #e9ecef 100%)' }}
            title="Gradiente radial suave"
          />
        </div>
      </div>
    </div>
  );
};