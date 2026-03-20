const { getProductVisibility } = require('./carteleriaStatus');

const formatPrice = (priceCents = 0) => Number((Number(priceCents || 0) / 100).toFixed(2));

const isCurrentlyActive = (entity, currentDate = new Date()) => {
  if (!entity || entity.status !== 'active') {
    return false;
  }

  const currentTime = currentDate.getTime();

  if (entity.starts_at) {
    const startsAt = new Date(entity.starts_at).getTime();
    if (!Number.isNaN(startsAt) && currentTime < startsAt) {
      return false;
    }
  }

  if (!entity.no_expiration && entity.ends_at) {
    const endsAt = new Date(entity.ends_at).getTime();
    if (!Number.isNaN(endsAt) && currentTime > endsAt) {
      return false;
    }
  }

  return true;
};

const normalizeProduct = (product, promotions = []) => {
  const visibility = getProductVisibility(product.status);

  if (!visibility.visible) {
    return null;
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    category_id: product.category_id || null,
    category_name: product.category_name || null,
    primary_image_url: product.primary_image_url || null,
    price_cents: Number(product.price_cents || 0),
    price: formatPrice(product.price_cents),
    status: product.status,
    showSoldOutBadge: visibility.showSoldOutBadge,
    promotions
  };
};

const normalizeCombo = (combo, productsById, promotions = []) => {
  const items = Array.isArray(combo.items)
    ? combo.items
        .map((item) => productsById.get(Number(item.product_id || item.id)))
        .filter(Boolean)
    : [];

  if (items.length === 0) {
    return null;
  }

  return {
    id: combo.id,
    name: combo.name,
    description: combo.description || '',
    conditions_text: combo.conditions_text || '',
    image_url: combo.image_url || items[0]?.primary_image_url || null,
    combo_price_cents: Number(combo.combo_price_cents || 0),
    combo_price: formatPrice(combo.combo_price_cents),
    has_countdown: Boolean(combo.has_countdown),
    starts_at: combo.starts_at || null,
    ends_at: combo.ends_at || null,
    no_expiration: Boolean(combo.no_expiration),
    promotions,
    items
  };
};

const normalizePromotion = (promotion, productsById, combosById) => {
  const targetProduct = promotion.target_product_id
    ? productsById.get(Number(promotion.target_product_id)) || null
    : null;
  const targetCombo = promotion.target_combo_id
    ? combosById.get(Number(promotion.target_combo_id)) || null
    : null;

  if (!targetProduct && !targetCombo) {
    return null;
  }

  const triggerProduct = promotion.trigger_product_id
    ? productsById.get(Number(promotion.trigger_product_id)) || null
    : null;

  return {
    id: promotion.id,
    name: promotion.name,
    type: promotion.type,
    description: promotion.description || '',
    conditions_text: promotion.conditions_text || '',
    discount_percentage: promotion.discount_percentage,
    minimum_spend_cents: promotion.minimum_spend_cents,
    has_countdown: Boolean(promotion.has_countdown),
    starts_at: promotion.starts_at || null,
    ends_at: promotion.ends_at || null,
    target_product: targetProduct,
    target_combo: targetCombo,
    trigger_product: triggerProduct
  };
};

const isComboVisibleForMenu = (combo, currentMenuId) => {
  if (!currentMenuId) {
    return true;
  }

  const menuIds = Array.isArray(combo.menu_ids)
    ? combo.menu_ids.map((menuId) => Number(menuId)).filter(Boolean)
    : [];

  if (menuIds.length === 0) {
    return true;
  }

  return menuIds.includes(Number(currentMenuId));
};

const groupPromotionsByTarget = (normalizedPromotions, fieldName) =>
  normalizedPromotions.reduce((map, promotion) => {
    const target = promotion[fieldName];
    if (!target?.id) {
      return map;
    }

    const targetId = Number(target.id);
    const existingPromotions = map.get(targetId) || [];
    map.set(targetId, [...existingPromotions, promotion]);
    return map;
  }, new Map());

const buildPublicMenuBlocks = ({
  blocks = [],
  categories = [],
  products = [],
  promotions = [],
  combos = [],
  currentMenuId = null,
  currentDate = new Date()
}) => {
  const hasPromotionBlock = blocks.some((block) => block?.block_type === 'promotion');

  const visibleProductsBase = products
    .map((product) => normalizeProduct(product))
    .filter(Boolean);
  const productsByIdBase = new Map(
    visibleProductsBase.map((product) => [Number(product.id), product])
  );

  const visibleCombosBase = combos
    .filter((combo) => isCurrentlyActive(combo, currentDate))
    .filter((combo) => isComboVisibleForMenu(combo, currentMenuId))
    .map((combo) => normalizeCombo(combo, productsByIdBase))
    .filter(Boolean);
  const combosByIdBase = new Map(
    visibleCombosBase.map((combo) => [Number(combo.id), combo])
  );

  const normalizedPromotions = promotions
    .filter((promotion) => isCurrentlyActive(promotion, currentDate))
    .map((promotion) => normalizePromotion(promotion, productsByIdBase, combosByIdBase))
    .filter(Boolean);

  const promotionsByProductId = groupPromotionsByTarget(normalizedPromotions, 'target_product');
  const promotionsByComboId = groupPromotionsByTarget(normalizedPromotions, 'target_combo');

  const visibleProducts = visibleProductsBase.map((product) => ({
    ...product,
    promotions: promotionsByProductId.get(Number(product.id)) || []
  }));
  const productsById = new Map(visibleProducts.map((product) => [Number(product.id), product]));

  const visibleCombos = visibleCombosBase
    .map((combo) =>
      normalizeCombo(
        {
          ...combo,
          items: combo.items.map((item) => ({ product_id: item.id })),
          image_url: combo.image_url,
          combo_price_cents: combo.combo_price_cents,
          description: combo.description,
          conditions_text: combo.conditions_text
        },
        productsById,
        promotionsByComboId.get(Number(combo.id)) || []
      )
    )
    .filter(Boolean);
  const combosById = new Map(visibleCombos.map((combo) => [Number(combo.id), combo]));

  const finalPromotions = promotions
    .filter((promotion) => isCurrentlyActive(promotion, currentDate))
    .map((promotion) => normalizePromotion(promotion, productsById, combosById))
    .filter(Boolean);

  const promotedProductIds = new Set(
    finalPromotions
      .filter((promotion) => promotion.target_product?.id)
      .map((promotion) => Number(promotion.target_product.id))
  );
  const promotedComboIds = new Set(
    finalPromotions
      .filter((promotion) => promotion.target_combo?.id)
      .map((promotion) => Number(promotion.target_combo.id))
  );

  const categoriesById = new Map(
    categories.map((category) => [
      Number(category.id),
      {
        id: category.id,
        name: category.name,
        description: category.description || ''
      }
    ])
  );

  const visibleRegularProducts = hasPromotionBlock
    ? visibleProducts.filter((product) => !promotedProductIds.has(Number(product.id)))
    : visibleProducts;
  const visibleRegularCombos = hasPromotionBlock
    ? visibleCombos.filter((combo) => !promotedComboIds.has(Number(combo.id)))
    : visibleCombos;

  const productsByCategoryId = visibleRegularProducts.reduce((map, product) => {
    const categoryId = Number(product.category_id);
    const existingItems = map.get(categoryId) || [];
    map.set(categoryId, [...existingItems, product]);
    return map;
  }, new Map());

  const promotionsById = new Map(
    finalPromotions.map((promotion) => [Number(promotion.id), promotion])
  );
  const combosByIdForBlocks = new Map(
    visibleRegularCombos.map((combo) => [Number(combo.id), combo])
  );

  return blocks.reduce((resolvedBlocks, block) => {
    if (!block || !block.block_type) {
      return resolvedBlocks;
    }

    const config = block.config || {};

    if (block.block_type === 'header' || block.block_type === 'separator') {
      resolvedBlocks.push({
        ...block,
        config
      });
      return resolvedBlocks;
    }

    if (block.block_type === 'category') {
      const categoryId = Number(config.category_id);
      const category = categoriesById.get(categoryId) || null;
      const items = productsByCategoryId.get(categoryId) || [];

      if (!category || items.length === 0) {
        return resolvedBlocks;
      }

      resolvedBlocks.push({
        ...block,
        config,
        title: block.title || category.name,
        category,
        items
      });
      return resolvedBlocks;
    }

    if (block.block_type === 'product') {
      const item = productsById.get(Number(config.product_id));

      if (!item || (hasPromotionBlock && promotedProductIds.has(Number(item.id)))) {
        return resolvedBlocks;
      }

      resolvedBlocks.push({
        ...block,
        config,
        title: block.title || item.name,
        item
      });
      return resolvedBlocks;
    }

    if (block.block_type === 'promotion') {
      const promotionId = Number(config.promotion_id);
      const item = promotionId ? promotionsById.get(promotionId) : null;
      const items = item ? [item] : [...promotionsById.values()];

      if (items.length === 0) {
        return resolvedBlocks;
      }

      resolvedBlocks.push({
        ...block,
        config,
        title: block.title || item?.name || 'Promociones activas',
        items,
        item: item || items[0]
      });
      return resolvedBlocks;
    }

    if (block.block_type === 'combo') {
      const comboId = Number(config.combo_id);
      const item = comboId ? combosByIdForBlocks.get(comboId) : null;
      const items = item ? [item] : [...combosByIdForBlocks.values()];

      if (items.length === 0) {
        return resolvedBlocks;
      }

      resolvedBlocks.push({
        ...block,
        config,
        title: block.title || item?.name || 'Combos del local',
        items,
        item: item || items[0]
      });
      return resolvedBlocks;
    }

    return resolvedBlocks;
  }, []);
};

module.exports = {
  buildPublicMenuBlocks
};
