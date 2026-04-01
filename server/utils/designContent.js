const { v4: uuidv4 } = require('uuid');

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;
const DEFAULT_BACKGROUND = '#ffffff';

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const cloneValue = (value) => {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
};

const parseJsonContent = (content) => {
  if (!content) {
    return null;
  }

  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  return cloneValue(content);
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const toPixelNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace('px', '').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const makeId = (prefix) => `${prefix}-${uuidv4().replace(/-/g, '').slice(0, 12)}`;

const normalizeChildrenIds = (children = []) => children.map((child) => {
  const normalizedChild = {
    ...child,
    id: child.id || makeId(child.type || 'element')
  };

  if (Array.isArray(child.children)) {
    normalizedChild.children = normalizeChildrenIds(child.children);
  }

  return normalizedChild;
});

const createDefaultPage = ({ width, height, backgroundColor }) => ({
  id: makeId('page'),
  width,
  height,
  background: backgroundColor || DEFAULT_BACKGROUND,
  children: []
});

const buildTextElementFromLegacy = (element, defaults) => ({
  id: element.id || makeId('text'),
  type: 'text',
  x: toPixelNumber(element.x, defaults.x),
  y: toPixelNumber(element.y, defaults.y),
  width: toPixelNumber(element.width, defaults.width),
  height: toPixelNumber(element.height, defaults.height),
  text: element.text || element.content || 'Texto',
  fontSize: toPixelNumber(element.fontSize, 42),
  fontWeight: element.fontWeight || 'normal',
  fontStyle: element.fontStyle || 'normal',
  fill: element.color || element.fill || '#111827',
  align: element.textAlign || element.align || 'left',
  verticalAlign: 'middle'
});

const buildImageElementFromLegacy = (element, defaults) => ({
  id: element.id || makeId('image'),
  type: element.type === 'svg' ? 'svg' : 'image',
  x: toPixelNumber(element.x, defaults.x),
  y: toPixelNumber(element.y, defaults.y),
  width: toPixelNumber(element.width, defaults.width),
  height: toPixelNumber(element.height, defaults.height),
  src: element.src || element.url || ''
});

const buildRectangleElementFromLegacy = (element, defaults) => ({
  id: element.id || makeId('shape'),
  type: 'figure',
  subType: element.subType || (element.type === 'circle' ? 'circle' : 'rect'),
  x: toPixelNumber(element.x, defaults.x),
  y: toPixelNumber(element.y, defaults.y),
  width: toPixelNumber(element.width, defaults.width),
  height: toPixelNumber(element.height, defaults.height),
  fill: element.fill || element.backgroundColor || '#e5e7eb',
  stroke: element.stroke || element.borderColor || '#94a3b8',
  strokeWidth: toPixelNumber(element.strokeWidth || element.borderWidth, 0),
  cornerRadius: toPixelNumber(element.cornerRadius || element.borderRadius, 0)
});

const convertLegacyElementsToChildren = (elements = [], layout) => {
  return elements.flatMap((element, index) => {
    const column = Math.max(1, Number(element.column || 1));
    const columnWidth = layout.columns > 1 ? layout.sectionWidth / layout.columns : layout.sectionWidth;
    const elementDefaults = {
      x: layout.sectionLeft + (column - 1) * columnWidth + layout.padding,
      y: layout.sectionTop + layout.padding + index * 110,
      width: Math.max(columnWidth - layout.padding * 2, 180),
      height: 90
    };

    if (element.type === 'text') {
      return [buildTextElementFromLegacy(element, elementDefaults)];
    }

    if (element.type === 'image' || element.type === 'svg') {
      return [buildImageElementFromLegacy(element, elementDefaults)];
    }

    if (element.type === 'container' || element.type === 'section') {
      const groupChildren = convertLegacyElementsToChildren(element.children || element.elements || [], {
        ...layout,
        sectionLeft: toPixelNumber(element.x, elementDefaults.x),
        sectionTop: toPixelNumber(element.y, elementDefaults.y),
        sectionWidth: toPixelNumber(element.width, elementDefaults.width),
        sectionHeight: toPixelNumber(element.height, elementDefaults.height),
        columns: Number(element.columns || 1)
      });

      return [
        {
          id: element.id || makeId('group'),
          type: 'group',
          x: 0,
          y: 0,
          children: groupChildren
        }
      ];
    }

    if (['rectangle', 'circle', 'figure'].includes(element.type)) {
      return [buildRectangleElementFromLegacy(element, elementDefaults)];
    }

    return [];
  });
};

const convertLegacyContentToPages = (rawContent, width, height, backgroundColor) => {
  if (Array.isArray(rawContent?.pages) && rawContent.pages.length > 0) {
    return rawContent.pages;
  }

  if (Array.isArray(rawContent?.elements)) {
    return [
      {
        ...createDefaultPage({ width, height, backgroundColor }),
        children: normalizeChildrenIds(
          convertLegacyElementsToChildren(rawContent.elements, {
            sectionLeft: 0,
            sectionTop: 0,
            sectionWidth: width,
            sectionHeight: height,
            padding: 32,
            columns: 1
          })
        )
      }
    ];
  }

  if (Array.isArray(rawContent?.sections)) {
    const totalSections = rawContent.sections.length || 1;
    const sectionHeight = height / totalSections;
    const children = rawContent.sections.flatMap((section, index) => {
      const top = index * sectionHeight;
      const padding = toPixelNumber(section.padding, 40);
      const sectionChildren = convertLegacyElementsToChildren(section.elements || [], {
        sectionLeft: 0,
        sectionTop: top,
        sectionWidth: width,
        sectionHeight,
        padding,
        columns: Number(section.columns || 1)
      });

      return [
        buildRectangleElementFromLegacy(
          {
            id: makeId('section'),
            type: 'rectangle',
            x: 0,
            y: top,
            width,
            height: sectionHeight,
            backgroundColor: section.backgroundColor || backgroundColor
          },
          {
            x: 0,
            y: top,
            width,
            height: sectionHeight
          }
        ),
        ...sectionChildren
      ];
    });

    return [
      {
        ...createDefaultPage({ width, height, backgroundColor }),
        children: normalizeChildrenIds(children)
      }
    ];
  }

  return [createDefaultPage({ width, height, backgroundColor })];
};

const collectQrElements = (pages = [], existing = {}) => {
  const qrElements = {};

  const walk = (children = []) => {
    children.forEach((element) => {
      if (element?.custom?.isQrElement) {
        qrElements[element.id] = element.custom.qrConfig || existing[element.id];
      }

      if (Array.isArray(element?.children)) {
        walk(element.children);
      }
    });
  };

  pages.forEach((page) => walk(page.children || []));

  return Object.fromEntries(
    Object.entries(qrElements).filter(([, config]) => isPlainObject(config))
  );
};

const decodeSvgDataUrl = (value) => {
  if (typeof value !== 'string' || !value.startsWith('data:image/svg+xml')) {
    return null;
  }

  const [prefix, payload = ''] = value.split(',', 2);
  const isBase64 = /;base64/i.test(prefix);

  try {
    const markup = isBase64
      ? Buffer.from(payload, 'base64').toString('utf8')
      : decodeURIComponent(payload);

    return {
      isBase64,
      markup
    };
  } catch (error) {
    return null;
  }
};

const encodeSvgDataUrl = (markup, isBase64) =>
  isBase64
    ? `data:image/svg+xml;base64,${Buffer.from(markup, 'utf8').toString('base64')}`
    : `data:image/svg+xml,${encodeURIComponent(markup)}`;

const getSvgDimensions = (svgMarkup) => {
  const viewBoxMatch = svgMarkup.match(/viewBox="[^"]*?(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)"/i);
  if (viewBoxMatch) {
    return {
      width: Number.parseFloat(viewBoxMatch[3]),
      height: Number.parseFloat(viewBoxMatch[4])
    };
  }

  const widthMatch = svgMarkup.match(/\bwidth="(-?\d+(?:\.\d+)?)"/i);
  const heightMatch = svgMarkup.match(/\bheight="(-?\d+(?:\.\d+)?)"/i);

  if (widthMatch && heightMatch) {
    return {
      width: Number.parseFloat(widthMatch[1]),
      height: Number.parseFloat(heightMatch[1])
    };
  }

  return null;
};

const applyFlipToMaskMarkup = (svgMarkup, flipX, flipY) => {
  if ((!flipX && !flipY) || typeof svgMarkup !== 'string') {
    return svgMarkup;
  }

  const dimensions = getSvgDimensions(svgMarkup);
  const openTagMatch = svgMarkup.match(/<svg\b[^>]*>/i);
  const closingTagIndex = svgMarkup.lastIndexOf('</svg>');

  if (!dimensions || !openTagMatch || closingTagIndex === -1 || openTagMatch.index === undefined) {
    return svgMarkup;
  }

  const openTag = openTagMatch[0];
  const innerMarkup = svgMarkup.slice(openTagMatch.index + openTag.length, closingTagIndex);
  const defsBlocks = innerMarkup.match(/<defs[\s\S]*?<\/defs>/gi) || [];
  const drawableMarkup = innerMarkup.replace(/<defs[\s\S]*?<\/defs>/gi, '').trim();

  if (!drawableMarkup) {
    return svgMarkup;
  }

  const translateX = flipX ? dimensions.width : 0;
  const translateY = flipY ? dimensions.height : 0;
  const scaleX = flipX ? -1 : 1;
  const scaleY = flipY ? -1 : 1;

  return `${svgMarkup.slice(0, openTagMatch.index)}${openTag}${defsBlocks.join('')}<g transform="translate(${translateX} ${translateY}) scale(${scaleX} ${scaleY})">${drawableMarkup}</g></svg>`;
};

const normalizeMaskedImageFlips = (children = []) => children.map((child) => {
  const normalizedChild = {
    ...child
  };

  if (Array.isArray(child.children)) {
    normalizedChild.children = normalizeMaskedImageFlips(child.children);
  }

  if (
    normalizedChild.type === 'image' &&
    typeof normalizedChild.clipSrc === 'string' &&
    normalizedChild.clipSrc.trim() !== '' &&
    (normalizedChild.flipX || normalizedChild.flipY)
  ) {
    const decodedSvg = decodeSvgDataUrl(normalizedChild.clipSrc);

    if (decodedSvg) {
      normalizedChild.clipSrc = encodeSvgDataUrl(
        applyFlipToMaskMarkup(decodedSvg.markup, Boolean(normalizedChild.flipX), Boolean(normalizedChild.flipY)),
        decodedSvg.isBase64
      );
      normalizedChild.flipX = false;
      normalizedChild.flipY = false;
    }
  }

  return normalizedChild;
});

const normalizeDesignContent = (input, options = {}) => {
  const rawContent = parseJsonContent(input) || {};
  const editorJson = isPlainObject(rawContent.json) ? rawContent.json : rawContent;
  const seedSettings = {
    ...(isPlainObject(rawContent.settings) ? rawContent.settings : {}),
    ...(isPlainObject(editorJson.settings) ? editorJson.settings : {})
  };

  const firstPage = Array.isArray(editorJson.pages) && editorJson.pages.length > 0 ? editorJson.pages[0] : null;
  const resolvedWidth =
    toPositiveNumber(seedSettings.canvasWidth) ||
    toPositiveNumber(editorJson.width) ||
    toPositiveNumber(firstPage?.width) ||
    toPositiveNumber(options.defaultWidth) ||
    DEFAULT_WIDTH;
  const resolvedHeight =
    toPositiveNumber(seedSettings.canvasHeight) ||
    toPositiveNumber(editorJson.height) ||
    toPositiveNumber(firstPage?.height) ||
    toPositiveNumber(options.defaultHeight) ||
    DEFAULT_HEIGHT;

  const backgroundColor =
    seedSettings.backgroundColor ||
    firstPage?.background ||
    firstPage?.fill ||
    options.backgroundColor ||
    DEFAULT_BACKGROUND;

  const pages = convertLegacyContentToPages(editorJson, resolvedWidth, resolvedHeight, backgroundColor).map((page) => ({
    ...page,
    id: page.id || makeId('page'),
    width: toPositiveNumber(page.width) || resolvedWidth,
    height: toPositiveNumber(page.height) || resolvedHeight,
    background: page.background || backgroundColor,
    children: normalizeChildrenIds(normalizeMaskedImageFlips(page.children || []))
  }));

  const settings = {
    backgroundColor,
    canvasWidth: resolvedWidth,
    canvasHeight: resolvedHeight,
    screenSizeName: seedSettings.screenSizeName || options.screenSizeName || 'Personalizado',
    orientation:
      seedSettings.orientation ||
      options.orientation ||
      (resolvedHeight > resolvedWidth ? 'portrait' : 'landscape'),
    qrElements: collectQrElements(pages, seedSettings.qrElements || {}),
    ...seedSettings
  };

  return {
    width: resolvedWidth,
    height: resolvedHeight,
    fonts: Array.isArray(editorJson.fonts) ? editorJson.fonts : [],
    audios: Array.isArray(editorJson.audios) ? editorJson.audios : [],
    unit: editorJson.unit || 'px',
    dpi: editorJson.dpi || 72,
    custom: editorJson.custom || {},
    schemaVersion: editorJson.schemaVersion || 2,
    pages,
    settings
  };
};

const decorateAssignedScreens = (rows = []) =>
  rows.map((row) => ({
    id: row.id ?? row.screen_id,
    name: row.name ?? row.screen_name
  }));

const decorateDesignRecord = (design, assignedScreens = []) => {
  const normalizedDesign = {
    ...design,
    content: normalizeDesignContent(design.content),
    assigned_screens: decorateAssignedScreens(assignedScreens)
  };

  normalizedDesign.assigned_screens_count = normalizedDesign.assigned_screens.length;

  return normalizedDesign;
};

const buildTemplateContent = ({ title, subtitle, accent = '#0f766e' }) =>
  normalizeDesignContent({
    width: 1920,
    height: 1080,
    pages: [
      {
        id: makeId('page'),
        width: 1920,
        height: 1080,
        background: '#f8fafc',
        children: [
          {
            id: makeId('shape'),
            type: 'figure',
            subType: 'rect',
            x: 72,
            y: 72,
            width: 1776,
            height: 936,
            fill: '#ffffff',
            stroke: '#dbe4ea',
            strokeWidth: 2,
            cornerRadius: 36
          },
          {
            id: makeId('shape'),
            type: 'figure',
            subType: 'rect',
            x: 72,
            y: 72,
            width: 1776,
            height: 18,
            fill: accent,
            strokeWidth: 0
          },
          {
            id: makeId('text'),
            type: 'text',
            x: 140,
            y: 176,
            width: 1180,
            height: 180,
            text: title,
            fontSize: 98,
            fontWeight: 700,
            fill: '#0f172a'
          },
          {
            id: makeId('text'),
            type: 'text',
            x: 144,
            y: 380,
            width: 980,
            height: 140,
            text: subtitle,
            fontSize: 40,
            fill: '#475569',
            lineHeight: 1.25
          },
          {
            id: makeId('shape'),
            type: 'figure',
            subType: 'rect',
            x: 1320,
            y: 192,
            width: 388,
            height: 388,
            fill: '#ecfeff',
            stroke: accent,
            strokeWidth: 4,
            cornerRadius: 32
          }
        ]
      }
    ],
    settings: {
      backgroundColor: '#f8fafc',
      canvasWidth: 1920,
      canvasHeight: 1080,
      orientation: 'landscape',
      screenSizeName: 'Pantalla Full HD Horizontal'
    }
  });

const getPredefinedDesignTemplates = () => [
  {
    id: 'template-welcome',
    type: 'basic',
    name: 'Plantilla de Bienvenida',
    description: 'Cabecera amplia para lobby, comercios o recepción.',
    thumbnail: null,
    content: buildTemplateContent({
      title: 'Bienvenidos',
      subtitle: 'Un mensaje limpio, listo para personalizar con tu marca y tu contenido principal.',
      accent: '#0f766e'
    })
  },
  {
    id: 'template-info',
    type: 'text',
    name: 'Plantilla Informativa',
    description: 'Diseño editorial para comunicar avisos, horarios o información destacada.',
    thumbnail: null,
    content: buildTemplateContent({
      title: 'Información Destacada',
      subtitle: 'Organiza novedades, horarios, beneficios o instrucciones con una jerarquía visual clara.',
      accent: '#b45309'
    })
  }
];

module.exports = {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  DEFAULT_BACKGROUND,
  normalizeDesignContent,
  decorateAssignedScreens,
  decorateDesignRecord,
  getPredefinedDesignTemplates,
  parseJsonContent
};
