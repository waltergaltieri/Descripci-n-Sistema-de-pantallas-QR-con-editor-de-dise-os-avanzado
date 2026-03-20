import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import { getFileUrl, uploadsService } from '../../../services/api';
import ColorInputField from '../shared/ColorInputField';

const downloadBlob = (content, fileName, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const downloadDataUrl = (dataUrl, fileName) => {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
};

const svgToDataUrl = (markup) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const applyGradientToSvg = (markup, config) => {
  if (!config.use_gradient) {
    return markup;
  }

  const gradientId = 'qr-gradient-fill';
  const darkColor = config.foreground || '#111827';
  const gradientStart = config.gradient_start || darkColor;
  const gradientEnd = config.gradient_end || '#2563eb';

  return markup
    .replace(
      /<svg([^>]*)>/,
      `<svg$1><defs><linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${gradientStart}" /><stop offset="100%" stop-color="${gradientEnd}" /></linearGradient></defs>`
    )
    .replace(new RegExp(`fill="${escapeRegExp(darkColor)}"`, 'gi'), `fill="url(#${gradientId})"`);
};

const embedLogoIntoSvg = (markup, logoDataUrl) => {
  if (!logoDataUrl) {
    return markup;
  }

  const logoSize = 64;
  const padding = 14;
  const boxSize = logoSize + padding * 2;
  const logoPosition = (280 - logoSize) / 2;
  const boxPosition = (280 - boxSize) / 2;

  return markup.replace(
    '</svg>',
    `<rect x="${boxPosition}" y="${boxPosition}" width="${boxSize}" height="${boxSize}" rx="20" fill="#ffffff" /><image href="${logoDataUrl}" x="${logoPosition}" y="${logoPosition}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" /></svg>`
  );
};

const readBlobAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const resolveLogoDataUrl = async (logoUrl) => {
  if (!logoUrl) {
    return '';
  }

  const response = await fetch(logoUrl);
  if (!response.ok) {
    throw new Error('No se pudo descargar el logo del QR.');
  }

  const blob = await response.blob();
  return readBlobAsDataUrl(blob);
};

const rasterizeSvgToDataUrl = (markup, background = '#ffffff', mimeType = 'image/png') =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const width = image.naturalWidth || 280;
      const height = image.naturalHeight || 280;
      const context = canvas.getContext('2d');

      canvas.width = width;
      canvas.height = height;
      context.fillStyle = background || '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      resolve(canvas.toDataURL(mimeType, 0.92));
    };

    image.onerror = reject;
    image.src = svgToDataUrl(markup);
  });

const QrCustomizer = ({ baseUrl, config, onChange, stableSlugPreview }) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [svgMarkup, setSvgMarkup] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const foreground = config.foreground || '#111827';
  const background = config.background || '#ffffff';
  const useGradient = Boolean(config.use_gradient);
  const gradientStart = config.gradient_start || '';
  const gradientEnd = config.gradient_end || '';
  const resolvedLogoUrl = useMemo(
    () => (config.logo_url ? getFileUrl(config.logo_url) : ''),
    [config.logo_url]
  );

  const qrValue = useMemo(
    () => `${baseUrl.replace(/\/$/, '')}/menu/${stableSlugPreview || 'link-estable'}`,
    [baseUrl, stableSlugPreview]
  );

  useEffect(() => {
    let cancelled = false;

    const buildPreview = async () => {
      try {
        const baseSvgMarkup = await QRCode.toString(qrValue, {
          type: 'svg',
          margin: 1,
          width: 280,
          color: {
            dark: foreground,
            light: background
          }
        });

        let finalSvgMarkup = applyGradientToSvg(baseSvgMarkup, {
          foreground,
          use_gradient: useGradient,
          gradient_start: gradientStart,
          gradient_end: gradientEnd
        });

        if (resolvedLogoUrl) {
          try {
            const logoDataUrl = await resolveLogoDataUrl(resolvedLogoUrl);
            finalSvgMarkup = embedLogoIntoSvg(finalSvgMarkup, logoDataUrl);
          } catch (error) {
            finalSvgMarkup = embedLogoIntoSvg(finalSvgMarkup, '');
          }
        }

        if (cancelled) {
          return;
        }

        setPreviewUrl(svgToDataUrl(finalSvgMarkup));
        setSvgMarkup(finalSvgMarkup);
      } catch (error) {
        if (!cancelled) {
          setPreviewUrl('');
          setSvgMarkup('');
        }
      }
    };

    buildPreview();

    return () => {
      cancelled = true;
    };
  }, [background, foreground, gradientEnd, gradientStart, qrValue, resolvedLogoUrl, useGradient]);

  const handleDownloadRaster = async (mimeType, extension) => {
    if (!svgMarkup) {
      return;
    }

    try {
      const dataUrl = await rasterizeSvgToDataUrl(svgMarkup, background, mimeType);
      downloadDataUrl(dataUrl, `${stableSlugPreview || 'qr'}.${extension}`);
    } catch (error) {
      // Keep preview available even if export fails client-side.
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingLogo(true);

    try {
      const response = await uploadsService.uploadImage(file);

      onChange({
        ...config,
        logo_url: response.data?.url || ''
      });
    } catch (error) {
      onChange({
        ...config
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <h4 className="text-base font-semibold text-gray-900">Configuracion del QR</h4>
      <p className="mt-1 text-sm text-gray-500">
        Personaliza el QR sin cambiar nunca la URL estable que vas a imprimir.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr,220px]">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ColorInputField
              id="qr-foreground"
              label="Color principal"
              textAriaLabel="Color principal"
              pickerAriaLabel="Selector visual color principal"
              value={config.foreground || '#111827'}
              onChange={(value) =>
                onChange({
                  ...config,
                  foreground: value
                })
              }
              fallback="#111827"
            />

            <ColorInputField
              id="qr-background"
              label="Color de fondo"
              textAriaLabel="Color de fondo"
              pickerAriaLabel="Selector visual color de fondo"
              value={config.background || '#ffffff'}
              onChange={(value) =>
                onChange({
                  ...config,
                  background: value
                })
              }
              fallback="#ffffff"
            />
          </div>

          <label htmlFor="qr-use-gradient" className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
            <input
              id="qr-use-gradient"
              type="checkbox"
              checked={Boolean(config.use_gradient)}
              onChange={(event) =>
                onChange({
                  ...config,
                  use_gradient: event.target.checked
                })
              }
            />
            <span className="text-sm text-gray-700">Usar gradiente</span>
          </label>

          {config.use_gradient ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <ColorInputField
                id="qr-gradient-start"
                label="Color inicial"
                textAriaLabel="Color inicial"
                pickerAriaLabel="Selector visual color inicial"
                value={config.gradient_start || ''}
                onChange={(value) =>
                  onChange({
                    ...config,
                    gradient_start: value
                  })
                }
                fallback={config.foreground || '#111827'}
              />

              <ColorInputField
                id="qr-gradient-end"
                label="Color final"
                textAriaLabel="Color final"
                pickerAriaLabel="Selector visual color final"
                value={config.gradient_end || ''}
                onChange={(value) =>
                  onChange({
                    ...config,
                    gradient_end: value
                  })
                }
                fallback="#2563eb"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="qr-logo-file" className="label">
              Logo QR
            </label>
            <input
              id="qr-logo-file"
              type="file"
              accept="image/*"
              className="input"
              onChange={handleLogoUpload}
            />
            <p className="mt-2 text-sm text-gray-500">
              {uploadingLogo
                ? 'Subiendo logo...'
                : config.logo_url
                  ? 'Logo cargado. Se centra dentro del QR.'
                  : 'Opcional. Si subes un logo, se inserta en el centro del QR.'}
            </p>
          </div>

          <div>
            <label className="label">URL estable</label>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {qrValue}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => handleDownloadRaster('image/png', 'png')}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar PNG
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => handleDownloadRaster('image/jpeg', 'jpg')}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar JPG
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                svgMarkup && downloadBlob(svgMarkup, `${stableSlugPreview || 'qr'}.svg`, 'image/svg+xml')
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar SVG
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-4">
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="QR preview" className="w-full rounded-xl bg-white p-3" />
              {resolvedLogoUrl ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <img
                    src={resolvedLogoUrl}
                    alt="Logo QR"
                    className="h-12 w-12 rounded-xl border-4 border-white bg-white object-cover shadow-md"
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Preparando preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrCustomizer;
