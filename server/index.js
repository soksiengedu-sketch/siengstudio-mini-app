import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { db } from './db.js';
import {
  setupTelegramBot,
  createStarsInvoice,
  broadcastMessage,
  notifyAdminPaymentConfirmation,
  notifyCustomerPaymentApproved
} from './bot.js';
import {
  generatePaymentQR,
  checkPaymentStatus,
  markPaymentCompleted,
  processPaymentApproval,
  verifyBakongAccount,
  decodeKhqrPayload
} from './services/bakong.js';
import { isR2Configured, generatePresignedUploadUrl, uploadBufferToR2, saveDatabaseToR2, loadDatabaseFromR2 } from './services/r2.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const WEB_APP_URL = process.env.WEB_APP_URL || `http://localhost:5173`;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable HTTP caching on all /api routes to prevent stale client state in Telegram WebApp
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Video Upload Directory & Multer setup
const videosUploadDir = path.join(__dirname, '../public/videos');
if (!fs.existsSync(videosUploadDir)) {
  fs.mkdirSync(videosUploadDir, { recursive: true });
}

// Seamless Cloudflare R2 Database Sync on Startup
if (isR2Configured()) {
  loadDatabaseFromR2()
    .then((r2Data) => {
      if (r2Data && Array.isArray(r2Data.dramas) && r2Data.dramas.length > 0) {
        db.importDatabase(r2Data);
        console.log(`[R2] ✅ Restored and synced ${r2Data.dramas.length} dramas from Cloudflare R2 into database!`);
      }
    })
    .catch((err) => console.warn('[R2] Startup sync notice:', err.message));
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // Up to 500 MB video size
});

// Admin Middleware Check
const checkAdminPin = (req, res, next) => {
  const pin = req.headers['x-admin-pin'] || req.body?.adminPin || req.query?.adminPin;
  const telegramUserId = req.headers['x-telegram-user-id'] || req.body?.telegramUserId || req.query?.telegramUserId;
  const configuredPin = process.env.ADMIN_PIN || '88@48*';
  const adminIds = [
    '211223427',
    ...(process.env.ADMIN_TELEGRAM_ID || '').split(',').map((s) => s.trim()).filter(Boolean),
    ...(db.data?.adminTelegramIds || []).map((s) => String(s).trim())
  ];

  const isPinValid = pin && String(pin) === String(configuredPin);
  const isTelegramAdmin = telegramUserId && adminIds.includes(String(telegramUserId));

  if (isPinValid || isTelegramAdmin) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Invalid Admin PIN or Unauthorized Account' });
};

// --- API Routes ---

// Get all dramas
app.get('/api/dramas', (req, res) => {
  const dramas = db.getDramas();
  res.json(dramas);
});

// Get single drama
app.get('/api/dramas/:id', (req, res) => {
  const drama = db.getDramaById(req.params.id);
  if (!drama) return res.status(404).json({ error: 'Drama not found' });
  res.json(drama);
});

// Sync user profile (with referral code support)
app.post('/api/user/sync', (req, res) => {
  const { ref, ...userData } = req.body;
  if (!userData?.id) return res.status(400).json({ error: 'User ID is required' });
  const user = db.syncUser(userData, ref);
  res.json({ success: true, user });
});

// Get user referral statistics & friends list
app.get('/api/user/referral-stats', (req, res) => {
  const { telegramId } = req.query;
  if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });
  const user = db.getUser(telegramId);
  res.json({
    success: true,
    telegramId,
    referredBy: user.referredBy,
    referralsCount: user.referrals?.length || 0,
    referrals: user.referrals || [],
    referralCoinsEarned: user.referralCoinsEarned || 0
  });
});

// Get user daily check-in status
app.get('/api/user/checkin-status', (req, res) => {
  const { telegramId } = req.query;
  if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });
  const user = db.getUser(telegramId);
  const todayStr = new Date().toISOString().slice(0, 10);
  const hasCheckedInToday = user.lastCheckInDate === todayStr;
  const streakRewards = [10, 15, 20, 25, 35, 50, 100];
  res.json({
    success: true,
    hasCheckedInToday,
    streak: user.checkInStreak || 1,
    rewardsSchedule: streakRewards,
    todayReward: streakRewards[(user.checkInStreak - 1) % 7]
  });
});

// Daily check-in
app.post('/api/user/checkin', (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });
  const result = db.dailyCheckIn(telegramId);
  res.json(result);
});

// Unlock episode with coins
app.post('/api/episodes/unlock', (req, res) => {
  const { telegramId, dramaId, episodeId } = req.body;
  if (!telegramId || !dramaId || !episodeId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  const result = db.unlockEpisode(telegramId, dramaId, episodeId);
  res.json(result);
});

// Toggle favorite
app.post('/api/user/favorite', (req, res) => {
  const { telegramId, dramaId } = req.body;
  if (!telegramId || !dramaId) return res.status(400).json({ error: 'Missing parameters' });
  const result = db.toggleFavorite(telegramId, dramaId);
  res.json(result);
});

// Update watch history
app.post('/api/user/history', (req, res) => {
  const { telegramId, dramaId, episodeId, progressSec } = req.body;
  if (!telegramId || !dramaId) return res.status(400).json({ error: 'Missing parameters' });
  const result = db.updateHistory(telegramId, dramaId, episodeId, progressSec);
  res.json(result);
});

// Top up coins (Admin only manual adjustment)
app.post('/api/user/topup', checkAdminPin, (req, res) => {
  const { telegramId, packageId, method } = req.body;
  if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });

  const packageCoinsMap = {
    1: 200, // 100 base + 100 first bonus
    2: 345, // 300 + 45 bonus (+15%)
    3: 1000, // 800 + 200 bonus (+25%)
    4: 2700 // 2000 + 700 bonus (+35%)
  };

  const addedCoins = packageCoinsMap[packageId] || 345;
  const result = db.topUpCoins(telegramId, addedCoins);
  res.json({ success: true, addedCoins, coins: result.coins });
});

// Upgrade VIP (Admin only manual adjustment)
app.post('/api/user/vip', checkAdminPin, (req, res) => {
  const { telegramId, tier } = req.body;
  if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });
  const result = db.upgradeVip(telegramId, tier || 'monthly');
  if (tier === 'lite') {
    db.topUpCoins(telegramId, 200); // 200 instant coins for Lite VIP
  }
  res.json(result);
});

// --- ACLEDA Bank Bakong KHQR Routes ---

// 1. Generate Real Dynamic KHQR
app.post('/api/payment/generate-khqr', async (req, res) => {
  try {
    const { telegramId, type, packageId, tier, amountKhr, amountUsd, currency } = req.body;
    const result = await generatePaymentQR({
      telegramId,
      type,
      packageId,
      tier,
      amountKhr,
      amountUsd,
      currency: currency || 'USD'
    });
    res.json(result);
  } catch (err) {
    console.error('Error generating KHQR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Real-time Payment Status Checker (Polling / Webhook)
app.post('/api/payment/check-status', async (req, res) => {
  try {
    const { md5, telegramId, type, packageId, tier } = req.body;
    const status = await checkPaymentStatus(md5, { telegramId, type, packageId, tier });

    if (status.paid && status.payment && !status.payment.isProcessed) {
      const result = processPaymentApproval(md5, 'NBC Bakong Core (Auto-Check)');
      if (result.success) {
        notifyCustomerPaymentApproved(result.payment, result.addedCoins).catch(() => {});
        return res.json(result);
      }
    }

    res.json(status);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. User Payment Verification Request (Strict Check with NBC Bakong)
app.post('/api/payment/confirm-now', async (req, res) => {
  try {
    const { md5, telegramId, type, packageId, tier } = req.body;
    if (!md5) {
      return res.status(400).json({ success: false, paid: false, message: 'Missing transaction identifier (md5)' });
    }

    const status = await checkPaymentStatus(md5, { telegramId, type, packageId, tier });

    if (status.paid && status.payment && !status.payment.isProcessed) {
      const result = processPaymentApproval(md5, 'NBC Bakong Core (Confirm Now)');
      if (result.success) {
        notifyCustomerPaymentApproved(result.payment, result.addedCoins).catch(() => {});
        return res.json(result);
      }
    }

    // Payment has not arrived or is not verified on Bakong network:
    // Send high-priority alert to Admin Telegram!
    notifyAdminPaymentConfirmation(
      status.payment || { md5, telegramId, type, packageId, tier },
      status.message
    ).catch(() => {});

    return res.json({
      success: true,
      paid: status.paid || false,
      quotaExceeded: status.quotaExceeded || false,
      message: status.message || 'មិនទាន់រកឃើញការផ្ទេរប្រាក់ក្នុងប្រព័ន្ធ Bakong ទេ។ សូមរង់ចាំបន្តិច ឬពិនិត្យមើលក្នុង App ធនាគាររបស់អ្នក។'
    });
  } catch (err) {
    res.status(500).json({ success: false, paid: false, message: err.message });
  }
});

// Admin Manual Payment Approval (Requires Admin PIN)
app.post('/api/admin/payment/approve', checkAdminPin, (req, res) => {
  try {
    const { md5 } = req.body;
    if (!md5) return res.status(400).json({ success: false, message: 'Missing md5' });
    const result = processPaymentApproval(md5, 'Admin Panel (PIN)');
    if (!result.success) return res.status(404).json(result);
    notifyCustomerPaymentApproved(result.payment, result.addedCoins).catch(() => {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Get All Payments List
app.get('/api/admin/payments', checkAdminPin, (req, res) => {
  try {
    const payments = db.getAllPayments();
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Get Current Bakong Configuration
app.get('/api/bakong/config', (req, res) => {
  res.json({
    success: true,
    accountId: (process.env.BAKONG_ACCOUNT_ID || 'chan_soksieng@bkrt').trim(),
    merchantName: (process.env.MERCHANT_NAME || 'SOKSIENG CHAN').trim(),
    merchantCity: (process.env.MERCHANT_CITY || 'Phnom Penh').trim(),
    hasApiToken: Boolean(process.env.BAKONG_API_TOKEN)
  });
});

// 5. Verify Bakong Account Live with NBC Bakong API
app.post('/api/bakong/verify-account', async (req, res) => {
  try {
    const { accountId } = req.body;
    const target = accountId || process.env.BAKONG_ACCOUNT_ID || 'chan_soksieng@bkrt';
    const result = await verifyBakongAccount(target);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Decode Any KHQR Payload
app.post('/api/bakong/decode-qr', (req, res) => {
  try {
    const { qr } = req.body;
    const result = decodeKhqrPayload(qr);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Debug Bakong MD5 Check (Returns raw HTTP response from NBC)
app.post('/api/bakong/debug-md5', async (req, res) => {
  try {
    const { md5 } = req.body;
    const rawToken = process.env.BAKONG_API_TOKEN ? process.env.BAKONG_API_TOKEN.trim() : null;
    if (!rawToken) {
      return res.json({ success: false, message: 'BAKONG_API_TOKEN is not configured on server' });
    }

    const authHeader = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
    const tokenPreview = `${rawToken.slice(0, 10)}...${rawToken.slice(-6)} (length: ${rawToken.length})`;

    const response = await fetch('https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
      },
      body: JSON.stringify({ md5 })
    });

    const status = response.status;
    const statusText = response.statusText;
    const responseBody = await response.text();

    let parsed = null;
    try {
      parsed = JSON.parse(responseBody);
    } catch (e) {}

    res.json({
      success: true,
      md5,
      httpStatus: status,
      httpStatusText: statusText,
      tokenPreview,
      responseBody: parsed || responseBody
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Telegram Stars Native Checkout Routes ---

// Create Telegram Stars Invoice Link
app.post('/api/stars/create-invoice', async (req, res) => {
  try {
    const { telegramId, type, packageId, tier, starsAmount, title, description } = req.body;
    const payload = { telegramId, type, packageId, tier };

    const packageCoinsMap = { 1: 200, 2: 345, 3: 1000, 4: 2700 };
    const defaultTitle = type === 'coins'
      ? `SiengStudio: ${packageCoinsMap[packageId] || 345} Coins`
      : `SiengStudio: ${tier === 'lite' ? 'Lite VIP' : 'All-Access VIP'} Membership`;

    const invoiceResult = await createStarsInvoice({
      title: title || defaultTitle,
      description: description || 'Digital currency on SiengStudio Telegram Mini App',
      payload,
      starsAmount: Number(starsAmount) || 25
    });

    res.json(invoiceResult);
  } catch (err) {
    console.error('Error creating Stars invoice:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Sync verified Telegram Stars payment from database (credited by Telegram Bot successful_payment)
app.post('/api/stars/confirm', (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });

    const user = db.getUser(telegramId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      success: true,
      paid: true,
      coins: user.coins,
      isVip: user.isVip,
      vipTier: user.vipTier
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Access & Privilege Verification
app.post('/api/admin/check-access', (req, res) => {
  const { telegramId, username, pin } = req.body;
  const configuredPin = process.env.ADMIN_PIN || '88@48*';
  const adminIds = [
    '211223427',
    ...(process.env.ADMIN_TELEGRAM_ID || '').split(',').map((s) => s.trim()).filter(Boolean),
    ...(db.data?.adminTelegramIds || []).map((s) => String(s).trim())
  ];
  const adminUsernames = ['chansoksieng'];

  const isIdMatch = telegramId && adminIds.includes(String(telegramId));
  const isUsernameMatch = username && adminUsernames.includes(String(username).toLowerCase().replace(/^@/, ''));
  const isPinMatch = pin && String(pin) === String(configuredPin);

  if (isIdMatch || isUsernameMatch || isPinMatch) {
    return res.json({ success: true, isAdmin: true, defaultPin: configuredPin });
  }
  return res.json({ success: true, isAdmin: false });
});

// Admin PIN Verification
app.post('/api/admin/verify-pin', (req, res) => {
  const { pin } = req.body;
  const configuredPin = process.env.ADMIN_PIN || '88@48*';
  if (pin && String(pin) === String(configuredPin)) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
});

// Admin: Add Drama
app.post('/api/admin/dramas', checkAdminPin, (req, res) => {
  const { autoBroadcast, ...dramaData } = req.body;
  const created = db.createDrama(dramaData);
  if (autoBroadcast) {
    broadcastMessage({
      title: `🎬 រឿងថ្មីទើបចេញ! ${created.titleKm || created.title}`,
      messageText: created.descriptionKm || `សូមរីករាយទស្សនារឿងភាគថ្មី "${created.titleKm || created.title}" នៅលើ SiengStudio Mini App!`,
      dramaId: created.id,
      webAppUrl: WEB_APP_URL
    }).catch((e) => console.warn('Auto broadcast error:', e.message));
  }
  res.json({ success: true, drama: created });
});

// Admin: Add Episode
app.post('/api/admin/episodes', checkAdminPin, (req, res) => {
  const { dramaId, autoBroadcast, ...episodeData } = req.body;
  if (!dramaId) return res.status(400).json({ error: 'dramaId is required' });
  const created = db.addEpisode(dramaId, episodeData);
  if (!created) return res.status(404).json({ error: 'Drama not found' });
  if (autoBroadcast) {
    const drama = db.getDramaById(dramaId);
    broadcastMessage({
      title: `🔥 ភាគថ្មីបានចេញហើយ! ${drama?.titleKm || drama?.title || ''}`,
      messageText: `ភាគទី ${created.episodeNumber} នៃរឿង "${drama?.titleKm || drama?.title}" ត្រូវបានបន្ថែមជូនទស្សនាហើយ!`,
      dramaId,
      episodeNumber: created.episodeNumber,
      webAppUrl: WEB_APP_URL
    }).catch((e) => console.warn('Auto broadcast error:', e.message));
  }
  res.json({ success: true, episode: created });
});

// Admin: Add Batch Episodes
app.post('/api/admin/episodes/batch', checkAdminPin, (req, res) => {
  const { dramaId, episodes, autoBroadcast } = req.body;
  if (!dramaId || !episodes || !Array.isArray(episodes)) {
    return res.status(400).json({ error: 'dramaId and episodes array are required' });
  }
  const result = db.addEpisodesBatch(dramaId, episodes);
  if (!result) return res.status(404).json({ error: 'Drama not found' });
  if (autoBroadcast && episodes.length > 0) {
    const drama = db.getDramaById(dramaId);
    broadcastMessage({
      title: `⚡ បន្ថែមភាគថ្មី ${episodes.length} ភាគ! ${drama?.titleKm || drama?.title || ''}`,
      messageText: `រឿង "${drama?.titleKm || drama?.title}" បានបន្ថែមភាគថ្មីចំនួន ${episodes.length} ភាគ! សូមចូលទស្សនាទាំងអស់គ្នា!`,
      dramaId,
      webAppUrl: WEB_APP_URL
    }).catch((e) => console.warn('Auto broadcast error:', e.message));
  }
  res.json({ success: true, count: episodes.length, episodes: result });
});

// Admin: Set/Replace All Episodes of Drama
app.put('/api/admin/dramas/:id/episodes', checkAdminPin, (req, res) => {
  const { episodes } = req.body;
  if (!Array.isArray(episodes)) {
    return res.status(400).json({ error: 'episodes array is required' });
  }
  const result = db.setEpisodes(req.params.id, episodes);
  if (!result) return res.status(404).json({ error: 'Drama not found' });
  res.json({ success: true, count: episodes.length, episodes: result });
});

// Admin: Delete Particular Episode
app.delete('/api/admin/dramas/:dramaId/episodes/:episodeId', checkAdminPin, (req, res) => {
  const { dramaId, episodeId } = req.params;
  const result = db.deleteEpisode(dramaId, episodeId);
  if (!result) return res.status(404).json({ success: false, error: 'Drama not found' });
  if (isR2Configured()) {
    saveDatabaseToR2(db.data).catch(() => {});
  }
  res.json({ success: true, remainingCount: result.length, episodes: result });
});

// Admin: Delete All Episodes of Drama
app.delete('/api/admin/dramas/:dramaId/episodes', checkAdminPin, (req, res) => {
  const { dramaId } = req.params;
  const result = db.deleteAllEpisodes(dramaId);
  if (result === null) return res.status(404).json({ success: false, error: 'Drama not found' });
  if (isR2Configured()) {
    saveDatabaseToR2(db.data).catch(() => {});
  }
  res.json({ success: true, message: 'All episodes deleted successfully', count: 0 });
});

// Admin: Update Particular Episode
app.put('/api/admin/dramas/:dramaId/episodes/:episodeId', checkAdminPin, (req, res) => {
  const { dramaId, episodeId } = req.params;
  const updated = db.updateEpisode(dramaId, episodeId, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Episode or Drama not found' });
  if (isR2Configured()) {
    saveDatabaseToR2(db.data).catch(() => {});
  }
  res.json({ success: true, episode: updated });
});

// Admin: Update Drama Details
app.put('/api/admin/dramas/:id', checkAdminPin, (req, res) => {
  const updated = db.updateDrama(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, error: 'Drama not found' });
  if (isR2Configured()) {
    saveDatabaseToR2(db.data).catch(() => {});
  }
  res.json({ success: true, drama: updated });
});

// Admin: Delete Drama
app.delete('/api/admin/dramas/:dramaId', checkAdminPin, (req, res) => {
  const { dramaId } = req.params;
  const deleted = db.deleteDrama(dramaId);
  if (!deleted) return res.status(404).json({ success: false, error: 'Drama not found' });
  if (isR2Configured()) {
    saveDatabaseToR2(db.data).catch(() => {});
  }
  res.json({ success: true, message: 'Drama deleted' });
});

// Admin: Export Database Backup JSON
app.get('/api/admin/backup', checkAdminPin, (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="siengstudio-backup.json"');
  res.setHeader('Content-Type', 'application/json');
  res.json(db.data);
});

// Admin: Import Database JSON
app.post('/api/admin/import', checkAdminPin, (req, res) => {
  const success = db.importDatabase(req.body);
  if (!success) return res.status(400).json({ success: false, message: 'Invalid database payload' });
  if (isR2Configured()) {
    saveDatabaseToR2(db.data).catch(() => {});
  }
  res.json({ success: true, message: 'Database imported successfully', totalDramas: db.data.dramas.length });
});

// Admin: Save & Sync Database (Cloud & Disk)
app.post('/api/admin/save-database', checkAdminPin, async (req, res) => {
  try {
    const { dramas, dbJson } = req.body;
    if (dbJson) {
      db.importDatabase(dbJson);
    } else if (Array.isArray(dramas)) {
      db.data.dramas = dramas;
      for (const d of db.data.dramas) {
        d.episodes = d.episodes || [];
        d.totalEpisodes = d.episodes.length;
      }
      db.save();
    } else {
      db.save();
    }

    let r2Synced = false;
    if (isR2Configured()) {
      const r2Res = await saveDatabaseToR2(db.data);
      r2Synced = r2Res?.success || false;
    }

    res.json({
      success: true,
      message: 'បានរក្សាទុក និងធ្វើសមកាលកម្មទិន្នន័យទាំងអស់ដោយជោគជ័យ!',
      totalDramas: db.data.dramas.length,
      r2Synced
    });
  } catch (err) {
    console.error('Save database error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Stats
app.get('/api/admin/stats', checkAdminPin, (req, res) => {
  const dramas = db.getDramas();
  const totalEp = dramas.reduce((acc, d) => acc + (d.episodes?.length || 0), 0);
  res.json({
    success: true,
    totalDramas: dramas.length,
    totalEpisodes: totalEp,
    totalViews: '1.4M+'
  });
});

// Admin: Full Analytics Dashboard
app.get('/api/admin/analytics', checkAdminPin, (req, res) => {
  try {
    const analytics = db.getAnalytics();
    res.json(analytics);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Telegram Broadcast
app.post('/api/admin/broadcast', checkAdminPin, async (req, res) => {
  try {
    const { messageText, title, dramaId, episodeNumber, buttonText, customChannelId, target } = req.body;
    const result = await broadcastMessage({
      messageText,
      title,
      dramaId,
      episodeNumber,
      buttonText,
      customChannelId,
      target: target || 'all',
      webAppUrl: WEB_APP_URL
    });
    res.json(result);
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Generate Cloudflare R2 Presigned Upload URL
app.post('/api/admin/r2/presign', checkAdminPin, async (req, res) => {
  try {
    const { fileName, contentType, folder } = req.body;
    if (!fileName) {
      return res.status(400).json({ success: false, message: 'fileName is required' });
    }
    const result = await generatePresignedUploadUrl(fileName, contentType || 'video/mp4', folder || 'videos');
    res.json(result);
  } catch (err) {
    console.error('Presign URL error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Direct Video Upload (R2 or Local Fallback)
app.post('/api/admin/upload-video', checkAdminPin, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const cleanName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}_${cleanName}`;

    // 1. If Cloudflare R2 is configured, upload directly to R2
    if (isR2Configured()) {
      try {
        const r2Result = await uploadBufferToR2(buffer, originalname, mimetype || 'video/mp4');
        return res.json({
          success: true,
          storage: 'cloudflare_r2',
          url: r2Result.publicUrl,
          key: r2Result.key,
          filename: cleanName
        });
      } catch (r2Err) {
        console.warn('R2 upload failed, falling back to local storage:', r2Err.message);
      }
    }

    // 2. Fallback to local storage in public/videos
    const localFilePath = path.join(videosUploadDir, filename);
    fs.writeFileSync(localFilePath, buffer);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const localPublicUrl = `${protocol}://${host}/videos/${filename}`;

    return res.json({
      success: true,
      storage: 'local',
      url: localPublicUrl,
      filename
    });
  } catch (err) {
    console.error('Video upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve public videos and assets directly
const videosPath = path.join(__dirname, '../public/videos');
if (fs.existsSync(videosPath)) {
  app.use('/videos', express.static(videosPath));
}

const publicPath = path.join(__dirname, '../public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Serve frontend build if dist exists
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 SiengStudio Server listening on http://localhost:${PORT}`);
  console.log(`📡 Mini App Web URL: ${WEB_APP_URL}`);

  // Setup Telegram Bot
  setupTelegramBot(BOT_TOKEN, WEB_APP_URL);
});
