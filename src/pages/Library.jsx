import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import DramaCard from '../components/DramaCard';
import { Bookmark, History, Trash2, Play } from 'lucide-react';
import { haptic } from '../services/telegram';

export default function Library() {
  const {
    t,
    lang,
    favorites,
    history,
    clearHistory,
    openDrama,
    setActiveTab
  } = useApp();

  const [subTab, setSubTab] = useState('favorites'); // 'favorites' or 'history'
  const [dramas, setDramas] = useState([]);

  useEffect(() => {
    api.getDramas().then((data) => setDramas(data || []));
  }, []);

  return (
    <div className="min-h-screen pb-24 px-4 pt-3">
      {/* Subtab Toggle */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl mb-4">
        <button
          onClick={() => {
            haptic.select();
            setSubTab('favorites');
          }}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'favorites'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-900/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Bookmark size={14} className={subTab === 'favorites' ? 'fill-white' : ''} />
          {t('favorites')} ({favorites.length})
        </button>

        <button
          onClick={() => {
            haptic.select();
            setSubTab('history');
          }}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'history'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-900/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <History size={14} />
          {t('history')} ({history.length})
        </button>
      </div>

      {/* Favorites Subtab */}
      {subTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Bookmark size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">{t('noFavorites')}</p>
              <button
                onClick={() => setActiveTab('home')}
                className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                {t('home')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {favorites.map((drama) => (
                <DramaCard key={drama.id} drama={drama} size="small" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Subtab */}
      {subTab === 'history' && (
        <div>
          {history.length > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={clearHistory}
                className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold hover:text-rose-300"
              >
                <Trash2 size={12} />
                {t('clearHistory')}
              </button>
            </div>
          )}

          {history.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <History size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">{t('noHistory')}</p>
              <button
                onClick={() => setActiveTab('home')}
                className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                {t('home')}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((item, idx) => {
                const drama = dramas.find((d) => d.id === item.dramaId);
                if (!drama) return null;
                const title = lang === 'km' && drama.titleKm ? drama.titleKm : drama.title;

                return (
                  <div
                    key={idx}
                    onClick={() => openDrama(drama.id, item.episodeId)}
                    className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0">
                        <img
                          src={drama.posterUrl}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{title}</h4>
                        <p className="text-[11px] text-purple-400 mt-0.5">
                          {t('ep')} {item.episodeId || 1} / {drama.episodes?.length || 50}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                    </div>

                    <button className="p-2.5 rounded-full bg-purple-600/30 text-purple-300 hover:bg-purple-600 hover:text-white transition-colors">
                      <Play size={14} className="fill-current ml-0.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
