import { supabase } from './supabase';

export const AUTH_STORAGE_KEY = 'kirana-auth-user';
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@kirana.com').trim().toLowerCase();
// config

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const normalizeUser = (authUser) => {
  if (!authUser?.email) {
    return null;
  }

  const email = normalizeEmail(authUser.email);
  const username =
    authUser.username ||
    authUser.user_metadata?.username ||
    authUser.user_metadata?.display_name ||
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    email.split('@')[0] ||
    'Guest';
  const displayName = authUser.displayName || authUser.user_metadata?.display_name || username;

  return {
    id: authUser.id || authUser.user_metadata?.id || email,
    email,
    username,
    displayName,
    name: authUser.name || authUser.user_metadata?.name || displayName,
    mobile: authUser.mobile || authUser.user_metadata?.mobile || authUser.phone || authUser.user_metadata?.phone || '',
    address: authUser.address || authUser.user_metadata?.address || '',
    avatarUrl: authUser.avatarUrl || authUser.user_metadata?.avatar_url || '',
    googleId: authUser?.identities?.[0]?.identity_data?.sub || authUser.user_metadata?.google_id || authUser.user_metadata?.googleId || '',
    role: isAdminEmail(email) ? 'admin' : 'user',
  };
};
// normalize

const dispatchAuthEvent = (user) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent('kirana-auth-change', { detail: user }));
};

const getStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const serialized = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return normalizeUser(JSON.parse(serialized));
  } catch {
    return null;
  }
};

const setStoredUser = (user) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    dispatchAuthEvent(user);
  } catch {
    // ignore
  }
};

const removeStoredUser = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    dispatchAuthEvent(null);
  } catch {
    // ignore
  }
};
// local storage

export const getCurrentUser = async () => {
  if (supabase) {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      return normalizeUser(data.user);
    }
  }

  return getStoredUser();
};

export const onAuthStateChange = (callback) => {
  if (supabase) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(normalizeUser(session?.user || null));
    });

    return data.subscription;
  }

  const handler = (event) => {
    callback(normalizeUser(event.detail || null));
  };

  window.addEventListener('kirana-auth-change', handler);

  return {
    unsubscribe: () => window.removeEventListener('kirana-auth-change', handler),
  };
};
// auth events

export const signInWithPassword = async (email, password, profile = {}) => {
  const normalizedEmail = normalizeEmail(email);

  if (supabase) {
    return supabase.auth.signInWithPassword({ email: normalizedEmail, password });
  }

  if (!normalizedEmail || !password) {
    return { error: { message: 'Email and password are required.' } };
  }

  if (isAdminEmail(normalizedEmail) && password !== 'admin123') {
    return { error: { message: 'Invalid admin credentials.' } };
  }

  const user = normalizeUser({
    id: `local-${normalizedEmail}`,
    email: normalizedEmail,
    username: normalizedEmail.split('@')[0],
    displayName: profile.name || normalizedEmail.split('@')[0],
    name: profile.name || normalizedEmail.split('@')[0],
    phone: profile.phone || '',
    address: profile.address || '',
    googleId: '',
  });

  setStoredUser(user);

  return { data: { user } };
};
// sign in

export const signUpWithPassword = async (email, password, options = {}) => {
  const normalizedEmail = normalizeEmail(email);

  if (supabase) {
    return supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: options.data || {},
        emailRedirectTo:
          options.emailRedirectTo ||
          (typeof window !== 'undefined' ? window.location.origin : undefined),
      },
    });
  }

  if (!normalizedEmail || !password) {
    return { error: { message: 'Email and password are required.' } };
  }

  const user = normalizeUser({
    id: `local-${normalizedEmail}`,
    email: normalizedEmail,
    username: normalizedEmail.split('@')[0],
    displayName: normalizedEmail.split('@')[0],
    googleId: '',
  });

  setStoredUser(user);

  return { data: { user } };
};
// sign up

export const signInWithGoogle = async () => {
  if (supabase) {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
      },
    });
  }

  const localUser = normalizeUser({
    id: 'local-google-user',
    email: 'google.user@local.dev',
    displayName: 'Google User',
    username: 'google-user',
    googleId: 'local-google-id',
  });
  setStoredUser(localUser);
  return { data: { user: localUser } };
};
// google auth

export const updateCurrentUserProfile = async ({ displayName, username }) => {
  if (supabase) {
    const response = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
        username,
      },
    });

    return {
      ...response,
      user: normalizeUser(response.data?.user || null),
    };
  }

  const currentUser = getStoredUser();
  if (!currentUser) {
    return { error: { message: 'No current user found.' } };
  }

  const updated = normalizeUser({
    ...currentUser,
    displayName,
    username,
  });

  setStoredUser(updated);

  return { data: { user: updated } };
};
// profile update

export const clearCurrentUser = async () => {
  if (supabase) {
    await supabase.auth.signOut();
  }

  removeStoredUser();
};
// sign out

export const getAdminEmail = () => ADMIN_EMAIL;
export const isAdminEmail = (email) => Boolean(ADMIN_EMAIL) && normalizeEmail(email) === ADMIN_EMAIL;
export const isAdminUser = (user) => Boolean(user?.email && isAdminEmail(user.email));
// admin helpers
