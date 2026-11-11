# One gallery, optional WebXR

The journey's gallery stage and selected-artwork dialog link to the existing
`/galleri-3d/?view=3d` room, or `/en/galleri-3d/?view=3d`. A selected work keeps
its `art` query parameter. The room continues to use the six approved entries in
`public/galleri-3d/catalog.json`; this change creates no second gallery or artwork
set. Reduced motion and unavailable WebGL retain the ordinary accessible gallery.

Desktop keys select artwork: Left/Right, Home/End, Enter to open the image,
Escape to leave the room. These are artwork navigation, not free walking.

Immersive VR starts only after a supported browser reports capability and the
visitor presses Enter VR. A `local-floor` reference is required. The XR rig adds
no eye-height offset: the headset supplies floor-relative height. Unsupported or
rejected sessions return to the existing room.

Teleportation is optional and unchecked initially. The visitor enables it before
entering VR, points at a valid floor location and presses the controller trigger.
A green target marks a valid destination. The nearest intersected room surface
must be the floor; walls, artwork and a bounded sculpture collision proxy obstruct the ray. Destinations
stay within inset room bounds, outside the sculpture keep-out area, and within
12 metres of the controller. A jump compensates for the current physical headset
offset without changing floor height. There is no thumbstick polling, smooth
dragging, automatic walking or forced transition into XR. Session exit resets
the opt-in and target markers; destroying the room removes controller listeners.

## Verification and limits

`node --test tests/gallery-locomotion.test.mjs` checks ray/ground intersection,
invalid and nonfinite targets, room and sculpture boundaries, headset/rig offset,
height preservation, opt-in rejection, repeated jumps and controller event cleanup
with synthetic inputs. The full repository tests, source check and build pass.

Targeted browser checks cover Norwegian and English at 390 and 1440 pixels:
journey links to this same room, artwork identity, keyboard Home/End, unchecked
teleport default, no automatic XR request, `local-floor` request options, rejected
session recovery and room cleanup. Mobile and desktop screenshots were inspected
using software WebGL. The contributor export lacks the optional detailed DNA GLB;
the existing procedural sculpture fallback remained visible.

No physical headset, tracked-controller pointing, real floor calibration,
actual in-headset teleport comfort, eye-height perception or headset performance
was tested. The ray/rig tests are controlled proxies, not a hardware acceptance
receipt. Free desktop walking, thumbstick movement and snap-turn are not included.
No publication or production integration is implied by this branch.
