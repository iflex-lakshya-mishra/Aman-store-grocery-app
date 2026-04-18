export const createId = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);

const STORAGE_PREFIX = 'aman-store:';
export const readLocal = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const writeLocal = (key, value) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {}
};

const withTimeout = async (promise, ms, message = 'Request timed out') => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const safeSupabase = async (fn) => {
  try {
    return await withTimeout(Promise.resolve().then(fn), 8000, 'Supabase request timed out');
  } catch (error) {
    console.error('Supabase error:', error);
    return { data: null, error };
  }
};

export const PRODUCT_KEY = 'products';
export const CATEGORY_KEY = 'categories';
export const BANNER_KEY = 'banners';
export const ORDER_KEY = 'orders';
export const USER_KEY = 'users';

export const defaultCategories = [
  { id: '1', name: 'Grocery', image: '' },
  { id: '2', name: 'Fruits', image: '' },
];

export const defaultBanners = [
  { id: '1', title: 'Welcome', image: '', link: '/' },
];

export const fallbackProducts = [
  { id: '1', name: 'Sample Product', price: 100, image: '', category: 'Grocery', stock: 10 },
];

export const userProfilesCache = new Map();
export const userProfilesPromiseCache = new Map();

export const buildSupabaseProductRow = (payload) => ({
  ...payload,
  pack_size: payload.size,
  original_price: payload.price,
  discount_percent: payload.discount,
  image_url: payload.image,
});
