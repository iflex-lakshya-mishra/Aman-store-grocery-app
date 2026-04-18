// Pricing helpers
export const formatCurrency = (amount) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(value);
};
// format

export const getDiscountedPrice = (price = 0, discount = 0) => {
  const safePrice = Number(price) || 0;
  const safeDiscount = Math.min(Math.max(Number(discount) || 0, 0), 90);
  const finalPrice = safePrice - (safePrice * safeDiscount) / 100;
  return Math.max(finalPrice, 0);
};
// discount math

export const getItemPrice = (item = {}) => {
  const legacyPrice = Number(item.discountPrice);
  if (!Number.isNaN(legacyPrice) && legacyPrice > 0) {
    return legacyPrice;
  }
  return getDiscountedPrice(item.price, item.discount);
};
// item price

export const getCartTotals = (cart = [], options = {}) => {
  const items = Array.isArray(cart) ? cart : [];
  const deliveryFeeConfigured = Number(options.deliveryFee);
  const deliveryFee = Number.isFinite(deliveryFeeConfigured) ? Math.max(0, deliveryFeeConfigured) : 0;

  const totals = items.reduce(
    (acc, item) => {
      const qty = Math.max(1, Math.floor(Number(item?.quantity) || 1));
      const originalUnit = Number(item?.price) || 0;
      const finalUnit = getItemPrice(item);
      const lineOriginal = originalUnit * qty;
      const lineFinal = finalUnit * qty;

      acc.subtotal += lineFinal;
      acc.originalTotal += lineOriginal;
      return acc;
    },
    { subtotal: 0, originalTotal: 0 },
  );

  const discountTotal = Math.max(0, totals.originalTotal - totals.subtotal);
  const total = totals.subtotal + (items.length ? deliveryFee : 0);

  return {
    subtotal: totals.subtotal,
    originalTotal: totals.originalTotal,
    discountTotal,
    deliveryFee: items.length ? deliveryFee : 0,
    total,
  };
};
