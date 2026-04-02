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
