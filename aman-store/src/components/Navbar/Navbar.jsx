import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Moon, ShoppingCart, Sun } from 'lucide-react';
import { useCartStore } from '../../store/cartStore.js';
import useLogoStore from '../../store/logoStore.js';
import useCurrentUser from '../../hooks/useCurrentUser.js';
import { clearCurrentUser } from '../../lib/auth.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import SearchBar from '../SearchBar.jsx';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginHref = `/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`;
  const { cart } = useCartStore();
  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [cart],
  );
  const cartBadgeLabel = cartItemCount > 99 ? '99+' : String(cartItemCount);
  const { user, loading: authLoading } = useCurrentUser();
  const logoStore = useLogoStore();
  const { logo } = logoStore;
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => { logoStore.fetchLogo(); }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await clearCurrentUser();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('[auth] Logout failed', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/70 py-3 shadow-sm backdrop-blur dark:bg-slate-950/70">
      <div className="container-fixed flex flex-wrap items-center gap-3">

        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo}
            alt="Gupta Mart & Stationery"
            className="h-10 w-auto object-contain"
            onError={(e) => e.currentTarget.src = '/Applogo.png'}
          />
        </Link>

        <div className="order-3 w-full md:order-0 md:flex-1">
          <SearchBar className="w-full" />
        </div>

        <div className="ml-auto flex items-center gap-2">

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl bg-slate-100 p-2 text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Cart - sirf desktop pe */}
          <Link
            to="/cart"
            className="relative hidden md:inline-flex rounded-xl bg-slate-100 p-2 text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"
            aria-label={cartItemCount > 0 ? `Cart, ${cartItemCount} items` : 'Cart'}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-h-4.5 min-w-4.5 items-center justify-center rounded-full bg-green-600 px-1 text-[10px] font-semibold leading-none text-white">
                {cartBadgeLabel}
              </span>
            )}
          </Link>

          {deferredPrompt && (
            <button
              onClick={() => {
                deferredPrompt.prompt();
                setDeferredPrompt(null);
              }}
              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Install App
            </button>
          )}

          {authLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" aria-hidden />
          ) : user ? (
            <button
              onClick={handleLogout}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Logout
            </button>
          ) : (
            <Link
              to={loginHref}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Log in
            </Link>
          )}

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"
            >
              Menu
              <ChevronDown className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-44 rounded-xl border border-slate-100 bg-white p-2 shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10">
                <Link to="/" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                  Home
                </Link>
                <Link to="/category/all" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                  Categories
                </Link>
                <Link
                  to={user ? '/orders' : '/login?next=%2Forders'}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Orders
                </Link>
                <Link
                  to={user ? '/account' : '/login?next=%2Faccount'}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Account
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;