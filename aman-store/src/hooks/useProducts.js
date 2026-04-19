import { useEffect, useState } from 'react';
import { productApi } from '../lib/shopApi.js';

const PRODUCTS_CACHE_KEY = 'aman-store:products-cache:v1';

const readCachedProducts = () => {
  try {
    if (typeof sessionStorage === 'undefined') return [];
    const raw = sessionStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const writeCachedProducts = (list) => {
  try {
    sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(list));
  } catch {
    // quota / private mode
  }
};

const useProducts = () => {
  const [products, setProducts] = useState(readCachedProducts);
  const [loading, setLoading] = useState(() => readCachedProducts().length === 0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const hadCache = readCachedProducts().length > 0;

    const run = async () => {
      if (!hadCache) setLoading(true);
      setError('');
      try {
        const data = await productApi.getAll();
        if (cancelled) return;
        const list = data || [];
        setProducts(list);
        writeCachedProducts(list);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load products');
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

  return { products, loading, error };
};

export default useProducts;
