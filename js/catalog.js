// What you can buy. Stage 0 only, for now: the manual phase. Every brand is a spoof.
// Footprints in metres (w = across the front, d = front to back). Prices in dollars.

export const MACHINES = [
  {
    id: 'knee_mill', kind: 'mill', name: 'Knee mill', brand: 'Bridgeford', model: 'Series I',
    blurb: 'The mill. Every shop has one. Half of them are older than the owner.',
    w: 1.5, d: 1.8, h: 2.1, priceNew: 15000, priceUsed: 5000, stage: 0, power: 1, air: false,
    stations: ['square', 'rough', 'finish'], manual: true,
  },
  {
    id: 'lathe', kind: 'lathe', name: 'Toolroom lathe', brand: 'Hardedge', model: 'HLV-ish',
    blurb: 'Round things: pins, sleeves, sprue bushings. Tight. Expensive even used.',
    w: 2.4, d: 1.1, h: 1.4, priceNew: 20000, priceUsed: 6000, stage: 0, power: 1, air: false,
    stations: ['turn'], manual: true,
  },
  {
    id: 'grinder', kind: 'grinder', name: 'Surface grinder', brand: 'Herring', model: '618',
    blurb: 'Plates flat, blocks square. Slightly fishy. Grinds tenths if you let it warm up.',
    w: 1.5, d: 1.6, h: 1.7, priceNew: 25000, priceUsed: 8000, stage: 0, power: 1, air: false,
    stations: ['square', 'grind'], manual: true,
  },
  {
    id: 'bench', kind: 'bench', name: 'Fitting bench', brand: 'Shop-built', model: '',
    blurb: 'A vise, a lamp, a drawer that sticks. Where the moldmaker earns their money.',
    w: 2.0, d: 0.8, h: 0.95, priceNew: 800, priceUsed: 300, stage: 0, power: 0, air: false,
    stations: ['fit', 'polish', 'assemble'], manual: true,
  },
  {
    id: 'drill_press', kind: 'drill', name: 'Drill press', brand: 'Grizzled Tools', model: 'G-7',
    blurb: 'Drills. Arrives in a crate. Some assembly required, and then some.',
    w: 0.7, d: 0.7, h: 1.7, priceNew: 600, priceUsed: 250, stage: 0, power: 0, air: false,
    stations: ['drill'], manual: true,
  },
  {
    id: 'band_saw', kind: 'saw', name: 'Band saw', brand: 'Jat', model: 'HBS-7',
    blurb: 'Cuts stock. Eventually. The blade is always the wrong one.',
    w: 1.6, d: 0.7, h: 1.2, priceNew: 900, priceUsed: 400, stage: 0, power: 0, air: false,
    stations: ['saw'], manual: true,
  },
  {
    id: 'vmc', kind: 'vmc', name: '3-axis VMC', brand: 'Hoss', model: 'VF-ish 2', cnc: true,
    blurb: 'The first real machine. Enclosed, a tool changer, a pendant with a screen. Needs CAM, air, and a circuit the panel does not have.',
    w: 2.2, d: 2.0, h: 2.8, priceNew: 90000, priceUsed: 40000, stage: 1, power: 2, air: true,
    stations: ['cnc'], manual: false, tools: 20,
  },
  {
    id: 'sinker', kind: 'sinker', name: 'Sinker EDM', brand: 'Charmer', model: 'CM-430', cnc: true,
    blurb: 'Burns what a cutter cannot reach: ribs, corners, text. Needs electrodes, dielectric, and patience. Catches fire once in a career.',
    w: 2.4, d: 1.5, h: 2.5, priceNew: 120000, priceUsed: 45000, stage: 1, power: 2, air: false,
    stations: ['sinker'], manual: false, tools: 1,
  },
  {
    id: 'wire', kind: 'wire', name: 'Wire EDM', brand: 'Excusetek', model: 'EX-400', cnc: true,
    blurb: 'A brass wire through hardened steel, all night, unattended. Comes with excuses pre-loaded.',
    w: 2.4, d: 1.7, h: 2.5, priceNew: 150000, priceUsed: 60000, stage: 1, power: 2, air: false,
    stations: ['wire'], manual: false, tools: 1,
  },
  {
    id: 'spot', kind: 'spot', name: 'Spotting press', brand: 'Millennial', model: 'BV-80', cnc: false,
    blurb: 'Blues the parting line and closes the halves under a hundred tonnes, slowly. Fit and spot takes a third of the time and the flash goes away. Does not want to work Saturdays either.',
    w: 2.0, d: 1.6, h: 2.7, priceNew: 80000, priceUsed: 30000, stage: 2, power: 1, air: true,
    stations: ['spot'], manual: true, speed: 0.7,
  },
  {
    id: 'cmm', kind: 'cmm', name: 'CMM', brand: 'Zeus', model: 'Olympus 7', cnc: true,
    blurb: 'A granite table, a bridge, a ruby on a stick. Tenths, on a report, with a date. Dimensions stop being out at tryout. Wants a cool room and gets this one.',
    w: 1.6, d: 1.4, h: 2.3, priceNew: 110000, priceUsed: 50000, stage: 2, power: 1, air: true,
    stations: ['inspect'], manual: false, tools: 1,
  },
  {
    id: 'graphite', kind: 'graphite', name: 'Graphite mill', brand: 'Rudders', model: 'RXG 400', cnc: true,
    blurb: 'A dedicated carbon cutter with its own extraction. Electrodes at 40,000 rpm and no dust in the coffee. Silence in the room.',
    w: 1.6, d: 1.6, h: 2.2, priceNew: 80000, priceUsed: 35000, stage: 2, power: 2, air: true,
    stations: ['graphite'], manual: false, tools: 16,
  },
  {
    id: 'hardmill', kind: 'vmc', name: 'Hard-milling VMC', brand: 'Mikano', model: 'V33ish', cnc: true,
    blurb: 'The mold shop\'s dream mill. Finishes in hardened steel all night and leaves nothing for the polisher to do. Every VMC stage runs in three quarters of the time. The service tech flies in.',
    w: 2.4, d: 2.2, h: 2.9, priceNew: 300000, priceUsed: 130000, stage: 2, power: 3, air: true,
    stations: ['cnc'], manual: false, tools: 30, speed: 0.75,
  },
  {
    id: 'cncgrind', kind: 'grinder', name: 'CNC surface grinder', brand: 'Okeymoto', model: 'ACC-CNC', cnc: true,
    blurb: 'Grinding you can walk away from. Plates flat and parallel overnight, dressed by itself. Runs lights-out and does not scream as much.',
    w: 1.8, d: 1.8, h: 2.0, priceNew: 90000, priceUsed: 40000, stage: 2, power: 2, air: true,
    stations: ['grind'], manual: false, tools: 1, speed: 0.6,
  },
  {
    id: 'laser', kind: 'laser', name: 'Laser welder', brand: 'Alfa Lazer', model: 'AL-200', cnc: false,
    blurb: 'Welds a ding in a cavity without cooking the steel around it. Repairs and revisions without scrapping. Needs somebody who can weld. You can weld.',
    w: 0.9, d: 0.8, h: 1.6, priceNew: 60000, priceUsed: 25000, stage: 2, power: 1, air: false,
    stations: ['weld'], manual: true,
  },
];

export const byId = (id) => MACHINES.find((m) => m.id === id);

// Facility upgrades: contractors, days, and the thing you could not do before.
export const UPGRADES = [
  { id: 'circuits4', name: 'Electrical service: 400 A', group: 'power', price: 8500, days: 3, blurb: 'Four machine circuits. The electrician comes Thursday. It is always Thursday.', gives: { circuits: 4 }, needs: null },
  { id: 'circuits6', name: 'Electrical service: 600 A', group: 'power', price: 14000, days: 4, blurb: 'Six circuits. A transformer on a pad outside. The neighbour will ask about it.', gives: { circuits: 6 }, needs: 'circuits4' },
  { id: 'circuits10', name: 'Electrical service: 1000 A', group: 'power', price: 30000, days: 6, blurb: 'Ten circuits. The hydro company sends a person in a hard hat to look at you.', gives: { circuits: 10 }, needs: 'circuits6' },
  { id: 'air2', name: 'Compressor: Ingersole Rant 10 HP', group: 'air', price: 4800, days: 1, blurb: 'Air for four machines. Louder. Complains less often, but louder.', gives: { air: 4 }, needs: null },
  { id: 'air3', name: 'Compressor: Atlas Copout 25 HP, with dryer', group: 'air', price: 12000, days: 2, blurb: 'Air for ten machines and the blow-off guns. Gives up on the hottest day of the year.', gives: { air: 10 }, needs: 'air2' },
  { id: 'door', name: 'A real bay door', group: 'door', price: 6500, days: 2, blurb: 'Insulated roll-up. Replaces the tarp. Everyone cheers. The heating bill drops.', gives: { door: true }, needs: null },
  { id: 'fire', name: 'Fire suppression on the EDMs', group: 'safety', price: 3500, days: 1, blurb: 'A bottle, a sensor, a sign. For the night the sinker decides to be a candle.', gives: { fire: true }, needs: null },
  { id: 'toolbreak', name: 'Tool-break detection', group: 'safety', price: 2200, days: 1, blurb: 'A laser in the VMC that notices the cutter is gone before the cutter does. Lights-out gets safer, not safe.', gives: { toolbreak: true }, needs: null },
  { id: 'crane', name: 'Overhead crane, 5 tonne', group: 'crane', price: 18000, days: 4, blurb: 'Runway beams along both walls, a bridge, a hoist. Everyone stops to watch the first lift. Until then anything over a pallet jack goes out, and so does fit-and-spot on a real mold.', gives: { crane: true }, needs: null },
  { id: 'dust', name: 'Dust extraction', group: 'safety', price: 2800, days: 1, blurb: 'A vacuum for cutting graphite. Without it the dust gets into the ways, the coffee, and the crew.', gives: { dust: true }, needs: null },
];

// Software seats. Upfront, then maintenance every week, forever.
export const SOFTWARE = [
  { id: 'katya_ce', name: 'KATYA "Community Edition"', kind: 'both', price: 0, weekly: 0, pirated: true, blurb: 'CAD and CAM. Free. Works great. Works great right up until the letter.' },
  { id: 'confusion', name: 'Confusion 360', kind: 'both', price: 0, weekly: 60, blurb: 'Cheap, cloud, fine for a start. Programs take a bit longer. The subscription email arrives before the license.', slow: 1.15 },
  { id: 'rigid', name: 'RigidWorks CAD', kind: 'cad', price: 6000, weekly: 110, blurb: 'What most shops run. Crashes at 4:55 on Fridays.' },
  { id: 'mastercram', name: 'MasterCram CAM', kind: 'cam', price: 9000, weekly: 160, blurb: 'Everybody learned on it. Everybody has opinions.' },
  { id: 'ultramill', name: 'UltraMill by Autodusk', kind: 'cam', price: 24000, weekly: 320, blurb: 'The 5-axis package. Toolpaths so smooth the machine cries. You do not have a 5-axis.', fast: 0.9 },
];

export const SHOP = {
  // 2,500 sq ft, square-ish. 20 ft ceiling. One bay door the height of a small truck.
  w: 15.2, d: 15.2, h: 6.1,
  door: { w: 3.6, h: 3.4 },           // on the south wall, to the right of centre
  office: { w: 4.2, d: 3.4, h: 2.7 }, // box in the north-west corner
  powerSlots: 2,                      // circuits on day one
  airSlots: 1,                        // the day-one compressor feeds one air machine
};

export const RANDOM_NAMES = [
  'Northside Mold & Tool', 'Ironwood Tooling', 'Precision Plastics Tooling', 'Three Rivers Mold',
  'Hard Chrome Tool & Die', 'Quarry Road Moldworks', 'First Light Tooling', 'Cycle Start Tool & Mold',
  'Lakeside Precision', 'Granite Tool Co.', 'Backlot Moldmakers', 'Tenths Tool & Mold',
];
