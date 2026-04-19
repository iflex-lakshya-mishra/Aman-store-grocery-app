import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useCurrentUser from '../hooks/useCurrentUser.js';
import { ordersApi } from '../lib/shopApi.js';
import { formatCurrency } from '../lib/pricing.js';
import { OrderSkeleton } from '../components/Skeletons.jsx';

const steps = ['pending', 'approved', 'out_for_delivery', 'delivered'];

const Orders = () => {
  const { user, profile } = useCurrentUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // data hooks

  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.email) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const list = await ordersApi.getByEmail(user.email);
      setOrders(list || []);
      setLoading(false);
    };

    loadOrders();
  }, [user]);
  // load orders

  const getStepIndex = (status) => steps.indexOf(status);

  const orderStatusBadgeClass = (status) => {
    if (status === 'pending') {
      return 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
    }
    if (status === 'rejected') {
      return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200';
    }
    return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-200';
  };

  const content = useMemo(() => {
    if (loading) {
      return [...Array(3)].map((_, index) => <OrderSkeleton key={index} />);
    }

    if (!orders.length) {
      return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">No orders yet.</p>
        </div>
      );
    }

    return orders.map((order) => (
      <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Order #{order.id}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(order.created_at).toLocaleString()}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {order.delivery_address || order.address || order.user_address || 'No address'}
            </p>
            {order.delivery_name && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {order.delivery_name} • {order.delivery_phone || order.user_mobile}
              </p>
            )}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${orderStatusBadgeClass(order.status)}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
            {steps.map((step, index) => (
              <div key={step} className="flex-1">
                <div
                  className={`h-1 rounded-full ${
                    index <= getStepIndex(order.status) ? 'bg-green-600' : 'bg-slate-200'
                  }`}
                />
                <p className="mt-2 text-center capitalize">{step.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_160px]">
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {order.items?.map((item, index) => (
              <li key={`${order.id}-${index}`} className="flex justify-between">
                <span>{item.name} x{item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(order.total_price)}</p>
          </div>
        </div>
      </div>
    ));
  }, [loading, orders]);
  // render block

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-slate-950">
      <div className="container-fixed py-10 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-0">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-green-600">Orders</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Your orders</h1>
          </div>
          {user && (
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <p><strong>Email:</strong> {user.email}</p>
              <p>
                {user.profile?.name || user.user_metadata?.name || user.user_metadata?.display_name || 'No name set'}
              </p>
            </div>
          )}
          {!user?.email && (
            <Link to="/login" className="text-sm font-semibold text-green-700">
              Login
            </Link>
          )}
        </div>
        {content}
      </div>
    </div>
  );
};
// page

export default Orders;
