declare module 'react-konva-to-svg' {
  export function exportStageSVG(
    stage: any,
    includeBackground?: boolean,
    options?: {
      onBefore?: () => void;
      onAfter?: () => void;
    }
  ): Promise<string>;
}