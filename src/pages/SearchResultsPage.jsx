import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useProducts from '../hooks/useProducts.js';
import ProductCard from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeletons.jsx';
import { useCartStore } from '../store/cartStore.js';

const simplify = (value = '') =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(.)\1+/g, '$1');
// simple normalize

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';
  const { products, loading } = useProducts();
  const addToCart = useCartStore((state) => state.addToCart);
  // data hooks

  const { matched, similar } = useMemo(() => {
    if (!query) return { matched: [], similar: [] };
    const lowered = query.toLowerCase();
    const simplified = simplify(query);

    const matchedItems = products.filter((item) => {
      const name = item.name.toLowerCase();
      const category = item.category.toLowerCase();
      return name.includes(lowered) || category.includes(lowered);
    });

    const matchedIds = new Set(matchedItems.map((item) => item.id));
    const matchedCategories = new Set(matchedItems.map((item) => item.category));

    const similarItems = products.filter((item) => {
      if (matchedIds.has(item.id)) return false;
      const name = simplify(item.name);
      const category = simplify(item.category);
      return (
        (simplified && (name.includes(simplified) || category.includes(simplified))) ||
        matchedCategories.has(item.category)
      );
    });

    return { matched: matchedItems, similar: similarItems };
  }, [products, query]);
  // search results

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-slate-950">
      <div className="container-fixed py-10">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-green-600">Search</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Results for "{query}"</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{matched.length} items found</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : matched.length ? (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {matched.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
            {similar.length > 0 && (
              <div className="mt-10">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Similar products</p>
                <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {similar.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={addToCart} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl bg-slate-50 p-10 text-center dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-300">No products found.</p>
            <Link to="/" className="mt-4 inline-flex text-sm font-semibold text-green-700">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
// page

export default SearchResultsPage;
