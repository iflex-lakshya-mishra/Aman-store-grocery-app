import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { getProfile } from '../lib/auth.js';

export const AuthContext = createContext(undefined);

const stripOAuthHashFromUrl = () => {
  if (typeof window === 'undefined') return;
  const h = window.location.hash;
  if (!h) return;
  if (!h.includes('access_token') && !h.includes('refresh_token') && !h.includes('error=')) return;
  const next = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(window.history.state, '', next);
};

const withTimeout = (promise, ms, message = 'timeout') =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);

/** JWT-only shape so the UI can render before profiles row loads. */
const fastUserFromSessionUser = (currentUser) => {
  if (!currentUser) return null;
  const email = currentUser.email || '';
  const isAdmin = email === 'guptamartstationary911@gmail.com';
  return { ...currentUser, role: isAdmin ? 'admin' : 'user', isAdmin };
};

const mergeProfile = (currentUser, nextProfile) => {
  if (!currentUser) return { nextUser: null, nextProfile: null };
  const email = currentUser.email || '';
  const isAdmin =
    nextProfile?.role === 'admin' || email === 'guptamartstationary911@gmail.com';
  const role = isAdmin ? 'admin' : nextProfile?.role || 'user';
  return {
    nextProfile,
    nextUser: { ...currentUser, role, isAdmin },
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const authUserRef = useRef(null);
  const isActiveRef = useRef(true);

  const refreshProfile = useCallback(async () => {
    const currentUser = authUserRef.current;
    if (!currentUser || !supabase) return;
    try {
      const nextProfile = await getProfile(currentUser.id);
      if (!isActiveRef.current) return;
      const { nextUser, nextProfile: p } = mergeProfile(currentUser, nextProfile);
      setProfile(p);
      setUser(nextUser);
    } catch {
      // keep existing
    }
  }, []);

  useEffect(() => {
    isActiveRef.current = true;

    const loadProfileInBackground = async (currentUser) => {
      let nextProfile = null;
      try {
        nextProfile = await getProfile(currentUser.id);
      } catch {
        nextProfile = null;
      }
      if (!isActiveRef.current) return;
      const { nextUser, nextProfile: p } = mergeProfile(currentUser, nextProfile);
      setProfile(p);
      setUser(nextUser);
    };

    const applySessionState = async (nextSession) => {
      if (!isActiveRef.current) return;
      const currentUser = nextSession?.user || null;
      authUserRef.current = currentUser;
      setSession(nextSession || null);
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(fastUserFromSessionUser(currentUser));
      setProfile(null);
      setLoading(false);
      void loadProfileInBackground(currentUser);
    };

    if (!supabase) {
      authUserRef.current = null;
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return () => {
        isActiveRef.current = false;
      };
    }

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await withTimeout(supabase.auth.getSession(), 5000, 'getSession timeout');
        await applySessionState(session);
        if (session) stripOAuthHashFromUrl();
      } catch {
        if (!isActiveRef.current) return;
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isActiveRef.current) return;
      if (event === 'SIGNED_OUT') {
        authUserRef.current = null;
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else {
        await applySessionState(nextSession);
        if (nextSession) stripOAuthHashFromUrl();
      }
    });

    return () => {
      isActiveRef.current = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    profile,
    loading,
    isAdmin: user?.isAdmin ?? false,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCurrentUser() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useCurrentUser must be used within AuthProvider');
  }
  return ctx;
}
