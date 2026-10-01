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
- `1` `2` `3` set the clock speed, `P` or Space pauses it.
- On a touchscreen: left side of the screen is a joystick, drag on the right to look, tap to use. The ISO and CLIP buttons do what the keys do.

## Testing shortcuts

- `?cash=250000` starts with more money.
- `?day=30` starts on a later day.
- `?speed=4` runs the shop clock four times faster on top of the in-game speed buttons.

## What is in this build (v0.1, first slice)

- The cold open and the paperwork: name your shop. The name goes on the sign.
- The empty 2,500 sq ft building: block walls, 20 ft ceiling, a tarp for a bay door, an office
  with a desk and a whiteboard, a breaker panel good for two machines, a compressor that never stops.
- Walk the floor in first person; lift the roof off with `V` and place machines on a grid.
- The Stage 0 catalogue: knee mill, lathe, surface grinder, bench, drill press, band saw, new or used.
- The clock (a shop day a minute), cash, weekly rent and hydro, a ledger, autosave.
- Walk up to a machine, open its panel, do or skip the setup steps, and press CYCLE START.
  Skipped steps are how things break. Money fixes it.

Not yet: contracts, jobs, people, CNC, the inbox. Next.

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
js/game.js        render loop, interaction, keys, pause, autosave
js/audio.js       every sound, synthesized. the compressor is most of them.
js/textures.js    canvas textures: concrete, block, tarp, nameplates, the sign
js/vendor/        three.js r160 (MIT)
models.html       developer page: every machine on a turntable (?id=knee_mill, ?all)
tools/            artifact page builder
```

## Publishing to a claude.ai artifact

The artifact host wraps the page in its own document skeleton, so it takes a body fragment rather
than `index.html` itself. `tools/make-artifact.mjs <out-file>` derives that fragment; publish it
with `style.css` and `js/**` as supporting files.
