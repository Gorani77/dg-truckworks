"""Author the factory surroundings and products; creates files, does not render."""
from pathlib import Path
import sys
import math
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'equipment'))
from common import bpy, scene, root, M, material, box, cylinder, cable, label, xyz, OUTPUT

SOURCE = Path(__file__).resolve().parent
M['concrete'] = material('Concrete_Satin', '303a42', .05, .88)
M['floor'] = material('Epoxy_Floor', '25323c', .12, .67)
M['seam'] = material('Expansion_Joint', '18232c', .1, .9)
M['blue'] = material('Cab_Enamel', '667e8d', .4, .3)
M['product'] = material('Product_Metal', 'b9c8d1', .78, .3)
M['wood'] = material('Pallet_Composite', '706457', .0, .88)


def bolt(p, axis='y', radius=.025):
    cylinder('HexBolt', p, radius, .025, 'steel', axis=axis, vertices=6)


def foot(x, z, top=.75):
    cylinder('LevellingFoot', (x, .07, z), .12, .1, 'rubber')
    cylinder('ThreadedStem', (x, .16, z), .036, .14, 'steel')
    box('SquareLeg', (x, (top+.2)/2, z), (.1, top-.2, .1), 'dark', .012)


def hall():
    box('Foundation', (0, -.39, -3), (35, .56, 25), 'base', .08)
    box('FloorFinish', (0, -.13, -3), (34.9, .04, 24.9), 'concrete', .004)
    for x in range(-15, 16, 5):
        box('FloorJoint', (x, -.107, -3), (.018, .004, 24.6), 'seam', 0)
    for z in range(-13, 9, 4):
        box('FloorJoint', (0, -.107, z), (34.6, .004, .018), 'seam', 0)
    for z in (-6, -5.5):
        box('WalkwayLine', (0, -.098, z), (32, .008, .045), 'amber', .002)
    for x in range(-15, 16, 3):
        box('WalkwayDash', (x, -.092, -5.75), (.45, .009, .035), 'white', .002)
    # Cutaway shell: low walls and rear services leave all camera paths open.
    box('BackWall', (0, .6, -15.35), (34.8, 1.4, .2), 'paint', .025)
    box('LeftWall', (-17.35, .6, -3), (.2, 1.4, 24.4), 'paint', .025)
    box('WallSkirting', (0, .12, -15.2), (34.8, .32, .09), 'dark', .012)
    for x in range(-16, 17, 4):
        box('WallPanelSeam', (x, .7, -15.238), (.022, 1.18, .015), 'rail', .002)
    for x in (-16, -8, 0, 8, 16):
        box('ColumnWeb', (x, 1.38, -14.8), (.14, 2.96, .24), 'dark', .015)
        for z in (-14.94, -14.66):
            box('ColumnFlange', (x, 1.38, z), (.34, 2.96, .07), 'rail', .01)
        box('ColumnFoot', (x, -.035, -14.8), (.58, .15, .58), 'steel', .025)
        for dx in (-.21, .21):
            bolt((x+dx, .052, -14.59))
        box('LampHousing', (x, 2.75, -14.45), (1.5, .12, .25), 'dark')
        box('LampDiffuser', (x, 2.68, -14.42), (1.36, .022, .2), 'led', .004)
    for y, mat in ((1.65, 'rail'), (1.92, 'dark')):
        cable('ServicePipe', [(-16.4,y,-14.8),(-16.4,y,-14.43),(16.4,y,-14.43)], .065, mat)
        for x in range(-16,17,4):
            box('PipeBracket', (x,y,-14.62), (.09,.21,.38), 'steel', .008)
    for x in (-15, 14.7):
        box('ElectricalCabinet', (x,.74,-14.04), (1.0,1.5,.5), 'dark', .035)
        box('CabinetDoor', (x,.76,-13.775), (.9,1.35,.035), 'paint', .01)
        box('DoorHandle', (x+.3,.85,-13.73), (.035,.25,.045), 'rubber', .006)
        for y in (.28,.36,.44):
            box('CabinetVent', (x,y,-13.75), (.62,.018,.012), 'base', .002)
        label('ServiceLabel', 'POWER', (x-.25,1.18,-13.746), .12,'ink')
    cylinder('Extinguisher', (-16.6,.62,-8), .13,.72,'red')
    cylinder('ExtinguisherValve', (-16.6,1.03,-8), .045,.12,'steel')
    cable('ExtinguisherHose', [(-16.6,1.04,-8),(-16.35,.98,-8),(-16.35,.45,-8)], .022,'rubber')
    for x in (-14.5, 14.5):
        for z in (-6.65, -4.9):
            cylinder('SafetyBollard', (x,.31,z), .085,.78,'amber')
            cylinder('BollardCollar', (x,.48,z), .089,.15,'rubber')
            box('BollardBase', (x,-.03,z), (.3,.12,.3),'base')


def storage():
    box('StorageDeck', (0,-.04,0), (10,.1,6),'floor')
    for x in (-4.8,4.8):
        box('StorageBoundary', (x,.014,0), (.045,.008,5.7),'amber',.002)
    for center in (-3,0,3):
        for x in (center-1.06,center+1.06):
            for z in (-1.7,-.3):
                box('RackUpright', (x,1.2,z), (.11,2.4,.11),'dark',.012)
                box('RackFoot', (x,.05,z), (.3,.09,.3),'steel')
                for y in (.45,.8,1.35,1.7,2.18):
                    box('UprightSlot',(x,y,z+.06),(.025,.045,.008),'rubber',.001)
        for y in (.17,1.2,2.25):
            box('ShelfPanel',(center,y,-1),(2.2,.06,1.6),'rail',.008)
            for z in (-1.79,-.21):
                box('ShelfBeam',(center,y-.06,z),(2.28,.15,.075),'amber',.008)
            for x in (center-.95,center+.95):
                bolt((x,y-.06,-.163),'z')
        cable('RackDiagonal',[(center-1, .2,-1.73),(center+1,2.25,-1.73)],.026,'steel')
        cable('RackDiagonal',[(center+1, .2,-1.73),(center-1,2.25,-1.73)],.026,'steel')
        box('ShelfTag',(center,1.12,-.162),(.5,.11,.012),'white',.002)
        label('RackLabel','RACK '+str(int((center+3)/3)+1),(center-.2,1.085,-.152),.07,'ink')
    # Empty handling trolley, no invented stock.
    box('TrolleyTray',(3,.3,1.45),(1.8,.12,.95),'rail')
    for x in (2.3,3.7):
        for z in (1.12,1.78):
            cylinder('TrolleyWheel',(x,.12,z),.12,.08,'rubber',axis='z')
    cable('TrolleyHandle',[(3.82,.3,1.06),(3.82,1.05,1.06),(3.82,1.05,1.84),(3.82,.3,1.84)],.035,'dark')


def assembly():
    box('AssemblyDeck',(0,-.04,0),(13,.1,6),'floor')
    box('ExhibitPlinth',(0,.17,0),(6,.34,3),'base',.06)
    box('PlinthCap',(0,.355,0),(5.9,.03,2.9),'rail',.006)
    for x in (-2.85,2.85):
        box('ExhibitEdge',(x,.38,0),(.035,.012,2.85),'amber',.002)
    # Display truck, not a simulated product or stock item.
    for z in (-.53,.53):
        box('TruckFrame',(0,.99,z),(4.65,.16,.14),'dark')
    for x in (-1.3,0,.9,1.8):
        box('TruckCrossMember',(x,.98,0),(.16,.15,1.15),'rail')
    box('CabLower',(-1.55,1.34,0),(1.4,.56,1.5),'blue',.09)
    box('CabRoof',(-1.55,2.13,0),(1.43,.12,1.55),'blue',.06)
    box('CabRear',(-.89,1.83,0),(.12,.55,1.5),'blue',.025)
    box('Windshield',(-2.21,1.83,0),(.04,.47,1.29),'screen',.015)
    for z in (-.72,.72):
        for x in (-2.2,-.94):
            box('CabPillar',(x,1.82,z),(.08,.56,.075),'blue',.01)
        box('SideWindow',(-1.57,1.84,z),(1.14,.42,.025),'screen',.02)
        box('DoorHandle',(-1.06,1.52,z*1.065),(.17,.035,.045),'steel',.005)
        cable('MirrorBracket',[(-2.15,1.69,z),(-2.36,1.74,z*1.35)],.022,'dark')
        box('Mirror',(-2.36,1.81,z*1.35),(.09,.24,.13),'dark')
        box('CabStep',(-1.4,.97,z*1.15),(.68,.08,.23),'steel')
    box('FrontBumper',(-2.34,1.06,0),(.13,.17,1.62),'steel')
    box('FrontGrille',(-2.268,1.34,0),(.035,.25,.68),'rubber',.004)
    for y in (1.26,1.34,1.42):
        box('GrilleSlat',(-2.293,y,0),(.024,.023,.65),'rail',.002)
    for z in (-.53,.53):
        box('Headlamp',(-2.278,1.36,z),(.032,.15,.22),'led',.012)
    for x in (-1.5,.7,1.65):
        cylinder('Axle',(x,.77,0),.085,1.9,'steel',axis='z')
        for side in (-1,1):
            z=side*.85
            cylinder('Tyre',(x,.77,z),.39,.25,'rubber',axis='z',vertices=32)
            cylinder('Rim',(x,.77,z+side*.14),.235,.035,'rail',axis='z')
            cylinder('Hub',(x,.77,z+side*.165),.09,.055,'dark',axis='z')
            for a in range(6):
                angle=a*math.tau/6
                bolt((x+math.cos(angle)*.16,.77+math.sin(angle)*.16,z+side*.168),'z',.018)
            for offset in (-.065,.065):
                cylinder('TreadBand',(x,.77,z+offset),.395,.025,'base',axis='z',vertices=32)
    box('RearBed',(1.0,1.16,0),(2.55,.14,1.48),'rail')
    for z in (-.7,.7):
        box('BedSide',(1,1.4,z),(2.6,.35,.065),'blue')
    box('Tailgate',(2.28,1.4,0),(.07,.35,1.48),'blue')
    label('ExhibitLabel','TRUCK / CONCEPT DISPLAY',(-1.85,.15,1.508),.16,'white')
    # Bench and tool cabinet sit behind the display, outside the navigation label.
    for x in (-2.1,2.1):
        foot(x,-2.3,.92)
    box('Workbench',(0,.95,-2.3),(4.6,.15,.72),'wood')
    box('ToolChest',(4.5,.59,-.9),(1.55,1.1,.95),'dark',.035)
    for y in (.22,.43,.64,.85):
        box('DrawerFront',(4.5,y,-.411),(1.4,.18,.028),'paint',.008)
        box('DrawerPull',(4.5,y,-.375),(.75,.025,.045),'rail',.004)


def line_deck():
    box('LineFoundation',(0,-.05,0),(23,.1,10.8),'base',.03)
    box('LineEpoxy',(0,.002,0),(22.96,.006,10.76),'floor',.001)
    for z in (-4.9,4.9):
        box('LineBoundary',(0,.01,z),(22.4,.009,.045),'amber',.001)
    for x in range(-10,11,2):
        box('ExpansionJoint',(x,.006,0),(.012,.003,9.7),'seam',0)
    for x in (-10.9,10.9):
        for z in (-4.6,4.6):
            box('FloorCorner',(x,.013,z),(.35,.009,.05),'white',.001)


def conveyor():
    for z in (-.1,1):
        box('ConveyorRail',(0,.78,z),(1.3,.16,.1),'dark',.015)
        box('RailCap',(0,.872,z),(1.3,.025,.11),'steel',.004)
        for x in (-.52,.52):
            bolt((x,.78,z+.056),'z')
    for i in range(7):
        cylinder('Roller',(-.54+i*.18,.85,.45),.06,1.02,'steel',axis='z')
    for x in (-.46,.46):
        for z in (0,.9):
            foot(x,z,.73)
        box('CrossBrace',(x,.32,.45),(.08,.08,.9),'rail')
    box('DriveMotor',(0,.57,-.25),(.46,.27,.3),'dark',.04)
    cylinder('MotorCap',(.26,.57,-.25),.12,.09,'rail',axis='x')
    cable('MotorCable',[(0,.5,-.32),(.38,.32,-.32),(.46,.2,-.1)],.025,'rubber')


def plinth():
    box('EquipmentPlinth',(0,.08,-.15),(3.5,.16,3.6),'base',.04)
    box('PlinthTop',(0,.165,-.15),(3.42,.01,3.52),'dark',.002)
    for x in (-1.57,1.57):
        for z in (-1.78,1.48):
            bolt((x,.18,z),radius=.038)
    for x in (-1.45,1.45):
        box('FrontSafetyMark',(x,.177,1.51),(.3,.012,.08),'amber',.002)


def queue_pallet():
    # Origin is deck center; top .25 matches queued-part coordinates.
    box('QueueBase',(0,.20,0),(1.92,.06,.7),'dark',.008)
    for x in (-.83,.83):
        box('PalletRunner',(x,.175,0),(.12,.08,.7),'rubber',.008)
    for z in (-.29,0,.29):
        box('PalletSlat',(0,.24,z),(1.88,.02,.11),'rail',.004)
    for x in (-.83,.83):
        bolt((x,.26,.29),radius=.016)


def product(stage):
    if stage == 'raw':
        box('RawBlank',(0,0,0),(1.8,.12,.6),'product',.009)
        return
    for z in (-.26,.26):
        rail=box('ChassisRail',(0,0,z),(1.8,.12,.08),'product',.005)
        if stage == 'drilled':
            for x in (-.576,.27,.612):
                bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.0264,depth=.16,location=xyz((x,0,z)))
                cutter=bpy.context.object
                cutter.rotation_euler[0]=math.pi/2
                bpy.context.view_layer.objects.active=rail
                modifier=rail.modifiers.new('Axle mounting hole','BOOLEAN')
                modifier.operation='DIFFERENCE'
                modifier.object=cutter
                bpy.ops.object.modifier_apply(modifier=modifier.name)
                bpy.data.objects.remove(cutter,do_unlink=True)
    for x in (-.63,0,.63):
        box('CrossMember',(x,0,0),(.08,.12,.44),'product',.004)


BUILDERS={'factory-hall':hall,'storage-racks':storage,'assembly-display':assembly,
          'line-deck':line_deck,'roller-conveyor':conveyor,'station-plinth':plinth,
          'queue-pallet':queue_pallet,'chassis-raw':lambda:product('raw'),
          'chassis-formed':lambda:product('formed'),'chassis-drilled':lambda:product('drilled')}
key=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else ''
if key not in BUILDERS:
    raise SystemExit('Choose: '+', '.join(BUILDERS))
root.name=key.replace('-','_')
root['purpose']='TruckWorks factory scenery or schematic product; no simulated inventory in scenery'
BUILDERS[key]()
source_dir=SOURCE/key
output_dir=OUTPUT/key
source_dir.mkdir(parents=True,exist_ok=True)
output_dir.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(source_dir/f'{key}.blend'))
groups={}
for obj in list(scene.objects):
    if obj.type=='MESH':
        groups.setdefault((obj.parent.name,obj.data.materials[0].name),[]).append(obj)
for (parent,mat),objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:
        bpy.ops.object.join()
    bpy.context.object.name=f'{parent}_{mat}'
bpy.ops.export_scene.gltf(filepath=str(output_dir/f'{key}.glb'),export_format='GLB',export_yup=True,
    export_apply=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
print(f'AUTHORED {key}: blend and GLB saved; visual/runtime confirmation pending')
