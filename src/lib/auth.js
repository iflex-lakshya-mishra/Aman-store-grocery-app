import { supabase } from "../lib/supabaseClient.js";
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();


export const getProfile = async (userId) => {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return data;
};

export const createProfile = async (userId, profileData) => {
  if (!supabase || !userId) return { error: new Error('No supabase or userId') };
  const { error } = await supabase
    .from('profiles')
    .insert({ id: userId, ...profileData });
  if (error) return { error };
  return { data: true };
};

const normalizeUser = async (authUser) => {
  if (!authUser?.email) return null;

  const profile = await getProfile(authUser.id);
  const email = normalizeEmail(authUser.email);
  const username = authUser.user_metadata?.username || authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0];
  const displayName = profile?.name || authUser.user_metadata?.display_name || username;
  const name = profile?.name || authUser.user_metadata?.name || displayName;

  return {
    id: authUser.id,
    email,
    username,
    displayName,
    name,
    phone: profile?.phone || authUser.user_metadata?.mobile || authUser.user_metadata?.phone || '',
    address: profile?.address || authUser.user_metadata?.address || '',
    location: profile?.location || '',
    avatarUrl: authUser.user_metadata?.avatar_url || '',
    googleId: authUser?.identities?.[0]?.identity_data?.sub || authUser.user_metadata?.google_id || '',
    role: profile?.role || 'user',
    profile,
    hasProfile: !!profile
  };
};

export const getCurrentUser = async () => {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return await normalizeUser(data?.user);
};

export const onAuthStateChange = (callback) => {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(normalizeUser(session?.user || null));
  });
};

export const signInWithPassword = async (email, password, profile = {}) => {
  const normalizedEmail = normalizeEmail(email);

  console.log('[AUTH] signInWithPassword:', { email: normalizedEmail });

  if (supabase) {
    const response = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (response.error) {
      console.error('[AUTH] signIn error:', response.error);
      return response;
    }

    console.log('[AUTH] signIn success, creating profile if needed');

    // Auto-create/update profile if missing
    const user = response.data.user;
    const existingProfile = await getProfile(user.id);
    if (!existingProfile) {
      console.log('[AUTH] No profile found, creating...');
      const profileData = {
        id: user.id,
        email: normalizedEmail,
        name: user.user_metadata?.full_name || normalizedEmail.split('@')[0],
        role: 'user', // default, admin set manually in Supabase
        updated_at: new Date().toISOString()
      };
      const createResult = await createProfile(user.id, profileData);
      if (createResult.error) {
        console.error('[AUTH] Profile creation error:', createResult.error);
      } else {
        console.log('[AUTH] Profile created successfully');
      }
    } else {
      console.log('[AUTH] Profile exists:', existingProfile.role);
    }

    // Verify session persists
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('[AUTH] Session after login:', !!sessionData?.session);

    return response;
  }

  throw new Error('Supabase not configured');
};

export const signUpWithPassword = async (email, password, options = {}) => {
  const normalizedEmail = normalizeEmail(email);

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: options.data || {},
        emailRedirectTo: options.emailRedirectTo || (typeof window !== 'undefined' ? window.location.origin : undefined),
      },
    });

    if (error) return { data, error };

    // Create profile after successful signup
    if (data.user?.id) {
      // Extract profile data from options or metadata
      const profileData = {
        name: options.name || options.data?.name || '',
        phone: options.phone || options.data?.phone || options.data?.mobile || '',
        address: options.address || options.data?.address || '',
        location: options.location || options.data?.location || ''
      };

      await createProfile(data.user.id, profileData);
    }

    return data;
  }

  throw new Error('Supabase not configured - add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
};

export const signInWithGoogle = async () => {
  if (supabase) {
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;

    const response = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    return response;
  }

  throw new Error('Supabase not configured - add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
};

import { usersApi } from './shopApi.js';

export const upsertGoogleUser = async (authUser) => {
  const normalized = await normalizeUser(authUser);
  if (!normalized) return null;

  const userData = {
    id: normalized.id,
    email: normalized.email,
    googleId: normalized.googleId,
    name: normalized.name,
    phone: normalized.phone || '',
    address: normalized.address || '',
    location: normalized.location || '',
  };

  return await usersApi.upsert(userData);
};

export const updateCurrentUserProfile = async ({ displayName, username, ...profileUpdates }) => {
  if (supabase) {
    // Update auth metadata
    const authResponse = await supabase.auth.updateUser({
      data: { display_name: displayName, username },
    });

    // Update profile table
    if (profileUpdates) {
      await supabase.from('profiles').update(profileUpdates).eq('id', supabase.auth.getUser().data.user.id);
    }

    return {
      ...authResponse,
      user: await normalizeUser(authResponse.data?.user || null),
    };
  }

  throw new Error('No local fallback - use real Supabase auth');
};

export const clearCurrentUser = async () => {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return { data: true };
  }
  throw new Error('Supabase not configured - add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
};

