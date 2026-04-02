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
        <div className="mt-2 flex items-center gap-2">
          <p className="text-base font-bold text-green-700">{formatCurrency(finalPrice)}</p>
          {hasDiscount && (
            <p className="text-xs text-slate-400 line-through">{formatCurrency(product.price)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onAdd?.({ ...product, image: imageSrc })}
          className="mt-3 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
});
// memoized card

export default ProductCard;
