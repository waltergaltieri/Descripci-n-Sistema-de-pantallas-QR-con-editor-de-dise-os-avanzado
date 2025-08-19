import React, { useRef, useEffect, useState } from 'react';
import { Group, Rect, Circle, Line, Text, Image } from 'react-konva';
import Konva from 'konva';
import type { CanvasElement as CanvasElementType, Transform } from '../../types/editor';
import { QRCodeGenerator } from './QRCodeGenerator';

interface CanvasElementProps {
  element: CanvasElementType;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onTransform: (transform: Partial<Transform>) => void;
  previewMode: boolean;
}

export const CanvasElement: React.FC<CanvasElementProps> = ({
  element,
  isSelected,
  isHovered,
  onSelect,
  onTransform,
  previewMode
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [qrImage, setQRImage] = useState<HTMLImageElement | null>(null);

  // Cargar imagen si es necesario
  useEffect(() => {
    if (element.type === 'image' && element.src) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setImage(img);
      img.onerror = () => setImage(null);
      img.src = element.src;
    }
  }, [element.type, ...(element.type === 'image' ? [element.src] : [])]);

  // Generar QR code si es necesario
  useEffect(() => {
    if (element.type === 'qr') {
      QRCodeGenerator.generate({
        data: element.data,
        size: Math.min(element.transform.width, element.transform.height),
        errorCorrectionLevel: element.errorCorrectionLevel,
        margin: element.margin,
        foregroundColor: element.foregroundColor,
        backgroundColor: element.backgroundColor
      }).then(setQRImage).catch(() => setQRImage(null));
    }
  }, [
    element.type,
    ...(element.type === 'qr' ? [
      element.data,
      element.errorCorrectionLevel,
      element.margin,
      element.foregroundColor,
      element.backgroundColor
    ] : []),
    element.transform.width,
    element.transform.height
  ]);

  const { transform, opacity, visible } = element;

  if (!visible) return null;

  // Manejar clic
  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!previewMode) {
      e.cancelBubble = true;
      onSelect();
    }
  };

  // Manejar arrastre
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (previewMode) return;
    
    const node = e.target;
    onTransform({
      x: node.x(),
      y: node.y()
    });
  };

  // Renderizar contenido según el tipo
  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <Text
            text={element.content}
            fontSize={element.fontSize}
            fontFamily={element.fontFamily}
            fontStyle={element.fontStyle}
            fontVariant={element.fontWeight}
            fill={element.color}
            align={element.textAlign}
            lineHeight={element.lineHeight}
            letterSpacing={element.letterSpacing}
            textDecoration={'none'}
            width={transform.width}
            height={transform.height}
            listening={!previewMode}
            onClick={handleClick}
          />
        );

      case 'image':
        return (
          <Image
            image={image || undefined}
            width={transform.width}
            height={transform.height}
            cornerRadius={element.borderRadius}
            listening={!previewMode}
            onClick={handleClick}
          />
        );

      case 'shape':
        switch (element.shapeType) {
          case 'rectangle':
            return (
              <Rect
                width={transform.width}
                height={transform.height}
                fill={element.fill}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                cornerRadius={element.cornerRadius}
                listening={!previewMode}
                onClick={handleClick}
              />
            );

          case 'circle':
            const radius = Math.min(transform.width, transform.height) / 2;
            return (
              <Circle
                x={transform.width / 2}
                y={transform.height / 2}
                radius={radius}
                fill={element.fill}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                listening={!previewMode}
                onClick={handleClick}
              />
            );

          case 'line':
            return (
              <Line
                points={[0, transform.height / 2, transform.width, transform.height / 2]}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                listening={!previewMode}
                onClick={handleClick}
              />
            );

          default:
            return null;
        }

      case 'container':
        return (
          <>
            {/* Fondo del contenedor */}
            <Rect
              width={transform.width}
              height={transform.height}
              fill={element.backgroundColor}
              stroke={element.borderColor}
              strokeWidth={element.borderWidth}
              cornerRadius={element.borderRadius}
              listening={!previewMode}
              onClick={handleClick}
            />
            {/* TODO: Renderizar contenido del contenedor */}
          </>
        );

      case 'qr':
        return (
          <Image
            image={qrImage || undefined}
            width={transform.width}
            height={transform.height}
            listening={!previewMode}
            onClick={handleClick}
          />
        );

      case 'group':
        // Los grupos se renderizan recursivamente
        return null;

      default:
        return null;
    }
  };

  return (
    <Group
      ref={groupRef}
      x={transform.x}
      y={transform.y}
      width={transform.width}
      height={transform.height}
      rotation={transform.rotation}
      scaleX={transform.scaleX}
      scaleY={transform.scaleY}
      opacity={opacity}
      draggable={!previewMode && !element.locked}
      onDragMove={handleDragMove}
      listening={!previewMode}
    >
      {renderContent()}
      
      {/* Indicador de hover */}
      {isHovered && !previewMode && (
        <Rect
          width={transform.width}
          height={transform.height}
          stroke="#007bff"
          strokeWidth={1}
          fill="transparent"
          dash={[3, 3]}
          listening={false}
        />
      )}
    </Group>
  );
};