// Merge the static meshes of a group into one mesh per material. Fewer draw calls, the same look.
// Anything in `keep` (or with userData.keep) stays its own mesh: things that spin, blink, swing or get looked up later.
export function mergeStatic(T, group, keep = []) {
  const keepSet = new Set(keep.filter(Boolean));
  group.updateWorldMatrix(true, true);
  const inv = new T.Matrix4().copy(group.matrixWorld).invert();
  const batches = new Map(); // material -> [mesh]
  group.traverse((o) => {
    if (!o.isMesh || keepSet.has(o) || o.userData.keep || o === group) return;
    if (Array.isArray(o.material) || o.morphTargetInfluences || o.isSkinnedMesh) return;
    const g = o.geometry; if (!g || !g.attributes.position || !g.attributes.normal) return;
    if (!batches.has(o.material)) batches.set(o.material, []);
    batches.get(o.material).push(o);
  });
  let merged = 0;
  for (const [material, meshes] of batches) {
    if (meshes.length < 2) continue;
    const pos = [], nor = [], uv = []; let hasUv = true; const local = new T.Matrix4(), nm = new T.Matrix3();
    for (const o of meshes) {
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      local.multiplyMatrices(inv, o.matrixWorld); g.applyMatrix4(local);
      const p = g.attributes.position.array, n = g.attributes.normal.array, u = g.attributes.uv && g.attributes.uv.array;
      for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); }
      if (u) for (let i = 0; i < u.length; i++) uv.push(u[i]); else hasUv = false;
      if (g !== o.geometry) g.dispose();
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    if (hasUv && uv.length === (pos.length / 3) * 2) geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    const m = new T.Mesh(geo, material); m.userData.interact = meshes[0].userData.interact; m.userData.merged = meshes.length;
    for (const o of meshes) o.parent && o.parent.remove(o);
    group.add(m); merged += meshes.length;
  }
  return merged;
}
