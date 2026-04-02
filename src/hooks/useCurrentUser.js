import { useEffect, useState } from 'react';
import { getCurrentUser, onAuthStateChange } from '../lib/auth.js';
import { usersApi } from '../lib/shopApi.js';

const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // state

  const enrichUser = async (baseUser) => {
    if (!baseUser?.email) return baseUser;
    const profile = await usersApi.getByEmail(baseUser.email);
    return { ...baseUser, ...(profile || {}) };
  };
  // merge profile

  const refresh = async () => {
    try {
      setError('');
      const currentUser = await getCurrentUser();
      const merged = await enrichUser(currentUser);
      setUser(merged);
      setLoading(false);
      return merged;
    } catch (err) {
      setError(err?.message || 'Failed to fetch user');
      setLoading(false);
      return null;
    }
  };
  // manual refresh

  useEffect(() => {
    let active = true;

    const syncUser = async () => {
      try {
        setError('');
        const currentUser = await getCurrentUser();
        const merged = await enrichUser(currentUser);
        if (active) {
          setUser(merged);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || 'Failed to sync user');
          setLoading(false);
        }
      }
    };

    syncUser();

    const subscription = onAuthStateChange(async (currentUser) => {
      const merged = await enrichUser(currentUser);
      if (active) {
        setUser(merged);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  return { user, loading, error, refresh };
};
// hook

export default useCurrentUser;
