import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useProducts from '../hooks/useProducts.js';
import useCategories from '../hooks/useCategories.js';
import { useCartStore } from '../store/cartStore.js';
import HeroSlider from '../components/HeroSlider.jsx';
import ProductCard from '../components/ProductCard.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import { ProductCardSkeleton, CategorySkeleton } from '../components/Skeletons.jsx';

const Home = () => {
  const { products, loading, error: productsError, refetch: refetchProducts } = useProducts();
  const {
    categories,
    loading: categoryLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories();
  const addToCart = useCartStore((state) => state.addToCart);

  const trending = useMemo(() => products.slice(0, 6), [products]);
  const newArrivals = useMemo(() => [...products].slice(-6).reverse(), [products]);
  const discounts = useMemo(
    () => products.filter((item) => Number(item.discount) > 0).slice(0, 6),
    [products],
  );

  const catalogError = productsError || categoriesError;

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-slate-950">
      <HeroSlider />

      {catalogError && (
        <div className="container-fixed mt-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-semibold">We couldn&apos;t refresh the catalog</p>
            {productsError && <p className="mt-1 text-xs opacity-90">{productsError}</p>}
            {categoriesError && <p className="mt-1 text-xs opacity-90">{categoriesError}</p>}
            <button
              type="button"
              onClick={() => {
                refetchProducts();
                refetchCategories();
              }}
              className="mt-3 rounded-lg bg-amber-900/10 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-900/20 dark:bg-amber-400/15 dark:text-amber-50 dark:hover:bg-amber-400/25"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <section className="container-fixed mt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-green-600">Categories</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Shop by category</h2>
          </div>
          <Link
            to="/category/all"
            className="shrink-0 rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-900/50"
          >
            View all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categoryLoading
            ? [...Array(6)].map((_, index) => <CategorySkeleton key={index} />)
            : categories.length === 0
              ? (
                  <div className="col-span-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center text-sm text-slate-600 lg:col-span-4 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                    <p className="font-medium text-slate-800 dark:text-slate-100">No categories yet</p>
                    <p className="mt-1 text-xs">Check back soon — we&apos;re updating the store.</p>
                  </div>
                )
              : (
                  categories.map((category) => <CategoryCard key={category.id} category={category} />)
                )}
        </div>
      </section>

      <section className="container-fixed mt-12">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Trending now</h2>
          <Link
            to="/search?q=trending"
            className="shrink-0 text-sm font-semibold text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            See all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading
            ? [...Array(6)].map((_, index) => <ProductCardSkeleton key={index} />)
            : products.length === 0
              ? (
                  <div className="col-span-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center lg:col-span-4 dark:border-slate-700 dark:bg-slate-900/50">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">No products to show</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Pull to refresh or try again in a moment.</p>
                    <button
                      type="button"
                      onClick={() => refetchProducts()}
                      className="mt-4 rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      Reload products
                    </button>
                  </div>
                )
              : (
                  trending.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={addToCart} />
                  ))
                )}
        </div>
      </section>

      <section className="container-fixed mt-12">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">New arrivals</h2>
          <Link
            to="/search?q=new"
            className="shrink-0 text-sm font-semibold text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            See all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading
            ? [...Array(6)].map((_, index) => <ProductCardSkeleton key={index} />)
            : products.length === 0
              ? null
              : newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} />
                ))}
        </div>
      </section>

      <section className="container-fixed mt-12">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Discount picks</h2>
          <Link
            to="/search?q=discount"
            className="shrink-0 text-sm font-semibold text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            See all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading
            ? [...Array(6)].map((_, index) => <ProductCardSkeleton key={index} />)
            : products.length === 0
              ? null
              : (discounts.length ? discounts : trending).map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} />
                ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
