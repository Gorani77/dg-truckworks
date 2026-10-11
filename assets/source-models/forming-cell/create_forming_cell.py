"""Author the TruckWorks ST-02 hero asset in Blender; no rendering or tests.

Run with Blender --background --python this_file.py.
Positions below use the application's X-right, Y-up, Z-front coordinates.
The exporter converts Blender Z-up back to glTF Y-up.
"""
from pathlib import Path
import math

import bpy


ROOT = Path(__file__).resolve().parents[3]
SOURCE = Path(__file__).resolve().parent
OUTPUT = ROOT / 'frontend' / 'public' / 'models' / 'forming-cell'
OUTPUT.mkdir(parents=True, exist_ok=True)

# A fresh authoring scene in this background process, not the user's open file.
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
# Export numerically identical application units; product mm are UI metadata.
scene.unit_settings.scale_length = 1.0
bpy.context.preferences.filepaths.save_version = 0


def xyz(p):
    return (p[0], -p[2], p[1])


def material(name, color, metal=0.0, rough=0.5, alpha=1.0, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    # Convert design sRGB swatches to Blender's linear color inputs.
    def linear(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    rgb = tuple(linear(int(color[i:i + 2], 16) / 255) for i in (0, 2, 4))
    bsdf.inputs['Base Color'].default_value = (*rgb, alpha)
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Alpha'].default_value = alpha
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*rgb, 1)
        bsdf.inputs['Emission Strength'].default_value = emission
    mat.diffuse_color = (*rgb, alpha)
    if alpha < 1:
        mat.surface_render_method = 'DITHERED'
        mat.use_backface_culling = True
    return mat


M = {
    'paint': material('Enamel_Pearl', 'c4ccd0', .24, .32),
    'dark': material('Enamel_Graphite', '303e48', .3, .38),
    'base': material('Cast_Base', '1e2a33', .5, .52),
    'steel': material('Machined_Steel', 'aebcc5', .85, .25),
    'rail': material('Brushed_Aluminium', '8398a6', .78, .34),
    'rubber': material('Rubber_Seal', '141c22', .0, .86),
    'amber': material('Safety_Amber', 'e5b45b', .2, .37),
    'glass': material('Safety_Polycarbonate', '83b7c9', .05, .18, .16),
    'screen': material('Display_Glass', '193b48', .1, .24),
    'ink': material('Label_Ink', '25313b', .0, .68),
    'white': material('Label_White', 'dfe8eb', .0, .55),
    'led': material('Work_Light', 'd8e9f2', .0, .3, emission=1.8),
    'signal': material('Status_Lens', '65727a', .1, .25),
    'red': material('Emergency_Stop', 'bc4d42', .0, .48),
}


def empty(name, p=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    obj.location = xyz(p)
    bpy.context.view_layer.update()
    return obj


root = empty('FormingCell')
root['asset_version'] = '1.0.0'
root['purpose'] = 'Schematic ST-02 forming machine, not a real CNC or CAD replica'
root['part_surface_height'] = 0.91


def finish(obj, name, mat, bevel=0, parent=None):
    obj.name = name
    obj.data.materials.append(M[mat])
    if bevel:
        modifier = obj.modifiers.new('Manufactured edges', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    modifier = obj.modifiers.new('Weighted surface normals', 'WEIGHTED_NORMAL')
    modifier.keep_sharp = True
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    # The authored coordinates are world coordinates. Preserve their transform
    # while assigning the rigid-part hierarchy used by the application.
    world = obj.matrix_world.copy()
    obj.parent = parent or root
    obj.matrix_world = world
    return obj


def box(name, p, size, mat, bevel=.02, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
    obj = bpy.context.object
    obj.dimensions = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, min(bevel, min(size) * .2), parent)


def cylinder(name, p, radius, length, mat, axis='y', parent=None, vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=length, location=xyz(p))
    obj = bpy.context.object
    if axis == 'x':
        obj.rotation_euler[1] = math.pi / 2
    elif axis == 'z':
        obj.rotation_euler[0] = math.pi / 2
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, .008, parent)


def cable(name, points, radius, mat, parent=None):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for point, p in zip(spline.points, points):
        point.co = (*xyz(p), 1)
    obj = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    return finish(bpy.context.object, name, mat, parent=parent)


def label(name, text, p, size, mat, parent=None):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = text
    curve.size = size
    curve.extrude = .0005
    curve.resolution_u = 4
    obj = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(obj)
    obj.location = xyz(p)
    obj.rotation_euler[0] = math.pi / 2  # text faces application +Z
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    return finish(bpy.context.object, name, mat, parent=parent)


# Leveling feet, cast foundation and a replaceable machined bed.
for x in (-1.25, 1.25):
    for z in (-1.35, .7):
        cylinder('LevelingPad', (x, .23, z), .16, .1, 'rubber')
        cylinder('LevelingStem', (x, .34, z), .07, .15, 'steel')
box('Foundation', (0, .55, -.25), (3.08, .42, 2.72), 'base', .07)
box('FrontServicePanel', (0, .57, 1.12), (2.96, .31, .05), 'dark')
box('TableCasting', (0, .78, .45), (2.84, .18, 1.1), 'rail', .035)
box('TableTop', (0, .89, .45), (2.82, .04, 1.06), 'steel', .006)
for z in (.02, .12, .78, .88):
    box('TSlot', (0, .912, z), (2.6, .006, .022), 'rubber', .001)
for x in (-1.31, 1.31):
    for z in (.02, .88):
        cylinder('TableBolt', (x, .922, z), .027, .012, 'dark', vertices=6)

# Split cladding and the open-front cutaway keep the real simulated part visible.
box('BackCabinet', (0, 1.53, -1.52), (3.04, 1.72, .38), 'paint', .045)
box('BackInset', (0, 1.65, -1.31), (2.42, 1.23, .035), 'dark', .014)
for x in (-1.46, 1.46):
    box('SideSkirt', (x, 1.12, -.25), (.14, .38, 2.28), 'paint')
    box('Upright', (x, 1.79, -.84), (.18, 1.6, .25), 'paint', .03)
    box('SideHeader', (x, 2.58, -.25), (.18, .15, 2.28), 'dark')
box('RearTopCap', (0, 2.48, -1.5), (3.18, .18, .58), 'dark', .04)
box('FrontHeader', (0, 2.62, .86), (3.12, .18, .2), 'paint', .025)
box('HeaderAccent', (0, 2.54, .98), (2.8, .045, .024), 'amber', .006)
label('StationMark', 'TW / 02', (-1.32, 2.61, .967), .095, 'ink')
label('MachineMark', 'FRAME / FORMING CELL', (-.46, 2.61, .967), .067, 'ink')
label('ServiceMark', 'TRUCKWORKS   /   ST-02', (-1.27, .53, 1.154), .065, 'white')

# Side windows; the frontal section is intentionally open for demonstration.
for x in (-1.455, 1.455):
    # Frame bars, not a solid opaque backing behind the transparent pane.
    for y in (1.27, 2.37):
        box('WindowFrame', (x, y, -.16), (.06, .055, 1.72), 'rail', .008)
    for z in (-1.0, .68):
        box('WindowFrame', (x, 1.82, z), (.06, 1.1, .055), 'rail', .008)
    box('SafetyWindow', (x, 1.82, -.16), (.012, 1.03, 1.62), 'glass', .001)
for z in (-.97, .64):
    for y in (1.3, 2.34):
        cylinder('WindowFastener', (1.496, y, z), .025, .016, 'steel', axis='x', vertices=6)

# Rear ventilation, electrical conduit and work lamps.
for index in range(9):
    box('VentLouvre', (.92, 1.26 + index * .067, -1.318), (.46, .028, .022), 'rubber', .003)
cable('PowerConduit', [(-1.24, .72, -1.25), (-1.24, 1.7, -1.25), (-.92, 2.13, -1.25), (.68, 2.13, -1.25)], .022, 'rubber')
for x in (-.85, .85):
    box('LightHousing', (x, 2.34, -.96), (.65, .055, .15), 'base', .01)
    box('WorkStrip', (x, 2.307, -.96), (.56, .016, .1), 'led', .002)
for x in (-1.34, 1.34):
    for y in (1.08, 2.23):
        cylinder('CabinetBolt', (x, y, -1.3), .023, .015, 'steel', axis='z', vertices=6)

# Rigid motion groups retain stable names in GLB. Their transforms are driven
# by server progress in formingCellMotion.ts, not a free-running animation clip.
carriage = empty('CarriageX', (-.7, 0, 0))
carriage.parent = root
for y in (1.94, 2.23):
    box('LinearRail', (0, y, -.7), (2.6, .085, .1), 'steel', .012)
    for x in (-1.1, -.55, 0, .55, 1.1):
        cylinder('RailScrew', (x, y, -.637), .018, .012, 'dark', axis='z', vertices=6)
box('CarriagePlate', (-.7, 2.08, -.59), (.62, .52, .16), 'rail', .02, carriage)
box('SpindleArm', (-.7, 2.17, -.01), (.38, .22, 1.02), 'dark', .03, carriage)
slide = empty('SpindleSlide', (-.7, 2.05, .45))
world = slide.matrix_world.copy()
slide.parent = carriage
slide.matrix_world = world
box('MotorHousing', (-.7, 2.05, .45), (.42, .43, .44), 'paint', .045, slide)
for x in (-.85, -.75, -.65, -.55):
    box('MotorFin', (x, 2.27, .45), (.035, .04, .32), 'rail', .006, slide)
cylinder('SpindleBody', (-.7, 1.73, .45), .115, .25, 'steel', parent=slide)
cylinder('Collet', (-.7, 1.54, .45), .083, .12, 'dark', parent=slide)
cylinder('Cutter', (-.7, 1.41, .45), .031, .18, 'steel', parent=slide, vertices=16)
cable('HeadCable', [(-.7, 2.28, .36), (-.7, 2.4, .1), (-.7, 2.4, -.52)], .025, 'rubber', carriage)

for name, z in [('ClampFront', .98), ('ClampBack', -.08)]:
    clamp = empty(name, (0, 0, z))
    clamp.parent = root
    for x in (-.64, .64):
        box('ClampBody', (x, .96, z), (.27, .1, .17), 'rail', .015, clamp)
        box('ClampPad', (x, .985, z), (.22, .12, .055), 'rubber', .008, clamp)
        cylinder('ClampScrew', (x, 1.035, z), .032, .035, 'steel', parent=clamp, vertices=6)

# A parked sliding safety door on the rear side: demonstrator cutaway, not an
# assertion that this is a physically safe real-world operating enclosure.
box('DoorTrack', (0, 2.48, -1.17), (2.68, .045, .07), 'steel', .008)
box('ParkedDoor', (-.95, 1.7, -1.16), (.45, 1.28, .045), 'paint', .02)
cable('DoorHandle', [(-.88, 1.47, -1.09), (-.88, 1.47, -1.02), (-.88, 1.86, -1.02), (-.88, 1.86, -1.09)], .022, 'rubber')

# Operator panel on the front-right, clear of the through-flow and queue.
cylinder('ConsolePost', (1.33, 1.3, .98), .05, .65, 'dark')
box('ConsoleShell', (1.3, 1.78, .94), (.48, .62, .13), 'dark', .035)
box('ConsoleBezel', (1.3, 1.89, 1.015), (.39, .3, .03), 'rubber', .015)
box('ConsoleScreen', (1.3, 1.89, 1.037), (.33, .23, .012), 'screen', .006)
label('ScreenTitle', 'ST-02', (1.16, 1.94, 1.048), .041, 'white')
label('ScreenCaption', 'FORMING', (1.16, 1.85, 1.048), .027, 'white')
cylinder('StopSurround', (1.18, 1.62, 1.03), .068, .022, 'amber', axis='z')
cylinder('StopButton', (1.18, 1.62, 1.052), .043, .027, 'red', axis='z')
cylinder('Selector', (1.43, 1.62, 1.04), .035, .04, 'steel', axis='z')
cylinder('SignalStem', (1.28, 2.76, -.95), .04, .36, 'steel')
cylinder('SignalLens', (1.28, 3.0, -.95), .085, .16, 'signal')
cylinder('SignalCap', (1.28, 3.1, -.95), .093, .04, 'dark')

# Collapse non-moving mesh pieces by material and rigid parent to avoid a draw
# call per bolt. Keep the editable Blender scene separate from the web export.
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / 'forming-cell.blend'))
groups = {}
for obj in list(scene.objects):
    if obj.type == 'MESH':
        mat = obj.data.materials[0]
        groups.setdefault((obj.parent.name, mat.name), []).append(obj)
for (parent_name, mat_name), objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    bpy.context.object.name = f'{parent_name}_{mat_name}'

bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT / 'forming-cell.glb'), export_format='GLB',
    export_yup=True, export_apply=True, export_animations=False,
    export_cameras=False, export_lights=False, export_extras=True,
)
print('Created editable forming-cell.blend and web forming-cell.glb; visual validation not performed.')
