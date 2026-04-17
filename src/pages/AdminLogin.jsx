import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearCurrentUser, getProfile, signInWithPassword } from '../lib/auth.js';
import useCurrentUser from '../hooks/useCurrentUser.js';

const AdminLogin = () => {
  const { user, loading } = useCurrentUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user?.role === 'admin') {
      navigate('/admin');
    }
  }, [loading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await signInWithPassword(email, password);

      if (response.error) {
        console.error('[ADMIN_LOGIN] Auth error:', response.error);
        setError(response.error.message || 'Login failed');
        setSubmitting(false);
        return;
      }

      const adminUser = response.data?.user || response.user || null;
      console.log('[ADMIN_LOGIN] User logged in:', adminUser?.email);

      if (!adminUser) {
        setError('No user returned from login');
        setSubmitting(false);
        return;
      }

      const profile = await getProfile(adminUser.id);
      console.log('[ADMIN_LOGIN] Profile:', profile);

      if (!profile || profile.role !== 'admin') {
        console.warn('[ADMIN_LOGIN] Not admin:', profile?.role);
        await clearCurrentUser();
        setError(profile ? 'Access denied - admin role required' : 'Profile not found - contact support');
        setSubmitting(false);
        return;
      }

      console.log('[ADMIN_LOGIN] Admin access granted, navigating...');
      navigate('/admin');
    } catch (err) {
      console.error('[ADMIN_LOGIN] Unexpected error:', err);
      setError('Login error - check console');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Admin Login</h1>
          <p className="text-sm text-slate-500 mb-8">Sign in with your admin credentials</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                placeholder="admin@kirana.com"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                placeholder="Enter password"
                required
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Admin Login'}
            </button>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </form>

          <p className="mt-6 text-xs text-slate-500 text-center">
            Back to store? <a href="/" className="text-green-600 hover:underline font-medium">Continue to shop</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

