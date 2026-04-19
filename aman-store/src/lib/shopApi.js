import { supabase } from './supabaseClient.js';
import { hasSupabaseConfig } from './supabaseClient.js';
import {
  createId, readLocal, writeLocal, safeSupabase,
  PRODUCT_KEY, CATEGORY_KEY, BANNER_KEY, ORDER_KEY, USER_KEY,
  defaultCategories, defaultBanners, fallbackProducts,
  userProfilesCache, userProfilesPromiseCache, buildSupabaseProductRow, buildSupabaseProductPatch
} from './utils.js';

const useSupabase = hasSupabaseConfig;

/** One in-flight list read per key so Home + Admin + hooks don't stack duplicate heavy queries. */
const inFlightListReads = new Map();
const runDedupedListRead = (key, task) => {
  if (inFlightListReads.has(key)) return inFlightListReads.get(key);
  const promise = (async () => {
    try {
      return await task();
    } finally {
      inFlightListReads.delete(key);
    }
  })();
  inFlightListReads.set(key, promise);
  return promise;
};

/** Short-lived in-memory list cache so route changes do not re-hit Supabase for the same lists. */
const LIST_CACHE_TTL_MS = 60_000;
const productsListCache = { list: null, ts: 0 };
const categoriesListCache = { list: null, ts: 0 };
const bannersListCache = { list: null, ts: 0 };

const invalidateProductsListCache = () => {
  productsListCache.list = null;
  productsListCache.ts = 0;
};
const invalidateCategoriesListCache = () => {
  categoriesListCache.list = null;
  categoriesListCache.ts = 0;
};
const invalidateBannersListCache = () => {
  bannersListCache.list = null;
  bannersListCache.ts = 0;
};

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

/** Same keys as useProducts / useCategories — used when live fetch fails (avoid demo catalog). */
const PRODUCTS_SESSION_CACHE_KEY = 'aman-store:products-cache:v1';
const CATEGORIES_SESSION_CACHE_KEY = 'aman-store:categories-cache:v1';

const readSessionProductsCache = () => {
  try {
    if (typeof sessionStorage === 'undefined') return [];
    const raw = sessionStorage.getItem(PRODUCTS_SESSION_CACHE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map((item) => normalizeProduct(item)) : [];
  } catch {
    return [];
  }
};

const readSessionCategoriesCache = () => {
  try {
    if (typeof sessionStorage === 'undefined') return [];
    const raw = sessionStorage.getItem(CATEGORIES_SESSION_CACHE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map((item) => normalizeCategory(item)) : [];
  } catch {
    return [];
  }
};

/** Lowercase + trim so shopper list + RLS match Google / session email. */
const normalizeOrderEmail = (email) => String(email || '').trim().toLowerCase();

/** Escape `%` and `_` for PostgREST `ilike` (exact address, case-insensitive). */
const escapeForILike = (value) =>
  String(value).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

const normalizeOrder = (item = {}) => {
  const legacyItems = Array.isArray(item.products) ? item.products : [];
  const userName = item.user_name || item.customerName || item.delivery_name || '';
  const userMobile = item.user_mobile || item.customerPhone || item.delivery_phone || '';
  const userAddress = item.user_address || item.customerAddress || item.delivery_address || '';
  return {
    id: item.id || createId(),
    status: item.status || 'pending',
    items: Array.isArray(item.items) ? item.items : legacyItems,
    subtotal: Number(item.subtotal) || 0,
    delivery_fee: Number(item.delivery_fee ?? item.deliveryFee) || 0,
    total_price: Number(item.total_price ?? item.totalPrice) || 0,
    user_name: userName,
    user_mobile: userMobile,
    user_address: userAddress,
    user_email: normalizeOrderEmail(item.user_email || item.customerEmail || ''),
    delivery_name: item.delivery_name || userName,
    delivery_phone: item.delivery_phone || userMobile,
    delivery_address: item.delivery_address || userAddress,
    lat: Number.isFinite(Number(item.lat)) ? Number(item.lat) : null,
    lng: Number.isFinite(Number(item.lng)) ? Number(item.lng) : null,
    address: item.address || item.location_address || '',
    created_at: item.created_at || new Date().toISOString(),
  };
};

/** Row sent to PostgREST — omit client id/created_at so DB defaults apply (avoids type/RLS mismatches). */
const buildOrderInsertPayload = (normalized) => {
  const row = {
    status: normalized.status,
    items: normalized.items,
    subtotal: normalized.subtotal,
    delivery_fee: normalized.delivery_fee,
    total_price: normalized.total_price,
    user_name: normalized.user_name,
    user_mobile: normalized.user_mobile,
    user_address: normalized.user_address,
    user_email: normalized.user_email,
    lat: normalized.lat,
    lng: normalized.lng,
    address: normalized.address,
    delivery_name: normalized.delivery_name,
    delivery_phone: normalized.delivery_phone,
    delivery_address: normalized.delivery_address,
  };
  Object.keys(row).forEach((k) => {
    if (row[k] === undefined) delete row[k];
  });
  return row;
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
    const now = Date.now();
    if (productsListCache.list && now - productsListCache.ts < LIST_CACHE_TTL_MS) {
      return productsListCache.list.slice();
    }

    const fetchProducts = () =>
      safeSupabase(() => supabase.from('products').select('*').order('created_at', { ascending: false }));

    let response = await runDedupedListRead('products:list', fetchProducts);
    if (response?.error || !Array.isArray(response?.data)) {
      await new Promise((r) => setTimeout(r, 400));
      response = await fetchProducts();
    }

    const raw = response?.data;
    const mapped = Array.isArray(raw) ? raw.map(normalizeProduct) : null;

    if (mapped !== null) {
      productsListCache.list = mapped;
      productsListCache.ts = Date.now();
      return mapped.slice();
    }

    const stale = readSessionProductsCache();
    if (stale.length) return stale.slice();

    const local = readLocal(PRODUCT_KEY, []);
    if (local.length) return local.map(normalizeProduct);

    return [];
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
    invalidateProductsListCache();
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
    const patch = buildSupabaseProductPatch(updates);
    const response = await safeSupabase(() => supabase.from('products').update(patch).eq('id', id).select());
    invalidateProductsListCache();
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
    invalidateProductsListCache();
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
    const now = Date.now();
    if (categoriesListCache.list && now - categoriesListCache.ts < LIST_CACHE_TTL_MS) {
      return categoriesListCache.list.slice();
    }

    const fetchCategories = () =>
      safeSupabase(() => supabase.from('categories').select('*').order('created_at', { ascending: true }));

    let response = await runDedupedListRead('categories:list', fetchCategories);
    if (response?.error || !Array.isArray(response?.data)) {
      await new Promise((r) => setTimeout(r, 400));
      response = await fetchCategories();
    }

    const raw = response?.data;
    const mapped = Array.isArray(raw) ? raw.map(normalizeCategory) : null;

    if (mapped !== null) {
      categoriesListCache.list = mapped;
      categoriesListCache.ts = Date.now();
      return mapped.slice();
    }

    const stale = readSessionCategoriesCache();
    if (stale.length) return stale.slice();

    return defaultCategories.map(normalizeCategory);
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
    invalidateCategoriesListCache();
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
    invalidateCategoriesListCache();
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
    invalidateCategoriesListCache();
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
    const now = Date.now();
    if (bannersListCache.list && now - bannersListCache.ts < LIST_CACHE_TTL_MS) {
      return bannersListCache.list.slice();
    }
    const response = await runDedupedListRead('banners:list', () =>
      safeSupabase(() => supabase.from('banners').select('*').order('created_at', { ascending: true })),
    );
    const list = response?.data?.map(normalizeBanner) || defaultBanners;
    bannersListCache.list = list;
    bannersListCache.ts = Date.now();
    return list.slice();
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
    invalidateBannersListCache();
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
    invalidateBannersListCache();
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
    const insertPayload = buildOrderInsertPayload(order);
    let response = await safeSupabase(() =>
      supabase.from('orders').insert([insertPayload]).select(),
    );
    let row = response?.data?.[0];
    let err = response?.error;
    if ((err || !row) && (insertPayload.delivery_name != null || insertPayload.delivery_phone != null || insertPayload.delivery_address != null)) {
      const minimal = { ...insertPayload };
      delete minimal.delivery_name;
      delete minimal.delivery_phone;
      delete minimal.delivery_address;
      response = await safeSupabase(() => supabase.from('orders').insert([minimal]).select());
      row = response?.data?.[0];
      err = response?.error;
    }
    // Minimal DB schema (e.g. only id, status, items, total_price, user_email): avoid silent empty table.
    if (err || !row) {
      const ultraMinimal = {
        status: insertPayload.status || 'pending',
        items: insertPayload.items ?? [],
        total_price: insertPayload.total_price ?? 0,
        user_email: insertPayload.user_email ?? '',
      };
      response = await safeSupabase(() => supabase.from('orders').insert([ultraMinimal]).select());
      row = response?.data?.[0];
      err = response?.error;
    }
    if (err || !row) {
      const msg =
        (err && (err.message || err.details || String(err.code))) ||
        'Order could not be saved. Check your connection or try again.';
      throw new Error(msg);
    }
    const saved = normalizeOrder(row);
    for (const item of payload.items || []) {
      const products = await productApi.getAll();
      const product = products.find((p) => p.id === item.id);
      if (product?.stock > 0) {
        await productApi.update(item.id, { stock: Math.max(0, product.stock - item.quantity) });
      }
    }
    return saved;
  },
  getAll: async () => {
    if (!supabase) return readLocal(ORDER_KEY, []).map(normalizeOrder);
    const response = await runDedupedListRead('orders:list', () =>
      safeSupabase(() => supabase.from('orders').select('*').order('created_at', { ascending: false })),
    );
    if (response?.error && typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.error('[ordersApi.getAll]', response.error);
    }
    return response?.data?.map(normalizeOrder) || [];
  },
  getByEmail: async (email) => {
    const norm = normalizeOrderEmail(email);
    if (!norm) return [];
    if (!supabase) {
      return readLocal(ORDER_KEY, [])
        .filter((item) => normalizeOrderEmail(item.user_email) === norm)
        .map(normalizeOrder);
    }
    const response = await safeSupabase(() =>
      supabase
        .from('orders')
        .select('*')
        .ilike('user_email', escapeForILike(norm))
        .order('created_at', { ascending: false }),
    );
    if (response?.error && typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.error('[ordersApi.getByEmail]', response.error);
    }
    return response?.data?.map(normalizeOrder) || [];
  },
  updateStatus: async (id, status) => {
    if (!supabase) {
      const stored = readLocal(ORDER_KEY, []);
      const next = stored.map(item => item.id === id ? normalizeOrder({ ...item, status }) : item);
      writeLocal(ORDER_KEY, next);
      return next.find(item => item.id === id);
    }
    const response = await safeSupabase(() =>
      supabase.from('orders').update({ status }).eq('id', id).select().maybeSingle(),
    );
    const err = response?.error;
    const row = response?.data;
    if (err) {
      throw new Error(err.message || err.details || 'Could not update order status.');
    }
    if (!row) {
      throw new Error(
        'Order was not updated (no row returned). Usually RLS: re-run order policies from supabase-schema.sql or set profiles.role = admin.',
      );
    }
    return normalizeOrder(row);
  },
  remove: async (id) => {
    if (!supabase) {
      const stored = readLocal(ORDER_KEY, []);
      const next = stored.filter(item => item.id !== id);
      writeLocal(ORDER_KEY, next);
      return true;
    }
    const response = await safeSupabase(() =>
      supabase.from('orders').delete().eq('id', id).select('id').maybeSingle(),
    );
    if (response?.error) {
      throw new Error(response.error.message || response.error.details || 'Could not delete order.');
    }
    if (!response?.data) {
      throw new Error('Order was not deleted (no row affected). Check admin permissions in Supabase RLS.');
    }
    return true;
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
//