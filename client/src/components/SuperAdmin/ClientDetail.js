import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { superAdminService } from '../../services/api';

const initialEditForm = {
  name: '',
  address: '',
  contactPhone: '',
  contactPerson: '',
  contactEmail: '',
  ownerFullName: '',
  ownerEmail: '',
  notes: ''
};

const initialPasswordForm = {
  password: '',
  notes: ''
};

const ClientDetail = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [savingClient, setSavingClient] = useState(false);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [resettingPassword, setResettingPassword] = useState(false);

  const loadClient = useCallback(async () => {
    setLoading(true);

    try {
      const response = await superAdminService.getClientById(id);
      setClient(response.data.client);
      setPaymentAmount(String(response.data.client.billing.billingAmount || ''));
      setEditForm({
        name: response.data.client.name || '',
        address: response.data.client.address || '',
        contactPhone: response.data.client.contactPhone || '',
        contactPerson: response.data.client.contactPerson || '',
        contactEmail: response.data.client.contactEmail || '',
        ownerFullName: response.data.client.owner?.fullName || '',
        ownerEmail: response.data.client.owner?.email || '',
        notes: response.data.client.notes || ''
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo cargar el cliente');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const handleAccessStatus = async (accessStatus) => {
    try {
      const response = await superAdminService.updateAccessStatus(id, { accessStatus });
      setClient((prev) => ({
        ...prev,
        accessStatus: response.data.client.accessStatus
      }));
      toast.success(`Acceso actualizado a ${accessStatus}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo actualizar el acceso');
    }
  };

  const handleMarkPayment = async (event) => {
    event.preventDefault();
    setSavingPayment(true);

    try {
      await superAdminService.markPayment(id, {
        amount: Number(paymentAmount || 0),
        notes: paymentNotes,
        paymentDate: new Date().toISOString()
      });
      setPaymentNotes('');
      toast.success('Pago registrado');
      await loadClient();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo marcar el pago');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSaveClient = async (event) => {
    event.preventDefault();
    setSavingClient(true);

    try {
      await superAdminService.updateClient(id, editForm);
      toast.success('Cliente actualizado');
      await loadClient();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo actualizar el cliente');
    } finally {
      setSavingClient(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setResettingPassword(true);

    try {
      await superAdminService.resetClientPassword(id, {
        password: passwordForm.password,
        notes: passwordForm.notes
      });
      setPasswordForm(initialPasswordForm);
      toast.success('Contrasena reseteada');
      await loadClient();
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo resetear la contrasena');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
        Cargando cliente...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
        No se encontro el cliente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/super-admin/clients" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Volver a clientes
          </Link>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">{client.name}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {client.owner?.fullName || client.contactPerson || 'Sin contacto principal'} · {client.owner?.email || client.contactEmail || '-'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {['active', 'suspended', 'inactive'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleAccessStatus(status)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                client.accessStatus === status
                  ? 'bg-slate-950 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
        <section className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Datos del negocio</h3>
            <div className="mt-5 grid gap-4 text-sm text-slate-700 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Contacto</p>
                <p className="mt-2">{client.contactPerson || '-'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Telefono</p>
                <p className="mt-2">{client.contactPhone || '-'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Correo</p>
                <p className="mt-2">{client.contactEmail || '-'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Direccion</p>
                <p className="mt-2">{client.address || '-'}</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Editar cliente y owner</h3>
            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSaveClient}>
              {[
                ['name', 'Negocio'],
                ['address', 'Direccion'],
                ['contactPhone', 'Telefono'],
                ['contactPerson', 'Persona de contacto'],
                ['contactEmail', 'Correo comercial'],
                ['ownerFullName', 'Nombre del owner'],
                ['ownerEmail', 'Correo del owner']
              ].map(([field, label]) => (
                <label key={field} className="block text-sm font-medium text-slate-700">
                  {label}
                  <input
                    type="text"
                    value={editForm[field]}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        [field]: event.target.value
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                  />
                </label>
              ))}

              <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                Notas del cliente
                <textarea
                  value={editForm.notes}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      notes: event.target.value
                    }))
                  }
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingClient}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingClient ? 'Guardando cambios...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Historial</h3>
            <div className="mt-5 space-y-3">
              {client.events?.length ? (
                client.events.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{event.eventType}</p>
                      <p className="text-xs text-slate-500">{event.eventDate}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{event.notes || 'Sin observaciones'}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  Todavia no hay eventos para este cliente.
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Estado actual</h3>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl bg-slate-100 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Acceso</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{client.accessStatus}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">Comercial</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{client.commercialStatus}</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Facturacion manual</h3>
            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <p>Monto mensual: ${client.billing.billingAmount?.toFixed(2) || '0.00'}</p>
              <p className="mt-2">Proximo vencimiento: {client.billing.nextDueDate || '-'}</p>
              <p className="mt-2">Ultimo pago: {client.billing.lastPaymentMarkedAt || '-'}</p>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleMarkPayment}>
              <label className="block text-sm font-medium text-slate-700">
                Monto
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Nota
                <textarea
                  value={paymentNotes}
                  onChange={(event) => setPaymentNotes(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={savingPayment}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPayment ? 'Guardando pago...' : 'Marcar pago'}
              </button>
            </form>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Soporte de acceso</h3>
            <form className="mt-5 space-y-4" onSubmit={handleResetPassword}>
              <label className="block text-sm font-medium text-slate-700">
                Nueva contrasena del owner
                <input
                  type="password"
                  value={passwordForm.password}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      password: event.target.value
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Nota de reseteo
                <textarea
                  value={passwordForm.notes}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      notes: event.target.value
                    }))
                  }
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={resettingPassword}
                className="w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resettingPassword ? 'Reseteando contrasena...' : 'Resetear contrasena'}
              </button>
            </form>
          </article>
        </section>
      </div>
    </div>
  );
};

export default ClientDetail;
