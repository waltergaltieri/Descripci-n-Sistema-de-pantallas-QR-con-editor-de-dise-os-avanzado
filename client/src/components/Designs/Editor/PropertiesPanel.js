import React, { useState } from 'react';
import { Type, Image, Square, Layout, Upload, Palette, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { ChromePicker } from 'react-color';

const PropertiesPanel = ({ element, onUpdateElement }) => {
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  if (!element) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="mb-4">
          <Square className="w-12 h-12 mx-auto text-gray-300" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Ningún elemento seleccionado
        </h3>
        <p className="text-xs text-gray-600">
          Selecciona un elemento en el canvas para editar sus propiedades
        </p>
      </div>
    );
  }

  const updateProperty = (property, value) => {
    onUpdateElement({
      ...element,
      properties: {
        ...element.properties,
        [property]: value
      }
    });
  };

  const updatePosition = (property, value) => {
    onUpdateElement({
      ...element,
      [property]: Math.max(0, parseInt(value) || 0)
    });
  };

  const updateSize = (property, value) => {
    onUpdateElement({
      ...element,
      [property]: Math.max(10, parseInt(value) || 10)
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB.');
      return;
    }

    try {
      setImageUploading(true);
      
      // Crear URL temporal para preview
      const imageUrl = URL.createObjectURL(file);
      updateProperty('src', imageUrl);
      updateProperty('alt', file.name);
      
      // TODO: Aquí deberías subir la imagen al servidor
      // const uploadResponse = await uploadsService.uploadSingle(file);
      // updateProperty('src', uploadResponse.data.url);
      
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      alert('Error al subir la imagen');
    } finally {
      setImageUploading(false);
    }
  };

  const ColorPicker = ({ label, value, onChange, pickerId }) => (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(showColorPicker === pickerId ? null : pickerId)}
          className="w-full h-8 rounded border border-gray-300 flex items-center px-2 space-x-2"
        >
          <div 
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs font-mono">{value}</span>
        </button>
        
        {showColorPicker === pickerId && (
          <div className="absolute top-10 left-0 z-50">
            <div 
              className="fixed inset-0" 
              onClick={() => setShowColorPicker(null)}
            />
            <ChromePicker
              color={value}
              onChange={(color) => onChange(color.hex)}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderElementIcon = () => {
    switch (element.type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'container': return <Square className="w-4 h-4" />;
      case 'section': return <Layout className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {renderElementIcon()}
          <h3 className="text-sm font-medium text-gray-900 capitalize">
            {element.type}
          </h3>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          ID: {element.id}
        </p>
      </div>

      {/* Propiedades */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Posición y Tamaño */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Posición y Tamaño</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">X</label>
              <input
                type="number"
                value={element.x}
                onChange={(e) => updatePosition('x', e.target.value)}
                className="input text-xs"
                min="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Y</label>
              <input
                type="number"
                value={element.y}
                onChange={(e) => updatePosition('y', e.target.value)}
                className="input text-xs"
                min="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Ancho</label>
              <input
                type="number"
                value={element.width}
                onChange={(e) => updateSize('width', e.target.value)}
                className="input text-xs"
                min="10"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Alto</label>
              <input
                type="number"
                value={element.height}
                onChange={(e) => updateSize('height', e.target.value)}
                className="input text-xs"
                min="10"
              />
            </div>
          </div>
        </div>

        {/* Propiedades específicas por tipo */}
        {element.type === 'text' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Texto</h4>
            
            <div>
              <label className="text-xs font-medium text-gray-700">Contenido</label>
              <textarea
                value={element.properties.content || ''}
                onChange={(e) => updateProperty('content', e.target.value)}
                className="input text-xs"
                rows={3}
                placeholder="Escribe tu texto aquí..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Tamaño</label>
                <input
                  type="number"
                  value={element.properties.fontSize || 16}
                  onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))}
                  className="input text-xs"
                  min="8"
                  max="72"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Peso</label>
                <select
                  value={element.properties.fontWeight || 'normal'}
                  onChange={(e) => updateProperty('fontWeight', e.target.value)}
                  className="input text-xs"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Negrita</option>
                  <option value="lighter">Ligera</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700">Fuente</label>
              <select
                value={element.properties.fontFamily || 'Inter'}
                onChange={(e) => updateProperty('fontFamily', e.target.value)}
                className="input text-xs"
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Alineación</label>
              <div className="flex space-x-1">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight }
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateProperty('textAlign', value)}
                    className={`p-2 rounded border ${
                      element.properties.textAlign === value
                        ? 'bg-primary-100 border-primary-300 text-primary-600'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
            
            <ColorPicker
              label="Color del texto"
              value={element.properties.color || '#000000'}
              onChange={(color) => updateProperty('color', color)}
              pickerId="textColor"
            />
          </div>
        )}

        {element.type === 'image' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Imagen</h4>
            
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">Archivo</label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={imageUploading}
                />
                <label
                  htmlFor="image-upload"
                  className={`btn btn-outline btn-sm w-full flex items-center justify-center ${
                    imageUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {imageUploading ? 'Subiendo...' : 'Seleccionar imagen'}
                </label>
                
                {element.properties.src && (
                  <div className="mt-2">
                    <img
                      src={element.properties.src}
                      alt={element.properties.alt || ''}
                      className="w-full h-20 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700">Texto alternativo</label>
              <input
                type="text"
                value={element.properties.alt || ''}
                onChange={(e) => updateProperty('alt', e.target.value)}
                className="input text-xs"
                placeholder="Descripción de la imagen"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700">Ajuste</label>
              <select
                value={element.properties.objectFit || 'cover'}
                onChange={(e) => updateProperty('objectFit', e.target.value)}
                className="input text-xs"
              >
                <option value="cover">Cubrir</option>
                <option value="contain">Contener</option>
                <option value="fill">Rellenar</option>
                <option value="none">Original</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700">Radio del borde</label>
              <input
                type="number"
                value={element.properties.borderRadius || 0}
                onChange={(e) => updateProperty('borderRadius', parseInt(e.target.value))}
                className="input text-xs"
                min="0"
                max="50"
              />
            </div>
          </div>
        )}

        {element.type === 'container' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Contenedor</h4>
            
            <ColorPicker
              label="Color de fondo"
              value={element.properties.backgroundColor || '#f3f4f6'}
              onChange={(color) => updateProperty('backgroundColor', color)}
              pickerId="containerBg"
            />
            
            <div>
              <label className="text-xs font-medium text-gray-700">Radio del borde</label>
              <input
                type="number"
                value={element.properties.borderRadius || 8}
                onChange={(e) => updateProperty('borderRadius', parseInt(e.target.value))}
                className="input text-xs"
                min="0"
                max="50"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700">Padding</label>
              <input
                type="number"
                value={element.properties.padding || 16}
                onChange={(e) => updateProperty('padding', parseInt(e.target.value))}
                className="input text-xs"
                min="0"
                max="100"
              />
            </div>
          </div>
        )}

        {element.type === 'section' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Sección</h4>
            
            <ColorPicker
              label="Color de fondo"
              value={element.properties.backgroundColor || 'transparent'}
              onChange={(color) => updateProperty('backgroundColor', color)}
              pickerId="sectionBg"
            />
            
            <div>
              <label className="text-xs font-medium text-gray-700">Columnas</label>
              <input
                type="number"
                value={element.properties.columns || 1}
                onChange={(e) => updateProperty('columns', parseInt(e.target.value))}
                className="input text-xs"
                min="1"
                max="6"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700">Espacio entre columnas</label>
              <input
                type="number"
                value={element.properties.gap || 16}
                onChange={(e) => updateProperty('gap', parseInt(e.target.value))}
                className="input text-xs"
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700">Padding</label>
              <input
                type="number"
                value={element.properties.padding || 24}
                onChange={(e) => updateProperty('padding', parseInt(e.target.value))}
                className="input text-xs"
                min="0"
                max="100"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;