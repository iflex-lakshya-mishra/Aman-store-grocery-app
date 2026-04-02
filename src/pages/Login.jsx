import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPassword } from '../lib/auth.js';
import { usersApi } from '../lib/shopApi.js';
import useCurrentUser from '../hooks/useCurrentUser.js';

const Login = () => {
  const { user, loading } = useCurrentUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  // form state

  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === 'admin' ? '/admin' : '/');
    }
  }, [loading, user, navigate]);
  // redirect

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('Full name, mobile, and address are required.');
      setSubmitting(false);
      return;
    }

    const response = await signInWithPassword(email, password, {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });

    if (response.error) {
      setError(response.error.message || 'Unable to sign in.');
      setSubmitting(false);
      return;
    }

    await usersApi.upsert({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      mobile: phone.trim(),
      address: address.trim(),
    });

    const currentRole = response.data?.user?.role;
    navigate(currentRole === 'admin' ? '/admin' : '/');
  };
  // submit

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="mx-auto w-full max-w-md px-4 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">Login</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in with your delivery details.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                placeholder="Your full name"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Mobile number
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                placeholder="Mobile number"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Delivery address
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                rows="3"
                placeholder="Street, city, and pin code"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                placeholder="you@example.com"
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
              className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};
// page

export default Login;
