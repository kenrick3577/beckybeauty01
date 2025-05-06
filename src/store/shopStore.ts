import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ShopStore {
  products: Product[];
  cart: CartItem[];
  isLoading: boolean;
  error: string | null;
  
  fetchProducts: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  checkout: (userId: string) => Promise<boolean>;
}

export const useShopStore = create<ShopStore>((set, get) => ({
  products: [],
  cart: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ products: data || [] });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Error fetching products:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: (product, quantity = 1) => {
    const { cart } = get();
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      // Check stock
      if (newQuantity > product.stock) {
        toast.error(`Sorry, only ${product.stock} items in stock`);
        return;
      }
      
      set({
        cart: cart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: newQuantity } 
            : item
        ),
      });
    } else {
      // Check stock
      if (quantity > product.stock) {
        toast.error(`Sorry, only ${product.stock} items in stock`);
        return;
      }
      
      set({ cart: [...cart, { product, quantity }] });
    }
    
    toast.success(`${product.name} added to cart`);
  },

  removeFromCart: (productId) => {
    set({
      cart: get().cart.filter(item => item.product.id !== productId),
    });
  },

  updateCartItemQuantity: (productId, quantity) => {
    const { cart } = get();
    const product = cart.find(item => item.product.id === productId)?.product;
    
    if (!product) return;
    
    // Check stock
    if (quantity > product.stock) {
      toast.error(`Sorry, only ${product.stock} items in stock`);
      return;
    }
    
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    
    set({
      cart: cart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity } 
          : item
      ),
    });
  },

  clearCart: () => {
    set({ cart: [] });
  },

  getCartTotal: () => {
    return get().cart.reduce(
      (total, item) => total + item.product.price * item.quantity, 
      0
    );
  },

  getCartItemsCount: () => {
    return get().cart.reduce(
      (count, item) => count + item.quantity,
      0
    );
  },

  checkout: async (userId) => {
    const { cart, getCartTotal, clearCart } = get();
    
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return false;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: userId,
            total: getCartTotal(),
            status: 'completed',
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
        
      if (itemsError) throw itemsError;
      
      // Update product stock
      for (const item of cart) {
        const newStock = item.product.stock - item.quantity;
        
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product.id);
          
        if (stockError) throw stockError;
      }
      
      // Success
      clearCart();
      toast.success('Order placed successfully!');
      return true;
    } catch (error: any) {
      set({ error: error.message });
      console.error('Checkout error:', error);
      toast.error('Failed to complete your order. Please try again.');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));