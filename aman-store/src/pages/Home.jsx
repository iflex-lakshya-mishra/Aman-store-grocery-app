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
  const { products, loading } = useProducts();
  const { categories, loading: categoryLoading } = useCategories();
  const addToCart = useCartStore((state) => state.addToCart);
  // data hooks

  const trending = useMemo(() => products.slice(0, 6), [products]);
  const newArrivals = useMemo(() => [...products].slice(-6).reverse(), [products]);
  const discounts = useMemo(
    () => products.filter((item) => Number(item.discount) > 0).slice(0, 6),
    [products],
  );
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
          <Link to="/category/all" className="text-sm font-semibold text-green-700">
            View All
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categoryLoading
            ? [...Array(6)].map((_, index) => <CategorySkeleton key={index} />)
            : categories.map((category) => <CategoryCard key={category.id} category={category} />)}
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
