import { useEffect, useState } from 'react';
import { ordersApi } from '../lib/shopApi.js';
import { formatCurrency } from '../lib/pricing.js';
import { hasSupabaseConfig } from '../lib/supabaseClient.js';

const statusOptions = [
  { value: 'approved', label: 'Approve' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'rejected', label: 'Reject' },
];
// status options

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);
  // state

  const loadOrders = async () => {
    setLoading(true);
    const list = await ordersApi.getAll();
    setOrders(list || []);
    setLoading(false);
  };
  // load orders

  useEffect(() => {
    loadOrders();
  }, []);
  // init

  const updateStatus = async (orderId, status) => {
    setActionError('');
    setBusyId(orderId);
    try {
      await ordersApi.updateStatus(orderId, status);
      await loadOrders();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not update order.');
    } finally {
      setBusyId(null);
    }
  };
  // status update

  const deleteOrder = async (orderId) => {
    setActionError('');
    setBusyId(orderId);
    try {
      await ordersApi.remove(orderId);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not delete order.');
    } finally {
      setBusyId(null);
    }
  };
  // delete order

  if (loading) {
    return <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900 dark:text-slate-200">Loading orders...</div>;
  }
  // loading state

  // ui
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {actionError && (
          <p className="max-w-2xl rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {actionError}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setActionError('');
            loadOrders();
          }}
          className="ml-auto rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Refresh list
        </button>
      </div>
      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">No orders yet.</p>
          {hasSupabaseConfig && (
            <p className="mx-auto mt-4 max-w-lg text-left text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              If customers can place orders but this page stays empty, orders are usually in the database but{' '}
              <strong className="text-slate-700 dark:text-slate-300">Row Level Security</strong> is hiding them from the admin user.
              In Supabase → <strong className="text-slate-700 dark:text-slate-300">SQL Editor</strong>, run the{' '}
              <strong className="text-slate-700 dark:text-slate-300">ORDERS TABLE + RLS</strong> block from{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] dark:bg-slate-800">supabase-schema.sql</code>{' '}
              (it adds policies so admins with <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] dark:bg-slate-800">profiles.role = &apos;admin&apos;</code> can read all orders).
              Then click Refresh list.
            </p>
          )}
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Order #{order.id}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(order.created_at).toLocaleString()}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{order.user_name} • {order.user_mobile}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {order.delivery_address || order.address || order.user_address || 'Address not available'}
                </p>
                {order.delivery_name && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {order.delivery_name} ({order.delivery_phone || order.user_mobile})
                  </p>
                )}
                {order.user_mobile && (
                  <a href={`tel:${order.user_mobile}`} className="text-xs font-semibold text-emerald-600">
                    Call Customer
                  </a>
                )}
                {Number.isFinite(order.lat) && Number.isFinite(order.lng) && (
                  <a
                    href={`https://maps.google.com/?q=${order.lat},${order.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-emerald-600"
                  >
                    View location ({order.lat.toFixed(4)}, {order.lng.toFixed(4)})
                  </a>
                )}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  order.status === 'pending'
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
                    : order.status === 'rejected'
                      ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                      : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100'
                }`}
              >
                {String(order.status).replace(/_/g, ' ')}
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Items</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {order.items?.map((item, index) => (
                    <li key={`${order.id}-${index}`} className="flex justify-between">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(order.total_price)}
                </p>
                <div className="mt-4 space-y-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => updateStatus(order.id, option.value)}
                      className="w-full rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyId === order.id ? 'Saving…' : option.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => deleteOrder(order.id)}
                    className="w-full rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminOrders;
