import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { PropertiesPanel } from './PropertiesPanel';
import { BackgroundPanel } from './BackgroundPanel';
import { AnimationsPanel } from './AnimationsPanel';
import './RightPanel.css';

type TabType = 'properties' | 'background' | 'animations';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  {
    id: 'properties',
    label: 'Propiedades',
    icon: '⚙️'
  },
  {
    id: 'background',
    label: 'Fondo',
    icon: '🎨'
  },
  {
    id: 'animations',
    label: 'Animaciones',
    icon: '🎬'
  }
];

export const RightPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('properties');  
  
  // Mock selection data for now
  const selection = { selectedIds: [] };
  const hasSelection = selection.selectedIds.length > 0;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'properties':
        return <PropertiesPanel />;
      case 'background':
        return <BackgroundPanel />;
      case 'animations':
        return <AnimationsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="right-panel">
      {/* Tabs */}
      <div className="panel-tabs">
        {TABS.map((tab) => {
          const isDisabled = tab.id === 'animations' && !hasSelection;
          
          return (
            <button
              key={tab.id}
              className={`tab-button ${
                activeTab === tab.id ? 'active' : ''
              } ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              title={isDisabled ? 'Selecciona un elemento para ver las animaciones' : tab.label}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Tab content */}
      <div className="panel-content">
        {renderTabContent()}
      </div>
    </div>
  );
};