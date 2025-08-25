import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { screensService } from '../../services/api';
import toast from 'react-hot-toast';

const ScreenModal = ({ isOpen, onClose, screen, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
    refresh_interval: 30,
    width: 1920,
    height: 1080,
  });
  const [selectedScreenSize, setSelectedScreenSize] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (screen) {
        // Modo edición
        const width = screen.width || 1920;
        const height = screen.height || 1080;
        setFormData({
          name: screen.name || '',
          description: screen.description || '',
          active: screen.is_active ?? true,
          refresh_interval: screen.refresh_interval || 30,
          width,
          height,
        });
        const orientation = width > height ? 'landscape' : 'portrait';
        setSelectedScreenSize({
          width,
          height,
          name: 'Personalizado',
          orientation
        });
      } else {
        // Modo creación
        setFormData({
          name: '',
          description: '',
          active: true,
          refresh_interval: 30,
          width: 1920,
          height: 1080,
        });
        setSelectedScreenSize({
          width: 1920,
          height: 1080,
          name: '40" Full HD TV',
          orientation: 'landscape'
        });
      }
      setErrors({});
    }
  }, [isOpen, screen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleScreenSizeChange = (screenSize) => {
    setSelectedScreenSize(screenSize);
    setFormData(prev => ({
      ...prev,
      width: screenSize.width,
      height: screenSize.height
    }));
    
    // Limpiar errores relacionados con dimensiones
    setErrors(prev => ({
      ...prev,
      dimensions: ''
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    const refreshInterval = parseInt(formData.refresh_interval);
    if (!refreshInterval || refreshInterval < 5 || refreshInterval > 300) {
      newErrors.refresh_interval = 'El intervalo debe estar entre 5 y 300 segundos';
    }

    if (!selectedScreenSize || !selectedScreenSize.width || !selectedScreenSize.height) {
      newErrors.dimensions = 'Debe seleccionar un tamaño de pantalla';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const data = {
        ...formData,
        refresh_interval: parseInt(formData.refresh_interval),
        width: parseInt(formData.width),
        height: parseInt(formData.height),
      };

      if (screen) {
        // Actualizar pantalla existente
        await screensService.update(screen.id, data);
        toast.success('Pantalla actualizada correctamente');
      } else {
        // Crear nueva pantalla
        await screensService.create(data);
        toast.success('Pantalla creada correctamente');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error guardando pantalla:', error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error al guardar la pantalla');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {screen ? 'Editar Pantalla' : 'Nueva Pantalla'}
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="label">
                Nombre *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="Ej: Pantalla Principal"
                disabled={loading}
                maxLength={100}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="label">
                Descripción *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`input ${errors.description ? 'input-error' : ''}`}
                placeholder="Describe el propósito de esta pantalla"
                disabled={loading}
                maxLength={500}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Dimensiones de pantalla */}
            <div>
              <label className="label mb-3">
                Dimensiones de la Pantalla *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {[
                   { name: '32" HD TV Horizontal', width: 1366, height: 768, orientation: 'landscape' },
                   { name: '32" HD TV Vertical', width: 768, height: 1366, orientation: 'portrait' },
                   { name: '40" Full HD Horizontal', width: 1920, height: 1080, orientation: 'landscape' },
                   { name: '40" Full HD Vertical', width: 1080, height: 1920, orientation: 'portrait' },
                   { name: '43" Full HD Horizontal', width: 1920, height: 1080, orientation: 'landscape' },
                   { name: '43" Full HD Vertical', width: 1080, height: 1920, orientation: 'portrait' },
                   { name: '50" 4K Horizontal', width: 3840, height: 2160, orientation: 'landscape' },
                   { name: '50" 4K Vertical', width: 2160, height: 3840, orientation: 'portrait' },
                   { name: '55" 4K Horizontal', width: 3840, height: 2160, orientation: 'landscape' },
                   { name: '55" 4K Vertical', width: 2160, height: 3840, orientation: 'portrait' },
                   { name: 'Monitor 24" Full HD', width: 1920, height: 1080, orientation: 'landscape' },
                   { name: 'Monitor 27" QHD', width: 2560, height: 1440, orientation: 'landscape' },
                   { name: 'Monitor 32" 4K', width: 3840, height: 2160, orientation: 'landscape' },
                   { name: 'Personalizado', width: formData.width, height: formData.height }
                 ].map((size, index) => {
                   const isSelected = selectedScreenSize && 
                     selectedScreenSize.name === size.name;
                   
                   return (
                     <button
                       key={index}
                       onClick={() => {
                         if (size.name === 'Personalizado') return;
                         handleScreenSizeChange({
                           name: size.name,
                           width: size.width,
                           height: size.height,
                           orientation: size.orientation || (size.width > size.height ? 'landscape' : 'portrait')
                         });
                       }}
                       disabled={loading || size.name === 'Personalizado'}
                       className={`p-3 rounded-lg border-2 text-left transition-colors ${
                         isSelected
                           ? 'border-blue-500 bg-blue-50 text-blue-700'
                           : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                       } ${size.name === 'Personalizado' ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                       <div className="font-medium text-sm mb-1">{size.name}</div>
                       <div className="text-xs text-gray-500">
                         {size.width} × {size.height} px
                       </div>
                     </button>
                   );
                 })}
               </div>
               
               {/* Campos personalizados */}
               <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Ancho personalizado (px)
                   </label>
                   <input
                     type="number"
                     value={formData.width}
                     onChange={(e) => {
                       const width = parseInt(e.target.value) || 0;
                       setFormData(prev => ({ ...prev, width }));
                       setSelectedScreenSize({
                         name: 'Personalizado',
                         width,
                         height: formData.height,
                         orientation: width > formData.height ? 'landscape' : 'portrait'
                       });
                     }}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     min="100"
                     max="10000"
                     disabled={loading}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Alto personalizado (px)
                   </label>
                   <input
                     type="number"
                     value={formData.height}
                     onChange={(e) => {
                       const height = parseInt(e.target.value) || 0;
                       setFormData(prev => ({ ...prev, height }));
                       setSelectedScreenSize({
                         name: 'Personalizado',
                         width: formData.width,
                         height,
                         orientation: formData.width > height ? 'landscape' : 'portrait'
                       });
                     }}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     min="100"
                     max="10000"
                     disabled={loading}
                   />
                 </div>
               </div>
              {errors.dimensions && (
                <p className="mt-1 text-sm text-red-600">{errors.dimensions}</p>
              )}
            </div>

            {/* Intervalo de refresco */}
            <div>
              <label htmlFor="refresh_interval" className="label">
                Intervalo de Refresco (segundos) *
              </label>
              <input
                type="number"
                id="refresh_interval"
                name="refresh_interval"
                value={formData.refresh_interval}
                onChange={handleChange}
                className={`input ${errors.refresh_interval ? 'input-error' : ''}`}
                min="5"
                max="300"
                disabled={loading}
              />
              {errors.refresh_interval && (
                <p className="mt-1 text-sm text-red-600">{errors.refresh_interval}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Tiempo en segundos para actualizar automáticamente el contenido (5-300)
              </p>
            </div>

            {/* Estado activo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Pantalla activa
              </label>
            </div>
            <p className="text-sm text-gray-500">
              Las pantallas inactivas no mostrarán contenido
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center"
            >
              {loading && <div className="loading-spinner mr-2" />}
              {screen ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScreenModal;