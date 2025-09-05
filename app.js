// Aplicación principal mejorada - SISTEMA COMPLETO CON COMENTARIOS Y ADJUNTOS + COMPLETAR TAREA
class FlotaApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentModal = null;
        this.editingItem = null;
        this.modalManager = new ModalManager();
        this.loadingStates = new Map();
        this.debounceTimers = new Map();
        this.currentTareaId = null; // Para manejar la tarea actual en detalle
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            await this.loadDashboard();
            this.showToast('Sistema cargado correctamente', 'success');
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showToast('Error al cargar el sistema', 'error');
        }
    }

    setupEventListeners() {
        // Búsquedas con debounce mejorado
        this.setupSearchListeners();

        // Filtros
        this.setupFilterListeners();

        // Modal listeners
        this.setupModalListeners();

        // Network status
        this.setupNetworkListeners();
    }

    setupSearchListeners() {
        const searchInputs = [
            { id: 'search-arrendadoras', callback: () => this.filterArrendadoras() },
            { id: 'search-vehiculos', callback: () => this.filterVehiculos() },
            { id: 'search-colaboradores', callback: () => this.filterColaboradores() },
            { id: 'search-tareas', callback: () => this.filterTareas() },
            { id: 'search-marcas', callback: () => this.filterMarcas() },
            { id: 'search-modelos', callback: () => this.filterModelos() },
            { id: 'search-estados', callback: () => this.filterEstados() }
        ];

        searchInputs.forEach(({ id, callback }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.debounce(id, callback, APP_CONFIG.debounceDelay);
                });
                element.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.clearDebounce(id);
                        callback();
                    }
                });
            }
        });
    }

    setupFilterListeners() {
        const filters = [
            { id: 'filter-arrendadora', callback: () => this.filterVehiculos() },
            { id: 'filter-estado', callback: () => this.filterVehiculos() },
            { id: 'filter-marca-modelo', callback: () => this.filterModelos() },
            { id: 'filter-tarea-estado', callback: () => this.filterTareas() },
            { id: 'filter-tarea-prioridad', callback: () => this.filterTareas() },
            { id: 'filter-tarea-responsable', callback: () => this.filterTareas() }
        ];

        filters.forEach(({ id, callback }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', callback);
            }
        });
    }

    setupModalListeners() {
        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeModal();
            }
            if (e.key === 'Escape') {
                this.closeTareaDetailModal();
            }
        });

        // Cerrar modal con click fuera
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-backdrop') || e.target.id === 'modal-overlay') {
                    this.closeModal();
                }
            });
        }

        // Cerrar modal de detalles de tarea
        const tareaDetailModal = document.getElementById('tarea-detail-modal');
        if (tareaDetailModal) {
            tareaDetailModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-backdrop') || e.target.id === 'tarea-detail-modal') {
                    this.closeTareaDetailModal();
                }
            });
        }
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.showToast('Conexión restaurada', 'success');
            this.refreshCurrentSection();
        });

        window.addEventListener('offline', () => {
            this.showToast('Sin conexión a internet', 'warning');
        });
    }

    // ===== UTILIDADES =====
    debounce(id, func, wait) {
        this.clearDebounce(id);
        this.debounceTimers.set(id, setTimeout(func, wait));
    }

    clearDebounce(id) {
        const timer = this.debounceTimers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.debounceTimers.delete(id);
        }
    }

    setLoading(key, isLoading) {
        this.loadingStates.set(key, isLoading);
        this.updateLoadingUI(key, isLoading);
    }

    updateLoadingUI(key, isLoading) {
        const loadingElement = document.querySelector(`[data-loading="${key}"]`);
        if (loadingElement) {
            if (isLoading) {
                loadingElement.classList.add('loading');
            } else {
                loadingElement.classList.remove('loading');
            }
        }
    }

    // ===== NAVEGACIÓN =====
    showSection(sectionName) {
        try {
            // Ocultar todas las secciones
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });

            // Mostrar la sección seleccionada
            const targetSection = document.getElementById(sectionName);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Actualizar navegación
            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.classList.remove('active');
            });

            const activeButton = document.querySelector(`[data-section="${sectionName}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }

            this.currentSection = sectionName;

            // Cargar datos según la sección
            this.loadSectionData(sectionName);
        } catch (error) {
            console.error('Error showing section:', error);
            this.showToast('Error al cargar la sección', 'error');
        }
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'arrendadoras':
                await this.loadArrendadoras();
                break;
            case 'vehiculos':
                await this.loadVehiculos();
                break;
            case 'colaboradores':
                await this.loadColaboradores();
                break;
            case 'tareas':
                await this.loadTareas();
                break;
            case 'marcas':
                await this.loadMarcas();
                break;
            case 'modelos':
                await this.loadModelos();
                break;
            case 'estados':
                await this.loadEstados();
                break;
        }
    }

    async refreshCurrentSection() {
        await this.loadSectionData(this.currentSection);
    }

    // ===== DASHBOARD =====
    async loadDashboard() {
        this.setLoading('dashboard', true);
        try {
            const stats = await api.getEstadisticas();

            // Actualizar contadores con animación
            this.animateCounter('total-arrendadoras', stats.totalArrendadoras);
            this.animateCounter('total-vehiculos', stats.totalVehiculos);
            this.animateCounter('total-colaboradores', stats.totalColaboradores);
            this.animateCounter('total-tareas', stats.totalTareas);

            // Actualizar estado de tareas
            this.animateCounter('tareas-pendientes', stats.tareas.pendientes);
            this.animateCounter('tareas-en-progreso', stats.tareas.enProgreso);
            this.animateCounter('tareas-completadas', stats.tareas.completadas);

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showToast('Error al cargar el dashboard', 'error');
        } finally {
            this.setLoading('dashboard', false);
        }
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // ===== ARRENDADORAS =====
    async loadArrendadoras() {
        this.setLoading('arrendadoras', true);
        try {
            const arrendadoras = await api.getArrendadoras();
            this.renderArrendadorasTable(arrendadoras);
        } catch (error) {
            console.error('Error loading arrendadoras:', error);
            this.showToast('Error al cargar arrendadoras', 'error');
        } finally {
            this.setLoading('arrendadoras', false);
        }
    }

    renderArrendadorasTable(arrendadoras) {
        const tbody = document.getElementById('arrendadoras-table');
        if (!tbody) return;

        if (arrendadoras.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="text-center py-5">
                            <i class="fas fa-building fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No hay empresas registradas</p>
                            <button onclick="app.openModal('arrendadora')" class="btn btn-primary mt-3">
                                Crear primera empresa
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = arrendadoras.map(arrendadora => `
            <tr>
                <td class="text-muted small">#${arrendadora.id}</td>
                <td class="fw-medium">${this.escapeHtml(arrendadora.nombre)}</td>
                <td class="text-muted small">${arrendadora.identificacion_juridica || '-'}</td>
                <td>
                    <div class="d-flex gap-2">
                        <button onclick="app.editArrendadora(${arrendadora.id})" 
                                class="btn btn-sm btn-outline-primary"
                                title="Editar arrendadora">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.deleteArrendadora(${arrendadora.id})" 
                                class="btn btn-sm btn-outline-danger"
                                title="Eliminar arrendadora">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async filterArrendadoras() {
        const searchTerm = document.getElementById('search-arrendadoras')?.value?.toLowerCase() || '';

        try {
            const arrendadoras = await api.getArrendadoras();
            const filtered = arrendadoras.filter(a =>
                a.nombre.toLowerCase().includes(searchTerm) ||
                (a.identificacion_juridica && a.identificacion_juridica.toLowerCase().includes(searchTerm))
            );
            this.renderArrendadorasTable(filtered);
        } catch (error) {
            console.error('Error filtering arrendadoras:', error);
        }
    }

    // ===== VEHÍCULOS =====
    async loadVehiculos() {
        this.setLoading('vehiculos', true);
        try {
            const filters = this.getVehiculosFilters();
            const [vehiculos] = await Promise.all([
                api.getVehiculos(filters),
                this.loadVehiculosFilters()
            ]);
            this.renderVehiculosGrid(vehiculos);
        } catch (error) {
            console.error('Error loading vehiculos:', error);
            this.showToast('Error al cargar vehículos', 'error');
        } finally {
            this.setLoading('vehiculos', false);
        }
    }

    getVehiculosFilters() {
        return {
            arrendadora_id: document.getElementById('filter-arrendadora')?.value || '',
            estado_inventario_id: document.getElementById('filter-estado')?.value || '',
            search: document.getElementById('search-vehiculos')?.value || ''
        };
    }

    async loadVehiculosFilters() {
        try {
            const [arrendadoras, estados] = await Promise.all([
                api.getArrendadoras(),
                api.getEstadosInventario()
            ]);

            // Llenar filtro de arrendadoras
            const arrendadoraSelect = document.getElementById('filter-arrendadora');
            if (arrendadoraSelect) {
                const currentValue = arrendadoraSelect.value;
                arrendadoraSelect.innerHTML = '<option value="">Todas las empresas</option>' +
                    arrendadoras.map(a => `<option value="${a.id}" ${currentValue == a.id ? 'selected' : ''}>${this.escapeHtml(a.nombre)}</option>`).join('');
            }

            // Llenar filtro de estados
            const estadoSelect = document.getElementById('filter-estado');
            if (estadoSelect) {
                const currentValue = estadoSelect.value;
                estadoSelect.innerHTML = '<option value="">Todos los estados</option>' +
                    estados.map(e => `<option value="${e.id}" ${currentValue == e.id ? 'selected' : ''}>${this.escapeHtml(e.nombre)}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    }

    renderVehiculosGrid(vehiculos) {
        const grid = document.getElementById('vehiculos-grid');
        if (!grid) return;

        if (vehiculos.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-car fa-3x text-muted mb-3"></i>
                    <div class="h5 mb-2">No hay vehículos registrados</div>
                    <div class="text-muted mb-3">Crea tu primer vehículo para comenzar</div>
                    <button onclick="app.openModal('vehiculo')" class="btn btn-primary">
                        <i class="fas fa-plus me-2"></i>
                        <span>Crear Vehículo</span>
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = vehiculos.map(vehiculo => this.renderVehiculoCard(vehiculo)).join('');
    }

    renderVehiculoCard(vehiculo) {
        const estadoClass = api.getStatusBadgeClass(vehiculo.estado_inventario_id);

        return `
            <div class="col-lg-4 col-md-6 mb-4" data-vehicle-id="${vehiculo.id}">
                <div class="card h-100 vehicle-card-clickable" onclick="app.openVehiculoDetail(${vehiculo.id})" style="cursor: pointer;">
                    <!-- Header de la tarjeta -->
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <div class="h5 mb-1">${this.escapeHtml(vehiculo.placa)}</div>
                                <div class="text-muted small">
                                    ${this.escapeHtml(vehiculo.marcas?.nombre || 'Sin marca')} 
                                    ${this.escapeHtml(vehiculo.modelos?.nombre || 'Sin modelo')}
                                </div>
                                ${vehiculo.vin ? `<div class="text-muted small">VIN: ${this.escapeHtml(vehiculo.vin)}</div>` : ''}
                            </div>
                            <div class="d-flex flex-column align-items-end gap-1">
                                <span class="badge bg-secondary small">#${vehiculo.id}</span>
                                <span class="badge bg-info small">${vehiculo.anio || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Body de la tarjeta -->
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted small">Arrendadora</span>
                                <span class="fw-medium">${this.escapeHtml(vehiculo.arrendadoras?.nombre || 'Sin asignar')}</span>
                            </div>
                            
                            <div class="d-flex justify-content-between mb-2">
                                <span class="vehicle-card-label">Estado</span>
                                <span class="badge ${estadoClass}">
                                    ${this.escapeHtml(vehiculo.estados_inventario?.nombre || 'Sin estado')}
                                </span>
                            </div>
                            
                            ${vehiculo.precio_semanal ? `
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted small">Precio Semanal</span>
                                <span class="fw-medium">${api.formatCurrency(vehiculo.precio_semanal)}</span>
                            </div>
                            ` : ''}
                            
                            ${vehiculo.gastos_adms ? `
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted small">Gastos Admin</span>
                                <span class="fw-medium">${api.formatCurrency(vehiculo.gastos_adms)}</span>
                            </div>
                            ` : ''}

                            ${vehiculo.link_fotos ? `
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted small">Fotos</span>
                                <a href="${this.escapeHtml(vehiculo.link_fotos)}" target="_blank" class="text-decoration-none" onclick="event.stopPropagation();">
                                    <i class="fas fa-images me-1"></i>Ver galería
                                </a>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Acciones de la tarjeta -->
                    <div class="card-footer">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>
                                ${api.formatDate(vehiculo.created_at)}
                            </small>
                            <div class="btn-group btn-group-sm" onclick="event.stopPropagation();">
                                <button onclick="app.showVehiculoTareas(${vehiculo.id})" 
                                        class="btn btn-outline-info" 
                                        title="Ver tareas del vehículo">
                                    <i class="fas fa-tasks"></i>
                                </button>
                                <button onclick="app.editVehiculo(${vehiculo.id})" 
                                        class="btn btn-outline-primary" 
                                        title="Editar vehículo">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="app.deleteVehiculo(${vehiculo.id})" 
                                        class="btn btn-outline-danger" 
                                        title="Eliminar vehículo">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async filterVehiculos() {
        await this.loadVehiculos();
    }

    async showVehiculoTareas(vehiculoId) {
        try {
            const vehiculo = await api.getVehiculo(vehiculoId);
            if (vehiculo) {
                // Cambiar a sección de tareas y filtrar por vehículo
                this.showSection('tareas');
                // Aplicar filtro después de un pequeño delay para que se cargue la sección
                setTimeout(() => {
                    const searchInput = document.getElementById('search-tareas');
                    if (searchInput) {
                        searchInput.value = vehiculo.placa;
                        this.filterTareas();
                    }
                }, 200);
            }
        } catch (error) {
            console.error('Error showing vehicle tasks:', error);
            this.showToast('Error al cargar las tareas del vehículo', 'error');
        }
    }

    // ===== COLABORADORES =====
    async loadColaboradores() {
        this.setLoading('colaboradores', true);
        try {
            const colaboradores = await api.getColaboradores();
            this.renderColaboradoresTable(colaboradores);
        } catch (error) {
            console.error('Error loading colaboradores:', error);
            this.showToast('Error al cargar colaboradores', 'error');
        } finally {
            this.setLoading('colaboradores', false);
        }
    }

    renderColaboradoresTable(colaboradores) {
        const tbody = document.getElementById('colaboradores-table');
        if (!tbody) return;

        if (colaboradores.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="text-center py-5">
                            <i class="fas fa-users fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No hay colaboradores registrados</p>
                            <button onclick="app.openModal('colaborador')" class="btn btn-primary mt-3">
                                Crear primer colaborador
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = colaboradores.map(colaborador => `
            <tr>
                <td class="text-muted small">#${colaborador.id}</td>
                <td class="fw-medium">${this.escapeHtml(colaborador.nombre)}</td>
                <td class="text-muted small">${this.escapeHtml(colaborador.identificacion)}</td>
                <td>${this.escapeHtml(colaborador.puesto || '-')}</td>
                <td>
                    <span class="badge ${colaborador.activo ? 'bg-success' : 'bg-secondary'}">
                        ${colaborador.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="d-flex gap-2">
                        <button onclick="app.editColaborador(${colaborador.id})" 
                                class="btn btn-sm btn-outline-primary"
                                title="Editar colaborador">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.deleteColaborador(${colaborador.id})" 
                                class="btn btn-sm btn-outline-danger"
                                title="Eliminar colaborador">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async filterColaboradores() {
        const searchTerm = document.getElementById('search-colaboradores')?.value?.toLowerCase() || '';

        try {
            const colaboradores = await api.getColaboradores();
            const filtered = colaboradores.filter(c =>
                c.nombre.toLowerCase().includes(searchTerm) ||
                c.identificacion.toLowerCase().includes(searchTerm) ||
                (c.puesto && c.puesto.toLowerCase().includes(searchTerm))
            );
            this.renderColaboradoresTable(filtered);
        } catch (error) {
            console.error('Error filtering colaboradores:', error);
        }
    }

    // ===== TAREAS =====
    async loadTareas() {
        this.setLoading('tareas', true);
        try {
            const filters = this.getTareasFilters();
            const [tareas] = await Promise.all([
                api.getTareas(filters),
                this.loadTareasFilters()
            ]);
            this.renderTareasGrid(tareas);
        } catch (error) {
            console.error('Error loading tareas:', error);
            this.showToast('Error al cargar tareas', 'error');
        } finally {
            this.setLoading('tareas', false);
        }
    }

    getTareasFilters() {
        return {
            estado: document.getElementById('filter-tarea-estado')?.value || '',
            prioridad: document.getElementById('filter-tarea-prioridad')?.value || '',
            responsable_id: document.getElementById('filter-tarea-responsable')?.value || '',
            search: document.getElementById('search-tareas')?.value || ''
        };
    }

    async loadTareasFilters() {
        try {
            const colaboradores = await api.getColaboradores();

            // Llenar filtro de responsables
            const responsableSelect = document.getElementById('filter-tarea-responsable');
            if (responsableSelect) {
                const currentValue = responsableSelect.value;
                responsableSelect.innerHTML = '<option value="">Todos los responsables</option>' +
                    colaboradores.filter(c => c.activo).map(c =>
                        `<option value="${c.id}" ${currentValue == c.id ? 'selected' : ''}>${this.escapeHtml(c.nombre)}</option>`
                    ).join('');
            }
        } catch (error) {
            console.error('Error loading tareas filters:', error);
        }
    }

    renderTareasGrid(tareas) {
        const grid = document.getElementById('tareas-grid');
        if (!grid) return;

        if (tareas.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-tasks fa-3x text-muted mb-3"></i>
                    <div class="h5 mb-2">No hay tareas registradas</div>
                    <div class="text-muted mb-3">Crea tu primera tarea para comenzar</div>
                    <button onclick="app.openModal('tarea')" class="btn btn-primary">
                        <i class="fas fa-plus me-2"></i>
                        <span>Crear Tarea</span>
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = tareas.map(tarea => this.renderTareaCard(tarea)).join('');
    }

    renderTareaCard(tarea) {
        const estadoClass = api.getTareaStatusBadgeClass(tarea.estado);
        const prioridadClass = api.getTareaPrioridadBadgeClass(tarea.prioridad);

        return `
            <div class="col-lg-4 col-md-6 mb-4" data-tarea-id="${tarea.id}">
                <div class="card h-100">
                    <!-- Header de la tarjeta -->
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <div class="h6 mb-1">${this.escapeHtml(tarea.titulo)}</div>
                                <div class="text-muted small">
                                    <i class="fas fa-car me-1"></i>
                                    ${this.escapeHtml(tarea.vehiculos?.placa || 'Sin vehículo')}
                                    ${tarea.vehiculos?.marcas?.nombre ? `- ${this.escapeHtml(tarea.vehiculos.marcas.nombre)}` : ''}
                                </div>
                            </div>
                            <div class="d-flex flex-column align-items-end gap-1">
                                <span class="badge bg-secondary small">#${tarea.id}</span>
                                <span class="badge ${prioridadClass}">
                                    ${this.escapeHtml(tarea.prioridad || 'media')}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Body de la tarjeta -->
                    <div class="card-body">
                        <div class="mb-3">
                            ${tarea.descripcion ? `
                            <div class="mb-3">
                                <p class="text-muted small">${this.escapeHtml(tarea.descripcion).substring(0, 100)}${tarea.descripcion.length > 100 ? '...' : ''}</p>
                            </div>
                            ` : ''}
                            
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted small">Responsable</span>
                                <span class="fw-medium">${this.escapeHtml(tarea.colaboradores?.nombre || 'Sin asignar')}</span>
                            </div>
                            
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted small">Estado</span>
                                <span class="badge ${estadoClass}">
                                    ${this.escapeHtml(this.getEstadoDisplayName(tarea.estado))}
                                </span>
                            </div>
                            
                            ${tarea.fecha_programada ? `
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted small">Programada</span>
                                <span class="fw-medium">${api.formatDate(tarea.fecha_programada)}</span>
                            </div>
                            ` : ''}
                            
                            ${tarea.notas ? `
                            <div class="d-flex justify-content-between mb-2">
                                <span class="text-muted small">Notas</span>
                                <span class="fw-medium">${this.escapeHtml(tarea.notas).substring(0, 50)}${tarea.notas.length > 50 ? '...' : ''}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Acciones de la tarjeta -->
                    <div class="card-footer">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>
                                ${api.formatDate(tarea.created_at)}
                            </small>
                            <div class="btn-group btn-group-sm">
                                <button onclick="app.showTareaDetail(${tarea.id})" 
                                        class="btn btn-outline-info" 
                                        title="Ver detalles de la tarea">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="app.editTarea(${tarea.id})" 
                                        class="btn btn-outline-primary" 
                                        title="Editar tarea">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="app.deleteTarea(${tarea.id})" 
                                        class="btn btn-outline-danger" 
                                        title="Eliminar tarea">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getEstadoDisplayName(estado) {
        const nombres = {
            'pendiente': 'Pendiente',
            'en_progreso': 'En Progreso',
            'completada': 'Completada',
            'cancelada': 'Cancelada'
        };
        return nombres[estado] || estado;
    }

    async filterTareas() {
        await this.loadTareas();
    }

    // ===== MODAL DETALLE DE TAREA CON COMENTARIOS Y ADJUNTOS =====
    async showTareaDetail(tareaId) {
        try {
            this.currentTareaId = tareaId;
            const [tarea, colaboradores, comentarios, adjuntos, todosColaboradores] = await Promise.all([
                api.getTarea(tareaId),
                api.getTareaColaboradores(tareaId),
                api.getTareaComentarios(tareaId),
                api.getTareaAdjuntos(tareaId),
                api.getColaboradores()
            ]);

            if (!tarea) {
                this.showToast('Tarea no encontrada', 'error');
                return;
            }

            const modal = document.getElementById('tarea-detail-modal');
            const content = document.getElementById('tarea-detail-content');

            if (modal && content) {
                content.innerHTML = this.getTareaDetailContent(tarea, colaboradores, comentarios, adjuntos, todosColaboradores);
                modal.classList.remove('d-none');

                // Configurar event listeners para comentarios y adjuntos
                this.setupTareaDetailListeners();
            }

        } catch (error) {
            console.error('Error showing tarea detail:', error);
            this.showToast('Error al cargar los detalles de la tarea', 'error');
        }
    }

    setupTareaDetailListeners() {
        // Listener para agregar comentario
        const addCommentBtn = document.getElementById('add-comment-btn');
        const commentInput = document.getElementById('new-comment-input');
        const commentSelect = document.getElementById('comment-collaborator-select');

        if (addCommentBtn && commentInput) {
            addCommentBtn.addEventListener('click', () => this.addComentario());

            // Agregar comentario con Enter
            commentInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.addComentario();
                }
            });
        }

        // Listener para subir archivos
        const fileInput = document.getElementById('file-input');
        const uploadBtn = document.getElementById('upload-file-btn');

        if (fileInput && uploadBtn) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Listener para asignar colaboradores
        const assignBtn = document.getElementById('assign-collaborator-btn');
        const collaboratorSelect = document.getElementById('assign-collaborator-select');

        if (assignBtn && collaboratorSelect) {
            assignBtn.addEventListener('click', () => this.assignColaborador());
        }
    }

    // ===== FUNCIONES PARA COMENTARIOS =====
    async addComentario() {
        if (!this.currentTareaId) return;

        const commentInput = document.getElementById('new-comment-input');
        const collaboratorSelect = document.getElementById('comment-collaborator-select');

        if (!commentInput || !collaboratorSelect) return;

        const comentario = commentInput.value.trim();
        const colaboradorId = collaboratorSelect.value;

        if (!comentario) {
            this.showToast('Por favor ingresa un comentario', 'warning');
            return;
        }

        if (!colaboradorId) {
            this.showToast('Por favor selecciona un colaborador', 'warning');
            return;
        }

        try {
            await api.createTareaComentario(this.currentTareaId, parseInt(colaboradorId), comentario);
            this.showToast('Comentario agregado correctamente', 'success');

            // Limpiar campos
            commentInput.value = '';

            // Recargar comentarios
            await this.refreshTareaComments();
        } catch (error) {
            console.error('Error adding comment:', error);
            this.showToast('Error al agregar comentario', 'error');
        }
    }

    async refreshTareaComments() {
        if (!this.currentTareaId) return;

        try {
            const comentarios = await api.getTareaComentarios(this.currentTareaId);
            const commentsContainer = document.getElementById('comments-container');

            if (commentsContainer) {
                commentsContainer.innerHTML = this.renderComentarios(comentarios);
            }
        } catch (error) {
            console.error('Error refreshing comments:', error);
        }
    }

    async deleteComentario(comentarioId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

        try {
            await api.deleteTareaComentario(comentarioId);
            this.showToast('Comentario eliminado correctamente', 'success');
            await this.refreshTareaComments();
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showToast('Error al eliminar comentario', 'error');
        }
    }

    // ===== FUNCIONES PARA ADJUNTOS =====
    async handleFileUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validar tamaño de archivo (10MB máximo)
        if (file.size > FORM_CONSTANTS.limits.maxFileSize) {
            this.showToast('El archivo es demasiado grande (máximo 10MB)', 'error');
            return;
        }

        try {
            // Simular subida de archivo (en producción esto iría a un servicio de storage)
            const fileUrl = await this.uploadFileToStorage(file);

            const adjuntoData = {
                tarea_id: this.currentTareaId,
                nombre_archivo: file.name,
                tipo_archivo: this.getFileType(file),
                ruta_archivo: fileUrl,
                subido_por_id: 1 // En producción, esto sería el ID del usuario actual
            };

            await api.createTareaAdjunto(adjuntoData);
            this.showToast('Archivo subido correctamente', 'success');

            // Recargar adjuntos
            await this.refreshTareaAdjuntos();
        } catch (error) {
            console.error('Error uploading file:', error);
            this.showToast('Error al subir archivo', 'error');
        }

        // Limpiar input
        event.target.value = '';
    }

    async uploadFileToStorage(file) {
        // Simular subida de archivo - en producción esto sería Supabase Storage o similar
        return new Promise((resolve) => {
            setTimeout(() => {
                const fakeUrl = `https://storage.example.com/files/${Date.now()}_${file.name}`;
                resolve(fakeUrl);
            }, 1000);
        });
    }

    getFileType(file) {
        const extension = file.name.split('.').pop().toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
            return 'foto';
        } else if (['pdf'].includes(extension)) {
            return 'pdf';
        } else if (['doc', 'docx', 'txt'].includes(extension)) {
            return 'documento';
        } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
            return 'excel';
        } else if (['mp4', 'avi', 'mov'].includes(extension)) {
            return 'video';
        } else {
            return 'otro';
        }
    }

    async refreshTareaAdjuntos() {
        if (!this.currentTareaId) return;

        try {
            const adjuntos = await api.getTareaAdjuntos(this.currentTareaId);
            const adjuntosContainer = document.getElementById('adjuntos-container');

            if (adjuntosContainer) {
                adjuntosContainer.innerHTML = this.renderAdjuntos(adjuntos);
            }
        } catch (error) {
            console.error('Error refreshing adjuntos:', error);
        }
    }

    async deleteAdjunto(adjuntoId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) return;

        try {
            await api.deleteTareaAdjunto(adjuntoId);
            this.showToast('Archivo eliminado correctamente', 'success');
            await this.refreshTareaAdjuntos();
        } catch (error) {
            console.error('Error deleting adjunto:', error);
            this.showToast('Error al eliminar archivo', 'error');
        }
    }

    // ===== FUNCIONES PARA COLABORADORES =====
    async assignColaborador() {
        if (!this.currentTareaId) return;

        const collaboratorSelect = document.getElementById('assign-collaborator-select');
        const roleSelect = document.getElementById('assign-role-select');

        if (!collaboratorSelect || !roleSelect) return;

        const colaboradorId = collaboratorSelect.value;
        const rol = roleSelect.value;

        if (!colaboradorId) {
            this.showToast('Por favor selecciona un colaborador', 'warning');
            return;
        }

        try {
            await api.addColaboradorToTarea(this.currentTareaId, parseInt(colaboradorId), rol);
            this.showToast('Colaborador asignado correctamente', 'success');

            // Resetear selects
            collaboratorSelect.value = '';
            roleSelect.value = 'ejecutor';

            // Recargar colaboradores
            await this.refreshTareaColaboradores();
        } catch (error) {
            console.error('Error assigning colaborador:', error);
            this.showToast('Error al asignar colaborador', 'error');
        }
    }

    async refreshTareaColaboradores() {
        if (!this.currentTareaId) return;

        try {
            const colaboradores = await api.getTareaColaboradores(this.currentTareaId);
            const colaboradoresContainer = document.getElementById('colaboradores-container');

            if (colaboradoresContainer) {
                colaboradoresContainer.innerHTML = this.renderColaboradoresTarea(colaboradores);
            }
        } catch (error) {
            console.error('Error refreshing colaboradores:', error);
        }
    }

    async removeColaboradorFromTarea(colaboradorId) {
        if (!confirm('¿Estás seguro de que quieres quitar este colaborador de la tarea?')) return;

        try {
            await api.removeColaboradorFromTarea(this.currentTareaId, colaboradorId);
            this.showToast('Colaborador removido correctamente', 'success');
            await this.refreshTareaColaboradores();
        } catch (error) {
            console.error('Error removing colaborador:', error);
            this.showToast('Error al remover colaborador', 'error');
        }
    }

    // ===== FUNCIÓN PARA COMPLETAR TAREA =====
    async completeTarea(tareaId) {
        if (!confirm('¿Estás seguro de que quieres marcar esta tarea como completada?')) return;

        try {
            // Obtener la tarea actual
            const tarea = await api.getTarea(tareaId);
            if (!tarea) {
                this.showToast('Tarea no encontrada', 'error');
                return;
            }

            // Actualizar solo el estado a completada
            const dataToUpdate = {
                estado: 'completada'
            };

            await api.updateTarea(tareaId, dataToUpdate);
            this.showToast('Tarea marcada como completada', 'success');

            // Cerrar modal de detalle
            this.closeTareaDetailModal();

            // Refrescar la vista de tareas
            await this.loadTareas();

            // También refrescar el dashboard para actualizar contadores
            if (this.currentSection === 'dashboard') {
                await this.loadDashboard();
            }

        } catch (error) {
            console.error('Error completing tarea:', error);
            this.showToast('Error al completar la tarea', 'error');
        }
    }

    // ===== RENDER FUNCTIONS PARA DETALLE DE TAREA =====
    getTareaDetailContent(tarea, colaboradores, comentarios, adjuntos, todosColaboradores) {
        const estadoClass = api.getTareaStatusBadgeClass(tarea.estado);
        const prioridadClass = api.getTareaPrioridadBadgeClass(tarea.prioridad);

        // Generar opciones de colaboradores
        const colaboradoresOptions = todosColaboradores
            .filter(c => c.activo)
            .map(c => `<option value="${c.id}">${this.escapeHtml(c.nombre)}</option>`)
            .join('');

        // Determinar si mostrar botón de completar
        const showCompleteButton = tarea.estado !== 'completada' && tarea.estado !== 'cancelada';

        return `
            <div class="tarea-detail-modal">
                <div class="tarea-detail-header">
                    <div class="flex justify-between items-start">
                        <div>
                            <h2 class="tarea-detail-title">${this.escapeHtml(tarea.titulo)}</h2>
                            <div class="tarea-detail-meta">
                                <span class="tarea-detail-vehiculo">
                                    <i class="fas fa-car mr-1"></i>
                                    ${this.escapeHtml(tarea.vehiculos?.placa || 'Sin vehículo')}
                                </span>
                                <span class="tarea-detail-responsable">
                                    <i class="fas fa-user mr-1"></i>
                                    ${this.escapeHtml(tarea.colaboradores?.nombre || 'Sin responsable')}
                                </span>
                            </div>
                        </div>
                        <button onclick="app.closeTareaDetailModal()" class="close-btn-minimal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="tarea-detail-body">
                    <div class="tarea-detail-grid">
                        <!-- Información Principal -->
                        <div class="tarea-detail-section">
                            <h3 class="section-title-minimal">
                                <i class="fas fa-info-circle"></i>
                                Información General
                            </h3>
                            <div class="tarea-detail-info-grid">
                                <div class="tarea-detail-field">
                                    <label>Estado</label>
                                    <span class="tarea-card-status ${estadoClass}">
                                        ${this.escapeHtml(this.getEstadoDisplayName(tarea.estado))}
                                    </span>
                                </div>
                                <div class="tarea-detail-field">
                                    <label>Prioridad</label>
                                    <span class="tarea-card-prioridad ${prioridadClass}">
                                        ${this.escapeHtml(tarea.prioridad || 'media')}
                                    </span>
                                </div>
                                <div class="tarea-detail-field">
                                    <label>Fecha Creación</label>
                                    <span>${api.formatDate(tarea.fecha_creacion)}</span>
                                </div>
                                <div class="tarea-detail-field">
                                    <label>Fecha Programada</label>
                                    <span>${tarea.fecha_programada ? api.formatDate(tarea.fecha_programada) : 'No programada'}</span>
                                </div>
                            </div>
                            
                            ${tarea.descripcion ? `
                            <div class="tarea-detail-field">
                                <label>Descripción</label>
                                <div class="tarea-detail-descripcion">${this.escapeHtml(tarea.descripcion)}</div>
                            </div>
                            ` : ''}
                            
                            ${tarea.notas ? `
                            <div class="tarea-detail-field">
                                <label>Notas</label>
                                <div class="tarea-detail-notas">${this.escapeHtml(tarea.notas)}</div>
                            </div>
                            ` : ''}
                        </div>

                        <!-- Colaboradores Asignados -->
                        <div class="tarea-detail-section">
                            <h3 class="section-title-minimal">
                                <i class="fas fa-users"></i>
                                Colaboradores Asignados
                            </h3>
                            
                            <!-- Formulario para asignar colaborador -->
                            <div class="assign-collaborator-form mb-4">
                                <div class="flex gap-2 mb-2">
                                    <select id="assign-collaborator-select" class="select-minimal flex-1">
                                        <option value="">Seleccionar colaborador</option>
                                        ${colaboradoresOptions}
                                    </select>
                                    <select id="assign-role-select" class="select-minimal">
                                        <option value="ejecutor">Ejecutor</option>
                                        <option value="supervisor">Supervisor</option>
                                        <option value="apoyo">Apoyo</option>
                                    </select>
                                    <button id="assign-collaborator-btn" class="btn-primary-apple">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div id="colaboradores-container" class="tarea-colaboradores-list">
                                ${this.renderColaboradoresTarea(colaboradores)}
                            </div>
                        </div>
                    </div>

                    <!-- Comentarios -->
                    <div class="tarea-detail-section">
                        <h3 class="section-title-minimal">
                            <i class="fas fa-comments"></i>
                            Comentarios (${comentarios.length})
                        </h3>
                        
                        <!-- Formulario para agregar comentario -->
                        <div class="add-comment-form mb-4">
                            <div class="flex gap-2 mb-2">
                                <select id="comment-collaborator-select" class="select-minimal">
                                    <option value="">Seleccionar colaborador</option>
                                    ${colaboradoresOptions}
                                </select>
                            </div>
                            <div class="flex gap-2">
                                <textarea 
                                    id="new-comment-input" 
                                    class="input-minimal flex-1" 
                                    rows="2" 
                                    placeholder="Escribe un comentario..."
                                    maxlength="500"
                                ></textarea>
                                <button id="add-comment-btn" class="btn-primary-apple">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div id="comments-container" class="tarea-comentarios-list">
                            ${this.renderComentarios(comentarios)}
                        </div>
                    </div>

                    <!-- Adjuntos -->
                    <div class="tarea-detail-section">
                        <h3 class="section-title-minimal">
                            <i class="fas fa-paperclip"></i>
                            Adjuntos (${adjuntos.length})
                        </h3>
                        
                        <!-- Formulario para subir archivo -->
                        <div class="upload-file-form mb-4">
                            <input type="file" id="file-input" class="hidden" multiple>
                            <button id="upload-file-btn" class="btn-secondary-apple">
                                <i class="fas fa-upload"></i>
                                Subir Archivo
                            </button>
                            <small class="text-gray-500 ml-2">Máximo 10MB por archivo</small>
                        </div>
                        
                        <div id="adjuntos-container" class="tarea-adjuntos-list">
                            ${this.renderAdjuntos(adjuntos)}
                        </div>
                    </div>
                </div>

                <div class="tarea-detail-footer">
                    ${showCompleteButton ? `
                    <button onclick="app.completeTarea(${tarea.id})" class="btn-complete-task">
                        <i class="fas fa-check-circle"></i>
                        Completar Tarea
                    </button>
                    ` : ''}
                    <button onclick="app.editTarea(${tarea.id})" class="btn-secondary-apple">
                        <i class="fas fa-edit"></i>
                        Editar Tarea
                    </button>
                    <button onclick="app.closeTareaDetailModal()" class="btn-primary-apple">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
    }

    renderColaboradoresTarea(colaboradores) {
        if (colaboradores.length === 0) {
            return '<p class="text-gray-500">No hay colaboradores asignados</p>';
        }

        return colaboradores.map(col => `
            <div class="tarea-colaborador-item">
                <div class="colaborador-info">
                    <span class="colaborador-nombre">${this.escapeHtml(col.colaboradores.nombre)}</span>
                    <div class="flex items-center gap-2">
                        <span class="colaborador-rol rol-${col.rol}">${this.escapeHtml(col.rol)}</span>
                        <button onclick="app.removeColaboradorFromTarea(${col.colaborador_id})" 
                                class="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                title="Remover colaborador">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <small class="colaborador-fecha">Asignado: ${api.formatDate(col.asignado_at)}</small>
            </div>
        `).join('');
    }

    renderComentarios(comentarios) {
        if (comentarios.length === 0) {
            return '<p class="text-gray-500">No hay comentarios</p>';
        }

        return comentarios.map(com => `
            <div class="tarea-comentario-item">
                <div class="comentario-header">
                    <span class="comentario-autor">${this.escapeHtml(com.colaboradores.nombre)}</span>
                    <div class="flex items-center gap-2">
                        <span class="comentario-fecha">${api.formatDateTime(com.created_at)}</span>
                        <button onclick="app.deleteComentario(${com.id})" 
                                class="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                title="Eliminar comentario">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="comentario-texto">${this.escapeHtml(com.comentario)}</div>
            </div>
        `).join('');
    }

    renderAdjuntos(adjuntos) {
        if (adjuntos.length === 0) {
            return '<p class="text-gray-500">No hay archivos adjuntos</p>';
        }

        return adjuntos.map(adj => `
            <div class="tarea-adjunto-item">
                <div class="adjunto-icon">
                    <i class="fas fa-${this.getFileIcon(adj.tipo_archivo)}"></i>
                </div>
                <div class="adjunto-info">
                    <div class="adjunto-nombre">${this.escapeHtml(adj.nombre_archivo)}</div>
                    <div class="adjunto-meta">
                        <span>${this.escapeHtml(adj.tipo_archivo)}</span>
                        <span>•</span>
                        <span>Subido por ${this.escapeHtml(adj.colaboradores?.nombre || 'Desconocido')}</span>
                        <span>•</span>
                        <span>${api.formatDate(adj.created_at)}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <a href="${this.escapeHtml(adj.ruta_archivo)}" target="_blank" class="adjunto-download">
                        <i class="fas fa-download"></i>
                    </a>
                    <button onclick="app.deleteAdjunto(${adj.id})" 
                            class="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                            title="Eliminar archivo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getFileIcon(tipoArchivo) {
        const icons = {
            'foto': 'image',
            'documento': 'file-alt',
            'pdf': 'file-pdf',
            'excel': 'file-excel',
            'video': 'file-video',
            'otro': 'file'
        };
        return icons[tipoArchivo] || 'file';
    }

    closeTareaDetailModal() {
        const modal = document.getElementById('tarea-detail-modal');
        if (modal) {
            modal.classList.add('d-none');
        }
        this.currentTareaId = null;
    }

    // ===== MARCAS =====
    async loadMarcas() {
        this.setLoading('marcas', true);
        try {
            const marcas = await api.getMarcas();
            this.renderMarcasTable(marcas);
        } catch (error) {
            console.error('Error loading marcas:', error);
            this.showToast('Error al cargar marcas', 'error');
        } finally {
            this.setLoading('marcas', false);
        }
    }

    renderMarcasTable(marcas) {
        const tbody = document.getElementById('marcas-table');
        if (!tbody) return;

        if (marcas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="text-center py-5">
                            <i class="fas fa-tag fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No hay marcas registradas</p>
                            <button onclick="app.openModal('marca')" class="btn btn-primary mt-3">
                                Crear primera marca
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = marcas.map(marca => `
            <tr>
                <td class="text-muted small">#${marca.id}</td>
                <td class="fw-medium">${this.escapeHtml(marca.nombre)}</td>
                <td class="text-muted">-</td>
                <td>
                    <div class="d-flex gap-2">
                        <button onclick="app.editMarca(${marca.id})" 
                                class="btn btn-sm btn-outline-primary"
                                title="Editar marca">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.deleteMarca(${marca.id})" 
                                class="btn btn-sm btn-outline-danger"
                                title="Eliminar marca">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async filterMarcas() {
        const searchTerm = document.getElementById('search-marcas')?.value?.toLowerCase() || '';

        try {
            const marcas = await api.getMarcas();
            const filtered = marcas.filter(m => m.nombre.toLowerCase().includes(searchTerm));
            this.renderMarcasTable(filtered);
        } catch (error) {
            console.error('Error filtering marcas:', error);
        }
    }

    // ===== MODELOS =====
    async loadModelos() {
        this.setLoading('modelos', true);
        try {
            const filters = this.getModelosFilters();
            const [modelos] = await Promise.all([
                api.getModelos(filters),
                this.loadModelosFilters()
            ]);
            this.renderModelosTable(modelos);
        } catch (error) {
            console.error('Error loading modelos:', error);
            this.showToast('Error al cargar modelos', 'error');
        } finally {
            this.setLoading('modelos', false);
        }
    }

    getModelosFilters() {
        return {
            marca_id: document.getElementById('filter-marca-modelo')?.value || '',
            search: document.getElementById('search-modelos')?.value || ''
        };
    }

    async loadModelosFilters() {
        try {
            const marcas = await api.getMarcas();
            const marcaSelect = document.getElementById('filter-marca-modelo');
            if (marcaSelect) {
                const currentValue = marcaSelect.value;
                marcaSelect.innerHTML = '<option value="">Todas las marcas</option>' +
                    marcas.map(m => `<option value="${m.id}" ${currentValue == m.id ? 'selected' : ''}>${this.escapeHtml(m.nombre)}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading marca filters:', error);
        }
    }

    renderModelosTable(modelos) {
        const tbody = document.getElementById('modelos-table');
        if (!tbody) return;

        if (modelos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="text-center py-5">
                            <i class="fas fa-cogs fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No hay modelos registrados</p>
                            <button onclick="app.openModal('modelo')" class="btn btn-primary mt-3">
                                Crear primer modelo
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = modelos.map(modelo => `
            <tr>
                <td class="text-muted small">#${modelo.id}</td>
                <td class="fw-medium">${this.escapeHtml(modelo.nombre)}</td>
                <td>${this.escapeHtml(modelo.marcas?.nombre || 'Sin marca')}</td>
                <td class="text-muted">-</td>
                <td>
                    <div class="d-flex gap-2">
                        <button onclick="app.editModelo(${modelo.id})" 
                                class="btn btn-sm btn-outline-primary"
                                title="Editar modelo">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.deleteModelo(${modelo.id})" 
                                class="btn btn-sm btn-outline-danger"
                                title="Eliminar modelo">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async filterModelos() {
        await this.loadModelos();
    }

    // ===== ESTADOS =====
    async loadEstados() {
        this.setLoading('estados', true);
        try {
            const estados = await api.getEstadosInventario();
            this.renderEstadosTable(estados);
        } catch (error) {
            console.error('Error loading estados:', error);
            this.showToast('Error al cargar estados', 'error');
        } finally {
            this.setLoading('estados', false);
        }
    }

    renderEstadosTable(estados) {
        const tbody = document.getElementById('estados-table');
        if (!tbody) return;

        if (estados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="text-center py-5">
                            <i class="fas fa-list-check fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No hay estados registrados</p>
                            <button onclick="app.openModal('estado')" class="btn btn-primary mt-3">
                                Crear primer estado
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = estados.map(estado => `
            <tr>
                <td class="text-muted small">#${estado.id}</td>
                <td class="fw-medium">${this.escapeHtml(estado.nombre)}</td>
                <td class="text-muted">-</td>
                <td>
                    <div class="d-flex gap-2">
                        <button onclick="app.editEstado(${estado.id})" 
                                class="btn btn-sm btn-outline-primary"
                                title="Editar estado">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.deleteEstado(${estado.id})" 
                                class="btn btn-sm btn-outline-danger"
                                title="Eliminar estado">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async filterEstados() {
        const searchTerm = document.getElementById('search-estados')?.value?.toLowerCase() || '';

        try {
            const estados = await api.getEstadosInventario();
            const filtered = estados.filter(e => e.nombre.toLowerCase().includes(searchTerm));
            this.renderEstadosTable(filtered);
        } catch (error) {
            console.error('Error filtering estados:', error);
        }
    }

    // ===== MODALES =====
    async openModal(type, item = null) {
        try {
            this.currentModal = type;
            this.editingItem = item;

            const content = await this.modalManager.getModalContent(type, item);
            const modalContent = document.getElementById('modal-content');
            const modalOverlay = document.getElementById('modal-overlay');

            if (modalContent && modalOverlay) {
                modalContent.innerHTML = content;
                modalOverlay.classList.remove('d-none');

                // Cargar datos específicos del modal después de renderizar
                await this.modalManager.loadModalData(type, item);

                // Configurar pestañas de vehículo si es necesario
                if (type === 'vehiculo' && item) {
                    if (window.vehiculoTabsManager) {
                        window.vehiculoTabsManager.setVehiculoId(item.id);
                        // Asegurar que las pestañas se inicialicen correctamente
                        setTimeout(() => {
                            window.vehiculoTabsManager.initializeTabs();
                        }, 100);
                    }
                }

                // Enfocar el primer input
                setTimeout(() => {
                    const firstInput = modalContent.querySelector('input, select, textarea');
                    if (firstInput) firstInput.focus();
                }, 100);
            }
        } catch (error) {
            console.error('Error opening modal:', error);
            this.showToast('Error al abrir el modal', 'error');
        }
    }

    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.add('d-none');
        }
        this.currentModal = null;
        this.editingItem = null;
    }

    // ===== FUNCIONES CRUD =====
    async editArrendadora(id) {
        try {
            const arrendadora = await api.getArrendadora(id);
            if (arrendadora) {
                await this.openModal('arrendadora', arrendadora);
            }
        } catch (error) {
            console.error('Error loading arrendadora:', error);
            this.showToast('Error al cargar la arrendadora', 'error');
        }
    }

    async deleteArrendadora(id) {
        if (!await this.confirmDelete('esta arrendadora')) return;

        try {
            await api.deleteArrendadora(id);
            this.showToast('Arrendadora eliminada correctamente', 'success');
            await this.loadArrendadoras();
        } catch (error) {
            console.error('Error deleting arrendadora:', error);
            this.showToast('Error al eliminar la arrendadora', 'error');
        }
    }

    async editVehiculo(id) {
        try {
            const vehiculo = await api.getVehiculo(id);
            if (vehiculo) {
                await this.openModal('vehiculo', vehiculo);
            }
        } catch (error) {
            console.error('Error loading vehiculo:', error);
            this.showToast('Error al cargar el vehículo', 'error');
        }
    }

    openVehiculoDetail(id) {
        // Redirigir a la página de detalle del vehículo
        window.location.href = `vehiculo-detail.html?id=${id}`;
    }

    async deleteVehiculo(id) {
        if (!await this.confirmDelete('este vehículo')) return;

        try {
            await api.deleteVehiculo(id);
            this.showToast('Vehículo eliminado correctamente', 'success');
            await this.loadVehiculos();
        } catch (error) {
            console.error('Error deleting vehiculo:', error);
            this.showToast('Error al eliminar el vehículo', 'error');
        }
    }

    async editColaborador(id) {
        try {
            const colaborador = await api.getColaborador(id);
            if (colaborador) {
                await this.openModal('colaborador', colaborador);
            }
        } catch (error) {
            console.error('Error loading colaborador:', error);
            this.showToast('Error al cargar el colaborador', 'error');
        }
    }

    async deleteColaborador(id) {
        if (!await this.confirmDelete('este colaborador')) return;

        try {
            await api.deleteColaborador(id);
            this.showToast('Colaborador eliminado correctamente', 'success');
            await this.loadColaboradores();
        } catch (error) {
            console.error('Error deleting colaborador:', error);
            this.showToast('Error al eliminar el colaborador', 'error');
        }
    }

    async editTarea(id) {
        try {
            const tarea = await api.getTarea(id);
            if (tarea) {
                // Cerrar modal de detalle si está abierto
                this.closeTareaDetailModal();
                await this.openModal('tarea', tarea);
            }
        } catch (error) {
            console.error('Error loading tarea:', error);
            this.showToast('Error al cargar la tarea', 'error');
        }
    }

    async deleteTarea(id) {
        if (!await this.confirmDelete('esta tarea')) return;

        try {
            await api.deleteTarea(id);
            this.showToast('Tarea eliminada correctamente', 'success');

            // Cerrar modal de detalle si está abierto
            this.closeTareaDetailModal();

            await this.loadTareas();
        } catch (error) {
            console.error('Error deleting tarea:', error);
            this.showToast('Error al eliminar la tarea', 'error');
        }
    }

    async editMarca(id) {
        try {
            const marca = await api.getMarca(id);
            if (marca) {
                await this.openModal('marca', marca);
            }
        } catch (error) {
            console.error('Error loading marca:', error);
            this.showToast('Error al cargar la marca', 'error');
        }
    }

    async deleteMarca(id) {
        if (!await this.confirmDelete('esta marca')) return;

        try {
            await api.deleteMarca(id);
            this.showToast('Marca eliminada correctamente', 'success');
            await this.loadMarcas();
        } catch (error) {
            console.error('Error deleting marca:', error);
            this.showToast('Error al eliminar la marca', 'error');
        }
    }

    async editModelo(id) {
        try {
            const modelo = await api.getModelo(id);
            if (modelo) {
                await this.openModal('modelo', modelo);
            }
        } catch (error) {
            console.error('Error loading modelo:', error);
            this.showToast('Error al cargar el modelo', 'error');
        }
    }

    async deleteModelo(id) {
        if (!await this.confirmDelete('este modelo')) return;

        try {
            await api.deleteModelo(id);
            this.showToast('Modelo eliminado correctamente', 'success');
            await this.loadModelos();
        } catch (error) {
            console.error('Error deleting modelo:', error);
            this.showToast('Error al eliminar el modelo', 'error');
        }
    }

    async editEstado(id) {
        try {
            const estado = await api.getEstadoInventario(id);
            if (estado) {
                await this.openModal('estado', estado);
            }
        } catch (error) {
            console.error('Error loading estado:', error);
            this.showToast('Error al cargar el estado', 'error');
        }
    }

    async deleteEstado(id) {
        if (!await this.confirmDelete('este estado')) return;

        try {
            await api.deleteEstadoInventario(id);
            this.showToast('Estado eliminado correctamente', 'success');
            await this.loadEstados();
        } catch (error) {
            console.error('Error deleting estado:', error);
            this.showToast('Error al eliminar el estado', 'error');
        }
    }

    async confirmDelete(itemType) {
        return new Promise((resolve) => {
            const confirmed = confirm(`¿Estás seguro de que quieres eliminar ${itemType}?`);
            resolve(confirmed);
        });
    }

    // ===== UTILIDADES =====
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="flex-shrink-0">
                    <i class="fas fa-${this.getToastIcon(type)}"></i>
                </div>
                <div class="ms-3">
                    <p class="small fw-medium mb-0">${this.escapeHtml(message)}</p>
                </div>
                <div class="ms-auto ps-3">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="btn btn-link text-muted p-0">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove after configured duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, APP_CONFIG.toastDuration);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FlotaApp();
    
    // Verificar si hay un vehículo para editar en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const editVehicleId = urlParams.get('edit_vehicle');
    if (editVehicleId) {
        // Limpiar la URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Abrir el modal de edición
        setTimeout(() => {
            if (window.app) {
                window.app.editVehiculo(editVehicleId);
            }
        }, 1000);
    }
});

// Funciones globales para los botones
function showSection(sectionName) {
    if (window.app) {
        window.app.showSection(sectionName);
    }
}

function openModal(type, item = null) {
    if (window.app) {
        window.app.openModal(type, item);
    }
}