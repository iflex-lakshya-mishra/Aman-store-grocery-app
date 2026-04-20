import { useMemo, useRef } from 'react';
import useCurrentUser from '../hooks/useCurrentUser.js';
import { Link } from 'react-router-dom';
import useProducts from '../hooks/useProducts.js';
import useCategories from '../hooks/useCategories.js';
import { useCartStore } from '../store/cartStore.js';
import HeroSlider from '../components/HeroSlider.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeletons.jsx';

const Home = () => {
  const { user } = useCurrentUser();
  const { products, loading } = useProducts();
  const { categories, loading: categoryLoading } = useCategories();
  const categoriesRowRef = useRef(null);
  const addToCart = useCartStore((state) => state.addToCart);
  // data hooks

  const trending = useMemo(() => products.slice(0, 6), [products]);
  const newArrivals = useMemo(() => [...products].slice(-6).reverse(), [products]);
  const discounts = useMemo(
    () => products.filter((item) => Number(item.discount) > 0).slice(0, 6),
    [products],
  );

  const scrollCategories = (direction) => {
    if (!categoriesRowRef.current) return;
    const delta = direction === 'left' ? -200 : 200;
    categoriesRowRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };
  // derived lists

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-slate-950">

<HeroSlider />

      <section className="container-fixed mt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-green-600">Categories</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Shop by category</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Scroll categories left"
            >
              &lt;
            </button>
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Scroll categories right"
            >
              &gt;
            </button>
          </div>
        </div>
        <div
          ref={categoriesRowRef}
          className="mt-6 flex gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {categoryLoading
            ? [...Array(8)].map((_, index) => (
                <div key={index} className="w-20 shrink-0 animate-pulse text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="mx-auto mt-2 h-3 w-14 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ))
            : categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${encodeURIComponent(category.name)}`}
                  className="w-20 shrink-0 text-center"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="mx-auto h-16 w-16 rounded-full object-cover"
                  />
                  <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {category.name}
                  </p>
                </Link>
              ))}
        </div>
      </section>

      <section className="container-fixed mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Trending Now</h2>
          <Link to="/search?q=trending" className="text-sm font-semibold text-green-700">
            See All
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading
            ? [...Array(6)].map((_, index) => <ProductCardSkeleton key={index} />)
            : trending.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
        </div>
      </section>

      <section className="container-fixed mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">New Arrivals</h2>
          <Link to="/search?q=new" className="text-sm font-semibold text-green-700">
            See All
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading
            ? [...Array(6)].map((_, index) => <ProductCardSkeleton key={index} />)
            : newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
        </div>
      </section>

      <section className="container-fixed mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Discount Picks</h2>
          <Link to="/search?q=discount" className="text-sm font-semibold text-green-700">
            See All
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading
            ? [...Array(6)].map((_, index) => <ProductCardSkeleton key={index} />)
            : (discounts.length ? discounts : trending).map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
        </div>
      </section>
    </div>
  );
};
// page

export default Home;