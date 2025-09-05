# 🚗 Sistema de Administración de Flota

Un sistema completo de administración de flota de vehículos desarrollado con HTML, JavaScript y Supabase.

## 📋 Características

### ✅ **Dashboard**
- Estadísticas en tiempo real
- Contadores de entidades
- Actividad reciente
- Gráficos de distribución

### ✅ **Gestión de Arrendadoras**
- CRUD completo (Crear, Leer, Actualizar, Eliminar)
- Búsqueda en tiempo real
- Validación de datos
- Identificación jurídica

### ✅ **Gestión de Vehículos**
- CRUD completo con formularios avanzados
- Filtros por arrendadora y estado
- Búsqueda por placa y VIN
- Relaciones con marcas, modelos y arrendadoras
- Gestión de precios y gastos administrativos
- Estados de inventario

### ✅ **Gestión de Marcas y Modelos**
- CRUD completo
- Relación jerárquica (Marca → Modelo)
- Filtros y búsquedas
- Validación de datos

### ✅ **Estados de Inventario**
- Gestión de estados personalizados
- Estados predefinidos (Disponible, Rentado, Mantenimiento, etc.)
- Asignación a vehículos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Estilos**: Tailwind CSS
- **Iconos**: Font Awesome
- **Backend**: Supabase (PostgreSQL + APIs REST)
- **Base de Datos**: PostgreSQL

## 📁 Estructura del Proyecto

```
flota-admin/
├── index.html          # Página principal
├── config.js           # Configuración de Supabase
├── api.js             # Servicios de API
├── app.js             # Lógica principal de la aplicación
├── modals.js          # Modales y funciones CRUD
├── styles.css         # Estilos personalizados
└── README.md          # Documentación
```

## 🚀 Instalación y Uso

### 1. **Configuración de Supabase**

El sistema ya está configurado con tu base de datos de Supabase. Las credenciales están en `config.js`:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://yeavqyshoamtfgyyqlyb.supabase.co',
    apiKey: 'tu-api-key'
};
```

### 2. **Ejecutar el Sistema**

1. Abre `index.html` en tu navegador
2. El sistema se cargará automáticamente
3. Verás el dashboard con estadísticas

### 3. **Uso del Sistema**

#### **Dashboard**
- Vista general de estadísticas
- Contadores de todas las entidades
- Actividad reciente de vehículos

#### **Arrendadoras**
- Click en "Nueva Arrendadora" para crear
- Usar búsqueda para filtrar
- Iconos de editar/eliminar en cada fila

#### **Vehículos**
- Click en "Nuevo Vehículo" para crear
- Formulario completo con validaciones
- Filtros por arrendadora y estado
- Búsqueda por placa o VIN

#### **Marcas y Modelos**
- Crear marcas primero
- Luego crear modelos asociados a marcas
- Sistema de relaciones automático

#### **Estados**
- Crear estados personalizados
- Asignar a vehículos

## 🔧 Funcionalidades Avanzadas

### **Búsquedas en Tiempo Real**
- Todas las tablas tienen búsqueda instantánea
- Filtros avanzados en vehículos
- Debounce de 300ms para optimizar rendimiento

### **Validaciones**
- Campos obligatorios marcados con *
- Validación de tipos de datos
- Mensajes de error descriptivos

### **Notificaciones**
- Toast notifications para todas las acciones
- Tipos: success, error, warning, info
- Auto-dismiss después de 5 segundos

### **Responsive Design**
- Diseño adaptativo para móviles
- Tablas con scroll horizontal
- Modales responsivos

## 📊 Esquema de Base de Datos

### **Tablas Principales**

#### `arrendadoras`
- `id` (Primary Key)
- `nombre` (text)
- `identificacion_juridica` (text, nullable)

#### `vehiculos`
- `id` (Primary Key)
- `placa` (text)
- `vin` (text, nullable)
- `marca_id` (Foreign Key → marcas)
- `modelo_id` (Foreign Key → modelos)
- `anio` (integer)
- `arrendadora_id` (Foreign Key → arrendadoras)
- `estado_inventario_id` (Foreign Key → estados_inventario)
- `precio_semanal` (numeric, nullable)
- `gastos_adms` (numeric, nullable)
- `link_fotos` (text, nullable)

#### `marcas`
- `id` (Primary Key)
- `nombre` (text)

#### `modelos`
- `id` (Primary Key)
- `marca_id` (Foreign Key → marcas)
- `nombre` (text)

#### `estados_inventario`
- `id` (Primary Key)
- `nombre` (text)

#### `vehiculo_fotos`
- `id` (Primary Key)
- `vehiculo_id` (Foreign Key → vehiculos)
- `url` (text)
- `orden` (integer)

## 🔒 Seguridad

- APIs protegidas con autenticación de Supabase
- Validación de datos en frontend y backend
- Sanitización de inputs
- Manejo de errores robusto

## 📱 Compatibilidad

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers

## 🚀 Despliegue

### **Opción 1: GitHub Pages**
1. Subir código a GitHub
2. Activar GitHub Pages
3. Configurar dominio personalizado (opcional)

### **Opción 2: Vercel**
1. Conectar repositorio de GitHub
2. Desplegar automáticamente
3. Configurar variables de entorno

### **Opción 3: Netlify**
1. Drag & drop de archivos
2. Configurar build settings
3. Desplegar instantáneamente

## 🔧 Personalización

### **Cambiar Colores**
Editar `styles.css`:
```css
:root {
    --primary-color: #3B82F6;
    --secondary-color: #6B7280;
}
```

### **Agregar Nuevos Campos**
1. Actualizar esquema de base de datos
2. Modificar formularios en `modals.js`
3. Actualizar APIs en `api.js`
4. Actualizar tablas en `app.js`

### **Cambiar Configuraciones**
Editar `config.js`:
```javascript
const APP_CONFIG = {
    itemsPerPage: 20,
    dateFormat: 'DD/MM/YYYY',
    currency: 'USD'
};
```

## 🐛 Solución de Problemas

### **Error de CORS**
- Verificar configuración de Supabase
- Revisar headers de autenticación

### **Datos no se cargan**
- Verificar conexión a internet
- Revisar consola del navegador
- Verificar credenciales de API

### **Modales no funcionan**
- Verificar que todos los archivos JS estén cargados
- Revisar orden de carga en HTML

## 📞 Soporte

Para soporte técnico o preguntas:
- Revisar la consola del navegador para errores
- Verificar la documentación de Supabase
- Contactar al desarrollador

## 🔄 Actualizaciones

### **Versión 1.0**
- ✅ CRUD completo para todas las entidades
- ✅ Dashboard con estadísticas
- ✅ Búsquedas y filtros
- ✅ Modales responsivos
- ✅ Notificaciones toast

### **Próximas Versiones**
- 🔄 Autenticación de usuarios
- 🔄 Subida de fotos
- 🔄 Reportes avanzados
- 🔄 Exportación de datos
- 🔄 API REST pública

---

**Desarrollado con ❤️ para la administración eficiente de flotas de vehículos**
