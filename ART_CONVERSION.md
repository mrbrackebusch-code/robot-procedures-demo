# Supplied-art conversion

Conserve usage indefinitely. This is the scoped Robot Procedures artwork
pipeline, using the eight active robot sets and three selected tileset families.
It does not rediscover or reslice originals, revive archived sets, generate AI
replacement artwork, or run an unrelated engineering/learner campaign.

Run `tools/build-game-art.py` from the repository root with the bundled Python
and Pillow. It reads retained native crops and manifests and writes the native
MakeCode image literals, palette, PNG derivatives, contact scenes, atlas,
source comparison, complete derivative manifest and selected source package.
Runtime `frame`, `directionFrame`, `tile` and `prop` return cached native image
objects; there is no base64 decode, cloning, mirroring or resizing during play.
The generator also writes `assets/game-art/selected-art-source.zip`, containing
`sources/`, `notices/`, `manifest.json`, `palette.json` and `build-game-art.py`.
Sorted entries and fixed 1980-01-01 timestamps make its bytes deterministic.
Its manifest-known path allows the public package to provide corresponding
source without adding every source crop to the MakeCode editor file list.
The extracted recipe detects its included inputs and writes a standalone rebuild
to `rebuilt-game/`; Python/Pillow is sufficient, with no network or private
authoring repository required.

## Selection and geometry

The four player silhouettes make the class choice visible: Robot2 is the compact
humanoid Scout; Amon is the articulated Rifle; the source-authored tracked
Modular robot is Guard; the broad NES robot is Lancer. Enemy Scout is the small
monitor-headed Computer Dude, enemy Rifle the red davilj humanoid, enemy Guard
the tall Fighting Robot, and enemy Lancer the box-and-wheel PlatForge actor.
Class names assign gameplay roles; the assets do not claim to contain a rifle,
lance, or each class's combat action. The renderer supplies actual shot/aim cues.

All robot images have a 64 by 64 canvas and ground anchor `[32,56]`. Fixed
cohort scales are Robot2/red davilj/Modular 0.875, Amon 0.8, NES 1.75, Computer
Dude 1.45, Fighting Robot 0.64 and PlatForge 0.6. Aspect ratios are preserved.
The small NES and Computer Dude sources are deliberately enlarged within the
64 maximum; the previous preparation's no-upscaling inventory described native
preparation and did not perform this game conversion. There is one scale per
character across all poses, with no automatic per-frame normalization.

Davilj uses source pivot `[32,64]`, Modular `[32,63]`, Amon `[32,68]` across
its retained source bands, NES `[16,32]` and PlatForge `[25.5,90]`. Computer
Dude's differing authored strip canvases are centered horizontally and placed
at the same baseline with a fixed 1.45 scale. Fighting Robot's irregular
non-grid crops use the explicit body pivots/row baselines in the generator;
arm extension does not trigger independent bounding-box recentering. These
chosen anchors are engineering alignment choices, not artist-supplied pivots.
Offline mirrors translate one pixel right after flipping so the ground anchor
remains x=32. Every crop, offset, scale and correction is in the manifest.

Front/back are offered only where available: Amon has both, PlatForge has both,
Robot2 and red davilj have front views. Other front/back requests explicitly
reuse side art. Side mirrors are reuse, not new authored views. Modular stays
static during movement; no new tread animation is claimed. Missing firing poses
reuse idle while actual fire feedback belongs to the arena. Robot2's crouch/
collapse row, red davilj's collapse row and NES row-4 fourth image supply
available death representations; other actors reuse idle and depend on the
renderer's death cue. Death sequences clamp at the last frame. The manifest
records all reuse, source timing (normally unspecified), suggested frame timing
and the fact that actual animation-step timing belongs to the arena simulation.

Terrain is always 32 by 32. LPC/FraMa uses native 32 pixels. Colony DB32 uses
exact integer 2x replication of native 16-pixel tiles. Training/interior use
LPC floor panels and cobbled paving, with teal walls and separate trim. Industrial
uses quieter Colony panels with LPC/FraMa wall material. Colony uses grey ground
with sparse paving texture and ribbed building wall material. Both floor choices
and solidWall are checked fully opaque; decorative props do not imply obstacles
on the playable floor. Props are native/aspect-preserved: door 64x64, crystal
32x64, console 32x32; Colony fixtures 48x48 and 32x48. The renderer may omit
large props when an inaccessible rim cannot contain them.

## Semantic palette mapping

The palette follows the fixed interface roles: transparent, light text, danger
red, light steel, orange, gold, teal, green, navy, player blue, purple, steel,
slate, earth, warm grey and near black. Exact RGB values are in palette.json.
Color zero is reserved for transparency. Opaque black maps to near-black index
15 and is never automatically keyed away. There is no nearest-RGB search,
generic palette quantization, dithering, or independent frame color fitting.

Every source RGB encountered receives an explicit output-index entry in the
generated manifest's `semantic_exact_rgb_maps`. Low-color sources have manually
specified authored ramps; high-color shaded sources use the following
source-specific material rules. Hue is HSV in [0,1], v is maximum RGB/255.
The whole selected palette/frequency distribution informed grouping; one
cohort's mapping stays fixed through all frames.

| Source/material | Mapping and protected features |
| --- | --- |
| Amon | Exact ten-color map: black outline to15; purple/blue joint shadow to8; deepest body blue to12; blue paint to9; lit blue to11; cyan highlight to3. Dark red hardware to13/2, lit orange hardware to4/5. No source color inferred by distance. |
| Robot2 | Saturated blue h .52-.77 keeps a navy/slate/blue/light-steel ramp at v .30/.60/.85. Neutral metal uses15/12/11/3/1 at v .23/.36/.59/.82. This protects helmet/arm metal, the chest's blue paint, joint gaps and dark feet as separate features. Warm accents map4/5. |
| Red davilj | Saturated red h <.13 or >.91 uses earth/red/orange at v .45/.75. Green eye hue .18-.48 stays6/7. Neutral metal uses15/12/11/3/1 at v .20/.35/.52/.78, preserving pale limbs against the dark chest. |
| Modular | Opaque black remains15. Neutral chassis uses8/12/11/3/1 at v .18/.24/.40/.70, deliberately lifting body steel from black outlines. Warm emitter/hardware maps4/5; cyan sensors stay9/3. This is the saved source-visible layer combination. |
| NES robot | Saturated blue becomes8/9/3 at v .40/.80, warm emitter4/5, neutral structure15/11/3/1 at v .25/.65/.95. Limited original colors preserve bold black joints and pale armour. |
| Computer Dude | Exact original metal ramp stays15/12/11/6/3/1. Cyan monitor emission is explicitly recolored red2, with darker cyan screen detail becoming13, distinguishing the hostile monitor while retaining the pale frame. |
| Fighting Robot | Opaque/dark structure stays15. Grey metal uses12/11/14/3 at v .40/.63/.80; green/yellow eyes remain7/5; red details remain2. Existing thin limbs and joints are retained rather than replaced with a new silhouette. |
| PlatForge | Authored blue panels are deliberately recolored enemy red2; dark blue panel edges remain8. Gold trim stays5; warm antenna4; teal detail6/3; neutral wheel/metal15/12/11/3/1. |
| LPC/FraMa | Explicit 25/18-color maps preserve navy/slate wall recesses, teal panels, steel trim, blue crystal, green status LEDs and red alerts. Floor's original closely spaced violet greys merge into12 with11 seams, keeping the floor behind actors. Warm seams remain13/15. |
| Colony DB32 | Explicit DB32 map retains material families and emitter colors. Floor material override maps source #595652 and #696A6A to12 and #847E87 to11; this merges minor ambient surface variations so actors and combat cues remain prominent. Wall and fixture maps retain the broader grey/warm-grey ramp. |

Partial alpha requires a one-bit MakeCode coverage decision: alpha below128 is
transparent, alpha128 or above is opaque. The first conversion that retained
all alpha>0 produced large dark fringe shapes around davilj movement frames.
The documented threshold removes that low-opacity fringe while preserving
opaque black structure. Excluded counts are recorded in the manifest. No
hand-drawn replacement pixels or local sprite pixel repairs were applied.

## Observed visual review and checks

The art-quality skill and foundation/art guide informed three concrete choices:
fixed action origins, silhouette/eye/joint contrast before decoration, and
actual floor/wall context for palette review. The initial contact scenes exposed
transparent trim selected as floor, an empty Colony alternate slot, low-alpha
fringe becoming opaque, and merged Robot2/red-robot shading. The final selection
replaces the empty/partial ground tiles, uses fully opaque walls, applies the
coverage threshold and separates the shaded metal/body ramps. Exact source
pixels remain available in the retained originals and selected source package.

Inspected `source-comparison.png` and the four `contact-scene-*.png` images:
player blue/steel, dark tracked Guard, bold pale NES Lancer, pale monitor enemy,
red humanoid, thin Fighting Robot and red box enemy remain distinguishable on
the actual chosen floor/wall materials. The Colony floor is deliberately quiet.
The previews are exact indexed-asset contact arrangements, not gameplay captures.

The deterministic build checks output indices0..15, all robot canvases64x64,
all floor/alternate/solidWall tiles fully opaque, and unchanged selected native
source hashes. It records every image's indexed-pixel hash. The integrated
runtime compile, active-state capture, actor simulation and publication remain
the lead's checks; this asset review does not claim learner completion or fun.
