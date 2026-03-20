import type { EasingType } from '../types/editor';

/**
 * Funciones de easing para animaciones
 */
export const easingFunctions: Record<EasingType, (t: number) => number> = {
  linear: (t: number) => t,
  
  easeIn: (t: number) => t * t,
  
  easeOut: (t: number) => 1 - Math.pow(1 - t, 2),
  
  easeInOut: (t: number) => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },
  
  back: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  
  bounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    
    return t === 0
      ? 0
      : t === 1
      ? 1
      : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  }
};

/**
 * Aplica una función de easing a un valor t (0-1)
 */
export function applyEasing(t: number, easing: EasingType): number {
  // Asegurar que t esté en el rango [0, 1]
  t = Math.max(0, Math.min(1, t));
  
  const easingFn = easingFunctions[easing];
  if (!easingFn) {
    console.warn(`Función de easing '${easing}' no encontrada, usando 'linear'`);
    return t;
  }
  
  return easingFn(t);
}

/**
 * Interpola entre dos valores usando easing
 */
export function easedLerp(start: number, end: number, t: number, easing: EasingType): number {
  const easedT = applyEasing(t, easing);
  return start + (end - start) * easedT;
}

/**
 * Interpola entre dos objetos de propiedades usando easing
 */
export function easedLerpObject<T extends Record<string, number>>(
  start: T,
  end: T,
  t: number,
  easing: EasingType
): T {
  const result = { ...start };
  const easedT = applyEasing(t, easing);
  
  for (const key in end) {
    if (typeof start[key] === 'number' && typeof end[key] === 'number') {
      (result as any)[key] = start[key] + (end[key] - start[key]) * easedT;
    }
  }
  
  return result;
}

/**
 * Calcula el progreso de una animación basado en el tiempo
 */
export function calculateAnimationProgress(
  startTime: number,
  currentTime: number,
  duration: number,
  delay: number = 0
): number {
  const elapsed = currentTime - startTime - delay;
  
  if (elapsed < 0) return 0; // Aún en delay
  if (elapsed >= duration) return 1; // Animación completada
  
  return elapsed / duration;
}

/**
 * Maneja la repetición de animaciones
 */
export function handleAnimationRepeat(
  progress: number,
  repeat: number | 'infinite',
  direction: 'normal' | 'reverse' | 'alternate'
): { progress: number; isComplete: boolean } {
  if (repeat === 'infinite') {
    // Para repetición infinita, usar módulo para ciclar
    const cycleProgress = progress % 1;
    const cycle = Math.floor(progress);
    
    let finalProgress = cycleProgress;
    
    if (direction === 'reverse') {
      finalProgress = 1 - cycleProgress;
    } else if (direction === 'alternate') {
      finalProgress = cycle % 2 === 0 ? cycleProgress : 1 - cycleProgress;
    }
    
    return { progress: finalProgress, isComplete: false };
  }
  
  // Para repetición finita
  const totalDuration = repeat;
  if (progress >= totalDuration) {
    return { progress: direction === 'reverse' ? 0 : 1, isComplete: true };
  }
  
  const cycleProgress = progress % 1;
  const cycle = Math.floor(progress);
  
  let finalProgress = cycleProgress;
  
  if (direction === 'reverse') {
    finalProgress = 1 - cycleProgress;
  } else if (direction === 'alternate') {
    finalProgress = cycle % 2 === 0 ? cycleProgress : 1 - cycleProgress;
  }
  
  return { progress: finalProgress, isComplete: false };
}