import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Clock3,
  Package,
  QrCode,
  Store,
  Tag
} from 'lucide-react';
import { carteleriaService, handleApiError } from '../../services/api';

const quickActions = [
  {
    title: 'Cargar productos',
    description: 'Armá la base del catálogo con fotos, categorías y precio.',
    href: '/carteleria/products'
  },
  {
    title: 'Configurar promociones',
    description: 'Definí descuentos, combos y fechas de vigencia.',
    href: '/carteleria/promotions'
  },
  {
    title: 'Diseñar un menú',
    description: 'Combiná bloques, categorías y destacados para mobile.',
    href: '/carteleria/menus'
  },
  {
    title: 'Publicar QR',
    description: 'Asigná un menú fijo o programado a un link persistente.',
    href: '/carteleria/links'
  }
];

const operationalNotes = [
  'Los productos pausados desaparecerán automáticamente de los menús publicados.',
  'Los productos agotados seguirán visibles, pero con su estado destacado para el cliente.',
  'Los QR persistentes resolverán el menú correcto al abrirse, según horario o cambio manual.'
];

const initialMetrics = {
  totalProducts: 0,
  activeProducts: 0,
  pausedProducts: 0,
  soldOutProducts: 0,
  activePromotions: 0,
  activeCombos: 0,
  activeMenus: 0,
  activeLinks: 0,
  totalCategories: 0
};

const CarteleriaDashboard = () => {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const [metricsResponse, profileResponse] = await Promise.all([
          carteleriaService.getDashboardMetrics(),
          carteleriaService.getBusinessProfile()
        ]);

        if (!mounted) {
          return;
        }

        setMetrics({ ...initialMetrics, ...metricsResponse.data });
        setBusinessProfile(profileResponse.data);
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

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = [
    {
      title: 'Productos activos',
      value: metrics.activeProducts,
      description: `${metrics.totalProducts} en catálogo, ${metrics.soldOutProducts} agotados.`,
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'Promociones vigentes',
      value: metrics.activePromotions,
      description: `${metrics.activeCombos} combos activos para publicar.`,
      icon: Tag,
      color: 'bg-emerald-500'
    },
    {
      title: 'Menús publicados',
      value: metrics.activeMenus,
      description: 'Versiones mobile-first conectadas al catálogo.',
      icon: BookOpen,
      color: 'bg-amber-500'
    },
    {
      title: 'Links persistentes',
      value: metrics.activeLinks,
      description: 'QR que no cambian aunque cambie el menú asignado.',
      icon: QrCode,
      color: 'bg-rose-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Cartelería</h2>
          <p className="mt-1 text-sm text-gray-600 max-w-3xl">
            Este módulo reúne el catálogo, las promociones, los menús web y los links
            persistentes que después vas a imprimir como QR en cada local.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-700">
              <Store className="h-4 w-4 text-primary-600 mr-2" />
              {businessProfile?.name || 'Mi Local'}
            </div>
            <div className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-700">
              {metrics.totalCategories} categorías activas
            </div>
            {businessProfile?.timezone ? (
              <div className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-700">
                {businessProfile.timezone}
              </div>
            ) : null}
          </div>
        </div>

        <div className="card bg-gradient-to-r from-primary-600 to-blue-600 text-white max-w-xl">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <Clock3 className="h-5 w-5 text-white mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Siguiente hito</p>
                <p className="mt-1 text-sm text-blue-50">
                  Con esta base ya podemos empezar a reemplazar placeholders por vistas
                  operativas, empezando por productos y después por promociones, menús y QR.
                </p>
              </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.title} className="card">
              <div className="card-body">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-semibold text-gray-900">
                      {loading ? '...' : stat.value}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Accesos rápidos del módulo</h3>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.href}
                className="rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{action.title}</h4>
                    <p className="mt-2 text-sm text-gray-600">{action.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary-600 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Reglas clave del producto</h3>
          </div>
          <div className="card-body space-y-4">
            {operationalNotes.map((note) => (
              <div key={note} className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                <p className="text-sm text-gray-700">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarteleriaDashboard;
