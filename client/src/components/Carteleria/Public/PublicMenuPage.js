import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Clock3,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Tag
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { carteleriaService, handleApiError } from '../../../services/api';
import { resolveFileUrl } from '../../../utils/fileUrl';
import {
  buildComboVisualModel,
  buildPromotionVisualModel
} from '../shared/promoComboDisplayStyles';
import { getThemePreset, getThemeTextColors } from '../Menus/themePresets';
import { resolveSeparatorStyles } from '../Menus/separatorBackground';

const sourceLabels = {
  schedule_rule: 'Programacion activa',
  default_menu: 'Menu por defecto',
  manual_override: 'Override manual',
  paused_link: 'Link pausado',
  no_menu: 'Sin menu',
  menu_unavailable: 'Menu no disponible'
};

const formatCurrency = (priceCents = 0, currencyCode = 'ARS') =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currencyCode
  }).format(Number(priceCents || 0) / 100);

const formatRemainingTime = (endsAt, now = new Date()) => {
  const endTime = new Date(endsAt).getTime();
  const currentTime = now.getTime();

  if (Number.isNaN(endTime)) {
    return '';
  }

  const remainingMs = endTime - currentTime;

  if (remainingMs <= 0) {
    return 'Finalizada';
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const blockMatchesSearch = (block, searchTerm) => {
  if (!searchTerm) {
    return true;
  }

  const normalizedSearch = searchTerm.toLowerCase();
  const baseText = [block.title, block.content, block.category?.name, block.item?.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (baseText.includes(normalizedSearch)) {
    return true;
  }

  if (Array.isArray(block.items)) {
    return block.items.some((item) =>
      [item.name, item.description, item.conditions_text]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }

  return false;
};

const itemMatchesSearch = (item, searchTerm) => {
  if (!searchTerm) {
    return true;
  }

  return [
    item.name,
    item.description,
    item.conditions_text,
    item.target_product?.name,
    item.target_product?.description,
    item.target_combo?.name,
    item.target_combo?.description,
    ...(item.target_combo?.items || []).map((comboItem) => comboItem.name)
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(searchTerm.toLowerCase());
};

const getCommercialDecorationColors = (visual, theme) => {
  if (visual.style === 'ribbon-alert' || visual.style === 'urgency-banner' || visual.style === 'seal-offer') {
    return {
      background: '#dc2626',
      foreground: '#ffffff',
      softBackground: 'rgba(220, 38, 38, 0.1)'
    };
  }

  if (visual.style === 'combo-premium') {
    return {
      background: '#111827',
      foreground: '#ffffff',
      softBackground: 'rgba(17, 24, 39, 0.08)'
    };
  }

  return {
    background: theme.accent,
    foreground: '#ffffff',
    softBackground: `${theme.accent}18`
  };
};

const CountdownBadge = ({ endsAt, emphasized = false, theme, visual }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const remainingLabel = formatRemainingTime(endsAt, now);

  if (!remainingLabel) {
    return null;
  }

  const decoration = getCommercialDecorationColors(
    visual || { style: emphasized ? 'countdown-hero' : 'auto' },
    theme || { accent: '#111827' }
  );

  return (
    <div
      className={`mt-3 inline-flex items-center gap-2 rounded-full font-medium ${
        emphasized ? 'px-4 py-2.5 text-sm shadow-sm' : 'px-3 py-1.5 text-xs'
      }`}
      style={{
        background: emphasized ? decoration.background : decoration.softBackground,
        color: emphasized ? decoration.foreground : theme?.accent || '#111827'
      }}
    >
      <Clock3 className={emphasized ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      {remainingLabel === 'Finalizada' ? remainingLabel : `Termina en ${remainingLabel}`}
    </div>
  );
};

const CommercialRibbon = ({ theme, visual }) => {
  const decoration = getCommercialDecorationColors(visual, theme);

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
      style={{
        background: decoration.background,
        color: decoration.foreground
      }}
    >
      <span>{visual.styleLabel}</span>
      <span>{visual.primaryBadge}</span>
    </div>
  );
};

const ProductCard = ({ currencyCode, item, theme }) => {
  const textColors = getThemeTextColors(theme);

  return (
    <article
      className="rounded-3xl border border-black/5 p-4 shadow-sm"
      style={{
        background: theme.cardBackground,
        color: textColors.body
      }}
    >
      <div className="flex items-start gap-3">
        {item.primary_image_url ? (
          <img
            src={item.primary_image_url}
            alt={item.name}
            className="h-16 w-16 rounded-2xl object-cover"
          />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: `${theme.accent}22`, color: theme.accent }}
          >
            <ShoppingBag className="h-6 w-6" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold" style={{ color: textColors.body }}>
                {item.name}
              </h4>
              {item.description ? (
                <p className="mt-1 text-xs opacity-75" style={{ color: textColors.muted }}>
                  {item.description}
                </p>
              ) : null}
            </div>
            <p className="whitespace-nowrap text-sm font-semibold" style={{ color: theme.accent }}>
              {formatCurrency(item.price_cents, currencyCode)}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {item.showSoldOutBadge ? (
              <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                Agotado
              </span>
            ) : null}

            {item.promotions?.map((promotion) => (
              <span
                key={promotion.id}
                className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                style={{ background: theme.accent }}
              >
                {promotion.name}
              </span>
            ))}
          </div>

          {item.promotions?.some((promotion) => promotion.conditions_text) ? (
            <div className="mt-2 space-y-1">
              {item.promotions
                .filter((promotion) => promotion.conditions_text)
                .map((promotion) => (
                  <p
                    key={`${item.id}-${promotion.id}-conditions`}
                    className="text-[11px] opacity-70"
                    style={{ color: textColors.muted }}
                  >
                    {promotion.conditions_text}
                  </p>
                ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};

const PromotionCard = ({ currencyCode, displayStyle, item, theme }) => {
  const textColors = getThemeTextColors(theme);
  const visual = buildPromotionVisualModel(item, displayStyle);
  const decoration = getCommercialDecorationColors(visual, theme);
  const showRibbon = visual.style === 'ribbon-alert' || visual.style === 'urgency-banner';
  const emphasizedCountdown = visual.style === 'countdown-hero';

  return (
    <article
      className="overflow-hidden rounded-3xl border border-black/5 shadow-sm"
      style={{
        background: theme.cardBackground,
        color: textColors.body
      }}
    >
      {showRibbon ? <CommercialRibbon theme={theme} visual={visual} /> : null}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: theme.accent }}>
                Promocion
              </p>
              {!showRibbon ? (
                <span
                  className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{
                    background: decoration.softBackground,
                    color: decoration.background
                  }}
                >
                  {visual.styleLabel}
                </span>
              ) : null}
            </div>
            <h4 className="mt-2 text-sm font-semibold" style={{ color: textColors.body }}>
              {item.name}
            </h4>
            {item.conditions_text ? (
              <p className="mt-1 text-xs opacity-75" style={{ color: textColors.muted }}>
                {item.conditions_text}
              </p>
            ) : null}
          </div>

          {visual.style === 'seal-offer' ? (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-black"
              style={{
                background: decoration.background,
                color: decoration.foreground
              }}
            >
              {visual.primaryBadge}
            </div>
          ) : null}
        </div>

        {!showRibbon && visual.style === 'price-focus' ? (
          <div
            className="mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-bold"
            style={{
              background: decoration.softBackground,
              color: decoration.background
            }}
          >
            {visual.primaryBadge}
          </div>
        ) : null}

        {item.target_product ? (
          <div className="mt-4">
            <ProductCard currencyCode={currencyCode} item={item.target_product} theme={theme} />
          </div>
        ) : null}

        {item.target_combo ? (
          <div className="mt-4">
            <ComboCard
              currencyCode={currencyCode}
              displayStyle="combo-compact"
              item={item.target_combo}
              theme={theme}
            />
          </div>
        ) : null}

        {item.has_countdown && item.ends_at ? (
          <CountdownBadge
            endsAt={item.ends_at}
            emphasized={emphasizedCountdown}
            theme={theme}
            visual={visual}
          />
        ) : null}
      </div>
    </article>
  );
};

const ComboCard = ({ currencyCode, displayStyle, item, theme }) => {
  const textColors = getThemeTextColors(theme);
  const visual = buildComboVisualModel(item, displayStyle);
  const decoration = getCommercialDecorationColors(visual, theme);
  const showRibbon = visual.style === 'combo-premium';
  const emphasizedCountdown = visual.style === 'combo-countdown';

  return (
    <article
      className="overflow-hidden rounded-3xl border border-black/5 shadow-sm"
      style={{
        background: theme.cardBackground,
        color: textColors.body
      }}
    >
      {showRibbon ? <CommercialRibbon theme={theme} visual={visual} /> : null}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="h-16 w-16 rounded-2xl object-cover"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-[10px] font-semibold uppercase tracking-[0.24em]"
              style={{
                background: theme.key === 'style-6' ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
                color: theme.accent
              }}
            >
              Combo
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: theme.accent }}>
                    Combo
                  </p>
                  {!showRibbon ? (
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold"
                      style={{
                        background: decoration.softBackground,
                        color: decoration.background
                      }}
                    >
                      {visual.styleLabel}
                    </span>
                  ) : null}
                </div>
                <h4 className="mt-2 text-sm font-semibold" style={{ color: textColors.body }}>
                  {item.name}
                </h4>
                {item.description ? (
                  <p className="mt-1 text-xs opacity-75" style={{ color: textColors.muted }}>
                    {item.description}
                  </p>
                ) : null}
              </div>
              <p className="whitespace-nowrap text-sm font-semibold" style={{ color: theme.accent }}>
                {formatCurrency(item.combo_price_cents, currencyCode)}
              </p>
            </div>
          </div>
        </div>

        {!showRibbon && visual.style === 'savings-badge' ? (
          <div
            className="mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-bold"
            style={{
              background: decoration.background,
              color: decoration.foreground
            }}
          >
            {visual.primaryBadge}
          </div>
        ) : null}

        {item.conditions_text ? (
          <p className="mt-3 text-xs opacity-75" style={{ color: textColors.muted }}>
            {item.conditions_text}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {item.promotions?.map((promotion) => (
            <span
              key={`combo-${item.id}-promotion-${promotion.id}`}
              className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
              style={{ background: theme.accent }}
            >
              {promotion.name}
            </span>
          ))}
        </div>

        {item.promotions?.some((promotion) => promotion.conditions_text) ? (
          <div className="mt-2 space-y-1">
            {item.promotions
              .filter((promotion) => promotion.conditions_text)
              .map((promotion) => (
                <p
                  key={`combo-${item.id}-conditions-${promotion.id}`}
                  className="text-[11px] opacity-70"
                  style={{ color: textColors.muted }}
                >
                  {promotion.conditions_text}
                </p>
              ))}
          </div>
        ) : null}

        {item.has_countdown && item.ends_at ? (
          <CountdownBadge
            endsAt={item.ends_at}
            emphasized={emphasizedCountdown}
            theme={theme}
            visual={visual}
          />
        ) : null}

        <div className="mt-4 space-y-2">
          {item.items.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl bg-black/5 px-3 py-2 text-sm"
              style={{ color: textColors.body }}
            >
              {product.name}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};

const PublicMenuPage = () => {
  const { slug } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    let mounted = true;

    const loadMenu = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const response = await carteleriaService.getPublicMenu(slug);

        if (!mounted) {
          return;
        }

        setPayload(response.data);
      } catch (error) {
        if (!mounted) {
          return;
        }

        const apiError = handleApiError(error);
        setErrorMessage(apiError.message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMenu();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const theme = getThemePreset(payload?.menu?.theme_key);
  const textColors = getThemeTextColors(theme);
  const currencyCode = payload?.business?.currency_code || 'ARS';
  const hasResolvedMenu = Boolean(payload?.menu && Array.isArray(payload?.blocks));
  const isOkState = !payload?.state || payload.state === 'ok';

  const filterOptions = useMemo(() => {
    const filtersMap = new Map([['all', 'Todas']]);

    (payload?.blocks || []).forEach((block) => {
      if (block.category?.id) {
        filtersMap.set(String(block.category.id), block.category.name);
      }

      if (block.item?.category_id && block.item?.category_name) {
        filtersMap.set(String(block.item.category_id), block.item.category_name);
      }

      if (Array.isArray(block.items)) {
        block.items.forEach((item) => {
          if (item.category_id && item.category_name) {
            filtersMap.set(String(item.category_id), item.category_name);
          }
        });
      }
    });

    return Array.from(filtersMap.entries()).map(([value, label]) => ({ value, label }));
  }, [payload]);

  const visibleBlocks = useMemo(() => {
    const blocks = payload?.blocks || [];

    return blocks.reduce((filteredBlocks, block) => {
      if (block.block_type === 'header') {
        filteredBlocks.push(block);
        return filteredBlocks;
      }

      if (block.block_type === 'separator') {
        if (!search || blockMatchesSearch(block, search)) {
          filteredBlocks.push(block);
        }
        return filteredBlocks;
      }

      if (block.block_type === 'category') {
        const categoryId = String(block.category?.id || '');
        const matchesFilter = activeFilter === 'all' || categoryId === activeFilter;
        const items = (block.items || []).filter((item) => {
          const categoryMatch =
            activeFilter === 'all' || String(item.category_id || '') === activeFilter;
          return categoryMatch && itemMatchesSearch(item, search);
        });

        if (matchesFilter && (items.length > 0 || blockMatchesSearch(block, search))) {
          filteredBlocks.push({
            ...block,
            items
          });
        }

        return filteredBlocks;
      }

      if (block.block_type === 'product') {
        const categoryId = String(block.item?.category_id || '');
        const matchesFilter = activeFilter === 'all' || categoryId === activeFilter;

        if (matchesFilter && block.item && itemMatchesSearch(block.item, search)) {
          filteredBlocks.push(block);
        }

        return filteredBlocks;
      }

      if (block.block_type === 'promotion') {
        const items = (block.items || []).filter((item) => {
          const promotionCategoryIds = item.target_product?.category_id
            ? [String(item.target_product.category_id)]
            : (item.target_combo?.items || [])
                .map((comboItem) => String(comboItem.category_id || ''))
                .filter(Boolean);
          const matchesFilter =
            activeFilter === 'all' || promotionCategoryIds.includes(String(activeFilter));
          return matchesFilter && itemMatchesSearch(item, search);
        });

        if (items.length > 0 || blockMatchesSearch(block, search)) {
          filteredBlocks.push({
            ...block,
            items,
            item: items[0] || block.item
          });
        }

        return filteredBlocks;
      }

      if (block.block_type === 'combo') {
        const items = (block.items || []).filter((item) => {
          const matchesFilter =
            activeFilter === 'all' ||
            item.items?.some((product) => String(product.category_id || '') === activeFilter);

          return matchesFilter && itemMatchesSearch(item, search);
        });

        if (items.length > 0 || blockMatchesSearch(block, search)) {
          filteredBlocks.push({
            ...block,
            items,
            item: items[0] || block.item
          });
        }
      }

      return filteredBlocks;
    }, []);
  }, [activeFilter, payload, search]);

  return (
    <div className="min-h-screen" style={{ background: theme.background }}>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div
          className="rounded-[2rem] p-5 shadow-xl"
          style={{
            background: theme.headerBackground,
            color: theme.headerText
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] opacity-70">
                {payload?.menu?.local_name || payload?.business?.name || 'Menu digital'}
              </p>
              <h1 className="mt-3 text-3xl font-semibold">
                {payload?.menu?.name || 'Cargando menu'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm opacity-80">
                {payload?.blocks?.find((block) => block.block_type === 'header')?.content ||
                  'Catalogo vivo actualizado en tiempo real para ver productos, promos y combos del local.'}
              </p>
            </div>

            {payload?.link?.source ? (
              <span className="inline-flex self-start rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                {sourceLabels[payload.link.source] || payload.link.source}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 rounded-[1.75rem] bg-white/90 p-4 shadow-lg backdrop-blur">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar en el menu"
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 outline-none"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className="rounded-full px-3 py-2 text-xs font-semibold transition"
                style={{
                  background: activeFilter === option.value ? theme.accent : '#f3f4f6',
                  color: activeFilter === option.value ? '#ffffff' : '#374151'
                }}
                onClick={() => setActiveFilter(option.value)}
              >
                {option.label}
              </button>
            ))}

            <div className="ml-auto inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5 flex items-start gap-3 rounded-3xl border border-red-200 bg-white px-4 py-4 text-sm text-red-700 shadow-sm">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {!errorMessage && !loading && (!hasResolvedMenu || !isOkState) ? (
          <div className="mt-5 rounded-3xl bg-white p-6 text-center shadow-sm">
            <Tag className="mx-auto h-8 w-8 text-gray-300" />
            <h2 className="mt-3 text-lg font-semibold text-gray-900">Este menu no esta disponible ahora</h2>
            <p className="mt-2 text-sm text-gray-500">
              {sourceLabels[payload?.state] || 'No hay un menu activo para este link en este momento.'}
            </p>
          </div>
        ) : null}

        {!errorMessage && loading ? (
          <div className="mt-5 rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="loading-spinner mx-auto h-10 w-10" />
          </div>
        ) : null}

        {!errorMessage && !loading && hasResolvedMenu && isOkState ? (
          <div className="mt-5 space-y-4">
            {visibleBlocks.map((block) => {
              if (block.block_type === 'header') {
                const headerDisplayTitle =
                  block.title && block.title !== payload?.menu?.name ? block.title : 'Bienvenidos';

                return (
                  <section
                    key={block.id || `${block.block_type}-${block.sort_order}`}
                    className="rounded-[2rem] p-5 shadow-sm"
                    style={{
                      background: theme.cardBackground,
                      color: textColors.body
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: theme.accent }}>
                      Presentacion
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold">{headerDisplayTitle}</h2>
                    {block.content ? <p className="mt-2 text-sm opacity-75">{block.content}</p> : null}
                  </section>
                );
              }

              if (block.block_type === 'separator') {
                const separatorTextColor = block.text_color || '#ffffff';

                return (
                  <section
                    key={block.id || `${block.block_type}-${block.sort_order}`}
                    className="rounded-[2rem] px-5 py-4 shadow-sm"
                    style={resolveSeparatorStyles(block, resolveFileUrl)}
                  >
                    <h3 className="text-base font-semibold" style={{ color: separatorTextColor }}>
                      {block.title || 'Separador'}
                    </h3>
                    {block.content ? (
                      <p className="mt-1 text-sm opacity-90" style={{ color: separatorTextColor }}>
                        {block.content}
                      </p>
                    ) : null}
                  </section>
                );
              }

              if (block.block_type === 'category') {
                return (
                  <section key={block.id || `${block.block_type}-${block.sort_order}`} className="space-y-3">
                    <div className="px-1">
                      <h3 className="text-xl font-semibold" style={{ color: textColors.body }}>
                        {block.title}
                      </h3>
                      {block.content ? (
                        <p className="mt-1 text-sm" style={{ color: textColors.muted }}>
                          {block.content}
                        </p>
                      ) : null}
                    </div>
                    {block.items?.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {block.items.map((item) => (
                          <ProductCard
                            key={item.id}
                            currencyCode={currencyCode}
                            item={item}
                            theme={theme}
                          />
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              }

              if (block.block_type === 'product' && block.item) {
                return (
                  <section key={block.id || `${block.block_type}-${block.sort_order}`} className="space-y-3">
                    <div className="px-1">
                      <h3 className="text-xl font-semibold" style={{ color: textColors.body }}>
                        {block.title}
                      </h3>
                      {block.content ? (
                        <p className="mt-1 text-sm" style={{ color: textColors.muted }}>
                          {block.content}
                        </p>
                      ) : null}
                    </div>
                    <ProductCard currencyCode={currencyCode} item={block.item} theme={theme} />
                  </section>
                );
              }

              if (block.block_type === 'promotion' && block.item) {
                return (
                  <section key={block.id || `${block.block_type}-${block.sort_order}`} className="space-y-3">
                    <div className="px-1">
                      <h3 className="text-xl font-semibold" style={{ color: textColors.body }}>
                        {block.title}
                      </h3>
                      {block.content ? (
                        <p className="mt-1 text-sm" style={{ color: textColors.muted }}>
                          {block.content}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-3">
                      {(block.items || [block.item]).map((item) => (
                        <PromotionCard
                          key={item.id}
                          currencyCode={currencyCode}
                          displayStyle={block.config?.display_style}
                          item={item}
                          theme={theme}
                        />
                      ))}
                    </div>
                  </section>
                );
              }

              if (block.block_type === 'combo' && block.item) {
                return (
                  <section key={block.id || `${block.block_type}-${block.sort_order}`} className="space-y-3">
                    <div className="px-1">
                      <h3 className="text-xl font-semibold" style={{ color: textColors.body }}>
                        {block.title}
                      </h3>
                      {block.content ? (
                        <p className="mt-1 text-sm" style={{ color: textColors.muted }}>
                          {block.content}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-3">
                      {(block.items || [block.item]).map((item) => (
                        <ComboCard
                          key={item.id}
                          currencyCode={currencyCode}
                          displayStyle={block.config?.display_style}
                          item={item}
                          theme={theme}
                        />
                      ))}
                    </div>
                  </section>
                );
              }

              return null;
            })}

            {visibleBlocks.length === 1 && visibleBlocks[0]?.block_type === 'header' ? (
              <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">No encontramos resultados</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Prueba con otra busqueda o cambia el filtro del menu.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PublicMenuPage;
