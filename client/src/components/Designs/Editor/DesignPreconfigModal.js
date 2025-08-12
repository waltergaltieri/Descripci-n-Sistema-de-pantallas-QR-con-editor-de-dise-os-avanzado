import React, { useState } from 'react';
import { X, Monitor, Tv, Square, Smartphone } from 'lucide-react';

const DesignPreconfigModal = ({ isOpen, onClose, onConfirm }) => {
  const [designName, setDesignName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('tv');
  const [selectedOrientation, setSelectedOrientation] = useState('landscape');
  const [selectedSize, setSelectedSize] = useState(null);
  const [customSize, setCustomSize] = useState({ width: '', height: '' });
  const [useCustomSize, setUseCustomSize] = useState(false);

  const screenSizes = {
    tv: {
      category: 'TV/Pantallas Grandes',
      icon: Tv,
      sizes: [
        { name: '32" HD TV', width: 1366, height: 768, diagonal: 32 },
        { name: '40" Full HD TV', width: 1920, height: 1080, diagonal: 40 },
        { name: '43" Full HD TV', width: 1920, height: 1080, diagonal: 43 },
        { name: '50" 4K TV', width: 3840, height: 2160, diagonal: 50 },
        { name: '55" 4K TV', width: 3840, height: 2160, diagonal: 55 },
        { name: '65" 4K TV', width: 3840, height: 2160, diagonal: 65 },
        { name: '75" 4K TV', width: 3840, height: 2160, diagonal: 75 },
        { name: '85" 8K TV', width: 7680, height: 4320, diagonal: 85 }
      ]
    },
    monitor: {
      category: 'Monitores',
      icon: Monitor,
      sizes: [
        { name: '21.5" Full HD Monitor', width: 1920, height: 1080, diagonal: 21.5 },
        { name: '24" Full HD Monitor', width: 1920, height: 1080, diagonal: 24 },
        { name: '27" QHD Monitor', width: 2560, height: 1440, diagonal: 27 },
        { name: '32" 4K Monitor', width: 3840, height: 2160, diagonal: 32 },
        { name: '34" Ultrawide Monitor', width: 3440, height: 1440, diagonal: 34 },
        { name: '49" Super Ultrawide', width: 5120, height: 1440, diagonal: 49 }
      ]
    },
    digital_signage: {
      category: 'Señalización Digital',
      icon: Square,
      sizes: [
        { name: 'Pantalla Vertical 43"', width: 1080, height: 1920, diagonal: 43 },
        { name: 'Pantalla Vertical 55"', width: 1080, height: 1920, diagonal: 55 },
        { name: 'Video Wall 2x2', width: 3840, height: 2160, diagonal: 110 },
        { name: 'Pantalla LED Exterior', width: 1920, height: 1080, diagonal: 65 }
      ]
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setUseCustomSize(false);
  };

  const handleCustomSizeToggle = () => {
    setUseCustomSize(!useCustomSize);
    if (!useCustomSize) {
      setSelectedSize(null);
    }
  };

  const handleConfirm = () => {
    if (!designName.trim()) {
      alert('Por favor, ingresa un nombre para el diseño');
      return;
    }

    let finalSize;
    if (useCustomSize) {
      if (!customSize.width || !customSize.height) {
        alert('Por favor, ingresa las dimensiones personalizadas');
        return;
      }
      finalSize = {
        name: `Personalizado ${customSize.width}x${customSize.height}`,
        width: parseInt(customSize.width),
        height: parseInt(customSize.height),
        orientation: selectedOrientation
      };
    } else {
      if (!selectedSize) {
        alert('Por favor, selecciona un tamaño de pantalla');
        return;
      }
      
      const displaySize = selectedOrientation === 'portrait' && selectedSize.width > selectedSize.height
        ? { ...selectedSize, width: selectedSize.height, height: selectedSize.width }
        : selectedSize;
      
      finalSize = {
        ...displaySize,
        name: `${selectedSize.name} (${selectedOrientation === 'portrait' ? 'Vertical' : 'Horizontal'})`,
        orientation: selectedOrientation,
        diagonal: selectedSize.diagonal
      };
    }

    onConfirm({
      name: designName.trim(),
      screenSize: finalSize,
      category: selectedCategory
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Configuración Inicial del Diseño
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Nombre del diseño */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Diseño
            </label>
            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Ej: Pantalla Principal Lobby"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Selector de categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Pantalla
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(screenSizes).map(([key, category]) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCategory(key);
                      setSelectedSize(null);
                    }}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      selectedCategory === key
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">{category.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de orientación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Orientación
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedOrientation('landscape')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  selectedOrientation === 'landscape'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Monitor className="w-5 h-5" />
                <span className="font-medium">Horizontal</span>
              </button>
              <button
                onClick={() => setSelectedOrientation('portrait')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  selectedOrientation === 'portrait'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="font-medium">Vertical</span>
              </button>
            </div>
          </div>

          {/* Selector de tamaño */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Tamaño de Pantalla
              </label>
              <button
                onClick={handleCustomSizeToggle}
                className={`text-sm px-3 py-1 rounded-md transition-colors ${
                  useCustomSize
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {useCustomSize ? 'Usar tamaños estándar' : 'Tamaño personalizado'}
              </button>
            </div>

            {useCustomSize ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ancho (px)</label>
                  <input
                    type="number"
                    value={customSize.width}
                    onChange={(e) => setCustomSize({ ...customSize, width: e.target.value })}
                    placeholder="1920"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Alto (px)</label>
                  <input
                    type="number"
                    value={customSize.height}
                    onChange={(e) => setCustomSize({ ...customSize, height: e.target.value })}
                    placeholder="1080"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {screenSizes[selectedCategory].sizes.map((size, index) => {
                  const displaySize = selectedOrientation === 'portrait' && size.width > size.height
                    ? { ...size, width: size.height, height: size.width }
                    : size;
                  
                  const isSelected = selectedSize && selectedSize.name === size.name;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleSizeSelect(size)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{size.name}</span>
                        {selectedOrientation === 'landscape' ? 
                          <Monitor className="w-4 h-4" /> : 
                          <Smartphone className="w-4 h-4" />
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {displaySize.width} × {displaySize.height} px
                        {size.diagonal && (
                          <div className="mt-1">
                            {size.diagonal}" diagonal
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Crear Diseño
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignPreconfigModal;