import { BakongKHQR, IndividualInfo, khqrData } from 'bakong-khqr';
import QRCode from 'qrcode';
import { db } from '../db.js';

const khqr = new BakongKHQR();

// Store active payment requests in memory (md5 -> paymentDetails)
const activePayments = new Map();

// Helper to reliably detect successful transaction from NBC Bakong API responses
export const isBakongTransactionSuccessful = (data) => {
  if (!data) return false;

  // 1. Standard NBC responseCode 0
  if (data.responseCode === 0 && data.data) return true;

  // 2. Open API v1 standard format { status: { code: 0 }, data: { ... } }
  if (data.status && typeof data.status === 'object' && data.status.code === 0 && data.data) return true;

  // 3. Primitive numeric status === 0
  if (data.status === 0 && data.data) return true;

  // 4. Data object with transaction information (hash, fromAccountId, amount, externalRef)
  if (data.data && typeof data.data === 'object') {
    if (data.data.hash || data.data.fromAccountId || data.data.externalRef || data.data.instructionRef) {
      return true;
    }
    if (data.data.status === 'SUCCESS' || data.data.status === 'COMPLETED' || data.data.status === 'PAID') {
      return true;
    }
  }

  // 5. Direct hash or acknowledgement without error
  if (data.hash && !data.errorCode && !data.error) return true;

  return false;
};

export const generatePaymentQR = async ({
  telegramId,
  type = 'coins', // 'coins' or 'vip'
  packageId = 2,
  tier = 'monthly',
  amountKhr = 6000,
  amountUsd = 1.5,
  currency = 'USD'
}) => {
  const accountId = (process.env.BAKONG_ACCOUNT_ID || 'chan_soksieng@bkrt').trim();
  const merchantName = (process.env.MERCHANT_NAME || 'SOKSIENG CHAN').trim();
  const merchantCity = (process.env.MERCHANT_CITY || 'Phnom Penh').trim();

  const isKhr = currency === 'KHR';
  const amountToCharge = isKhr ? Number(amountKhr) : Number(amountUsd);
  const selectedCurrency = isKhr ? khqrData.currency.khr : khqrData.currency.usd;

  const billNumber = `SS${Date.now().toString().slice(-6)}`;
  const expirationTimestamp = Date.now() + 15 * 60 * 1000; // 15 mins expiry

  const bankDomain = accountId.includes('@') ? accountId.split('@')[1].trim().toLowerCase() : null;

  const optionalData = {
    currency: selectedCurrency,
    amount: amountToCharge,
    billNumber,
    storeLabel: 'SiengStudio',
    terminalLabel: 'AppPay',
    expirationTimestamp
  };

  if (bankDomain && bankDomain !== 'bakong') {
    optionalData.acquiringBank = bankDomain;
  }

  const individualInfo = new IndividualInfo(
    accountId,
    merchantName,
    merchantCity,
    optionalData
  );

  const result = khqr.generateIndividual(individualInfo);

  if (result.status.code !== 0 || !result.data) {
    throw new Error(result.status.message || 'Failed to generate KHQR');
  }

  const { qr, md5 } = result.data;

  // Generate QR Code data URL
  const qrImageData = await QRCode.toDataURL(qr, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#111827',
      light: '#FFFFFF'
    }
  });

  // Prune expired payments
  const now = Date.now();
  for (const [key, val] of activePayments.entries()) {
    if (val.expiresAt && now > val.expiresAt) {
      activePayments.delete(key);
    }
  }

  // Track active payment in memory AND persistent db
  const paymentRecord = {
    md5,
    qr,
    telegramId,
    type,
    packageId,
    tier,
    amountKhr,
    amountUsd,
    amount: amountToCharge,
    currency: isKhr ? 'KHR' : 'USD',
    billNumber,
    accountId,
    merchantName,
    createdAt: Date.now(),
    expiresAt: expirationTimestamp,
    isPaid: false,
    isProcessed: false
  };

  activePayments.set(md5, paymentRecord);
  try {
    db.savePendingPayment(md5, paymentRecord);
  } catch (err) {
    console.warn('Failed to persist payment to db:', err.message);
  }

  // Notify admin via Telegram Bot in background
  import('../bot.js').then(({ notifyAdminNewPayment }) => {
    if (typeof notifyAdminNewPayment === 'function') {
      notifyAdminNewPayment(paymentRecord).catch(() => {});
    }
  }).catch(() => {});

  return {
    success: true,
    qr,
    md5,
    qrImageData,
    billNumber,
    merchantName,
    accountId,
    amount: amountToCharge,
    currency: isKhr ? 'KHR' : 'USD'
  };
};

export const checkPaymentStatus = async (md5, fallbackData = {}) => {
  if (!md5) return { success: false, message: 'Missing md5 parameter' };

  let payment = activePayments.get(md5) || db.getPayment(md5);

  // If payment was lost on server restart, reconstruct with fallback client data
  if (!payment && fallbackData && (fallbackData.telegramId || fallbackData.packageId)) {
    payment = {
      md5,
      telegramId: fallbackData.telegramId,
      type: fallbackData.type || 'coins',
      packageId: fallbackData.packageId || 2,
      tier: fallbackData.tier || 'monthly',
      createdAt: Date.now(),
      isPaid: false,
      isProcessed: false
    };
    activePayments.set(md5, payment);
    db.savePendingPayment(md5, payment);
  }

  if (payment && payment.isPaid) {
    return { success: true, paid: true, payment };
  }

  const rawToken = process.env.BAKONG_API_TOKEN ? process.env.BAKONG_API_TOKEN.trim() : null;

  // If developer token is configured, call official NBC Bakong Open API
  if (rawToken) {
    try {
      const authHeader = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
      console.log(`[Bakong Check] Querying NBC for MD5: ${md5}`);
      const response = await fetch('https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader
        },
        body: JSON.stringify({ md5 })
      });

      const data = await response.json();
      console.log(`[Bakong Check] NBC Response status=${response.status}:`, JSON.stringify(data));

      if (data && (data.errorCode === 17 || (data.responseMessage && data.responseMessage.includes('limit of 100')))) {
        console.warn('[Bakong Check] Daily limit exceeded (errorCode 17):', data.responseMessage);
        return {
          success: true,
          paid: false,
          quotaExceeded: true,
          message: 'ប្រព័ន្ធ Bakong API បានពេញកូតាសាកល្បងប្រចាំថ្ងៃ (Daily limit 100 requests exceeded)។ កាក់នឹងត្រូវបាន Admin អនុម័តជូនភ្លាមៗ!',
          payment
        };
      }

      if (isBakongTransactionSuccessful(data)) {
        if (!payment) {
          payment = {
            md5,
            telegramId: fallbackData?.telegramId || 'user',
            type: fallbackData?.type || 'coins',
            packageId: fallbackData?.packageId || 2,
            tier: fallbackData?.tier || 'monthly',
            createdAt: Date.now()
          };
        }
        payment.isPaid = true;
        payment.transactionData = data.data || data;
        activePayments.set(md5, payment);
        db.markPaymentPaid(md5, data.data || data);

        return { success: true, paid: true, payment, data };
      }
    } catch (err) {
      console.warn('Bakong API check error:', err.message);
    }
  }

  return { success: true, paid: false, payment };
};

export const markPaymentCompleted = (md5) => {
  let payment = activePayments.get(md5) || db.getPayment(md5);
  if (payment) {
    payment.isPaid = true;
    activePayments.set(md5, payment);
    db.markPaymentPaid(md5, { manualApproval: true, approvedAt: Date.now() });
    return payment;
  }
  return null;
};

export const processPaymentApproval = (md5, approvedBy = 'Admin') => {
  let payment = markPaymentCompleted(md5);
  if (!payment) return { success: false, message: 'Payment record not found or expired' };

  if (payment.isProcessed) {
    return { success: true, paid: true, message: 'Payment already approved', payment };
  }

  payment.isProcessed = true;
  payment.approvedBy = approvedBy;
  payment.approvedAt = Date.now();
  db.markPaymentProcessed(md5);

  const { telegramId, type, packageId, tier } = payment;
  let addedCoins = 0;
  let updatedUser = null;

  if (type === 'coins') {
    const packageCoinsMap = { 1: 200, 2: 345, 3: 1000, 4: 2700 };
    addedCoins = packageCoinsMap[packageId] || 345;
    updatedUser = db.topUpCoins(telegramId, addedCoins);
  } else if (type === 'vip') {
    const vipResult = db.upgradeVip(telegramId, tier || 'monthly');
    if (tier === 'lite') {
      addedCoins = 200;
      db.topUpCoins(telegramId, 200);
    }
    updatedUser = db.getUser(telegramId);
  }

  return {
    success: true,
    paid: true,
    coins: updatedUser ? updatedUser.coins : 0,
    addedCoins,
    type,
    payment
  };
};

// Check if a Bakong Account ID exists on the National Bank of Cambodia network
export const verifyBakongAccount = async (accountId) => {
  if (!accountId || typeof accountId !== 'string') {
    return { exists: false, message: 'សូមបញ្ចូល Bakong Account ID' };
  }
  const cleanId = accountId.trim();
  try {
    const response = await fetch('https://api-bakong.nbc.gov.kh/v1/check_bakong_account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: cleanId })
    });
    const data = await response.json();
    const exists = data?.responseCode === 0;
    return {
      success: true,
      exists,
      responseCode: data?.responseCode,
      errorCode: data?.errorCode,
      message: exists
        ? 'គណនីត្រឹមត្រូវ និងដំណើរការលើប្រព័ន្ធ Bakong ✅'
        : 'រកមិនឃើញគណនីនេះក្នុងប្រព័ន្ធ Bakong ទេ។ សូមពិនិត្យអក្ខរាវិរុទ្ធ ឬបើកដំណើរការ Bakong ក្នុង App ធនាគាររបស់អ្នក',
      accountId: cleanId
    };
  } catch (err) {
    return {
      success: false,
      exists: false,
      message: `មិនអាចភ្ជាប់ទៅកាន់ម៉ាស៊ីនមេ Bakong: ${err.message}`,
      accountId: cleanId
    };
  }
};

// Decode any raw KHQR code string (from ACLEDA, ABA, Wing, etc.)
export const decodeKhqrPayload = (qrString) => {
  if (!qrString || typeof qrString !== 'string') {
    return { success: false, message: 'ទិន្នន័យ KHQR មិនត្រឹមត្រូវ' };
  }
  try {
    const cleanQr = qrString.trim();
    const decoded = BakongKHQR.decode(cleanQr);
    if (decoded && decoded.data) {
      const d = decoded.data;
      return {
        success: true,
        data: d,
        bakongAccountID: d.bakongAccountID || d.merchantID || null,
        merchantName: d.merchantName || null,
        currency: d.transactionCurrency === '116' ? 'KHR' : d.transactionCurrency === '840' ? 'USD' : d.transactionCurrency,
        amount: d.transactionAmount || null,
        merchantCity: d.merchantCity || null
      };
    }
    return { success: false, message: 'មិនអាចបកស្រាយទិន្នន័យ KHQR បានទេ' };
  } catch (err) {
    return { success: false, message: err.message || 'Error decoding KHQR' };
  }
};
