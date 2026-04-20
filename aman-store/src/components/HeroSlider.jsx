import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { bannerApi } from '../lib/shopApi.js';

const HeroSlider = () => {
  const [slides, setSlides] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    bannerApi.getAll().then((data) => {
      if (data && data.length > 0) {
        setSlides(data.map((b) => ({
          id: b.id,
          title: b.title || 'Gupta Mart & Stationery',
          subtitle: '',
          image: b.image,
          query: b.link?.replace('/', '') || 'fresh',
        })));
      }
    });
  }, []);

  useEffect(() => {
    if (!slides.length) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const activeSlide = useMemo(() => slides[activeIndex], [activeIndex, slides]);

  useEffect(() => {
    setImageLoaded(false);
  }, [activeSlide?.image]);

  if (!slides.length) return null;

  return (
    <section className="container-fixed mx-auto mt-6 max-w-5xl">
      <div className="relative overflow-hidden rounded-xl shadow-sm">
        {!imageLoaded && <div className="absolute inset-0 z-0 bg-slate-800" aria-hidden />}
        <img
          src={activeSlide.image}
          alt={activeSlide.title}
          loading="eager"
          fetchPriority="high"
          onLoad={() => setImageLoaded(true)}
          className={`h-56 max-h-72 w-full object-cover transition-opacity duration-500 sm:h-64 lg:h-72 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/25 to-transparent" />

        <div className="absolute inset-0 flex items-center px-4 sm:px-6">
          <div className="max-w-md text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-100">Gupta Mart & Stationery</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{activeSlide.title}</h2>
            {activeSlide.subtitle && (
              <p className="mt-2 text-xs text-green-50 sm:text-sm">{activeSlide.subtitle}</p>
            )}
            <div className="mt-4 flex items-center gap-2">
              <Link
                to={`/search?q=${encodeURIComponent(activeSlide.query)}`}
                className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-green-700"
              >
                Shop Now
              </Link>
              <Link
                to="/category/all"
                className="rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold text-white"
              >
                View All
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex ? 'w-6 bg-green-600 dark:bg-green-400' : 'w-2.5 bg-slate-300 dark:bg-slate-700'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;

