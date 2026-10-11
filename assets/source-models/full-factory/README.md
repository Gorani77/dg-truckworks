# Full factory Blender assets

2026-10-11. Static schematic full-factory visual masterplan. See docs/FULL_FACTORY_MASTERPLAN.md for scope and manual checks.

create_full_factory.py uses ../equipment/common.py. Coordinates use application X-right/Y-up/Z-front; glTF exporter writes Y-up. Each command creates one editable .blend and a material-batched .glb. No animation, rendering, simulation, inventory or measurements are generated.

Example (PowerShell, from C:\project\truckworks):

```powershell
& 'C:\Users\sp287\.codex\tools\blender\blender-4.5.3-windows-x64\blender.exe' --background --python assets/source-models/full-factory/create_full_factory.py -- axle-cell
```

Keys: campus-ground, axle-cell, cab-finishing, final-assembly, trailer-cell, vehicle-inspection, dispatch-yard, proving-ground.

Source: ./<key>/<key>.blend. Runtime: frontend/public/models/<key>/<key>.glb. Preserve manual edits before rerunning a builder; it replaces that asset's files. Other existing assets are not regenerated. Authoring logs record the export process, not runtime or visual validation. Vehicles and stock-like props are exhibitions only.
