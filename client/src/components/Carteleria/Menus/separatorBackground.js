export const DEFAULT_SEPARATOR_GRADIENT = {
  from: '#0f172a',
  to: '#334155',
  angle: 135
};

export const buildSeparatorGradient = (gradientConfig = {}) => {
  const from = gradientConfig.from || DEFAULT_SEPARATOR_GRADIENT.from;
  const to = gradientConfig.to || DEFAULT_SEPARATOR_GRADIENT.to;
  const angle = Number.isFinite(Number(gradientConfig.angle))
    ? Number(gradientConfig.angle)
    : DEFAULT_SEPARATOR_GRADIENT.angle;

  return `linear-gradient(${angle}deg, ${from}, ${to})`;
};

export const parseSeparatorGradient = (gradientValue = '') => {
  const match = String(gradientValue || '').match(
    /linear-gradient\(\s*([-\d.]+)deg\s*,\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/i
  );

  if (!match) {
    return { ...DEFAULT_SEPARATOR_GRADIENT };
  }

  return {
    angle: Number(match[1]),
    from: match[2].trim(),
    to: match[3].trim()
  };
};

export const normalizeSeparatorBlock = (block) => {
  if (block?.block_type !== 'separator') {
    return block;
  }

  const config = { ...(block.config || {}) };

  if (block.background_type === 'gradient') {
    const parsedGradient = parseSeparatorGradient(block.background_value);
    const gradientConfig = {
      from: config.gradient_from || parsedGradient.from,
      to: config.gradient_to || parsedGradient.to,
      angle: config.gradient_angle ?? parsedGradient.angle
    };

    return {
      ...block,
      background_value: buildSeparatorGradient(gradientConfig),
      config: {
        ...config,
        gradient_from: gradientConfig.from,
        gradient_to: gradientConfig.to,
        gradient_angle: gradientConfig.angle
      }
    };
  }

  if (block.background_type === 'image') {
    const backgroundImageUrl = config.background_image_url || block.background_value || '';

    return {
      ...block,
      background_value: backgroundImageUrl,
      config: {
        ...config,
        background_image_url: backgroundImageUrl
      }
    };
  }

  return {
    ...block,
    config
  };
};

export const resolveSeparatorStyles = (block, resolveAssetUrl = (value) => value) => {
  const textColor = block.text_color || '#ffffff';

  if (block.background_type === 'gradient') {
    const gradientValue = buildSeparatorGradient({
      from: block.config?.gradient_from,
      to: block.config?.gradient_to,
      angle: block.config?.gradient_angle
    });

    return {
      backgroundImage: gradientValue,
      color: textColor
    };
  }

  if (block.background_type === 'image') {
    const imagePath = block.config?.background_image_url || block.background_value || '';
    const resolvedImageUrl = imagePath ? resolveAssetUrl(imagePath) : '';

    return {
      backgroundImage: resolvedImageUrl
        ? `linear-gradient(rgba(15, 23, 42, 0.28), rgba(15, 23, 42, 0.28)), url(${resolvedImageUrl})`
        : `linear-gradient(135deg, ${DEFAULT_SEPARATOR_GRADIENT.from}, ${DEFAULT_SEPARATOR_GRADIENT.to})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: textColor
    };
  }

  return {
    background: block.background_value || '#1f2937',
    color: textColor
  };
};
