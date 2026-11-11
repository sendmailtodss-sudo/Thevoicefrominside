/* A reversible, input-driven timeline. No clock or frame scheduler belongs here. */
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export const weight = scene => Number.isFinite(scene?.scrollWeight) && scene.scrollWeight > 0 ? scene.scrollWeight : 1;
export function position(progress, scenes) {
  if (!scenes.length) return { index: -1, fraction: 0, progress: 0 };
  const normalized = clamp(progress, 0, 1), total = scenes.reduce((sum, scene) => sum + weight(scene), 0);
  let cursor = normalized * total;
  for (let index = 0; index < scenes.length; index++) {
    const length = weight(scenes[index]);
    if (cursor < length - 1e-12 || index === scenes.length - 1) return { index, fraction: clamp(cursor / length), progress: normalized };
    cursor = Math.max(0, cursor - length);
  }
}
export function progressAt(index, fraction, scenes) {
  const total = scenes.reduce((sum, scene) => sum + weight(scene), 0);
  if (!total) return 0;
  return clamp((scenes.slice(0, index).reduce((sum, scene) => sum + weight(scene), 0) + weight(scenes[index]) * clamp(fraction)) / total);
}
export function mediaTime(fraction, duration) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return clamp(fraction) * Math.max(0, duration - 1 / 30);
}
export function networkProgress(index, fraction, scenes) {
  const indices = scenes.map((scene, i) => ['brains', 'impulses', 'vortex'].includes(scene.id) ? i : -1).filter(i => i >= 0);
  if (!indices.length || index < indices[0] || index > indices.at(-1)) return null;
  return clamp((indices.indexOf(index) + clamp(fraction)) / indices.length);
}
export function thoughtStates(progress, count) {
  if (progress === null || count < 1) return [];
  const p = 2 + clamp(progress) * Math.max(0, count - 2 - .001);
  return Array.from({ length: count }, (_, index) => {
    const phase = p - index;
    return { index, slot: index % 3, opacity: clamp(Math.min(phase / .3, (3 - phase) / .3)), drift: clamp(phase / 3) };
  });
}
export function decoration(progress, fraction) {
  const f = clamp(fraction), edge = Math.max(clamp((.1 - f) / .1), clamp((f - .9) / .1));
  return { stars: .12 + Math.sin(clamp(progress) * Math.PI * 8) * .04, binary: -35 + f * 70, portal: edge * .5, portalScale: .8 + (1 - edge) * 1.6 };
}
