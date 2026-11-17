# Deck Planner v1.3: deck permit drawings for Carpenter Johnny

A static web app (HTML/JS, no backend, works offline). You enter a deck design and it draws a CAD-style permit set. Blueprint drawings only: five sheets, each on its own PDF page. Johnny makes his own takeoff and pricing from the drawings. There is no material list, budget or 3D view.

| Sheet | Contents |
|---|---|
| A0 Site plan | Lot outline with dimensions, house and deck footprints (deck dimensioned to the house), setbacks from the deck to the side and rear property lines (a, b) and the dwelling rear yard (c), street and lane labels, north arrow, scale, civic address and legal description. Follows the City of Winnipeg deck guide / addition-form site plan requirements |
| A1 Overhead plan: framing & foundation | Ledger, joists, beams, posts, footings (including stair foot piles), guard line, stair, dimension chains, footing schedule, openings table, framing notes |
| A2 Front elevation | One view per sheet, at the largest standard scale that fits. Deck height and guard dimensions, level markers, callouts, and key notes (deck height, guard height and type, stair guard and handrail) |
| A3 Side elevation | Same layout as A2, looking at the left end |
| A4 Cross-section and details | A section from the house wall to the outer beam (ledger, flashing, hangers, joists, beam on post, post-to-pile connection, guard, decking, grade and height dims), plus enlarged ledger and post/beam/pile details, and a stair stringer detail when the project has a stair |

Each sheet has a border and a title block (Carpenter Johnny, project, address, legal description, owner, revision table, general notes, drawn by / checked / date / scale, sheet title and number such as "1 OF 5").

## New in v1.3.2 (17 Nov 2026)

- **Name.** The app is called Deck Planner everywhere you see it (page title, header, home-screen / install name, PDF title and creator). Internal identifiers are unchanged: the repo and Pages URL stay `/deckplan`, the offline cache prefix is still `deckplan-`, and saved projects still use the same localStorage key and `.deckplan.json` extension, so existing files still open.
- **Customer raises grade.** An optional yes/no plus a finished-grade raise amount (inches; one uniform value). When it is on, the 2'-0" permit, pile and guard decisions use the walking-surface height above *finished* grade. The app and the drawings show both numbers (for example `2'-3" above existing grade, 1'-9" above finished grade`). If that finished height is 2'-0" or lower, Pylex is OK and the no-permit / no-guard logic follows the finished height. A note on the drawings reads: owner to raise finished grade before completion; heights measured from finished grade (VERIFY with City). The parenthetical "to within 2'-0" of deck surface" is only used when the finished height is actually 2'-0" or lower. This is not claimed as City-approved.
- **Both grades on the drawings.** Elevations, the A4 section and the A0 notes show existing grade (dashed) and proposed finished grade (solid). The height dimension is taken from finished grade. Pile embedment is still measured from existing undisturbed grade, and the drawings say so. Stairs land on finished grade.
- **Pile notes are info, not warnings.** Screw-pile capacity, an unknown pile maker, and the 3-pile stair-width cutoff are listed as INFO, so they do not increment the "to verify" chip. A foundation type that is not allowed (for example Pylex on a deck still over 2'-0" after the raise) stays NG.
- Offline cache is `deckplan-v1.3.2`. PDF creator is `Deck Planner v1.3.2`. 84 tests. A third sample (16'×12' at 2'-3" existing with a 6" raise, Pylex) is in `demo/v1.3/` as `sample-grade-raise.pdf` / `.deckplan.json` and `grade-page-0.png` … `grade-page-4.png`.

## New in v1.3.1 (17 Nov 2026)

- **Five sheets, still drawings only.** After a review of the unpublished 3-view v1.3 set, Export PDF is the 5-page set in this order: A0 site plan, A1 overhead plan, A2 front elevation, A3 side elevation, A4 cross-section and details (title blocks read "1 OF 5" … "5 OF 5"). Material list, budget, labour, checklist, site photos and any 3D view stay out of the UI and the PDF. The in-app checks badge still lists OK/NG/VERIFY items so you can review the design before you export.
- **Site plan inputs** on the form (lot width and depth, house size and front/left setbacks, deck offset from the house's left corner, street name, lane yes/no, north facing, optional side-yard requirement, garage, overhead lines). Sensible sample defaults are saved in the project JSON. Anything not entered is labelled VERIFY. Side and rear setbacks from the deck to the property lines are computed from those inputs (not typed as raw a/b distances).
- **Cross-section and connection details** on A4, using the same stricter-of-code-or-Johnny's-SOP rules as the other sheets (Gary Taylor helical piles on permit decks over 2'-0"; Pylex only at 2'-0" or lower).
- Offline cache is `deckplan-v1.3.1`. 68 tests.

## New in v1.3 (17 Nov 2026)

- **Drawings only.** The first v1.3 cut was a 3-page set (overhead plan, front elevation, side elevation). Material list, budget, labour, checklist, site photos and 3D were removed from the UI and the PDF. v1.3.1 keeps that rule and adds the site plan and section the City still asks for.
- **Johnny's foundation rule** (stricter than the City guide, so it wins): any permit deck over 2'-0" uses Gary Taylor helical piles, installed by a certified installer. Pylex piles only on decks 2'-0" or lower (typically no permit). The sample default is a 4'-0" deck on Gary Taylor helical piles. A different foundation on a permit-height deck is marked NG.
- **Stair foot piles.** A stair about 4'-0" wide sits on 2 piles; a larger stair gets 3. The exact width cutoff for 3 is TBD from Johnny, so 3-pile stairs are marked VERIFY. On a permit-height deck these piles follow the same Gary Taylor rule as the deck.

## New in v1.2 (15 Nov 2026)

- Each of the three building views filled its own sheet, alongside a site plan, section, checks and material list.
- Readability: minimum text 7 pt (2.5 mm), notes and callouts 7.5–8 pt, dimensions 10 pt (3.5 mm), view titles 16 pt. Object lines are heavy (1.2–1.8 pt) and dimension lines thin (0.3 pt). Tests require 0 text overlaps and scales of 3/16" = 1'-0" or larger on plan and elevations.
- City compliance notes and joist-projection rules (2x6 needs a seal, 2x8 is VERIFY over 16", 2x10+ is OK to 24"). `research/WPG-SUBMISSION-COMPLIANCE.md` maps City requirements to sheets; v1.3.1 again prints the site plan and the cross-section / details sheet.

## New in v1.1 (14 Nov 2026)

- **Doors and basement windows** on the house wall (MB ITS Guide 06). They are tagged D1/W1 on the site plan, overhead plan and front elevation, with an openings table on A1 and a WELL note on the elevation when a window is below grade. The side elevation points back to that table. A bedroom window under the deck is a VERIFY item for egress.
- **Post bracing.** When posts are taller than 1.5 m (5'-0"), 2x6 knee braces at 45° are drawn on both elevations with a callout marked "SIZE VERIFY".
- **L-shaped decks.** A main deck plus a wing at either end, split into framed zones sized to City Tables 2 and 3. The joint has a doubled, through-bolted rim, marked VERIFY.
- **Stair landing.** A straight-run landing partway down, framed as its own platform on its own posts and footings, scheduled as F2. The stair foot piles are scheduled as F3 when a landing is present, or F2 when it is not.
- **Drafting font.** osifont (ISO 3098 style), embedded in each PDF.
- **Beam span count** adds beam lines until both the joist span (Table 3) and each beam's supported joist length (Table 2, 10'-0" max.) fit.
- **Overlap QA.** `tools/overlap.js` measures every text box on every sheet. The tests require 0 collisions on the sample, the L + landing demo, and a 20'x24' deck 8' high.

## Run it

- Open `index.html` from any static web server (for example `python3 -m http.server` in this folder, then visit `/index.html`). Opening the file directly also works; offline caching only switches on when it's served over http(s).
- **Export PDF** saves one 5-page PDF (11x17 landscape by default, or a reduced 8.5x11 with a "do not scale / reduced print" note). The PDF is vector and not locked, so the City's reviewers can add comments and stamps. Save / Open round-trip includes the site plan inputs.
- Save and Open store the whole project as a `.json` file. The last project is also kept in the browser.

## Files

- `index.html`, `css/app.css`, `js/app.js`: UI and live preview
- `js/engine.js`: length parsing, City tables, Johnny's foundation rule, framing geometry, design checks
- `js/defaults.js`: Johnny's standard build (the editable sample project)
- `js/svgkit.js`: CAD primitives (line weights, architectural-tick dimensions, leaders, hatches, level markers, view titles)
- `js/sheets.js`, `js/sheets2.js`, `js/sheets3.js`: title block, site plan, overhead plan, elevations, and the cross-section / details builders
- `vendor/`: jsPDF 4.2.1 and svg2pdf.js 2.9.0 (MIT, vendored locally, no CDN). jsPDF has a one-line patch so the embedded font's CID ordering reads "Identity", which some PDF readers need. The patch is noted in `LICENSE-jspdf.txt`.
- `vendor/osifont-lgpl3fe.ttf`, `vendor/osifont.js`: osifont 0.1.20221020 (LGPL-3.0 with font exception, https://github.com/hikikomori82/osifont). The license text is in `vendor/LICENSE-osifont.txt`.
- `sw.js`, `manifest.webmanifest`: offline/PWA. Cache name: `deckplan-v1.3.2`. The install / home-screen name is Deck Planner (`name` and `short_name` in the manifest, plus `apple-mobile-web-app-title`).
- `demo/v1.3/`: v1.3.2 sample 5-page PDFs, page PNGs and project files (the 16'x12' 4' sample, the L-shaped deck with landing, and the 2'-3" existing / 6" grade-raise sample). `demo/v1.2/` is not a separate folder; older outputs remain in `demo/` alongside `demo/v1.0/` and `demo/v1.1/`.
- `tools/e2e.py`: headless browser tests (Python Playwright, e.g. `/workspace/.venv-pw/bin/python tools/e2e.py`). Run it with the app served on 127.0.0.1:8931. `tools/overlap.js` is the overlap checker. `tools/svgdump.js` and `tools/shot.py` are render helpers.
- `research/`: downloaded source PDFs and text, plus `JOHNNY-RULES.md`.

## Sources (read 14 Nov 2026)

1. City of Winnipeg, *Decks — Construction information* (updated Oct 2025). https://www.winnipeg.ca/media/4997. Gives the permit triggers, Fig. 1 setbacks (7.5 m rear), surface pads (Table 1), the 1.8 m frost depth for deep foundations, post/beam spacing 2.44 m, beam Table 2, joist Table 3, cantilever and beam overhang 600 mm, guards 900/1070 mm, openings 100 mm, stairs (900 mm width, 200 mm rise, 255 mm run, 25 mm nosing), handrails (over 3 risers, 865–1070 mm), stair guards 900 mm, overhead conductors 3.5 m, and the sample site plan, construction plan and elevations.
2. City of Winnipeg, *Decks* web page. https://www.winnipeg.ca/building-development/building-renovating/home-improvement-projects/decks. Covers when development and building permits are needed.
3. City of Winnipeg, *Construct Addition — single/two family dwelling building permit application*. https://www.winnipeg.ca/media/7409. Lists the required site plan content (street/lane, distances to all property lines, overhead lines, legal description), the building plans (elevations, framing plan, foundation plan, cross-section with construction details) and the PDF file split. This is the residential addition form. The City's deck page sends applicants to the same Permits Online process.
4. City of Winnipeg, *Apply for a permit*. https://www.winnipeg.ca/building-development/building-renovating/apply-permit. Documents must be PDF, 50 MB maximum on Permits Online.
5. City of Winnipeg Information Bulletin 2026-010-B, *Drawing submissions*. https://www.winnipeg.ca/media/6155. Issue titles must read "Issued for Construction" or "Contract Documents" ("Permit Set" is not accepted), and the PDF must allow comments and markups. Note: the bulletin is issued by Commercial Plan Examination.
6. Manitoba Inspection & Technical Services, *BC Guide 06 — Part 9 attached or detached decks*. https://www.manitoba.ca/asset_library/en/labour/docs/its/its_bc_guide_06_part_9_attached_or_detached_decks.pdf. Layout plans must show species/grade, foundation type, stairs and doors. Elevations must show guard heights and spacing, and pre-made guard documents. It also gives the 355 mm maximum run.
7. Carpenter Johnny's SOP, recorded 15 Nov 2026 in `research/JOHNNY-RULES.md`: permit decks over 2'-0" use Gary Taylor helical piles (certified installer); Pylex only on decks 2'-0" or lower; a stair about 4 ft wide sits on 2 piles, a larger stair on 3 (exact cutoff TBD).

**Conflict noted:** the province's ITS guide joist table differs from the City's Table 3 (for example 2x8 @ 16" is 11'-0 5/16" in the ITS guide and 12'-1" in the City guide, but at 24" it is 10'-6" in the ITS guide and 10'-2" in the City guide). The app uses the City table because the job is in Winnipeg. 2x12 joists aren't in the City table, so they show "VERIFY". Where Johnny's SOP is stricter than the City guide (foundation type on permit-height decks), the SOP wins.

## What it checks, and what it marks VERIFY

Values come only from the sources above. Anything the sources don't settle is printed as VERIFY on the drawings, never guessed:

- Foundation type vs height (measured above finished grade when a raise is entered, otherwise above existing grade): a permit deck over 2'-0" that is not on Gary Taylor helical piles is NG. Pylex on a permit-height deck is NG. Pile tested capacity is listed as INFO (it still appears on the drawings with VERIFY in the wording, but it does not increment the "to verify" chip).
- Stair foot pile count: 2 piles when the stair is about 4'-0" wide is OK; 3 piles on a wider stair is listed as INFO because the exact cutoff is TBD.
- Finished grade raise: when the raise is on, a VERIFY item reminds you to confirm the finished-grade height with the City. An unreadable raise, or a raise that is not less than the existing-grade height, is NG and is not applied.
- Ledger fastener type and spacing. The City deck guide doesn't give them, so the default "LedgerLOK @ 16" staggered" is marked VERIFY.
- Concrete pier design, if someone still selects a sonotube. For deep foundations the City guide asks for an engineer-designed pier, or screw piles.
- Pre-made guard system documents, composite decking span at the chosen joist spacing, the existing house rim condition, and knee-brace size.
- L-shape zone joint (doubled rim, bolt spacing); intermediate stair landing length; bedroom-window egress under the deck.

## Not covered

- Material list, budget and labour. Johnny makes his own takeoff and pricing from the drawings.
- Electrical (separate City permit), hot tubs, roofs or enclosures over the deck. Brace sizing is drawn but marked VERIFY. (Hot tubs and sunrooms are helical piles per Johnny's SOP, but the app has no hot-tub input.)
- Bedroom window egress is flagged, not designed.
- Irregular lots, decks wrapping a corner (more than one wing), multi-level decks, turning (90°) stair landings, beams spliced over posts. Spans beyond the City tables need an engineer. Side-yard zoning is not filled in by default, so side setbacks are marked VERIFY until a required side yard is entered. Legal description on the sample is a placeholder marked VERIFY. Pile tested capacity is still noted on the drawings (INFO in the badge). A deck can still need a permit for area (over 36 sq.ft) even when the finished-grade height is 2'-0" or lower. A finished-grade raise is marked VERIFY with the City; the drawings do not claim it is code-approved.
- Paper size isn't set in the City's deck material. v1.3 defaults to 11x17. Letter is a reduced print with a "do not scale" note.
- Nothing is stamped or certified. It is a contractor-prepared drawing set based on the City's prescriptive guide and Johnny's SOP.

## Ideas for later

- Photo or sketch to dimensions: read a rough sketch or site photos and pre-fill the form.
- Hosted version behind a login, with projects saved per client job.
- Turning (L/U) stair landings, multi-level decks, wrap-around and U-shaped decks, and an engineered-brace detail once the City or an engineer gives a size.
- Confirm the stair-width cutoff for 3 foot piles with Johnny, then drop the leftover INFO on that check.
- PDF/A output.
