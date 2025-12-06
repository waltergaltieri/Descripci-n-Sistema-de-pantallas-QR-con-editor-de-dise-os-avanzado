# 🧪 Test de Animaciones - Paso a Paso

## ⚠️ IMPORTANTE: Dónde se ven las animaciones

**❌ NO se ven en el editor del canvas** - Esto es NORMAL
**✅ SÍ se ven en el HTML exportado** - Cuando publicas y asignas a pantalla

---

## 📋 Prueba Paso a Paso

### Paso 1: Verificar que el sistema está corriendo

Abre la consola y verifica:
```bash
# Deberías ver estos procesos corriendo:
- Servidor en puerto 5000
- Cliente en puerto 3000
```

### Paso 2: Crear un diseño simple

1. Abre `http://localhost:3000`
2. Ve a **Diseños** → **Nuevo Diseño**
3. Agrega UN SOLO elemento de texto:
   - Haz clic en "Texto" en el panel izquierdo
   - Escribe: **"PRUEBA"**
   - Hazlo grande (tamaño 60-80px)
   - Ponlo en el centro del canvas

### Paso 3: Configurar UNA animación

1. **Selecciona el texto "PRUEBA"**
2. **Haz clic en el botón 🎬** (video) en la toolbar superior
3. En el panel que se abre:
   - Categoría: **"Continuas (Bucle)"**
   - Animación: **"Pulso"**
   - Duración: **2000ms**
   - Haz clic en **"Aplicar Animación"**

4. **Verifica que aparece el indicador verde:**
   ```
   Animación activa: pulse (2000ms)
   ```

5. **Abre la consola del navegador (F12)** y busca:
   ```
   ✅ Animación pulse configurada para 1 elemento(s)
   💡 La animación se verá cuando publiques el diseño...
   ```

### Paso 4: Guardar el diseño

1. Haz clic en **"Guardar"** (o Ctrl+S)
2. Nombre: **"Test Animacion Simple"**
3. Guarda

### Paso 5: Verificar que se guardó la animación

Abre la consola del navegador y ejecuta:
```javascript
// Ver el diseño guardado
const design = window.polotnoStore.toJSON();
console.log('Diseño:', design);

// Ver el primer elemento
const element = design.pages[0].children[0];
console.log('Elemento:', element);

// Ver la animación
console.log('Animación:', element.custom?.animation);
```

**Deberías ver:**
```javascript
{
  type: "pulse",
  duration: 2000,
  delay: 0,
  loop: true
}
```

Si NO ves esto, la animación no se guardó correctamente.

### Paso 6: Publicar el diseño

1. Ve a la lista de diseños
2. Encuentra **"Test Animacion Simple"**
3. Haz clic en **"Publicar"**
4. Espera el mensaje: **"Diseño publicado correctamente"**

### Paso 7: Crear/Editar una pantalla

1. Ve a **Pantallas**
2. Si no tienes una, créala:
   - Nombre: **"Pantalla Test"**
   - Ancho: **1920**
   - Alto: **1080**
   - Orientación: **Horizontal**
   - Guarda

3. Si ya tienes una, edítala:
   - Asigna el diseño **"Test Animacion Simple"**
   - Guarda

### Paso 8: Abrir la pantalla

1. Anota el **ID de la pantalla** (aparece en la lista)
2. Abre una **nueva pestaña** del navegador
3. Ve a: `http://localhost:5000/screen-display/[ID]`
   - Ejemplo: `http://localhost:5000/screen-display/1`

### Paso 9: Verificar en la consola

**Abre la consola del navegador (F12)** en la pestaña de la pantalla.

**Deberías ver:**
```
🎬 Aplicando 1 animación(es) con Konva...
✅ Aplicando animación: pulse a elemento element_xxx
```

**Si NO ves estos mensajes:**

1. Verifica que `/konva-animations.js` se carga:
   - Abre `http://localhost:5000/konva-animations.js`
   - Debe mostrar código JavaScript

2. Verifica errores en la consola:
   - Busca mensajes en rojo
   - Comparte qué errores ves

### Paso 10: Observar la animación

**Deberías ver:**
- ✅ El texto "PRUEBA" pulsando (crece y se encoge)
- ✅ En bucle infinito
- ✅ Sin parar

**Si NO ves la animación:**

Ejecuta en la consola:
```javascript
// Ver si hay animaciones en el HTML
console.log('Animaciones en página:', window.animationsData || 'No definido');

// Ver el stage de Konva
const canvas = document.querySelector('.konvajs-content canvas');
console.log('Canvas:', canvas);
console.log('Stage:', canvas?._konva);

// Ver nodos
if (canvas?._konva) {
  const stage = canvas._konva;
  const allNodes = stage.find('*');
  console.log('Total nodos:', allNodes.length);
  console.log('Nodos con elementId:', allNodes.filter(n => n.getAttr('elementId')));
}
```

---

## 🐛 Diagnóstico de Problemas

### Problema 1: No aparece el botón 🎬

**Causa:** El elemento no está seleccionado
**Solución:** Haz clic en el elemento para seleccionarlo

### Problema 2: El indicador verde no aparece

**Causa:** La animación no se guardó
**Solución:** Verifica en consola si hay errores al aplicar

### Problema 3: No se ve en la pantalla

**Posibles causas:**
1. El diseño no se publicó después de agregar la animación
2. La pantalla tiene un diseño antiguo asignado
3. El archivo `konva-animations.js` no se carga
4. Hay un error en la consola

**Solución:**
1. Publica el diseño nuevamente
2. Reasigna el diseño a la pantalla
3. Verifica `http://localhost:5000/konva-animations.js`
4. Revisa la consola por errores

### Problema 4: Se ve en consola pero no se anima

**Causa:** El nodo no se encuentra o el ID no coincide
**Solución:** Ejecuta el diagnóstico del Paso 10

---

## 📊 Checklist de Verificación

- [ ] Sistema corriendo (servidor + cliente)
- [ ] Diseño creado con 1 elemento de texto
- [ ] Animación "Pulso" aplicada
- [ ] Indicador verde visible
- [ ] Animación en `element.custom.animation` (verificado en consola)
- [ ] Diseño guardado
- [ ] Diseño publicado
- [ ] Pantalla creada/editada
- [ ] Diseño asignado a pantalla
- [ ] URL de pantalla abierta
- [ ] Mensajes de consola visibles
- [ ] Animación funcionando en pantalla

---

## 💡 Resultado Esperado

Si completaste todos los pasos:

**En el Editor:**
- ❌ NO verás la animación (correcto)
- ✅ Verás el indicador verde

**En la Pantalla:**
- ✅ Verás el texto pulsando
- ✅ En bucle infinito
- ✅ Mensajes en consola

---

**Por favor, sigue estos pasos exactamente y comparte:**
1. ¿En qué paso te quedaste?
2. ¿Qué mensajes ves en la consola?
3. ¿Hay algún error?
