export const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%25" height="100%25" fill="%23f1f5f9"/><text x="50%25" y="50%25" fill="%2394a3b8" font-size="20" font-family="Arial" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>';
// fallback image

const normalizeAssetPath = (image = '') => {
  const trimmed = String(image).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http') || trimmed.startsWith('//')) return trimmed;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('assets/API')) return `/${trimmed}`;
  if (trimmed.startsWith('API/')) return `/assets/${trimmed}`;
  return `/assets/API/${trimmed}`;
};
// local image path support

export const getAutoProductImage = (name = '') => {
  const query = encodeURIComponent(`${name || 'grocery'} grocery`);
  return `https://source.unsplash.com/600x600/?${query}`;
};
// Unsplash auto image

export const getProductImage = (product = {}) => {
  const uploaded = product.uploaded_image || product.uploadedImage || product.image_upload || '';
  const manual = product.image || '';
  const preferred = normalizeAssetPath(uploaded || manual);
  if (preferred) return preferred;
  if (product.name) return getAutoProductImage(product.name);
  return FALLBACK_IMAGE;
};
// image priority: uploaded > auto > fallback

