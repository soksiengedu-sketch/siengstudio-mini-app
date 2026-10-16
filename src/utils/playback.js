// Playback progress, resume memory, and formatting utilities for SiengStudio

export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const getEpisodeProgressKey = (dramaId, episodeId) =>
  `siengstudio_progress_${dramaId}_${episodeId}`;

export const getLastWatchedDramaKey = (dramaId) =>
  `siengstudio_last_watched_${dramaId}`;

/**
 * Save playback position of an episode to localStorage
 */
export const saveEpisodeProgress = (dramaId, episodeId, episodeNumber, currentTime, duration) => {
  if (!dramaId || !episodeId || currentTime === undefined) return;
  try {
    const sec = Math.floor(currentTime);
    const dur = Math.floor(duration || 0);

    // If near the end (95% or within last 3 seconds), consider it completed and reset to 0
    if (dur > 5 && (currentTime >= dur - 4 || currentTime / dur >= 0.96)) {
      localStorage.removeItem(getEpisodeProgressKey(dramaId, episodeId));
      return;
    }

    // Only save if watched at least 3 seconds
    if (sec >= 3) {
      const payload = {
        seconds: sec,
        duration: dur,
        timeString: formatDuration(sec),
        updatedAt: Date.now()
      };
      localStorage.setItem(getEpisodeProgressKey(dramaId, episodeId), JSON.stringify(payload));

      const lastWatchedPayload = {
        episodeId,
        episodeNumber: Number(episodeNumber) || 1,
        seconds: sec,
        duration: dur,
        timeString: formatDuration(sec),
        updatedAt: Date.now()
      };
      localStorage.setItem(getLastWatchedDramaKey(dramaId), JSON.stringify(lastWatchedPayload));
    }
  } catch (e) {
    // LocalStorage quota or access error
  }
};

/**
 * Get saved playback position of a specific episode
 */
export const getEpisodeProgress = (dramaId, episodeId) => {
  if (!dramaId || !episodeId) return null;
  try {
    const raw = localStorage.getItem(getEpisodeProgressKey(dramaId, episodeId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data.seconds === 'number' && data.seconds >= 3) {
      return data;
    }
  } catch (e) {}
  return null;
};

/**
 * Get the last watched episode and timestamp for a drama
 */
export const getLastWatchedDrama = (dramaId) => {
  if (!dramaId) return null;
  try {
    const raw = localStorage.getItem(getLastWatchedDramaKey(dramaId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

/**
 * Clear saved progress for a specific episode
 */
export const clearEpisodeProgress = (dramaId, episodeId) => {
  if (!dramaId || !episodeId) return;
  try {
    localStorage.removeItem(getEpisodeProgressKey(dramaId, episodeId));
  } catch (e) {}
};
