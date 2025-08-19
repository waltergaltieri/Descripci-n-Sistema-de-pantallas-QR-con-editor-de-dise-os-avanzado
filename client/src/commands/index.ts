import type { Command } from '../types/editor';
import { useEditorUIStore, polotnoStore } from '../store/editorStore';
import { generateId } from '../utils/id';

/**
 * Comando base abstracto
 */
abstract class BaseCommand implements Command {
  abstract execute(): void;
  abstract undo(): void;
  abstract redo(): void;
  abstract description: string;
  
  protected getStore() {
    return polotnoStore;
  }
  
  protected getUIStore() {
    return useEditorUIStore.getState();
  }
}

/**
 * Comando para añadir un elemento
 */
class AddElementCommand extends BaseCommand {
  private elementId: string;
  private elementData: any;
  description: string;

  constructor(elementData: any) {
    super();
    this.elementData = elementData;
    this.elementId = elementData.id || generateId();
    this.description = `Agregar elemento ${elementData.type}`;
  }

  execute(): void {
    const store = this.getStore();
    const element = store.activePage.addElement({
      ...this.elementData,
      id: this.elementId
    });
    this.elementId = element.id;
  }

  undo(): void {
    const store = this.getStore();
    const element = store.getElementById(this.elementId);
    if (element) {
      store.activePage.children.remove(element);
    }
  }

  redo(): void {
    this.execute();
  }

  getElementId(): string {
    return this.elementId;
  }
}

/**
 * Comando para eliminar un elemento
 */
class DeleteElementCommand extends BaseCommand {
  private elementId: string;
  private elementData: any;
  private parentId?: string;
  private index: number = 0;
  description: string;

  constructor(elementId: string) {
    super();
    this.elementId = elementId;
    
    const store = this.getStore();
    const element = store.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento ${elementId} no encontrado`);
    }
    
    // Guardar datos del elemento para poder restaurarlo
    this.elementData = element.toJSON();
    this.parentId = element.parent?.id;
    
    // Guardar posición en la página
    if (element.parent) {
      this.index = element.parent.children.indexOf(element);
    } else {
      this.index = store.activePage.children.indexOf(element);
    }
    
    this.description = `Eliminar elemento ${element.type}`;
  }

  execute(): void {
    const store = this.getStore();
    const element = store.getElementById(this.elementId);
    if (element && store.activePage) {
      store.activePage.children.remove(element);
    }
  }

  undo(): void {
    const store = this.getStore();
    
    // Restaurar elemento
    const element = store.activePage.addElement(this.elementData);
    
    // Restaurar posición si tenía un padre
    if (this.parentId) {
      const parent = store.getElementById(this.parentId);
      if (parent && element) {
        // Mover elemento al padre
        element.set({ parent: parent });
      }
    }
  }

  redo(): void {
    this.execute();
  }
}

/**
 * Comando para transformar elementos
 */
class TransformElementsCommand extends BaseCommand {
  private elementIds: string[];
  private oldTransforms: Record<string, any>;
  private newTransforms: Record<string, any>;
  description: string;

  constructor(elementIds: string[], newTransforms: Record<string, any>) {
    super();
    this.elementIds = elementIds;
    this.oldTransforms = {};
    this.newTransforms = newTransforms;
    
    const store = this.getStore();
    
    elementIds.forEach(id => {
      const element = store.getElementById(id);
      if (element) {
        this.oldTransforms[id] = {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          rotation: element.rotation
        };
      }
    });
    
    this.description = `Transformar ${elementIds.length} elemento(s)`;
  }

  execute(): void {
    const store = this.getStore();
    this.elementIds.forEach(id => {
      const element = store.getElementById(id);
      if (element && this.newTransforms[id]) {
        element.set(this.newTransforms[id]);
      }
    });
  }

  undo(): void {
    const store = this.getStore();
    this.elementIds.forEach(id => {
      const element = store.getElementById(id);
      if (element && this.oldTransforms[id]) {
        element.set(this.oldTransforms[id]);
      }
    });
  }

  redo(): void {
    this.execute();
  }
}

/**
 * Comando para actualizar propiedades de un elemento
 */
class UpdateElementCommand extends BaseCommand {
  private elementId: string;
  private oldProperties: any;
  private newProperties: any;
  description: string;

  constructor(elementId: string, newProperties: any) {
    super();
    this.elementId = elementId;
    this.newProperties = newProperties;
    
    const store = this.getStore();
    const element = store.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento ${elementId} no encontrado`);
    }
    
    // Guardar propiedades anteriores
    this.oldProperties = {};
    Object.keys(newProperties).forEach(key => {
      this.oldProperties[key] = (element as any)[key];
    });
    
    this.description = `Actualizar elemento ${element.type}`;
  }

  execute(): void {
    const store = this.getStore();
    const element = store.getElementById(this.elementId);
    if (element) {
      element.set(this.newProperties);
    }
  }

  undo(): void {
    const store = this.getStore();
    const element = store.getElementById(this.elementId);
    if (element) {
      element.set(this.oldProperties);
    }
  }

  redo(): void {
    this.execute();
  }
}

/**
 * Comando para agrupar elementos
 */
class GroupElementsCommand extends BaseCommand {
  private elementIds: string[];
  private groupId: string;
  private oldParents: Record<string, string | undefined>;
  private oldPositions: Record<string, number>;
  description: string;

  constructor(elementIds: string[]) {
    super();
    this.elementIds = elementIds;
    this.groupId = generateId();
    this.oldParents = {};
    this.oldPositions = {};
    
    const store = this.getStore();
    
    // Guardar estado anterior - simplificado para compatibilidad
    elementIds.forEach(id => {
      const element = store.getElementById(id);
      if (element) {
        this.oldParents[id] = undefined; // Simplificado
        this.oldPositions[id] = 0; // Simplificado
      }
    });
    
    this.description = `Agrupar ${elementIds.length} elemento(s)`;
  }

  execute(): void {
    // Mock implementation - Polotno handles grouping internally
    console.log('Group elements:', this.elementIds);
  }

  undo(): void {
    // Mock implementation - Polotno handles ungrouping internally
    console.log('Ungroup elements:', this.groupId);
  }

  redo(): void {
    this.execute();
  }

  getGroupId(): string {
    return this.groupId;
  }
}

/**
 * Comando para desagrupar elementos
 */
class UngroupElementsCommand extends BaseCommand {
  private groupId: string;
  private groupData: any;
  private childrenData: any[] = [];
  description: string;

  constructor(groupId: string) {
    super();
    this.groupId = groupId;
    this.description = `Desagrupar elemento ${groupId}`;
  }

  execute(): void {
    // Mock implementation - Polotno handles ungrouping internally
    console.log('Ungroup element:', this.groupId);
  }

  undo(): void {
    // Mock implementation - Polotno handles grouping internally
    console.log('Undo ungroup element:', this.groupId);
  }

  redo(): void {
    this.execute();
  }
}





/**
 * Comando para duplicar un elemento
 */
class DuplicateElementCommand extends BaseCommand {
  private sourceId: string;
  private newElementId: string;
  private newElementData?: any;
  description: string;

  constructor(sourceId: string, newElementId?: string) {
    super();
    this.sourceId = sourceId;
    this.newElementId = newElementId || generateId();
    this.description = `Duplicar elemento ${sourceId}`;
  }

  execute(): void {
    // Mock implementation - Polotno handles duplication internally
    console.log('Duplicate element:', this.sourceId, 'to', this.newElementId);
  }

  undo(): void {
    // Mock implementation - Polotno handles element removal internally
    console.log('Undo duplicate element:', this.newElementId);
  }

  redo(): void {
    this.execute();
  }

  getNewElementId(): string {
    return this.newElementId;
  }
}

/**
 * Comando compuesto que ejecuta múltiples comandos como una unidad
 */
class CompositeCommand extends BaseCommand {
  private commands: BaseCommand[];
  description: string;

  constructor(commands: BaseCommand[], description?: string) {
    super();
    this.commands = commands;
    this.description = description || `Comando compuesto (${commands.length} operaciones)`;
  }

  execute(): void {
    this.commands.forEach(command => command.execute());
  }

  undo(): void {
    // Deshacer en orden inverso
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  redo(): void {
    this.execute();
  }

  getCommands(): BaseCommand[] {
    return [...this.commands];
  }

  addCommand(command: BaseCommand): void {
    this.commands.push(command);
    this.description = `Comando compuesto (${this.commands.length} operaciones)`;
  }
}



// Exportar todos los comandos
export {
  BaseCommand,
  AddElementCommand,
  DeleteElementCommand,
  TransformElementsCommand,
  UpdateElementCommand,
  GroupElementsCommand,
  UngroupElementsCommand,
  DuplicateElementCommand,
  CompositeCommand
};