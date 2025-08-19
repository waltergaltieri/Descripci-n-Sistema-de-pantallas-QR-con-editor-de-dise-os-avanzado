interface QRCodeOptions {
  data: string;
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  foregroundColor: string;
  backgroundColor: string;
}

export class QRCodeGenerator {
  /**
   * Genera una imagen de código QR
   */
  static async generate(options: QRCodeOptions): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      try {
        // Crear canvas para dibujar el QR
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }

        // Configurar tamaño del canvas
        canvas.width = options.size;
        canvas.height = options.size;

        // Por simplicidad, crear un QR básico usando patrones
        // En una implementación real, usarías una librería como qrcode
        this.drawSimpleQR(ctx, options);

        // Convertir canvas a imagen
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Error al cargar la imagen QR'));
        img.src = canvas.toDataURL();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Dibuja un QR code simple (placeholder)
   * En una implementación real, usarías una librería como qrcode.js
   */
  private static drawSimpleQR(ctx: CanvasRenderingContext2D, options: QRCodeOptions) {
    const { size, margin, foregroundColor, backgroundColor } = options;
    
    // Limpiar canvas con color de fondo
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
    
    // Calcular área útil (sin márgenes)
    const qrSize = size - (margin * 2);
    const moduleSize = qrSize / 25; // 25x25 módulos para simplicidad
    
    ctx.fillStyle = foregroundColor;
    
    // Dibujar patrón de finder (esquinas)
    this.drawFinderPattern(ctx, margin, margin, moduleSize);
    this.drawFinderPattern(ctx, margin + qrSize - 7 * moduleSize, margin, moduleSize);
    this.drawFinderPattern(ctx, margin, margin + qrSize - 7 * moduleSize, moduleSize);
    
    // Dibujar algunos módulos de datos aleatorios para simular un QR
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 25; col++) {
        // Evitar las áreas de los finder patterns
        if (this.isInFinderPattern(row, col)) continue;
        
        // Crear un patrón pseudo-aleatorio basado en los datos
        const hash = this.simpleHash(options.data + row + col);
        if (hash % 2 === 0) {
          ctx.fillRect(
            margin + col * moduleSize,
            margin + row * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }
  }

  /**
   * Dibuja un patrón finder (cuadrado de las esquinas)
   */
  private static drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) {
    // Cuadrado exterior 7x7
    ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
    
    // Cuadrado interior blanco 5x5
    ctx.fillStyle = ctx.canvas.style.backgroundColor || '#ffffff';
    ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
    
    // Cuadrado central negro 3x3
    ctx.fillStyle = ctx.fillStyle === '#ffffff' ? '#000000' : ctx.fillStyle;
    ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
  }

  /**
   * Verifica si una posición está en un área de finder pattern
   */
  private static isInFinderPattern(row: number, col: number): boolean {
    // Finder patterns en las esquinas (7x7 cada uno)
    return (
      (row < 9 && col < 9) || // Top-left
      (row < 9 && col > 15) || // Top-right
      (row > 15 && col < 9)    // Bottom-left
    );
  }

  /**
   * Función hash simple para generar patrones pseudo-aleatorios
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Función helper para generar QR codes usando una librería externa
 * Descomenta y usa esto si instalas qrcode.js
 */
/*
import QRCode from 'qrcode';

export class QRCodeGenerator {
  static async generate(options: QRCodeOptions): Promise<HTMLImageElement> {
    try {
      const dataUrl = await QRCode.toDataURL(options.data, {
        width: options.size,
        margin: options.margin,
        color: {
          dark: options.foregroundColor,
          light: options.backgroundColor
        },
        errorCorrectionLevel: options.errorCorrectionLevel
      });
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
      });
    } catch (error) {
      throw new Error('Error generando código QR: ' + error.message);
    }
  }
}
*/