import React, { useState, useEffect } from 'react';
import { X, Settings, Palette, Layout, Grid } from 'lucide-react';
import ScreenSizeSelector from './ScreenSizeSelector';

const DesignSettingsModal = ({ isOpen, onClose, design, onUpdate }) => {
  const [settings, setSettings] = useState({
    name: '',
    description: '',
    backgroundColor: '#ffffff',
    gridSize: 20,
    snapToGrid: true,
    showGrid: false,
    canvasWidth: 1920,
    canvasHeight: 1080
  });

  const [selectedScreenSize, setSelectedScreenSize] = useState(null);

  useEffect(() => {
    if (design) {
      const canvasWidth = design.settings?.canvasWidth || 1920;
      const canvasHeight = design.settings?.canvasHeight || 1080;
      
      setSettings({
        name: design.name || '',
        description: design.description || '',
        backgroundColor: design.settings?.backgroundColor || '#ffffff',
        gridSize: design.settings?.gridSize || 20,
        snapToGrid: design.settings?.snapToGrid !== false,
        showGrid: design.settings?.showGrid || false,
        canvasWidth,
        canvasHeight
      });

      // Establecer el tamaño de pantalla seleccionado
      setSelectedScreenSize({
        width: canvasWidth,
        height: canvasHeight,
        name: design.settings?.screenSizeName || 'Personalizado',
        orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait'
      });
    }
  }, [design]);

  const handleSave = () => {
    onUpdate({
      ...design,
      name: settings.name,
      description: settings.description,
      settings: {
        backgroundColor: settings.backgroundColor,
        gridSize: settings.gridSize,
        snapToGrid: settings.snapToGrid,
        showGrid: settings.showGrid,
        canvasWidth: settings.canvasWidth,
        canvasHeight: settings.canvasHeight,
        screenSizeName: selectedScreenSize?.name || 'Personalizado'
      }
    });
    onClose();
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScreenSizeChange = (screenSize) => {
    setSelectedScreenSize(screenSize);
    setSettings(prev => ({
      ...prev,
      canvasWidth: screenSize.width,
      canvasHeight: screenSize.height
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h2>Configuración del Diseño</h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <div className="space-y-6">
            {/* Información básica */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
                <Layout className="w-5 h-5" />
                Información Básica
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre del Diseño
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="input"
                    placeholder="Ingresa el nombre del diseño"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Describe tu diseño"
                  />
                </div>
              </div>
            </div>

            {/* Configuración visual */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
                <Palette className="w-5 h-5" />
                Configuración Visual
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Color de Fondo del Canvas
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => handleChange('backgroundColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.backgroundColor}
                      onChange={(e) => handleChange('backgroundColor', e.target.value)}
                      className="input flex-1"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <ScreenSizeSelector
                  selectedSize={selectedScreenSize}
                  onSizeChange={handleScreenSizeChange}
                />
              </div>
            </div>

            {/* Configuración de grilla */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
                <Grid className="w-5 h-5" />
                Configuración de Grilla
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tamaño de Grilla (px)
                  </label>
                  <input
                    type="number"
                    value={settings.gridSize}
                    onChange={(e) => handleChange('gridSize', parseInt(e.target.value) || 20)}
                    className="input"
                    min="5"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.snapToGrid}
                      onChange={(e) => handleChange('snapToGrid', e.target.checked)}
                      className="checkbox"
                    />
                    <span className="text-sm">Ajustar elementos a la grilla</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.showGrid}
                      onChange={(e) => handleChange('showGrid', e.target.checked)}
                      className="checkbox"
                    />
                    <span className="text-sm">Mostrar grilla por defecto</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignSettingsModal;