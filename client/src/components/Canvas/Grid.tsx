import React from 'react';
import { Group, Line } from 'react-konva';

interface GridProps {
  width: number;
  height: number;
  gridSize: number;
  visible: boolean;
  color?: string;
  opacity?: number;
}

export const Grid: React.FC<GridProps> = ({
  width,
  height,
  gridSize,
  visible,
  color = '#e0e0e0',
  opacity = 0.5
}) => {
  if (!visible || gridSize <= 0) {
    return null;
  }

  const lines: React.ReactNode[] = [];

  // Líneas verticales
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke={color}
        strokeWidth={1}
        opacity={opacity}
        listening={false}
      />
    );
  }

  // Líneas horizontales
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke={color}
        strokeWidth={1}
        opacity={opacity}
        listening={false}
      />
    );
  }

  return (
    <Group listening={false}>
      {lines}
    </Group>
  );
};