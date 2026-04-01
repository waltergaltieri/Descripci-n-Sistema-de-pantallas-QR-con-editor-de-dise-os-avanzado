const express = require('express');
const { db, getProviderConfig } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { assembleMenuPayload } = require('../utils/menuAssembler');
const { findScheduleConflicts } = require('../utils/scheduleValidator');

const router = express.Router();

const PRODUCT_STATUSES = ['active', 'paused', 'sold_out'];
const PROMOTION_STATUSES = ['active', 'paused', 'expired'];
const LINKABLE_STATUSES = ['active', 'paused', 'expired'];
const MENU_STATUSES = ['draft', 'active', 'paused'];
const LINK_STATUSES = ['active', 'paused'];
const MENU_BLOCK_TYPES = ['header', 'product', 'category', 'promotion', 'combo', 'separator'];
const MENU_THEME_KEYS = ['style-1', 'style-2', 'style-3', 'style-4', 'style-5', 'style-6'];
const PROMOTION_TYPES = [
  'percentage_discount',
  'two_for_one',
  'second_unit_percentage',
  'free_with_other_product',
  'free_with_minimum_spend',
  'discount_with_minimum_spend'
];

const parseInteger = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parsePriceCents = ({ price, price_cents: priceCents }) => {
  if (priceCents !== undefined && priceCents !== null && priceCents !== '') {
    const parsedCents = parseInteger(priceCents, null);
    return parsedCents === null ? null : parsedCents;
  }

  if (price !== undefined && price !== null && price !== '') {
    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice)) {
      return null;
    }

    return Math.round(parsedPrice * 100);
  }

  return 0;
};

const hasOwnProperty = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const parseMoneyFieldToCents = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.round(parsed * 100);
};

const normalizeDateTime = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const sanitizeUploadIds = (uploadIds = []) =>
  uploadIds
    .map((uploadId) => parseInteger(uploadId, null))
    .filter((uploadId) => uploadId !== null);

const formatPrice = (priceCents = 0) => Number((priceCents / 100).toFixed(2));
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

const stringifyJsonField = (value, fallback = {}) => JSON.stringify(value || fallback);

const getComboItemsSummarySql = () => {
  const provider = getProviderConfig()?.provider || 'sqlite';

  if (provider === 'postgres') {
    return "STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name)";
  }

  return 'GROUP_CONCAT(DISTINCT p.name)';
};

const slugify = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';

const getDefaultBusinessAccountId = async () => {
  const account = await db().get('SELECT id FROM business_accounts ORDER BY id ASC LIMIT 1');
  return account?.id || null;
};

const resolveScopedBusinessAccountId = async (req) => {
  if (req.user?.actorType === 'business_user' && req.user?.businessAccountId) {
    return req.user.businessAccountId;
  }

  if (req.user?.actorType === 'super_admin') {
    const explicitBusinessAccountId = parseInteger(
      req.query?.businessAccountId ?? req.body?.businessAccountId,
      null
    );

    if (explicitBusinessAccountId) {
      return explicitBusinessAccountId;
    }

    return getDefaultBusinessAccountId();
  }

  return null;
};

const requireScopedBusinessAccountId = async (req, res) => {
  const businessAccountId = await resolveScopedBusinessAccountId(req);

  if (!businessAccountId) {
    res.status(403).json({ error: 'No se pudo resolver el negocio asociado al usuario autenticado' });
    return null;
  }

  return businessAccountId;
};

const ensureUploadExists = async (uploadId, businessAccountId) => {
  if (!uploadId) {
    return null;
  }

  return db().get(
    'SELECT id FROM uploads WHERE id = ? AND business_account_id = ?',
    [uploadId, businessAccountId]
  );
};

const ensureCategoryExists = async (categoryId, businessAccountId) => {
  if (!categoryId) {
    return null;
  }

  return db().get(
    'SELECT id FROM categories WHERE id = ? AND business_account_id = ?',
    [categoryId, businessAccountId]
  );
};

const ensureProductExists = async (productId, businessAccountId) => {
  if (!productId) {
    return null;
  }

  return db().get(
    'SELECT id FROM products WHERE id = ? AND business_account_id = ?',
    [productId, businessAccountId]
  );
};

const ensureComboExists = async (comboId, businessAccountId) => {
  if (!comboId) {
    return null;
  }

  return db().get(
    'SELECT id FROM combos WHERE id = ? AND business_account_id = ?',
    [comboId, businessAccountId]
  );
};

const ensureMenuExists = async (menuId, businessAccountId = null) => {
  if (!menuId) {
    return null;
  }

  if (businessAccountId) {
    return db().get(
      'SELECT id FROM menus WHERE id = ? AND business_account_id = ?',
      [menuId, businessAccountId]
    );
  }

  return db().get('SELECT id FROM menus WHERE id = ?', [menuId]);
};

const generateUniqueSlug = async (tableName, baseValue, excludeId = null) => {
  const baseSlug = slugify(baseValue);
  let candidate = baseSlug;
  let attempt = 1;

  while (true) {
    const existing = excludeId
      ? await db().get(`SELECT id FROM ${tableName} WHERE slug = ? AND id != ?`, [candidate, excludeId])
      : await db().get(`SELECT id FROM ${tableName} WHERE slug = ?`, [candidate]);

    if (!existing) {
      return candidate;
    }

    attempt += 1;
    candidate = `${baseSlug}-${attempt}`;
  }
};

const getDashboardMetrics = async (businessAccountId) => {
  const [
    totalProducts,
    activeProducts,
    pausedProducts,
    soldOutProducts,
    activePromotions,
    activeCombos,
    activeMenus,
    activeLinks,
    totalCategories
  ] = await Promise.all([
    db().get('SELECT COUNT(*) AS count FROM products WHERE business_account_id = ?', [businessAccountId]),
    db().get("SELECT COUNT(*) AS count FROM products WHERE business_account_id = ? AND status = 'active'", [businessAccountId]),
    db().get("SELECT COUNT(*) AS count FROM products WHERE business_account_id = ? AND status = 'paused'", [businessAccountId]),
    db().get("SELECT COUNT(*) AS count FROM products WHERE business_account_id = ? AND status = 'sold_out'", [businessAccountId]),
    db().get("SELECT COUNT(*) AS count FROM promotions WHERE business_account_id = ? AND status = 'active'", [businessAccountId]),
    db().get("SELECT COUNT(*) AS count FROM combos WHERE business_account_id = ? AND status = 'active'", [businessAccountId]),
    db().get("SELECT COUNT(*) AS count FROM menus WHERE business_account_id = ? AND status = 'active'", [businessAccountId]),
    db().get("SELECT COUNT(*) AS count FROM persistent_links WHERE business_account_id = ? AND status = 'active'", [businessAccountId]),
    db().get('SELECT COUNT(*) AS count FROM categories WHERE business_account_id = ? AND is_active = 1', [businessAccountId])
  ]);

  return {
    totalProducts: totalProducts.count,
    activeProducts: activeProducts.count,
    pausedProducts: pausedProducts.count,
    soldOutProducts: soldOutProducts.count,
    activePromotions: activePromotions.count,
    activeCombos: activeCombos.count,
    activeMenus: activeMenus.count,
    activeLinks: activeLinks.count,
    totalCategories: totalCategories.count
  };
};

const getProductById = async (productId, businessAccountId) => {
  const product = await db().get(
    `
      SELECT
        p.*,
        c.name AS category_name,
        c.description AS category_description,
        u.url AS primary_image_url
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN uploads u ON u.id = p.primary_image_upload_id
      WHERE p.id = ? AND p.business_account_id = ?
    `,
    [productId, businessAccountId]
  );

  if (!product) {
    return null;
  }

  const images = await db().all(
    `
      SELECT
        pi.id,
        pi.sort_order,
        pi.alt_text,
        pi.upload_id,
        u.url,
        u.original_name
      FROM product_images pi
      INNER JOIN uploads u ON u.id = pi.upload_id
      WHERE pi.product_id = ?
      ORDER BY pi.sort_order ASC, pi.id ASC
    `,
    [productId]
  );

  return {
    ...product,
    price: formatPrice(product.price_cents),
    card_image_url: product.primary_image_url || images[0]?.url || null,
    images
  };
};

const getPromotionById = async (promotionId, businessAccountId) =>
  db().get(
    `
      SELECT
        pr.*,
        target.name AS target_product_name,
        combo_target.name AS target_combo_name,
        trigger.name AS trigger_product_name
      FROM promotions pr
      LEFT JOIN products target ON target.id = pr.target_product_id
      LEFT JOIN combos combo_target ON combo_target.id = pr.target_combo_id
      LEFT JOIN products trigger ON trigger.id = pr.trigger_product_id
      WHERE pr.id = ? AND pr.business_account_id = ?
    `,
    [promotionId, businessAccountId]
  );

const getComboById = async (comboId, businessAccountId) => {
  const combo = await db().get(
    `
      SELECT
        c.*,
        u.url AS image_url
      FROM combos c
      LEFT JOIN uploads u ON u.id = c.image_upload_id
      WHERE c.id = ? AND c.business_account_id = ?
    `,
    [comboId, businessAccountId]
  );

  if (!combo) {
    return null;
  }

  const [items, visibleMenus] = await Promise.all([
    db().all(
      `
        SELECT
          ci.*,
          p.name AS product_name
        FROM combo_items ci
        INNER JOIN products p ON p.id = ci.product_id
        WHERE ci.combo_id = ?
        ORDER BY ci.sort_order ASC, ci.id ASC
      `,
      [comboId]
    ),
    db().all(
      `
        SELECT
          cmv.menu_id,
          m.name AS menu_name
        FROM combo_menu_visibility cmv
        INNER JOIN menus m ON m.id = cmv.menu_id
        WHERE cmv.combo_id = ?
        ORDER BY m.name ASC
      `,
      [comboId]
    )
  ]);

  return {
    ...combo,
    combo_price: formatPrice(combo.combo_price_cents),
    items,
    menu_ids: visibleMenus.map((menu) => menu.menu_id),
    visible_menus: visibleMenus
  };
};

const replaceProductImages = async (productId, galleryUploadIds = []) => {
  await db().run('DELETE FROM product_images WHERE product_id = ?', [productId]);

  for (let index = 0; index < galleryUploadIds.length; index += 1) {
    await db().run(
      `
        INSERT INTO product_images (product_id, upload_id, sort_order)
        VALUES (?, ?, ?)
      `,
      [productId, galleryUploadIds[index], index]
    );
  }
};

const syncComboItems = async (comboId, productIds = []) => {
  await db().run('DELETE FROM combo_items WHERE combo_id = ?', [comboId]);

  for (let index = 0; index < productIds.length; index += 1) {
    await db().run(
      `
        INSERT INTO combo_items (combo_id, product_id, sort_order)
        VALUES (?, ?, ?)
      `,
      [comboId, productIds[index], index]
    );
  }
};

const syncComboMenuVisibility = async (comboId, menuIds = []) => {
  await db().run('DELETE FROM combo_menu_visibility WHERE combo_id = ?', [comboId]);

  for (const menuId of menuIds) {
    await db().run(
      `
        INSERT INTO combo_menu_visibility (combo_id, menu_id)
        VALUES (?, ?)
      `,
      [comboId, menuId]
    );
  }
};

const getMenuById = async (menuId, businessAccountId) => {
  const menu = await db().get(
    `
      SELECT
        m.*,
        u.url AS logo_url
      FROM menus m
      LEFT JOIN uploads u ON u.id = m.logo_upload_id
      WHERE m.id = ? AND m.business_account_id = ?
    `,
    [menuId, businessAccountId]
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

const replaceMenuBlocks = async (menuId, blocks = []) => {
  await db().run('DELETE FROM menu_blocks WHERE menu_id = ?', [menuId]);

  const normalizedBlocks = assembleMenuPayload(blocks).filter((block) =>
    MENU_BLOCK_TYPES.includes(block.block_type)
  );

  for (const block of normalizedBlocks) {
    await db().run(
      `
        INSERT INTO menu_blocks (
          menu_id,
          block_type,
          title,
          content,
          background_type,
          background_value,
          text_color,
          sort_order,
          config
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        menuId,
        block.block_type,
        block.title || null,
        block.content || null,
        block.background_type || null,
        block.background_value || null,
        block.text_color || null,
        block.sort_order,
        stringifyJsonField(block.config, {})
      ]
    );
  }
};

const getPersistentLinkById = async (linkId, businessAccountId) => {
  const link = await db().get(
    `
      SELECT
        pl.*,
        m.name AS default_menu_name,
        manual.name AS manual_menu_name
      FROM persistent_links pl
      LEFT JOIN menus m ON m.id = pl.default_menu_id
      LEFT JOIN menus manual ON manual.id = pl.manual_menu_id
      WHERE pl.id = ? AND pl.business_account_id = ?
    `,
    [linkId, businessAccountId]
  );

  if (!link) {
    return null;
  }

  const rules = await db().all(
    `
      SELECT
        lsr.*,
        m.name AS menu_name
      FROM link_schedule_rules lsr
      INNER JOIN menus m ON m.id = lsr.menu_id
      WHERE lsr.persistent_link_id = ?
      ORDER BY lsr.priority DESC, lsr.start_time ASC, lsr.id ASC
    `,
    [linkId]
  );

  return {
    ...link,
    qr_config: parseJsonField(link.qr_config, {}),
    rules
  };
};

const validateScheduleRules = async (rules = [], businessAccountId) => {
  const normalizedRules = [];

  for (let index = 0; index < rules.length; index += 1) {
    const rule = rules[index];
    const normalizedRule = {
      id: rule.id || null,
      rule_name: rule.rule_name || null,
      menu_id: parseInteger(rule.menu_id, null),
      days_of_week: String(rule.days_of_week || '').trim().toLowerCase(),
      start_time: String(rule.start_time || '').trim(),
      end_time: String(rule.end_time || '').trim(),
      starts_on: rule.starts_on || null,
      ends_on: rule.ends_on || null,
      priority: parseInteger(rule.priority, 0),
      is_active: hasOwnProperty(rule, 'is_active') ? (rule.is_active ? 1 : 0) : 1
    };

    if (
      !normalizedRule.menu_id ||
      !normalizedRule.days_of_week ||
      !normalizedRule.start_time ||
      !normalizedRule.end_time
    ) {
      throw new Error('Cada regla debe tener menú, días y franja horaria.');
    }

    const menu = await ensureMenuExists(normalizedRule.menu_id, businessAccountId);
    if (!menu) {
      throw new Error(`El menú ${normalizedRule.menu_id} no existe.`);
    }

    const conflicts = findScheduleConflicts(normalizedRule, normalizedRules);
    if (conflicts.length > 0) {
      throw new Error('Hay reglas horarias superpuestas para este link persistente.');
    }

    normalizedRules.push(normalizedRule);
  }

  return normalizedRules;
};

const replaceLinkRules = async (linkId, rules = []) => {
  await db().run('DELETE FROM link_schedule_rules WHERE persistent_link_id = ?', [linkId]);

  for (const rule of rules) {
    await db().run(
      `
        INSERT INTO link_schedule_rules (
          persistent_link_id,
          menu_id,
          rule_name,
          days_of_week,
          start_time,
          end_time,
          starts_on,
          ends_on,
          priority,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        linkId,
        rule.menu_id,
        rule.rule_name,
        rule.days_of_week,
        rule.start_time,
        rule.end_time,
        rule.starts_on,
        rule.ends_on,
        rule.priority,
        rule.is_active
      ]
    );
  }
};

router.use(authenticateToken, requireAdmin);

router.get('/dashboard/metrics', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const metrics = await getDashboardMetrics(businessAccountId);
    res.json(metrics);
  } catch (error) {
    console.error('Error al obtener métricas de cartelería:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/business-profile', async (req, res) => {
  try {
    const businessAccountId = await resolveScopedBusinessAccountId(req);

    if (businessAccountId) {
      const profile = await db().get(
        `
          SELECT
            ba.id,
            ba.name,
            ba.legal_name,
            ba.description,
            ba.contact_phone,
            ba.contact_person,
            ba.contact_email,
            ba.logo_upload_id,
            ba.timezone,
            ba.currency_code,
            u.url AS logo_url
          FROM business_accounts ba
          LEFT JOIN uploads u ON u.id = ba.logo_upload_id
          WHERE ba.id = ?
          LIMIT 1
        `,
        [businessAccountId]
      );

      return res.json(profile || null);
    }

    const profile = await db().get(
      `
        SELECT
          bp.*,
          u.url AS logo_url
        FROM business_profile bp
        LEFT JOIN uploads u ON u.id = bp.logo_upload_id
        ORDER BY bp.id ASC
        LIMIT 1
      `
    );

    res.json(profile || null);
  } catch (error) {
    console.error('Error al obtener perfil del negocio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/business-profile', async (req, res) => {
  try {
    const businessAccountId = await resolveScopedBusinessAccountId(req);

    if (businessAccountId) {
      const existingProfile = await db().get(
        'SELECT id, logo_upload_id FROM business_accounts WHERE id = ?',
        [businessAccountId]
      );

      if (!existingProfile) {
        return res.status(404).json({ error: 'Perfil de negocio no encontrado' });
      }

      const {
        name,
        legal_name: legalName,
        description,
        logo_upload_id: logoUploadId,
        timezone,
        currency_code: currencyCode,
        contact_phone: contactPhone,
        contact_person: contactPerson,
        contact_email: contactEmail
      } = req.body;

      const normalizedLogoUploadId = hasOwnProperty(req.body, 'logo_upload_id')
        ? logoUploadId
          ? parseInteger(logoUploadId, null)
          : null
        : existingProfile.logo_upload_id;

      if (normalizedLogoUploadId) {
        const upload = await ensureUploadExists(normalizedLogoUploadId, businessAccountId);
        if (!upload) {
          return res.status(404).json({ error: 'Logo no encontrado para este negocio' });
        }
      }

      await db().run(
        `
          UPDATE business_accounts
          SET
            name = COALESCE(?, name),
            legal_name = COALESCE(?, legal_name),
            description = COALESCE(?, description),
            contact_phone = COALESCE(?, contact_phone),
            contact_person = COALESCE(?, contact_person),
            contact_email = COALESCE(?, contact_email),
            logo_upload_id = ?,
            timezone = COALESCE(?, timezone),
            currency_code = COALESCE(?, currency_code),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [
          name,
          legalName,
          description,
          contactPhone,
          contactPerson,
          contactEmail,
          normalizedLogoUploadId,
          timezone,
          currencyCode,
          businessAccountId
        ]
      );

      const updatedProfile = await db().get(
        `
          SELECT
            ba.*,
            u.url AS logo_url
          FROM business_accounts ba
          LEFT JOIN uploads u ON u.id = ba.logo_upload_id
          WHERE ba.id = ?
        `,
        [businessAccountId]
      );

      return res.json(updatedProfile);
    }

    const existingProfile = await db().get('SELECT id FROM business_profile ORDER BY id ASC LIMIT 1');

    if (!existingProfile) {
      return res.status(404).json({ error: 'Perfil de negocio no encontrado' });
    }

    const {
      name,
      legal_name: legalName,
      description,
      logo_upload_id: logoUploadId,
      timezone,
      currency_code: currencyCode
    } = req.body;

    await db().run(
      `
        UPDATE business_profile
        SET
          name = COALESCE(?, name),
          legal_name = COALESCE(?, legal_name),
          description = COALESCE(?, description),
          logo_upload_id = COALESCE(?, logo_upload_id),
          timezone = COALESCE(?, timezone),
          currency_code = COALESCE(?, currency_code),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND business_account_id = ?
      `,
      [name, legalName, description, logoUploadId, timezone, currencyCode, existingProfile.id]
    );

    const updatedProfile = await db().get(
      `
        SELECT
          bp.*,
          u.url AS logo_url
        FROM business_profile bp
        LEFT JOIN uploads u ON u.id = bp.logo_upload_id
        WHERE bp.id = ?
      `,
      [existingProfile.id]
    );

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error al actualizar perfil del negocio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const categories = await db().all(
      `
        SELECT
          c.*,
          COUNT(p.id) AS products_count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id AND p.business_account_id = c.business_account_id
        WHERE c.business_account_id = ?
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.name ASC
      `,
      [businessAccountId]
    );

    res.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const { name, description, sort_order: sortOrder = 0 } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
    }

    const normalizedName = String(name).trim();
    const existingCategory = await db().get(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND business_account_id = ?',
      [normalizedName, businessAccountId]
    );

    if (existingCategory) {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }

    if (normalizedPrimaryImageUploadId) {
      const upload = await ensureUploadExists(normalizedPrimaryImageUploadId, businessAccountId);
      if (!upload) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'Imagen principal no encontrada' });
      }
    }

    for (const uploadId of sanitizeUploadIds(galleryUploadIds)) {
      const upload = await ensureUploadExists(uploadId, businessAccountId);
      if (!upload) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'Una imagen de galeria no pertenece a este negocio' });
      }
    }

    if (imageUploadId) {
      const upload = await ensureUploadExists(parseInteger(imageUploadId, null), businessAccountId);
      if (!upload) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'Imagen del combo no encontrada' });
      }
    }

    const result = await db().run(
      `
        INSERT INTO categories (business_account_id, name, description, sort_order)
        VALUES (?, ?, ?, ?)
      `,
      [businessAccountId, normalizedName, description || null, parseInteger(sortOrder, 0)]
    );

    const category = await db().get(
      'SELECT * FROM categories WHERE id = ? AND business_account_id = ?',
      [result.lastID, businessAccountId]
    );
    res.status(201).json(category);
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const { id } = req.params;
    const { name, description, sort_order: sortOrder, is_active: isActive } = req.body;

    const category = await db().get(
      'SELECT * FROM categories WHERE id = ? AND business_account_id = ?',
      [id, businessAccountId]
    );
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    if (name && String(name).trim()) {
      const conflictingCategory = await db().get(
        'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ? AND business_account_id = ?',
        [String(name).trim(), id, businessAccountId]
      );

      if (conflictingCategory) {
        return res.status(409).json({ error: 'Ya existe otra categoría con ese nombre' });
      }
    }

    await db().run(
      `
        UPDATE categories
        SET
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          sort_order = COALESCE(?, sort_order),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND business_account_id = ?
      `,
      [
        name ? String(name).trim() : null,
        description,
        parseInteger(sortOrder, null),
        isActive,
        id
      ]
    );

    const updatedCategory = await db().get(
      'SELECT * FROM categories WHERE id = ? AND business_account_id = ?',
      [id, businessAccountId]
    );
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/products', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const page = Math.max(parseInteger(req.query.page, 1), 1);
    const limit = Math.min(Math.max(parseInteger(req.query.limit, 12), 1), 100);
    const offset = (page - 1) * limit;
    const conditions = ['p.business_account_id = ?'];
    const params = [businessAccountId];

    if (req.query.status && PRODUCT_STATUSES.includes(req.query.status)) {
      conditions.push('p.status = ?');
      params.push(req.query.status);
    }

    if (req.query.categoryId) {
      conditions.push('p.category_id = ?');
      params.push(req.query.categoryId);
    }

    if (req.query.search && String(req.query.search).trim()) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)');
      const searchValue = `%${String(req.query.search).trim()}%`;
      params.push(searchValue, searchValue, searchValue);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = await db().get(
      `
        SELECT COUNT(*) AS count
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        ${whereClause}
      `,
      params
    );

    const products = await db().all(
      `
        SELECT
          p.*,
          c.name AS category_name,
          u.url AS primary_image_url,
          COALESCE(
            u.url,
            (
              SELECT gallery_upload.url
              FROM product_images pi
              INNER JOIN uploads gallery_upload ON gallery_upload.id = pi.upload_id
              WHERE pi.product_id = p.id
              ORDER BY pi.sort_order ASC, pi.id ASC
              LIMIT 1
            )
          ) AS card_image_url
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN uploads u ON u.id = p.primary_image_upload_id
        ${whereClause}
        ORDER BY p.updated_at DESC, p.id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({
      data: products.map((product) => ({
        ...product,
        price: formatPrice(product.price_cents)
      })),
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.max(Math.ceil(total.count / limit), 1)
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const product = await getProductById(req.params.id, businessAccountId);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/products', async (req, res) => {
  await db().exec('BEGIN');

  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      await db().exec('ROLLBACK');
      return;
    }

    const {
      name,
      description,
      category_id: categoryId,
      primary_image_upload_id: primaryImageUploadId,
      gallery_upload_ids: galleryUploadIds = [],
      status = 'active'
    } = req.body;

    if (!name || !String(name).trim()) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'El nombre del producto es requerido' });
    }

    if (!PRODUCT_STATUSES.includes(status)) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'Estado de producto inválido' });
    }

    const priceCents = parsePriceCents(req.body);
    if (priceCents === null || priceCents < 0) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'El precio del producto es inválido' });
    }

    const normalizedCategoryId = categoryId ? parseInteger(categoryId, null) : null;
    const normalizedPrimaryImageUploadId = primaryImageUploadId
      ? parseInteger(primaryImageUploadId, null)
      : null;

    if (normalizedCategoryId) {
      const category = await ensureCategoryExists(normalizedCategoryId, businessAccountId);
      if (!category) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
    }

    const result = await db().run(
      `
        INSERT INTO products (
          business_account_id,
          name,
          description,
          price_cents,
          status,
          category_id,
          primary_image_upload_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        businessAccountId,
        String(name).trim(),
        description || null,
        priceCents,
        status,
        normalizedCategoryId,
        normalizedPrimaryImageUploadId
      ]
    );

    await replaceProductImages(result.lastID, sanitizeUploadIds(galleryUploadIds));
    await db().exec('COMMIT');

    const product = await getProductById(result.lastID, businessAccountId);
    res.status(201).json(product);
  } catch (error) {
    await db().exec('ROLLBACK');
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/products/:id', async (req, res) => {
  await db().exec('BEGIN');

  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      await db().exec('ROLLBACK');
      return;
    }

    const { id } = req.params;
    const existingProduct = await db().get(
      'SELECT * FROM products WHERE id = ? AND business_account_id = ?',
      [id, businessAccountId]
    );

    if (!existingProduct) {
      await db().exec('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const {
      gallery_upload_ids: galleryUploadIds
    } = req.body;

    if (hasOwnProperty(req.body, 'status') && req.body.status && !PRODUCT_STATUSES.includes(req.body.status)) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'Estado de producto inválido' });
    }

    if (hasOwnProperty(req.body, 'category_id') && req.body.category_id) {
      const normalizedCategoryId = parseInteger(req.body.category_id, null);
      const category = await ensureCategoryExists(normalizedCategoryId, businessAccountId);
      if (!category) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
    }

    if (hasOwnProperty(req.body, 'primary_image_upload_id') && req.body.primary_image_upload_id) {
      const upload = await ensureUploadExists(
        parseInteger(req.body.primary_image_upload_id, null),
        businessAccountId
      );
      if (!upload) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'Imagen principal no encontrada' });
      }
    }

    if (Array.isArray(galleryUploadIds)) {
      for (const uploadId of sanitizeUploadIds(galleryUploadIds)) {
        const upload = await ensureUploadExists(uploadId, businessAccountId);
        if (!upload) {
          await db().exec('ROLLBACK');
          return res.status(404).json({ error: 'Una imagen de galeria no pertenece a este negocio' });
        }
      }
    }

    const priceCents =
      req.body.price !== undefined || req.body.price_cents !== undefined
        ? parsePriceCents(req.body)
        : null;

    if (priceCents !== null && priceCents < 0) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'El precio del producto es inválido' });
    }

    const updates = [];
    const updateParams = [];

    if (hasOwnProperty(req.body, 'name')) {
      updates.push('name = ?');
      updateParams.push(req.body.name ? String(req.body.name).trim() : existingProduct.name);
    }

    if (hasOwnProperty(req.body, 'description')) {
      updates.push('description = ?');
      updateParams.push(req.body.description || null);
    }

    if (priceCents !== null) {
      updates.push('price_cents = ?');
      updateParams.push(priceCents);
    }

    if (hasOwnProperty(req.body, 'status')) {
      updates.push('status = ?');
      updateParams.push(req.body.status || existingProduct.status);
    }

    if (hasOwnProperty(req.body, 'category_id')) {
      updates.push('category_id = ?');
      updateParams.push(req.body.category_id ? parseInteger(req.body.category_id, null) : null);
    }

    if (hasOwnProperty(req.body, 'primary_image_upload_id')) {
      updates.push('primary_image_upload_id = ?');
      updateParams.push(
        req.body.primary_image_upload_id
          ? parseInteger(req.body.primary_image_upload_id, null)
          : null
      );
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');

      await db().run(
        `
          UPDATE products
          SET ${updates.join(', ')}
          WHERE id = ? AND business_account_id = ?
        `,
        [...updateParams, id, businessAccountId]
      );
    }

    if (Array.isArray(galleryUploadIds)) {
      await replaceProductImages(id, sanitizeUploadIds(galleryUploadIds));
    }

    await db().exec('COMMIT');

    const product = await getProductById(id, businessAccountId);
    res.json(product);
  } catch (error) {
    await db().exec('ROLLBACK');
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/menus/options', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const menus = await db().all(
      `
        SELECT id, name, status
        FROM menus
        WHERE business_account_id = ? AND status IN ('active', 'draft')
        ORDER BY updated_at DESC, id DESC
      `,
      [businessAccountId]
    );

    res.json(menus);
  } catch (error) {
    console.error('Error al obtener opciones de menú:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/menus', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const page = Math.max(parseInteger(req.query.page, 1), 1);
    const limit = Math.min(Math.max(parseInteger(req.query.limit, 12), 1), 100);
    const offset = (page - 1) * limit;
    const conditions = ['m.business_account_id = ?'];
    const params = [businessAccountId];

    if (req.query.status && MENU_STATUSES.includes(req.query.status)) {
      conditions.push('m.status = ?');
      params.push(req.query.status);
    }

    if (req.query.search && String(req.query.search).trim()) {
      const searchValue = `%${String(req.query.search).trim()}%`;
      conditions.push('(m.name LIKE ? OR m.local_name LIKE ? OR m.slug LIKE ?)');
      params.push(searchValue, searchValue, searchValue);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = await db().get(
      `
        SELECT COUNT(*) AS count
        FROM menus m
        ${whereClause}
      `,
      params
    );

    const menus = await db().all(
      `
        SELECT
          m.*,
          COUNT(mb.id) AS blocks_count
        FROM menus m
        LEFT JOIN menu_blocks mb ON mb.menu_id = m.id
        ${whereClause}
        GROUP BY m.id
        ORDER BY m.updated_at DESC, m.id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({
      data: menus.map((menu) => ({
        ...menu,
        settings: parseJsonField(menu.settings, {})
      })),
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.max(Math.ceil(total.count / limit), 1)
      }
    });
  } catch (error) {
    console.error('Error al obtener menús:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/menus/:id', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const menu = await getMenuById(req.params.id, businessAccountId);

    if (!menu) {
      return res.status(404).json({ error: 'Menu no encontrado' });
    }

    res.json(menu);
  } catch (error) {
    console.error('Error al obtener menú:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/menus', async (req, res) => {
  await db().exec('BEGIN');

  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      await db().exec('ROLLBACK');
      return;
    }

    const {
      name,
      local_name: localName,
      logo_upload_id: logoUploadId,
      status = 'draft',
      theme_key: themeKey = 'style-1',
      settings = {},
      blocks = []
    } = req.body;

    if (!name || !String(name).trim()) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'El nombre del menú es requerido' });
    }

    if (!MENU_STATUSES.includes(status)) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'Estado de menú inválido' });
    }

    if (!MENU_THEME_KEYS.includes(themeKey)) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'Tema de menú inválido' });
    }

    if (logoUploadId) {
      const upload = await ensureUploadExists(parseInteger(logoUploadId, null), businessAccountId);
      if (!upload) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'Logo no encontrado para este negocio' });
      }
    }

    const slug = await generateUniqueSlug('menus', name);

    const result = await db().run(
      `
        INSERT INTO menus (
          business_account_id,
          name,
          local_name,
          slug,
          logo_upload_id,
          status,
          theme_key,
          settings
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        businessAccountId,
        String(name).trim(),
        localName || null,
        slug,
        logoUploadId ? parseInteger(logoUploadId, null) : null,
        status,
        themeKey,
        stringifyJsonField(settings, {})
      ]
    );

    await replaceMenuBlocks(result.lastID, blocks);
    await db().exec('COMMIT');

    const menu = await getMenuById(result.lastID, businessAccountId);
    res.status(201).json(menu);
  } catch (error) {
    await db().exec('ROLLBACK');
    console.error('Error al crear menú:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

router.put('/menus/:id', async (req, res) => {
  await db().exec('BEGIN');

  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      await db().exec('ROLLBACK');
      return;
    }

    const existingMenu = await db().get(
      'SELECT * FROM menus WHERE id = ? AND business_account_id = ?',
      [req.params.id, businessAccountId]
    );

    if (!existingMenu) {
      await db().exec('ROLLBACK');
      return res.status(404).json({ error: 'Menú no encontrado' });
    }

    const {
      name,
      local_name: localName,
      logo_upload_id: logoUploadId,
      status,
      theme_key: themeKey,
      settings,
      blocks
    } = req.body;

    if (status && !MENU_STATUSES.includes(status)) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'Estado de menú inválido' });
    }

    if (themeKey && !MENU_THEME_KEYS.includes(themeKey)) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'Tema de menú inválido' });
    }

    if (hasOwnProperty(req.body, 'logo_upload_id') && logoUploadId) {
      const upload = await ensureUploadExists(parseInteger(logoUploadId, null), businessAccountId);
      if (!upload) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'Logo no encontrado para este negocio' });
      }
    }

    await db().run(
      `
        UPDATE menus
        SET
          name = COALESCE(?, name),
          local_name = ?,
          logo_upload_id = ?,
          status = COALESCE(?, status),
          theme_key = COALESCE(?, theme_key),
          settings = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND business_account_id = ?
      `,
      [
        name ? String(name).trim() : null,
        hasOwnProperty(req.body, 'local_name') ? localName || null : existingMenu.local_name,
        hasOwnProperty(req.body, 'logo_upload_id')
          ? logoUploadId
            ? parseInteger(logoUploadId, null)
            : null
          : existingMenu.logo_upload_id,
        status || null,
        themeKey || null,
        stringifyJsonField(
          hasOwnProperty(req.body, 'settings') ? settings : parseJsonField(existingMenu.settings, {}),
          {}
        ),
        req.params.id,
        businessAccountId
      ]
    );

    if (Array.isArray(blocks)) {
      await replaceMenuBlocks(req.params.id, blocks);
    }

    await db().exec('COMMIT');

    const menu = await getMenuById(req.params.id, businessAccountId);
    res.json(menu);
  } catch (error) {
    await db().exec('ROLLBACK');
    console.error('Error al actualizar menú:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

router.delete('/menus/:id', async (req, res) => {
  await db().exec('BEGIN');

  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      await db().exec('ROLLBACK');
      return;
    }

    const existingMenu = await db().get(
      'SELECT id, name FROM menus WHERE id = ? AND business_account_id = ?',
      [req.params.id, businessAccountId]
    );

    if (!existingMenu) {
      await db().exec('ROLLBACK');
      return res.status(404).json({ error: 'Menú no encontrado' });
    }

    await db().run('DELETE FROM menus WHERE id = ? AND business_account_id = ?', [
      req.params.id,
      businessAccountId
    ]);
    await db().exec('COMMIT');

    res.json({
      success: true,
      deleted_id: Number(req.params.id),
      deleted_name: existingMenu.name
    });
  } catch (error) {
    await db().exec('ROLLBACK');
    console.error('Error al eliminar menu:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

router.get('/promotions', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const page = Math.max(parseInteger(req.query.page, 1), 1);
    const limit = Math.min(Math.max(parseInteger(req.query.limit, 12), 1), 100);
    const offset = (page - 1) * limit;
    const conditions = ['pr.business_account_id = ?'];
    const params = [businessAccountId];

    if (req.query.status && PROMOTION_STATUSES.includes(req.query.status)) {
      conditions.push('pr.status = ?');
      params.push(req.query.status);
    }

    if (req.query.search && String(req.query.search).trim()) {
      const searchValue = `%${String(req.query.search).trim()}%`;
      conditions.push(
        '(pr.name LIKE ? OR pr.conditions_text LIKE ? OR target.name LIKE ? OR combo_target.name LIKE ? OR trigger.name LIKE ?)'
      );
      params.push(searchValue, searchValue, searchValue, searchValue, searchValue);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = await db().get(
      `
        SELECT COUNT(*) AS count
        FROM promotions pr
        LEFT JOIN products target ON target.id = pr.target_product_id
        LEFT JOIN combos combo_target ON combo_target.id = pr.target_combo_id
        LEFT JOIN products trigger ON trigger.id = pr.trigger_product_id
        ${whereClause}
      `,
      params
    );

    const promotions = await db().all(
      `
        SELECT
          pr.*,
          target.name AS target_product_name,
          combo_target.name AS target_combo_name,
          trigger.name AS trigger_product_name
        FROM promotions pr
        LEFT JOIN products target ON target.id = pr.target_product_id
        LEFT JOIN combos combo_target ON combo_target.id = pr.target_combo_id
        LEFT JOIN products trigger ON trigger.id = pr.trigger_product_id
        ${whereClause}
        ORDER BY pr.updated_at DESC, pr.id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({
      data: promotions,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.max(Math.ceil(total.count / limit), 1)
      }
    });
  } catch (error) {
    console.error('Error al obtener promociones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/promotions', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const {
      name,
      type,
      status = 'active',
      target_product_id: targetProductId,
      target_combo_id: targetComboId,
      trigger_product_id: triggerProductId,
      discount_percentage: discountPercentage,
      minimum_spend: minimumSpend,
      minimum_spend_cents: minimumSpendCents,
      description,
      conditions_text: conditionsText,
      has_countdown: hasCountdown = 0,
      starts_at: startsAt,
      ends_at: endsAt,
      no_expiration: noExpiration = 0
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'El nombre de la promoción es requerido' });
    }

    if (!PROMOTION_TYPES.includes(type)) {
      return res.status(400).json({ error: 'El tipo de promoción es inválido' });
    }

    if (!PROMOTION_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'El estado de la promoción es inválido' });
    }

    const resolvedTargetProductId = parseInteger(targetProductId, null);
    const resolvedTargetComboId = parseInteger(targetComboId, null);

    if ((!resolvedTargetProductId && !resolvedTargetComboId) || (resolvedTargetProductId && resolvedTargetComboId)) {
      return res.status(400).json({ error: 'Debes seleccionar un producto para la promoción' });
    }

    if (resolvedTargetProductId) {
      const targetProduct = await ensureProductExists(resolvedTargetProductId, businessAccountId);
      if (!targetProduct) {
        return res.status(404).json({ error: 'Producto objetivo no encontrado' });
      }
    }

    if (resolvedTargetComboId) {
      const targetCombo = await ensureComboExists(resolvedTargetComboId, businessAccountId);
      if (!targetCombo) {
        return res.status(404).json({ error: 'Combo objetivo no encontrado' });
      }
    }

    if (triggerProductId) {
      const triggerProduct = await ensureProductExists(parseInteger(triggerProductId, null), businessAccountId);
      if (!triggerProduct) {
        return res.status(404).json({ error: 'Producto disparador no encontrado' });
      }
    }

    const resolvedMinimumSpendCents =
      minimumSpendCents !== undefined
        ? parseInteger(minimumSpendCents, null)
        : parseMoneyFieldToCents(minimumSpend);

    const result = await db().run(
      `
        INSERT INTO promotions (
          business_account_id,
          name,
          type,
          status,
          target_product_id,
          target_combo_id,
          trigger_product_id,
          discount_percentage,
          minimum_spend_cents,
          description,
          conditions_text,
          has_countdown,
          starts_at,
          ends_at,
          no_expiration
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        businessAccountId,
        String(name).trim(),
        type,
        status,
        resolvedTargetProductId,
        resolvedTargetComboId,
        triggerProductId ? parseInteger(triggerProductId, null) : null,
        discountPercentage !== undefined && discountPercentage !== ''
          ? Number(discountPercentage)
          : null,
        resolvedMinimumSpendCents,
        description || null,
        conditionsText || null,
        hasCountdown ? 1 : 0,
        normalizeDateTime(startsAt),
        noExpiration ? null : normalizeDateTime(endsAt),
        noExpiration ? 1 : 0
      ]
    );

    const promotion = await getPromotionById(result.lastID, businessAccountId);
    res.status(201).json(promotion);
  } catch (error) {
    console.error('Error al crear promoción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/promotions/:id', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const promotion = await getPromotionById(req.params.id, businessAccountId);

    if (!promotion) {
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    res.json(promotion);
  } catch (error) {
    console.error('Error al obtener promoción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/promotions/:id', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const existingPromotion = await db().get(
      'SELECT * FROM promotions WHERE id = ? AND business_account_id = ?',
      [req.params.id, businessAccountId]
    );

    if (!existingPromotion) {
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    const {
      name,
      type,
      status,
      target_product_id: targetProductId,
      target_combo_id: targetComboId,
      trigger_product_id: triggerProductId,
      discount_percentage: discountPercentage,
      minimum_spend,
      minimum_spend_cents: minimumSpendCents,
      description,
      conditions_text: conditionsText,
      has_countdown: hasCountdown,
      starts_at: startsAt,
      ends_at: endsAt,
      no_expiration: noExpiration
    } = req.body;

    if (type && !PROMOTION_TYPES.includes(type)) {
      return res.status(400).json({ error: 'El tipo de promoción es inválido' });
    }

    if (status && !PROMOTION_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'El estado de la promoción es inválido' });
    }

    const resolvedTargetProductId = hasOwnProperty(req.body, 'target_product_id')
      ? parseInteger(targetProductId, null)
      : existingPromotion.target_product_id;
    const resolvedTargetComboId = hasOwnProperty(req.body, 'target_combo_id')
      ? parseInteger(targetComboId, null)
      : existingPromotion.target_combo_id;

    if ((!resolvedTargetProductId && !resolvedTargetComboId) || (resolvedTargetProductId && resolvedTargetComboId)) {
      return res.status(400).json({ error: 'Debes seleccionar un producto para la promoción' });
    }

    if (resolvedTargetProductId) {
      const targetProduct = await ensureProductExists(resolvedTargetProductId, businessAccountId);
      if (!targetProduct) {
        return res.status(404).json({ error: 'Producto objetivo no encontrado' });
      }
    }

    if (resolvedTargetComboId) {
      const targetCombo = await ensureComboExists(resolvedTargetComboId, businessAccountId);
      if (!targetCombo) {
        return res.status(404).json({ error: 'Combo objetivo no encontrado' });
      }
    }

    const resolvedTriggerProductId = hasOwnProperty(req.body, 'trigger_product_id')
      ? triggerProductId
        ? parseInteger(triggerProductId, null)
        : null
      : existingPromotion.trigger_product_id;

    if (resolvedTriggerProductId) {
      const triggerProduct = await ensureProductExists(resolvedTriggerProductId, businessAccountId);
      if (!triggerProduct) {
        return res.status(404).json({ error: 'Producto disparador no encontrado' });
      }
    }

    const resolvedMinimumSpendCents = hasOwnProperty(req.body, 'minimum_spend_cents')
      ? parseInteger(minimumSpendCents, null)
      : hasOwnProperty(req.body, 'minimum_spend')
        ? parseMoneyFieldToCents(minimumSpend)
        : existingPromotion.minimum_spend_cents;

    await db().run(
      `
        UPDATE promotions
        SET
          name = COALESCE(?, name),
          type = COALESCE(?, type),
          status = COALESCE(?, status),
          target_product_id = ?,
          target_combo_id = ?,
          trigger_product_id = ?,
          discount_percentage = ?,
          minimum_spend_cents = ?,
          description = ?,
          conditions_text = ?,
          has_countdown = ?,
          starts_at = ?,
          ends_at = ?,
          no_expiration = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND business_account_id = ?
      `,
      [
        name ? String(name).trim() : null,
        type || null,
        status || null,
        resolvedTargetProductId,
        resolvedTargetComboId,
        resolvedTriggerProductId,
        hasOwnProperty(req.body, 'discount_percentage')
          ? discountPercentage !== ''
            ? Number(discountPercentage)
            : null
          : existingPromotion.discount_percentage,
        resolvedMinimumSpendCents,
        hasOwnProperty(req.body, 'description') ? description || null : existingPromotion.description,
        hasOwnProperty(req.body, 'conditions_text')
          ? conditionsText || null
          : existingPromotion.conditions_text,
        hasOwnProperty(req.body, 'has_countdown') ? (hasCountdown ? 1 : 0) : existingPromotion.has_countdown,
        hasOwnProperty(req.body, 'starts_at')
          ? normalizeDateTime(startsAt)
          : existingPromotion.starts_at,
        hasOwnProperty(req.body, 'ends_at')
          ? noExpiration
            ? null
            : normalizeDateTime(endsAt)
          : existingPromotion.ends_at,
        hasOwnProperty(req.body, 'no_expiration')
          ? noExpiration
            ? 1
            : 0
          : existingPromotion.no_expiration,
        req.params.id,
        businessAccountId
      ]
    );

    const promotion = await getPromotionById(req.params.id, businessAccountId);
    res.json(promotion);
  } catch (error) {
    console.error('Error al actualizar promoción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/combos', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const page = Math.max(parseInteger(req.query.page, 1), 1);
    const limit = Math.min(Math.max(parseInteger(req.query.limit, 12), 1), 100);
    const offset = (page - 1) * limit;
    const conditions = ['c.business_account_id = ?'];
    const params = [businessAccountId];

    if (req.query.status && LINKABLE_STATUSES.includes(req.query.status)) {
      conditions.push('c.status = ?');
      params.push(req.query.status);
    }

    if (req.query.search && String(req.query.search).trim()) {
      const searchValue = `%${String(req.query.search).trim()}%`;
      conditions.push('(c.name LIKE ? OR c.description LIKE ? OR c.conditions_text LIKE ?)');
      params.push(searchValue, searchValue, searchValue);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = await db().get(
      `
        SELECT COUNT(*) AS count
        FROM combos c
        ${whereClause}
      `,
      params
    );

    const itemsSummarySql = getComboItemsSummarySql();

    const combos = await db().all(
      `
        SELECT
          c.*,
          COUNT(DISTINCT ci.product_id) AS items_count,
          ${itemsSummarySql} AS items_summary,
          COUNT(DISTINCT cmv.menu_id) AS visible_in_menus
        FROM combos c
        LEFT JOIN combo_items ci ON ci.combo_id = c.id
        LEFT JOIN products p ON p.id = ci.product_id
        LEFT JOIN combo_menu_visibility cmv ON cmv.combo_id = c.id
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.updated_at DESC, c.id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({
      data: combos.map((combo) => ({
        ...combo,
        combo_price: formatPrice(combo.combo_price_cents)
      })),
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.max(Math.ceil(total.count / limit), 1)
      }
    });
  } catch (error) {
    console.error('Error al obtener combos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/combos', async (req, res) => {
  await db().exec('BEGIN');

  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      await db().exec('ROLLBACK');
      return;
    }

    const {
      name,
      description,
      conditions_text: conditionsText,
      combo_price,
      combo_price_cents: comboPriceCents,
      status = 'active',
      image_upload_id: imageUploadId,
      starts_at: startsAt,
      ends_at: endsAt,
      no_expiration: noExpiration = 0,
      has_countdown: hasCountdown = 0,
      product_ids: productIds = [],
      menu_ids: menuIds = []
    } = req.body;

    if (!name || !String(name).trim()) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'El nombre del combo es requerido' });
    }

    if (!LINKABLE_STATUSES.includes(status)) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'El estado del combo es inválido' });
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'Debes seleccionar al menos un producto para el combo' });
    }

    const resolvedComboPriceCents =
      comboPriceCents !== undefined
        ? parseInteger(comboPriceCents, null)
        : parseMoneyFieldToCents(combo_price);

    if (resolvedComboPriceCents === null || resolvedComboPriceCents < 0) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'El precio del combo es inválido' });
    }

    for (const productId of productIds) {
      const product = await ensureProductExists(parseInteger(productId, null), businessAccountId);
      if (!product) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: `Producto ${productId} no encontrado` });
      }
    }

    for (const menuId of menuIds) {
      const menu = await ensureMenuExists(parseInteger(menuId, null), businessAccountId);
      if (!menu) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: `Menú ${menuId} no encontrado` });
      }
    }

    if (imageUploadId) {
      const upload = await ensureUploadExists(parseInteger(imageUploadId, null), businessAccountId);
      if (!upload) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'La imagen del combo no pertenece a este negocio' });
      }
    }

    const result = await db().run(
      `
        INSERT INTO combos (
          business_account_id,
          name,
          description,
          conditions_text,
          combo_price_cents,
          status,
          image_upload_id,
          starts_at,
          ends_at,
          has_countdown,
          no_expiration
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        businessAccountId,
        String(name).trim(),
        description || null,
        conditionsText || null,
        resolvedComboPriceCents,
        status,
        imageUploadId ? parseInteger(imageUploadId, null) : null,
        normalizeDateTime(startsAt),
        noExpiration ? null : normalizeDateTime(endsAt),
        noExpiration ? 0 : hasCountdown ? 1 : 0,
        noExpiration ? 1 : 0
      ]
    );

    await syncComboItems(result.lastID, sanitizeUploadIds(productIds));
    await syncComboMenuVisibility(result.lastID, sanitizeUploadIds(menuIds));
    await db().exec('COMMIT');

    const combo = await getComboById(result.lastID, businessAccountId);
    res.status(201).json(combo);
  } catch (error) {
    await db().exec('ROLLBACK');
    console.error('Error al crear combo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/combos/:id', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const combo = await getComboById(req.params.id, businessAccountId);

    if (!combo) {
      return res.status(404).json({ error: 'Combo no encontrado' });
    }

    res.json(combo);
  } catch (error) {
    console.error('Error al obtener combo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/combos/:id', async (req, res) => {
  await db().exec('BEGIN');

  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      await db().exec('ROLLBACK');
      return;
    }

    const existingCombo = await db().get(
      'SELECT * FROM combos WHERE id = ? AND business_account_id = ?',
      [req.params.id, businessAccountId]
    );

    if (!existingCombo) {
      await db().exec('ROLLBACK');
      return res.status(404).json({ error: 'Combo no encontrado' });
    }

    const {
      name,
      description,
      conditions_text: conditionsText,
      combo_price,
      combo_price_cents: comboPriceCents,
      status,
      image_upload_id: imageUploadId,
      starts_at: startsAt,
      ends_at: endsAt,
      no_expiration: noExpiration,
      has_countdown: hasCountdown,
      product_ids: productIds,
      menu_ids: menuIds
    } = req.body;

    if (status && !LINKABLE_STATUSES.includes(status)) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'El estado del combo es inválido' });
    }

    const normalizedProductIds = Array.isArray(productIds)
      ? sanitizeUploadIds(productIds)
      : null;
    const normalizedMenuIds = Array.isArray(menuIds) ? sanitizeUploadIds(menuIds) : null;

    if (normalizedProductIds && normalizedProductIds.length === 0) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'Debes seleccionar al menos un producto para el combo' });
    }

    if (normalizedProductIds) {
      for (const productId of normalizedProductIds) {
        const product = await ensureProductExists(productId, businessAccountId);
        if (!product) {
          await db().exec('ROLLBACK');
          return res.status(404).json({ error: `Producto ${productId} no encontrado` });
        }
      }
    }

    if (normalizedMenuIds) {
      for (const menuId of normalizedMenuIds) {
        const menu = await ensureMenuExists(menuId, businessAccountId);
        if (!menu) {
          await db().exec('ROLLBACK');
          return res.status(404).json({ error: `Menú ${menuId} no encontrado` });
        }
      }
    }

    if (hasOwnProperty(req.body, 'image_upload_id') && imageUploadId) {
      const upload = await ensureUploadExists(parseInteger(imageUploadId, null), businessAccountId);
      if (!upload) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'La imagen del combo no pertenece a este negocio' });
      }
    }

    const resolvedComboPriceCents = hasOwnProperty(req.body, 'combo_price_cents')
      ? parseInteger(comboPriceCents, null)
      : hasOwnProperty(req.body, 'combo_price')
        ? parseMoneyFieldToCents(combo_price)
        : existingCombo.combo_price_cents;

    if (resolvedComboPriceCents === null || resolvedComboPriceCents < 0) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'El precio del combo es inválido' });
    }

    await db().run(
      `
        UPDATE combos
        SET
          name = COALESCE(?, name),
          description = ?,
          conditions_text = ?,
          combo_price_cents = ?,
          status = COALESCE(?, status),
          image_upload_id = ?,
          starts_at = ?,
          ends_at = ?,
          has_countdown = ?,
          no_expiration = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        name ? String(name).trim() : null,
        hasOwnProperty(req.body, 'description') ? description || null : existingCombo.description,
        hasOwnProperty(req.body, 'conditions_text')
          ? conditionsText || null
          : existingCombo.conditions_text,
        resolvedComboPriceCents,
        status || null,
        hasOwnProperty(req.body, 'image_upload_id')
          ? imageUploadId
            ? parseInteger(imageUploadId, null)
            : null
          : existingCombo.image_upload_id,
        hasOwnProperty(req.body, 'starts_at')
          ? normalizeDateTime(startsAt)
          : existingCombo.starts_at,
        hasOwnProperty(req.body, 'ends_at')
          ? noExpiration
            ? null
            : normalizeDateTime(endsAt)
          : existingCombo.ends_at,
        hasOwnProperty(req.body, 'has_countdown')
          ? noExpiration
            ? 0
            : hasCountdown
              ? 1
              : 0
          : existingCombo.has_countdown,
        hasOwnProperty(req.body, 'no_expiration')
          ? noExpiration
            ? 1
            : 0
          : existingCombo.no_expiration,
        req.params.id,
        businessAccountId
      ]
    );

    if (normalizedProductIds) {
      await syncComboItems(req.params.id, normalizedProductIds);
    }

    if (normalizedMenuIds) {
      await syncComboMenuVisibility(req.params.id, normalizedMenuIds);
    }

    await db().exec('COMMIT');

    const combo = await getComboById(req.params.id, businessAccountId);
    res.json(combo);
  } catch (error) {
    await db().exec('ROLLBACK');
    console.error('Error al actualizar combo:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

router.get('/links', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const page = Math.max(parseInteger(req.query.page, 1), 1);
    const limit = Math.min(Math.max(parseInteger(req.query.limit, 12), 1), 100);
    const offset = (page - 1) * limit;
    const conditions = ['pl.business_account_id = ?'];
    const params = [businessAccountId];

    if (req.query.status && LINK_STATUSES.includes(req.query.status)) {
      conditions.push('pl.status = ?');
      params.push(req.query.status);
    }

    if (req.query.search && String(req.query.search).trim()) {
      const searchValue = `%${String(req.query.search).trim()}%`;
      conditions.push('(pl.name LIKE ? OR pl.description LIKE ? OR pl.slug LIKE ?)');
      params.push(searchValue, searchValue, searchValue);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = await db().get(
      `
        SELECT COUNT(*) AS count
        FROM persistent_links pl
        ${whereClause}
      `,
      params
    );

    const links = await db().all(
      `
        SELECT
          pl.*,
          m.name AS default_menu_name,
          COUNT(lsr.id) AS rules_count
        FROM persistent_links pl
        LEFT JOIN menus m ON m.id = pl.default_menu_id
        LEFT JOIN link_schedule_rules lsr ON lsr.persistent_link_id = pl.id AND lsr.is_active = 1
        ${whereClause}
        GROUP BY pl.id, m.name
        ORDER BY pl.updated_at DESC, pl.id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({
      data: links.map((link) => ({
        ...link,
        qr_config: parseJsonField(link.qr_config, {})
      })),
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.max(Math.ceil(total.count / limit), 1)
      }
    });
  } catch (error) {
    console.error('Error al obtener links persistentes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/links/:id', async (req, res) => {
  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      return;
    }

    const link = await getPersistentLinkById(req.params.id, businessAccountId);

    if (!link) {
      return res.status(404).json({ error: 'Link persistente no encontrado' });
    }

    res.json(link);
  } catch (error) {
    console.error('Error al obtener link persistente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/links', async (req, res) => {
  await db().exec('BEGIN');

  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      await db().exec('ROLLBACK');
      return;
    }

    const {
      name,
      description,
      default_menu_id: defaultMenuId,
      manual_menu_id: manualMenuId,
      manual_override_active: manualOverrideActive = 0,
      status = 'active',
      qr_config: qrConfig = {},
      rules = []
    } = req.body;

    if (!name || !String(name).trim()) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'El nombre del link es requerido' });
    }

    if (!LINK_STATUSES.includes(status)) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'Estado de link inválido' });
    }

    if (defaultMenuId) {
      const defaultMenu = await ensureMenuExists(defaultMenuId, businessAccountId);
      if (!defaultMenu) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'El menú por defecto no existe' });
      }
    }

    if (manualMenuId) {
      const manualMenu = await ensureMenuExists(manualMenuId, businessAccountId);
      if (!manualMenu) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'El menú manual no existe' });
      }
    }

    const normalizedRules = await validateScheduleRules(rules, businessAccountId);
    const slug = await generateUniqueSlug('persistent_links', name);

    const result = await db().run(
      `
        INSERT INTO persistent_links (
          business_account_id,
          name,
          description,
          slug,
          default_menu_id,
          manual_menu_id,
          manual_override_active,
          status,
          qr_config
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        businessAccountId,
        String(name).trim(),
        description || null,
        slug,
        defaultMenuId ? parseInteger(defaultMenuId, null) : null,
        manualMenuId ? parseInteger(manualMenuId, null) : null,
        manualOverrideActive ? 1 : 0,
        status,
        stringifyJsonField(qrConfig, {})
      ]
    );

    await replaceLinkRules(result.lastID, normalizedRules);
    await db().exec('COMMIT');

    const link = await getPersistentLinkById(result.lastID, businessAccountId);
    res.status(201).json(link);
  } catch (error) {
    await db().exec('ROLLBACK');
    console.error('Error al crear link persistente:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

router.put('/links/:id', async (req, res) => {
  await db().exec('BEGIN');

  try {
    const businessAccountId = await requireScopedBusinessAccountId(req, res);
    if (!businessAccountId) {
      await db().exec('ROLLBACK');
      return;
    }

    const existingLink = await db().get(
      'SELECT * FROM persistent_links WHERE id = ? AND business_account_id = ?',
      [req.params.id, businessAccountId]
    );

    if (!existingLink) {
      await db().exec('ROLLBACK');
      return res.status(404).json({ error: 'Link persistente no encontrado' });
    }

    const {
      name,
      description,
      default_menu_id: defaultMenuId,
      manual_menu_id: manualMenuId,
      manual_override_active: manualOverrideActive,
      status,
      qr_config: qrConfig,
      rules
    } = req.body;

    if (status && !LINK_STATUSES.includes(status)) {
      await db().exec('ROLLBACK');
      return res.status(400).json({ error: 'Estado de link inválido' });
    }

    if (defaultMenuId) {
      const defaultMenu = await ensureMenuExists(defaultMenuId, businessAccountId);
      if (!defaultMenu) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'El menú por defecto no existe' });
      }
    }

    if (manualMenuId) {
      const manualMenu = await ensureMenuExists(manualMenuId, businessAccountId);
      if (!manualMenu) {
        await db().exec('ROLLBACK');
        return res.status(404).json({ error: 'El menú manual no existe' });
      }
    }

    const normalizedRules = Array.isArray(rules)
      ? await validateScheduleRules(rules, businessAccountId)
      : null;

    await db().run(
      `
        UPDATE persistent_links
        SET
          name = COALESCE(?, name),
          description = ?,
          default_menu_id = ?,
          manual_menu_id = ?,
          manual_override_active = ?,
          status = COALESCE(?, status),
          qr_config = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND business_account_id = ?
      `,
      [
        name ? String(name).trim() : null,
        hasOwnProperty(req.body, 'description') ? description || null : existingLink.description,
        hasOwnProperty(req.body, 'default_menu_id')
          ? defaultMenuId
            ? parseInteger(defaultMenuId, null)
            : null
          : existingLink.default_menu_id,
        hasOwnProperty(req.body, 'manual_menu_id')
          ? manualMenuId
            ? parseInteger(manualMenuId, null)
            : null
          : existingLink.manual_menu_id,
        hasOwnProperty(req.body, 'manual_override_active')
          ? manualOverrideActive
            ? 1
            : 0
          : existingLink.manual_override_active,
        status || null,
        stringifyJsonField(
          hasOwnProperty(req.body, 'qr_config') ? qrConfig : parseJsonField(existingLink.qr_config, {}),
          {}
        ),
        req.params.id,
        businessAccountId
      ]
    );

    if (normalizedRules) {
      await replaceLinkRules(req.params.id, normalizedRules);
    }

    await db().exec('COMMIT');

    const link = await getPersistentLinkById(req.params.id, businessAccountId);
    res.json(link);
  } catch (error) {
    await db().exec('ROLLBACK');
    console.error('Error al actualizar link persistente:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

module.exports = router;
