import { useEffect, useState } from 'react';
import { getCurrentUser, onAuthStateChange } from '../lib/auth.js';
import { usersApi } from '../lib/shopApi.js';

let cachedUser = null;
let currentUserPromise = null;

const enrichUser = async (baseUser) => {
  if (!baseUser?.email) return baseUser;
  let profile;
  if (baseUser.googleId) {
    profile = await usersApi.getByGoogleId(baseUser.googleId);
  } else {
    profile = await usersApi.getByEmail(baseUser.email);
  }
  return { ...baseUser, ...(profile || {}) };
};

const loadCurrentUser = async () => {
  if (currentUserPromise) {
    return currentUserPromise;
  }

  currentUserPromise = (async () => {
    const currentUser = await getCurrentUser();
    const merged = await enrichUser(currentUser);
    cachedUser = merged;
    currentUserPromise = null;
    return merged;
  })();

  return currentUserPromise;
};

const useCurrentUser = () => {
  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [error, setError] = useState('');
  // state

  const refresh = async () => {
    try {
      setError('');
      const merged = await loadCurrentUser();
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
        const merged = await loadCurrentUser();
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
      cachedUser = merged;
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
