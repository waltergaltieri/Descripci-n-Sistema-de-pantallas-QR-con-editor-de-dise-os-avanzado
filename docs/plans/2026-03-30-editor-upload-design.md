# Restaurar Subida de Imagenes en el Editor Design

**Contexto**

El editor tipo canvas fue migrado desde el `SidePanel` nativo de Polotno a un rail lateral custom. En ese cambio se mantuvieron paneles como `PhotosSection` y `BackgroundSection`, pero se perdio `UploadSection`, que era la entrada para que el usuario suba y reutilice sus propias imagenes.

**Objetivo**

Volver a exponer la carga de imagenes propias en el editor sin desarmar el layout actual ni interferir con los cambios recientes de animaciones.

**Enfoque aprobado**

Se agregara una pestana lateral separada llamada `Subir`, usando `UploadSection.Panel` de Polotno. Esta pestana convivira con `Imagenes`, que seguira mostrando las fotos externas del panel actual.

**Arquitectura**

- Extender el `PanelKey` del editor para incluir `upload`.
- Registrar `UploadSection.Panel` en el router de paneles custom.
- Agregar el item `Subir` al rail izquierdo con iconografia propia.
- Mantener el comportamiento actual del canvas, toolbar contextual, panel de capas y panel de animaciones.

**Flujo esperado**

1. El usuario abre el editor.
2. En el rail izquierdo aparece la nueva opcion `Subir`.
3. Al abrirla, se renderiza el panel nativo de subida de Polotno.
4. El usuario puede cargar una imagen propia y usarla dentro del canvas como antes.

**Riesgos**

- Confundir `Subir` con `Imagenes` si el orden visual no queda claro.
- Romper tests existentes del rail al cambiar la cantidad de items.
- Pisar cambios recientes de `PolotnoEditor.tsx`, que hoy ya tiene modificaciones sin commitear.

**Mitigacion**

- Agregar una prueba especifica para la presencia de `Subir`.
- Mantener el cambio acotado a `PolotnoEditor.tsx` y el test del layout.
- No tocar la logica de animaciones ni la estructura del canvas.
