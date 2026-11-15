# DeckPlan v1.2: deck permit drawings for Carpenter Johnny

A static web app (HTML/JS, no backend, works offline). You enter a deck design and it draws a CAD-style permit set. Each of the three views the City asks for (plan, front elevation, side elevation) gets its own sheet:

| Sheet | Contents |
|---|---|
| A1 Site plan | Lot, street/lane, existing dwelling and garage, proposed deck and stair, setbacks a/b/c, north arrow, site notes (legal description, overhead lines, hot tub), site data, legend |
| A2 Plan view: framing & foundation | Ledger, joists, beams, posts, footings, guard line, stair, section cut, dimension chains, footing schedule, openings table, framing notes |
| A3 Front elevation | One view per sheet, at the largest standard scale that fits. Deck height and guard dimensions, level markers, callouts, and key notes (deck height, guard height and type, stair guard and handrail) |
| A4 Side elevation | Same layout as A3 |
| A5 Deck section & details | Deck section, ledger connection, stair section |
| A6 Design checks & City deck checklist | Every design check with its source, plus the City deck checklist (form p.4) filled in as designed (OK/NG/VERIFY/INPUT) |
| A7 Material list & budget | Take-off, prices, taxes, labour line |
| A8 (only if photos added) | Site photos, reference only |

## New in v1.2 (15 Nov 2026)

- **Separate sheets for the three views.** Plan, front elevation and side elevation each fill a whole sheet. Sheets are numbered in order.
- **Export City 3-view set** saves `city-3-view-<address>.pdf`: 3 pages (plan, front, side), each marked "CITY 3-VIEW SET, n OF 3". It works on 11x17 or letter.
- **Readability.** Minimum text is 7 pt (2.5 mm). Notes and callouts are 7.5–8 pt, dimensions 10 pt (3.5 mm), and view titles 16 pt. The title block is larger. Object lines are heavy (1.2–1.8 pt) and dimension lines thin (0.3 pt). Long callouts are wrapped or moved into notes blocks. The tests check font sizes and plan/elevation scales (3/16" = 1'-0" or larger). Site plans use engineering scales too, so they come out larger.
- **City compliance.** A6 now shows the City deck checklist. There are new inputs for screw-pile maker and model and for "foundation designed by engineer". Joist projection follows the checklist: 2x6 needs a seal, 2x8 is VERIFY over 16", 2x10+ is OK to 24". `research/WPG-SUBMISSION-COMPLIANCE.md` maps every City requirement to a sheet and gives each a status.
- **PDF3** (Export as 2 files) is now A2–A6. Budget and photos are left out.
- Offline cache is `deckplan-v1.2.0`. 59 tests.

## New in v1.1 (14 Nov 2026)

- **Doors and basement windows** on the house wall (MB ITS Guide 06 asks for them). Enter each one's type, distance from the deck's left end, width, height, and whether a window is a bedroom window. They are drawn on A1 (tags D1/W1), A2 (sliding-door and hidden-window symbols plus an openings table) and A3 (door above the deck, window below it, with a WELL note when it is below grade). Each opening gets a design check. A bedroom window under the deck is a VERIFY item for egress.
- **Post bracing.** Both guides say posts over 1.5 m (5'-0") should be braced, but neither gives a size. When posts are taller, 2x6 knee braces at 45° are drawn on the A3 elevations and the A4 section with a callout marked "SIZE VERIFY". The braces also go on the material list.
- **L-shaped decks.** A main deck plus a wing at either end. The deck is split into framed zones, each sized to City Tables 2 and 3 with its own beams, posts and footings. The joint between zones has a doubled rim, through-bolted, which is VERIFY. Framing, footings, checks, elevations, section and take-off all follow the shape.
- **Stair landing.** A straight-run landing partway down (halfway, 1/3 or 2/3), framed as its own platform on its own posts and footings, scheduled as F2. Riser split, landing guard, stair section with both flights, and a "landing length VERIFY" check, because the City deck guide doesn't give one.
- **Labour line** on A5: an editable rate × hours. With no rate entered it prints "ENTER RATE" and stays out of the total. Default hours are an estimate from deck size (sq.ft, footings, guard length, risers, landing). The hour factors are **placeholders** you can change in the app; they are not from any source. It is labelled "editable estimate", not a quote. GST is applied to materials plus labour and PST to materials only. The tax treatment of labour is marked VERIFY.
- **Drafting font.** osifont (ISO 3098 style), embedded once in each PDF as a CID TrueType font, so a 5-sheet PDF is about 75-85 KB.
- **Beam span count** now adds beam lines until both the joist span (Table 3) and each beam's supported joist length (Table 2, 10'-0" max.) fit. For example, a 20'x24' deck gets 3 spans.
- **Overlap QA.** `tools/overlap.js` measures every text box on every sheet and reports text-on-text and line-through-text hits. The tests require 0 on the sample, the L + landing demo, and a 20'x24' deck 8' high.

Every sheet has a border, a title block (Carpenter Johnny, project, address, legal description, owner, revision table, general notes, drawn by / checked / date / scale, sheet title and number) and a standard scale.

## Run it

- Open `index.html` from any static web server (for example `python3 -m http.server` in this folder, then visit `/index.html`). Opening the file directly also works; offline caching only switches on when it's served over http(s).
- **Export PDF** saves one multi-page PDF (11x17 landscape by default, or a reduced 8.5x11). The PDF is vector and not locked, so the City's reviewers can add comments and stamps.
- **Export as 2 files** saves `PDF2-site-plan…` and `PDF3-building-plans…`, matching the City's "PDF 2 Site Plan / PDF 3 Building Plans" file split.
- Save and Open store the whole project, photos included, as a `.json` file. The last project is also kept in the browser.

## Files

- `index.html`, `css/app.css`, `js/app.js`: UI and live preview
- `js/engine.js`: length parsing, City tables, framing geometry, design checks, material take-off, price defaults
- `js/svgkit.js`: CAD primitives (line weights, architectural-tick dimensions, leaders, hatches, level markers, view titles)
- `js/sheets.js`, `js/sheets2.js`, `js/sheets3.js`: sheet builders
- `vendor/`: jsPDF 4.2.1 and svg2pdf.js 2.9.0 (MIT, vendored locally, no CDN). jsPDF has a one-line patch so the embedded font's CID ordering reads "Identity", which some PDF readers need. The patch is noted in `LICENSE-jspdf.txt`.
- `vendor/osifont-lgpl3fe.ttf`, `vendor/osifont.js`: osifont 0.1.20221020 (LGPL-3.0 with font exception, https://github.com/hikikomori82/osifont). The license text is in `vendor/LICENSE-osifont.txt`.
- `sw.js`, `manifest.webmanifest`: offline/PWA
- `demo/sample-deck-permit.pdf` + `demo/page-1..7.png`: the sample deck (16'x12', 4' high).
- `demo/sample-L-deck-landing.pdf` + `demo/L-page-1..7.png`: an L-shaped deck, 20' + 8'x8' wing, 7' high, with a stair landing, a patio door and a bedroom basement window.
- `demo/*.deckplan.json`: both demo projects, which you can load with Open. `demo/sample-deck-city-3-view.pdf` (+ `-letter.pdf`) with `demo/3view-page-1..3.png` / `3view-letter-page-1..3.png`. `demo/v1.0/`, `demo/v1.1/`: previous outputs.
- `tools/e2e.py`: headless browser tests (59 in v1.2; Python Playwright, e.g. `/workspace/.venv-pw/bin/python tools/e2e.py`). Run it with the app served on 127.0.0.1:8931. `tools/overlap.js` is the overlap checker. `tools/svgdump.js` and `tools/shot.py` are render helpers.
- `research/`: downloaded source PDFs and text

## Sources (read 14 Nov 2026)

1. City of Winnipeg, *Decks — Construction information* (updated Oct 2025). https://www.winnipeg.ca/media/4997. Gives the permit triggers, Fig. 1 setbacks (7.5 m rear), surface pads (Table 1), the 1.8 m frost depth for deep foundations, post/beam spacing 2.44 m, beam Table 2, joist Table 3, cantilever and beam overhang 600 mm, guards 900/1070 mm, openings 100 mm, stairs (900 mm width, 200 mm rise, 255 mm run, 25 mm nosing), handrails (over 3 risers, 865–1070 mm), stair guards 900 mm, overhead conductors 3.5 m, and the sample site plan, construction plan and elevations.
2. City of Winnipeg, *Decks* web page. https://www.winnipeg.ca/building-development/building-renovating/home-improvement-projects/decks. Covers when development and building permits are needed.
3. City of Winnipeg, *Construct Addition — single/two family dwelling building permit application*. https://www.winnipeg.ca/media/7409. Lists the required site plan content (street/lane, distances to all property lines, overhead lines, legal description), the building plans (elevations, framing plan, foundation plan, cross-section with construction details) and the PDF file split. This is the residential addition form. The City's deck page sends applicants to the same Permits Online process.
4. City of Winnipeg, *Apply for a permit*. https://www.winnipeg.ca/building-development/building-renovating/apply-permit. Documents must be PDF, 50 MB maximum on Permits Online.
5. City of Winnipeg Information Bulletin 2026-010-B, *Drawing submissions*. https://www.winnipeg.ca/media/6155. Issue titles must read "Issued for Construction" or "Contract Documents" ("Permit Set" is not accepted), and the PDF must allow comments and markups. Note: the bulletin is issued by Commercial Plan Examination.
6. Manitoba Inspection & Technical Services, *BC Guide 06 — Part 9 attached or detached decks*. https://www.manitoba.ca/asset_library/en/labour/docs/its/its_bc_guide_06_part_9_attached_or_detached_decks.pdf. Layout plans must show species/grade, foundation type, stairs and doors. Elevations must show guard heights and spacing, and pre-made guard documents. It also gives the 355 mm maximum run.
7. Retail prices for the budget defaults (CAD, before tax, read 14 Nov 2026) are listed on sheet A5 with URLs (RONA and Home Depot Canada online).

**Conflict noted:** the province's ITS guide joist table differs from the City's Table 3 (for example 2x8 @ 16" is 11'-0 5/16" in the ITS guide and 12'-1" in the City guide, but at 24" it is 10'-6" in the ITS guide and 10'-2" in the City guide). The app uses the City table because the job is in Winnipeg. 2x12 joists aren't in the City table, so they show "VERIFY".

## What it checks, and what it marks VERIFY

Values come only from the sources above. Anything the sources don't settle is printed as VERIFY on the drawings, never guessed:

- Ledger fastener type and spacing. The City deck guide doesn't give them, so the default "LedgerLOK @ 16" staggered" is marked VERIFY.
- Concrete pier design. For deep foundations the City guide asks for an engineer-designed pier, or screw piles.
- Screw pile tested capacity against the footing load shown on A2.
- Side yard setback. It depends on the zoning district. Enter the number in the app and the check passes or fails.
- Pre-made guard system documents, composite decking span at the chosen joist spacing, the existing house rim condition, and the landing at the stair foot.
- v1.1 additions: knee-brace size; L-shape zone joint (doubled rim, bolt spacing); intermediate stair landing length; bedroom-window egress under the deck; tax treatment of labour. The labour hour factors are placeholders, and there is no default labour rate.

## Not covered

- Electrical (separate City permit), hot tubs, roofs or enclosures over the deck. Brace sizing is drawn but marked VERIFY.
- Bedroom window egress is flagged, not designed.
- Irregular lots, decks wrapping a corner (more than one wing), multi-level decks, turning (90°) stair landings, beams spliced over posts. Spans beyond the City tables need an engineer.
- Paper size isn't set in the City's deck material. v1 defaults to 11x17. Letter is a reduced print with a "do not scale" note.
- Nothing is stamped or certified. It is a contractor-prepared drawing set based on the City's prescriptive guide.

## Ideas for v2

- Photo or sketch to dimensions: read a rough sketch or site photos and pre-fill the form.
- Hosted version behind a login, with projects saved to JobCam's Supabase per client job.
- A supplier price list (Winnipeg yard quote) imported as a CSV, and Johnny's own labour rate and hour factors saved as his defaults.
- Turning (L/U) stair landings, multi-level decks, wrap-around and U-shaped decks, and an engineered-brace detail once the City or an engineer gives a size.
- PDF/A output.
