# Carteleria Y Menus QR Design

**Fecha:** 2026-03-19

**Estado:** Aprobado para plan de implementacion

## Objetivo

Agregar al sistema actual un segundo modulo llamado `Carteleria`, orientado a locales y bares que necesitan gestionar productos, promociones, combos, menus web y links/QR persistentes, todo dentro del mismo producto y con la misma estetica visual que el modulo actual de `Pantallas`.

## Principios Del Diseno

- Misma app, mismo login, mismo shell visual.
- Dominios separados: `Pantallas` no se mezcla con `Carteleria`.
- Reutilizar componentes visuales existentes siempre que sea posible.
- Crear un editor propio para menus, porque el problema es data-driven y no un lienzo grafico.
- Mantener URLs y QR persistentes e inmutables.
- Hacer el modulo usable hoy para una sola instalacion por negocio, pero con un modelo de datos que pueda evolucionar a SaaS.
- Permitir que una futura capa de pedidos/pago se agregue sobre el menu sin romper links recurrentes.

## Enfoque Arquitectonico Elegido

Se usara un `modulo nuevo dentro de la app actual con shell compartido`.

### Por que no una app separada

- Duplicaria auth, layout, navegacion, toasts, uploader y patrones visuales.
- Agregaria friccion innecesaria para una primera version que debe convivir con el producto actual.

### Por que no reutilizar el editor de pantallas

- El menu necesita bloques semanticos vivos: productos, categorias, promociones, combos y separadores.
- El contenido del menu debe reaccionar a cambios del catalogo y de la programacion sin guardar copias estaticas.
- El editor de pantallas actual esta optimizado para componer piezas visuales, no para construir vistas web vivas de catalogo.

## Navegacion Del Producto

La app mantendra el mismo `Layout`, `Header` y `Sidebar`, pero incorporara un selector superior o de cabecera para cambiar entre:

- `Pantallas`
- `Carteleria`

### Navegacion Del Modulo Carteleria

- Dashboard
- Productos
- Promociones
- Menus
- Links / QR

Las pantallas de alta y edicion no viven como items del sidebar. Se accede desde botones de crear o editar.

## Alcance Funcional De La V1

### Incluye

- Catalogo simple de productos sin variantes.
- Categorias reutilizables.
- Productos con una foto principal y fotos adicionales.
- Estados de producto: activo, pausado, agotado.
- Promociones individuales con reglas predefinidas.
- Combos con multiples productos.
- Menus web mobile-first con editor propio basado en bloques.
- Links persistentes con slug inmutable.
- QR configurables visualmente.
- Programacion horaria de menus por link.
- Cambio manual del menu activo de un link.
- Dashboard con metricas basicas del modulo.

### No Incluye En Esta V1

- Pedidos desde el menu.
- Pago desde el menu.
- Llamado de mozo.
- Multi-tenant real con multiples clientes compartiendo la misma instalacion.
- Variantes de producto como tamanos o agregados.

## Modelo De Datos

Aunque la primera version sera de una sola instalacion por negocio, el modelo se dejara listo para evolucion futura.

### Entidades Principales

- `business_profile`
  - un solo registro por instalacion
  - nombre comercial
  - logo
  - timezone
  - datos de contacto

- `catalog_categories`
  - id
  - business_id
  - name
  - slug
  - is_active

- `catalog_products`
  - id
  - business_id
  - category_id
  - name
  - slug
  - main_image_url
  - description
  - price
  - status: `active | paused | sold_out`
  - sort_order
  - created_at
  - updated_at

- `catalog_product_images`
  - id
  - product_id
  - image_url
  - sort_order

- `catalog_promotions`
  - id
  - business_id
  - type
  - title
  - conditions_text
  - starts_at
  - ends_at
  - has_countdown
  - status

- `catalog_promotion_targets`
  - id
  - promotion_id
  - product_id
  - related_product_id nullable
  - discount_percent nullable
  - spend_threshold nullable

- `catalog_combos`
  - id
  - business_id
  - name
  - image_url nullable
  - description
  - conditions_text
  - combo_price
  - starts_at nullable
  - ends_at nullable
  - status

- `catalog_combo_items`
  - id
  - combo_id
  - product_id
  - sort_order

- `catalog_menus`
  - id
  - business_id
  - name
  - logo_url nullable
  - venue_name nullable
  - theme_key
  - status: `draft | active | paused | archived`
  - created_at
  - updated_at

- `catalog_menu_blocks`
  - id
  - menu_id
  - block_type
  - sort_order
  - config_json

- `catalog_links`
  - id
  - business_id
  - name
  - description
  - slug immutable
  - default_menu_id nullable
  - manual_override_menu_id nullable
  - status: `active | paused | archived`
  - created_at
  - updated_at

- `catalog_link_schedule_rules`
  - id
  - link_id
  - menu_id
  - days_of_week_json
  - start_time
  - end_time
  - start_date nullable
  - end_date nullable
  - is_active

- `catalog_qr_styles`
  - id
  - link_id
  - style_json
  - updated_at

- `catalog_menu_views`
  - id
  - link_id
  - resolved_menu_id
  - viewed_at
  - user_agent
  - referrer nullable

## Reglas De Negocio

### Productos

- `paused`: desaparece de todos los menus y bloques dinamicos.
- `sold_out`: sigue visible en menus, pero con badge `Agotado`.
- Cambios de precio, descripcion, imagen o categoria impactan automaticamente en menus porque los menus guardan referencias, no copias.

### Promociones

- Las promociones son entidades dinamicas aplicadas sobre productos.
- Si un producto esta en promo y aparece en un menu, el render del menu debe mostrar la promo vigente.
- Si el menu tiene bloque de promociones, ese bloque debe poder priorizar la visualizacion promocional.

### Combos

- Son entidades separadas de promociones, aunque en UI se gestionen desde la misma seccion.
- Pueden tener vigencia y menus objetivo.
- Si no se carga imagen, se usa la imagen del primer producto.

### Menus

- Todos los menus tienen buscador y filtros integrados.
- La cabecera siempre es el primer bloque.
- Los menus deben renderizarse como vistas web optimizadas para mobile.

### Links Persistentes

- El slug nunca cambia.
- El link no se destruye en operacion normal; se pausa o archiva.
- El QR siempre resuelve a ese slug estable.

### Resolucion De Menu En Tiempo Real

Orden de prioridad:

1. Si el link esta pausado, se muestra estado no disponible.
2. Si existe `manual_override_menu_id`, ese menu gana.
3. Si una regla horaria activa coincide con fecha y hora actual, se usa ese menu.
4. Si no, se usa el menu por defecto.

### Validacion De Horarios

- No se permiten solapamientos de reglas dentro del mismo link.
- La validacion considera dia de semana, franja horaria y rango de fechas.
- La timezone se toma desde `business_profile`.

## Diseno Del Editor De Menus

Se construira un editor propio basado en `form + drag and drop`.

### Layout Del Editor

- Columna izquierda: biblioteca de bloques
- Centro: preview del menu en viewport mobile
- Columna derecha: propiedades del bloque seleccionado y configuracion del tema

### Tipos De Bloque

- `header`
- `featured-product`
- `category`
- `promotions`
- `combos`
- `separator`

### Bloque Separator

Permite:

- texto libre
- color de texto
- fondo solido
- gradiente
- imagen de fondo

### Temas

Se implementaran `6 estilos` como presets visuales sobre el mismo motor:

- typography
- spacing
- cards/listado
- color tokens
- headers
- badges

Eso evita duplicar seis editores o seis renderizadores.

## Publicacion Y Render Del Menu

El menu publico no se almacenara como HTML estatico. Se resolvera de forma dinamica desde el backend publico y se renderizara en una pagina React mobile-first.

### Motivo

- Mantener sincronizacion viva con productos, combos y promociones.
- Respetar estado `paused` y `sold_out` sin regeneraciones.
- Soportar programacion horaria y override manual sin tocar URLs.
- Facilitar una futura capa de pedidos/pago sobre la misma URL persistente.

## QR

La configuracion visual del QR se almacenara como JSON.

### Capacidades

- color
- gradiente
- logo interno
- margen
- variante visual
- descarga en SVG y PNG

La generacion y descarga puede resolverse del lado del cliente en la pantalla administrativa, manteniendo el backend enfocado en persistencia y resolucion del link.

## API Requerida

### Privada

- `GET/POST/PUT/DELETE /api/carteleria/products`
- `GET/POST/PUT/DELETE /api/carteleria/categories`
- `GET/POST/PUT/DELETE /api/carteleria/promotions`
- `GET/POST/PUT/DELETE /api/carteleria/combos`
- `GET/POST/PUT/DELETE /api/carteleria/menus`
- `GET/POST/PUT/DELETE /api/carteleria/links`
- `POST /api/carteleria/links/:id/validate-schedule`
- `POST /api/carteleria/links/:id/manual-override`
- `GET /api/carteleria/dashboard`

### Publica

- `GET /api/carteleria/public/:slug`
- `GET /api/carteleria/public/:slug/qr`

## Reutilizacion Del Sistema Actual

Se deben reutilizar:

- `Layout`
- `Header`
- `Sidebar`
- `AuthContext`
- `SocketContext` si se decide usar refresco administrativo en vivo
- patrones de tabla/tarjeta
- formularios
- uploader
- toasts
- componentes visuales base

Se deben crear nuevos solo donde el dominio lo exija:

- editor de menus por bloques
- builder de reglas horarias
- configurador de QR
- viewer publico del menu

## Preparacion Para Futuro SaaS

Sin convertir aun el modulo en multi-tenant real:

- todas las nuevas tablas deben aceptar `business_id`
- el `business_profile` se maneja como unico en v1
- el resto del codigo debe centralizar acceso al negocio activo para no acoplarse al supuesto de una sola instalacion

## Implementacion Recomendada

La construccion debe hacerse por fases:

1. Shell compartido y rutas del modulo
2. Esquema de base de datos y helpers de resolucion
3. Productos y categorias
4. Promociones y combos
5. Menus y editor propio
6. Links persistentes y programacion
7. QR y pagina publica
8. Metricas, pulido y hardening

## Criterios De Exito

- El usuario puede administrar productos, promos, combos, menus y links desde el mismo sistema.
- Un QR impreso sigue sirviendo aunque cambien menús o reglas.
- Un producto pausado desaparece de menús.
- Un producto agotado sigue visible con badge.
- Los cambios del catalogo se reflejan en menus sin duplicacion de datos.
- El menu publico se ve bien en mobile y funciona tambien en pantallas grandes.
- El modulo queda listo para agregar pedidos/pago sin romper la capa de links persistentes.
