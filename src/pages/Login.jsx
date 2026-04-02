import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../lib/auth.js';
import useCurrentUser from '../hooks/useCurrentUser.js';

const Login = () => {
  const { user, loading } = useCurrentUser();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  // form state

  useEffect(() => {
    if (!loading && user) {
      navigate('/orders');
    }
  }, [loading, user, navigate]);
  // redirect

  const handleGoogleLogin = async () => {
    setError('');
    setSubmitting(true);
    const response = await signInWithGoogle();
    setSubmitting(false);
    if (response.error) {
      setError(response.error.message || 'Google login failed.');
      return;
    }
    navigate('/orders');
  };

  // submit

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="mx-auto w-full max-w-md px-4 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 mb-4">Customer Login</h1>
            <p className="text-sm text-slate-500 mb-8">Sign in with Google to access your orders and cart</p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-6 py-4 text-lg font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l2.66-2.86z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="text-center py-6">
              <div className="h-px bg-slate-200 w-20 mx-auto"></div>
              <span className="text-xs text-slate-400 px-4">Admin?</span>
              <div className="h-px bg-slate-200 w-20 mx-auto"></div>
            </div>

            <a 
              href="/admin/login" 
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 text-center"
            >
              Admin Login
            </a>
          </div>

          {error && <p className="text-sm text-red-500 mt-6">{error}</p>}
        </div>
      </div>
    </div>
  );
};
// page

export default Login;
