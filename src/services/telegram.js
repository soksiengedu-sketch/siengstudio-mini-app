// Telegram WebApp Helper & Bridge
export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

export const isTelegramWebApp = () => {
  return Boolean(tg && tg.initData && tg.initData.length > 0);
};

export const initTelegramApp = () => {
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      if (tg.setHeaderColor) {
        tg.setHeaderColor('#0b0c13');
      }
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#0b0c13');
      }
    } catch (e) {
      console.warn('Telegram WebApp init notice:', e);
    }
  }
};

export const getTelegramUser = () => {
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }
  // Fallback realistic user for development or browser preview
  return {
    id: 887654321,
    first_name: 'Vannak',
    last_name: 'Sieng',
    username: 'vannak_sieng',
    language_code: 'km',
    is_premium: true,
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'
  };
};

export const haptic = {
  light: () => {
    try {
      tg?.HapticFeedback?.impactOccurred('light');
    } catch (e) {}
  },
  medium: () => {
    try {
      tg?.HapticFeedback?.impactOccurred('medium');
    } catch (e) {}
  },
  heavy: () => {
    try {
      tg?.HapticFeedback?.impactOccurred('heavy');
    } catch (e) {}
  },
  success: () => {
    try {
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (e) {}
  },
  error: () => {
    try {
      tg?.HapticFeedback?.notificationOccurred('error');
    } catch (e) {}
  },
  select: () => {
    try {
      tg?.HapticFeedback?.selectionChanged();
    } catch (e) {}
  }
};

export const shareToTelegram = (text, url) => {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
};
