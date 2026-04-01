# Super Admin SaaS con Supabase Auth Design

## Objetivo

Convertir el sistema actual en una base SaaS administrada por un `super admin`, donde cada cliente tenga su propio negocio y su propio acceso, pero el control comercial y la habilitacion real del sistema sigan en manos del operador. La autenticacion pasara a estar soportada por Supabase Auth y el modelo de datos quedara preparado para crecer a multiples usuarios por negocio, aunque en esta primera etapa cada negocio arrancara con un unico usuario principal.

## Principios del diseño

- Un negocio no equivale a un usuario. El negocio es el tenant real.
- La autenticacion y la autorizacion se separan:
  - Supabase Auth autentica identidad.
  - La base propia define rol, pertenencia al negocio y estado de acceso.
- El sistema no corta acceso automaticamente por vencimiento.
- Los avisos de cobro ayudan a operar, pero la suspension sigue siendo manual.
- El modelo debe servir para MVP hoy y no bloquear expansion a multiusuario despues.

## Modelo de actores

### Super admin

Es un usuario interno del operador del sistema. Tiene acceso a un panel de administracion global desde donde:

- crea negocios,
- crea el usuario principal de cada negocio,
- activa, suspende o desactiva clientes,
- carga pagos manuales,
- revisa vencimientos y alertas.

### Negocio / cliente

Representa una cuenta SaaS. Tiene identidad comercial propia y concentra los recursos del tenant:

- pantallas,
- diseños,
- carteleria,
- productos,
- menus,
- links,
- uploads,
- configuracion del negocio.

### Usuario de negocio

Es un usuario autenticable de Supabase Auth asociado a un negocio. En esta etapa se crea solo uno por negocio, con rol owner/admin del cliente. Mas adelante se podran agregar mas usuarios del mismo negocio sin rehacer el modelo.

## Regla central de acceso

Hay que separar con claridad dos estados:

- estado comercial: si esta al dia, vence pronto o esta vencido,
- estado operativo de acceso: si puede usar el sistema o no.

Regla de negocio:

- un cliente vencido no pierde acceso automaticamente,
- el sistema solo alerta,
- el super admin decide manualmente si lo mantiene activo o lo suspende.

Esto refleja el proceso real de cobro por fuera del sistema y evita cortes automaticos incorrectos.

## Modelo de datos propuesto

### `super_admin_users`

Tabla de usuarios internos del operador.

Campos principales:

- `id`
- `supabase_user_id`
- `email`
- `full_name`
- `is_active`
- `created_at`
- `updated_at`

### `business_accounts`

Tenant principal del cliente.

Campos principales:

- `id`
- `name`
- `legal_name`
- `address`
- `contact_phone`
- `contact_person`
- `contact_email`
- `access_status` (`active`, `suspended`, `inactive`)
- `commercial_status` (`current`, `due_soon`, `overdue`)
- `notes`
- `created_at`
- `updated_at`

### `business_users`

Usuarios del negocio asociados al tenant.

Campos principales:

- `id`
- `business_account_id`
- `supabase_user_id`
- `email`
- `full_name`
- `role` (`owner`, `manager`, `editor`)
- `is_active`
- `last_login_at`
- `created_at`
- `updated_at`

En esta etapa se usara solo `owner`.

### `billing_profiles`

Estado de facturacion actual del cliente.

Campos principales:

- `id`
- `business_account_id`
- `first_payment_date`
- `billing_amount_cents`
- `billing_currency_code`
- `billing_frequency` (`monthly`)
- `last_payment_marked_at`
- `next_due_date`
- `reminder_days_before` (default 7)
- `manual_hold` (opcional)
- `created_at`
- `updated_at`

### `billing_events`

Historial operativo/comercial.

Campos principales:

- `id`
- `business_account_id`
- `event_type` (`payment_marked`, `access_activated`, `access_suspended`, `access_inactivated`, `note_added`)
- `amount_cents`
- `event_date`
- `notes`
- `created_by_super_admin_id`
- `created_at`

Sirve para trazabilidad y futuras auditorias.

## Aislamiento multi-tenant

Todas las tablas de negocio deben quedar asociadas a `business_account_id`. En la base actual eso implica evolucionar las tablas ya existentes para que dejen de ser globales.

La idea no es resolver RLS completa en esta etapa, pero si dejar lista la separacion logica.

Tablas que deberian migrarse para depender del tenant:

- `screens`
- `designs`
- `design_assignments`
- `uploads`
- `categories`
- `products`
- `product_images`
- `combos`
- `combo_items`
- `promotions`
- `menus`
- `menu_blocks`
- `combo_menu_visibility`
- `persistent_links`
- `link_schedule_rules`
- `menu_views`
- `business_profile`

`business_profile` deberia dejar de ser una tabla singleton y pasar a integrarse como datos del propio `business_accounts` o quedar 1:1 con ese tenant.

## Integracion con Supabase Auth

### Identidad

Supabase Auth pasa a ser la unica fuente de identidad para:

- super admins,
- usuarios de negocio.

### Perfil de aplicacion

La app no va a depender de claims complejos para operar el negocio. En cambio:

- el token de Supabase autentica,
- el backend resuelve el perfil real consultando tablas propias,
- el frontend consume un endpoint de perfil de sesion.

Esto simplifica la autorizacion y evita meter mucha logica en JWT custom.

### Resolucion de sesion

Flujo recomendado:

1. El usuario inicia sesion con email/password en Supabase.
2. El frontend obtiene access token de Supabase.
3. El frontend envia ese Bearer token al backend.
4. El backend valida el token con Supabase.
5. El backend busca:
   - si el usuario es `super_admin`,
   - o si pertenece a `business_users`.
6. El backend devuelve el perfil de aplicacion y permisos.

## Rutas y permisos

### Zona super admin

Nueva seccion protegida, por ejemplo:

- `/super-admin/dashboard`
- `/super-admin/clients`
- `/super-admin/clients/:id`

Solo accesible para usuarios presentes en `super_admin_users`.

### Zona negocio

Las rutas actuales del sistema se mantienen para clientes normales, pero deben depender del `business_account_id` del usuario autenticado.

### Control de acceso

Si el usuario pertenece a `business_users`:

- puede autenticarse,
- pero si el negocio esta `suspended` o `inactive`, la app no le permite usar el sistema.

Se recomienda mostrar una pantalla clara:

- acceso suspendido,
- contactar administrador,
- sin revelar datos internos.

## Pantallas del nuevo modulo

### 1. Dashboard Super Admin

Resumen con indicadores:

- clientes activos,
- clientes suspendidos,
- clientes inactivos,
- vencen en 7 dias,
- vencidos no suspendidos.

Accesos rapidos:

- crear cliente,
- revisar vencimientos,
- ver pagos pendientes.

### 2. Listado de clientes

Tabla con filtros:

- todos,
- activos,
- suspendidos,
- inactivos,
- vencen pronto,
- vencidos.

Columnas recomendadas:

- negocio,
- contacto,
- email,
- telefono,
- estado de acceso,
- estado comercial,
- monto,
- proximo vencimiento,
- ultimo pago,
- acciones.

### 3. Alta de cliente

Formulario para crear:

- negocio,
- direccion,
- telefono,
- persona de contacto,
- email,
- password inicial,
- fecha primer pago,
- monto.

El alta debe:

- crear el usuario en Supabase Auth,
- crear `business_account`,
- crear `business_user`,
- crear `billing_profile`,
- registrar evento inicial.

### 4. Detalle de cliente

Secciones:

- datos del negocio,
- usuario principal,
- estado de acceso,
- datos de facturacion,
- historial.

Acciones:

- activar,
- suspender,
- inactivar,
- marcar pago,
- editar datos,
- agregar nota.

## Reglas de facturacion

### Proximo vencimiento

Se calcula a partir de:

- fecha de primer pago,
- frecuencia mensual,
- ultimo pago marcado.

### Alertas

Se considera `due_soon` cuando faltan 7 dias o menos para `next_due_date`.

Se considera `overdue` cuando la fecha actual supera `next_due_date`.

### Pago manual

Cuando el super admin marca un pago:

- se actualiza `last_payment_marked_at`,
- se recalcula `next_due_date`,
- se genera un `billing_event`.

### No corte automatico

Aunque el cliente quede `overdue`, el sistema no cambia `access_status` por si solo.

## Migracion desde el sistema actual

### Etapa 1

- agregar Supabase Auth,
- crear tablas nuevas,
- crear flujo super admin,
- crear flujo de cliente con un usuario owner.

### Etapa 2

- empezar a asociar datos actuales al tenant,
- migrar las consultas globales a consultas por `business_account_id`,
- endurecer middleware y permisos.

### Etapa 3

- retirar login propio,
- retirar JWT propio,
- retirar tabla `users` actual o dejarla solo como legado temporal.

## Riesgos y decisiones operativas

### Riesgo 1: migrar auth y multi-tenant al mismo tiempo

Mitigacion:

- separar autenticacion de tenanting en capas,
- resolver primero identidad y perfil,
- luego aislar datos por negocio.

### Riesgo 2: romper datos actuales monocliente

Mitigacion:

- crear un tenant por defecto para la data existente,
- migrar registros a ese tenant antes de activar nuevos clientes.

### Riesgo 3: complejidad excesiva para el MVP

Mitigacion:

- un solo usuario por negocio en esta etapa,
- sin autosuspension,
- sin cobro integrado,
- sin panel de autoservicio del cliente para usuarios internos.

## Recomendacion final

La mejor estrategia para este MVP es:

- Supabase Auth como identidad,
- super admin central,
- negocio como tenant,
- un usuario owner por negocio,
- cobro manual con alertas,
- corte manual de acceso,
- modelo listo para crecer a multiusuario luego.

Eso alinea el producto con la operacion real, reduce el riesgo de errores de negocio y deja una base mucho mas cercana a SaaS sin sobrediseñar de mas.
