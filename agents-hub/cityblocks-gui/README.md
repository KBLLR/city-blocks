# CityBlocks GUI Project

Build a reusable 3D control surface inspired by `uil_3d.html`, where a requested building block appears centered on a platform and can be manipulated through a modern GUI. This initiative documents requirements, backlog, and sessions for the GUI path of CityBlocks.

## Project Snapshot
- Variant: `HITL`
- Intent: `Deliver an interactive 3D platform where the selected building block is centered and fully editable via a UIL-style GUI.`
- Owner: `@davidcaballero`

## Charter
### Objectives
1. Recreate the 3D platform flow from `uil_3d.html` inside the main app (React/Vite) so any building request spawns a centered diorama.
2. Provide a GUI layer (UIL or modern equivalent) that exposes building/material/lighting controls without touching code.
3. Keep the GUI + scene architecture modular so future agents can add sliders/toggles per capability.

### Research Notes
- `uil_3d.html` shows the legacy implementation: OrbitControls camera, Landscape/SuperSky helpers, and UIL panels controlling terrain, water, and sky properties.
- The requested experience mirrors that file but must hook into the live building data so the selected block loads in the middle of the platform before the GUI manipulates it.

### In Scope
- Loading a “building block” mesh centered on the platform.
- Mounting a UIL-style GUI (sliders, color pickers) that can tweak geometry/material/light presets.
- Documentation, tasks, and session logs that capture experiments.

### Out of Scope (current phase)
- Persisting GUI presets to the backend.
- Multiplayer collaboration on the same GUI surface.

### Stakeholders
- Product / Technical: @davidcaballero
- Reviewers: Future CityBlocks UI engineers.

### Success Criteria
- Building block centered on the platform immediately after selection.
- GUI controls can adjust at least: material palette, height exaggeration, lighting/environment.
- Code + docs make it easy to add additional control groups.

## Artifacts
- `tasks.yaml` / `tasks.md`: backlog and ledger for `CBG-*` tasks.
- `sessions/`: timestamped working notes per effort.

Keep this README updated whenever scope, stakeholders, or success criteria change so every agent knows exactly what “done” looks like.
