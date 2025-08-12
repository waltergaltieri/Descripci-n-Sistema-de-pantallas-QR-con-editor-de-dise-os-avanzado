import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PublicRoute from './components/Auth/PublicRoute';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import ScreensManager from './components/Screens/ScreensManager';
import DesignsManager from './components/Designs/DesignsManager';
import DesignEditor from './components/Designs/DesignEditor';
import DesignPreview from './components/Designs/DesignPreview';
import ScreenDisplay from './components/Screens/ScreenDisplay';
import Layout from './components/Layout/Layout';



function App() {
  return (
    <div className="App">
      <Routes>
        {/* Ruta de login */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Ruta de visualización de pantalla (pública) */}
        <Route 
          path="/screen-display/:id" 
          element={<ScreenDisplay />} 
        />
        
        {/* Rutas protegidas del panel de administración */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/screens" 
          element={
            <ProtectedRoute>
              <Layout>
                <ScreensManager />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/designs" 
          element={
            <ProtectedRoute>
              <Layout>
                <DesignsManager />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
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
          path="/designs/:id/preview" 
          element={
            <ProtectedRoute>
              <DesignPreview />
            </ProtectedRoute>
          } 
        />
        
        {/* Ruta por defecto */}
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" replace />} 
        />
        
        {/* Ruta 404 */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-8">Página no encontrada</p>
                <a 
                  href="/dashboard" 
                  className="btn btn-primary"
                >
                  Volver al Dashboard
                </a>
              </div>
            </div>
          } 
        />
      </Routes>
      
      {/* Notificaciones toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: Infinity,
          },
        }}
      />
    </div>
  );
}

export default App;