import { supabase } from './supabase';
import {
  createId, readLocal, writeLocal, safeSupabase,
  PRODUCT_KEY, CATEGORY_KEY, BANNER_KEY, ORDER_KEY, USER_KEY,
  defaultCategories, defaultBanners, fallbackProducts,
  userProfilesCache, userProfilesPromiseCache, buildSupabaseProductRow
} from './utils.js';



const normalizeProduct = (item = {}) => ({
  id: item.id,
  name: item.name,
  size: item.pack_size || item.size || '',
  price: Number(item.original_price || item.final_price || item.price) || 0,
  discount: Number(item.discount_percent || item.discount) || 0,
  image: item.image_url || item.image || '',
  category: item.category || item.tag || 'General',
  stock: Number(item.stock) || 0,
  unit: item.unit || 'kg',
});

const normalizeCategory = (item = {}) => ({
  id: item.id || createId(),
  name: item.name || 'Category',
  image: item.image || item.image_url || '',
});

const normalizeBanner = (item = {}) => ({
  id: item.id || createId(),
  title: item.title || 'Banner',
  image: item.image || '',
  link: item.link || '/',
});

const normalizeOrder = (item = {}) => ({
  id: item.id || createId(),
  status: item.status || 'pending',
  items: item.items || [],
  total_price: Number(item.total_price) || 0,
  user_email: item.user_email || '',
  created_at: item.created_at || new Date().toISOString(),
});



export const productApi = {
  getAll: async () => {
    if (!supabase) return readLocal(PRODUCT_KEY, []).map(normalizeProduct);

    const { data } = await supabase.from('products').select('*');
    return data?.map(normalizeProduct) || [];
  },
};



export const categoryApi = {
  getAll: async () => {
    if (!supabase) return readLocal(CATEGORY_KEY, []).map(normalizeCategory);

    const { data } = await supabase.from('categories').select('*');
    return data?.map(normalizeCategory) || [];
  },
};


export const usersApi = {
  getByEmail: async (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return null;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .limit(1);

    return data?.[0] || null;
  },

  upsert: async (payload) => {
    if (!payload?.email) return null;

    const { data } = await supabase
      .from('profiles')
      .upsert(payload)
      .select();

    return data?.[0] || null;
  },
};



export const ordersApi = {
  create: async (payload) => {
    const order = normalizeOrder(payload);

    if (!supabase) {
      const stored = readLocal(ORDER_KEY, []);
      writeLocal(ORDER_KEY, [order, ...stored]);
      return order;
    }

    const { data } = await supabase.from('orders').insert([order]).select();
    return data?.[0] || order;
  },
};
