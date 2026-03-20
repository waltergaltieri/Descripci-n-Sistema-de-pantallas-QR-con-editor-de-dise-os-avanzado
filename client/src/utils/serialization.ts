import { z } from 'zod';
import type { Composition, CanvasElement, Background, ElementAnimation } from '../types/editor';

// Esquemas de validación con Zod
const PointSchema = z.object({
  x: z.number(),
  y: z.number()
});

const SizeSchema = z.object({
  width: z.number(),
  height: z.number()
});

const TransformSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  scaleX: z.number(),
  scaleY: z.number()
});

const TextShadowSchema = z.object({
  color: z.string(),
  offsetX: z.number(),
  offsetY: z.number(),
  blur: z.number()
}).optional();

const SolidBackgroundSchema = z.object({
  type: z.literal('solid'),
  color: z.string()
});

const LinearGradientSchema = z.object({
  type: z.literal('linear-gradient'),
  angle: z.number(),
  stops: z.array(z.object({
    color: z.string(),
    offset: z.number().min(0).max(1)
  }))
});

const RadialGradientSchema = z.object({
  type: z.literal('radial-gradient'),
  centerX: z.number(),
  centerY: z.number(),
  radius: z.number(),
  stops: z.array(z.object({
    color: z.string(),
    offset: z.number().min(0).max(1)
  }))
});

const ImageBackgroundSchema = z.object({
  type: z.literal('image'),
  src: z.string(),
  fit: z.enum(['cover', 'contain', 'fill']),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  opacity: z.number().min(0).max(1),
  blur: z.number().min(0).optional()
});

const ColorStopSchema = z.object({
  color: z.string(),
  offset: z.number().min(0).max(1)
});

const BackgroundSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('solid'),
    color: z.string()
  }),
  z.object({
    type: z.literal('linear-gradient'),
    angle: z.number(),
    stops: z.array(ColorStopSchema)
  }),
  z.object({
    type: z.literal('radial-gradient'),
    centerX: z.number(),
    centerY: z.number(),
    radius: z.number(),
    stops: z.array(ColorStopSchema)
  }),
  z.object({
    type: z.literal('image'),
    src: z.string(),
    fit: z.enum(['cover', 'contain', 'fill']),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    opacity: z.number().min(0).max(1),
    blur: z.number().min(0).optional()
  })
]);

const BorderSchema = z.object({
  width: z.number(),
  color: z.string(),
  style: z.enum(['solid', 'dashed', 'dotted'])
});

const PaddingSchema = z.object({
  top: z.number(),
  right: z.number(),
  bottom: z.number(),
  left: z.number()
});

const CropSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number()
}).optional();

const KeyframeSchema = z.object({
  t: z.number().min(0).max(1),
  props: z.record(z.string(), z.union([z.number(), z.string()]))
});

const ElementAnimationSchema = z.object({
  type: z.enum([
    'fadeIn', 'fadeOut',
    'slideInTop', 'slideInRight', 'slideInBottom', 'slideInLeft',
    'slideOutTop', 'slideOutRight', 'slideOutBottom', 'slideOutLeft',
    'scaleIn', 'scaleOut',
    'rotate', 'pulse', 'bounce', 'marquee', 'motionPath'
  ]),
  duration: z.number().positive(),
  delay: z.number().min(0).default(0),
  easing: z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut', 'back', 'bounce', 'elastic']),
  repeat: z.union([z.number().min(1), z.literal('infinite')]).default(1),
  direction: z.enum(['normal', 'reverse', 'alternate']).default('normal'),
  autoplay: z.boolean().default(false),
  playOnLoopStart: z.boolean().default(false),
  keyframes: z.array(KeyframeSchema).optional(),
  speed: z.number().optional(),
  path: z.array(PointSchema).optional(),
  stagger: z.number().optional()
}).optional();

const MaskSchema = z.object({
  id: z.string(),
  type: z.enum(['clip', 'alpha']),
  elementId: z.string(),
  inverted: z.boolean().default(false)
}).optional();

// Esquemas para diferentes tipos de elementos
const BaseElementSchema = z.object({
  id: z.string(),
  name: z.string(),
  transform: TransformSchema,
  opacity: z.number().min(0).max(1),
  visible: z.boolean(),
  locked: z.boolean(),
  zIndex: z.number(),
  parentId: z.string().optional(),
  animation: ElementAnimationSchema,
  mask: MaskSchema
});

const TextElementSchema = BaseElementSchema.extend({
  type: z.literal('text'),
  content: z.string(),
  fontFamily: z.string(),
  fontSize: z.number().positive(),
  fontWeight: z.enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']),
  fontStyle: z.enum(['normal', 'italic']),
  textAlign: z.enum(['left', 'center', 'right']),
  color: z.string(),
  lineHeight: z.number().positive(),
  letterSpacing: z.number(),
  textShadow: TextShadowSchema
});

const ImageElementSchema = BaseElementSchema.extend({
  type: z.literal('image'),
  src: z.string(),
  alt: z.string(),
  fit: z.enum(['cover', 'contain', 'fill']),
  borderRadius: z.number().min(0),
  crop: CropSchema
});

const ShapeElementSchema = BaseElementSchema.extend({
  type: z.literal('shape'),
  shapeType: z.enum(['rectangle', 'circle', 'line']),
  fill: z.string(),
  stroke: z.string(),
  strokeWidth: z.number().min(0),
  cornerRadius: z.number().min(0).optional()
});

const ContainerElementSchema = BaseElementSchema.extend({
  type: z.literal('container'),
  backgroundColor: z.string(),
  borderColor: z.string(),
  borderWidth: z.number().min(0),
  borderRadius: z.number().min(0),
  padding: z.number().min(0),
  children: z.array(z.string())
});

const QRElementSchema = BaseElementSchema.extend({
  type: z.literal('qr'),
  data: z.string(),
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']),
  margin: z.number().min(0),
  foregroundColor: z.string(),
  backgroundColor: z.string()
});

const GroupElementSchema = BaseElementSchema.extend({
  type: z.literal('group'),
  children: z.array(z.string())
});

const CanvasElementSchema = z.union([
  TextElementSchema,
  ImageElementSchema,
  ShapeElementSchema,
  ContainerElementSchema,
  QRElementSchema,
  GroupElementSchema
]);

const ScreenSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  orientation: z.enum(['landscape', 'portrait']),
  offsetX: z.number(),
  offsetY: z.number()
});

const CompositionSchema = z.object({
  id: z.string(),
  name: z.string(),
  screens: z.array(ScreenSchema),
  background: BackgroundSchema,
  elements: z.record(z.string(), z.unknown()),
  elementOrder: z.array(z.string())
});

/**
 * Serializa una composición a JSON determinista
 */
export function serializeComposition(composition: Composition): string {
  try {
    // Validar la composición antes de serializar
    const validatedComposition = CompositionSchema.parse(composition);
    
    // Crear una versión ordenada para serialización determinista
    const orderedComposition = {
      id: validatedComposition.id,
      name: validatedComposition.name,
      screens: validatedComposition.screens.sort((a, b) => a.id.localeCompare(b.id)),
      background: validatedComposition.background,
      elements: Object.keys(validatedComposition.elements)
        .sort()
        .reduce((acc, key) => {
          acc[key] = validatedComposition.elements[key] as CanvasElement;
          return acc;
        }, {} as Record<string, CanvasElement>),
      elementOrder: validatedComposition.elementOrder
    };
    
    return JSON.stringify(orderedComposition, null, 2);
  } catch (error) {
    console.error('Error al serializar composición:', error);
    throw new Error('Error en la serialización: ' + (error as Error).message);
  }
}

/**
 * Deserializa una composición desde JSON
 */
export function deserializeComposition(json: string): Composition {
  try {
    const parsed = JSON.parse(json);
    const validatedComposition = CompositionSchema.parse(parsed);
    return validatedComposition as Composition;
  } catch (error) {
    console.error('Error al deserializar composición:', error);
    throw new Error('Error en la deserialización: ' + (error as Error).message);
  }
}

/**
 * Valida una composición sin serializar
 */
export function validateComposition(composition: any): { valid: boolean; errors?: string[] } {
  try {
    CompositionSchema.parse(composition);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      valid: false,
      errors: [(error as Error).message]
    };
  }
}

/**
 * Serializa un elemento individual
 */
export function serializeElement(element: CanvasElement): string {
  try {
    const validatedElement = CanvasElementSchema.parse(element);
    return JSON.stringify(validatedElement, null, 2);
  } catch (error) {
    console.error('Error al serializar elemento:', error);
    throw new Error('Error en la serialización del elemento: ' + (error as Error).message);
  }
}

/**
 * Deserializa un elemento individual
 */
export function deserializeElement(json: string): CanvasElement {
  try {
    const parsed = JSON.parse(json);
    const validatedElement = CanvasElementSchema.parse(parsed);
    return validatedElement;
  } catch (error) {
    console.error('Error al deserializar elemento:', error);
    throw new Error('Error en la deserialización del elemento: ' + (error as Error).message);
  }
}

/**
 * Crea una copia profunda de una composición
 */
export function cloneComposition(composition: Composition): Composition {
  const serialized = serializeComposition(composition);
  return deserializeComposition(serialized);
}

/**
 * Crea una copia profunda de un elemento
 */
export function cloneElement(element: CanvasElement): CanvasElement {
  const serialized = serializeElement(element);
  return deserializeElement(serialized);
}

/**
 * Migra una composición antigua a la versión actual
 */
export function migrateComposition(data: any): Composition {
  // Aquí se pueden añadir migraciones para versiones anteriores
  // Por ahora, simplemente validamos y retornamos
  const parsed = CompositionSchema.parse(data);
  return parsed as Composition;
}

/**
 * Exporta los esquemas para uso externo
 */
export {
  CompositionSchema,
  CanvasElementSchema,
  BackgroundSchema,
  ElementAnimationSchema
};