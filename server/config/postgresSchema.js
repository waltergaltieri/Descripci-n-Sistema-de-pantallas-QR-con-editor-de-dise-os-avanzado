const PUBLIC_RLS_TABLES = [
  'super_admin_users',
  'business_accounts',
  'business_users',
  'billing_profiles',
  'billing_events',
  'users',
  'designs',
  'screens',
  'uploads',
  'categories',
  'products',
  'combos',
  'promotions',
  'business_profile',
  'design_assignments',
  'product_images',
  'combo_items',
  'menus',
  'menu_blocks',
  'combo_menu_visibility',
  'persistent_links',
  'link_schedule_rules',
  'menu_views'
];

const getPostgresSchemaStatements = () => [
  `
    CREATE TABLE IF NOT EXISTS super_admin_users (
      id BIGSERIAL PRIMARY KEY,
      supabase_user_id UUID UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS business_accounts (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      legal_name TEXT,
      address TEXT,
      contact_phone TEXT,
      contact_person TEXT,
      contact_email TEXT,
      description TEXT,
      timezone TEXT NOT NULL DEFAULT 'America/Buenos_Aires',
      currency_code TEXT NOT NULL DEFAULT 'ARS',
      access_status TEXT NOT NULL DEFAULT 'active' CHECK(access_status IN ('active', 'suspended', 'inactive')),
      commercial_status TEXT NOT NULL DEFAULT 'current' CHECK(commercial_status IN ('current', 'due_soon', 'overdue')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS business_users (
      id BIGSERIAL PRIMARY KEY,
      business_account_id BIGINT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      supabase_user_id UUID UNIQUE NOT NULL,
      email TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'owner' CHECK(role IN ('owner', 'manager', 'editor')),
      is_active INTEGER DEFAULT 1,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS billing_profiles (
      id BIGSERIAL PRIMARY KEY,
      business_account_id BIGINT NOT NULL UNIQUE REFERENCES business_accounts(id) ON DELETE CASCADE,
      first_payment_date DATE,
      billing_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK(billing_amount_cents >= 0),
      billing_currency_code TEXT NOT NULL DEFAULT 'ARS',
      billing_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK(billing_frequency IN ('monthly')),
      last_payment_marked_at TIMESTAMPTZ,
      next_due_date DATE,
      reminder_days_before INTEGER NOT NULL DEFAULT 7,
      manual_hold INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS billing_events (
      id BIGSERIAL PRIMARY KEY,
      business_account_id BIGINT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL CHECK(event_type IN ('payment_marked', 'access_activated', 'access_suspended', 'access_inactivated', 'note_added')),
      amount_cents INTEGER,
      event_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_by_super_admin_id BIGINT REFERENCES super_admin_users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS designs (
      id BIGSERIAL PRIMARY KEY,
      business_account_id BIGINT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      thumbnail TEXT,
      is_internal INTEGER DEFAULT 0,
      html_content TEXT,
      separated_svgs TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS screens (
      id BIGSERIAL PRIMARY KEY,
      business_account_id BIGINT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      refresh_interval INTEGER DEFAULT 30,
      width INTEGER DEFAULT 1920,
      height INTEGER DEFAULT 1080,
      design_html TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS uploads (
      id BIGSERIAL PRIMARY KEY,
      business_account_id BIGINT REFERENCES business_accounts(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS categories (
      id BIGSERIAL PRIMARY KEY,
      business_account_id BIGINT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS products (
      id BIGSERIAL PRIMARY KEY,
      business_account_id BIGINT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      price_cents INTEGER NOT NULL DEFAULT 0 CHECK(price_cents >= 0),
      currency_code TEXT NOT NULL DEFAULT 'ARS',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'sold_out')),
      category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
      primary_image_upload_id BIGINT REFERENCES uploads(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS combos (
      id BIGSERIAL PRIMARY KEY,
      business_account_id BIGINT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      conditions_text TEXT,
      combo_price_cents INTEGER NOT NULL DEFAULT 0 CHECK(combo_price_cents >= 0),
      currency_code TEXT NOT NULL DEFAULT 'ARS',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'expired')),
      image_upload_id BIGINT REFERENCES uploads(id) ON DELETE SET NULL,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      no_expiration INTEGER DEFAULT 0,
      has_countdown INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS promotions (
      id BIGSERIAL PRIMARY KEY,
      business_account_id BIGINT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(
        type IN (
          'percentage_discount',
          'two_for_one',
          'second_unit_percentage',
          'free_with_other_product',
          'free_with_minimum_spend',
          'discount_with_minimum_spend'
        )
      ),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'expired')),
      target_product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
      target_combo_id BIGINT REFERENCES combos(id) ON DELETE SET NULL,
      trigger_product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
      discount_percentage REAL,
      minimum_spend_cents INTEGER,
      description TEXT,
      conditions_text TEXT,
      has_countdown INTEGER DEFAULT 0,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      no_expiration INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS business_profile (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Mi Local',
      legal_name TEXT,
      description TEXT,
      logo_upload_id BIGINT REFERENCES uploads(id) ON DELETE SET NULL,
      timezone TEXT NOT NULL DEFAULT 'America/Buenos_Aires',
      currency_code TEXT NOT NULL DEFAULT 'ARS',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS design_assignments (
      id BIGSERIAL PRIMARY KEY,
      screen_id BIGINT REFERENCES screens(id) ON DELETE CASCADE,
      design_id BIGINT REFERENCES designs(id) ON DELETE CASCADE,
      assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(screen_id)
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS product_images (
      id BIGSERIAL PRIMARY KEY,
      product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      upload_id BIGINT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
      sort_order INTEGER DEFAULT 0,
      alt_text TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS combo_items (
      id BIGSERIAL PRIMARY KEY,
      combo_id BIGINT NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
      product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(combo_id, product_id)
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS menus (
      id BIGSERIAL PRIMARY KEY,
      business_account_id BIGINT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      local_name TEXT,
      slug TEXT UNIQUE,
      logo_upload_id BIGINT REFERENCES uploads(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'paused')),
      theme_key TEXT NOT NULL DEFAULT 'style-1',
      settings TEXT NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS menu_blocks (
      id BIGSERIAL PRIMARY KEY,
      menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
      block_type TEXT NOT NULL CHECK(
        block_type IN ('header', 'product', 'category', 'promotion', 'combo', 'separator')
      ),
      title TEXT,
      content TEXT,
      background_type TEXT,
      background_value TEXT,
      text_color TEXT,
      sort_order INTEGER DEFAULT 0,
      config TEXT NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS combo_menu_visibility (
      id BIGSERIAL PRIMARY KEY,
      combo_id BIGINT NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
      menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(combo_id, menu_id)
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS persistent_links (
      id BIGSERIAL PRIMARY KEY,
      business_account_id BIGINT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      slug TEXT NOT NULL UNIQUE,
      default_menu_id BIGINT REFERENCES menus(id) ON DELETE SET NULL,
      manual_menu_id BIGINT REFERENCES menus(id) ON DELETE SET NULL,
      manual_override_active INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused')),
      qr_config TEXT NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS link_schedule_rules (
      id BIGSERIAL PRIMARY KEY,
      persistent_link_id BIGINT NOT NULL REFERENCES persistent_links(id) ON DELETE CASCADE,
      menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
      rule_name TEXT,
      days_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      starts_on DATE,
      ends_on DATE,
      priority INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS menu_views (
      id BIGSERIAL PRIMARY KEY,
      menu_id BIGINT REFERENCES menus(id) ON DELETE SET NULL,
      persistent_link_id BIGINT REFERENCES persistent_links(id) ON DELETE SET NULL,
      resolved_source TEXT,
      user_agent TEXT,
      device_type TEXT,
      requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `,
  'ALTER TABLE business_accounts ADD COLUMN IF NOT EXISTS logo_upload_id BIGINT REFERENCES uploads(id) ON DELETE SET NULL',
  'CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, sort_order)',
  'CREATE INDEX IF NOT EXISTS idx_menu_blocks_menu_order ON menu_blocks(menu_id, sort_order)',
  'CREATE INDEX IF NOT EXISTS idx_link_schedule_rules_link ON link_schedule_rules(persistent_link_id, is_active, start_time, end_time)',
  'CREATE INDEX IF NOT EXISTS idx_menu_views_requested_at ON menu_views(requested_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_business_accounts_access_status ON business_accounts(access_status, commercial_status)',
  'CREATE INDEX IF NOT EXISTS idx_business_users_account ON business_users(business_account_id, is_active)',
  'CREATE INDEX IF NOT EXISTS idx_billing_profiles_due_date ON billing_profiles(next_due_date)',
  'CREATE INDEX IF NOT EXISTS idx_billing_events_account_date ON billing_events(business_account_id, event_date DESC)',
  ...PUBLIC_RLS_TABLES.map(
    (tableName) => `ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY`
  )
];

module.exports = {
  getPostgresSchemaStatements,
  __internals: {
    PUBLIC_RLS_TABLES
  }
};
