import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCurrentUser from '../hooks/useCurrentUser.js';
import { supabase } from '../lib/supabaseClient.js';
import {
  readStoredUserProfile,
  writeStoredUserProfile,
  displayNameFromAuthUser,
} from '../lib/userProfileStorage.js';

const digitsOnly = (s) => String(s || '').replace(/\D/g, '');

const Account = () => {
  const { user, profile, loading, refreshProfile } = useCurrentUser();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const formDirtyRef = useRef(false);

  useEffect(() => {
    formDirtyRef.current = false;
  }, [user?.id]);

  useEffect(() => {
    const local = readStoredUserProfile();
    if (!local) return;
    if (local.name) setName(local.name);
    if (local.phone) setPhone(local.phone);
    if (local.address) setAddress(local.address);
    if (local.lat != null) setLat(local.lat);
    if (local.lng != null) setLng(local.lng);
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    if (formDirtyRef.current) return;
    const local = readStoredUserProfile();
    const fromGoogle = displayNameFromAuthUser(user);
    const nextName =
      (profile?.name && String(profile.name).trim()) ||
      (local?.name && String(local.name).trim()) ||
      fromGoogle ||
      '';
    const nextPhone =
      (profile?.phone && String(profile.phone).trim()) ||
      (local?.phone && String(local.phone).trim()) ||
      '';
    const nextAddress =
      (profile?.address && String(profile.address).trim()) ||
      (local?.address && String(local.address).trim()) ||
      '';
    setName(nextName);
    setPhone(nextPhone);
    setAddress(nextAddress);
    if (local?.lat != null && local?.lng != null) {
      setLat(local.lat);
      setLng(local.lng);
    }
  }, [user, profile, loading]);

  const profileComplete = useMemo(() => {
    const p10 = digitsOnly(phone).length === 10;
    return Boolean(name.trim() && p10 && address.trim());
  }, [name, phone, address]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported in this browser.');
      return;
    }
    setLocationStatus('Getting location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          );
          const data = await res.json();
          const readable = data.display_name || `${latitude}, ${longitude}`;
          formDirtyRef.current = true;
          setAddress(readable);
          setLocationStatus('Address updated from location');
        } catch {
          setLocationStatus('Coordinates saved (address lookup failed)');
        }
      },
      () => setLocationStatus('Location access denied'),
    );
  };

  const handleSave = async () => {
    setSaveError('');
    setSaved(false);
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      lat: lat ?? null,
      lng: lng ?? null,
    };
    writeStoredUserProfile(payload);
    try {
      window.dispatchEvent(new CustomEvent('userprofile:updated', { detail: payload }));
    } catch {
      // ignore
    }

    if (user && supabase) {
      const { error } = await supabase.from('profiles').upsert([
        {
          id: user.id,
          name: payload.name,
          phone: payload.phone,
          address: payload.address,
          updated_at: new Date().toISOString(),
        },
      ]);
      if (error) {
        setSaveError('Could not sync to the server. Details are saved on this device only.');
        console.error('[account] profile upsert', error);
        return;
      }
      await refreshProfile();
      formDirtyRef.current = false;
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 dark:bg-slate-950 md:pb-20">
      <div className="container-fixed mx-auto max-w-lg space-y-6 py-10">

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-600">Account</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Profile &amp; delivery</h1>
          {user?.email && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          )}
          {profileComplete ? (
            <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm font-medium text-green-800 dark:bg-green-900/25 dark:text-green-200">
              Delivery details are saved — you will not need to enter them again at checkout.
            </p>
          ) : (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
              Save your name, 10-digit mobile number, and address once — checkout will use them automatically.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Saved address</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Your name may be suggested from Google; you can edit everything here.
          </p>

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Full name
          </label>
          <input
            value={name}
            onChange={(e) => {
              formDirtyRef.current = true;
              setName(e.target.value);
            }}
            placeholder="Full name"
            autoComplete="name"
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Mobile (10 digits)
          </label>
          <input
            value={phone}
            onChange={(e) => {
              formDirtyRef.current = true;
              setPhone(e.target.value);
            }}
            placeholder="10-digit mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={14}
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Flat / street / landmark
          </label>
          <textarea
            value={address}
            onChange={(e) => {
              formDirtyRef.current = true;
              setAddress(e.target.value);
            }}
            placeholder="Complete delivery address"
            rows={4}
            autoComplete="street-address"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />

          <button
            type="button"
            onClick={handleGetLocation}
            className="mt-4 w-full rounded-xl border border-green-200 bg-green-50 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-900/50"
          >
            Use current location
          </button>

          {locationStatus && (
            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">{locationStatus}</p>
          )}

          {lat != null && lng != null && (
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-center text-xs font-semibold text-green-600 underline dark:text-green-400"
            >
              Open in Maps
            </a>
          )}

          {saveError && (
            <p className="mt-3 text-center text-xs text-amber-700 dark:text-amber-300">{saveError}</p>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="mt-4 w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            {saved ? 'Profile saved' : 'Save for future orders'}
          </button>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl bg-red-50 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Account;
