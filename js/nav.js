// Walking around the shop without walking through the lathe. A half-metre grid and A*.

export class Nav {
  constructor(hx, hz, cell = 0.5) {
    this.hx = hx; this.hz = hz; this.cell = cell;
    this.cols = Math.round((hx * 2) / cell); this.rows = Math.round((hz * 2) / cell);
    this.blocked = new Uint8Array(this.cols * this.rows);
  }
  toCell(x, z) { return { c: Math.min(this.cols - 1, Math.max(0, Math.floor((x + this.hx) / this.cell))), r: Math.min(this.rows - 1, Math.max(0, Math.floor((z + this.hz) / this.cell))) }; }
  toWorld(c, r) { return { x: -this.hx + (c + 0.5) * this.cell, z: -this.hz + (r + 0.5) * this.cell }; }
  // colliders: { x, z, hw, hd } boxes. pad: how much room a body needs.
  rebuild(colliders, pad = 0.3) {
    this.blocked.fill(0);
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const w = this.toWorld(c, r);
      if (w.x < -this.hx + 0.45 || w.x > this.hx - 0.45 || w.z < -this.hz + 0.45 || w.z > this.hz - 0.45) { this.blocked[r * this.cols + c] = 1; continue; }
      for (const b of colliders) if (Math.abs(w.x - b.x) < b.hw + pad && Math.abs(w.z - b.z) < b.hd + pad) { this.blocked[r * this.cols + c] = 1; break; }
    }
  }
  free(c, r) { return c >= 0 && r >= 0 && c < this.cols && r < this.rows && !this.blocked[r * this.cols + c]; }
  // nearest free cell to a world point
  nearestFree(x, z) {
    const s = this.toCell(x, z);
    if (this.free(s.c, s.r)) return s;
    for (let d = 1; d < 8; d++) for (let dr = -d; dr <= d; dr++) for (let dc = -d; dc <= d; dc++) if (Math.abs(dr) === d || Math.abs(dc) === d) { if (this.free(s.c + dc, s.r + dr)) return { c: s.c + dc, r: s.r + dr }; }
    return s;
  }
  // A*, 8-connected, no cutting corners. Returns world points, or [] if unreachable.
  path(x0, z0, x1, z1) {
    const a = this.nearestFree(x0, z0), b = this.nearestFree(x1, z1);
    const key = (c, r) => r * this.cols + c;
    const open = new Map(), came = new Map(), g = new Map();
    const h = (c, r) => Math.hypot(c - b.c, r - b.r);
    const start = key(a.c, a.r), goal = key(b.c, b.r);
    open.set(start, h(a.c, a.r)); g.set(start, 0);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    let guard = 0;
    while (open.size && guard++ < 6000) {
      let cur = null, best = Infinity; for (const [k, f] of open) if (f < best) { best = f; cur = k; }
      if (cur === goal) break;
      open.delete(cur);
      const c = cur % this.cols, r = Math.floor(cur / this.cols);
      for (const [dc, dr] of dirs) {
        const nc = c + dc, nr = r + dr;
        if (!this.free(nc, nr)) continue;
        if (dc && dr && (!this.free(c + dc, r) || !this.free(c, r + dr))) continue;
        const nk = key(nc, nr), ng = g.get(cur) + Math.hypot(dc, dr);
        if (ng < (g.get(nk) ?? Infinity)) { g.set(nk, ng); came.set(nk, cur); open.set(nk, ng + h(nc, nr)); }
      }
    }
    if (!came.has(goal) && start !== goal) return [];
    const out = []; let k = goal;
    while (k !== start) { out.push(this.toWorld(k % this.cols, Math.floor(k / this.cols))); k = came.get(k); }
    out.reverse(); out.push({ x: x1, z: z1 });
    return out;
  }
}
