const STORE_PHONE = import.meta.env.VITE_STORE_PHONE || '+919876543210';
const STORE_EMAIL = import.meta.env.VITE_STORE_EMAIL || 'support@guptamartstationery.in';
// fallback contact

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="container-fixed flex flex-col items-center justify-between gap-2 text-xs text-slate-600 sm:flex-row dark:text-slate-400">
        <p>Gupta Mart &amp; Stationery</p>
        <div className="flex items-center gap-4">
          <a href={`tel:${STORE_PHONE}`} className="font-semibold text-green-700 dark:text-green-400">
            {STORE_PHONE}
          </a>
          <a href={`mailto:${STORE_EMAIL}`} className="font-semibold text-green-700 dark:text-green-400">
            {STORE_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
};
// global footer

export default Footer;
