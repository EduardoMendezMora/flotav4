// Configuración de Supabase
const SUPABASE_CONFIG = {
    url: 'https://yeavqyshoamtfgyyqlyb.supabase.co',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYXZxeXNob2FtdGZneXlxbHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTY3NjQsImV4cCI6MjA2OTkzMjc2NH0.RDkRmCYMTGgOkAnIakUR9LjlotSLstOJOuIXyNoKbFw',
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYXZxeXNob2FtdGZneXlxbHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTY3NjQsImV4cCI6MjA2OTkzMjc2NH0.RDkRmCYMTGgOkAnIakUR9LjlotSLstOJOuIXyNoKbFw',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYXZxeXNob2FtdGZneXlxbHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTY3NjQsImV4cCI6MjA2OTkzMjc2NH0.RDkRmCYMTGgOkAnIakUR9LjlotSLstOJOuIXyNoKbFw'
    }
};

// Configuraciones globales de la aplicación
const APP_CONFIG = {
    itemsPerPage: 10,
    dateFormat: 'DD/MM/YYYY',
    currency: 'CRC',
    debounceDelay: 300,
    toastDuration: 5000,
    defaultFilters: {
        arrendadora: '',
        estado: '',
        marca: '',
        tarea_estado: '',
        tarea_prioridad: '',
        responsable: ''
    },
    animation: {
        duration: 200,
        easing: 'ease'
    },
    tareas: {
        maxTituloLength: 200,
        maxDescripcionLength: 1000,
        maxNotasLength: 1000,
        autoRefreshInterval: 30000 // 30 segundos
    },
    colaboradores: {
        maxNombreLength: 100,
        maxIdentificacionLength: 20,
        maxTelefonoLength: 15,
        maxEmailLength: 100,
        maxPuestoLength: 50
    }
};

// Estados predefinidos para vehículos
const ESTADOS_VEHICULO = [
    { id: 1, nombre: 'Disponible', color: '#34C759', class: 'status-available' },
    { id: 2, nombre: 'Rentado', color: '#007AFF', class: 'status-rented' },
    { id: 3, nombre: 'En Mantenimiento', color: '#FF9500', class: 'status-maintenance' },
    { id: 4, nombre: 'Fuera de Servicio', color: '#FF3B30', class: 'status-out-of-service' },
    { id: 5, nombre: 'Vendido', color: '#8E8E93', class: 'status-sold' }
];

// Estados de tareas
const ESTADOS_TAREA = [
    { id: 'pendiente', nombre: 'Pendiente', color: '#FF9500', class: 'status-pending' },
    { id: 'en_progreso', nombre: 'En Progreso', color: '#007AFF', class: 'status-in-progress' },
    { id: 'completada', nombre: 'Completada', color: '#34C759', class: 'status-completed' },
    { id: 'cancelada', nombre: 'Cancelada', color: '#FF3B30', class: 'status-cancelled' }
];

// Prioridades de tareas
const PRIORIDADES_TAREA = [
    { id: 'baja', nombre: 'Baja', color: '#8E8E93', class: 'priority-low' },
    { id: 'media', nombre: 'Media', color: '#007AFF', class: 'priority-medium' },
    { id: 'alta', nombre: 'Alta', color: '#FF9500', class: 'priority-high' },
    { id: 'urgente', nombre: 'Urgente', color: '#FF3B30', class: 'priority-urgent' }
];

// Roles de colaboradores en tareas
const ROLES_COLABORADOR = [
    { id: 'ejecutor', nombre: 'Ejecutor', description: 'Persona que ejecuta la tarea' },
    { id: 'supervisor', nombre: 'Supervisor', description: 'Persona que supervisa la tarea' },
    { id: 'apoyo', nombre: 'Apoyo', description: 'Persona que brinda apoyo en la tarea' }
];

// Tipos de archivos adjuntos
const TIPOS_ARCHIVO = [
    { id: 'foto', nombre: 'Foto', icon: 'image', accept: 'image/*' },
    { id: 'documento', nombre: 'Documento', icon: 'file-alt', accept: '.doc,.docx,.txt' },
    { id: 'pdf', nombre: 'PDF', icon: 'file-pdf', accept: '.pdf' },
    { id: 'excel', nombre: 'Excel', icon: 'file-excel', accept: '.xls,.xlsx,.csv' },
    { id: 'video', nombre: 'Video', icon: 'file-video', accept: 'video/*' },
    { id: 'otro', nombre: 'Otro', icon: 'file', accept: '*' }
];

// Constantes adicionales para formularios
const FORM_CONSTANTS = {
    currentYear: new Date().getFullYear(),
    minYear: 1900,
    maxYear: new Date().getFullYear() + 2,
    placeholders: {
        placa: 'ABC123, BDH657, 835282...',
        vin: '1HGBH41JXMN109186',
        empresa: 'Rent a Car Costa Rica S.A.',
        identificacion: '3-101-672906',
        marca: 'Toyota, Honda, Ford',
        modelo: 'Corolla, Civic, Focus',
        estado: 'Disponible, En Mantenimiento',
        fotos: 'https://ejemplo.com/fotos',
        colaborador: 'Juan Pérez González',
        telefono: '8888-8888',
        email: 'colaborador@empresa.com',
        puesto: 'Mecánico, Supervisor, Admin',
        tarea: 'Cambio de aceite, Revisión de frenos',
        descripcion: 'Descripción detallada de la tarea...',
        notas: 'Notas y observaciones adicionales...'
    },
    validation: {
        // Patrones de placa más flexibles para diferentes formatos
        placaPatterns: [
            /^[A-Z]{3}-\d{3}$/,      // ABC-123 (estándar con guión)
            /^[A-Z]{3}\d{3}$/,       // ABC123 (estándar sin guión)
            /^[A-Z]{2,3}\d{3,4}$/,   // AB123, ABC123, AB1234, ABC1234
            /^[A-Z]{2}-\d{4}$/,      // AB-1234 (placas antiguas)
            /^\d{6}$/,               // 123456 (solo números)
            /^[A-Z]{1,3}\d{1,4}$/    // A123, AB123, ABC1234 (flexible)
        ],
        vinPattern: /^[A-HJ-NPR-Z0-9]{17}$/,
        urlPattern: /^https?:\/\/.+/,
        emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phonePattern: /^[\d\-\(\)\s\+]+$/,
        identificacionPattern: /^[\d\-]+$/,
        datePattern: /^\d{4}-\d{2}-\d{2}$/
    },
    limits: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        maxCommentLength: 500,
        maxNoteLength: 1000
    }
};

// Mensajes del sistema
const MESSAGES = {
    success: {
        create: 'creado correctamente',
        update: 'actualizado correctamente',
        delete: 'eliminado correctamente',
        load: 'cargado correctamente',
        save: 'guardado correctamente',
        upload: 'archivo subido correctamente',
        comment: 'comentario agregado correctamente'
    },
    error: {
        create: 'Error al crear',
        update: 'Error al actualizar',
        delete: 'Error al eliminar',
        load: 'Error al cargar',
        save: 'Error al guardar',
        upload: 'Error al subir archivo',
        comment: 'Error al agregar comentario',
        required: 'Por favor completa todos los campos obligatorios',
        network: 'Error de conexión. Intenta nuevamente.',
        validation: 'Los datos ingresados no son válidos',
        fileSize: 'El archivo es demasiado grande (máximo 10MB)',
        fileType: 'Tipo de archivo no permitido',
        duplicate: 'Este elemento ya existe',
        notFound: 'Elemento no encontrado',
        permission: 'No tienes permisos para esta acción'
    },
    confirm: {
        delete: '¿Estás seguro de que quieres eliminar este elemento?',
        deleteTask: '¿Estás seguro de que quieres eliminar esta tarea?',
        deleteCollaborator: '¿Estás seguro de que quieres eliminar este colaborador?',
        cancelTask: '¿Estás seguro de que quieres cancelar esta tarea?',
        completeTask: '¿Marcar esta tarea como completada?',
        removeCollaborator: '¿Quitar este colaborador de la tarea?'
    },
    info: {
        loading: 'Cargando...',
        saving: 'Guardando...',
        uploading: 'Subiendo archivo...',
        noData: 'No hay datos disponibles',
        noResults: 'No se encontraron resultados',
        noTasks: 'No hay tareas asignadas',
        noComments: 'No hay comentarios',
        noFiles: 'No hay archivos adjuntos',
        emptySearch: 'Ingresa un término de búsqueda',
        selectOption: 'Selecciona una opción'
    },
    warnings: {
        unsavedChanges: 'Tienes cambios sin guardar. ¿Continuar?',
        oldVersion: 'Esta versión del sistema está desactualizada',
        maintenanceMode: 'El sistema está en mantenimiento',
        connectionLost: 'Se perdió la conexión. Reconectando...',
        slowConnection: 'Conexión lenta detectada'
    }
};

// Configuración de performance
const PERFORMANCE_CONFIG = {
    enableCache: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutos
    maxRetries: 3,
    retryDelay: 1000,
    debounceSearch: 300,
    batchSize: 50,
    lazyLoadThreshold: 100,
    imageOptimization: true,
    compressionLevel: 0.8
};

// Configuración de notificaciones
const NOTIFICATION_CONFIG = {
    position: 'top-right',
    duration: 5000,
    maxVisible: 3,
    enableSound: false,
    enableVibration: false,
    types: {
        success: { icon: 'check-circle', color: '#34C759' },
        error: { icon: 'exclamation-circle', color: '#FF3B30' },
        warning: { icon: 'exclamation-triangle', color: '#FF9500' },
        info: { icon: 'info-circle', color: '#007AFF' }
    }
};

// Configuración de temas
const THEME_CONFIG = {
    default: 'light',
    available: ['light', 'dark', 'auto'],
    colors: {
        light: {
            primary: '#007AFF',
            secondary: '#8E8E93',
            background: '#F2F2F7',
            surface: '#FFFFFF',
            text: '#1C1C1E'
        },
        dark: {
            primary: '#0A84FF',
            secondary: '#8E8E93',
            background: '#000000',
            surface: '#1C1C1E',
            text: '#FFFFFF'
        }
    }
};

// Configuración de accesibilidad
const ACCESSIBILITY_CONFIG = {
    enableKeyboardNavigation: true,
    enableScreenReader: true,
    enableHighContrast: false,
    enableReducedMotion: false,
    fontSize: 'normal', // small, normal, large
    shortcuts: {
        search: 'Ctrl+K',
        newTask: 'Ctrl+N',
        save: 'Ctrl+S',
        cancel: 'Escape',
        help: 'F1'
    }
};

// Configuración de exportación
const EXPORT_CONFIG = {
    formats: ['pdf', 'excel', 'csv'],
    defaultFormat: 'excel',
    includeImages: true,
    includeComments: true,
    maxRows: 10000,
    dateFormat: 'YYYY-MM-DD',
    encoding: 'UTF-8'
};

// Metadatos de la aplicación
const APP_META = {
    name: 'Sistema de Administración de Flota',
    version: '1.0.0',
    description: 'Sistema completo para la gestión de flotas vehiculares',
    author: 'Desarrollador Flota',
    lastUpdated: '2025-01-15',
    minBrowserVersion: {
        chrome: 80,
        firefox: 75,
        safari: 13,
        edge: 80
    },
    dependencies: {
        supabase: '^2.0.0',
        tailwindcss: '^2.2.19',
        fontawesome: '^6.4.0'
    }
};

// Configuración de desarrollo
const DEV_CONFIG = {
    enableDebug: false,
    enableConsoleLogging: true,
    enablePerformanceMonitoring: true,
    apiTimeout: 30000,
    mockData: false,
    bypassAuth: false
};

// Exportar configuraciones para uso global
window.APP_CONFIG = APP_CONFIG;
window.ESTADOS_VEHICULO = ESTADOS_VEHICULO;
window.ESTADOS_TAREA = ESTADOS_TAREA;
window.PRIORIDADES_TAREA = PRIORIDADES_TAREA;
window.ROLES_COLABORADOR = ROLES_COLABORADOR;
window.TIPOS_ARCHIVO = TIPOS_ARCHIVO;
window.FORM_CONSTANTS = FORM_CONSTANTS;
window.MESSAGES = MESSAGES;
window.PERFORMANCE_CONFIG = PERFORMANCE_CONFIG;
window.NOTIFICATION_CONFIG = NOTIFICATION_CONFIG;
window.THEME_CONFIG = THEME_CONFIG;
window.ACCESSIBILITY_CONFIG = ACCESSIBILITY_CONFIG;
window.EXPORT_CONFIG = EXPORT_CONFIG;
window.APP_META = APP_META;
window.DEV_CONFIG = DEV_CONFIG;