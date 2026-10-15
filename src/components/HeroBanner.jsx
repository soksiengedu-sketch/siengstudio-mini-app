import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Plus, Check, Star, Flame } from 'lucide-react';
import { haptic } from '../services/telegram';

export default function HeroBanner({ featured = [] }) {
  const { lang, t, openDrama, toggleFavorite, favorites } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!featured.length) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (!featured.length) return null;

  const item = featured[currentIndex] || featured[0];
  const isFav = favorites.some((f) => f.id === item.id);
  const title = lang === 'km' && item.titleKm ? item.titleKm : item.title;
  const desc = lang === 'km' && item.descriptionKm ? item.descriptionKm : item.description;

  return (
    <div className="relative w-full h-[360px] sm:h-[440px] md:h-[500px] overflow-hidden rounded-b-3xl sm:rounded-3xl shadow-2xl">
      {/* Background Image with Gradient Overlay */}
      <img
        src={item.bannerUrl || item.posterUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-700 ease-out scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c13] via-[#0b0c13]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c13]/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute bottom-5 left-0 right-0 px-5 sm:px-8 max-w-4xl flex flex-col items-start">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/90 text-white text-[11px] font-bold shadow-md">
            <Flame size={12} className="fill-white" />
            {t('trending')}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-amber-300 text-[11px] font-semibold border border-white/10">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {item.rating || '9.8'}
          </span>
          {item.genres?.slice(0, 2).map((g, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-gray-200 text-[11px] border border-white/10"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
          {title}
        </h1>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-300/90 line-clamp-2 mt-1 max-w-xl drop-shadow-sm font-normal">
          {desc}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-4 w-full">
          <button
            onClick={() => {
              haptic.medium();
              const firstEp = item.episodes?.[0]?.id || 1;
              openDrama(item.id, firstEp);
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 active:scale-95 transition-transform"
          >
            <Play size={16} className="fill-white" />
            {t('watchNow')}
          </button>

          <button
            onClick={() => {
              toggleFavorite(item);
            }}
            className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white active:scale-95 transition-transform"
            title={isFav ? t('inFavorites') : t('addToFavorites')}
          >
            {isFav ? <Check size={18} className="text-green-400" /> : <Plus size={18} />}
          </button>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-1.5 self-center mt-3">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'w-5 bg-purple-400' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
