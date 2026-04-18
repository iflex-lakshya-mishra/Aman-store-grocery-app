import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getProfile } from "../lib/auth.js";

const AUTH_BOOTSTRAP_TIMEOUT_MS = 3000;

const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const buildUserState = async (currentUser) => {
      if (!currentUser) return { nextUser: null, nextProfile: null };
      let nextProfile = null;
      try {
        nextProfile = await getProfile(currentUser.id);
      } catch {
        nextProfile = null;
      }
      const role = nextProfile?.role || "user";
      return {
        nextProfile,
        nextUser: { ...currentUser, role, isAdmin: role === "admin" },
      };
    };

    const applySessionState = async (nextSession) => {
      if (!isActive) return;
      const currentUser = nextSession?.user || null;
      setSession(nextSession || null);
      const { nextUser, nextProfile } = await buildUserState(currentUser);
      if (!isActive) return;
      setUser(nextUser);
      setProfile(nextProfile);
      setLoading(false);
    };

    if (!supabase) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return () => { isActive = false; };
    }

    const loadingTimeoutId = setTimeout(() => {
      if (!isActive) return;
      setLoading(false);
    }, AUTH_BOOTSTRAP_TIMEOUT_MS);

    const initializeAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        let activeSession = sessionData?.session || null;

        // Token expire hone wala ho toh refresh karo
        if (activeSession) {
          const now = Math.floor(Date.now() / 1000);
          if (activeSession.expires_at - now < 300) {
            const { data: refreshData } = await supabase.auth.refreshSession();
            activeSession = refreshData?.session || activeSession;
          }
          await applySessionState(activeSession);
          clearTimeout(loadingTimeoutId);
          return;
        }

        // Agar session nahi hai toh refresh try karo
        const { data: refreshData } = await supabase.auth.refreshSession();
        activeSession = refreshData?.session || null;

        if (activeSession) {
          await applySessionState(activeSession);
          clearTimeout(loadingTimeoutId);
          return;
        }

        await applySessionState(null);
      } catch {
        if (!isActive) return;
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      } finally {
        clearTimeout(loadingTimeoutId);
      }
    };

    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        await applySessionState(nextSession);
      } else if (event === 'SIGNED_OUT') {
        await applySessionState(null);
      }
    });

    return () => {
      isActive = false;
      clearTimeout(loadingTimeoutId);
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  return { user, session, profile, loading, isAdmin: user?.isAdmin ?? false };
};

export default useCurrentUser;