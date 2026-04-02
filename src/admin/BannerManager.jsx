import { useEffect, useState } from 'react';
import { bannerApi, uploadImage } from '../lib/shopApi.js';

const emptyForm = { title: '', link: '' };

const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  // state

  const loadBanners = async () => {
    const data = await bannerApi.getAll();
    setBanners(data || []);
  };
  // load banners

  useEffect(() => {
    loadBanners();
  }, []);
  // init

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;

    const imageUrl = await uploadImage(file, 'banner-images');
    await bannerApi.create({
      title: form.title.trim() || 'Banner',
      link: form.link.trim() || '/',
      image: imageUrl,
    });

    await loadBanners();
    setForm(emptyForm);
    setFile(null);
  };
  // submit handler

  const handleDelete = async (id) => {
    await bannerApi.remove(id);
    setBanners((prev) => prev.filter((item) => item.id !== id));
  };
  // delete handler

  // ui
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm space-y-4 dark:bg-slate-900">
        <input
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder="Banner title"
          className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          value={form.link}
          onChange={(event) => setForm({ ...form, link: event.target.value })}
          placeholder="Link (optional)"
          className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className="w-full text-sm"
          required
        />
        <button type="submit" className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
          Add Banner
        </button>
      </form>

      <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Banners</h2>
        <div className="mt-4 space-y-4">
          {banners.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
              <img src={item.image} alt={item.title} className="h-32 w-full rounded-2xl object-cover" />
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.link}</p>
                </div>
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

export default BannerManager;
