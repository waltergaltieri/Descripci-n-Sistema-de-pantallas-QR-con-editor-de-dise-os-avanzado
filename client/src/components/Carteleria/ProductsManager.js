import React, { useDeferredValue, useEffect, useState } from 'react';
import {
  AlertCircle,
  Camera,
  Grid2x2,
  List,
  Package,
  PauseCircle,
  Plus,
  Search
} from 'lucide-react';
import {
  carteleriaService,
  getFileUrl,
  handleApiError
} from '../../services/api';
import ProductModal from './ProductModal';

const initialMetrics = {
  totalProducts: 0,
  activeProducts: 0,
  pausedProducts: 0,
  soldOutProducts: 0
};

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2
});

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'paused', label: 'Pausados' },
  { value: 'sold_out', label: 'Agotados' }
];

const statusLabels = {
  active: 'Activo',
  paused: 'Pausado',
  sold_out: 'Agotado'
};

const statusClasses = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-gray-100 text-gray-700',
  sold_out: 'bg-amber-100 text-amber-700'
};

const ProductSummaryCard = ({ title, value, description, icon: Icon }) => (
  <div className="card">
    <div className="card-body">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>

        <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
      </div>
    </div>
  </div>
);

const ProductCard = ({ onEdit, product }) => (
  <article className="card overflow-hidden">
    <div className="aspect-[16/10] bg-gray-100 flex items-center justify-center overflow-hidden">
      {product.card_image_url || product.primary_image_url ? (
        <img
          src={getFileUrl(product.card_image_url || product.primary_image_url)}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <Camera className="h-8 w-8 mb-2" />
          <span className="text-sm">Sin imagen</span>
        </div>
      )}
    </div>

    <div className="card-body">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{product.category_name || 'Sin categoría'}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            statusClasses[product.status] || statusClasses.active
          }`}
        >
          {statusLabels[product.status] || 'Activo'}
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-600 min-h-[40px]">
        {product.description || 'Sin descripción cargada todavía.'}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xl font-semibold text-gray-900">
          {currencyFormatter.format(product.price || 0)}
        </span>
        <button type="button" className="btn btn-outline" onClick={() => onEdit(product.id)}>
          Editar
        </button>
      </div>
    </div>
  </article>
);

const ProductsTable = ({ onEdit, products }) => (
  <div className="card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200" aria-label="Listado de productos">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Producto
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Categoría
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Precio
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Acción
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {product.description || 'Sin descripción'}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {product.category_name || 'Sin categoría'}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    statusClasses[product.status] || statusClasses.active
                  }`}
                >
                  {statusLabels[product.status] || 'Activo'}
                </span>
              </td>
              <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                {currencyFormatter.format(product.price || 0)}
              </td>
              <td className="px-6 py-4 text-right">
                <button type="button" className="btn btn-outline" onClick={() => onEdit(product.id)}>
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ProductsManager = () => {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      try {
        const [metricsResponse, categoriesResponse] = await Promise.all([
          carteleriaService.getDashboardMetrics(),
          carteleriaService.getCategories()
        ]);

        if (!mounted) {
          return;
        }

        setMetrics({ ...initialMetrics, ...metricsResponse.data });
        setCategories(categoriesResponse.data || []);
      } catch (error) {
        if (!mounted) {
          return;
        }

        const apiError = handleApiError(error);
        setErrorMessage(apiError.message);
      }
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const params = {
          page: pagination.page,
          limit: pagination.limit,
          search: deferredSearch,
          status,
          categoryId
        };

        const response = await carteleriaService.getProducts(params);

        if (!mounted) {
          return;
        }

        setProducts(response.data.data || []);
        setPagination((currentPagination) => ({
          ...currentPagination,
          ...response.data.pagination
        }));
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

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [categoryId, deferredSearch, pagination.limit, pagination.page, refreshKey, status]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPagination((currentPagination) => ({
      ...currentPagination,
      page: 1
    }));
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPagination((currentPagination) => ({
      ...currentPagination,
      page: 1
    }));
  };

  const handleCategoryChange = (event) => {
    setCategoryId(event.target.value);
    setPagination((currentPagination) => ({
      ...currentPagination,
      page: 1
    }));
  };

  const hasProducts = products.length > 0;

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const handleEditProduct = async (productId) => {
    try {
      const response = await carteleriaService.getProductById(productId);
      setSelectedProduct(response.data);
      setModalOpen(true);
    } catch (error) {
      const apiError = handleApiError(error);
      setErrorMessage(apiError.message);
    }
  };

  const handleProductSaved = () => {
    setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          <p className="mt-1 text-sm text-gray-600 max-w-3xl">
            Acá vive el catálogo base del local. Cada producto alimenta menús,
            promociones y combos sin duplicar información.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary flex items-center self-start"
          onClick={handleCreateProduct}
        >
          <Plus className="h-4 w-4 mr-2 text-white" />
          <span className="text-white">Nuevo producto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <ProductSummaryCard
          title="Con foto principal"
          value={metrics.totalProducts - metrics.pausedProducts}
          description="Productos visibles o listos para mostrarse con imagen destacada."
          icon={Camera}
        />
        <ProductSummaryCard
          title="Visibles en menús"
          value={metrics.activeProducts}
          description="Solo cuentan productos activos y no pausados."
          icon={Package}
        />
        <ProductSummaryCard
          title="Pausados"
          value={metrics.pausedProducts}
          description="Desaparecen automáticamente de los menús publicados."
          icon={PauseCircle}
        />
        <ProductSummaryCard
          title="Agotados"
          value={metrics.soldOutProducts}
          description="Siguen visibles, pero marcados para el cliente."
          icon={AlertCircle}
        />
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex-1">
              <label htmlFor="products-search" className="sr-only">
                Buscar productos
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="products-search"
                  type="search"
                  className="input pl-9"
                  placeholder="Buscar productos..."
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="products-status-filter">
                Filtrar por estado
              </label>
              <select
                id="products-status-filter"
                aria-label="Filtrar por estado"
                className="input min-w-[180px]"
                value={status}
                onChange={handleStatusChange}
              >
                {statusOptions.map((option) => (
                  <option key={option.value || 'all-status'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="products-category-filter">
                Filtrar por categoría
              </label>
              <select
                id="products-category-filter"
                aria-label="Filtrar por categoría"
                className="input min-w-[200px]"
                value={categoryId}
                onChange={handleCategoryChange}
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('table')}
              >
                <List className={`h-4 w-4 mr-2 ${viewMode === 'table' ? 'text-white' : ''}`} />
                <span className={viewMode === 'table' ? 'text-white' : ''}>Vista tabla</span>
              </button>

              <button
                type="button"
                className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('cards')}
              >
                <Grid2x2 className={`h-4 w-4 mr-2 ${viewMode === 'cards' ? 'text-white' : ''}`} />
                <span className={viewMode === 'cards' ? 'text-white' : ''}>Vista tarjetas</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="card">
          <div className="card-body flex items-center justify-center py-12">
            <div className="loading-spinner h-10 w-10" />
          </div>
        </div>
      ) : null}

      {!loading && !hasProducts ? (
        <div className="card">
          <div className="card-body py-12 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Todavía no hay productos</h3>
            <p className="mt-2 text-sm text-gray-500">
              Cuando cargues el catálogo, acá vas a poder filtrarlo, paginarlo y editarlo.
            </p>
          </div>
        </div>
      ) : null}

      {!loading && hasProducts && viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} onEdit={handleEditProduct} product={product} />
          ))}
        </div>
      ) : null}

      {!loading && hasProducts && viewMode === 'table' ? (
        <ProductsTable onEdit={handleEditProduct} products={products} />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Página {pagination.page} de {pagination.totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-outline"
            disabled={pagination.page <= 1}
            onClick={() =>
              setPagination((currentPagination) => ({
                ...currentPagination,
                page: currentPagination.page - 1
              }))
            }
          >
            Anterior
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() =>
              setPagination((currentPagination) => ({
                ...currentPagination,
                page: currentPagination.page + 1
              }))
            }
          >
            Siguiente
          </button>
        </div>
      </div>

      <ProductModal
        categories={categories}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleProductSaved}
        product={selectedProduct}
      />
    </div>
  );
};

export default ProductsManager;
