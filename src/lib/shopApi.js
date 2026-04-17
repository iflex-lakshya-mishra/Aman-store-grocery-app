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

const fileToDataUrl = (file) =>
  new Promise((resolve) => {
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

    const supabaseResponse = await safeSupabase(() => supabase.from('products').select('*').order('created_at', { ascending: false }));
    const data = supabaseResponse?.data;
    const error = supabaseResponse?.error;
    if (!error && data?.length) {
      return data.map(normalizeProduct);
    }

    const stored = readLocal(PRODUCT_KEY, []);
    if (stored.length) return stored.map(normalizeProduct);
    return fallbackProducts.map(normalizeProduct);
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

    const supabaseResponse = await safeSupabase(() => supabase.from('products').insert([supabasePayload]).select());
    const data = supabaseResponse?.data;
    if (data?.[0]) {
      return normalizeProduct(data[0]);
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

    if (!supabase) {
      const next = stored.map((item) => (item.id === id ? normalized : item));
      writeLocal(PRODUCT_KEY, next);
      return next.find((item) => item.id === id);
    }

    const supabaseResponse = await safeSupabase(() => supabase.from('products').update(supabasePayload).eq('id', id).select());
    const data = supabaseResponse?.data;
    if (data?.[0]) {
      return normalizeProduct(data[0]);
    }

    const next = stored.map((item) => (item.id === id ? normalized : item));
    writeLocal(PRODUCT_KEY, next);
    return next.find((item) => item.id === id);
  },
  remove: async (id) => {
    if (!supabase) {
      const stored = readLocal(PRODUCT_KEY, []);
      const next = stored.filter((item) => item.id !== id);
      writeLocal(PRODUCT_KEY, next);
      return true;
    }

    const supabaseResponse = await safeSupabase(() => supabase.from('products').delete().eq('id', id));
    if (supabaseResponse?.data) {
      return true;
    }

    const stored = readLocal(PRODUCT_KEY, []);
    const next = stored.filter((item) => item.id !== id);
    writeLocal(PRODUCT_KEY, next);
    return true;
  },
};

export const categoryApi = {
  getAll: async () => {
    if (!supabase) {
      const stored = readLocal(CATEGORY_KEY, []);
      if (stored.length) return stored.map(normalizeCategory);
      writeLocal(CATEGORY_KEY, defaultCategories);
      return defaultCategories;
    }

    const supabaseResponse = await safeSupabase(() => supabase.from('categories').select('*').order('created_at', { ascending: true }));
    const data = supabaseResponse?.data;
    if (data?.length) {
      return data.map(normalizeCategory);
    }

    const stored = readLocal(CATEGORY_KEY, []);
    if (stored.length) return stored.map(normalizeCategory);
    writeLocal(CATEGORY_KEY, defaultCategories);
    return defaultCategories;
  },
  create: async (payload) => {
    const category = normalizeCategory(payload);

    if (!supabase) {
      const stored = readLocal(CATEGORY_KEY, []);
      const next = [category, ...stored.filter((item) => item.id !== category.id)];
      writeLocal(CATEGORY_KEY, next);
      return category;
    }

    const supabaseResponse = await safeSupabase(() => supabase.from('categories').insert([category]).select());
    const data = supabaseResponse?.data;
    if (data?.[0]) {
      return normalizeCategory(data[0]);
    }

    const stored = readLocal(CATEGORY_KEY, []);
    const next = [category, ...stored.filter((item) => item.id !== category.id)];
    writeLocal(CATEGORY_KEY, next);
    return category;
  },
  update: async (id, updates) => {
    if (!supabase) {
      const stored = readLocal(CATEGORY_KEY, []);
      const next = stored.map((item) => (item.id === id ? normalizeCategory({ ...item, ...updates }) : item));
      writeLocal(CATEGORY_KEY, next);
      return next.find((item) => item.id === id);
    }

    const supabaseResponse = await safeSupabase(() => supabase.from('categories').update(updates).eq('id', id).select());
    const data = supabaseResponse?.data;
    if (data?.[0]) {
      return normalizeCategory(data[0]);
    }

    const stored = readLocal(CATEGORY_KEY, []);
    const next = stored.map((item) => (item.id === id ? normalizeCategory({ ...item, ...updates }) : item));
    writeLocal(CATEGORY_KEY, next);
    return next.find((item) => item.id === id);
  },
  remove: async (id) => {
    if (!supabase) {
      const stored = readLocal(CATEGORY_KEY, []);
      const next = stored.filter((item) => item.id !== id);
      writeLocal(CATEGORY_KEY, next);
      return true;
    }

    const supabaseResponse = await safeSupabase(() => supabase.from('categories').delete().eq('id', id));
    if (supabaseResponse?.data) {
      return true;
    }

    const stored = readLocal(CATEGORY_KEY, []);
    const next = stored.filter((item) => item.id !== id);
    writeLocal(CATEGORY_KEY, next);
    return true;
  },
};

export const bannerApi = {
  getAll: async () => {
    if (!supabase) {
      const stored = readLocal(BANNER_KEY, []);
      if (stored.length) return stored.map(normalizeBanner);
      writeLocal(BANNER_KEY, defaultBanners);
      return defaultBanners;
    }

    const supabaseResponse = await safeSupabase(() => supabase.from('banners').select('*').order('created_at', { ascending: true }));
    const data = supabaseResponse?.data;
    if (data?.length) {
      return data.map(normalizeBanner);
    }

    const stored = readLocal(BANNER_KEY, []);
    if (stored.length) return stored.map(normalizeBanner);
    writeLocal(BANNER_KEY, defaultBanners);
    return defaultBanners;
  },
  create: async (payload) => {
    const banner = normalizeBanner(payload);

    if (!supabase) {
      const stored = readLocal(BANNER_KEY, []);
      const next = [banner, ...stored.filter((item) => item.id !== banner.id)];
      writeLocal(BANNER_KEY, next);
      return banner;
    }

    const supabaseResponse = await safeSupabase(() => supabase.from('banners').insert([banner]).select());
    const data = supabaseResponse?.data;
    if (data?.[0]) {
      return normalizeBanner(data[0]);
    }

    const stored = readLocal(BANNER_KEY, []);
    const next = [banner, ...stored.filter((item) => item.id !== banner.id)];
    writeLocal(BANNER_KEY, next);
    return banner;
  },
  remove: async (id) => {
    if (!supabase) {
      const stored = readLocal(BANNER_KEY, []);
      const next = stored.filter((item) => item.id !== id);
      writeLocal(BANNER_KEY, next);
      return true;
    }

    const supabaseResponse = await safeSupabase(() => supabase.from('banners').delete().eq('id', id));
    if (supabaseResponse?.data) {
      return true;
    }

    const stored = readLocal(BANNER_KEY, []);
    const next = stored.filter((item) => item.id !== id);
    writeLocal(BANNER_KEY, next);
    return true;
  },
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

    const supabaseResponse = await safeSupabase(() => supabase.from('orders').insert([order]).select());
    const data = supabaseResponse?.data;
    if (data?.[0]) {
      for (const item of payload.items || []) {
        const product = await productApi.getAll().then((products) => products.find((p) => p.id === item.id));
        if (product && product.stock > 0) {
          await productApi.update(item.id, { stock: Math.max(0, product.stock - item.quantity) });
        }
      }
      return normalizeOrder(data[0]);
    }

    const stored = readLocal(ORDER_KEY, []);
    const next = [order, ...stored.filter((item) => item.id !== order.id)];
    writeLocal(ORDER_KEY, next);
    return order;
  },
  getAll: async () => {
    if (!supabase) return readLocal(ORDER_KEY, []).map(normalizeOrder);

    const supabaseResponse = await safeSupabase(() => supabase.from('orders').select('*').order('created_at', { ascending: false }));
    const data = supabaseResponse?.data;
    if (data) {
      return data.map(normalizeOrder);
    }

    return readLocal(ORDER_KEY, []).map(normalizeOrder);
  },
  getByEmail: async (email) => {
    if (!email) return [];
    if (!supabase) {
      return readLocal(ORDER_KEY, []).filter((item) => item.user_email === email).map(normalizeOrder);
    }

    const supabaseResponse = await safeSupabase(() =>
      supabase
        .from('orders')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false }),
    );
    const data = supabaseResponse?.data;
    if (data) {
      return data.map(normalizeOrder);
    }

    return readLocal(ORDER_KEY, []).filter((item) => item.user_email === email).map(normalizeOrder);
  },
  updateStatus: async (id, status) => {
    if (!supabase) {
      const stored = readLocal(ORDER_KEY, []);
      const next = stored.map((item) => (item.id === id ? normalizeOrder({ ...item, status }) : item));
      writeLocal(ORDER_KEY, next);
      return next.find((item) => item.id === id);
    }

    const supabaseResponse = await safeSupabase(() => supabase.from('orders').update({ status }).eq('id', id).select());
    const data = supabaseResponse?.data;
    if (data?.[0]) {
      return normalizeOrder(data[0]);
    }

    const stored = readLocal(ORDER_KEY, []);
    const next = stored.map((item) => (item.id === id ? normalizeOrder({ ...item, status }) : item));
    writeLocal(ORDER_KEY, next);
    return next.find((item) => item.id === id);
  },
  remove: async (id) => {
    if (!supabase) {
      const stored = readLocal(ORDER_KEY, []);
      const next = stored.filter((item) => item.id !== id);
      writeLocal(ORDER_KEY, next);
      return true;
    }

    const supabaseResponse = await safeSupabase(() => supabase.from('orders').delete().eq('id', id));
    if (supabaseResponse?.data) {
      return true;
    }

    const stored = readLocal(ORDER_KEY, []);
    const next = stored.filter((item) => item.id !== id);
    writeLocal(ORDER_KEY, next);
    return true;
  },
};

export const settingsApi = {
  getAppLogo: async () => {
    if (!supabase) return '/Applogo.png';

    const supabaseResponse = await safeSupabase(() => supabase.from('settings').select('app_logo').maybeSingle());
    const data = supabaseResponse?.data;
    return data?.app_logo || '/Applogo.png';
  },
  updateAppLogo: async (url) => {
    if (!supabase) return;
    await safeSupabase(() => supabase.from('settings').upsert({ app_logo: url }));
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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    const lookupPromise = (async () => {
=======
const lookupPromise = (async () => {
>>>>>>> Stashed changes
=======
const lookupPromise = (async () => {
>>>>>>> Stashed changes
      if (!supabase) {
        const stored = readLocal(USER_KEY, []);
        const match = stored.find((item) => String(item.email).trim().toLowerCase() === normalizedEmail) || null;
        userProfilesCache.set(normalizedEmail, match);
        userProfilesPromiseCache.delete(normalizedEmail);
        return match;
      }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
      const supabaseResponse = await safeSupabase(() =>
        supabase.from('users').select('*').eq('email', normalizedEmail).limit(1),
=======
      // Use 'profiles' table to match auth.js
      const supabaseResponse = await safeSupabase(() =>
        supabase.from('profiles').select('*').eq('email', normalizedEmail).limit(1),
>>>>>>> Stashed changes
=======
      // Use 'profiles' table to match auth.js
      const supabaseResponse = await safeSupabase(() =>
        supabase.from('profiles').select('*').eq('email', normalizedEmail).limit(1),
>>>>>>> Stashed changes
      );
      const data = supabaseResponse?.data;
      if (data?.[0]) {
        const record = data[0];
        userProfilesCache.set(normalizedEmail, record);
        userProfilesPromiseCache.delete(normalizedEmail);
        return record;
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
    if (!payload?.email && !payload?.googleId) return null;

    const matchField = payload.googleId ? 'googleId' : 'email';
    const matchValue = payload[matchField];

    if (!supabase) {
      const normalizedEmail = String(payload?.email || '').trim().toLowerCase();
      const stored = readLocal(USER_KEY, []);
      const next = stored.filter((item) =>
        String(item.email).trim().toLowerCase() !== normalizedEmail &&
        item.googleId !== payload.googleId
      );
      const user = { id: payload.id || createId(), ...payload };
      writeLocal(USER_KEY, [user, ...next]);
      if (normalizedEmail) {
        userProfilesCache.set(normalizedEmail, user);
      }
      return user;
    }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    const existingResponse = await safeSupabase(() =>
      supabase
        .from('users')
=======
=======
>>>>>>> Stashed changes
    // Use 'profiles' table to match auth.js
    const existingResponse = await safeSupabase(() =>
      supabase
        .from('profiles')
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        .select('*')
        .eq(matchField, matchValue)
        .limit(1),
    );
    const existing = existingResponse?.data;

    if (existing?.[0]) {
      const updateResponse = await safeSupabase(() =>
        supabase
          .from('users')
          .update(payload)
          .eq(matchField, matchValue)
          .select(),
      );
      const data = updateResponse?.data;
      if (data?.[0]) {
        userProfilesCache.delete(String(payload.email || '').toLowerCase());
        return data[0];
      }
    } else {
      const insertResponse = await safeSupabase(() => supabase.from('users').insert([payload]).select());
      const data = insertResponse?.data;
      if (data?.[0]) {
        userProfilesCache.delete(String(payload.email || '').toLowerCase());
        return data[0];
      }
    }

    const normalizedEmail = String(payload?.email || '').trim().toLowerCase();
    const stored = readLocal(USER_KEY, []);
    const next = stored.filter((item) =>
      String(item.email).trim().toLowerCase() !== normalizedEmail &&
      item.googleId !== payload.googleId
    );
    const user = { id: payload.id || createId(), ...payload };
    writeLocal(USER_KEY, [user, ...next]);
    if (normalizedEmail) {
      userProfilesCache.set(normalizedEmail, user);
    }
    return user;
  },
  getByGoogleId: async (googleId) => {
    const id = String(googleId || '').trim();
    if (!id) return null;

    const cacheKey = `google:${id}`;
    if (userProfilesCache.has(cacheKey)) {
      return userProfilesCache.get(cacheKey);
    }

    if (userProfilesPromiseCache.has(cacheKey)) {
      return userProfilesPromiseCache.get(cacheKey);
    }

    const lookupPromise = (async () => {
      if (!supabase) {
        const stored = readLocal(USER_KEY, []);
        const match = stored.find((item) => item.googleId === id) || null;
        userProfilesCache.set(cacheKey, match);
        userProfilesPromiseCache.delete(cacheKey);
        return match;
      }

      const supabaseResponse = await safeSupabase(() =>
        supabase.from('users').select('*').eq('googleId', id).limit(1),
      );
      const data = supabaseResponse?.data;
      if (data?.[0]) {
        const record = data[0];
        userProfilesCache.set(cacheKey, record);
        userProfilesPromiseCache.delete(cacheKey);
        return record;
      }

      const stored = readLocal(USER_KEY, []);
      const match = stored.find((item) => item.googleId === id) || null;
      userProfilesCache.set(cacheKey, match);
      userProfilesPromiseCache.delete(cacheKey);
      return match;
    })();

    userProfilesPromiseCache.set(cacheKey, lookupPromise);
    return lookupPromise;
  },
};
