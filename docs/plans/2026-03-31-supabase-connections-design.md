# Conexion Base con Supabase Design

## Objetivo

Preparar el proyecto para usar Supabase como proveedor real de base de datos, storage y cliente JS, sin migrar todavia el flujo completo de autenticacion. Esta etapa debe dejar listas las conexiones necesarias para que la siguiente iteracion pueda reemplazar el login actual con el menor riesgo posible.

## Alcance

- Backend:
  - aceptar configuracion de Postgres/Supabase a partir de `SUPABASE_PROJECT_ID` y `SUPABASE_DB_PASSWORD`,
  - aceptar la nueva clave secreta `sb_secret_*` ademas de `SUPABASE_SERVICE_ROLE_KEY`,
  - centralizar la creacion del cliente Supabase del servidor.
- Frontend:
  - agregar un cliente Supabase reutilizable para futuras operaciones de auth,
  - exponer variables de entorno consistentes para URL, project id y publishable key.
- Configuracion:
  - actualizar ejemplos de entorno,
  - dejar configuracion local funcional en archivos ignorados por git,
  - preparar `render.yaml` para storage de Supabase.

## Decisiones

### Conexion de base de datos

Se mantendra el adaptador Postgres existente. En lugar de exigir una `DATABASE_URL` manual, el backend podra construir una URL directa de Supabase cuando existan `SUPABASE_PROJECT_ID` y `SUPABASE_DB_PASSWORD`. La contrasena debe codificarse para soportar caracteres especiales.

### Cliente del servidor

El servidor tendra un modulo `server/config/supabase.js` que entregue:

- config normalizada,
- cliente de servicio para storage y tareas administrativas futuras,
- validacion explicita de claves requeridas.

El modulo aceptara `SUPABASE_SECRET_KEY` como fuente principal y mantendra compatibilidad con `SUPABASE_SERVICE_ROLE_KEY`.

### Cliente del frontend

Se agregara un modulo `client/src/services/supabase.js` para inicializar `@supabase/supabase-js` con la URL del proyecto y la publishable key. Esta capa no reemplaza todavia `AuthContext`, pero deja el cableado listo para la siguiente etapa.

### Despliegue y entorno

No se van a commitear secretos. Los valores sensibles quedaran en `server/.env` y `client/.env.local`, que ya estan ignorados por git. Los archivos `.env.example` y `render.yaml` se actualizaran solo con placeholders y nombres de variables.

## Riesgos Controlados

- Contrasenas con `+` o `=` en la URL de Postgres: se resuelve codificando el password.
- Cambio de naming entre `service_role` antiguo y `sb_secret_*` nuevo: se resuelve aceptando ambos nombres de variable.
- Mezclar la etapa de conexion con la de auth: se evita no tocando aun `AuthContext`, login ni middleware JWT.

## Verificacion

- Tests backend de configuracion para:
  - derivar URL Postgres desde project id + password,
  - aceptar `SUPABASE_SECRET_KEY` en storage.
- Test frontend para:
  - resolver la configuracion del cliente Supabase desde env.
- Verificacion final:
  - `node --test server/tests/*.test.js`
  - `npm test -- --watchAll=false`
  - `npm run build`
