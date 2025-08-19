import React from 'react';
import { Group, Rect, Image } from 'react-konva';
import type { Background as BackgroundType } from '../../types/editor';

interface BackgroundProps {
  background: BackgroundType;
  width?: number;
  height?: number;
}

export const Background: React.FC<BackgroundProps> = ({ 
  background, 
  width = 1920, 
  height = 1080 
}) => {
  const renderBackground = () => {
    switch (background.type) {
      case 'solid':
        return (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={background.color}
            listening={false}
          />
        );

      case 'linear-gradient':
        // Para gradientes lineales, necesitamos crear un patrón
        // Konva no soporta gradientes CSS directamente, así que usamos fillLinearGradientColorStops
        const linearBg = background as any;
        const angle = linearBg.angle;
        const radians = (angle * Math.PI) / 180;
        
        // Calcular puntos de inicio y fin del gradiente
        const centerX = width / 2;
        const centerY = height / 2;
        const length = Math.sqrt(width * width + height * height) / 2;
        
        const startX = centerX - Math.cos(radians) * length;
        const startY = centerY - Math.sin(radians) * length;
        const endX = centerX + Math.cos(radians) * length;
        const endY = centerY + Math.sin(radians) * length;
        
        // Crear array de colores y posiciones
        const colorStops: (string | number)[] = [];
        linearBg.stops.forEach((stop: any) => {
          colorStops.push(stop.offset, stop.color);
        });
        
        return (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fillLinearGradientStartPoint={{ x: startX, y: startY }}
            fillLinearGradientEndPoint={{ x: endX, y: endY }}
            fillLinearGradientColorStops={colorStops}
            listening={false}
          />
        );

      case 'radial-gradient':
        // Para gradientes radiales
        const radialBg = background as any;
        const colorStopsRadial: (string | number)[] = [];
        radialBg.stops.forEach((stop: any) => {
          colorStopsRadial.push(stop.offset, stop.color);
        });
        
        return (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fillRadialGradientStartPoint={{ x: radialBg.centerX, y: radialBg.centerY }}
            fillRadialGradientEndPoint={{ x: radialBg.centerX, y: radialBg.centerY }}
            fillRadialGradientStartRadius={0}
            fillRadialGradientEndRadius={radialBg.radius}
            fillRadialGradientColorStops={colorStopsRadial}
            listening={false}
          />
        );

      case 'image':
        // Para imágenes de fondo, necesitaríamos cargar la imagen primero
        // Por simplicidad, mostramos un placeholder
        return (
          <Group>
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="#f0f0f0"
              listening={false}
            />
            {/* TODO: Implementar carga de imagen de fondo */}
          </Group>
        );

      default:
        return (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="#ffffff"
            listening={false}
          />
        );
    }
  };

  return <>{renderBackground()}</>;
};