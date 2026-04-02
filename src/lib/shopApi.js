import { supabase, hasSupabaseConfig } from './supabase';
import fallbackProducts from '../data/products';

const PRODUCT_KEY = 'kirana-products';
const CATEGORY_KEY = 'kirana-categories';
const BANNER_KEY = 'kirana-banners';
const ORDER_KEY = 'kirana-orders';
const USER_KEY = 'kirana-users';
// storage keys

const defaultCategories = [
  { id: 'cat-grains', name: 'Grains', image: 'https://images.unsplash.com/photo-1516685018646-549d2be9ef9b?auto=format&fit=crop&w=600&q=80' },
  { id: 'cat-snacks', name: 'Snacks', image: 'https://images.unsplash.com/photo-1604909052743-83e1f8b1f4cb?auto=format&fit=crop&w=600&q=80' },
  { id: 'cat-beverages', name: 'Beverages', image: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad04?auto=format&fit=crop&w=600&q=80' },
  { id: 'cat-household', name: 'Household', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
];

const defaultBanners = [
  {
    id: 'banner-1',
    title: 'Seasonal Staples',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    link: '/search?q=staples',
  },
];
// defaults

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readLocal = (key, fallback = []) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = JSON.parse(window.localStorage.getItem(key));
    return Array.isArray(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};
// local storage helpers

const normalizeProduct = (item = {}) => {
  const price = Number(item.price) || 0;
  let discount = Number(item.discount) || 0;

  if (!discount && item.discountPrice && price) {
    const legacyDiscount = Math.round((1 - Number(item.discountPrice) / price) * 100);
    discount = Number.isFinite(legacyDiscount) ? legacyDiscount : 0;
  }

  return {
    id: item.id || createId(),
    name: item.name || 'Kirana Item',
    price,
    discount,
    image: item.image || '',
    category: item.category || 'General',
  };
};

const normalizeCategory = (item = {}) => ({
  id: item.id || createId(),
  name: item.name || 'Category',
  image: item.image || '',
});

const normalizeBanner = (item = {}) => ({
  id: item.id || createId(),
  title: item.title || 'Banner',
  image: item.image || '',
  link: item.link || '/',
});

const normalizeOrder = (item = {}) => {
  const legacyItems = Array.isArray(item.products) ? item.products : [];

  return {
    id: item.id || createId(),
    status: item.status || 'pending',
    items: Array.isArray(item.items) ? item.items : legacyItems,
    subtotal: Number(item.subtotal) || 0,
    delivery_fee: Number(item.delivery_fee ?? item.deliveryFee) || 0,
    total_price: Number(item.total_price ?? item.totalPrice) || 0,
    user_name: item.user_name || item.customerName || '',
    user_mobile: item.user_mobile || item.customerPhone || '',
    user_address: item.user_address || item.customerAddress || '',
    user_email: item.user_email || item.customerEmail || '',
    lat: Number.isFinite(Number(item.lat)) ? Number(item.lat) : null,
    lng: Number.isFinite(Number(item.lng)) ? Number(item.lng) : null,
    address: item.address || item.location_address || '',
    created_at: item.created_at || new Date().toISOString(),
  };
};
// normalizers

const fileToDataUrl = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });

const fetchOpenFoodFactsProducts = async () => {
  try {
    const response = await fetch(
      'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=18',
    );
    if (!response.ok) return [];
    const json = await response.json();
    const items = Array.isArray(json.products) ? json.products : [];
    return items
      .map((item, index) => {
        const name = item.product_name || item.generic_name || 'Kirana Item';
        const categoryTag = item.categories_tags?.[0]?.split(':').pop();
        return normalizeProduct({
          id: item.id || item._id || `off-${index}`,
          name,
          price: 40 + (index % 6) * 20,
          discount: index % 3 === 0 ? 10 : 0,
          image: item.image_front_url || item.image_url || '',
          category: categoryTag ? categoryTag.replace(/-/g, ' ') : 'Grocery',
        });
      })
      .filter((item) => item.image && item.name);
  } catch {
    return [];
  }
};
// Open Food Facts fallback

export const uploadImage = async (file, bucket = 'product-images') => {
  if (!file) return '';
  if (hasSupabaseConfig && supabase) {
    const ext = file.name?.split('.').pop() || 'png';
    const path = `${createId()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data?.publicUrl || '';
    }
  }
  return fileToDataUrl(file);
};
// file upload

export const productApi = {
  getAll: async () => {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!error && data?.length) {
        return data.map(normalizeProduct);
      }
    }

    const stored = readLocal(PRODUCT_KEY, []);
    if (stored.length) {
      return stored.map(normalizeProduct);
    }

    const fallback = await fetchOpenFoodFactsProducts();
    if (fallback.length) {
      writeLocal(PRODUCT_KEY, fallback);
      return fallback;
    }

    return fallbackProducts.map(normalizeProduct);
  },
  create: async (payload) => {
    const product = normalizeProduct(payload);

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('products').insert([product]).select();
      if (!error && data?.[0]) {
        return normalizeProduct(data[0]);
      }
    }

    const stored = readLocal(PRODUCT_KEY, []);
    const next = [product, ...stored.filter((item) => item.id !== product.id)];
    writeLocal(PRODUCT_KEY, next);
    return product;
  },
  update: async (id, updates) => {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('products').update(updates).eq('id', id).select();
      if (!error && data?.[0]) {
        return normalizeProduct(data[0]);
      }
    }

    const stored = readLocal(PRODUCT_KEY, []);
    const next = stored.map((item) => (item.id === id ? normalizeProduct({ ...item, ...updates }) : item));
    writeLocal(PRODUCT_KEY, next);
    return next.find((item) => item.id === id);
  },
  remove: async (id) => {
    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        return true;
      }
    }

    const stored = readLocal(PRODUCT_KEY, []);
    const next = stored.filter((item) => item.id !== id);
    writeLocal(PRODUCT_KEY, next);
    return true;
  },
};
// products

export const categoryApi = {
  getAll: async () => {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
      if (!error && data?.length) {
        return data.map(normalizeCategory);
      }
    }

    const stored = readLocal(CATEGORY_KEY, []);
    if (stored.length) {
      return stored.map(normalizeCategory);
    }

    writeLocal(CATEGORY_KEY, defaultCategories);
    return defaultCategories;
  },
  create: async (payload) => {
    const category = normalizeCategory(payload);

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('categories').insert([category]).select();
      if (!error && data?.[0]) {
        return normalizeCategory(data[0]);
      }
    }

    const stored = readLocal(CATEGORY_KEY, []);
    const next = [category, ...stored.filter((item) => item.id !== category.id)];
    writeLocal(CATEGORY_KEY, next);
    return category;
  },
  update: async (id, updates) => {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select();
      if (!error && data?.[0]) {
        return normalizeCategory(data[0]);
      }
    }

    const stored = readLocal(CATEGORY_KEY, []);
    const next = stored.map((item) => (item.id === id ? normalizeCategory({ ...item, ...updates }) : item));
    writeLocal(CATEGORY_KEY, next);
    return next.find((item) => item.id === id);
  },
  remove: async (id) => {
    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) {
        return true;
      }
    }

    const stored = readLocal(CATEGORY_KEY, []);
    const next = stored.filter((item) => item.id !== id);
    writeLocal(CATEGORY_KEY, next);
    return true;
  },
};
// categories

export const bannerApi = {
  getAll: async () => {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: true });
      if (!error && data?.length) {
        return data.map(normalizeBanner);
      }
    }

    const stored = readLocal(BANNER_KEY, []);
    if (stored.length) {
      return stored.map(normalizeBanner);
    }

    writeLocal(BANNER_KEY, defaultBanners);
    return defaultBanners;
  },
  create: async (payload) => {
    const banner = normalizeBanner(payload);

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('banners').insert([banner]).select();
      if (!error && data?.[0]) {
        return normalizeBanner(data[0]);
      }
    }

    const stored = readLocal(BANNER_KEY, []);
    const next = [banner, ...stored.filter((item) => item.id !== banner.id)];
    writeLocal(BANNER_KEY, next);
    return banner;
  },
  remove: async (id) => {
    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (!error) {
        return true;
      }
    }

    const stored = readLocal(BANNER_KEY, []);
    const next = stored.filter((item) => item.id !== id);
    writeLocal(BANNER_KEY, next);
    return true;
  },
};
// banners

export const ordersApi = {
  create: async (payload) => {
    const order = normalizeOrder(payload);

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('orders').insert([order]).select();
      if (!error && data?.[0]) {
        return normalizeOrder(data[0]);
      }
    }

    const stored = readLocal(ORDER_KEY, []);
    const next = [order, ...stored.filter((item) => item.id !== order.id)];
    writeLocal(ORDER_KEY, next);
    return order;
  },
  getAll: async () => {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error) {
        return (data || []).map(normalizeOrder);
      }
    }

    return readLocal(ORDER_KEY, []).map(normalizeOrder);
  },
  getByEmail: async (email) => {
    if (!email) return [];

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false });
      if (!error) {
        return (data || []).map(normalizeOrder);
      }
    }

    return readLocal(ORDER_KEY, []).filter((item) => item.user_email === email).map(normalizeOrder);
  },
  updateStatus: async (id, status) => {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select();
      if (!error && data?.[0]) {
        return normalizeOrder(data[0]);
      }
    }

    const stored = readLocal(ORDER_KEY, []);
    const next = stored.map((item) => (item.id === id ? normalizeOrder({ ...item, status }) : item));
    writeLocal(ORDER_KEY, next);
    return next.find((item) => item.id === id);
  },
  remove: async (id) => {
    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (!error) {
        return true;
      }
    }

    const stored = readLocal(ORDER_KEY, []);
    const next = stored.filter((item) => item.id !== id);
    writeLocal(ORDER_KEY, next);
    return true;
  },
};
// orders

export const usersApi = {
  getByEmail: async (email) => {
    if (!email) return null;

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).limit(1);
      if (!error && data?.[0]) {
        return data[0];
      }
    }

    const stored = readLocal(USER_KEY, []);
    return stored.find((item) => item.email === email) || null;
  },
  upsert: async (payload) => {
    if (!payload?.email) return null;

    if (hasSupabaseConfig && supabase) {
      const { data: existing, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('email', payload.email)
        .limit(1);

      if (!selectError && existing?.[0]) {
        const { data, error } = await supabase
          .from('users')
          .update(payload)
          .eq('email', payload.email)
          .select();
        if (!error && data?.[0]) {
          return data[0];
        }
      } else {
        const { data, error } = await supabase.from('users').insert([payload]).select();
        if (!error && data?.[0]) {
          return data[0];
        }
      }
    }

    const stored = readLocal(USER_KEY, []);
    const next = stored.filter((item) => item.email !== payload.email);
    const user = { id: payload.id || createId(), ...payload };
    writeLocal(USER_KEY, [user, ...next]);
    return user;
  },
};
// users
