# Shop Simulator

A Cycle Start Studios game. You start with an empty industrial building and a little money, and
build it into a plastic injection mold shop: buy the machines, hire the people, win the customers,
quote the work, build the tools, ship them on time. It is a comedy. The mechanics are not.

Same foundation as Buy Stove: a static site, Three.js vendored, no build step, plays in a browser
on desktop or phone.

## Design

Everything is decided in [docs/DESIGN_BIBLE.md](docs/DESIGN_BIBLE.md) before it is built. The
brand catalogue (every machine, software package and supplier in the game, spoofed off the real
world) is in [docs/BRANDS.md](docs/BRANDS.md).

## Running it

It is a static site. There is no build step and nothing to install; Three.js is vendored under
`js/vendor/`. Because it uses ES modules it must be served over HTTP rather than opened as a file:

```
python3 -m http.server 8080
# or
npx http-server -p 8080 .
```

Then open http://localhost:8080/.

## Controls

- WASD / arrows to walk, Shift to run, mouse to look, click or E to use, Esc to pause.
- `V` switches between walking the floor and the overhead (isometric) view. `Tab` opens the clipboard.
- In the overhead view: click a machine to pick it up and move it. While placing: drag the ghost or click where it goes, arrow keys nudge it, `R` rotates, Enter or CONFIRM lands it, Esc or CANCEL puts it back.
- Time is minute for minute. `1` `2` `3` set the clock to 1x, 2x, 3x; `P` or Space pauses it; `N` (or the END DAY button) runs the clock to five o'clock. At five you lock up or stay late. At eleven you go home whether you like it or not.
- Short sleep makes you tired. Tired owners press the wrong button and are sure they clamped things they did not clamp.
- On a touchscreen: left side of the screen is a joystick, drag on the right to look, tap to use. The ISO and CLIP buttons do what the keys do.

## Testing shortcuts

- `?cash=250000` starts with more money.
- `?day=30` starts on a later day.
- `?speed=20` runs the shop clock twenty times faster on top of the in-game speed buttons (for testing a day in minutes).

## What is in this build (v0.1, first slice)

- The cold open and the paperwork: name your shop. The name goes on the sign.
- The empty 2,500 sq ft building: block walls, 20 ft ceiling, a tarp for a bay door, an office
  with a desk and a whiteboard, a breaker panel good for two machines, a compressor that never stops.
- Walk the floor in first person; lift the roof off with `V` and place machines on a grid.
- The Stage 0 catalogue: knee mill, lathe, surface grinder, bench, drill press, band saw, new or used.
- The clock, minute for minute, with 2x, 3x and END DAY; the five o'clock choice; the night at home; fatigue the morning after a late one. Cash, weekly rent and hydro, a ledger, autosave when you lock up.
- Walk up to a machine, open its panel, and do the setup steps: each is a few seconds of hand-eye work
  (clamp it, indicate it in, pick a speed). Botch one and that step is skipped. Then press CYCLE START.
  Skipped steps are how things break. Money fixes it.

- Contracts. RFQs from other mold shops and local molders arrive in the inbox: component work,
  inserts, plates, repairs. Quote against the estimate (the slider tells you how they will take it),
  hear back overnight, get a deposit, wait for the steel, run the stages on your machines in order,
  ship from the clipboard, and get the balance on terms. Stages you have no machine for can go out
  to the shop down the road at twice the rate. Scrap a stage and you buy the steel again. Late
  ships cost money and reputation; on-time ones bring more RFQs.

- People. Resumes land on the desk every Monday: apprentices, machinists, moldmakers, each with a
  blurb, a quirk, claimed skills (the resume is not under oath) and a wage. Hire one and they walk in
  through the tarp the next morning, find work that needs doing, walk over, set the machine up (their
  skill decides how many steps they botch), run it, take lunch at noon, and leave at five. Click them
  to hear what they think. They have grievances (the coffee, the stool, the radio, a raise) you can fix,
  pay for, or tough out. Morale shows in how they stand. Payroll is Fridays. Low enough morale and they
  quit with a speech. Point them at a machine yourself from their panel, or from the overhead view.

- Stage 1: CNC. A VMC, a sinker EDM and a wire EDM, modelled with care, each needing circuits the
  panel does not have, air the compressor cannot give, and CAM software. The building upgrades
  (electrical service, compressors, a real bay door, fire suppression, tool-break detection, dust
  extraction) take a contractor and a few days. Software seats cost upfront and weekly; the borrowed
  "Community Edition" is free until the registered letter. Machines over $20k can be financed at
  10% down; the bank offers a start-up loan on day one and a line of credit after three shipped jobs.
  CNC setup is clamp, probe (stop the ruby on the block) and pick the right program from a list that
  includes NEW_FINAL_v2_USE_THIS.NC. CNCs keep cutting after you lock up: tools break, the sinker can
  catch fire, and the morning is a reveal. CNC-class contracts at $95/hr arrive once a CNC is on the
  floor, some with a heat-treat stage that goes to Quench & Sons and sometimes comes back in two pieces.
  Weekends exist. Achievements go on the wall in the BANK tab.

- Things to throw. Scrap blocks in the bin, the block of P20 on the rack, the coffee on the desk,
  the chuck key somebody left out, and a dead-blow hammer. Walk up, click to pick up, click to
  throw, G to put it down. A block into a CNC window is a glazier's bill. A block into a person is
  a WSIB claim, three days off, and a crew that saw. Coffee on the floor is a wet floor. The hammer
  on a machine is percussive maintenance: usually a bent handwheel or a spiderwebbed pendant,
  occasionally it works and nobody knows why. Scrap into the bin from downtown is nothing but net.
- Real molds. Once a CNC is on the floor and the reputation is there, consumer customers send RFQs
  for new tools: single and multi-cavity, P20 to stainless, B to A finishes, slides, cold or hot
  runners. A mold is a set of work items (the base from DMV, the cavity, the core, each slide, a hot
  runner from Mould-Majors) that move through the shop on their own and in parallel, after the owner
  designs it at the office PC (CAD seat required, or a contract designer). Then fit and spot and
  assembly at the bench, a tryout at the molder, and the bible's defect table on the sample parts:
  flash, short shots, sink, stuck parts, pin marks, water leaks, dimensions out, burn marks, slide
  hang-ups. Each defect becomes a revision stage and another tryout. Terms are 30 on PO, 30 at T1,
  40 on approval. A mold with no notes at T1 goes on the wall.

Not yet: Stage 2 machines, the crane, the second building, year-end summaries. Next.

## Layout

```
index.html        screens: intro, naming, the floor HUD, clipboard, machine panel, pause
style.css
js/main.js        glue: intro -> naming -> the shop
js/intro.js       the cold open, the articles of incorporation
js/catalog.js     the machines you can buy, the building's dimensions, random shop names
js/sim.js         the simulation: clock, cash, ledger, buying, selling, save/load. no three.js
js/shop.js        the building: slab, walls, tarp, office, compressor, lights, dust
js/machines.js    machines as shapes, with nameplates and light stacks
js/iso.js         the overhead view and placing machines in it
js/player.js      first-person controls, collision, touch
js/ui.js          HUD, clipboard (shop, machines, bank), machine panel
js/minigames.js   the setup minigames: clamp, indicate, speed
js/jobs.js        contracts: customers, RFQ templates, quoting, jobs and stages, shipping, terms
js/people.js      the crew as numbers: roles, resumes, wages, morale, grievances, payroll
js/person.js      a person as shapes: capsule limbs, a face, hair, caps, beards, vests; the poses
js/crew.js        the crew on the floor: arriving, finding work, walking, setting up, lunch, leaving
js/nav.js         a half-metre grid and A*, so nobody walks through the lathe
js/items.js       things you pick up and throw, and what happens when they land
js/game.js        render loop, interaction, keys, pause, autosave
js/audio.js       every sound, synthesized. the compressor is most of them.
js/textures.js    canvas textures: concrete, block, tarp, nameplates, the sign
js/vendor/        three.js r160 (MIT)
models.html       developer page: every machine on a turntable (?id=knee_mill, ?all), people (?person&seed=7)
tools/            artifact page builder
```

## Publishing to a claude.ai artifact

The artifact host wraps the page in its own document skeleton, so it takes a body fragment rather
than `index.html` itself. `tools/make-artifact.mjs <out-file>` derives that fragment; publish it
with `style.css` and `js/**` as supporting files.
