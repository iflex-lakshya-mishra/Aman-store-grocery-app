import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useProducts from '../hooks/useProducts.js';
import { getSearchSuggestions, normalizeSearchQuery } from '../lib/searchUtils.js';
import { Search } from 'lucide-react';

const PLACEHOLDERS = [
  'Maggi, Biscuit, Soda...',
  'Doodh, Bread, Butter...',
  'Chips, Namkeen, Snacks...',
  'Rice, Dal, Atta...',
  'Soap, Shampoo, Toothpaste...',
  'Cold Drink, Juice, Water...',
];

const DEBOUNCE_MS = 140;
const MIN_CHARS = 1;

const SearchBar = ({ className = '' }) => {
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const [queryText, setQueryText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(queryText), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [queryText]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const trimmed = normalizeSearchQuery(debounced);
  const suggestions = useMemo(() => {
    if (trimmed.length < MIN_CHARS || loading) return [];
    return getSearchSuggestions(products, trimmed, { limit: 8, minScore: 1 }).map((x) => x.product);
  }, [products, trimmed, loading]);

  useEffect(() => {
    setHighlight(-1);
  }, [trimmed]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, []);

  const goResults = useCallback(
    (q) => {
      const t = normalizeSearchQuery(q);
      if (!t) return;
      navigate(`/search-results?q=${encodeURIComponent(t)}`);
      setQueryText('');
      setDebounced('');
      setOpen(false);
    },
    [navigate],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    goResults(queryText);
  };

  const onKeyDown = (e) => {
    if (!open || !suggestions.length) {
      if (e.key === 'Enter') handleSubmit(e);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      goResults(suggestions[highlight].name);
    }
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          value={queryText}
          onChange={(e) => {
            setQueryText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={PLACEHOLDERS[placeholderIndex]}
          className="h-11 w-full rounded-xl border border-transparent bg-slate-100 py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-green-200 focus:ring-2 focus:ring-green-100 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-green-800 dark:focus:ring-green-900/40"
          aria-autocomplete="list"
          aria-expanded={open && suggestions.length > 0}
          aria-controls="search-suggestions"
        />
      </form>

      {open && trimmed.length >= MIN_CHARS && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {suggestions.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm ${
                  i === highlight ? 'bg-green-50 dark:bg-green-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goResults(p.name)}
              >
                <span className="line-clamp-1 font-medium text-slate-900 dark:text-slate-100">{p.name}</span>
                <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{p.category}</span>
              </button>
            </li>
          ))}
          <li className="border-t border-slate-100 dark:border-slate-800">
            <Link
              to={`/search-results?q=${encodeURIComponent(trimmed)}`}
              className="block px-3 py-2.5 text-center text-xs font-semibold text-green-700 dark:text-green-400"
              onClick={() => {
                setOpen(false);
                setQueryText('');
              }}
            >
              See all results for &quot;{trimmed}&quot;
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
