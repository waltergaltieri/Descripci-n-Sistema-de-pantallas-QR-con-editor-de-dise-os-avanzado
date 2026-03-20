# Estilos Visuales Para Bloques De Promociones Y Combos

**Objetivo**

Agregar estilos visuales prearmados y seleccionables dentro del creador de menus para los bloques de `Promociones` y `Combos`, de forma que el usuario pueda destacar ofertas, urgencia, ahorro y vencimiento sin diseñar manualmente cada pieza.

**Direccion**

La solucion sera mixta:
- cada bloque tendra un selector de `Estilo visual`
- existira una opcion `auto` recomendada por el sistema
- el usuario podra cambiarla por variantes prearmadas mas comerciales

**Bloques Alcanzados**

- `promotion`
- `combo`

**Catalogo Inicial**

Promociones:
- `auto`
- `ribbon-alert`
- `seal-offer`
- `countdown-hero`
- `urgency-banner`
- `price-focus`

Combos:
- `auto`
- `combo-featured`
- `savings-badge`
- `combo-countdown`
- `combo-premium`
- `combo-compact`

**Reglas Inteligentes De Auto**

Promociones:
- con `has_countdown`: prioriza `countdown-hero`
- tipo `two_for_one`: prioriza `seal-offer`
- promos con `%`: prioriza `price-focus`
- promos con vencimiento pero sin countdown: prioriza `urgency-banner`
- resto: `ribbon-alert`

Combos:
- con `has_countdown`: prioriza `combo-countdown`
- con promociones aplicadas: prioriza `savings-badge`
- resto: `combo-featured`

**Principios Visuales**

- Mantener la estetica del tema activo del menu
- Sumar protagonismo comercial sin romper el sistema visual
- Priorizar lectura mobile
- Hacer visibles de inmediato:
  - tipo de promo
  - urgencia
  - ahorro
  - vencimiento

**Datos**

El estilo elegido se guardara dentro de `block.config.display_style`.

**Render**

- El editor mostrara una galeria de estilos por bloque
- La preview del editor reflejara el estilo elegido
- El menu publico usara la misma seleccion

**Validacion**

- tests del editor para guardar `display_style`
- tests de preview para verificar estilos visibles
- tests de menu publico para verificar badges y countdown destacados
