import { useCallback, useEffect, useState } from 'react';
import { categoryApi } from '../lib/shopApi.js';

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  // state

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await categoryApi.getAll();
    setCategories(data || []);
    setLoading(false);
  }, []);
  // actions

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { categories, loading, refresh };
};
// hook

export default useCategories;
