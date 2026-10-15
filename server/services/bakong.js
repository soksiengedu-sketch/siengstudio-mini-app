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
  currency = 'KHR'
}) => {
  const accountId = process.env.BAKONG_ACCOUNT_ID || '855885688848@aclb';
  const merchantName = process.env.MERCHANT_NAME || 'CHAN SOKSIENG';
  const merchantCity = process.env.MERCHANT_CITY || 'Phnom Penh';

  const isKhr = currency === 'KHR';
  const amountToCharge = isKhr ? Number(amountKhr) : Number(amountUsd);
  const selectedCurrency = isKhr ? khqrData.currency.khr : khqrData.currency.usd;

  const billNumber = `SS${Date.now().toString().slice(-6)}`;
  const expirationTimestamp = Date.now() + 15 * 60 * 1000; // 15 mins expiry

  const optionalData = {
    currency: selectedCurrency,
    amount: amountToCharge,
    billNumber,
    mobileNumber: accountId.replace('@aclb', ''),
    storeLabel: 'SiengStudio',
    terminalLabel: 'AppPay',
    expirationTimestamp
  };

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

  const token = process.env.BAKONG_API_TOKEN;

  // If developer token is configured, call official Bakong Open API
  if (token) {
    try {
      const response = await fetch('https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ md5 })
      });

      const data = await response.json();
      if (data && (data.responseCode === 0 || data.data?.status === 'SUCCESS')) {
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
