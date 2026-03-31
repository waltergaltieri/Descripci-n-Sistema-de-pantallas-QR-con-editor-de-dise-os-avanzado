import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PolotnoEditor from '../components/PolotnoEditor';

jest.mock('mobx-react-lite', () => ({
  observer: (component) => component
}));

jest.mock('../utils/polotno-image-config', () => ({
  configurePolotnoImageDefaults: jest.fn()
}));

jest.mock('../services/api', () => ({
  designsService: {
    getTemplates: jest.fn(() =>
      Promise.resolve({
        data: [
          {
            id: 'template-1',
            name: 'Plantilla de prueba',
            description: 'Base simple',
            content: {
              width: 1920,
              height: 1080,
              pages: [
                {
                  width: 1920,
                  height: 1080,
                  background: '#ffffff',
                  children: []
                }
              ]
            }
          }
        ]
      })
    )
  }
}));

jest.mock('../store/editorStore', () => ({
  polotnoStore: {
    selectedElements: [],
    selectedElementsIds: [],
    pages: [{ children: [] }],
    activePage: {
      children: [],
      computedWidth: 1920,
      computedHeight: 1080,
      width: 1920,
      height: 1080,
      set: jest.fn()
    },
    history: {
      transaction: (callback) => callback?.()
    },
    on: jest.fn(() => jest.fn()),
    openSidePanel: jest.fn(),
    toJSON: jest.fn(() => ({ pages: [] })),
    deleteElements: jest.fn(),
    selectElements: jest.fn(),
    scale: 0.9
  }
}));

jest.mock('polotno', () => ({
  PolotnoContainer: ({ children, className }) => <div className={className}>{children}</div>,
  SidePanelWrap: ({ children, className }) => <div className={className}>{children}</div>,
  WorkspaceWrap: ({ children, className }) => <div className={className}>{children}</div>
}));

jest.mock('polotno/canvas/workspace', () => ({
  Workspace: () => <div>Workspace</div>
}));

jest.mock('polotno/toolbar/toolbar', () => ({
  Toolbar: () => <div>Toolbar</div>
}));

jest.mock('polotno/toolbar/zoom-buttons', () => ({
  ZoomButtons: () => <div>ZoomButtons</div>
}));

jest.mock('polotno/side-panel', () => {
  const createSection = (name) => ({
    name,
    Panel: () => <div>{name}</div>
  });

  return {
    TextSection: createSection('text'),
    ElementsSection: createSection('elements'),
    PhotosSection: createSection('photos'),
    BackgroundSection: createSection('background'),
    LayersSection: createSection('layers')
  };
});

describe('PolotnoEditor layout de usuario', () => {
  test('muestra un rail estilo Canva con herramientas principales y sin inspector derecho fijo', () => {
    render(<PolotnoEditor />);

    // 6 rail items: Plantillas, Texto, Elementos, Imagenes, Fondo, QR
    expect(screen.getByRole('button', { name: /plantillas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^texto$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /elementos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /imágenes/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /fondo/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /^qr$/i })).toBeInTheDocument();

    // No fixed right panel
    expect(screen.queryByRole('button', { name: /propiedades/i })).not.toBeInTheDocument();
  });

  test('abre el panel inicial de plantillas cuando se monta', () => {
    render(<PolotnoEditor />);

    // Panel header shows "Plantillas"
    expect(screen.getAllByText(/plantillas/i).length).toBeGreaterThan(0);
  });
});
