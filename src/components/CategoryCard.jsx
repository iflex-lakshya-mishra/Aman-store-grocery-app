import { memo } from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = memo(({ category }) => {
  return (
    <Link
      to={`/category/${encodeURIComponent(category.name)}`}
      className="group flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-center shadow-sm transition hover:scale-105 hover:shadow-md dark:bg-slate-900"
    >
      <div className="h-14 w-14 overflow-hidden rounded-full bg-slate-100 p-2 dark:bg-slate-800">
        <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
      </div>
      <p className="text-xs font-semibold text-slate-700 group-hover:text-green-700 dark:text-slate-200">
        {category.name}
      </p>
    </Link>
  );
});
// memoized card

export default CategoryCard;
