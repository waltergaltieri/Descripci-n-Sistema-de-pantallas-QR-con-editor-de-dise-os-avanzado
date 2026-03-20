export const PROMOTION_DISPLAY_STYLE_OPTIONS = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'El sistema elige el estilo segun la promo.'
  },
  {
    value: 'ribbon-alert',
    label: 'Cinta',
    description: 'Franja comercial para remarcar la oferta.'
  },
  {
    value: 'seal-offer',
    label: 'Sello',
    description: 'Sello circular ideal para 2x1 y descuentos.'
  },
  {
    value: 'countdown-hero',
    label: 'Countdown hero',
    description: 'Contador grande y mucho protagonismo.'
  },
  {
    value: 'urgency-banner',
    label: 'Urgente',
    description: 'Banner fuerte para promos con tiempo limitado.'
  },
  {
    value: 'price-focus',
    label: 'Precio protagonista',
    description: 'Descuento principal en primer plano.'
  }
];

export const COMBO_DISPLAY_STYLE_OPTIONS = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'El sistema sugiere el mejor estilo.'
  },
  {
    value: 'combo-featured',
    label: 'Destacado',
    description: 'Tarjeta comercial amplia para vender el combo.'
  },
  {
    value: 'savings-badge',
    label: 'Ahorro',
    description: 'Remarca el ahorro y beneficio del combo.'
  },
  {
    value: 'combo-countdown',
    label: 'Countdown',
    description: 'El tiempo limite pasa al frente.'
  },
  {
    value: 'combo-premium',
    label: 'Premium',
    description: 'Look elegante para combos estrella.'
  },
  {
    value: 'combo-compact',
    label: 'Compacto',
    description: 'Mas compacto para listas largas.'
  }
];

const promotionBadgeByType = {
  percentage_discount: (promotion) => `${Math.round(Number(promotion?.discount_percentage || 0))}% OFF`,
  two_for_one: () => '2x1',
  second_unit_percentage: (promotion) =>
    `${Math.round(Number(promotion?.discount_percentage || 0))}% 2da`,
  free_with_other_product: () => 'GRATIS',
  free_with_minimum_spend: () => 'REGALO',
  discount_with_minimum_spend: () => 'AHORRO'
};

export const getPromotionPrimaryBadge = (promotion) => {
  const resolver = promotionBadgeByType[promotion?.type];
  return resolver ? resolver(promotion) : 'PROMO';
};

export const getPromotionTimingLabel = (promotion) => {
  if (promotion?.has_countdown && promotion?.ends_at) {
    return 'Cuenta regresiva';
  }

  if (promotion?.ends_at) {
    return 'Tiempo limitado';
  }

  return 'Promo activa';
};

export const getComboTimingLabel = (combo) => {
  if (combo?.has_countdown && combo?.ends_at) {
    return 'Cuenta regresiva';
  }

  if (combo?.ends_at) {
    return 'Edicion limitada';
  }

  if (combo?.promotions?.length) {
    return 'Ahorro activo';
  }

  return 'Combo activo';
};

export const resolvePromotionDisplayStyle = (promotion, selectedStyle = 'auto') => {
  if (selectedStyle && selectedStyle !== 'auto') {
    return selectedStyle;
  }

  if (promotion?.has_countdown && promotion?.ends_at) {
    return 'countdown-hero';
  }

  if (promotion?.type === 'two_for_one') {
    return 'seal-offer';
  }

  if (promotion?.discount_percentage) {
    return 'price-focus';
  }

  if (promotion?.ends_at) {
    return 'urgency-banner';
  }

  return 'ribbon-alert';
};

export const resolveComboDisplayStyle = (combo, selectedStyle = 'auto') => {
  if (selectedStyle && selectedStyle !== 'auto') {
    return selectedStyle;
  }

  if (combo?.has_countdown && combo?.ends_at) {
    return 'combo-countdown';
  }

  if (combo?.promotions?.length) {
    return 'savings-badge';
  }

  return 'combo-featured';
};

export const buildPromotionVisualModel = (promotion, selectedStyle = 'auto') => {
  const style = resolvePromotionDisplayStyle(promotion, selectedStyle);
  const primaryBadge = getPromotionPrimaryBadge(promotion);
  const timingLabel = getPromotionTimingLabel(promotion);

  if (style === 'seal-offer') {
    return {
      style,
      styleLabel: `Sello ${primaryBadge}`,
      primaryBadge,
      accentLine: timingLabel
    };
  }

  if (style === 'countdown-hero') {
    return {
      style,
      styleLabel: 'Ultima oportunidad',
      primaryBadge,
      accentLine: timingLabel
    };
  }

  if (style === 'urgency-banner') {
    return {
      style,
      styleLabel: 'Promo urgente',
      primaryBadge,
      accentLine: timingLabel
    };
  }

  if (style === 'price-focus') {
    return {
      style,
      styleLabel: 'Ahorra hoy',
      primaryBadge,
      accentLine: timingLabel
    };
  }

  return {
    style,
    styleLabel: 'Oferta destacada',
    primaryBadge,
    accentLine: timingLabel
  };
};

export const buildComboVisualModel = (combo, selectedStyle = 'auto') => {
  const style = resolveComboDisplayStyle(combo, selectedStyle);
  const timingLabel = getComboTimingLabel(combo);
  const promotionBadge = combo?.promotions?.[0] ? getPromotionPrimaryBadge(combo.promotions[0]) : null;

  if (style === 'combo-countdown') {
    return {
      style,
      styleLabel: 'Combo contrarreloj',
      primaryBadge: promotionBadge || 'Tiempo limitado',
      accentLine: timingLabel
    };
  }

  if (style === 'combo-premium') {
    return {
      style,
      styleLabel: 'Combo premium',
      primaryBadge: promotionBadge || 'Especial de la casa',
      accentLine: timingLabel
    };
  }

  if (style === 'combo-compact') {
    return {
      style,
      styleLabel: 'Combo rapido',
      primaryBadge: promotionBadge || 'Practico',
      accentLine: timingLabel
    };
  }

  if (style === 'savings-badge') {
    return {
      style,
      styleLabel: 'Combo ahorro',
      primaryBadge: promotionBadge || 'Ahorro',
      accentLine: timingLabel
    };
  }

  return {
    style,
    styleLabel: 'Combo estrella',
    primaryBadge: promotionBadge || 'Destacado',
    accentLine: timingLabel
  };
};
