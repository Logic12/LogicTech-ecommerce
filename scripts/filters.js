document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const priceFilter = document.getElementById('price-filter'); // Price filter dropdown

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => {
                btn.classList.remove('bg-primary', 'text-white');
                btn.classList.add('bg-gray-200');
            });

            // Add active class to clicked button
            button.classList.add('bg-primary', 'text-white');
            button.classList.remove('bg-gray-200');

            const filter = button.dataset.filter;
            filterProducts('category', filter);
        });
    });

    // Price range filter
    priceFilter.addEventListener('change', function () {
        const [min, max] = this.value.split('-').map(Number);
        filterProducts('price', { min, max });
    });

    function filterProducts(type, value) {
        const products = document.querySelectorAll('.product-card');

        products.forEach(product => {
            const price = parseFloat(product.querySelector('.text-primary').textContent.replace(/[^0-9.]/g, ''));
            const category = product.dataset.category;
            const stock = parseInt(product.dataset.stock);

            let shouldShow = true;

            // Price filter
            if (type === 'price') {
                shouldShow = price >= value.min && (isNaN(value.max) || price <= value.max);
            }

            // Category filter
            if (type === 'category' && value !== 'all') {
                shouldShow = category.includes(value);
            }

            // Stock filter
            if (type === 'stock') {
                shouldShow = (value === 'in-stock' && stock > 0) ||
                    (value === 'out-of-stock' && stock <= 0);
            }

            product.style.display = shouldShow ? 'block' : 'none';
        });
    }
});