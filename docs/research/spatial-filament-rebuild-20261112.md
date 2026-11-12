# Neural typography: source-connected rebuild, 12 November 2026

Status: implementation and technical evidence for a bounded release. Publication is recorded separately from these checks.

The previous text used estimated brain centres as anchors and a bright text layer
over the video. That did not establish a visible relationship between the words
and the nerve connections. The current brief requires a phrase to emerge from a
visible connection, form briefly, and disappear into a different connection, with
fewer simultaneous phrases, depth and light shared with the surrounding network.

## Source evidence and timing

The existing RGB clips are flat plates. Their camera, metric depth and anatomical
geometry have not been recovered. Any depth inferred from silhouette size is an
approximation and must be described that way.

Frame inspection found a usable pair of connections inside the portrait crop
in `impulses` from approximately 4.4 seconds and in the early `vortex` clip.
An initially proposed longer upper connection at 3.5 seconds was rejected after
enlarged frame inspection showed dark space where a cable had been assumed.
Typography therefore occupies `impulses` fractions 0.44–1 and `vortex` fractions
0–0.5. Four complete lifecycles finish at `impulses` fraction 0.72, where the second
real connection changes identity; three more finish at the plate cut and four
belong to the next clip. A phrase must not remain
partly assembled across their change of network geometry.

The upper and central connections in `impulses` are different observed paths.
Do not morph one into the other merely to maintain an apparent continuous anchor.
Authored paths are registered against the currently committed RGB frame. An
unsupported or off-screen path is not permission to invent a replacement.

The root supplies the actual presented media time and plate identity. A requested
seek time is not proof of the frame on screen. Absolute native scroll remains the
only timeline input: stopping holds the committed picture; reverse and direct
jumps must resolve to the same picture and particle state.

The two network clips have scroll weights 4 and 3 so the formation, readable
moment and departure have usable input distance. They impose no timed pauses;
visitors can still skip freely or return by scrolling upward.

At a 320×844 viewport the centred crop genuinely excludes the observed upper
cable end. For `impulses` only, aspect ratios below 0.42 use the authored horizontal
focus 47 instead of 50. Wider viewports keep their tested composition. The root
records and supplies the actual committed source crop; registration must use that
same rectangle, including its inverse mapping for evidence coordinates. A cropped
away cable must never be fabricated merely to keep a phrase visible.

## Compositing responsibilities

One renderer owns the spatial text, inferred occlusion and local light treatment.
The exact approved eleven expressions remain available in Norwegian, English and
Simplified Chinese. Reduced simultaneous density must not silently delete words
or replace their translations with generated video lettering.

Source and destination light should remain coherent while a phrase is readable.
Overlapping white point cores alone produce a flat label; inspect the saturated
emissive body, soft halo, and surrounding filament response in rendered frames.
Use distinct near, middle and far placements where legibility permits. Do not
force every readable phrase in front of the nearest brain and then claim depth.

Follow the installed Three.js version's colour pipeline: colour plates are sRGB,
working light/compositing values are linear, data masks are not colour textures,
and the final display conversion happens once. Primary reference checked:
<https://threejs.org/manual/pages/color-management.html>.

## Acceptance evidence

Require actual changing video plates in the real page, not only static component
screenshots. Check both landscape and portrait, all three languages, source and
destination registration, forward/reverse/direct equivalence, stopped pixels,
resource disposal and resize behaviour. A sampled render review is not a physical
phone performance measurement. Passing numerical tests does not establish visual
quality; inspect the formation, readable moment and departure in motion.

This revision does not resolve the rejected prison-building/outfit shots. The bounded release retains the previously published illustrative scenes after the neural opening and excludes the rejected new clips. It does not establish a fully continuous, geographically verified camera journey.
