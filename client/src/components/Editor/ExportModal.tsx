import React, { useState } from 'react';
import { X, Download, Settings, Info } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  exportType: 'png' | 'jpeg' | 'svg' | 'pdf';
}

interface ExportOptions {
  pixelRatio: number;
  quality: number;
  transparent: boolean;
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, exportType }) => {
  const [options, setOptions] = useState<ExportOptions>({
    pixelRatio: 1,
    quality: exportType === 'jpeg' ? 0.9 : 1,
    transparent: exportType === 'png',
    maintainAspectRatio: true
  });

  const handleExport = () => {
    onExport(options);
    onClose();
  };

  const getFormatInfo = () => {
    switch (exportType) {
      case 'png':
        return {
          title: 'Exportar PNG',
          description: 'Formato ideal para imágenes con transparencia y alta calidad',
          supportsTransparency: true,
          supportsQuality: false
        };
      case 'jpeg':
        return {
          title: 'Exportar JPEG',
          description: 'Formato comprimido ideal para fotografías',
          supportsTransparency: false,
          supportsQuality: true
        };
      case 'svg':
        return {
          title: 'Exportar SVG',
          description: 'Formato vectorial escalable (siempre sin fondo)',
          supportsTransparency: false,
          supportsQuality: false
        };
      case 'pdf':
        return {
          title: 'Exportar PDF',
          description: 'Formato de documento portable (exportado como PNG de alta resolución)',
          supportsTransparency: false,
          supportsQuality: false
        };
      default:
        return {
          title: 'Exportar',
          description: '',
          supportsTransparency: false,
          supportsQuality: false
        };
    }
  };

  const formatInfo = getFormatInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{formatInfo.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{formatInfo.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Resolución */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolución
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="resolution"
                    checked={options.pixelRatio === 1}
                    onChange={() => setOptions({ ...options, pixelRatio: 1 })}
                    className="mr-2"
                  />
                  <span className="text-sm">Normal (1x)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="resolution"
                    checked={options.pixelRatio === 2}
                    onChange={() => setOptions({ ...options, pixelRatio: 2 })}
                    className="mr-2"
                  />
                  <span className="text-sm">Alta (2x)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="resolution"
                    checked={options.pixelRatio === 3}
                    onChange={() => setOptions({ ...options, pixelRatio: 3 })}
                    className="mr-2"
                  />
                  <span className="text-sm">Ultra (3x)</span>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="resolution"
                    checked={![1, 2, 3].includes(options.pixelRatio)}
                    onChange={() => setOptions({ ...options, pixelRatio: 4 })}
                    className="mr-2"
                  />
                  <span className="text-sm">Personalizada:</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={options.pixelRatio}
                  onChange={(e) => setOptions({ ...options, pixelRatio: parseFloat(e.target.value) || 1 })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-xs text-gray-500">x</span>
              </div>
            </div>
          </div>

          {/* Calidad (solo para JPEG) */}
          {formatInfo.supportsQuality && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calidad: {Math.round(options.quality * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={options.quality}
                onChange={(e) => setOptions({ ...options, quality: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Menor tamaño</span>
                <span>Mayor calidad</span>
              </div>
            </div>
          )}

          {/* Transparencia */}
          {formatInfo.supportsTransparency && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.transparent}
                  onChange={(e) => setOptions({ ...options, transparent: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Fondo transparente</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Solo funciona si no hay fondo definido en el diseño
              </p>
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start">
              <Info size={16} className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Consejos:</p>
                <ul className="text-xs space-y-1">
                  <li>• Resolución 2x o 3x para impresión de alta calidad</li>
                  <li>• PNG para logos y gráficos con transparencia</li>
                  <li>• JPEG para fotografías y diseños complejos</li>
                  {exportType === 'svg' && (
                    <li>• Exportación como PNG de alta resolución (SVG no disponible)</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center"
          >
            <Download size={16} className="mr-2" />
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;