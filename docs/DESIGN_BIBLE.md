# SHOP SIMULATOR — Design Bible

**Studio:** Cycle Start Studios · **Status:** 1.1 — all questions answered (John: §1–4, §10 and brands; Claude: the rest, veto any time). Building is under way: the empty shop, Stage 0 machines, the real-time clock, the setup minigames, the first Stage 0 contracts, the first hires (with proper figures, not boxes), Stage 1 (CNC machines, facility upgrades, software and the letter, financing, lights-out, CNC-class contracts), real mold builds (work items, design, vendors, tryout and revisions, 30/30/40 terms), Stage 2 machines and the crane, throwing things with consequences, the event table, the move to the second building, the valuation, the retirement ending at ten years, maintenance and breakdowns with tech visits, the E-stop, the bank calling it, the floor toys (extinguisher, air hose, coffee), Stage 3 (5-axis, sampling press, oven), the steel truck, skills that grow with practice, customer visits, the radio, the phone, the small life of the floor (sweeping, chips, sticky notes, travellers, the speech), insurance, factoring, the schedule board, the trade show, prototype and transfer tools, the Saturday, the estimator, the night shift, the program, the failure table of §12.1, and the coffee fund jar, the cake on ship day and the tools that walk from §8.7, and the spreading morale, the boomerang hire, the blue hands, the wrong edge, the customer who touches everything and the whiteboard portrait from §8.3 and §8.7, the polisher's corner, the two who will not run half the shop, and the whole cutting-corners table of §12.2 (cheaper steel, ship without T2, skip inspection, the framed estimate sheet), the tool crib of §3.2, the full milestone list of §11, the vendors with reliability of §6.3, the rest of the sound list in §13.3, the deliberate stupidity of §1.4, the bidder count of §7.3, and all seven customer segments of §7.1 are playable. See the README for what each build contains.
**Sibling reference:** Buy Stove (same technical foundation: first-person, Three.js, browser, no build step)

---

## 0. How to read this document

This is the single source of truth for what Shop Simulator is, before a line of game code is
written. It is deliberately written as a set of **proposals with questions attached**, because the
person reviewing it runs a real plastic-injection mold shop and the whole point of the game is that
the manufacturing is right.

Every section ends with a **Questions for you** block. Every claim about how a mold shop works is
my understanding from the outside and should be treated as *needs checking* until it is marked
agreed.

Status markers used throughout:

| Marker | Meaning |
|---|---|
| 🟡 **Proposed** | My suggested default. Reasonable, but not confirmed. |
| ❓ **Needs input** | I do not know enough to decide. Do not build on this until answered. |
| 🟢 **Answered by Claude** | John asked me to decide. My best call, built on the agreed sections. Veto any of these at any time; they are not ✅ until you say so. |
| ✅ **Agreed** | Reviewed and signed off by John. Safe to build. |

Section 17 collects every question in one numbered list so review can go top to bottom.
Section 18 is the decision log: when a question is answered, the answer goes there and the
relevant section is rewritten and marked ✅.

---

## 1. Pitch

**One line:** You inherit an empty industrial building and a little money. Turn it into a plastic
injection mold shop: buy the machines, hire the people, win the customers, quote the work, build the
tools, and ship them on time. Or go broke trying.

**Genre:** First-person shop-floor tycoon. You physically walk the floor of your shop in 3D
(like Buy Stove), but the meat of the game is management: quoting, scheduling, purchasing, hiring,
and watching a mold move through the shop from steel to sample parts.

**Fantasy:** "I could run this place." The satisfaction of an empty 20,000 sq ft slab slowly
filling with machines, the first mold going out the door, the first repeat customer, the first time
a job you quoted at $85,000 comes in under hours.

**Why this game:** Tycoon games about restaurants, farms and car washes exist by the hundred.
Nobody has made one about toolmaking, and nobody who has made a factory game has done the
job-shop reality: every job is different, quoted from a print, and the money arrives months after
the steel is paid for.

### Tone ✅ Agreed

**Comedic and light-hearted, on top of real mechanics.** The point is to make people laugh while
running a shop that actually works like a shop. The comedy comes from **what happens**, not from
mocking the trade:

- You crash a machine. Not a number going down: the spindle screams, the enclosure window
  spiders, an end mill is embedded in the ceiling, and the apprentice is standing next to it
  holding a coffee.
- You scrap a block. Six weeks of work goes in the scrap bin with a satisfying clang, and someone
  writes "OOPS" on it in paint marker.
- Employees get disgruntled. They sulk, they walk slower, they leave passive-aggressive notes on
  the whiteboard, they quit at the worst possible moment with a speech.
- Customers are unreasonable in the ways real customers are. The revision that arrives the day
  before ship. The email that says "just a small change." The purchasing agent who wants it
  cheaper, faster, and also different.

The mechanics underneath are honest. A crash has a real cause (green operator, bad program, rushed
setup) and a real cost. The joke is in the presentation and the consequences, never in the
simulation being fake. A real moldmaker should laugh because it is *true*, not because it is silly.

Buy Stove's DNA that carries over: a big list of achievements, most of them for disasters; a game
that comments on what you do; things that happen when you are not looking; a straight face while
absurd things occur.

### Comedy principles 🟡 Proposed

1. **Every failure is visible, physical, and specific.** Nothing bad happens as a toast message
   only. If it can be shown in 3D on the floor, it is.
2. **People are characters.** Every hire has a name, a face-equivalent (hat, beard, hi-vis), a
   quirk, and a grievance. The shop remembers who crashed what.
3. **The customer inbox is a comedy channel.** RFQs, revisions, complaints, and payment excuses
   are written to be read aloud.
4. **Achievements celebrate the wrong things.** "Ran the wrong program", "Ordered the wrong
   steel, twice", "Shipped it anyway", "The apprentice survived a year".
5. **The trade is never the butt of the joke.** The jokes are about people, customers, and the
   way things go wrong. The craft itself is shown with respect.
6. **Success is funny too.** The first mold going out the door should feel like a parade.

### 1.4 The player ✅ Agreed

You are the **owner**, and you came up through the trade. You can run any machine in the shop and
build a mold yourself, start to finish. The shop does not need you to be good; it needs you to be
in more than one place at once, which you cannot be. That is why you hire.

The comedy of the crew is **hiring the wrong people**: the resume that said "5-axis" and meant
"watched a video", the polisher who is excellent and also never on time, the machinist who is
brilliant and does not believe in soft jaws. And the comedy of the trade is that **accidents
happen to the best tradesmen too**. A twenty-year moldmaker crashes a machine with the same bang
as the apprentice; he just swears better.

**Accidentally or on purpose, both are entertaining.** The player is allowed to do dumb things on
purpose: rapid a spindle into the vise to see what happens, throw a block off the mezzanine, run
the sinker with no dielectric. The game does not stop you. It shows you, charges you, remembers it,
and hands you an achievement. Deliberate stupidity is a feature, with a bill attached.

### 1.5 The shop name ✅ Agreed

The player names the shop on day one. The name goes on the sign over the door, the letterhead of
every quote and invoice, the crates that ship, the coffee mugs, and the customer's complaint
emails ("Dear [SHOP NAME], regarding the flash on…"). Renaming later costs a new sign.

### Questions for you

- **Q1.** ~~Tone~~ ✅ Answered: comedic and light-hearted, real mechanics underneath. See above.
- **Q50.** ~~Narrator?~~ ✅ Answered: no narrator. Commentary comes from the people in the shop
  and the customer inbox, so the comedy has faces.
- **Q2.** ~~Owner works the floor?~~ ✅ Answered: the player is the owner, came up through the
  trade, and can run any machine and build a mold themselves. See §1.4 and §8.4.
- **Q3.** ~~Shop name~~ ✅ Answered: the player names the shop. See §1.5.

---

## 2. Platform and technical baseline

Carried over from Buy Stove unless noted. This part is not domain-dependent; it is here so the
whole team (you and me) agrees what we are building on.

| Item | Decision |
|---|---|
| Delivery | Static site, no build step, no framework. `index.html` + `style.css` + `js/*.js` ES modules. |
| 3D | Three.js vendored under `js/vendor/`, same as Buy Stove. |
| Audio | Synthesized in Web Audio, no audio files (spindle whine, EDM crackle, air hose, crane beeper, forklift, hydraulic press). |
| Input | WASD/mouse with pointer lock; drag-to-look fallback; on-screen joystick + tap on touch. |
| Persistence | `localStorage` save slots. Autosave at end of each in-game day. |
| Publishing | Repo root is the playable build, synced into `cyclestartstudios/games/shop-simulator/` by `sync-games.sh`, minified and wrapped as a PWA like the others. |
| Assets | Everything procedural: canvas textures, box/cylinder/lathe geometry. No modelled meshes, no image packs. Machines are stylised, readable silhouettes, not CAD. |
| Testing shortcuts | Query params for fast time (`?speed=`), starting cash (`?cash=`), skip-to-day (`?day=`). |

### 2.1 Camera: two views, one shop ✅ Agreed

The game has **two views of the same shop**, switched with one key (`V`) or a HUD button:

| View | What it is for | Feel |
|---|---|---|
| **3D first-person** (the core view) | Being in the shop. Walking the floor, picking things up, loading machines, pressing buttons, talking to people, throwing things. | Buy Stove: pointer-lock look, WASD, click to touch / pick up / throw. |
| **2D isometric** (the management view) | Seeing the whole shop at once. Placing machines, reading the floor, spotting the idle guy, dragging a job to a different machine. | Anvil & Acre-style overhead of the same 3D scene: the camera lifts to a fixed isometric angle, the roof comes off, the HUD shows tags on everything. |

Same scene, same objects, same state. Switching view never pauses the shop. The isometric view
is a camera, not a separate game.

### 2.2 Walk around and do stuff ✅ Agreed (details 🟡 Proposed)

The core loop is **physical**. Management screens exist to manage; they are not where you live.
The floor is where the game happens:

- **Pick things up:** a block of steel, an electrode, a box of ejector pins, a coffee, the
  apprentice's phone. Small things by hand; big things (mold bases, big blocks, a finished mold)
  need the crane or a forklift, which you drive.
- **Load a machine:** carry the block to the VMC, put it on the table, close the door, press
  **CYCLE START**. The big green button. The spindle winds up. That is the moment the game is
  named after, twice.
- **Do the stage yourself** (see §8.4): stay and work, or walk away if it can run unattended.
- **Talk to people:** walk up, click, get a line. What they say is what they think of the job,
  the shop, and you. This replaces the narrator.
- **Read the shop:** status light stacks on every machine, chips on the floor, crates by the
  door, a whiteboard in the office, sticky notes on things. If you walk the floor you know the
  schedule.
- **Throw things.** Because you can. Throw a block of steel at an employee and you get a
  **WSIB claim**, a bill, a very disgruntled employee, and an achievement. Throw it at a machine
  window and you get a glazier's invoice. Throw the coffee and you get a wet floor sign. Buy
  Stove's throw physics carry straight over; the consequences are new.

### 2.3 The management UI 🟡 Proposed (scope per Q5 ✅)

Secondary, on purpose. Opened from the office PC, or from a **clipboard** in the player's hand
(`Tab`) so you can quote a job standing next to the machine. It is a 2D overlay: inbox, quotes,
jobs, schedule, purchasing, people, bank. It is there to manage; it is not the main view, and it
should never be the screen you spend most of your time in. If a thing can be done on the floor by
walking and clicking, it is done on the floor. The UI is for the things that only happen on paper.

### 2.4 Phones ✅ Agreed

Phones get the same walk-around game with Buy Stove's touch controls (left-side joystick, drag to
look, tap to act), plus the isometric view which is naturally touch-friendly (tap to select, drag
to pan, pinch to zoom, as in Anvil & Acre). The management overlay is responsive. No
"management-only" phone build.

### 2.5 Loading a machine ✅ Agreed

The physical sequence at a CNC, for the player or for an employee:

1. Put the block on the table (or in the vise / on the fixture). Big blocks need the crane.
2. Close the door.
3. **Probe it.** Run the automatic probe cycle to pick up the job and set the work offset.
4. **Select the program.** The right one. From a list that also contains last month's jobs, a
   test program, and something called `NEW_FINAL_v2_USE_THIS`.
5. **CYCLE START.**

Steps 3 and 4 are where crashes come from. Skip the probe and the offsets are wherever they were
last: the first rapid move finds out. Pick the wrong program and you machine a beautiful cavity for
somebody else's part, or drive a tool through the vise. An employee's skill decides how often they
skip a step or pick wrong; the player can skip them on purpose, and the game lets them.

The same idea applies elsewhere with different steps: the sinker needs the electrode indicated and
the tank filled; the wire needs the wire threaded and the part squared; the grinder needs the wheel
dressed. Each machine has its own short checklist and its own way of punishing a skipped item.

### Questions for you

- **Q4.** ~~Camera~~ ✅ Answered: both. First-person 3D is the core, 2D isometric for management
  and layout, switchable at any time.
- **Q5.** ~~Phone = management-first?~~ ✅ Answered: no. Walk-around is the game on every device.
- **Q51.** ~~Command people from isometric?~~ ✅ Answered: both. Click-to-command in the
  isometric view, and talk to them on the floor (faster, and they like it more).
- **Q52.** ~~Loading fidelity~~ ✅ Answered: carry, seat, door, CYCLE START, **plus two steps
  that matter**: pick up the job with the **automatic probe** (set the work offset) and **select
  the correct program**. Skipping either is how crashes happen. See §2.5.

---

## 3. The shop (the building)

### 3.1 Starting state ✅ Agreed (to be verified in-game)

You start in a **2,500 sq ft** industrial unit:

- Bare slab, block walls, **20 ft ceilings**.
- **One bay door**, about the height of a small truck, with a **tarp strip-curtain** rather than a
  proper roll-up (it flaps, it lets the winter in, it is the first thing everyone complains about).
  Cheap to start, upgradeable to a real door (§3.3). ✅
- **Power and air come with the shop**, sized for **two machines**. A small compressor in the
  corner that cycles constantly.
- A small office box, a bathroom, a breaker panel, fluorescent lights with half the tubes out.
- **No crane.** Anything you cannot lift or move with a pallet jack gets outsourced until you buy
  one.

It is small. 2,500 sq ft fills up fast: two machines, a bench, a steel rack and a desk and you are
already walking sideways. That is the point; the second building is a real milestone. These numbers
are agreed on paper and will be checked when the empty shop is first walked in 3D.

### 3.2 Zones 🟡 Proposed

The floor is a grid of **bays**. Machines and benches occupy bays and have a footprint. The player
chooses where things go in the isometric view. Layout affects walking time, crane reach (later),
and whether the forklift can get to the door.

| Zone | What lives there | Starts as |
|---|---|---|
| Machining bays | CNC mills, EDM, grinders | Empty slab, room for two |
| Bench / fitting area | Moldmaker benches, later the spotting press | Empty slab |
| Tool crib | Cutters, electrodes, consumables, hardware | Empty shelving |
| Steel rack | Incoming plate and blocks | Empty |
| Inspection room | CMM, granite plate, height gauges | Not in this building |
| Sampling / press area | Injection press for tryouts | Not in this building |
| Shipping | Crates in and out | The bay door and a pallet jack |
| Office | Desk, PC, whiteboard, phone | Yours, day one |
| Break room | Coffee. Morale. | A kettle on a filing cabinet |

### 3.3 Upgrades vs. purchases 🟡 Proposed (judgement per Q8 ✅)

Two kinds of things you buy for the building. **Upgrades** change what the building can do and
gate other purchases. **Purchases** are things you place on the floor.

**Facility upgrades** (gate capacity, usually a contractor, usually a few days of disruption):

| Upgrade | Gates | Notes |
|---|---|---|
| Electrical service | Number and size of machines | Starts at "two machines". Each step is a transformer, a panel, an electrician, and a week of "the power guy is coming Thursday" |
| Compressor | Machines that need air; air tools; blow-off | Starts small and constantly cycling. Bigger compressor, then a dryer, then a receiver tank |
| Overhead crane / jib crane | Moving anything over what a pallet jack handles: mold bases, big blocks, finished molds | **Not on day one.** Until then big work is outsourced. The crane is a moment |
| Foundation pads | Big VMCs, grinders, sinker EDM | Cut the slab, pour, wait |
| Proper bay door | Truck deliveries in the rain, heating bill | Replaces the tarp. Everyone cheers |
| Climate control | Inspection room, jig grinder, polishers in July | |
| Coolant / chip handling | Cleanliness, floor state, tooling costs | Chip bins, coolant recycling |
| Dust extraction | Cutting graphite on a production mill without wrecking it | See §4.6 |
| Fire suppression | Lights-out EDM without the 3 a.m. phone call | See §4.3 |
| Heat-treat oven | In-house hardening | Stage 3, if Q57 says yes |
| Expansion / second building | More bays, inspection room, press area | The mid-game step |

**Simple purchases** (placeable, arrive on a truck, no contractor):

Machines (§4), benches, shelving, steel rack, tool crib contents, pallet jack, forklift, chip
bins, scrap bin, whiteboard, coffee machine, radio, fridge, microwave, first aid kit, safety
glasses dispenser, wet floor sign, a chair that does not squeak.

### 3.4 Software licenses 🟡 Proposed (from Q7 ✅)

A shop needs **CAD** (to design the mold), **CAM** (to program the mills), and eventually
**shop software** (scheduling, quoting, job tracking). These are **licenses**: an upfront cost and
an annual maintenance fee, per seat. They are part of the first $20k and they never stop.

Every package is a spoof of a real one; the full list, with the real-world price tiers behind
it and the legal house rules, is in [BRANDS.md](BRANDS.md).

There is a **cheaper option**. The game offers a "borrowed" copy of CAD and CAM for free. It works.
It works right up until it does not: an audit letter, a lawsuit, a settlement bill that dwarfs the
licenses you skipped, and a week with no CAM. The longer you run on it and the bigger the shop
gets, the more likely the letter. A one-person shop can probably get away with it for a while. A
twelve-person shop cannot. The choice is the player's, and the achievement is called "Genuine
Advantage".

### 3.5 Day one, and the first $20k ✅ Agreed (numbers 🟡)

Per Q7, the first money goes to:

1. **Machines** (used, see §4),
2. **an employee**,
3. **software licenses** (or not, see §3.4),
4. and then, immediately, **tooling and steel** for the first job.

And the first job does not pay when you ship it. It pays on terms, in pieces, weeks later. The
steel was cash on day one. This is the squeeze the whole money game is built on (§9), and the
shop's first year is about surviving it.

### 3.6 Outsourcing big work 🟡 Proposed (from Q7 ✅)

Until the crane arrives, and until the machines are big enough, jobs that need it go **out**:
large blocks machined at another shop, big mold bases handled elsewhere, sampling at a molder.
Outsourced stages cost more, take longer, and depend on somebody else's schedule. This is the
same vendor system as heat treat and texturing (§6.2), and it means the early game can quote work
it cannot physically do, at a margin cost. Buying the crane and the big machine is what stops the
bleeding.

### Questions for you

- **Q6.** ~~Starting building~~ ✅ Answered: 2,500 sq ft, one small-truck bay door with a tarp
  system, 20 ft ceilings, power for two machines. To be verified visually in-game.
- **Q7.** ~~Facility gates~~ ✅ Answered: air and power come with the shop but need upgrading as
  machines are added; no crane on day one, outsource big work until then; first $20k is machines,
  an employee and software licenses; steel and tooling on top; customers pay late and progressive
  terms hurt.
- **Q8.** ~~Facility list~~ ✅ Answered: my judgement on upgrade vs. purchase; you will redirect
  as needed.
- **Q53.** ~~Software naming~~ ✅ Answered: everything spoofed off real companies, software and
  machine builders alike, within the legal house rules. Catalogue in [BRANDS.md](BRANDS.md).
- **Q55.** Vet [BRANDS.md](BRANDS.md): strike, rename, add. The §6 shortlist there is what the
  first playable needs.
- **Q56.** ~~Genvision~~ ✅ Answered, loosely: yes as an Easter egg, pending the boss. Kept
  behind a single flag so it can be removed without a trace.
- **Q54.** ~~Tarp door~~ ✅ Answered: cheap to start, upgradeable; the strip-curtain as written.

---

## 4. Machines

This is the catalogue the player buys from. Every machine carries a **spoofed brand** (Hoss,
Mikano, Sodiak, Bitsumishi; the full list is in [BRANDS.md](BRANDS.md)), and brand is a real
attribute: it sets the price tier, reliability, service response and parts lead time, and how the
crew feels about running it. Every machine has: purchase price (new and used), footprint,
power/air/foundation needs, what stages it can do, hours-per-stage multiplier, tool changer (or
not), condition, breakdown behaviour, operator skill required, and resale value.

### 4.1 Progression: manual first ✅ Agreed

Machines come in **stages**, and the shop climbs them with capital or loans:

**Stage 0, manual.** A knee mill, a lathe, a manual surface grinder, a bench, a drill press and a
band saw. With these you can do **small blocks and components**: pins, sleeves, inserts, small
plates, repairs, revisions, and fitting work on other people's molds. You cannot cut a cavity of
any size in a sensible time. This is the whole early game: enough small work to bank the money
(or the credit history) for the first CNC.

**What Stage 0 work pays** ✅: small contracts (component work for other shops, repairs,
revisions, small aluminum prototype inserts) run about **$50–60 per hour**. Bigger contracts, the
kind you need CNC for, run about **$90–120 per hour**. That gap is the reason to buy the VMC, and
the game should show it on the quote screen: the same hour is worth twice as much once you can
sell it as mold work.

**Stage 1, first CNC.** A used 3-axis VMC, then a sinker EDM and a wire EDM. Now you can build a
real mold, slowly, with a lot of outsourcing (§4.5).

**Stage 2, a real shop.** Bigger VMCs, a hard-milling machine, a dedicated graphite cutter, CNC
grinding, a gun drill, a CMM, a spotting press, the crane. Outsourcing shrinks.

**Stage 3, the big leagues.** 5-axis, a sampling press, large EDM, maybe a heat-treat oven, a
second building.

### 4.2 Catalogue 🟡 (prices are a starting point per Q10 ✅)

| Stage | Machine | What it does in the game | Price guess (new / used) |
|---|---|---|---|
| 0 | Manual knee mill (Bridgeford) | Drilling, tapping, small blocks, fitting-room fixes | $15k / $5k |
| 0 | Manual lathe (Hardedge, Coldchester) | Round inserts, pins, sprue bushings, core pins | $20k / $6k |
| 0 | Surface grinder, manual (Herring, Okeymoto) | Squaring blocks, plates flat and parallel | $25k / $8k |
| 0 | Bench, drill press, band saw | Fitting, cutting stock | $5k |
| 1 | 3-axis VMC, small, 30 taper (Hoss, Hurtco) | Roughing and finishing cavities and cores, base machining | $90k / $40k |
| 1 | Sinker EDM (Charmer, Sodiak) | Ribs, sharp corners, deep pockets, text; needs electrodes | $120k / $45k |
| 1 | Wire EDM (Excusetek, Bitsumishi) | Inserts, ejector pin holes through hardened steel, slides | $150k / $60k |
| 2 | Dedicated graphite mill (Rudders, Daytron) | Electrodes, with dust extraction built in | $80k / $35k |
| 2 | 3-axis VMC, large, 40/50 taper (Dozan, Okayma) | Big bases and blocks | $250k / $110k |
| 2 | Hard-milling VMC (Mikano, Yesda) | Finishing in hardened steel, cuts EDM and polish hours | $300k–$500k / $130k |
| 2 | Gun drill (UNISIGH) | Long straight water lines | $120k / $50k |
| 2 | CNC surface grinder | Faster, unattended grinding | $90k / $40k |
| 2 | CMM (Zeus, Heptagon) | Inspection; unlocks tolerance-critical customers | $110k / $50k |
| 2 | Spotting press (Millennial, Rice) | Spotting the parting line, fitting | $80k / $30k |
| 2 | Laser welder (Alfa Lazer) | Repairs and revisions; needs a welder (§4.5) | $60k / $25k |
| 3 | 5-axis mill (Hermlin, DGM Nori, Grub) | Complex cores and cavities, fewer setups, the hard contracts | $500k–$1M / $250k |
| 3 | Large gantry 5-axis (Pappas, Zimmerframe) | The automotive blocks | $1M+ |
| 3 | Sampling injection press (Lad, Angel) | In-house tryouts instead of paying a molder | $150k / $60k |
| 3 | Large sinker / large wire | Bigger molds | $250k+ |
| 3 | Heat-treat oven ✅ | In-house hardening; needs power and a permit; its own way of ruining a block | $150k+ |

### 4.3 Lights-out ✅ Agreed (rules 🟡)

Anything can run unattended **if it has enough to do**. The rules:

- The stage must be **long enough** to be worth walking away from: a finish cut, a long EDM
  burn, a wire cut through a plate. A ten-minute drilling op is not lights-out.
- The machine needs a **tool changer** with the tools the program needs loaded. Manual machines
  and single-tool setups do not qualify.
- **Tools wear and break.** Every lights-out run rolls tool life against the hours. A worn tool
  gives a bad surface (rework). A broken tool, unnoticed, means the machine cuts air for the rest
  of the night: **lost cutting time**, and sometimes a damaged part. Better machines and **tool-break
  detection** (a buyable upgrade ✅) reduce the odds; they never remove them.
- **EDM catches fire.** A sinker running unattended with the dielectric low, the flushing wrong,
  or a bad electrode can ignite. It is rare. It is a night you remember. **Fire suppression** is a
  buyable upgrade ✅. Insurance is a monthly cost that you will be glad of exactly once.
- The morning after is a **reveal**: walk in, look at the machine. Either a finished block and a
  good day, or a spun tool, a pile of chips in the wrong shape, and a call to the tooling rep.

### 4.4 Crashes, breakdowns and repair ✅ Agreed (numbers 🟡)

Damage is a **spectrum**, and money fixes anything. A lot of money fixes it properly; a little
band-aids it and gets it running.

| Severity | What happened | Consequence |
|---|---|---|
| Broken cutter | The most common. A snapped end mill, a chipped insert | Lost time, a new tool, maybe a mark to polish out. On lights-out: a night of air cutting |
| Bump | A small collision, a rapid into a clamp, a heavy chatter | The machine **loses accuracy**. Nothing looks broken. Parts come out bad, or barely in tolerance, and may still be acceptable. A recalibration fixes it; a shop that ignores it makes worse molds and does not know why |
| Weld | No spindle coolant, no oil, a dry cut on hard steel | Tool welded to the workpiece. Block rework, spindle inspection |
| Catastrophic | Spindle into the table, into the vise, into the fixture | Machine down. **A tech has to come**. Parts on order: cheap machines have **long parts lead times**, expensive ones have a tech on a plane. Weeks of downtime, a bill with a comma in it |
| Fire | EDM unattended, dielectric issue | Machine gone or gutted, smoke damage to the shop, insurance claim, the fire department has questions |

**Maintenance** is a running cost and a running chore: way oil, spindle coolant, filters,
dielectric, way covers. Skip it and the condition rating falls; low condition raises every roll
above. "You ran out of oil" is a thing that happens to a busy shop, and the game should let it.

**Repair choices** when something breaks:

| Option | Cost | Effect |
|---|---|---|
| Proper fix (OEM tech, OEM parts) | High, slow on cheap brands, fast on premium | Condition fully restored |
| Band-aid (local tech, used part, "it'll run") | Low, quick | Runs, but condition capped lower and accuracy suspect until fixed properly |
| Ignore it | Free | It gets worse. It always gets worse |

### 4.5 In-house vs. outsourced ✅ Agreed

What goes out, and when it can come in:

| Work | Day one | Comes in-house when |
|---|---|---|
| **Heat treat** | Always out (no oven) | When a heat-treat oven is bought (Stage 3) ✅ |
| **Grain texture** | Always out | Never. A texture house is a texture house |
| **Hot runner manifold systems** | Always purchased | Never built in-house; always a vendor with a lead time |
| **Gun drilling** | Out | When the gun drill is bought |
| **Welding** (repairs, revisions) | Out | When a laser welder is bought **and** someone on the crew has the welding skill (a rare skill, not a separate trade; some moldmakers come with it, others can learn it) ✅ |
| **Big machining** (large blocks, bases) | Out | When the crane and a large-enough machine exist |
| **Electrodes** | In, badly (any mill in a pinch, dust everywhere) | Properly when a dedicated graphite mill with extraction arrives |
| **Sampling / tryout** | Out (at a molder) | When a sampling press is bought |
| **Inspection to a report** | Out or by hand | When the CMM arrives |
| **Polish** | In | Always in; specialist A-grade polish may still go out (Q18) |

Outsourced work costs more, waits on somebody else's schedule, and has a vendor reliability roll.
Bringing it in-house is a capital decision the player makes with the numbers in front of them.

### 4.6 Graphite ✅ Agreed

Any mill can cut electrodes **in a pinch**. Doing it on the production VMC costs you: the dust
gets into the ways, the operator, the coffee, and everything else on the floor; condition drops
faster, the crew complains, and the machine is not cutting steel while it is cutting carbon. A
**vacuum / dust-extraction system** is a facility purchase that removes most of the cost; a
**dedicated carbon cutter** with its own extraction removes all of it and is what a real shop wants.

### Questions for you

- **Q9.** ~~Catalogue~~ ✅ Answered: manual machines first (small blocks and components), CNC
  when there is capital or a loan. Table reordered by stage.
- **Q10.** ~~Prices~~ ✅ Answered: good start; 5-axis moved up toward $1M for the serious ones.
- **Q11.** ~~Lights-out~~ ✅ Answered: anything with a long enough cut, needs a tool changer,
  tools wear and break, EDM can catch fire. See §4.3.
- **Q12.** ~~Graphite~~ ✅ Answered: dedicated carbon cutter wanted; any machine in a pinch with
  a dust cost unless there is a vacuum system. See §4.6.
- **Q13.** ~~Outsourcing~~ ✅ Answered: heat treat always (no oven), texture always, manifolds
  always; gun drill and welding until you have the machine or the person. See §4.5.
- **Q14.** ~~Crashes~~ ✅ Answered: a spectrum from broken cutter to spindle in the table; bumps
  reduce accuracy silently; no maintenance welds tools to parts; money fixes anything, properly or
  with a band-aid. See §4.4.
- **Q57.** ~~Heat-treat oven~~ ✅ Answered: yes, a Stage 3 upgrade.
- **Q58.** ~~Welder~~ ✅ Answered: a skill, rare, some moldmakers come with it.
- **Q59.** ~~Stage 0 work~~ ✅ Answered: components, repairs, revisions, small aluminum protos
  at about $50–60/hr; bigger CNC-class contracts at about $90–120/hr.
- **Q60.** ~~Upgrades~~ ✅ Answered: yes to tool-break detection and fire suppression.

---

## 5. The product: what a mold is, in game terms

The game needs an abstract model of a mold that is simple enough to reason about in a UI and
honest enough that a moldmaker will not wince.

### 5.1 The anatomy as the game sees it 🟢

A **mold** in the game is a set of **work items**, each of which moves through the stages in §6
on its own, so that two people can be working on the same mold at once:

| Work item | What it is | Made or bought |
|---|---|---|
| **Mold base** | Standard plate set: A and B plates, support plates, ejector housing, guide pins, bushings, return pins, sprue bushing, locating ring | Bought (DMV, Hazco, Moosburger); arrives in days to weeks; pre-machined options cost more and save hours |
| **Cavity block (A-side)** | Forms the outside of the part | Made. The big hours |
| **Core block (B-side)** | Forms the inside; carries ejection | Made. The other big hours |
| **Inserts** | Detail pieces set into cavity or core | Made, each its own item. More inserts = more items, easier repairs later |
| **Slides / lifters** | Actions that release undercuts | Made, each its own item with machining, fitting and a tryout risk of its own |
| **Ejection** | Pins, sleeves, blades, stripper plate where used | Bought hardware plus fitting hours |
| **Cooling** | Water lines through the blocks; baffles, bubblers, O-rings | Made (gun drill or long drills), plus purchased fittings |
| **Runner** | Cold runner machined into the plates, or a **hot runner** manifold system | Cold: hours. Hot: bought (Malamute, Mould-Majors), long lead time, its own fitting and wiring |
| **Finish** | Polish grade, or a texture | Hours in-house; texture out |

Rarer things exist as **late-game contract modifiers** rather than base anatomy: unscrewing
cores (threaded parts), stripper-plate ejection, interchangeable insert families ("one base, four
parts"), two-shot tooling. They appear on RFQs once the shop has the reputation for them.

### 5.2 Mold parameters (what a contract specifies) 🟢

| Parameter | Range | Drives |
|---|---|---|
| Part size | S (cap), M (housing), L (appliance panel), XL (automotive fascia) | Base size, block mass, machine size class, crane needed, steel cost |
| Cavitation | 1, 2, 4, 8, 16, 32 | Repetition: EDM, fitting and polish hours scale with it; family tooling counts as cavitation with different shapes |
| Geometry complexity | 1–5 | Rough and finish hours, EDM hours, 5-axis benefit, crash risk |
| Undercuts | 0–N slides, 0–N lifters | Extra items, fitting hours, tryout risk |
| Steel | Aluminum, P20, NAP80, H13, S7, 420 SS (Stayvax) | Material cost, heat treat, machining speed, tool wear, polishability, mold life |
| Surface finish | SPI A-1 → D-3 | Polish hours (explode at A grades), texture vendor for D |
| Tolerance | Standard / tight / medical | Inspection hours, CMM required, rework risk |
| Runner | Cold / hot | Purchased cost, lead time, vendor dependency, higher price |
| Guaranteed cycles | 100k / 500k / 1M+ | Steel and hardening choice, customer segment |
| Documentation | None / first-article / full PPAP-style | Office hours, QC hire, the automotive gate |

### 5.3 The five things that make a mold expensive 🟢

What the estimator screen teaches, in order:

1. **Mass.** Size sets everything: steel cost, machine class, crane, hours on every stage.
2. **Cavitation.** Every cavity is another set of EDM, fitting and polish hours, and another
   place to be out of tolerance.
3. **Actions.** Every slide and lifter is a small mold of its own with its own way to fail at
   tryout.
4. **Finish.** C-grade is quick. B-grade is work. A-grade is a specialist with a bench, a lamp
   and a week; a texture is a vendor and a wait.
5. **Tolerance and paperwork.** Tight tolerance means inspection hours, rework loops and a CMM;
   documentation means office hours and a QC person. Medical and automotive pay for it.

A hot runner is not on the list because it is mostly a **purchased** cost passed through; it
adds lead time and fitting, and it is how you tell a packaging job from a consumer job.

### 5.4 Steel 🟢

| Steel (game name) | Real-world equivalent | Used for | Machining | Heat treat | Polish | Cost |
|---|---|---|---|---|---|---|
| Aluminum (7075 / "QC-Ten") | 7075, QC-10 | Prototype and low-volume tools | Very fast | None | Poor (soft) | Low |
| P20 | P20 pre-hard | The default: most consumer and appliance molds | Normal | None (pre-hard) | Good to B-grade | Medium |
| NAP80 | NAK80 | High-polish cavities, lenses, clear parts | Normal | None (pre-hard) | Excellent, A-grade | High |
| H13 | H13 | High-volume, abrasive resins, long life | Slow when hard | Yes (vendor, or oven) | Good | Medium-high |
| S7 | S7 | Inserts, slides, lifters, anything that gets hit | Slow when hard | Yes | Fair | Medium |
| Stayvax (420 SS) | Stavax / 420 stainless | Medical, packaging, corrosive resins (PVC), clear parts | Slow | Yes | Excellent | High |
| 4140 / mild plate | 4140, 1045 | Plates, support, fixtures | Fast | No | n/a | Low |

Hardened steels add the heat-treat loop (§6) and the risk that goes with it; pre-hards skip it.
Choosing a cheaper steel than the contract specifies is a corner the player can cut (§12.2).

### 5.5 Surface finish 🟢

| SPI grade | Method | Relative polish hours | Notes |
|---|---|---|---|
| A-1, A-2, A-3 | Diamond buff | 8–12× | Lenses, clear parts, "Class A" appearance. A-1 is a specialist; outsourced until a master polisher is on staff |
| B-1, B-2, B-3 | Paper (600 → 320 grit) | 3–5× | Most appearance parts |
| C-1, C-2, C-3 | Stone (600 → 320) | 1× (baseline) | Non-appearance, internal parts |
| D-1, D-2, D-3 | Dry blast / texture | Vendor | Grain texture at a texture house; polish to a B first, then send it out |

Polish direction matters: polished across the draw is a stuck part at tryout. That is a skill roll
on the polisher and a defect in §6.5.

### Questions for you

- **Q15.** ~~Anatomy~~ 🟢 Answered: as above; stripper plates, unscrewing cores, insert families and
  two-shot added as late-game modifiers.
- **Q16.** ~~Five expensive things~~ 🟢 Answered: mass, cavitation, actions, finish, tolerance and
  paperwork.
- **Q17.** ~~Steel~~ 🟢 Answered: aluminum, P20, NAP80, H13, S7, Stayvax, plus plate steel.
- **Q18.** ~~Polish~~ 🟢 Answered: yes; hours explode above B, A-1 is a specialist and outsourced
  until you have one.

---

## 6. The workflow: how a job moves through the shop

This is the heart of the simulation. A contract becomes a **job**; a job is a set of work items
(§5.1); each work item moves through **stages**; each stage needs a station (machine or bench), a
person with the skill, and hours. Items run in parallel when the shop has the stations and people.
Some stages wait on vendors.

### 6.1 The stage list, as the game runs it 🟢

Collapsed from the 21-step reality to what carries time, money or risk. Stages in *italics* are
per-job (once); the rest are per-work-item.

```
 1. *Quote*             estimate, price, lead time; win or lose
 2. *Kickoff*           PO in, deposit in, steel / base / hot runner / hardware ordered (lead times start)
 3. *Design*            designer hours; can be outsourced early
 4. *Program*           CAM hours; needs the design; can overlap with steel arriving
 5. Square              plates and blocks squared and ground to size (manual or CNC grinder)
 6. Rough               VMC hogs out the shape; water lines drilled here too (gun drill or long drills)
 7. Heat treat          hardened steels only; ships to the vendor (or the oven); 1-2 weeks; risk of a crack
 8. Finish grind        hardened items squared again after heat treat
 9. Finish              VMC / hard mill: final surfaces; semi-finish stock left for EDM
10. Electrodes          graphite cut for every sinker detail
11. Sinker EDM          ribs, corners, text, deep pockets
12. Wire EDM            inserts, pin holes, slide pockets; hardened items
13. Polish              bench; the grade sets the hours; texture items go to B and stop
14. Fit & spot          moldmaker: inserts, slides, lifters fitted; parting line spotted on the press
15. Assemble            ejection, water fittings, hot runner wiring, hardware
16. *Tryout (T1)*       in a press (a molder's or yours); sample parts back; defects rolled
17. *Revise*            fix what T1 found; back to the stage that owns the defect; T2 if needed
18. *Texture*           after T1 approval, D-grade items go to the texture house and come back
19. *Ship*              final inspection, crate, invoice; texture and hot runner paperwork attached
```

Order notes, because they matter to a moldmaker:

- **Water lines** are drilled soft, before heat treat, as part of roughing. Gun drilling is its
  own station when the shop has one; otherwise a long drill on the VMC (slower, walks) or a
  vendor.
- **Grinding** happens twice: squaring at the start, and again after heat treat, because heat
  treat moves things.
- **Texture** goes after tryout approval, because you cannot un-texture a change.
- **Electrodes** are their own items on their own station, made ahead of the sinker burn.
- **Fit & spot** is where the moldmaker earns their money and where the hours hide.

### 6.2 Where the hours go 🟢

For a "normal" mold (M size, 2 cavities, P20, one slide, B-2 finish), the estimate splits about:

| Stage group | Share of hours |
|---|---|
| Design and programming | 12% |
| Squaring, roughing, finish machining | 30% |
| Electrodes and EDM (sinker + wire) | 15% |
| Grinding (both passes) | 5% |
| Polish | 10% (up to 30% at A-grade) |
| Fit, spot, assemble | 25% |
| Tryout and revisions | 3% (plus press time) |

The estimator screen shows this split; the game's estimate improves as the shop builds more molds
and as the estimator's skill rises. A good moldmaker on fitting shortens that 25% the way nothing
else can, which is why they are paid what they are.

### 6.3 What makes it a game 🟡

- **Scheduling:** work items compete for stations and people. The schedule board is a Gantt of
  stations × days; drag to reprioritise, split, run overtime, or outsource a stage.
- **Critical path:** the job panel shows what is holding the job up. A finished mold waiting on
  a hot runner is a very real feeling.
- **Parallelism:** A-side on one machine, B-side on another, the slide on the manual mill, the
  electrodes on the carbon cutter, all at once, if you have the machines and the people.
- **Vendors:** steel, mold bases, hot runners, heat treat, texture, outsourced machining, press
  time. Each has a price, a lead time and a reliability; the cheap heat treater who cracks a block
  once a year is a story.
- **The traveller:** every job has a paper traveller on a clipboard that moves with it. On the
  floor you can pick it up and read where the job is. It gets coffee rings.

### 6.4 Tryout 🟢

- **Where:** at a **molder** (a local sampling house or the customer's molder) until the shop
  buys a sampling press. Press time is a vendor cost, about $150–250/hr, half a day minimum, and
  the press is available when it is available.
- **Who pays:** the shop, for T1 and T2, as part of the quote. Changes the customer asks for
  after T1 are billed to the customer. That line is the source of half the inbox arguments.
- **How many:** T1 always finds something. Most molds ship after T2; a bad one goes to T3 and
  the margin is gone by then.
- **In-house press:** cuts the cost and the wait, adds a machine and a person who knows how to
  run it, and lets you sample on a Saturday.

### 6.5 What T1 finds 🟢

Each defect has a **cause** the build rolled against, a **fix stage** it sends the item back to,
and a **look** on the sample parts on the bench.

| Defect | Rolled against | Fix stage | On the bench |
|---|---|---|---|
| Flash | Fit & spot quality, spotting press skipped | Fit & spot | Thin fins on the parting line, like pie crust |
| Short shot | Venting (fit), gating (design) | Fit & spot / Design | A part missing a corner |
| Sink marks | Wall thickness (design), cooling | Design / Rough (water) | Dimples where the ribs are |
| Warp | Cooling layout, steel choice | Rough (water) / Design | A flat part that rocks on the table |
| Stuck part / drag marks | Polish across the draw, no draft, undersized ejection | Polish / Fit | Scratches down the side; a part still in the cavity |
| Ejector pin marks | Pin length, pin fit | Fit & spot | Little circles pushed through |
| Water leak | O-ring, cross-drilled line | Assemble / Rough | A puddle under the mold |
| Hot runner drool / stringing | Manifold setup, wiring | Assemble | Plastic hair on the gates |
| Dimension out | Shrink allowance (design), a bump on a machine (§4.4) | Design / Finish | The CMM report with a red line |
| Burn marks | Venting | Fit & spot | Brown edges |
| Slide/lifter hang-up | Fitting, actions | Fit & spot | The press alarm, a scratch, a sweating moldmaker |

Build risk factors that make these more likely: a green fitter, rushed polish, skipped spotting,
skipped inspection, a bumped machine nobody recalibrated, many actions, a hot runner, a steel
switched for something cheaper.

### 6.6 Engineering changes 🟢

- **Frequency:** one or two per new build, more on automotive and consumer, few on packaging.
- **Who pays:** free if the change lands before design approval; billed (hours plus any scrap)
  after. The customer will argue. The PO terms decide who wins.
- **Schedule:** days to weeks depending on the stage it hits; a change to a finished, polished
  cavity is a weld-and-recut and a week; a change after texture is a new insert.
- **The inbox line:** "Just a small change." The print attached has a hole through the slide.

### Questions for you

- **Q19.** ~~Stage order~~ 🟢 Answered: as in §6.1; water lines with roughing, grinding twice,
  texture after T1 approval.
- **Q20.** ~~Collapse~~ 🟢 Answered: 19 stages, purchasing folded into kickoff, CAM into
  Program, final inspection into Ship.
- **Q21.** ~~Hours~~ 🟢 Answered: §6.2.
- **Q22.** ~~Tryout~~ 🟢 Answered: at a molder until you own a press; the shop pays T1/T2; the
  customer pays for their changes; most ship after T2.
- **Q23.** ~~Defects~~ 🟢 Answered: §6.5.
- **Q24.** ~~ECNs~~ 🟢 Answered: §6.6.

---

## 7. Customers and contracts

### 7.1 Customer types 🟢

| Segment | Typical work | Pays | Patience | Requires | Unlocks at |
|---|---|---|---|---|---|
| **Other mold shops** | Overflow: components, inserts, electrodes, grinding | $50–60/hr, fast | High | Nothing | Day one |
| **Local molders** | Repairs, revisions, small simple molds | Low-medium, fast | High | Nothing | Day one |
| **Consumer products** | Housings, caps, closures; 2–8 cavities, B finish | Medium | Medium | A VMC and an EDM | First CNC |
| **Appliance / industrial** | Large, plain, long life | Medium | Medium | Big machine, crane | Crane |
| **Packaging** | High cavitation, stainless, hot runner | High | Low | Hot runner experience, CMM | Reputation 3 |
| **Automotive Tier 1/2** | Large, textured, slides everywhere, paperwork | High, slow (net 60–90) | Low | Big machines, CMM, PPAP-style docs, QC hire | Reputation 4 |
| **Medical** | Small, tight tolerance, Stayvax, clean, documented | Very high | Medium | CMM, documentation, a clean shop | Reputation 4 |

### 7.2 Contract types 🟢

- **New tool build.** The main event.
- **Engineering change.** Days to weeks, usually on a mold you built.
- **Repair.** A molder's damaged tool: welding, pins, re-polish. Fast money, needs the welding skill
  for the good ones.
- **Prototype / aluminum tool.** Quick, cheap, low cycle life. Good early-game work.
- **Transfer tool.** Somebody else's mold arrives in a crate in bad shape. Fix it and make it run.
  The crate always contains a surprise.
- **Component work.** Stage 0 bread and butter: pins, inserts, electrodes for other shops.
- **Rush.** Any of the above with a brutal lead time and a premium.

### 7.3 Getting work 🟢

- **RFQs arrive by email** with a part model and a spec sheet (the parameters in §5.2). Three to
  five shops quote each job; the game says how many.
- **Win rate** depends on price vs. the customer's expectation, lead time vs. their need, and
  reputation in that segment. A new shop wins one in five; a shop with a name wins one in three;
  a cheap quote wins more and hurts more.
- **Reputation** per segment, from on-time delivery, tryout success, defect-free ships, and how
  you handled the arguments. Drives RFQ volume and which segments send them.
- **Sales:** an estimator/PM hire brings in RFQs; a trade show is an event with a cost and a
  payoff; a repeat customer's next program lands on your desk first.

### 7.4 Quoting 🟡

The quote screen shows the game's estimate (hours per stage, materials, purchased parts, vendors,
press time) with a **confidence band** that narrows as the shop builds more molds and the
estimator's skill rises. The player sets **price** and **lead time**. Win too cheap and eat the
overrun; too fat and lose it. The screen also shows the customer's segment norms so the player is
guessing with information.

### 7.5 Payment terms 🟢

- **Default:** 30% on PO, 30% at T1, 40% on approval, each net 30.
- **Automotive:** 30/30/40 but net 60–90, and "approval" means their PPAP sign-off, which drags.
- **Molders and other shops:** 50/50 or net 30 on ship, fast.
- **What they try:** 0/0/100, "pay on first production run", a deposit that arrives after the
  steel does. Negotiable at a cost to the win rate.
- **Late payers** are an event; a customer who goes bankrupt is a rarer one.

### 7.6 Price and lead-time bands 🟢

| Mold | Price band | Quoted lead time |
|---|---|---|
| Aluminum prototype tool | $5k–20k | 2–4 weeks |
| Small single-cavity P20, simple | $15k–40k | 6–8 weeks |
| Medium 2–4 cavity with a slide, B finish | $50k–120k | 10–14 weeks |
| Medical small, tight tolerance, Stayvax | $60k–200k | 12–16 weeks |
| 16-cavity stainless hot runner packaging | $150k–400k | 14–20 weeks |
| Automotive large, textured, many actions | $250k–800k+ | 16–24 weeks |
| Repair / revision | $500–15k | days to 2 weeks |

### 7.7 When you are late 🟢

Reputation hit in that segment, always. Small customers yell and pay anyway. Automotive contracts
carry a per-day penalty and can hold the final payment. Twice late to the same customer and the
next program goes elsewhere. Every late ship generates an inbox thread.

### Questions for you

- **Q25–Q30.** 🟢 Answered above.

---

## 8. Staff

### 8.1 Roles 🟢

| Role | Does | Skills | A real separate job from |
|---|---|---|---|
| Moldmaker / toolmaker | Fitting, spotting, assembly; can run most machines; may weld | Fitting, machining, EDM, welding (rare) | Day one |
| Apprentice | Anything, slowly, with risk; grows into any role | All, low | Day one |
| CNC machinist | Setup and run mills | Milling, programming (some) | 4+ people |
| CNC programmer | CAM; often the senior machinist at first | Programming | 8+ people |
| EDM operator | Sinker and wire; the moldmaker runs it before this | EDM | 8–10 people |
| Mold designer | Tool design in CAD; outsourced before this | Design | 8+ people |
| Polisher | Bench polish; the moldmaker does it before this | Polish | 10+ people |
| Estimator / PM | Quotes, schedule, customer email | Estimating | 6+ people (part-time before) |
| Grinder hand | Surface and jig grinding | Grinding | 15+ people |
| QC inspector | CMM, first article, documentation | Inspection | With the CMM and the automotive/medical work |
| Shop foreman | Multiplies everyone else, catches skipped steps | Leadership | 15+ people |
| Sales | Brings RFQs | Sales | 20+ people |

### 8.2 People mechanics 🟡

- **Skills** 1–5 per axis; rise with hours on the work, faster next to someone skilled (§8.4).
- **Wages** weekly; **overtime** at 1.5× with a morale cost; **Saturdays before a ship date** are
  a thing the crew expects a few times a year and resents more than that.
- **Hiring:** a candidate pool refreshed weekly; better candidates as reputation grows; the resume
  and the reality differ (§1.4). A journeyman moldmaker is rare and gets poached.
- **Apprentices** take about four years to journeyman (the trade's 8,000 hours) and are useful
  after six to twelve months. They learn by working next to a moldmaker; alone, they learn by
  crashing.

### 8.3 Disgruntled employees 🟡 (the comedy engine, part one)

Morale is not a bar. It is **behaviour** you can see from across the floor:

| Morale | What you see |
|---|---|
| Happy | Whistling, walks briskly, cleans up, helps the apprentice |
| Fine | Does the job |
| Grumbling | Slower walk, longer breaks, complaints appear on the whiteboard and in your inbox |
| Disgruntled | Stands at the vending machine, "accidentally" runs slow, quality slips, talks to the others (morale spreads) |
| Done | Quits with a speech in the middle of the floor, ideally on the day a mold ships. May take a customer's phone number with them. |

Grievances are specific and remembered: got blamed for a crash, no raise in a year, made to work
Saturday again, the good machine went to the new guy, the coffee, the heat, the cold, the radio
station. Fixing a grievance is a small event with a real cost (raise, new chair, radio, air
conditioning, an apology). Some people cannot be fixed. Some quit and come back.

### 8.4 The owner on the floor ✅ Agreed (mechanics 🟡 Proposed)

The player can walk up to any machine or bench and **run the stage themselves**. Proposed
mechanics:

- The owner has skill levels like everyone else, starting high across the board (journeyman
  moldmaker, competent on every machine), but is **one person**. Running a machine means not
  quoting, not hiring, not answering the phone: the inbox piles up and customers notice.
- Working a stage is not a mini-game grind. The player starts the stage, the machine runs, and
  the player can walk away for a lights-out stage or must stay for a hands-on one (fitting,
  spotting, polishing). Staying is what costs you the rest of the shop.
- The owner's presence **teaches**: an apprentice working alongside the owner learns faster. A
  crew working with the owner watching crashes less. A crew left alone for a week is a dice roll.
- The owner can crash a machine too. The bang is the same. The crew talks about it for weeks.
- Early game (one or two people) the owner does most of the work. Mid game the owner is the
  emergency fitter who saves a ship date. Late game the owner running a machine is a nostalgic
  choice, and the crew finds it funny.

### 8.5 Crew shape by size 🟢

| People | Who |
|---|---|
| 2 | Owner + one moldmaker (or a promising apprentice, cheaper and riskier) |
| 6 | Owner, two moldmakers, a CNC machinist who programs, an EDM operator, an apprentice; the owner quotes |
| 12 | + designer, second machinist, polisher, estimator/PM, second apprentice, part-time bookkeeper |
| 25 | + foreman, QC inspector, grinder hand, dedicated programmer, sales, a second shift on the CNCs |

### 8.6 Wages 🟢 (Ontario-ish, placeholders)

| Role | Hourly | Notes |
|---|---|---|
| Apprentice | $18–25 | Cheap; four years to pay off |
| CNC machinist | $25–35 | |
| EDM operator | $28–38 | |
| Polisher | $25–40 | The good ones are artists and priced like it |
| Programmer | $30–45 | |
| Designer | $35–50 | |
| Moldmaker, journeyman | $35–48 | A great one does twice the work of a green one with a quarter of the crashes |
| Foreman | $45–55 | |
| Estimator / PM | $70–90k/yr | |

### 8.7 Culture, for the writers 🟢

The radio war. The polisher's corner with the lamp and the stones and the "do not touch". The CNC
guy who will not run the Bridgeford and the old moldmaker who will not run anything else. Cake on
ship day. The coffee fund jar. The Saturday before the ship date. Tools that walk. The whiteboard
with the schedule that is three weeks out of date and a drawing of the foreman. The apprentice
who deburred the wrong edge. Blue hands from spotting. The customer who visits and touches
everything. Every one of these is a line an employee can say, a note on the whiteboard, or an
achievement.

### Questions for you

- **Q31–Q35.** 🟢 Answered above.

---

## 9. Economy

🟢 All numbers placeholders until the first playable proves them.

- **Start:** the 2,500 sq ft unit (§3.1), rented. **$50k cash**, plus an optional **$100k
  start-up loan** at a rate that stings, offered on day one and again later on better terms once
  the shop has a track record. The first $20k goes per §3.5.
- **Shop rate:** the number behind every quote. Stage 0 work sells at about $50–60/hr, mold
  work at about $90–120/hr (§4.1). Quotes are hours × rate + material + purchased parts +
  vendors, and the estimate screen shows it that way.
- **Income:** contract payments per §7.5. **Customers do not pay when you ship.** Progressive
  terms (a deposit, a payment at tryout, the rest on approval, each on net-30 or worse) mean the
  money for a job you finished arrives months after you paid for its steel. Per Q7 this is the
  thing that really hurts small shops, and the game makes the player feel it.
- **Overhead, monthly, at 2,500 sq ft:** rent $3–4k, power $0.8–2k (scales with machines),
  insurance $0.6–1k, air/coolant/consumables $0.5–1.5k, software maintenance ~$1k. Call it
  **$6–9k a month before wages.** Bigger building, bigger numbers.
- **Per job:** steel, base, hot runner, hardware, vendor invoices, press time, tooling wear.
- **Machines:** manual machines are bought used, for cash. CNC is **financed over 5–7 years** or
  **leased**; the bank wants two years of statements, the leasing company wants a signature and
  more interest. Payments are monthly and do not care whether the machine is busy.
- **Surviving the squeeze:** deposits, the line of credit, quick-pay component work between
  builds, delaying the steel order until the deposit lands, and asking a vendor for terms. Each
  has a cost. Factoring the invoice is the expensive last resort and exists in the game.
- **Assets:** machines depreciate and can be sold used; the shop has a **valuation** (cash +
  assets + backlog − debt) that is the score.
- **Failure:** negative cash past the credit line for four weeks and the bank calls it. Game over
  with a summary and the option to load the autosave from a month ago.

### Questions for you

- **Q36–Q39.** 🟢 Answered above.

---

## 10. Time

### 10.1 The clock ✅ Agreed

Time is **minute for minute**: a shop minute is a real minute at 1x. The day opens at 7:00 and
closes at 17:00. Speeds are **1x, 2x, 3x**, and **END DAY**, which runs the clock to five o'clock
while everything in progress keeps going. Lights-out machines keep going overnight (once they
exist).

### 10.2 Five o'clock ✅ Agreed

At closing time the clock stops and you choose: **lock up and go home**, or **stay late**. Staying
late gets more done today. At **23:00** you go home whether you like it or not.

### 10.3 Home ✅ Agreed

You must go home to sleep every day, even if the night is short. The night is a screen: the shop
name, the clock running from when you left to 7:00, a line about how it went. Autosave happens
when you lock up.

### 10.4 Fatigue ✅ Agreed (numbers 🟡)

Sleep less than a full night and the next day you are **tired**, then **exhausted**. Tired owners
press the wrong button (the red one, nothing happens), rotate the machine when they meant to
confirm it, and are certain they clamped the work when they did not: the checklist shows a tick
the machine does not agree with. The HUD says so, the edges of the screen darken, and the crew
will eventually say so too. Proposed: leaving at 21:00 is fine, 22:00 is tired, 23:00 is wrecked.

### 10.5 Years 🟢

The game is **endless** with a **year-end summary** each year (revenue, molds shipped, on-time
rate, crashes, people gained and lost, best and worst moment). At ten years an optional
**retirement ending** plays: a summary, the valuation, what the crew says about you, and a button
that says "one more year".

Buy Stove's `?speed=` and `?skip=` shortcuts stay for testing.

### Questions for you

- **Q40.** ~~Pace~~ ✅ Answered by John: minute for minute, 2x, 3x, END DAY; overtime with fatigue;
  mandatory sleep. Overrides the earlier 🟢 proposal.
- **Q41.** 🟢 Endless with year-end summaries; optional retirement at ten years.

---

## 11. Progression

🟢 The arc:

1. **Manual phase** (Stage 0). You, a Bridgeford, a lathe, a grinder. Component work, repairs,
   revisions, small aluminum protos at $50–60/hr. Learn the floor and the inbox. Bank for the VMC.
2. **First CNC** (Stage 1). A used VMC, then a sinker and a wire. First real new build with a
   lot of outsourcing. Hire a moldmaker. First heat-treat scare. First tryout. First "just a small
   change" email.
3. **A real shop** (Stage 2). Multiple jobs in flight; scheduling matters; the crane, the carbon
   cutter, spotting press, CMM. Consumer and appliance work; the first hot runner tool.
4. **The big leagues** (Stage 3). 5-axis, a sampling press, the oven, a second building, 20+
   people, automotive and medical programs. The game becomes keeping the beast fed and the
   people happy.

**Milestones / achievements** (a long list, Cycle Start style; most for disasters, some for
pride):

- *First Cycle Start.* Press the button.
- *One Out the Door.* Ship a mold.
- *Shipped It Friday.* Ship after a Saturday and a 14-hour day.
- *T1, No Notes.* A tryout with nothing to fix.
- *The Crane.* Buy it. Lift something. Everyone watches.
- *Lights Out, Nobody Home.* First unattended run that worked.
- *Lights Out, Something's Wrong.* First one that did not.
- *Genuine Advantage.* Buy the software after the letter.
- *OOPS.* First scrapped block.
- *Employee of the Month.* The owner runs a machine for a full week.
- *Repeat Customer.* Their next program lands first.
- *A Tenth Is a Tenth.* First CMM report with no red.
- *The Big One.* First mold over $250k.
- *One Million.* A tool you built passes a million cycles at the customer.
- *WSIB.* You know what you did.
- *Retired the Bridgeford.* Not possible. The achievement exists; it cannot be earned.

### Questions for you

- **Q42–Q43.** 🟢 Answered above.

---

## 12. Risk and failure

🟡 The sim needs things that go wrong, and they need to be the *real* things. This is the comedy
engine, part two: every row below has a real cause and a real cost, and a **presentation** that is
funny. The failure system must be fair (you can always see why) and never so punishing that the
joke stops being funny.

### 12.1 Events, ranked 🟢

By how often they happen, then how much they hurt:

| Frequency | Event | Hurts | How it looks |
|---|---|---|---|
| Constant | Broken cutter | Little | A snapped end mill held up like a fish |
| Constant | Tryout defects | Some | Sample parts on the bench (§6.5) |
| Often | "Just a small change" | Some to a lot | The email; the print with a hole through the slide |
| Often | Steel / base / vendor late | Schedule | An empty spot on the steel rack with a sticky note |
| Often | Slow payer | Cash | The bank's number on the phone display |
| Often | Lights-out gone wrong | A night | The morning reveal |
| Sometimes | Bump, accuracy loss | Silent, then a bad part | Nothing, then the CMM report |
| Sometimes | Employee quits | Skills gone | A speech, a slammed door, the radio left on |
| Sometimes | Machine breakdown, no maintenance | Downtime | Smoke, a puddle, a tech who arrives Thursday |
| Sometimes | Welded tool | Rework | An end mill in a cavity like a flag |
| Sometimes | Workplace injury | WSIB, morale | The ambulance; everyone suddenly wearing safety glasses |
| Rare | Catastrophic crash | Weeks, a big bill | Bang, alarm, cracked window, a crowd |
| Rare | Heat treat cracks a block | Weeks | Two pieces in one crate, with an invoice |
| Rare | Software audit letter | A big bill | Registered mail; the CAM stops opening |
| Rare | EDM fire | Everything | Soot on the ceiling; the fire department's card |
| Rare | Customer bankrupt | An unpaid mold | A very nice mold in the corner with a for-sale sign |
| Rare | Quote badly wrong | The margin | The estimate sheet, framed, with the real number next to it |

### 12.2 Cutting corners 🟢

The player can, and the game lets them, with a risk roll and an achievement:

| Corner | Saves | Risks |
|---|---|---|
| Skip the probe | Minutes | Crash (§2.5) |
| Skip spotting on the press | Hours | Flash at T1 |
| Rush the polish | Hours | Stuck part, drag marks |
| Skip inspection | Hours | Dimension out found at the customer, not by you |
| Undersize or skip water lines | Hours | Warp, sink, long cycle; the customer's molder complains |
| Cheaper steel than quoted | Money | Mold life; the customer finds out when it wears; reputation crater |
| Skip maintenance | Money | Everything in §4.4 |
| Run pirated software | Money | The letter |
| Ship without T2 | A week | The customer's tryout is your tryout, in public |

### 12.3 The war stories 🟢

Two scripted story events every player meets once, because every shop has them:

- **The Friday.** A mold ships at 11 p.m. on a Friday after a Saturday that became a Sunday. The
  customer's revision arrives Monday at 8:04 a.m.
- **The Draw.** A cavity polished across the draw. The part will not come out. The polisher is
  certain it was fine. The moldmaker is certain it was not. The press is charging by the hour.

### Questions for you

- **Q44–Q46.** 🟢 Answered above.

---

## 13. Presentation

### 13.1 The 3D shop (and its isometric twin) 🟢

- **Style:** Buy Stove's stylised procedural look, but industrial: grey epoxy floor with yellow
  safety lines, steel-blue machine enclosures, orange crane, fluorescent cool light with half the
  tubes out, dust in the beams from the tarp door. Cleanliness as a visible state (chips, coolant,
  crates, graphite dust on everything if you cut carbon on the VMC).
- **Machines** are recognisable silhouettes with their spoofed nameplates: an enclosed VMC with a
  window and a light stack (green/amber/red), an open sinker EDM with a tank, a wire EDM with its
  spools, a grinder with a wheel guard, the spotting press as a big blue frame, the Bridgeford with
  its round head.
- **Animation:** spindle spinning in the window, sparks and glow in the EDM tank, coolant spray,
  the crane moving, the forklift at the dock, people walking between stations, the polisher bent
  over a lamp, the apprentice sweeping.
- **Work-in-progress is visible:** a block on the table, a base on the bench blued up, electrodes
  in a rack, a finished mold in a crate by the door, the traveller clipboard hanging on the job.
- **Status light stacks** and a floating tag when looked at: `JOB 0042 · CORE BLOCK · FINISH ·
  62% · Dave`.
- **Isometric view:** the same scene from a lifted fixed-angle camera with the roof removed; every
  machine and person gets a permanent tag; idle machines and idle people are visibly flagged.

### 13.2 The management UI 🟢

Buy Stove's monospace/paper aesthetic, reused on purpose, with a shop-paper twist: **quotes look
like quotes, invoices look like invoices, the traveller looks like a traveller** (a stapled sheet
with a barcode and coffee rings). Screens: inbox, quote, jobs, schedule (Gantt), shop (buy/place),
people, purchasing/vendors, bank (cash-flow chart, P&L), reputation.

### 13.3 Sound 🟢

All synthesized: compressor cycling (always), fluorescent buzz, the tarp door flapping, spindle
pitch by RPM, the EDM crackle and its finishing "ding", air blow-off, grinder scream, crane horn,
forklift reverse beep, hydraulic press thunk, the phone in the office, the radio (one station,
argued over), a band saw, tapping a block with a dead-blow, the scrap bin clang. A quiet shop
sounds *wrong*. The compressor kicking on in a silent shop is the loneliest sound in the game.

### Questions for you

- **Q47–Q48.** 🟢 Answered above.

---

## 14. Screens (inventory)

Intro (disclaimer, press the any key) → New game (name the shop) / Continue → The shop (3D, HUD;
`V` for isometric; `Tab` for the clipboard) → Management overlay (tabs per §13.2) → Machine panel
(per machine: checklist, job, condition, maintenance, repair) → Job panel (per job: items, stages,
critical path, money, traveller) → Person panel (skills, morale, grievances, wage) → End of week
summary → Year-end summary → Retirement → Game over → Achievements gallery → Pause.

---

## 15. Save data

One `localStorage` key per slot, JSON: shop name and layout, machines and condition, staff, jobs
and item-stage progress, customers and reputation, vendors, bank, clock, achievements, story flags,
settings. Autosave at end of day; manual save in pause. Versioned so later builds can migrate.

---

## 16. Scope tiers

🟢 So we agree what "done" means.

**MVP (v0.1, the playable loop):** name the shop; the empty 2,500 sq ft unit with the tarp door;
Stage 0 manual machines and component/repair work for ten minutes of play; the first used VMC as
the first milestone; sinker and wire; buy and place machines in isometric; walk the floor and load
a machine by hand (probe, program, CYCLE START); hire three roles; two customer segments (other
shops, consumer); new builds and repairs; the stage pipeline of §6.1 with parallel items;
quoting with the estimate; the Gantt; one vendor each for steel, base, heat treat, press time;
tryout with five defects; the crash spectrum; cash, payroll, terms; one in-game year; save/load;
phone-playable.

**v1.0:** the full machine catalogue and every brand in the shortlist; all segments and contract
types; vendors with reliability; morale and grievances; maintenance, lights-out, fire; hot runners;
texture; the software audit; progression stages 0–3; the achievements list; full sound; floor
animation; the events table; the two war stories; year-end summaries.

**Stretch:** second building and second shift; apprentices growing into moldmakers over years;
trade shows; recurring customer characters with memories; a multi-year "story" program; competitor
shops that bid against you and poach your people; the retirement ending with the crew's verdict.

### Questions for you

- **Q49.** 🟢 Answered: MVP as above; Stage 0 and the first CNC purchase are in the first
  playable because they are the first ten minutes.

---

## 17. All open questions, in order

| # | Section | Question (short) | Status |
|---|---|---|---|
| Q1 | 1 | Tone | ✅ Comedic, light-hearted, real mechanics underneath |
| Q2 | 1 | Owner works the floor or only manages? | ✅ Owner, knows the trade, can do anything; hires wrong people; accidents happen to everyone |
| Q3 | 1 | Player-named shop? | ✅ Yes, player names it |
| Q4 | 2 | First-person vs overhead camera | ✅ Both, switchable; first-person is the core |
| Q5 | 2 | Phone = management-first? | ✅ No; walk-around everywhere, management UI is secondary |
| Q6 | 3 | Realistic starting building | ✅ 2,500 sq ft, tarp bay door, 20 ft ceiling, power for 2 machines |
| Q7 | 3 | Which facility items gate a small shop | ✅ Power/air included but upgradeable; no crane day 1; first $20k = machines, employee, software |
| Q8 | 3 | Facility list corrections | ✅ My judgement, redirect as needed |
| Q9 | 4 | Machine catalogue corrections | ✅ Manual first, CNC with capital or loans |
| Q10 | 4 | Machine prices | ✅ Good start; 5-axis toward $1M |
| Q11 | 4 | What runs unattended | ✅ Long cuts only, needs tool changer, tools break, EDM fires |
| Q12 | 4 | Separate graphite mill? | ✅ Dedicated carbon cutter; any mill in a pinch with dust cost |
| Q13 | 4 | What is outsourced (heat treat, texture, plating, polish) | ✅ Heat treat, texture, manifolds always out; gun drill and welding until you have them |
| Q14 | 4 | Crashes: frequency and reality | ✅ Spectrum from cutter to catastrophic; bumps cost accuracy; money fixes anything |
| Q15 | 5 | Mold anatomy corrections | 🟢 As §5.1; rare features as late modifiers |
| Q16 | 5 | The five things that make a mold expensive | 🟢 Mass, cavitation, actions, finish, tolerance/paperwork |
| Q17 | 5 | Steel list | 🟢 Al, P20, NAP80, H13, S7, Stayvax, plate |
| Q18 | 5 | Polish grades and hours | 🟢 Yes; A-1 outsourced until a master polisher |
| Q19 | 6 | Stage order | 🟢 §6.1; water with roughing, grind twice, texture after T1 |
| Q20 | 6 | Which stages to collapse | 🟢 19 stages |
| Q21 | 6 | Hours proportions by stage | 🟢 §6.2 split |
| Q22 | 6 | Tryout: where, who pays, how many rounds | 🟢 At a molder until you own a press; shop pays T1/T2 |
| Q23 | 6 | Common tryout defects and fixes | 🟢 §6.5 table |
| Q24 | 6 | Engineering changes mid-build | 🟢 1–2 per build; billed after design approval |
| Q25 | 7 | Customer segments | 🟢 §7.1 with other shops and molders as day-one customers |
| Q26 | 7 | How work arrives; win rate | 🟢 Email RFQ, 3–5 shops, 1 in 5 → 1 in 3 |
| Q27 | 7 | Payment terms | 🟢 30/30/40 net 30; automotive net 60–90 |
| Q28 | 7 | Mold price bands | 🟢 §7.6 bands |
| Q29 | 7 | Lead time bands | 🟢 §7.6 bands |
| Q30 | 7 | What happens when you are late | 🟢 Reputation, penalties on automotive, lose the next program |
| Q31 | 8 | Crew shape at 2/6/12/25 | 🟢 §8.5 |
| Q32 | 8 | Wages | 🟢 §8.6 |
| Q33 | 8 | Which roles are real separate jobs | 🟢 §8.1 last column |
| Q34 | 8 | Apprentices | 🟢 4 years; useful after 6–12 months; learns beside a moldmaker |
| Q35 | 8 | Shop culture details | 🟢 §8.7 |
| Q36 | 9 | Realistic starting cash and machines | 🟢 $50k cash + optional $100k loan |
| Q37 | 9 | Monthly overhead | 🟢 $6–9k/mo before wages |
| Q38 | 9 | How machines are financed | 🟢 Manual cash; CNC financed 5–7 yr or leased |
| Q39 | 9 | Cash-flow shape | 🟢 Yes; deposits, LOC, quick-pay work, factoring |
| Q40 | 10 | Pace | ✅ Minute for minute; 1x/2x/3x/END DAY; overtime, fatigue, mandatory sleep |
| Q41 | 10 | Endless or horizon | 🟢 Endless with year-end summaries; optional retirement at 10 years |
| Q42 | 11 | Growth arc believable? | 🟢 Yes, mapped to Stages 0–3 |
| Q43 | 11 | Milestones that make a moldmaker grin | 🟢 §11 list |
| Q44 | 12 | Rank the failure events | 🟢 §12.1 ranked |
| Q45 | 12 | The war story | 🟢 The Friday; The Draw |
| Q46 | 12 | Allow cutting corners? | 🟢 Yes, §12.2 |
| Q47 | 13 | Defining sights and sounds | 🟢 §13.1, §13.3 |
| Q48 | 13 | Reuse Buy Stove UI style? | 🟢 Reuse, with shop-paper twist |
| Q49 | 16 | MVP cut | 🟢 MVP as §16; Stage 0 and first CNC included |
| Q50 | 1 | Narrator vs. commentary from the people in the shop | ✅ The people, no narrator |
| Q51 | 2 | Command people from the isometric view? | ✅ Both isometric click and floor talk |
| Q52 | 2 | Fidelity of loading a machine by hand | ✅ Seat, door, probe, select program, CYCLE START; skipped steps cause crashes |
| Q53 | 3 | Software package naming | ✅ Spoofed real brands everywhere, see BRANDS.md |
| Q55 | 3 | Vet the BRANDS.md spoof list | ✅ Good as is; adjust on the fly |
| Q56 | 3 | Genvision Easter egg? | ✅ Yes, loosely, behind a flag |
| Q57 | 4 | Heat-treat oven as a Stage 3 upgrade? | ✅ Yes |
| Q58 | 4 | Welder: separate hire or a skill? | ✅ A skill, rare |
| Q59 | 4 | What Stage 0 (manual-only) work sells, and for what | ✅ Components, repairs, protos at $50–60/hr; CNC-class work at $90–120/hr |
| Q60 | 4 | Tool-break detection and fire suppression as upgrades? | ✅ Yes, both |
| Q54 | 3 | What kind of tarp door | ✅ Cheap, upgradeable, as written |

---

## 18. Decision log

| Date | Question | Decision | Changed sections |
|---|---|---|---|
| 2026-10-01 | Q40 Time | Minute for minute at 1x, 2x, 3x, END DAY to five. Five o'clock: go home or stay late. Mandatory sleep every night. Short sleep makes the owner tired: wrong buttons, steps you think you did. Hard stop at 23:00. | 10 |
| 2026-10-01 | Q55 Brands | BRANDS.md approved as is; adjust on the fly. Build started. | BRANDS.md |
| 2026-09-30 | Q15–Q49 | John asked Claude to answer the remaining questions. Answered as 🟢 (mold model, workflow, customers, staff, economy, time, progression, risk, presentation, scope). Each stands until vetoed. | 5–16 |
| 2026-09-30 | Q57 Oven | Heat-treat oven is a Stage 3 upgrade. | 4.2, 4.5, 3.3 |
| 2026-09-30 | Q58 Welder | Welding is a rare skill on a moldmaker, not a separate trade. | 4.5, 8 |
| 2026-09-30 | Q59 Stage 0 pay | Manual-only work (components, repairs, revisions, small aluminum protos) at ~$50–60/hr; CNC-class contracts ~$90–120/hr. | 4.1, 9 |
| 2026-09-30 | Q60 Upgrades | Tool-break detection and fire suppression are buyable upgrades. | 4.3, 3.3 |
| 2026-09-30 | Q9 Progression | Manual machines first for small blocks and components; CNC when capital or loans allow. | 4.1, 4.2 |
| 2026-09-30 | Q10 Prices | Starting prices accepted; 5-axis raised toward $1M. | 4.2 |
| 2026-09-30 | Q11 Lights-out | Any long enough cut can run unattended with a tool changer; tools wear and break; EDM can catch fire. | 4.3, 12 |
| 2026-09-30 | Q12 Graphite | Dedicated carbon cutter is the goal; any mill in a pinch at a dust cost unless a vacuum system exists. | 4.6, 3.3 |
| 2026-09-30 | Q13 Outsourcing | Heat treat (no oven), grain texture and manifold systems always out; gun drilling and welding out until the machine or person exists. | 4.5 |
| 2026-09-30 | Q14 Crashes | A spectrum: broken cutter, silent accuracy loss from a bump, welded tool from no coolant, spindle in the table with a tech visit and parts lead time. Money fixes anything, properly or as a band-aid. | 4.4, 12 |
| 2026-09-30 | Q54 Tarp door | Cheap strip curtain to start, upgradeable to a real door. | 3.1, 3.3 |
| 2026-09-30 | Q56 Genvision | Easter egg, loosely, behind a flag pending approval. | BRANDS.md §5 |
| 2026-09-30 | Q53 Brands | All software and machine brands are spoofs of real companies, kept inside the legal house rules in BRANDS.md (no real names, logos or trade dress; famous marks get more distance; the joke is never that a real product is bad). | 3.4, 4, BRANDS.md |
| 2026-09-30 | Q6 Building | 2,500 sq ft, 20 ft ceilings, one small-truck bay door with a tarp system, power for two machines. Verify visually once walkable. | 3.1, 9 |
| 2026-09-30 | Q7 Gates | Air and power included, upgrade for more machines. No crane on day one; outsource big work. First $20k: machines, employee, software licenses (pirated is an option with consequences). Steel and tooling on top; customers pay late on progressive terms. | 3.3, 3.4, 3.5, 3.6, 9 |
| 2026-09-30 | Q8 Facility list | Upgrade vs. purchase split is my call, subject to redirection. | 3.3 |
| 2026-09-30 | Q51 Commanding | Both: click-to-command in isometric, talk on the floor. | 2 |
| 2026-09-30 | Q52 Loading | Seat, door, probe (work offset), select correct program, CYCLE START. Skipping the probe or picking the wrong program is how crashes happen. | 2.5 |
| 2026-09-30 | Q4 Camera | Two views of one shop: first-person 3D is the core, 2D isometric for managing and layout, switch any time. You can pick up a block, load a machine, press CYCLE START, or throw the block at an employee and get a WSIB claim. | 2.1, 2.2, 12, 13.1 |
| 2026-09-30 | Q5 Phones / UI | Walk-around is the game on every device. The management UI is only for managing and is never the core view. | 2.3, 2.4 |
| 2026-09-30 | Q50 Narrator | No narrator. Commentary from the people in the shop and the customer inbox. | 1 |
| 2026-09-30 | Q2 Player | The player is the owner, came up through the trade, can run any machine and build a mold. Comedy is hiring the wrong people, and accidents that happen even to the best. Doing dumb things on purpose is allowed and entertaining. | 1.4, 8.4 |
| 2026-09-30 | Q3 Shop name | Player names the shop; the name appears everywhere. | 1.5 |
| 2026-09-30 | Q1 Tone | Comedic and light-hearted: crashes, scrap, disgruntled employees are the comedy. Real mechanics underneath. Fun first, but good gameplay. | 1 (tone, comedy principles), 8.3, 12 |

---

## 19. Glossary (as the game will use the words — please correct)

- **A-side / cavity side** — the stationary half of the mold, usually forms the outside of the part.
- **B-side / core side** — the moving half, carries ejection, usually forms the inside.
- **Mold base** — the purchased standard plate set the cavity and core are built into.
- **Insert** — a separately made piece set into the cavity or core to form detail.
- **Slide / lifter** — mechanisms that move to release undercuts.
- **Ejector pins** — push the part off the core when the mold opens.
- **Sprue / runner / gate** — the path plastic takes into the cavity.
- **Hot runner** — heated manifold keeping plastic molten in the runner; no runner scrap.
- **Parting line** — where the two halves meet; must seal (spotting) or you get flash.
- **Spotting** — fitting the halves together under a press with bluing to see where they touch.
- **EDM** — electrical discharge machining; **sinker** burns a shape with an electrode, **wire**
  cuts a profile with a wire.
- **Electrode** — graphite or copper shape used by a sinker EDM.
- **SPI finish** — Society of the Plastics Industry surface finish grades, A-1 (mirror) to D-3.
- **Heat treat** — hardening the steel; usually a vendor.
- **T1 / T2** — first and second tryout (sampling) of the mold in a press.
- **PPAP / first article** — the inspection paperwork some customers require.
- **RFQ** — request for quote.
- **PO** — purchase order.

---

*Nothing above is built. Nothing above is final. Go through it with a red pen.*
