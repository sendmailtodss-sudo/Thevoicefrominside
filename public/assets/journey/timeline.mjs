/* A reversible, input-driven timeline. No clock or frame scheduler belongs here. */
import { frameRequest } from './frame-runtime.mjs';
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
export function mediaTime(fraction, duration, scene) {
  return frameRequest(fraction, duration, scene)?.time ?? 0;
}
// Frame inspection: a source/destination pair is visible in the portrait crop
// from impulses=0.44. At 0.72 the actual second cable changes identity; complete
// four lifecycles before that handoff, then three before the plate cut, and four
// in vortex through 0.50. No half-formed word is carried across unrelated paths.
// Scroll controls the duration without any imposed pause.
export function networkProgress(index, fraction, scenes) {
  const id = scenes[index]?.id, phase = clamp(fraction), handoff = 4 / 11, cut = 7 / 11;
  if (id === 'impulses' && phase >= .44) {
    if (phase < .72) return clamp((phase - .44) / .28) * handoff;
    return handoff + clamp((phase - .72) / .28) * (cut - handoff);
  }
  if (id === 'vortex' && phase <= .5) return cut + clamp(phase / .5) * (1 - cut);
  return null;
}
const mix = (a, b, p) => a + (b - a) * p;
const ease = p => { const n = clamp(p); return n * n * (3 - 2 * n); };
// Sparse hand-observed gaps among the actual brains, not motion tracking.
// Central alternatives are chosen when cover crops the outer brains away.
const neuralGaps = [
  { at: 0, wide: [[.27,.30],[.70,.64],[.51,.45]], central: [[.43,.27],[.565,.65],[.50,.44]] },
  { at: .3, wide: [[.25,.35],[.69,.73],[.51,.28]], central: [[.43,.28],[.565,.68],[.50,.47]] },
  { at: .65, wide: [[.42,.26],[.61,.79],[.48,.54]], central: [[.43,.25],[.565,.69],[.49,.46]] },
  { at: 1, wide: [[.30,.24],[.66,.66],[.50,.43]], central: [[.43,.25],[.565,.65],[.50,.45]] },
];
function projectedGap(key, slot, width, height) {
  const crop = coverRect(1280, 720, width, height);
  const project = point => ({ x: (point[0] * 1280 - crop.x) / crop.width, y: (point[1] * 720 - crop.y) / crop.height });
  const candidate = project(key.wide[slot]);
  // Select a source-space alternative, rather than clamping text away from
  // an off-screen brain. Mobile and desktop follow the same source frame.
  const central = project(key.central[slot]);
  const visible = point => point.x >= .23 && point.x <= .77 && point.y >= .22 && point.y <= .74;
  if (visible(candidate)) return candidate;
  if (visible(central)) return central;
  // Very wide landscape crops may contain none of the sparse reference
  // points. Use another gap in the visible source strip, not its cut edge.
  return { x: [.25,.73,.5][slot], y: [.26,.66,.45][slot] };
}
export function thoughtStates(progress, count, { width = 1280, height = 720 } = {}) {
  if (progress === null || count < 1) return [];
  if (![width,height].every(n => Number.isFinite(n) && n > 0)) { width = 1280; height = 720; }
  const n = clamp(progress), p = 2 + n * Math.max(0, count - 2 - .001);
  const upper = Math.max(1,neuralGaps.findIndex(key => key.at >= n));
  const from = neuralGaps[upper - 1], to = neuralGaps[upper];
  const phaseMix = ease((n - from.at) / (to.at - from.at));
  return Array.from({ length: count }, (_, index) => {
    const phase = p - index, slot = index % 3, drift = clamp(phase / 3);
    const a = projectedGap(from, slot, width, height), b = projectedGap(to, slot, width, height), anchor = { x: mix(a.x,b.x,phaseMix), y: mix(a.y,b.y,phaseMix) };
    const enter = ease(drift / .34), leave = ease((drift - .63) / .37);
    const edge = [{x:-.18,y:.38},{x:1.18,y:.58},{x:.5,y:1.05}][slot];
    const absorb = {x: .5 + (slot - 1) * .045, y: .43 - slot * .035};
    return {
      index, slot, entry: ['left','right','center'][slot],
      opacity: clamp(Math.min(phase / .3, (3 - phase) / .3)), drift,
      x: mix(mix(edge.x,anchor.x,enter),absorb.x,leave),
      y: mix(mix(edge.y,anchor.y,enter),absorb.y,leave),
      z: mix(mix(-480-slot*90,[-25,45,-95][slot],enter),-760-slot*80,leave),
      scale: mix(mix(.72,[1,.94,1.05][slot],enter),.35,leave),
      blur: (1-enter)*3 + leave*4,
    };
  });
}
export function decoration(progress, fraction) {
  const f = clamp(fraction), edge = Math.max(clamp((.1 - f) / .1), clamp((f - .9) / .1));
  return { stars: .12 + Math.sin(clamp(progress) * Math.PI * 8) * .04, binary: -35 + f * 70, portal: edge * .5, portalScale: .8 + (1 - edge) * 1.6 };
}

// A scene boundary occupies a small, symmetric part of its neighbouring
// scroll ranges. Both media times and opacity are functions of position only.
export function transition(progress, scenes, { span = .08, enabled = true } = {}) {
  const state = position(progress, scenes);
  if (state.index < 0) return { ...state, left: null, right: null, mix: 0 };
  const single = () => ({ ...state, left: { index: state.index, fraction: state.fraction, opacity: 1 }, right: null, mix: 0 });
  if (!enabled) return single();
  const extent = clamp(span, 0, .45), total = scenes.reduce((sum, scene) => sum + weight(scene), 0);
  if (!extent || !total) return single();
  const cursor = state.progress * total;
  let boundary = 0;
  for (let i = 0; i < scenes.length - 1; i++) {
    const leftWeight = weight(scenes[i]), rightWeight = weight(scenes[i + 1]);
    boundary += leftWeight;
    if (!scenes[i]?.video || !scenes[i + 1]?.video || scenes[i]?.type === 'point' || scenes[i + 1]?.type === 'point' || scenes[i]?.type === 'art' || scenes[i + 1]?.type === 'art') continue;
    const authored = scenes[i].transitionOut || scenes[i + 1].transitionIn;
    if (authored?.treatment === 'cut') continue;
    const half = Math.min(leftWeight, rightWeight) * clamp(authored?.span ?? extent, 0, .45);
    if (!half) continue;
    if (cursor < boundary - half || cursor > boundary + half) continue;
    const phase = clamp((cursor - boundary + half) / (2 * half));
    const mix = phase * phase * (3 - 2 * phase);
    return {
      ...state,
      left: { index: i, fraction: clamp((leftWeight - half + phase * half) / leftWeight), opacity: 1 - mix },
      right: { index: i + 1, fraction: clamp(phase * half / rightWeight), opacity: mix },
      mix,
      // A boundary may opt into a verified matched cut or a short blend.
      // Otherwise open a depth aperture rather than double-exposing places.
      treatment: scenes[i].transitionOut?.treatment || scenes[i + 1].transitionIn?.treatment || 'aperture',
      centerX: scenes[i + 1].transitionIn?.centerX ?? .5,
      centerY: scenes[i + 1].transitionIn?.centerY ?? .46,
    };
  }
  return single();
}

// Source rectangle for object-fit:cover, including independently authored
// focal points. Invalid or undecoded sources are never drawn.
export function coverRect(sourceWidth, sourceHeight, targetWidth, targetHeight, focusX = 50, focusY = 50) {
  if (![sourceWidth, sourceHeight, targetWidth, targetHeight].every(n => Number.isFinite(n) && n > 0)) return null;
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = targetWidth / scale, height = targetHeight / scale;
  return { x: (sourceWidth - width) * clamp(focusX / 100), y: (sourceHeight - height) * clamp(focusY / 100), width, height };
}

// The same authored focal point must drive both the displayed plate and any
// registered effects. A narrow portrait crop may need a distinct composition.
export function focusFor(scene, width, height) {
  const portrait = width < height;
  const narrow = portrait && width / height < (scene.narrowPortraitMaxAspect ?? .42);
  const x = narrow
    ? (scene.narrowPortraitFocusX ?? scene.portraitFocusX ?? scene.focusX ?? 50)
    : (portrait ? (scene.portraitFocusX ?? scene.focusX ?? 50) : (scene.focusX ?? 50));
  const y = portrait ? (scene.portraitFocusY ?? scene.focusY ?? 50) : (scene.focusY ?? 50);
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
}
