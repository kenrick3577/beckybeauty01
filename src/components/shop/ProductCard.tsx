import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useShopStore } from '../../store/shopStore';
import { formatPrice } from '../../lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useShopStore();

  return (
    <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 text-xs sm:text-sm">
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 group-hover:opacity-75">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-40 w-full object-cover object-center"
        />
      </div>
      <div className="p-3">
        <h3 className="text-base font-medium text-gray-900 line-clamp-1">{product.name}</h3>
        <p className="mt-1 text-gray-500 line-clamp-2 text-xs">{product.description}</p>
        <div className="mt-2 flex flex-col">
          <p className="text-base font-medium text-gray-900 mb-2">{formatPrice(product.price)}</p>
          <button
            onClick={() => addToCart(product)}
            className="inline-flex items-center px-3 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full justify-center"
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            Add to Cart
          </button>
        </div>
        
        <div className="mt-2 text-gray-500 text-xs">
          {product.stock > 0 ? (
            product.stock < 5 ? (
              <span className="text-warning-600">Only {product.stock} left in stock</span>
            ) : (
              <span>In Stock</span>
            )
          ) : (
            <span className="text-error-600">Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  );
}