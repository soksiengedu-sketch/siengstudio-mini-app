import React from 'react';
import { useApp } from '../context/AppContext';
import { Play, Star, Eye, Crown } from 'lucide-react';
import { haptic } from '../services/telegram';

export default function DramaCard({ drama, rank = null, size = 'normal' }) {
  const { lang, t, openDrama } = useApp();

  const title = lang === 'km' && drama.titleKm ? drama.titleKm : drama.title;
  const epCount = (drama.episodes && Array.isArray(drama.episodes))
    ? drama.episodes.length
    : (typeof drama.totalEpisodes === 'number' ? drama.totalEpisodes : (drama.episodes?.length || 0));

  const widthClass = size === 'large' ? 'w-44' : size === 'small' ? 'w-28' : 'w-32';
  const heightClass = size === 'large' ? 'h-64' : size === 'small' ? 'h-40' : 'h-48';

  return (
    <div
      onClick={() => {
        haptic.light();
        openDrama(drama.id);
      }}
      className={`relative flex-shrink-0 ${widthClass} cursor-pointer group select-none`}
    >
      {/* Poster Container */}
      <div className={`relative ${heightClass} w-full rounded-2xl overflow-hidden bg-gray-900 border border-white/5 shadow-lg group-hover:scale-[1.02] transition-transform duration-200`}>
        <img
          src={drama.posterUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover"
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          {drama.isVipOnly ? (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-black text-[9px] font-black uppercase flex items-center gap-0.5 shadow">
              <Crown size={9} className="fill-black" /> VIP
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white text-[9px] font-bold shadow">
              {t('free')}
            </span>
          )}

          {drama.rating && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-bold">
              <Star size={9} className="fill-amber-400 text-amber-400" />
              {drama.rating}
            </span>
          )}
        </div>

        {/* Rank Number (for Top Charts) */}
        {rank !== null && (
          <div className="absolute bottom-1 left-2 font-black italic text-4xl text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] pointer-events-none">
            {rank}
          </div>
        )}

        {/* Bottom Episode Pill */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-gray-200 text-[10px] font-medium flex items-center gap-1">
          <Play size={8} className="fill-white" />
          <span>{epCount} {t('ep')}</span>
        </div>
      </div>

      {/* Title & Metadata */}
      <div className="mt-2">
        <h3 className="text-xs font-bold text-gray-100 line-clamp-1 group-hover:text-purple-400 transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
          {drama.views && (
            <span className="flex items-center gap-0.5">
              <Eye size={10} />
              {drama.views}
            </span>
          )}
          {drama.genres?.[0] && (
            <span className="truncate max-w-[60px] text-gray-400">
              • {drama.genres[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
