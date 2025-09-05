// API Service CORREGIDO - Solución para errores de relaciones
class ApiService {
    constructor() {
        this.baseUrl = SUPABASE_CONFIG.url + '/rest/v1';
        this.headers = SUPABASE_CONFIG.headers;
        this.cache = new Map();
        this.isOnline = navigator.onLine;
        this.currentUser = null;
        this.setupNetworkListeners();
        this.initializeSupabase();
    }

    initializeSupabase() {
        // Inicializar cliente de Supabase si está disponible
        if (typeof supabase !== 'undefined') {
            this.supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.apiKey);
        } else {
            console.warn('⚠️ Supabase no está disponible, usando API REST');
            this.supabase = null;
        }
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.clearCache();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // Método genérico CORREGIDO para hacer peticiones
    async request(endpoint, options = {}) {
        if (!this.isOnline && !this.isCached(endpoint)) {
            throw new Error('Sin conexión a internet');
        }

        const url = `${this.baseUrl}${endpoint}`;
        const cacheKey = `${options.method || 'GET'}_${url}_${JSON.stringify(options.body || {})}`;

        // Verificar cache para GET requests
        if ((!options.method || options.method === 'GET') && this.isCached(cacheKey)) {
            return this.getFromCache(cacheKey);
        }

        const config = {
            headers: this.headers,
            ...options
        };

        try {
            const response = await this.fetchWithRetry(url, config);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`🔴 HTTP ${response.status} Error en ${endpoint}:`, errorText);

                console.error('📋 Detalles del error:', {
                    url: url,
                    status: response.status,
                    statusText: response.statusText,
                    method: config.method || 'GET'
                });

                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            // Para operaciones DELETE, retornar éxito sin parsear JSON
            if (options.method === 'DELETE') {
                return { success: true };
            }

            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = { success: true };
            }

            // Cachear GET requests exitosos
            if ((!options.method || options.method === 'GET') && data) {
                this.setCache(cacheKey, data);
            }

            return data;
        } catch (error) {
            console.error('💥 API Error:', error);
            throw this.handleError(error);
        }
    }

    async fetchWithRetry(url, config, retries = PERFORMANCE_CONFIG.maxRetries) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fetch(url, config);
            } catch (error) {
                if (i === retries - 1) throw error;
                await this.delay(PERFORMANCE_CONFIG.retryDelay * (i + 1));
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleError(error) {
        if (error.message.includes('Failed to fetch')) {
            return new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        return error;
    }

    // Métodos de cache
    isCached(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;
        
        const now = Date.now();
        return (now - cached.timestamp) < (PERFORMANCE_CONFIG?.cacheExpiry || 300000); // 5 minutos por defecto
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        return cached ? cached.data : null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    invalidateCache(pattern) {
        const keysToDelete = Array.from(this.cache.keys()).filter(key =>
            key.includes(pattern)
        );
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    // ===== COLABORADORES =====
    async getColaboradores() {
        return this.request('/colaboradores?select=*&order=nombre.asc');
    }

    async getColaborador(id) {
        const result = await this.request(`/colaboradores?id=eq.${id}&select=*`);
        return result?.[0] || null;
    }

    async createColaborador(data) {
        const result = await this.request('/colaboradores', {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeData(data))
        });
        this.invalidateCache('colaboradores');
        return result;
    }

    async updateColaborador(id, data) {
        const result = await this.request(`/colaboradores?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeData(data))
        });
        this.invalidateCache('colaboradores');
        return result;
    }

    async deleteColaborador(id) {
        const result = await this.request(`/colaboradores?id=eq.${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache('colaboradores');
        return result;
    }

    // ===== TAREAS CORREGIDAS =====
    async getTareas(filters = {}) {
        try {
            let query = '/tareas?select=*&order=id.desc';

            const params = [];
            if (filters.responsable_id) {
                params.push(`responsable_id=eq.${filters.responsable_id}`);
            }
            if (filters.estado) {
                params.push(`estado=eq.${encodeURIComponent(filters.estado)}`);
            }
            if (filters.prioridad) {
                params.push(`prioridad=eq.${encodeURIComponent(filters.prioridad)}`);
            }
            if (filters.search) {
                const searchEncoded = encodeURIComponent(filters.search);
                params.push(`or=(titulo.ilike.*${searchEncoded}*,descripcion.ilike.*${searchEncoded}*)`);
            }
            if (filters.limit) {
                params.push(`limit=${filters.limit}`);
            }

            if (params.length > 0) {
                query += '&' + params.join('&');
            }

            console.log('🔍 Ejecutando consulta de tareas:', query);
            const tareas = await this.request(query);

            if (!tareas || tareas.length === 0) {
                console.log('📝 No hay tareas en la base de datos');
                return [];
            }

            // Obtener datos relacionados en consultas separadas
            const vehiculoIds = [...new Set(tareas.map(t => t.vehiculo_id).filter(id => id))];
            const colaboradorIds = [...new Set(tareas.map(t => t.responsable_id).filter(id => id))];

            console.log('🚗 Vehículos a buscar:', vehiculoIds);
            console.log('👥 Colaboradores a buscar:', colaboradorIds);

            const [vehiculosData, colaboradoresData] = await Promise.all([
                vehiculoIds.length > 0 ? this.getVehiculosConRelaciones(vehiculoIds) : [],
                colaboradorIds.length > 0 ? this.getColaboradoresByIds(colaboradorIds) : []
            ]);

            // Combinar datos
            const tareasCompletas = tareas.map(tarea => ({
                ...tarea,
                vehiculos: vehiculosData.find(v => v.id === tarea.vehiculo_id) || null,
                colaboradores: colaboradoresData.find(c => c.id === tarea.responsable_id) || null
            }));

            console.log('✅ Tareas completadas:', tareasCompletas.length);
            return tareasCompletas;

        } catch (error) {
            console.error('❌ Error en getTareas:', error);
            return [];
        }
    }

    async getTarea(id) {
        try {
            const tarea = await this.request(`/tareas?id=eq.${id}&select=*`);

            if (!tarea || tarea.length === 0) {
                console.log(`⚠️ Tarea ${id} no encontrada`);
                return null;
            }

            const tareaData = tarea[0];

            // Obtener datos relacionados
            const [vehiculo, colaborador] = await Promise.all([
                tareaData.vehiculo_id ? this.getVehiculoCompleto(tareaData.vehiculo_id) : null,
                tareaData.responsable_id ? this.getColaborador(tareaData.responsable_id) : null
            ]);

            return {
                ...tareaData,
                vehiculos: vehiculo,
                colaboradores: colaborador
            };

        } catch (error) {
            console.error(`❌ Error obteniendo tarea ${id}:`, error);
            return null;
        }
    }

    async createTarea(data) {
        const result = await this.request('/tareas', {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeTareaData(data))
        });
        this.invalidateCache('tareas');
        return result;
    }

    async updateTarea(id, data) {
        const result = await this.request(`/tareas?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeTareaData(data))
        });
        this.invalidateCache('tareas');
        return result;
    }

    async deleteTarea(id) {
        const result = await this.request(`/tareas?id=eq.${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache('tareas');
        return result;
    }

    // ===== TAREA COLABORADORES =====
    async getTareaColaboradores(tareaId) {
        try {
            // Consulta sin JOIN problemático - usar consultas separadas
            const tareaColaboradores = await this.request(`/tarea_colaboradores?tarea_id=eq.${tareaId}&select=*`);

            if (!tareaColaboradores || tareaColaboradores.length === 0) {
                return [];
            }

            // Obtener datos de colaboradores por separado
            const colaboradorIds = [...new Set(tareaColaboradores.map(tc => tc.colaborador_id).filter(id => id))];

            if (colaboradorIds.length > 0) {
                const colaboradores = await this.request(`/colaboradores?id=in.(${colaboradorIds.join(',')})&select=id,nombre`);

                // Combinar datos
                return tareaColaboradores.map(tc => ({
                    ...tc,
                    colaboradores: colaboradores.find(c => c.id === tc.colaborador_id) || { nombre: 'Desconocido' }
                }));
            }

            return tareaColaboradores;
        } catch (error) {
            console.error('❌ Error obteniendo colaboradores de tarea:', error);
            return [];
        }
    }

    async addColaboradorToTarea(tareaId, colaboradorId, rol = 'ejecutor') {
        const result = await this.request('/tarea_colaboradores', {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                tarea_id: tareaId,
                colaborador_id: colaboradorId,
                rol: rol
            })
        });
        this.invalidateCache('tarea_colaboradores');
        return result;
    }

    async removeColaboradorFromTarea(tareaId, colaboradorId) {
        const result = await this.request(`/tarea_colaboradores?tarea_id=eq.${tareaId}&colaborador_id=eq.${colaboradorId}`, {
            method: 'DELETE'
        });
        this.invalidateCache('tarea_colaboradores');
        return result;
    }

    async updateColaboradorRol(tareaId, colaboradorId, rol) {
        const result = await this.request(`/tarea_colaboradores?tarea_id=eq.${tareaId}&colaborador_id=eq.${colaboradorId}`, {
            method: 'PATCH',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ rol: rol })
        });
        this.invalidateCache('tarea_colaboradores');
        return result;
    }

    // ===== TAREA COMENTARIOS =====
    async getTareaComentarios(tareaId) {
        try {
            // Consulta sin JOIN problemático
            const comentarios = await this.request(`/tarea_comentarios?tarea_id=eq.${tareaId}&select=*&order=created_at.desc`);

            if (!comentarios || comentarios.length === 0) {
                return [];
            }

            // Obtener datos de colaboradores por separado
            const colaboradorIds = [...new Set(comentarios.map(c => c.colaborador_id).filter(id => id))];

            if (colaboradorIds.length > 0) {
                const colaboradores = await this.request(`/colaboradores?id=in.(${colaboradorIds.join(',')})&select=id,nombre`);

                // Combinar datos
                return comentarios.map(comentario => ({
                    ...comentario,
                    colaboradores: colaboradores.find(c => c.id === comentario.colaborador_id) || { nombre: 'Desconocido' }
                }));
            }

            return comentarios;
        } catch (error) {
            console.error('❌ Error obteniendo comentarios de tarea:', error);
            return [];
        }
    }

    async createTareaComentario(tareaId, colaboradorId, comentario) {
        const result = await this.request('/tarea_comentarios', {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                tarea_id: tareaId,
                colaborador_id: colaboradorId,
                comentario: comentario
            })
        });
        this.invalidateCache('tarea_comentarios');
        return result;
    }

    async deleteTareaComentario(id) {
        const result = await this.request(`/tarea_comentarios?id=eq.${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache('tarea_comentarios');
        return result;
    }

    // ===== TAREA ADJUNTOS CORREGIDO =====
    async getTareaAdjuntos(tareaId) {
        try {
            // CORRECCIÓN: Consulta sin JOIN problemático
            const adjuntos = await this.request(`/tarea_adjuntos?tarea_id=eq.${tareaId}&select=*&order=created_at.desc`);

            if (!adjuntos || adjuntos.length === 0) {
                return [];
            }

            // Obtener datos de colaboradores por separado si existe la columna subido_por_id
            const colaboradorIds = [...new Set(adjuntos.map(a => a.subido_por_id).filter(id => id))];

            if (colaboradorIds.length > 0) {
                const colaboradores = await this.request(`/colaboradores?id=in.(${colaboradorIds.join(',')})&select=id,nombre`);

                // Combinar datos
                return adjuntos.map(adjunto => ({
                    ...adjunto,
                    colaboradores: colaboradores.find(c => c.id === adjunto.subido_por_id) || { nombre: 'Desconocido' }
                }));
            }

            return adjuntos;
        } catch (error) {
            console.error('❌ Error obteniendo adjuntos de tarea:', error);
            return [];
        }
    }

    async createTareaAdjunto(data) {
        const result = await this.request('/tarea_adjuntos', {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeData(data))
        });
        this.invalidateCache('tarea_adjuntos');
        return result;
    }

    async deleteTareaAdjunto(id) {
        const result = await this.request(`/tarea_adjuntos?id=eq.${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache('tarea_adjuntos');
        return result;
    }

    // ===== ARRENDADORAS =====
    async getArrendadoras() {
        return this.request('/arrendadoras?select=*&order=nombre.asc');
    }

    async getArrendadora(id) {
        const result = await this.request(`/arrendadoras?id=eq.${id}&select=*`);
        return result?.[0] || null;
    }

    async createArrendadora(data) {
        const result = await this.request('/arrendadoras', {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeData(data))
        });
        this.invalidateCache('arrendadoras');
        return result;
    }

    async updateArrendadora(id, data) {
        const result = await this.request(`/arrendadoras?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeData(data))
        });
        this.invalidateCache('arrendadoras');
        return result;
    }

    async deleteArrendadora(id) {
        const result = await this.request(`/arrendadoras?id=eq.${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache('arrendadoras');
        return result;
    }

    // ===== VEHÍCULOS CORREGIDOS =====
    async getVehiculos(filters = {}) {
        try {
            let query = '/vehiculos?select=*&order=id.desc';

            const params = [];
            if (filters.arrendadora_id) {
                params.push(`arrendadora_id=eq.${filters.arrendadora_id}`);
            }
            if (filters.estado_inventario_id) {
                params.push(`estado_inventario_id=eq.${filters.estado_inventario_id}`);
            }
            if (filters.search) {
                const searchEncoded = encodeURIComponent(filters.search);
                params.push(`or=(placa.ilike.*${searchEncoded}*,vin.ilike.*${searchEncoded}*)`);
            }
            if (filters.limit) {
                params.push(`limit=${filters.limit}`);
            }

            if (params.length > 0) {
                query += '&' + params.join('&');
            }

            console.log('🔍 Ejecutando consulta de vehículos:', query);
            const vehiculos = await this.request(query);

            if (!vehiculos || vehiculos.length === 0) {
                console.log('🚗 No hay vehículos que coincidan con los filtros');
                return [];
            }

            // Obtener datos relacionados
            return await this.enrichVehiculosData(vehiculos);

        } catch (error) {
            console.error('❌ Error en getVehiculos:', error);
            return [];
        }
    }

    async getVehiculo(id) {
        try {
            const vehiculo = await this.request(`/vehiculos?id=eq.${id}&select=*`);

            if (!vehiculo || vehiculo.length === 0) {
                return null;
            }

            const vehiculoData = vehiculo[0];
            return await this.enrichVehiculoIndividual(vehiculoData);

        } catch (error) {
            console.error('Error in getVehiculo:', error);
            return null;
        }
    }

    async getVehiculoCompleto(id) {
        try {
            const vehiculo = await this.request(`/vehiculos?id=eq.${id}&select=*`);

            if (!vehiculo || vehiculo.length === 0) {
                return null;
            }

            const vehiculoData = vehiculo[0];

            // Obtener datos relacionados
            const [marca, modelo] = await Promise.all([
                vehiculoData.marca_id ? this.getMarca(vehiculoData.marca_id) : null,
                vehiculoData.modelo_id ? this.getModelo(vehiculoData.modelo_id) : null
            ]);

            return {
                ...vehiculoData,
                marcas: marca,
                modelos: modelo
            };

        } catch (error) {
            console.error(`❌ Error obteniendo vehículo completo ${id}:`, error);
            return null;
        }
    }

    // NUEVA FUNCIÓN: Enriquecer datos de vehículos
    async enrichVehiculosData(vehiculos) {
        try {
            // Obtener IDs únicos para consultas relacionadas
            const marcaIds = [...new Set(vehiculos.map(v => v.marca_id).filter(id => id))];
            const modeloIds = [...new Set(vehiculos.map(v => v.modelo_id).filter(id => id))];
            const arrendadoraIds = [...new Set(vehiculos.map(v => v.arrendadora_id).filter(id => id))];
            const estadoInventarioIds = [...new Set(vehiculos.map(v => v.estado_inventario_id).filter(id => id))];

            console.log('📊 Obteniendo datos relacionados...');
            console.log('- Marcas:', marcaIds);
            console.log('- Modelos:', modeloIds);
            console.log('- Arrendadoras:', arrendadoraIds);
            console.log('- Estados:', estadoInventarioIds);

            // Hacer consultas en paralelo
            const [marcas, modelos, arrendadoras, estadosInventario] = await Promise.all([
                marcaIds.length > 0 ? this.request(`/marcas?id=in.(${marcaIds.join(',')})&select=id,nombre`) : [],
                modeloIds.length > 0 ? this.request(`/modelos?id=in.(${modeloIds.join(',')})&select=id,nombre`) : [],
                arrendadoraIds.length > 0 ? this.request(`/arrendadoras?id=in.(${arrendadoraIds.join(',')})&select=id,nombre`) : [],
                estadoInventarioIds.length > 0 ? this.request(`/estados_inventario?id=in.(${estadoInventarioIds.join(',')})&select=id,nombre`) : []
            ]);

            // Combinar datos
            return vehiculos.map(vehiculo => ({
                ...vehiculo,
                marcas: marcas.find(m => m.id === vehiculo.marca_id) || null,
                modelos: modelos.find(m => m.id === vehiculo.modelo_id) || null,
                arrendadoras: arrendadoras.find(a => a.id === vehiculo.arrendadora_id) || null,
                estados_inventario: estadosInventario.find(e => e.id === vehiculo.estado_inventario_id) || null
            }));

        } catch (error) {
            console.error('❌ Error enriqueciendo datos de vehículos:', error);
            // Retornar vehículos sin datos relacionados si falla
            return vehiculos;
        }
    }

    // NUEVA FUNCIÓN: Enriquecer vehículo individual
    async enrichVehiculoIndividual(vehiculo) {
        try {
            const [marca, modelo, arrendadora, estadoInventario] = await Promise.all([
                vehiculo.marca_id ? this.getMarca(vehiculo.marca_id) : null,
                vehiculo.modelo_id ? this.getModelo(vehiculo.modelo_id) : null,
                vehiculo.arrendadora_id ? this.getArrendadora(vehiculo.arrendadora_id) : null,
                vehiculo.estado_inventario_id ? this.getEstadoInventario(vehiculo.estado_inventario_id) : null
            ]);

            return {
                ...vehiculo,
                marcas: marca,
                modelos: modelo,
                arrendadoras: arrendadora,
                estados_inventario: estadoInventario
            };
        } catch (error) {
            console.error('Error enriching vehiculo individual:', error);
            return vehiculo;
        }
    }

    // NUEVA FUNCIÓN: Obtener vehículos con relaciones para tareas
    async getVehiculosConRelaciones(vehiculoIds) {
        try {
            const vehiculos = await this.request(`/vehiculos?id=in.(${vehiculoIds.join(',')})&select=*`);

            if (!vehiculos || vehiculos.length === 0) {
                return [];
            }

            return await this.enrichVehiculosData(vehiculos);
        } catch (error) {
            console.error('❌ Error obteniendo vehículos con relaciones:', error);
            return [];
        }
    }

    // NUEVA FUNCIÓN: Obtener colaboradores por IDs
    async getColaboradoresByIds(ids) {
        try {
            if (!ids || ids.length === 0) return [];

            return await this.request(`/colaboradores?id=in.(${ids.join(',')})&select=id,nombre`);
        } catch (error) {
            console.error('❌ Error obteniendo colaboradores:', error);
            return [];
        }
    }

    async createVehiculo(data) {
        const result = await this.request('/vehiculos', {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeVehiculoData(data))
        });
        this.invalidateCache('vehiculos');
        return result;
    }

    async updateVehiculo(id, data) {
        const result = await this.request(`/vehiculos?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeVehiculoData(data))
        });
        this.invalidateCache('vehiculos');
        return result;
    }

    async deleteVehiculo(id) {
        const result = await this.request(`/vehiculos?id=eq.${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache('vehiculos');
        return result;
    }

    // ===== MARCAS =====
    async getMarcas() {
        return this.request('/marcas?select=*&order=nombre.asc');
    }

    async getMarca(id) {
        const result = await this.request(`/marcas?id=eq.${id}&select=*`);
        return result?.[0] || null;
    }

    async createMarca(data) {
        const result = await this.request('/marcas', {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeData(data))
        });
        this.invalidateCache('marcas');
        return result;
    }

    async updateMarca(id, data) {
        const result = await this.request(`/marcas?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeData(data))
        });
        this.invalidateCache('marcas');
        return result;
    }

    async deleteMarca(id) {
        const result = await this.request(`/marcas?id=eq.${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache('marcas');
        return result;
    }

    // ===== MODELOS =====
    async getModelos(filters = {}) {
        let query = '/modelos?select=*&order=nombre.asc';

        const params = [];
        if (filters.marca_id) {
            params.push(`marca_id=eq.${filters.marca_id}`);
        }
        if (filters.search) {
            params.push(`nombre.ilike.*${encodeURIComponent(filters.search)}*`);
        }

        if (params.length > 0) {
            query += '&' + params.join('&');
        }

        try {
            const modelos = await this.request(query);

            if (modelos && modelos.length > 0) {
                const marcaIds = [...new Set(modelos.map(m => m.marca_id).filter(id => id))];

                if (marcaIds.length > 0) {
                    const marcas = await this.request(`/marcas?id=in.(${marcaIds.join(',')})&select=id,nombre`);

                    return modelos.map(modelo => ({
                        ...modelo,
                        marcas: marcas.find(m => m.id === modelo.marca_id) || null
                    }));
                }
            }

            return modelos || [];
        } catch (error) {
            console.error('Error in getModelos:', error);
            return [];
        }
    }

    async getModelo(id) {
        const result = await this.request(`/modelos?id=eq.${id}&select=*`);
        const modelo = result?.[0];

        if (modelo && modelo.marca_id) {
            const marca = await this.getMarca(modelo.marca_id);
            return {
                ...modelo,
                marcas: marca
            };
        }

        return modelo || null;
    }

    async createModelo(data) {
        const result = await this.request('/modelos', {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeData(data))
        });
        this.invalidateCache('modelos');
        return result;
    }

    async updateModelo(id, data) {
        const result = await this.request(`/modelos?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeData(data))
        });
        this.invalidateCache('modelos');
        return result;
    }

    async deleteModelo(id) {
        const result = await this.request(`/modelos?id=eq.${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache('modelos');
        return result;
    }

    // ===== ESTADOS DE INVENTARIO =====
    async getEstadosInventario() {
        return this.request('/estados_inventario?select=*&order=nombre.asc');
    }

    async getEstadoInventario(id) {
        const result = await this.request(`/estados_inventario?id=eq.${id}&select=*`);
        return result?.[0] || null;
    }

    async createEstadoInventario(data) {
        const result = await this.request('/estados_inventario', {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeData(data))
        });
        this.invalidateCache('estados_inventario');
        return result;
    }

    async updateEstadoInventario(id, data) {
        const result = await this.request(`/estados_inventario?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(this.sanitizeData(data))
        });
        this.invalidateCache('estados_inventario');
        return result;
    }

    async deleteEstadoInventario(id) {
        const result = await this.request(`/estados_inventario?id=eq.${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache('estados_inventario');
        return result;
    }

    // ===== ESTADÍSTICAS MEJORADAS =====
    async getEstadisticas() {
        try {
            const [arrendadoras, vehiculos, marcas, modelos, estados, colaboradores, tareas] = await Promise.all([
                this.getArrendadoras(),
                this.getVehiculos({ limit: 1000 }),
                this.getMarcas(),
                this.getModelos(),
                this.getEstadosInventario(),
                this.getColaboradores(),
                this.getTareas({ limit: 1000 })
            ]);

            // Calcular estadísticas adicionales
            const vehiculosPorEstado = this.groupByProperty(vehiculos, 'estado_inventario_id');
            const vehiculosPorArrendadora = this.groupByProperty(vehiculos, 'arrendadora_id');
            const vehiculosPorMarca = this.groupByProperty(vehiculos, 'marca_id');
            const tareasPorEstado = this.groupByProperty(tareas, 'estado');
            const tareasPorPrioridad = this.groupByProperty(tareas, 'prioridad');

            return {
                totalArrendadoras: arrendadoras.length,
                totalVehiculos: vehiculos.length,
                totalMarcas: marcas.length,
                totalModelos: modelos.length,
                totalEstados: estados.length,
                totalColaboradores: colaboradores.length,
                totalTareas: tareas.length,
                distribuciones: {
                    porEstado: vehiculosPorEstado,
                    porArrendadora: vehiculosPorArrendadora,
                    porMarca: vehiculosPorMarca
                },
                tareas: {
                    porEstado: tareasPorEstado,
                    porPrioridad: tareasPorPrioridad,
                    pendientes: tareas.filter(t => t.estado === 'pendiente').length,
                    enProgreso: tareas.filter(t => t.estado === 'en_progreso').length,
                    completadas: tareas.filter(t => t.estado === 'completada').length
                }
            };
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return {
                totalArrendadoras: 0,
                totalVehiculos: 0,
                totalMarcas: 0,
                totalModelos: 0,
                totalEstados: 0,
                totalColaboradores: 0,
                totalTareas: 0,
                distribuciones: {
                    porEstado: {},
                    porArrendadora: {},
                    porMarca: {}
                },
                tareas: {
                    porEstado: {},
                    porPrioridad: {},
                    pendientes: 0,
                    enProgreso: 0,
                    completadas: 0
                }
            };
        }
    }

    // ===== UTILIDADES DE DATOS =====
    sanitizeData(data) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== null && value !== undefined && value !== '') {
                if (typeof value === 'string') {
                    sanitized[key] = value.trim();
                } else {
                    sanitized[key] = value;
                }
            } else {
                sanitized[key] = null;
            }
        }
        return sanitized;
    }

    sanitizeVehiculoData(data) {
        const sanitized = this.sanitizeData(data);

        // Validaciones específicas para vehículos
        if (sanitized.renta_semanal) {
            sanitized.renta_semanal = parseFloat(sanitized.renta_semanal);
        }
        if (sanitized.gastos_adms) {
            sanitized.gastos_adms = parseFloat(sanitized.gastos_adms);
        }
        if (sanitized.anio) {
            sanitized.anio = parseInt(sanitized.anio);
        }
        if (sanitized.plazo_semanas) {
            sanitized.plazo_semanas = parseInt(sanitized.plazo_semanas);
        }
        if (sanitized.cilindrada) {
            sanitized.cilindrada = parseInt(sanitized.cilindrada);
        }
        if (sanitized.cilindros) {
            sanitized.cilindros = parseInt(sanitized.cilindros);
        }
        if (sanitized.valor_adquisicion) {
            sanitized.valor_adquisicion = parseFloat(sanitized.valor_adquisicion);
        }

        return sanitized;
    }

    sanitizeTareaData(data) {
        const sanitized = this.sanitizeData(data);

        // Validaciones específicas para tareas
        if (sanitized.vehiculo_id) {
            sanitized.vehiculo_id = parseInt(sanitized.vehiculo_id);
        }
        if (sanitized.responsable_id) {
            sanitized.responsable_id = parseInt(sanitized.responsable_id);
        }

        return sanitized;
    }

    groupByProperty(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            if (!groups[key]) {
                groups[key] = 0;
            }
            groups[key]++;
            return groups;
        }, {});
    }

    // ===== UTILIDADES DE FORMATO =====
    formatCurrency(amount) {
        if (!amount) return '₡0';
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-CR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return '-';
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('es-CR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '-';
        }
    }

    getStatusBadgeClass(estadoId) {
        const estado = ESTADOS_VEHICULO.find(s => s.id === estadoId);
        return estado ? estado.class : 'status-available';
    }

    getStatusText(estadoId) {
        const estado = ESTADOS_VEHICULO.find(s => s.id === estadoId);
        return estado ? estado.nombre : 'Desconocido';
    }

    getTareaStatusBadgeClass(estado) {
        const clases = {
            'pendiente': 'status-pending',
            'en_progreso': 'status-in-progress',
            'completada': 'status-completed',
            'cancelada': 'status-cancelled'
        };
        return clases[estado] || 'status-pending';
    }

    getTareaPrioridadBadgeClass(prioridad) {
        const clases = {
            'baja': 'priority-low',
            'media': 'priority-medium',
            'alta': 'priority-high',
            'urgente': 'priority-urgent'
        };
        return clases[prioridad] || 'priority-medium';
    }

    // ===== VALIDACIONES =====
    validatePlaca(placa) {
        if (!placa) return false;
        const cleanPlaca = placa.trim().toUpperCase();

        // Verificar contra todos los patrones válidos
        return FORM_CONSTANTS.validation.placaPatterns.some(pattern =>
            pattern.test(cleanPlaca)
        );
    }

    validateVin(vin) {
        if (!vin) return true; // VIN es opcional
        return FORM_CONSTANTS.validation.vinPattern.test(vin);
    }

    validateUrl(url) {
        if (!url) return true; // URL es opcional
        return FORM_CONSTANTS.validation.urlPattern.test(url);
    }

    validateYear(year) {
        const currentYear = new Date().getFullYear();
        return year >= FORM_CONSTANTS.minYear && year <= currentYear + 2;
    }

    // ========================================
    // APIs PARA PESTAÑAS DE VEHÍCULOS
    // ========================================

    // GALERÍA DE FOTOS
    async getVehiculoFotos(vehiculoId) {
        try {
            const { data, error } = await this.supabase
                .from('vehiculo_fotos')
                .select('*')
                .eq('vehiculo_id', vehiculoId)
                .eq('activo', true)
                .order('orden', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error obteniendo fotos del vehículo:', error);
            return { success: false, error: error.message };
        }
    }

    async uploadVehiculoFoto(vehiculoId, fotoData) {
        try {
            const { data, error } = await this.supabase
                .from('vehiculo_fotos')
                .insert([{
                    vehiculo_id: vehiculoId,
                    nombre_archivo: fotoData.nombre,
                    url_archivo: fotoData.url,
                    descripcion: fotoData.descripcion || '',
                    orden: fotoData.orden || 0,
                    subido_por_id: this.currentUser?.id,
                    subido_por_nombre: this.currentUser?.user_metadata?.full_name || 'Usuario'
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error subiendo foto del vehículo:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteVehiculoFoto(fotoId) {
        try {
            const { error } = await this.supabase
                .from('vehiculo_fotos')
                .update({ activo: false })
                .eq('id', fotoId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('❌ Error eliminando foto del vehículo:', error);
            return { success: false, error: error.message };
        }
    }

    // TAREAS DEL VEHÍCULO
    async getVehiculoTareas(vehiculoId, filtros = {}) {
        try {
            let query = this.supabase
                .from('tareas')
                .select('*')
                .eq('vehiculo_id', vehiculoId)
                .order('created_at', { ascending: false });

            // Aplicar filtros
            if (filtros.estado) {
                query = query.eq('estado', filtros.estado);
            }
            if (filtros.prioridad) {
                query = query.eq('prioridad', filtros.prioridad);
            }
            if (filtros.asignado_a) {
                query = query.eq('asignado_a_id', filtros.asignado_a);
            }

            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error obteniendo tareas del vehículo:', error);
            return { success: false, error: error.message };
        }
    }

    // INSPECCIONES
    async getInspeccionMachotes() {
        try {
            const { data, error } = await this.supabase
                .from('inspeccion_machotes')
                .select('*')
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error obteniendo machotes de inspección:', error);
            return { success: false, error: error.message };
        }
    }

    async getInspeccionPruebas(machoteId) {
        try {
            const { data, error } = await this.supabase
                .from('inspeccion_pruebas')
                .select('*')
                .eq('machote_id', machoteId)
                .eq('activo', true)
                .order('orden', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error obteniendo pruebas de inspección:', error);
            return { success: false, error: error.message };
        }
    }

    async getVehiculoInspecciones(vehiculoId, filtros = {}) {
        try {
            let query = this.supabase
                .from('vehiculo_inspecciones')
                .select(`
                    *,
                    inspeccion_machotes(nombre),
                    inspeccion_resultados(*)
                `)
                .eq('vehiculo_id', vehiculoId)
                .order('fecha_inspeccion', { ascending: false });

            if (filtros.estado) {
                query = query.eq('estado', filtros.estado);
            }
            if (filtros.machote_id) {
                query = query.eq('machote_id', filtros.machote_id);
            }

            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error obteniendo inspecciones del vehículo:', error);
            return { success: false, error: error.message };
        }
    }

    async crearInspeccion(inspeccionData) {
        try {
            const { data, error } = await this.supabase
                .from('vehiculo_inspecciones')
                .insert([{
                    vehiculo_id: inspeccionData.vehiculo_id,
                    machote_id: inspeccionData.machote_id,
                    titulo: inspeccionData.titulo,
                    descripcion: inspeccionData.descripcion,
                    fecha_inspeccion: inspeccionData.fecha_inspeccion,
                    inspector_id: this.currentUser?.id,
                    inspector_nombre: this.currentUser?.user_metadata?.full_name || 'Usuario',
                    estado: 'en_proceso'
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error creando inspección:', error);
            return { success: false, error: error.message };
        }
    }

    async guardarResultadoInspeccion(resultadoData) {
        try {
            const { data, error } = await this.supabase
                .from('inspeccion_resultados')
                .insert([{
                    inspeccion_id: resultadoData.inspeccion_id,
                    prueba_id: resultadoData.prueba_id,
                    resultado: resultadoData.resultado,
                    observaciones: resultadoData.observaciones,
                    inspector_id: this.currentUser?.id
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error guardando resultado de inspección:', error);
            return { success: false, error: error.message };
        }
    }

    // BITÁCORA Y COMENTARIOS
    async getVehiculoBitacora(vehiculoId, limit = 50) {
        try {
            const { data, error } = await this.supabase
                .from('vehiculo_bitacora')
                .select(`
                    *,
                    usuario:usuario_id(id, user_metadata)
                `)
                .eq('vehiculo_id', vehiculoId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error obteniendo bitácora del vehículo:', error);
            return { success: false, error: error.message };
        }
    }

    async enviarMensajeBitacora(mensajeData) {
        try {
            const { data, error } = await this.supabase
                .from('vehiculo_bitacora')
                .insert([{
                    vehiculo_id: mensajeData.vehiculo_id,
                    usuario_id: this.currentUser?.id,
                    usuario_nombre: this.currentUser?.user_metadata?.full_name || 'Usuario',
                    mensaje: mensajeData.mensaje,
                    tipo: mensajeData.tipo || 'comentario',
                    contenido_url: mensajeData.contenido_url || null,
                    mensaje_padre_id: mensajeData.mensaje_padre_id || null
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error enviando mensaje a bitácora:', error);
            return { success: false, error: error.message };
        }
    }

    // KILOMETRAJE
    async getVehiculoKilometraje(vehiculoId, limit = 100) {
        try {
            const { data, error } = await this.supabase
                .from('vehiculo_kilometraje')
                .select(`
                    *,
                    usuario:usuario_id(id, user_metadata)
                `)
                .eq('vehiculo_id', vehiculoId)
                .order('fecha_registro', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error obteniendo kilometraje del vehículo:', error);
            return { success: false, error: error.message };
        }
    }

    async registrarKilometraje(kilometrajeData) {
        try {
            const { data, error } = await this.supabase
                .from('vehiculo_kilometraje')
                .insert([{
                    vehiculo_id: kilometrajeData.vehiculo_id,
                    valor: kilometrajeData.valor,
                    unidad: kilometrajeData.unidad,
                    tipo_registro: kilometrajeData.tipo_registro,
                    fecha_registro: kilometrajeData.fecha_registro || new Date().toISOString(),
                    usuario_id: this.currentUser?.id,
                    usuario_nombre: this.currentUser?.user_metadata?.full_name || 'Usuario',
                    observaciones: kilometrajeData.observaciones || '',
                    evidencia_url: kilometrajeData.evidencia_url || null
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error registrando kilometraje:', error);
            return { success: false, error: error.message };
        }
    }

    // DISPOSITIVOS GPS
    async getVehiculoGPS(vehiculoId) {
        try {
            const { data, error } = await this.supabase
                .from('vehiculo_gps_dispositivos')
                .select(`
                    *,
                    gps_comentarios(*)
                `)
                .eq('vehiculo_id', vehiculoId)
                .eq('activo', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error obteniendo dispositivos GPS del vehículo:', error);
            return { success: false, error: error.message };
        }
    }

    async agregarDispositivoGPS(gpsData) {
        try {
            const { data, error } = await this.supabase
                .from('vehiculo_gps_dispositivos')
                .insert([{
                    vehiculo_id: gpsData.vehiculo_id,
                    modelo: gpsData.modelo,
                    numero_serie: gpsData.numero_serie,
                    numero_sim: gpsData.numero_sim,
                    estado: gpsData.estado || 'activo',
                    observaciones: gpsData.observaciones || '',
                    instalado_por_id: this.currentUser?.id,
                    instalado_por_nombre: this.currentUser?.user_metadata?.full_name || 'Usuario'
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error agregando dispositivo GPS:', error);
            return { success: false, error: error.message };
        }
    }

    async agregarComentarioGPS(comentarioData) {
        try {
            const { data, error } = await this.supabase
                .from('gps_comentarios')
                .insert([{
                    dispositivo_id: comentarioData.dispositivo_id,
                    usuario_id: this.currentUser?.id,
                    usuario_nombre: this.currentUser?.user_metadata?.full_name || 'Usuario',
                    comentario: comentarioData.comentario,
                    tipo_contenido: comentarioData.tipo_contenido || 'texto',
                    contenido_url: comentarioData.contenido_url || null
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error agregando comentario GPS:', error);
            return { success: false, error: error.message };
        }
    }

    // SOLICITUDES DE REPUESTOS
    async getSolicitudesRepuestos(filtros = {}) {
        try {
            let query = this.supabase
                .from('solicitudes_repuestos')
                .select(`
                    *,
                    vehiculo:vehiculo_id(placas, numero_economico),
                    solicitante:solicitante_id(id, user_metadata),
                    responsable:responsable_id(id, user_metadata)
                `)
                .order('created_at', { ascending: false });

            // Aplicar filtros
            if (filtros.estado) {
                query = query.eq('estado', filtros.estado);
            }
            if (filtros.vehiculo_id) {
                query = query.eq('vehiculo_id', filtros.vehiculo_id);
            }
            if (filtros.prioridad) {
                query = query.eq('prioridad', filtros.prioridad);
            }

            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('❌ Error obteniendo solicitudes de repuestos:', error);
            return { success: false, error: error.message };
        }
    }

    async crearSolicitudRepuesto(solicitudData) {
        try {
            const { data, error } = await this.supabase
                .from('solicitudes_repuestos')
                .insert([{
                    vehiculo_id: solicitudData.vehiculo_id,
                    titulo: solicitudData.titulo,
                    nombre_repuesto: solicitudData.nombre_repuesto,
                    numero_parte: solicitudData.numero_parte || '',
                    descripcion: solicitudData.descripcion || '',
                    prioridad: solicitudData.prioridad || 'media',
                    estado: 'nueva',
                    cantidad_solicitada: solicitudData.cantidad_solicitada || 1,
                    costo_estimado: solicitudData.costo_estimado || null,
                    proveedor_sugerido: solicitudData.proveedor_sugerido || '',
                    fecha_requerida: solicitudData.fecha_requerida || null,
                    solicitante_id: this.currentUser?.id,
                    solicitante_nombre: this.currentUser?.user_metadata?.full_name || 'Usuario',
                    observaciones: solicitudData.observaciones || ''
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error creando solicitud de repuesto:', error);
            return { success: false, error: error.message };
        }
    }

    async actualizarEstadoSolicitud(solicitudId, nuevoEstado, responsableId = null) {
        try {
            const updateData = { estado: nuevoEstado };
            
            if (responsableId) {
                updateData.responsable_id = responsableId;
                // Obtener nombre del responsable
                const { data: userData } = await this.supabase.auth.getUser();
                if (userData?.user) {
                    updateData.responsable_nombre = userData.user.user_metadata?.full_name || 'Usuario';
                }
            }

            if (nuevoEstado === 'completada') {
                updateData.fecha_completada = new Date().toISOString();
            }

            const { data, error } = await this.supabase
                .from('solicitudes_repuestos')
                .update(updateData)
                .eq('id', solicitudId)
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error actualizando estado de solicitud:', error);
            return { success: false, error: error.message };
        }
    }

    async agregarComentarioSolicitud(comentarioData) {
        try {
            const { data, error } = await this.supabase
                .from('solicitud_comentarios')
                .insert([{
                    solicitud_id: comentarioData.solicitud_id,
                    usuario_id: this.currentUser?.id,
                    usuario_nombre: this.currentUser?.user_metadata?.full_name || 'Usuario',
                    comentario: comentarioData.comentario,
                    tipo_contenido: comentarioData.tipo_contenido || 'texto',
                    contenido_url: comentarioData.contenido_url || null
                }])
                .select();

            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('❌ Error agregando comentario a solicitud:', error);
            return { success: false, error: error.message };
        }
    }
}

// Instancia global del servicio API
const api = new ApiService();