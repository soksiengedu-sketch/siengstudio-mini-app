import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import HeroBanner from '../components/HeroBanner';
import DramaCard from '../components/DramaCard';
import { Flame, Sparkles, Trophy, History, Play, Users, ArrowRight, Plus, Film } from 'lucide-react';
import { haptic } from '../services/telegram';

export default function Home() {
  const { t, lang, openDrama, history, setIsShareModalOpen, openAdmin, isAdmin } = useApp();
  const [dramas, setDramas] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDramas = () => {
      api.getDramas().then((data) => {
        setDramas(data || []);
        setLoading(false);
      });
    };
    fetchDramas();
    const handleUpdate = () => fetchDramas();
    window.addEventListener('siengstudio_dramas_updated', handleUpdate);
    return () => window.removeEventListener('siengstudio_dramas_updated', handleUpdate);
  }, []);

  const categories = [
    { id: 'all', label: t('all') },
    { id: 'romance', label: t('romance') },
    { id: 'ceo', label: t('ceo') },
    { id: 'revenge', label: t('revenge') },
    { id: 'action', label: t('action') },
    { id: 'comedy', label: t('comedy') },
    { id: 'khmerDubbed', label: t('khmerDubbed') }
  ];

  const filteredDramas = dramas.filter((d) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'romance') return d.genres?.includes('Romance');
    if (selectedCategory === 'ceo') return d.genres?.includes('CEO') || d.genres?.includes('Billionaire');
    if (selectedCategory === 'revenge') return d.genres?.includes('Revenge');
    if (selectedCategory === 'action') return d.genres?.includes('Action');
    if (selectedCategory === 'comedy') return d.genres?.includes('Comedy');
    if (selectedCategory === 'khmerDubbed') return d.isKhmerDubbed || d.genres?.includes('Khmer Dubbed');
    return true;
  });

  const featured = dramas.filter((d) => d.isFeatured) || dramas.slice(0, 3);
  const topCharts = [...dramas].sort((a, b) => (b.viewsNum || 0) - (a.viewsNum || 0)).slice(0, 8);
  const newReleases = [...dramas].reverse().slice(0, 18);

  return (
    <div className="pb-24 overflow-x-hidden">
      {/* Featured Hero Banner */}
      <HeroBanner featured={featured} />

      {/* Continue Watching Row (if user has watch history) */}
      {history.length > 0 && (
        <section className="mt-5 px-4 sm:px-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <History size={16} className="text-purple-400" />
              {t('continueWatching')}
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {history.slice(0, 4).map((item, idx) => {
              const matchedDrama = dramas.find((d) => d.id === item.dramaId);
              if (!matchedDrama) return null;
              const title = lang === 'km' && matchedDrama.titleKm ? matchedDrama.titleKm : matchedDrama.title;

              return (
                <div
                  key={idx}
                  onClick={() => openDrama(matchedDrama.id, item.episodeId)}
                  className="flex-shrink-0 w-48 p-2.5 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 flex items-center gap-2.5 cursor-pointer active:scale-95 transition-all"
                >
                  <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0">
                    <img
                      src={matchedDrama.posterUrl}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play size={14} className="fill-white text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{title}</h4>
                    <p className="text-[10px] text-purple-300 mt-0.5">
                      {t('ep')} {item.episodeId || 1}
                    </p>
                    <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-purple-500 w-2/3 rounded-full" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Category Filter Pills */}
      <div className="sticky top-12 z-20 bg-[#0b0c13]/90 backdrop-blur-md py-3 px-4 sm:px-6 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              haptic.select();
              setSelectedCategory(c.id);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === c.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-900/30'
                : 'bg-white/5 text-gray-400 hover:text-gray-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Invite Friends Reward Banner */}
      <div className="px-4 sm:px-6 mt-4">
        <div
          onClick={() => {
            haptic.light();
            setIsShareModalOpen(true);
          }}
          className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-pink-950/70 border border-purple-500/20 cursor-pointer active:scale-98 transition-transform flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">{t('inviteFriends')}</h3>
              <p className="text-[10px] text-gray-300">{t('inviteDesc')}</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-purple-400 flex-shrink-0" />
        </div>
      </div>

      {/* Top Charts / Ranking Row */}
      <section className="mt-6 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
            <Trophy size={16} className="text-amber-400" />
            {t('popular')}
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {topCharts.map((drama, idx) => (
            <DramaCard key={drama.id} drama={drama} rank={idx + 1} size="large" />
          ))}
        </div>
      </section>

      {/* Trending Now */}
      <section className="mt-6 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
            <Flame size={16} className="text-rose-500" />
            {t('trending')}
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {filteredDramas.slice(0, 6).map((drama) => (
            <DramaCard key={drama.id} drama={drama} size="normal" />
          ))}
        </div>
      </section>

      {/* New Releases Grid */}
      <section className="mt-8 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-400" />
              {t('newReleases')}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">រឿងភាគទើបតែបញ្ចេញថ្មីៗ ទស្សនាបានមុនគេ</p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                haptic.medium();
                openAdmin('addDrama');
              }}
              className="text-[11px] sm:text-xs font-bold text-purple-300 hover:text-white flex items-center gap-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 px-3 py-1.5 rounded-xl border border-purple-500/30 active:scale-95 transition-all shadow-sm"
            >
              <Plus size={14} /> {lang === 'km' ? '+ បន្ថែមរឿងថ្មី' : '+ Add Drama'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-4.5">
          {newReleases.map((drama) => (
            <DramaCard key={drama.id} drama={drama} size="grid" />
          ))}
        </div>
      </section>
    </div>
  );
}
