const API_BASE = '/api';

export const api = {
  async getDramas() {
    try {
      const res = await fetch(`${API_BASE}/dramas`);
      if (!res.ok) throw new Error('Failed to fetch dramas');
      return await res.json();
    } catch (err) {
      console.warn('API error, using local fallback:', err);
      return [];
    }
  },

  async getDrama(id, telegramId) {
    try {
      const url = telegramId ? `${API_BASE}/dramas/${id}?telegramId=${telegramId}` : `${API_BASE}/dramas/${id}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch drama details');
      return await res.json();
    } catch (err) {
      console.warn('API error:', err);
      return null;
    }
  },

  async syncUser(userData) {
    try {
      const res = await fetch(`${API_BASE}/user/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Sync user error:', err);
      return null;
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
      return await res.json();
    } catch (err) {
      console.warn('Admin create drama error:', err);
      return { success: false, message: err.message };
    }
  },

  async addEpisode(dramaId, episodeData, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/episodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ dramaId, ...episodeData })
      });
      return await res.json();
    } catch (err) {
      console.warn('Admin add episode error:', err);
      return { success: false, message: err.message };
    }
  },

  async addEpisodesBatch(dramaId, episodes, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/episodes/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ dramaId, episodes })
      });
      return await res.json();
    } catch (err) {
      console.warn('Admin batch episodes error:', err);
      return { success: false, message: err.message };
    }
  },

  async deleteEpisode(dramaId, episodeId, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/dramas/${dramaId}/episodes/${episodeId}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin }
      });
      return await res.json();
    } catch (err) {
      console.warn('Admin delete episode error:', err);
      return { success: false, message: err.message };
    }
  },

  async deleteAllEpisodes(dramaId, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/dramas/${dramaId}/episodes`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin }
      });
      return await res.json();
    } catch (err) {
      console.warn('Admin delete all episodes error:', err);
      return { success: false, message: err.message };
    }
  },

  async updateEpisode(dramaId, episodeId, episodeData, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/dramas/${dramaId}/episodes/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify(episodeData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Admin update episode error:', err);
      return { success: false, message: err.message };
    }
  },

  async setEpisodes(dramaId, episodes, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/dramas/${dramaId}/episodes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ episodes })
      });
      return await res.json();
    } catch (err) {
      console.warn('Admin set episodes error:', err);
      return { success: false, message: err.message };
    }
  },

  async deleteDrama(dramaId, adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/dramas/${dramaId}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin }
      });
      return await res.json();
    } catch (err) {
      console.warn('Admin delete drama error:', err);
      return { success: false, message: err.message };
    }
  },

  async getAdminStats(adminPin) {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'x-admin-pin': adminPin }
      });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  }
};
