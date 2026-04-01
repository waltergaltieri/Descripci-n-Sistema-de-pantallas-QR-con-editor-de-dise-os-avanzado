import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import { superAdminService } from '../../services/api';

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos', params: { accessStatus: 'active' } },
  { key: 'suspended', label: 'Suspendidos', params: { accessStatus: 'suspended' } },
  { key: 'inactive', label: 'Inactivos', params: { accessStatus: 'inactive' } },
  { key: 'due_soon', label: 'Vencen pronto', params: { commercialStatus: 'due_soon' } },
  { key: 'overdue', label: 'Vencidos', params: { commercialStatus: 'overdue' } }
];

const initialForm = {
  name: '',
  address: '',
  contactPhone: '',
  contactPerson: '',
  contactEmail: '',
  ownerFullName: '',
  ownerEmail: '',
  password: '',
  firstPaymentDate: '',
  billingAmount: '',
  notes: ''
};

const formatDueDate = (value) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(parsed);
};

const ClientsManager = () => {
  const location = useLocation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(new URLSearchParams(location.search).get('compose') === '1');
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const activeFilter = useMemo(
    () => FILTERS.find((filter) => filter.key === selectedFilter) || FILTERS[0],
    [selectedFilter]
  );

  const loadClients = useCallback(async (filterKey = selectedFilter, searchValue = search) => {
    setLoading(true);

    try {
      const filter = FILTERS.find((item) => item.key === filterKey) || FILTERS[0];
      const response = await superAdminService.getClients({
        ...(filter.params || {}),
        ...(searchValue ? { search: searchValue } : {})
      });
      setClients(response.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, [search, selectedFilter]);

  useEffect(() => {
    loadClients(selectedFilter, search);
  }, [loadClients, search, selectedFilter]);

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    await loadClients(selectedFilter, search);
  };

  const handleCreateClient = async (event) => {
    event.preventDefault();
    setCreating(true);

    try {
      await superAdminService.createClient({
        ...formData,
        billingAmount: Number(formData.billingAmount || 0)
      });
      toast.success('Cliente creado correctamente');
      setFormData(initialForm);
      setShowCreateForm(false);
      await loadClients(selectedFilter, search);
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo crear el cliente');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Clientes</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Gestion comercial y operativa</h2>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {showCreateForm ? 'Cerrar alta' : 'Nuevo cliente'}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setSelectedFilter(filter.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter.key === activeFilter.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-5">
          <label className="sr-only" htmlFor="client-search">
            Buscar clientes
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="client-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar negocio, contacto o email..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </form>
      </section>

      {showCreateForm && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Alta manual de cliente</h3>
          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleCreateClient}>
            {[
              ['name', 'Negocio'],
              ['address', 'Direccion'],
              ['contactPhone', 'Telefono'],
              ['contactPerson', 'Persona de contacto'],
              ['contactEmail', 'Correo comercial'],
              ['ownerFullName', 'Nombre del owner'],
              ['ownerEmail', 'Correo del owner'],
              ['password', 'Contrasena inicial'],
              ['firstPaymentDate', 'Primer pago', 'date'],
              ['billingAmount', 'Monto mensual', 'number']
            ].map(([field, label, type = 'text']) => (
              <label key={field} className="block text-sm font-medium text-slate-700">
                {label}
                <input
                  type={type}
                  step={field === 'billingAmount' ? '0.01' : undefined}
                  value={formData[field]}
                  onChange={(event) => setFormData((prev) => ({ ...prev, [field]: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                  required={['name', 'ownerEmail', 'password', 'firstPaymentDate'].includes(field)}
                />
              </label>
            ))}

            <label className="block text-sm font-medium text-slate-700 md:col-span-2">
              Notas
              <textarea
                value={formData.notes}
                onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </label>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? 'Creando...' : 'Crear cliente'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">Cargando clientes...</div>
        ) : clients.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">No hay clientes para este filtro.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3">Negocio</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Acceso</th>
                  <th className="px-4 py-3">Comercial</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-100 text-sm text-slate-700">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{client.name}</div>
                      <div className="text-xs text-slate-500">{client.owner?.email || '-'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{client.contactPerson || '-'}</div>
                      <div className="text-xs text-slate-500">{client.contactPhone || '-'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{client.accessStatus}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{client.commercialStatus}</span>
                    </td>
                    <td className="px-4 py-4">${client.billingAmount.toFixed(2)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{formatDueDate(client.nextDueDate)}</td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        to={`/super-admin/clients/${client.id}`}
                        className="inline-flex min-w-[96px] items-center justify-center whitespace-nowrap rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ClientsManager;
