// =====================================================
// SISTEMA DE PESTAÑAS PARA VEHÍCULOS
// =====================================================

class VehiculoTabsManager {
    constructor() {
        this.currentTab = 'general';
        this.currentVehiculoId = null;
        this.currentVehiculo = null;
        this.setupTabNavigation();
        this.setupEventListeners();
    }

    setupTabNavigation() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            }
        });
    }

    setupEventListeners() {
        // Event listeners para filtros y controles
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('tareas-filtro')) {
                this.filterTareas();
            }
            if (e.target.classList.contains('inspecciones-filtro')) {
                this.filterInspecciones();
            }
            if (e.target.classList.contains('kilometraje-filtro')) {
                this.filterKilometraje();
            }
            if (e.target.classList.contains('gps-filtro')) {
                this.filterGPS();
            }
            if (e.target.classList.contains('repuestos-filtro')) {
                this.filterRepuestos();
            }
        });

        // Event listener para mensajes de bitácora
        document.addEventListener('keypress', (e) => {
            if (e.target.classList.contains('bitacora-input') && e.key === 'Enter') {
                this.enviarMensajeBitacora();
            }
        });
    }

    switchTab(tabName) {
        console.log(`🔄 Cambiando a pestaña: ${tabName}`);
        
        // Remover clase active de todos los botones y panes
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        // Activar el botón y pane seleccionado
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        const activePane = document.querySelector(`[data-tab-pane="${tabName}"]`);

        if (activeButton && activePane) {
            activeButton.classList.add('active');
            activePane.classList.add('active');
            this.currentTab = tabName;
            this.loadTabContent(tabName);
            console.log(`✅ Pestaña ${tabName} activada correctamente`);
        } else {
            console.warn(`⚠️ No se encontraron elementos para la pestaña: ${tabName}`);
        }
    }

    loadTabContent(tabName) {
        // Cargar contenido específico de cada pestaña si es necesario
        switch (tabName) {
            case 'general':
                // La información general ya está cargada en el HTML
                // Solo necesitamos asegurar que esté visible
                this.loadGeneralInfo();
                break;
            case 'galeria':
                this.loadGaleria();
                break;
            case 'tareas':
                this.loadTareas();
                break;
            case 'inspecciones':
                this.loadInspecciones();
                break;
            case 'bitacora':
                this.loadBitacora();
                break;
            case 'kilometraje':
                this.loadKilometraje();
                break;
            case 'gps':
                this.loadGPS();
                break;
            case 'repuestos':
                this.loadRepuestos();
                break;
        }
    }

    // ========================================
    // INFORMACIÓN GENERAL
    // ========================================
    loadGeneralInfo() {
        // La información general ya está cargada en el HTML
        // Esta función puede ser usada para refrescar o actualizar datos si es necesario
        console.log('✅ Información general cargada');
    }

    // ========================================
    // GALERÍA
    // ========================================
    async loadGaleria() {
        const galeriaContainer = document.querySelector('[data-tab-pane="galeria"] .galeria-content');
        if (!galeriaContainer) return;

        galeriaContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando galería...</div>';

        try {
            const response = await window.api.getVehiculoFotos(this.currentVehiculoId);
            if (response.success) {
                this.renderGaleria(response.data, galeriaContainer);
            } else {
                galeriaContainer.innerHTML = `<div class="alert alert-warning">${response.error}</div>`;
            }
        } catch (error) {
            galeriaContainer.innerHTML = '<div class="alert alert-danger">Error cargando galería</div>';
        }
    }

    renderGaleria(fotos, container) {
        if (!fotos || fotos.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-images fa-3x mb-3"></i>
                    <p>No hay fotos en la galería</p>
                    <button class="btn btn-primary" onclick="window.vehiculoTabsManager.uploadFoto()">
                        <i class="fas fa-upload"></i> Subir Primera Foto
                    </button>
                </div>
            `;
            return;
        }

        const fotosHTML = fotos.map(foto => `
            <div class="col-md-4 col-lg-3 mb-3">
                <div class="card h-100">
                    <img src="${foto.url_archivo}" class="card-img-top" alt="${foto.nombre_archivo}" 
                         style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h6 class="card-title">${foto.nombre_archivo}</h6>
                        <p class="card-text small">${foto.descripcion || 'Sin descripción'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Orden: ${foto.orden}</small>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="window.vehiculoTabsManager.editarFoto('${foto.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="window.vehiculoTabsManager.deleteFoto('${foto.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="row">
                ${fotosHTML}
            </div>
            <div class="text-center mt-3">
                <button class="btn btn-success" onclick="window.vehiculoTabsManager.uploadFoto()">
                    <i class="fas fa-plus"></i> Agregar Foto
                </button>
            </div>
        `;
    }

    // ========================================
    // TAREAS
    // ========================================
    async loadTareas() {
        const tareasContainer = document.querySelector('[data-tab-pane="tareas"] .tareas-content');
        if (!tareasContainer) return;

        tareasContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando tareas...</div>';

        try {
            const response = await window.api.getVehiculoTareas(this.currentVehiculoId);
            if (response.success) {
                this.renderTareas(response.data, tareasContainer);
            } else {
                tareasContainer.innerHTML = `<div class="alert alert-warning">${response.error}</div>`;
            }
        } catch (error) {
            tareasContainer.innerHTML = '<div class="alert alert-danger">Error cargando tareas</div>';
        }
    }

    renderTareas(tareas, container) {
        if (!tareas || tareas.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-tasks fa-3x mb-3"></i>
                    <p>No hay tareas para este vehículo</p>
                    <button class="btn btn-primary" onclick="window.vehiculoTabsManager.crearTareaVehiculo()">
                        <i class="fas fa-plus"></i> Crear Tarea
                    </button>
                </div>
            `;
            return;
        }

        const tareasHTML = tareas.map(tarea => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <h6 class="card-title">${tarea.titulo}</h6>
                        <span class="badge bg-${this.getEstadoColor(tarea.estado)}">${tarea.estado}</span>
                    </div>
                    <p class="card-text">${tarea.descripcion || 'Sin descripción'}</p>
                    <div class="row">
                        <div class="col-md-6">
                            <small class="text-muted">
                                <i class="fas fa-user"></i> ${tarea.asignado_a_nombre || 'Sin asignar'}
                            </small>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted">
                                <i class="fas fa-calendar"></i> ${new Date(tarea.created_at).toLocaleDateString()}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="tareas-list">
                ${tareasHTML}
            </div>
            <div class="text-center mt-3">
                <button class="btn btn-primary" onclick="window.vehiculoTabsManager.crearTareaVehiculo()">
                    <i class="fas fa-plus"></i> Nueva Tarea
                </button>
            </div>
        `;
    }

    getEstadoColor(estado) {
        const colores = {
            'pendiente': 'warning',
            'en_proceso': 'info',
            'completada': 'success',
            'cancelada': 'secondary'
        };
        return colores[estado] || 'secondary';
    }

    // ========================================
    // INSPECCIONES
    // ========================================
    async loadInspecciones() {
        const inspeccionesContainer = document.querySelector('[data-tab-pane="inspecciones"] .inspecciones-content');
        if (!inspeccionesContainer) return;

        inspeccionesContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando inspecciones...</div>';

        try {
            const [machotesResponse, inspeccionesResponse] = await Promise.all([
                window.api.getInspeccionMachotes(),
                window.api.getVehiculoInspecciones(this.currentVehiculoId)
            ]);

            if (machotesResponse.success && inspeccionesResponse.success) {
                this.renderInspecciones(machotesResponse.data, inspeccionesResponse.data, inspeccionesContainer);
            } else {
                inspeccionesContainer.innerHTML = `<div class="alert alert-warning">Error cargando datos</div>`;
            }
        } catch (error) {
            inspeccionesContainer.innerHTML = '<div class="alert alert-danger">Error cargando inspecciones</div>';
        }
    }

    renderInspecciones(machotes, inspecciones, container) {
        const machotesHTML = machotes.map(machote => `
            <option value="${machote.id}">${machote.nombre}</option>
        `).join('');

        const inspeccionesHTML = inspecciones && inspecciones.length > 0 ? inspecciones.map(inspeccion => `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">${inspeccion.titulo}</h6>
                    <span class="badge bg-${this.getEstadoColor(inspeccion.estado)}">${inspeccion.estado}</span>
                </div>
                <div class="card-body">
                    <p class="card-text">${inspeccion.descripcion || 'Sin descripción'}</p>
                    <div class="row">
                        <div class="col-md-6">
                            <small class="text-muted">
                                <i class="fas fa-user"></i> ${inspeccion.inspector_nombre}
                            </small>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted">
                                <i class="fas fa-calendar"></i> ${new Date(inspeccion.fecha_inspeccion).toLocaleDateString()}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('') : '<p class="text-muted">No hay inspecciones registradas</p>';

        container.innerHTML = `
            <div class="mb-3">
                <button class="btn btn-primary" onclick="window.vehiculoTabsManager.nuevaInspeccion()">
                    <i class="fas fa-plus"></i> Nueva Inspección
                </button>
            </div>
            <div class="inspecciones-list">
                ${inspeccionesHTML}
            </div>
        `;
    }

    // ========================================
    // BITÁCORA
    // ========================================
    async loadBitacora() {
        const bitacoraContainer = document.querySelector('[data-tab-pane="bitacora"] .bitacora-content');
        if (!bitacoraContainer) return;

        bitacoraContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando bitácora...</div>';

        try {
            const response = await window.api.getVehiculoBitacora(this.currentVehiculoId);
            if (response.success) {
                this.renderBitacora(response.data, bitacoraContainer);
            } else {
                bitacoraContainer.innerHTML = `<div class="alert alert-warning">${response.error}</div>`;
            }
        } catch (error) {
            bitacoraContainer.innerHTML = '<div class="alert alert-danger">Error cargando bitácora</div>';
        }
    }

    renderBitacora(mensajes, container) {
        const mensajesHTML = mensajes && mensajes.length > 0 ? mensajes.map(mensaje => `
            <div class="mensaje ${mensaje.usuario_id === window.api.currentUser?.id ? 'mensaje-propio' : 'mensaje-otro'}">
                <div class="mensaje-header">
                    <strong>${mensaje.usuario_nombre}</strong>
                    <small class="text-muted">${new Date(mensaje.created_at).toLocaleString()}</small>
                </div>
                <div class="mensaje-contenido">
                    <p>${mensaje.mensaje}</p>
                    ${mensaje.contenido_url ? `<img src="${mensaje.contenido_url}" class="img-fluid rounded" alt="Adjunto">` : ''}
                </div>
            </div>
        `).join('') : '<p class="text-muted">No hay mensajes en la bitácora</p>';

        container.innerHTML = `
            <div class="bitacora-mensajes">
                ${mensajesHTML}
            </div>
            <div class="bitacora-input-group mt-3">
                <div class="input-group">
                    <input type="text" class="form-control bitacora-input" placeholder="Escribe un mensaje...">
                    <button class="btn btn-primary" onclick="window.vehiculoTabsManager.enviarMensajeBitacora()">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                    <button class="btn btn-outline-secondary" onclick="window.vehiculoTabsManager.adjuntarArchivoBitacora()">
                        <i class="fas fa-paperclip"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // ========================================
    // KILOMETRAJE
    // ========================================
    async loadKilometraje() {
        const kilometrajeContainer = document.querySelector('[data-tab-pane="kilometraje"] .kilometraje-content');
        if (!kilometrajeContainer) return;

        kilometrajeContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando kilometraje...</div>';

        try {
            const response = await window.api.getVehiculoKilometraje(this.currentVehiculoId);
            if (response.success) {
                this.renderKilometraje(response.data, kilometrajeContainer);
            } else {
                kilometrajeContainer.innerHTML = `<div class="alert alert-warning">${response.error}</div>`;
            }
        } catch (error) {
            kilometrajeContainer.innerHTML = '<div class="alert alert-danger">Error cargando kilometraje</div>';
        }
    }

    renderKilometraje(registros, container) {
        if (!registros || registros.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-tachometer-alt fa-3x mb-3"></i>
                    <p>No hay registros de kilometraje</p>
                    <button class="btn btn-primary" onclick="window.vehiculoTabsManager.nuevoRegistroKilometraje()">
                        <i class="fas fa-plus"></i> Primer Registro
                    </button>
                </div>
            `;
            return;
        }

        const registrosHTML = registros.map(registro => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="card-title">
                            <i class="fas fa-tachometer-alt"></i> 
                            ${registro.valor} ${registro.unidad}
                        </h6>
                        <span class="badge bg-info">${registro.tipo_registro}</span>
                    </div>
                    <p class="card-text">${registro.observaciones || 'Sin observaciones'}</p>
                    <div class="row">
                        <div class="col-md-6">
                            <small class="text-muted">
                                <i class="fas fa-user"></i> ${registro.usuario_nombre}
                            </small>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted">
                                <i class="fas fa-calendar"></i> ${new Date(registro.fecha_registro).toLocaleString()}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="kilometraje-registros">
                ${registrosHTML}
            </div>
            <div class="text-center mt-3">
                <button class="btn btn-primary" onclick="window.vehiculoTabsManager.nuevoRegistroKilometraje()">
                    <i class="fas fa-plus"></i> Nuevo Registro
                </button>
            </div>
        `;
    }

    // ========================================
    // GPS
    // ========================================
    async loadGPS() {
        const gpsContainer = document.querySelector('[data-tab-pane="gps"] .gps-content');
        if (!gpsContainer) return;

        gpsContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando dispositivos GPS...</div>';

        try {
            const response = await window.api.getVehiculoGPS(this.currentVehiculoId);
            if (response.success) {
                this.renderGPS(response.data, gpsContainer);
            } else {
                gpsContainer.innerHTML = `<div class="alert alert-warning">${response.error}</div>`;
            }
        } catch (error) {
            gpsContainer.innerHTML = '<div class="alert alert-danger">Error cargando dispositivos GPS</div>';
        }
    }

    renderGPS(dispositivos, container) {
        if (!dispositivos || dispositivos.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-satellite fa-3x mb-3"></i>
                    <p>No hay dispositivos GPS registrados</p>
                    <button class="btn btn-primary" onclick="window.vehiculoTabsManager.nuevoDispositivoGPS()">
                        <i class="fas fa-plus"></i> Agregar Dispositivo
                    </button>
                </div>
            `;
            return;
        }

        const dispositivosHTML = dispositivos.map(dispositivo => `
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="fas fa-satellite"></i> ${dispositivo.modelo}
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Serie:</strong> ${dispositivo.numero_serie}</p>
                            <p><strong>SIM:</strong> ${dispositivo.numero_sim}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Estado:</strong> 
                                <span class="badge bg-${dispositivo.estado === 'activo' ? 'success' : 'secondary'}">
                                    ${dispositivo.estado}
                                </span>
                            </p>
                            <p><strong>Instalado por:</strong> ${dispositivo.instalado_por_nombre}</p>
                        </div>
                    </div>
                    ${dispositivo.observaciones ? `<p><strong>Observaciones:</strong> ${dispositivo.observaciones}</p>` : ''}
                    
                    <div class="gps-comentarios mt-3">
                        <h6>Comentarios:</h6>
                        ${this.renderComentariosGPS(dispositivo.gps_comentarios)}
                        <button class="btn btn-sm btn-outline-primary mt-2" 
                                onclick="window.vehiculoTabsManager.agregarComentarioGPS('${dispositivo.id}')">
                            <i class="fas fa-comment"></i> Agregar Comentario
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="gps-dispositivos">
                ${dispositivosHTML}
            </div>
            <div class="text-center mt-3">
                <button class="btn btn-primary" onclick="window.vehiculoTabsManager.nuevoDispositivoGPS()">
                    <i class="fas fa-plus"></i> Nuevo Dispositivo
                </button>
            </div>
        `;
    }

    renderComentariosGPS(comentarios) {
        if (!comentarios || comentarios.length === 0) {
            return '<p class="text-muted">No hay comentarios</p>';
        }

        return comentarios.map(comentario => `
            <div class="comentario-gps border-start border-2 ps-3 mb-2">
                <small class="text-muted">${comentario.usuario_nombre} - ${new Date(comentario.created_at).toLocaleString()}</small>
                <p class="mb-1">${comentario.comentario}</p>
                ${comentario.contenido_url ? `<img src="${comentario.contenido_url}" class="img-fluid rounded" style="max-width: 200px;">` : ''}
            </div>
        `).join('');
    }

    // ========================================
    // REPUESTOS
    // ========================================
    async loadRepuestos() {
        const repuestosContainer = document.querySelector('[data-tab-pane="repuestos"] .repuestos-content');
        if (!repuestosContainer) return;

        repuestosContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando solicitudes...</div>';

        try {
            const response = await window.api.getSolicitudesRepuestos({ vehiculo_id: this.currentVehiculoId });
            if (response.success) {
                this.renderRepuestos(response.data, repuestosContainer);
            } else {
                repuestosContainer.innerHTML = `<div class="alert alert-warning">${response.error}</div>`;
            }
        } catch (error) {
            repuestosContainer.innerHTML = '<div class="alert alert-danger">Error cargando solicitudes</div>';
        }
    }

    renderRepuestos(solicitudes, container) {
        if (!solicitudes || solicitudes.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-tools fa-3x mb-3"></i>
                    <p>No hay solicitudes de repuestos</p>
                    <button class="btn btn-primary" onclick="window.vehiculoTabsManager.nuevaSolicitudRepuesto()">
                        <i class="fas fa-plus"></i> Nueva Solicitud
                    </button>
                </div>
            `;
            return;
        }

        const solicitudesHTML = solicitudes.map(solicitud => `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">${solicitud.titulo}</h6>
                    <div>
                        <span class="badge bg-${this.getEstadoColor(solicitud.estado)} me-2">${solicitud.estado}</span>
                        <span class="badge bg-${this.getPrioridadColor(solicitud.prioridad)}">${solicitud.prioridad}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Repuesto:</strong> ${solicitud.nombre_repuesto}</p>
                            <p><strong>Número de parte:</strong> ${solicitud.numero_parte || 'N/A'}</p>
                            <p><strong>Cantidad:</strong> ${solicitud.cantidad_solicitada}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Solicitante:</strong> ${solicitud.solicitante_nombre}</p>
                            <p><strong>Responsable:</strong> ${solicitud.responsable_nombre || 'Sin asignar'}</p>
                            <p><strong>Fecha requerida:</strong> ${solicitud.fecha_requerida ? new Date(solicitud.fecha_requerida).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                    ${solicitud.descripcion ? `<p><strong>Descripción:</strong> ${solicitud.descripcion}</p>` : ''}
                    ${solicitud.observaciones ? `<p><strong>Observaciones:</strong> ${solicitud.observaciones}</p>` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="repuestos-solicitudes">
                ${solicitudesHTML}
            </div>
            <div class="text-center mt-3">
                <button class="btn btn-primary" onclick="window.vehiculoTabsManager.nuevaSolicitudRepuesto()">
                    <i class="fas fa-plus"></i> Nueva Solicitud
                </button>
            </div>
        `;
    }

    getPrioridadColor(prioridad) {
        const colores = {
            'baja': 'success',
            'media': 'warning',
            'alta': 'danger',
            'urgente': 'dark'
        };
        return colores[prioridad] || 'secondary';
    }

    // ========================================
    // FUNCIONES DE ACCIÓN
    // ========================================
    async uploadFoto() {
        // Implementar lógica de subida de fotos
        this.showInfo('Funcionalidad de subida de fotos en desarrollo');
    }

    async crearTareaVehiculo() {
        // Implementar creación de tareas
        this.showInfo('Funcionalidad de creación de tareas en desarrollo');
    }

    async nuevaInspeccion() {
        // Implementar nueva inspección
        this.showInfo('Funcionalidad de nueva inspección en desarrollo');
    }

    async enviarMensajeBitacora() {
        const input = document.querySelector('.bitacora-input');
        if (!input || !input.value.trim()) return;

        const mensaje = input.value.trim();
        input.value = '';

        try {
            const response = await window.api.enviarMensajeBitacora({
                vehiculo_id: this.currentVehiculoId,
                mensaje: mensaje
            });

            if (response.success) {
                this.loadBitacora(); // Recargar bitácora
                this.showSuccess('Mensaje enviado correctamente');
            } else {
                this.showError('Error enviando mensaje: ' + response.error);
            }
        } catch (error) {
            this.showError('Error enviando mensaje');
        }
    }

    async nuevoRegistroKilometraje() {
        // Implementar nuevo registro de kilometraje
        this.showInfo('Funcionalidad de nuevo registro de kilometraje en desarrollo');
    }

    async nuevoDispositivoGPS() {
        // Implementar nuevo dispositivo GPS
        this.showInfo('Funcionalidad de nuevo dispositivo GPS en desarrollo');
    }

    async nuevaSolicitudRepuesto() {
        // Implementar nueva solicitud de repuesto
        this.showInfo('Funcionalidad de nueva solicitud de repuesto en desarrollo');
    }

    // ========================================
    // FUNCIONES DE FILTRADO
    // ========================================
    filterTareas() {
        // Implementar filtrado de tareas
        this.loadTareas();
    }

    filterInspecciones() {
        // Implementar filtrado de inspecciones
        this.loadInspecciones();
    }

    filterKilometraje() {
        // Implementar filtrado de kilometraje
        this.loadKilometraje();
    }

    filterGPS() {
        // Implementar filtrado de GPS
        this.loadGPS();
    }

    filterRepuestos() {
        // Implementar filtrado de repuestos
        this.loadRepuestos();
    }

    // ========================================
    // FUNCIONES DE REFRESH
    // ========================================
    refreshGaleria() {
        this.loadGaleria();
    }

    refreshTareasVehiculo() {
        this.loadTareas();
    }

    refreshInspecciones() {
        this.loadInspecciones();
    }

    refreshBitacora() {
        this.loadBitacora();
    }

    refreshKilometraje() {
        this.loadKilometraje();
    }

    refreshGPS() {
        this.loadGPS();
    }

    refreshRepuestos() {
        this.loadRepuestos();
    }

    // ========================================
    // FUNCIONES UTILITARIAS
    // ========================================
    manageMachotes() {
        this.showInfo('Gestión de machotes en desarrollo');
    }

    adjuntarArchivoBitacora() {
        this.showInfo('Adjuntar archivo en desarrollo');
    }

    setVehiculoId(id) {
        this.currentVehiculoId = id;
        // Cargar datos del vehículo si es necesario
        this.loadCurrentVehiculoData();
    }

    initializeTabs() {
        // Asegurar que la primera pestaña esté activa
        const firstTab = document.querySelector('.tab-button[data-tab="general"]');
        const firstPane = document.querySelector('.tab-pane[data-tab-pane="general"]');
        
        if (firstTab && firstPane) {
            // Remover active de todos
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // Activar la primera pestaña
            firstTab.classList.add('active');
            firstPane.classList.add('active');
            
            console.log('✅ Pestañas inicializadas correctamente');
        } else {
            console.warn('⚠️ No se encontraron elementos de pestañas para inicializar');
        }
    }

    async loadCurrentVehiculoData() {
        if (!this.currentVehiculoId) return;
        
        try {
            // Aquí podrías cargar datos adicionales del vehículo si es necesario
            // Por ahora solo establecemos el ID
        } catch (error) {
            console.error('Error cargando datos del vehículo:', error);
        }
    }

    showError(message) {
        if (window.app && window.app.showToast) {
            window.app.showToast(message, 'error');
        } else {
            console.error(message);
        }
    }

    showSuccess(message) {
        if (window.app && window.app.showToast) {
            window.app.showToast(message, 'success');
        } else {
            console.log(message);
        }
    }

    showInfo(message) {
        if (window.app && window.app.showToast) {
            window.app.showToast(message, 'info');
        } else {
            console.log(message);
        }
    }
}

// Crear instancia global
window.vehiculoTabsManager = new VehiculoTabsManager();
