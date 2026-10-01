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

- Stage 2. A spotting press (fit and spot in a third of the time, and the flash goes away), a CMM
  (dimensions stop being out at tryout), a graphite mill with its own extraction (cut electrodes on
  the VMC instead and the dust gets into everything), a hard-milling VMC that runs every stage in
  three quarters of the time, a CNC grinder that runs lights-out, and a laser welder that brings in
  repair work for anyone who can weld. The overhead crane goes up on runway beams along both walls;
  without it a real mold goes to Bramalea on a flatbed for fit and spot, and the riggers want cash to
  get a big machine off the truck.
- Things that happen. The bible's event table in the inbox: "just a small change" mid-build, steel
  not on the truck, slow payers, Rick calling before six, a poaching call for your best moldmaker,
  the inspector after a WSIB claim, the radio war, a customer going under, and the odd compliment.
  Every fifty-two weeks the night screen sums the year up.
- Each machine sounds like itself: a VMC whines, a grinder screams, the EDMs crackle.
- Life on the floor. The crew talk in speech bubbles over their heads, gather round a crash to look
  and not help, and argue about the radio on the steel rack (click it to change the station; every
  station is somebody's wrong station). The whiteboard in the office lists what is actually due.
  The two war stories from the bible are in: ship a mold late on a Friday and the revision lands
  Monday at 8:04; the first stuck part at tryout is The Draw. The wall of achievements is on the
  pause screen.

- The second building. The SHOP tab sells a move to the 10,000 sq ft unit across the lot: four
  times the floor, two real bay doors, 600 amps, air for four, an inspection room with glass
  walls for the CMM, a break room with a fridge nobody cleans, and rent to match. Moving day is a
  weekend; everything comes off the trucks unplaced and you lay the floor out again from the
  clipboard. The crew carried it and would like that noted.

- The score. The BANK tab says what the shop is worth: cash, the iron at what a dealer would give
  you, what is owed to you on terms, half of what is still on the floor, less the bank. The
  year-end summary now counts hires and quits, the on-time rate, the best day and the worst one,
  and the valuation. After ten years the night screen grows a second button. The retirement paper
  has the numbers, the record, what the crew said at the party (it is not a roast; it is close),
  and an offer that depends on the number. ONE MORE YEAR is always there. SELL THE SHOP ends the
  game; the wall of achievements comes with you into the next one.

- Things break. Every machine has way oil, fifty hours a fill, and nobody checks it; dry, it sings
  and the condition drains. The machine panel sells a top-up and a service (a day down, condition
  back). Tired machines quit overnight with a reason ("the Z axis lost its mind"). Call the tech:
  the cheap brands send the dealer, who is also the dealer, in two to four days; the good brands
  send a factory tech tomorrow for more money. Or duct tape it: back now, louder, next crash is
  yours. When a crash is coming the stack light goes red, the alarm sounds, the crew says so, and
  the hint says E-STOP!: press E in time and it costs a cutter instead of a spindle. Four weeks
  in the red and the bank calls it; the autosave from the start of the month is on the desk.

- Fun on the floor. The fire extinguisher is on a bracket by the door, under a sign, with a tag
  from 2009. Skip the flushing on the sinker and it can catch fire mid-cut, in the daytime, with
  flames, smoke, an alarm and the crew going outside; grab the bottle and press E on the machine
  (PUT IT OUT) before it burns out, goes DOWN, and costs the deductible. The suppression upgrade
  does it for you. Squeeze it at somebody who is not on fire if you want to. The air hose hangs
  beside the compressor: blow chips off a machine (into the ways; use a brush), or at a person
  (there is a poster). Carry the coffee to somebody instead of throwing it and morale goes up,
  and so does suspicion.

- Stage 3, the big leagues. A Hermlin 5-axis (every VMC stage in half the time, and Dorval
  Automotive starts sending RFQs for bezels with four slides, sixty-day terms and a portal that is
  down). A Lad Machines sampling press: clamp the mold in, set the shot, and see the flash
  yourself ninety minutes later instead of in an email three days later; T1 money lands the same
  day. A Kilnworth heat-treat oven: four hours instead of two days at Quench & Sons, and if you
  skip setting the temperature the block comes out shaped like a banana. The oven runs overnight.
  The press does not sample itself.

- The steel truck. Steel no longer appears on the rack by magic. Bramalea Steel Supply backs a cube
  van up to the door at seven and the driver stands inside with a clipboard and nine more stops.
  Press E on him to sign and the steel is on the rack. Ignore him until noon and he leaves it on
  the pad, in the rain, with a note. The whiteboard reminds you.
- Practice. Every cycle a person runs is practice. Fifteen on one kind of machine and their real
  skill goes up a notch, whether or not the resume agrees. An apprentice who gets good on a mill,
  lathe or grinder asks for the machinist's rate and gets it.

- The customer walks the floor. Some mornings somebody from a customer turns up in a visitor vest
  and safety glasses and wanders past three machines and the whiteboard, forming an opinion out
  loud: a machine with a sign on it, duct tape, a full scrap bin and a relaxed-looking crew count
  against you; a running machine, a crane, a CMM, the 5-axis and the big building count for you.
  Press E on them to say hello (once). The verdict comes by email that night, sometimes with an
  RFQ attached. Throw something at them and the verdict comes faster.

- Life and detail. Crew with nothing to run go and sweep, with a broom, and say so. The driver
  holds a real clipboard; if nobody signs within ten minutes and somebody on the crew is idle,
  they sign for it and initial the wrong box. The inspection room has a granite surface plate on
  a stand, a height gauge and a case of gauge blocks. There is a vending machine by the office
  (and in the break room). B4 is stuck. Everyone knows B4 is stuck. Press E anyway, $2.

- The radio plays. Five synthesized stations through a small, bad speaker on the steel rack:
  classic rock (the same four bars since 1978), country with a train beat, a man who is certain
  about something, the French station in three, and static. It gets quieter as you walk away
  and louder when you come back, like a real one. Click it to change it; somebody will object.

- The office phone. It rings during the day, with a red light, and it falls off with distance so
  you hear it best from the far end of the shop. Answer it at the desk: Rick (or a customer) with
  a rush job at a rush rate and two days, a complaint you can talk down, or a man about your
  extended machine warranty who costs four minutes. Let it ring and the rush job goes to
  Lakeshore and the complaint becomes a voicemail.

- Money and morale. The BANK tab lists what is owed to you, who is late, and a FACTOR button on
  each invoice: 85 cents on the dollar today from a company called Receivable Solutions, who
  will write to your customer. The expensive last resort, as the bible says. Disgruntled crew
  with nothing to do stand at the vending machine instead of sweeping, technically on break.

- The traveller, the boss, and overtime. Every live job has a paper traveller on a clipboard,
  with a coffee ring, hanging on a nail on the office wall or lying beside the machine that has
  it. Look at it to see where the job is and when it is due; pick it up and click to read the
  JOBS tab; throw it if you must. Standing behind somebody while they run a machine cuts their
  crash odds and teaches them faster, and they will tell you to go. At five o'clock a third
  button keeps the whole crew late at time and a half, with a look and a morale cost.

- The speech. Somebody whose morale hits the floor does not vanish overnight any more: the night
  note says there will be a speech, and at half past nine they walk to the middle of the floor,
  the others gather to watch and not help, three lines go up over their head (what it is about,
  and that the radio stays on their station), and they walk out the door. A third of the time
  they take a customer's number with them and that customer goes quiet for a month. Happy crew
  whistle. The crew leave sticky notes on machines after crashes, dry oil and duct tape
  (NOT MY FAULT, OIL ME, TAPE IS LOAD BEARING); a service takes them down.

Next: more things to do on the floor, more things that go wrong, and whatever the first playtest
turns up.

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
js/events.js      the things that happen overnight, and the year summary
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
