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

const fileToDataUrl = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result || '');
  reader.onerror = () => resolve('');
  reader.readAsDataURL(file);
});

export const uploadImage = async (file, bucket = 'product-images') => {
  if (!file) return '';
  if (!supabase) return fileToDataUrl(file);

  const ext = file.name?.split('.').pop() || 'png';
  const path = `${createId()}.${ext}`;
  const uploadResult = await safeSupabase(() => supabase.storage.from(bucket).upload(path, file));
  if (uploadResult?.data) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || fileToDataUrl(file);
  }
  return fileToDataUrl(file);
};

export const productApi = {
  getAll: async () => {
    if (!supabase) {
      const stored = readLocal(PRODUCT_KEY, []);
      if (stored.length) return stored.map(normalizeProduct);
      return fallbackProducts.map(normalizeProduct);
    }
    const response = await safeSupabase(() => supabase.from('products').select('*').order('created_at', { ascending: false }));
    return response?.data?.map(normalizeProduct) || fallbackProducts.map(normalizeProduct);
  },
  create: async (payload) => {
    const product = normalizeProduct(payload);
    const supabasePayload = buildSupabaseProductRow(payload);
    if (!supabase) {
      const stored = readLocal(PRODUCT_KEY, []);
      const next = [product, ...stored.filter((item) => item.id !== product.id)];
      writeLocal(PRODUCT_KEY, next);
      return product;
    }
    const response = await safeSupabase(() => supabase.from('products').insert([supabasePayload]).select());
    return response?.data?.[0] ? normalizeProduct(response.data[0]) : product;
  },
  update: async (id, updates) => {
    const stored = readLocal(PRODUCT_KEY, []);
    const existing = stored.find((item) => item.id === id) || {};
    const merged = { ...existing, ...updates };
    const normalized = normalizeProduct(merged);
    if (!supabase) {
      const next = stored.map((item) => (item.id === id ? normalized : item));
      writeLocal(PRODUCT_KEY, next);
      return normalized;
    }
    const response = await safeSupabase(() => supabase.from('products').update(merged).eq('id', id).select());
    return response?.data?.[0] ? normalizeProduct(response.data[0]) : normalized;
  },
  remove: async (id) => {
    if (!supabase) {
      const stored = readLocal(PRODUCT_KEY, []);
      const next = stored.filter((item) => item.id !== id);
      writeLocal(PRODUCT_KEY, next);
      return true;
    }
    const response = await safeSupabase(() => supabase.from('products').delete().eq('id', id));
    return !!response?.data;
  }
};

export const categoryApi = {
  getAll: async () => {
    if (!supabase) {
      const stored = readLocal(CATEGORY_KEY, []);
      if (stored.length) return stored.map(normalizeCategory);
      writeLocal(CATEGORY_KEY, defaultCategories);
      return defaultCategories;
    }
    const response = await safeSupabase(() => supabase.from('categories').select('*').order('created_at', { ascending: true }));
    return response?.data?.map(normalizeCategory) || defaultCategories;
  },
  create: async (payload) => {
    const category = normalizeCategory(payload);
    if (!supabase) {
      const stored = readLocal(CATEGORY_KEY, []);
      const next = [category, ...stored.filter((item) => item.id !== category.id)];
      writeLocal(CATEGORY_KEY, next);
      return category;
    }
    const response = await safeSupabase(() => supabase.from('categories').insert([category]).select());
    return response?.data?.[0] ? normalizeCategory(response.data[0]) : category;
  },
  update: async (id, updates) => {
    if (!supabase) {
      const stored = readLocal(CATEGORY_KEY, []);
      const next = stored.map((item) => (item.id === id ? normalizeCategory({ ...item, ...updates }) : item));
      writeLocal(CATEGORY_KEY, next);
      return next.find((item) => item.id === id);
    }
    const response = await safeSupabase(() => supabase.from('categories').update(updates).eq('id', id).select());
    return response?.data?.[0] ? normalizeCategory(response.data[0]) : null;
  },
  remove: async (id) => {
    if (!supabase) {
      const stored = readLocal(CATEGORY_KEY, []);
      const next = stored.filter((item) => item.id !== id);
      writeLocal(CATEGORY_KEY, next);
      return true;
    }
    const response = await safeSupabase(() => supabase.from('categories').delete().eq('id', id));
    return !!response?.data;
  }
};

export const bannerApi = {
  getAll: async () => {
    if (!supabase) {
      const stored = readLocal(BANNER_KEY, []);
      if (stored.length) return stored.map(normalizeBanner);
      writeLocal(BANNER_KEY, defaultBanners);
      return defaultBanners;
    }
    const response = await safeSupabase(() => supabase.from('banners').select('*').order('created_at', { ascending: true }));
    return response?.data?.map(normalizeBanner) || defaultBanners;
  },
  create: async (payload) => {
    const banner = normalizeBanner(payload);
    if (!supabase) {
      const stored = readLocal(BANNER_KEY, []);
      const next = [banner, ...stored.filter((item) => item.id !== banner.id)];
      writeLocal(BANNER_KEY, next);
      return banner;
    }
    const response = await safeSupabase(() => supabase.from('banners').insert([banner]).select());
    return response?.data?.[0] ? normalizeBanner(response.data[0]) : banner;
  },
  remove: async (id) => {
    if (!supabase) {
      const stored = readLocal(BANNER_KEY, []);
      const next = stored.filter((item) => item.id !== id);
      writeLocal(BANNER_KEY, next);
      return true;
    }
    const response = await safeSupabase(() => supabase.from('banners').delete().eq('id', id));
    return !!response?.data;
  }
};

export const ordersApi = {
  create: async (payload) => {
    const order = normalizeOrder(payload);
    if (!supabase) {
      const stored = readLocal(ORDER_KEY, []);
      const next = [order, ...stored.filter((item) => item.id !== order.id)];
      writeLocal(ORDER_KEY, next);
      return order;
    }
    const response = await safeSupabase(() => supabase.from('orders').insert([order]).select());
    if (response?.data?.[0]) {
      // Update stock
      for (const item of payload.items || []) {
        const product = await productApi.getAll().then(p => p.find(p => p.id === item.id));
        if (product?.stock > 0) {
          await productApi.update(item.id, { stock: Math.max(0, product.stock - item.quantity) });
        }
      }
    }
    return response?.data?.[0] || order;
  },
  getAll: async () => {
    if (!supabase) return readLocal(ORDER_KEY, []).map(normalizeOrder);
    const response = await safeSupabase(() => supabase.from('orders').select('*').order('created_at', { ascending: false }));
    return response?.data?.map(normalizeOrder) || [];
  },
  getByEmail: async (email) => {
    if (!email) return [];
    if (!supabase) return readLocal(ORDER_KEY, []).filter(item => item.user_email === email).map(normalizeOrder);
    const response = await safeSupabase(() => supabase.from('orders').select('*').eq('user_email', email).order('created_at', { ascending: false }));
    return response?.data?.map(normalizeOrder) || [];
  },
  updateStatus: async (id, status) => {
    if (!supabase) {
      const stored = readLocal(ORDER_KEY, []);
      const next = stored.map(item => item.id === id ? normalizeOrder({ ...item, status }) : item);
      writeLocal(ORDER_KEY, next);
      return next.find(item => item.id === id);
    }
    const response = await safeSupabase(() => supabase.from('orders').update({ status }).eq('id', id).select());
    return response?.data?.[0] ? normalizeOrder(response.data[0]) : null;
  },
  remove: async (id) => {
    if (!supabase) {
      const stored = readLocal(ORDER_KEY, []);
      const next = stored.filter(item => item.id !== id);
      writeLocal(ORDER_KEY, next);
      return true;
    }
    const response = await safeSupabase(() => supabase.from('orders').delete().eq('id', id));
    return !!response?.data;
  }
};

export const settingsApi = {
  getAppLogo: async () => {
    if (!supabase) return '/Applogo.png';
    const response = await safeSupabase(() => supabase.from('settings').select('app_logo').maybeSingle());
    return response?.data?.app_logo || '/Applogo.png';
  },
  updateAppLogo: async (url) => {
    if (!supabase) return;
    await safeSupabase(() => supabase.from('settings').upsert({ app_logo: url }));
  }
};

export const usersApi = {
  getByEmail: async (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return null;
    if (userProfilesCache.has(normalizedEmail)) return userProfilesCache.get(normalizedEmail);
    if (userProfilesPromiseCache.has(normalizedEmail)) return userProfilesPromiseCache.get(normalizedEmail);
    
    const promise = (async () => {
      if (!supabase) {
        const stored = readLocal(USER_KEY, []);
        const match = stored.find(item => String(item.email).trim().toLowerCase() === normalizedEmail) || null;
        userProfilesCache.set(normalizedEmail, match);
        return match;
      }
      const response = await safeSupabase(() => supabase.from('profiles').select('*').eq('email', normalizedEmail).limit(1));
      const record = response?.data?.[0];
      if (record) {
        userProfilesCache.set(normalizedEmail, record);
        return record;
      }
      const stored = readLocal(USER_KEY, []);
      const match = stored.find(item => String(item.email).trim().toLowerCase() === normalizedEmail) || null;
      userProfilesCache.set(normalizedEmail, match);
      return match;
    })();
    
    userProfilesPromiseCache.set(normalizedEmail, promise);
    return promise;
  },
  upsert: async (payload) => {
    if (!payload?.email && !payload?.googleId) return null;
    const matchField = payload.googleId ? 'googleId' : 'email';
    const matchValue = payload[matchField];
    
    if (!supabase) {
      const normalizedEmail = String(payload?.email || '').trim().toLowerCase();
      const stored = readLocal(USER_KEY, []);
      const next = stored.filter(item => 
        String(item.email).trim().toLowerCase() !== normalizedEmail && 
        item.googleId !== payload.googleId
      );
      const user = { id: payload.id || createId(), ...payload };
      writeLocal(USER_KEY, [user, ...next]);
      if (normalizedEmail) userProfilesCache.set(normalizedEmail, user);
      return user;
    }
    
    const response = await safeSupabase(() => supabase.from('profiles').upsert([payload]).select());
    const data = response?.data?.[0];
    if (data) {
      userProfilesCache.delete(String(payload.email || '').toLowerCase());
      return data;
    }
    
    // Fallback
    const normalizedEmail = String(payload?.email || '').trim().toLowerCase();
    const stored = readLocal(USER_KEY, []);
    const next = stored.filter(item => 
      String(item.email).trim().toLowerCase() !== normalizedEmail && 
      item.googleId !== payload.googleId
    );
    const user = { id: payload.id || createId(), ...payload };
    writeLocal(USER_KEY, [user, ...next]);
    if (normalizedEmail) userProfilesCache.set(normalizedEmail, user);
    return user;
  },
  getByGoogleId: async (googleId) => {
    const id = String(googleId || '').trim();
    if (!id) return null;
    const cacheKey = `google:${id}`;
    if (userProfilesCache.has(cacheKey)) return userProfilesCache.get(cacheKey);
    if (userProfilesPromiseCache.has(cacheKey)) return userProfilesPromiseCache.get(cacheKey);
    
    const promise = (async () => {
      if (!supabase) {
        const stored = readLocal(USER_KEY, []);
        return stored.find(item => item.googleId === id) || null;
      }
      const response = await safeSupabase(() => supabase.from('profiles').select('*').eq('googleId', id).limit(1));
      return response?.data?.[0] || null;
    })();
    
    userProfilesPromiseCache.set(cacheKey, promise);
    return promise;
  }
};
