const express = require('express');
const { db } = require('../config/database');
const { assembleMenuPayload } = require('../utils/menuAssembler');
const { resolveMenuForLink } = require('../utils/menuResolver');
const { buildPublicMenuBlocks } = require('../utils/publicMenuBuilder');

const router = express.Router();

const parseJsonField = (value, fallback = {}) => {
  if (!value) {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const getDateTimeInTimeZone = (timeZone, sourceDate = new Date()) => {
  if (!timeZone) {
    return sourceDate;
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(sourceDate).reduce((accumulator, part) => {
    if (part.type !== 'literal') {
      accumulator[part.type] = part.value;
    }

    return accumulator;
  }, {});

  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
  );
};

const inferDeviceType = (userAgent = '') => {
  const normalizedAgent = String(userAgent || '').toLowerCase();

  if (/mobile|android|iphone/.test(normalizedAgent)) {
    return 'mobile';
  }

  if (/ipad|tablet/.test(normalizedAgent)) {
    return 'tablet';
  }

  return 'desktop';
};

const getLinkBySlug = async (slug) => {
  const link = await db().get(
    `
      SELECT *
      FROM persistent_links
      WHERE slug = ?
    `,
    [slug]
  );

  if (!link) {
    return null;
  }

  const rules = await db().all(
    `
      SELECT *
      FROM link_schedule_rules
      WHERE persistent_link_id = ?
      ORDER BY priority DESC, start_time ASC, id ASC
    `,
    [link.id]
  );

  return {
    ...link,
    qr_config: parseJsonField(link.qr_config, {}),
    rules
  };
};

const getMenuById = async (menuId) => {
  const menu = await db().get(
    `
      SELECT
        m.*,
        u.url AS logo_url
      FROM menus m
      LEFT JOIN uploads u ON u.id = m.logo_upload_id
      WHERE m.id = ?
    `,
    [menuId]
  );

  if (!menu) {
    return null;
  }

  const blocks = await db().all(
    `
      SELECT *
      FROM menu_blocks
      WHERE menu_id = ?
      ORDER BY sort_order ASC, id ASC
    `,
    [menuId]
  );

  return {
    ...menu,
    settings: parseJsonField(menu.settings, {}),
    blocks: assembleMenuPayload(
      blocks.map((block) => ({
        ...block,
        config: parseJsonField(block.config, {})
      }))
    )
  };
};

const getVisibleCatalog = async () => {
  const [categories, products, promotions, combos, comboItems, comboVisibility] = await Promise.all([
    db().all(
      `
        SELECT *
        FROM categories
        WHERE is_active = 1
        ORDER BY sort_order ASC, name ASC
      `
    ),
    db().all(
      `
        SELECT
          p.*,
          c.name AS category_name,
          u.url AS primary_image_url
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN uploads u ON u.id = p.primary_image_upload_id
        WHERE p.status IN ('active', 'sold_out')
        ORDER BY p.name ASC
      `
    ),
    db().all(
      `
        SELECT *
        FROM promotions
        WHERE status IN ('active', 'paused', 'expired')
        ORDER BY updated_at DESC, id DESC
      `
    ),
    db().all(
      `
        SELECT
          c.*,
          u.url AS image_url
        FROM combos c
        LEFT JOIN uploads u ON u.id = c.image_upload_id
        WHERE c.status IN ('active', 'paused', 'expired')
        ORDER BY c.updated_at DESC, c.id DESC
      `
    ),
    db().all(
      `
        SELECT *
        FROM combo_items
        ORDER BY sort_order ASC, id ASC
      `
    ),
    db().all(
      `
        SELECT *
        FROM combo_menu_visibility
        ORDER BY menu_id ASC, combo_id ASC
      `
    )
  ]);

  const comboItemsByComboId = comboItems.reduce((map, comboItem) => {
    const comboId = Number(comboItem.combo_id);
    const existingItems = map.get(comboId) || [];
    map.set(comboId, [...existingItems, comboItem]);
    return map;
  }, new Map());
  const comboMenuIdsByComboId = comboVisibility.reduce((map, visibility) => {
    const comboId = Number(visibility.combo_id);
    const existingMenuIds = map.get(comboId) || [];
    map.set(comboId, [...existingMenuIds, Number(visibility.menu_id)]);
    return map;
  }, new Map());

  return {
    categories,
    products,
    promotions,
    combos: combos.map((combo) => ({
      ...combo,
      menu_ids: comboMenuIdsByComboId.get(Number(combo.id)) || [],
      items: comboItemsByComboId.get(Number(combo.id)) || []
    }))
  };
};

router.get('/:slug', async (req, res) => {
  try {
    const businessProfile = await db().get(
      `
        SELECT *
        FROM business_profile
        ORDER BY id ASC
        LIMIT 1
      `
    );

    const link = await getLinkBySlug(req.params.slug);

    if (!link) {
      return res.status(404).json({ error: 'Link persistente no encontrado' });
    }

    const businessNow = getDateTimeInTimeZone(
      businessProfile?.timezone || 'America/Buenos_Aires',
      new Date()
    );
    const resolution = resolveMenuForLink(link, businessNow);

    if (!resolution.menuId) {
      return res.json({
        state: resolution.source,
        business: businessProfile,
        link: {
          id: link.id,
          name: link.name,
          slug: link.slug,
          source: resolution.source
        },
        menu: null,
        blocks: []
      });
    }

    const menu = await getMenuById(resolution.menuId);

    if (!menu || menu.status === 'paused') {
      return res.json({
        state: 'menu_unavailable',
        business: businessProfile,
        link: {
          id: link.id,
          name: link.name,
          slug: link.slug,
          source: resolution.source
        },
        menu: null,
        blocks: []
      });
    }

    const catalog = await getVisibleCatalog();
    const blocks = buildPublicMenuBlocks({
      blocks: menu.blocks,
      categories: catalog.categories,
      products: catalog.products,
      promotions: catalog.promotions,
      combos: catalog.combos,
      currentMenuId: menu.id,
      currentDate: businessNow
    });

    await db().run(
      `
        INSERT INTO menu_views (
          menu_id,
          persistent_link_id,
          resolved_source,
          user_agent,
          device_type
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        menu.id,
        link.id,
        resolution.source,
        req.headers['user-agent'] || null,
        inferDeviceType(req.headers['user-agent'])
      ]
    );

    res.json({
      state: 'ok',
      business: businessProfile,
      link: {
        id: link.id,
        name: link.name,
        slug: link.slug,
        source: resolution.source,
        rule_id: resolution.ruleId
      },
      menu: {
        id: menu.id,
        name: menu.name,
        local_name: menu.local_name,
        logo_url: menu.logo_url,
        theme_key: menu.theme_key,
        settings: menu.settings
      },
      blocks
    });
  } catch (error) {
    console.error('Error al resolver menu publico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
