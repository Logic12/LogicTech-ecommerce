// Update stock levels on add to cart
document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const productCard = this.closest('.product-card');
      const stockElement = productCard.querySelector('.stock-count');
      let stock = parseInt(stockElement.textContent);
      
      if (stock > 0) {
        stock--;
        stockElement.textContent = stock;
        productCard.dataset.stock = stock;
        
        // Update progress bar
        const maxStock = 5; // Set your initial stock value
        const percent = (stock / maxStock) * 100;
        productCard.querySelector('.stock-bar').style.width = `${percent}%`;
        
        // Disable if out of stock
        if (stock === 0) {
          this.disabled = true;
          this.textContent = 'Out of Stock';
          this.classList.remove('bg-primary', 'hover:bg-secondary');
          this.classList.add('bg-gray-400', 'cursor-not-allowed');
        }
      }
    });
  });