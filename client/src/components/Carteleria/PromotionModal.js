import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { carteleriaService, uploadsService } from '../../services/api';
import {
  formatArgentinaNumberInput,
  parseLocalizedNumberInput
} from '../../utils/argentinaNumberFormat';

const promotionTypeOptions = [
  { value: 'percentage_discount', label: 'Descuento %' },
  { value: 'two_for_one', label: '2x1' },
  { value: 'second_unit_percentage', label: 'Descuento en segunda unidad' },
  { value: 'free_with_other_product', label: 'Gratis con otro producto' },
  { value: 'free_with_minimum_spend', label: 'Gratis al superar gasto' },
  { value: 'discount_with_minimum_spend', label: 'Descuento al superar gasto' }
];

const durationUnitOptions = [
  { value: 'minutes', label: 'Minutos' },
  { value: 'hours', label: 'Horas' },
  { value: 'days', label: 'Dias' }
];

const initialFormState = {
  kind: 'promotion',
  name: '',
  description: '',
  status: 'active',
  promotionTargetKind: 'product',
  productId: '',
  comboTargetId: '',
  triggerProductId: '',
  promotionType: 'percentage_discount',
  discountPercentage: '',
  minimumSpend: '',
  conditionsText: '',
  startsAt: '',
  noExpiration: true,
  endsAt: '',
  expirationMode: 'absolute',
  durationAmount: '1',
  durationUnit: 'hours',
  hasCountdown: false,
  comboPrice: '',
  comboImageUploadId: null,
  comboImageUrl: '',
  comboProductIds: [],
  menuIds: []
};

const toDateTimeLocal = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const formatLocalDateTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const addRelativeDuration = (baseDate, amount, unit) => {
  const resolvedDate = new Date(baseDate);

  if (unit === 'minutes') {
    resolvedDate.setMinutes(resolvedDate.getMinutes() + amount);
    return resolvedDate;
  }

  if (unit === 'days') {
    resolvedDate.setDate(resolvedDate.getDate() + amount);
    return resolvedDate;
  }

  resolvedDate.setHours(resolvedDate.getHours() + amount);
  return resolvedDate;
};

const resolveExpirationDates = (formData) => {
  const startsAt = formData.startsAt || '';

  if (formData.noExpiration) {
    return {
      startsAt,
      endsAt: ''
    };
  }

  if (formData.expirationMode === 'absolute') {
    return {
      startsAt,
      endsAt: formData.endsAt || ''
    };
  }

  const amount = Number(formData.durationAmount);
  const baseDate = formData.startsAt ? new Date(formData.startsAt) : new Date();

  if (Number.isNaN(amount) || amount <= 0 || Number.isNaN(baseDate.getTime())) {
    return {
      startsAt,
      endsAt: ''
    };
  }

  return {
    startsAt,
    endsAt: formatLocalDateTime(addRelativeDuration(baseDate, amount, formData.durationUnit))
  };
};

const buildFormStateFromEntry = (entry) => {
  if (!entry) {
    return initialFormState;
  }

  if (entry.kind === 'combo') {
    const comboPrice =
      entry.combo_price !== undefined && entry.combo_price !== null
        ? entry.combo_price
        : Number(entry.combo_price_cents || 0) / 100;

    return {
      ...initialFormState,
      kind: 'combo',
      name: entry.name || '',
      description: entry.description || '',
      status: entry.status || 'active',
      conditionsText: entry.conditions_text || '',
      startsAt: toDateTimeLocal(entry.starts_at),
      noExpiration: Boolean(entry.no_expiration),
      endsAt: toDateTimeLocal(entry.ends_at),
      expirationMode: 'absolute',
      hasCountdown: Boolean(entry.has_countdown),
      comboPrice:
        comboPrice !== undefined && comboPrice !== null && comboPrice !== ''
          ? formatArgentinaNumberInput(String(comboPrice))
          : '',
      comboImageUploadId: entry.image_upload_id || null,
      comboImageUrl: entry.image_url || '',
      comboProductIds: (entry.items || []).map((item) => String(item.product_id)),
      menuIds: (entry.menu_ids || []).map((menuId) => String(menuId))
    };
  }

  return {
    ...initialFormState,
    kind: 'promotion',
    name: entry.name || '',
    description: entry.description || '',
    status: entry.status || 'active',
    promotionTargetKind: entry.target_combo_id ? 'combo' : 'product',
    productId: entry.target_product_id ? String(entry.target_product_id) : '',
    comboTargetId: entry.target_combo_id ? String(entry.target_combo_id) : '',
    triggerProductId: entry.trigger_product_id ? String(entry.trigger_product_id) : '',
    promotionType: entry.type || 'percentage_discount',
    discountPercentage:
      entry.discount_percentage !== null && entry.discount_percentage !== undefined
        ? formatArgentinaNumberInput(String(entry.discount_percentage))
        : '',
    minimumSpend:
      entry.minimum_spend_cents !== null && entry.minimum_spend_cents !== undefined
        ? formatArgentinaNumberInput(String(Number(entry.minimum_spend_cents) / 100))
        : '',
    conditionsText: entry.conditions_text || '',
    startsAt: toDateTimeLocal(entry.starts_at),
    noExpiration: Boolean(entry.no_expiration),
    endsAt: toDateTimeLocal(entry.ends_at),
    expirationMode: 'absolute',
    hasCountdown: Boolean(entry.has_countdown)
  };
};

const CheckboxMultiSelector = ({
  disabled,
  error,
  items,
  label,
  onSearchChange,
  onToggle,
  searchLabel,
  searchPlaceholder,
  searchValue,
  selectedValues
}) => {
  const selectedItems = items.filter((item) => selectedValues.includes(String(item.id)));
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchValue.trim().toLowerCase())
  );

  return (
    <div>
      <span className="label">{label}</span>

      <div className={`rounded-2xl border bg-white ${error ? 'border-red-300' : 'border-gray-200'}`}>
        <div className="border-b border-gray-100 p-4">
          <label htmlFor="combo-products-search" className="label">
            {searchLabel}
          </label>
          <input
            id="combo-products-search"
            type="search"
            className="input"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            disabled={disabled}
          />
          <p className="mt-2 text-xs text-gray-500">
            Haz clic para sumar o quitar productos. No hace falta usar teclado ni Ctrl.
          </p>
        </div>

        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-900">Seleccionados</p>
            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
              {selectedItems.length}
            </span>
          </div>

          {selectedItems.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700"
                  onClick={() => onToggle(String(item.id))}
                  disabled={disabled}
                >
                  {item.name}
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Aun no agregaste productos al combo.</p>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const checked = selectedValues.includes(String(item.id));

              return (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition ${
                    checked ? 'bg-primary-50/60' : 'hover:bg-gray-50'
                  } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    onChange={() => onToggle(String(item.id))}
                    disabled={disabled}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      {item.status ? (
                        <span
                          aria-hidden="true"
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-500"
                        >
                          {item.status}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </label>
              );
            })
          ) : (
            <div className="px-4 py-6 text-sm text-gray-500">
              No encontramos productos con esa busqueda.
            </div>
          )}
        </div>
      </div>

      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
};

const PromotionModal = ({
  combos = [],
  existingEntry,
  isOpen,
  menus,
  onClose,
  onSuccess,
  products
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [uploadingComboImage, setUploadingComboImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [comboProductSearch, setComboProductSearch] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(buildFormStateFromEntry(existingEntry));
    setErrors({});
    setComboProductSearch('');
  }, [existingEntry, isOpen]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    const nextValue =
      type === 'checkbox'
        ? checked
        : ['discountPercentage', 'minimumSpend', 'comboPrice'].includes(name)
          ? formatArgentinaNumberInput(value)
          : value;

    setFormData((currentFormData) => {
      const nextFormData = {
        ...currentFormData,
        [name]: nextValue
      };

      if (name === 'promotionTargetKind') {
        if (value === 'product') {
          nextFormData.comboTargetId = '';
        } else {
          nextFormData.productId = '';
        }
      }

      if (name === 'noExpiration' && checked) {
        nextFormData.endsAt = '';
        nextFormData.hasCountdown = false;
      }

      if (name === 'hasCountdown' && checked) {
        nextFormData.noExpiration = false;
      }

      return nextFormData;
    });

    if (errors[name]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [name]: ''
      }));
    }
  };

  const handleMultiSelectChange = (event, fieldName) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);

    setFormData((currentFormData) => ({
      ...currentFormData,
      [fieldName]: values
    }));
  };

  const toggleArraySelection = (fieldName, value) => {
    setFormData((currentFormData) => {
      const currentValues = currentFormData[fieldName] || [];
      const hasValue = currentValues.includes(value);

      return {
        ...currentFormData,
        [fieldName]: hasValue
          ? currentValues.filter((currentValue) => currentValue !== value)
          : [...currentValues, value]
      };
    });

    if (errors[fieldName]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [fieldName]: ''
      }));
    }
  };

  const comboProductOptions = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        name: product.name,
        status: product.status
      })),
    [products]
  );

  const handleComboImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingComboImage(true);

    try {
      const response = await uploadsService.uploadImage(file);

      setFormData((currentFormData) => ({
        ...currentFormData,
        comboImageUploadId: response.data?.id || currentFormData.comboImageUploadId,
        comboImageUrl: response.data?.url || currentFormData.comboImageUrl
      }));
    } catch (error) {
      toast.error('No se pudo subir la imagen del combo.');
    } finally {
      setUploadingComboImage(false);
    }
  };

  const validateExpiration = (nextErrors) => {
    if (formData.noExpiration) {
      return;
    }

    if (formData.expirationMode === 'absolute') {
      if (!formData.endsAt) {
        nextErrors.endsAt = 'Define una fecha de cierre.';
      }
      return;
    }

    const durationAmount = Number(formData.durationAmount);
    if (Number.isNaN(durationAmount) || durationAmount <= 0) {
      nextErrors.durationAmount = 'Ingresa una duracion valida.';
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'El nombre es obligatorio.';
    }

    if (formData.kind === 'promotion') {
      if (formData.promotionTargetKind === 'product' && !formData.productId) {
        nextErrors.productId = 'Elige un producto.';
      }

      if (formData.promotionTargetKind === 'combo' && !formData.comboTargetId) {
        nextErrors.comboTargetId = 'Elige un combo.';
      }

      if (
        formData.promotionType === 'percentage_discount' ||
        formData.promotionType === 'second_unit_percentage'
      ) {
        const discount = parseLocalizedNumberInput(formData.discountPercentage);
        if (discount === null || discount <= 0) {
          nextErrors.discountPercentage = 'Ingresa un descuento valido.';
        }
      }
    }

    if (formData.kind === 'combo') {
      if (formData.comboProductIds.length === 0) {
        nextErrors.comboProductIds = 'Elige al menos un producto.';
      }

      const comboPrice = parseLocalizedNumberInput(formData.comboPrice);
      if (comboPrice === null || comboPrice < 0) {
        nextErrors.comboPrice = 'Ingresa un precio valido para el combo.';
      }
    }

    validateExpiration(nextErrors);

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const { startsAt, endsAt } = resolveExpirationDates(formData);
      const parsedDiscountPercentage = parseLocalizedNumberInput(formData.discountPercentage);
      const parsedMinimumSpend = parseLocalizedNumberInput(formData.minimumSpend);
      const parsedComboPrice = parseLocalizedNumberInput(formData.comboPrice);

      if (formData.kind === 'promotion') {
        const payload = {
          name: formData.name.trim(),
          status: formData.status,
          type: formData.promotionType,
          target_product_id: formData.promotionTargetKind === 'product' ? formData.productId : '',
          target_combo_id: formData.promotionTargetKind === 'combo' ? formData.comboTargetId : '',
          trigger_product_id: formData.triggerProductId,
          discount_percentage: parsedDiscountPercentage ?? 0,
          minimum_spend: parsedMinimumSpend ?? '',
          description: formData.description.trim(),
          conditions_text: formData.conditionsText.trim(),
          has_countdown: formData.hasCountdown,
          starts_at: startsAt,
          no_expiration: formData.noExpiration,
          ends_at: endsAt
        };

        if (existingEntry?.id && existingEntry.kind !== 'combo') {
          await carteleriaService.updatePromotion(existingEntry.id, payload);
          toast.success('Promocion actualizada correctamente');
        } else {
          await carteleriaService.createPromotion(payload);
          toast.success('Promocion creada correctamente');
        }
      } else {
        const payload = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.status,
          conditions_text: formData.conditionsText.trim(),
          combo_price: parsedComboPrice ?? 0,
          image_upload_id: formData.comboImageUploadId,
          product_ids: formData.comboProductIds,
          menu_ids: formData.menuIds,
          has_countdown: formData.hasCountdown,
          starts_at: startsAt,
          no_expiration: formData.noExpiration,
          ends_at: endsAt
        };

        if (existingEntry?.id && existingEntry.kind === 'combo') {
          await carteleriaService.updateCombo(existingEntry.id, payload);
          toast.success('Combo actualizado correctamente');
        } else {
          await carteleriaService.createCombo(payload);
          toast.success('Combo creado correctamente');
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      const message = error?.response?.data?.error || 'No se pudo guardar la promocion.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const isEditing = Boolean(existingEntry?.id);
  const isPromotion = formData.kind === 'promotion';

  return (
    <div className="modal-overlay">
      <div className="modal modal-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Editar promocion o combo' : 'Nueva promocion o combo'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Define una promo individual o arma un combo para publicarlo en tus menus.
            </p>
          </div>

          <button
            type="button"
            className="text-gray-400 transition-colors hover:text-gray-600"
            onClick={onClose}
            disabled={submitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="promotion-kind" className="label">
                Tipo de alta
              </label>
              <select
                id="promotion-kind"
                name="kind"
                className="input"
                value={formData.kind}
                onChange={handleChange}
                disabled={submitting || isEditing}
              >
                <option value="promotion">Promocion</option>
                <option value="combo">Combo</option>
              </select>
            </div>

            <div>
              <label htmlFor="promotion-name" className="label">
                Nombre
              </label>
              <input
                id="promotion-name"
                name="name"
                type="text"
                className={`input ${errors.name ? 'input-error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                disabled={submitting}
              />
              {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name}</p> : null}
            </div>

            <div>
              <label htmlFor="promotion-status" className="label">
                Estado
              </label>
              <select
                id="promotion-status"
                name="status"
                className="input"
                value={formData.status}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
                <option value="expired">Vencido</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="promotion-description" className="label">
              Descripcion
            </label>
            <textarea
              id="promotion-description"
              name="description"
              rows={3}
              className="input"
              value={formData.description}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          {isPromotion ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="promotion-target-kind" className="label">
                    Aplicar a
                  </label>
                  <select
                    id="promotion-target-kind"
                    name="promotionTargetKind"
                    className="input"
                    value={formData.promotionTargetKind}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="product">Producto</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={formData.promotionTargetKind === 'combo' ? 'promotion-combo' : 'promotion-product'}
                    className="label"
                  >
                    {formData.promotionTargetKind === 'combo' ? 'Combo' : 'Producto'}
                  </label>
                  {formData.promotionTargetKind === 'combo' ? (
                    <>
                      <select
                        id="promotion-combo"
                        name="comboTargetId"
                        className={`input ${errors.comboTargetId ? 'input-error' : ''}`}
                        value={formData.comboTargetId}
                        onChange={handleChange}
                        disabled={submitting}
                      >
                        <option value="">Seleccionar combo</option>
                        {combos.map((combo) => (
                          <option key={combo.id} value={combo.id}>
                            {combo.name}
                          </option>
                        ))}
                      </select>
                      {errors.comboTargetId ? (
                        <p className="mt-1 text-sm text-red-600">{errors.comboTargetId}</p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <select
                        id="promotion-product"
                        name="productId"
                        className={`input ${errors.productId ? 'input-error' : ''}`}
                        value={formData.productId}
                        onChange={handleChange}
                        disabled={submitting}
                      >
                        <option value="">Seleccionar producto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      {errors.productId ? (
                        <p className="mt-1 text-sm text-red-600">{errors.productId}</p>
                      ) : null}
                    </>
                  )}
                </div>

                <div>
                  <label htmlFor="promotion-type" className="label">
                    Tipo de promocion
                  </label>
                  <select
                    id="promotion-type"
                    name="promotionType"
                    className="input"
                    value={formData.promotionType}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    {promotionTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="promotion-trigger-product" className="label">
                    Producto disparador (opcional)
                  </label>
                  <select
                    id="promotion-trigger-product"
                    name="triggerProductId"
                    className="input"
                    value={formData.triggerProductId}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="">Sin producto disparador</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="promotion-discount" className="label">
                    Descuento (%)
                  </label>
                  <input
                    id="promotion-discount"
                    name="discountPercentage"
                    type="text"
                    inputMode="decimal"
                    className={`input ${errors.discountPercentage ? 'input-error' : ''}`}
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    placeholder="Ej: 15,50"
                    disabled={submitting}
                  />
                  {errors.discountPercentage ? (
                    <p className="mt-1 text-sm text-red-600">{errors.discountPercentage}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="promotion-minimum-spend" className="label">
                  Gasto minimo (opcional)
                </label>
                <input
                  id="promotion-minimum-spend"
                  name="minimumSpend"
                  type="text"
                  inputMode="decimal"
                  className="input"
                  value={formData.minimumSpend}
                  onChange={handleChange}
                  placeholder="Ej: 12.500"
                  disabled={submitting}
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CheckboxMultiSelector
                  label="Productos del combo"
                  searchLabel="Buscar productos del combo"
                  searchPlaceholder="Buscar por nombre..."
                  items={comboProductOptions}
                  selectedValues={formData.comboProductIds}
                  searchValue={comboProductSearch}
                  onSearchChange={setComboProductSearch}
                  onToggle={(value) => toggleArraySelection('comboProductIds', value)}
                  error={errors.comboProductIds}
                  disabled={submitting}
                />

                <div className="space-y-4">
                  <div>
                    <label htmlFor="combo-price" className="label">
                      Precio del combo
                    </label>
                    <input
                      id="combo-price"
                      name="comboPrice"
                      type="text"
                      inputMode="decimal"
                      className={`input ${errors.comboPrice ? 'input-error' : ''}`}
                      value={formData.comboPrice}
                      onChange={handleChange}
                      placeholder="Ej: 8.900"
                      disabled={submitting}
                    />
                    {errors.comboPrice ? <p className="mt-1 text-sm text-red-600">{errors.comboPrice}</p> : null}
                  </div>

                  <div>
                    <label htmlFor="combo-image" className="label">
                      Imagen del combo
                    </label>
                    <input
                      id="combo-image"
                      type="file"
                      accept="image/*"
                      className="input"
                      onChange={handleComboImageUpload}
                      disabled={submitting || uploadingComboImage}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      {uploadingComboImage
                        ? 'Subiendo imagen...'
                        : formData.comboImageUploadId
                          ? 'Imagen lista. Si no cargas una, el sistema usa la del primer producto.'
                          : 'Opcional. Si no cargas una, el sistema usa la del primer producto.'}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="combo-menus" className="label">
                      Menus visibles
                    </label>
                    <select
                      id="combo-menus"
                      multiple
                      className="input h-28"
                      value={formData.menuIds}
                      onChange={(event) => handleMultiSelectChange(event, 'menuIds')}
                      disabled={submitting}
                    >
                      {menus.map((menu) => (
                        <option key={menu.id} value={menu.id}>
                          {menu.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="promotion-conditions" className="label">
              Condiciones
            </label>
            <textarea
              id="promotion-conditions"
              name="conditionsText"
              rows={3}
              className="input"
              value={formData.conditionsText}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="promotion-starts-at" className="label">
                Inicia el
              </label>
              <input
                id="promotion-starts-at"
                name="startsAt"
                type="datetime-local"
                className="input"
                value={formData.startsAt}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            {!formData.noExpiration ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="promotion-expiration-mode" className="label">
                    Modo de vencimiento
                  </label>
                  <select
                    id="promotion-expiration-mode"
                    name="expirationMode"
                    className="input"
                    value={formData.expirationMode}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="absolute">Fecha y hora</option>
                    <option value="relative">Duracion</option>
                  </select>
                </div>

                {formData.expirationMode === 'absolute' ? (
                  <div>
                    <label htmlFor="promotion-ends-at" className="label">
                      Vence el
                    </label>
                    <input
                      id="promotion-ends-at"
                      name="endsAt"
                      type="datetime-local"
                      className={`input ${errors.endsAt ? 'input-error' : ''}`}
                      value={formData.endsAt}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                    {errors.endsAt ? <p className="mt-1 text-sm text-red-600">{errors.endsAt}</p> : null}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="promotion-duration-amount" className="label">
                        Duracion
                      </label>
                      <input
                        id="promotion-duration-amount"
                        name="durationAmount"
                        type="number"
                        min="1"
                        step="1"
                        className={`input ${errors.durationAmount ? 'input-error' : ''}`}
                        value={formData.durationAmount}
                        onChange={handleChange}
                        disabled={submitting}
                      />
                      {errors.durationAmount ? (
                        <p className="mt-1 text-sm text-red-600">{errors.durationAmount}</p>
                      ) : null}
                    </div>

                    <div>
                      <label htmlFor="promotion-duration-unit" className="label">
                        Unidad de duracion
                      </label>
                      <select
                        id="promotion-duration-unit"
                        name="durationUnit"
                        className="input"
                        value={formData.durationUnit}
                        onChange={handleChange}
                        disabled={submitting}
                      >
                        {durationUnitOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500">
                Sin fecha de cierre configurada.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                name="noExpiration"
                checked={formData.noExpiration}
                onChange={handleChange}
                disabled={submitting}
              />
              <span className="text-sm text-gray-700">Sin vencimiento</span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                name="hasCountdown"
                checked={formData.hasCountdown}
                onChange={handleChange}
                disabled={submitting}
              />
              <span className="text-sm text-gray-700">Activar cuenta regresiva</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <span className="text-white">
                {submitting ? 'Guardando...' : isPromotion ? 'Guardar promocion' : 'Guardar combo'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromotionModal;
