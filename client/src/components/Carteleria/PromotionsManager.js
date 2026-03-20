import React, { useDeferredValue, useEffect, useState } from 'react';
import {
  AlertCircle,
  Clock3,
  Grid2x2,
  List,
  PackagePlus,
  Plus,
  Search,
  Tag
} from 'lucide-react';
import { carteleriaService, handleApiError } from '../../services/api';
import PromotionModal from './PromotionModal';

const initialMetrics = {
  activePromotions: 0,
  activeCombos: 0
};

const initialPagination = {
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 1
};

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'paused', label: 'Pausados' },
  { value: 'expired', label: 'Vencidos' }
];

const typeOptions = [
  { value: '', label: 'Todos los tipos' },
  { value: 'promotion', label: 'Promociones' },
  { value: 'combo', label: 'Combos' }
];

const statusLabels = {
  active: 'Activo',
  paused: 'Pausado',
  expired: 'Vencido'
};

const statusClasses = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-gray-100 text-gray-700',
  expired: 'bg-amber-100 text-amber-700'
};

const promotionTypeLabels = {
  percentage_discount: 'Descuento %',
  two_for_one: '2x1',
  second_unit_percentage: '2da unidad',
  free_with_other_product: 'Gratis con otro',
  free_with_minimum_spend: 'Gratis por gasto',
  discount_with_minimum_spend: 'Descuento por gasto'
};

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2
});

const PromotionSummaryCard = ({ title, value, description, icon: Icon }) => (
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

const PromotionCard = ({ entry, onEdit }) => (
  <article className="card">
    <div className="card-body">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
              {entry.kind === 'promotion' ? 'Promoción' : 'Combo'}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                statusClasses[entry.status] || statusClasses.active
              }`}
            >
              {statusLabels[entry.status] || 'Activo'}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-gray-900">{entry.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{entry.subtitle}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-600 min-h-[40px]">
        {entry.description || entry.conditionsText || 'Sin condiciones especiales cargadas.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {entry.metaBadges.map((badge) => (
          <span
            key={`${entry.kind}-${entry.id}-${badge}`}
            className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
          >
            {badge}
          </span>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          className="btn btn-outline"
          aria-label={`Editar ${entry.name}`}
          onClick={() => onEdit(entry)}
        >
          Editar
        </button>
      </div>
    </div>
  </article>
);

const PromotionsTable = ({ entries, onEdit }) => (
  <div className="card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200" aria-label="Listado de promociones y combos">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Resumen
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
          {entries.map((entry) => (
            <tr key={`${entry.kind}-${entry.id}`}>
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{entry.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{entry.description || 'Sin descripcion'}</p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {entry.kind === 'promotion' ? 'Promoción' : 'Combo'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{entry.subtitle}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    statusClasses[entry.status] || statusClasses.active
                  }`}
                >
                  {statusLabels[entry.status] || 'Activo'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  type="button"
                  className="btn btn-outline"
                  aria-label={`Editar ${entry.name}`}
                  onClick={() => onEdit(entry)}
                >
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

const buildPromotionEntry = (promotion) => {
  const metaBadges = [];

  if (promotion.type && promotionTypeLabels[promotion.type]) {
    metaBadges.push(promotionTypeLabels[promotion.type]);
  }

  if (promotion.discount_percentage !== null && promotion.discount_percentage !== undefined) {
    metaBadges.push(`${promotion.discount_percentage}%`);
  }

  if (promotion.has_countdown) {
    metaBadges.push('Cuenta regresiva');
  }

  if (!promotion.no_expiration && promotion.ends_at) {
    metaBadges.push('Con vencimiento');
  }

  return {
    id: promotion.id,
    kind: 'promotion',
    name: promotion.name,
    description: promotion.description,
    conditionsText: promotion.conditions_text,
    status: promotion.status,
    subtitle: promotion.target_combo_name || promotion.target_product_name || 'Sin objetivo asociado',
    metaBadges
  };
};

const buildComboEntry = (combo) => {
  const metaBadges = [];

  if (combo.combo_price !== null && combo.combo_price !== undefined) {
    metaBadges.push(currencyFormatter.format(combo.combo_price));
  }

  if (combo.items_count) {
    metaBadges.push(`${combo.items_count} productos`);
  }

  if (!combo.no_expiration && combo.ends_at) {
    metaBadges.push('Con vencimiento');
  }

  return {
    id: combo.id,
    kind: 'combo',
    name: combo.name,
    description: combo.description,
    conditionsText: combo.conditions_text,
    status: combo.status,
    subtitle: combo.items_summary || 'Sin productos vinculados',
    metaBadges
  };
};

const PromotionsManager = () => {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [products, setProducts] = useState([]);
  const [comboTargets, setComboTargets] = useState([]);
  const [menus, setMenus] = useState([]);
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let mounted = true;

    const loadSupportData = async () => {
      try {
        const [metricsResponse, productsResponse, menusResponse, combosResponse] = await Promise.all([
          carteleriaService.getDashboardMetrics(),
          carteleriaService.getProducts({
            page: 1,
            limit: 100,
            status: 'active'
          }),
          carteleriaService.getPromotionMenus(),
          carteleriaService.getCombos({
            page: 1,
            limit: 100,
            status: 'active'
          })
        ]);

        if (!mounted) {
          return;
        }

        setMetrics({ ...initialMetrics, ...metricsResponse.data });
        setProducts(productsResponse.data?.data || []);
        setMenus(menusResponse.data || []);
        setComboTargets(combosResponse.data?.data || []);
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

    const loadEntries = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const params = {
          page: 1,
          limit: 100,
          search: deferredSearch,
          status
        };

        const [promotionsResponse, combosResponse] = await Promise.all([
          carteleriaService.getPromotions(params),
          carteleriaService.getCombos(params)
        ]);

        if (!mounted) {
          return;
        }

        const promotionEntries = (promotionsResponse.data?.data || []).map(buildPromotionEntry);
        const comboEntries = (combosResponse.data?.data || []).map(buildComboEntry);

        let combinedEntries = [...promotionEntries, ...comboEntries];

        if (typeFilter) {
          combinedEntries = combinedEntries.filter((entry) => entry.kind === typeFilter);
        }

        const total = combinedEntries.length;
        const totalPages = Math.max(Math.ceil(total / pagination.limit), 1);
        const nextPage = Math.min(pagination.page, totalPages);
        const offset = (nextPage - 1) * pagination.limit;

        setEntries(combinedEntries.slice(offset, offset + pagination.limit));
        setPagination((currentPagination) => ({
          ...currentPagination,
          page: nextPage,
          total,
          totalPages
        }));
      } catch (error) {
        if (!mounted) {
          return;
        }

        const apiError = handleApiError(error);
        setErrorMessage(apiError.message);
        setEntries([]);
        setPagination((currentPagination) => ({
          ...currentPagination,
          total: 0,
          totalPages: 1
        }));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadEntries();

    return () => {
      mounted = false;
    };
  }, [deferredSearch, pagination.limit, pagination.page, refreshKey, status, typeFilter]);

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

  const handleTypeChange = (event) => {
    setTypeFilter(event.target.value);
    setPagination((currentPagination) => ({
      ...currentPagination,
      page: 1
    }));
  };

  const handleSaved = () => {
    setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
  };

  const handleCreate = () => {
    setSelectedEntry(null);
    setModalOpen(true);
  };

  const handleEdit = async (entry) => {
    try {
      const response =
        entry.kind === 'promotion'
          ? await carteleriaService.getPromotionById(entry.id)
          : await carteleriaService.getComboById(entry.id);

      setSelectedEntry({
        ...response.data,
        kind: entry.kind
      });
      setModalOpen(true);
    } catch (error) {
      const apiError = handleApiError(error);
      setErrorMessage(apiError.message);
    }
  };

  const expiringEntries = entries.filter((entry) => entry.metaBadges.includes('Con vencimiento')).length;
  const hasEntries = entries.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promociones</h2>
          <p className="mt-1 text-sm text-gray-600 max-w-3xl">
            Aca administras promos individuales y combos con reglas de vigencia que despues se
            reflejan automaticamente en los menus publicados.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary flex items-center self-start"
          onClick={handleCreate}
        >
          <Plus className="h-4 w-4 mr-2 text-white" />
          <span className="text-white">Nueva promoción</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <PromotionSummaryCard
          title="Promos activas"
          value={metrics.activePromotions}
          description="Descuentos, 2x1 y beneficios asociados a productos."
          icon={Tag}
        />
        <PromotionSummaryCard
          title="Combos publicados"
          value={metrics.activeCombos}
          description="Combos visibles en uno o mas menus activos."
          icon={PackagePlus}
        />
        <PromotionSummaryCard
          title="Promos con vencimiento"
          value={expiringEntries}
          description="Campanas con tiempo definido, ideal para happy hour."
          icon={Clock3}
        />
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex-1">
              <label htmlFor="promotions-search" className="sr-only">
                Buscar promociones
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="promotions-search"
                  type="search"
                  className="input pl-9"
                  placeholder="Buscar promociones y combos..."
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="promotions-status-filter">
                Filtrar por estado
              </label>
              <select
                id="promotions-status-filter"
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

              <label className="sr-only" htmlFor="promotions-type-filter">
                Filtrar por tipo
              </label>
              <select
                id="promotions-type-filter"
                aria-label="Filtrar por tipo"
                className="input min-w-[180px]"
                value={typeFilter}
                onChange={handleTypeChange}
              >
                {typeOptions.map((option) => (
                  <option key={option.value || 'all-types'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('table')}
                aria-label="Vista tabla"
              >
                <List className={`h-4 w-4 mr-2 ${viewMode === 'table' ? 'text-white' : ''}`} />
                <span className={viewMode === 'table' ? 'text-white' : ''}>Vista tabla</span>
              </button>

              <button
                type="button"
                className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('cards')}
                aria-label="Vista tarjetas"
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

      {!loading && !hasEntries ? (
        <div className="card">
          <div className="card-body py-12 text-center">
            <Tag className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Todavia no hay promociones</h3>
            <p className="mt-2 text-sm text-gray-500">
              Cuando cargues promos o combos, aca los vas a poder filtrar y administrar.
            </p>
          </div>
        </div>
      ) : null}

      {!loading && hasEntries && viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <PromotionCard key={`${entry.kind}-${entry.id}`} entry={entry} onEdit={handleEdit} />
          ))}
        </div>
      ) : null}

      {!loading && hasEntries && viewMode === 'table' ? (
        <PromotionsTable entries={entries} onEdit={handleEdit} />
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

      <PromotionModal
        combos={comboTargets}
        existingEntry={selectedEntry}
        isOpen={modalOpen}
        menus={menus}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSaved}
        products={products}
      />
    </div>
  );
};

export default PromotionsManager;
