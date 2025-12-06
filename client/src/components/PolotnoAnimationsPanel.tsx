import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Card, HTMLSelect, NumericInput } from '@blueprintjs/core';
import './PolotnoEditor.css';

// Tipos de animaciones disponibles (siempre en bucle)
const ANIMATION_TYPES = {
  entrance: [
    { value: 'fadeIn', label: 'Aparecer gradualmente', duration: 1000 },
    { value: 'slideInLeft', label: 'Deslizar desde izquierda', duration: 800 },
    { value: 'slideInRight', label: 'Deslizar desde derecha', duration: 800 },
    { value: 'slideInUp', label: 'Deslizar desde abajo', duration: 800 },
    { value: 'slideInDown', label: 'Deslizar desde arriba', duration: 800 },
    { value: 'scaleIn', label: 'Escalar hacia adentro', duration: 600 },
    { value: 'bounceIn', label: 'Rebotar hacia adentro', duration: 1200 },
    { value: 'rotateIn', label: 'Rotar hacia adentro', duration: 800 }
  ],
  continuous: [
    { value: 'pulse', label: 'Pulsar', duration: 2000 },
    { value: 'bounce', label: 'Rebotar', duration: 1200 },
    { value: 'rotate', label: 'Rotar continuo', duration: 3000 },
    { value: 'swing', label: 'Balancearse', duration: 1000 },
    { value: 'wobble', label: 'Tambalearse', duration: 1000 },
    { value: 'flash', label: 'Parpadear', duration: 1000 },
    { value: 'shake', label: 'Sacudir', duration: 800 }
  ]
};

interface AnimationsPanelProps {
  store: any;
  onClose: () => void;
}

export const PolotnoAnimationsPanel: React.FC<AnimationsPanelProps> = observer(({ store, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<'entrance' | 'continuous'>('continuous');
  const [selectedAnimation, setSelectedAnimation] = useState('');
  const [duration, setDuration] = useState(2000);
  const [delay, setDelay] = useState(0);
  
  const selectedElements = store.selectedElements;
  const hasSelection = selectedElements.length > 0;
  
  // Obtener la animación actual del primer elemento seleccionado
  const currentAnimation = hasSelection && selectedElements[0].custom?.animation;
  
  const handleApplyAnimation = () => {
    if (!selectedAnimation || !hasSelection) return;
    
    const animationConfig = {
      type: selectedAnimation,
      duration: duration,
      delay: delay,
      loop: true // Siempre en bucle
    };
    
    store.history.transaction(() => {
      selectedElements.forEach((element: any) => {
        console.log('📝 Guardando animación en elemento:', element.id);
        console.log('   Custom actual:', element.custom);
        
        // Guardar la animación en el custom data del elemento
        element.set({
          custom: {
            ...element.custom,
            animation: animationConfig
          }
        });
        
        // Verificar que se guardó
        console.log('   Custom después:', element.custom);
        console.log('   Animación guardada:', element.custom?.animation);
      });
    });
    
    console.log(`✅ Animación ${selectedAnimation} configurada para ${selectedElements.length} elemento(s)`);
    console.log('💡 La animación se verá cuando publiques el diseño y lo asignes a una pantalla');
    
    // Verificar en el JSON completo
    setTimeout(() => {
      const json = store.toJSON();
      const element = json.pages[0].children.find((c: any) => c.id === selectedElements[0].id);
      console.log('🔍 Verificación en JSON:', element?.custom);
    }, 100);
  };
  
  const handleRemoveAnimation = () => {
    if (!hasSelection) return;
    
    store.history.transaction(() => {
      selectedElements.forEach((element: any) => {
        // Remover del custom data
        element.set({
          custom: {
            ...element.custom,
            animation: undefined
          }
        });
      });
    });
    
    console.log(`🗑️ Animación removida de ${selectedElements.length} elemento(s)`);
  };
  
  const currentAnimations = ANIMATION_TYPES[selectedCategory];
  
  return (
    <Card style={{ width: '320px', padding: '16px', maxHeight: '500px', overflowY: 'auto' }}>
      <h4 style={{ margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🎬 Animaciones</span>
        <Button minimal small icon="cross" onClick={onClose} />
      </h4>
      
      {!hasSelection ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <p>Selecciona un elemento para aplicar animaciones</p>
        </div>
      ) : (
        <>
          {/* Mostrar animación actual */}
          {currentAnimation && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '4px',
              border: '1px solid #4caf50'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#2e7d32' }}>Animación activa:</strong>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {currentAnimation.type} ({currentAnimation.duration}ms)
                  </div>
                </div>
                <Button
                  small
                  intent="danger"
                  icon="trash"
                  onClick={handleRemoveAnimation}
                  title="Eliminar animación"
                />
              </div>
            </div>
          )}
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
              Categoría:
            </label>
            <HTMLSelect
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value as 'entrance' | 'continuous');
                setSelectedAnimation('');
              }}
              fill
            >
              <option value="continuous">Continuas (Bucle)</option>
              <option value="entrance">Entrada</option>
            </HTMLSelect>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
              Animación:
            </label>
            <HTMLSelect
              value={selectedAnimation}
              onChange={(e) => {
                setSelectedAnimation(e.target.value);
                const anim = currentAnimations.find(a => a.value === e.target.value);
                if (anim) {
                  setDuration(anim.duration);
                }
              }}
              fill
            >
              <option value="">Seleccionar animación...</option>
              {currentAnimations.map((anim) => (
                <option key={anim.value} value={anim.value}>{anim.label}</option>
              ))}
            </HTMLSelect>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
              Duración (ms):
            </label>
            <NumericInput
              value={duration}
              onValueChange={(value) => setDuration(value || 2000)}
              min={100}
              max={10000}
              stepSize={100}
              fill
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
              Retraso inicial (ms):
            </label>
            <NumericInput
              value={delay}
              onValueChange={(value) => setDelay(value || 0)}
              min={0}
              max={10000}
              stepSize={100}
              fill
            />
          </div>
          
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#d1ecf1', 
            borderRadius: '4px', 
            marginBottom: '16px',
            fontSize: '12px',
            color: '#0c5460',
            border: '1px solid #bee5eb'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ℹ️ Importante:</div>
            Las animaciones se verán cuando <strong>publiques el diseño</strong> y lo asignes a una pantalla. 
            En el editor solo se configuran. Se reproducen en <strong>bucle infinito</strong> en las pantallas.
          </div>
          
          <Button
            intent="primary"
            onClick={handleApplyAnimation}
            disabled={!selectedAnimation}
            fill
            icon="tick"
          >
            Aplicar Animación
          </Button>
          
          {/* Presets rápidos */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #ddd' }}>
            <h5 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>⚡ Presets rápidos:</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Button
                small
                onClick={() => {
                  setSelectedCategory('continuous');
                  setSelectedAnimation('pulse');
                  setDuration(2000);
                  setDelay(0);
                }}
              >
                💓 Pulso
              </Button>
              <Button
                small
                onClick={() => {
                  setSelectedCategory('continuous');
                  setSelectedAnimation('bounce');
                  setDuration(1200);
                  setDelay(0);
                }}
              >
                🏀 Rebote
              </Button>
              <Button
                small
                onClick={() => {
                  setSelectedCategory('continuous');
                  setSelectedAnimation('rotate');
                  setDuration(3000);
                  setDelay(0);
                }}
              >
                🔄 Rotar
              </Button>
              <Button
                small
                onClick={() => {
                  setSelectedCategory('continuous');
                  setSelectedAnimation('swing');
                  setDuration(1000);
                  setDelay(0);
                }}
              >
                🎪 Balanceo
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
});
