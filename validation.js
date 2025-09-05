// =====================================================
// SISTEMA DE VALIDACIÓN GLOBAL
// =====================================================

class ValidationService {
    constructor() {
        this.rules = {
            required: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            phone: (value) => /^[\d\-\(\)\s\+]+$/.test(value),
            placa: (value) => this.validatePlaca(value),
            vin: (value) => /^[A-HJ-NPR-Z0-9]{17}$/.test(value.toUpperCase()),
            year: (value) => {
                const year = parseInt(value);
                return year >= 1900 && year <= new Date().getFullYear() + 2;
            },
            positiveNumber: (value) => parseFloat(value) >= 0,
            minLength: (min) => (value) => value.toString().length >= min,
            maxLength: (max) => (value) => value.toString().length <= max,
            pattern: (regex) => (value) => regex.test(value)
        };
    }

    validatePlaca(placa) {
        if (!placa || typeof placa !== 'string') return false;
        
        const patterns = [
            /^[A-Z]{3}-\d{3}$/,      // ABC-123
            /^[A-Z]{3}\d{3}$/,       // ABC123
            /^[A-Z]{2,3}\d{3,4}$/,   // AB123, ABC123, AB1234, ABC1234
            /^[A-Z]{2}-\d{4}$/,      // AB-1234
            /^\d{6}$/,               // 123456
            /^[A-Z]{1,3}\d{1,4}$/    // A123, AB123, ABC1234
        ];
        
        return patterns.some(pattern => pattern.test(placa.toUpperCase()));
    }

    validate(fieldName, value, rules) {
        const errors = [];
        
        for (const rule of rules) {
            if (typeof rule === 'string') {
                // Regla simple
                if (!this.rules[rule](value)) {
                    errors.push(this.getErrorMessage(fieldName, rule));
                }
            } else if (typeof rule === 'object') {
                // Regla con parámetros
                const ruleName = Object.keys(rule)[0];
                const ruleValue = rule[ruleName];
                
                if (ruleName === 'required' && !this.rules.required(value)) {
                    errors.push(`${fieldName} es requerido`);
                } else if (ruleName === 'minLength' && !this.rules.minLength(ruleValue)(value)) {
                    errors.push(`${fieldName} debe tener al menos ${ruleValue} caracteres`);
                } else if (ruleName === 'maxLength' && !this.rules.maxLength(ruleValue)(value)) {
                    errors.push(`${fieldName} debe tener máximo ${ruleValue} caracteres`);
                } else if (ruleName === 'pattern' && !this.rules.pattern(ruleValue)(value)) {
                    errors.push(`${fieldName} tiene un formato inválido`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateForm(formData, schema) {
        const results = {};
        let isValid = true;
        
        for (const [fieldName, rules] of Object.entries(schema)) {
            const value = formData[fieldName];
            const validation = this.validate(fieldName, value, rules);
            
            results[fieldName] = validation;
            if (!validation.isValid) {
                isValid = false;
            }
        }
        
        return {
            isValid: isValid,
            fields: results
        };
    }

    getErrorMessage(fieldName, rule) {
        const messages = {
            required: `${fieldName} es requerido`,
            email: `${fieldName} debe ser un email válido`,
            phone: `${fieldName} debe ser un teléfono válido`,
            placa: `${fieldName} debe ser una placa válida`,
            vin: `${fieldName} debe ser un VIN válido (17 caracteres)`,
            year: `${fieldName} debe ser un año válido`,
            positiveNumber: `${fieldName} debe ser un número positivo`
        };
        
        return messages[rule] || `${fieldName} es inválido`;
    }

    // Validaciones específicas para el sistema de flota
    validateVehiculo(data) {
        const schema = {
            placa: ['required', 'placa'],
            marca_id: ['required'],
            modelo_id: ['required'],
            anio: ['required', 'year'],
            vin: ['vin'], // Opcional
            color: ['required'],
            arrendadora_id: ['required']
        };
        
        return this.validateForm(data, schema);
    }

    validateColaborador(data) {
        const schema = {
            nombre: ['required', { minLength: 2 }, { maxLength: 100 }],
            identificacion: ['required', { minLength: 5 }, { maxLength: 20 }],
            telefono: ['phone'],
            email: ['email'],
            puesto: ['required', { minLength: 2 }, { maxLength: 50 }]
        };
        
        return this.validateForm(data, schema);
    }

    validateTarea(data) {
        const schema = {
            titulo: ['required', { minLength: 5 }, { maxLength: 200 }],
            descripcion: ['required', { minLength: 10 }, { maxLength: 1000 }],
            prioridad: ['required'],
            estado: ['required']
        };
        
        return this.validateForm(data, schema);
    }

    validateArrendadora(data) {
        const schema = {
            nombre: ['required', { minLength: 2 }, { maxLength: 100 }],
            telefono: ['phone'],
            email: ['email'],
            direccion: ['required', { minLength: 10 }, { maxLength: 200 }]
        };
        
        return this.validateForm(data, schema);
    }
}

// Crear instancia global
window.validationService = new ValidationService();

// Funciones de utilidad para validación en tiempo real
window.validateField = function(fieldElement, rules) {
    const fieldName = fieldElement.getAttribute('data-field-name') || fieldElement.name;
    const value = fieldElement.value;
    
    const validation = window.validationService.validate(fieldName, value, rules);
    
    // Actualizar clases CSS
    fieldElement.classList.remove('is-valid', 'is-invalid');
    if (validation.isValid) {
        fieldElement.classList.add('is-valid');
    } else {
        fieldElement.classList.add('is-invalid');
    }
    
    // Mostrar mensajes de error
    let errorContainer = fieldElement.parentNode.querySelector('.invalid-feedback');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'invalid-feedback';
        fieldElement.parentNode.appendChild(errorContainer);
    }
    
    if (validation.errors.length > 0) {
        errorContainer.textContent = validation.errors[0];
        errorContainer.style.display = 'block';
    } else {
        errorContainer.style.display = 'none';
    }
    
    return validation;
};

// Validación automática en tiempo real
document.addEventListener('DOMContentLoaded', function() {
    // Agregar validación en tiempo real a campos con data-validate
    document.querySelectorAll('[data-validate]').forEach(field => {
        const rules = field.getAttribute('data-validate').split(',');
        
        field.addEventListener('blur', function() {
            validateField(this, rules);
        });
        
        field.addEventListener('input', function() {
            // Validar solo si ya se ha validado antes (evitar validación prematura)
            if (this.classList.contains('is-valid') || this.classList.contains('is-invalid')) {
                validateField(this, rules);
            }
        });
    });
});
