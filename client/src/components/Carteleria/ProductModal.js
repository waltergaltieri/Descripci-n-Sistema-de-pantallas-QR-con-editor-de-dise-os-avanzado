import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, ImagePlus, UploadCloud, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { carteleriaService, getFileUrl, uploadsService } from '../../services/api';
import {
  formatArgentinaNumberInput,
  parseLocalizedNumberInput
} from '../../utils/argentinaNumberFormat';

const initialFormState = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  newCategoryName: '',
  status: 'active'
};

const buildPreviewUrl = (file) => {
  if (!file) {
    return '';
  }

  return URL.createObjectURL(file);
};

const ProductModal = ({
  categories,
  isOpen,
  onClose,
  onSuccess,
  product
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [primaryImageFile, setPrimaryImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price:
          product.price !== undefined && product.price !== null
            ? formatArgentinaNumberInput(String(product.price))
            : '',
        categoryId: product.category_id ? String(product.category_id) : '',
        newCategoryName: '',
        status: product.status || 'active'
      });
    } else {
      setFormData(initialFormState);
    }

    setPrimaryImageFile(null);
    setGalleryFiles([]);
    setErrors({});
  }, [isOpen, product]);

  const parsedPrice = parseLocalizedNumberInput(formData.price);
  const primaryImagePreviewUrl = useMemo(
    () => (primaryImageFile ? buildPreviewUrl(primaryImageFile) : ''),
    [primaryImageFile]
  );
  const existingPrimaryImageUrl = product?.primary_image_url ? getFileUrl(product.primary_image_url) : '';

  useEffect(
    () => () => {
      if (primaryImagePreviewUrl) {
        URL.revokeObjectURL(primaryImagePreviewUrl);
      }
    },
    [primaryImagePreviewUrl]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === 'price' ? formatArgentinaNumberInput(value) : value;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: nextValue
    }));

    if (errors[name]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [name]: ''
      }));
    }
  };

  const handlePrimaryImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setPrimaryImageFile(file);
  };

  const handleGalleryChange = (event) => {
    setGalleryFiles(Array.from(event.target.files || []));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'El nombre es obligatorio.';
    }

    if (parsedPrice === null || parsedPrice < 0) {
      nextErrors.price = 'El precio debe ser un numero valido.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const uploadPrimaryImage = async () => {
    if (!primaryImageFile) {
      return product?.primary_image_upload_id || null;
    }

    const response = await uploadsService.uploadImage(primaryImageFile);
    return response.data.id;
  };

  const uploadGalleryImages = async () => {
    if (galleryFiles.length === 0) {
      return product?.images?.map((image) => image.upload_id) || [];
    }

    const response = await uploadsService.uploadImages(galleryFiles);
    return response.data.map((file) => file.id);
  };

  const resolveCategoryId = async () => {
    if (formData.newCategoryName.trim()) {
      const response = await carteleriaService.createCategory({
        name: formData.newCategoryName.trim()
      });

      return String(response.data.id);
    }

    return formData.categoryId || '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const [resolvedCategoryId, primaryImageUploadId, galleryUploadIds] = await Promise.all([
        resolveCategoryId(),
        uploadPrimaryImage(),
        uploadGalleryImages()
      ]);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parsedPrice,
        category_id: resolvedCategoryId,
        status: formData.status,
        primary_image_upload_id: primaryImageUploadId,
        gallery_upload_ids: galleryUploadIds
      };

      if (product?.id) {
        await carteleriaService.updateProduct(product.id, payload);
        toast.success('Producto actualizado correctamente');
      } else {
        await carteleriaService.createProduct(payload);
        toast.success('Producto creado correctamente');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const message = error?.response?.data?.error || 'No se pudo guardar el producto.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {product ? 'Editar producto' : 'Nuevo producto'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Carga la ficha del producto para que se refleje despues en menus, promociones y combos.
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="product-name" className="label">
                Nombre
              </label>
              <input
                id="product-name"
                name="name"
                type="text"
                aria-label="Nombre"
                className={`input ${errors.name ? 'input-error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Limonada de menta"
                disabled={submitting}
              />
              {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name}</p> : null}
            </div>

            <div>
              <label htmlFor="product-price" className="label">
                Precio
              </label>
              <input
                id="product-price"
                name="price"
                type="text"
                inputMode="decimal"
                aria-label="Precio"
                className={`input ${errors.price ? 'input-error' : ''}`}
                value={formData.price}
                onChange={handleChange}
                placeholder="Ej: 1.500,50"
                disabled={submitting}
              />
              {errors.price ? <p className="mt-1 text-sm text-red-600">{errors.price}</p> : null}
            </div>
          </div>

          <div>
            <label htmlFor="product-description" className="label">
              Descripcion
            </label>
            <textarea
              id="product-description"
              name="description"
              rows={4}
              aria-label="Descripcion"
              className="input"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripcion breve para el cliente"
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="product-category" className="label">
                Categoria
              </label>
              <select
                id="product-category"
                name="categoryId"
                aria-label="Categoria"
                className="input"
                value={formData.categoryId}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="">Sin categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="product-status" className="label">
                Estado
              </label>
              <select
                id="product-status"
                name="status"
                className="input"
                value={formData.status}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
                <option value="sold_out">Agotado</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="product-new-category" className="label">
              Nueva categoria (opcional)
            </label>
            <input
              id="product-new-category"
              name="newCategoryName"
              type="text"
              className="input"
              value={formData.newCategoryName}
              onChange={handleChange}
              placeholder="Si no existe, puedes crearla aqui"
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  <ImagePlus className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <label htmlFor="product-primary-image" className="label">
                    Foto principal
                  </label>
                  <p className="text-sm text-gray-500">
                    Se usa en tarjetas, destacados y previews del menu.
                  </p>

                  <input
                    id="product-primary-image"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handlePrimaryImageChange}
                    disabled={submitting}
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="product-primary-image"
                      className="btn btn-outline cursor-pointer"
                    >
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Elegir imagen
                    </label>

                    <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
                      {primaryImageFile?.name ||
                        (product?.primary_image_url ? 'Imagen actual cargada' : 'Sin imagen seleccionada')}
                    </span>
                  </div>

                  {primaryImagePreviewUrl || existingPrimaryImageUrl ? (
                    <img
                      src={primaryImagePreviewUrl || existingPrimaryImageUrl}
                      alt="Preview foto principal"
                      className="mt-4 h-28 w-full rounded-2xl object-cover"
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  <ImageIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <label htmlFor="product-gallery" className="label">
                    Mas fotos
                  </label>
                  <p className="text-sm text-gray-500">
                    Puedes sumar varias imagenes para usar despues en el catalogo.
                  </p>

                  <input
                    id="product-gallery"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleGalleryChange}
                    disabled={submitting}
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="product-gallery"
                      className="btn btn-outline cursor-pointer"
                    >
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Elegir archivos
                    </label>

                    <span className="text-sm text-gray-600">
                      {galleryFiles.length > 0
                        ? `${galleryFiles.length} archivo(s) listos para subir`
                        : `${product?.images?.length || 0} archivo(s) actualmente guardados`}
                    </span>
                  </div>

                  {galleryFiles.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {galleryFiles.slice(0, 3).map((file) => (
                        <span
                          key={`${file.name}-${file.size}`}
                          className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm"
                        >
                          {file.name}
                        </span>
                      ))}
                      {galleryFiles.length > 3 ? (
                        <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
                          +{galleryFiles.length - 3} mas
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <ImagePlus className="mt-0.5 h-5 w-5 text-primary-600" />
              <p className="text-sm text-gray-600">
                Los cambios de precio, estado e imagen se reflejan despues en menus, promociones y combos sin duplicar datos.
              </p>
            </div>
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
                {submitting ? 'Guardando...' : 'Guardar producto'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
