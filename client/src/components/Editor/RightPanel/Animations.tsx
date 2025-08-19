import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { polotnoStore } from '../../../store/editorStore';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Move, 
  RotateCw,
  Heart,
  Waves,
  ArrowRight,
  Repeat,
  Clock,
  Settings
} from 'lucide-react';

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-500">
          {Math.round(value * 100) / 100}{unit}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );
};

type AnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'pulse' | 'bounce' | 'marquee' | 'motionPath';
type EasingType = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
type DirectionType = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';

interface AnimationConfig {
  type: AnimationType;
  duration: number; // en segundos
  delay: number; // en segundos
  easing: EasingType;
  repeat: number; // -1 para infinito
  direction: DirectionType;
  autoplay: boolean;
  stagger?: number; // para grupos
}

const animationTypes = [
  { type: 'fade' as AnimationType, label: 'Fade', icon: Zap },
  { type: 'slide' as AnimationType, label: 'Slide', icon: Move },
  { type: 'scale' as AnimationType, label: 'Scale', icon: Settings },
  { type: 'rotate' as AnimationType, label: 'Rotate', icon: RotateCw },
  { type: 'pulse' as AnimationType, label: 'Pulse', icon: Heart },
  { type: 'bounce' as AnimationType, label: 'Bounce', icon: Waves },
  { type: 'marquee' as AnimationType, label: 'Marquee', icon: ArrowRight },
  { type: 'motionPath' as AnimationType, label: 'Motion Path', icon: Repeat }
];

const easingTypes = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' }
];

const directionTypes = [
  { value: 'normal', label: 'Normal' },
  { value: 'reverse', label: 'Reverse' },
  { value: 'alternate', label: 'Alternate' },
  { value: 'alternate-reverse', label: 'Alternate Reverse' }
];

const Animations: React.FC = observer(() => {
  const [animationConfig, setAnimationConfig] = useState<AnimationConfig>({
    type: 'fade',
    duration: 1,
    delay: 0,
    easing: 'ease',
    repeat: 1,
    direction: 'normal',
    autoplay: true,
    stagger: 0
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  
  const selectedElements = polotnoStore.selectedElements;
  const hasSelection = selectedElements.length > 0;
  const isGroup = selectedElements.length > 1;
  
  const updateConfig = (updates: Partial<AnimationConfig>) => {
    setAnimationConfig(prev => ({ ...prev, ...updates }));
  };
  
  const applyAnimation = () => {
    if (!hasSelection) return;
    
    selectedElements.forEach((element, index) => {
      const delay = animationConfig.delay + (isGroup ? index * animationConfig.stagger! : 0);
      
      // Aplicar animación según el tipo
      switch (animationConfig.type) {
        case 'fade':
          element.set({
            animation: {
              type: 'fade',
              duration: animationConfig.duration * 1000,
              delay: delay * 1000,
              easing: animationConfig.easing,
              iterationCount: animationConfig.repeat === -1 ? 'infinite' : animationConfig.repeat,
              direction: animationConfig.direction,
              autoplay: animationConfig.autoplay
            }
          });
          break;
          
        case 'slide':
          element.set({
            animation: {
              type: 'slide',
              duration: animationConfig.duration * 1000,
              delay: delay * 1000,
              easing: animationConfig.easing,
              iterationCount: animationConfig.repeat === -1 ? 'infinite' : animationConfig.repeat,
              direction: animationConfig.direction,
              autoplay: animationConfig.autoplay,
              from: { x: -100 },
              to: { x: 0 }
            }
          });
          break;
          
        case 'scale':
          element.set({
            animation: {
              type: 'scale',
              duration: animationConfig.duration * 1000,
              delay: delay * 1000,
              easing: animationConfig.easing,
              iterationCount: animationConfig.repeat === -1 ? 'infinite' : animationConfig.repeat,
              direction: animationConfig.direction,
              autoplay: animationConfig.autoplay,
              from: { scaleX: 0, scaleY: 0 },
              to: { scaleX: 1, scaleY: 1 }
            }
          });
          break;
          
        case 'rotate':
          element.set({
            animation: {
              type: 'rotate',
              duration: animationConfig.duration * 1000,
              delay: delay * 1000,
              easing: animationConfig.easing,
              iterationCount: animationConfig.repeat === -1 ? 'infinite' : animationConfig.repeat,
              direction: animationConfig.direction,
              autoplay: animationConfig.autoplay,
              from: { rotation: 0 },
              to: { rotation: 360 }
            }
          });
          break;
          
        case 'pulse':
          element.set({
            animation: {
              type: 'pulse',
              duration: animationConfig.duration * 1000,
              delay: delay * 1000,
              easing: animationConfig.easing,
              iterationCount: animationConfig.repeat === -1 ? 'infinite' : animationConfig.repeat,
              direction: animationConfig.direction,
              autoplay: animationConfig.autoplay,
              from: { scaleX: 1, scaleY: 1 },
              to: { scaleX: 1.1, scaleY: 1.1 }
            }
          });
          break;
          
        case 'bounce':
          element.set({
            animation: {
              type: 'bounce',
              duration: animationConfig.duration * 1000,
              delay: delay * 1000,
              easing: animationConfig.easing,
              iterationCount: animationConfig.repeat === -1 ? 'infinite' : animationConfig.repeat,
              direction: animationConfig.direction,
              autoplay: animationConfig.autoplay,
              from: { y: 0 },
              to: { y: -20 }
            }
          });
          break;
          
        case 'marquee':
          element.set({
            animation: {
              type: 'marquee',
              duration: animationConfig.duration * 1000,
              delay: delay * 1000,
              easing: 'linear',
              iterationCount: animationConfig.repeat === -1 ? 'infinite' : animationConfig.repeat,
              direction: animationConfig.direction,
              autoplay: animationConfig.autoplay,
              from: { x: -element.width },
              to: { x: polotnoStore.activePage?.width || 800 }
            }
          });
          break;
          
        case 'motionPath':
          // Para motion path, necesitaríamos definir un path SVG
          element.set({
            animation: {
              type: 'motionPath',
              duration: animationConfig.duration * 1000,
              delay: delay * 1000,
              easing: animationConfig.easing,
              iterationCount: animationConfig.repeat === -1 ? 'infinite' : animationConfig.repeat,
              direction: animationConfig.direction,
              autoplay: animationConfig.autoplay,
              path: 'M 0 0 Q 50 -50 100 0 T 200 0' // Ejemplo de path
            }
          });
          break;
      }
    });
  };
  
  const removeAnimation = () => {
    if (!hasSelection) return;
    
    selectedElements.forEach(element => {
      element.set({ animation: null });
    });
  };
  
  const playAnimation = () => {
    if (!hasSelection) return;
    
    selectedElements.forEach(element => {
      // Trigger animation play
      if (element.animations && element.animations.length > 0) {
        // TODO: Implement animation play functionality
        console.log('Playing animations for element:', element.id);
      }
    });
    setIsPlaying(true);
    
    // Auto-stop after duration
    setTimeout(() => {
      setIsPlaying(false);
    }, (animationConfig.duration + animationConfig.delay) * 1000);
  };
  
  const stopAnimation = () => {
    if (!hasSelection) return;
    
    selectedElements.forEach(element => {
      if (element.animations && element.animations.length > 0) {
        // TODO: Implement animation stop functionality
        console.log('Stopping animations for element:', element.id);
      }
    });
    setIsPlaying(false);
  };
  
  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {!hasSelection ? (
        <div className="text-center py-8 text-gray-500">
          <Settings size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Selecciona un elemento para configurar animaciones</p>
        </div>
      ) : (
        <>
          {/* Tipo de animación */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Tipo de Animación</h3>
            <div className="grid grid-cols-2 gap-2">
              {animationTypes.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => updateConfig({ type })}
                  className={`flex items-center justify-center p-3 border rounded-lg transition-colors ${
                    animationConfig.type === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Configuración de timing */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Timing</h3>
            <div className="space-y-4">
              <SliderInput
                label="Duración"
                value={animationConfig.duration}
                onChange={(duration) => updateConfig({ duration })}
                min={0.1}
                max={10}
                step={0.1}
                unit="s"
              />
              
              <SliderInput
                label="Retraso"
                value={animationConfig.delay}
                onChange={(delay) => updateConfig({ delay })}
                min={0}
                max={5}
                step={0.1}
                unit="s"
              />
              
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">Repeticiones</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={animationConfig.repeat === -1 ? '' : animationConfig.repeat}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateConfig({ repeat: value === '' ? -1 : parseInt(value) || 1 });
                    }}
                    placeholder="Infinito"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                  <button
                    onClick={() => updateConfig({ repeat: -1 })}
                    className={`px-3 py-1 text-xs border rounded transition-colors ${
                      animationConfig.repeat === -1
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    ∞
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Easing */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Easing</h3>
            <select
              value={animationConfig.easing}
              onChange={(e) => updateConfig({ easing: e.target.value as EasingType })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {easingTypes.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          
          {/* Dirección */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Dirección</h3>
            <select
              value={animationConfig.direction}
              onChange={(e) => updateConfig({ direction: e.target.value as DirectionType })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {directionTypes.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          
          {/* Stagger para grupos */}
          {isGroup && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Stagger (Grupos)</h3>
              <SliderInput
                label="Retraso entre elementos"
                value={animationConfig.stagger || 0}
                onChange={(stagger) => updateConfig({ stagger })}
                min={0}
                max={2}
                step={0.1}
                unit="s"
              />
            </div>
          )}
          
          {/* Autoplay */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={animationConfig.autoplay}
                onChange={(e) => updateConfig({ autoplay: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Reproducir automáticamente</span>
            </label>
          </div>
          
          {/* Controles de reproducción */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Controles</h3>
            <div className="flex space-x-2">
              <button
                onClick={isPlaying ? stopAnimation : playAnimation}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? (
                  <><Pause size={16} className="mr-2" /> Pausar</>
                ) : (
                  <><Play size={16} className="mr-2" /> Reproducir</>
                )}
              </button>
              
              <button
                onClick={() => {
                  stopAnimation();
                  // Reset to initial state
                  selectedElements.forEach(element => {
                    if (element.animations && element.animations.length > 0) {
        // TODO: Implement animation reset functionality
        console.log('Resetting animations for element:', element.id);
                    }
                  });
                }}
                className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
          
          {/* Acciones */}
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <button
              onClick={applyAnimation}
              className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Aplicar Animación
            </button>
            
            <button
              onClick={removeAnimation}
              className="w-full px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Quitar Animación
            </button>
          </div>
          
          {/* Información del elemento seleccionado */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-500 mb-2">Selección actual</h4>
            <p className="text-xs text-gray-600">
              {selectedElements.length} elemento{selectedElements.length !== 1 ? 's' : ''} seleccionado{selectedElements.length !== 1 ? 's' : ''}
              {isGroup && ` (Stagger: ${animationConfig.stagger}s)`}
            </p>
          </div>
        </>
      )}
    </div>
  );
});

export default Animations;