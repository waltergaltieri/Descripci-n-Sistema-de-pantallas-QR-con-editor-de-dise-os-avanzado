import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { UpdateElementCommand, TransformElementsCommand } from '../../commands';
import type { CanvasElement, TextElement, ImageElement, ShapeElement, QRElement, ContainerElement } from '../../types/editor';
import './PropertiesPanel.css';

interface PropertyGroupProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const PropertyGroup: React.FC<PropertyGroupProps> = ({ 
  title, 
  children, 
  collapsible = false, 
  defaultExpanded = true 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className="property-group">
      <div 
        className={`property-group-header ${collapsible ? 'collapsible' : ''}`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <h4>{title}</h4>
        {collapsible && (
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
        )}
      </div>
      {isExpanded && (
        <div className="property-group-content">
          {children}
        </div>
      )}
    </div>
  );
};

interface PropertyFieldProps {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const PropertyField: React.FC<PropertyFieldProps> = ({ label, children, fullWidth = false }) => {
  return (
    <div className={`property-field ${fullWidth ? 'full-width' : ''}`}>
      <label className="property-label">{label}</label>
      <div className="property-input">
        {children}
      </div>
    </div>
  );
};

export const PropertiesPanel: React.FC = () => {
  // Mock data for now - in real implementation this would come from Polotno store
  const selection = { selectedIds: [] as string[] };
  const composition = { elements: {} as { [key: string]: any } };
  const executeCommand = (command: any) => console.log('Execute command:', command);

  const selectedElements = selection.selectedIds
    .map((id: string) => composition.elements[id])
    .filter(Boolean);

  if (selectedElements.length === 0) {
    return (
      <div className="properties-panel">
        <div className="empty-state">
          <p>Selecciona un elemento para ver sus propiedades.</p>
        </div>
      </div>
    );
  }

  const element = selectedElements[0]; // Por simplicidad, solo el primer elemento
  const isMultiSelection = selectedElements.length > 1;

  const updateElement = (updates: Partial<CanvasElement>) => {
    executeCommand(new UpdateElementCommand(element.id, updates));
  };

  const updateTransform = (updates: Partial<typeof element.transform>) => {
    const newTransform = { ...element.transform, ...updates };
    executeCommand(new TransformElementsCommand([element.id], { [element.id]: updates }));
  };

  const renderCommonProperties = () => (
    <PropertyGroup title="General">
      <PropertyField label="Nombre" fullWidth>
        <input
          type="text"
          value={element.name}
          onChange={(e) => updateElement({ name: e.target.value })}
          className="text-input"
        />
      </PropertyField>
      
      <div className="property-row">
        <PropertyField label="X">
          <input
            type="number"
            value={Math.round(element.transform.x)}
            onChange={(e) => updateTransform({ x: parseFloat(e.target.value) || 0 })}
            className="number-input"
          />
        </PropertyField>
        
        <PropertyField label="Y">
          <input
            type="number"
            value={Math.round(element.transform.y)}
            onChange={(e) => updateTransform({ y: parseFloat(e.target.value) || 0 })}
            className="number-input"
          />
        </PropertyField>
      </div>
      
      <div className="property-row">
        <PropertyField label="Ancho">
          <input
            type="number"
            value={Math.round(element.transform.width)}
            onChange={(e) => updateTransform({ width: Math.max(1, parseFloat(e.target.value) || 1) })}
            className="number-input"
            min="1"
          />
        </PropertyField>
        
        <PropertyField label="Alto">
          <input
            type="number"
            value={Math.round(element.transform.height)}
            onChange={(e) => updateTransform({ height: Math.max(1, parseFloat(e.target.value) || 1) })}
            className="number-input"
            min="1"
          />
        </PropertyField>
      </div>
      
      <PropertyField label="Rotación">
        <input
          type="number"
          value={Math.round(element.transform.rotation)}
          onChange={(e) => updateTransform({ rotation: parseFloat(e.target.value) || 0 })}
          className="number-input"
          step="1"
        />
      </PropertyField>
      
      <PropertyField label="Opacidad">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={element.opacity}
          onChange={(e) => updateElement({ opacity: parseFloat(e.target.value) })}
          className="range-input"
        />
        <span className="range-value">{Math.round(element.opacity * 100)}%</span>
      </PropertyField>
      
      <div className="property-row">
        <PropertyField label="Z-Index">
          <input
            type="number"
            value={element.zIndex}
            onChange={(e) => updateElement({ zIndex: parseInt(e.target.value) || 0 })}
            className="number-input"
          />
        </PropertyField>
      </div>
      
      <div className="property-row">
        <PropertyField label="Visible">
          <input
            type="checkbox"
            checked={element.visible}
            onChange={(e) => updateElement({ visible: e.target.checked })}
            className="checkbox-input"
          />
        </PropertyField>
        
        <PropertyField label="Bloqueado">
          <input
            type="checkbox"
            checked={element.locked}
            onChange={(e) => updateElement({ locked: e.target.checked })}
            className="checkbox-input"
          />
        </PropertyField>
      </div>
    </PropertyGroup>
  );

  const renderTextProperties = (textElement: TextElement) => (
    <PropertyGroup title="Texto">
      <PropertyField label="Contenido" fullWidth>
        <textarea
          value={textElement.content}
          onChange={(e) => updateElement({ content: e.target.value })}
          className="textarea-input"
          rows={3}
        />
      </PropertyField>
      
      <PropertyField label="Fuente" fullWidth>
        <select
          value={textElement.fontFamily}
          onChange={(e) => updateElement({ fontFamily: e.target.value })}
          className="select-input"
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </select>
      </PropertyField>
      
      <div className="property-row">
        <PropertyField label="Tamaño">
          <input
            type="number"
            value={textElement.fontSize}
            onChange={(e) => updateElement({ fontSize: Math.max(8, parseInt(e.target.value) || 8) })}
            className="number-input"
            min="8"
          />
        </PropertyField>
        
        <PropertyField label="Interlineado">
          <input
            type="number"
            value={textElement.lineHeight}
            onChange={(e) => updateElement({ lineHeight: Math.max(0.5, parseFloat(e.target.value) || 1) })}
            className="number-input"
            min="0.5"
            step="0.1"
          />
        </PropertyField>
      </div>
      
      <PropertyField label="Color">
        <input
          type="color"
          value={textElement.color}
          onChange={(e) => updateElement({ color: e.target.value })}
          className="color-input"
        />
      </PropertyField>
      
      <PropertyField label="Alineación">
        <select
          value={textElement.textAlign}
          onChange={(e) => updateElement({ textAlign: e.target.value as any })}
          className="select-input"
        >
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
        </select>
      </PropertyField>
      
      <div className="property-row">
        <PropertyField label="Negrita">
          <input
            type="checkbox"
            checked={textElement.fontWeight === 'bold'}
            onChange={(e) => updateElement({ fontWeight: e.target.checked ? 'bold' : 'normal' })}
            className="checkbox-input"
          />
        </PropertyField>
        
        <PropertyField label="Cursiva">
          <input
            type="checkbox"
            checked={textElement.fontStyle === 'italic'}
            onChange={(e) => updateElement({ fontStyle: e.target.checked ? 'italic' : 'normal' })}
            className="checkbox-input"
          />
        </PropertyField>
      </div>
    </PropertyGroup>
  );

  const renderImageProperties = (imageElement: ImageElement) => (
    <PropertyGroup title="Imagen">
      <PropertyField label="URL" fullWidth>
        <input
          type="url"
          value={imageElement.src}
          onChange={(e) => updateElement({ src: e.target.value })}
          className="text-input"
          placeholder="https://ejemplo.com/imagen.jpg"
        />
      </PropertyField>
      
      <PropertyField label="Ajuste">
        <select
          value={imageElement.fit}
          onChange={(e) => updateElement({ fit: e.target.value as any })}
          className="select-input"
        >
          <option value="cover">Cubrir</option>
          <option value="contain">Contener</option>
          <option value="fill">Rellenar</option>
        </select>
      </PropertyField>
      
      <PropertyField label="Radio de borde">
        <input
          type="number"
          value={imageElement.borderRadius || 0}
          onChange={(e) => updateElement({ borderRadius: Math.max(0, parseInt(e.target.value) || 0) })}
          className="number-input"
          min="0"
        />
      </PropertyField>
    </PropertyGroup>
  );

  const renderShapeProperties = (shapeElement: ShapeElement) => (
    <PropertyGroup title="Forma">
      <PropertyField label="Tipo">
        <select
          value={shapeElement.shapeType}
          onChange={(e) => updateElement({ shapeType: e.target.value as any })}
          className="select-input"
        >
          <option value="rectangle">Rectángulo</option>
          <option value="circle">Círculo</option>
          <option value="line">Línea</option>
        </select>
      </PropertyField>
      
      <PropertyField label="Color de relleno">
        <input
          type="color"
          value={shapeElement.fill}
          onChange={(e) => updateElement({ fill: e.target.value })}
          className="color-input"
        />
      </PropertyField>
      
      <PropertyField label="Color de borde">
        <input
          type="color"
          value={shapeElement.stroke || '#000000'}
          onChange={(e) => updateElement({ stroke: e.target.value })}
          className="color-input"
        />
      </PropertyField>
      
      <PropertyField label="Grosor de borde">
        <input
          type="number"
          value={shapeElement.strokeWidth || 0}
          onChange={(e) => updateElement({ strokeWidth: Math.max(0, parseInt(e.target.value) || 0) })}
          className="number-input"
          min="0"
        />
      </PropertyField>
      
      {shapeElement.shapeType === 'rectangle' && (
        <PropertyField label="Radio de esquinas">
          <input
            type="number"
            value={shapeElement.cornerRadius || 0}
            onChange={(e) => updateElement({ cornerRadius: Math.max(0, parseInt(e.target.value) || 0) })}
            className="number-input"
            min="0"
          />
        </PropertyField>
      )}
    </PropertyGroup>
  );

  const renderQRProperties = (qrElement: QRElement) => (
    <PropertyGroup title="Código QR">
      <PropertyField label="Datos" fullWidth>
        <textarea
          value={qrElement.data}
          onChange={(e) => updateElement({ data: e.target.value })}
          className="textarea-input"
          rows={3}
          placeholder="Texto o URL para el código QR"
        />
      </PropertyField>
      
      <PropertyField label="Nivel de corrección">
        <select
          value={qrElement.errorCorrectionLevel}
          onChange={(e) => updateElement({ errorCorrectionLevel: e.target.value as any })}
          className="select-input"
        >
          <option value="L">Bajo (7%)</option>
          <option value="M">Medio (15%)</option>
          <option value="Q">Alto (25%)</option>
          <option value="H">Muy alto (30%)</option>
        </select>
      </PropertyField>
      
      <PropertyField label="Margen">
        <input
          type="number"
          value={qrElement.margin}
          onChange={(e) => updateElement({ margin: Math.max(0, parseInt(e.target.value) || 0) })}
          className="number-input"
          min="0"
        />
      </PropertyField>
      
      <div className="property-row">
        <PropertyField label="Color">
          <input
            type="color"
            value={qrElement.foregroundColor}
            onChange={(e) => updateElement({ foregroundColor: e.target.value })}
            className="color-input"
          />
        </PropertyField>
        
        <PropertyField label="Fondo">
          <input
            type="color"
            value={qrElement.backgroundColor}
            onChange={(e) => updateElement({ backgroundColor: e.target.value })}
            className="color-input"
          />
        </PropertyField>
      </div>
    </PropertyGroup>
  );

  const renderContainerProperties = (containerElement: ContainerElement) => (
    <PropertyGroup title="Contenedor">
      <PropertyField label="Color de fondo">
        <input
          type="color"
          value={containerElement.backgroundColor}
          onChange={(e) => updateElement({ backgroundColor: e.target.value })}
          className="color-input"
        />
      </PropertyField>
      
      <PropertyField label="Color de borde">
        <input
          type="color"
          value={containerElement.borderColor || '#000000'}
          onChange={(e) => updateElement({ borderColor: e.target.value })}
          className="color-input"
        />
      </PropertyField>
      
      <PropertyField label="Grosor de borde">
        <input
          type="number"
          value={containerElement.borderWidth || 0}
          onChange={(e) => updateElement({ borderWidth: Math.max(0, parseInt(e.target.value) || 0) })}
          className="number-input"
          min="0"
        />
      </PropertyField>
      
      <PropertyField label="Radio de borde">
        <input
          type="number"
          value={containerElement.borderRadius || 0}
          onChange={(e) => updateElement({ borderRadius: Math.max(0, parseInt(e.target.value) || 0) })}
          className="number-input"
          min="0"
        />
      </PropertyField>
      
      <PropertyField label="Padding">
        <input
          type="number"
          value={containerElement.padding || 0}
          onChange={(e) => updateElement({ padding: Math.max(0, parseInt(e.target.value) || 0) })}
          className="number-input"
          min="0"
        />
      </PropertyField>
    </PropertyGroup>
  );

  const renderSpecificProperties = () => {
    switch (element.type) {
      case 'text':
        return renderTextProperties(element as TextElement);
      case 'image':
        return renderImageProperties(element as ImageElement);
      case 'shape':
        return renderShapeProperties(element as ShapeElement);
      case 'qr':
        return renderQRProperties(element as QRElement);
      case 'container':
        return renderContainerProperties(element as ContainerElement);
      default:
        return null;
    }
  };

  return (
    <div className="properties-panel">
      {isMultiSelection && (
        <div className="multi-selection-notice">
          <p>📋 {selectedElements.length} elementos seleccionados</p>
          <p>Mostrando propiedades del primer elemento</p>
        </div>
      )}
      
      {renderCommonProperties()}
      {renderSpecificProperties()}
    </div>
  );
};