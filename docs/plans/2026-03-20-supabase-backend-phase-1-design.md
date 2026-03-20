# Migracion Backend a Supabase - Fase 1 Design

## Objetivo

Preparar el backend actual para funcionar contra Supabase sin reescribir toda la aplicacion. Esta fase reemplaza las dependencias mas problematicas para despliegue moderno:

- SQLite local -> Postgres compatible con Supabase
- uploads en disco local -> Supabase Storage

La aplicacion sigue usando Express, JWT propio y la mayor parte de las rutas actuales.

## Alcance

Incluye:

- capa de base de datos compatible con SQLite o Postgres por configuracion
- soporte de inicializacion de esquema para Postgres
- capa de storage compatible con disco local o Supabase Storage
- actualizacion de uploads e inicializacion del servidor para ambas modalidades
- documentacion de variables de entorno para produccion

No incluye en esta fase:

- migracion a Supabase Auth
- reemplazo de Socket.IO por Supabase Realtime
- migracion completa del frontend a cliente Supabase
- script de migracion de datos existentes desde SQLite

## Arquitectura

### Base de datos

Se agrega un adaptador comun con la interfaz que ya consume el backend:

- `get(sql, params)`
- `all(sql, params)`
- `run(sql, params)`
- `exec(sql)`

Ese adaptador tendra dos implementaciones:

- SQLite para desarrollo local y compatibilidad actual
- Postgres para Supabase

La idea es no reescribir todas las rutas. El backend ya usa masivamente `db().get/all/run/exec`, asi que la compatibilidad se concentra en la capa de infraestructura.

### Transacciones

Las rutas actuales abren transacciones con `BEGIN`, `COMMIT` y `ROLLBACK`. En Postgres se mantendra esa API usando una conexion transaccional por contexto de request, de modo que el codigo actual siga funcionando.

### Storage

Se agrega un storage adapter con dos modos:

- `local`: guarda archivos en `UPLOAD_PATH`
- `supabase`: sube archivos a un bucket configurado

La tabla `uploads` se mantiene. Lo que cambia es el origen fisico del archivo y la URL generada.

## Envs nuevos

- `DB_PROVIDER=sqlite|postgres`
- `SQLITE_PATH=...`
- `DATABASE_URL=...`
- `UPLOAD_PROVIDER=local|supabase`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `SUPABASE_STORAGE_BUCKET=...`

## Riesgos

- algunas consultas SQL pueden depender de detalles de SQLite y requerir traduccion de placeholders o pequenos ajustes
- las transacciones deben mantener aislamiento por request para no romper flujos concurrentes
- uploads y URLs publicas deben seguir siendo compatibles con la UI actual

## Verificacion

- tests unitarios de adaptador DB y storage
- tests existentes de rutas principales
- build del frontend
- arranque real del backend en modo local
