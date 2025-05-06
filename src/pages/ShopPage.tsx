import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart } from 'lucide-react';
import { useShopStore } from '../store/shopStore';
import ProductCard from '../components/shop/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ShopPage() {
  const { products, fetchProducts, isLoading, getCartItemsCount } = useShopStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized) {
      fetchProducts();
      setIsInitialized(true);
    }
  }, [fetchProducts, isInitialized]);
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Hero section */}
      <div className="relative bg-secondary-900">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Beauty Products"
          />
          <div className="absolute inset-0 bg-secondary-900 opacity-70"></div>
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">Beauty Shop</h1>
          <p className="mt-6 text-xl text-white max-w-3xl">
            Discover our curated selection of premium beauty products to enhance your daily routine.
          </p>
          
          <div className="mt-10 flex items-center">
            {getCartItemsCount() > 0 && (
              <Link
                to="/cart"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                View Cart ({getCartItemsCount()})
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Product listing */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="max-w-lg mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search products"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Try searching with different terms or browse all of our products.
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}