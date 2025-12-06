# 🧪 Guía de Pruebas - Sistema de Animaciones

## Preparación

### 1. Iniciar el Servidor
```bash
cd server
npm start
```

### 2. Iniciar el Cliente
```bash
cd client
npm start
```

## 🎬 Prueba 1: Aplicar Animación en el Editor

### Pasos:
1. Abre el navegador en `http://localhost:3000`
2. Inicia sesión (si es necesario)
3. Ve a "Diseños" → "Nuevo Diseño" o edita uno existente
4. Agrega un elemento al canvas:
   - Haz clic en "Texto" en el panel izquierdo
   - Escribe algo como "HOLA MUNDO"
   - Ajusta el tamaño y posición

5. **Aplicar animación:**
   - Selecciona el elemento de texto
   - Verás un botón de **video** (🎬) en la toolbar superior
   - Haz clic en el botón
   - Se abrirá el panel de animaciones

6. **Configurar animación:**
   - Categoría: "Continuas (Bucle)"
   - Animación: "Pulso"
   - Duración: 2000ms
   - Retraso: 0ms
   - Haz clic en "Aplicar Animación"

7. **Verificar:**
   - Deberías ver un indicador verde que dice "Animación activa: pulse (2000ms)"
   - Guarda el diseño

### Resultado Esperado:
✅ El panel de animaciones se abre correctamente
✅ Se puede seleccionar y aplicar una animación
✅ El indicador verde muestra la animación activa
✅ El diseño se guarda con la animación

## 🎨 Prueba 2: Múltiples Elementos con Animaciones

### Pasos:
1. En el mismo diseño, agrega más elementos:
   - Un rectángulo (Formas → Rectángulo)
   - Una imagen (si tienes una disponible)

2. Aplica diferentes animaciones:
   - **Texto**: Pulso (2000ms)
   - **Rectángulo**: Rotar (3000ms)
   - **Imagen**: Rebote (1200ms)

3. Guarda el diseño

### Resultado Esperado:
✅ Cada elemento puede tener su propia animación
✅ Las animaciones no interfieren entre sí
✅ Todas se guardan correctamente

## 📺 Prueba 3: Animaciones en HTML Exportado

### Pasos:
1. **Publicar el diseño:**
   - Ve a la lista de diseños
   - Encuentra el diseño con animaciones
   - Haz clic en "Publicar"
   - Espera a que se complete la publicación

2. **Asignar a una pantalla:**
   - Ve a "Pantallas"
   - Crea una nueva pantalla o edita una existente
   - Asigna el diseño con animaciones
   - Guarda la pantalla

3. **Ver en el display:**
   - Abre una nueva pestaña
   - Ve a `http://localhost:5000/screen-display/[ID_DE_PANTALLA]`
   - Reemplaza `[ID_DE_PANTALLA]` con el ID real

### Resultado Esperado:
✅ La página carga correctamente
✅ Todos los elementos se muestran en sus posiciones correctas
✅ Las animaciones se reproducen automáticamente
✅ Las animaciones se repiten en bucle infinito
✅ No hay errores en la consola del navegador

## 🔍 Prueba 4: Verificar en la Consola

### Pasos:
1. En la página del display (`screen-display`), abre la consola del navegador (F12)
2. Busca estos mensajes:

```
🎬 Aplicando X animación(es) con Konva...
✅ Aplicando animación: pulse a elemento element_xxx
✅ Aplicando animación: rotate a elemento element_yyy
```

### Resultado Esperado:
✅ Se muestran mensajes de inicialización de animaciones
✅ Cada animación se aplica correctamente
✅ No hay errores ni warnings

## 🎯 Prueba 5: Presets Rápidos

### Pasos:
1. En el editor, selecciona un elemento
2. Abre el panel de animaciones
3. Haz clic en uno de los presets rápidos:
   - 💓 Pulso
   - 🏀 Rebote
   - 🔄 Rotar
   - 🎪 Balanceo

### Resultado Esperado:
✅ La animación se aplica inmediatamente
✅ Los valores de duración se configuran automáticamente
✅ El preset funciona igual que la configuración manual

## 🗑️ Prueba 6: Eliminar Animación

### Pasos:
1. Selecciona un elemento que tenga una animación
2. Abre el panel de animaciones
3. Verás el indicador verde de "Animación activa"
4. Haz clic en el botón de basura (🗑️)

### Resultado Esperado:
✅ La animación se elimina
✅ El indicador verde desaparece
✅ El elemento vuelve a su estado normal

## 🔄 Prueba 7: Guardar y Recargar

### Pasos:
1. Aplica animaciones a varios elementos
2. Guarda el diseño
3. Cierra el editor
4. Vuelve a abrir el mismo diseño

### Resultado Esperado:
✅ Las animaciones se mantienen después de guardar
✅ Al reabrir, los elementos muestran sus animaciones
✅ Los indicadores verdes aparecen correctamente

## 🚀 Prueba 8: Rendimiento

### Pasos:
1. Crea un diseño con 5-10 elementos
2. Aplica animaciones a todos ellos
3. Publica y visualiza en el display
4. Observa el rendimiento

### Resultado Esperado:
✅ Las animaciones se reproducen suavemente
✅ No hay lag ni stuttering
✅ El CPU/GPU no se sobrecarga
✅ Las animaciones están sincronizadas

## 📋 Checklist de Verificación

Marca cada item después de probarlo:

### Editor
- [ ] Botón de animaciones aparece al seleccionar elemento
- [ ] Panel de animaciones se abre correctamente
- [ ] Se pueden aplicar animaciones de entrada
- [ ] Se pueden aplicar animaciones continuas
- [ ] Los presets rápidos funcionan
- [ ] Se puede eliminar una animación
- [ ] El indicador verde muestra la animación activa
- [ ] Las animaciones se guardan en el diseño

### HTML Exportado
- [ ] El diseño se publica correctamente
- [ ] Las animaciones aparecen en el HTML
- [ ] Las animaciones se reproducen automáticamente
- [ ] Las animaciones están en bucle infinito
- [ ] Múltiples animaciones funcionan simultáneamente
- [ ] No hay errores en la consola
- [ ] El rendimiento es aceptable

### Integración
- [ ] No se rompieron otras funcionalidades del editor
- [ ] Los diseños sin animaciones siguen funcionando
- [ ] La exportación normal (sin animaciones) funciona
- [ ] Las pantallas sin animaciones siguen funcionando

## 🐛 Problemas Comunes y Soluciones

### Problema: El botón de animaciones no aparece
**Solución**: Asegúrate de que hay un elemento seleccionado en el canvas

### Problema: Las animaciones no se ven en el HTML
**Solución**: 
1. Verifica que el servidor esté sirviendo `/konva-animations.js`
2. Abre la consola y busca errores
3. Verifica que el diseño se publicó después de agregar las animaciones

### Problema: Las animaciones no están en bucle
**Solución**: Verifica que seleccionaste animaciones de la categoría "Continuas (Bucle)"

### Problema: Error 404 en konva-animations.js
**Solución**: 
1. Verifica que existe `server/public/konva-animations.js`
2. Verifica que el servidor tiene configurado `express.static` para `/public`
3. Reinicia el servidor

## 📊 Resultados Esperados

Al completar todas las pruebas, deberías tener:

✅ **100% de funcionalidad** - Todas las animaciones funcionan
✅ **0 errores** - No hay errores en consola
✅ **Bucle infinito** - Las animaciones se repiten automáticamente
✅ **Compatibilidad** - Funciona con todos los tipos de elementos
✅ **Persistencia** - Las animaciones se guardan y cargan correctamente
✅ **Rendimiento** - Las animaciones son fluidas y no causan lag

---

**¡Felicidades!** Si todas las pruebas pasan, el sistema de animaciones está funcionando perfectamente. 🎉
