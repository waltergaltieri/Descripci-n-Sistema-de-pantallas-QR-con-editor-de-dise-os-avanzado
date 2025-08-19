# Editor de Diseños con Polotno SDK

Editor de diseños avanzado basado en Polotno SDK para un sistema de pantallas digitales con soporte para múltiples pantallas y composiciones extendidas.

## 🚀 Características

### Editor Principal
- **Workspace principal** con zoom, pan (barra espaciadora), rulers, guías y grid con snap
- **Panel izquierdo** dividido en:
  - **Paleta**: Texto, Imagen (URL/subida), Formas, Contenedores, QR
  - **Capas**: Lista jerárquica con renombrar, ocultar, bloquear, duplicar, eliminar, drag&drop
- **Panel derecho** con pestañas:
  - **General**: Posición, tamaño, rotación, opacidad, z-index
  - **Fondo**: Sólido, gradiente linear/radial, imagen con ajustes
  - **Animaciones**: Fade, slide, scale, rotate, pulse, bounce, marquee, motionPath

### Funcionalidades Avanzadas
- **Máscaras**: Crear máscaras combinando formas + imagen/contenedor
- **Multipantalla**: Cada TV = una Page con soporte para composiciones extendidas
- **Smart guides** y snap automático
- **Atajos de teclado** completos (Ctrl+C/V/X, Delete, F2, flechas, etc.)

### Persistencia y Publicación
- **Guardar/Cargar**: Diseños como JSON con miniaturas automáticas
- **Publicación**: Exportar PNG a resolución nativa
- **Composiciones extendidas**: Crops automáticos por pantalla
- **Player fullscreen**: Ruta `/player/:screenId` con actualizaciones en tiempo real

## 🛠️ Tecnologías

### Frontend
- React 18
- Tailwind CSS
- GrapesJS (Editor visual)
- @dnd-kit (Drag & Drop)
- Lucide React (Iconos)
- Axios (HTTP Client)

### Backend
- Node.js
- Express.js
- SQLite3
- Multer (Subida de archivos)
- CORS

## 📦 Instalación

### Prerrequisitos
- Node.js (v14 o superior)
- npm o yarn

### Configuración del Servidor

```bash
# Navegar al directorio del servidor
cd server

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar el servidor
npm start
```

El servidor estará disponible en `http://localhost:5000`

### Configuración del Cliente

```bash
# Navegar al directorio del cliente
cd client

# Instalar dependencias
npm install

# Iniciar la aplicación
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 🗂️ Estructura del Proyecto

```
PantallasQR/
├── client/                 # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   │   ├── Designs/    # Editor de diseños
│   │   │   └── Screens/    # Gestión de pantallas
│   │   ├── contexts/       # Contextos de React
│   │   └── services/       # Servicios API
│   └── public/
├── server/                 # API Backend
│   ├── routes/            # Rutas de la API
│   ├── middleware/        # Middlewares
│   ├── config/           # Configuración
│   └── uploads/          # Archivos subidos
└── README.md
```

## 🎨 Funcionalidades del Editor

### Canvas Avanzado
- Elementos arrastrables y redimensionables
- Sistema de grilla con snap
- Reglas y guías de alineación
- Menú contextual
- Zoom y viewport personalizable

### Elementos Disponibles
- Texto personalizable
- Imágenes
- Formas geométricas
- Códigos QR
- Elementos multimedia

### Herramientas
- Duplicar elementos
- Bloquear/desbloquear
- Mostrar/ocultar
- Alineación automática
- Historial de cambios

## 📱 API Endpoints

### Diseños
- `GET /api/designs` - Obtener todos los diseños
- `GET /api/designs/:id` - Obtener diseño específico
- `POST /api/designs` - Crear nuevo diseño
- `PUT /api/designs/:id` - Actualizar diseño
- `DELETE /api/designs/:id` - Eliminar diseño
- `POST /api/designs/:id/duplicate` - Duplicar diseño

### Pantallas
- `GET /api/screens` - Obtener todas las pantallas
- `GET /api/screens/:id` - Obtener pantalla específica
- `POST /api/screens` - Crear nueva pantalla
- `PUT /api/screens/:id` - Actualizar pantalla
- `DELETE /api/screens/:id` - Eliminar pantalla

### Plantillas
- `GET /api/designs/templates` - Obtener plantillas
- `POST /api/designs/from-template` - Crear desde plantilla

## 🔧 Configuración

### Variables de Entorno (Server)

```env
PORT=5000
DB_PATH=./database.sqlite
UPLOADS_DIR=./uploads
NODE_ENV=development
```

### Configuración de Base de Datos

La base de datos SQLite se inicializa automáticamente al iniciar el servidor por primera vez.

## 🚀 Despliegue

### Producción

```bash
# Construir el cliente
cd client
npm run build

# El servidor puede servir los archivos estáticos del build
# Configurar NODE_ENV=production en el servidor
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Tu Nombre** - *Desarrollo inicial* - [TuGitHub](https://github.com/tuusuario)

## 🙏 Agradecimientos

- GrapesJS por el excelente editor visual
- React y la comunidad de código abierto
- Tailwind CSS por el sistema de diseño
- Lucide por los iconos

---

⭐ ¡No olvides dar una estrella al proyecto si te ha sido útil!