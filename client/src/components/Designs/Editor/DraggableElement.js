import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Type, Image, Square, Layout, Lock, EyeOff } from 'lucide-react';

const DraggableElement = ({ element, isSelected, onSelect, zoom, isDragging, isLocked = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform
  } = useDraggable({
    id: element.id,
    data: {
      type: 'element',
      element
    },
    disabled: isLocked
  });

  const style = {
    position: 'absolute',
    left: (element.x * zoom) / 100,
    top: (element.y * zoom) / 100,
    width: (element.width * zoom) / 100,
    height: (element.height * zoom) / 100,
    transform: CSS.Translate.toString(transform),
    zIndex: isSelected ? 1000 : element.zIndex || 1,
    opacity: isDragging ? 0.5 : 1,
    cursor: isLocked ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
    filter: element.properties?.visible === false ? 'opacity(0.3)' : 'none'
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect();
  };

  const renderElementContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <div
            className={`w-full h-full flex items-center ${
              isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
            } ${isLocked ? 'ring-2 ring-red-400' : ''}`}
            style={{
              fontSize: (element.properties.fontSize * zoom) / 100,
              fontFamily: element.properties.fontFamily,
              fontWeight: element.properties.fontWeight,
              color: element.properties.color,
              textAlign: element.properties.textAlign,
              lineHeight: element.properties.lineHeight,
              padding: (8 * zoom) / 100
            }}
          >
            {element.properties.content || 'Texto de ejemplo'}
          </div>
        );

      case 'image':
        return (
          <div
            className={`w-full h-full overflow-hidden ${
              isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
            } ${isLocked ? 'ring-2 ring-red-400' : ''}`}
            style={{
              borderRadius: (element.properties.borderRadius * zoom) / 100
            }}
          >
            {element.properties.src ? (
              <img
                src={element.properties.src}
                alt={element.properties.alt || ''}
                className="w-full h-full"
                style={{
                  objectFit: element.properties.objectFit || 'cover'
                }}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Image className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-sm">Sin imagen</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'container':
        return (
          <div
            className={`w-full h-full ${
              isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
            } ${isLocked ? 'ring-2 ring-red-400' : ''}`}
            style={{
              backgroundColor: element.properties.backgroundColor,
              borderRadius: (element.properties.borderRadius * zoom) / 100,
              padding: (element.properties.padding * zoom) / 100,
              border: element.properties.border !== 'none' ? element.properties.border : 'none'
            }}
          >
            {/* Contenido del contenedor */}
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Square className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs">Contenedor</span>
              </div>
            </div>
          </div>
        );

      case 'section':
        return (
          <div
            className={`w-full h-full ${
              isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
            } ${isLocked ? 'ring-2 ring-red-400' : ''}`}
            style={{
              backgroundColor: element.properties.backgroundColor,
              padding: (element.properties.padding * zoom) / 100
            }}
          >
            {/* Grid de columnas */}
            <div
              className="w-full h-full grid"
              style={{
                gridTemplateColumns: `repeat(${element.properties.columns}, 1fr)`,
                gap: (element.properties.gap * zoom) / 100
              }}
            >
              {Array.from({ length: element.properties.columns }).map((_, index) => (
                <div
                  key={index}
                  className="border-2 border-dashed border-gray-300 rounded flex items-center justify-center"
                >
                  <div className="text-center text-gray-500">
                    <Layout className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">Col {index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className={`w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center ${
            isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
          } ${isLocked ? 'ring-2 ring-red-400' : ''}`}>
            <span className="text-gray-600 text-sm">Elemento desconocido</span>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={`select-none ${
        isSelected ? 'z-50' : ''
      }`}
    >
      {renderElementContent()}
      
      {/* Indicador de tipo de elemento */}
      {isSelected && (
        <div className={`absolute -top-6 left-0 px-2 py-1 rounded text-xs flex items-center ${
          isLocked ? 'bg-red-600' : 'bg-primary-600'
        } text-white`}>
          {element.type === 'text' && <Type className="w-3 h-3 mr-1" />}
          {element.type === 'image' && <Image className="w-3 h-3 mr-1" />}
          {element.type === 'container' && <Square className="w-3 h-3 mr-1" />}
          {element.type === 'section' && <Layout className="w-3 h-3 mr-1" />}
          {element.type}
          {isLocked && <Lock className="w-3 h-3 ml-1" />}
          {element.properties?.visible === false && <EyeOff className="w-3 h-3 ml-1" />}
        </div>
      )}
      
      {/* Indicadores de estado sin selección */}
      {!isSelected && (isLocked || element.properties?.visible === false) && (
        <div className="absolute top-1 right-1 flex space-x-1">
          {isLocked && (
            <div className="bg-red-500 text-white p-1 rounded">
              <Lock className="w-3 h-3" />
            </div>
          )}
          {element.properties?.visible === false && (
            <div className="bg-gray-500 text-white p-1 rounded">
              <EyeOff className="w-3 h-3" />
            </div>
          )}
        </div>
      )}
      
      {/* Indicador de posición y tamaño */}
      {isSelected && (
        <div className="absolute -bottom-6 right-0 bg-gray-800 text-white px-2 py-1 rounded text-xs">
          {element.x}, {element.y} • {element.width} × {element.height}
        </div>
      )}
    </div>
  );
};

export default DraggableElement;