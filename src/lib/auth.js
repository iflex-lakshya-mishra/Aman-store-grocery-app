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
  const username = authUser.user_metadata?.username || authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0];
  const displayName = profile?.name || authUser.user_metadata?.display_name || username;
  const name = profile?.name || authUser.user_metadata?.name || displayName;
  return {
    id: authUser.id,
    email,
    username,
    displayName,
    name,
    phone: profile?.phone || '',
    address: profile?.address || '',
    location: profile?.location || '',
    avatarUrl: authUser.user_metadata?.avatar_url || '',
    googleId: authUser?.identities?.[0]?.identity_data?.sub || '',
    role: profile?.role || (email === 'guptamartstationary911@gmail.com' ? 'admin' : 'user'),
    isAdmin: profile?.role === 'admin' || email === 'guptamartstationary911@gmail.com',
    profile,
    hasProfile: !!profile
  };
};

export const getCurrentUser = async () => {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return await normalizeUser(data?.user);
};

export const onAuthStateChange = (callback) => {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user ? await normalizeUser(session.user) : null;
    callback(user);
  });
};

export const signInWithGoogle = async () => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/`
    : undefined;

  const response = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  return response;
};

export const signInWithPassword = async (email, password) => {
  if (!supabase) throw new Error('Supabase not configured');
  const normalizedEmail = normalizeEmail(email);
  const response = await supabase.auth.signInWithPassword({ 
    email: normalizedEmail, 
    password 
  });
  if (response.error) return response;
  const user = response.data.user;
  const existingProfile = await getProfile(user.id);
  if (!existingProfile) {
    await createProfile(user.id, {
      id: user.id,
      email: normalizedEmail,
      name: user.user_metadata?.full_name || normalizedEmail.split('@')[0],
      role: normalizedEmail === 'guptamartstationary911@gmail.com' ? 'admin' : 'user',
      updated_at: new Date().toISOString()
    });
  }
  return response;
};

export const signUpWithPassword = async (email, password, options = {}) => {
  if (!supabase) throw new Error('Supabase not configured');
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: options.data || {},
      emailRedirectTo: options.emailRedirectTo || window.location.origin,
    },
  });
  if (error) return { data, error };
  if (data.user?.id) {
    await createProfile(data.user.id, {
      name: options.name || '',
      phone: options.phone || '',
      address: options.address || '',
      location: options.location || ''
    });
  }
  return data;
};

export const updateCurrentUserProfile = async ({ displayName, username, ...profileUpdates }) => {
  if (!supabase) throw new Error('Supabase not configured');
  const authResponse = await supabase.auth.updateUser({
    data: { display_name: displayName, username },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (profileUpdates && user?.id) {
    await supabase.from('profiles').update(profileUpdates).eq('id', user.id);
  }
  return {
    ...authResponse,
    user: await normalizeUser(authResponse.data?.user || null),
  };
};

export const clearCurrentUser = async () => {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return { data: true };
};

import { usersApi } from './shopApi.js';

export const upsertGoogleUser = async (authUser) => {
  const normalized = await normalizeUser(authUser);
  if (!normalized) return null;
  return await usersApi.upsert({
    id: normalized.id,
    email: normalized.email,
    googleId: normalized.googleId,
    name: normalized.name,
    phone: normalized.phone || '',
    address: normalized.address || '',
    location: normalized.location || '',
  });
};