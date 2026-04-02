import { useCallback, useEffect, useState } from 'react';
import { productApi } from '../lib/shopApi.js';

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // state

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await productApi.getAll();
      setProducts(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);
  // actions

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { products, loading, error, refresh };
};
// hook

export default useProducts;
