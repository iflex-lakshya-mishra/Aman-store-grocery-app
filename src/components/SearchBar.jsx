import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ className = '' }) => {
  const [queryText, setQueryText] = useState('');
  const navigate = useNavigate();
  // input state

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = queryText.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setQueryText('');
  };
  // submit handler

  return (
    <form onSubmit={handleSubmit} className={className}>
      <input
        type="text"
        value={queryText}
        onChange={(event) => setQueryText(event.target.value)}
        placeholder="Search groceries, snacks, masala..."
        className="h-11 w-full rounded-xl bg-slate-100 px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-green-100 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:ring-green-900/40"
      />
    </form>
  );
};
// search bar

export default SearchBar;
