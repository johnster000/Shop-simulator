# Shop Simulator — Brand Catalogue (spoof names)

**Status:** DRAFT for vetting. Every spoof name below is a proposal. Cross out, rename, or add.

The game names everything after the real world, spoofed. Machines, software, steel, tooling,
hot runners, cranes, compressors, forklifts. The rule is that a moldmaker should recognise the
nod and laugh, and nobody should be able to mistake it for the real thing.

---

## 0. The legal side (not legal advice)

Parody brands in games are common and generally fine, but there are real lines. What matters in
trademark law is **likelihood of confusion**, **dilution of famous marks**, and **false
association**. The fictional setting does not by itself remove the risk; how the name is
presented and whether people could think the real company is involved does.

House rules for this game, so we stay on the safe side of those lines:

1. **Never the real name.** Not on a machine, not in a menu, not in the achievements. The only
   exception is a brand we own (see §5 on the shop software Easter egg).
2. **Never a real logo, typeface, colour scheme, or trade dress.** A spoof of Haas is a name, not a
   red-and-white machine with a similar wordmark. Our machines have their own look.
3. **Recognisable but clearly not it.** One or two letters changed is too close (more confusion,
   less parody). A pun that lands on a different word is the sweet spot: "Sandwich Coromant",
   "Yesda", "Gerbil jib cranes".
4. **Famous marks get more distance.** Mitsubishi, Siemens, Toyota, Amazon and the like can claim
   dilution even without confusion. For those we go further from the name.
5. **The joke is never that the real company is bad.** Our fictional machines can crash, leak and
   break, but the game never says or implies a real brand's product is unsafe or junk. The
   personalities belong to the fictional brands.
6. **A disclaimer on the intro screen** ("All companies, products and people in this game are
   fictional. Any resemblance to real machine tool builders is a joke.") is cheap and worth having.
7. **If the game ever makes money**, have an actual lawyer skim this list. Until then, the list
   above is the standard.

Sources on the parody line: [Vondran Legal, trademark problems for game studios](https://www.vondranlegal.com/top-10-trademark-problems-every-video-game-studio-should-avoid),
[Lexology on brand-name parody](https://www.lexology.com/library/detail.aspx?g=fd17ce8d-577a-496c-8099-23abc38d9c98),
[Wikipedia, fictional brands](https://en.wikipedia.org/wiki/Fictional_brand).

---

## 1. CAD (mold design)

Real-world tiers, from the research: CATIA and Siemens NX are the top of the market at roughly
$15k–$30k per seat per year. Creo sits just under them. Cimatron, VISI and TopSolid are the
mold-and-die specialists, typically $20k+ for a full seat with custom quotes. SolidWorks with a
mold add-on is the mid-market default. Fusion, Rhino and the free packages are the bottom.
([demystifyingplm CAD 2026](https://www.demystifyingplm.com/best-cad-software-2026),
[worldmetrics mold design software](https://worldmetrics.org/best/injection-mold-design-software/),
[hordrt CAD/CAE tools for mold design](https://www.hordrt.com/top-cad-cae-injection-mold-design-software/))

| Tier | Real | Spoof | Game flavour |
|---|---|---|---|
| Top | CATIA (Dassault Systèmes) | **KATYA** by Dassaux | The automotive customers demand it. Costs more than your first machine. Needs a training course to draw a cube. |
| Top | Siemens NX (Mold Wizard) | **Zeimens MX** (Mould Wizzard) | Does everything. Nobody in the shop knows how. |
| Top | PTC Creo | **Kreo** by PTQ | Excellent. Licensing manager is a full-time job. |
| Mold specialist | Cimatron | **Cavitron** | The moldmaker's package. Ugly. Fast. Everyone who uses it swears by it. |
| Mold specialist | VISI (Hexagon) | **VIZZI Mould** by Heptagon | Same idea, different religion. |
| Mold specialist | TopSolid'Mold | **TopSquid Mold** | French. Very good. Manual is in French. |
| Mid | SolidWorks (+ MoldWorks) | **RigidWorks** (+ MouldWorks) | What most shops actually run. Crashes at 4:55 on Fridays. |
| Low | Autodesk Fusion 360 | **Confusion 360** by Autodusk | Cheap, cloud, fine for a start. The subscription email arrives before the license. |
| Low | Rhino | **Hippo 3D** | Surfacing for people who like surfaces. |
| Free | FreeCAD | **GratisCAD** | Free. You get what you pay for, and also a forum. |
| "Free" | (pirated copy of a top package) | **KATYA "Community Edition"** | See the design bible §3.4. Works great until the letter. |

## 2. CAM (programming the mills)

Real-world tiers: mid-tier seats (hyperMILL, Esprit, Edgecam) run about €8k–€15k perpetual or
€3k–€6k per year; high-tier mold/die seats (Tebis, NX CAM) €15k–€30k+ perpetual. PowerMill is
quote-based enterprise, roughly $5k–$8k per year; Mastercam ranges from about $6k to $50k+
perpetual depending on modules. Fusion, SolidCAM and BobCAD are the cheap end.
([Practical Machinist, WorkNC vs Tebis for moldmaking](https://www.practicalmachinist.com/forum/threads/mold-making-worknc-vs-tebis-differences.431955/),
[demystifyingplm CAM 2026](https://www.demystifyingplm.com/best-cam-software-2026),
[Capterra Mastercam](https://www.capterra.com/p/230166/MasterCam/),
[G2 hyperMILL pricing](https://www.g2.com/products/hypermill/pricing))

| Tier | Real | Spoof | Game flavour |
|---|---|---|---|
| Top (mold/die) | Autodesk PowerMill | **UltraMill** by Autodusk | The 5-axis package. Toolpaths so smooth the machine cries. |
| Top (mold/die) | hyperMILL (OPEN MIND) | **turboMILL** by CLOSED MIND | German. Precise. Opinionated. |
| Top (mold/die) | Tebis | **Tepis** | The big automotive die shops run it. It runs them back. |
| Top (mold/die) | WorkNC (Hexagon) | **WerkNC** by Heptagon | Old, unkillable, still on half the machines in the country. |
| Top (general) | Siemens NX CAM | **Zeimens MX CAM** | Comes with MX. Also comes with a consultant. |
| Mid | Mastercam | **MasterCram** | Everybody learned on it. Everybody has opinions. |
| Mid | Esprit (Hexagon) | **Espresso CAM** | Strong on wire EDM and turning. Keeps you up. |
| Mid | GibbsCAM | **GlibsCAM** | Talks a good toolpath. |
| Mid (mold) | Cimatron CAM | **Cavitron CAM** | Same seat as the CAD. One less license fight. |
| Low | Fusion 360 CAM | **Confusion 360 CAM** | Genuinely fine for 3-axis. Ask it for 5-axis and it asks for a credit card. |
| Low | SolidCAM | **StolidCAM** | Lives inside RigidWorks. Unbothered. |
| Low | BobCAD-CAM | **BubCAD-CAM** | Your buddy Bub's CAM. Bub is doing his best. |
| Free | Hand-written G-code | **Notepad & Prayer** | Free. The crash rate is a feature. |

## 3. Shop management software (quoting, scheduling, job tracking)

Real-world: JobBOSS² (ECI, the merged E2 and JobBOSS, largest installed base in small shops),
ProShop, Global Shop Solutions, Epicor.
([ProShop, best ERP for machine shops](https://proshoperp.com/blog/7-best-erp-systems-for-machine-shops/),
[ECI JobBOSS²](https://www.ecisolutions.com/products/jobboss2/))

| Real | Spoof | Game flavour |
|---|---|---|
| JobBOSS² / E2 | **JobLORD 2** | Runs half the job shops in the country. The other half are on a whiteboard. |
| ProShop | **BroShop ERP** | Cloud. Paperless. Your polisher does not own a computer. |
| Global Shop Solutions | **Galactic Shop Solutions** | Family owned since 1976. The salesman will visit. |
| Epicor | **Epicorn** | Enterprise. Implementation takes longer than your first mold. |
| (the whiteboard) | **The Whiteboard** | Free. Erases itself when the apprentice leans on it. |
| (see §5) | **Genvision** | The Easter egg. |

## 4. Machine tools

Real-world brands by category, tiered by where they sit in a mold shop's budget, and the spoof.
Famous marks (Mitsubishi, Siemens, Toyota) are pushed further from the original on purpose.

### 4.1 Vertical machining centres and 5-axis

| Tier | Real | Spoof | Game flavour |
|---|---|---|---|
| Entry | Haas | **Hoss Automation** | The first VMC most shops buy. Everyone has one. Everyone has a story. |
| Entry | Hurco | **Hurtco** | Conversational control. Good machine. The name is not a promise. |
| Entry | Brother | **Cousin Industries** | Small, fast, drills and taps all day. |
| Mid | Doosan / DN Solutions | **Dozan** | Solid Korean iron. Big for the money. |
| Mid | Okuma | **Okayma** | It is more than okay. It is Okayma. |
| Mid | Mazak | **Mazok** | Fast, reliable, the control has its own language. |
| Mid | Kitamura | **Kittymura** | Boxy, rigid, purrs. |
| Mid | Matsuura | **Matsoura** | Pallet pools. Lights-out. |
| High | DMG Mori | **DGM Nori** | German-Japanese. Beautiful. The service tech flies in. |
| High (mold/die) | Makino | **Mikano** | The mold shop's dream VMC. Hard milling all night. |
| High (5-axis) | Hermle | **Hermlin** | The 5-axis everyone wants. Delivery in fourteen months. |
| High (5-axis) | Grob | **Grub** | Big, fast, automotive. |
| High (graphite/HSM) | Röders | **Rudders GmbH** | Electrodes and hardened steel at 40,000 rpm. Silence in the room. |
| High (ultra-precision) | Yasda | **Yesda** | When the tolerance is in microns, the answer is Yesda. |
| High (HSM) | Mikron (GF) | **Mycron** | Swiss. Small tools. Big invoice. |
| High (HSM) | DATRON | **Daytron** | Fast spindle, small parts, made for graphite. |
| Large gantry | Parpas | **Pappas** | Italian gantry mill for the big automotive blocks. Needs a foundation and a priest. |
| Large gantry | Zimmermann | **Zimmerframe** | Gantry 5-axis. Walks slowly, never falls over. |
| Large | Fidia | **Fedia** | Italian 5-axis heads for the giant dies. |
| Drill/tap | Fanuc Robodrill | **Fanook Robodrool** | Small, fast, tireless. |

### 4.2 Manual machines (day one)

| Real | Spoof | Game flavour |
|---|---|---|
| Bridgeport (knee mill) | **Bridgeford** | The mill. Every shop has one. Half of them are older than the owner. |
| Hardinge (lathe) | **Hardedge** | The toolroom lathe. Tight. Expensive even used. |
| Colchester / LeBlond / Monarch (lathes) | **Coldchester / LeBland / Monarchy** | Big old lathes that will outlive us all. |
| Jet / Grizzly (import) | **Jat / Grizzled Tools** | Cheap. Arrives in a crate. Some assembly required, and then some. |
| Precision Matthews | **Precision Matthias** | Better import. Matthias is a stand-up guy. |

### 4.3 EDM (sinker and wire)

Real-world: Makino, Mitsubishi and GF (AgieCharmilles) lead sinker EDM; Sodick is known for linear
motors and fine-detail mold work; Chmer, Accutex, Excetek and Joemars are the value tier out of
Taiwan. ([Industrial Monitor Direct sinker comparison](https://industrialmonitordirect.com/blogs/knowledgebase/edm-die-sinker-comparison-makino-vs-mitsubishi-vs-charmilles),
[Xometry wire EDM manufacturers](https://www.xometry.com/resources/machining/best-wire-edm-machines/),
[Oscarmax top EDM manufacturers](https://www.oscaredm.com/en-US/newsc87-top-10-edm-manufacturers-in-2025))

| Tier | Real | Spoof | Game flavour |
|---|---|---|---|
| High | Makino | **Mikano** | Same family as the mill. 8,000 hours between service calls, allegedly. |
| High | Sodick | **Sodiak** | Linear motors. Burns a rib so fine you cannot see it. |
| High | Mitsubishi | **Bitsumishi** | Reliable. Auto-threads the wire when it feels like it. |
| High | GF Machining Solutions (AgieCharmilles) | **HG Machining Solutions (Aggie Charmless)** | Swiss. Surface finish like glass. Consumables like jewellery. |
| High | OPS Ingersoll | **OOPS Ingersole** | German sinker. The name is a coincidence. |
| High | Exeron | **Exeroff** | Precise. Occasionally off. |
| Value | Chmer | **Charmer** | Good value. Charming manual. |
| Value | Accutex | **Inaccutex** | It is more accurate than the name. Mostly. |
| Value | Excetek | **Excusetek** | Cheap wire EDM. Comes with excuses pre-loaded. |
| Value | Joemars | **Joemarz** | Joe's sinker. Joe is on Mars. |
| Control/wire | Fanuc | **Fanook** | Yellow. Unkillable. |

### 4.4 Grinding

| Real | Spoof | Game flavour |
|---|---|---|
| Okamoto | **Okeymoto** | The surface grinder. |
| Chevalier | **Cavalier** | Good grinder, casual attitude. |
| Mitsui | **Mitsue** | Precision. Old. Loved. |
| Kent | **Kant** | Grinds. Philosophically. |
| Harig | **Herring** | Small manual grinder for the fitting room. Slightly fishy. |
| Jones & Shipman | **Jones & Shipmate** | British. Sturdy. |
| Blohm | **Blüm** | Creep-feed. Serious. |
| Moore (jig grinder) | **Moore & Less** | The jig grinder. Tenths. The room is climate controlled and so is the operator. |
| Hauser (jig grinder) | **Hauzer** | Swiss jig grinder. Same, quieter. |

### 4.5 Gun drilling and deep hole

| Real | Spoof | Game flavour |
|---|---|---|
| UNISIG | **UNISIGH** | Water lines, three feet deep, dead straight. The sound it makes is a sigh. |
| Cheto | **Chetoh** | Portuguese deep-hole machines. |
| Kays | **Kayz** | Gun drills. |
| IMSA | **IMSAY** | Italian. |
| TBT | **TBH** | To be honest, it is a good gun drill. |
| Botek (tooling) | **Boteque** | The drills themselves. Cost more than the coolant. |

### 4.6 Inspection

| Real | Spoof | Game flavour |
|---|---|---|
| Zeiss (CMM) | **Zeus Metrology** | The CMM. Thunderous accuracy. |
| Hexagon / Brown & Sharpe | **Heptagon / Brown & Sharpish** | The other CMM. |
| Mitutoyo | **Mitutoro** | Every calliper in the crib. |
| Wenzel | **Weasel Metrology** | Sneaks up on a tenth. |
| Faro (arm) | **Pharaoh Arm** | Portable. Regal. |
| Renishaw (probes) | **Wrenishaw** | The probe on the machine. The thing you skip when you crash. |
| Blum (probes) | **Plum** | The other probe. |
| Heidenhain (controls/scales) | **Heidenhound** | German control. Sniffs out a bad program. |
| Marposs | **Marpuss** | Gauging. |

### 4.7 Spotting presses

Real-world: Millutensil (Italy) is the market leader; Reis is the other name seen on the used
market. ([MoldMaking Technology on spotting presses](https://www.moldmakingtechnology.com/products/spotting-presse-from-mold-spotting-to-series-production-),
[Millutensil products](https://www.millutensil.com/products/))

| Real | Spoof | Game flavour |
|---|---|---|
| Millutensil | **Millennial Presses** | Italian spotting press. Does not want to work Saturdays either. |
| Reis | **Rice Presses** | "Reis" is German for rice. The joke was there already. |

### 4.8 Injection presses (sampling)

| Tier | Real | Spoof | Game flavour |
|---|---|---|---|
| High | Engel | **Angel** | Austrian. "Engel" is German for angel. Heavenly, priced accordingly. |
| High | Arburg | **Ahrburg** | German. All-rounder. |
| High | Husky | **Malamute** | Big, Canadian, hot runners built in. |
| High | KraussMaffei | **KrausMuffin** | Huge tonnage. |
| High | Sumitomo Demag | **Sumotomo Demug** | Precise electric presses. |
| Mid | Milacron | **Kilacron** | The North American workhorse. |
| Mid | Nissei / Toyo | **Nissay / Toyoh** | Japanese electrics. |
| Mid | Wittmann Battenfeld | **Witman Buttonfield** | Austrian. Robots included. |
| Small | Boy | **Lad Machines** | The little press for sampling. |
| Value | Haitian | **Tahitian** | Cheap tonnage. A lot of it. |

### 4.9 Hot runners, mold bases, components

| Category | Real | Spoof | Game flavour |
|---|---|---|---|
| Hot runner | Husky | **Malamute** | Same family as the press. |
| Hot runner | Mold-Masters | **Mould-Majors** | Canadian. Long lead time. Worth it. |
| Hot runner | Synventive | **Sinventive** | Valve gates. |
| Hot runner | Incoe | **Inkoe** | |
| Hot runner | Yudo | **Judo** | Korean. Throws plastic around. |
| Hot runner | Ewikon | **Ewwikon** | German. "Eww" is the sound of a drooling gate. |
| Hot runner | Thermoplay | **Thermoplayed** | Italian. |
| Mold base | DME | **DMV** | The standard base. Take a number. Your base will be ready in six weeks. |
| Mold base | Hasco | **Hazco** | German metric bases. Very square. |
| Mold base | Meusburger | **Moosburger** | Austrian. Arrives fast and pre-machined. (A Canadian shop cannot resist the name.) |
| Mold base | Progressive Components | **Regressive Components** | Counters, locks, date stamps. Reliable. |
| Components | Misumi | **Mizumi** | Configurable pins and blocks by catalogue number. Arrives tomorrow. |
| Components | PCS | **BCS** | Pins and sleeves. |
| Components | Futaba | **Futabba** | Japanese bases and pins. |

### 4.10 Cutting tools and consumables

| Real | Spoof | Game flavour |
|---|---|---|
| Sandvik Coromant | **Sandwich Coromant** | Inserts. You will never run out of rep visits. |
| Kennametal | **Kennymetal** | |
| Iscar | **Itscar** | Grooving and parting. |
| Seco | **Seko** | |
| OSG | **OMG** | Taps and end mills. The reaction when you snap one. |
| Mitsubishi Materials | **Bitsumishi Materials** | |
| Harvey / Helical | **Harvie / Hellical** | Small end mills. The good stuff. |
| Fraisa | **Frazier** | Swiss end mills for hard milling. |
| Garr | **Grrr** | End mills. Angry. |
| Guhring | **Gearing** | Drills. |
| Walter | **Wally** | Inserts. Reliable guy. |
| Shars (import) | **Shards** | Cheap tooling. The name describes the end mill after first contact. |
| Amazon specials | **River Basin Tools** | Arrives tomorrow. Might be carbide. |
| Poco Graphite | **Loco Graphite** | Electrodes. |
| Toyo Tanso | **Tanso Toyoh** | Better graphite. |
| Blaser (coolant) | **Blazer** | Swiss coolant. Smells like money. |
| Hangsterfer's (coolant) | **Hamsterfer's** | Sump smell not included. |
| Master Fluid (Trim) | **Mister Fluid (Trimm)** | |

### 4.11 Workholding and toolholding

| Real | Spoof | Game flavour |
|---|---|---|
| Kurt (vises) | **Curt Vises** | The vise. Short name, long life. |
| Schunk | **Skunk** | German workholding. Black and stripy. |
| System 3R | **System 3Q** | Electrode holders. The EDM room's religion. |
| Erowa | **Eroway** | The other religion. |
| Mitee-Bite | **Mighty-Bitey** | Small clamps. |
| Chick | **Chicken Workholding** | Double vises. |
| Jergens | **Jerkins** | Fixturing. |
| Big Daishowa | **Large Daishowa** | Tool holders. |
| Haimer | **Homer** | Shrink-fit. D'oh. |
| REGO-FIX | **RIGO-FIX** | Collets. |
| Lyndex-Nikken | **Lyndex-Nikkon** | Holders. |
| Maritool | **Merrytool** | Good holders, good prices, good mood. |

### 4.12 Facility: cranes, compressors, forklifts, welders

| Category | Real | Spoof | Game flavour |
|---|---|---|---|
| Crane | Konecranes | **Cronecranes** | The overhead crane. The moment. |
| Crane | Demag | **Demug** | |
| Jib crane | Gorbel | **Gerbil Jib Cranes** | Small jib crane. Runs in circles. |
| Hoist | Harrington / CM | **Harringtoon / MC Hoists** | |
| Compressor | Ingersoll Rand | **Ingersole Rant** | The compressor in the corner. Never stops complaining. |
| Compressor | Atlas Copco | **Atlas Copout** | Bigger. Quieter. Gives up on hot days. |
| Compressor | Quincy / Kaeser / Sullair | **Quinsy / Kaiser / Dullair** | |
| Compressor (cheap) | Campbell Hausfeld | **Camel Hausfeld** | The day-one compressor. Hardware store special. |
| Forklift | Toyota | **Toyotter** | Reliable. Never sinks. |
| Forklift | Hyster | **Hysteria** | |
| Forklift | Yale / Crown / Clark | **Yell / Clown / Clerk** | Used. One of them beeps forever. |
| Laser welder | Alpha Laser | **Alfa Lazer** | Repairs and revisions. |
| Laser welder | OR Laser | **AND Laser** | |
| Laser welder | Lampert (PUK) | **Lampart (PUKE)** | Bench micro-welder. |
| Laser welder | Rofin / IPG | **Ruffin / IPJ** | |

### 4.13 Steel

Grade names (P20, H13, S7, 420, A2, D2, 4140) are industry designations, not trademarks, and are
used as-is. Branded grades get spoofed. Suppliers get spoofed.

| Real | Spoof | Game flavour |
|---|---|---|
| Finkl / Sorel Forge | **Finkel / Sorrel Forge** | The P20 block on the truck. |
| Uddeholm | **Oddholm** | Swedish. Stayvax. |
| Böhler | **Bowler** | Austrian. |
| Ellwood | **Elmwood** | Big forgings. |
| Buderus | **Budderus** | |
| Daido | **Dodo** | Japanese. Not extinct. |
| Stavax (Uddeholm) | **Stayvax** | Stainless mold steel. |
| NAK80 (Daido) | **NAP80** | Pre-hardened, polishes like a dream. |
| Mold-Tech / Standex (texturing) | **Mould-Teck by Standish** | Texture vendor. Ships it back looking like leather. |
| (heat treat, local) | **Quench & Sons** | Local heat treater. Cracks one block a year. |
| (heat treat, better) | **Bluewater Heat Treat** | Better. Further. Slower. |

---

## 5. The Easter egg

The shop management software list gets one unspoofed entry: **Genvision**, hidden as the best
and cheapest option, unlocked by an achievement or a code. It is our own name, so the legal rules
above do not apply. **Agreed loosely** (Q56): it goes in behind a single feature flag so it can be
removed cleanly if approval does not come through.

---

## 6. The shortlist for the first playable

Not every brand above ships in v0.1. The MVP needs one or two names per slot:

| Slot | v0.1 names |
|---|---|
| CAD | KATYA "Community Edition" (pirated), RigidWorks, Cavitron |
| CAM | Confusion 360 CAM, MasterCram, UltraMill |
| Shop software | The Whiteboard, JobLORD 2 |
| Manual mill / lathe / grinder | Bridgeford, Hardedge, Herring |
| VMC | Hoss (used), Dozan, Mikano |
| Sinker EDM | Charmer (used), Sodiak |
| Wire EDM | Excusetek (used), Bitsumishi |
| Mold base | DMV, Moosburger |
| Hot runner | Mould-Majors |
| Steel | Finkel, Oddholm |
| Tooling | Shards, Sandwich, OMG |
| Compressor | Camel Hausfeld (day one), Ingersole Rant |
| Crane | Gerbil (jib), Cronecranes (overhead) |
| Heat treat | Quench & Sons |
