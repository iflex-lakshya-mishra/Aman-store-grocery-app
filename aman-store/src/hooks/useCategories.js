import { useCallback, useEffect, useState } from 'react';
import { categoryApi } from '../lib/shopApi.js';

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // state

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await categoryApi.getAll();
      setCategories(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);
  // actions

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, loading, error, refresh };
};
// hook

export default useCategories;
