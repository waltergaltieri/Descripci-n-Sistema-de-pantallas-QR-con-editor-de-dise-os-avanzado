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

const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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

const browserAtob = () => {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return window.atob.bind(window);
  }

  return null;
};

const browserBtoa = () => {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa.bind(window);
  }

  return null;
};

const decodeBase64Svg = (value) => {
  const atobFn = browserAtob();
  if (atobFn) {
    return decodeURIComponent(
      Array.from(atobFn(value), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
    );
  }

  return Buffer.from(value, 'base64').toString('utf8');
};

const encodeBase64Svg = (markup) => {
  const btoaFn = browserBtoa();
  if (btoaFn) {
    return btoaFn(
      encodeURIComponent(markup).replace(/%([0-9A-F]{2})/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    );
  }

  return Buffer.from(markup, 'utf8').toString('base64');
};

const decodeSvgDataUrl = (value) => {
  if (typeof value !== 'string' || !value.startsWith('data:image/svg+xml')) {
    return null;
  }

  const [prefix, payload = ''] = value.split(',', 2);
  const isBase64 = /;base64/i.test(prefix);

  try {
    const markup = isBase64
      ? decodeBase64Svg(payload)
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
    ? `data:image/svg+xml;base64,${encodeBase64Svg(markup)}`
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
    const normalization = getMaskedImageFlipNormalization(normalizedChild);

    if (normalization) {
      normalizedChild.clipSrc = normalization.clipSrc;
      normalizedChild.flipX = normalization.flipX;
      normalizedChild.flipY = normalization.flipY;
    }
  }

  return normalizedChild;
});

export const getMaskedImageFlipNormalization = (element) => {
  if (
    !element ||
    element.type !== 'image' ||
    typeof element.clipSrc !== 'string' ||
    element.clipSrc.trim() === '' ||
    (!element.flipX && !element.flipY)
  ) {
    return null;
  }

  const decodedSvg = decodeSvgDataUrl(element.clipSrc);
  if (!decodedSvg) {
    return null;
  }

  return {
    clipSrc: encodeSvgDataUrl(
      applyFlipToMaskMarkup(decodedSvg.markup, Boolean(element.flipX), Boolean(element.flipY)),
      decodedSvg.isBase64
    ),
    flipX: false,
    flipY: false
  };
};

export const normalizeDesignContent = (input, options = {}) => {
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

export const buildInitialDesignContent = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  backgroundColor = DEFAULT_BACKGROUND,
  screenSizeName = 'Personalizado',
  orientation
} = {}) =>
  normalizeDesignContent({
    width,
    height,
    pages: [
      {
        id: makeId('page'),
        width,
        height,
        background: backgroundColor,
        children: []
      }
    ],
    settings: {
      backgroundColor,
      canvasWidth: width,
      canvasHeight: height,
      screenSizeName,
      orientation: orientation || (height > width ? 'portrait' : 'landscape')
    }
  });

export const mergeEditorContentWithDesign = (editorJson, designLike = {}) => {
  const normalizedBase = normalizeDesignContent(designLike.content || designLike);
  const normalizedEditor = normalizeDesignContent(editorJson, {
    defaultWidth: normalizedBase.settings.canvasWidth,
    defaultHeight: normalizedBase.settings.canvasHeight,
    screenSizeName: normalizedBase.settings.screenSizeName,
    orientation: normalizedBase.settings.orientation,
    backgroundColor: normalizedBase.settings.backgroundColor
  });

  const page = normalizedEditor.pages[0];
  const canvasWidth = toPositiveNumber(page?.width) || normalizedBase.settings.canvasWidth;
  const canvasHeight = toPositiveNumber(page?.height) || normalizedBase.settings.canvasHeight;
  const backgroundColor = page?.background || normalizedBase.settings.backgroundColor || DEFAULT_BACKGROUND;
  const qrElements = collectQrElements(normalizedEditor.pages, normalizedBase.settings.qrElements || {});

  return {
    ...normalizedEditor,
    width: canvasWidth,
    height: canvasHeight,
    pages: normalizedEditor.pages.map((currentPage) => ({
      ...currentPage,
      width: canvasWidth,
      height: canvasHeight,
      background: currentPage.background || backgroundColor
    })),
    settings: {
      ...normalizedBase.settings,
      ...normalizedEditor.settings,
      backgroundColor,
      canvasWidth,
      canvasHeight,
      orientation: canvasHeight > canvasWidth ? 'portrait' : 'landscape',
      qrElements
    }
  };
};

export const decorateAssignedScreens = (assignedScreens = []) =>
  assignedScreens.map((screen) => ({
    id: screen.id ?? screen.screen_id,
    name: screen.name ?? screen.screen_name
  }));

export const getContentSnapshot = (content) => JSON.stringify(normalizeDesignContent(content));

export const collectQrElementsFromContent = (content) => normalizeDesignContent(content).settings.qrElements || {};

export const buildResolutionLabel = (content) => {
  const normalized = normalizeDesignContent(content);
  return `${normalized.settings.canvasWidth} x ${normalized.settings.canvasHeight}`;
};

export const findElementById = (children = [], targetId) => {
  for (const child of children) {
    if (child.id === targetId) {
      return child;
    }

    if (Array.isArray(child.children)) {
      const nested = findElementById(child.children, targetId);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
};
