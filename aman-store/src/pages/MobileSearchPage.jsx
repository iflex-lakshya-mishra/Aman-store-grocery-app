import { useNavigate, Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar.jsx';
import { ArrowLeft } from 'lucide-react';

const MobileSearchPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white pb-20 pt-16 dark:bg-slate-950 md:hidden">
      {/* Back header for mobile */}
      <div className="sticky top-0 z-40 flex items-center gap-3 bg-white px-4 py-4 shadow-sm dark:bg-slate-950 md:hidden">
        <Link to="/" className="p-2">
          <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </Link>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Search Products</h1>
      </div>

      <div className="container-fixed px-4 py-8">
        {/* Recent searches placeholder */}
        <div className="rounded-2xl bg-slate-50 p-6 dark:bg-slate-900/50">
          <p className="text-sm text-slate-600 dark:text-slate-400">Type to search products</p>
        </div>
      </div>
    </div>
  );
};

export default MobileSearchPage;
