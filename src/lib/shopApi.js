import { supabase, hasSupabaseConfig } from './supabase';
import fallbackProducts from '../data/products';

let useSupabase = hasSupabaseConfig;
const userProfilesCache = new Map();
const userProfilesPromiseCache = new Map();

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

const disableSupabase = () => {
  useSupabase = false;
};

const safeSupabase = async (callback) => {
  if (!useSupabase || !supabase) return null;

  try {
    const result = await callback();
    if (result?.error) {
      console.warn('Supabase request failed, switching to local fallback.', result.error);
      disableSupabase();
      return null;
    }

    return result;
  } catch (error) {
    console.warn('Supabase request threw, switching to local fallback.', error);
    disableSupabase();
    return null;
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
  const price = Number(item.price ?? item.original_price) || 0;
  let discount = Number(item.discount ?? item.discount_percent) || 0;

  if (!discount && item.discount_price && price) {
    const legacyDiscount = Math.round((1 - Number(item.discount_price) / price) * 100);
    discount = Number.isFinite(legacyDiscount) ? legacyDiscount : 0;
  }

  const image = item.image || item.image_url || '';
  const size = item.size || item.pack_size || '';
  const category = item.category || item.tag || 'General';

  return {
    id: item.id || createId(),
    name: item.name || 'Kirana Item',
    size,
    price,
    discount,
    image,
    category,
    stock: Number(item.stock) || 100,
    unit: item.unit || 'kg',
  };
};

const buildSupabaseProductRow = (payload = {}) => {
  const price = Number(payload.price ?? payload.original_price) || 0;
  const discount = Number(payload.discount ?? payload.discount_percent) || 0;
  const finalPrice = Number(payload.final_price) || Math.max(0, price - (price * discount) / 100);

  return {
    name: payload.name || '',
    category: payload.category || 'General',
    image_url: payload.image || payload.image_url || '',
    original_price: price,
    discount_price: payload.discount_price ?? null,
    discount_percent: discount,
    final_price: finalPrice,
    pack_size: payload.size || payload.pack_size || '',
    tag: payload.tag || 'trending',
    stock: Number(payload.stock) || 100,
    unit: payload.unit || 'kg',
    created_at: payload.created_at || new Date().toISOString(),
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

/* 
  DISABLED: OpenFoodFacts external API (for future reuse)
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
*/
// Open Food Facts fallback

export const uploadImage = async (file, bucket = 'product-images') => {
  if (!file) return '';
  if (useSupabase && supabase) {
    const ext = file.name?.split('.').pop() || 'png';
    const path = `${createId()}.${ext}`;
    const uploadResult = await safeSupabase(() => supabase.storage.from(bucket).upload(path, file));
    if (uploadResult?.data) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data?.publicUrl || fileToDataUrl(file);
    }
  }
  return fileToDataUrl(file);
};
// file upload

export const productApi = {
  getAll: async () => {
    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('products').select('*').order('created_at', { ascending: false }));
      console.log('Supabase products response:', supabaseResponse);
      const data = supabaseResponse?.data;
      const error = supabaseResponse?.error;
      if (!error && data?.length) {
        const products = data.map(normalizeProduct);
        console.log('Loaded', products.length, 'products from Supabase:', products);
        return products;
      }
    }

    const stored = readLocal(PRODUCT_KEY, []);
    if (stored.length) {
      console.log('Using LocalStorage products:', stored.length, 'items');
      return stored.map(normalizeProduct);
    }

    /* DISABLED: OpenFoodFacts external API fallback
    const fallback = await fetchOpenFoodFactsProducts();
    if (fallback.length) {
      writeLocal(PRODUCT_KEY, fallback);
      return fallback;
    }
    */

    console.log('Using static fallbackProducts:', fallbackProducts.length, 'items');
    return fallbackProducts.map(normalizeProduct);
  },
  create: async (payload) => {
    const product = normalizeProduct(payload);
    const supabasePayload = buildSupabaseProductRow(payload);

    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('products').insert([supabasePayload]).select());
      const data = supabaseResponse?.data;
      if (data?.[0]) {
        return normalizeProduct(data[0]);
      }
    }

    const stored = readLocal(PRODUCT_KEY, []);
    const next = [product, ...stored.filter((item) => item.id !== product.id)];
    writeLocal(PRODUCT_KEY, next);
    return product;
  },
  update: async (id, updates) => {
    const stored = readLocal(PRODUCT_KEY, []);
    const existing = stored.find((item) => item.id === id) || {};
    const mergedPayload = { ...existing, ...updates };
    const normalized = normalizeProduct(mergedPayload);
    const supabasePayload = buildSupabaseProductRow(mergedPayload);

    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('products').update(supabasePayload).eq('id', id).select());
      const data = supabaseResponse?.data;
      if (data?.[0]) {
        return normalizeProduct(data[0]);
      }
    }

    const next = stored.map((item) => (item.id === id ? normalized : item));
    writeLocal(PRODUCT_KEY, next);
    return next.find((item) => item.id === id);
  },
  remove: async (id) => {
    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('products').delete().eq('id', id));
      if (supabaseResponse?.data) {
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
    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('categories').select('*').order('created_at', { ascending: true }));
      const data = supabaseResponse?.data;
      if (data?.length) {
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

    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('categories').insert([category]).select());
      const data = supabaseResponse?.data;
      if (data?.[0]) {
        return normalizeCategory(data[0]);
      }
    }

    const stored = readLocal(CATEGORY_KEY, []);
    const next = [category, ...stored.filter((item) => item.id !== category.id)];
    writeLocal(CATEGORY_KEY, next);
    return category;
  },
  update: async (id, updates) => {
    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('categories').update(updates).eq('id', id).select());
      const data = supabaseResponse?.data;
      if (data?.[0]) {
        return normalizeCategory(data[0]);
      }
    }

    const stored = readLocal(CATEGORY_KEY, []);
    const next = stored.map((item) => (item.id === id ? normalizeCategory({ ...item, ...updates }) : item));
    writeLocal(CATEGORY_KEY, next);
    return next.find((item) => item.id === id);
  },
  remove: async (id) => {
    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('categories').delete().eq('id', id));
      if (supabaseResponse?.data) {
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
    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('banners').select('*').order('created_at', { ascending: true }));
      const data = supabaseResponse?.data;
      if (data?.length) {
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

    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('banners').insert([banner]).select());
      const data = supabaseResponse?.data;
      if (data?.[0]) {
        return normalizeBanner(data[0]);
      }
    }

    const stored = readLocal(BANNER_KEY, []);
    const next = [banner, ...stored.filter((item) => item.id !== banner.id)];
    writeLocal(BANNER_KEY, next);
    return banner;
  },
  remove: async (id) => {
    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('banners').delete().eq('id', id));
      if (supabaseResponse?.data) {
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

    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('orders').insert([order]).select());
      const data = supabaseResponse?.data;
      if (data?.[0]) {
        // Deduct stock for each item
        for (const item of payload.items || []) {
          const product = await productApi.getAll().then(products => products.find(p => p.id === item.id));
          if (product && product.stock > 0) {
            await productApi.update(item.id, { stock: Math.max(0, product.stock - item.quantity) });
          }
        }
        return normalizeOrder(data[0]);
      }
    }

    const stored = readLocal(ORDER_KEY, []);
    const next = [order, ...stored.filter((item) => item.id !== order.id)];
    writeLocal(ORDER_KEY, next);
    return order;
  },
  getAll: async () => {
    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('orders').select('*').order('created_at', { ascending: false }));
      const data = supabaseResponse?.data;
      if (data) {
        return (data || []).map(normalizeOrder);
      }
    }

    return readLocal(ORDER_KEY, []).map(normalizeOrder);
  },
  getByEmail: async (email) => {
    if (!email) return [];

    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() =>
        supabase
          .from('orders')
          .select('*')
          .eq('user_email', email)
          .order('created_at', { ascending: false }),
      );
      const data = supabaseResponse?.data;
      if (data) {
        return (data || []).map(normalizeOrder);
      }
    }

    return readLocal(ORDER_KEY, []).filter((item) => item.user_email === email).map(normalizeOrder);
  },
  updateStatus: async (id, status) => {
    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('orders').update({ status }).eq('id', id).select());
      const data = supabaseResponse?.data;
      if (data?.[0]) {
        return normalizeOrder(data[0]);
      }
    }

    const stored = readLocal(ORDER_KEY, []);
    const next = stored.map((item) => (item.id === id ? normalizeOrder({ ...item, status }) : item));
    writeLocal(ORDER_KEY, next);
    return next.find((item) => item.id === id);
  },
  remove: async (id) => {
    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('orders').delete().eq('id', id));
      if (supabaseResponse?.data) {
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

export const settingsApi = {
  getAppLogo: async () => {
    if (useSupabase && supabase) {
      const supabaseResponse = await safeSupabase(() => supabase.from('settings').select('app_logo').maybeSingle());
      const data = supabaseResponse?.data;
      return data?.app_logo || '/favicon.svg';
    }
    return '/favicon.svg';
  },
  updateAppLogo: async (url) => {
    if (useSupabase && supabase) {
      await safeSupabase(() => supabase.from('settings').upsert({ app_logo: url }));
    }
  },
};

export const usersApi = {
  getByEmail: async (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return null;

    if (userProfilesCache.has(normalizedEmail)) {
      return userProfilesCache.get(normalizedEmail);
    }

    if (userProfilesPromiseCache.has(normalizedEmail)) {
      return userProfilesPromiseCache.get(normalizedEmail);
    }

    const lookupPromise = (async () => {
      if (useSupabase && supabase) {
        const supabaseResponse = await safeSupabase(() =>
          supabase.from('users').select('*').eq('email', normalizedEmail).limit(1),
        );
        const data = supabaseResponse?.data;
        if (data?.[0]) {
          const record = data[0];
          userProfilesCache.set(normalizedEmail, record);
          userProfilesPromiseCache.delete(normalizedEmail);
          return record;
        }
      }

      const stored = readLocal(USER_KEY, []);
      const match = stored.find((item) => String(item.email).trim().toLowerCase() === normalizedEmail) || null;
      userProfilesCache.set(normalizedEmail, match);
      userProfilesPromiseCache.delete(normalizedEmail);
      return match;
    })();

    userProfilesPromiseCache.set(normalizedEmail, lookupPromise);
    return lookupPromise;
  },
  upsert: async (payload) => {
    if (!payload?.email) return null;

    if (useSupabase && supabase) {
      const existingResponse = await safeSupabase(() =>
        supabase
          .from('users')
          .select('*')
          .eq('email', payload.email)
          .limit(1),
      );
      const existing = existingResponse?.data;

      if (existing?.[0]) {
        const updateResponse = await safeSupabase(() =>
          supabase
            .from('users')
            .update(payload)
            .eq('email', payload.email)
            .select(),
        );
        const data = updateResponse?.data;
        if (data?.[0]) {
          return data[0];
        }
      } else {
        const insertResponse = await safeSupabase(() => supabase.from('users').insert([payload]).select());
        const data = insertResponse?.data;
        if (data?.[0]) {
          return data[0];
        }
      }
    }

    const normalizedEmail = String(payload?.email || '').trim().toLowerCase();
    const stored = readLocal(USER_KEY, []);
    const next = stored.filter((item) => String(item.email).trim().toLowerCase() !== normalizedEmail);
    const user = { id: payload.id || createId(), ...payload };
    writeLocal(USER_KEY, [user, ...next]);
    if (normalizedEmail) {
      userProfilesCache.set(normalizedEmail, user);
    }
    return user;
  },
};
// users
