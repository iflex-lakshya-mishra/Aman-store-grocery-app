import { Link } from 'react-router-dom';

const STORE_PHONE = import.meta.env.VITE_STORE_PHONE || '+919876543210';
const STORE_EMAIL = import.meta.env.VITE_STORE_EMAIL || 'support@guptamartstationery.in';
// fallback contact
const STORE_ADDRESS = 'Varanasi, Uttar Pradesh';

const Footer = () => {
  return (
    <footer className="border-t border-slate-700 bg-slate-800 pb-20 text-slate-400 md:pb-0">
      <div className="container-fixed py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <p className="text-lg font-semibold text-slate-100">Gupta Mart &amp; Stationery</p>
            <p className="text-sm text-slate-300">Your trusted local kirana store</p>
            <p className="text-xs text-slate-400">© 2026 Gupta Mart &amp; Stationery. All rights reserved.</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Quick Links</p>
            <nav className="flex flex-col gap-2 text-sm">
              <Link to="/" className="transition-colors hover:text-slate-100">Home</Link>
              <Link to="/category/all" className="transition-colors hover:text-slate-100">Categories</Link>
              <Link to="/orders" className="transition-colors hover:text-slate-100">Orders</Link>
              <Link to="/account" className="transition-colors hover:text-slate-100">Account</Link>
            </nav>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Contact</p>
            <div className="flex flex-col gap-2 text-sm">
              <a href={`tel:${STORE_PHONE}`} className="transition-colors hover:text-slate-100">
                {STORE_PHONE}
              </a>
              <a href={`mailto:${STORE_EMAIL}`} className="break-all transition-colors hover:text-slate-100 sm:break-normal">
                {STORE_EMAIL}
              </a>
              <p>{STORE_ADDRESS}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-700 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>Made with ❤️ in India</p>
          <p>© 2026 Gupta Mart &amp; Stationery. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
// global footer

export default Footer;
