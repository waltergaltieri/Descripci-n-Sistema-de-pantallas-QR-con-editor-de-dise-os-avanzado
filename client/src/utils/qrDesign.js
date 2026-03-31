import QRCode from 'qrcode';

const DEFAULT_QR_CONFIG = {
  value: 'https://example.com',
  dark: '#0f172a',
  light: '#ffffff',
  margin: 2,
  errorCorrectionLevel: 'M'
};

export const getDefaultQrConfig = () => ({ ...DEFAULT_QR_CONFIG });

export const sanitizeQrConfig = (config = {}) => ({
  value: config.value || DEFAULT_QR_CONFIG.value,
  dark: config.dark || DEFAULT_QR_CONFIG.dark,
  light: config.light || DEFAULT_QR_CONFIG.light,
  margin: Number.isFinite(Number(config.margin)) ? Number(config.margin) : DEFAULT_QR_CONFIG.margin,
  errorCorrectionLevel: config.errorCorrectionLevel || DEFAULT_QR_CONFIG.errorCorrectionLevel
});

export const svgToDataUrl = (svg) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const generateQrSvg = async (config) => {
  const safeConfig = sanitizeQrConfig(config);

  return QRCode.toString(safeConfig.value, {
    type: 'svg',
    margin: safeConfig.margin,
    errorCorrectionLevel: safeConfig.errorCorrectionLevel,
    color: {
      dark: safeConfig.dark,
      light: safeConfig.light
    }
  });
};

export const generateQrElementPayload = async (config, placement = {}) => {
  const qrConfig = sanitizeQrConfig(config);
  const svgMarkup = await generateQrSvg(qrConfig);
  const size = placement.size || 220;

  return {
    element: {
      type: 'svg',
      src: svgToDataUrl(svgMarkup),
      x: placement.x || 0,
      y: placement.y || 0,
      width: size,
      height: size,
      keepRatio: true,
      custom: {
        isQrElement: true,
        qrConfig
      }
    },
    qrConfig,
    svgMarkup
  };
};

export const getQrConfigFromElement = (element) => {
  if (!element?.custom?.isQrElement) {
    return null;
  }

  return sanitizeQrConfig(element.custom.qrConfig || {});
};
