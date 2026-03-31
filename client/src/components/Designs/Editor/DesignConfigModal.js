import React, { useState, useEffect } from 'react';
import { X, Monitor, Tv, Square, Smartphone } from 'lucide-react';
import ScreenSizeSelector from './ScreenSizeSelector';

const DesignConfigModal = ({ isOpen, onClose, design, onUpdate, readOnly = false }) => {
  const [designName, setDesignName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('tv');
  const [selectedOrientation, setSelectedOrientation] = useState('landscape');
  const [selectedScreenSize, setSelectedScreenSize] = useState(null);
  const [customSize, setCustomSize] = useState({ width: '', height: '' });
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [description, setDescription] = useState('');

  // Cargar datos del diseño existente
  useEffect(() => {
    if (design && isOpen) {
      setDesignName(design.name || '');
      setDescription(design.description || '');

      const currentSettings = design.content?.settings || {};
      const canvasWidth = currentSettings.canvasWidth || design.content?.width || 1920;
      const canvasHeight = currentSettings.canvasHeight || design.content?.height || 1080;
      
      // Determinar orientación
      const orientation = currentSettings.orientation || (canvasWidth > canvasHeight ? 'landscape' : 'portrait');
      setSelectedOrientation(orientation);
      
      // Establecer el tamaño de pantalla seleccionado
      setSelectedScreenSize({
        width: canvasWidth,
        height: canvasHeight,
        name: currentSettings.screenSizeName || 'Personalizado',
        orientation: orientation
      });
      
      // Determinar categoría basada en las dimensiones
      if (canvasWidth >= 3840 || canvasHeight >= 2160) {
        setSelectedCategory('tv');
      } else if (canvasWidth >= 2560 || canvasHeight >= 1440) {
        setSelectedCategory('monitor');
      } else {
        setSelectedCategory('digital_signage');
      }
      
      // Si es un tamaño personalizado, mostrar campos custom
      const isStandardSize = checkIfStandardSize(canvasWidth, canvasHeight);
      if (!isStandardSize) {
        setShowCustomSize(true);
        setCustomSize({ width: canvasWidth.toString(), height: canvasHeight.toString() });
      }
    }
  }, [design, isOpen]);

  const checkIfStandardSize = (width, height) => {
    const standardSizes = [
      // TV sizes
      { width: 1366, height: 768 }, { width: 1920, height: 1080 },
      { width: 3840, height: 2160 }, { width: 7680, height: 4320 },
      // Monitor sizes
      { width: 2560, height: 1440 }, { width: 3440, height: 1440 }, { width: 5120, height: 1440 },
      // Portrait versions
      { width: 768, height: 1366 }, { width: 1080, height: 1920 },
      { width: 2160, height: 3840 }, { width: 4320, height: 7680 },
      { width: 1440, height: 2560 }, { width: 1440, height: 3440 }, { width: 1440, height: 5120 }
    ];
    
    return standardSizes.some(size => size.width === width && size.height === height);
  };

  const categories = [
    {
      id: 'tv',
      name: 'TV / Pantallas Grandes',
      icon: Tv,
      description: 'Televisores y pantallas de gran formato'
    },
    {
      id: 'monitor',
      name: 'Monitores',
      icon: Monitor,
      description: 'Monitores de escritorio y gaming'
    },
    {
      id: 'digital_signage',
      name: 'Señalización Digital',
      icon: Square,
      description: 'Pantallas para publicidad y señalización'
    }
  ];

  const handleScreenSizeChange = (screenSize) => {
    setSelectedScreenSize(screenSize);
    setShowCustomSize(false);
  };

  const handleCustomSizeToggle = () => {
    setShowCustomSize(!showCustomSize);
    if (!showCustomSize) {
      setSelectedScreenSize(null);
    }
  };

  const handleConfirm = () => {
    if (!designName.trim()) {
      alert('Por favor, ingresa un nombre para el diseño.');
      return;
    }

    let finalWidth, finalHeight;

    if (showCustomSize) {
      finalWidth = parseInt(customSize.width);
      finalHeight = parseInt(customSize.height);
      
      if (!finalWidth || !finalHeight || finalWidth < 100 || finalHeight < 100) {
        alert('Por favor, ingresa dimensiones válidas (mínimo 100px).');
        return;
      }
    } else if (selectedScreenSize) {
      finalWidth = selectedScreenSize.width;
      finalHeight = selectedScreenSize.height;
    } else {
      alert('Por favor, selecciona un tamaño de pantalla.');
      return;
    }

    const updatedDesign = {
      ...design,
      name: designName,
      description: description,
      content: {
        ...(design.content || {}),
        width: finalWidth,
        height: finalHeight,
        settings: {
          ...(design.content?.settings || {}),
          canvasWidth: finalWidth,
          canvasHeight: finalHeight,
          screenSizeName: selectedScreenSize?.name || 'Personalizado',
          category: selectedCategory,
          orientation: selectedOrientation,
          backgroundColor: design.content?.settings?.backgroundColor || design.content?.pages?.[0]?.background || '#ffffff'
        },
        pages: Array.isArray(design.content?.pages)
          ? design.content.pages.map((page, index) => ({
              ...page,
              width: index === 0 ? finalWidth : page.width || finalWidth,
              height: index === 0 ? finalHeight : page.height || finalHeight
            }))
          : design.content?.pages
      }
    };

    onUpdate(updatedDesign, finalWidth, finalHeight, selectedOrientation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {readOnly ? 'Información del Diseño' : 'Configurar Diseño'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del diseño
              </label>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ej: Pantalla Principal Lobby"
                disabled={readOnly}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe el propósito de este diseño..."
                rows={3}
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Categoría de pantalla
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => !readOnly && setSelectedCategory(category.id)}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                      selectedCategory === category.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:shadow-md'}`}
                    disabled={readOnly}
                  >
                    <Icon className={`w-8 h-8 mb-2 ${
                      selectedCategory === category.id ? 'text-primary-600' : 'text-gray-600'
                    }`} />
                    <h3 className="font-medium text-gray-900 mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orientación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Orientación
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => !readOnly && setSelectedOrientation('landscape')}
                className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-all duration-200 ${
                  selectedOrientation === 'landscape'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:shadow-md'}`}
                disabled={readOnly}
              >
                <Monitor className={`w-6 h-6 ${
                  selectedOrientation === 'landscape' ? 'text-primary-600' : 'text-gray-600'
                }`} />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Horizontal</div>
                  <div className="text-sm text-gray-600">Ancho > Alto</div>
                </div>
              </button>
              
              <button
                onClick={() => !readOnly && setSelectedOrientation('portrait')}
                className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-all duration-200 ${
                  selectedOrientation === 'portrait'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:shadow-md'}`}
                disabled={readOnly}
              >
                <Smartphone className={`w-6 h-6 ${
                  selectedOrientation === 'portrait' ? 'text-primary-600' : 'text-gray-600'
                }`} />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Vertical</div>
                  <div className="text-sm text-gray-600">Alto > Ancho</div>
                </div>
              </button>
            </div>
          </div>

          {/* Selector de tamaño */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Tamaño de pantalla
              </label>
              {!readOnly && (
                <button
                  onClick={handleCustomSizeToggle}
                  className={`text-sm px-3 py-1 rounded-lg border transition-colors ${
                    showCustomSize
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showCustomSize ? 'Usar tamaños estándar' : 'Tamaño personalizado'}
                </button>
              )}
            </div>

            {showCustomSize ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ancho (px)</label>
                  <input
                    type="number"
                    value={customSize.width}
                    onChange={(e) => setCustomSize(prev => ({ ...prev, width: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="1920"
                    min="100"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Alto (px)</label>
                  <input
                    type="number"
                    value={customSize.height}
                    onChange={(e) => setCustomSize(prev => ({ ...prev, height: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="1080"
                    min="100"
                    disabled={readOnly}
                  />
                </div>
              </div>
            ) : (
              <ScreenSizeSelector
                selectedSize={selectedScreenSize}
                onSizeChange={readOnly ? () => {} : handleScreenSizeChange}
                selectedCategory={selectedCategory}
                selectedOrientation={selectedOrientation}
                disabled={readOnly}
              />
            )}
          </div>

          {/* Información actual */}
          {selectedScreenSize && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Configuración actual:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Tamaño: {selectedScreenSize.name}</div>
                <div>Dimensiones: {selectedScreenSize.width} × {selectedScreenSize.height} px</div>
                <div>Orientación: {selectedOrientation === 'landscape' ? 'Horizontal' : 'Vertical'}</div>
                <div>Relación de aspecto: {(selectedScreenSize.width / selectedScreenSize.height).toFixed(2)}:1</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          {!readOnly && (
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
            >
              Aplicar Cambios
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignConfigModal;
