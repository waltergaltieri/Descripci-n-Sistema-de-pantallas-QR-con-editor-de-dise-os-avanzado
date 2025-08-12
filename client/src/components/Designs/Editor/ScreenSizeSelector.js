import React, { useState } from 'react';
import { Monitor, Smartphone, Tablet, Tv, Square, Maximize } from 'lucide-react';

const ScreenSizeSelector = ({ selectedSize, onSizeChange }) => {
  const [customSize, setCustomSize] = useState({ width: '', height: '' });
  const [showCustom, setShowCustom] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('tv');
  const [selectedOrientation, setSelectedOrientation] = useState('landscape');
  const screenSizes = {
    // TV/Pantallas grandes
    tv: {
      category: 'TV/Pantallas Grandes',
      icon: Tv,
      sizes: [
        { name: '32" HD TV', width: 1366, height: 768, diagonal: 32, orientation: 'landscape' },
        { name: '40" Full HD TV', width: 1920, height: 1080, diagonal: 40, orientation: 'landscape' },
        { name: '43" Full HD TV', width: 1920, height: 1080, diagonal: 43, orientation: 'landscape' },
        { name: '50" 4K TV', width: 3840, height: 2160, diagonal: 50, orientation: 'landscape' },
        { name: '55" 4K TV', width: 3840, height: 2160, diagonal: 55, orientation: 'landscape' },
        { name: '65" 4K TV', width: 3840, height: 2160, diagonal: 65, orientation: 'landscape' },
        { name: '75" 4K TV', width: 3840, height: 2160, diagonal: 75, orientation: 'landscape' },
        { name: '85" 8K TV', width: 7680, height: 4320, diagonal: 85, orientation: 'landscape' }
      ]
    },
    // Monitores
    monitor: {
      category: 'Monitores',
      icon: Monitor,
      sizes: [
        { name: '21.5" Full HD Monitor', width: 1920, height: 1080, diagonal: 21.5, orientation: 'landscape' },
        { name: '24" Full HD Monitor', width: 1920, height: 1080, diagonal: 24, orientation: 'landscape' },
        { name: '27" QHD Monitor', width: 2560, height: 1440, diagonal: 27, orientation: 'landscape' },
        { name: '32" 4K Monitor', width: 3840, height: 2160, diagonal: 32, orientation: 'landscape' },
        { name: '34" Ultrawide Monitor', width: 3440, height: 1440, diagonal: 34, orientation: 'landscape' },
        { name: '49" Super Ultrawide', width: 5120, height: 1440, diagonal: 49, orientation: 'landscape' }
      ]
    },
    // Señalización digital
    digital_signage: {
      category: 'Señalización Digital',
      icon: Square,
      sizes: [
        { name: 'Pantalla Vertical 43"', width: 1080, height: 1920, diagonal: 43, orientation: 'portrait' },
        { name: 'Pantalla Vertical 55"', width: 1080, height: 1920, diagonal: 55, orientation: 'portrait' },
        { name: 'Video Wall 2x2', width: 3840, height: 2160, diagonal: 110, orientation: 'landscape' },
        { name: 'Pantalla LED Exterior', width: 1920, height: 1080, diagonal: 65, orientation: 'landscape' }
      ]
    }
  };

  const handleSizeSelect = (size) => {
    const finalSize = selectedOrientation === 'portrait' && size.orientation === 'landscape' 
      ? { ...size, width: size.height, height: size.width, orientation: 'portrait' }
      : size;
    
    onSizeChange({
      name: `${finalSize.name} (${selectedOrientation === 'portrait' ? 'Vertical' : 'Horizontal'})`,
      width: finalSize.width,
      height: finalSize.height,
      orientation: selectedOrientation,
      diagonal: size.diagonal
    });
  };

  const handleCustomSizeChange = () => {
    if (customSize.width && customSize.height) {
      onSizeChange({
        name: `Personalizado ${customSize.width}x${customSize.height}`,
        width: parseInt(customSize.width),
        height: parseInt(customSize.height),
        orientation: selectedOrientation
      });
    }
  };

  const handleOrientationChange = (orientation) => {
    setSelectedOrientation(orientation);
    // Si hay un tamaño seleccionado, actualizar con la nueva orientación
    if (selectedSize) {
      const currentCategory = screenSizes[selectedCategory];
      const currentSize = currentCategory.sizes.find(s => 
        s.name === selectedSize.name.replace(' (Vertical)', '').replace(' (Horizontal)', '')
      );
      if (currentSize) {
        handleSizeSelect(currentSize);
      }
    }
  };

  const getOrientationIcon = (orientation) => {
    switch (orientation) {
      case 'portrait':
        return '📱';
      case 'landscape':
        return '🖥️';
      case 'square':
        return '⬜';
      default:
        return '📐';
    }
  };

  const isSelected = (size) => {
    return selectedSize && 
           selectedSize.width === size.width && 
           selectedSize.height === size.height;
  };

  return (
    <div className="space-y-4">
      {/* Selector de categoría */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(screenSizes).map(([key, category]) => {
          const IconComponent = category.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                selectedCategory === key
                  ? 'bg-primary-50 border-primary-200 text-primary-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-sm font-medium">{category.category}</span>
            </button>
          );
        })}
      </div>

      {/* Selector de orientación */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Orientación:</span>
        <div className="flex space-x-2">
          <button
            onClick={() => handleOrientationChange('landscape')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
              selectedOrientation === 'landscape'
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="text-sm">Horizontal</span>
          </button>
          <button
            onClick={() => handleOrientationChange('portrait')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
              selectedOrientation === 'portrait'
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Smartphone className="w-4 h-4 rotate-0" />
            <span className="text-sm">Vertical</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Tamaños de Pantalla Estándar</h3>
        <div className="text-sm text-gray-500">
          {selectedSize && (
            <span>
              {selectedSize.width} × {selectedSize.height} px
              {selectedSize.name && ` (${selectedSize.name})`}
            </span>
          )}
        </div>
      </div>

      {Object.entries(screenSizes).filter(([key]) => key === selectedCategory).map(([categoryKey, category]) => {
        const IconComponent = category.icon;
        return (
          <div key={categoryKey} className="space-y-3">
            <h4 className="flex items-center gap-2 text-md font-medium text-gray-700 border-b border-gray-200 pb-2">
              <IconComponent className="w-5 h-5" />
              {category.category}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.sizes.map((size, index) => {
                const displaySize = selectedOrientation === 'portrait' && size.orientation === 'landscape'
                  ? { ...size, width: size.height, height: size.width }
                  : size;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleSizeSelect(size)}
                    className={`
                      p-3 rounded-lg border-2 text-left transition-all duration-200
                      hover:border-primary-300 hover:bg-primary-50
                      ${
                        isSelected(size)
                          ? 'border-primary-500 bg-primary-100 shadow-md'
                          : 'border-gray-200 bg-white'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900">
                        {size.name}
                      </span>
                      {selectedOrientation === 'landscape' ? 
                        <Monitor className="w-4 h-4" /> : 
                        <Smartphone className="w-4 h-4" />
                      }
                    </div>
                    <div className="text-xs text-gray-600">
                      {displaySize.width} × {displaySize.height} px
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {size.diagonal && (
                        <div>{size.diagonal}" diagonal</div>
                      )}
                      Ratio: {(displaySize.width / displaySize.height).toFixed(2)}:1
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Opción personalizada */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="flex items-center gap-2 text-md font-medium text-gray-700 mb-3">
          <Maximize className="w-5 h-5" />
          Tamaño Personalizado
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ancho (px)
            </label>
            <input
              type="number"
              value={selectedSize?.width || ''}
              onChange={(e) => {
                const width = parseInt(e.target.value) || 0;
                onSizeChange({
                  ...selectedSize,
                  width,
                  name: 'Personalizado',
                  orientation: width > (selectedSize?.height || 0) ? 'landscape' : 'portrait'
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              min="1"
              max="10000"
              placeholder="Ancho"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alto (px)
            </label>
            <input
              type="number"
              value={selectedSize?.height || ''}
              onChange={(e) => {
                const height = parseInt(e.target.value) || 0;
                onSizeChange({
                  ...selectedSize,
                  height,
                  name: 'Personalizado',
                  orientation: (selectedSize?.width || 0) > height ? 'landscape' : 'portrait'
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              min="1"
              max="10000"
              placeholder="Alto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenSizeSelector;