import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Monitor, 
  Palette, 
  Plus, 
  Activity, 
  Eye,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { screensService, designsService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import DesignPreconfigModal from '../Designs/DesignPreconfigModal';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalScreens: 0,
    activeScreens: 0,
    totalDesigns: 0,
    assignedDesigns: 0,
  });
  const [recentScreens, setRecentScreens] = useState([]);
  const [recentDesigns, setRecentDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preconfigModalOpen, setPreconfigModalOpen] = useState(false);
  const { connected } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar pantallas y diseños en paralelo
      const [screensResponse, designsResponse] = await Promise.all([
        screensService.getAll(),
        designsService.getAll()
      ]);

      const screens = screensResponse.data;
      const designs = designsResponse.data;

      // Calcular estadísticas
      const activeScreens = screens.filter(screen => screen.is_active).length;
      const assignedDesigns = designs.filter(design => 
        screens.some(screen => screen.design_id === design.id)
      ).length;

      setStats({
        totalScreens: screens.length,
        activeScreens,
        totalDesigns: designs.length,
        assignedDesigns,
      });

      // Obtener elementos recientes (últimos 5)
      setRecentScreens(screens.slice(0, 5));
      setRecentDesigns(designs.slice(0, 5));

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDesign = async (preconfigData) => {
    try {
      console.log('=== CREANDO DISEÑO EN DASHBOARD ===');
      console.log('Datos recibidos:', preconfigData);
      
      const designData = {
        name: preconfigData.name,
        description: '',
        content: {
          elements: [],
          settings: {
            backgroundColor: '#ffffff',
            backgroundImage: null,
            canvasWidth: preconfigData.width,
            canvasHeight: preconfigData.height,
            screenSizeName: preconfigData.screenSizeName,
            orientation: preconfigData.orientation
          }
        }
      };
      
      console.log('Datos a enviar al servidor:', designData);
      console.log('Dimensiones en settings:', designData.content.settings.canvasWidth, 'x', designData.content.settings.canvasHeight);

      const response = await designsService.create(designData);
      toast.success('Diseño creado correctamente');
      setPreconfigModalOpen(false);
      
      // Navegar al editor del nuevo diseño
      navigate(`/designs/editor/${response.data.id}`);
    } catch (error) {
      console.error('Error creando diseño:', error);
      toast.error('Error al crear el diseño');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description, link }) => (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="card-body">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {link && (
          <div className="mt-4">
            <Link
              to={link}
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Ver todos →
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, link, color }) => (
    <Link to={link} className="block">
      <div className="card hover:shadow-lg transition-all duration-200 hover:scale-105">
        <div className="card-body text-center">
          <div className={`mx-auto w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );

  const QuickActionButton = ({ title, description, icon: Icon, onClick, color }) => (
    <button onClick={onClick} className="block w-full text-left">
      <div className="card hover:shadow-lg transition-all duration-200 hover:scale-105">
        <div className="card-body text-center">
          <div className={`mx-auto w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Resumen general del sistema de pantallas digitales
        </p>
      </div>

      {/* Estado de conexión */}
      {!connected && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              Sin conexión en tiempo real. Los datos pueden no estar actualizados.
            </p>
          </div>
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Pantallas"
          value={stats.totalScreens}
          icon={Monitor}
          color="bg-blue-500"
          description={`${stats.activeScreens} activas`}
          link="/screens"
        />
        <StatCard
          title="Pantallas Activas"
          value={stats.activeScreens}
          icon={Activity}
          color="bg-blue-500"
          description={`${((stats.activeScreens / stats.totalScreens) * 100 || 0).toFixed(0)}% del total`}
        />
        <StatCard
          title="Total Diseños"
          value={stats.totalDesigns}
          icon={Palette}
          color="bg-purple-500"
          description={`${stats.assignedDesigns} asignados`}
          link="/designs"
        />
        <StatCard
          title="Diseños Asignados"
          value={stats.assignedDesigns}
          icon={TrendingUp}
          color="bg-orange-500"
          description={`${((stats.assignedDesigns / stats.totalDesigns) * 100 || 0).toFixed(0)}% del total`}
        />
      </div>

      {/* Acciones rápidas */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="Nueva Pantalla"
            description="Agregar una nueva pantalla al sistema"
            icon={Plus}
            link="/screens"
            color="bg-blue-500"
          />
          <QuickActionButton
            title="Nuevo Diseño"
            description="Crear un diseño desde cero"
            icon={Palette}
            onClick={() => setPreconfigModalOpen(true)}
            color="bg-purple-500"
          />
          <QuickActionCard
            title="Ver Pantallas"
            description="Gestionar todas las pantallas"
            icon={Eye}
            link="/screens"
            color="bg-blue-500"
          />
        </div>
      </div>

      {/* Listas recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pantallas recientes */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Pantallas Recientes</h3>
            <Link
              to="/screens"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Ver todas
            </Link>
          </div>
          <div className="card-body">
            {recentScreens.length > 0 ? (
              <div className="space-y-3">
                {recentScreens.map((screen) => (
                  <div key={screen.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        screen.is_active ? 'bg-blue-400' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{screen.name}</p>
                        <p className="text-xs text-gray-500">{screen.description}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {screen.design_name ? `Diseño: ${screen.design_name}` : 'Sin diseño'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay pantallas registradas
              </p>
            )}
          </div>
        </div>

        {/* Diseños recientes */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Diseños Recientes</h3>
            <Link
              to="/designs"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Ver todos
            </Link>
          </div>
          <div className="card-body">
            {recentDesigns.length > 0 ? (
              <div className="space-y-3">
                {recentDesigns.map((design) => (
                  <div key={design.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                        <Palette className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{design.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(design.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/designs/editor/${design.id}`}
                      className="text-xs text-primary-600 hover:text-primary-500 font-medium"
                    >
                      Editar
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay diseños creados
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de preconfiguración para nuevos diseños */}
      <DesignPreconfigModal
        isOpen={preconfigModalOpen}
        onConfirm={handleCreateDesign}
        onCancel={() => setPreconfigModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
