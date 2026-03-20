import React, { useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { polotnoStore } from '../../../store/editorStore';
import {
  Palette,
  Image,
  Upload,
  Link,
  Circle,
  Square,
  Eye
} from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-500">
          {Math.round(value * 100) / 100}{unit}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );
};

const Background: React.FC = observer(() => {
  const [backgroundType, setBackgroundType] = useState<'solid' | 'linear' | 'radial' | 'image'>('solid');
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [gradientStart, setGradientStart] = useState('#3B82F6');
  const [gradientEnd, setGradientEnd] = useState('#1E40AF');
  const [gradientAngle, setGradientAngle] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFit, setImageFit] = useState<'cover' | 'contain' | 'fill' | 'repeat'>('cover');
  const [imageOpacity, setImageOpacity] = useState(100);
  const [imageBlur, setImageBlur] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const activePage = polotnoStore.activePage;
  
  const applyBackground = async () => {
    if (!activePage) return;
    
    switch (backgroundType) {
      case 'solid':
        await polotnoStore.history.transaction(async () => {
          activePage.set({ fill: solidColor });
        });
        break;
        
      case 'linear':
        await polotnoStore.history.transaction(async () => {
          activePage.set({
            fill: {
              type: 'linear',
              colorStops: [
                { offset: 0, color: gradientStart },
                { offset: 1, color: gradientEnd }
              ],
              angle: gradientAngle
            }
          });
        });
        break;
        
      case 'radial':
        await polotnoStore.history.transaction(async () => {
          activePage.set({
            fill: {
              type: 'radial',
              colorStops: [
                { offset: 0, color: gradientStart },
                { offset: 1, color: gradientEnd }
              ]
            }
          });
        });
        break;
        
      case 'image':
        if (imageUrl) {
          await polotnoStore.history.transaction(async () => {
            activePage.set({
              backgroundImage: {
                src: imageUrl,
                fit: imageFit,
                opacity: imageOpacity / 100,
                blur: imageBlur
              }
            });
          });
        }
        break;
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setImageUrl(src);
        setBackgroundType('image');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleImageFromUrl = () => {
    const url = prompt('Ingresa la URL de la imagen:');
    if (url) {
      setImageUrl(url);
      setBackgroundType('image');
    }
  };
  
  // Aplicar cambios automáticamente
  React.useEffect(() => {
    applyBackground();
  }, [backgroundType, solidColor, gradientStart, gradientEnd, gradientAngle, imageUrl, imageFit, imageOpacity, imageBlur]);
  
  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {/* Tipo de fondo */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tipo de Fondo</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setBackgroundType('solid')}
            className={`flex items-center justify-center p-3 border rounded-lg transition-colors ${
              backgroundType === 'solid'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Palette size={16} className="mr-2" />
            Sólido
          </button>
          <button
            onClick={() => setBackgroundType('linear')}
            className={`flex items-center justify-center p-3 border rounded-lg transition-colors ${
              backgroundType === 'linear'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Square size={16} className="mr-2" />
            Lineal
          </button>
          <button
            onClick={() => setBackgroundType('radial')}
            className={`flex items-center justify-center p-3 border rounded-lg transition-colors ${
              backgroundType === 'radial'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Circle size={16} className="mr-2" />
            Radial
          </button>
          <button
            onClick={() => setBackgroundType('image')}
            className={`flex items-center justify-center p-3 border rounded-lg transition-colors ${
              backgroundType === 'image'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Image size={16} className="mr-2" />
            Imagen
          </button>
        </div>
      </div>
      
      {/* Configuración según el tipo */}
      {backgroundType === 'solid' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Color Sólido</h3>
          <ColorPicker
            label="Color"
            value={solidColor}
            onChange={setSolidColor}
          />
        </div>
      )}
      
      {(backgroundType === 'linear' || backgroundType === 'radial') && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Gradiente {backgroundType === 'linear' ? 'Lineal' : 'Radial'}
          </h3>
          <div className="space-y-4">
            <ColorPicker
              label="Color inicial"
              value={gradientStart}
              onChange={setGradientStart}
            />
            <ColorPicker
              label="Color final"
              value={gradientEnd}
              onChange={setGradientEnd}
            />
            {backgroundType === 'linear' && (
              <SliderInput
                label="Ángulo"
                value={gradientAngle}
                onChange={setGradientAngle}
                min={0}
                max={360}
                step={1}
                unit="°"
              />
            )}
          </div>
          
          {/* Vista previa del gradiente */}
          <div className="mt-4">
            <label className="text-xs font-medium text-gray-700 block mb-2">Vista previa</label>
            <div 
              className="w-full h-12 border border-gray-300 rounded"
              style={{
                background: backgroundType === 'linear'
                  ? `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`
                  : `radial-gradient(circle, ${gradientStart}, ${gradientEnd})`
              }}
            />
          </div>
        </div>
      )}
      
      {backgroundType === 'image' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Imagen de Fondo</h3>
          <div className="space-y-4">
            {/* Cargar imagen */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">Cargar imagen</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  <Upload size={16} className="mr-2" />
                  Archivo
                </button>
                <button
                  onClick={handleImageFromUrl}
                  className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  <Link size={16} className="mr-2" />
                  URL
                </button>
              </div>
            </div>
            
            {/* URL de la imagen */}
            {imageUrl && (
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">URL de la imagen</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
            )}
            
            {/* Ajuste de la imagen */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-2">Ajuste</label>
              <select
                value={imageFit}
                onChange={(e) => setImageFit(e.target.value as any)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cover">Cubrir (Cover)</option>
                <option value="contain">Contener (Contain)</option>
                <option value="fill">Rellenar (Fill)</option>
                <option value="repeat">Repetir (Repeat)</option>
              </select>
            </div>
            
            {/* Opacidad */}
            <SliderInput
              label="Opacidad"
              value={imageOpacity}
              onChange={setImageOpacity}
              min={0}
              max={100}
              step={1}
              unit="%"
            />
            
            {/* Desenfoque */}
            <SliderInput
              label="Desenfoque"
              value={imageBlur}
              onChange={setImageBlur}
              min={0}
              max={20}
              step={0.5}
              unit="px"
            />
            
            {/* Vista previa */}
            {imageUrl && (
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-2">Vista previa</label>
                <div 
                  className="w-full h-24 border border-gray-300 rounded bg-gray-100"
                  style={{
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: imageFit === 'repeat' ? 'auto' : imageFit,
                    backgroundRepeat: imageFit === 'repeat' ? 'repeat' : 'no-repeat',
                    backgroundPosition: 'center',
                    opacity: imageOpacity / 100,
                    filter: `blur(${imageBlur}px)`
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Input oculto para archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      
      {/* Acciones */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            setBackgroundType('solid');
            setSolidColor('#ffffff');
            setGradientStart('#3B82F6');
            setGradientEnd('#1E40AF');
            setGradientAngle(0);
            setImageUrl('');
            setImageOpacity(100);
            setImageBlur(0);
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Restablecer fondo
        </button>
      </div>
    </div>
  );
});

export default Background;