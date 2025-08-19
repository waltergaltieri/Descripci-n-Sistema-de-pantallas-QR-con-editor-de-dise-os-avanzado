import React from 'react';
import { observer } from 'mobx-react-lite';
import { polotnoStore } from '../../../store/editorStore';
import { RotateCw, Move, Maximize2, Eye, Lock, Settings } from 'lucide-react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit
}) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          value={Math.round(value * 100) / 100}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
    </div>
  );
};

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

const General: React.FC = observer(() => {
  const selectedElements = polotnoStore.selectedElements;
  const selectedElement = selectedElements[0];
  
  if (!selectedElement) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="mb-4">
          <Settings className="mx-auto text-gray-300" size={48} />
        </div>
        <p className="text-sm">Selecciona un elemento</p>
        <p className="text-xs mt-1">para ver sus propiedades</p>
      </div>
    );
  }
  
  const updateElement = (updates: any) => {
    selectedElement.set(updates);
  };
  
  const handlePositionChange = (property: 'x' | 'y', value: number) => {
    updateElement({ [property]: value });
  };
  
  const handleSizeChange = (property: 'width' | 'height', value: number) => {
    updateElement({ [property]: Math.max(1, value) });
  };
  
  const handleRotationChange = (value: number) => {
    updateElement({ rotation: value });
  };
  
  const handleOpacityChange = (value: number) => {
    updateElement({ opacity: value / 100 });
  };
  
  const handleZIndexChange = (value: number) => {
    updateElement({ zIndex: Math.round(value) });
  };
  
  const handleVisibilityToggle = () => {
    updateElement({ visible: !selectedElement.visible });
  };
  
  const handleLockToggle = () => {
    updateElement({ locked: !selectedElement.locked });
  };
  
  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {/* Información del elemento */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Elemento</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Tipo:</span>
            <span className="text-xs font-medium text-gray-800 capitalize">
              {selectedElement.type}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">ID:</span>
            <span className="text-xs font-mono text-gray-800">
              {selectedElement.id?.slice(0, 8)}...
            </span>
          </div>
        </div>
      </div>
      
      {/* Posición */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <Move size={16} className="mr-2" />
          Posición
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="X"
            value={selectedElement.x || 0}
            onChange={(value) => handlePositionChange('x', value)}
            unit="px"
          />
          <NumberInput
            label="Y"
            value={selectedElement.y || 0}
            onChange={(value) => handlePositionChange('y', value)}
            unit="px"
          />
        </div>
      </div>
      
      {/* Tamaño */}
      {(selectedElement.width !== undefined || selectedElement.height !== undefined) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Maximize2 size={16} className="mr-2" />
            Tamaño
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {selectedElement.width !== undefined && (
              <NumberInput
                label="Ancho"
                value={selectedElement.width}
                onChange={(value) => handleSizeChange('width', value)}
                min={1}
                unit="px"
              />
            )}
            {selectedElement.height !== undefined && (
              <NumberInput
                label="Alto"
                value={selectedElement.height}
                onChange={(value) => handleSizeChange('height', value)}
                min={1}
                unit="px"
              />
            )}
          </div>
          
          {/* Mantener proporción */}
          <div className="mt-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                // TODO: Implementar mantener proporción
              />
              <span className="text-xs text-gray-700">Mantener proporción</span>
            </label>
          </div>
        </div>
      )}
      
      {/* Rotación */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <RotateCw size={16} className="mr-2" />
          Rotación
        </h3>
        <SliderInput
          label="Ángulo"
          value={selectedElement.rotation || 0}
          onChange={handleRotationChange}
          min={-180}
          max={180}
          step={1}
          unit="°"
        />
      </div>
      
      {/* Opacidad */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <Eye size={16} className="mr-2" />
          Opacidad
        </h3>
        <SliderInput
          label="Transparencia"
          value={(selectedElement.opacity || 1) * 100}
          onChange={handleOpacityChange}
          min={0}
          max={100}
          step={1}
          unit="%"
        />
      </div>
      
      {/* Z-Index */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Orden</h3>
        <NumberInput
          label="Z-Index"
          value={selectedElement.zIndex || 0}
          onChange={handleZIndexChange}
          step={1}
        />
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => {
              // TODO: Implement proper z-index management
              console.log('Move to top:', selectedElement.id);
            }}
            className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Traer al frente
          </button>
          <button
            onClick={() => {
              // TODO: Implement proper z-index management
              console.log('Move to bottom:', selectedElement.id);
            }}
            className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Enviar atrás
          </button>
        </div>
      </div>
      
      {/* Estados */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Estados</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 flex items-center">
              <Eye size={16} className="mr-2" />
              Visible
            </span>
            <input
              type="checkbox"
              checked={selectedElement.visible !== false}
              onChange={handleVisibilityToggle}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 flex items-center">
              <Lock size={16} className="mr-2" />
              Bloqueado
            </span>
            <input
              type="checkbox"
              checked={selectedElement.locked || false}
              onChange={handleLockToggle}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>
      
      {/* Acciones */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Acciones</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              const elementData = selectedElement.toJSON();
              const newElement = {
                ...elementData,
                x: elementData.x + 20,
                y: elementData.y + 20,
                name: `${elementData.name || elementData.type} (copia)`
              };
              polotnoStore.activePage?.addElement(newElement);
            }}
            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Duplicar
          </button>
          <button
            onClick={() => polotnoStore.activePage?.children.remove(selectedElement)}
            className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
});

export default General;