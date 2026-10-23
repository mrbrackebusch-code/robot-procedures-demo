"""Build supplied art from retained native crops. No original slicing or RGB-nearest quantization.
Run with bundled Python/Pillow from the repository root. Conserve usage indefinitely.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib, colorsys, collections, shutil, zipfile

ROOT = Path(__file__).resolve().parents[3]
GAME = ROOT / 'games/robot-procedures'
BUNDLE = Path(__file__).resolve().parent if (Path(__file__).resolve().parent/'sources/INDEX.json').exists() else None
if BUNDLE:
    ROOT=BUNDLE
    GAME=BUNDLE/'rebuilt-game'
OUT = GAME / 'assets/game-art'
OUT.mkdir(parents=True, exist_ok=True)
PALETTE = ['000000','F2F4DE','BD444E','B4CAD1','DA8D4A','E4CC6B','2D6C70','75B66C',
           '192A43','548BD2','855D9A','6D8798','293E52','7E6A51','A6987C','111824']
RGB = [tuple(bytes.fromhex(x)) for x in PALETTE]
ROLES = ['transparent','light text','enemy red/danger','light steel','orange','gold/aim','teal',
         'green/HP','navy','player blue/shield','purple','steel','panel/slate','earth','warm grey','near black']
SOURCES = {}
ENTRIES = {}
RECORDS = []
IMAGES = []
IMAGE_IDS = {}
PALETTE_MAPS = collections.defaultdict(dict)
SOURCE_HASHES = {}
ALPHA_DROPS = collections.Counter()

def load(set_id, tiles=False):
    if set_id in ENTRIES:
        return ENTRIES[set_id]
    folder = GAME / 'assets' / ('tilesets' if tiles else 'prepared') / set_id
    manifest=folder/'manifest.json'
    if not manifest.exists() and BUNDLE:manifest=BUNDLE/'sources/manifests'/f'{set_id}.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    ENTRIES[set_id] = {e['id']: e for e in data['entries']}
    sp = folder/'SOURCE.json' if tiles else GAME/'assets/intake/2026-10-22'/set_id/'SOURCE.json'
    if not sp.exists() and BUNDLE:sp=BUNDLE/'notices'/f'{set_id}-SOURCE.json'
    SOURCES[set_id] = json.loads(sp.read_text(encoding='utf-8'))
    return ENTRIES[set_id]

# Exact authored ramps: body paint is distinct from joint shadows, eyes and outlines.
AMON = {'101010':15,'171137':8,'141e72':12,'1740aa':9,'3862bd':11,'4e9fdc':3,
        '411b1b':13,'811616':2,'c11111':4,'d83509':5}
LPC = {'06080a':15,'161c23':8,'1f2b3b':12,'23343c':12,'273d46':12,'273d4c':12,
       '2a4651':6,'2c4554':6,'3a5f6e':6,'4c7b8d':11,'6193a6':3,
       '335a88':9,'31a2f2':9,'499ecf':9,'a1cada':3,'d5e7ee':1,
       '28241e':15,'52515a':12,'5a5966':12,'646370':12,'78768a':11,'848299':11,
       '6e6558':13,'063403':6,'82cf49':7,'c13819':2,'4e2727':2}
DB32 = {'000000':15,'222034':8,'45283c':10,'663931':13,'8f563b':13,'92553a':13,
        'df7126':4,'d9a066':14,'eec39a':14,'fbf236':5,'99e550':7,'6abe30':7,
        '37946e':6,'4b692f':6,'524b24':13,'323c39':12,'3f3f74':8,'306082':6,
        '5b6ee1':9,'639bff':9,'5fcde4':3,'cbdbfc':3,'ffffff':1,'9badb7':11,
        '847e87':14,'696a6a':11,'595652':12,'76428a':10,'ac3232':2,'d95763':2,
        'd77bba':10,'8f974a':13}
COMPUTER = {'000000':15,'363636':12,'666666':11,'56787d':6,'94b4b9':11,
            'b2d1d6':3,'e3f5f8':1,'ffffff':1,'00e9ff':2,'00d1ff':2,'0084a9':13}

def material(rgb, family, side):
    """Source/material ramp classification, explicitly not nearest-color matching."""
    hx = ''.join(f'{v:02x}' for v in rgb)
    exact = AMON if family == 'amon' else LPC if family == 'lpc' else DB32 if family.startswith('colony') else COMPUTER if family == 'computer' else {}
    if family == 'colony-floor' and hx in ['595652','696a6a','847e87']:
        return {'595652':12,'696a6a':12,'847e87':11}[hx]
    if hx in exact:
        return exact[hx]
    r,g,b = rgb
    h,s,v = colorsys.rgb_to_hsv(r/255,g/255,b/255)
    # Retain opaque black and strong dark outlines; alpha alone owns transparency.
    if v < .115:
        return 15
    if family == 'modular':
        if s > .30 and h < .09: return 5 if v > .65 else 4
        if s > .30 and .45 < h < .65: return 3 if v > .60 else 9
        # Lift the source's dark grey armour, while keeping black joints separate.
        return 8 if v < .18 else 12 if v < .24 else 11 if v < .40 else 3 if v < .70 else 1
    if family == 'davilj-blue':
        if s > .16 and .52 < h < .77:
            return 8 if v < .30 else 12 if v < .60 else 9 if v < .85 else 3
        if s > .25 and (h < .12 or h > .94): return 5 if v > .7 else 4
        return 15 if v < .23 else 12 if v < .36 else 11 if v < .59 else 3 if v < .82 else 1
    if family == 'davilj-red':
        if s > .20 and (h < .13 or h > .91): return 13 if v < .45 else 2 if v < .75 else 4
        if s > .25 and .18 < h < .48: return 7 if v > .45 else 6
        return 15 if v < .20 else 12 if v < .35 else 11 if v < .52 else 3 if v < .78 else 1
    if family == 'fighting':
        if s > .30 and .16 < h < .43: return 5 if v > .75 else 7
        if s > .30 and (h < .1 or h > .9): return 2
        return 15 if v < .23 else 12 if v < .40 else 11 if v < .63 else 14 if v < .80 else 3
    if family == 'platforge':
        if s > .35 and .54 < h < .78: return 8 if v < .45 else 2 # enemy panels red, outline navy
        if s > .35 and .10 < h < .22: return 5
        if s > .35 and (h < .09 or h > .9): return 4
        if s > .35 and .35 < h < .54: return 6 if v < .7 else 3
        return 15 if v < .25 else 12 if v < .45 else 11 if v < .70 else 3 if v < .92 else 1
    if family == 'nes':
        # Three/four-color NES robot: black structure, blue armour, pale metal, gold emitter.
        if s > .4 and .52 < h < .80: return 8 if v < .4 else 9 if v < .8 else 3
        if s > .4 and h < .2: return 5 if v > .65 else 4
        if s > .4 and .2 < h < .52: return 6 if v < .55 else 7
        return 15 if v < .25 else 11 if v < .65 else 3 if v < .95 else 1
    # Exact-color palettes above should cover selected environments/Computer Dude.
    raise ValueError(f'Unreviewed source color {family}: {hx}')

def indexed(src, family, side):
    result = Image.new('P',src.size,0)
    result.putpalette([v for c in RGB for v in c]+[0]*720)
    values=[]
    for r,g,b,a in src.convert('RGBA').getdata():
        # Arcade has one-bit coverage. Keep opaque black; discard only low-alpha antialias fringe.
        if a < 128:
            if a: ALPHA_DROPS[family]+=1
            values.append(0); continue
        i=material((r,g,b),family,side)
        PALETTE_MAPS[family][f'{r:02X}{g:02X}{b:02X}']=i
        values.append(i)
    result.putdata(values)
    result.info['transparency']=0
    return result

def native(set_id, entry_id, tiles=False):
    e=load(set_id,tiles)[entry_id]
    p=ROOT/e['native']
    if not p.exists() and BUNDLE:p=BUNDLE/'sources/native'/set_id/Path(e['native']).name
    raw=p.read_bytes()
    SOURCE_HASHES[str(p.relative_to(ROOT)).replace('\\','/')]=hashlib.sha256(raw).hexdigest()
    return e,Image.open(p).convert('RGBA')

def add_image(im):
    key=(im.size,im.tobytes())
    if key not in IMAGE_IDS:
        IMAGE_IDS[key]=len(IMAGES);IMAGES.append(im)
    return IMAGE_IDS[key]

def derivative(name,set_id,entry_id,family,side=0,scale=1,source_anchor=None,size=(64,64),tiles=False,mirror=False):
    e,src=native(set_id,entry_id,tiles)
    converted=indexed(src,family,side)
    target=(round(src.width*scale),round(src.height*scale))
    converted=converted.resize(target,Image.Resampling.NEAREST)
    if source_anchor is None:
        offset=((size[0]-target[0])//2,size[1]-target[1]-8)
    else:
        offset=(32-round(source_anchor[0]*scale),56-round(source_anchor[1]*scale))
    if size==target and tiles: offset=(0,0)
    canvas=Image.new('P',size,0);canvas.putpalette(converted.getpalette());canvas.paste(converted,offset)
    canvas.info['transparency']=0
    if mirror:
        flipped=canvas.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        # Mirror about ground x=32 rather than the between-pixels center x=31.5.
        canvas=Image.new('P',size,0);canvas.putpalette(converted.getpalette());canvas.paste(flipped,(1,0));canvas.info['transparency']=0
    ix=add_image(canvas)
    file=f'png/{name}.png';(OUT/'png').mkdir(exist_ok=True)
    canvas.save(OUT/file,transparency=0)
    RECORDS.append({'id':name,'image_index':ix,'output':file,'set':set_id,'prepared_entry':entry_id,
                    'prepared_native':e['native'],'original_source':e['source'],'original_source_rect':e.get('source_rect'),
                    'components':e.get('components'),'source_size':list(src.size),'output_size':list(size),
                    'scale':scale,'resampling':'nearest-neighbor geometry only; semantic palette mapping',
                    'paste_offset':list(offset),'pivot':[32,56] if not tiles else None,
                    'source_anchor':source_anchor,'mirrored_offline':mirror,'mirror_anchor_correction_x':1 if mirror else 0,'palette_family':family,
                    'indexed_pixels_sha256':hashlib.sha256(canvas.tobytes()).hexdigest(),
                    'source_duration_ms':e.get('duration_ms'),'runtime_allocation':'prebuilt literal cached at startup'})
    return ix

def robot_frames(set_id, ids, family, side, scale, anchor=None, anchors=None):
    result=[]
    for n,entry_id in enumerate(ids):
        a=anchors[n] if anchors else anchor
        pair=[]
        for left in [False,True]:
            pair.append(derivative(f'{set_id}-{entry_id}-'+('left' if left else 'right'),set_id,entry_id,family,side,scale,a,mirror=left))
        result.append(pair)
    return result

def ids(prefix,row,cols): return [f'{prefix}-r{row:02d}-c{x:02d}' for x in cols]

def build():
    # Every slot is one cached [right,left] image pair; reuse is explicit, not invented animation.
    roster=[]; directions=[]; contracts=[]
    def actor(name,set_id,family,side,scale,anchor,idle,move,fire=None,dead=None,front=None,back=None,anchors=None):
        sequences=[]
        for label,entries in [('idle',idle),('move',move),('fire',fire or idle[:1]),('dead',dead or idle[:1])]:
            sequences.append(robot_frames(set_id,entries,family,side,scale,anchor,anchors.get(label) if anchors else None))
        roster.append(sequences)
        frontframes=robot_frames(set_id,front or idle[:1],family,side,scale,anchor)
        backframes=robot_frames(set_id,back or idle[:1],family,side,scale,anchor)
        directions.append([frontframes,backframes])
        contracts.append({'slot':len(roster)-1,'side':side,'name':name,'set':set_id,'scale':scale,'anchor':[32,56],
                          'poses':dict(idle=idle,move=move,fire=fire or idle[:1],dead=dead or idle[:1]),
                          'front':front or idle[:1],'back':back or idle[:1],
                          'front_reuses_side':front is None,'back_reuses_side':back is None,
                          'fire_reuses_idle':fire is None,'dead_reuses_idle':dead is None,
                          'suggested_frame_timing_ms':{'idle':220,'move':110,'fire':90,'dead':180},
                          'timing_authority':'suggestion only; arena simulation owns actual animation step calls. Original still sheets do not specify timing.'})
    actor('Scout','davilj-robot2','davilj-blue',0,.875,[32,64],
          ids('spritesheet-1',6,[1,2]),ids('spritesheet-1',7,range(1,8)),
          front=ids('spritesheet-1',3,[1,2,3]),dead=ids('spritesheet-1',2,[2,3,4,5]))
    actor('Rifle','amon-animated-robot','amon',0,.80,[32,68],
          [f'band-1-pose-{x:02d}' for x in [1,2,3]], [f'band-2-pose-{x:02d}' for x in [1,2,3]],
          front=[f'band-3-pose-{x:02d}' for x in [1,2,3]],back=[f'band-4-pose-{x:02d}' for x in [1,2,3,4]])
    actor('Guard','croomfolk-yurinikolai-modular-64x','modular',0,.875,[32,63],
          ['ase-saved-visible-pose'],['ase-saved-visible-pose'])
    actor('Lancer','imogiagames-redshrike-nes-creatures','nes',0,1.75,[16,32],
          ids('scificreatures-nes-4x30-alphabg',4,[1]),ids('scificreatures-nes-4x30-alphabg',4,[1,2,3]),
          dead=ids('scificreatures-nes-4x30-alphabg',4,[4]))
    actor('Enemy Scout','bombfire-computer-dude','computer',1,1.45,None,
          [f'idle-{x:02d}' for x in [1,2,3,4]],[f'run-{x:02d}' for x in [1,2,3,4,5,6]])
    actor('Enemy Rifle','davilj-robot','davilj-red',1,.875,[32,64],
          ids('spritesheet',2,[1,2,3]),ids('spritesheet',6,range(1,9)),
          front=ids('spritesheet',1,[1,2,3]),dead=ids('spritesheet',1,[1,2,3,4,5,6,7]))
    # Irregular authored fighter crops have explicit row-baseline/body pivots, never bbox-resized.
    fighteridle=[f'robosheet-r01-f{x:02d}' for x in [1,2,3]]
    fightermove=[f'robosheet-r02-f{x:02d}' for x in range(1,8)]
    actor('Enemy Guard','redshrike-fighting-robot','fighting',1,.64,None,fighteridle,fightermove,
          anchors={'idle':[[18,83],[18,82],[18,81]],'move':[[23,84],[18,84],[19,84],[23,84],[16,84],[18,84],[25,84]]})
    actor('Enemy Lancer','platforge-hannah-cohan-robot','platforge',1,.60,[25.5,90],
          ids('robot',3,[1,2]),ids('robot',3,[1,2,3,4,5,6,7,8]),front=ids('robot',1,[1]),back=ids('robot',1,[5,6,7,8]))
    lpc='basxto-lpc-goes-to-space';frama='basxto-frama-extensions';colony='rubberduck-buch-colony-extended'
    lp=lambda r,c:f'scifi_space_rpg_tiles_lpcized-r{r:02d}-c{c:02d}'
    fr=lambda r,c:f'scifi_hackspace_frama-r{r:02d}-c{c:02d}'
    themes=[[(lpc,lp(2,4)),(lpc,lp(0,3)),(lpc,lp(2,10)),(lpc,lp(1,7))],
            [(lpc,lp(0,3)),(lpc,lp(2,4)),(lpc,lp(2,10)),(lpc,lp(1,7))],
            [(colony,'db32-grounds-r008-c06'),(colony,'db32-grounds-r007-c01'),(lpc,lp(2,10)),(frama,fr(4,5))],
            [(colony,'db32-grounds-r001-c07'),(colony,'db32-grounds-r002-c10'),(colony,'db32-buildings-r004-c02'),(colony,'db32-buildings-r004-c03')]]
    terrain=[]
    for t,parts in enumerate(themes):
        row=[]
        for part,(s,eid) in enumerate(parts):
            row.append(derivative(f'theme-{t}-part-{part}',s,eid,('colony-floor' if part<2 else 'colony') if s==colony else 'lpc',scale=2 if s==colony else 1,size=(32,32),tiles=True))
        terrain.append(row)
    for t in range(4):
        for part in [0,1,2]:
            assert 0 not in IMAGES[terrain[t][part]].getdata(), f'theme {t} floor/wall must be opaque: {part}'
    props=[]
    for t in range(4):
        specs=[(frama,'exit-f00'),(frama,'prop-crystal-variant-0'),(lpc,lp(1,12))] if t<2 else [(colony,'db32-building-b1-object03'),(colony,'db32-building-b1-object01'),(lpc,lp(1,12))]
        row=[]
        for n,(s,eid) in enumerate(specs):
            e,im=native(s,eid,True)
            row.append(derivative(f'theme-{t}-prop-{n}',s,eid,'colony' if s==colony else 'lpc',size=im.size,tiles=True))
        props.append(row)
    # Previews use the exact converted image bank and actual chosen environment tiles.
    preview(roster,terrain,props)
    write_typescript(roster,directions,terrain,props)
    for path,sha in SOURCE_HASHES.items():
        assert hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==sha, path
    for im in IMAGES:
        assert min(im.getdata())>=0 and max(im.getdata())<=15
    for r in RECORDS:
        if r['pivot']: assert r['output_size']==[64,64]
    palette={'name':'Robot Procedures material palette','colors':['#'+s for s in PALETTE],'roles':ROLES}
    (GAME/'implementation/palette.json').write_text(json.dumps(palette,indent=2)+'\n',encoding='utf8')
    manifest={'schema':1,'generator':'games/robot-procedures/tools/build-game-art.py','palette':palette,
              'robot_contracts':contracts,'frame_lookup':roster,'direction_lookup':directions,'tile_lookup':terrain,'prop_lookup':props,
              'derivatives':RECORDS,'source_native_sha256':SOURCE_HASHES,'semantic_exact_rgb_maps':dict(PALETTE_MAPS),
              'unique_images':len(IMAGES),'source_bundle':{'path':'selected-art-source.zip','format':'ZIP, sorted entries, fixed 1980-01-01 timestamps','contents':['sources/','notices/','manifest.json','palette.json','build-game-art.py']},'checks':{'indices_0_to_15':True,'robot_canvases_64':True,'source_native_files_unchanged':True},
              'pixel_repairs':[], 'alpha_coverage':{'rule':'alpha <128 becomes transparent; alpha >=128 opaque; opaque black retained','low_alpha_pixels_excluded_in_derivative_passes':dict(ALPHA_DROPS)}, 'limitations':['Manual semantic ramps merge source shades; no nearest RGB matching.',
              'Mirrors are horizontal reuse, not new authored poses. Missing fire/death/front/back explicitly reuse available art.',
              'Image preview confirms supplied-art readability; it is not runtime or learner evidence.']}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
    wanted={Path(r['output']).name for r in RECORDS}
    for old in (OUT/'png').glob('*.png'):
        if old.name not in wanted:old.unlink()
    write_notices()
    bundle_sources()
    write_source_zip()
    print(f'Built {len(RECORDS)} derivatives / {len(IMAGES)} native indexed image literals. Source hashes unchanged.')

def rgba(im):
    r=im.convert('RGBA');mask=Image.new('L',im.size);mask.putdata([0 if p==0 else 255 for p in im.getdata()]);r.putalpha(mask);return r

def preview(roster,terrain,props):
    atlas=Image.new('RGB',(768,((len(IMAGES)+11)//12)*80),'#293E52');d=ImageDraw.Draw(atlas)
    for n,im in enumerate(IMAGES):
        x=(n%12)*64;y=(n//12)*80;p=rgba(im);atlas.paste(p,(x,y),p);d.text((x+2,y+65),str(n),fill='#F2F4DE')
    atlas.save(OUT/'atlas.png')
    comparison=Image.new('RGB',(8*160,150),'#293E52');d=ImageDraw.Draw(comparison)
    for n,actor in enumerate(roster):
        rec=next(r for r in RECORDS if r['image_index']==actor[0][0][0]);source=ROOT/rec['prepared_native']
        if not source.exists() and BUNDLE:source=BUNDLE/'sources/native'/rec['set']/Path(rec['prepared_native']).name
        src=Image.open(source).convert('RGBA')
        src.thumbnail((64,96),Image.Resampling.NEAREST);comparison.paste(src,(n*160,20),src)
        p=rgba(IMAGES[actor[0][0][0]]);comparison.paste(p,(n*160+75,30),p)
        d.text((n*160,105),('P' if n<4 else 'E')+str(n%4)+' original / game',fill='#F2F4DE')
    comparison.save(OUT/'source-comparison.png')
    for t in range(4):
        scene=Image.new('RGB',(480,360),'#111824')
        for y in range(0,360,32):
            for x in range(0,480,32):
                part=2 if y<32 or x<32 or x>=448 or y>=328 else 1 if (x//32+y//32)%7==0 else 0
                scene.paste(IMAGES[terrain[t][part]].convert('RGB'),(x,y))
        for n,a in enumerate(roster):
            px=86+(n%4)*100;py=150 if n<4 else 280
            img=rgba(IMAGES[a[1][0][0 if n<4 else 1]])
            scene.paste(img,(px-32,py-56),img)
            ImageDraw.Draw(scene).text((px-20,py+6),('P' if n<4 else 'E')+str(n%4),fill='#F2F4DE')
        p=rgba(IMAGES[props[t][2]]);scene.paste(p,(224,4),p)
        scene.save(OUT/f'contact-scene-{t}.png')

def write_typescript(roster,directions,terrain,props):
    lines=['// Generated by build-game-art.py. Supplied artwork; see docs/ART_CREDITS.md.',
           '// Native indexed literals are cached once. No runtime decode, clone, resize or mirror.', 'namespace robotArt {','    const bank: Image[] = [']
    for im in IMAGES:
        values=list(im.getdata());lines.append('        img`')
        for y in range(im.height):lines.append('            '+''.join(format(v,'x') for v in values[y*im.width:(y+1)*im.width]))
        lines.append('        `,')
    lines += ['    ]','    const actors: number[][][][] = '+json.dumps(roster,separators=(',',':')),
              '    const directions: number[][][][] = '+json.dumps(directions,separators=(',',':')),
              '    const terrain: number[][] = '+json.dumps(terrain,separators=(',',':')),
              '    const objects: number[][] = '+json.dumps(props,separators=(',',':')),
              '    export function frame(side: number, kind: number, pose: number, step: number, faceLeft: boolean): Image {',
              '        const actor = actors[(side > 0 ? 4 : 0) + Math.max(0, Math.min(3, kind))]',
              '        const frames = actor[Math.max(0, Math.min(3, pose))]',
              '        const frameIndex = pose == 3 ? Math.min(Math.abs(step), frames.length - 1) : Math.abs(step) % frames.length',
              '        return bank[frames[frameIndex][faceLeft ? 1 : 0]]','    }',
              '    // facing 0 right, 1 left, 2 front, 3 back. Unavailable directions explicitly reuse side art.',
              '    export function directionFrame(side: number, kind: number, pose: number, step: number, facing: number): Image {',
              '        if (facing < 2) return frame(side, kind, pose, step, facing == 1)',
              '        const frames = directions[(side > 0 ? 4 : 0) + Math.max(0, Math.min(3, kind))][facing == 3 ? 1 : 0]',
              '        return bank[frames[Math.abs(step) % frames.length][0]]','    }',
              '    export function tile(theme: number, part: number): Image { return bank[terrain[Math.abs(theme) % 4][Math.abs(part) % 4]] }',
              '    export function prop(theme: number, index: number): Image { return bank[objects[Math.abs(theme) % 4][Math.abs(index) % 3]] }',
              '    export function applyPalette(): void { image.setPalette(hex`'+''.join(PALETTE)+'`) }',
              '    export function credits(): string[] { return ["Amon (CC0); amon.pro", "davilj: Robot / Robot2 (GPL 2.0)", "Croomfolk / YuriNikolai (CC BY-SA 4.0)", "Imogia Games; Stephen Challener / Redshrike (CC BY 4.0 / original CC BY 3.0)", "Bombfire (CC0)", "Stephen Challener / Redshrike (CC BY 3.0)", "Hannah Cohan / PlatForge (CC BY-SA 3.0)", "Basxto, Wonko, Hyptosis, FunwithPixels, Skorpio (CC BY-SA 4.0)", "rubberduck and Buch (CC0)", "Adapted art and license details: ART_CREDITS.md"] }','}']
    hidden=[]
    for line in lines:
        if line.lstrip().startswith('export function '):hidden.append('    //% blockHidden=true')
        hidden.append(line)
    path=GAME/'implementation/supplied-world/art.ts';path.parent.mkdir(parents=True,exist_ok=True);path.write_text('\n'.join(hidden)+'\n',encoding='utf8')

def write_notices():
    folder=OUT/'notices';folder.mkdir(exist_ok=True)
    for s,source in SOURCES.items():
        (folder/(s+'-SOURCE.json')).write_text(json.dumps(source,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    modular=GAME/'assets/intake/2026-10-22/croomfolk-yurinikolai-modular-64x/extracted/Modular 64x Robots by YuriNikolai/treadbots_README.txt'
    if modular.exists():shutil.copyfile(modular,folder/'treadbots_README.txt')
    if BUNDLE:
        for p in (BUNDLE/'notices').iterdir():
            if p.is_file():shutil.copyfile(p,folder/p.name)

def bundle_sources():
    """Only inputs actually used by this release, not unrelated archived art collections."""
    source_index=[]
    copied=set()
    for rec in RECORDS:
        set_id=rec['set'];e=ENTRIES[set_id][rec['prepared_entry']]
        paths=[('native',e['native']),('original',e['source'])]
        for component in e.get('components',[]):
            if component.get('source'):paths.append(('original',component['source']))
        for category,path in paths:
            key=(category,path)
            if key in copied:continue
            copied.add(key)
            source=ROOT/path
            if not source.exists() and BUNDLE:source=BUNDLE/'sources'/category/set_id/Path(path).name
            target=OUT/'sources'/category/set_id/source.name;target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(source,target)
            assert source.read_bytes()==target.read_bytes(), f'Changed source copy: {source}'
            source_index.append({'set':set_id,'kind':category,'repository_source':path,'bundle_file':str(target.relative_to(OUT)).replace('\\','/'),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
    for s,es in ENTRIES.items():
        selected={r['prepared_entry'] for r in RECORDS if r['set']==s}
        target=OUT/'sources/manifests'/f'{s}.json';target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(json.dumps({'set':s,'entries':[es[e] for e in sorted(selected)]},indent=2)+'\n',encoding='utf8')
    (OUT/'sources/INDEX.json').write_text(json.dumps({'schema':1,'files':source_index,'recipe':'games/robot-procedures/tools/build-game-art.py','derivative_manifest':'../manifest.json'},indent=2)+'\n',encoding='utf8')
    (OUT/'sources/README.md').write_text('''# Selected corresponding art source

This package includes only the native crops and original source files used by
the image bank. INDEX.json maps exact repository inputs to included copies and
SHA-256 hashes; manifests retain original crop coordinates and modular layers.
Original files retain their original licenses. See docs/ART_CREDITS.md in
the game source or the release ART_CREDITS.md; ../notices contains license texts.

The complete deterministic conversion recipe is tools/build-game-art.py in the
game source. Restore INDEX.json repository paths in an authoring checkout, then
run that script from the repository root. It uses only Pillow and the standard
Python library, not a network service. Its source-specific semantic color ramps,
explicit pivots, fixed cohort scales and generated manifest reproduce the art.
Retain this source, recipe, notices and attribution when redistributing the art.

For the standalone selected-art-source.zip, extract the archive and run its
build-game-art.py with Python/Pillow. It detects the included sources and builds
into rebuilt-game/ without requiring the private authoring checkout or network.
''',encoding='utf8')

def write_source_zip():
    files={}
    for directory in ['sources','notices']:
        for p in (OUT/directory).rglob('*'):
            if p.is_file():files[p.relative_to(OUT).as_posix()]=p
    files['manifest.json']=OUT/'manifest.json'
    files['palette.json']=GAME/'implementation/palette.json'
    files['build-game-art.py']=Path(__file__).resolve()
    target=OUT/'selected-art-source.zip'
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for name in sorted(files):
            info=zipfile.ZipInfo(name,date_time=(1980,1,1,0,0,0))
            info.create_system=3;info.external_attr=0o100644<<16
            info.compress_type=zipfile.ZIP_DEFLATED
            archive.writestr(info,files[name].read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
        assert all(i.date_time==(1980,1,1,0,0,0) for i in archive.infolist())

if __name__=='__main__':build()

