import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import useProducts from '../hooks/useProducts.js';
import ProductCard from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeletons.jsx';
import { useCartStore } from '../store/cartStore.js';

const CategoryPage = () => {
  const { name } = useParams();
  const { products, loading } = useProducts();
  const addToCart = useCartStore((state) => state.addToCart);
  // data hooks

  const categoryName = decodeURIComponent(name || '').toLowerCase();

  const filtered = useMemo(() => {
    if (categoryName === 'all') return products;
    return products.filter((item) => item.category.toLowerCase() === categoryName);
  }, [categoryName, products]);
  // filtered list

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
// page

export default CategoryPage;
