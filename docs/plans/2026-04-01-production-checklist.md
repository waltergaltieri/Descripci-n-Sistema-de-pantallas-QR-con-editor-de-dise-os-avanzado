# Checklist de Produccion KazeScreen

## Estado actual

- Auth: Supabase Auth
- Base de datos: Supabase Postgres
- Archivos: Supabase Storage
- SaaS: `super admin` + `business_accounts` + `business_users`
- Multi-tenant operativo en carteleria/uploads

## Variables obligatorias

### Backend

- `NODE_ENV=production`
- `DB_PROVIDER=postgres`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`
- `DB_SSL=true`
- `UPLOAD_PROVIDER=supabase`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_STORAGE_BUCKET=uploads`
- `SOCKET_CORS_ORIGIN`
- `CLIENT_URL`

### Frontend

- `REACT_APP_API_URL`
- `REACT_APP_SERVER_URL`
- `REACT_APP_WS_URL`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_PROJECT_ID`
- `REACT_APP_SUPABASE_PUBLISHABLE_KEY`

## Antes de salir a produccion

1. Cambiar la contraseña del `super admin` inicial.
2. Confirmar que el bucket `uploads` exista y siga con restricciones de MIME/tamaño.
3. Ejecutar `Rerun linter` en Supabase Security Advisor para refrescar los avisos de RLS.
4. Configurar `SOCKET_CORS_ORIGIN` y `CLIENT_URL` con la URL real del frontend.
5. Verificar que frontend y backend apunten al mismo proyecto Supabase.

## Smoke test recomendado

1. Iniciar sesión como `super admin`.
2. Crear un cliente nuevo.
3. Entrar con el usuario owner de ese cliente.
4. Crear o editar un diseño y guardar.
5. Asignar/publicar un diseño a una pantalla.
6. Crear un menú digital.
7. Crear un link QR persistente y abrir el menú público.
8. Subir una imagen y confirmar que quede visible desde el tenant correcto.

## Observaciones

- Si el backend queda corriendo con una versión vieja del código, algunas rutas nuevas pueden devolver `404` aunque el repo ya esté correcto. Reiniciar el proceso resuelve eso.
- El frontend ya no depende de `favicon.ico` ni `logo192.png`; usa `icon.svg`.
- Los módulos legacy de exportación headless siguen necesitando `CLIENT_URL` correcto para producción.
