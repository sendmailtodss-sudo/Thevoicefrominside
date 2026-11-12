/* Frame identity and bounded retained samples. No scheduler or animation clock. */
export function frameRequest(fraction, duration, scene = {}) {
  const rate = Number(scene.frameRate || scene.media?.frameRate);
  const count = Number(scene.frameCount || scene.media?.frameCount);
  const f = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
  if (!(duration > 0) || !Number.isFinite(duration)) return null;
  const timestamps = scene.frameTimes || scene.media?.frameTimes;
  if (Array.isArray(timestamps) && timestamps.length && timestamps.every((time, i) => Number.isFinite(time) && time >= 0 && time < duration && (!i || time > timestamps[i - 1]))) {
    const index = Math.min(timestamps.length - 1, Math.floor(f * timestamps.length)), time = timestamps[index];
    const interval = (timestamps[index + 1] ?? duration) - time;
    const tolerance = Math.min(interval, index ? time - timestamps[index - 1] : interval) * .49;
    return { index, time, seekTime: time + interval * .25, duration: interval, tolerance, count: timestamps.length, exact: true };
  }
  if (rate > 0 && Number.isFinite(rate)) {
    const frames = Number.isInteger(count) && count > 0 ? count : Math.max(1, Math.round(duration * rate));
    const index = Math.min(frames - 1, Math.floor(f * frames));
    const time = index / rate;
    // Seek inside the sample. A PTS such as 32/24 is rounded to microseconds
    // by HTMLMediaElement; seeking to the rounded lower edge can decode 31.
    return { index, time, seekTime: Math.min(duration - .000001, time + .25 / rate), duration: 1 / rate, count: frames, exact: true };
  }
  // Legacy media without a measured cadence remains seekable, but it cannot
  // claim a frame index. Its requested timestamp is retained explicitly.
  const time = f * Math.max(0, duration - .001);
  return { index: null, time, seekTime: time, duration: null, count: null, exact: false };
}

export function matchesFrame(request, mediaTime) {
  if (!request || !Number.isFinite(mediaTime)) return false;
  // Timestamp rounding is tolerated inside half a measured sample, never
  // across a frame boundary. MediaTime, not currentTime, identifies a frame.
  return Math.abs(mediaTime - request.time) < (request.tolerance ?? (request.duration ? request.duration * .49 : .1));
}

export const frameKey = (source, request) => `${source}#${request.index === null ? request.time.toFixed(6) : request.index}`;

export class FrameCache {
  constructor({ maxPixels = 14_000_000, maxEntries = 36 } = {}) {
    this.maxPixels = maxPixels; this.maxEntries = maxEntries; this.pixels = 0; this.entries = new Map();
  }
  get(key) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    this.entries.delete(key); this.entries.set(key, entry);
    return entry;
  }
  set(key, entry) {
    this.delete(key);
    const pixels = entry.width * entry.height;
    if (!(pixels > 0) || pixels > this.maxPixels) { entry.source?.close?.(); return; }
    this.entries.set(key, { ...entry, pixels }); this.pixels += pixels;
    while (this.entries.size > this.maxEntries || this.pixels > this.maxPixels) this.delete(this.entries.keys().next().value);
  }
  delete(key) {
    const entry = this.entries.get(key);
    if (!entry) return;
    this.pixels -= entry.pixels; this.entries.delete(key);
    if (entry.source?.close) entry.source.close();
    else if (entry.source) { entry.source.width = 1; entry.source.height = 1; }
  }
  clear() { for (const key of this.entries.keys()) this.delete(key); }
}

// Resources may become ready after input stops. An input can explicitly admit
// one atomic readiness presentation of its latest requested composition. This
// does not admit older targets, playback, incremental layers or timed easing.
export class PresentationGate {
  constructor() { this.epoch = 0; this.target = ''; this.readiness = false; this.disposed = false; }
  request(target, { readiness = false } = {}) {
    if (this.disposed) return null;
    this.target = target; this.readiness = readiness; return ++this.epoch;
  }
  accepts(epoch, target) { return !this.disposed && epoch === this.epoch && target === this.target; }
  canPresent(epoch, target, input) { return this.accepts(epoch, target) && (input || this.readiness); }
  presented(epoch) { if (epoch === this.epoch) this.readiness = false; }
  dispose() { this.disposed = true; this.epoch++; this.readiness = false; }
}
