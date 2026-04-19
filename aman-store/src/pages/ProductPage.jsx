import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import useProducts from '../hooks/useProducts.js';
import { useCartStore } from '../store/cartStore.js';
import { FALLBACK_IMAGE, getProductImage } from '../lib/imageUtils.js';
import { formatCurrency, getDiscountedPrice } from '../lib/pricing.js';
import ProductCard from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeletons.jsx';

const ProductPage = () => {
  const { id } = useParams();
  const { products, loading } = useProducts();
  const addToCart = useCartStore((state) => state.addToCart);
  // data hooks

  const product = useMemo(() => products.find((item) => String(item.id) === String(id)), [products, id]);
  const related = useMemo(
    () => products.filter((item) => item.category === product?.category && item.id !== product?.id).slice(0, 4),
    [products, product],
  );
  // derived list

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-10 dark:bg-slate-950">
        <div className="container-fixed">
          <div className="h-80 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white py-10 dark:bg-slate-950">
        <div className="container-fixed text-center">
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Product not found.</p>
          <Link to="/" className="mt-4 inline-flex text-sm font-semibold text-green-700">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const finalPrice = getDiscountedPrice(product.price, product.discount);
  const imageSrc = getProductImage(product);

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-slate-950">
      <div className="container-fixed py-10 space-y-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-900">
            <img
              src={imageSrc}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.3em] text-green-600">{product.category}</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{product.name}</h1>
            <div className="mt-4 flex items-center gap-3">
              <p className="text-2xl font-semibold text-green-700">
                {formatCurrency(finalPrice)} / {product.unit || ''}
              </p>
              {product.discount > 0 && (
                <p className="text-sm text-slate-400 line-through">{formatCurrency(product.price)} / {product.unit || ''}</p>
              )}
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Freshly packed essentials with trusted brands.</p>
            <button
              type="button"
              disabled={Number(product.stock) <= 0}
              onClick={() => addToCart({ ...product, image: imageSrc })}
              className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-green-600 px-4 text-sm font-semibold text-white transition active:scale-[0.99] hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {Number(product.stock) <= 0 ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Related products</h2>
            <Link to={`/category/${encodeURIComponent(product.category)}`} className="text-sm font-semibold text-green-700">
              View category
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {loading
              ? [...Array(4)].map((_, index) => <ProductCardSkeleton key={index} />)
              : related.map((item) => <ProductCard key={item.id} product={item} onAdd={addToCart} />)}
          </div>
        </div>
      </div>
    </div>
  );
};
// page

export default ProductPage;
