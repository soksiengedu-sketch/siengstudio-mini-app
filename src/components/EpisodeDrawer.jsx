import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Check, Play, Crown } from 'lucide-react';
import { haptic } from '../services/telegram';

export default function EpisodeDrawer({
  isOpen,
  onClose,
  episodes = [],
  currentEpId,
  onSelectEpisode,
  dramaId
}) {
  const { t, isEpisodeUnlocked, isVip, setIsCoinModalOpen } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Card */}
      <div className="relative bg-[#12131e] rounded-t-3xl border-t border-white/10 max-h-[75vh] flex flex-col shadow-2xl z-10 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">
              {t('episodes')} ({episodes.length})
            </h2>
            {isVip && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                <Crown size={10} /> VIP All Unlocked
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Episodes Grid */}
        <div className="overflow-y-auto p-4 grid grid-cols-5 gap-2.5 pb-safe">
          {episodes.map((ep) => {
            const isCurrent = ep.id === currentEpId;
            const unlocked = isEpisodeUnlocked(dramaId, ep);

            return (
              <button
                key={ep.id}
                onClick={() => {
                  haptic.select();
                  onSelectEpisode(ep.id);
                  onClose();
                }}
                className={`relative h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/50 scale-105'
                    : unlocked
                    ? 'bg-white/10 text-gray-200 hover:bg-white/15'
                    : 'bg-white/5 text-gray-500 border border-white/5'
                }`}
              >
                <span>{ep.episodeNumber || ep.id}</span>

                {/* Status Icon */}
                <div className="absolute -top-1 -right-1">
                  {isCurrent ? (
                    <span className="w-4 h-4 rounded-full bg-white text-purple-600 flex items-center justify-center text-[8px] shadow">
                      <Play size={8} className="fill-purple-600 ml-0.5" />
                    </span>
                  ) : unlocked ? (
                    ep.isFree ? (
                      <span className="px-1 py-0.2 rounded bg-emerald-500 text-[8px] text-white">
                        Free
                      </span>
                    ) : null
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[8px] shadow">
                      <Lock size={8} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom VIP Banner if not VIP */}
        {!isVip && (
          <div className="p-3 bg-gradient-to-r from-purple-950/60 to-pink-950/60 border-t border-purple-500/20 flex items-center justify-between px-4 pb-safe">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1">
                <Crown size={12} className="text-amber-400" /> {t('vipPass')}
              </p>
              <p className="text-[10px] text-gray-400">{t('vipDesc')}</p>
            </div>
            <button
              onClick={() => {
                onClose();
                setIsCoinModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-xs shadow-md"
            >
              {t('buyVip')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
