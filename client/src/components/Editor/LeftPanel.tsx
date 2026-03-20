import React from 'react';
import { observer } from 'mobx-react-lite';
import { useEditorUIStore } from '../../store/editorStore';
import Palette from './LeftPanel/Palette';
import Layers from './LeftPanel/Layers';

const LeftPanel: React.FC = observer(() => {
  const { leftPanelTab, setLeftPanelTab } = useEditorUIStore();
  
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Pestañas */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setLeftPanelTab('palette')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            leftPanelTab === 'palette'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          Paleta
        </button>
        <button
          onClick={() => setLeftPanelTab('layers')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            leftPanelTab === 'layers'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          Capas
        </button>
      </div>
      
      {/* Contenido */}
      <div className="flex-1 overflow-hidden">
        {leftPanelTab === 'palette' && <Palette />}
        {leftPanelTab === 'layers' && <Layers />}
      </div>
    </div>
  );
});

export default LeftPanel;