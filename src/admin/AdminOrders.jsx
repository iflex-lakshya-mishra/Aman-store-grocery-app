import { useEffect, useState } from 'react';
import { ordersApi } from '../lib/shopApi.js';
import { formatCurrency } from '../lib/pricing.js';

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
    await ordersApi.updateStatus(orderId, status);
    await loadOrders();
  };
  // status update

  const deleteOrder = async (orderId) => {
    await ordersApi.remove(orderId);
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  };
  // delete order

  if (loading) {
    return <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900 dark:text-slate-200">Loading orders...</div>;
  }
  // loading state

  // ui
  return (
    <div className="space-y-5">
      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">No orders yet.</p>
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
                  {order.address || order.user_address || 'Address not available'}
                </p>
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
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {order.status}
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
                      onClick={() => updateStatus(order.id, option.value)}
                      className="w-full rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      {option.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => deleteOrder(order.id)}
                    className="w-full rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
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
