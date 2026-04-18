import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productApi, categoryApi, bannerApi, ordersApi } from '../lib/shopApi.js';
import useCurrentUser from '../hooks/useCurrentUser.js';

const AdminDashboard = () => {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState({ products: 0, categories: 0, banners: 0, orders: 0 });
  // stats state

  useEffect(() => {
    const loadStats = async () => {
      const [products, categories, banners, orders] = await Promise.all([
        productApi.getAll(),
        categoryApi.getAll(),
        bannerApi.getAll(),
        ordersApi.getAll(),
      ]);
      setStats({
        products: products.length,
        categories: categories.length,
        banners: banners.length,
        orders: orders.length,
      });
    };

    loadStats();
  }, []);
  // load summary

  return (
    <div className="min-h-screen bg-slate-50 py-10 dark:bg-slate-950">
      <div className="container-fixed space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-8 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">Admin Console</p>
          <h1 className="mt-3 text-3xl font-semibold">Welcome, {user?.name || user?.displayName || 'Manager'}</h1>
          <p className="mt-2 text-sm text-emerald-100">Manage products, categories, banners, and orders.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Products', value: stats.products },
            { label: 'Categories', value: stats.categories },
            { label: 'Banners', value: stats.banners },
            { label: 'Orders', value: stats.orders },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl bg-white p-5 shadow-sm dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { to: '/admin/products', title: 'Product Manager', desc: 'Add, edit, delete products.' },
            { to: '/admin/categories', title: 'Category Manager', desc: 'Control category cards.' },
            { to: '/admin/banners', title: 'Banner Manager', desc: 'Update homepage banners.' },
            { to: '/admin/orders', title: 'Order Manager', desc: 'Approve and track orders.' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
// page

export default AdminDashboard;
