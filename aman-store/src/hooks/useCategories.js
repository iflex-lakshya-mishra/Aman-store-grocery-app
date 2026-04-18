import { useEffect, useState } from 'react';
import { categoryApi } from '../lib/shopApi.js';

const CATEGORIES_CACHE_KEY = 'aman-store:categories-cache:v1';

const readCachedCategories = () => {
  try {
    if (typeof sessionStorage === 'undefined') return [];
    const raw = sessionStorage.getItem(CATEGORIES_CACHE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const writeCachedCategories = (list) => {
  try {
    sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(list));
  } catch {
    // quota / private mode
  }
};

const useCategories = () => {
  const [categories, setCategories] = useState(readCachedCategories);
  const [loading, setLoading] = useState(() => readCachedCategories().length === 0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const hadCache = readCachedCategories().length > 0;

    const run = async () => {
      if (!hadCache) setLoading(true);
      setError('');
      try {
        const data = await categoryApi.getAll();
        if (cancelled) return;
        const list = data || [];
        setCategories(list);
        writeCachedCategories(list);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load categories');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
};

export default useCategories;
