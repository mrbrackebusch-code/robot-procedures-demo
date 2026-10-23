# Robot Procedures supplied artwork

This game adapts the following owner-supplied artwork. Artist names, source
links and the source license choices remain attached to the artwork. Palette
conversion, fixed canvas placement, geometric resizing and offline horizontal
mirrors were made for Robot Procedures in October 2026. These are adaptations,
not newly authored poses. No AI replacement artwork is used.

The artwork is excluded from any blanket license statement for the game's code.
The image literals in `implementation/supplied-world/art.ts`, their PNG copies,
atlases and contact previews contain these separately licensed visual works.
The per-image `assets/game-art/manifest.json` identifies every source, crop,
transformation and source family. Preserve this notice and each applicable
license when distributing those works.

| Used work / role | Credit and source | Artwork license path retained |
| --- | --- | --- |
| Robot2 / player Scout | davilj, [Robot2 Sprite sheet](https://opengameart.org/content/robot2-sprite-sheet) | Source lists GPL 2.0. Its only-versus-or-later qualifier is unspecified; this package does not invent one. |
| Animated Robot / player Rifle | Amon (Panayiotis Yianni), [Animated Robot](https://opengameart.org/content/animated-robot); artist [amon.pro](https://amon.pro) | CC0 1.0. Optional artist credit retained. |
| Modular 64x Robots / player Guard | Croomfolk / YuriNikolai, [Modular 64x Robots](https://opengameart.org/content/modular-64x-robots) | CC BY-SA 4.0. Both artist names and original `treadbots_README.txt` retained. Uses the saved visible ASE layers, not a falsely claimed authored animation. |
| 30 SciFi Creatures NES style, robot row 4 / player Lancer | Imogia Games (NES recolor); original art by Stephen Challener (Redshrike), hosted by OpenGameArt.org. [NES version](https://opengameart.org/content/30-scifi-creatures-nes-style), [original creature artwork](https://opengameart.org/content/scifi-creature-tileset-mini-32x32-scifi-creature-icons) | Offered CC BY 4.0 path for the recolor; original CC BY 3.0 attribution and source link also retained. OGA-BY alternatives are recorded in source metadata but are not the selected distribution path. |
| Computer Dude / enemy Scout | Bombfire, [Computer Dude Assets](https://opengameart.org/content/computer-dude-assets-0) | CC0 1.0. Source's requested credit retained. |
| Robot / enemy Rifle | davilj, [Robot Sprite sheet](https://opengameart.org/content/robot-sprite-sheet) | GPL 2.0 as listed; same unspecified qualifier as Robot2. |
| Fighting Robot / enemy Guard | Stephen Challener (Redshrike), hosted by OpenGameArt.org, [Fighting Robot for Ultimate Smash Friends](https://opengameart.org/content/fighting-robot-for-ultimate-smash-friends) | Offered CC BY 3.0 path. Commissioned by Open Game Art; requested OpenGameArt link retained. |
| Robot / enemy Lancer | Hannah Cohan; PlatForge project, [Robot](https://opengameart.org/content/robot-0) | CC BY-SA 3.0. Both required attribution parties retained. |
| LPC Goes to Space / floors, walls, console | Basxto; Hyptosis; FunwithPixels; Skorpio, [LPC Goes to Space](https://opengameart.org/content/lpc-goes-to-space) | Offered CC BY-SA 4.0 path. GPL 3.0 alternative remains recorded in source metadata and is not the selected path. |
| LPC FraMa Sci-Fi Extensions / door, crystal, industrial trim | Basxto; Wonko; Hyptosis; FunwithPixels; Skorpio, [LPC FraMa extensions](https://opengameart.org/content/lpc-frama-sci-fi-extensions) | Offered CC BY-SA 4.0 path, with parent-family credits preserved. |
| Colony sim: extended version, DB32 variant / alternate environments and fixtures | rubberduck and Buch, [Colony sim: extended version](https://opengameart.org/content/colony-sim-extended-version) | CC0. DB32 is a source palette variant, not a separately claimed environment or new artist. |

License texts are included in `assets/game-art/notices/`: `GPL-2.0.txt`,
`CC-BY-3.0.txt`, `CC-BY-4.0.txt`, `CC-BY-SA-3.0.txt`, `CC-BY-SA-4.0.txt`
and `CC0-1.0.txt`. `LICENSE_SOURCES.json` records their GNU/SPDX retrieval
locations. Full source-intake notices are retained as `*-SOURCE.json` alongside
them. The selected corresponding source package under `assets/game-art/sources/`
contains the actual original sheets/project, selected native input crops,
modular components, source-coordinate manifests and hashes. The deterministic
conversion recipe is `tools/build-game-art.py` in the game source.
The public `assets/game-art/selected-art-source.zip` contains all selected
corresponding inputs, notices, manifest, palette and that recipe, with fixed
archive timestamps. Extract it and run its recipe with Python/Pillow to rebuild
into `rebuilt-game/`; no private collection or network access is required.

The GPL-listed davilj artwork and its converted derivatives retain the source
GPL 2.0 notice, source files, palette mappings and build recipe. CC BY-SA
derivatives retain their respective 3.0 or 4.0 notices. These notices do not
relicense unrelated artwork under another source family's license. This is an
asset provenance and distribution notice, not a claim that the separately
licensed image families were originally one work.
