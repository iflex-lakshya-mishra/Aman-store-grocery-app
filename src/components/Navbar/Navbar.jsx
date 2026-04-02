import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Moon, ShoppingCart, Sun } from 'lucide-react';
import { useCartStore } from '../../store/cartStore.js';
import useCurrentUser from '../../hooks/useCurrentUser.js';
import { clearCurrentUser } from '../../lib/auth.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import SearchBar from '../SearchBar.jsx';

const Navbar = () => {
  const navigate = useNavigate();
  const { cart } = useCartStore();
  const { user } = useCurrentUser();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  // ui state

  useEffect(() => {
    if (!menuOpen) return;
    // close dropdown on outside click

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

  const handleLogout = async () => {
    await clearCurrentUser();
    navigate('/login');
  };
  // actions

  return (
    <nav className="sticky top-0 z-50 bg-white/70 py-3 shadow-sm backdrop-blur dark:bg-slate-950/70">
      <div className="container-fixed flex flex-wrap items-center gap-3">
        <Link to="/" className="text-lg font-bold text-green-700 dark:text-green-400">
          Aman-Store
        </Link>

        <div className="order-3 w-full md:order-none md:flex-1">
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

          <Link
            to="/cart"
            className="relative rounded-xl bg-slate-100 p-2 text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"
          >
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[10px] font-semibold text-white">
                {cart.length}
              </span>
            )}
          </Link>

          {user ? (
            <button
              onClick={handleLogout}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Login
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
              <div className="absolute right-0 top-[calc(100%+8px)] min-w-40 rounded-xl bg-white p-2 shadow-sm dark:bg-slate-900">
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Home
                </Link>
                <Link
                  to="/category/all"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Categories
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Orders
                </Link>
                <Link
                  to={user ? '/orders' : '/login'}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Account
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
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
// navbar ui

export default Navbar;
