import { BakongKHQR, IndividualInfo, khqrData } from 'bakong-khqr';
import QRCode from 'qrcode';

const khqr = new BakongKHQR();

// Store active payment requests in memory (md5 -> paymentDetails)
const activePayments = new Map();

export const generatePaymentQR = async ({
  telegramId,
  type = 'coins', // 'coins' or 'vip'
  packageId = 2,
  tier = 'monthly',
  amountKhr = 6000,
  amountUsd = 1.5,
  currency = 'USD'
}) => {
  const accountId = (process.env.BAKONG_ACCOUNT_ID || '006963867@abaa').trim();
  const merchantName = (process.env.MERCHANT_NAME || 'CHAN SOKSIENG').trim();
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

  // Track active payment
  activePayments.set(md5, {
    telegramId,
    type,
    packageId,
    tier,
    amountKhr,
    amountUsd,
    currency,
    billNumber,
    createdAt: Date.now(),
    expiresAt: expirationTimestamp,
    isPaid: false
  });

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

export const checkPaymentStatus = async (md5) => {
  if (!md5) return { success: false, message: 'Missing md5 parameter' };

  const payment = activePayments.get(md5);
  if (!payment) {
    return { success: false, message: 'Payment record not found or expired' };
  }

  if (payment.isPaid) {
    return { success: true, paid: true, payment };
  }

  const rawToken = process.env.BAKONG_API_TOKEN ? process.env.BAKONG_API_TOKEN.trim() : null;

  // If developer token is configured, call official Bakong Open API
  if (rawToken) {
    try {
      const authHeader = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
      const response = await fetch('https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader
        },
        body: JSON.stringify({ md5 })
      });

      const data = await response.json();
      if (data && (data.responseCode === 0 || data.data?.status === 'SUCCESS' || data.status === 0 || data.data?.hash === md5)) {
        payment.isPaid = true;
        return { success: true, paid: true, payment, data };
      }
    } catch (err) {
      console.warn('Bakong API check error:', err.message);
    }
  }

  return { success: true, paid: false, payment };
};

export const markPaymentCompleted = (md5) => {
  const payment = activePayments.get(md5);
  if (payment) {
    payment.isPaid = true;
    return payment;
  }
  return null;
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
