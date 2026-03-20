import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { carteleriaService } from '../../../services/api';
import QrCustomizer from './QrCustomizer';
import ScheduleBuilder from './ScheduleBuilder';

const slugify = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'link-estable';

const initialFormState = {
  name: '',
  description: '',
  default_menu_id: '',
  manual_menu_id: '',
  manual_override_active: false,
  status: 'active',
  qr_config: {
    foreground: '#111827',
    background: '#ffffff',
    use_gradient: false,
    gradient_start: '',
    gradient_end: '',
    logo_url: ''
  },
  rules: []
};

const LinkEditorModal = ({ baseUrl, isOpen, linkItem, menus, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (linkItem) {
      setFormData({
        name: linkItem.name || '',
        description: linkItem.description || '',
        default_menu_id: linkItem.default_menu_id ? String(linkItem.default_menu_id) : '',
        manual_menu_id: linkItem.manual_menu_id ? String(linkItem.manual_menu_id) : '',
        manual_override_active: Boolean(linkItem.manual_override_active),
        status: linkItem.status || 'active',
        qr_config: {
          foreground: linkItem.qr_config?.foreground || '#111827',
          background: linkItem.qr_config?.background || '#ffffff',
          use_gradient: Boolean(linkItem.qr_config?.use_gradient),
          gradient_start: linkItem.qr_config?.gradient_start || '',
          gradient_end: linkItem.qr_config?.gradient_end || '',
          logo_url: linkItem.qr_config?.logo_url || ''
        },
        rules: (linkItem.rules || []).map((rule) => ({
          ...rule,
          id: rule.id || `rule-${Math.random().toString(36).slice(2, 8)}`,
          menu_id: String(rule.menu_id)
        }))
      });
    } else {
      setFormData(initialFormState);
    }
  }, [isOpen, linkItem]);

  const stableSlugPreview = useMemo(
    () => (linkItem?.slug ? linkItem.slug : slugify(formData.name)),
    [formData.name, linkItem?.slug]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre del link es obligatorio');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        default_menu_id: formData.default_menu_id,
        manual_menu_id: formData.manual_menu_id,
        manual_override_active: formData.manual_override_active,
        status: formData.status,
        qr_config: formData.qr_config,
        rules: formData.rules.map((rule, index) => ({
          ...rule,
          priority: index,
          is_active: rule.is_active !== false
        }))
      };

      if (linkItem?.id) {
        await carteleriaService.updatePersistentLink(linkItem.id, payload);
        toast.success('Link persistente actualizado correctamente');
      } else {
        await carteleriaService.createPersistentLink(payload);
        toast.success('Link persistente creado correctamente');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const message = error?.response?.data?.error || 'No se pudo guardar el link.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal w-[min(96vw,1280px)] max-w-[1280px] h-[92vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {linkItem ? 'Editar link persistente' : 'Nuevo link persistente'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              La URL nunca cambia. Solo cambia el menu resuelto por horario o override manual.
            </p>
          </div>
          <button type="button" className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex h-[calc(92vh-72px)] flex-col overflow-hidden">
          <div className="grid grid-cols-1 gap-4 border-b border-gray-200 px-6 py-4 lg:grid-cols-2 xl:grid-cols-4">
            <div>
              <label htmlFor="link-name" className="label">
                Nombre del link
              </label>
              <input
                id="link-name"
                className="input"
                value={formData.name}
                onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="link-description" className="label">
                Descripcion
              </label>
              <input
                id="link-description"
                className="input"
                value={formData.description}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            <div>
              <label htmlFor="link-default-menu" className="label">
                Menu por defecto
              </label>
              <select
                id="link-default-menu"
                className="input"
                value={formData.default_menu_id}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, default_menu_id: event.target.value }))
                }
              >
                <option value="">Sin menu</option>
                {menus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="link-status" className="label">
                Estado
              </label>
              <select
                id="link-status"
                className="input"
                value={formData.status}
                onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
              </select>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={formData.manual_override_active}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          manual_override_active: event.target.checked
                        }))
                      }
                    />
                    <span className="text-sm text-gray-700">Activar override manual</span>
                  </label>

                  <div>
                    <label htmlFor="link-manual-menu" className="label">
                      Menu manual
                    </label>
                    <select
                      id="link-manual-menu"
                      className="input"
                      value={formData.manual_menu_id}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, manual_menu_id: event.target.value }))
                      }
                    >
                      <option value="">Sin menu manual</option>
                      {menus.map((menu) => (
                        <option key={menu.id} value={menu.id}>
                          {menu.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <ScheduleBuilder
                menus={menus}
                rules={formData.rules}
                onChange={(rules) => setFormData((current) => ({ ...current, rules }))}
              />
            </div>

            <div className="space-y-4 border-l border-gray-200 bg-gray-50 p-6">
              <QrCustomizer
                baseUrl={baseUrl}
                config={formData.qr_config}
                onChange={(qrConfig) => setFormData((current) => ({ ...current, qr_config: qrConfig }))}
                stableSlugPreview={stableSlugPreview}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <span className="text-white">{submitting ? 'Guardando...' : 'Guardar link'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LinkEditorModal;
