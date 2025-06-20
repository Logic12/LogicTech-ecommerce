const Modal = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [product, setProduct] = React.useState(null);
    const [rating, setRating] = React.useState(0);
  
    // Open modal when "View Details" is clicked
    React.useEffect(() => {
      document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', () => {
          const productData = JSON.parse(button.dataset.product);
          setProduct(productData);
          setIsOpen(true);
        });
      });
    }, []);
  
    return (
      <>
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <button 
                onClick={() => setIsOpen(false)} 
                className="float-right text-2xl font-bold"
              >
                &times;
              </button>
              <img src={product?.image} alt={product?.name} className="w-full h-48 object-cover mb-4 rounded-lg"/>
              <h3 className="text-xl font-bold">{product?.name}</h3>
              <p className="text-primary text-lg my-2">{product?.price}</p>
              <p className="text-gray-600">{product?.desc}</p>
              
              {/* Specifications Table */}
              <div className="mt-6">
                <h4 className="font-bold mb-2">Specifications</h4>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-medium">Processor</td>
                      <td>Apple M1 Chip</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">RAM</td>
                      <td>16GB</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">Storage</td>
                      <td>512GB SSD</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button 
                className="w-full mt-4 bg-primary hover:bg-secondary text-white py-2 rounded-lg"
                onClick={() => {
                  alert(`${product?.name} added to cart!`);
                  setIsOpen(false);
                }}
              >
                Add to Cart
              </button>

              {/* Customer Reviews Section */}
              <div className="mt-8">
                <h4 className="font-bold mb-4">Customer Reviews</h4>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400 mr-2">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`fas fa-star${i < 4 ? '' : '-half-alt'}`}></i>
                        ))}
                      </div>
                      <span className="font-medium">Kwame A.</span>
                    </div>
                    <p className="text-gray-600">"Excellent product, works perfectly!"</p>
                    <p className="text-xs text-gray-400 mt-2">Posted on March 15, 2023</p>
                  </div>

                  {/* Add Review Form */}
                  <form className="mt-6">
                    <h5 className="font-bold mb-2">Write a Review</h5>
                    <div className="rating-stars mb-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <i
                          key={star}
                          className="far fa-star text-yellow-400 cursor-pointer text-xl"
                          onClick={() => setRating(star)}
                        ></i>
                      ))}
                    </div>
                    <textarea
                      className="w-full p-2 border rounded mb-2"
                      rows="3"
                      placeholder="Your review..."
                    ></textarea>
                    <button
                      type="submit"
                      className="bg-primary text-white px-4 py-2 rounded"
                    >
                      Submit Review
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };
  
  ReactDOM.render(<Modal />, document.getElementById('modal-root'));