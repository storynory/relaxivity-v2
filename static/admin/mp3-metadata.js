// Sveltia preSave hook: detect independent full-recording and sample MP3 metadata.
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
  // The Audio element can cache a non-CORS response while detecting duration.
  // Do not reuse that response for this CORS metadata request.
  const response = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!response.ok) return null;
  const header = response.headers.get('content-length');
  if (!header || !/^\d+$/.test(header)) return null;
  const size = Number(header);
  return Number.isSafeInteger(size) && size > 0 ? size : null;
}

function hasDuration(value) {
  return typeof value === 'string' && /^(?:\d{2,}:[0-5]\d|\d{2,}):[0-5]\d$/.test(value.trim()) &&
    value.trim().split(':').some((part) => Number(part) > 0);
}

CMS.registerEventListener({
  name: 'preSave',
  handler: async ({ entry }) => {
    if (entry.get('collection') !== 'podcasts') return;
    const data = entry.get('data');
    let settings;
    async function resolveUrl(path) {
      let url = path.trim();
      if (!/^https?:\/\//i.test(url)) {
        // This static route uses the existing podcast settings reader at build time.
        // Share one settings request between the two relative audio paths.
        settings ??= fetch('/admin/podcast-settings.json', { cache: 'no-store', signal: AbortSignal.timeout(10000) }).then((response) => {
          if (!response.ok) throw new Error('Podcast settings unavailable');
          return response.json();
        });
        const { audioBaseUrl } = await settings;
        if (typeof audioBaseUrl !== 'string' || !/^https?:\/\//i.test(audioBaseUrl.trim())) throw new Error('Audio base URL missing');
        url = new URL(url.replace(/^\/+/, ''), `${audioBaseUrl.trim().replace(/\/+$/, '')}/`).href;
      }
      if (!/^https?:\/\//i.test(url)) throw new Error('Invalid audio URL');
      return url;
    }

    let updated = data;
    for (const [audioField, lengthField, durationField] of [
      ['audio', 'length', 'duration'],
      ['sampleAudio', 'sampleLength', 'sampleDuration']
    ]) {
      const path = data.get(audioField);
      if (typeof path !== 'string' || !path.trim()) continue;
      const existing = Number(data.get(lengthField));
      const needsLength = !Number.isSafeInteger(existing) || existing <= 0;
      const needsDuration = !hasDuration(data.get(durationField));
      if (!needsLength && !needsDuration) continue;

      let url;
      try {
        url = await resolveUrl(path);
      } catch (error) {
        console.warn(`Could not resolve ${audioField}; keeping existing metadata.`, error);
        continue;
      }

      if (needsDuration) {
        try {
          const seconds = await audioDuration(url);
          updated = updated.set(durationField, formatDuration(seconds));
        } catch (error) {
          console.warn(`Could not detect ${durationField}; keeping existing value.`, error);
        }
      }

      // Preserve valid manual values; retrieve exact Content-Length, never estimates.
      if (needsLength) {
        try {
          const size = await audioLength(url);
          if (size !== null) updated = updated.set(lengthField, size);
        } catch (error) {
          console.warn(`Could not retrieve ${lengthField}; keeping existing value.`, error);
        }
      }
    }
    return updated;
  }
});
