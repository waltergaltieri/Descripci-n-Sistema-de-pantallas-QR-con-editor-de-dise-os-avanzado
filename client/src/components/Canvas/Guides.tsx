import React from 'react';
import { Group, Line } from 'react-konva';
interface GuidesProps {
  width: number;
  height: number;
  visible: boolean;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export const Guides: React.FC<GuidesProps> = ({
  width,
  height,
  visible,
  zoom,
  offsetX,
  offsetY
}) => {
  
  if (!visible) {
    return null;
  }

  // For now, return empty guides until guides are properly implemented
  const guides: any[] = [];

  const handleGuideDrag = (guideId: string, newPosition: number, isVertical: boolean) => {
    // Guide drag logic will be implemented when guides are added to ViewportState
  };

  const removeGuide = (guideId: string) => {
    // Guide removal logic will be implemented when guides are added to ViewportState
  };

  return (
    <Group listening={false}>
      {guides.map((guide: any) => {
        if (guide.type === 'vertical') {
          const screenX = guide.position * zoom + offsetX;
          
          if (screenX < 0 || screenX > width) {
            return null;
          }
          
          return (
            <Line
              key={guide.id}
              points={[screenX, 0, screenX, height]}
              stroke={guide.color}
              strokeWidth={1}
              dash={[5, 5]}
              opacity={0.8}
              draggable
              dragBoundFunc={(pos) => ({
                x: pos.x,
                y: 0
              })}
              onDragMove={(e) => {
                const newPosition = (e.target.x() - offsetX) / zoom;
                handleGuideDrag(guide.id, newPosition, true);
              }}
              onDblClick={() => removeGuide(guide.id)}
              hitStrokeWidth={10} // Área más grande para hacer clic
            />
          );
        } else {
          const screenY = guide.position * zoom + offsetY;
          
          if (screenY < 0 || screenY > height) {
            return null;
          }
          
          return (
            <Line
              key={guide.id}
              points={[0, screenY, width, screenY]}
              stroke={guide.color}
              strokeWidth={1}
              dash={[5, 5]}
              opacity={0.8}
              draggable
              dragBoundFunc={(pos) => ({
                x: 0,
                y: pos.y
              })}
              onDragMove={(e) => {
                const newPosition = (e.target.y() - offsetY) / zoom;
                handleGuideDrag(guide.id, newPosition, false);
              }}
              onDblClick={() => removeGuide(guide.id)}
              hitStrokeWidth={10} // Área más grande para hacer clic
            />
          );
        }
      })}
    </Group>
  );
};