import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, Download } from 'lucide-react';
import { loadStorefrontProducts } from '../services/productRepository';
import { useStore } from '../context/StoreContext';

// Decorative floating gradient spheres around the laptop.
const SPHERES = [
  { className: 'w-16 h-16 -bottom-4 left-0 sm:left-4', gradient: 'linear-gradient(135deg,#6C3BFF,#8F63FF)', duration: 7, delay: 0 },
  { className: 'w-24 h-24 top-[38%] -right-6', gradient: 'linear-gradient(135deg,#C9A7FF,#FF4FD8)', duration: 8.5, delay: 1 },
  { className: 'w-8 h-8 top-4 left-[28%]', gradient: 'linear-gradient(135deg,#8F63FF,#6C3BFF)', duration: 6, delay: 0.6 },
];

/** Laptop screen content — real catalog thumbnails standing in for "beautiful product cards". */
const LaptopScreen = () => {
  const { catalogVersion } = useStore();
  const products = useMemo(() => loadStorefrontProducts(), [catalogVersion]);

  return (
  <div className="rounded-lg overflow-hidden bg-white">
    <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-border/70 bg-white">
      <span className="w-2 h-2 rounded-full bg-red-300" />
      <span className="w-2 h-2 rounded-full bg-amber-300" />
      <span className="w-2 h-2 rounded-full bg-emerald-300" />
      <div className="ml-2.5 flex-1 h-4 rounded-full bg-secondary/80 max-w-[8rem]" />
      <span className="hidden sm:block w-10 h-4 rounded-full brand-gradient opacity-80" />
    </div>
    <div className="p-3 sm:p-3.5">
      <div className="h-2 w-20 rounded-full bg-foreground/10 mb-3" />
      <div className="grid grid-cols-3 gap-2">
        {(products.length ? products : [{ id: 'a' }, { id: 'b' }, { id: 'c' }]).slice(0, 3).map((p) => (
          <div key={p.id} className="rounded-lg overflow-hidden bg-secondary/40 border border-border/50">
            {p.img ? (
              <img src={p.img} alt="" aria-hidden="true" className="w-full aspect-square object-cover" />
            ) : (
              <div className="w-full aspect-square brand-gradient opacity-40" />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2.5">
        <div className="h-1.5 flex-1 rounded-full bg-foreground/10" />
        <div className="h-1.5 w-8 rounded-full bg-primary/30" />
      </div>
    </div>
  </div>
  );
};

/** Small potted plant, built entirely from layered CSS shapes. */
const Plant = ({ className = '' }) => (
  <div className={`relative w-14 h-20 ${className}`} aria-hidden="true">
    <span className="absolute bottom-9 left-1/2 -translate-x-1/2 w-7 h-11 rounded-[0%_100%_0%_100%] bg-gradient-to-br from-emerald-400 to-emerald-600 origin-bottom -rotate-[26deg] -translate-x-[130%]" />
    <span className="absolute bottom-9 left-1/2 -translate-x-1/2 w-7 h-12 rounded-[100%_0%_100%_0%] bg-gradient-to-bl from-emerald-500 to-emerald-700 origin-bottom rotate-[14deg] translate-x-[35%]" />
    <span className="absolute bottom-9 left-1/2 -translate-x-1/2 w-6 h-9 rounded-[0%_100%_0%_100%] bg-gradient-to-br from-emerald-300 to-emerald-500 origin-bottom rotate-[2deg]" />
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-11 h-9 rounded-t-md rounded-b-xl bg-gradient-to-b from-[#8F63FF] to-[#6C3BFF] soft-shadow" />
  </div>
);

/** Pencil holder with a fan of colorful pencils, built from layered CSS bars. */
const PencilHolder = ({ className = '' }) => (
  <div className={`relative w-16 h-16 ${className}`} aria-hidden="true">
    {['#FF4FD8', '#6C3BFF', '#FFB020', '#22C55E'].map((c, i) => (
      <span
        key={c}
        className="absolute bottom-7 w-1.5 h-10 rounded-full soft-shadow"
        style={{ background: c, left: `${10 + i * 9}px`, transform: `rotate(${(i - 1.5) * 9}deg)`, transformOrigin: 'bottom center' }}
      />
    ))}
    <div className="absolute bottom-0 left-1 w-14 h-8 rounded-xl bg-white/90 backdrop-blur border border-white soft-shadow" />
  </div>
);

/**
 * Premium 3D-feeling hero illustration: a tilted floating laptop on a soft
 * pedestal, surrounded by glassmorphism stat cards, gradient spheres, and
 * small decorative props — all layered HTML/CSS + Framer Motion, no SVG
 * placeholders and no canvas.
 */
const HeroIllustration = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.94 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.8, ease: 'easeOut' }}
    className="relative mx-auto w-full max-w-lg lg:max-w-none pt-6 pb-16 sm:pb-20"
    style={{ perspective: '1600px' }}
  >
    {/* ambient glow */}
    <div className="absolute inset-0 -z-10 flex items-center justify-center" aria-hidden="true">
      <div className="w-[80%] h-[70%] rounded-full bg-gradient-to-br from-primary/25 to-accent/20 blur-3xl" />
    </div>

    {/* decorative spheres */}
    {SPHERES.map((s, i) => (
      <motion.span
        key={i}
        className={`absolute rounded-full blur-[1px] ${s.className}`}
        style={{ background: s.gradient }}
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
        aria-hidden="true"
      />
    ))}

    {/* soft ground shadow */}
    <div className="absolute left-1/2 -translate-x-1/2 bottom-10 w-[60%] h-8 rounded-[50%] bg-primary/25 blur-2xl" aria-hidden="true" />
    {/* pedestal */}
    <div className="absolute inset-x-10 bottom-6 h-14 rounded-[50%] bg-gradient-to-b from-[#E7DCFF] to-[#D8C6FF] shadow-[inset_0_6px_18px_rgba(108,59,255,0.15)]" aria-hidden="true" />

    {/* Laptop — floats, tilts in perspective, scales up on hover */}
    <motion.div
      className="relative mx-auto w-[78%] sm:w-[70%]"
      animate={{ y: [0, -14, 0] }}
      whileHover={{ scale: 1.035 }}
      transition={{ y: { duration: 5, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 0.3, ease: 'easeOut' } }}
    >
      <div style={{ transform: 'rotateX(6deg) rotateY(-10deg) rotateZ(-1deg)', transformStyle: 'preserve-3d' }}>
        <div className="rounded-2xl bg-gradient-to-b from-[#17151F] to-[#0B0A11] p-2 sm:p-2.5 soft-shadow-lg">
          <LaptopScreen />
        </div>
        <div className="h-2.5 sm:h-3 rounded-b-xl bg-gradient-to-b from-[#DAD7E4] to-[#B7B3C7]" />
        <div className="mx-auto -mt-[3px] h-1 w-14 rounded-b-md bg-[#9C97AE]" />
      </div>
    </motion.div>

    {/* floating glass stat cards */}
    <motion.div
      className="absolute top-2 left-0 sm:left-2 glass rounded-2xl px-4 py-3 soft-shadow"
      initial={{ opacity: 0, y: -14, rotate: -8 }}
      animate={{ opacity: 1, y: [0, -10, 0], rotate: -4 }}
      transition={{ opacity: { duration: 0.6, delay: 0.3 }, rotate: { duration: 0.6, delay: 0.3 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 } }}
    >
      <div className="text-lg font-extrabold brand-text leading-none">20K+</div>
      <div className="text-[11px] text-muted-foreground mt-1">Premium Assets</div>
    </motion.div>

    <motion.div
      className="absolute top-0 right-0 sm:-right-2 glass rounded-2xl px-4 py-2.5 soft-shadow flex items-center gap-2.5"
      initial={{ opacity: 0, y: -14, rotate: 8 }}
      animate={{ opacity: 1, y: [0, -8, 0], rotate: 3 }}
      transition={{ opacity: { duration: 0.6, delay: 0.5 }, rotate: { duration: 0.6, delay: 0.5 }, y: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 } }}
    >
      <span className="grid place-items-center w-8 h-8 rounded-xl bg-amber-100 text-amber-500">
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
      </span>
      <div>
        <div className="text-sm font-extrabold leading-none">4.9</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">Average Rating</div>
      </div>
    </motion.div>

    <motion.div
      className="absolute bottom-20 right-0 sm:-right-4 glass rounded-2xl px-4 py-3 soft-shadow flex items-center gap-3"
      initial={{ opacity: 0, y: 14, rotate: -6 }}
      animate={{ opacity: 1, y: [0, -8, 0], rotate: -2 }}
      transition={{ opacity: { duration: 0.6, delay: 0.7 }, rotate: { duration: 0.6, delay: 0.7 }, y: { duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 } }}
    >
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-secondary text-primary">
        <Download className="w-4 h-4" aria-hidden="true" />
      </span>
      <div>
        <div className="text-sm font-extrabold leading-none">180K+</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">Downloads</div>
      </div>
    </motion.div>

    {/* small props anchored to the pedestal */}
    <Plant className="absolute left-2 sm:left-6 bottom-8 hidden sm:block" />
    <PencilHolder className="absolute right-4 sm:right-10 bottom-6 hidden sm:block" />
  </motion.div>
);

export default HeroIllustration;
