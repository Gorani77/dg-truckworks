# Factory world source assets

Self-authored Blender scenery and production parts for TruckWorks. No external asset licenses or textures are required. The shared helpers/materials are imported from ../equipment/common.py; application coordinates are X-right, Y-up, Z-front, converted to Blender and exported back to glTF Y-up.

The authoring script writes a separate editable .blend before merging meshes by parent/material for each GLB. Material groups retain authored bevels and normals; app instances share geometry and static materials. Chassis quality materials are cloned per displayed part.

## Recreate a single asset

Run in PowerShell (file authoring/export, not a render or app test):

```powershell
& 'C:\Users\sp287\.codex\tools\blender\blender-4.5.3-windows-x64\blender.exe' --background --factory-startup --python-exit-code 1 --python 'C:\project\truckworks\assets\source-models\factory-world\create_factory_world.py' -- factory-hall
```

Replace the final name with storage-racks, assembly-display, line-deck, roller-conveyor, station-plinth, queue-pallet, chassis-raw, chassis-formed or chassis-drilled. This overwrites that generated asset; preserve manual .blend edits separately before regenerating. The script runs in a separate background process and does not modify an open Blender editor.

## Coordinate contracts

- factory-hall is at scene origin; storage-racks at (-9,0,-10), assembly-display at (7,0,-10).
- line-deck nominal width23, scaled horizontally to the current station count. Top surface near Y0.
- roller-conveyor origin is the midpoint between stations, rollers at Y.85 with radius.06, product route Z.45. Nominal segment length1.3.
- station-plinth top near Y.17. queue-pallet placed at Z1.4 with nominal deck topY.25; width/depth follow configured product dimensions.
- Chassis centered at origin, nominal X1.8/Y.12/Z.6 (180/12/60 mm). FRAME/DRILLED keep two rails/three cross-members. Holes are boolean geometry, not dark dots.
- Scenery contains no simulated stock. Assembly truck is display-only; no assembly engine is introduced.
- Dynamic status colors, selection, progress and evidence overlays remain application UI.

Creation/export succeeded for all ten assets on 2026-10-11. Visual/runtime/performance confirmation belongs to the user; see docs/FACTORY_WORLD_ASSETS.md and docs/MODELING_CHECKPOINT.md.
