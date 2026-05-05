/**
 * Form Validation Scripts
 * Relational Inventory Control & Stock Tracking System
 */

// Common validation functions
class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.errors = {};
        this.rules = {};
    }

    // Add validation rule for a field
    addRule(fieldName, rules) {
        this.rules[fieldName] = rules;
    }

    // Validate a single field
    validateField(fieldName, value) {
        const rules = this.rules[fieldName];
        if (!rules) return true;

        let errors = [];

        // Required validation
        if (rules.required && (!value || value.trim() === '')) {
            errors.push('This field is required');
        }

        // Skip other validations if field is empty and not required
        if (!value || value.trim() === '') {
            return errors.length === 0;
        }

        // Email validation
        if (rules.email && !this.isValidEmail(value)) {
            errors.push('Please enter a valid email address');
        }

        // Phone validation
        if (rules.phone && !this.isValidPhone(value)) {
            errors.push('Please enter a valid phone number');
        }

        // Number validation
        if (rules.number && !this.isValidNumber(value)) {
            errors.push('Please enter a valid number');
        }

        // Min/Max validation for numbers
        if (rules.number && value) {
            const num = parseFloat(value);
            if (rules.min !== undefined && num < rules.min) {
                errors.push(`Value must be at least ${rules.min}`);
            }
            if (rules.max !== undefined && num > rules.max) {
                errors.push(`Value must be at most ${rules.max}`);
            }
        }

        // Length validation
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(`Must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Must be at most ${rules.maxLength} characters`);
        }

        // Pattern validation
        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
            errors.push(rules.message || 'Invalid format');
        }

        // Custom validation function
        if (rules.custom && typeof rules.custom === 'function') {
            const customError = rules.custom(value);
            if (customError) {
                errors.push(customError);
            }
        }

        return errors;
    }

    // Validate entire form
    validate() {
        this.errors = {};
        let isValid = true;

        for (const fieldName in this.rules) {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                const errors = this.validateField(fieldName, field.value);
                if (errors.length > 0) {
                    this.errors[fieldName] = errors;
                    isValid = false;
                    this.showFieldError(fieldName, errors);
                } else {
                    this.clearFieldError(fieldName);
                }
            }
        }

        return isValid;
    }

    // Show field errors
    showFieldError(fieldName, errors) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (!field) return;

        // Remove existing error
        this.clearFieldError(fieldName);

        // Add error class
        field.classList.add('error');

        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = errors[0]; // Show first error only

        // Insert error after field
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    // Clear field errors
    clearFieldError(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (!field) return;

        field.classList.remove('error');

        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Utility validation methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }

    isValidNumber(value) {
        return !isNaN(value) && isFinite(value);
    }
}

// Product form validation
function initProductForm() {
    const validator = new FormValidator('productForm');
    
    validator.addRule('name', {
        required: true,
        minLength: 2,
        maxLength: 200
    });

    validator.addRule('purchase_price', {
        required: true,
        number: true,
        min: 0
    });

    validator.addRule('selling_price', {
        required: true,
        number: true,
        min: 0
    });

    validator.addRule('quantity', {
        required: true,
        number: true,
        min: 0
    });

    validator.addRule('min_stock_level', {
        required: true,
        number: true,
        min: 0
    });

    validator.addRule('max_stock_level', {
        required: true,
        number: true,
        min: 0,
        custom: function(value) {
            const minStock = parseFloat(document.getElementById('min_stock_level').value);
            const maxStock = parseFloat(value);
            if (maxStock <= minStock) {
                return 'Maximum stock level must be greater than minimum stock level';
            }
            return null;
        }
    });

    validator.addRule('sku', {
        maxLength: 50,
        pattern: '^[A-Za-z0-9\\-_]+$',
        message: 'SKU can only contain letters, numbers, hyphens, and underscores'
    });

    validator.addRule('barcode', {
        maxLength: 50,
        pattern: '^[A-Za-z0-9]+$',
        message: 'Barcode can only contain letters and numbers'
    });

    // Add real-time validation
    const form = document.getElementById('productForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!validator.validate()) {
                e.preventDefault();
                // Scroll to first error
                const firstError = form.querySelector('.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });

        // Add input event listeners for real-time validation
        Object.keys(validator.rules).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', function() {
                    validator.validateField(fieldName, field.value);
                    const errors = validator.validateField(fieldName, field.value);
                    if (errors.length > 0) {
                        validator.showFieldError(fieldName, errors);
                    } else {
                        validator.clearFieldError(fieldName);
                    }
                });
            }
        });
    }
}

// Supplier form validation
function initSupplierForm() {
    const validator = new FormValidator('supplierForm');
    
    validator.addRule('name', {
        required: true,
        minLength: 2,
        maxLength: 100
    });

    validator.addRule('email', {
        email: true,
        maxLength: 100
    });

    validator.addRule('phone', {
        phone: true,
        maxLength: 20
    });

    validator.addRule('contact_person', {
        maxLength: 100
    });

    validator.addRule('city', {
        maxLength: 50
    });

    validator.addRule('country', {
        maxLength: 50
    });

    // Add form submission handler
    const form = document.getElementById('supplierForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!validator.validate()) {
                e.preventDefault();
                const firstError = form.querySelector('.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
}

// Purchase form validation
function initPurchaseForm() {
    const validator = new FormValidator('purchaseForm');
    
    validator.addRule('supplier_id', {
        required: true
    });

    validator.addRule('product_id', {
        required: true
    });

    validator.addRule('quantity', {
        required: true,
        number: true,
        min: 1
    });

    validator.addRule('unit_price', {
        required: true,
        number: true,
        min: 0.01
    });

    validator.addRule('purchase_date', {
        required: true,
        custom: function(value) {
            const date = new Date(value);
            const today = new Date();
            if (date > today) {
                return 'Purchase date cannot be in the future';
            }
            return null;
        }
    });

    // Add form submission handler
    const form = document.getElementById('purchaseForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!validator.validate()) {
                e.preventDefault();
                const firstError = form.querySelector('.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
}

// Sale form validation
function initSaleForm() {
    const validator = new FormValidator('saleForm');
    
    validator.addRule('product_id', {
        required: true
    });

    validator.addRule('quantity', {
        required: true,
        number: true,
        min: 1,
        custom: function(value) {
            const productSelect = document.getElementById('product_id');
            const selectedOption = productSelect.options[productSelect.selectedIndex];
            const availableStock = parseInt(selectedOption.dataset.stock);
            const requestedQuantity = parseInt(value);
            
            if (requestedQuantity > availableStock) {
                return `Only ${availableStock} units available in stock`;
            }
            return null;
        }
    });

    validator.addRule('unit_price', {
        required: true,
        number: true,
        min: 0.01
    });

    validator.addRule('sale_date', {
        required: true,
        custom: function(value) {
            const date = new Date(value);
            const today = new Date();
            if (date > today) {
                return 'Sale date cannot be in the future';
            }
            return null;
        }
    });

    validator.addRule('customer_email', {
        email: true,
        maxLength: 100
    });

    validator.addRule('customer_phone', {
        phone: true,
        maxLength: 20
    });

    // Add form submission handler
    const form = document.getElementById('saleForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!validator.validate()) {
                e.preventDefault();
                const firstError = form.querySelector('.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
}

// Login form validation
function initLoginForm() {
    const validator = new FormValidator('loginForm');
    
    validator.addRule('username', {
        required: true,
        minLength: 3
    });

    validator.addRule('password', {
        required: true,
        minLength: 4
    });

    // Add form submission handler
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!validator.validate()) {
                e.preventDefault();
                const firstError = form.querySelector('.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
}

// Utility functions
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Auto-save functionality for forms
function initAutoSave(formId, saveUrl) {
    const form = document.getElementById(formId);
    if (!form) return;

    const inputs = form.querySelectorAll('input, select, textarea');
    let saveTimeout;

    function saveFormData() {
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Save to localStorage as backup
        localStorage.setItem(`${formId}_autosave`, JSON.stringify(data));

        // Optionally send to server
        if (saveUrl) {
            fetch(saveUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            }).catch(error => {
                console.log('Auto-save failed:', error);
            });
        }
    }

    inputs.forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveFormData, 1000);
        });
    });

    // Load saved data on page load
    const savedData = localStorage.getItem(`${formId}_autosave`);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    field.value = data[key];
                }
            });
        } catch (error) {
            console.log('Failed to load saved data:', error);
        }
    }

    // Clear saved data on successful submission
    form.addEventListener('submit', () => {
        localStorage.removeItem(`${formId}_autosave`);
    });
}

// Initialize validation when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form validators based on page
    if (document.getElementById('productForm')) {
        initProductForm();
    }
    if (document.getElementById('supplierForm')) {
        initSupplierForm();
    }
    if (document.getElementById('purchaseForm')) {
        initPurchaseForm();
    }
    if (document.getElementById('saleForm')) {
        initSaleForm();
    }
    if (document.getElementById('loginForm')) {
        initLoginForm();
    }

    // Add global error handling
    window.addEventListener('error', function(e) {
        console.error('JavaScript error:', e.error);
    });

    // Add confirmation dialogs for destructive actions
    document.querySelectorAll('[data-confirm]').forEach(element => {
        element.addEventListener('click', function(e) {
            const message = this.getAttribute('data-confirm');
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });
});

// Export functions for use in other scripts
window.FormValidator = FormValidator;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.debounce = debounce;
window.initAutoSave = initAutoSave;
