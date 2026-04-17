import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import useProducts from '../hooks/useProducts.js';
import useCategories from '../hooks/useCategories.js';
import ProductCard from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeletons.jsx';
import { useCartStore } from '../store/cartStore.js';

const CategoryPage = () => {
  const { name } = useParams();
  const { products, loading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const addToCart = useCartStore((state) => state.addToCart);

  const categoryName = decodeURIComponent(name || '').trim().toLowerCase();

  const filtered = useMemo(() => {
    if (categoryName === 'all') return products;
    return products.filter((item) => String(item.category || '').trim().toLowerCase() === categoryName);
  }, [categoryName, products]);

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-slate-950">
      <div className="container-fixed py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-green-600">Category</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {categoryName === 'all' ? 'All Products' : name}
            </h1>
          </div>
          <Link to="/" className="text-sm font-semibold text-green-700">
            Back to Home
          </Link>
        </div>

        {!categoriesLoading && categories.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/category/all"
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                categoryName === 'all'
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              All
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${encodeURIComponent(category.name)}`}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  category.name.trim().toLowerCase() === categoryName
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading
            ? [...Array(8)].map((_, index) => <ProductCardSkeleton key={index} />)
            : filtered.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
