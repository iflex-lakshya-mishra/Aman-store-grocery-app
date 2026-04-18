import AdminOrders from '../admin/AdminOrders.jsx';

const AdminOrdersPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-10 dark:bg-slate-950">
      <div className="container-fixed space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Order Management</h1>
        </div>
        <AdminOrders />
      </div>
    </div>
  );
};
// page

export default AdminOrdersPage;
