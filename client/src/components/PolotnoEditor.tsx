import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutTemplate,
  Type,
  Shapes,
  Image as ImageIcon,
  PaintBucket,
  QrCode,
  Layers,
  Upload,
  Plus,
  Square,
  Circle,
  Settings2,
  Edit3,
  Copy,
  Trash2,
  BringToFront,
  SendToBack,
  Loader2,
  Undo2,
  Redo2,
  Minus,
  Maximize,
  X,
  ChevronLeft,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  GripVertical
} from 'lucide-react';
import { observer } from 'mobx-react-lite';
import toast from 'react-hot-toast';
import { PolotnoContainer, WorkspaceWrap } from 'polotno';
import {
  TextSection,
  ElementsSection,
  PhotosSection,
  UploadSection,
  BackgroundSection,
  LayersSection
} from 'polotno/side-panel';
import { Workspace } from 'polotno/canvas/workspace';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { designsService } from '../services/api';
import { polotnoStore } from '../store/editorStore';
import { normalizeDesignContent } from '../utils/designContent';
import { configurePolotnoImageDefaults } from '../utils/polotno-image-config';
import { PolotnoAnimationsPanel } from './PolotnoAnimationsPanel';
import '@blueprintjs/core/lib/css/blueprint.css';
import '../vendor/blueprint5-polotno.css';
import './PolotnoEditor.css';

type PanelKey =
  | 'templates'
  | 'text'
  | 'elements'
  | 'upload'
  | 'photos'
  | 'background'
  | 'qr';

interface DesignTemplate {
  id: string;
  name: string;
  description?: string;
  type?: string;
  thumbnail?: string | null;
  content?: any;
}

interface PolotnoEditorProps {
  onRequestInsertQr?: () => void;
  onRequestEditQr?: (element: any) => void;
  onRequestConfigureDocument?: () => void;
  onApplyTemplate?: (template: DesignTemplate) => void;
  historyState?: { canUndo: boolean; canRedo: boolean };
  onUndo?: () => void;
  onRedo?: () => void;
}

const PANEL_CONTENT = {
  text: TextSection.Panel,
  elements: ElementsSection.Panel,
  upload: UploadSection.Panel,
  photos: PhotosSection.Panel,
  background: BackgroundSection.Panel,
} as const;

const PANEL_META: Record<
  PanelKey,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  templates: { label: 'Plantillas', icon: LayoutTemplate },
  text: { label: 'Texto', icon: Type },
  elements: { label: 'Elementos', icon: Shapes },
  upload: { label: 'Subir', icon: Upload },
  photos: { label: 'Imágenes', icon: ImageIcon },
  background: { label: 'Fondo', icon: PaintBucket },
  qr: { label: 'QR', icon: QrCode },
};

const TOOL_ORDER: PanelKey[] = [
  'templates',
  'text',
  'elements',
  'upload',
  'photos',
  'background',
  'qr',
];

const getPageMetrics = () => {
  const activePage = polotnoStore.activePage;
  return {
    activePage,
    width: Number(activePage?.computedWidth || activePage?.width || 1920),
    height: Number(activePage?.computedHeight || activePage?.height || 1080),
  };
};

const getSelectedElement = () => polotnoStore.selectedElements?.[0] || null;

const buildTemplatePreview = (template: DesignTemplate) => {
  const normalized = normalizeDesignContent(template.content);
  const page = normalized.pages[0];
  const textElements = (page?.children || []).filter((el: any) => el.type === 'text');
  const headline = textElements[0]?.text || template.name;
  const subheadline = textElements[1]?.text || template.description || 'Plantilla lista para editar';
  const accent =
    textElements.find((el: any) => el.fill && el.fill !== '#111827')?.fill || '#2563eb';
  return {
    background: page?.background || normalized.settings.backgroundColor || '#ffffff',
    accent,
    headline,
    subheadline,
  };
};

const addElementToPage = (payload: Record<string, any>) => {
  const { activePage } = getPageMetrics();
  if (!activePage) return null;

  let createdElement: any = null;
  const page: any = activePage;
  polotnoStore.history.transaction(() => {
    createdElement = page.addElement(payload as any);
  });
  if (createdElement?.id) {
    polotnoStore.selectElements([createdElement.id]);
  }
  return createdElement;
};

const duplicateSelection = () => {
  const activePage = polotnoStore.activePage;
  const selected = polotnoStore.selectedElements || [];
  if (!activePage || !selected.length) return;

  const duplicatedIds: string[] = [];
  polotnoStore.history.transaction(() => {
    selected.forEach((element: any) => {
      if (!element?.toJSON) return;
      const snapshot = element.toJSON();
      const duplicated = activePage.addElement({
        ...snapshot,
        id: undefined,
        x: Number(snapshot.x || 0) + 24,
        y: Number(snapshot.y || 0) + 24,
      });
      if (duplicated?.id) duplicatedIds.push(duplicated.id);
    });
  });
  if (duplicatedIds.length) polotnoStore.selectElements(duplicatedIds);
};

const deleteSelection = () => {
  const ids = (polotnoStore.selectedElements || []).map((el: any) => el.id).filter(Boolean);
  if (ids.length) polotnoStore.deleteElements(ids);
};

const moveSelection = (direction: 'top' | 'bottom') => {
  const activePage = polotnoStore.activePage;
  const ids = polotnoStore.selectedElementsIds || [];
  if (!activePage || !ids.length) return;
  if (direction === 'top' && activePage.moveElementsTop) activePage.moveElementsTop(ids);
  if (direction === 'bottom' && activePage.moveElementsBottom) activePage.moveElementsBottom(ids);
};

/* ─── Template Panel ─── */
const TemplatesPanel = ({
  templates,
  loading,
  error,
  onApplyTemplate,
}: {
  templates: DesignTemplate[];
  loading: boolean;
  error: string;
  onApplyTemplate?: (template: DesignTemplate) => void;
}) => (
  <div className="ds-panel-content">
    {loading ? (
      <div className="ds-panel-state">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Cargando plantillas…</span>
      </div>
    ) : error ? (
      <div className="ds-panel-state">
        <LayoutTemplate className="h-5 w-5" />
        <span>{error}</span>
      </div>
    ) : (
      <div className="ds-template-list">
        {templates.map((template) => {
          const preview = buildTemplatePreview(template);
          return (
            <article key={template.id} className="ds-template-card">
              <div className="ds-template-preview" style={{ background: preview.background }}>
                <div className="ds-template-accent" style={{ backgroundColor: preview.accent }} />
                <div className="ds-template-text">
                  <strong>{preview.headline}</strong>
                  <span>{preview.subheadline}</span>
                </div>
              </div>
              <div className="ds-template-meta">
                <div>
                  <h4>{template.name}</h4>
                  <p>{template.description || 'Plantilla lista para personalizar.'}</p>
                </div>
                <button
                  type="button"
                  className="ds-btn ds-btn--ghost"
                  onClick={() => {
                    if (!onApplyTemplate) return;
                    if (window.confirm('Aplicar esta plantilla reemplaza el contenido actual. ¿Continuar?')) {
                      onApplyTemplate(template);
                    }
                  }}
                  disabled={!onApplyTemplate}
                >
                  Usar plantilla
                </button>
              </div>
            </article>
          );
        })}
      </div>
    )}
  </div>
);

/* ─── QR Panel ─── */
const QrPanel = ({
  hasSelectedQr,
  onRequestInsertQr,
  onRequestEditQr,
}: {
  hasSelectedQr: boolean;
  onRequestInsertQr?: () => void;
  onRequestEditQr?: (element: any) => void;
}) => {
  const selectedElement = getSelectedElement();
  return (
    <div className="ds-panel-content">
      <div className="ds-panel-stack">
        <button type="button" className="ds-btn ds-btn--primary" onClick={onRequestInsertQr}>
          <QrCode className="h-4 w-4" /> Insertar QR
        </button>
        {hasSelectedQr && selectedElement && onRequestEditQr && (
          <button
            type="button"
            className="ds-btn ds-btn--ghost"
            onClick={() => onRequestEditQr(selectedElement)}
          >
            <Edit3 className="h-4 w-4" /> Editar QR seleccionado
          </button>
        )}
      </div>
      <div className="ds-tip-list">
        <div className="ds-tip">
          <strong>Mejor lectura</strong>
          <p>Deja buen contraste y aire alrededor para que se escanee desde lejos.</p>
        </div>
        <div className="ds-tip">
          <strong>Uso comercial</strong>
          <p>Menus, cupones, links persistentes y campañas promocionales.</p>
        </div>
      </div>
    </div>
  );
};

/* ─── Panel Body Router ─── */
const PanelBody = ({
  activePanel,
  templates,
  loadingTemplates,
  templateError,
  onApplyTemplate,
  hasSelectedQr,
  onRequestInsertQr,
  onRequestEditQr,
}: {
  activePanel: PanelKey;
  templates: DesignTemplate[];
  loadingTemplates: boolean;
  templateError: string;
  onApplyTemplate?: (template: DesignTemplate) => void;
  hasSelectedQr: boolean;
  onRequestInsertQr?: () => void;
  onRequestEditQr?: (element: any) => void;
}) => {
  if (activePanel === 'templates') {
    return (
      <TemplatesPanel
        templates={templates}
        loading={loadingTemplates}
        error={templateError}
        onApplyTemplate={onApplyTemplate}
      />
    );
  }
  if (activePanel === 'qr') {
    return (
      <QrPanel
        hasSelectedQr={hasSelectedQr}
        onRequestInsertQr={onRequestInsertQr}
        onRequestEditQr={onRequestEditQr}
      />
    );
  }
  const PanelComponent = PANEL_CONTENT[activePanel as keyof typeof PANEL_CONTENT];
  if (!PanelComponent) return null;
  return <PanelComponent store={polotnoStore} />;
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
const PolotnoEditor: React.FC<PolotnoEditorProps> = observer(
  ({ onRequestInsertQr, onRequestEditQr, onRequestConfigureDocument, onApplyTemplate, historyState, onUndo, onRedo }) => {
    const [activePanel, setActivePanel] = useState<PanelKey | null>('templates');
    const [templates, setTemplates] = useState<DesignTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [templateError, setTemplateError] = useState('');
    const [templatesLoaded, setTemplatesLoaded] = useState(false);
    const [showLayers, setShowLayers] = useState(false);
    const [showAnimations, setShowAnimations] = useState(false);
    const layersRef = useRef<HTMLDivElement>(null);
    const animationsRef = useRef<HTMLDivElement>(null);

    const selectedElements = polotnoStore.selectedElements || [];
    const selectedCount = selectedElements.length;
    const selectedElement = selectedCount === 1 ? selectedElements[0] : null;
    const hasSelectedQr = Boolean(selectedElement?.custom?.isQrElement);
    const activePage = polotnoStore.activePage;
    const hasCanvasElements = Boolean(activePage?.children?.length);

    const toolbarComponents = useMemo(
      () => ({
        History: () => null,
        ActionControls: () => null,
        Admin: () => null,
        Lock: () => null,
        CopyStyle: () => null,
      }),
      []
    );

    // ─── Configure image defaults ───
    useEffect(() => {
      try {
        configurePolotnoImageDefaults(polotnoStore, {
          draggable: true,
          resizable: true,
          removable: true,
          selectable: true,
          contentEditable: false,
          styleEditable: true,
          locked: false,
          keepRatio: true,
          stretchEnabled: true,
        });
      } catch (_error) {
        // silent
      }
    }, []);

    // ─── Load templates ───
    useEffect(() => {
      if (activePanel !== 'templates' || templatesLoaded) return;
      let active = true;
      setLoadingTemplates(true);
      setTemplateError('');
      Promise.resolve(designsService.getTemplates())
        .then((response) => {
          if (!active) return;
          setTemplates(Array.isArray(response.data) ? response.data : []);
          setTemplatesLoaded(true);
        })
        .catch(() => {
          if (!active) return;
          setTemplateError('Intenta de nuevo en unos segundos.');
          toast.error('No se pudieron cargar las plantillas del editor');
        })
        .finally(() => { if (active) setLoadingTemplates(false); });
      return () => { active = false; };
    }, [activePanel, templatesLoaded]);

    // ─── Close layers popover on outside click / escape ───
    useEffect(() => {
      if (!showLayers && !showAnimations) return;

      const handleClick = (e: MouseEvent) => {
        const target = e.target as Node;

        if (showLayers && layersRef.current && !layersRef.current.contains(target)) {
          setShowLayers(false);
        }

        if (showAnimations && animationsRef.current && !animationsRef.current.contains(target)) {
          setShowAnimations(false);
        }
      };

      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowLayers(false);
          setShowAnimations(false);
        }
      };

      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKey);
      return () => {
        document.removeEventListener('mousedown', handleClick);
        document.removeEventListener('keydown', handleKey);
      };
    }, [showAnimations, showLayers]);

    useEffect(() => {
      if (selectedCount === 0) {
        setShowAnimations(false);
      }
    }, [selectedCount]);

    // ─── Sidebar toggle ───
    const togglePanel = (panelKey: PanelKey) => {
      setActivePanel((current) => (current === panelKey ? null : panelKey));
    };

    // ─── Quick add helpers ───
    const addTitle = () => {
      const { width, height } = getPageMetrics();
      addElementToPage({
        type: 'text',
        text: 'Titulo principal',
        x: Math.round(width * 0.11),
        y: Math.round(height * 0.12),
        width: Math.min(Math.round(width * 0.74), 980),
        fontSize: Math.max(48, Math.round(width * 0.05)),
        fontWeight: 'bold',
        fill: '#111827',
        align: 'left',
      });
    };

    const addSubtitle = () => {
      const { width, height } = getPageMetrics();
      addElementToPage({
        type: 'text',
        text: 'Subtitulo o bajada para reforzar el mensaje principal',
        x: Math.round(width * 0.11),
        y: Math.round(height * 0.28),
        width: Math.min(Math.round(width * 0.62), 760),
        fontSize: Math.max(24, Math.round(width * 0.022)),
        fill: '#475569',
        lineHeight: 1.25,
        align: 'left',
      });
    };

    const addRectangle = () => {
      const { width, height } = getPageMetrics();
      addElementToPage({
        type: 'figure',
        subType: 'rect',
        x: Math.round(width * 0.12),
        y: Math.round(height * 0.16),
        width: Math.max(280, Math.round(width * 0.3)),
        height: Math.max(140, Math.round(height * 0.15)),
        fill: '#dbeafe',
        stroke: '#93c5fd',
        strokeWidth: 1.5,
        cornerRadius: 24,
      });
    };

    const addCircle = () => {
      const { width, height } = getPageMetrics();
      const size = Math.max(120, Math.round(Math.min(width, height) * 0.14));
      addElementToPage({
        type: 'figure',
        subType: 'circle',
        x: Math.round(width * 0.68),
        y: Math.round(height * 0.18),
        width: size,
        height: size,
        fill: '#fde68a',
        stroke: '#f59e0b',
        strokeWidth: 1.5,
      });
    };

    // ─── Zoom helpers ───
    const handleZoomIn = useCallback(() => {
      const current = (polotnoStore as any).scale || 1;
      const next = Math.min(current + 0.1, 4);
      (polotnoStore as any).setScale?.(next);
    }, []);

    const handleZoomOut = useCallback(() => {
      const current = (polotnoStore as any).scale || 1;
      const next = Math.max(current - 0.1, 0.1);
      (polotnoStore as any).setScale?.(next);
    }, []);

    const handleZoomFit = useCallback(() => {
      (polotnoStore as any).setScale?.(0.9);
    }, []);

    // Force Polotno to recalculate canvas coordinates when the CSS grid shifts 
    // the .ds-main area due to the sidebar panel opening or closing. 
    // This perfectly fixes the "sidebar eating the canvas" selection desync bug.
    useEffect(() => {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      return () => clearTimeout(timer);
    }, [activePanel]);

    const currentZoom = Math.round(((polotnoStore as any).scale || 0.9) * 100);

    return (
      <div className="ds">
        <div className="ds-container">
          {/* ── Sidebar Rail (always visible, 64px) ── */}
          <aside className="ds-rail">
            <div className="ds-rail-items">
              {TOOL_ORDER.map((panelKey) => {
                const meta = PANEL_META[panelKey];
                const Icon = meta.icon;
                const isActive = activePanel === panelKey;
                return (
                  <button
                    key={panelKey}
                    type="button"
                    className={`ds-rail-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => togglePanel(panelKey)}
                    title={meta.label}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Sidebar Panel (280px, expandable) ── */}
          {activePanel && (
            <aside className="ds-panel">
              <div className="ds-panel-header">
                <h2>{PANEL_META[activePanel].label}</h2>
                <button
                  type="button"
                  className="ds-panel-close"
                  onClick={() => setActivePanel(null)}
                  aria-label="Cerrar panel"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
              <div className="ds-panel-body">
                <PanelBody
                  activePanel={activePanel}
                  templates={templates}
                  loadingTemplates={loadingTemplates}
                  templateError={templateError}
                  onApplyTemplate={onApplyTemplate}
                  hasSelectedQr={hasSelectedQr}
                  onRequestInsertQr={onRequestInsertQr}
                  onRequestEditQr={onRequestEditQr}
                />
              </div>
            </aside>
          )}

          {/* ── Main Area ── */}
          <section className="ds-main">
            {/* Contextual Toolbar — only when selection */}
            {selectedCount > 0 && (
              <div className="ds-ctx-toolbar">
                {/* Left block: Undo / Redo */}
                <div className="ds-ctx-left">
                  <button
                    type="button"
                    className="ds-icon-btn"
                    onClick={onUndo}
                    disabled={!historyState?.canUndo}
                    aria-label="Deshacer"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="ds-icon-btn"
                    onClick={onRedo}
                    disabled={!historyState?.canRedo}
                    aria-label="Rehacer"
                  >
                    <Redo2 className="h-4 w-4" />
                  </button>
                  <div className="ds-ctx-divider" />
                </div>

                {/* Center block: Polotno native toolbar (scrollable) */}
                <div className="ds-ctx-center">
                  {/* SCROLLING REVEAL TRICK:
                  {/* We MUST wrap Toolbar in a container with a large minWidth. 
                      Polotno's Toolbar uses a ResizeObserver in JS. If it detects space is < ~700px, 
                      it triggers a "compact mode" which completely hides the Font picker 
                      and uses a broken stacking layout. By forcing minWidth to 850px, 
                      we trick Polotno into always rendering the full proper layout, 
                      and we allow .ds-ctx-center to handle scrolling natively. 
                      
                      NEW FIX: We also make it a flex container so that if Toolbar 
                      returns multiple blocks, they align horizontally instead of stacking. */}
                  <div style={{ 
                    minWidth: '850px', 
                    width: 'max-content',
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <Toolbar
                      store={polotnoStore}
                      downloadButtonEnabled={false}
                      components={toolbarComponents}
                    />
                  </div>
                </div>

                {/* Right block: selection actions + Layers */}
                <div className="ds-ctx-right">
                  <div className="ds-ctx-divider" />

                  {hasSelectedQr && onRequestEditQr && selectedElement && (
                    <button
                      type="button"
                      className="ds-chip"
                      onClick={() => onRequestEditQr(selectedElement)}
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Editar QR
                    </button>
                  )}

                  <button type="button" className="ds-chip" onClick={duplicateSelection}>
                    <Copy className="h-3.5 w-3.5" /> Duplicar
                  </button>
                  <div className="ds-animations-anchor" ref={animationsRef}>
                    <button
                      type="button"
                      className={`ds-chip ${showAnimations ? 'is-active' : ''}`}
                      onClick={() => setShowAnimations((current) => !current)}
                      aria-expanded={showAnimations}
                    >
                      <Settings2 className="h-3.5 w-3.5" /> Animaciones
                    </button>
                    {showAnimations && (
                      <div className="ds-animations-popover">
                        <PolotnoAnimationsPanel
                          store={polotnoStore}
                          onClose={() => setShowAnimations(false)}
                        />
                      </div>
                    )}
                  </div>
                  <button type="button" className="ds-chip" onClick={() => moveSelection('top')}>
                    <BringToFront className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="ds-chip" onClick={() => moveSelection('bottom')}>
                    <SendToBack className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="ds-chip ds-chip--danger" onClick={deleteSelection}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <div className="ds-ctx-divider" />

                  {/* Layers popover */}
                  <div className="ds-layers-anchor" ref={layersRef}>
                    <button
                      type="button"
                      className={`ds-chip ${showLayers ? 'is-active' : ''}`}
                      onClick={() => setShowLayers((v) => !v)}
                    >
                      <Layers className="h-3.5 w-3.5" /> Capas
                    </button>
                    {showLayers && (
                      <div className="ds-layers-popover">
                        <div className="ds-layers-popover-header">
                          <span>Capas</span>
                          <button
                            type="button"
                            className="ds-icon-btn ds-icon-btn--sm"
                            onClick={() => setShowLayers(false)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="ds-layers-popover-body">
                          <LayersSection.Panel store={polotnoStore} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Canvas Workspace */}
            <WorkspaceWrap className="ds-workspace-wrap">
              <div className="ds-workspace-shell">
                <Workspace
                  store={polotnoStore}
                  components={{
                    ActionControls: () => null,
                    PageControls: () => null,
                  }}
                />

                {/* Zoom Controls */}
                <div className="ds-zoom-controls">
                  <button type="button" className="ds-icon-btn" onClick={handleZoomOut} aria-label="Alejar">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="ds-zoom-label">{currentZoom}%</span>
                  <button type="button" className="ds-icon-btn" onClick={handleZoomIn} aria-label="Acercar">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button type="button" className="ds-icon-btn" onClick={handleZoomFit} aria-label="Ajustar">
                    <Maximize className="h-4 w-4" />
                  </button>
                </div>

                {/* Empty state */}
                {!hasCanvasElements && (
                  <div className="ds-empty-state">
                    <div className="ds-empty-card">
                      <LayoutTemplate className="h-6 w-6" />
                      <h3>Tu lienzo esta listo</h3>
                      <p>Empieza desde una plantilla o agrega texto, formas, imagenes y QR desde la izquierda.</p>
                    </div>
                  </div>
                )}
              </div>
            </WorkspaceWrap>
          </section>
        </div>
      </div>
    );
  }
);

export default PolotnoEditor;
