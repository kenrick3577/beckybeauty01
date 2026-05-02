import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ChevronUp, ChevronDown } from 'lucide-react';
import { useShopStore } from '../../store/shopStore';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../lib/utils';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function Cart() {
  const { 
    cart, 
    removeFromCart, 
    updateCartItemQuantity, 
    getCartTotal, 
    checkout,
    isLoading 
  } = useShopStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleCheckout = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    
    const success = await checkout(user.id);
    if (success) {
      navigate('/checkout-success');
    }
  };
  
  if (cart.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <ShoppingBag className="mx-auto h-10 w-10 text-gray-400" />
        <h2 className="mt-2 text-base font-medium text-gray-900">Your cart is empty</h2>
        <p className="mt-1 text-xs text-gray-500">
          Looks like you haven't added any products to your cart yet.
        </p>
        <div className="mt-4">
          <button
            onClick={() => navigate('/shop')}
            className="inline-flex items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg animate-fade-in text-xs">
      <div className="px-3 py-4 border-b border-gray-200">
        <h3 className="text-base leading-6 font-medium text-gray-900">Your Shopping Cart</h3>
        <p className="mt-1 max-w-2xl text-gray-500 text-xs">
          Review your items below before checkout
        </p>
      </div>
      
      <div className="border-t border-gray-200 px-3 py-3">
        <dl className="divide-y divide-gray-200">
          {cart.map((item) => (
            <div key={item.product.id} className="py-3">
              <dt className="font-medium text-gray-500">
                <div className="flex items-center">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="h-12 w-12 object-cover rounded"
                  />
                  <div className="ml-3 flex flex-col">
                    <span className="text-gray-900 text-xs">{item.product.name}</span>
                    <span>{formatPrice(item.product.price)}</span>
                  </div>
                </div>
              </dt>
              <dd className="mt-2 text-gray-900 flex justify-between items-center">
                <div className="flex items-center">
                  <button
                    onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="p-1 text-gray-500 hover:text-gray-700 h-8 w-8 flex items-center justify-center rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <span className="mx-2">{item.quantity}</span>
                  <button
                    onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                    className="p-1 text-gray-500 hover:text-gray-700 h-8 w-8 flex items-center justify-center rounded-full"
                    disabled={item.quantity >= item.product.stock}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">{formatPrice(item.product.price * item.quantity)}</span>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-error-600 hover:text-error-900 h-8 w-8 inline-flex items-center justify-center rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      
      <div className="border-t border-gray-200 px-3 py-4">
        <div className="flex justify-between text-base font-medium text-gray-900">
          <p>Subtotal</p>
          <p>{formatPrice(getCartTotal())}</p>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          Shipping and taxes calculated at checkout.
        </p>
        <div className="mt-4">
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Checkout'}
          </button>
        </div>
        <div className="mt-4 flex justify-center text-center text-gray-500">
          <p>
            or{' '}
            <button
              type="button"
              className="text-primary-600 font-medium hover:text-primary-500 py-2 px-2"
              onClick={() => navigate('/shop')}
            >
              Continue Shopping
              <span aria-hidden="true"> &rarr;</span>
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}