import type { ElementAnimation, AnimationType, CanvasElement, Transform } from '../types/editor';
import { calculateAnimationProgress, handleAnimationRepeat, applyEasing, easedLerpObject } from './easing';
import { lerp } from './math';

export interface AnimationState {
  elementId: string;
  animation: ElementAnimation;
  startTime: number;
  isPlaying: boolean;
  currentProgress: number;
}

export interface AnimationFrame {
  elementId: string;
  transform: Partial<Transform>;
  opacity?: number;
}

export class AnimationEngine {
  private animations = new Map<string, AnimationState>();
  private rafId: number | null = null;
  private isRunning = false;
  private startTime = 0;
  private onFrame?: (frames: AnimationFrame[]) => void;

  constructor(onFrame?: (frames: AnimationFrame[]) => void) {
    this.onFrame = onFrame;
  }

  /**
   * Añade una animación para un elemento
   */
  addAnimation(elementId: string, animation: ElementAnimation): void {
    this.animations.set(elementId, {
      elementId,
      animation,
      startTime: 0,
      isPlaying: false,
      currentProgress: 0
    });
  }

  /**
   * Elimina una animación
   */
  removeAnimation(elementId: string): void {
    this.animations.delete(elementId);
  }

  /**
   * Inicia la reproducción de todas las animaciones
   */
  play(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = performance.now();
    
    // Reiniciar todas las animaciones
    this.animations.forEach(state => {
      state.startTime = this.startTime;
      state.isPlaying = state.animation.autoplay;
      state.currentProgress = 0;
    });
    
    this.tick();
  }

  /**
   * Pausa la reproducción
   */
  pause(): void {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Detiene y reinicia todas las animaciones
   */
  stop(): void {
    this.pause();
    this.animations.forEach(state => {
      state.isPlaying = false;
      state.currentProgress = 0;
    });
  }

  /**
   * Reproduce una animación específica
   */
  playAnimation(elementId: string): void {
    const state = this.animations.get(elementId);
    if (state) {
      state.isPlaying = true;
      state.startTime = performance.now();
      state.currentProgress = 0;
      
      if (!this.isRunning) {
        this.isRunning = true;
        this.tick();
      }
    }
  }

  /**
   * Pausa una animación específica
   */
  pauseAnimation(elementId: string): void {
    const state = this.animations.get(elementId);
    if (state) {
      state.isPlaying = false;
    }
  }

  /**
   * Obtiene el estado actual de una animación
   */
  getAnimationState(elementId: string): AnimationState | undefined {
    return this.animations.get(elementId);
  }

  /**
   * Calcula el frame actual de animación para un elemento
   */
  private calculateAnimationFrame(
    element: CanvasElement,
    state: AnimationState,
    currentTime: number
  ): AnimationFrame | null {
    if (!state.isPlaying) return null;

    const { animation } = state;
    const progress = calculateAnimationProgress(
      state.startTime,
      currentTime,
      animation.duration,
      animation.delay
    );

    const { progress: finalProgress, isComplete } = handleAnimationRepeat(
      progress,
      animation.repeat,
      animation.direction
    );

    state.currentProgress = finalProgress;

    if (isComplete && animation.repeat !== 'infinite') {
      state.isPlaying = false;
    }

    return this.applyAnimationType(
      element,
      animation.type,
      finalProgress,
      animation.easing
    );
  }

  /**
   * Aplica un tipo específico de animación
   */
  private applyAnimationType(
    element: CanvasElement,
    type: AnimationType,
    progress: number,
    easing: string
  ): AnimationFrame {
    const baseTransform = element.transform;
    const frame: AnimationFrame = {
      elementId: element.id,
      transform: { ...baseTransform }
    };

    const easedProgress = applyEasing(progress, easing as any);

    switch (type) {
      case 'fadeIn':
        frame.opacity = lerp(0, element.opacity, easedProgress);
        break;

      case 'fadeOut':
        frame.opacity = lerp(element.opacity, 0, easedProgress);
        break;

      case 'slideInLeft':
        const slideDistance = 100;
        frame.transform.x = lerp(baseTransform.x - slideDistance, baseTransform.x, easedProgress);
        break;

      case 'slideOutLeft':
        const slideOutDistance = 100;
        frame.transform.x = lerp(baseTransform.x, baseTransform.x - slideOutDistance, easedProgress);
        break;

      case 'scaleIn':
        const scaleInFrom = 0;
        frame.transform.scaleX = lerp(scaleInFrom, baseTransform.scaleX, easedProgress);
        frame.transform.scaleY = lerp(scaleInFrom, baseTransform.scaleY, easedProgress);
        break;

      case 'scaleOut':
        const scaleOutTo = 0;
        frame.transform.scaleX = lerp(baseTransform.scaleX, scaleOutTo, easedProgress);
        frame.transform.scaleY = lerp(baseTransform.scaleY, scaleOutTo, easedProgress);
        break;

      case 'rotate':
        const rotationAmount = 360;
        frame.transform.rotation = baseTransform.rotation + (rotationAmount * easedProgress);
        break;

      case 'pulse':
        const pulseScale = 1 + 0.1 * Math.sin(easedProgress * Math.PI * 2);
        frame.transform.scaleX = baseTransform.scaleX * pulseScale;
        frame.transform.scaleY = baseTransform.scaleY * pulseScale;
        break;

      case 'bounce':
        const bounceHeight = 20;
        const bounceProgress = Math.sin(easedProgress * Math.PI);
        frame.transform.y = baseTransform.y - (bounceHeight * bounceProgress);
        break;

      case 'marquee':
        if (element.type === 'text') {
          const speed = 50; // px/s
          const containerWidth = 200;
          const textWidth = baseTransform.width;
          const totalDistance = containerWidth + textWidth;
          const pixelsPerSecond = speed;
          const duration = (totalDistance / pixelsPerSecond) * 1000; // ms
          
          const marqueeProgress = (progress * duration / 1000 * pixelsPerSecond) % totalDistance;
          frame.transform.x = baseTransform.x - marqueeProgress;
        }
        break;

      case 'motionPath':
        // Para motionPath se necesitaría configuración adicional
        break;

      default:
        // Para tipos de animación no implementados
        break;
    }

    return frame;
  }

  /**
   * Interpola entre keyframes
   */
  private interpolateKeyframes(keyframes: any[], progress: number): any {
    if (keyframes.length === 0) return {};
    if (keyframes.length === 1) return keyframes[0].props;
    
    // Encontrar los keyframes antes y después del progreso actual
    let beforeFrame = keyframes[0];
    let afterFrame = keyframes[keyframes.length - 1];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (progress >= keyframes[i].t && progress <= keyframes[i + 1].t) {
        beforeFrame = keyframes[i];
        afterFrame = keyframes[i + 1];
        break;
      }
    }
    
    // Calcular el progreso local entre los dos keyframes
    const localProgress = (progress - beforeFrame.t) / (afterFrame.t - beforeFrame.t);
    
    // Interpolar las propiedades
    const result: any = {};
    const beforeProps = beforeFrame.props || {};
    const afterProps = afterFrame.props || {};
    
    for (const key in afterProps) {
      if (typeof beforeProps[key] === 'number' && typeof afterProps[key] === 'number') {
        result[key] = lerp(beforeProps[key], afterProps[key], localProgress);
      } else {
        result[key] = localProgress < 0.5 ? beforeProps[key] : afterProps[key];
      }
    }
    
    return result;
  }

  /**
   * Tick del motor de animación
   */
  private tick = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const frames: AnimationFrame[] = [];

    // Procesar todas las animaciones activas
    this.animations.forEach((state, elementId) => {
      // Aquí necesitaríamos acceso al elemento actual
      // Por simplicidad, asumimos que se pasa desde fuera
      const element = this.getElementById?.(elementId);
      if (element) {
        const frame = this.calculateAnimationFrame(element, state, currentTime);
        if (frame) {
          frames.push(frame);
        }
      }
    });

    // Enviar frames al callback
    if (this.onFrame && frames.length > 0) {
      this.onFrame(frames);
    }

    // Verificar si hay animaciones activas
    const hasActiveAnimations = Array.from(this.animations.values()).some(state => state.isPlaying);
    
    if (hasActiveAnimations) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.isRunning = false;
    }
  };

  /**
   * Función para obtener elemento por ID (debe ser inyectada)
   */
  private getElementById?: (id: string) => CanvasElement | undefined;

  /**
   * Establece la función para obtener elementos
   */
  setElementGetter(getter: (id: string) => CanvasElement | undefined): void {
    this.getElementById = getter;
  }

  /**
   * Limpia todas las animaciones
   */
  clear(): void {
    this.stop();
    this.animations.clear();
  }

  /**
   * Obtiene todas las animaciones activas
   */
  getActiveAnimations(): AnimationState[] {
    return Array.from(this.animations.values()).filter(state => state.isPlaying);
  }
}

// Instancia global del motor de animación
export const animationEngine = new AnimationEngine();