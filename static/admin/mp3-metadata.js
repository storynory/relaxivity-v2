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
  const response = await fetch(url, { method: 'HEAD' });
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
    const url = data.get('audio');
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return;

    let updated = data;
    let seconds = null;
    try {
      seconds = await audioDuration(url);
      updated = updated.set('duration', formatDuration(seconds));
    } catch (error) {
      console.warn('Could not detect audio duration; keeping existing value.', error);
    }

    // Preserve an existing byte count (including manually corrected values).
    // When empty, prefer the exact Content-Length, otherwise estimate at the
    // episode bitrate (128 kbps by default). VBR estimates can be inaccurate.
    const existing = Number(data.get('length'));
    if (!Number.isSafeInteger(existing) || existing <= 0) {
      let size = null;
      try {
        size = await audioLength(url);
      } catch {
        // Typical for Libsyn: the audio plays but cross-origin HEAD is blocked.
      }
      if (size === null && seconds !== null) {
        const configured = Number(data.get('bitrate'));
        const bitrate = Number.isFinite(configured) && configured > 0 ? configured : 128;
        size = Math.round(seconds * bitrate * 1000 / 8);
        console.info('Estimated MP3 byte length using', bitrate, 'kbps:', size);
      }
      if (size !== null) updated = updated.set('length', size);
    }
    return updated;
  }
});
