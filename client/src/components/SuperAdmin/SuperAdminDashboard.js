import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleOff, PauseCircle, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { superAdminService } from '../../services/api';

const metricCards = [
  { key: 'activeClients', label: 'Activos', icon: CheckCircle2, accent: 'bg-emerald-100 text-emerald-700' },
  { key: 'suspendedClients', label: 'Suspendidos', icon: PauseCircle, accent: 'bg-amber-100 text-amber-700' },
  { key: 'inactiveClients', label: 'Inactivos', icon: CircleOff, accent: 'bg-slate-200 text-slate-700' },
  { key: 'dueSoonClients', label: 'Vencen pronto', icon: Wallet, accent: 'bg-sky-100 text-sky-700' },
  { key: 'overdueClients', label: 'Vencidos', icon: AlertTriangle, accent: 'bg-rose-100 text-rose-700' }
];

const SuperAdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const response = await superAdminService.getDashboard();
        if (active) {
          setMetrics(response.data.metrics);
        }
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.error || 'No se pudo cargar el dashboard');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-7 text-white shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Operacion SaaS</p>
            <h2 className="mt-2 text-3xl font-semibold">Centro de control comercial</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Revisa clientes con vencimiento cercano, altas pendientes y cuentas que requieren suspension manual.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/super-admin/clients" className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-emerald-100">
              Ver clientes
            </Link>
            <Link to="/super-admin/clients?compose=1" className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Dar de alta cliente
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{loading ? '...' : metrics?.[card.key] ?? 0}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default SuperAdminDashboard;
