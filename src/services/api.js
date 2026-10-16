const API_BASE = '/api';

const DRAMAS_CACHE_KEY = 'siengstudio_dramas_cache';

export function getLocalCachedDramas() {
  try {
    const raw = localStorage.getItem(DRAMAS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setLocalCachedDramas(dramas) {
  try {
    if (Array.isArray(dramas)) {
      localStorage.setItem(DRAMAS_CACHE_KEY, JSON.stringify(dramas));
      window.dispatchEvent(new CustomEvent('siengstudio_dramas_updated', { detail: dramas }));
    }
  } catch (e) {}
}

export function updateLocalDrama(dramaId, updater) {
  try {
    const cached = getLocalCachedDramas() || [];
    const idx = cached.findIndex((d) => d.id === dramaId);
    if (idx !== -1) {
      cached[idx] = updater(cached[idx]);
      setLocalCachedDramas(cached);
    }
  } catch (e) {}
}

export const api = {
  async getDramas() {
    try {
      const res = await fetch(`${API_BASE}/dramas`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLocalCachedDramas(data);
          return data;
        }
      }
    } catch (err) {
      console.warn('API error, using local fallback:', err);
    }
    const fallback = getLocalCachedDramas();
    return fallback || [];
  },

  async getDrama(id, telegramId) {
    try {
      const url = telegramId ? `${API_BASE}/dramas/${id}?telegramId=${telegramId}` : `${API_BASE}/dramas/${id}`;
      const res = await fetch(url);
      if (res.ok) {
        const drama = await res.json();
        if (drama && drama.id) {
          updateLocalDrama(drama.id, () => drama);
          return drama;
        }
      }
    } catch (err) {
      console.warn('API error:', err);
    }
    const cached = getLocalCachedDramas();
    return cached?.find((d) => d.id === id) || null;
  },

  async syncUser(userData, refParam = null) {
    try {
      const res = await fetch(`${API_BASE}/user/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, ref: refParam })
      });
      return await res.json();
    } catch (err) {
      console.warn('Sync user error:', err);
      return null;
    }
  },

  async getReferralStats(telegramId) {
    try {
      const res = await fetch(`${API_BASE}/user/referral-stats?telegramId=${telegramId}`);
      return await res.json();
    } catch (err) {
      console.warn('Get referral stats error:', err);
      return { success: false, referrals: [], referralsCount: 0, referralCoinsEarned: 0 };
    }
  },

  async getCheckInStatus(telegramId) {
    try {
      const res = await fetch(`${API_BASE}/user/checkin-status?telegramId=${telegramId}`);
      return await res.json();
    } catch (err) {
      console.warn('Get checkin status error:', err);
      return { success: false, streak: 1, hasCheckedInToday: false };
    }
  },

  async dailyCheckIn(telegramId) {
    try {
      const res = await fetch(`${API_BASE}/user/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId })
      });
      return await res.json();
    } catch (err) {
      console.warn('Check-in error:', err);
      return { success: false, message: err.message };
    }
  },

  async unlockEpisode(telegramId, dramaId, episodeId) {
    try {
      const res = await fetch(`${API_BASE}/episodes/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, dramaId, episodeId })
      });
      return await res.json();
    } catch (err) {
      console.warn('Unlock episode error:', err);
      return { success: false, message: err.message };
    }
  },

  async toggleFavorite(telegramId, dramaId) {
    try {
      const res = await fetch(`${API_BASE}/user/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, dramaId })
      });
      return await res.json();
    } catch (err) {
      console.warn('Favorite toggle error:', err);
      return { success: false };
    }
  },

  async updateHistory(telegramId, dramaId, episodeId, progressSec) {
    try {
      const res = await fetch(`${API_BASE}/user/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, dramaId, episodeId, progressSec })
      });
      return await res.json();
    } catch (err) {
      console.warn('Update history error:', err);
      return { success: false };
    }
  },

  async topUpCoins(telegramId, packageId, method) {
    try {
      const res = await fetch(`${API_BASE}/user/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, packageId, method })
      });
      return await res.json();
    } catch (err) {
      console.warn('Topup error:', err);
      return { success: false, message: err.message };
    }
  },

  async upgradeVip(telegramId, tier) {
    try {
      const res = await fetch(`${API_BASE}/user/vip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, tier })
      });
      return await res.json();
    } catch (err) {
      console.warn('VIP upgrade error:', err);
      return { success: false, message: err.message };
    }
  },

  async generateKhqr(paymentData) {
    try {
      const res = await fetch(`${API_BASE}/payment/generate-khqr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Generate KHQR error:', err);
      return { success: false, message: err.message };
    }
  },

  async checkPaymentStatus(md5) {
    try {
      const res = await fetch(`${API_BASE}/payment/check-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ md5 })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async confirmPaymentNow(paymentData) {
    try {
      const res = await fetch(`${API_BASE}/payment/confirm-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async createStarsInvoice(data) {
    try {
      const res = await fetch(`${API_BASE}/stars/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      console.warn('Create Stars invoice error:', err);
      return { success: false, message: err.message };
    }
  },

  async confirmStarsPayment(data) {
    try {
      const res = await fetch(`${API_BASE}/stars/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      console.warn('Confirm Stars payment error:', err);
      return { success: false, message: err.message };
    }
  },

  async verifyAdminPin(pin) {
    try {
      const res = await fetch(`${API_BASE}/admin/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Connection error' };
    }
  },

  async createDrama(dramaData, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/dramas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify(dramaData)
      });
      const data = await res.json();
      if (data.success && data.drama) {
        const cached = getLocalCachedDramas() || [];
        setLocalCachedDramas([data.drama, ...cached]);
      }
      return data;
    } catch (err) {
      console.warn('Admin create drama error:', err);
      const newDrama = { id: `drama-${Date.now()}`, ...dramaData, episodes: [], totalEpisodes: 0 };
      const cached = getLocalCachedDramas() || [];
      setLocalCachedDramas([newDrama, ...cached]);
      return { success: true, drama: newDrama, cachedOnly: true };
    }
  },

  async updateDrama(dramaId, dramaData, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/dramas/${dramaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify(dramaData)
      });
      const data = await res.json();
      if (data.success && data.drama) {
        updateLocalDrama(dramaId, () => data.drama);
      }
      return data;
    } catch (err) {
      console.warn('Admin update drama error:', err);
      updateLocalDrama(dramaId, (prev) => ({ ...prev, ...dramaData }));
      return { success: true, drama: { id: dramaId, ...dramaData }, cachedOnly: true };
    }
  },

  async addEpisode(dramaId, episodeData, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/episodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ dramaId, ...episodeData })
      });
      const data = await res.json();
      if (data.success && data.episode) {
        updateLocalDrama(dramaId, (prev) => {
          const eps = prev.episodes || [];
          const updated = [...eps, data.episode];
          return { ...prev, episodes: updated, totalEpisodes: updated.length };
        });
      }
      return data;
    } catch (err) {
      console.warn('Admin add episode error:', err);
      const epId = Date.now();
      const fakeEp = { id: epId, ...episodeData };
      updateLocalDrama(dramaId, (prev) => {
        const eps = prev.episodes || [];
        const updated = [...eps, fakeEp];
        return { ...prev, episodes: updated, totalEpisodes: updated.length };
      });
      return { success: true, episode: fakeEp, cachedOnly: true };
    }
  },

  async addEpisodesBatch(dramaId, episodes, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/episodes/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ dramaId, episodes })
      });
      const data = await res.json();
      if (data.success && data.episodes) {
        updateLocalDrama(dramaId, (prev) => ({
          ...prev,
          episodes: data.episodes,
          totalEpisodes: data.episodes.length
        }));
      }
      return data;
    } catch (err) {
      console.warn('Admin batch episodes error:', err);
      updateLocalDrama(dramaId, (prev) => ({
        ...prev,
        episodes: [...(prev.episodes || []), ...episodes],
        totalEpisodes: (prev.episodes?.length || 0) + episodes.length
      }));
      return { success: true, count: episodes.length, cachedOnly: true };
    }
  },

  async deleteEpisode(dramaId, episodeId, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/dramas/${dramaId}/episodes/${episodeId}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin }
      });
      const data = await res.json();
      if (data.success && data.episodes) {
        updateLocalDrama(dramaId, (prev) => ({
          ...prev,
          episodes: data.episodes,
          totalEpisodes: data.episodes.length
        }));
      }
      return data;
    } catch (err) {
      console.warn('Admin delete episode error:', err);
      updateLocalDrama(dramaId, (prev) => {
        const targetId = Number(episodeId);
        const filtered = (prev.episodes || []).filter(
          (e) => e.id !== targetId && e.episodeNumber !== targetId
        );
        return { ...prev, episodes: filtered, totalEpisodes: filtered.length };
      });
      return { success: true, cachedOnly: true };
    }
  },

  async deleteAllEpisodes(dramaId, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/dramas/${dramaId}/episodes`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin }
      });
      const data = await res.json();
      if (data.success) {
        updateLocalDrama(dramaId, (prev) => ({
          ...prev,
          episodes: [],
          totalEpisodes: 0
        }));
      }
      return data;
    } catch (err) {
      console.warn('Admin delete all episodes error:', err);
      updateLocalDrama(dramaId, (prev) => ({
        ...prev,
        episodes: [],
        totalEpisodes: 0
      }));
      return { success: true, cachedOnly: true };
    }
  },

  async updateEpisode(dramaId, episodeId, episodeData, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/dramas/${dramaId}/episodes/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify(episodeData)
      });
      const data = await res.json();
      if (data.success && data.episode) {
        updateLocalDrama(dramaId, (prev) => {
          const eps = (prev.episodes || []).map((e) =>
            e.id === data.episode.id || e.episodeNumber === data.episode.episodeNumber
              ? data.episode
              : e
          );
          return { ...prev, episodes: eps, totalEpisodes: eps.length };
        });
      }
      return data;
    } catch (err) {
      console.warn('Admin update episode error:', err);
      updateLocalDrama(dramaId, (prev) => {
        const targetId = Number(episodeId);
        const eps = (prev.episodes || []).map((e) =>
          e.id === targetId || e.episodeNumber === targetId ? { ...e, ...episodeData } : e
        );
        return { ...prev, episodes: eps, totalEpisodes: eps.length };
      });
      return { success: true, cachedOnly: true };
    }
  },

  async setEpisodes(dramaId, episodes, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/dramas/${dramaId}/episodes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ episodes })
      });
      const data = await res.json();
      if (data.success && data.episodes) {
        updateLocalDrama(dramaId, (prev) => ({
          ...prev,
          episodes: data.episodes,
          totalEpisodes: data.episodes.length
        }));
      }
      return data;
    } catch (err) {
      console.warn('Admin set episodes error:', err);
      updateLocalDrama(dramaId, (prev) => ({
        ...prev,
        episodes,
        totalEpisodes: episodes.length
      }));
      return { success: true, count: episodes.length, cachedOnly: true };
    }
  },

  async deleteDrama(dramaId, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/dramas/${dramaId}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin }
      });
      const data = await res.json();
      if (data.success) {
        const cached = getLocalCachedDramas() || [];
        setLocalCachedDramas(cached.filter((d) => d.id !== dramaId));
      }
      return data;
    } catch (err) {
      console.warn('Admin delete drama error:', err);
      const cached = getLocalCachedDramas() || [];
      setLocalCachedDramas(cached.filter((d) => d.id !== dramaId));
      return { success: true, message: 'Drama deleted locally' };
    }
  },

  async getAdminStats(adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'x-admin-pin': adminPin }
      });
      return await res.json();
    } catch (err) {
      const cached = getLocalCachedDramas() || [];
      const totalEp = cached.reduce((acc, d) => acc + (d.episodes?.length || d.totalEpisodes || 0), 0);
      return {
        success: true,
        totalDramas: cached.length,
        totalEpisodes: totalEp,
        totalViews: '1.4M+'
      };
    }
  },

  async backupDatabase(adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/backup`, {
        headers: { 'x-admin-pin': adminPin }
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Backup fetch error:', err);
    }
    return { dramas: getLocalCachedDramas() || [] };
  },

  async importDatabase(jsonPayload, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify(jsonPayload)
      });
      const data = await res.json();
      if (data.success && jsonPayload.dramas) {
        setLocalCachedDramas(jsonPayload.dramas);
      }
      return data;
    } catch (err) {
      console.warn('Import error:', err);
      if (jsonPayload && Array.isArray(jsonPayload.dramas)) {
        setLocalCachedDramas(jsonPayload.dramas);
        return { success: true, cachedOnly: true };
      }
      return { success: false, message: err.message };
    }
  }
};
