import React, { useRef, useState } from 'react';
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import './GrapesJSEditor.css';
import { Save, Eye, Undo, Redo } from 'lucide-react';

const GrapesJSEditor = ({ 
  design, 
  onSave, 
  onPreview,
  saving = false 
}) => {
  const [editor, setEditor] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorRef = useRef(null);

  // Configuración del editor GrapesJS
  const editorOptions = {
    // Configuración del proyecto
    project: {
      type: 'web',
      default: {
        pages: [
          {
            name: design?.name || 'Diseño',
            component: design?.content?.html || '<div class="container"><h1>Bienvenido a tu diseño</h1><p>Comienza a editar arrastrando elementos desde el panel lateral.</p></div>'
          }
        ],
        styles: design?.content?.css || `
          .container {
            padding: 20px;
            max-width: ${design?.settings?.canvasWidth || 1920}px;
            height: ${design?.settings?.canvasHeight || 1080}px;
            margin: 0 auto;
            background: #ffffff;
          }
          h1 {
            color: #333;
            font-family: Arial, sans-serif;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            font-family: Arial, sans-serif;
            line-height: 1.6;
          }
        `
      }
    },
    
    // Configuración del canvas
    canvas: {
      styles: [
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
      ],
      scripts: []
    },

    // Configuración de dispositivos/viewports
    deviceManager: {
      devices: [
        {
          id: 'desktop',
          name: 'Desktop',
          width: design?.settings?.canvasWidth || 1920,
          height: design?.settings?.canvasHeight || 1080,
          widthMedia: '1024px'
        },
        {
          id: 'tablet',
          name: 'Tablet',
          width: '768px',
          height: '1024px',
          widthMedia: '768px'
        },
        {
          id: 'mobile',
          name: 'Mobile',
          width: '375px',
          height: '667px',
          widthMedia: '480px'
        }
      ]
    },

    // Configuración de bloques/elementos
    blockManager: {
      appendTo: '.blocks-container',
      blocks: [
        {
          id: 'text',
          label: 'Texto',
          category: 'Básico',
          content: '<div class="text-element">Tu texto aquí</div>',
          attributes: { class: 'fa fa-text-width' }
        },
        {
          id: 'image',
          label: 'Imagen',
          category: 'Básico',
          content: {
            type: 'image',
            style: { width: '100%', height: 'auto' },
            attributes: { src: 'https://via.placeholder.com/300x200?text=Imagen' }
          },
          attributes: { class: 'fa fa-image' }
        },
        {
          id: 'video',
          label: 'Video',
          category: 'Media',
          content: {
            type: 'video',
            src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            style: { width: '100%', height: '315px' }
          },
          attributes: { class: 'fa fa-video-camera' }
        },
        {
          id: 'button',
          label: 'Botón',
          category: 'Básico',
          content: '<button class="btn btn-primary">Haz clic aquí</button>',
          attributes: { class: 'fa fa-hand-pointer-o' }
        },
        {
          id: 'container',
          label: 'Contenedor',
          category: 'Layout',
          content: '<div class="container-element"><p>Contenedor flexible</p></div>',
          attributes: { class: 'fa fa-square-o' }
        },
        {
          id: 'columns',
          label: 'Columnas',
          category: 'Layout',
          content: `
            <div class="row">
              <div class="col">Columna 1</div>
              <div class="col">Columna 2</div>
            </div>
          `,
          attributes: { class: 'fa fa-columns' }
        }
      ]
    },

    // Configuración del panel de estilos
    styleManager: {
      appendTo: '.styles-container',
      sectors: [
        {
          name: 'Dimensiones',
          open: false,
          properties: [
            'width', 'height', 'max-width', 'min-height', 'margin', 'padding'
          ]
        },
        {
          name: 'Tipografía',
          open: false,
          properties: [
            'font-family', 'font-size', 'font-weight', 'letter-spacing',
            'color', 'line-height', 'text-align', 'text-decoration',
            'text-shadow'
          ]
        },
        {
          name: 'Decoraciones',
          open: false,
          properties: [
            'background-color', 'background-image', 'border-radius',
            'border', 'box-shadow', 'background'
          ]
        },
        {
          name: 'Extra',
          open: false,
          properties: ['opacity', 'transition', 'perspective', 'transform']
        }
      ]
    },

    // Configuración del panel de capas
    layerManager: {
      appendTo: '.layers-container'
    },

    // Configuración del panel de traits/propiedades
    traitManager: {
      appendTo: '.traits-container'
    },

    // Configuración de la barra de herramientas
    panels: {
      defaults: [
        {
          id: 'basic-actions',
          el: '.panel-basic-actions',
          buttons: [
            {
              id: 'visibility',
              active: true,
              className: 'btn-toggle-borders',
              label: '<i class="fa fa-clone"></i>',
              command: 'sw-visibility'
            }
          ]
        },
        {
          id: 'panel-devices',
          el: '.panel-devices',
          buttons: [
            {
              id: 'device-desktop',
              label: '<i class="fa fa-desktop"></i>',
              command: 'set-device-desktop',
              active: true,
              togglable: false
            },
            {
              id: 'device-tablet',
              label: '<i class="fa fa-tablet"></i>',
              command: 'set-device-tablet',
              togglable: false
            },
            {
              id: 'device-mobile',
              label: '<i class="fa fa-mobile"></i>',
              command: 'set-device-mobile',
              togglable: false
            }
          ]
        }
      ]
    },

    // Configuración de comandos personalizados
    commands: {
      defaults: [
        {
          id: 'set-device-desktop',
          run: (editor) => editor.setDevice('desktop')
        },
        {
          id: 'set-device-tablet', 
          run: (editor) => editor.setDevice('tablet')
        },
        {
          id: 'set-device-mobile',
          run: (editor) => editor.setDevice('mobile')
        }
      ]
    },

    // Configuración de almacenamiento
    storageManager: {
      type: 'remote',
      autosave: false,
      autoload: false
    },

    // Configuración de plugins
    plugins: [],
    pluginsOpts: {}
  };

  // Manejar cambios en el editor
  const handleEditorChange = () => {
    setHasUnsavedChanges(true);
  };

  // Guardar diseño
  const handleSave = async () => {
    if (!editor) return;

    try {
      const html = editor.getHtml();
      const css = editor.getCss();
      
      // Obtener datos del proyecto de forma más eficiente
      const projectData = editor.getProjectData();
      
      const designData = {
        ...design,
        content: {
          html,
          css,
          components: projectData.pages?.[0]?.component || null,
          styles: projectData.styles || [],
          settings: design?.settings || {}
        }
      };

      await onSave(designData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  // Vista previa
  const handlePreview = () => {
    if (!editor) return;
    
    const html = editor.getHtml();
    const css = editor.getCss();
    
    onPreview({ html, css });
  };

  // Deshacer
  const handleUndo = () => {
    if (editor) {
      editor.UndoManager.undo();
    }
  };

  // Rehacer
  const handleRedo = () => {
    if (editor) {
      editor.UndoManager.redo();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Barra de herramientas superior */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold text-gray-900">
            {design?.name || 'Editor de Diseño'}
          </h1>
          {hasUnsavedChanges && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
              Sin guardar
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUndo}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Deshacer"
          >
            <Undo className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleRedo}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Rehacer"
          >
            <Redo className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <button
            onClick={handlePreview}
            className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            <Eye className="w-4 h-4" />
            <span>Vista previa</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {/* Editor GrapesJS */}
      <div className="flex-1">
        <StudioEditor
          ref={editorRef}
          options={editorOptions}
          onEditor={(editor) => {
            setEditor(editor);
            
            // Configurar eventos
            editor.on('component:add component:remove component:update', handleEditorChange);
            editor.on('style:update', handleEditorChange);
            
            // Cargar contenido existente si hay
            if (design?.content?.components) {
              editor.loadProjectData({
                pages: [{
                  name: design.name || 'Diseño',
                  component: design.content.components
                }],
                styles: design.content.css || ''
              });
            }
          }}
        />
      </div>
    </div>
  );
};

export default GrapesJSEditor;