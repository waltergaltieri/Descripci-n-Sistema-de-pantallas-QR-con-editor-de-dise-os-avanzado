# Despliegue recomendado

Arquitectura elegida para esta version:

- Frontend en Vercel
- Backend en Render
- Base de datos en Supabase Postgres
- Uploads locales del backend en disco persistente de Render

## Estado actual

Ya esta verificado:

- el backend puede correr con `DB_PROVIDER=postgres`
- la conexion a Supabase Postgres funciona
- el esquema se crea/verifica correctamente en la base remota
- el frontend ya soporta `REACT_APP_API_URL` y `REACT_APP_SERVER_URL`

## Backend en Render

Archivo listo:

- `render.yaml`

Servicio:

- Nombre sugerido: `kazescreen-api`
- Root dir: `server`
- Runtime: `node`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`

Variables que hay que completar en Render:

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_PASSWORD`
- `SOCKET_CORS_ORIGIN`

Variables ya previstas en el blueprint:

- `NODE_ENV=production`
- `DB_PROVIDER=postgres`
- `DB_SSL=true`
- `ADMIN_USERNAME=admin`
- `BUSINESS_NAME=Mi Local`
- `BUSINESS_TIMEZONE=America/Buenos_Aires`
- `BUSINESS_CURRENCY=ARS`
- `UPLOAD_PROVIDER=local`
- `UPLOAD_PATH=/var/data/uploads`
- `MAX_FILE_SIZE=5242880`

Disco persistente:

- Mount path: `/var/data`
- Uploads: `/var/data/uploads`

## Frontend en Vercel

Archivo listo:

- `client/vercel.json`

Variables a configurar en Vercel:

- `REACT_APP_API_URL=https://TU-BACKEND.onrender.com/api`
- `REACT_APP_SERVER_URL=https://TU-BACKEND.onrender.com`

Root directory recomendada en Vercel:

- `client`

Build command:

- `npm run build`

Output directory:

- `build`

## Supabase

Ya esta integrado:

- `DATABASE_URL` del proyecto Supabase Postgres

Todavia no se activo:

- `Supabase Storage`

Motivo:

- para activar uploads en Supabase Storage hace falta la `SUPABASE_SERVICE_ROLE_KEY`
- mientras tanto, el sistema puede desplegarse sin bloquearse usando disco persistente en Render

## Orden sugerido

1. Crear el backend en Render con el `render.yaml`
2. Configurar variables secretas en Render
3. Confirmar URL final del backend
4. Crear el frontend en Vercel apuntando a esa URL
5. Actualizar `SOCKET_CORS_ORIGIN` en Render con la URL final de Vercel
6. Redeploy del backend
