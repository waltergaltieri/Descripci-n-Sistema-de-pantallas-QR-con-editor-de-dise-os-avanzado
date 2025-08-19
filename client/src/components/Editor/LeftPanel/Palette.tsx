import React, { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { polotnoStore } from '../../../store/editorStore';
import { 
  Type, 
  Image, 
  Square, 
  Circle,
  Triangle,
  Star,
  QrCode,
  Upload,
  Link
} from 'lucide-react';

const Palette: React.FC = observer(() => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Agregar texto
  const addText = () => {
    polotnoStore.history.transaction(() => {
      polotnoStore.activePage?.addElement({
        type: 'text',
        text: 'Texto de ejemplo',
        x: 100,
        y: 100,
        fontSize: 24,
        fontFamily: 'Arial',
        fill: '#000000',
      });
    });
  };
  
  // Agregar imagen desde archivo
  const addImageFromFile = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        polotnoStore.history.transaction(() => {
          polotnoStore.activePage?.addElement({
            type: 'image',
            src,
            x: 100,
            y: 100,
            width: 200,
            height: 200,
          });
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Agregar imagen desde URL
  const addImageFromURL = () => {
    const url = prompt('Ingresa la URL de la imagen:');
    if (url) {
      polotnoStore.history.transaction(() => {
        polotnoStore.activePage?.addElement({
          type: 'image',
          src: url,
          x: 100,
          y: 100,
          width: 200,
          height: 200,
        });
      });
    }
  };
  
  // Agregar formas
  const addRectangle = () => {
    polotnoStore.history.transaction(() => {
      polotnoStore.activePage?.addElement({
        type: 'svg',
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        src: `<svg viewBox="0 0 150 100"><rect width="150" height="100" fill="#3B82F6" /></svg>`
      });
    });
  };
  
  const addCircle = () => {
    polotnoStore.history.transaction(() => {
      polotnoStore.activePage?.addElement({
        type: 'svg',
        x: 100,
        y: 100,
        width: 150,
        height: 150,
        src: `<svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="75" fill="#EF4444" /></svg>`
      });
    });
  };
  
  const addTriangle = () => {
    polotnoStore.history.transaction(() => {
      polotnoStore.activePage?.addElement({
        type: 'svg',
        x: 100,
        y: 100,
        width: 150,
        height: 130,
        src: `<svg viewBox="0 0 150 130"><polygon points="75,10 140,120 10,120" fill="#10B981" /></svg>`
      });
    });
  };
  
  const addStar = () => {
    polotnoStore.history.transaction(() => {
      polotnoStore.activePage?.addElement({
        type: 'svg',
        x: 100,
        y: 100,
        width: 160,
        height: 160,
        src: `<svg viewBox="0 0 160 160"><polygon points="80,10 95,50 140,50 105,80 120,120 80,100 40,120 55,80 20,50 65,50" fill="#F59E0B" /></svg>`
      });
    });
  };
  
  // Agregar contenedor (usar rectángulo existente)
  const addContainer = addRectangle;
  
  // Agregar código QR (como texto)
  const addQRCode = () => {
    const text = prompt('Texto para el código QR:', 'https://ejemplo.com');
    if (text) {
      polotnoStore.history.transaction(() => {
        polotnoStore.activePage?.addElement({
          type: 'text',
          text: `QR: ${text}`,
          x: 100,
          y: 100,
          fontSize: 24,
          fontFamily: 'Arial',
          fill: '#000000'
        });
      });
    }
  };
  
  const paletteItems = [
    {
      id: 'text',
      name: 'Texto',
      icon: Type,
      action: addText,
      description: 'Agregar texto editable'
    },
    {
      id: 'image-file',
      name: 'Imagen',
      icon: Upload,
      action: addImageFromFile,
      description: 'Subir imagen desde archivo'
    },
    {
      id: 'image-url',
      name: 'URL',
      icon: Link,
      action: addImageFromURL,
      description: 'Agregar imagen desde URL'
    },
    {
      id: 'rectangle',
      name: 'Rectángulo',
      icon: Square,
      action: addRectangle,
      description: 'Agregar rectángulo'
    },
    {
      id: 'circle',
      name: 'Círculo',
      icon: Circle,
      action: addCircle,
      description: 'Agregar círculo'
    },
    {
      id: 'triangle',
      name: 'Triángulo',
      icon: Triangle,
      action: addTriangle,
      description: 'Agregar triángulo'
    },
    {
      id: 'star',
      name: 'Estrella',
      icon: Star,
      action: addStar,
      description: 'Agregar estrella'
    },
    {
      id: 'container',
      name: 'Contenedor',
      icon: Square,
      action: addContainer,
      description: 'Agregar contenedor/grupo'
    },
    {
      id: 'qr',
      name: 'QR',
      icon: QrCode,
      action: addQRCode,
      description: 'Agregar código QR'
    }
  ];
  
  return (
    <div className="p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
        Elementos
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {paletteItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              title={item.description}
            >
              <IconComponent 
                size={24} 
                className="text-gray-600 group-hover:text-blue-600 mb-2" 
              />
              <span className="text-xs text-gray-700 group-hover:text-blue-700 text-center">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Input oculto para subir archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Sección de plantillas */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Plantillas
        </h3>
        <div className="space-y-2">
          <button className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
            <div className="text-sm font-medium text-gray-700">Presentación</div>
            <div className="text-xs text-gray-500">Plantilla básica de presentación</div>
          </button>
          <button className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
            <div className="text-sm font-medium text-gray-700">Póster</div>
            <div className="text-xs text-gray-500">Plantilla para póster promocional</div>
          </button>
          <button className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
            <div className="text-sm font-medium text-gray-700">Banner</div>
            <div className="text-xs text-gray-500">Plantilla para banner web</div>
          </button>
        </div>
      </div>
    </div>
  );
});

export default Palette;