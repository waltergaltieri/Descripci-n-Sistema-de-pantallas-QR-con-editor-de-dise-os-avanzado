import React from 'react';
import { Type, Image, Square, Layout, Plus } from 'lucide-react';

const ElementsPanel = ({ onAddElement }) => {
  const elementTypes = [
    {
      type: 'text',
      name: 'Texto',
      description: 'Agregar texto personalizable',
      icon: Type,
      color: 'bg-blue-100 text-blue-600 hover:bg-blue-200'
    },
    {
      type: 'image',
      name: 'Imagen',
      description: 'Insertar imagen o foto',
      icon: Image,
      color: 'bg-blue-100 text-blue-600 hover:bg-blue-200'
    },
    {
      type: 'container',
      name: 'Contenedor',
      description: 'Caja para agrupar elementos',
      icon: Square,
      color: 'bg-purple-100 text-purple-600 hover:bg-purple-200'
    },
    {
      type: 'section',
      name: 'Sección',
      description: 'Área con columnas',
      icon: Layout,
      color: 'bg-orange-100 text-orange-600 hover:bg-orange-200'
    }
  ];

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Elementos Básicos
        </h3>
        <p className="text-xs text-gray-600">
          Arrastra o haz clic para agregar elementos a tu diseño
        </p>
      </div>

      <div className="space-y-2">
        {elementTypes.map((elementType) => {
          const IconComponent = elementType.icon;
          
          return (
            <button
              key={elementType.type}
              onClick={() => onAddElement(elementType.type)}
              className={`w-full p-3 rounded-lg border-2 border-dashed border-gray-300 transition-all duration-200 hover:border-gray-400 hover:shadow-sm group ${elementType.color}`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">
                    {elementType.name}
                  </div>
                  <div className="text-xs opacity-75">
                    {elementType.description}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sección de elementos avanzados */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Próximamente
        </h3>
        <div className="space-y-2">
          {[
            { name: 'Botón', description: 'Botón interactivo' },
            { name: 'Lista', description: 'Lista de elementos' },
            { name: 'Tabla', description: 'Tabla de datos' },
            { name: 'Gráfico', description: 'Gráficos y estadísticas' }
          ].map((item, index) => (
            <div
              key={index}
              className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 opacity-50"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-gray-300 rounded" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-600">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consejos */}
      <div className="mt-8 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          💡 Consejos
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Usa contenedores para agrupar elementos</li>
          <li>• Las secciones te ayudan a crear layouts</li>
          <li>• Selecciona elementos para editarlos</li>
          <li>• Arrastra para mover y redimensiona con los controles</li>
        </ul>
      </div>
    </div>
  );
};

export default ElementsPanel;