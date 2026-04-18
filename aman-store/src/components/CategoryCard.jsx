import { memo } from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = memo(({ category }) => {
  return (
    <Link
      to={`/category/${encodeURIComponent(category.name)}`}
      className="group flex flex-col items-center gap-3 p-2 text-center transition"
    >
      <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-100 p-3 shadow-sm transition group-hover:scale-105 group-hover:shadow-md dark:bg-slate-800">
        <img src={category.image} alt={category.name} className="h-full w-full rounded-full object-cover" />
      </div>
      <p className="text-sm font-semibold text-slate-700 group-hover:text-green-700 dark:text-slate-200">
        {category.name}
      </p>
    </Link>
  );
});
// memoized card

export default CategoryCard;
