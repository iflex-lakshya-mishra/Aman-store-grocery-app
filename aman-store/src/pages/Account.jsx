import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCurrentUser from '../hooks/useCurrentUser.js';
import { supabase } from '../lib/supabase.js';

const Account = () => {
  const { user, profile, loading } = useCurrentUser();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    setName(profile?.name || user.name || '');
    setPhone(profile?.phone || user.phone || '');
    setAddress(profile?.address || user.address || '');
    // lat/lng not in profile, keep manual
  }, [user, profile, loading]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('GPS supported nahi hai!');
      return;
    }
    setLocationStatus('Location dhundh raha hai...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const readable = data.display_name || `${latitude}, ${longitude}`;
          setAddress(readable);
          setLocationStatus('✅ Location mil gayi!');
        } catch {
          setLocationStatus('✅ Location mil gayi! (coordinates only)');
        }
      },
      () => setLocationStatus('❌ Location access denied!')
    );
  };

  const handleSave = async () => {
    try {
      // Save to localStorage fallback
      localStorage.setItem('userProfile', JSON.stringify({ name, phone, address, lat, lng }));
      
      // Save to Supabase
      if (user && supabase) {
        const { error } = await supabase
          .from('profiles')
          .upsert([{ 
            id: user.id, 
            name, 
            phone, 
            address,
            updated_at: new Date().toISOString()
          }]);
        if (error) throw error;
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Save error:', error);
      // Still save local fallback
      localStorage.setItem('userProfile', JSON.stringify({ name, phone, address, lat, lng }));
      alert('Local save succeeded, Supabase save failed. Check console.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="container-fixed py-10 max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-green-600">Account</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Your Profile</h1>
          {user && <p className="mt-1 text-sm text-slate-500">{user.email}</p>}
        </div>

        {/* Profile Form */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Delivery Details</h2>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number"
            type="tel"
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />

          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Delivery Address"
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />

          <button
            onClick={handleGetLocation}
            className="w-full rounded-xl border-2 border-green-200 bg-green-50 py-3 text-sm font-semibold text-green-700 hover:bg-green-100 transition-all"
          >
            📍 Use My Current Location
          </button>

          {locationStatus && (
            <p className="text-xs text-slate-500 text-center">{locationStatus}</p>
          )}

          {lat && lng && (
                <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
                className="block text-xs text-center text-green-600 underline"
            >
                Map pe dekho 🗺️
            </a>
            )}

          <button
            onClick={handleSave}
            className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-all"
          >
            {saved ? '✅ Saved!' : 'Save Details'}
          </button>
        </div>

        {/* Logout */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-red-50 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition-all"
          >
            🚪 Logout
          </button>
        </div>

      </div>
    </div>
  );
};

export default Account;