import { useEffect, useState } from 'react';
import { categoryApi, productApi, uploadImage } from '../lib/shopApi.js';
import { FALLBACK_IMAGE, getProductImage } from '../lib/imageUtils.js';
import { formatCurrency, getDiscountedPrice } from '../lib/pricing.js';

const emptyForm = {
  name: '',
  category: '',
  size: '',
  price: '',
  discount: '0',
  stock: '100',
  unit: '',
  customUnit: '',
  image: '',
};

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  // state

  const loadData = async () => {
    const [productList, categoryList] = await Promise.all([
      productApi.getAll(),
      categoryApi.getAll(),
    ]);
    setProducts(productList);
    setCategories(categoryList);
  };
  // load products + categories

  useEffect(() => {
    loadData();
  }, []);
  // init

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFile(null);
    setPreview('');
  };
  // reset form

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const imageUrl = file ? await uploadImage(file, 'product-images') : form.image;
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || 'General',
        size: form.size.trim() || '',
        price: Number(form.price) || 0,
        discount: Number(form.discount) || 0,
        stock: Number(form.stock) || 100,
        unit: form.customUnit ? form.customUnit.trim() : form.unit || 'kg',
        image: imageUrl || form.image || '',
      };

      if (editingId) {
        await productApi.update(editingId, payload);
        setStatus('Product updated.');
      } else {
        await productApi.create(payload);
        setStatus('Product added.');
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error('Product save failed:', error);
      setStatus('Unable to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // submit handler

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      size: product.size || '',
      price: product.price,
      discount: product.discount,
      stock: product.stock?.toString() || '100',
      unit: product.unit || 'kg',
      customUnit: '',
      image: product.image,
    });
    setPreview(product.image);
    setFile(null);
  };
  // edit handler

  const handleDelete = async (id) => {
    await productApi.remove(id);
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };
  // delete handler

  // ui
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Product name"
            className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            required
          />

          <select
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            required
          >
            <option value="">Select category</option>
            {categories.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={form.size}
            onChange={(event) => setForm({ ...form, size: event.target.value })}
            className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Select size</option>
            <option value="250g">250g</option>
            <option value="500g">500g</option>
            <option value="1kg">1kg</option>
            <option value="2kg">2kg</option>
            <option value="500ml">500ml</option>
            <option value="1L">1L</option>
            <option value="2L">2L</option>
          </select>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="number"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
              placeholder="Price"
              className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              required
            />
            <input
              type="number"
              value={form.discount}
              onChange={(event) => setForm({ ...form, discount: event.target.value })}
              placeholder="Discount %"
              className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              type="number"
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: event.target.value })}
              placeholder="Stock"
              min="0"
              className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <select
            value={form.unit}
            onChange={(event) => setForm({ ...form, unit: event.target.value })}
            className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="piece">piece</option>
            <option value="kg">kg</option>
            <option value="packet">packet</option>
          </select>
          <input
            value={form.customUnit}
            onChange={(event) => setForm({ ...form, customUnit: event.target.value })}
            placeholder="Custom unit (optional)"
            className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (!selected) return;
              setFile(selected);
              setPreview(URL.createObjectURL(selected));
            }}
            className="w-full text-sm"
          />

          {preview && (
            <img src={preview} alt="Preview" className="h-28 w-28 rounded-2xl object-cover" />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
          >
            {loading ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
          </button>

          {status && <p className="text-sm text-emerald-600">{status}</p>}
        </form>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Catalog</h2>
        <div className="mt-4 space-y-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="h-12 w-12 rounded-xl object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{product.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{product.category}</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(getDiscountedPrice(product.price, product.discount))}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(product)}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
// component

export default ProductManager;
