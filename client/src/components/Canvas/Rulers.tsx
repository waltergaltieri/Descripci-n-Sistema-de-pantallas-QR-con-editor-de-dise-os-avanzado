import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

interface RulersProps {
  width: number;
  height: number;
  visible: boolean;
  zoom: number;
  offsetX: number;
  offsetY: number;
  rulerSize?: number;
}

export const Rulers: React.FC<RulersProps> = ({
  width,
  height,
  visible,
  zoom,
  offsetX,
  offsetY,
  rulerSize = 20
}) => {
  if (!visible) {
    return null;
  }

  const tickInterval = 50; // Intervalo entre marcas principales
  const smallTickInterval = 10; // Intervalo entre marcas pequeñas
  
  // Calcular el rango visible
  const startX = -offsetX / zoom;
  const endX = (width - offsetX) / zoom;
  const startY = -offsetY / zoom;
  const endY = (height - offsetY) / zoom;

  const renderHorizontalRuler = () => {
    const elements: React.ReactNode[] = [];
    
    // Fondo de la regla horizontal
    elements.push(
      <Rect
        key="h-bg"
        x={0}
        y={0}
        width={width}
        height={rulerSize}
        fill="#f5f5f5"
        stroke="#ddd"
        strokeWidth={1}
        listening={false}
      />
    );

    // Marcas y números
    for (let x = Math.floor(startX / tickInterval) * tickInterval; x <= endX; x += tickInterval) {
      const screenX = x * zoom + offsetX;
      
      if (screenX >= 0 && screenX <= width) {
        // Marca principal
        elements.push(
          <Line
            key={`h-tick-${x}`}
            points={[screenX, rulerSize - 8, screenX, rulerSize]}
            stroke="#666"
            strokeWidth={1}
            listening={false}
          />
        );
        
        // Número
        elements.push(
          <Text
            key={`h-text-${x}`}
            x={screenX + 2}
            y={2}
            text={x.toString()}
            fontSize={10}
            fill="#666"
            listening={false}
          />
        );
      }
      
      // Marcas pequeñas
      for (let sx = x + smallTickInterval; sx < x + tickInterval && sx <= endX; sx += smallTickInterval) {
        const smallScreenX = sx * zoom + offsetX;
        
        if (smallScreenX >= 0 && smallScreenX <= width) {
          elements.push(
            <Line
              key={`h-small-${sx}`}
              points={[smallScreenX, rulerSize - 4, smallScreenX, rulerSize]}
              stroke="#999"
              strokeWidth={0.5}
              listening={false}
            />
          );
        }
      }
    }
    
    return elements;
  };

  const renderVerticalRuler = () => {
    const elements: React.ReactNode[] = [];
    
    // Fondo de la regla vertical
    elements.push(
      <Rect
        key="v-bg"
        x={0}
        y={0}
        width={rulerSize}
        height={height}
        fill="#f5f5f5"
        stroke="#ddd"
        strokeWidth={1}
        listening={false}
      />
    );

    // Marcas y números
    for (let y = Math.floor(startY / tickInterval) * tickInterval; y <= endY; y += tickInterval) {
      const screenY = y * zoom + offsetY;
      
      if (screenY >= 0 && screenY <= height) {
        // Marca principal
        elements.push(
          <Line
            key={`v-tick-${y}`}
            points={[rulerSize - 8, screenY, rulerSize, screenY]}
            stroke="#666"
            strokeWidth={1}
            listening={false}
          />
        );
        
        // Número (rotado)
        elements.push(
          <Text
            key={`v-text-${y}`}
            x={2}
            y={screenY - 5}
            text={y.toString()}
            fontSize={10}
            fill="#666"
            rotation={-90}
            listening={false}
          />
        );
      }
      
      // Marcas pequeñas
      for (let sy = y + smallTickInterval; sy < y + tickInterval && sy <= endY; sy += smallTickInterval) {
        const smallScreenY = sy * zoom + offsetY;
        
        if (smallScreenY >= 0 && smallScreenY <= height) {
          elements.push(
            <Line
              key={`v-small-${sy}`}
              points={[rulerSize - 4, smallScreenY, rulerSize, smallScreenY]}
              stroke="#999"
              strokeWidth={0.5}
              listening={false}
            />
          );
        }
      }
    }
    
    return elements;
  };

  return (
    <Group listening={false}>
      {/* Regla horizontal */}
      <Group>
        {renderHorizontalRuler()}
      </Group>
      
      {/* Regla vertical */}
      <Group>
        {renderVerticalRuler()}
      </Group>
      
      {/* Esquina superior izquierda */}
      <Rect
        x={0}
        y={0}
        width={rulerSize}
        height={rulerSize}
        fill="#f0f0f0"
        stroke="#ddd"
        strokeWidth={1}
        listening={false}
      />
    </Group>
  );
};