import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PublicRoute from './components/Auth/PublicRoute';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import ScreensManager from './components/Screens/ScreensManager';
import DesignsManager from './components/Designs/DesignsManager';
import DesignEditor from './components/Designs/DesignEditor';
import ScreenDisplay from './components/Screens/ScreenDisplay';
import Layout from './components/Layout/Layout';
import CarteleriaDashboard from './components/Carteleria/CarteleriaDashboard';
import ProductsManager from './components/Carteleria/ProductsManager';
import PromotionsManager from './components/Carteleria/PromotionsManager';
import MenusManager from './components/Carteleria/MenusManager';
import LinksManager from './components/Carteleria/LinksManager';
import PublicMenuPage from './components/Carteleria/Public/PublicMenuPage';
import { useAuth } from './contexts/AuthContext';
import SuperAdminRoute from './components/SuperAdmin/SuperAdminRoute';
import SuperAdminLayout from './components/SuperAdmin/SuperAdminLayout';
import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard';
import ClientsManager from './components/SuperAdmin/ClientsManager';
import ClientDetail from './components/SuperAdmin/ClientDetail';

const InternalDesignEditor = lazy(() => import('./components/InternalEditor/InternalDesignEditor'));
const HiddenInternalEditor = lazy(() => import('./components/InternalEditor/HiddenInternalEditor'));

const withProtectedLayout = (page) => (
  <ProtectedRoute>
    <Layout>{page}</Layout>
  </ProtectedRoute>
);

const withSuspense = (page) => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-700 shadow-sm">
          Cargando editor...
        </div>
      </div>
    }
  >
    {page}
  </Suspense>
);

const withSuperAdminLayout = (page) => (
  <SuperAdminRoute>
    <SuperAdminLayout>{page}</SuperAdminLayout>
  </SuperAdminRoute>
);

const HomeRedirect = () => {
  const { user } = useAuth();

  return (
    <Navigate
      to={user?.actorType === 'super_admin' ? '/super-admin/dashboard' : '/dashboard'}
      replace
    />
  );
};

function App() {
  return (
    <div className="App">
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route path="/screen-display/:id" element={<ScreenDisplay />} />
        <Route path="/menu/:slug" element={<PublicMenuPage />} />
        <Route path="/internal-editor/hidden" element={withSuspense(<HiddenInternalEditor />)} />
        <Route
          path="/super-admin/dashboard"
          element={withSuperAdminLayout(<SuperAdminDashboard />)}
        />
        <Route
          path="/super-admin/clients"
          element={withSuperAdminLayout(<ClientsManager />)}
        />
        <Route
          path="/super-admin/clients/:id"
          element={withSuperAdminLayout(<ClientDetail />)}
        />

        <Route path="/dashboard" element={withProtectedLayout(<Dashboard />)} />
        <Route path="/screens" element={withProtectedLayout(<ScreensManager />)} />
        <Route path="/designs" element={withProtectedLayout(<DesignsManager />)} />

        <Route
          path="/designs/editor/:id"
          element={
            <ProtectedRoute>
              <DesignEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designs/editor"
          element={
            <ProtectedRoute>
              <DesignEditor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/internal-designs/editor/:id"
          element={
            <ProtectedRoute>
              {withSuspense(<InternalDesignEditor />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/internal-designs/editor"
          element={
            <ProtectedRoute>
              {withSuspense(<InternalDesignEditor />)}
            </ProtectedRoute>
          }
        />

        <Route path="/carteleria" element={<Navigate to="/carteleria/dashboard" replace />} />
        <Route
          path="/carteleria/dashboard"
          element={withProtectedLayout(<CarteleriaDashboard />)}
        />
        <Route
          path="/carteleria/products"
          element={withProtectedLayout(<ProductsManager />)}
        />
        <Route
          path="/carteleria/promotions"
          element={withProtectedLayout(<PromotionsManager />)}
        />
        <Route path="/carteleria/menus" element={withProtectedLayout(<MenusManager />)} />
        <Route path="/carteleria/links" element={withProtectedLayout(<LinksManager />)} />

        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-8">Página no encontrada</p>
                <a href="/dashboard" className="btn btn-primary">
                  Volver al Dashboard
                </a>
              </div>
            </div>
          }
        />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff'
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff'
            }
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff'
            }
          },
          loading: {
            duration: Infinity
          }
        }}
      />
    </div>
  );
}

export default App;
