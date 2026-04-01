# Reorganizacion del Editor de Menus Digitales

**Contexto**

El modal actual de `MenuEditorModal` reparte la atencion entre un formulario ancho en la parte superior, un panel izquierdo para agregar bloques, una columna central con la estructura y una vista previa grande a la derecha. La tarea principal del usuario, que es construir el menu arrastrando y ordenando bloques, queda visualmente al mismo nivel que controles secundarios.

**Objetivo**

Reordenar la UI del editor de menus para que la funcion de arrastrar y soltar sea la protagonista, manteniendo todas las opciones actuales pero con una huella visual mas compacta y mas clara para el usuario.

**Enfoque aprobado**

Se convertira el modal en un constructor de menu:

- Una barra superior compacta resumira los datos generales del menu y podra leerse como configuracion global.
- La columna principal se dedicara a la estructura del menu y al orden de bloques.
- Los botones para crear bloques se moveran a una franja compacta dentro del area principal en lugar de ocupar una columna completa.
- La vista previa seguira visible en desktop, pero con menor protagonismo que la lista de bloques.
- Cada bloque pasara a tener un resumen mas escaneable y un cuerpo expandible para no ocupar tanto espacio cuando no se esta editando.

**Arquitectura**

- Mantener la logica de negocio del modal: `normalizeBlocks`, `handleAddBlock`, `handleBlockChange`, `handleDragEnd`, `handleSubmit`.
- Rehacer solo la capa de presentacion en `client/src/components/Carteleria/Menus/MenuEditorModal.js`.
- Cubrir el nuevo layout con pruebas en `client/src/tests/carteleria-menu-editor.test.js` para asegurar jerarquia visible y accesibilidad basica.

**Flujo esperado**

1. El usuario abre `Crear menu` o `Editar menu`.
2. Ve un resumen compacto del menu arriba, sin que tape la experiencia principal.
3. Entra directo a la zona de construccion, con botones compactos para agregar bloques.
4. Reordena la estructura con el handle de arrastre visible y entiende rapidamente que esa es la accion principal.
5. Expande solo el bloque que necesita configurar.
6. Consulta la vista previa sin perder el foco del armado.

**Riesgos**

- Romper pruebas existentes que esperan el texto `Bloques` o la estructura antigua.
- Hacer demasiado agresivo el cambio y ocultar configuraciones importantes.
- Introducir ruido visual si la expansion por bloque no queda clara.

**Mitigacion**

- Actualizar pruebas del modal para validar la nueva jerarquia: configuracion compacta, constructor protagonista y preview visible.
- Mantener todos los campos actuales accesibles y con labels existentes para no afectar guardado ni accesibilidad.
- Usar expansion por bloque solo en bloques editables y mantener el header fijo siempre visible.
