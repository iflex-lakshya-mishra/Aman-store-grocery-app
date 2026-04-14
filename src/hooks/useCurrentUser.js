import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getProfile } from "../lib/auth.js";

const ADMIN_EMAIL = "guptamartstationary911@gmail.com";
const AUTH_BOOTSTRAP_TIMEOUT_MS = 2000;

const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const setProfileForUser = async (userId) => {
      if (!isActive) return;
      if (!userId) { setProfile(null); return; }
      try {
        const prof = await getProfile(userId);
        if (!isActive) return;
        setProfile(prof || null);
      } catch {
        if (!isActive) return;
        setProfile(null);
      }
    };

    const applySessionState = async (nextSession) => {
      if (!isActive) return;
      const currentUser = nextSession?.user || null;
      setSession(nextSession || null);
      const userWithRole = currentUser ? {
        ...currentUser,
        role: currentUser.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user'
      } : null;
      const isAdmin = userWithRole?.role === 'admin';
      console.log("USER:", userWithRole);
      console.log("EMAIL:", userWithRole?.email);
      console.log("IS ADMIN:", isAdmin);
      setUser({ ...userWithRole, isAdmin });
      setLoading(false);
      await setProfileForUser(currentUser?.id || null);
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
          const userWithRole = currentUser ? {
            ...currentUser,
            role: currentUser.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user'
          } : null;
          const isAdmin = userWithRole?.role === 'admin';
          console.log("USER:", userWithRole);
          console.log("EMAIL:", userWithRole?.email);
          console.log("IS ADMIN:", isAdmin);
          setSession(null);
          setUser({ ...userWithRole, isAdmin });
          setLoading(false);
          await setProfileForUser(currentUser?.id || null);
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
