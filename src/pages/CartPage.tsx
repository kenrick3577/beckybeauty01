import React from 'react';
import Cart from '../components/shop/Cart';

export default function CartPage() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">
        Your Shopping Cart
      </h1>
      <Cart />
    </div>
  );
}