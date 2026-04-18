import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE = 'Gupta Mart & Stationery';
const DEFAULT_DESC =
  'Fresh groceries and stationery from Gupta Mart & Stationery — browse categories, offers, and quick delivery essentials.';

const titleForPath = (pathname) => {
  if (pathname === '/') return SITE;
  if (pathname.startsWith('/cart')) return `Cart — ${SITE}`;
  if (pathname.startsWith('/orders') || pathname.startsWith('/dashboard')) return `Orders — ${SITE}`;
  if (pathname.startsWith('/account')) return `Account — ${SITE}`;
  if (pathname.startsWith('/login')) return `Login — ${SITE}`;
  if (pathname.startsWith('/admin/login')) return `Admin login — ${SITE}`;
  if (pathname.startsWith('/admin/products')) return `Products (admin) — ${SITE}`;
  if (pathname.startsWith('/admin/categories')) return `Categories (admin) — ${SITE}`;
  if (pathname.startsWith('/admin/banners')) return `Banners (admin) — ${SITE}`;
  if (pathname.startsWith('/admin/orders')) return `Orders (admin) — ${SITE}`;
  if (pathname.startsWith('/admin')) return `Admin — ${SITE}`;
  if (pathname.startsWith('/category/')) return `Shop category — ${SITE}`;
  if (pathname.startsWith('/product/')) return `Product — ${SITE}`;
  if (pathname.startsWith('/search-results')) return `Search results — ${SITE}`;
  if (pathname.startsWith('/search')) return `Search — ${SITE}`;
  return SITE;
};

const DocumentHead = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titleForPath(pathname);

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', DEFAULT_DESC);

    window.scrollTo({ top: 0, left: 0, behavior: pathname === '/' ? 'auto' : 'smooth' });
  }, [pathname]);

  return null;
};

export default DocumentHead;
