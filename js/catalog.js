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
];

export const byId = (id) => MACHINES.find((m) => m.id === id);

export const SHOP = {
  // 2,500 sq ft, square-ish. 20 ft ceiling. One bay door the height of a small truck.
  w: 15.2, d: 15.2, h: 6.1,
  door: { w: 3.6, h: 3.4 },           // on the south wall, to the right of centre
  office: { w: 4.2, d: 3.4, h: 2.7 }, // box in the north-west corner
  powerSlots: 2,                      // machines with power > 0 that the service can run
};

export const RANDOM_NAMES = [
  'Northside Mold & Tool', 'Ironwood Tooling', 'Precision Plastics Tooling', 'Three Rivers Mold',
  'Hard Chrome Tool & Die', 'Quarry Road Moldworks', 'First Light Tooling', 'Cycle Start Tool & Mold',
  'Lakeside Precision', 'Granite Tool Co.', 'Backlot Moldmakers', 'Tenths Tool & Mold',
];
