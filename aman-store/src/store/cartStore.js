import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getItemPrice } from '../lib/pricing.js';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      // cart state

      addToCart: (product) => {
        const cart = get().cart;
        const existingItem = cart.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            cart: cart.map((item) =>
              item.id === product.id
                ? { ...item, quantity: (item.quantity || 1) + 1 }
                : item,
            ),
          });
          return;
        }

        set({ cart: [...cart, { ...product, quantity: 1 }] });
      },
      // add item

      removeFromCart: (productId) => {
        set({ cart: get().cart.filter((item) => item.id !== productId) });
      },
      // remove item

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return;
        set({
          cart: get().cart.map((item) =>
            item.id === productId ? { ...item, quantity } : item,
          ),
        });
      },
      // update qty

      clearCart: () => set({ cart: [] }),
      // clear

      getTotalPrice: () => {
        return get().cart.reduce((total, item) => {
          const price = getItemPrice(item);
          return total + price * (item.quantity || 1);
        }, 0);
      },
      // total
    }),
    {
      name: 'cart-storage',
    },
  ),
);
