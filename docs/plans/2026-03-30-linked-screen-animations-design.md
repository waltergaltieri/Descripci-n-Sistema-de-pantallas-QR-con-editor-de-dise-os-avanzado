# Activacion De Animaciones En Pantallas Vinculadas

**Objetivo**

Habilitar de punta a punta las animaciones configuradas en el editor real para que, al guardar y vincular un diseno a una pantalla, esas animaciones se reproduzcan en el HTML publicado de la pantalla.

**Direccion**

La primera entrega se apoyara en el pipeline existente de `custom.animation`, porque ya es el unico formato que llega hasta el renderer HTML de las pantallas vinculadas.

No vamos a activar en esta fase:
- preview en vivo dentro del editor
- migracion al sistema paralelo de `element.animation`
- compatibilidad dual entre ambos formatos

**Arquitectura Elegida**

- El editor real seguira siendo `PolotnoEditor`.
- La UI de animaciones se montara usando `PolotnoAnimationsPanel`.
- La configuracion se guardara en `element.custom.animation`.
- El backend seguira renderizando con `konvaRenderer`.
- La extraccion de animaciones en `animationsEngine` pasara a ser recursiva para cubrir elementos anidados o agrupados.

**Flujo Esperado**

1. El usuario selecciona uno o mas elementos en `PolotnoEditor`.
2. Abre el panel de animaciones y configura tipo, duracion, delay y loop.
3. El editor guarda esa configuracion en `custom.animation`.
4. Al guardar o publicar el diseno, el backend regenera `html_content`.
5. Cuando el diseno se vincula a una pantalla, `design_html` recibe ese HTML.
6. El runtime `konva-animations.js` encuentra los nodos por `elementId` y reproduce la animacion.

**Reglas De Alcance**

- El panel solo expondra animaciones soportadas por `konva-animations.js`.
- La configuracion se aplicara al flujo real del editor de usuario, no al editor paralelo antiguo.
- Si el elemento esta dentro de un grupo, la animacion igual debe publicarse.

**Riesgos Y Mitigaciones**

- Riesgo: coexistencia con el sistema viejo de animaciones.
  Mitigacion: no reutilizar `element.animation`; dejar el flujo nuevo explicitamente basado en `custom.animation`.

- Riesgo: diferencias entre elementos top-level y anidados.
  Mitigacion: hacer recursiva la extraccion del backend y cubrirlo con tests.

- Riesgo: UI del editor sin acceso claro al panel.
  Mitigacion: integrar el panel en la barra lateral real o en el toolbar contextual cuando haya seleccion.

**Validacion**

- Test del editor para confirmar que el panel de animaciones aparece en el editor real.
- Test del panel para confirmar que guarda `custom.animation` sobre los elementos seleccionados.
- Test del backend para confirmar que `extractAnimations` encuentra animaciones anidadas.
- Test del renderer o de rutas para confirmar que el HTML publicado incluye `animationsData` cuando el diseno lo tiene.
