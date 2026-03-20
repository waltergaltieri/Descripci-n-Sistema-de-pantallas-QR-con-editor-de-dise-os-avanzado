import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { resolveFileUrl } from '../../../utils/fileUrl';
import {
  buildComboVisualModel,
  buildPromotionVisualModel
} from '../shared/promoComboDisplayStyles';
import { getThemePreset, getThemeTextColors } from './themePresets';
import { resolveSeparatorStyles } from './separatorBackground';

const formatPreviewCurrency = (priceCents = 0) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(Number(priceCents || 0) / 100);

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

const PreviewThumb = ({ label, theme }) => (
  <div
    className="flex h-16 w-16 items-center justify-center rounded-2xl text-[10px] font-semibold uppercase tracking-[0.24em]"
    style={{
      background: theme.key === 'style-6' ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
      color: theme.accent
    }}
  >
    {label}
  </div>
);

const PreviewCountdownPanel = ({ emphasized, theme, visual }) => {
  const decoration = getCommercialDecorationColors(visual, theme);

  return (
    <div
      className={`mt-4 rounded-2xl border border-black/5 px-4 py-3 ${
        emphasized ? 'shadow-sm' : ''
      }`}
      style={{
        background: emphasized ? decoration.background : decoration.softBackground,
        color: emphasized ? decoration.foreground : theme.accent
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">
        {visual.accentLine}
      </p>
      <p className={`mt-1 font-black ${emphasized ? 'text-2xl tracking-[0.18em]' : 'text-sm'}`}>
        02:15:00
      </p>
    </div>
  );
};

const PreviewRibbon = ({ theme, visual }) => {
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

const getBlockLabel = (block, lookupData) => {
  const config = block.config || {};

  if (block.block_type === 'header') {
    return block.title || lookupData.localName || lookupData.menuName || 'Menu digital';
  }

  if (block.block_type === 'category') {
    return lookupData.categoriesById[config.category_id]?.name || 'Categoria destacada';
  }

  if (block.block_type === 'product') {
    return lookupData.productsById[config.product_id]?.name || 'Producto destacado';
  }

  if (block.block_type === 'promotion') {
    return lookupData.promotionsById[config.promotion_id]?.name || 'Promocion activa';
  }

  if (block.block_type === 'combo') {
    return lookupData.combosById[config.combo_id]?.name || 'Combo sugerido';
  }

  return block.title || 'Separador';
};

const renderPromotionPreview = (block, lookupData, theme, textColors) => {
  const promotion = lookupData.promotionsById[block.config?.promotion_id];
  const label = getBlockLabel(block, lookupData);
  const visual = buildPromotionVisualModel(promotion, block.config?.display_style);
  const decoration = getCommercialDecorationColors(visual, theme);
  const targetProduct = promotion?.target_product;
  const targetCombo = promotion?.target_combo;
  const showRibbon = visual.style === 'ribbon-alert' || visual.style === 'urgency-banner';
  const emphasizedCountdown = visual.style === 'countdown-hero';
  const shouldShowCountdown =
    visual.style === 'countdown-hero' || Boolean(promotion?.has_countdown && promotion?.ends_at);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-black/5 shadow-sm"
      style={{
        background: theme.cardBackground,
        color: textColors.body
      }}
    >
      {showRibbon ? <PreviewRibbon theme={theme} visual={visual} /> : null}

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
            <h5 className="mt-2 text-sm font-semibold" style={{ color: textColors.body }}>
              {label}
            </h5>
            {promotion?.conditions_text || block.content ? (
              <p className="mt-1 text-xs opacity-75" style={{ color: textColors.muted }}>
                {promotion?.conditions_text || block.content}
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

        <div className="mt-4 rounded-2xl border border-black/5 bg-black/[0.02] p-3">
          <div className="flex items-start gap-3">
            <PreviewThumb
              label={targetCombo ? 'Combo' : 'Foto'}
              theme={theme}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h6 className="truncate text-sm font-semibold" style={{ color: textColors.body }}>
                    {targetProduct?.name || targetCombo?.name || label}
                  </h6>
                  {targetProduct?.description || targetCombo?.description ? (
                    <p className="mt-1 text-xs opacity-75" style={{ color: textColors.muted }}>
                      {targetProduct?.description || targetCombo?.description}
                    </p>
                  ) : null}
                </div>
                {targetProduct?.price_cents || targetCombo?.combo_price_cents ? (
                  <span className="whitespace-nowrap text-sm font-semibold" style={{ color: theme.accent }}>
                    {formatPreviewCurrency(targetProduct?.price_cents || targetCombo?.combo_price_cents)}
                  </span>
                ) : null}
              </div>

              {targetCombo?.conditions_text ? (
                <p className="mt-2 text-[11px] opacity-75" style={{ color: textColors.muted }}>
                  {targetCombo.conditions_text}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {shouldShowCountdown ? (
          <PreviewCountdownPanel emphasized={emphasizedCountdown} theme={theme} visual={visual} />
        ) : null}
      </div>
    </div>
  );
};

const renderComboPreview = (block, lookupData, theme, textColors) => {
  const combo = lookupData.combosById[block.config?.combo_id];
  const label = getBlockLabel(block, lookupData);
  const visual = buildComboVisualModel(combo, block.config?.display_style);
  const decoration = getCommercialDecorationColors(visual, theme);
  const showRibbon = visual.style === 'combo-premium';
  const emphasizedCountdown = visual.style === 'combo-countdown';
  const shouldShowCountdown =
    visual.style === 'combo-countdown' || Boolean(combo?.has_countdown && combo?.ends_at);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-black/5 shadow-sm"
      style={{
        background: theme.cardBackground,
        color: textColors.body
      }}
    >
      {showRibbon ? <PreviewRibbon theme={theme} visual={visual} /> : null}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
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
            <div className="mt-3 flex items-start gap-3">
              <PreviewThumb label="Combo" theme={theme} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-sm font-semibold" style={{ color: textColors.body }}>
                      {label}
                    </h5>
                    <p className="mt-1 text-xs opacity-75" style={{ color: textColors.muted }}>
                      {combo?.description || block.content || 'Combo destacado del menu.'}
                    </p>
                  </div>
                  {combo?.combo_price_cents ? (
                    <span className="whitespace-nowrap text-sm font-semibold" style={{ color: theme.accent }}>
                      {formatPreviewCurrency(combo.combo_price_cents)}
                    </span>
                  ) : null}
                </div>

                {combo?.conditions_text ? (
                  <p className="mt-2 text-[11px] opacity-75" style={{ color: textColors.muted }}>
                    {combo.conditions_text}
                  </p>
                ) : null}

                {combo?.items?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {combo.items.slice(0, 3).map((product) => (
                      <span
                        key={`preview-combo-item-${product.id}`}
                        className="inline-flex rounded-full border border-black/5 px-2.5 py-1 text-[10px] font-medium"
                        style={{ color: textColors.body }}
                      >
                        {product.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {visual.style === 'savings-badge' ? (
            <span
              className="inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold"
              style={{
                background: decoration.background,
                color: decoration.foreground
              }}
            >
              {visual.primaryBadge}
            </span>
          ) : null}
        </div>

        {shouldShowCountdown ? (
          <PreviewCountdownPanel emphasized={emphasizedCountdown} theme={theme} visual={visual} />
        ) : null}

        {!shouldShowCountdown && visual.style === 'combo-featured' ? (
          <div
            className="mt-4 rounded-2xl border border-black/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]"
            style={{
              background: decoration.softBackground,
              color: decoration.background
            }}
          >
            {visual.primaryBadge}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const renderBlockBody = (block, lookupData, theme) => {
  const label = getBlockLabel(block, lookupData);
  const textColors = getThemeTextColors(theme);
  const separatorTextColor = block.text_color || '#ffffff';

  if (block.block_type === 'header') {
    return (
      <div
        className="rounded-3xl p-5 shadow-sm"
        style={{
          background: theme.headerBackground,
          color: theme.headerText
        }}
      >
        <p className="text-xs uppercase tracking-[0.3em] opacity-70">Menu digital</p>
        <h4 className="mt-3 text-xl font-semibold">{label}</h4>
        <p className="mt-2 text-sm opacity-80">
          {block.content || 'Explora categorias, promociones y productos actualizados en tiempo real.'}
        </p>
      </div>
    );
  }

  if (block.block_type === 'separator') {
    return (
      <div className="rounded-2xl px-4 py-3" style={resolveSeparatorStyles(block, resolveFileUrl)}>
        <p className="text-sm font-semibold" style={{ color: separatorTextColor }}>
          {block.title || 'Separador'}
        </p>
        {block.content ? (
          <p className="mt-1 text-xs opacity-90" style={{ color: separatorTextColor }}>
            {block.content}
          </p>
        ) : null}
      </div>
    );
  }

  if (block.block_type === 'promotion') {
    return renderPromotionPreview(block, lookupData, theme, textColors);
  }

  if (block.block_type === 'combo') {
    return renderComboPreview(block, lookupData, theme, textColors);
  }

  return (
    <div
      className="rounded-2xl border border-black/5 px-4 py-4 shadow-sm"
      style={{
        background: theme.cardBackground,
        color: textColors.body
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.24em]"
            style={{ color: theme.accent }}
          >
            {block.block_type}
          </p>
          <h5 className="mt-2 text-sm font-semibold" style={{ color: textColors.body }}>
            {label}
          </h5>
          <p className="mt-1 text-xs opacity-70" style={{ color: textColors.muted }}>
            {block.content || 'Contenido conectado al catalogo del local.'}
          </p>
        </div>
        <span
          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{
            background: theme.accent,
            color: '#ffffff'
          }}
        >
          vivo
        </span>
      </div>
    </div>
  );
};

const RenderMenuPreview = ({ blocks, localName, menuName, themeKey, lookupData }) => {
  const theme = getThemePreset(themeKey);
  const completeLookupData = {
    localName,
    menuName,
    ...lookupData
  };

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-gray-950 p-3 shadow-xl">
      <div
        className="mx-auto min-h-[640px] w-full max-w-[320px] rounded-[1.6rem] p-4"
        style={{ background: theme.background }}
      >
        <div className="rounded-2xl bg-white/90 p-3 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value=""
              readOnly
              placeholder="Buscar en el menu"
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none"
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">
              Todas
            </button>
            <button type="button" className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">
              Destacados
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700"
            >
              <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
              Filtros
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {blocks.map((block) => (
            <div key={block.id || `${block.block_type}-${block.sort_order}`}>
              {renderBlockBody(block, completeLookupData, theme)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RenderMenuPreview;
