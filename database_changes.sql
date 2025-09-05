-- =====================================================
-- CAMBIOS EN BASE DE DATOS PARA SISTEMA DE FLOTA v.3
-- =====================================================

-- WARNING: Ejecutar en orden secuencial
-- Backup de datos antes de ejecutar

-- =====================================================
-- 1. CREAR NUEVAS TABLAS DE CATÁLOGOS
-- =====================================================

-- Tabla de carrocerías
CREATE TABLE IF NOT EXISTS public.carrocerias (
    id bigint NOT NULL DEFAULT nextval('carrocerias_id_seq'::regclass),
    nombre text NOT NULL UNIQUE,
    CONSTRAINT carrocerias_pkey PRIMARY KEY (id)
);

-- Tabla de colores
CREATE TABLE IF NOT EXISTS public.colores (
    id bigint NOT NULL DEFAULT nextval('colores_id_seq'::regclass),
    nombre text NOT NULL UNIQUE,
    CONSTRAINT colores_pkey PRIMARY KEY (id)
);

-- Tabla de combustibles
CREATE TABLE IF NOT EXISTS public.combustibles (
    id bigint NOT NULL DEFAULT nextval('combustibles_id_seq'::regclass),
    nombre text NOT NULL UNIQUE,
    CONSTRAINT combustibles_pkey PRIMARY KEY (id)
);

-- Tabla de transmisiones
CREATE TABLE IF NOT EXISTS public.transmisiones (
    id bigint NOT NULL DEFAULT nextval('transmisiones_id_seq'::regclass),
    nombre text NOT NULL UNIQUE,
    CONSTRAINT transmisiones_pkey PRIMARY KEY (id)
);

-- Tabla de tracciones
CREATE TABLE IF NOT EXISTS public.tracciones (
    id bigint NOT NULL DEFAULT nextval('tracciones_id_seq'::regclass),
    nombre text NOT NULL UNIQUE,
    CONSTRAINT tracciones_pkey PRIMARY KEY (id)
);

-- Tabla de estados actuales
CREATE TABLE IF NOT EXISTS public.estados_actuales (
    id bigint NOT NULL DEFAULT nextval('estados_actuales_id_seq'::regclass),
    nombre text NOT NULL UNIQUE,
    CONSTRAINT estados_actuales_pkey PRIMARY KEY (id)
);

-- Tabla de vendedores
CREATE TABLE IF NOT EXISTS public.vendedores (
    id bigint NOT NULL DEFAULT nextval('vendedores_id_seq'::regclass),
    nombre text NOT NULL,
    telefono text,
    email text,
    CONSTRAINT vendedores_pkey PRIMARY KEY (id)
);

-- Tabla de grupos de WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_grupos (
    id bigint NOT NULL DEFAULT nextval('whatsapp_grupos_id_seq'::regclass),
    nombre text,
    group_id text NOT NULL UNIQUE,
    CONSTRAINT whatsapp_grupos_pkey PRIMARY KEY (id)
);

-- Tabla de apoderados
CREATE TABLE IF NOT EXISTS public.apoderados (
    id bigint NOT NULL DEFAULT nextval('apoderados_id_seq'::regclass),
    arrendadora_id bigint NOT NULL,
    nombre text NOT NULL,
    identificacion text UNIQUE,
    CONSTRAINT apoderados_pkey PRIMARY KEY (id),
    CONSTRAINT apoderados_arrendadora_id_fkey FOREIGN KEY (arrendadora_id) REFERENCES public.arrendadoras(id)
);

-- =====================================================
-- 2. MODIFICAR TABLA ARRENDADORAS
-- =====================================================

-- Agregar campos faltantes a arrendadoras
ALTER TABLE public.arrendadoras 
ADD COLUMN IF NOT EXISTS apoderado text,
ADD COLUMN IF NOT EXISTS cedula_apoderado text;

-- =====================================================
-- 3. MODIFICAR TABLA VEHICULOS
-- =====================================================

-- Agregar nuevos campos a la tabla vehiculos
ALTER TABLE public.vehiculos 
ADD COLUMN IF NOT EXISTS estatus text,
ADD COLUMN IF NOT EXISTS ubicacion text,
ADD COLUMN IF NOT EXISTS renta_semanal numeric,
ADD COLUMN IF NOT EXISTS plazo_semanas smallint,
ADD COLUMN IF NOT EXISTS cliente_actual text,
ADD COLUMN IF NOT EXISTS valor_adquisicion numeric,
ADD COLUMN IF NOT EXISTS fecha_adquisicion date,
ADD COLUMN IF NOT EXISTS grupo_whatsapp text,
ADD COLUMN IF NOT EXISTS carroceria_id bigint,
ADD COLUMN IF NOT EXISTS color_id bigint,
ADD COLUMN IF NOT EXISTS combustible_id bigint,
ADD COLUMN IF NOT EXISTS transmision_id bigint,
ADD COLUMN IF NOT EXISTS traccion_id bigint,
ADD COLUMN IF NOT EXISTS apoderado_id bigint,
ADD COLUMN IF NOT EXISTS vendedor_id bigint,
ADD COLUMN IF NOT EXISTS whatsapp_grupo_id bigint,
ADD COLUMN IF NOT EXISTS estado_actual_id bigint;

-- Agregar constraints de foreign keys (con manejo de errores)
DO $$
BEGIN
    -- Carrocería
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vehiculos_carroceria_id_fkey') THEN
        ALTER TABLE public.vehiculos ADD CONSTRAINT vehiculos_carroceria_id_fkey 
            FOREIGN KEY (carroceria_id) REFERENCES public.carrocerias(id);
    END IF;
    
    -- Color
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vehiculos_color_id_fkey') THEN
        ALTER TABLE public.vehiculos ADD CONSTRAINT vehiculos_color_id_fkey 
            FOREIGN KEY (color_id) REFERENCES public.colores(id);
    END IF;
    
    -- Combustible
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vehiculos_combustible_id_fkey') THEN
        ALTER TABLE public.vehiculos ADD CONSTRAINT vehiculos_combustible_id_fkey 
            FOREIGN KEY (combustible_id) REFERENCES public.combustibles(id);
    END IF;
    
    -- Transmisión
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vehiculos_transmision_id_fkey') THEN
        ALTER TABLE public.vehiculos ADD CONSTRAINT vehiculos_transmision_id_fkey 
            FOREIGN KEY (transmision_id) REFERENCES public.transmisiones(id);
    END IF;
    
    -- Tracción
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vehiculos_traccion_id_fkey') THEN
        ALTER TABLE public.vehiculos ADD CONSTRAINT vehiculos_traccion_id_fkey 
            FOREIGN KEY (traccion_id) REFERENCES public.tracciones(id);
    END IF;
    
    -- Apoderado
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vehiculos_apoderado_id_fkey') THEN
        ALTER TABLE public.vehiculos ADD CONSTRAINT vehiculos_apoderado_id_fkey 
            FOREIGN KEY (apoderado_id) REFERENCES public.apoderados(id);
    END IF;
    
    -- Vendedor
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vehiculos_vendedor_id_fkey') THEN
        ALTER TABLE public.vehiculos ADD CONSTRAINT vehiculos_vendedor_id_fkey 
            FOREIGN KEY (vendedor_id) REFERENCES public.vendedores(id);
    END IF;
    
    -- WhatsApp grupo
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vehiculos_whatsapp_grupo_id_fkey') THEN
        ALTER TABLE public.vehiculos ADD CONSTRAINT vehiculos_whatsapp_grupo_id_fkey 
            FOREIGN KEY (whatsapp_grupo_id) REFERENCES public.whatsapp_grupos(id);
    END IF;
    
    -- Estado actual
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vehiculos_estado_actual_id_fkey') THEN
        ALTER TABLE public.vehiculos ADD CONSTRAINT vehiculos_estado_actual_id_fkey 
            FOREIGN KEY (estado_actual_id) REFERENCES public.estados_actuales(id);
    END IF;
END $$;

-- Agregar constraints de validación
ALTER TABLE public.vehiculos 
ADD CONSTRAINT IF NOT EXISTS vehiculos_plazo_semanas_check 
    CHECK (plazo_semanas IS NULL OR plazo_semanas > 0),
ADD CONSTRAINT IF NOT EXISTS vehiculos_renta_semanal_check 
    CHECK (renta_semanal IS NULL OR renta_semanal >= 0),
ADD CONSTRAINT IF NOT EXISTS vehiculos_valor_adquisicion_check 
    CHECK (valor_adquisicion IS NULL OR valor_adquisicion >= 0);

-- =====================================================
-- 4. INSERTAR DATOS INICIALES EN CATÁLOGOS
-- =====================================================

-- Insertar colores básicos
INSERT INTO public.colores (nombre) VALUES 
    ('Blanco'), ('Negro'), ('Gris'), ('Plateado'), ('Azul'), 
    ('Rojo'), ('Verde'), ('Amarillo'), ('Naranja'), ('Marrón')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar tipos de carrocería
INSERT INTO public.carrocerias (nombre) VALUES 
    ('Sedán'), ('SUV'), ('Pickup'), ('Van'), ('Hatchback'), 
    ('Wagon'), ('Coupe'), ('Convertible'), ('Truck'), ('Bus')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar tipos de combustible
INSERT INTO public.combustibles (nombre) VALUES 
    ('Gasolina'), ('Diesel'), ('Eléctrico'), ('Híbrido'), ('Gas Natural'),
    ('Etanol'), ('Biodiesel'), ('Hidrógeno')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar tipos de transmisión
INSERT INTO public.transmisiones (nombre) VALUES 
    ('Manual'), ('Automática'), ('CVT'), ('Semi-automática'), ('Tiptronic')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar tipos de tracción
INSERT INTO public.tracciones (nombre) VALUES 
    ('Delantera'), ('Trasera'), ('4x4'), ('AWD'), ('4WD')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar estados actuales básicos
INSERT INTO public.estados_actuales (nombre) VALUES 
    ('Disponible'), ('En Renta'), ('Mantenimiento'), ('Fuera de Servicio'),
    ('Reservado'), ('En Tránsito'), ('Vendido')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- 5. CREAR ÍNDICES PARA OPTIMIZAR RENDIMIENTO
-- =====================================================

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_vehiculos_placa ON public.vehiculos(placa);
CREATE INDEX IF NOT EXISTS idx_vehiculos_vin ON public.vehiculos(vin);
CREATE INDEX IF NOT EXISTS idx_vehiculos_estatus ON public.vehiculos(estatus);
CREATE INDEX IF NOT EXISTS idx_vehiculos_arrendadora ON public.vehiculos(arrendadora_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_estado_inventario ON public.vehiculos(estado_inventario_id);

-- =====================================================
-- 6. ACTUALIZAR SECUENCIAS (si es necesario)
-- =====================================================

-- Verificar que las secuencias existan y estén configuradas correctamente
-- Esto es opcional y depende de tu configuración de PostgreSQL

-- =====================================================
-- 7. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 'Tablas creadas:' as status, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'carrocerias', 'colores', 'combustibles', 'transmisiones', 
    'tracciones', 'estados_actuales', 'vendedores', 'whatsapp_grupos', 'apoderados'
)
ORDER BY table_name;

-- Verificar estructura de la tabla vehiculos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vehiculos'
ORDER BY ordinal_position;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Ejecutar este script en orden secuencial
-- 2. Hacer backup antes de ejecutar
-- 3. Verificar que no haya conflictos con datos existentes
-- 4. Los campos nuevos se crean como NULL para no afectar registros existentes
-- 5. Las foreign keys se crean después de crear las tablas referenciadas
