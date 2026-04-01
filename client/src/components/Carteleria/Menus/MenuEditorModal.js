import React, { useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, GripVertical, ImagePlus, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { carteleriaService, uploadsService } from '../../../services/api';
import { resolveFileUrl } from '../../../utils/fileUrl';
import RenderMenuPreview from './renderMenuPreview';
import { themePresets } from './themePresets';
import ColorInputField from '../shared/ColorInputField';
import {
  COMBO_DISPLAY_STYLE_OPTIONS,
  PROMOTION_DISPLAY_STYLE_OPTIONS
} from '../shared/promoComboDisplayStyles';
import {
  buildSeparatorGradient,
  DEFAULT_SEPARATOR_GRADIENT,
  normalizeSeparatorBlock
} from './separatorBackground';

const defaultHeaderBlock = {
  id: 'header-fixed',
  block_type: 'header',
  title: 'Encabezado',
  content: 'Tu menu online siempre actualizado',
  background_type: null,
  background_value: null,
  text_color: null,
  config: {}
};

const BLOCK_LIBRARY = [
  { key: 'category', label: 'Categoria' },
  { key: 'product', label: 'Producto' },
  { key: 'promotion', label: 'Promocion' },
  { key: 'combo', label: 'Combo' },
  { key: 'separator', label: 'Separador' }
];

const BLOCK_TYPE_LABELS = {
  header: 'Encabezado',
  category: 'Categoria',
  product: 'Producto',
  promotion: 'Promocion',
  combo: 'Combo',
  separator: 'Separador'
};

const createTempId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createBlock = (blockType, lookupData) => {
  const baseBlock = {
    id: createTempId(),
    block_type: blockType,
    title: '',
    content: '',
    background_type: 'solid',
    background_value: '#1f2937',
    text_color: '#ffffff',
    config: {}
  };

  if (blockType === 'category') {
    return {
      ...baseBlock,
      title: 'Categoria',
      config: {
        category_id: lookupData.categories[0]?.id ? String(lookupData.categories[0].id) : ''
      }
    };
  }

  if (blockType === 'product') {
    return {
      ...baseBlock,
      title: 'Producto destacado',
      config: {
        product_id: lookupData.products[0]?.id ? String(lookupData.products[0].id) : ''
      }
    };
  }

  if (blockType === 'promotion') {
    return {
      ...baseBlock,
      title: 'Promocion activa',
      config: {
        promotion_id: lookupData.promotions[0]?.id ? String(lookupData.promotions[0].id) : '',
        display_style: 'auto'
      }
    };
  }

  if (blockType === 'combo') {
    return {
      ...baseBlock,
      title: 'Combo recomendado',
      config: {
        combo_id: lookupData.combos[0]?.id ? String(lookupData.combos[0].id) : '',
        display_style: 'auto'
      }
    };
  }

  if (blockType === 'separator') {
    return {
      ...baseBlock,
      title: 'Separador',
      content: 'Texto editorial o aclaracion destacada',
      config: {
        gradient_from: DEFAULT_SEPARATOR_GRADIENT.from,
        gradient_to: DEFAULT_SEPARATOR_GRADIENT.to,
        gradient_angle: DEFAULT_SEPARATOR_GRADIENT.angle,
        background_image_url: ''
      }
    };
  }

  return baseBlock;
};

const normalizeCommerceBlock = (block) => {
  if (block.block_type !== 'promotion' && block.block_type !== 'combo') {
    return block;
  }

  return {
    ...block,
    config: {
      display_style: 'auto',
      ...(block.config || {})
    }
  };
};

const normalizeBlocks = (blocks = []) => {
  const headerBlock =
    blocks.find((block) => block.block_type === 'header') || defaultHeaderBlock;

  const orderedBlocks = [
    { ...defaultHeaderBlock, ...headerBlock },
    ...blocks.filter((block) => block.block_type !== 'header')
  ];

  return orderedBlocks.map((block, index) => {
    const normalizedBlock = normalizeSeparatorBlock(normalizeCommerceBlock(block));

    return {
      ...normalizedBlock,
      sort_order: index,
      config: normalizedBlock.config || {}
    };
  });
};

const getBlockDisplayName = (block) => block.title || BLOCK_TYPE_LABELS[block.block_type] || 'Bloque';

const getDefaultExpandedBlockIds = (blocks = []) =>
  blocks.filter((block) => block.block_type === 'header').map((block) => block.id);

const getBlockSummary = (block, lookupData) => {
  if (block.block_type === 'header') {
    return block.content || 'Presenta el nombre del local y abre el recorrido del cliente.';
  }

  if (block.block_type === 'category') {
    const categoryName = lookupData?.categoriesById?.[String(block.config?.category_id)]?.name;
    return categoryName
      ? `Muestra la categoria ${categoryName} y sus productos asociados.`
      : 'Elige una categoria para poblar este tramo del menu.';
  }

  if (block.block_type === 'product') {
    const productName = lookupData?.productsById?.[String(block.config?.product_id)]?.name;
    return productName
      ? `Destaca el producto ${productName} en una tarjeta puntual.`
      : 'Selecciona un producto puntual para destacarlo.';
  }

  if (block.block_type === 'promotion') {
    const promotionName = lookupData?.promotionsById?.[String(block.config?.promotion_id)]?.name;
    return promotionName
      ? `Trae la promocion ${promotionName} con su estilo visual configurado.`
      : 'Conecta una promocion activa del catalogo.';
  }

  if (block.block_type === 'combo') {
    const comboName = lookupData?.combosById?.[String(block.config?.combo_id)]?.name;
    return comboName
      ? `Presenta el combo ${comboName} como recomendacion destacada.`
      : 'Conecta un combo para destacarlo en el menu.';
  }

  if (block.block_type === 'separator') {
    if (block.background_type === 'image') {
      return 'Separador editorial con imagen de fondo.';
    }

    if (block.background_type === 'gradient') {
      return 'Separador editorial con gradiente para dividir secciones.';
    }

    return 'Separador editorial de color solido para dar ritmo al menu.';
  }

  return block.content || 'Bloque configurable dentro del recorrido del menu.';
};

const StylePresetPicker = ({ ariaPrefix, label, onChange, options, value }) => (
  <div>
    <span className="label">{label}</span>
    <div className="mt-2 grid grid-cols-2 gap-2 xl:grid-cols-3">
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-label={`${ariaPrefix} ${option.label}`}
            aria-pressed={isActive}
            className={`rounded-2xl border p-3 text-left transition ${
              isActive
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/40'
            }`}
            onClick={() => onChange(option.value)}
          >
            <p className="text-sm font-semibold text-gray-900">{option.label}</p>
            <p className="mt-1 text-xs text-gray-500">{option.description}</p>
          </button>
        );
      })}
    </div>
  </div>
);

const SortableBlockItem = ({
  block,
  categories,
  combos,
  expanded,
  lookupData,
  onChange,
  onRemove,
  onToggleExpand,
  products,
  promotions
}) => {
  const [separatorBackgroundUploading, setSeparatorBackgroundUploading] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: block.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const handleFieldChange = (field, value) => {
    onChange(block.id, {
      ...block,
      [field]: value
    });
  };

  const handleConfigChange = (field, value) => {
    onChange(block.id, {
      ...block,
      config: {
        ...(block.config || {}),
        [field]: value
      }
    });
  };

  const handleSeparatorBackgroundTypeChange = (backgroundType) => {
    if (backgroundType === 'gradient') {
      const nextConfig = {
        ...(block.config || {}),
        gradient_from: block.config?.gradient_from || DEFAULT_SEPARATOR_GRADIENT.from,
        gradient_to: block.config?.gradient_to || DEFAULT_SEPARATOR_GRADIENT.to,
        gradient_angle: block.config?.gradient_angle ?? DEFAULT_SEPARATOR_GRADIENT.angle
      };

      onChange(
        block.id,
        normalizeSeparatorBlock({
          ...block,
          background_type: backgroundType,
          config: nextConfig
        })
      );
      return;
    }

    if (backgroundType === 'image') {
      onChange(
        block.id,
        normalizeSeparatorBlock({
          ...block,
          background_type: backgroundType,
          config: {
            ...(block.config || {}),
            background_image_url: block.config?.background_image_url || block.background_value || ''
          }
        })
      );
      return;
    }

    onChange(
      block.id,
      normalizeSeparatorBlock({
        ...block,
        background_type: backgroundType,
        background_value: block.background_value || '#1f2937'
      })
    );
  };

  const handleSeparatorGradientChange = (field, value) => {
    const nextConfig = {
      ...(block.config || {}),
      [field]: value
    };

    onChange(
      block.id,
      normalizeSeparatorBlock({
        ...block,
        background_type: 'gradient',
        config: nextConfig,
        background_value: buildSeparatorGradient({
          from: nextConfig.gradient_from,
          to: nextConfig.gradient_to,
          angle: nextConfig.gradient_angle
        })
      })
    );
  };

  const handleSeparatorImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSeparatorBackgroundUploading(true);

    try {
      const response = await uploadsService.uploadImage(file);
      const nextImageUrl = response.data?.url || '';

      onChange(
        block.id,
        normalizeSeparatorBlock({
          ...block,
          background_type: 'image',
          background_value: nextImageUrl,
          config: {
            ...(block.config || {}),
            background_image_upload_id: response.data?.id || null,
            background_image_url: nextImageUrl
          }
        })
      );
    } catch (error) {
      toast.error('No se pudo subir la imagen del separador.');
    } finally {
      setSeparatorBackgroundUploading(false);
      event.target.value = '';
    }
  };

  const separatorImagePreviewUrl = block.config?.background_image_url
    ? resolveFileUrl(block.config.background_image_url)
    : '';
  const blockName = getBlockDisplayName(block);
  const blockSummary = getBlockSummary(block, lookupData);
  const isFixedHeader = block.block_type === 'header';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-[28px] border bg-white transition ${
        expanded
          ? 'border-primary-200 shadow-[0_18px_40px_rgba(15,23,42,0.08)]'
          : 'border-gray-200 shadow-sm hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3 p-4 md:p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={`Reordenar bloque ${blockName}`}
            className="rounded-2xl border border-gray-200 bg-gray-50 p-2.5 text-gray-500"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-700">
                {BLOCK_TYPE_LABELS[block.block_type] || block.block_type}
              </span>
              {isFixedHeader ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                  Siempre visible
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h4 className="text-base font-semibold text-gray-900">{blockName}</h4>
                <p className="mt-1 truncate text-xs text-gray-500">{blockSummary}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label={`${expanded ? 'Contraer' : 'Expandir'} bloque ${blockName}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50"
                  onClick={() => onToggleExpand(block.id)}
                >
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {expanded ? 'Ocultar ajustes' : 'Editar'}
                </button>

                {!isFixedHeader ? (
                  <button
                    type="button"
                    aria-label={`Eliminar bloque ${blockName}`}
                    className="rounded-2xl border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                    onClick={() => onRemove(block.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-gray-100 px-4 pb-4 pt-4 md:px-5 md:pb-5">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="label">Titulo del bloque</label>
              <input
                type="text"
                className="input"
                value={block.title || ''}
                onChange={(event) => handleFieldChange('title', event.target.value)}
              />
            </div>

            <div>
              <label className="label">Descripcion breve</label>
              <textarea
                rows={2}
                className="input"
                value={block.content || ''}
                onChange={(event) => handleFieldChange('content', event.target.value)}
              />
            </div>

            {block.block_type === 'category' ? (
              <div>
                <label className="label" htmlFor={`category-link-${block.id}`}>
                  Categoria vinculada
                </label>
                <select
                  id={`category-link-${block.id}`}
                  className="input"
                  value={block.config?.category_id || ''}
                  onChange={(event) => handleConfigChange('category_id', event.target.value)}
                >
                  <option value="">Sin categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {block.block_type === 'product' ? (
              <div>
                <label className="label" htmlFor={`product-link-${block.id}`}>
                  Producto vinculado
                </label>
                <select
                  id={`product-link-${block.id}`}
                  className="input"
                  value={block.config?.product_id || ''}
                  onChange={(event) => handleConfigChange('product_id', event.target.value)}
                >
                  <option value="">Sin producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {block.block_type === 'promotion' ? (
              <div className="space-y-3">
                <div>
                  <label className="label" htmlFor={`promotion-link-${block.id}`}>
                    Promocion vinculada
                  </label>
                  <select
                    id={`promotion-link-${block.id}`}
                    className="input"
                    value={block.config?.promotion_id || ''}
                    onChange={(event) => handleConfigChange('promotion_id', event.target.value)}
                  >
                    <option value="">Sin promocion</option>
                    {promotions.map((promotion) => (
                      <option key={promotion.id} value={promotion.id}>
                        {promotion.name}
                      </option>
                    ))}
                  </select>
                </div>

                <StylePresetPicker
                  ariaPrefix="Estilo promocion"
                  label="Estilo visual"
                  options={PROMOTION_DISPLAY_STYLE_OPTIONS}
                  value={block.config?.display_style || 'auto'}
                  onChange={(nextStyle) => handleConfigChange('display_style', nextStyle)}
                />
              </div>
            ) : null}

            {block.block_type === 'combo' ? (
              <div className="space-y-3">
                <div>
                  <label className="label" htmlFor={`combo-link-${block.id}`}>
                    Combo vinculado
                  </label>
                  <select
                    id={`combo-link-${block.id}`}
                    className="input"
                    value={block.config?.combo_id || ''}
                    onChange={(event) => handleConfigChange('combo_id', event.target.value)}
                  >
                    <option value="">Sin combo</option>
                    {combos.map((combo) => (
                      <option key={combo.id} value={combo.id}>
                        {combo.name}
                      </option>
                    ))}
                  </select>
                </div>

                <StylePresetPicker
                  ariaPrefix="Estilo combo"
                  label="Estilo visual"
                  options={COMBO_DISPLAY_STYLE_OPTIONS}
                  value={block.config?.display_style || 'auto'}
                  onChange={(nextStyle) => handleConfigChange('display_style', nextStyle)}
                />
              </div>
            ) : null}

            {block.block_type === 'separator' ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="label">Fondo</label>
                  <select
                    className="input"
                    value={block.background_type || 'solid'}
                    onChange={(event) => handleSeparatorBackgroundTypeChange(event.target.value)}
                  >
                    <option value="solid">Color solido</option>
                    <option value="gradient">Gradiente</option>
                    <option value="image">Imagen</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  {block.background_type === 'solid' ? (
                    <ColorInputField
                      id={`separator-background-${block.id}`}
                      label="Valor de fondo"
                      textAriaLabel="Valor de fondo"
                      pickerAriaLabel="Selector visual color de fondo del separador"
                      value={block.background_value || ''}
                      onChange={(value) => handleFieldChange('background_value', value)}
                      fallback="#1f2937"
                    />
                  ) : null}

                  {block.background_type === 'gradient' ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <ColorInputField
                        id={`separator-gradient-from-${block.id}`}
                        label="Color inicial"
                        textAriaLabel="Color inicial del gradiente"
                        pickerAriaLabel="Selector visual color inicial del gradiente del separador"
                        value={block.config?.gradient_from || DEFAULT_SEPARATOR_GRADIENT.from}
                        onChange={(value) => handleSeparatorGradientChange('gradient_from', value)}
                        fallback={DEFAULT_SEPARATOR_GRADIENT.from}
                      />

                      <ColorInputField
                        id={`separator-gradient-to-${block.id}`}
                        label="Color final"
                        textAriaLabel="Color final del gradiente"
                        pickerAriaLabel="Selector visual color final del gradiente del separador"
                        value={block.config?.gradient_to || DEFAULT_SEPARATOR_GRADIENT.to}
                        onChange={(value) => handleSeparatorGradientChange('gradient_to', value)}
                        fallback={DEFAULT_SEPARATOR_GRADIENT.to}
                      />

                      <div>
                        <label className="label" htmlFor={`separator-gradient-angle-${block.id}`}>
                          Direccion
                        </label>
                        <select
                          id={`separator-gradient-angle-${block.id}`}
                          className="input"
                          aria-label="Direccion del gradiente"
                          value={String(block.config?.gradient_angle ?? DEFAULT_SEPARATOR_GRADIENT.angle)}
                          onChange={(event) =>
                            handleSeparatorGradientChange('gradient_angle', Number(event.target.value))
                          }
                        >
                          <option value="0">Vertical</option>
                          <option value="45">Diagonal suave</option>
                          <option value="90">Horizontal</option>
                          <option value="135">Diagonal intensa</option>
                          <option value="180">Vertical invertido</option>
                        </select>
                      </div>
                    </div>
                  ) : null}

                  {block.background_type === 'image' ? (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                          <ImagePlus className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <label htmlFor={`separator-background-image-${block.id}`} className="label">
                            Imagen de fondo
                          </label>
                          <p className="text-sm text-gray-500">
                            Sube una imagen para usarla como fondo del separador.
                          </p>

                          <input
                            id={`separator-background-image-${block.id}`}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleSeparatorImageUpload}
                            disabled={separatorBackgroundUploading}
                          />

                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <label
                              htmlFor={`separator-background-image-${block.id}`}
                              className="btn btn-outline cursor-pointer"
                            >
                              <UploadCloud className="mr-2 h-4 w-4" />
                              {separatorBackgroundUploading ? 'Subiendo...' : 'Subir imagen'}
                            </label>

                            <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
                              {block.config?.background_image_url
                                ? 'Imagen de fondo cargada'
                                : 'Sin imagen de fondo'}
                            </span>
                          </div>

                          {separatorImagePreviewUrl ? (
                            <img
                              src={separatorImagePreviewUrl}
                              alt="Preview imagen de fondo del separador"
                              className="mt-4 h-28 w-full rounded-2xl object-cover"
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div>
                  <ColorInputField
                    id={`separator-text-${block.id}`}
                    label="Color de texto"
                    textAriaLabel="Color de texto"
                    pickerAriaLabel="Selector visual color de texto del separador"
                    value={block.text_color || ''}
                    onChange={(value) => handleFieldChange('text_color', value)}
                    fallback="#ffffff"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const MenuEditorModal = ({
  categories,
  combos,
  isOpen,
  menu,
  onClose,
  onDelete,
  onSuccess,
  products,
  promotions
}) => {
  const [formData, setFormData] = useState({
    name: '',
    local_name: '',
    logo_upload_id: null,
    theme_key: 'style-1',
    status: 'draft'
  });
  const [blocks, setBlocks] = useState([defaultHeaderBlock]);
  const [expandedBlockIds, setExpandedBlockIds] = useState([defaultHeaderBlock.id]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (menu) {
      const nextBlocks = normalizeBlocks(menu.blocks || []);

      setFormData({
        name: menu.name || '',
        local_name: menu.local_name || '',
        logo_upload_id: menu.logo_upload_id || null,
        theme_key: menu.theme_key || 'style-1',
        status: menu.status || 'draft'
      });
      setBlocks(nextBlocks);
      setExpandedBlockIds(getDefaultExpandedBlockIds(nextBlocks));
      setSettingsOpen(false);
    } else {
      const nextBlocks = [defaultHeaderBlock];

      setFormData({
        name: '',
        local_name: '',
        logo_upload_id: null,
        theme_key: 'style-1',
        status: 'draft'
      });
      setBlocks(nextBlocks);
      setExpandedBlockIds(getDefaultExpandedBlockIds(nextBlocks));
      setSettingsOpen(false);
    }
  }, [isOpen, menu]);

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setLogoUploading(true);

    try {
      const response = await uploadsService.uploadImage(file);

      setFormData((current) => ({
        ...current,
        logo_upload_id: response.data?.id || current.logo_upload_id
      }));
    } catch (error) {
      toast.error('No se pudo subir el logo del menu.');
    } finally {
      setLogoUploading(false);
    }
  };

  const lookupData = useMemo(
    () => ({
      categories,
      categoriesById: Object.fromEntries(categories.map((category) => [String(category.id), category])),
      products,
      productsById: Object.fromEntries(products.map((product) => [String(product.id), product])),
      promotions,
      promotionsById: Object.fromEntries(promotions.map((promotion) => [String(promotion.id), promotion])),
      combos,
      combosById: Object.fromEntries(combos.map((combo) => [String(combo.id), combo]))
    }),
    [categories, combos, products, promotions]
  );

  const handleAddBlock = (blockType) => {
    setBlocks((currentBlocks) => {
      const nextBlocks = normalizeBlocks([...currentBlocks, createBlock(blockType, lookupData)]);
      const createdBlock = nextBlocks[nextBlocks.length - 1];

      setExpandedBlockIds((currentExpanded) => {
        const preservedHeaderIds = getDefaultExpandedBlockIds(nextBlocks);
        return Array.from(new Set([...preservedHeaderIds, ...currentExpanded, createdBlock.id]));
      });

      return nextBlocks;
    });
  };

  const handleBlockChange = (blockId, nextBlock) => {
    setBlocks((currentBlocks) =>
      normalizeBlocks(
        currentBlocks.map((block) => (block.id === blockId ? nextBlock : block))
      )
    );
  };

  const handleRemoveBlock = (blockId) => {
    setBlocks((currentBlocks) => {
      const nextBlocks = normalizeBlocks(currentBlocks.filter((block) => block.id !== blockId));

      setExpandedBlockIds((currentExpanded) =>
        currentExpanded.filter((expandedId) => expandedId !== blockId)
      );

      return nextBlocks;
    });
  };

  const handleToggleBlockExpanded = (blockId) => {
    setExpandedBlockIds((currentExpanded) =>
      currentExpanded.includes(blockId)
        ? currentExpanded.filter((expandedId) => expandedId !== blockId)
        : [...currentExpanded, blockId]
    );
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setBlocks((currentBlocks) => {
      const normalizedCurrentBlocks = normalizeBlocks(currentBlocks);
      const oldIndex = normalizedCurrentBlocks.findIndex((block) => block.id === active.id);
      const newIndex = normalizedCurrentBlocks.findIndex((block) => block.id === over.id);

      if (oldIndex <= 0 || newIndex <= 0) {
        return normalizedCurrentBlocks;
      }

      return normalizeBlocks(arrayMove(normalizedCurrentBlocks, oldIndex, newIndex));
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre del menu es obligatorio');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        local_name: formData.local_name.trim(),
        logo_upload_id: formData.logo_upload_id,
        blocks: normalizeBlocks(blocks)
      };

      if (menu?.id) {
        await carteleriaService.updateMenu(menu.id, payload);
        toast.success('Menu actualizado correctamente');
      } else {
        await carteleriaService.createMenu(payload);
        toast.success('Menu creado correctamente');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const message = error?.response?.data?.error || 'No se pudo guardar el menu.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!menu?.id || typeof onDelete !== 'function') {
      return;
    }

    const confirmed = window.confirm(
      'Este menu se eliminara y cualquier link que lo use quedara sin esa referencia. Quieres continuar?'
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await onDelete(menu.id);
      toast.success('Menu eliminado correctamente');
      onClose();
    } catch (error) {
      const message = error?.response?.data?.error || 'No se pudo eliminar el menu.';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal w-[min(96vw,1440px)] max-w-[1440px] h-[92vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {menu ? 'Editar menu' : 'Crear menu'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Armalo con bloques dinamicos para que despues responda a cambios del catalogo.
            </p>
          </div>
          <button type="button" className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex h-[calc(92vh-72px)] flex-col overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {formData.name?.trim() || 'Menu sin nombre'}
                </p>
                <p className="text-xs text-gray-500">
                  {blocks.length} secciones · {formData.status === 'active' ? 'Activo' : formData.status === 'paused' ? 'Pausado' : 'Borrador'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50"
                  aria-label="Ajustes del menu"
                  onClick={() => setSettingsOpen((current) => !current)}
                >
                  {settingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Ajustes del menu
                </button>
              </div>
            </div>

            {settingsOpen ? (
              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <label htmlFor="menu-name" className="label">
                    Nombre del menu
                  </label>
                  <input
                    id="menu-name"
                    className="input mt-2"
                    value={formData.name}
                    onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <label htmlFor="menu-local-name" className="label">
                    Nombre del local
                  </label>
                  <input
                    id="menu-local-name"
                    className="input mt-2"
                    value={formData.local_name}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, local_name: event.target.value }))
                    }
                  />
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <label htmlFor="menu-theme" className="label">
                    Estilo visual
                  </label>
                  <select
                    id="menu-theme"
                    className="input mt-2"
                    value={formData.theme_key}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, theme_key: event.target.value }))
                    }
                  >
                    {themePresets.map((theme) => (
                      <option key={theme.key} value={theme.key}>
                        {theme.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <label htmlFor="menu-status" className="label">
                    Estado
                  </label>
                  <select
                    id="menu-status"
                    className="input mt-2"
                    value={formData.status}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, status: event.target.value }))
                    }
                  >
                    <option value="draft">Borrador</option>
                    <option value="active">Activo</option>
                    <option value="paused">Pausado</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <label htmlFor="menu-logo" className="label">
                    Logo del menu
                  </label>
                  <input
                    id="menu-logo"
                    type="file"
                    accept="image/*"
                    className="input mt-2"
                    onChange={handleLogoChange}
                    disabled={submitting || logoUploading}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {logoUploading
                      ? 'Subiendo logo...'
                      : formData.logo_upload_id
                        ? 'Logo listo para guardarse.'
                        : 'Opcional. Puedes dejarlo vacio.'}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
            <section className="flex min-h-0 flex-col overflow-hidden">
              <div className="border-b border-gray-200 px-4 py-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-lg font-semibold text-gray-900">Secciones del menu</h4>
                    <span className="text-xs text-gray-500">Arrastra para ordenar</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {BLOCK_LIBRARY.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50"
                        onClick={() => handleAddBlock(item.key)}
                        aria-label={`Agregar bloque ${item.label}`}
                      >
                        <Plus className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/35 px-4 py-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {blocks.map((block) => (
                        <SortableBlockItem
                          key={block.id}
                          block={block}
                          categories={categories}
                          combos={combos}
                          expanded={expandedBlockIds.includes(block.id)}
                          lookupData={lookupData}
                          onChange={handleBlockChange}
                          onRemove={handleRemoveBlock}
                          onToggleExpand={handleToggleBlockExpanded}
                          products={products}
                          promotions={promotions}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </section>

            <aside className="overflow-y-auto border-t border-gray-200 bg-white px-4 py-4 xl:border-l xl:border-t-0">
              <div className="xl:sticky xl:top-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-lg font-semibold text-gray-900">Vista previa</h4>
                  <span className="text-xs text-gray-500">Mobile</span>
                </div>

                <div className="rounded-[28px] border border-gray-200 bg-slate-50 p-3 shadow-sm">
                  <RenderMenuPreview
                    blocks={normalizeBlocks(blocks)}
                    localName={formData.local_name}
                    menuName={formData.name}
                    themeKey={formData.theme_key}
                    lookupData={lookupData}
                  />
                </div>
              </div>
            </aside>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            {menu?.id ? (
              <button
                type="button"
                className="btn border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                onClick={handleDelete}
                disabled={submitting || deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar menu'}
              </button>
            ) : null}
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || deleting}>
              <span className="text-white">{submitting ? 'Guardando...' : 'Guardar menu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuEditorModal;
