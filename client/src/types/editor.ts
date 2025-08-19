// Types for the new Canvas Editor

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface ElementBase {
  id: string;
  type: ElementType;
  name: string;
  transform: Transform;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  parentId?: string;
  animation?: ElementAnimation;
}

export type ElementType = 'text' | 'image' | 'shape' | 'container' | 'qr' | 'group';

export interface TextElement extends ElementBase {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  textShadow?: TextShadow;
}

export interface ImageElement extends ElementBase {
  type: 'image';
  src: string;
  alt: string;
  fit: 'cover' | 'contain' | 'fill';
  borderRadius: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ShapeElement extends ElementBase {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'line';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius?: number;
}

export interface ContainerElement extends ElementBase {
  type: 'container';
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  children: string[];
}

export interface QRElement extends ElementBase {
  type: 'qr';
  data: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  foregroundColor: string;
  backgroundColor: string;
}

export interface GroupElement extends ElementBase {
  type: 'group';
  children: string[];
}

export type CanvasElement = TextElement | ImageElement | ShapeElement | ContainerElement | QRElement | GroupElement;

export interface TextShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

// Background types
export interface SolidBackground {
  type: 'solid';
  color: string;
}

export interface GradientStop {
  color: string;
  offset: number;
}

export interface LinearGradientBackground {
  type: 'linear-gradient';
  angle: number;
  stops: GradientStop[];
}

export interface RadialGradientBackground {
  type: 'radial-gradient';
  centerX: number;
  centerY: number;
  radius: number;
  stops: GradientStop[];
}

export interface ImageBackground {
  type: 'image';
  src: string;
  fit: 'cover' | 'contain' | 'fill';
  position: Point;
  opacity: number;
  blur?: number;
}

export type Background = SolidBackground | LinearGradientBackground | RadialGradientBackground | ImageBackground;

// Animation types
export type AnimationType = 
  | 'fadeIn' | 'fadeOut'
  | 'slideInTop' | 'slideInRight' | 'slideInBottom' | 'slideInLeft'
  | 'slideOutTop' | 'slideOutRight' | 'slideOutBottom' | 'slideOutLeft'
  | 'scaleIn' | 'scaleOut'
  | 'rotate' | 'pulse' | 'bounce'
  | 'marquee' | 'motionPath';

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'back' | 'bounce' | 'elastic';

export interface Keyframe {
  t: number; // 0-1
  props: {
    x?: number;
    y?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    opacity?: number;
  };
}

export interface ElementAnimation {
  type: AnimationType;
  duration: number;
  delay: number;
  easing: EasingType;
  repeat: number | 'infinite';
  direction: 'normal' | 'reverse' | 'alternate';
  autoplay: boolean;
  playOnLoopStart: boolean;
  keyframes?: Keyframe[];
  // Marquee specific
  speed?: number; // px/s
  // Motion path specific
  path?: Point[];
  // Group stagger
  stagger?: number; // ms delay per child
}

// Screen and composition types
export interface Screen {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  offsetX: number;
  offsetY: number;
}

export interface Composition {
  id: string;
  name: string;
  screens: Screen[];
  background: Background;
  elements: Record<string, CanvasElement>;
  elementOrder: string[]; // z-index order
}

// Editor state types
export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  showLeftPanel: boolean;
  showRightPanel: boolean;
}

export interface SelectionState {
  selectedIds: string[];
  hoveredId?: string;
  isDragging: boolean;
  isResizing: boolean;
  isRotating: boolean;
}

export interface HistoryState {
  past: Composition[];
  present: Composition;
  future: Composition[];
}

export interface EditorState {
  composition: Composition;
  viewport: ViewportState;
  selection: SelectionState;
  history: HistoryState;
  isPlaying: boolean;
  previewMode: boolean;
}

// Command pattern types
export interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

// Mask types
export interface Mask {
  id: string;
  elementId: string;
  maskElementId: string;
  inverted: boolean;
}