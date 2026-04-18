import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { getProfile } from "../lib/auth.js";

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
      const email = currentUser.email || '';
      const isAdmin = nextProfile?.role === 'admin' ||
        email === 'guptamartstationary911@gmail.com';
      const role = isAdmin ? 'admin' : (nextProfile?.role || 'user');
      return {
        nextProfile,
        nextUser: { ...currentUser, role, isAdmin },
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
      return;
    }

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await applySessionState(session);
      } catch {
        if (!isActive) return;
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        if (!isActive) return;
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else {
          await applySessionState(nextSession);
        }
      }
    );

    return () => {
      isActive = false;
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    profile,
    loading,
    isAdmin: user?.isAdmin ?? false
  };
};

export default useCurrentUser;
