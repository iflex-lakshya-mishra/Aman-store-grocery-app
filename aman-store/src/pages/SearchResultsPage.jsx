import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useProducts from '../hooks/useProducts.js';
import ProductCard from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeletons.jsx';
import { useCartStore } from '../store/cartStore.js';
import { rankProductsByQuery } from '../lib/searchUtils.js';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const { products, loading } = useProducts();
  const addToCart = useCartStore((state) => state.addToCart);

  const { primary, secondary } = useMemo(() => {
    if (!query) return { primary: [], secondary: [] };
    const ranked = rankProductsByQuery(products, query);
    if (!ranked.length) return { primary: [], secondary: [] };

    const strong = ranked.filter((x) => x.score >= 200).map((x) => x.product);
    const seen = new Set(strong.map((p) => p.id));
    const rest = ranked.filter((x) => !seen.has(x.product.id)).map((x) => x.product);

    if (strong.length) {
      return { primary: strong, secondary: rest.slice(0, 12) };
    }

    const top = ranked.slice(0, 24).map((x) => x.product);
    const primaryIds = new Set(top.slice(0, 12).map((p) => p.id));
    return {
      primary: top.slice(0, 12),
      secondary: top.filter((p) => !primaryIds.has(p.id)),
    };
  }, [products, query]);

  const matchedCount = primary.length;

  return (
    <div className="min-h-screen bg-white pb-[calc(5rem+env(safe-area-inset-bottom,0px))] dark:bg-slate-950 md:pb-20">
      <div className="container-fixed py-6 sm:py-10">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-green-600">Search</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
            Results for &quot;{query}&quot;
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {loading ? 'Loading…' : `${matchedCount} match${matchedCount === 1 ? '' : 'es'} (typos & partial words included)`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : matchedCount ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {primary.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
            {secondary.length > 0 && (
              <div className="mt-10">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">More matches</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {secondary.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={addToCart} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl bg-slate-50 p-8 text-center dark:bg-slate-900 sm:p-10">
            <p className="text-sm text-slate-600 dark:text-slate-300">No products matched that search.</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Try a shorter word or check spelling loosely — we match similar names.</p>
            <Link to="/" className="mt-4 inline-flex text-sm font-semibold text-green-700 dark:text-green-400">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
