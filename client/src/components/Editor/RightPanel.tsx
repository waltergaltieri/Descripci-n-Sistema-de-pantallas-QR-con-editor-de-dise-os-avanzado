import React from 'react';
import { observer } from 'mobx-react-lite';
import { useEditorUIStore } from '../../store/editorStore';
import General from './RightPanel/General';
import Background from './RightPanel/Background';
import Animations from './RightPanel/Animations';
import { Settings, Palette, Play } from 'lucide-react';

const RightPanel: React.FC = observer(() => {
  const { rightPanelTab, setRightPanelTab } = useEditorUIStore();
  
  const tabs = [
    {
      id: 'general' as const,
      name: 'General',
      icon: Settings,
      component: General
    },
    {
      id: 'background' as const,
      name: 'Fondo',
      icon: Palette,
      component: Background
    },
    {
      id: 'animations' as const,
      name: 'Animaciones',
      icon: Play,
      component: Animations
    }
  ];
  
  const activeTab = tabs.find(tab => tab.id === rightPanelTab);
  const ActiveComponent = activeTab?.component;
  
  return (
    <div className="flex flex-col h-full">
      {/* Pestañas */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setRightPanelTab(tab.id)}
              className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium transition-colors ${
                rightPanelTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <IconComponent size={16} className="mr-2" />
              {tab.name}
            </button>
          );
        })}
      </div>
      
      {/* Contenido */}
      <div className="flex-1 overflow-hidden">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
});

export default RightPanel;