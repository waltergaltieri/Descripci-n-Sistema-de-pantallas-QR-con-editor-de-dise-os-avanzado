import React, { useDeferredValue, useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Grid2x2,
  LayoutTemplate,
  List,
  Plus,
  Search,
  Smartphone
} from 'lucide-react';
import { carteleriaService, handleApiError } from '../../services/api';
import MenuEditorModal from './Menus/MenuEditorModal';
import { themePresets } from './Menus/themePresets';

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activos' },
  { value: 'paused', label: 'Pausados' }
];

const statusLabels = {
  draft: 'Borrador',
  active: 'Activo',
  paused: 'Pausado'
};

const statusClasses = {
  draft: 'bg-blue-100 text-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-gray-100 text-gray-700'
};

const SummaryCard = ({ title, value, description, icon: Icon }) => (
  <div className="card">
    <div className="card-body">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
      </div>
    </div>
  </div>
);

const MenuCard = ({ menu, onEdit, onToggleStatus, statusUpdatingId }) => (
  <article className="card">
    <div className="card-body">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{menu.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{menu.local_name || 'Sin nombre de local'}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            statusClasses[menu.status] || statusClasses.draft
          }`}
        >
          {statusLabels[menu.status] || 'Borrador'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          {menu.blocks_count || 0} bloques
        </span>
        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          {(themePresets.find((theme) => theme.key === menu.theme_key)?.label) || menu.theme_key}
        </span>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onToggleStatus(menu)}
          disabled={statusUpdatingId === menu.id}
          aria-label={`${menu.status === 'paused' ? 'Activar' : 'Pausar'} ${menu.name}`}
        >
          {statusUpdatingId === menu.id ? 'Guardando...' : menu.status === 'paused' ? 'Activar' : 'Pausar'}
        </button>
        <button type="button" className="btn btn-outline" onClick={() => onEdit(menu.id)}>
          Editar
        </button>
      </div>
    </div>
  </article>
);

const MenusTable = ({ menus, onEdit, onToggleStatus, statusUpdatingId }) => (
  <div className="card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200" aria-label="Listado de menus">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Menu
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Local
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tema
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Accion
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {menus.map((menu) => (
            <tr key={menu.id}>
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{menu.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{menu.blocks_count || 0} bloques</p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{menu.local_name || 'Sin nombre'}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    statusClasses[menu.status] || statusClasses.draft
                  }`}
                >
                  {statusLabels[menu.status] || 'Borrador'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {(themePresets.find((theme) => theme.key === menu.theme_key)?.label) || menu.theme_key}
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => onToggleStatus(menu)}
                    disabled={statusUpdatingId === menu.id}
                    aria-label={`${menu.status === 'paused' ? 'Activar' : 'Pausar'} ${menu.name}`}
                  >
                    {statusUpdatingId === menu.id
                      ? 'Guardando...'
                      : menu.status === 'paused'
                        ? 'Activar'
                        : 'Pausar'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => onEdit(menu.id)}>
                    Editar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const MenusManager = () => {
  const [metrics, setMetrics] = useState({ activeMenus: 0, activeLinks: 0 });
  const [menus, setMenus] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1
  });
  const [supportData, setSupportData] = useState({
    categories: [],
    products: [],
    promotions: [],
    combos: []
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let mounted = true;

    const loadSupportData = async () => {
      try {
        const [metricsResponse, categoriesResponse, productsResponse, promotionsResponse, combosResponse] =
          await Promise.all([
            carteleriaService.getDashboardMetrics(),
            carteleriaService.getCategories(),
            carteleriaService.getProducts({ page: 1, limit: 100, status: 'active' }),
            carteleriaService.getPromotions({ page: 1, limit: 100, status: 'active' }),
            carteleriaService.getCombos({ page: 1, limit: 100, status: 'active' })
          ]);

        if (!mounted) {
          return;
        }

        setMetrics({
          activeMenus: metricsResponse.data?.activeMenus || 0,
          activeLinks: metricsResponse.data?.activeLinks || 0
        });
        setSupportData({
          categories: categoriesResponse.data || [],
          products: productsResponse.data?.data || [],
          promotions: promotionsResponse.data?.data || [],
          combos: combosResponse.data?.data || []
        });
      } catch (error) {
        if (!mounted) {
          return;
        }

        const apiError = handleApiError(error);
        setErrorMessage(apiError.message);
      }
    };

    loadSupportData();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let mounted = true;

    const loadMenus = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const response = await carteleriaService.getMenus({
          page: pagination.page,
          limit: pagination.limit,
          search: deferredSearch,
          status
        });

        if (!mounted) {
          return;
        }

        setMenus(response.data?.data || []);
        setPagination((currentPagination) => ({
          ...currentPagination,
          ...response.data?.pagination
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

    loadMenus();

    return () => {
      mounted = false;
    };
  }, [deferredSearch, pagination.limit, pagination.page, refreshKey, status]);

  const handleEditMenu = async (menuId) => {
    try {
      const response = await carteleriaService.getMenuById(menuId);
      setSelectedMenu(response.data);
      setEditorOpen(true);
    } catch (error) {
      const apiError = handleApiError(error);
      setErrorMessage(apiError.message);
    }
  };

  const handleCreateMenu = () => {
    setSelectedMenu(null);
    setEditorOpen(true);
  };

  const handleToggleStatus = async (menu) => {
    const nextStatus = menu.status === 'paused' ? 'active' : 'paused';

    try {
      setStatusUpdatingId(menu.id);
      setErrorMessage('');
      await carteleriaService.updateMenu(menu.id, { status: nextStatus });
      setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
    } catch (error) {
      const apiError = handleApiError(error);
      setErrorMessage(apiError.message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteMenu = async (menuId) => {
    try {
      setErrorMessage('');
      await carteleriaService.deleteMenu(menuId);
      setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
    } catch (error) {
      const apiError = handleApiError(error);
      setErrorMessage(apiError.message);
      throw error;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menus</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Desde aca administras menus web mobile-first, armados con bloques vivos conectados al catalogo.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary flex items-center self-start"
          onClick={handleCreateMenu}
          aria-label="Crear menu"
        >
          <Plus className="mr-2 h-4 w-4 text-white" />
          <span className="text-white">Crear menu</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Menus activos"
          value={metrics.activeMenus}
          description="Listos para asignarse a links persistentes y QR."
          icon={BookOpen}
        />
        <SummaryCard
          title="Estilos disponibles"
          value={themePresets.length}
          description="Seis bases visuales sobre un mismo editor flexible."
          icon={LayoutTemplate}
        />
        <SummaryCard
          title="Salida mobile"
          value="100%"
          description="Pensado primero para celular, sin perder lectura en pantallas grandes."
          icon={Smartphone}
        />
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex-1">
              <label htmlFor="menus-search" className="sr-only">
                Buscar menus
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="menus-search"
                  type="search"
                  className="input pl-9"
                  placeholder="Buscar menus..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPagination((currentPagination) => ({ ...currentPagination, page: 1 }));
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label htmlFor="menus-status-filter" className="sr-only">
                Filtrar por estado
              </label>
              <select
                id="menus-status-filter"
                aria-label="Filtrar por estado"
                className="input min-w-[180px]"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPagination((currentPagination) => ({ ...currentPagination, page: 1 }));
                }}
              >
                {statusOptions.map((option) => (
                  <option key={option.value || 'all-status'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('table')}
              >
                <List className={`mr-2 h-4 w-4 ${viewMode === 'table' ? 'text-white' : ''}`} />
                <span className={viewMode === 'table' ? 'text-white' : ''}>Vista tabla</span>
              </button>

              <button
                type="button"
                className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('cards')}
              >
                <Grid2x2 className={`mr-2 h-4 w-4 ${viewMode === 'cards' ? 'text-white' : ''}`} />
                <span className={viewMode === 'cards' ? 'text-white' : ''}>Vista tarjetas</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5" />
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

      {!loading && menus.length === 0 ? (
        <div className="card">
          <div className="card-body py-12 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900">Todavia no hay menus</h3>
            <p className="mt-2 text-sm text-gray-500">
              Crea el primero para empezar a combinar categorias, productos, promos y combos.
            </p>
          </div>
        </div>
      ) : null}

      {!loading && menus.length > 0 && viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {menus.map((menu) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              onEdit={handleEditMenu}
              onToggleStatus={handleToggleStatus}
              statusUpdatingId={statusUpdatingId}
            />
          ))}
        </div>
      ) : null}

      {!loading && menus.length > 0 && viewMode === 'table' ? (
        <MenusTable
          menus={menus}
          onEdit={handleEditMenu}
          onToggleStatus={handleToggleStatus}
          statusUpdatingId={statusUpdatingId}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Pagina {pagination.page} de {pagination.totalPages}
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

        <MenuEditorModal
          categories={supportData.categories}
          combos={supportData.combos}
          isOpen={editorOpen}
          menu={selectedMenu}
          onClose={() => setEditorOpen(false)}
          onDelete={handleDeleteMenu}
          onSuccess={() => setRefreshKey((currentRefreshKey) => currentRefreshKey + 1)}
          products={supportData.products}
          promotions={supportData.promotions}
        />
    </div>
  );
};

export default MenusManager;
