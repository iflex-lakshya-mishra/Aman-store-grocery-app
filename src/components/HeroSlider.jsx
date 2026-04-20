import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { bannerApi } from '../lib/shopApi.js';

const fallbackSlides = [
  {
    id: 1,
    title: 'Fresh daily groceries',
    subtitle: 'Quick kirana delivery at your doorstep.',
    image: 'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=900&q=80',
    query: 'fresh',
  },
  {
    id: 2,
    title: 'Essentials at better prices',
    subtitle: 'Smart pantry shopping with clean discounts.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    query: 'discount',
  },
  {
    id: 3,
    title: 'Snacks and staples',
    subtitle: 'From daily needs to favorite treats.',
    image: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?auto=format&fit=crop&w=900&q=80',
    query: 'snacks',
  },
];

const HeroSlider = () => {
  const [slides, setSlides] = useState(fallbackSlides);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    bannerApi.getAll().then((data) => {
      if (data && data.length > 0) {
        setSlides(data.map((b) => ({
          id: b.id,
          title: b.title || 'Gupta Mart',
          subtitle: '',
          image: b.image,
          query: b.link?.replace('/', '') || 'fresh',
        })));
      }
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const activeSlide = useMemo(() => slides[activeIndex], [activeIndex, slides]);

  return (
    <section className="container-fixed mt-6">
      <div className="relative overflow-hidden rounded-xl shadow-sm">
        <img
          src={activeSlide.image}
          alt={activeSlide.title}
          className="h-56 w-full object-cover sm:h-64 lg:h-72"
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