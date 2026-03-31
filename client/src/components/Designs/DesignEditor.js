import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Loader,
  Download,
  ChevronDown,
  FileImage,
  FileText,
  File,
  Upload,
  ExternalLink,
  Monitor,
  Clock,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { designsService } from '../../services/api';
import { polotnoStore } from '../../store/editorStore';
import PolotnoEditor from '../PolotnoEditor';
import DesignConfigModal from './Editor/DesignConfigModal';
import {
  buildResolutionLabel,
  decorateAssignedScreens,
  getContentSnapshot,
  mergeEditorContentWithDesign,
  normalizeDesignContent
} from '../../utils/designContent';
import {
  generateQrElementPayload,
  generateQrSvg,
  getDefaultQrConfig,
  getQrConfigFromElement,
  sanitizeQrConfig,
  svgToDataUrl
} from '../../utils/qrDesign';

const QR_ERROR_LEVELS = [
  { value: 'L', label: 'Baja' },
  { value: 'M', label: 'Media' },
  { value: 'Q', label: 'Alta' },
  { value: 'H', label: 'Muy alta' }
];

const buildFileName = (name = 'diseno') =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'diseno';

const downloadDataUrl = (dataUrl, fileName) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
};

const downloadBlob = (content, fileName, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, fileName);
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const decorateDesign = (rawDesign) => {
  const assignedScreens = decorateAssignedScreens(rawDesign?.assigned_screens || []);

  return {
    ...rawDesign,
    content: normalizeDesignContent(rawDesign?.content),
    assigned_screens: assignedScreens,
    assigned_screens_count: rawDesign?.assigned_screens_count ?? assignedScreens.length
  };
};

const QrEditorModal = ({ isOpen, mode, initialConfig, onClose, onSubmit, processing }) => {
  const [form, setForm] = useState(getDefaultQrConfig());
  const [previewSrc, setPreviewSrc] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(sanitizeQrConfig(initialConfig));
  }, [initialConfig, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const svg = await generateQrSvg(form);
        if (active) {
          setPreviewSrc(svgToDataUrl(svg));
        }
      } catch (error) {
        if (active) {
          setPreviewSrc('');
        }
      }
    }, 120);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [form, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              QR en pantalla
            </p>
            <h2 className="mt-1 text-[1.7rem] font-semibold text-slate-900">
              {mode === 'edit' ? 'Editar QR' : 'Insertar QR'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Define el enlace, colores y nivel de correccion antes de agregarlo al lienzo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-8 bg-slate-50 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Contenido del QR</span>
              <textarea
                value={form.value}
                onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                rows={5}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                placeholder="https://tu-enlace.com/menu"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Color principal</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <input
                    type="color"
                    value={form.dark}
                    onChange={(event) => setForm((current) => ({ ...current, dark: event.target.value }))}
                    className="h-10 w-14 cursor-pointer rounded-xl border border-slate-200 bg-transparent"
                  />
                  <span className="text-sm font-medium text-slate-700">{form.dark}</span>
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Color de fondo</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <input
                    type="color"
                    value={form.light}
                    onChange={(event) => setForm((current) => ({ ...current, light: event.target.value }))}
                    className="h-10 w-14 cursor-pointer rounded-xl border border-slate-200 bg-transparent"
                  />
                  <span className="text-sm font-medium text-slate-700">{form.light}</span>
                </div>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Margen</span>
                <input
                  type="number"
                  min="0"
                  max="8"
                  step="1"
                  value={form.margin}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, margin: Number(event.target.value) || 0 }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Correccion</span>
                <select
                  value={form.errorCorrectionLevel}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      errorCorrectionLevel: event.target.value
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                >
                  {QR_ERROR_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Vista previa
            </p>
            <div className="mt-4 flex min-h-[320px] items-center justify-center rounded-[20px] bg-slate-100 p-6">
              <div className="rounded-[24px] bg-white p-5 shadow-lg shadow-slate-900/10">
                {previewSrc ? (
                  <img src={previewSrc} alt="Vista previa QR" className="h-56 w-56 rounded-2xl" />
                ) : (
                  <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                    Sin vista previa
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Consejo practico</p>
              <p className="mt-1 text-slate-600">
                Usa fondo claro y buen contraste si este QR se mostrara desde lejos o en pantallas con brillo alto.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSubmit(form)}
            disabled={processing || !form.value.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing && <Loader className="h-4 w-4 animate-spin" />}
            {mode === 'edit' ? 'Actualizar QR' : 'Agregar QR'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DesignEditor = () => {
  const { id: designId } = useParams();
  const navigate = useNavigate();
  const exportMenuRef = useRef(null);
  const designRef = useRef(null);
  const savedSnapshotRef = useRef('');

  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    mode: 'create',
    elementId: null,
    initialConfig: getDefaultQrConfig()
  });
  const [qrProcessing, setQrProcessing] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const statusTooltipRef = useRef(null);

  const commitDesignState = useCallback((nextDesign) => {
    designRef.current = nextDesign;
    setDesign(nextDesign);
  }, []);

  const updateSavedSnapshot = useCallback((content) => {
    const snapshot = getContentSnapshot(content);
    savedSnapshotRef.current = snapshot;
    setDirty(false);
  }, []);

  const getMergedContent = useCallback(() => {
    if (!designRef.current) {
      return null;
    }

    return mergeEditorContentWithDesign(polotnoStore.toJSON(), designRef.current);
  }, []);

  const syncDirtyState = useCallback((json) => {
    if (!designRef.current) {
      return;
    }

    const mergedContent = mergeEditorContentWithDesign(json, designRef.current);
    const nextSnapshot = getContentSnapshot(mergedContent);
    setDirty(nextSnapshot !== savedSnapshotRef.current);
  }, []);

  const syncHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: Boolean(polotnoStore.history?.canUndo),
      canRedo: Boolean(polotnoStore.history?.canRedo)
    });
  }, []);

  const loadDesign = useCallback(async () => {
    if (!designId) {
      navigate('/designs');
      return;
    }

    try {
      setLoading(true);
      const response = await designsService.getById(designId);
      const nextDesign = decorateDesign(response.data);

      polotnoStore.loadJSON(nextDesign.content);
      commitDesignState(nextDesign);
      updateSavedSnapshot(nextDesign.content);
      syncHistoryState();
    } catch (error) {
      console.error('Error loading design:', error);
      toast.error('No se pudo cargar el diseno');
      navigate('/designs');
    } finally {
      setLoading(false);
    }
  }, [commitDesignState, designId, navigate, syncHistoryState, updateSavedSnapshot]);

  useEffect(() => {
    loadDesign();
  }, [loadDesign]);

  useEffect(() => {
    if (!design) {
      return undefined;
    }

    const unsubscribe = polotnoStore.on('change', (json) => {
      syncDirtyState(json);
      syncHistoryState();
    });

    syncDirtyState(polotnoStore.toJSON());
    syncHistoryState();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [design, syncDirtyState, syncHistoryState]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!dirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const assignedScreens = useMemo(() => design?.assigned_screens || [], [design]);
  const resolutionLabel = useMemo(
    () => (design ? buildResolutionLabel(design.content) : 'Sin resolucion'),
    [design]
  );

  const statusMeta = useMemo(() => {
    if (publishing) {
      return {
        label: 'Publicando cambios',
        dotClassName: 'bg-amber-500',
        textClassName: 'text-amber-700'
      };
    }

    if (saving) {
      return {
        label: 'Guardando',
        dotClassName: 'bg-sky-500',
        textClassName: 'text-sky-700'
      };
    }

    if (dirty) {
      return {
        label: 'Cambios sin guardar',
        dotClassName: 'bg-orange-500',
        textClassName: 'text-orange-700'
      };
    }

    return {
      label: 'Todo guardado',
      dotClassName: 'bg-emerald-500',
      textClassName: 'text-emerald-700'
    };
  }, [dirty, publishing, saving]);

  const handleBack = useCallback(() => {
    if (dirty && !window.confirm('Hay cambios sin guardar. Quieres salir igual?')) {
      return;
    }

    navigate('/designs');
  }, [dirty, navigate]);

  const handleSave = useCallback(async () => {
    if (!designId || !designRef.current) {
      return null;
    }

    try {
      setSaving(true);

      const mergedContent = getMergedContent();
      if (!mergedContent) {
        throw new Error('No hay contenido para guardar');
      }

      const response = await designsService.update(designId, {
        name: designRef.current.name,
        description: designRef.current.description,
        content: mergedContent
      });

      const nextDesign = decorateDesign(response.data);
      commitDesignState(nextDesign);
      updateSavedSnapshot(nextDesign.content);
      syncHistoryState();
      setLastSavedAt(new Date());
      toast.success('Diseno guardado');

      return nextDesign;
    } catch (error) {
      console.error('Error saving design:', error);
      toast.error('No se pudo guardar el diseno');
      return null;
    } finally {
      setSaving(false);
    }
  }, [commitDesignState, designId, getMergedContent, syncHistoryState, updateSavedSnapshot]);

  const handlePublish = useCallback(async () => {
    if (!designId || !designRef.current) {
      toast.error('No hay diseno para publicar');
      return;
    }

    if (dirty) {
      toast.error('Guarda los cambios antes de publicar');
      return;
    }

    try {
      setPublishing(true);
      const response = await designsService.publish(designId);
      const publishedDesign = decorateDesign(response.data.design);
      commitDesignState(publishedDesign);
      updateSavedSnapshot(publishedDesign.content);
      syncHistoryState();
      setLastSavedAt(new Date());
      toast.success(
        publishedDesign.assigned_screens_count
          ? `Publicado y enviado a ${publishedDesign.assigned_screens_count} pantalla(s)`
          : 'Diseno publicado'
      );
    } catch (error) {
      console.error('Error publishing design:', error);
      toast.error('No se pudo publicar el diseno');
    } finally {
      setPublishing(false);
    }
  }, [commitDesignState, designId, dirty, syncHistoryState, updateSavedSnapshot]);

  const handlePreview = useCallback(async () => {
    try {
      const mergedContent = getMergedContent();
      const activePage = polotnoStore.activePage;

      if (!mergedContent || !activePage) {
        toast.error('No hay contenido listo para previsualizar');
        return;
      }

      const imageUrl = await polotnoStore.toDataURL({
        pixelRatio: 1,
        mimeType: 'image/png',
        quality: 0.92
      });

      const normalized = normalizeDesignContent(mergedContent);

      setPreviewData({
        imageUrl,
        width: activePage.computedWidth || normalized.settings.canvasWidth,
        height: activePage.computedHeight || normalized.settings.canvasHeight,
        designName: designRef.current?.name || 'Diseno',
        screens: assignedScreens
      });
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('No se pudo generar la vista previa');
    }
  }, [assignedScreens, getMergedContent]);

  const handleExportPNG = useCallback(async ({ transparent }) => {
    const activePage = polotnoStore.activePage;

    if (!activePage) {
      toast.error('No hay pagina activa para exportar');
      return;
    }

    const originalBackground = activePage.background;

    try {
      if (transparent) {
        activePage.set({ background: 'transparent' });
      }

      const dataUrl = await polotnoStore.toDataURL({
        pixelRatio: 2,
        mimeType: 'image/png'
      });

      downloadDataUrl(
        dataUrl,
        `${buildFileName(designRef.current?.name)}${transparent ? '-transparente' : ''}.png`
      );
      toast.success('PNG exportado');
    } catch (error) {
      console.error('Error exporting PNG:', error);
      toast.error('No se pudo exportar PNG');
    } finally {
      if (transparent) {
        activePage.set({ background: originalBackground });
      }
    }
  }, []);

  const handleExportJPEG = useCallback(async () => {
    try {
      const dataUrl = await polotnoStore.toDataURL({
        pixelRatio: 2,
        mimeType: 'image/jpeg',
        quality: 0.92
      });

      downloadDataUrl(dataUrl, `${buildFileName(designRef.current?.name)}.jpg`);
      toast.success('JPEG exportado');
    } catch (error) {
      console.error('Error exporting JPEG:', error);
      toast.error('No se pudo exportar JPEG');
    }
  }, []);

  const handleExportSVG = useCallback(async () => {
    try {
      await polotnoStore.saveAsSVG({
        fileName: `${buildFileName(designRef.current?.name)}.svg`
      });
      toast.success('SVG exportado');
    } catch (error) {
      console.error('Error exporting SVG:', error);
      toast.error('No se pudo exportar SVG');
    }
  }, []);

  const handleExportJSON = useCallback(() => {
    try {
      const mergedContent = getMergedContent();
      if (!mergedContent) {
        throw new Error('No content');
      }

      downloadBlob(
        JSON.stringify(mergedContent, null, 2),
        `${buildFileName(designRef.current?.name)}.json`,
        'application/json'
      );
      toast.success('JSON exportado');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      toast.error('No se pudo exportar JSON');
    }
  }, [getMergedContent]);

  const handleApplyTemplate = useCallback((template) => {
    if (!template?.content || !designRef.current) {
      toast.error('La plantilla seleccionada no tiene contenido valido');
      return;
    }

    try {
      const normalizedContent = normalizeDesignContent(template.content);
      const nextDesign = {
        ...designRef.current,
        content: normalizedContent
      };

      commitDesignState(nextDesign);
      polotnoStore.loadJSON(normalizedContent);
      syncDirtyState(normalizedContent);
      syncHistoryState();
      toast.success(`Plantilla aplicada: ${template.name}`);
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('No se pudo aplicar la plantilla');
    }
  }, [commitDesignState, syncDirtyState, syncHistoryState]);

  const handleConfigUpdate = useCallback((updatedDesign) => {
    const normalizedContent = normalizeDesignContent(updatedDesign.content);
    const nextDesign = {
      ...designRef.current,
      ...updatedDesign,
      content: normalizedContent
    };

    commitDesignState(nextDesign);

    if (!polotnoStore.pages.length) {
      polotnoStore.loadJSON(normalizedContent);
      setDirty(true);
      toast.success('Configuracion aplicada');
      return;
    }

    polotnoStore.setSize(
      normalizedContent.settings.canvasWidth,
      normalizedContent.settings.canvasHeight,
      true
    );

    polotnoStore.pages.forEach((page, index) => {
      const pageConfig = normalizedContent.pages[index] || normalizedContent.pages[0];
      page.set({
        background: pageConfig?.background || normalizedContent.settings.backgroundColor
      });
    });

    setDirty(true);
    syncHistoryState();
    toast.success('Configuracion aplicada');
  }, [commitDesignState, syncHistoryState]);

  const openInsertQr = useCallback(() => {
    setQrModal({
      isOpen: true,
      mode: 'create',
      elementId: null,
      initialConfig: getDefaultQrConfig()
    });
  }, []);

  const openEditQr = useCallback((element) => {
    const qrConfig = getQrConfigFromElement(element);

    if (!qrConfig) {
      toast.error('El elemento seleccionado no es un QR editable');
      return;
    }

    setQrModal({
      isOpen: true,
      mode: 'edit',
      elementId: element.id,
      initialConfig: qrConfig
    });
  }, []);

  const closeQrModal = useCallback(() => {
    if (qrProcessing) {
      return;
    }

    setQrModal((current) => ({ ...current, isOpen: false }));
  }, [qrProcessing]);

  const handleSubmitQr = useCallback(async (config) => {
    const activePage = polotnoStore.activePage;

    if (!activePage) {
      toast.error('No hay pagina activa para insertar el QR');
      return;
    }

    try {
      setQrProcessing(true);

      if (qrModal.mode === 'edit' && qrModal.elementId) {
        const element = polotnoStore.getElementById(qrModal.elementId);

        if (!element) {
          toast.error('No se encontro el QR seleccionado');
          return;
        }

        const qrConfig = sanitizeQrConfig(config);
        const svgMarkup = await generateQrSvg(qrConfig);
        element.set({
          src: svgToDataUrl(svgMarkup),
          custom: {
            ...element.custom,
            isQrElement: true,
            qrConfig
          }
        });

        toast.success('QR actualizado');
      } else {
        const pageWidth = Number(activePage.computedWidth || activePage.width || 1080);
        const pageHeight = Number(activePage.computedHeight || activePage.height || 1080);
        const size = Math.max(180, Math.min(260, Math.round(Math.min(pageWidth, pageHeight) * 0.22)));
        const placement = {
          size,
          x: Math.max(40, Math.round((pageWidth - size) / 2)),
          y: Math.max(40, Math.round((pageHeight - size) / 2))
        };
        const payload = await generateQrElementPayload(config, placement);
        const newElement = activePage.addElement(payload.element);

        if (newElement?.id) {
          polotnoStore.selectElements([newElement.id]);
        }

        toast.success('QR agregado al lienzo');
      }

      setDirty(true);
      setQrModal((current) => ({ ...current, isOpen: false }));
    } catch (error) {
      console.error('Error handling QR:', error);
      toast.error('No se pudo procesar el QR');
    } finally {
      setQrProcessing(false);
    }
  }, [qrModal.elementId, qrModal.mode]);

  const handleUndo = useCallback(() => {
    if (!polotnoStore.history?.canUndo) {
      return;
    }

    polotnoStore.history.undo();
    syncHistoryState();
  }, [syncHistoryState]);

  const handleRedo = useCallback(() => {
    if (!polotnoStore.history?.canRedo) {
      return;
    }

    polotnoStore.history.redo();
    syncHistoryState();
  }, [syncHistoryState]);

  const startEditingName = useCallback(() => {
    setEditingName(design?.name || '');
    setIsEditingName(true);
  }, [design]);

  const commitName = useCallback(() => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingName(designRef.current?.name || '');
      setIsEditingName(false);
      return;
    }
    if (designRef.current && trimmed !== designRef.current.name) {
      const nextDesign = { ...designRef.current, name: trimmed };
      commitDesignState(nextDesign);
      setDirty(true);
    }
    setIsEditingName(false);
  }, [editingName, commitDesignState]);

  const handleNameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setEditingName(designRef.current?.name || '');
      setIsEditingName(false);
    }
  }, []);

  useEffect(() => {
    if (!showStatusTooltip) return;
    const handleClickOutside = (event) => {
      if (statusTooltipRef.current && !statusTooltipRef.current.contains(event.target)) {
        setShowStatusTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusTooltip]);

  const formatTimestamp = (date) => {
    if (!date) return null;
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F5F5]">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white px-8 py-7 text-center shadow-sm">
          <Loader className="mx-auto h-8 w-8 animate-spin text-slate-700" />
          <p className="mt-4 text-sm font-medium text-slate-700">Cargando editor de disenos...</p>
        </div>
      </div>
    );
  }

  if (!design) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-[#F5F5F5] text-slate-900">
      {/* ── Top Bar ── */}
      <header
        className="flex h-14 flex-shrink-0 items-center border-b border-[#E5E7EB] bg-white px-4"
        style={{ minHeight: 56, maxHeight: 56 }}
      >
        {/* Left: Back + Name + Status */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>

          <div className="h-5 w-px bg-[#E5E7EB]" />

          {isEditingName ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={commitName}
              onKeyDown={handleNameKeyDown}
              autoFocus
              className="min-w-[120px] max-w-[280px] truncate rounded-md border border-blue-300 bg-white px-2 py-1 text-sm font-semibold text-slate-900 outline-none ring-2 ring-blue-100"
            />
          ) : (
            <button
              type="button"
              onClick={startEditingName}
              className="min-w-0 truncate rounded-md px-2 py-1 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              title="Click para editar nombre"
            >
              {design.name}
            </button>
          )}

          <div className="relative" ref={statusTooltipRef}>
            <button
              type="button"
              onClick={() => setShowStatusTooltip((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition hover:bg-slate-50 ${statusMeta.textClassName}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusMeta.dotClassName}`} />
              {statusMeta.label}
            </button>

            {showStatusTooltip && (
              <div className="absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg">
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${statusMeta.dotClassName}`} />
                    <span className="font-medium text-slate-900">{statusMeta.label}</span>
                  </div>
                  {lastSavedAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>Guardado a las {formatTimestamp(lastSavedAt)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Monitor className="h-3 w-3 text-slate-400" />
                    <span>{resolutionLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                    <span>
                      {assignedScreens.length
                        ? `${assignedScreens.length} pantalla(s)`
                        : 'Sin pantallas asignadas'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions in exact order */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden lg:inline">Vista previa</span>
          </button>

          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu((current) => !current)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              <span className="hidden lg:inline">Exportar</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => { setShowExportMenu(false); handleExportPNG({ transparent: false }); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <FileImage className="h-4 w-4" /> PNG con fondo
                </button>
                <button
                  type="button"
                  onClick={() => { setShowExportMenu(false); handleExportPNG({ transparent: true }); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <FileImage className="h-4 w-4" /> PNG sin fondo
                </button>
                <button
                  type="button"
                  onClick={() => { setShowExportMenu(false); handleExportJPEG(); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <FileImage className="h-4 w-4" /> JPEG
                </button>
                <button
                  type="button"
                  onClick={() => { setShowExportMenu(false); handleExportSVG(); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <File className="h-4 w-4" /> SVG
                </button>
                <button
                  type="button"
                  onClick={() => { setShowExportMenu(false); handleExportJSON(); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" /> JSON
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handlePublish}
            disabled={saving || publishing || dirty}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? <Loader className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="hidden lg:inline">Publicar</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || publishing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </button>
        </div>
      </header>

      {/* ── Editor Body ── */}
      <main className="min-h-0 flex-1">
        <PolotnoEditor
          onRequestInsertQr={openInsertQr}
          onRequestEditQr={openEditQr}
          onRequestConfigureDocument={() => setConfigModalOpen(true)}
          onApplyTemplate={handleApplyTemplate}
          historyState={historyState}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </main>

      <DesignConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        design={design}
        onUpdate={handleConfigUpdate}
      />

      <QrEditorModal
        isOpen={qrModal.isOpen}
        mode={qrModal.mode}
        initialConfig={qrModal.initialConfig}
        onClose={closeQrModal}
        onSubmit={handleSubmitQr}
        processing={qrProcessing}
      />

      {showPreview && previewData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="relative flex h-full max-h-[92vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="absolute right-4 top-4 z-10 rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-[#E5E7EB] px-6 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-slate-900">{previewData.designName}</h2>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vista previa
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                <span>Resolucion: {previewData.width} × {previewData.height}</span>
                <span>Pantallas asignadas: {previewData.screens.length}</span>
                {previewData.screens.length > 0 && (
                  <span className="inline-flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    {previewData.screens.map((screen) => screen.name).join(', ')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#F5F5F5] p-6">
              <img
                src={previewData.imageUrl}
                alt="Vista previa del diseno"
                className="max-h-full max-w-full rounded-2xl border border-[#E5E7EB] bg-white shadow-xl"
              />
            </div>

            {!previewData.screens.length && (
              <div className="border-t border-[#E5E7EB] bg-slate-50 px-6 py-4 text-sm text-slate-600">
                Todavia no hay pantallas asignadas. La vista previa muestra el lienzo actual, pero no existe una pantalla publicada para recibirlo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignEditor;
