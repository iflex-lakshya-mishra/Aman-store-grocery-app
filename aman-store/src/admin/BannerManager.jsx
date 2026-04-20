import { useEffect, useState } from 'react';
import { bannerApi, uploadImage, settingsApi } from '../lib/shopApi.js';

const emptyForm = { title: '', link: '' };

const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSaving, setLogoSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  // added loading

  const loadBanners = async () => {
    const data = await bannerApi.getAll();
    setBanners(data || []);
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoSaving(true);
    try {
      const url = await uploadImage(file, 'logos');
      setLogoUrl(url);
    } catch {
      // ignore
    } finally {
      setLogoSaving(false);
    }
  };

  const handleLogoSave = async () => {
    if (!logoUrl.trim()) return;
    setLogoSaving(true);
    try {
      await settingsApi.updateAppLogo(logoUrl);
    } catch {
      // ignore
    } finally {
      setLogoSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;
    setLoading(true);

    try {
      const imageUrl = await uploadImage(file, 'banners');
      await bannerApi.create({
        title: form.title.trim() || 'Banner',
        link: form.link.trim() || '/',
        image: imageUrl,
      });

      await loadBanners();
      setForm(emptyForm);
      setFile(null);
    } catch (error) {
      console.error('Banner save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await bannerApi.remove(id);
    setBanners((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-8">
        {/*
        <div>
          <h3 className="text-lg font-semibold mb-4">App Logo</h3>
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Logo URL or upload"
            className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="mt-2 w-full text-sm"
          />
          <button
            type="button"
            onClick={handleLogoSave}
            disabled={logoSaving}
            className="mt-3 w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {logoSaving ? 'Saving...' : 'Update Logo'}
          </button>
        </div>
        */}
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
          <button 
            type="submit" 
            disabled={loading}
            className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Add Banner'}
          </button>
        </form>
      </div>

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
