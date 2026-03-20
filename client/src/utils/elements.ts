import type { CanvasElement, ElementType, Transform } from '../types/editor';
import { generateId } from './id';

/**
 * Crea un transform por defecto
 */
export function createDefaultTransform(overrides: Partial<Transform> = {}): Transform {
  return {
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    ...overrides
  };
}

/**
 * Crea un elemento por defecto basado en su tipo
 */
export function createDefaultElement(
  type: ElementType,
  overrides: Partial<CanvasElement> = {}
): CanvasElement {
  const baseElement = {
    id: generateId(),
    type,
    name: getDefaultElementName(type),
    transform: createDefaultTransform(overrides.transform),
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
    ...overrides
  };

  // Propiedades específicas por tipo
  switch (type) {
    case 'text':
      return {
        ...baseElement,
        type: 'text',
        content: 'Texto de ejemplo',
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        color: '#1f2937',
        lineHeight: 1.2,
        letterSpacing: 0,
        textShadow: undefined,
        ...overrides
      } as CanvasElement;

    case 'image':
      return {
        ...baseElement,
        type: 'image',
        src: '',
        alt: 'Imagen',
        fit: 'cover',
        borderRadius: 0,
        crop: undefined,
        ...overrides
      } as CanvasElement;

    case 'shape':
      return {
        ...baseElement,
        type: 'shape',
        shapeType: 'rectangle',
        fill: '#3b82f6',
        stroke: '#000000',
        strokeWidth: 0,
        cornerRadius: 0,
        ...overrides
      } as CanvasElement;

    case 'container':
      return {
        ...baseElement,
        type: 'container',
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        children: [],
        ...overrides
      } as CanvasElement;

    case 'qr':
      return {
        ...baseElement,
        type: 'qr',
        data: 'https://ejemplo.com',
        errorCorrectionLevel: 'M',
        margin: 4,
        foregroundColor: '#000000',
        backgroundColor: '#ffffff',
        transform: createDefaultTransform({ width: 150, height: 150, ...overrides.transform }),
        ...overrides
      } as CanvasElement;

    case 'group':
      return {
        ...baseElement,
        type: 'group',
        children: [],
        ...overrides
      } as CanvasElement;

    default:
      return baseElement as CanvasElement;
  }
}

/**
 * Obtiene el nombre por defecto para un tipo de elemento
 */
function getDefaultElementName(type: ElementType): string {
  const names: Record<ElementType, string> = {
    text: 'Texto',
    image: 'Imagen',
    shape: 'Forma',
    container: 'Contenedor',
    qr: 'Código QR',
    group: 'Grupo'
  };
  
  return names[type] || 'Elemento';
}

/**
 * Calcula el bounding box de un conjunto de elementos
 */
export function calculateBoundingBox(elements: CanvasElement[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach(element => {
    const { x, y, width, height } = element.transform;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Verifica si un punto está dentro de un elemento
 */
export function isPointInElement(point: { x: number; y: number }, element: CanvasElement): boolean {
  const { x, y, width, height } = element.transform;
  return (
    point.x >= x &&
    point.x <= x + width &&
    point.y >= y &&
    point.y <= y + height
  );
}

/**
 * Obtiene los elementos en un punto específico (ordenados por z-index)
 */
export function getElementsAtPoint(
  point: { x: number; y: number },
  elements: Record<string, CanvasElement>
): CanvasElement[] {
  return Object.values(elements)
    .filter(element => element.visible && isPointInElement(point, element))
    .sort((a, b) => b.zIndex - a.zIndex);
}