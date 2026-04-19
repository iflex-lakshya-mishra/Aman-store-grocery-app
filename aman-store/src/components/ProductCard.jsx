import { memo } from 'react';
import { Link } from 'react-router-dom';
import { FALLBACK_IMAGE, getProductImage } from '../lib/imageUtils.js';
import { formatCurrency, getDiscountedPrice } from '../lib/pricing.js';

const ProductCard = memo(({ product, onAdd }) => {
  const finalPrice = getDiscountedPrice(product.price, product.discount);
  const hasDiscount = Number(product.discount) > 0;
  const imageSrc = getProductImage(product);
  // pricing

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-900">
      <div className="relative">
        <Link to={`/product/${product.id}`}>
          <img
            src={imageSrc}
            alt={product.name}
            className="h-32 w-full object-cover sm:h-36"
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </Link>
        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-green-600 px-2 py-1 text-[10px] font-semibold text-white">
            {product.discount}% OFF
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-[10px] font-semibold uppercase text-green-600">{product.category}</p>
        <Link to={`/product/${product.id}`} className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {product.name}
        </Link>
        {product.size && <p className="mt-2 text-sm text-slate-500">{product.size}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-base font-bold text-green-700">
            {formatCurrency(finalPrice)}
            <span className="text-xs font-medium text-slate-500"> / {product.unit || 'unit'}</span>
          </p>
          {hasDiscount && (
            <p className="text-xs text-slate-400 line-through">{formatCurrency(product.price)}</p>
          )}
          {product.stock !== undefined && Number(product.stock) <= 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
              Out of stock
            </span>
          )}
          {Number(product.stock) > 0 && Number(product.stock) <= 5 && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Only {product.stock} left
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={Number(product.stock) <= 0}
          onClick={() => onAdd?.({ ...product, image: imageSrc, stock: product.stock })}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-green-600 px-3 text-sm font-semibold text-white transition active:scale-[0.98] hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
});

export default ProductCard;
