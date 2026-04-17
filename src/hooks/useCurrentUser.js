import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getProfile } from "../lib/auth.js";

const AUTH_BOOTSTRAP_TIMEOUT_MS = 2000;

const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('[HOOK] useCurrentUser init');

  useEffect(() => {
    let isActive = true;

    const buildUserState = async (currentUser) => {
      if (!currentUser) {
        return { nextUser: null, nextProfile: null };
      }

      let nextProfile = null;
      try {
        nextProfile = await getProfile(currentUser.id);
      } catch {
        nextProfile = null;
      }
      const role = nextProfile?.role || "user";

      return {
        nextProfile,
        nextUser: {
          ...currentUser,
          role,
          isAdmin: role === "admin",
        },
      };
    };

    const applySessionState = async (nextSession) => {
      if (!isActive) return;
      const currentUser = nextSession?.user || null;
      console.log('[HOOK] applySessionState:', { hasSession: !!nextSession, hasUser: !!currentUser?.email });
      setSession(nextSession || null);
      const { nextUser, nextProfile } = await buildUserState(currentUser);
      if (!isActive) return;
      console.log('[HOOK] Final state:', { 
        email: nextUser?.email, 
        role: nextUser?.role, 
        isAdmin: nextUser?.isAdmin,
        profileRole: nextProfile?.role 
      });
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
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) console.error('Session error:', sessionError);

        let activeSession = sessionData?.session || null;

        if (!activeSession) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Refresh session error:', refreshError);
          } else {
            activeSession = refreshData?.session || null;
          }
        }

        if (!activeSession && typeof window !== "undefined") {
          const authCode = new URLSearchParams(window.location.search).get("code");
          if (authCode) {
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
            if (exchangeError) {
              console.error('Exchange error:', exchangeError);
            } else {
              activeSession = exchangeData?.session || null;
            }
          }
        }

        if (activeSession) {
          await applySessionState(activeSession);
        } else {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) console.error('User error:', userError);
          const currentUser = userData?.user || null;
          const { nextUser, nextProfile } = await buildUserState(currentUser);
          if (!isActive) return;
          setSession(null);
          setUser(nextUser);
          setProfile(nextProfile);
          setLoading(false);
        }
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
      if (!nextSession && event === "SIGNED_IN") {
        const { data: refreshData } = await supabase.auth.refreshSession();
        await applySessionState(refreshData?.session || null);
        return;
      }

      await applySessionState(nextSession);
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
