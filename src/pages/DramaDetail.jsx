import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  ArrowLeft,
  Play,
  Bookmark,
  Share2,
  Star,
  Eye,
  Lock,
  Crown,
  Check,
  Flame,
  Info
} from 'lucide-react';
import { haptic, shareToTelegram } from '../services/telegram';
import { getLastWatchedDrama } from '../utils/playback';

export default function DramaDetail({ dramaId, onBack }) {
  const {
    t,
    lang,
    startWatching,
    isEpisodeUnlocked,
    isVip,
    toggleFavorite,
    favorites,
    user
  } = useApp();

  const [drama, setDrama] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrama = () => {
      if (dramaId) {
        api.getDrama(dramaId, user?.id).then((data) => {
          if (data) {
            setDrama(data);
            setLoading(false);
          }
        });
      }
    };
    fetchDrama();
    const handleUpdate = () => fetchDrama();
    window.addEventListener('siengstudio_dramas_updated', handleUpdate);
    return () => window.removeEventListener('siengstudio_dramas_updated', handleUpdate);
  }, [dramaId, user?.id]);

  if (loading || !drama) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isFav = favorites.some((f) => f.id === drama.id);
  const title = lang === 'km' && drama.titleKm ? drama.titleKm : drama.title;
  const desc = lang === 'km' && drama.descriptionKm ? drama.descriptionKm : drama.description;
  const episodes = drama.episodes || [];

  return (
    <div className="min-h-screen bg-[#0b0c13] pb-24 max-w-7xl mx-auto">
      {/* Backdrop Header */}
      <div className="relative w-full h-72 sm:h-96 md:h-[440px] md:rounded-3xl overflow-hidden md:mt-3 shadow-2xl border border-white/5">
        <img
          src={drama.bannerUrl || drama.posterUrl}
          alt={title}
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c13] via-[#0b0c13]/60 to-black/30" />

        {/* Back & Share Buttons */}
        <div className="absolute top-0 left-0 right-0 pt-safe px-4 py-3 flex items-center justify-between z-10">
          <button
            onClick={() => {
              haptic.light();
              onBack();
            }}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 active:scale-90 hover:bg-black/80 transition-all shadow-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => {
              haptic.light();
              shareToTelegram(
                `🎬 Watch "${title}" on SiengStudio:`,
                `https://t.me/SiengStudioBot?startapp=drama_${drama.id}`
              );
            }}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 active:scale-90 hover:bg-black/80 transition-all shadow-lg"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* Floating Poster & Info */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex items-end gap-4 sm:gap-6">
          <div className="w-24 h-36 sm:w-32 sm:h-48 md:w-44 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 flex-shrink-0 bg-gray-900">
            <img src={drama.posterUrl} alt={title} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {drama.isVipOnly ? (
                <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-black uppercase flex items-center gap-0.5 shadow">
                  <Crown size={10} className="fill-black" /> VIP
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold shadow">
                  {t('free')}
                </span>
              )}
              {drama.rating && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-amber-300 text-[11px] font-bold backdrop-blur-md">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  {drama.rating}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {episodes.length} {t('ep')}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-white leading-tight line-clamp-2 mt-2 drop-shadow-lg">
              {title}
            </h1>

            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-300">
              <span className="flex items-center gap-1">
                <Eye size={12} className="text-gray-400" />
                {drama.views || '850K'}
              </span>
              <span>•</span>
              <span className="text-purple-400">{drama.status || t('ongoing')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions: Play & Favorite */}
      <div className="px-4 mt-3 flex items-center gap-3">
        {(() => {
          const lastWatched = drama ? getLastWatchedDrama(drama.id) : null;
          const hasResume = lastWatched && lastWatched.seconds >= 3;
          const resumeEp = hasResume
            ? episodes.find((e) => e.id === lastWatched.episodeId) || episodes[0]
            : episodes[0];

          return (
            <button
              onClick={() => {
                const targetEpId = resumeEp?.id || episodes[0]?.id || 1;
                startWatching(drama.id, targetEpId);
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 active:scale-95 transition-transform"
            >
              <Play size={18} className="fill-white" />
              {hasResume ? (
                <span>
                  {lang === 'km' ? 'បន្តមើល' : 'Continue'} ({t('ep')} {resumeEp?.episodeNumber || 1} • {lastWatched.timeString})
                </span>
              ) : (
                <span>
                  {t('watchNow')} ({t('ep')} 1)
                </span>
              )}
            </button>
          );
        })()}

        <button
          onClick={() => toggleFavorite(drama)}
          className={`p-3 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
            isFav
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              : 'bg-white/5 border-white/10 text-white'
          }`}
        >
          {isFav ? <Check size={20} /> : <Bookmark size={20} />}
        </button>
      </div>

      {/* Genres */}
      <div className="px-4 mt-4 flex items-center gap-1.5 flex-wrap">
        {drama.genres?.map((g, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-gray-300 text-xs font-medium"
          >
            {g}
          </span>
        ))}
      </div>

      {/* Synopsis / Description */}
      <div className="px-4 mt-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Info size={13} />
          {lang === 'km' ? 'សេចក្តីសង្ខេប' : 'Synopsis'}
        </h3>
        <p className="text-xs text-gray-300 leading-relaxed font-normal">
          {desc}
        </p>
      </div>

      {/* Episode Selection Section */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-white">
            {t('episodes')} ({episodes.length})
          </h2>
          {(() => {
            const freeCount = episodes.filter((e) => e.isFree).length;
            if (freeCount === 0) {
              return (
                <span className="text-[11px] text-amber-400 font-semibold">
                  {lang === 'km' ? 'ត្រូវការដោះសោ' : 'Coin Unlock'}
                </span>
              );
            }
            if (freeCount === episodes.length) {
              return (
                <span className="text-[11px] text-emerald-400 font-semibold">
                  {lang === 'km' ? 'ឥតគិតថ្លៃគ្រប់ភាគ' : 'All Free'}
                </span>
              );
            }
            return (
              <span className="text-[11px] text-gray-300 font-semibold">
                {lang === 'km' ? `ភាគ 1-${freeCount} ឥតគិតថ្លៃ` : `Ep 1-${freeCount} Free`}
              </span>
            );
          })()}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
          {episodes.map((ep) => {
            const unlocked = isEpisodeUnlocked(drama.id, ep);

            return (
              <button
                key={ep.id}
                onClick={() => {
                  startWatching(drama.id, ep.id);
                }}
                className={`relative h-14 rounded-2xl flex flex-col items-center justify-center font-black text-xs transition-all active:scale-95 border ${
                  unlocked
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    : 'bg-black/40 border-white/5 text-gray-500'
                }`}
              >
                <span>{ep.episodeNumber || ep.id}</span>
                <span className="text-[9px] font-normal text-gray-400">
                  {unlocked ? (ep.isFree ? t('free') : 'Unlocked') : `${ep.coinPrice || 20} ${lang === 'km' ? 'កាក់' : 'C'}`}
                </span>

                {/* Lock Badge */}
                {!unlocked && (
                  <div className="absolute top-1.5 right-1.5 text-amber-400">
                    <Lock size={11} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
