/**
 * Genera un ID único para elementos del editor
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verifica si un ID es válido
 */
export function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length > 0;
}