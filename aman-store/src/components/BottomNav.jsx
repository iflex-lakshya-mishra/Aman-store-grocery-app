import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingCart, ClipboardList, Shield } from 'lucide-react';
import useCurrentUser from '../hooks/useCurrentUser.js';
import { useCartStore } from '../store/cartStore.js';

const BottomNav = () => {
  const { user } = useCurrentUser();
  const cart = useCartStore((s) => s.cart);
  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [cart],
  );
  const cartBadgeLabel = cartItemCount > 99 ? '99+' : String(cartItemCount);

  const ordersTo = user ? '/orders' : '/login?next=%2Forders';

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/cart', label: 'Cart', icon: ShoppingCart },
    { to: ordersTo, label: 'Orders', icon: ClipboardList },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin', icon: Shield });
  }
  // nav items

  const columns = user?.role === 'admin' ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-950">
      <div className={`grid ${columns} gap-2 px-4 py-2`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const showCartBadge = item.to === '/cart' && cartItemCount > 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.to === '/cart' && cartItemCount > 0 ? `Cart, ${cartItemCount} items` : item.label}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold ${
                  isActive
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <span className="relative inline-flex">
                <Icon className="h-5 w-5" />
                {showCartBadge && (
                  <span className="absolute -right-2 -top-1 inline-flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full bg-green-600 px-0.5 text-[9px] font-bold leading-none text-white">
                    {cartBadgeLabel}
                  </span>
                )}
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
// mobile nav

export default BottomNav;
