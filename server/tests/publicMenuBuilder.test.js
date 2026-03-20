const test = require('node:test');
const assert = require('node:assert/strict');

const { buildPublicMenuBlocks } = require('../utils/publicMenuBuilder');

test('buildPublicMenuBlocks hides paused products and keeps sold out badges', () => {
  const blocks = buildPublicMenuBlocks({
    blocks: [
      {
        id: 1,
        block_type: 'header',
        title: 'Menu desayuno',
        content: 'Sabores del dia',
        config: {}
      },
      {
        id: 2,
        block_type: 'category',
        title: 'Bebidas',
        content: null,
        config: {
          category_id: '10'
        }
      },
      {
        id: 3,
        block_type: 'product',
        title: 'Producto del dia',
        content: null,
        config: {
          product_id: '3'
        }
      }
    ],
    categories: [
      {
        id: 10,
        name: 'Bebidas'
      }
    ],
    products: [
      {
        id: 1,
        name: 'Cafe latte',
        description: 'Con leche',
        category_id: 10,
        price_cents: 2500,
        status: 'active'
      },
      {
        id: 2,
        name: 'Te negro',
        description: 'Hebras',
        category_id: 10,
        price_cents: 2200,
        status: 'paused'
      },
      {
        id: 3,
        name: 'Capuccino',
        description: 'Espuma suave',
        category_id: 10,
        price_cents: 3000,
        status: 'sold_out'
      }
    ],
    promotions: [],
    combos: []
  });

  assert.equal(blocks.length, 3);
  assert.equal(blocks[1].items.length, 2);
  assert.equal(blocks[1].items[0].name, 'Cafe latte');
  assert.equal(blocks[1].items[1].name, 'Capuccino');
  assert.equal(blocks[1].items[1].showSoldOutBadge, true);
  assert.equal(blocks[2].item.name, 'Capuccino');
  assert.equal(blocks[2].item.showSoldOutBadge, true);
});

test('buildPublicMenuBlocks falls back combo image to the first visible product', () => {
  const blocks = buildPublicMenuBlocks({
    blocks: [
      {
        id: 20,
        block_type: 'combo',
        title: 'Combos del dia',
        content: null,
        config: {
          combo_id: '9'
        }
      }
    ],
    categories: [],
    products: [
      {
        id: 1,
        name: 'Cafe latte',
        description: 'Con leche',
        category_id: 10,
        price_cents: 2500,
        primary_image_url: '/uploads/cafe.png',
        status: 'active'
      },
      {
        id: 2,
        name: 'Tostado',
        description: 'Jamon y queso',
        category_id: 10,
        price_cents: 4200,
        primary_image_url: '/uploads/tostado.png',
        status: 'active'
      }
    ],
    promotions: [],
    combos: [
      {
        id: 9,
        name: 'Combo desayuno',
        description: 'Cafe + tostado',
        conditions_text: '',
        image_url: null,
        combo_price_cents: 5900,
        status: 'active',
        items: [
          { product_id: 1 },
          { product_id: 2 }
        ]
      }
    ]
  });

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].item.name, 'Combo desayuno');
  assert.equal(blocks[0].item.image_url, '/uploads/cafe.png');
});

test('buildPublicMenuBlocks preserves combo countdown metadata', () => {
  const blocks = buildPublicMenuBlocks({
    blocks: [
      {
        id: 20,
        block_type: 'combo',
        title: 'Combos del dia',
        content: null,
        config: {
          combo_id: '9'
        }
      }
    ],
    categories: [],
    products: [
      {
        id: 1,
        name: 'Cafe latte',
        description: 'Con leche',
        category_id: 10,
        price_cents: 2500,
        primary_image_url: '/uploads/cafe.png',
        status: 'active'
      },
      {
        id: 2,
        name: 'Tostado',
        description: 'Jamon y queso',
        category_id: 10,
        price_cents: 4200,
        primary_image_url: '/uploads/tostado.png',
        status: 'active'
      }
    ],
    promotions: [],
    combos: [
      {
        id: 9,
        name: 'Combo desayuno',
        description: 'Cafe + tostado',
        conditions_text: '',
        image_url: null,
        combo_price_cents: 5900,
        status: 'active',
        has_countdown: true,
        starts_at: '2030-01-01T08:00:00.000Z',
        ends_at: '2030-01-01T12:00:00.000Z',
        no_expiration: false,
        items: [
          { product_id: 1 },
          { product_id: 2 }
        ]
      }
    ],
    currentDate: new Date('2030-01-01T09:00:00.000Z')
  });

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].item.name, 'Combo desayuno');
  assert.equal(blocks[0].item.has_countdown, true);
  assert.equal(blocks[0].item.ends_at, '2030-01-01T12:00:00.000Z');
});

test('buildPublicMenuBlocks moves promoted products into the promotions area when that block exists', () => {
  const blocks = buildPublicMenuBlocks({
    currentMenuId: 20,
    blocks: [
      {
        id: 1,
        block_type: 'header',
        title: 'Menu principal',
        content: '',
        config: {}
      },
      {
        id: 2,
        block_type: 'category',
        title: 'Bebidas',
        content: '',
        config: {
          category_id: '10'
        }
      },
      {
        id: 3,
        block_type: 'promotion',
        title: 'Promociones',
        content: '',
        config: {}
      },
      {
        id: 4,
        block_type: 'product',
        title: 'Destacado',
        content: '',
        config: {
          product_id: '1'
        }
      }
    ],
    categories: [
      {
        id: 10,
        name: 'Bebidas'
      }
    ],
    products: [
      {
        id: 1,
        name: 'Cafe latte',
        description: 'Con leche',
        category_id: 10,
        price_cents: 2500,
        status: 'active'
      },
      {
        id: 2,
        name: 'Te negro',
        description: 'Hebras',
        category_id: 10,
        price_cents: 2200,
        status: 'active'
      }
    ],
    promotions: [
      {
        id: 90,
        name: 'Happy hour cafe',
        type: 'percentage_discount',
        target_product_id: 1,
        trigger_product_id: null,
        discount_percentage: 20,
        minimum_spend_cents: null,
        conditions_text: 'Solo de 17 a 19',
        has_countdown: false,
        starts_at: null,
        ends_at: null,
        no_expiration: true,
        status: 'active'
      }
    ],
    combos: []
  });

  assert.equal(blocks.length, 3);
  assert.equal(blocks[1].block_type, 'category');
  assert.equal(blocks[1].items.length, 1);
  assert.equal(blocks[1].items[0].name, 'Te negro');
  assert.equal(blocks[2].block_type, 'promotion');
  assert.equal(blocks[2].items.length, 1);
  assert.equal(blocks[2].items[0].target_product.name, 'Cafe latte');
});

test('buildPublicMenuBlocks only keeps combos visible for the current menu', () => {
  const blocks = buildPublicMenuBlocks({
    currentMenuId: 20,
    blocks: [
      {
        id: 1,
        block_type: 'combo',
        title: 'Combos activos',
        content: '',
        config: {}
      }
    ],
    categories: [],
    products: [
      {
        id: 1,
        name: 'Cafe latte',
        description: 'Con leche',
        category_id: 10,
        price_cents: 2500,
        status: 'active'
      },
      {
        id: 2,
        name: 'Medialuna',
        description: 'Manteca',
        category_id: 10,
        price_cents: 1200,
        status: 'active'
      }
    ],
    promotions: [],
    combos: [
      {
        id: 9,
        name: 'Combo desayuno',
        description: '',
        conditions_text: '',
        image_url: null,
        combo_price_cents: 3300,
        status: 'active',
        menu_ids: [20],
        items: [
          { product_id: 1 },
          { product_id: 2 }
        ]
      },
      {
        id: 10,
        name: 'Combo cena',
        description: '',
        conditions_text: '',
        image_url: null,
        combo_price_cents: 5500,
        status: 'active',
        menu_ids: [99],
        items: [
          { product_id: 1 },
          { product_id: 2 }
        ]
      }
    ]
  });

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].items.length, 1);
  assert.equal(blocks[0].items[0].name, 'Combo desayuno');
});

test('buildPublicMenuBlocks moves promoted combos into the promotions area when that block exists', () => {
  const blocks = buildPublicMenuBlocks({
    currentMenuId: 20,
    blocks: [
      {
        id: 1,
        block_type: 'promotion',
        title: 'Promociones',
        content: '',
        config: {}
      },
      {
        id: 2,
        block_type: 'combo',
        title: 'Combos',
        content: '',
        config: {}
      }
    ],
    categories: [],
    products: [
      {
        id: 1,
        name: 'Cafe latte',
        description: 'Con leche',
        category_id: 10,
        price_cents: 2500,
        status: 'active'
      },
      {
        id: 2,
        name: 'Medialuna',
        description: 'Manteca',
        category_id: 10,
        price_cents: 1200,
        status: 'active'
      }
    ],
    promotions: [
      {
        id: 91,
        name: 'Promo combo desayuno',
        type: 'percentage_discount',
        target_product_id: null,
        target_combo_id: 9,
        trigger_product_id: null,
        discount_percentage: 10,
        minimum_spend_cents: null,
        conditions_text: 'Solo sabados',
        has_countdown: false,
        starts_at: null,
        ends_at: null,
        no_expiration: true,
        status: 'active'
      }
    ],
    combos: [
      {
        id: 9,
        name: 'Combo desayuno',
        description: '',
        conditions_text: '',
        image_url: null,
        combo_price_cents: 3300,
        status: 'active',
        menu_ids: [20],
        items: [
          { product_id: 1 },
          { product_id: 2 }
        ]
      }
    ]
  });

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].block_type, 'promotion');
  assert.equal(blocks[0].items.length, 1);
  assert.equal(blocks[0].items[0].target_combo.name, 'Combo desayuno');
});
