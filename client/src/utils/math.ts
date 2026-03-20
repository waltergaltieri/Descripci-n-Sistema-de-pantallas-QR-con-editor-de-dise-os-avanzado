import type { Point, Size, Transform } from '../types/editor';

/**
 * Redondea un número a la grilla más cercana
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Redondea un punto a la grilla más cercana
 */
export function snapPointToGrid(point: Point, gridSize: number): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize)
  };
}

/**
 * Calcula la distancia entre dos puntos
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Convierte grados a radianes
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convierte radianes a grados
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Rota un punto alrededor de otro punto
 */
export function rotatePoint(point: Point, center: Point, angle: number): Point {
  const cos = Math.cos(degreesToRadians(angle));
  const sin = Math.sin(degreesToRadians(angle));
  
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
}

/**
 * Calcula el centro de un rectángulo
 */
export function getRectCenter(transform: Transform): Point {
  return {
    x: transform.x + transform.width / 2,
    y: transform.y + transform.height / 2
  };
}

/**
 * Calcula las esquinas de un rectángulo rotado
 */
export function getRotatedRectCorners(transform: Transform): Point[] {
  const center = getRectCenter(transform);
  const corners = [
    { x: transform.x, y: transform.y }, // top-left
    { x: transform.x + transform.width, y: transform.y }, // top-right
    { x: transform.x + transform.width, y: transform.y + transform.height }, // bottom-right
    { x: transform.x, y: transform.y + transform.height } // bottom-left
  ];
  
  return corners.map(corner => rotatePoint(corner, center, transform.rotation));
}

/**
 * Verifica si dos rectángulos se intersectan
 */
export function rectsIntersect(rect1: Transform, rect2: Transform): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * Calcula el bounding box de múltiples transforms
 */
export function getBoundingBox(transforms: Transform[]): Transform {
  if (transforms.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0, rotation: 0, scaleX: 1, scaleY: 1 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  transforms.forEach(transform => {
    const corners = getRotatedRectCorners(transform);
    corners.forEach(corner => {
      minX = Math.min(minX, corner.x);
      minY = Math.min(minY, corner.y);
      maxX = Math.max(maxX, corner.x);
      maxY = Math.max(maxY, corner.y);
    });
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    rotation: 0,
    scaleX: 1,
    scaleY: 1
  };
}

/**
 * Restringe un valor entre un mínimo y máximo
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Interpola linealmente entre dos valores
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Interpola entre dos puntos
 */
export function lerpPoint(start: Point, end: Point, t: number): Point {
  return {
    x: lerp(start.x, end.x, t),
    y: lerp(start.y, end.y, t)
  };
}

/**
 * Calcula las guías inteligentes para alineación
 */
export interface SmartGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  elements: string[];
}

export function calculateSmartGuides(
  movingElement: Transform,
  otherElements: Array<{ id: string; transform: Transform }>,
  threshold: number = 5
): SmartGuide[] {
  const guides: SmartGuide[] = [];
  const movingCenter = getRectCenter(movingElement);
  
  otherElements.forEach(({ id, transform }) => {
    const center = getRectCenter(transform);
    
    // Guías verticales (alineación horizontal)
    if (Math.abs(movingCenter.x - center.x) <= threshold) {
      guides.push({
        type: 'vertical',
        position: center.x,
        elements: [id]
      });
    }
    
    if (Math.abs(movingElement.x - transform.x) <= threshold) {
      guides.push({
        type: 'vertical',
        position: transform.x,
        elements: [id]
      });
    }
    
    if (Math.abs(movingElement.x + movingElement.width - (transform.x + transform.width)) <= threshold) {
      guides.push({
        type: 'vertical',
        position: transform.x + transform.width,
        elements: [id]
      });
    }
    
    // Guías horizontales (alineación vertical)
    if (Math.abs(movingCenter.y - center.y) <= threshold) {
      guides.push({
        type: 'horizontal',
        position: center.y,
        elements: [id]
      });
    }
    
    if (Math.abs(movingElement.y - transform.y) <= threshold) {
      guides.push({
        type: 'horizontal',
        position: transform.y,
        elements: [id]
      });
    }
    
    if (Math.abs(movingElement.y + movingElement.height - (transform.y + transform.height)) <= threshold) {
      guides.push({
        type: 'horizontal',
        position: transform.y + transform.height,
        elements: [id]
      });
    }
  });
  
  return guides;
}

/**
 * Funciones de alineación
 */
export function alignElements(
  elements: Transform[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): Transform[] {
  if (elements.length < 2) return elements;
  
  const boundingBox = getBoundingBox(elements);
  
  return elements.map(element => {
    const newElement = { ...element };
    
    switch (alignment) {
      case 'left':
        newElement.x = boundingBox.x;
        break;
      case 'center':
        newElement.x = boundingBox.x + (boundingBox.width - element.width) / 2;
        break;
      case 'right':
        newElement.x = boundingBox.x + boundingBox.width - element.width;
        break;
      case 'top':
        newElement.y = boundingBox.y;
        break;
      case 'middle':
        newElement.y = boundingBox.y + (boundingBox.height - element.height) / 2;
        break;
      case 'bottom':
        newElement.y = boundingBox.y + boundingBox.height - element.height;
        break;
    }
    
    return newElement;
  });
}

/**
 * Distribuye elementos uniformemente
 */
export function distributeElements(
  elements: Transform[],
  direction: 'horizontal' | 'vertical'
): Transform[] {
  if (elements.length < 3) return elements;
  
  const sorted = [...elements].sort((a, b) => {
    return direction === 'horizontal' ? a.x - b.x : a.y - b.y;
  });
  
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  const totalSpace = direction === 'horizontal'
    ? (last.x + last.width) - first.x
    : (last.y + last.height) - first.y;
    
  const totalElementSize = sorted.reduce((sum, element) => {
    return sum + (direction === 'horizontal' ? element.width : element.height);
  }, 0);
  
  const spacing = (totalSpace - totalElementSize) / (sorted.length - 1);
  
  let currentPosition = direction === 'horizontal' ? first.x : first.y;
  
  return sorted.map((element, index) => {
    if (index === 0) return element;
    
    const newElement = { ...element };
    
    if (direction === 'horizontal') {
      currentPosition += sorted[index - 1].width + spacing;
      newElement.x = currentPosition;
    } else {
      currentPosition += sorted[index - 1].height + spacing;
      newElement.y = currentPosition;
    }
    
    return newElement;
  });
}