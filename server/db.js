import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialDramas } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Database {
  constructor() {
    this.data = {
      dramas: [],
      users: {}
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.dramas || this.data.dramas.length === 0) {
          this.data.dramas = initialDramas;
        }
      } catch (err) {
        console.error('Failed to parse db.json, re-initializing with seed data:', err);
        this.data = { dramas: initialDramas, users: {} };
      }
    } else {
      this.data = {
        dramas: initialDramas,
        users: {}
      };
    }

    // Always ensure every drama has updated totalEpisodes matching episodes.length
    if (Array.isArray(this.data.dramas)) {
      for (const d of this.data.dramas) {
        d.episodes = d.episodes || [];
        d.totalEpisodes = d.episodes.length;
      }
    }
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db.json:', err);
    }
  }

  // --- Dramas ---
  getDramas() {
    if (Array.isArray(this.data.dramas)) {
      for (const d of this.data.dramas) {
        d.episodes = d.episodes || [];
        d.totalEpisodes = d.episodes.length;
      }
    }
    return this.data.dramas;
  }

  getDramaById(id) {
    const drama = this.data.dramas.find((d) => d.id === id);
    if (drama) {
      drama.episodes = drama.episodes || [];
      drama.totalEpisodes = drama.episodes.length;
    }
    return drama;
  }

  createDrama(drama) {
    const id = `drama-${Date.now()}`;
    const episodes = drama.episodes || [];
    const newDrama = {
      id,
      ...drama,
      views: drama.views || '1.2K',
      viewsNum: drama.viewsNum || 1200,
      likes: drama.likes || 120,
      episodes,
      totalEpisodes: episodes.length
    };
    this.data.dramas.unshift(newDrama);
    this.save();
    return newDrama;
  }

  updateDrama(dramaId, dramaData) {
    const index = this.data.dramas.findIndex((d) => d.id === dramaId);
    if (index === -1) return null;
    const existing = this.data.dramas[index];
    const episodes = Array.isArray(dramaData.episodes) ? dramaData.episodes : (existing.episodes || []);
    const updated = {
      ...existing,
      ...dramaData,
      episodes,
      totalEpisodes: episodes.length
    };
    this.data.dramas[index] = updated;
    this.save();
    return updated;
  }

  addEpisode(dramaId, episodeData) {
    const drama = this.getDramaById(dramaId);
    if (!drama) return null;
    drama.episodes = drama.episodes || [];
    const epNum = Number(episodeData.episodeNumber) || (drama.episodes.length + 1);
    const epId = drama.episodes.length > 0 ? Math.max(...drama.episodes.map((e) => e.id)) + 1 : 1;
    const newEp = {
      id: epId,
      ...episodeData,
      episodeNumber: epNum
    };
    drama.episodes.push(newEp);
    drama.totalEpisodes = drama.episodes.length;
    this.save();
    return newEp;
  }

  addEpisodesBatch(dramaId, episodesList) {
    const drama = this.getDramaById(dramaId);
    if (!drama) return null;
    drama.episodes = drama.episodes || [];
    for (const ep of episodesList) {
      const epId = drama.episodes.length > 0 ? Math.max(...drama.episodes.map((e) => e.id)) + 1 : 1;
      drama.episodes.push({
        id: epId,
        ...ep
      });
    }
    drama.totalEpisodes = drama.episodes.length;
    this.save();
    return drama.episodes;
  }

  setEpisodes(dramaId, episodes) {
    const drama = this.getDramaById(dramaId);
    if (!drama) return null;
    drama.episodes = episodes || [];
    drama.totalEpisodes = drama.episodes.length;
    this.save();
    return drama.episodes;
  }

  deleteEpisode(dramaId, episodeId) {
    const drama = this.getDramaById(dramaId);
    if (!drama) return null;
    const targetId = Number(episodeId);
    drama.episodes = (drama.episodes || []).filter(
      (e) => e.id !== targetId && e.episodeNumber !== targetId
    );
    drama.totalEpisodes = drama.episodes.length;
    this.save();
    return drama.episodes;
  }

  deleteAllEpisodes(dramaId) {
    const drama = this.getDramaById(dramaId);
    if (!drama) return null;
    drama.episodes = [];
    drama.totalEpisodes = 0;
    this.save();
    return [];
  }

  updateEpisode(dramaId, episodeId, episodeData) {
    const drama = this.getDramaById(dramaId);
    if (!drama) return null;
    const targetId = Number(episodeId);
    const index = (drama.episodes || []).findIndex(
      (e) => e.id === targetId || e.episodeNumber === targetId
    );
    if (index === -1) return null;
    drama.episodes[index] = {
      ...drama.episodes[index],
      ...episodeData
    };
    drama.totalEpisodes = drama.episodes.length;
    this.save();
    return drama.episodes[index];
  }

  deleteDrama(dramaId) {
    const index = this.data.dramas.findIndex((d) => d.id === dramaId);
    if (index === -1) return false;
    this.data.dramas.splice(index, 1);
    this.save();
    return true;
  }

  importDatabase(dbJson) {
    if (dbJson && Array.isArray(dbJson.dramas)) {
      this.data.dramas = dbJson.dramas;
      if (dbJson.users) {
        this.data.users = { ...this.data.users, ...dbJson.users };
      }
      for (const d of this.data.dramas) {
        d.episodes = d.episodes || [];
        d.totalEpisodes = d.episodes.length;
      }
      this.save();
      return true;
    }
    return false;
  }

  // --- Users ---
  getUser(telegramId) {
    const id = String(telegramId);
    if (!this.data.users[id]) {
      this.data.users[id] = {
        telegramId: id,
        coins: 150, // Initial welcome bonus
        isVip: false,
        vipExpiresAt: null,
        unlockedEpisodes: [],
        favorites: [],
        history: [],
        checkInStreak: 1,
        lastCheckInDate: null,
        referrals: [],
        referredBy: null,
        referralCoinsEarned: 0
      };
      this.save();
    }
    // Ensure referral fields exist for existing users
    const u = this.data.users[id];
    if (!Array.isArray(u.referrals)) u.referrals = [];
    if (u.referredBy === undefined) u.referredBy = null;
    if (u.referralCoinsEarned === undefined) u.referralCoinsEarned = 0;
    return u;
  }

  syncUser(userData, refParam = null) {
    const idStr = String(userData.id);
    const isNew = !this.data.users[idStr];
    const user = this.getUser(userData.id);
    user.firstName = userData.first_name || user.firstName;
    user.lastName = userData.last_name || user.lastName;
    user.username = userData.username || user.username;

    // Handle Referral logic
    if (refParam && isNew && !user.referredBy) {
      const cleanRefId = String(refParam).replace('ref_', '').trim();
      if (cleanRefId && cleanRefId !== idStr) {
        const referrer = this.getUser(cleanRefId);
        if (referrer) {
          user.referredBy = cleanRefId;
          // Award welcome bonus +30 coins to new user
          user.coins += 30;
          // Award referrer +50 coins
          referrer.coins += 50;
          referrer.referralCoinsEarned = (referrer.referralCoinsEarned || 0) + 50;
          referrer.referrals.unshift({
            telegramId: idStr,
            name: userData.first_name || 'Friend',
            date: new Date().toISOString()
          });
        }
      }
    }

    this.save();

    // Check if user checked in today
    const todayStr = new Date().toISOString().slice(0, 10);
    const hasCheckedInToday = user.lastCheckInDate === todayStr;

    return { ...user, hasCheckedInToday };
  }

  dailyCheckIn(telegramId) {
    const user = this.getUser(telegramId);
    const todayStr = new Date().toISOString().slice(0, 10);

    const streakRewards = [10, 15, 20, 25, 35, 50, 100];

    if (user.lastCheckInDate === todayStr) {
      return {
        success: false,
        message: 'Already checked in today',
        hasCheckedInToday: true,
        streak: user.checkInStreak,
        coins: user.coins,
        rewardsSchedule: streakRewards
      };
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (user.lastCheckInDate === yesterday) {
      user.checkInStreak = (user.checkInStreak % 7) + 1;
    } else {
      user.checkInStreak = 1;
    }

    let reward = streakRewards[user.checkInStreak - 1] || 15;

    // Lite VIP gets +30 bonus coins daily
    if (user.isVip && user.vipTier === 'lite') {
      reward += 30;
    }

    user.coins += reward;
    user.lastCheckInDate = todayStr;
    this.save();

    return {
      success: true,
      reward,
      streak: user.checkInStreak,
      coins: user.coins,
      hasCheckedInToday: true,
      rewardsSchedule: streakRewards,
      nextReward: streakRewards[user.checkInStreak % 7]
    };
  }

  unlockEpisode(telegramId, dramaId, episodeId) {
    const user = this.getUser(telegramId);
    const drama = this.getDramaById(dramaId);
    if (!drama) return { success: false, message: 'Drama not found' };

    const ep = drama.episodes?.find((e) => e.id === Number(episodeId));
    if (!ep) return { success: false, message: 'Episode not found' };

    let cost = ep.coinPrice || 20;
    // Lite VIP gets 20% discount on unlocking episodes
    if (user.isVip && user.vipTier === 'lite') {
      cost = Math.max(1, Math.round(cost * 0.8));
    }

    if (user.coins < cost) {
      return { success: false, message: 'Insufficient coins' };
    }

    user.coins -= cost;
    const key = `${dramaId}:${episodeId}`;
    if (!user.unlockedEpisodes.includes(key)) {
      user.unlockedEpisodes.push(key);
    }
    this.save();

    return { success: true, coins: user.coins, unlockedEpisodes: user.unlockedEpisodes };
  }

  toggleFavorite(telegramId, dramaId) {
    const user = this.getUser(telegramId);
    const drama = this.getDramaById(dramaId);
    if (!drama) return { success: false };

    const index = user.favorites.findIndex((f) => f.id === dramaId);
    if (index >= 0) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push(drama);
    }
    this.save();
    return { success: true, favorites: user.favorites };
  }

  updateHistory(telegramId, dramaId, episodeId, progressSec) {
    const user = this.getUser(telegramId);
    const existingIdx = user.history.findIndex((h) => h.dramaId === dramaId);
    const entry = { dramaId, episodeId, progressSec, updatedAt: new Date().toISOString() };
    if (existingIdx >= 0) {
      user.history[existingIdx] = entry;
    } else {
      user.history.unshift(entry);
    }
    this.save();
    return { success: true };
  }

  topUpCoins(telegramId, addedCoins) {
    const user = this.getUser(telegramId);
    user.coins += addedCoins;
    this.save();
    return { success: true, coins: user.coins };
  }

  upgradeVip(telegramId, tier = 'monthly') {
    const user = this.getUser(telegramId);
    user.isVip = true;
    user.vipTier = tier;
    const days = tier === 'weekly' ? 7 : 30;
    user.vipExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    this.save();
    return { success: true, isVip: true, vipTier: user.vipTier, vipExpiresAt: user.vipExpiresAt };
  }
}

export const db = new Database();
