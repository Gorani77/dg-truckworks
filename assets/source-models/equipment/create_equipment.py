"""Create one editable equipment asset and its GLB. Not a render/test script.
blender --background --python create_equipment.py -- input-feeder
"""
from pathlib import Path
import sys
import math

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import bpy, scene, root, SOURCE, OUTPUT, box, cylinder, cable, label, empty


def moving(name, p):
    node = empty(name, p)
    node.parent = root
    return node


def base(code, caption, depth=2.7):
    for x in (-1.24, 1.24):
        for z in (-1.22, .77):
            cylinder('Foot', (x, .23, z), .14, .1, 'rubber')
            cylinder('LevelStem', (x, .33, z), .065, .12, 'steel')
    box('CastBase', (0, .54, -.2), (3.0, .4, depth), 'base', .065)
    box('FrontAccessPanel', (0, .56, 1.17), (2.86, .28, .045), 'dark')
    label('Nameplate', f'TW / {code}    {caption}', (-1.28, .53, 1.199), .068, 'white')
    box('Table', (0, .79, .45), (2.82, .2, 1.04), 'rail', .025)
    box('WearPlate', (0, .90, .45), (2.82, .02, 1.04), 'steel', .004)
    for x in (-1.3, 1.3):
        for z in (.04, .86):
            cylinder('TableBolt', (x, .923, z), .025, .014, 'dark', vertices=6)


def console(code, caption, x=1.28, z=1.01):
    cylinder('ConsolePost', (x, 1.2, z-.06), .044, .55, 'dark')
    box('ConsoleHousing', (x, 1.59, z), (.43, .49, .12), 'dark', .025)
    box('ConsoleScreen', (x, 1.67, z+.069), (.34, .23, .012), 'screen', .005)
    label('ConsoleId', f'ST-{code}', (x-.14, 1.70, z+.079), .04, 'white')
    label('ConsoleCaption', caption, (x-.14, 1.63, z+.079), .023, 'white')
    cylinder('StopRing', (x-.07, 1.43, z+.076), .06, .025, 'amber', axis='z')
    cylinder('StopButton', (x-.07, 1.43, z+.099), .035, .025, 'red', axis='z')
    cylinder('SignalStem', (1.3, 2.45, -1.08), .035, .32, 'steel')
    cylinder('SignalLens', (1.3, 2.69, -1.08), .077, .15, 'signal')
    cylinder('SignalCap', (1.3, 2.79, -1.08), .084, .04, 'dark')


def feeder():
    base('01', 'MATERIAL / FEED')
    # Empty magazine: slots do not invent stock or duplicate simulated parts.
    for x in (-1.1, .45):
        for z in (-1.4, -.62):
            box('MagazinePost', (x, 1.38, z), (.095, 2.08, .095), 'rail', .01)
    for y in (.48, .83, 1.18, 1.53, 1.88, 2.23):
        for x in (-1.04, .39):
            box('MagazineShelf', (x, y, -1.01), (.16, .04, .84), 'steel', .005)
        box('MagazineRearStop', (-.325, y+.035, -1.4), (1.5, .09, .045), 'dark', .01)
    box('MagazineCap', (-.325, 2.44, -1.01), (1.73, .12, .93), 'paint', .03)
    label('MagazineLabel', 'EMPTY SLOTS / FEED', (-1.01, 2.43, -.525), .063, 'ink')
    box('LiftTower', (.93, 1.44, -.99), (.29, 2.12, .4), 'paint', .04)
    for x in (.83, 1.03):
        cylinder('LiftGuide', (x, 1.55, -.755), .035, 1.83, 'steel')
    box('OverheadBeam', (.48, 2.52, -.33), (1.15, .18, 2.17), 'dark', .035)
    cable('PowerLoom', [(1.04, .64, -1.28), (1.04, 2.3, -1.28), (.6, 2.51, -1.2)], .022, 'rubber')
    lift = moving('FeedLift', (0, 1.5, .45))
    box('PickupBridge', (0, 1.5, .45), (1.3, .14, .52), 'paint', .025, lift)
    for x in (-.48, .48):
        cylinder('PickupPiston', (x, 1.74, .45), .048, .35, 'steel', parent=lift)
        cylinder('VacuumCup', (x, 1.36, .45), .085, .13, 'rubber', parent=lift)
    for z in (.02, .88):
        box('GuideFence', (0, 1.02, z), (2.35, .1, .035), 'rail', .008)
    console('01', 'FEED')


def drill():
    base('03', 'PRECISION / DRILL')
    box('ColumnPlinth', (0, .92, -1.06), (.96, .4, .62), 'dark', .045)
    box('MachineColumn', (0, 1.78, -1.04), (.69, 1.95, .56), 'paint', .05)
    box('UpperArm', (0, 2.72, -.23), (.88, .31, 2.16), 'dark', .05)
    for x in (-.23, .23):
        box('ColumnGuide', (x, 1.85, -.728), (.065, 1.54, .08), 'steel', .012)
    for y in (1.2, 1.5, 1.8, 2.1, 2.4):
        for x in (-.23, .23):
            cylinder('GuideBolt', (x, y, -.675), .019, .012, 'dark', axis='z', vertices=6)
    # Tool carriage follows the visual hole positions, within the actual frame.
    head = moving('DrillHead', (-.576, 2.05, .45))
    box('CrossSlide', (-.576, 2.36, .45), (.47, .16, .61), 'rail', .02, head)
    box('Motor', (-.576, 2.15, .45), (.37, .4, .4), 'paint', .035, head)
    cylinder('Spindle', (-.576, 1.79, .45), .11, .31, 'steel', parent=head)
    cylinder('Chuck', (-.576, 1.57, .45), .085, .12, 'dark', parent=head)
    cylinder('DrillBit', (-.576, 1.40, .45), .022, .22, 'steel', parent=head, vertices=16)
    for y in (1.34, 1.40, 1.46):
        cylinder('FluteCollar', (-.576, y, .45), .029, .012, 'rail', parent=head, vertices=12)
    for x in (-.94, .94):
        box('FixtureMount', (x, .96, .45), (.2, .1, .85), 'rail')
        cylinder('FixturePin', (x, 1.08, .45), .045, .2, 'steel')
    for name, z in [('DrillClampFront', .98), ('DrillClampBack', -.08)]:
        clamp = moving(name, (0, 0, z))
        for x in (-.67, .67):
            box('Jaw', (x, .98, z), (.24, .13, .08), 'rubber', .01, clamp)
            box('JawActuator', (x, .965, z), (.3, .1, .17), 'rail', .015, clamp)
    for x in (-1.44, 1.44):
        box('GuardPost', (x, 1.6, -.36), (.07, 1.34, .07), 'rail')
        box('GuardPane', (x, 1.64, -.23), (.015, 1.1, 1.34), 'glass', .002)
    cable('CoolantHose', [(.3, 2.6, -.6), (.55, 2.3, -.16), (.55, 1.67, .25)], .025, 'rubber')
    console('03', 'DRILL')


def inspection():
    base('04', 'QUALITY / INSPECTION')
    for x in (-1.28, 1.28):
        box('PortalFoot', (x, .99, -.05), (.35, .19, .8), 'dark', .03)
        box('PortalUpright', (x, 1.8, -.05), (.2, 1.66, .32), 'paint', .03)
        box('PortalInset', (x, 1.8, .125), (.09, 1.28, .025), 'dark', .005)
        box('LightBar', (x*.88, 1.77, .1), (.03, 1.06, .045), 'led', .004)
    box('PortalCrossbeam', (0, 2.64, -.05), (2.88, .24, .4), 'paint', .035)
    label('PortalTitle', 'OPTICAL / INSPECTION', (-.98, 2.62, .164), .09, 'ink')
    box('CameraRail', (0, 2.45, -.04), (2.4, .1, .16), 'rail', .012)
    scanner = moving('Scanner', (0, 2.21, .45))
    box('CameraHousing', (0, 2.25, .45), (.6, .28, .42), 'dark', .035, scanner)
    cylinder('LensBarrel', (0, 2.04, .45), .12, .15, 'steel', parent=scanner)
    cylinder('OpticalLens', (0, 1.958, .45), .087, .013, 'glass', parent=scanner)
    for x in (-.25, .25):
        box('CameraLight', (x, 2.065, .45), (.09, .015, .32), 'led', .004, scanner)
    for z in (-.19, 1.08):
        box('LightGateRail', (0, 1.28, z), (2.6, .045, .035), 'rail', .006)
        for x in (-1.27, 1.27):
            cylinder('LightGatePost', (x, 1.1, z), .026, .35, 'steel')
    sweep = moving('InspectionSweep', (0, 1.055, .15))
    box('ScanStripe', (0, 1.055, .15), (1.9, .008, .016), 'led', .001, sweep)
    cable('CameraCable', [(.85, .7, -1.1), (.85, 2.5, -1.1), (0, 2.5, -.32)], .021, 'rubber')
    console('04', 'INSPECT')


def sorter():
    base('05', 'SORT / STORAGE')
    # Chutes and bins follow partPosition's existing destinations exactly.
    cylinder('DiverterBase', (.15, .84, .45), .4, .1, 'dark')
    arm = moving('Diverter', (.15, .96, .45))
    box('RoutingGuide', (.15, .96, .45), (1.15, .09, .11), 'amber', .015, arm)
    cylinder('PivotCap', (.15, 1.025, .45), .085, .04, 'steel', parent=arm)
    for side in (-1, 1):
        # Slope from (0,.91,.45) to (1,.38,.45+side*1.9).
        for index in range(7):
            p = (index+1)/8
            cylinder('ChuteRoller', (p, .86-.53*p, .45+side*1.9*p), .035, 1.95, 'steel', axis='x')
        for x_offset in (-.96, .96):
            cable('ChuteSideRail', [(x_offset, .91, .45), (1+x_offset, .38, .45+side*1.9)], .028, 'rail')
        z = .45+side*1.9
        box('StorageTray', (1, .29, z), (2.12, .18, 1.06), 'dark', .035)
        for x in (-.08, 2.08):
            box('TrayEndWall', (x, .49, z), (.065, .55, 1.06), 'paint', .012)
        for edge in (-.52, .52):
            box('TraySideWall', (1, .49, z+edge), (2.14, .55, .055), 'paint', .012)
        box('BinAccent', (1, .68, z+.558), (1.92, .06, .016), 'rail' if side < 0 else 'amber', .003)
        label('BinLabel', 'GOOD / STORAGE' if side < 0 else 'REJECT / HOLD', (.24, .5, z+.553), .09, 'ink')
        for x in (.13, 1.87):
            cylinder('TrayFoot', (x, .18, z), .075, .1, 'rubber')
    # rear motor cover stays outside both part routing paths
    box('DriveEnclosure', (-.9, 1.06, -.65), (.67, .71, .51), 'paint', .04)
    for y in (.86, .95, 1.04, 1.13, 1.22):
        box('MotorVent', (-.9, y, -.38), (.46, .025, .018), 'rubber', .003)
    console('05', 'SORT', x=-1.28, z=1.01)


BUILDERS = {'input-feeder': feeder, 'drilling-station': drill, 'inspection-gate': inspection, 'sorting-storage': sorter}
key = sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else ''
if key not in BUILDERS:
    raise SystemExit('Choose: ' + ', '.join(BUILDERS))
root.name = key.replace('-', '_')
BUILDERS[key]()
source_dir = SOURCE / key
output_dir = OUTPUT / key
source_dir.mkdir(parents=True, exist_ok=True)
output_dir.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(source_dir / f'{key}.blend'))
groups = {}
for obj in list(scene.objects):
    if obj.type == 'MESH':
        groups.setdefault((obj.parent.name, obj.data.materials[0].name), []).append(obj)
for (parent, mat), objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    bpy.context.object.name = f'{parent}_{mat}'
bpy.ops.export_scene.gltf(filepath=str(output_dir / f'{key}.glb'), export_format='GLB', export_yup=True,
    export_apply=True, export_animations=False, export_cameras=False, export_lights=False, export_extras=True)
print(f'Created {key}.blend and {key}.glb. User visual/runtime verification pending.')
