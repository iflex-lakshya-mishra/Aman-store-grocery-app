import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar.jsx';
import { ArrowLeft } from 'lucide-react';

const MobileSearchPage = () => (
  <div className="min-h-screen bg-white pb-[calc(5rem+env(safe-area-inset-bottom,0px))] dark:bg-slate-950 md:hidden">
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <Link to="/" className="shrink-0 rounded-xl p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="min-w-0 truncate text-base font-semibold text-slate-900 dark:text-slate-100">Search</h1>
    </header>

    <div className="container-fixed px-3 py-4">
      <SearchBar className="w-full" />
      <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Type a few letters — suggestions appear as you type. Spelling does not need to be perfect.
      </p>
    </div>
  </div>
);

export default MobileSearchPage;
