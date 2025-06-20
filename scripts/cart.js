const Cart = () => {
  const [cartItems, setCartItems] = React.useState(JSON.parse(localStorage.getItem('cart')) || []);
  const [isCartOpen, setIsCartOpen] = React.useState(false);

  const saveToLocalStorage = (items) => {
    localStorage.setItem('cart', JSON.stringify(items));
  };

  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    const updatedItems = existingItem
      ? cartItems.map(item => 
          item.id === product.id 
            ? {...item, quantity: item.quantity + 1} 
            : item
        )
      : [...cartItems, {...product, quantity: 1}];
    
    setCartItems(updatedItems);
    saveToLocalStorage(updatedItems);
  };

  const removeItem = (id) => {
    const updatedItems = cartItems.filter(item => item.id !== id);
    setCartItems(updatedItems);
    saveToLocalStorage(updatedItems);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedItems = cartItems.map(item => 
      item.id === id ? {...item, quantity: newQuantity} : item
    );
    setCartItems(updatedItems);
    saveToLocalStorage(updatedItems);
  };

  return (
    <div className="relative">
      <button onClick={() => setIsCartOpen(!isCartOpen)} className="flex items-center">
        <i className="fas fa-shopping-cart text-gray-600 hover:text-primary cursor-pointer text-xl"></i>
        {cartItems.length > 0 && (
          <span className="cart-badge">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
        )}
      </button>

      {isCartOpen && (
        <div className="cart-dropdown">
          <h4 className="font-bold text-lg mb-4">Your Cart</h4>
          {cartItems.length === 0 ? (
            <p className="text-gray-500 py-4">Your cart is empty</p>
          ) : (
            <>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center border-b pb-2">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded"/>
                    <div className="ml-3 flex-1">
                      <h5 className="font-medium">{item.name}</h5>
                      <p className="text-primary">{item.price}</p>
                      <div className="flex items-center mt-1">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 bg-gray-200 rounded"
                        >-</button>
                        <span className="mx-2">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 bg-gray-200 rounded"
                        >+</button>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 ml-2"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between font-bold mb-4">
                  <span>Total:</span>
                  <span>₵{cartItems.reduce((sum, item) => sum + (parseFloat(item.price.replace(/[^0-9.]/g, '')) * item.quantity), 0).toFixed(2)}</span>
                </div>
                {/* Shipping Options */}
                <div className="mb-4">
                  <h5 className="font-bold mb-2">Shipping Options</h5>
                  <select className="w-full p-2 border rounded">
                    <option value="">Select Delivery Option</option>
                    <option value="standard">Standard Delivery (₵50 - 3-5 days)</option>
                    <option value="express">Express Delivery (₵120 - 1-2 days)</option>
                    <option value="pickup">Store Pickup (Free)</option>
                  </select>
                </div>
                <button className="w-full bg-primary hover:bg-secondary text-white py-2 rounded-lg">
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Mount the cart
ReactDOM.render(<Cart />, document.querySelector('.cart-icon-container'));