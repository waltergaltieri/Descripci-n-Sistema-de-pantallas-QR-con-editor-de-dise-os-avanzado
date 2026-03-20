import React, { useState } from 'react';
import { X, Monitor, Tv, Square } from 'lucide-react';

const DesignPreconfigModal = ({ isOpen, onConfirm, onCancel }) => {
  const [designName, setDesignName] = useState('');
  const [selectedSize, setSelectedSize] = useState(null);
  const [customSize, setCustomSize] = useState({ width: '', height: '' });
  const [useCustomSize, setUseCustomSize] = useState(false);

  // Tamaños predefinidos con dimensiones exactas
  const predefinedSizes = [
    { name: '32" HD TV Horizontal', width: 1366, height: 768, orientation: 'landscape' },
    { name: '32" HD TV Vertical', width: 768, height: 1366, orientation: 'portrait' },
    { name: '40" Full HD Horizontal', width: 1920, height: 1080, orientation: 'landscape' },
    { name: '40" Full HD Vertical', width: 1080, height: 1920, orientation: 'portrait' },
    { name: '43" Full HD Horizontal', width: 1920, height: 1080, orientation: 'landscape' },
    { name: '43" Full HD Vertical', width: 1080, height: 1920, orientation: 'portrait' },
    { name: '50" 4K Horizontal', width: 3840, height: 2160, orientation: 'landscape' },
    { name: '50" 4K Vertical', width: 2160, height: 3840, orientation: 'portrait' },
    { name: '55" 4K Horizontal', width: 3840, height: 2160, orientation: 'landscape' },
    { name: '55" 4K Vertical', width: 2160, height: 3840, orientation: 'portrait' },
    { name: 'Monitor 24" Full HD', width: 1920, height: 1080, orientation: 'landscape' },
    { name: 'Monitor 27" QHD', width: 2560, height: 1440, orientation: 'landscape' },
    { name: 'Monitor 32" 4K', width: 3840, height: 2160, orientation: 'landscape' }
  ];

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setUseCustomSize(false);
    console.log('Tamaño seleccionado:', size);
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
        orientation: parseInt(customSize.width) > parseInt(customSize.height) ? 'landscape' : 'portrait'
      };
    } else {
      if (!selectedSize) {
        alert('Por favor, selecciona un tamaño de pantalla');
        return;
      }
      finalSize = selectedSize;
    }

    console.log('=== DATOS DEL FORMULARIO ===');
    console.log('Nombre:', designName.trim());
    console.log('Tamaño final:', finalSize);
    console.log('Dimensiones:', finalSize.width, 'x', finalSize.height);
    console.log('Orientación:', finalSize.orientation);

    // Enviar datos en el formato correcto
    onConfirm({
      name: designName.trim(),
      width: finalSize.width,
      height: finalSize.height,
      screenSizeName: finalSize.name,
      orientation: finalSize.orientation
    });

    // Limpiar formulario
    setDesignName('');
    setSelectedSize(null);
    setCustomSize({ width: '', height: '' });
    setUseCustomSize(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Crear Nuevo Diseño
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Nombre del diseño */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Diseño *
            </label>
            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Ej: Pantalla Principal Lobby"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Selector de tamaño */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Dimensiones de la Pantalla *
              </label>
              <button
                onClick={handleCustomSizeToggle}
                className={`text-sm px-3 py-1 rounded-md transition-colors ${
                  useCustomSize
                    ? 'bg-blue-100 text-blue-700'
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
                    placeholder="768"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Alto (px)</label>
                  <input
                    type="number"
                    value={customSize.height}
                    onChange={(e) => setCustomSize({ ...customSize, height: e.target.value })}
                    placeholder="1366"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {predefinedSizes.map((size, index) => {
                  const isSelected = selectedSize && selectedSize.name === size.name;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleSizeSelect(size)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {size.orientation === 'portrait' ? (
                          <Square className="w-4 h-4" />
                        ) : size.name.includes('Monitor') ? (
                          <Monitor className="w-4 h-4" />
                        ) : (
                          <Tv className="w-4 h-4" />
                        )}
                        <span className="font-medium text-sm">{size.name}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {size.width} × {size.height} px
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Información de dimensiones seleccionadas */}
          {(selectedSize || (useCustomSize && customSize.width && customSize.height)) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Dimensiones seleccionadas:</h4>
              <div className="text-sm text-blue-700">
                {useCustomSize ? (
                  <>
                    <p>Ancho: {customSize.width} px</p>
                    <p>Alto: {customSize.height} px</p>
                    <p>Orientación: {parseInt(customSize.width) > parseInt(customSize.height) ? 'Horizontal' : 'Vertical'}</p>
                  </>
                ) : (
                  <>
                    <p>Pantalla: {selectedSize.name}</p>
                    <p>Ancho: {selectedSize.width} px</p>
                    <p>Alto: {selectedSize.height} px</p>
                    <p>Orientación: {selectedSize.orientation === 'landscape' ? 'Horizontal' : 'Vertical'}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Crear Diseño
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignPreconfigModal;