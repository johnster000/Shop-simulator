# SHOP SIMULATOR — Design Bible

**Studio:** Cycle Start Studios · **Status:** DRAFT 0.2 — tone agreed, everything else open
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

### Questions for you

- **Q1.** ~~Tone~~ ✅ Answered: comedic and light-hearted, real mechanics underneath. See above.
- **Q50.** Should there be a **narrator** like Buy Stove (a voice that comments on what you do), or
  should the commentary come from the people in the shop (the foreman, the apprentice, the
  customer emails)? Proposed: the people, so the comedy has faces.
- **Q2.** Is the player the **owner** who came up through the trade (can run a machine themselves
  early on), or an owner who only manages? This changes the early game a lot.
- **Q3.** Should the shop be named by the player, or is there a fixed fictional shop name?

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

### Camera and interaction model 🟡 Proposed

- **On the floor:** first-person walk, exactly Buy Stove's feel. Walk up to a machine and look at
  it to see its status (job, % done, operator, alarm). Click to open its panel.
- **In the office:** a desk with a PC. Clicking the monitor opens the **management UI** as a
  full-screen 2D overlay: quotes, schedule, purchasing, hiring, bank. This keeps the 3D world
  simple and lets the management screens be honest HTML instead of 3D UI.
- **Quick access:** a tablet in the player's hand (key `Tab`) opens the same management UI from
  anywhere, so walking back to the office is a choice, not a chore.

### Questions for you

- **Q4.** Is the walk-the-floor first-person view actually what you want, or would you rather an
  overhead/isometric view of the shop with the ability to drop into first person? (First-person is
  "the Buy Stove style"; overhead is what most tycoons do and makes layout easier to read.)
- **Q5.** Phone support is a Cycle Start rule. Are we happy for the phone version to be
  "management UI first, floor view second"?

---

## 3. The shop (the building)

### 3.1 Starting state 🟡 Proposed

An empty industrial unit: bare slab, block walls, high ceiling, one roll-up door, a small office
box in one corner, a bathroom, a breaker panel. Fluorescent lights, half of them out. It is
big, echoey and empty, and the emptiness is the game's first motivator.

### 3.2 Zones 🟡 Proposed

The floor is a grid of **bays**. Machines occupy bays and have a footprint. The player chooses
where things go; layout affects walking time and crane reach, nothing else at first.

| Zone | What lives there | Starts as |
|---|---|---|
| Machining bays | CNC mills, EDM, grinders | Empty slab |
| Bench / fitting area | Moldmaker benches, spotting press | Empty slab |
| Tool crib | Cutters, electrodes, consumables, hardware | Empty shelving |
| Steel rack | Incoming plate and blocks | Empty |
| Inspection room | CMM, granite plate, height gauges | Locked (later purchase) |
| Sampling / press area | Injection press for tryouts | Locked |
| Shipping dock | Crates going out, steel coming in | The roll-up door |
| Office | Desk, PC, whiteboard, phone | Yours, day one |
| Break room | Coffee. Morale. | Later |

### 3.3 Facility upgrades 🟡 Proposed

Things you buy that are not machines but gate machines:

- **Overhead crane / jib cranes** — needed to move anything over a set weight (mold bases, big blocks).
- **Compressed air** — a compressor and lines; needed by most machines.
- **Electrical service** — a bigger panel / transformer as machine count grows.
- **Foundation pads** — some machines (big VMCs, grinders, sinker EDM) need a proper pad.
- **Coolant / chip handling** — chip bins, coolant recycling; ignore it and it becomes a mess.
- **Climate control** — the inspection room and jig grinder want a stable temperature.
- **Expansion** — knock out a wall, add a second bay row; or move to a bigger building.

### Questions for you

- **Q6.** What does a realistic *starting* space look like for a one-person or two-person mold
  shop? Square footage, ceiling height, door size, power? I want the empty building to be
  believable.
- **Q7.** Which facility items actually gate a small shop? Is the crane the real first purchase?
  Is air a day-one thing? Is 3-phase power the thing that eats the first $20k?
- **Q8.** Anything above that is wrong or missing? (Water for the EDM and the press, dielectric
  storage, forklift, etc.)

---

## 4. Machines

This is the catalogue the player buys from. Prices are **placeholders** and are the single most
important thing I need corrected. Every machine has: purchase price (new and used), footprint,
power/air/foundation needs, what stages of a build it can do, hours-per-stage multiplier, breakdown
rate, operator skill required, and resale value.

### 4.1 Proposed catalogue 🟡

| Tier | Machine | What it does in the game | My guess at price (new / used) |
|---|---|---|---|
| 0 | Manual knee mill (Bridgeport type) | Drilling, tapping, simple work, fitting-room fixes | $15k / $5k |
| 0 | Manual lathe | Round inserts, pins, sprue bushings, core pins | $20k / $6k |
| 0 | Surface grinder (manual) | Squaring blocks, plates flat and parallel | $25k / $8k |
| 0 | Bench / drill press / band saw | Fitting, cutting stock | $5k |
| 1 | 3-axis VMC (small, 30 taper) | Roughing and finishing cavities and cores, mold base machining | $90k / $40k |
| 1 | Sinker (ram) EDM | Ribs, sharp corners, deep pockets, text; needs electrodes | $120k / $45k |
| 1 | Graphite mill (high-speed, small) | Cutting electrodes for the sinker | $80k / $35k |
| 1 | Wire EDM | Inserts, ejector pin holes through hardened steel, slides, precision shapes | $150k / $60k |
| 2 | 3-axis VMC (large, 40/50 taper) | Big mold bases and blocks | $250k / $110k |
| 2 | Hard-milling VMC (high-speed, high-accuracy) | Finishing in hardened steel, reduces EDM and polish hours | $300k / $130k |
| 2 | Gun drill | Long straight water lines | $120k / $50k |
| 2 | CNC surface grinder | Faster, unattended grinding | $90k / $40k |
| 2 | CMM | Inspection; unlocks tolerance-critical customers | $110k / $50k |
| 2 | Spotting press | Spotting/bluing the parting line, fitting | $80k / $30k |
| 3 | 5-axis mill | Complex cores/cavities, fewer setups, unlocks the hard contracts | $500k / $220k |
| 3 | Sampling injection press (small) | In-house tryouts instead of paying a molder | $150k / $60k |
| 3 | Laser welder | Repair work and revisions without scrapping | $60k / $25k |
| 3 | Large sinker EDM / large wire | Bigger molds | $250k+ |

### 4.2 Machine behaviour 🟡

- Each machine runs **one job stage at a time** and needs an **operator with the right skill**
  (except ones that can run lights-out once set up: wire EDM, sinker with a tool changer, CNC grinder).
- **Setup time** before cutting; **run time** after, scaled by the operator's skill and the
  machine's condition.
- **Condition** decays with use; **maintenance** restores it; a neglected machine breaks down and
  costs a service call plus lost days.
- **Crashes**: a bad program, a wrong offset, a green operator — chance of a crash that damages the
  workpiece (rework or scrap) and sometimes the machine.
- **Tooling and consumables** are a running cost per hour: end mills, inserts, graphite, EDM wire,
  dielectric, filters, coolant, grinding wheels.

### Questions for you

- **Q9.** Correct the catalogue. What is essential for a starting shop? What would you *never*
  start without, and what is a luxury? What is missing?
- **Q10.** Prices, even roughly. New vs. good used. I would rather have "a used 3-axis VMC is
  $40k–$70k" from you than a nice round number from me.
- **Q11.** Which of these can realistically run unattended overnight in a small shop?
- **Q12.** Is "graphite mill for electrodes" a separate machine in a small shop, or do people
  cut electrodes on the same VMC (with a dust problem)?
- **Q13.** Does a small shop send out **heat treat**, **texturing**, **gun drilling**, **plating**,
  or **polishing**? Which are always outsourced, which are sometimes brought in-house as the shop
  grows? (This defines the "vendors" system.)
- **Q14.** Machine crashes: how common, and what really happens? Does it scrap the block or is it
  usually a weld-and-recut? I want the failure system to be fair, not punishing.

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
- **The owner (player)** can work a machine early on (if Q2 says so), which is how a one-person
  shop survives the first year.

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

- **Start:** a building (rented or inherited?), $150k cash or a $250k loan, one or two manual
  machines.
- **Income:** contract payments per §7.5.
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
| Wrong program run | Operator picked the wrong file | Crash or a nicely machined part for a different customer | A perfect cavity for a job you finished last month |

### Questions for you

- **Q44.** Rank these by how often they actually happen and how much they hurt.
- **Q45.** What is the war story every mold shop has that should be in the game?
- **Q46.** Should the game let the player *cut corners* (skip inspection, rush polish, undersize
  water) with a risk payoff, or is that unrealistic?

---

## 13. Presentation

### 13.1 The 3D shop 🟡

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
| Q2 | 1 | Owner works the floor or only manages? | ❓ |
| Q3 | 1 | Player-named shop? | ❓ |
| Q4 | 2 | First-person vs overhead camera | ❓ |
| Q5 | 2 | Phone = management-first? | ❓ |
| Q6 | 3 | Realistic starting building | ❓ |
| Q7 | 3 | Which facility items gate a small shop | ❓ |
| Q8 | 3 | Facility list corrections | ❓ |
| Q9 | 4 | Machine catalogue corrections | ❓ |
| Q10 | 4 | Machine prices | ❓ |
| Q11 | 4 | What runs unattended | ❓ |
| Q12 | 4 | Separate graphite mill? | ❓ |
| Q13 | 4 | What is outsourced (heat treat, texture, plating, polish) | ❓ |
| Q14 | 4 | Crashes: frequency and reality | ❓ |
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
| Q50 | 1 | Narrator vs. commentary from the people in the shop | ❓ |

---

## 18. Decision log

| Date | Question | Decision | Changed sections |
|---|---|---|---|
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
