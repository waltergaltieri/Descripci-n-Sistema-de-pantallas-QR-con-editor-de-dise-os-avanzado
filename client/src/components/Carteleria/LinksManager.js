import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  Grid2x2,
  Link as LinkIcon,
  List,
  Plus,
  QrCode,
  Search
} from 'lucide-react';
import { carteleriaService, handleApiError } from '../../services/api';
import LinkEditorModal from './Links/LinkEditorModal';

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'paused', label: 'Pausados' }
];

const statusLabels = {
  active: 'Activo',
  paused: 'Pausado'
};

const statusClasses = {
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

const LinkCard = ({ item, onEdit, onToggleStatus, statusUpdatingId }) => (
  <article className="card">
    <div className="card-body">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{item.description || 'Sin descripcion'}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            statusClasses[item.status] || statusClasses.active
          }`}
        >
          {statusLabels[item.status] || 'Activo'}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-medium text-gray-900">Slug:</span> {item.slug}
        </p>
        <p>
          <span className="font-medium text-gray-900">Menu por defecto:</span>{' '}
          {item.default_menu_name || 'Sin menu'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          {item.rules_count || 0} reglas
        </span>
        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          QR listo
        </span>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onToggleStatus(item)}
          disabled={statusUpdatingId === item.id}
          aria-label={`${item.status === 'paused' ? 'Activar' : 'Pausar'} ${item.name}`}
        >
          {statusUpdatingId === item.id ? 'Guardando...' : item.status === 'paused' ? 'Activar' : 'Pausar'}
        </button>
        <button type="button" className="btn btn-outline" onClick={() => onEdit(item.id)}>
          Editar
        </button>
      </div>
    </div>
  </article>
);

const LinksTable = ({ items, onEdit, onToggleStatus, statusUpdatingId }) => (
  <div className="card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200" aria-label="Listado de links persistentes">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Link
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Slug
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Menu
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Accion
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.description || 'Sin descripcion'}</p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{item.slug}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{item.default_menu_name || 'Sin menu'}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    statusClasses[item.status] || statusClasses.active
                  }`}
                >
                  {statusLabels[item.status] || 'Activo'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => onToggleStatus(item)}
                    disabled={statusUpdatingId === item.id}
                    aria-label={`${item.status === 'paused' ? 'Activar' : 'Pausar'} ${item.name}`}
                  >
                    {statusUpdatingId === item.id
                      ? 'Guardando...'
                      : item.status === 'paused'
                        ? 'Activar'
                        : 'Pausar'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => onEdit(item.id)}>
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

const LinksManager = () => {
  const [metrics, setMetrics] = useState({ activeLinks: 0, activeMenus: 0 });
  const [menus, setMenus] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const deferredSearch = useDeferredValue(search);

  const baseUrl = useMemo(() => window.location.origin, []);

  useEffect(() => {
    let mounted = true;

    const loadSupportData = async () => {
      try {
        const [metricsResponse, menusResponse] = await Promise.all([
          carteleriaService.getDashboardMetrics(),
          carteleriaService.getMenus({ page: 1, limit: 100, status: 'active' })
        ]);

        if (!mounted) {
          return;
        }

        setMetrics({
          activeLinks: metricsResponse.data?.activeLinks || 0,
          activeMenus: metricsResponse.data?.activeMenus || 0
        });
        setMenus(menusResponse.data?.data || []);
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

    const loadLinks = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const response = await carteleriaService.getPersistentLinks({
          page: pagination.page,
          limit: pagination.limit,
          search: deferredSearch,
          status
        });

        if (!mounted) {
          return;
        }

        setItems(response.data?.data || []);
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

    loadLinks();

    return () => {
      mounted = false;
    };
  }, [deferredSearch, pagination.limit, pagination.page, refreshKey, status]);

  const handleCreate = () => {
    setSelectedLink(null);
    setEditorOpen(true);
  };

  const handleEdit = async (linkId) => {
    try {
      const response = await carteleriaService.getPersistentLinkById(linkId);
      setSelectedLink(response.data);
      setEditorOpen(true);
    } catch (error) {
      const apiError = handleApiError(error);
      setErrorMessage(apiError.message);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'paused' ? 'active' : 'paused';

    try {
      setStatusUpdatingId(item.id);
      setErrorMessage('');
      await carteleriaService.updatePersistentLink(item.id, { status: nextStatus });
      setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
    } catch (error) {
      const apiError = handleApiError(error);
      setErrorMessage(apiError.message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Links y QR</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Crea URLs persistentes para impresion y cambia el menu resuelto por horario, override o menu por defecto.
          </p>
        </div>

        <button type="button" className="btn btn-primary flex items-center self-start" onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4 text-white" />
          <span className="text-white">Nuevo link o QR</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Links persistentes"
          value={metrics.activeLinks}
          description="Pensados para impresiones permanentes y cambios internos sin romper la URL."
          icon={LinkIcon}
        />
        <SummaryCard
          title="Programaciones activas"
          value={items.reduce((total, item) => total + (item.rules_count || 0), 0)}
          description="Reglas horarias sin solapamientos para resolver menus automaticamente."
          icon={CalendarClock}
        />
        <SummaryCard
          title="QR disponibles"
          value={items.length}
          description="Cada uno apunta a un link estable listo para descargar y usar."
          icon={QrCode}
        />
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex-1">
              <label htmlFor="links-search" className="sr-only">
                Buscar links
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="links-search"
                  type="search"
                  className="input pl-9"
                  placeholder="Buscar links o QR..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPagination((currentPagination) => ({ ...currentPagination, page: 1 }));
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label htmlFor="links-status-filter" className="sr-only">
                Filtrar por estado
              </label>
              <select
                id="links-status-filter"
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

      {!loading && items.length === 0 ? (
        <div className="card">
          <div className="card-body py-12 text-center">
            <QrCode className="mx-auto mb-4 h-10 w-10 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900">Todavia no hay links persistentes</h3>
            <p className="mt-2 text-sm text-gray-500">
              Crea el primero para imprimir un QR estable y empezar a programar menus por horario.
            </p>
          </div>
        </div>
      ) : null}

      {!loading && items.length > 0 && viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <LinkCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              statusUpdatingId={statusUpdatingId}
            />
          ))}
        </div>
      ) : null}

      {!loading && items.length > 0 && viewMode === 'table' ? (
        <LinksTable
          items={items}
          onEdit={handleEdit}
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

      <LinkEditorModal
        baseUrl={baseUrl}
        isOpen={editorOpen}
        linkItem={selectedLink}
        menus={menus}
        onClose={() => setEditorOpen(false)}
        onSuccess={() => setRefreshKey((currentRefreshKey) => currentRefreshKey + 1)}
      />
    </div>
  );
};

export default LinksManager;
