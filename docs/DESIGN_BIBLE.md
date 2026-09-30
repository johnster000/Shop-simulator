# SHOP SIMULATOR — Design Bible

**Studio:** Cycle Start Studios · **Status:** DRAFT 0.8 — sections 1 to 4 agreed; the mold model (§5) and the workflow (§6) next
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
| ✅ **Agreed** | Reviewed and signed off. Safe to build. |

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
honest enough that you will not wince.

### 5.1 The anatomy as the game sees it 🟡

A **mold** in the game is built from:

- **Mold base** — a standard purchased assembly (plates, guide pins, bushings, return pins,
  sprue bushing, locating ring). Bought from a vendor by size; arrives in days, not built.
- **Cavity side (A-side)** and **core side (B-side)** — the blocks the shop actually machines.
  These are where the hours go.
- **Inserts** — smaller detail pieces that go into the cavity/core; more inserts = more parts to
  make but easier to fix later.
- **Actions**: slides / lifters for undercuts. Each one is a sub-assembly with its own machining
  and fitting hours and its own way of going wrong.
- **Ejection** — ejector pins, sleeves, blades, stripper plate; purchased hardware plus fitting time.
- **Cooling** — water lines drilled through the blocks; gun drill or long drills on the mill;
  baffles, bubblers, O-rings.
- **Runner system** — cold runner (machined into the plates) or **hot runner** (a purchased
  manifold system: expensive, long lead time, more fitting, unlocks higher-value work).
- **Finish** — polish grade or texture on the cavity surface.

### 5.2 Mold parameters (what a contract specifies) 🟡

These are the knobs that generate every contract and drive hours, cost and risk:

| Parameter | Range | Drives |
|---|---|---|
| Part size | Small (cap) → Large (automotive fascia) | Mold base size, block size, machine size, crane |
| Cavitation | 1, 2, 4, 8, 16, 32 | Repetition: more identical cavities = more hours, EDM and fitting |
| Geometry complexity | 1–5 | Roughing/finishing hours, EDM hours, 5-axis benefit |
| Undercuts | 0–N slides, 0–N lifters | Extra machining, fitting, risk at tryout |
| Steel | Aluminum (proto), P20, H13, S7, 420 stainless, etc. | Material cost, heat treat, machining speed, tool wear, mold life |
| Surface finish | SPI A-1 (lens) → D-3 (heavy texture) | Polish hours (huge for A grades), texturing vendor |
| Tolerance | Standard / tight / medical | Inspection, CMM required, rework risk |
| Runner | Cold / hot | Cost, lead time, vendor dependency |
| Guaranteed cycles | 100k / 500k / 1M+ | Steel and hardening choice |

### Questions for you

- **Q15.** Is this anatomy right and is anything essential missing (hot sprue, stripper plates,
  unscrewing cores, interchangeable inserts, mold-in-mold for family tooling)?
- **Q16.** Which parameters actually matter most to *your* hours and risk? If you had to explain
  to a new estimator the five things that make a mold expensive, what are they?
- **Q17.** Steel list: which ones do you actually see, and which drive the biggest differences in
  the shop (machinability, heat treat, cost)?
- **Q18.** SPI finish: is it fair to say polish hours explode above B-grade, and A-1/A-2 is a
  specialist job (possibly outsourced)?

---

## 6. The workflow: how a job moves through the shop

This is the heart of the simulation. Each contract becomes a **job**, and a job is a sequence of
**stages**, each requiring a machine (or bench), a person with a skill, and hours. Some stages
can run in parallel (A-side and B-side on two machines). Some depend on vendors (steel delivery,
heat treat, texturing).

### 6.1 Proposed stage list 🟡

```
 1. RFQ arrives            customer sends a part print + requirements
 2. Quote                  estimate hours + material + purchased parts; set price and lead time
 3. PO / kickoff           customer accepts; deposit lands (maybe); job enters schedule
 4. Mold design            designer produces the tool design (hours; can be outsourced early)
 5. Purchasing             order mold base, steel, hot runner, hardware; each has lead time
 6. CAM programming        programs for the mills (hours; programmer)
 7. Rough machining        VMC: hog out cavities/cores from soft steel
 8. Heat treat (vendor)    for hardened steels; ships out, comes back in ~1–2 weeks
 9. Finish machining       VMC / hard mill: final surfaces, semi-finish for EDM
10. Electrodes             graphite mill: cut electrodes for EDM details
11. Sinker EDM             burn details, ribs, corners
12. Wire EDM               inserts, pin holes, slide pockets
13. Grinding               plates, inserts, slides square and to size
14. Water lines            gun drill / mill: cooling circuits
15. Polish / texture       bench polish; or texture vendor
16. Fit and spot           moldmaker: fit inserts, slides, lifters; spot the parting line on the press
17. Assembly               ejection, hardware, water fittings, wiring for hot runner
18. Tryout (T1)            sample in a press (yours or a molder's); parts inspected
19. Revisions / T2         fix what T1 showed; repeat until approved
20. Final inspection       CMM / customer sign-off on sample parts
21. Ship                   crate it; invoice final payment
```

### 6.2 What makes it a game 🟡

- **Scheduling**: multiple jobs compete for the same machines and people. The schedule screen is a
  Gantt-style board. The player can prioritise, split work, run overtime, or outsource a stage.
- **Critical path**: the game shows which stage is holding the job up. Waiting on a hot runner
  vendor for three weeks with a finished mold on the bench is a very real feeling.
- **Parallelism**: A-side and B-side and each slide are separate work items that can be on
  different machines at once, if you have the machines and people.
- **Vendors**: heat treat, texturing, plating, hot runners, mold bases, steel. Each has a lead
  time, a price and a reliability. A cheap heat treater who cracks a block once a year is a story.
- **Tryout results**: T1 rolls against the job's risk factors (green fitter, rushed polish, skipped
  inspection, lots of slides) to produce realistic defects: flash, short shot, sink, warp, stuck part,
  drag marks, ejector marks, water leak, hot runner drool, wrong dimension. Each defect maps to a
  fix (rework stage) and a cost.

### Questions for you

- **Q19.** Is the stage order right? Where does grinding really sit (before rough? after heat
  treat? both)? Where do water lines go (before heat treat, I assume)?
- **Q20.** Which stages would you *collapse* for the sake of a game, and which must stay
  separate because they are where time and money actually go?
- **Q21.** Rough proportions: for a "normal" mold, what fraction of hours goes to design, CNC,
  EDM, grinding, polish, fitting/spotting? Even "fitting and spotting is a third of it" is gold.
- **Q22.** Tryout: is T1 in-house or at the customer's molder for a shop like yours? Who pays
  for press time? How many rounds are typical?
- **Q23.** What actually goes wrong at tryout most often, and what does the fix look like on the
  floor?
- **Q24.** Engineering changes mid-build: how common, who pays, and how do they hit the schedule?

---

## 7. Customers and contracts

### 7.1 Customer types 🟡

| Segment | Typical work | Pays | Patience | Requirements |
|---|---|---|---|---|
| Local job-shop molders | Small simple molds, repairs, revisions | Low, fast | High | None |
| Consumer products | Housings, caps, closures; medium cavitation | Medium | Medium | Decent finish |
| Packaging | High cavitation, fast cycles, stainless, hot runners | High | Low | Hot runner, tight tolerance, inspection |
| Automotive Tier 1/2 | Large, complex, textured, slides everywhere | High, slow | Low | PPAP-style paperwork, CMM, big machines |
| Medical | Small, tight tolerance, stainless, clean | Very high | Medium | CMM, documentation, cleanliness |
| Appliance / industrial | Large, plain, long life | Medium | Medium | Big machines |

### 7.2 Contract types 🟡

- **New tool build** — the main event. Weeks to months.
- **Engineering change / revision** — days to a couple of weeks; often on a mold you built.
- **Repair / maintenance** — a molder's damaged tool; laser weld, replace pins, re-polish.
- **Prototype / aluminum tool** — quick, cheap, low cycle life; good early-game work.
- **Transfer tool** — someone else's mold arrives in bad shape; fix it and get it running.
- **Rush** — any of the above with a brutal lead time and a premium.

### 7.3 Getting work 🟡

- Early on: cold calls, a local reputation, the one molder who knows you. Contracts trickle in.
- **Reputation** per segment, built on on-time delivery, tryout success and quality. Drives RFQ
  volume and which segments will talk to you.
- **Sales**: hire a sales/estimating person to bring in RFQs; attend a trade show (an event with a
  cost and a payoff).
- **Repeat customers**: molds you built come back for revisions and repairs; the customer's next
  program lands on your desk first.

### 7.4 Quoting 🟡

The quote screen shows the game's estimate (hours per stage, materials, purchased parts, vendor
costs) based on the mold parameters and the shop's history, plus a **confidence** band. The player
sets **price** and **lead time**. Customer response depends on price vs. their expectation, lead
time vs. their need, and reputation. Win too cheap and you eat the overrun; quote too fat and lose
the job. The estimate gets better as the shop builds more molds (and hires a better estimator).

### 7.5 Payment terms 🟡

Something like 30% on PO, 30% at T1, 40% on approval, net 30. Cash goes out for steel and
components on day one and comes back months later. This is the central tension of the money game.

### Questions for you

- **Q25.** Who are the customers of a shop like yours really? Correct the segment table.
- **Q26.** How does work actually arrive? RFQ by email with a print and a part model? How many
  shops quote each job? How often do you win?
- **Q27.** Payment terms: what is normal, and what do customers try to get away with?
- **Q28.** Price ranges: what does a small single-cavity P20 mold cost vs. a 16-cavity stainless
  hot runner packaging tool vs. an automotive part? Even wide bands.
- **Q29.** Lead times: typical quoted weeks for small / medium / large builds?
- **Q30.** What does a customer do when you are late? Penalty clauses, cancelled next program,
  or just yelling?

---

## 8. Staff

### 8.1 Roles 🟡

| Role | Does | Skill axis | Notes |
|---|---|---|---|
| Moldmaker / toolmaker | Fitting, spotting, assembly, can run most machines | Fitting, machining | The core of the shop; expensive and rare |
| CNC machinist | Setup and run mills | Milling | |
| CNC programmer (CAM) | Programs from the design | Programming | Can be the machinist early on |
| EDM operator | Sinker and wire | EDM | |
| Grinder hand | Surface/jig grinding | Grinding | |
| Polisher | Bench polishing | Polish | Slow to train |
| Mold designer | Tool design in CAD | Design | Can be outsourced early |
| Estimator / PM | Quotes, schedules, customer contact | Estimating | Improves quote accuracy |
| QC inspector | CMM, first article | Inspection | Needed for medical/automotive |
| Apprentice | Anything, slowly, with risk | Grows into any role | Cheap; long-term investment |
| Shop foreman | Multiplies everyone else | Leadership | Mid-game |

### 8.2 People mechanics 🟡

- **Skill levels** 1–5 per axis; rise with hours on the work; drop for nothing.
- **Wages** weekly; **overtime** at 1.5× with a morale cost.
- **Morale**: pay, overtime, break room, crashes blamed on them, being idle. Low morale → quality
  dips → quits.
- **Hiring**: a candidate pool refreshed weekly; better candidates as reputation grows; a
  journeyman moldmaker is rare and gets poached.
- **The owner (player)** — see §8.4.

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

### Questions for you

- **Q31.** What does the crew look like at 2, 6, 12 and 25 people? Who is hire #1, #2, #3?
- **Q32.** Rough wages by role, and how much a good moldmaker is worth vs. a green one.
- **Q33.** Which roles are genuinely separate jobs and which does one person cover in a small
  shop? (Is "EDM operator" a real title at 8 people, or does the moldmaker run the sinker?)
- **Q34.** How long does an apprentice take to become useful, and how do shops actually train?
- **Q35.** Anything about shop culture that should be in the game? Shifts, Saturdays before a
  ship date, the guy who only does polish, the one who will not touch a CNC.

---

## 9. Economy

All numbers placeholder. 🟡

- **Start:** the 2,500 sq ft unit (§3.1), rented. A small pot of cash (placeholder: $50k, of
  which the first $20k goes per §3.5), no crane, no machines, one bay door with a tarp.
- **Shop rate:** the number behind every quote. Stage 0 work sells at about $50–60/hr, mold
  work at about $90–120/hr (§4.1). Quotes are hours × rate + material + purchased parts +
  vendors, and the estimate screen shows it that way.
- **Income:** contract payments per §7.5. **Customers do not pay when you ship.** Progressive
  terms (a deposit, a payment at tryout, the rest on approval, each on net-30 or worse) mean the
  money for a job you finished arrives months after you paid for its steel. Per Q7 this is the
  thing that really hurts small shops, and the game should make the player feel it.
- **Outgoings:** wages weekly; rent, power, insurance, air/coolant/tooling monthly; steel, mold
  bases, hot runners, hardware per job; vendor invoices; machine payments (buy outright, finance,
  or lease); maintenance; the occasional disaster.
- **Bank:** a line of credit that grows with track record; interest; a cash-flow chart that is
  the most looked-at screen in the game.
- **Assets:** machines depreciate; can be sold used.
- **Failure state:** negative cash past the credit line for N weeks = the bank calls it. Game over,
  with a summary screen.

### Questions for you

- **Q36.** Realistic starting position for someone who actually did this: how much cash and what
  machines does a person open a mold shop with?
- **Q37.** Overhead: what does a small shop pay a month in rent/power/insurance? Bands are fine.
- **Q38.** How are machines usually paid for? Cash, financed, leased?
- **Q39.** The cash-flow squeeze: is "steel and base paid up front, money at the end" the real
  shape of it, and how do shops survive it?

---

## 10. Time

🟡 The game runs in **shop days**. One in-game day is roughly a minute of real time at normal
speed, with pause, 1×, 3×, 10×. A week is five working days (plus optional Saturdays at overtime).
Machines that run lights-out keep going overnight. Mold builds taking 6–16 in-game weeks means a
first mold ships after 30–80 minutes of play, which feels right for "the first big milestone".

Buy Stove's `?speed=` and `?skip=` style shortcuts stay for testing.

### Questions for you

- **Q40.** Does a day-per-minute pace and a first mold at ~45 minutes feel right, or should the
  game move faster and abstract more?
- **Q41.** Should the game be endless, or have a horizon (10 years) with a score?

---

## 11. Progression

🟡 Proposed arc:

1. **Garage phase** — you, a Bridgeport, a lathe, a grinder. Repairs, revisions, small aluminum
   protos. Learn the UI. First VMC is the goal.
2. **Job shop** — VMC + sinker + wire. First real new-build. Hire a moldmaker. First heat-treat
   scare. First tryout.
3. **Real shop** — multiple jobs in flight, scheduling matters, crane, spotting press, CMM. Start
   winning consumer and packaging work. First hot runner tool.
4. **Tier supplier** — 5-axis, in-house sampling press, second building, 20+ people, automotive
   and medical programs. The game becomes about keeping the beast fed.

**Milestones / achievements:** first mold shipped, first repeat customer, first job under
estimated hours, first lights-out weekend, 1,000,000-cycle tool, zero-defect T1, "we never crashed
a machine this year", the 5-axis arrives, etc. Cycle Start games like a long achievement list.

### Questions for you

- **Q42.** Is this arc believable? What did the real growth path look like for shops you know?
- **Q43.** Any milestone that would make a real moldmaker grin?

---

## 12. Risk and failure

🟡 The sim needs things that go wrong, and they need to be the *real* things. This is the comedy
engine, part two: every row below has a real cause and a real cost, and a **presentation** that is
funny. The failure system must be fair (you can always see why) and never so punishing that the
joke stops being funny.

| Event | Cause | Consequence | How it looks |
|---|---|---|---|
| Machine crash | Green operator, bad program, rushed | Rework/scrap block, machine down, morale hit | Bang, alarm, cracked window, a tool sticking out of something, everyone gathers round |
| Scrapped block | Crash, wrong dimension, wrong steel | Weeks of hours in the bin | Carried to the scrap bin, clang, "OOPS" in paint marker, an achievement |
| Steel arrives wrong / late | Cheap vendor | Schedule slip | Wrong-size block on the dock with a shrug from the driver |
| Heat treat cracks a block | Vendor quality, wrong steel, sharp corners | Start the block over; weeks lost | Comes back in two pieces in the same crate, with an invoice |
| Tryout defects | Risk factors in the build | Rework loop, extra press time | Sample parts on the bench: flash like a pie crust, a short shot, a part that will not come out |
| Customer revision mid-build | Random, by segment | Extra hours; who pays depends on the PO | "Just a small change" email; the print now has a hole through the slide |
| Hot runner late | Vendor lead time | Finished mold sits waiting | A finished mold on the bench with a sticky note counting the days |
| Key employee quits | Morale, poaching | Skills walk out the door | A speech, a slammed door, the radio left on their station |
| Machine breakdown | Neglected maintenance, age | Service call + downtime | Smoke, a puddle, a tech who arrives Thursday and needs a part from Germany |
| Cash crunch | Slow payers, too many jobs started | Bank | Phone rings; it is the bank; nobody wants to answer it |
| Customer goes bankrupt | Rare event | Unpaid final invoice; you own a mold nobody wants | A very nice mold in the corner with a for-sale sign |
| Quote badly wrong | Bad estimate, novel job | Eat the hours | The estimate sheet, framed, with the real number written next to it |
| Lights-out gone wrong | Tool broke at 11 p.m.; nobody there | A night of air cutting, or a ruined block | Morning reveal: a spun tool, chips in the wrong shape, an operator holding the broken end mill up like a fish |
| EDM fire | Unattended sinker, low dielectric, bad flushing | Machine gutted, smoke damage, insurance, questions | Black soot on the ceiling, the fire department's card on the desk, everyone very quiet |
| Welded tool | No spindle coolant, no oil, dry cut | Tool fused to the block; rework; spindle check | An end mill sticking out of a cavity like a flag |
| Workplace injury | Something thrown, a crane load swinging, no guard on the grinder, or plain bad luck | WSIB claim, a bill, days off work, morale, an inspector visit if it keeps happening | The ambulance in the parking lot, a cast, everyone else suddenly wearing their safety glasses |
| Wrong program run | Operator picked the wrong file | Crash or a nicely machined part for a different customer | A perfect cavity for a job you finished last month |

### Questions for you

- **Q44.** Rank these by how often they actually happen and how much they hurt.
- **Q45.** What is the war story every mold shop has that should be in the game?
- **Q46.** Should the game let the player *cut corners* (skip inspection, rush polish, undersize
  water) with a risk payoff, or is that unrealistic?

---

## 13. Presentation

### 13.1 The 3D shop (and its isometric twin) 🟡

- **Style:** Buy Stove's stylised procedural look, but industrial: grey epoxy floor with yellow
  safety lines, steel-blue machine enclosures, orange crane, fluorescent cool light, dust in the
  beams. Cleanliness as a visible state (chips, coolant on the floor, crates piling up).
- **Machines** are recognisable silhouettes: an enclosed VMC with a window and a status light
  stack (green/amber/red), an open sinker EDM with a tank, a wire EDM with its spools, a grinder
  with a wheel guard, the spotting press as a big blue frame.
- **Animation:** spindle spinning through the window, sparks and a glow in the EDM tank, coolant
  spray, the crane moving, a forklift at the dock, people walking between stations and standing
  at benches.
- **Work-in-progress** is visible: a block on the machine table, a mold base on the bench with the
  parting line blued up, a finished mold in a crate by the door.
- **Status light stacks** and a floating tag when looked at: `JOB 0042 · CORE BLOCK · FINISH ·
  62% · Dave` — the floor tells you the schedule if you walk it.
- **Isometric view:** the same scene from a lifted fixed-angle camera with the roof removed; every
  machine and person gets a permanent tag; idle machines and idle people are visibly flagged.

### 13.2 The management UI 🟡

Honest 2D HTML overlay, monospace, terminal/paper feel (Buy Stove's catalog aesthetic reused
for the RFQ inbox and the invoices):

- **Inbox:** RFQs, customer messages, vendor notices.
- **Quote:** the estimate, the price/lead-time sliders, the send button.
- **Jobs:** every job in flight, its stages, its critical path, its money.
- **Schedule:** Gantt of machines × days; drag to reprioritise.
- **Shop:** buy/sell/place machines and facility upgrades.
- **People:** hire, fire, wages, skills, morale.
- **Purchasing / vendors:** orders, lead times, reliability history.
- **Bank:** cash, credit, cash-flow chart, P&L.
- **Reputation:** by segment, with the reasons.

### 13.3 Sound 🟡

All synthesized: room tone (compressor cycling, fluorescent hum), spindle pitch by RPM, the EDM
crackle, air blow-off, grinder scream, crane beeper, forklift reverse, hydraulic press thunk, phone
ringing in the office, the roll-up door. A quiet shop should sound *wrong* to the player.

### Questions for you

- **Q47.** What sounds and sights define a mold shop to you? What would you notice was missing?
- **Q48.** Any reason not to reuse Buy Stove's monospace/paper UI style for the office screens?

---

## 14. Screens (inventory)

Intro → New game / Continue → The shop (3D, HUD) → Management overlay (tabs per §13.2) →
Machine panel (per machine) → Job panel (per job) → End of week summary → Game over / Year
summary → Achievements gallery → Pause.

---

## 15. Save data

One `localStorage` key per slot, JSON: shop layout, machines and condition, staff, jobs and stage
progress, customers and reputation, vendors, bank, clock, achievements, settings. Autosave at end of
day; manual save in pause. Versioned so later builds can migrate.

---

## 16. Scope tiers

So we can agree what "done" means before building.

**MVP (v0.1 — playable loop):** empty shop, buy and place 4–5 machines, hire 3 roles, one
customer segment, new-build contracts only, the full stage pipeline (collapsed where Q20 says),
quoting, scheduling, one vendor each for steel/base/heat treat, tryout with a few defects, cash
and payroll, one year of play, save/load, phone-playable management UI.

**v1.0:** full machine catalogue, all segments and contract types, vendors with reliability,
morale, machine condition and crashes, hot runners, progression tiers, achievements, sound, floor
animation, the events table in §12.

**Stretch:** second building, second shift, apprentices growing into moldmakers, trade shows,
customer personalities and recurring characters, a "story" customer program that runs across
years, competitor shops that bid against you.

### Questions for you

- **Q49.** Does the MVP cut make sense, or is there something in v1.0 that has to be in the first
  playable for it to feel like a mold shop at all?

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
| Q15 | 5 | Mold anatomy corrections | ❓ |
| Q16 | 5 | The five things that make a mold expensive | ❓ |
| Q17 | 5 | Steel list | ❓ |
| Q18 | 5 | Polish grades and hours | ❓ |
| Q19 | 6 | Stage order | ❓ |
| Q20 | 6 | Which stages to collapse | ❓ |
| Q21 | 6 | Hours proportions by stage | ❓ |
| Q22 | 6 | Tryout: where, who pays, how many rounds | ❓ |
| Q23 | 6 | Common tryout defects and fixes | ❓ |
| Q24 | 6 | Engineering changes mid-build | ❓ |
| Q25 | 7 | Customer segments | ❓ |
| Q26 | 7 | How work arrives; win rate | ❓ |
| Q27 | 7 | Payment terms | ❓ |
| Q28 | 7 | Mold price bands | ❓ |
| Q29 | 7 | Lead time bands | ❓ |
| Q30 | 7 | What happens when you are late | ❓ |
| Q31 | 8 | Crew shape at 2/6/12/25 | ❓ |
| Q32 | 8 | Wages | ❓ |
| Q33 | 8 | Which roles are real separate jobs | ❓ |
| Q34 | 8 | Apprentices | ❓ |
| Q35 | 8 | Shop culture details | ❓ |
| Q36 | 9 | Realistic starting cash and machines | ❓ |
| Q37 | 9 | Monthly overhead | ❓ |
| Q38 | 9 | How machines are financed | ❓ |
| Q39 | 9 | Cash-flow shape | ❓ |
| Q40 | 10 | Pace: day per minute? | ❓ |
| Q41 | 10 | Endless or horizon | ❓ |
| Q42 | 11 | Growth arc believable? | ❓ |
| Q43 | 11 | Milestones that make a moldmaker grin | ❓ |
| Q44 | 12 | Rank the failure events | ❓ |
| Q45 | 12 | The war story | ❓ |
| Q46 | 12 | Allow cutting corners? | ❓ |
| Q47 | 13 | Defining sights and sounds | ❓ |
| Q48 | 13 | Reuse Buy Stove UI style? | ❓ |
| Q49 | 16 | MVP cut | ❓ |
| Q50 | 1 | Narrator vs. commentary from the people in the shop | ✅ The people, no narrator |
| Q51 | 2 | Command people from the isometric view? | ✅ Both isometric click and floor talk |
| Q52 | 2 | Fidelity of loading a machine by hand | ✅ Seat, door, probe, select program, CYCLE START; skipped steps cause crashes |
| Q53 | 3 | Software package naming | ✅ Spoofed real brands everywhere, see BRANDS.md |
| Q55 | 3 | Vet the BRANDS.md spoof list | ❓ |
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
