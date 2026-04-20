import { useEffect, useState } from 'react';
import { categoryApi, uploadImage } from '../lib/shopApi.js';

const emptyForm = { name: '', image: '' };

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  // state

  const loadCategories = async () => {
    const data = await categoryApi.getAll();
    setCategories(data || []);
  };
  // load categories

  useEffect(() => {
    loadCategories();
  }, []);
  // init

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(null);
    setPreview('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const imageUrl = imageFile ? await uploadImage(imageFile, 'categories') : form.image;
      const payload = {
        name: form.name.trim(),
        image: imageUrl,
      };

      if (editingId) {
        await categoryApi.update(editingId, payload);
      } else {
        await categoryApi.create(payload);
      }

      await loadCategories();
      resetForm();
    } catch (error) {
      console.error('Category save failed:', error);
    } finally {
      setLoading(false);
    }
  };
  // submit handler

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name, image: item.image });
    setImageFile(null);
    setPreview('');
  };
  // edit handler

  const handleDelete = async (id) => {
    await categoryApi.remove(id);
    setCategories((prev) => prev.filter((item) => item.id !== id));
  };
  // delete handler

  // ui
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm space-y-4 dark:bg-slate-900">
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Category name"
          className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (!selected) return;
            setImageFile(selected);
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
          className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Saving...' : editingId ? 'Update Category' : 'Add Category'}
        </button>
      </form>

      <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Categories</h2>
        <div className="mt-4 space-y-3">
          {categories.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-100">
                  {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(item)}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
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

export default CategoryManager;
