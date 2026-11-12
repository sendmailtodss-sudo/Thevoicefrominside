# Official sources and capability roles

Reviewed 2026-11-12. This is a compact static reference, not a live account record or executable catalog. Resolve the chosen model and its current schema in the actual execution surface before use. No copied upstream workflow is activated by this file.

## Source priority

1. Current connected tool description and exact selected model schema for that tool surface.
2. Current official model-specific documentation for the same execution surface.
3. Pinned official skills/reference code as design evidence; apply project overrides where they conflict.
4. Product descriptions as discovery leads, not account entitlement or tested quality.

Official MCP endpoint: https://mcp.higgsfield.ai/mcp. Confirmed in the [official Cursor plugin config](https://github.com/higgsfield-ai/cursor-plugin/blob/c9215059e409dc81c69ff0fe77ea2740c5fc6249/mcp.json). An existing connector does not need replacement just to inspect its catalog.

Official API index: https://docs.higgsfield.ai/docs/llms.txt. It explicitly says model-specific documentation takes priority and the shared OpenAPI file is supplementary, not an authoritative model catalog.

## Compact capability roles

| Need | Families / surfaces to discover | What still needs proof |
|---|---|---|
| Reference stills and controlled image edits | Nano Banana; GPT Image; Seedream; Flux; Soul; masks/inpaint where exposed | Actual look, protected regions, subject identity and composition |
| Guided camera/motion video | Seedance; Cinema Studio; Kling; other current video families | Correct media roles, continuous motion, endpoints, timing and visual fidelity |
| Edit/reframe/replace/restyle | Seedance/Kling/Flux edits; Reframe; Genjutsu; authorized Katana editing workflow | Whether geometry, source motion, framing and duration survive the edit |
| Masks/layers/depth | SAM; Image Decompose; Depth Anything | Mask edges, temporal stability and the limits of inferred depth |
| Real 3D assets | Meshy; Tripo; Hunyuan3D; SAM 3D; remesh/retexture/rigging tools | Geometry, topology, scale, materials, rig and export fidelity |
| Controlled scene construction | Hosted 3D Jutsu or an explicitly available local Blender integration | Actual scene state, delivery-camera render, export behavior and runtime availability |
| Reusable identity/look | Model-specific reference elements, Soul identity, approved reference images | Support in the selected model and actual cross-shot consistency |
| Delivery restoration | Upscale, deflicker, interpolation, background removal | Artifacts introduced and whether added processing is worth its approved cost |

## Important surface mismatches

- MCP and CLI model IDs/aliases can differ, including Nano Banana naming. Never transfer IDs by memory.
- Seedance maximum-resolution claims differed between a live schema and pinned CLI prose at review time. Recheck the actual route; don't promise untested native detail.
- [Public Cinema Studio4.0](https://docs.higgsfield.ai/docs/models/cinema-studio-4/generate.md) uses named controls and creates new videos; MCP may expose opaque control IDs and different modes. Do not substitute one schema for the other.
- Reusable element support is model-specific; start/end-frame roles do not imply element-placeholder support.
- Local desktop setup recipes do not establish an available local editor in a cloud session. A generic fallback response to an editor route must not become substitute generation.
- Developer API auth, balance and model access must be established separately from consumer/MCP subscription observations.

## Pinned source review and overrides

| Source | Pin / license | Safe use here |
|---|---|---|
| [Official skills](https://github.com/higgsfield-ai/skills/tree/27000402070db19d958789d05b3b52b6f4718d7c) |27000402070db19d958789d05b3b52b6f4718d7c;MIT | Read generation/media-role and continuity ideas; do not install conflicting website workflow wholesale |
| [Official CLI](https://github.com/higgsfield-ai/cli/tree/fd21e7cb550b5835cc00c6b4abfea0c02fe77ff2) |fd21e7cb550b5835cc00c6b4abfea0c02fe77ff2;MIT | Documented alternative; no automatic install/auth/execution |
| [Code-film kit](https://github.com/higgsfield-ai/higgsfield-video-engineer/tree/082bfd7b7b0b863799fa9afcdfeb3e84ba72e015) |082bfd7b7b0b863799fa9afcdfeb3e84ba72e015;MIT | Frame-as-pure-function and real visual QA principles; different rendering workflow |

The official website skill and scroll guide contain no-vision-inspection/no-browser-review instructions. Reject those for this project. They also default to longest/highest settings and concurrent cover generation; replace with the approved diagnostic, one-owner sequential spending and real visual review.

The pinned [scroll React reference](https://github.com/higgsfield-ai/skills/blob/27000402070db19d958789d05b3b52b6f4718d7c/higgsfield-websites/references/scroll-scrub-asset-react.md) interpolates current progress, uses a seek epsilon and clamps below the final endpoint. Do not claim exact reversible mapping from this implementation unchanged.

Useful official lifecycle sources: [idempotency](https://docs.higgsfield.ai/docs/concepts/idempotency.md), [billing/retention](https://docs.higgsfield.ai/docs/concepts/billing-and-retention.md), [authentication](https://docs.higgsfield.ai/docs/authentication.md), [SDKs](https://docs.higgsfield.ai/docs/how-to/sdk.md). These describe the developer API; apply equivalent recovery only where the selected tool supports it.

If substantial third-party code is later copied, retain its applicable license/copyright notices. Software repository licensing does not establish model-output or reference-media rights.
