"""Shared Blender authoring helpers for TruckWorks equipment; no rendering or tests.

Run with Blender --background --python this_file.py.
Positions below use the application's X-right, Y-up, Z-front coordinates.
The exporter converts Blender Z-up back to glTF Y-up.
"""
from pathlib import Path
import math

import bpy


ROOT = Path(__file__).resolve().parents[3]
SOURCE = Path(__file__).resolve().parent
OUTPUT = ROOT / 'frontend' / 'public' / 'models'
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


root = empty('Equipment')
root['asset_version'] = '1.0.0'
root['purpose'] = 'TruckWorks schematic production equipment, not an industrial CAD replica'
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



