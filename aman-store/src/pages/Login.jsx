import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../lib/auth.js';
import useCurrentUser from '../hooks/useCurrentUser.js';

const Login = () => {
  const { user, loading } = useCurrentUser();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/account');
    }
  }, [loading, user, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      const response = await signInWithGoogle();
      if (response.error) throw response.error;
    } catch (err) {
      setError(err.message || 'Google login failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="mx-auto w-full max-w-md px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">Welcome</h1>
            <p className="text-sm text-slate-500 mb-8">Sign in with Google to access your account, orders, and more</p>
          </div>

          {error && (
            <p className="text-sm text-red-500 p-3 rounded-xl bg-red-50 mb-6">{error}</p>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 shadow-lg hover:bg-slate-50 hover:border-slate-300 hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l2.66-2.86z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-xs text-center text-slate-500">
            Secure login powered by Supabase + Google
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;