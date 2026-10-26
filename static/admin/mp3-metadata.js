// Sveltia preSave hook: detect MP3 metadata from the episode's audio URL.
// Works with remote media; manual values are preserved on failure.
function audioDurationOnce(url, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    let settled = false;

    const timeout = setTimeout(() => finish(null), timeoutMs);

    function finish(seconds) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      audio.removeAttribute('src');
      audio.load();
      if (seconds === null) reject(new Error('Audio metadata unavailable or timed out'));
      else resolve(seconds);
    }

    audio.addEventListener('loadedmetadata', () => {
      const seconds = audio.duration;
      finish(Number.isFinite(seconds) && seconds > 0 ? seconds : null);
    }, { once: true });
    audio.addEventListener('error', () => finish(null), { once: true });
    audio.src = url;
  });
}

// A second attempt helps when remote hosts need time to prepare an MP3.
async function audioDuration(url) {
  try {
    return await audioDurationOnce(url);
  } catch {
    return audioDurationOnce(url);
  }
}

function formatDuration(seconds) {
  const whole = Math.round(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const remainder = whole % 60;
  return [hours, minutes, remainder].map((value) => String(value).padStart(2, '0')).join(':');
}

async function audioLength(url) {
  // This works only when the host grants browser CORS access to HEAD.
  const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
  if (!response.ok) return null;
  const header = response.headers.get('content-length');
  if (!header || !/^\d+$/.test(header)) return null;
  const size = Number(header);
  return Number.isSafeInteger(size) && size > 0 ? size : null;
}

CMS.registerEventListener({
  name: 'preSave',
  handler: async ({ entry }) => {
    if (entry.get('collection') !== 'podcasts') return;
    const data = entry.get('data');
    const path = data.get('audio');
    if (typeof path !== 'string' || !path.trim()) return;
    let url = path.trim();
    if (!/^https?:\/\//i.test(url)) {
      try {
        // This static route uses the existing podcast settings reader at build time.
        const response = await fetch('/admin/podcast-settings.json', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('Podcast settings unavailable');
        const { audioBaseUrl } = await response.json();
        if (typeof audioBaseUrl !== 'string' || !/^https?:\/\//i.test(audioBaseUrl.trim())) throw new Error('Audio base URL missing');
        url = new URL(url.replace(/^\/+/, ''), `${audioBaseUrl.trim().replace(/\/+$/, '')}/`).href;
        if (!/^https?:\/\//i.test(url)) return;
      } catch (error) {
        console.warn('Could not resolve audio path; keeping existing metadata.', error);
        return;
      }
    }

    let updated = data;
    try {
      const seconds = await audioDuration(url);
      updated = updated.set('duration', formatDuration(seconds));
    } catch (error) {
      console.warn('Could not detect audio duration; keeping existing value.', error);
    }

    // Preserve an existing byte count (including manually corrected values).
    // When empty, retrieve the exact Content-Length; never estimate a size.
    const existing = Number(data.get('length'));
    if (!Number.isSafeInteger(existing) || existing <= 0) {
      let size = null;
      try {
        size = await audioLength(url);
      } catch (error) {
        console.warn('Could not retrieve audio file size; keeping existing value.', error);
      }
      if (size !== null) updated = updated.set('length', size);
    }
    return updated;
  }
});
