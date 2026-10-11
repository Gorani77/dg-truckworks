"""Full factory visual masterplan. Author/save/export only; no rendering or runtime tests."""
from pathlib import Path
import sys, math
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'equipment'))
from common import bpy, scene, root, M, material, box, cylinder, cable, label, OUTPUT
SOURCE = Path(__file__).resolve().parent
M['floor'] = material('Workshop_Epoxy', '33434b', .12, .7)
M['road'] = material('Road_Asphalt', '222b30', .02, .92)
M['blue'] = material('Truck_Petrol', '587f89', .45, .3)
M['green'] = material('Landscape', '374b41', .0, .95)
M['wood'] = material('Packing_Plywood', '89775b', 0, .85)


def deck(title, width=18, depth=12):
    box('CellFoundation', (0,-.06,0), (width,.12,depth), 'base', .035)
    box('Epoxy', (0,.006,0), (width-.08,.012,depth-.08), 'floor', .003)
    for x in (-width/2+.35,width/2-.35):
        box('SafetyEdge',(x,.018,0),(.04,.008,depth-.6),'amber',.001)
    for z in (-depth/2+.35,depth/2-.35):
        box('SafetyEdge',(0,.018,z),(width-.6,.008,.04),'amber',.001)
    box('IdentificationPlaque',(0,.4,depth/2-.1),(7,.7,.08),'dark')
    label('CellName',title,(-3.2,.26,depth/2-.052),.25,'white')


def cabinet(x,z):
    box('ControlCabinet',(x,.8,z),(1.1,1.6,.65),'paint',.04)
    box('DisplayBezel',(x,1.18,z+.34),(.75,.48,.04),'rubber')
    box('Touchscreen',(x,1.18,z+.367),(.65,.37,.015),'screen',.006)
    for dx,mat in ((-.3,'red'),(0,'signal'),(.3,'signal')):
        cylinder('ControlButton',(x+dx,.76,z+.37),.05,.045,mat,axis='z')
    for y in (.2,.28,.36): box('Vent',(x,y,z+.34),(.75,.018,.012),'dark',.001)
    box('DoorHandle',(x+.42,.58,z+.36),(.03,.2,.04),'steel')


def table(x,z,width=3,depth=2):
    for dx in (-width/2+.18,width/2-.18):
        for dz in (-depth/2+.18,depth/2-.18):
            box('BenchLeg',(x+dx,.48,z+dz),(.13,.9,.13),'dark')
            cylinder('AdjustableFoot',(x+dx,.06,z+dz),.13,.08,'rubber')
    box('WorkSurface',(x,1,z),(width,.18,depth),'rail')


def gantry(x,z,width=5):
    for dx in (-width/2,width/2):
        box('GantryColumn',(x+dx,1.65,z),(.25,3.3,.3),'paint')
        box('ColumnBase',(x+dx,.09,z),(.65,.18,.65),'steel')
    box('OverheadRail',(x,3.2,z),(width+.4,.28,.4),'amber')
    box('SlideCarriage',(x-.3,3,z),(.8,.35,.65),'dark')
    cylinder('VerticalActuator',(x-.3,2.47,z),.08,.75,'steel')
    box('ToolHead',(x-.3,2.02,z),(.45,.2,.5),'dark')
    cable('PneumaticLine',[(x+width/2,2.8,z),(x+width/2,3.5,z),(x-.3,3.5,z),(x-.3,2.2,z)],.035,'rubber')


def wheel(x,y,z,r=.42):
    cylinder('Tyre',(x,y,z),r,.3,'rubber',axis='z',vertices=32)
    for dz in (-.12,.12): cylinder('TyreShoulder',(x,y,z+dz),r*1.025,.028,'base',axis='z',vertices=32)
    cylinder('AlloyRim',(x,y,z+.17),r*.62,.05,'rail',axis='z')
    cylinder('Hub',(x,y,z+.21),r*.24,.08,'dark',axis='z')
    for a in range(6):
        angle=a*math.tau/6
        cylinder('LugNut',(x+math.cos(angle)*r*.42,y+math.sin(angle)*r*.42,z+.21),.027,.045,'steel',axis='z',vertices=6)


def cab(x,y,z):
    box('CabLower',(x,y+.35,z),(1.7,.65,1.85),'blue',.09)
    box('CabRear',(x+.78,y+1,z),(.14,1.1,1.85),'blue')
    box('CabRoof',(x,y+1.57,z),(1.8,.13,1.94),'blue',.06)
    box('FrontGlass',(x-.79,y+1.12,z),(.04,.68,1.62),'screen')
    for side in (-1,1):
        zz=z+side*.9
        for dx in (-.78,.68): box('WindowPillar',(x+dx,y+1.1,zz),(.1,.87,.09),'blue')
        box('SideGlass',(x-.03,y+1.14,zz),(1.27,.61,.026),'screen')
        box('DoorSeam',(x+.54,y+.55,zz+side*.018),(.015,.47,.02),'rubber',.001)
        box('DoorHandle',(x+.42,y+.71,zz+side*.05),(.22,.035,.06),'steel')
        cable('MirrorArm',[(x-.7,y+.9,zz),(x-1.0,y+1.05,zz+side*.35)],.025,'dark')
        box('Mirror',(x-1,y+1.15,zz+side*.35),(.12,.28,.17),'dark')
        box('Step',(x,y-.03,zz+side*.15),(.9,.12,.3),'rail')
    box('Bumper',(x-.99,y+.05,z),(.16,.2,2),'rail')
    for zz in (-.66,.66): box('Headlamp',(x-.89,y+.42,z+zz),(.03,.16,.3),'led')
    for yy in (.16,.25,.34): box('Grille',(x-.9,y+yy,z),(.025,.03,.75),'rubber',.003)


def truck(x=0,z=0,y=0,body=True):
    for zz in (-.65,.65): box('ChassisRail',(x,y+.7,z+zz),(5.6,.18,.16),'dark')
    for xx in (-2,-.7,.7,2): box('CrossMember',(x+xx,y+.7,z),(.16,.16,1.4),'rail')
    for xx in (-1.9,.8,2):
        cylinder('Axle',(x+xx,y+.48,z),.09,2.25,'steel',axis='z')
        for zz in (-1,1): wheel(x+xx,y+.48,z+zz)
    if body:
        cab(x-1.8,y+.72,z)
        box('Bed',(x+1,y+.93,z),(3.15,.18,1.8),'rail')
        for zz in (-.86,.86): box('BedSide',(x+1,y+1.25,z+zz),(3.2,.5,.08),'blue')
        box('TailGate',(x+2.58,y+1.25,z),(.08,.5,1.8),'blue')
        for zz in (-.7,.7): box('TailLamp',(x+2.65,y+.9,z+zz),(.04,.1,.23),'red')


def fence(x,z,width=6):
    for dx in (-width/2,0,width/2): box('FencePost',(x+dx,.85,z),(.07,1.7,.07),'amber')
    for yy in (.2,1.65): box('FenceBeam',(x,yy,z),(width,.045,.045),'dark')
    for i in range(int(width*4)+1): box('MeshVertical',(x-width/2+i*.25,.92,z),(.012,1.4,.015),'rail',0)
    for yy in (.45,.7,.95,1.2,1.45): box('MeshHorizontal',(x,yy,z),(width,.012,.015),'rail',0)


def robot(x,z):
    cylinder('RobotBase',(x,.3,z),.5,.6,'dark')
    cylinder('Shoulder',(x,.84,z),.28,.5,'amber',axis='z')
    cable('RobotUpperArm',[(x,.8,z),(x+.4,1.75,z)],.19,'amber')
    cylinder('Elbow',(x+.4,1.75,z),.23,.42,'dark',axis='z')
    cable('RobotForearm',[(x+.4,1.75,z),(x+1.2,2.2,z)],.14,'amber')
    cylinder('ToolWrist',(x+1.2,2.12,z),.13,.3,'steel')
    for zz in (-.14,.14): box('Gripper',(x+1.2,1.9,z+zz),(.08,.25,.05),'dark')
    cable('RobotHarness',[(x,.4,z+.32),(x+.25,1.8,z+.32),(x+1.2,2.35,z+.2)],.035,'rubber')


def campus():
    box('CampusBase',(0,-.43,4),(82,.64,74),'base',.1)
    box('ConcreteSlab',(0,-.105,4),(81.9,.015,73.9),'floor',.003)
    for x in range(-39,40,6): box('ExpansionJoint',(x,-.092,4),(.025,.01,73),'dark',0)
    for z in range(-30,39,6): box('ExpansionJoint',(0,-.092,z),(81,.01,.025),'dark',0)
    for x in (-12,12):
        box('LogisticsRoad',(x,-.075,3),(3.3,.025,66),'road',.003)
        for z in range(-27,36,3): box('LaneDash',(x,-.055,z),(.08,.009,1.15),'white',.001)
    for z in (-9,9):
        box('LogisticsRoad',(0,-.074,z),(75,.025,3),'road',.003)
        for x in range(-36,37,3): box('LaneDash',(x,-.054,z),(1.15,.009,.08),'white',.001)
    box('RearCutawayWall',(0,.7,-32.6),(81,1.6,.22),'paint')
    box('LeftCutawayWall',(-40.6,.7,4),(.22,1.6,73),'paint')
    for x in range(-36,37,6):
        box('SteelColumn',(x,1.85,-32),(.26,3.9,.35),'dark')
        box('ColumnPlate',(x,-.02,-32),(.7,.15,.7),'steel')
        box('WallLight',(x,3.55,-31.65),(2,.1,.25),'led')
    for y in (1.9,2.25): cable('ServiceMain',[(-38,y,-31.8),(38,y,-31.8)],.085,'rail')
    for x in (-36,-12,12,36): cabinet(x,-30.5)
    for x in (-37,37):
        for z in (-26,-8,10,32):
            cylinder('YardLightPole',(x,2.6,z),.065,5.2,'dark')
            box('YardLightHead',(x,5.2,z),(.8,.12,.4),'rail')
            box('LightDiffuser',(x,5.13,z),(.7,.015,.32),'led')
    for x in (-34,0,32):
        box('PlantingBed',(x,.12,38),(6,.3,1.3),'base')
        box('Hedge',(x,.55,38),(5.7,.7,1),'green',.12)
    label('CampusTitle','TRUCKWORKS / PRODUCTION CAMPUS',(-11,.4,40.99),.6,'white')


def axle():
    deck('AXLE / WHEEL SUBASSEMBLY')
    table(-4,0,4,2.7); table(2,0,4,2.7)
    for x in (-5,-3,1,3):
        cylinder('AxleFixture',(x,1.27,0),.09,2.3,'steel',axis='z')
        for z in (-1,1): wheel(x,1.3,z,.32)
    gantry(2,0,4.8); cabinet(6,2)
    for x in (-6,-4,-2):
        for y in (.45,1.1,1.75): wheel(x,y,-3.6,.28)
    box('PartsRack',(-4,.07,-3.6),(6,.14,1),'dark')
    fence(0,-4.5,12)


def cabin():
    deck('CAB / FINISHING & FIT-OUT')
    box('BoothFloor',(-3,.1,0),(6,.2,5),'rail')
    box('BoothRear',(-3,1.8,-2.5),(6,3.6,.16),'paint')
    for x in (-6,0): box('BoothSide',(x,1.8,0),(.14,3.6,5),'glass')
    for x in (-5.8,-.2): box('BoothPillar',(x,1.8,2.4),(.15,3.6,.15),'paint')
    box('FilterHousing',(-3,3.6,-1),(6,.35,3),'dark')
    for x in (-4.5,-1.5): cylinder('ExtractionFan',(x,3.87,-1),.5,.2,'rail')
    table(-3,0,3,2.5); cab(-3,1.1,0)
    robot(-5.3,1.6); cabinet(1,2)
    table(4,-1,4,2); cab(4,1.1,-1)
    for x in (2.6,5.4): box('WorkLight',(x,2.8,-2),(.08,1.7,.08),'led')
    fence(4,-3.5,6)


def assembly():
    deck('TRUCK / FINAL ASSEMBLY',20,12)
    for x in (-4.5,4):
        box('LiftTable',(x,.25,0),(6,.5,3),'dark')
        for z in (-1.2,1.2): box('LiftRail',(x,.52,z),(5.8,.1,.1),'amber')
        truck(x,0,.55,body=x>0)
    gantry(-4.5,0,6.7); gantry(4,0,6.7)
    robot(-7,-3.3); robot(2,-3.3)
    cabinet(8,3.4); fence(0,-4.8,16)
    for x in (-6,0,6):
        box('ToolChest',(x,.7,3.5),(1.4,1.4,.65),'dark')
        for y in (.3,.55,.8,1.05):
            box('Drawer',(x,y,3.84),(1.25,.2,.03),'paint')
            box('DrawerPull',(x,y,3.87),(.65,.025,.04),'steel')


def trailer():
    deck('TRAILER / FRAME & BODY',20,12)
    for x in (-4.5,4):
        table(x,0,6,3)
        for z in (-.85,.85): box('TrailerRail',(x,1.3,z),(6,.22,.18),'dark')
        for dx in (-2,-1,0,1,2): box('CrossRail',(x+dx,1.3,0),(.14,.18,1.75),'rail')
        for dx in (1,2):
            for z in (-1.1,1.1): wheel(x+dx,.8,z)
        if x>0:
            box('CargoFloor',(x,1.5,0),(6,.15,2),'rail')
            for z in (-1,1):
                box('CargoSide',(x,2.35,z),(6,1.6,.08),'paint')
                for dx in (-2.7,-1.4,0,1.4,2.7): box('BodyRib',(x+dx,2.35,z*1.05),(.08,1.65,.06),'rail')
            box('CargoBulkhead',(x-3,2.35,0),(.08,1.6,2),'paint')
        cylinder('LandingLeg',(x-2, .78,0),.1,1,'steel')
    robot(-7,-3); cabinet(8,3.7); fence(0,-4.8,16)


def inspection():
    deck('END OF LINE / INSPECTION')
    truck(0,0,.12)
    for x in (-1.9,.8,2):
        for z in (-1,1):
            for dx in (-.25,.25): cylinder('BrakeTestRoller',(x+dx,.12,z),.13,.85,'steel',axis='z')
    for x in (-3.5,3.5):
        gantry(x,0,4.5)
        for z in (-1.8,1.8): box('InspectionLight',(x,1.8,z),(.08,2.2,.16),'led')
    for x in (-5,5):
        box('SensorPedestal',(x,1,1.6),(.12,2,.12),'dark')
        box('OpticalSensor',(x,2,1.6),(.35,.25,.32),'screen')
    cabinet(6,3); fence(0,-4.5,12)
    table(-5,-3,2,1)


def dispatch():
    deck('DISPATCH / FINISHED VEHICLES',20,12)
    for z in (-2.6,2):
        truck(-2,z)
        for zz in (z-1.25,z+1.25): box('ParkingStripe',(-2,.025,zz),(7,.009,.06),'white',.001)
    for z in (-2,1):
        box('ShippingCrate',(6,.65,z),(2.3,1.3,2),'wood')
        for x in (5.1,6.9): box('CrateBand',(x,.65,z),(.06,1.34,2.04),'dark')
    cabinet(8,4)
    box('DockBack',(0,.7,-5.5),(18,1.4,.2),'paint')
    for x in (-6,0,6):
        box('LoadingDoor',(x,1.7,-5.45),(4,3.2,.12),'dark')
        for y in (.3,.7,1.1,1.5,1.9,2.3,2.7,3.1): box('DoorSlat',(x,y,-5.36),(3.8,.025,.04),'rail')


def track():
    deck('PROVING GROUND / FUTURE DRIVING',24,22)
    box('RoadBed',(0,.03,0),(22,.04,19),'road')
    box('Infield',(0,.1,0),(13,.2,10),'green',.08)
    for x in (-8.7,8.7):
        for z in range(-8,9,2): box('LaneDash',(x,.058,z),(.08,.012,.85),'white',.001)
    for z in (-7.4,7.4):
        for x in range(-10,11,2): box('LaneDash',(x,.059,z),(.85,.012,.08),'white',.001)
    for x in range(-10,11):
        for z in (-9.1,9.1): box('TrackCurb',(x,.12,z),(.9,.22,.22),'red' if x%2 else 'white',.01)
    for z in range(-9,10):
        for x in (-10.8,10.8): box('TrackCurb',(x,.12,z),(.22,.22,.9),'red' if z%2 else 'white',.01)
    for i in range(8):
        box('StartGrid',(-6+i*.3,.065,6),(.3,.012,1.9),'white' if i%2 else 'dark',.001)
    for x in (-5,-2,1,4):
        cylinder('ConeBase',(x,.12,-7),.2,.09,'rubber')
        cylinder('TrafficCone',(x,.37,-7),.1,.45,'amber')
    truck(2,7.4)
    box('ObservationCabin',(0,1.1,0),(5,2.2,3.5),'paint',.05)
    box('ControlWindow',(0,1.4,1.77),(4.5,.95,.035),'screen')
    box('ControlRoof',(0,2.25,0),(5.3,.14,3.8),'dark')
    label('FutureLabel','DRIVE + AI FORECAST / PLANNED',(-2,.4,1.79),.16,'ink')

BUILDERS = {'campus-ground':campus,'axle-cell':axle,'cab-finishing':cabin,'final-assembly':assembly,
            'trailer-cell':trailer,'vehicle-inspection':inspection,'dispatch-yard':dispatch,'proving-ground':track}
key = sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else ''
if key not in BUILDERS: raise SystemExit('Choose: '+', '.join(BUILDERS))
root.name = key.replace('-','_')
root['purpose'] = 'Static future factory layout; not running production, inventory or driving telemetry'
root['asset_version'] = '1.0.0'
BUILDERS[key]()
source_dir, output_dir = SOURCE/key, OUTPUT/key
source_dir.mkdir(parents=True,exist_ok=True); output_dir.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(source_dir/f'{key}.blend'))
groups = {}
for obj in list(scene.objects):
    if obj.type == 'MESH': groups.setdefault((obj.parent.name,obj.data.materials[0].name),[]).append(obj)
for (parent,mat),objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1: bpy.ops.object.join()
    bpy.context.object.name=f'{parent}_{mat}'
bpy.ops.export_scene.gltf(filepath=str(output_dir/f'{key}.glb'),export_format='GLB',export_yup=True,
    export_apply=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
print(f'AUTHORED {key}: blend and GLB saved; user visual confirmation pending')
