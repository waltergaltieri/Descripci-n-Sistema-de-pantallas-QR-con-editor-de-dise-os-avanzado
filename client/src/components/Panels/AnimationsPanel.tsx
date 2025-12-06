import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
// import { SetAnimationCommand } from '../../commands'; // Command not implemented yet
import type { ElementAnimation, AnimationType, EasingType } from '../../types/editor';
import './AnimationsPanel.css';

const ANIMATION_TYPES: Array<{ value: AnimationType; label: string; description: string }> = [
  { value: 'fadeIn', label: 'Aparecer', description: 'Aparece gradualmente' },
  { value: 'fadeOut', label: 'Desvanecer', description: 'Desaparece gradualmente' },
  { value: 'slideInLeft', label: 'Deslizar izquierda', description: 'Entra desde la izquierda' },
  { value: 'slideInRight', label: 'Deslizar derecha', description: 'Entra desde la derecha' },
  { value: 'slideInTop', label: 'Deslizar desde arriba', description: 'Entra desde arriba' },
  { value: 'slideInBottom', label: 'Deslizar desde abajo', description: 'Entra desde abajo' },
  { value: 'slideOutLeft', label: 'Salir izquierda', description: 'Sale hacia la izquierda' },
  { value: 'slideOutRight', label: 'Salir derecha', description: 'Sale hacia la derecha' },
  { value: 'slideOutTop', label: 'Salir arriba', description: 'Sale hacia arriba' },
  { value: 'slideOutBottom', label: 'Salir abajo', description: 'Sale hacia abajo' },
  { value: 'scaleIn', label: 'Escalar entrada', description: 'Crece desde el centro' },
  { value: 'scaleOut', label: 'Escalar salida', description: 'Se encoge hacia el centro' },
  { value: 'rotate', label: 'Rotar', description: 'Rotación continua' },
  { value: 'pulse', label: 'Pulso', description: 'Efecto de pulsación' },
  { value: 'bounce', label: 'Rebote', description: 'Efecto de rebote' },
  { value: 'marquee', label: 'Marquesina', description: 'Desplazamiento horizontal' },
  { value: 'motionPath', label: 'Trayectoria', description: 'Sigue una trayectoria' }
];

const EASING_TYPES: Array<{ value: EasingType; label: string }> = [
  { value: 'linear', label: 'Lineal' },
  { value: 'easeIn', label: 'Entrada suave' },
  { value: 'easeOut', label: 'Salida suave' },
  { value: 'easeInOut', label: 'Entrada y salida suave' },
  { value: 'back', label: 'Retroceso' },
  { value: 'bounce', label: 'Rebote' },
  { value: 'elastic', label: 'Elástico' }
];

interface AnimationItemProps {
  animation: ElementAnimation;
  onUpdate: (animation: ElementAnimation) => void;
  onRemove: () => void;
  onPreview: () => void;
}

const AnimationItem: React.FC<AnimationItemProps> = ({ 
  animation, 
  onUpdate, 
  onRemove, 
  onPreview 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateAnimation = (updates: Partial<ElementAnimation>) => {
    onUpdate({ ...animation, ...updates });
  };

  const animationType = ANIMATION_TYPES.find(t => t.value === animation.type);

  return (
    <div className="animation-item">
      <div 
        className="animation-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="animation-info">
          <span className="animation-name">{animationType?.label || animation.type}</span>
          <span className="animation-duration">{animation.duration}ms</span>
        </div>
        <div className="animation-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="action-btn preview-btn"
            title="Vista previa"
          >
            ▶️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="action-btn remove-btn"
            title="Eliminar"
          >
            🗑️
          </button>
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="animation-controls">
          <div className="control-group">
            <label className="control-label" htmlFor="animation-type">Tipo</label>
            <select
              id="animation-type"
              value={animation.type}
              onChange={(e) => updateAnimation({ type: e.target.value as AnimationType })}
              className="select-input"
              aria-label="Tipo de animación"
            >
              {ANIMATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="control-row">
            <div className="control-group">
              <label className="control-label" htmlFor="animation-duration">Duración (ms)</label>
              <input
                id="animation-duration"
                type="number"
                min="100"
                max="10000"
                step="100"
                value={animation.duration}
                onChange={(e) => updateAnimation({ duration: parseInt(e.target.value) || 1000 })}
                className="number-input"
                aria-label="Duración de la animación en milisegundos"
              />
            </div>
            
            <div className="control-group">
              <label className="control-label" htmlFor="animation-delay">Retraso (ms)</label>
              <input
                id="animation-delay"
                type="number"
                min="0"
                max="10000"
                step="100"
                value={animation.delay}
                onChange={(e) => updateAnimation({ delay: parseInt(e.target.value) || 0 })}
                className="number-input"
                aria-label="Retraso antes de iniciar la animación en milisegundos"
              />
            </div>
          </div>
          
          <div className="control-group">
            <label className="control-label" htmlFor="animation-easing">Suavizado</label>
            <select
              id="animation-easing"
              value={animation.easing}
              onChange={(e) => updateAnimation({ easing: e.target.value as EasingType })}
              className="select-input"
              aria-label="Tipo de suavizado"
            >
              {EASING_TYPES.map(easing => (
                <option key={easing.value} value={easing.value}>
                  {easing.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="control-row">
            <div className="control-group">
              <label className="control-label" htmlFor="animation-repeat">Repeticiones</label>
              <input
                id="animation-repeat"
                type="number"
                min="1"
                max="100"
                value={animation.repeat === 'infinite' ? 0 : animation.repeat}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  updateAnimation({ repeat: value === 0 ? 'infinite' : value });
                }}
                className="number-input"
                placeholder="0 = infinito"
                aria-label="Número de repeticiones de la animación"
              />
            </div>
            
            <div className="control-group">
              <label className="control-label" htmlFor="animation-direction">Dirección</label>
              <select
                id="animation-direction"
                value={animation.direction}
                onChange={(e) => updateAnimation({ direction: e.target.value as any })}
                className="select-input"
                aria-label="Dirección de la animación"
              >
                <option value="normal">Normal</option>
                <option value="reverse">Reversa</option>
                <option value="alternate">Alternada</option>
              </select>
            </div>
          </div>
          
          <div className="control-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={animation.autoplay}
                onChange={(e) => updateAnimation({ autoplay: e.target.checked })}
                className="checkbox-input"
              />
              Reproducir automáticamente
            </label>
          </div>
          
          {/* Controles específicos para marquee */}
          {animation.type === 'marquee' && (
            <div className="control-group">
              <label className="control-label" htmlFor="animation-speed">Velocidad (px/s)</label>
              <input
                id="animation-speed"
                type="number"
                min="10"
                max="500"
                value={animation.speed || 50}
                onChange={(e) => updateAnimation({ speed: parseInt(e.target.value) || 50 })}
                className="number-input"
                aria-label="Velocidad de la marquesina en píxeles por segundo"
              />
            </div>
          )}
          
          {/* Controles específicos para motionPath */}
          {animation.type === 'motionPath' && (
            <div className="control-group">
              <label className="control-label" htmlFor="animation-path">Trayectoria SVG</label>
              <textarea
                id="animation-path"
                value={animation.path ? JSON.stringify(animation.path) : ''}
                onChange={(e) => {
                   try {
                     const path = e.target.value ? JSON.parse(e.target.value) : undefined;
                     updateAnimation({ ...animation, path });
                   } catch {
                     // Ignorar errores de parsing JSON
                   }
                 }}
                className="textarea-input"
                placeholder='[{"x": 0, "y": 0}, {"x": 100, "y": 100}]'
                rows={3}
                aria-label="Trayectoria de movimiento en formato JSON"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AnimationsPanel: React.FC = () => {
  // Mock data for now - in real implementation this would come from Polotno store
  const selection = { selectedIds: [] as string[] };
  const getElementById = (id: string) => null;
  const executeCommand = (command: any) => console.log('Execute command:', command);
  
  const selectedElement: any = selection.selectedIds.length === 1
    ? getElementById(selection.selectedIds[0])
    : null;

  if (!selectedElement) {
    return (
      <div className="animations-panel">
        <div className="empty-state">
          <p>Selecciona un elemento para configurar sus animaciones.</p>
        </div>
      </div>
    );
  }

  const animations = selectedElement?.animations ? selectedElement.animations : [];

  const addAnimation = () => {
    const newAnimation: ElementAnimation = {
      type: 'fadeIn',
      duration: 1000,
      delay: 0,
      easing: 'easeOut',
      repeat: 1,
      direction: 'normal',
      autoplay: false,
      playOnLoopStart: false
    };
    
    // executeCommand(new SetAnimationCommand(selectedElement?.id, newAnimation)); // Command not implemented yet
    console.log('Set animation:', newAnimation);
  };

  const updateAnimation = (updatedAnimation: ElementAnimation) => {
    // Como solo hay una animación, simplemente la actualizamos
    // executeCommand(new SetAnimationCommand(selectedElement?.id, updatedAnimation)); // Command not implemented yet
    console.log('Update animation:', updatedAnimation);
  };

  const removeAnimation = (animationIndex: number) => {
    // Remover la animación estableciendo undefined
    // executeCommand(new SetAnimationCommand(selectedElement?.id, undefined)); // Command not implemented yet
    console.log('Remove animation');
  };

  const previewAnimation = (animation: ElementAnimation) => {
    // TODO: Implementar preview de animación
    console.log('Preview animation:', animation);
  };

  const playAllAnimations = () => {
    // TODO: Implementar reproducción de todas las animaciones
    console.log('Play all animations:', animations);
  };

  const stopAllAnimations = () => {
    // TODO: Implementar detener animaciones
    console.log('Stop all animations');
  };

  return (
    <div className="animations-panel">
      <div className="panel-header">
        <h3 className="panel-title">Animaciones</h3>
        <div className="panel-actions">
          <button
            onClick={playAllAnimations}
            className="action-btn play-btn"
            title="Reproducir todas"
            disabled={animations.length === 0}
          >
            ▶️ Reproducir
          </button>
          <button
            onClick={stopAllAnimations}
            className="action-btn stop-btn"
            title="Detener todas"
          >
            ⏹️ Detener
          </button>
        </div>
      </div>
      
      <div className="element-info">
        <span className="element-name">📝 {selectedElement?.name || 'Element'}</span>
        <span className="animations-count">{animations.length} animación(es)</span>
      </div>
      
      <div className="animations-list">
        {animations.length === 0 ? (
          <div className="no-animations">
            <p>Este elemento no tiene animaciones.</p>
            <p>Haz clic en "Agregar animación" para comenzar.</p>
          </div>
        ) : (
          animations.map((animation: ElementAnimation, index: number) => (
            <AnimationItem
              key={index}
              animation={animation}
              onUpdate={(updatedAnimation) => updateAnimation(updatedAnimation)}
              onRemove={() => removeAnimation(index)}
              onPreview={() => previewAnimation(animation)}
            />
          ))
        )}
      </div>
      
      <button
        onClick={addAnimation}
        className="add-animation-btn"
      >
        + Agregar animación
      </button>
      
      {/* Animation presets */}
      <div className="animation-presets">
        <h4 className="presets-title">Presets rápidos</h4>
        <div className="presets-grid">
          <button
            onClick={() => {
              const preset: ElementAnimation = {
                type: 'fadeIn',
                duration: 800,
                delay: 0,
                easing: 'easeOut',
                repeat: 1,
                direction: 'normal',
                autoplay: true,
                playOnLoopStart: false
              };
              // executeCommand(new SetAnimationCommand(selectedElement?.id, preset)); // Command not implemented yet
              console.log('Set animation preset:', preset);
            }}
            className="preset-btn"
          >
            💫 Aparecer suave
          </button>
          
          <button
            onClick={() => {
              const preset: ElementAnimation = {
                type: 'slideInLeft',
                duration: 600,
                delay: 0,
                easing: 'easeOut',
                repeat: 1,
                direction: 'normal',
                autoplay: true,
                playOnLoopStart: false
              };
              // executeCommand(new SetAnimationCommand(selectedElement?.id, preset)); // Command not implemented yet
              console.log('Set animation preset:', preset);
            }}
            className="preset-btn"
          >
            ⬅️ Deslizar entrada
          </button>
          
          <button
            onClick={() => {
              const preset: ElementAnimation = {
                type: 'bounce',
                duration: 1200,
                delay: 0,
                easing: 'bounce',
                repeat: 'infinite',
                direction: 'normal',
                autoplay: true,
                playOnLoopStart: false
              };
              // executeCommand(new SetAnimationCommand(selectedElement?.id, preset)); // Command not implemented yet
              console.log('Set animation preset:', preset);
            }}
            className="preset-btn"
          >
            🏀 Rebote continuo
          </button>
          
          <button
            onClick={() => {
              const preset: ElementAnimation = {
                type: 'pulse',
                duration: 2000,
                delay: 0,
                easing: 'easeInOut',
                repeat: 'infinite',
                direction: 'alternate',
                autoplay: true,
                playOnLoopStart: false
              };
              // executeCommand(new SetAnimationCommand(selectedElement?.id, preset)); // Command not implemented yet
              console.log('Set animation preset:', preset);
            }}
            className="preset-btn"
          >
            💓 Pulso suave
          </button>
        </div>
      </div>
    </div>
  );
};