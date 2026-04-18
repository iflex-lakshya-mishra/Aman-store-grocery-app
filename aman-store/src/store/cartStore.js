import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getItemPrice } from '../lib/pricing.js';

const CART_STORE_VERSION = 1;

const normalizeCartItem = (raw) => {
  const item = raw && typeof raw === 'object' ? raw : {};
  const id = item.id ?? item.productId ?? item._id ?? '';
  if (!id) return null;

  const quantityRaw = Number(item.quantity ?? item.qty ?? 1);
  const quantity = Number.isFinite(quantityRaw) ? Math.max(1, Math.floor(quantityRaw)) : 1;

  const stockRaw = item.stock;
  const stock = Number.isFinite(Number(stockRaw)) ? Number(stockRaw) : undefined;

  return {
    id,
    name: item.name ?? '',
    category: item.category ?? 'General',
    size: item.size ?? item.pack_size ?? '',
    price: Number(item.price ?? item.original_price ?? item.final_price) || 0,
    discount: Number(item.discount ?? item.discount_percent) || 0,
    unit: item.unit ?? 'kg',
    image: item.image ?? item.image_url ?? '',
    stock,
    quantity: stock === undefined ? quantity : Math.min(quantity, Math.max(1, stock)),
  };
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      // cart state

      addToCart: (product) => {
        const cart = get().cart;
        const normalized = normalizeCartItem({ ...product, quantity: 1 });
        if (!normalized) return;
        const existingItem = cart.find((item) => item.id === normalized.id);

        if (existingItem) {
          const nextQtyRaw = (existingItem.quantity || 1) + 1;
          const nextQty = existingItem.stock === undefined
            ? nextQtyRaw
            : Math.min(nextQtyRaw, Math.max(1, existingItem.stock));
          set({
            cart: cart.map((item) =>
              item.id === normalized.id
                ? { ...item, quantity: nextQty }
                : item,
            ),
          });
          return;
        }

        set({ cart: [...cart, normalized] });
      },
      // add item

      removeFromCart: (productId) => {
        set({ cart: get().cart.filter((item) => item.id !== productId) });
      },
      // remove item

      updateQuantity: (productId, quantity) => {
        const nextRaw = Number(quantity);
        if (!Number.isFinite(nextRaw)) return;
        set({
          cart: get().cart.map((item) =>
            item.id === productId
              ? {
                  ...item,
                  quantity: item.stock === undefined
                    ? Math.max(1, Math.floor(nextRaw))
                    : Math.min(Math.max(1, Math.floor(nextRaw)), Math.max(1, item.stock)),
                }
              : item,
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
      version: CART_STORE_VERSION,
      migrate: (persistedState) => {
        const nextCart = Array.isArray(persistedState?.cart)
          ? persistedState.cart.map(normalizeCartItem).filter(Boolean)
          : [];

        return {
          ...persistedState,
          cart: nextCart,
        };
      },
      partialize: (state) => ({
        cart: state.cart.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          size: item.size,
          price: item.price,
          discount: item.discount,
          unit: item.unit,
          image: item.image,
          stock: item.stock,
          quantity: item.quantity,
        })),
      }),
    },
  ),
);
