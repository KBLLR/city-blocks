# Task Ledger — CityBlocks GUI

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| CBG-101 | Port UIL platform into React/Vite | Recreate `uil_3d.html` (SuperSky, Landscape, GUI scaffolding) inside the modern app shell. | High | @davidcaballero | Research: pmndrs/uil, r3f integration |
| CBG-102 | Center requested building block on the platform | Load the requested footprint mesh and align it to the origin so GUI edits are predictable. | High | @davidcaballero | Needs bounding box utilities |
| CBG-103 | Expose GUI controls for building + environment | Add control groups for material palette, height scaling, lighting/sky toggles, and preset handling. | Medium | @davidcaballero | Look at existing UIL patterns |
| CBG-104 | Extract procedural platform helpers | Break the `uil_3d.html` terrain/platform/sun helpers into modules usable from React. | Medium | @davidcaballero | Focus: helper modularization |
| CBG-105 | Wrap UIL GUI in React | Create a React hook/component that mounts the UIL GUI and syncs state with scene controls. | High | @davidcaballero | Research: React ↔ UIL bridge |
| CBG-106 | Modernize Landscape shader + callbacks | Update shader overrides to match Three r180 and ensure texture callbacks exist so terrain can compile. | High | @davidcaballero | Use latest onBeforeCompile patterns |

## In Progress
| ID | Title | Started | Owner | Notes |
|----|-------|---------|-------|-------|
| CBG-101 | Port UIL platform into React/Vite | 2025-11-09 | @davidcaballero | Vendored UIL helpers and mounted the ProceduralPlatform skeleton in Home.tsx. |
| CBG-102 | Center requested building block on the platform | 2025-11-09 | @davidcaballero | Only the nearest building renders, recentered on the platform origin. |
| CBG-104 | Extract procedural platform helpers | 2025-11-09 | @davidcaballero | Landscape/SuperSky/Water + textures/glsl live in src/lib with TS shims. |
| CBG-106 | Modernize Landscape shader + callbacks | 2025-11-09 | @davidcaballero | Updated Landscape to use Three r180 shader chunks and safe texture callbacks. |
| CBG-105 | Wrap UIL GUI in React | 2025-11-09 | @davidcaballero | UIL slider overlay controls the hero block transforms; projection still pending. |

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|-------------|----------|-------|

## Done
| ID | Title | Completed | Outcome |
|----|-------|-----------|---------|
| CBG-100 | Bootstrap cityblocks-gui initiative | 2025-11-09 | README/tasks/session added so future work has context. |
