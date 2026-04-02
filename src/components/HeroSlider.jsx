import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const slides = [
  {
    id: 1,
    title: 'Fresh daily groceries',
    subtitle: 'Quick kirana delivery at your doorstep.',
    image:
      'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=900&q=80',
    query: 'fresh',
  },
  {
    id: 2,
    title: 'Essentials at better prices',
    subtitle: 'Smart pantry shopping with clean discounts.',
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    query: 'discount',
  },
  {
    id: 3,
    title: 'Snacks and staples',
    subtitle: 'From daily needs to favorite treats.',
    image:
      'https://images.unsplash.com/photo-1579113800032-c38bd7635818?auto=format&fit=crop&w=900&q=80',
    query: 'snacks',
  },
];
// compact slides

const HeroSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  // slider state

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);
  // auto play

  const activeSlide = useMemo(() => slides[activeIndex], [activeIndex]);

  return (
    <section className="container-fixed mt-6">
      <div className="grid gap-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 p-4 text-white shadow-sm sm:grid-cols-[1fr_1fr] sm:p-5">
        <div className="flex flex-col justify-center gap-2 sm:pr-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-100">Aman-Store</p>
          <h2 className="text-xl font-semibold sm:text-2xl">{activeSlide.title}</h2>
          <p className="text-xs text-green-50 sm:text-sm">{activeSlide.subtitle}</p>
          <div className="mt-1 flex items-center gap-2">
            <Link
              to={`/search?q=${encodeURIComponent(activeSlide.query)}`}
              className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-green-700"
            >
              Shop Now
            </Link>
            <Link
              to="/category/all"
              className="rounded-xl bg-white/15 px-4 py-2 text-xs font-semibold text-white"
            >
              View All
            </Link>
          </div>
        </div>

        <img
          src={activeSlide.image}
          alt={activeSlide.title}
          className="h-36 w-full rounded-xl object-cover sm:h-40 lg:h-44"
        />
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
// hero slider

export default HeroSlider;
