# Robot Procedures — instructional source notices

The Functions instruction in Robot Procedures includes and adapts material by
Microsoft and contributors from these MakeCode activities:

- [Functions Intro](https://arcade.makecode.com/courses/csintro2/functions/intro)
  — the primary instructional progression: named tasks, definitions and calls,
  event reuse, behavior-preserving organization and reflection.
- [Functionally the Same](https://arcade.makecode.com/courses/csintro2/review/functions)
  — functions calling action helpers and placing calls in a larger task.
- [Functions with Parameters](https://arcade.makecode.com/courses/csintro3/functions/parameters)
  — parameter types, local scope and the values supplied by calls.
- [Two Sprites overlap](https://arcade.makecode.com/courses/csintro1/motion/overlap1)
  — event parameters and dragging their supplied values into event code.
- [Return Values](https://arcade.makecode.com/courses/csintro3/functions/returns)
  — producing, using and checking returned values, including Boolean results.

These first-party Arcade materials are covered by the retained Microsoft
MakeCode Arcade repository MIT license. Their notice is reproduced below.
The separately hosted Arcade pages retain this source/license identity even
where a MakeCode AP CSP lesson links to them.

Additional instruction adapts Microsoft and contributors' MakeCode AP CSP:

- [Writing Functions with Parameters, Unit 5 Day 2](https://github.com/microsoft/makecode-csp/blob/bdfb78e32f41fffba6bebc623379370151123773/content/unit-5/day-2/writing-functions-parameters.md)
  — typed inputs, related calls with different arguments and a Boolean input.
- [Writing Functions with Return Values, Unit 5 Day 3](https://github.com/microsoft/makecode-csp/blob/bdfb78e32f41fffba6bebc623379370151123773/content/unit-5/day-3/writing-functions-return-values.md)
  — giving back and using an answer, and changing inputs in test cases.

Microsoft-authored documentation and other content in MakeCode AP CSP are
licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
Code is licensed under the MIT License. The
[upstream legal notice](https://github.com/microsoft/makecode-csp/blob/bdfb78e32f41fffba6bebc623379370151123773/README.md#legal-notices)
records that distinction. This notice attributes those selected materials;
it does not imply Microsoft or any contributor endorses Robot Procedures.

Changes for Robot Procedures: sprite setup, greetings and movement examples
become robot-order tasks; the supplied event passes a numeric robot identity;
the learner creates six cumulative Functions; the guide models actual native
Blocks creation, typed inputs, call placement and returned-value connections;
the arena's shield/distance policy supplies the concrete comparisons; controlled
practice and battles use the learner's current code. Source action lists are
adapted to native block illustrations and focused explanations. The six Robot
Recipes and their game rules are adaptations, not a claim that a source already
contained this Robot course. Exact source hashes, selected passages and literal
adaptations are retained in the authoring record.

No source video, third-party image, externally linked Office artifact, student
work or College Board quotation is included through these selections. These
licenses do not grant rights in Microsoft names, logos or trademarks.

## MIT notice

```text
MIT License

Copyright (c) Microsoft Corporation. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE
```

The MIT notice above is retained verbatim from the archived MakeCode Arcade
license. The authoring rights record is
`docs/pedagogy/rights-assurance/RIGHTS_LEDGER.json`; the selected first-party
passages are listed in `design/pedagogy/SOURCE_SELECTION.json`.


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
