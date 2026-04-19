import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore.js';
import { ordersApi } from '../lib/shopApi.js';
import { FALLBACK_IMAGE, getProductImage } from '../lib/imageUtils.js';
import { getOrderLocation } from '../lib/location.js';
import useCurrentUser from '../hooks/useCurrentUser.js';
import { formatCurrency, getCartTotals, getItemPrice } from '../lib/pricing.js';
import { readStoredUserProfile } from '../lib/userProfileStorage.js';
import { rememberPendingOrder } from '../lib/pendingOrders.js';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const { user, profile: remoteProfile } = useCurrentUser();
  const [profileTick, setProfileTick] = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  // data hooks

  useEffect(() => {
    const bump = () => setProfileTick((n) => n + 1);
    window.addEventListener('userprofile:updated', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('userprofile:updated', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  const profile = useMemo(() => {
    void profileTick;
    const local = readStoredUserProfile();
    const name = String(remoteProfile?.name || local?.name || '').trim();
    const phone = String(remoteProfile?.phone || local?.phone || '').trim();
    const address = String(remoteProfile?.address || local?.address || '').trim();
    const lat = local?.lat ?? remoteProfile?.lat ?? null;
    const lng = local?.lng ?? remoteProfile?.lng ?? null;
    if (!name || !phone || !address) return null;
    return { name, phone, address, lat, lng };
  }, [remoteProfile, profileTick]);

  const deliveryFeeAmount = Number(import.meta.env.VITE_DELIVERY_FEE ?? 20);
  const { subtotal, deliveryFee, total } = useMemo(
    () => getCartTotals(cart, { deliveryFee: deliveryFeeAmount }),
    [cart, deliveryFeeAmount],
  );
  // totals

  const isProfileComplete = profile && 
    profile.name && profile.name.trim() && 
    profile.phone && profile.phone.replace(/\D/g, '').length === 10 && 
    profile.address && profile.address.trim();
  const unavailableItems = useMemo(
    () => cart.filter((item) => item.stock !== undefined && Number(item.stock) <= 0),
    [cart],
  );

  const handlePlaceOrder = async () => {
    setValidationError('');
    setStatus('');

    if (!cart.length) {
      setValidationError('Your cart is empty.');
      return;
    }
    if (!user?.email) {
      setValidationError('Please login to place an order.');
      return;
    }
    if (!isProfileComplete) {
      setValidationError('Delivery details missing — save them once on the Account page.');
      return;
    }
    if (unavailableItems.length) {
      setValidationError('Some items are unavailable. Please remove them to continue.');
      return;
    }

    const phoneDigits = profile.phone.replace(/\D/g, '').slice(0, 10);

    setLoading(true);

    try {
      const location = await getOrderLocation();
      
      const created = await ordersApi.create({
        status: 'pending',
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: getItemPrice(item),
        })),
        subtotal,
        delivery_fee: deliveryFee,
        total_price: total,
        delivery_name: profile.name.trim(),
        delivery_phone: phoneDigits,
        delivery_address: profile.address.trim(),
        user_name: user?.name || user?.displayName || '',
        user_mobile: phoneDigits,
        user_address: profile.address.trim(),
        lat: profile.lat || location.lat,
        lng: profile.lng || location.lng,
        address: location.address || profile.address || user?.address || '',
        user_email: user?.email || '',
      });

      if (created?.id) rememberPendingOrder(created.id);
      clearCart();
      setStatus(
        'Order placed. It is pending until the store confirms it — you can track status under Orders.',
      );
    } catch (e) {
      setStatus(
        e instanceof Error && e.message
          ? e.message
          : 'Failed to place order. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };
  // order action

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-slate-950">
      <div className="container-fixed py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-green-600">Cart</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Your cart</h1>
          </div>
          <Link to="/" className="text-sm font-semibold text-green-700">
            Continue Shopping
          </Link>
        </div>

        {!cart.length ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-12 text-center dark:border-slate-700 dark:bg-slate-900/80">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Your cart is empty</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Browse products and tap Add — items stay here until checkout.</p>
            <Link
              to="/"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-green-600 px-6 text-sm font-semibold text-white hover:bg-green-700"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      className="h-24 w-24 rounded-xl object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.name}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.category}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                          className="h-9 w-9 rounded-xl border border-slate-200 text-lg text-slate-600 dark:border-slate-700 dark:text-slate-300"
                        >
                          -
                        </button>
                        <span className="min-w-[32px] text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="h-9 w-9 rounded-xl border border-slate-200 text-lg text-slate-600 dark:border-slate-700 dark:text-slate-300"
                        >
                          +
                        </button>
                      {item.stock !== undefined && Number(item.stock) > 0 && (
                        <span className="text-xs text-slate-400">Max {item.stock}</span>
                      )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-700">
                        {formatCurrency(getItemPrice(item) * (item.quantity || 1))}
                      </p>
                    {item.stock !== undefined && Number(item.stock) <= 0 && (
                      <p className="mt-1 text-xs font-semibold text-red-600">Unavailable</p>
                    )}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="mt-2 text-xs font-semibold text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Order Summary</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900 dark:border-slate-700 dark:text-slate-100">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {!user?.email ? (
                <div className="mt-6 space-y-3">
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    You can add items to the cart without an account. Log in only when you are ready to pay and place the order.
                  </p>
                  <Link
                    to="/login?next=/cart"
                    className="inline-flex w-full justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Log in to place order
                  </Link>
                </div>
              ) : (
                <>
                  {unavailableItems.length > 0 && (
                    <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-200">
                      Some items in your cart are unavailable. Remove them to place an order.
                    </div>
                  )}
                  {!isProfileComplete && (
                    <div className="mt-6 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                      Save your delivery address on Account — then you will not need to type it for every order.
                      <Link to="/account" className="mt-2 inline-block font-semibold text-green-700 underline dark:text-green-400">
                        Save on Account →
                      </Link>
                    </div>
                  )}
                  {isProfileComplete && (
                    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                      Delivering to: <span className="font-medium text-slate-700 dark:text-slate-300">{profile.name}</span>
                      {' · '}
                      {profile.phone.replace(/\D/g, '').slice(0, 10)}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={loading || !isProfileComplete || unavailableItems.length > 0}
                    className="mt-6 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                  >
                    {loading ? 'Placing order...' : 'Place Order'}
                  </button>
                </>
              )}

              {validationError && (
                <p className="mt-4 text-sm text-red-600">
                  {validationError}
                </p>
              )}
              {status && (
                <p
                  className={`mt-4 text-sm ${
                    status.startsWith('Order placed') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {status}
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

