/**
 * Product Form JavaScript
 * Relational Inventory Control & Stock Tracking System
 */

document.addEventListener('DOMContentLoaded', function() {
    // Calculate profit display
    function calculateProfit() {
        const purchasePrice = parseFloat(document.getElementById('purchase_price').value) || 0;
        const sellingPrice = parseFloat(document.getElementById('selling_price').value) || 0;
        const profit = sellingPrice - purchasePrice;
        
        const profitDisplay = document.getElementById('profit_display');
        if (profitDisplay) {
            profitDisplay.textContent = formatCurrency(profit);
            profitDisplay.style.color = profit >= 0 ? '#28a745' : '#dc3545';
        }
    }

    // Generate SKU automatically
    function generateSKU() {
        const name = document.getElementById('name').value;
        const categorySelect = document.getElementById('category_id');
        const categoryText = categorySelect.options[categorySelect.selectedIndex]?.text || '';
        
        if (name && !document.getElementById('sku').value) {
            // Generate SKU from name and category
            const nameAbbr = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
            const categoryAbbr = categoryText.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
            const timestamp = Date.now().toString().slice(-4);
            
            const sku = `${nameAbbr}${categoryAbbr}${timestamp}`;
            document.getElementById('sku').value = sku;
        }
    }

    // Validate stock levels
    function validateStockLevels() {
        const minStock = parseFloat(document.getElementById('min_stock_level').value) || 0;
        const maxStock = parseFloat(document.getElementById('max_stock_level').value) || 0;
        const currentStock = parseFloat(document.getElementById('quantity').value) || 0;

        // Show warnings for stock levels
        if (minStock >= maxStock) {
            showFieldWarning('max_stock_level', 'Maximum stock level should be greater than minimum');
        } else {
            clearFieldWarning('max_stock_level');
        }

        if (currentStock < minStock) {
            showFieldWarning('quantity', 'Current stock is below minimum level');
        } else if (currentStock > maxStock) {
            showFieldWarning('quantity', 'Current stock exceeds maximum level');
        } else {
            clearFieldWarning('quantity');
        }
    }

    // Show field warning
    function showFieldWarning(fieldName, message) {
        const field = document.getElementById(fieldName);
        if (!field) return;

        clearFieldWarning(fieldName);
        field.classList.add('warning');

        const warningElement = document.createElement('div');
        warningElement.className = 'warning-message';
        warningElement.textContent = message;
        warningElement.style.color = '#ffc107';
        warningElement.style.fontSize = '0.8rem';
        warningElement.style.marginTop = '0.25rem';

        field.parentNode.insertBefore(warningElement, field.nextSibling);
    }

    // Clear field warning
    function clearFieldWarning(fieldName) {
        const field = document.getElementById(fieldName);
        if (!field) return;

        field.classList.remove('warning');

        const warningElement = field.parentNode.querySelector('.warning-message');
        if (warningElement) {
            warningElement.remove();
        }
    }

    // Add event listeners
    const purchasePriceInput = document.getElementById('purchase_price');
    const sellingPriceInput = document.getElementById('selling_price');
    const nameInput = document.getElementById('name');
    const categorySelect = document.getElementById('category_id');
    const quantityInput = document.getElementById('quantity');
    const minStockInput = document.getElementById('min_stock_level');
    const maxStockInput = document.getElementById('max_stock_level');

    if (purchasePriceInput) {
        purchasePriceInput.addEventListener('input', calculateProfit);
    }
    if (sellingPriceInput) {
        sellingPriceInput.addEventListener('input', calculateProfit);
    }
    if (nameInput) {
        nameInput.addEventListener('input', generateSKU);
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', generateSKU);
    }
    if (quantityInput || minStockInput || maxStockInput) {
        [quantityInput, minStockInput, maxStockInput].forEach(input => {
            if (input) {
                input.addEventListener('input', validateStockLevels);
            }
        });
    }

    // Initialize calculations
    calculateProfit();
    validateStockLevels();

    // Image upload preview (if implemented)
    function initImageUpload() {
        const imageInput = document.getElementById('image_url');
        const previewContainer = document.getElementById('image_preview');

        if (imageInput && previewContainer) {
            imageInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewContainer.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 5px;">`;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    initImageUpload();
});

// Format currency helper
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}
