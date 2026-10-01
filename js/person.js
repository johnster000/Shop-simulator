// A person. Not a stack of boxes: capsule limbs with elbows and knees, a face, hair or a cap,
// maybe a beard, maybe glasses, maybe a hi-vis vest. Built once per employee from their look,
// then posed every frame by crew.js. Local +z is the way they face.
import { canvasTexture } from './textures.js';

const SKIN = ['#f1c9a5', '#e0ac7e', '#c68c5b', '#a86d42', '#7a4a2a', '#5c351c', '#f6d7bd'];
const HAIR = ['#1b1b1b', '#3a2616', '#5a3a1e', '#8a6a3a', '#c9a35a', '#b0562a', '#8d8d8d', '#d8d8d8'];
const SHIRT = ['#2f3e5a', '#4a4a4a', '#1a1a1a', '#8a2a2a', '#2f5a3a', '#4a6a8a', '#6a4a8a', '#8a6a2a'];
const PANTS = ['#2a3448', '#4a4a4a', '#8a7a5a', '#1a1a1a', '#3a4a5a'];

export function randomLook(rng = Math.random) {
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const hairColor = pick(HAIR);
  return {
    skin: pick(SKIN), hair: hairColor, hairStyle: rng() < 0.12 ? 'bald' : rng() < 0.5 ? 'short' : rng() < 0.6 ? 'long' : 'buzz',
    hat: rng() < 0.45 ? 'cap' : rng() < 0.25 ? 'beanie' : 'none', beard: rng() < 0.3 ? 'full' : rng() < 0.4 ? 'stubble' : 'none',
    glasses: rng() < 0.28, vest: rng() < 0.4, coveralls: rng() < 0.25,
    shirt: pick(SHIRT), pants: pick(PANTS), boots: rng() < 0.5 ? '#3a2a1a' : '#1a1a1a', capColor: pick(['#1a1a1a', '#2f3e5a', '#8a2a2a', '#4a6a3a', '#c8541e', '#555']),
    height: 1.62 + rng() * 0.26, build: 0.85 + rng() * 0.35, // build: 1 is average, 1.2 is a big lad
  };
}

function faceTexture(T, look, mood = 'ok') {
  return canvasTexture(T, 256, 256, (x, w, h) => {
    x.fillStyle = look.skin; x.fillRect(0, 0, w, h);
    // the face sits at u = 0.25 (which is +z on a three.js sphere), v around 0.45
    const cx = w * 0.25, cy = h * 0.47, s = w * 0.11;
    const brow = mood === 'grumpy' ? 0.5 : mood === 'happy' ? -0.2 : 0;
    // eyes
    for (const sx of [-1, 1]) {
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx + sx * s * 0.75, cy, s * 0.36, s * 0.22, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#2a1a0a'; x.beginPath(); x.arc(cx + sx * s * 0.72, cy + 1, s * 0.13, 0, Math.PI * 2); x.fill();
      x.strokeStyle = look.hair === '#d8d8d8' ? '#777' : look.hair; x.lineWidth = s * 0.14; x.lineCap = 'round';
      x.beginPath(); x.moveTo(cx + sx * s * 0.42, cy - s * 0.42 + brow * s * 0.12 * sx); x.lineTo(cx + sx * s * 1.05, cy - s * 0.42 - brow * s * 0.18 * sx); x.stroke();
    }
    // nose
    x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = s * 0.1; x.beginPath(); x.moveTo(cx, cy + s * 0.1); x.lineTo(cx - s * 0.12, cy + s * 0.5); x.lineTo(cx + s * 0.05, cy + s * 0.55); x.stroke();
    // mouth
    x.strokeStyle = '#7a3a2a'; x.lineWidth = s * 0.1; x.beginPath();
    if (mood === 'happy') x.arc(cx, cy + s * 0.75, s * 0.4, 0.15 * Math.PI, 0.85 * Math.PI);
    else if (mood === 'grumpy') x.arc(cx, cy + s * 1.45, s * 0.45, 1.2 * Math.PI, 1.8 * Math.PI);
    else { x.moveTo(cx - s * 0.3, cy + s * 0.95); x.lineTo(cx + s * 0.3, cy + s * 0.95); }
    x.stroke();
    if (look.beard === 'stubble') { x.fillStyle = 'rgba(0,0,0,.14)'; x.beginPath(); x.ellipse(cx, cy + s * 1.2, s * 1.1, s * 0.7, 0, 0, Math.PI); x.fill(); }
  });
}

export function buildPerson(T, look) {
  const g = new T.Group();
  const H = look.height / 1.75, B = look.build;              // height and build scales
  const skinMat = new T.MeshStandardMaterial({ color: look.skin, roughness: 0.75 });
  const shirtMat = new T.MeshStandardMaterial({ color: look.coveralls ? look.pants : look.shirt, roughness: 0.85 });
  const pantsMat = new T.MeshStandardMaterial({ color: look.pants, roughness: 0.85 });
  const bootMat = new T.MeshStandardMaterial({ color: look.boots, roughness: 0.6 });
  const hairMat = new T.MeshStandardMaterial({ color: look.hair, roughness: 0.9 });
  const vestTex = canvasTexture(T, 64, 128, (x, w, h) => { x.fillStyle = '#d8e63a'; x.fillRect(0, 0, w, h); x.fillStyle = '#c8c8c8'; x.fillRect(0, h * 0.42, w, h * 0.07); x.fillRect(0, h * 0.6, w, h * 0.07); x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(w * 0.47, 0, w * 0.06, h); });
  const vestMat = new T.MeshStandardMaterial({ map: vestTex, roughness: 0.8, emissive: 0x6a7a10, emissiveIntensity: 0.2 });
  const capMat = new T.MeshStandardMaterial({ color: look.capColor, roughness: 0.8 });
  const capsule = (r, len, mat) => new T.Mesh(new T.CapsuleGeometry(r, len, 4, 10), mat);
  const parts = {};

  const hips = new T.Group(); hips.position.y = 0.95 * H; g.add(hips); parts.hips = hips;
  const pelvis = new T.Mesh(new T.BoxGeometry(0.3 * B, 0.18, 0.2 * B), pantsMat); pelvis.position.y = -0.02; hips.add(pelvis);

  // legs: hip joint -> thigh -> knee joint -> shin + boot
  for (const side of [-1, 1]) {
    const hip = new T.Group(); hip.position.set(side * 0.09 * B, -0.05, 0); hips.add(hip);
    const thigh = capsule(0.07 * B, 0.3 * H, pantsMat); thigh.position.y = -0.2 * H; hip.add(thigh);
    const knee = new T.Group(); knee.position.y = -0.42 * H; hip.add(knee);
    const shin = capsule(0.058 * B, 0.3 * H, pantsMat); shin.position.y = -0.2 * H; knee.add(shin);
    const boot = new T.Mesh(new T.BoxGeometry(0.11 * B, 0.09, 0.27), bootMat); boot.position.set(0, -0.43 * H + 0.045, 0.05); knee.add(boot);
    parts[side < 0 ? 'lHip' : 'rHip'] = hip; parts[side < 0 ? 'lKnee' : 'rKnee'] = knee;
  }

  // torso, from the hips up
  const torso = new T.Group(); torso.position.y = 0.05; hips.add(torso); parts.torso = torso;
  const chest = capsule(0.17 * B, 0.26 * H, shirtMat); chest.scale.set(1.15, 1, 0.75); chest.position.y = 0.28 * H; torso.add(chest);
  if (look.vest) { const vest = capsule(0.185 * B, 0.2 * H, vestMat); vest.scale.set(1.15, 1, 0.78); vest.position.y = 0.3 * H; torso.add(vest); }
  if (!look.coveralls) { const belt = new T.Mesh(new T.TorusGeometry(0.155 * B, 0.015, 6, 24), new T.MeshStandardMaterial({ color: 0x3a2a1a })); belt.rotation.x = Math.PI / 2; belt.scale.set(1.15, 0.78, 1); belt.position.y = 0.1 * H; torso.add(belt); }

  // arms: shoulder joint -> upper arm -> elbow joint -> forearm + hand
  for (const side of [-1, 1]) {
    const sh = new T.Group(); sh.position.set(side * 0.22 * B, 0.5 * H, 0); torso.add(sh);
    const upper = capsule(0.052 * B, 0.2 * H, shirtMat); upper.position.y = -0.13 * H; sh.add(upper);
    const elbow = new T.Group(); elbow.position.y = -0.28 * H; sh.add(elbow);
    const fore = capsule(0.046 * B, 0.19 * H, look.coveralls ? shirtMat : skinMat); fore.position.y = -0.13 * H; elbow.add(fore);
    const hand = new T.Mesh(new T.SphereGeometry(0.05 * B, 10, 8), skinMat); hand.scale.set(0.8, 1.1, 0.6); hand.position.y = -0.28 * H; elbow.add(hand);
    parts[side < 0 ? 'lShoulder' : 'rShoulder'] = sh; parts[side < 0 ? 'lElbow' : 'rElbow'] = elbow;
    sh.rotation.z = side * 0.08; // arms hang a touch out from the body
  }

  // neck and head
  const neck = new T.Mesh(new T.CylinderGeometry(0.05 * B, 0.055 * B, 0.08, 10), skinMat); neck.position.y = 0.58 * H; torso.add(neck);
  const headG = new T.Group(); headG.position.y = 0.62 * H; torso.add(headG); parts.head = headG;
  const faceTex = faceTexture(T, look, 'ok');
  const head = new T.Mesh(new T.SphereGeometry(0.115, 20, 16), new T.MeshStandardMaterial({ map: faceTex, roughness: 0.75 }));
  head.scale.set(1, 1.12, 0.95); head.position.y = 0.11; headG.add(head); parts.headMesh = head;
  // ears
  for (const side of [-1, 1]) { const ear = new T.Mesh(new T.SphereGeometry(0.025, 8, 6), skinMat); ear.scale.set(0.5, 1, 0.8); ear.position.set(side * 0.112, 0.11, 0); headG.add(ear); }
  // hair: a cap of the sphere over the top and back
  if (look.hairStyle !== 'bald' && look.hat === 'none') {
    const hair = new T.Mesh(new T.SphereGeometry(0.12, 20, 12, 0, Math.PI * 2, 0, look.hairStyle === 'long' ? 0.62 * Math.PI : 0.5 * Math.PI), hairMat);
    hair.scale.set(1.02, 1.1, 0.98); hair.position.set(0, 0.125, -0.012); hair.rotation.x = -0.35; headG.add(hair);
    if (look.hairStyle === 'buzz') hair.scale.set(0.99, 1.05, 0.95);
  } else if (look.hairStyle !== 'bald') { // hair under a hat: just the back and sides
    const hair = new T.Mesh(new T.SphereGeometry(0.118, 20, 12, 0, Math.PI * 2, 0.35 * Math.PI, 0.3 * Math.PI), hairMat); hair.position.set(0, 0.11, -0.01); hair.rotation.x = -0.4; headG.add(hair);
  }
  if (look.hat === 'cap') {
    const crown = new T.Mesh(new T.SphereGeometry(0.125, 20, 12, 0, Math.PI * 2, 0, 0.5 * Math.PI), capMat); crown.scale.set(1.02, 0.95, 1.0); crown.position.set(0, 0.135, 0); headG.add(crown);
    const brim = new T.Mesh(new T.CylinderGeometry(0.135, 0.135, 0.012, 20, 1, false, -Math.PI * 0.5, Math.PI), capMat); brim.position.set(0, 0.14, 0.03); brim.rotation.x = -0.12; brim.scale.set(1, 1, 1.25); headG.add(brim);
    const button = new T.Mesh(new T.SphereGeometry(0.012, 8, 6), capMat); button.position.y = 0.26; headG.add(button);
  } else if (look.hat === 'beanie') {
    const beanie = new T.Mesh(new T.SphereGeometry(0.128, 20, 12, 0, Math.PI * 2, 0, 0.58 * Math.PI), capMat); beanie.scale.set(1, 1.15, 1); beanie.position.set(0, 0.12, 0); headG.add(beanie);
    const band = new T.Mesh(new T.TorusGeometry(0.122, 0.018, 8, 24), capMat); band.rotation.x = Math.PI / 2; band.position.y = 0.075; headG.add(band);
  }
  if (look.beard === 'full') { const beard = new T.Mesh(new T.SphereGeometry(0.105, 16, 10, 0, Math.PI * 2, 0.5 * Math.PI, 0.5 * Math.PI), hairMat); beard.scale.set(1.0, 0.9, 0.9); beard.position.set(0, 0.1, 0.03); headG.add(beard); }
  if (look.glasses) {
    const gm = new T.MeshStandardMaterial({ color: 0x222, metalness: 0.6, roughness: 0.4 });
    for (const side of [-1, 1]) { const ring = new T.Mesh(new T.TorusGeometry(0.03, 0.005, 6, 16), gm); ring.position.set(side * 0.042, 0.125, 0.105); headG.add(ring); }
    const bridge = new T.Mesh(new T.BoxGeometry(0.03, 0.005, 0.005), gm); bridge.position.set(0, 0.125, 0.11); headG.add(bridge);
    for (const side of [-1, 1]) { const arm = new T.Mesh(new T.BoxGeometry(0.005, 0.005, 0.12), gm); arm.position.set(side * 0.075, 0.125, 0.05); headG.add(arm); }
  }
  g.userData.parts = parts; g.userData.look = look; g.userData.H = H;
  g.userData.setMood = (mood) => { head.material.map = faceTexture(T, look, mood); head.material.needsUpdate = true; };
  return g;
}

// Poses. t is the animation clock in seconds; speed is 0 (standing) .. 1 (walking).
export function pose(g, { mode = 'idle', t = 0, walk = 0, morale = 0.7 }) {
  const p = g.userData.parts, H = g.userData.H;
  const slump = morale < 0.3 ? 0.18 : morale < 0.5 ? 0.08 : 0;
  const swing = Math.sin(t * 8), swing2 = Math.sin(t * 8 + Math.PI);
  if (mode === 'walk' || walk > 0.05) {
    const w = Math.max(0.2, walk);
    p.lHip.rotation.x = swing * 0.55 * w; p.rHip.rotation.x = swing2 * 0.55 * w;
    p.lKnee.rotation.x = Math.max(0, -swing) * 0.9 * w; p.rKnee.rotation.x = Math.max(0, -swing2) * 0.9 * w;
    p.lShoulder.rotation.x = swing2 * 0.45 * w; p.rShoulder.rotation.x = swing * 0.45 * w;
    p.lElbow.rotation.x = -0.35; p.rElbow.rotation.x = -0.35;
    p.hips.position.y = 0.95 * H + Math.abs(Math.cos(t * 8)) * 0.025 * w;
    p.torso.rotation.x = 0.05 + slump; p.head.rotation.x = -slump * 0.5; p.head.rotation.y = 0;
  } else if (mode === 'work') {
    // leaning in at the machine, hands on it, head down
    p.lHip.rotation.x = 0; p.rHip.rotation.x = 0; p.lKnee.rotation.x = 0; p.rKnee.rotation.x = 0;
    p.hips.position.y = 0.95 * H;
    p.torso.rotation.x = 0.12 + slump * 0.5;
    p.lShoulder.rotation.x = -0.9 + Math.sin(t * 2.3) * 0.08; p.rShoulder.rotation.x = -0.75 + Math.sin(t * 3.1 + 1) * 0.1;
    p.lElbow.rotation.x = -0.6; p.rElbow.rotation.x = -0.9 + Math.sin(t * 5) * 0.15;
    p.head.rotation.x = 0.35; p.head.rotation.y = Math.sin(t * 0.7) * 0.15;
  } else if (mode === 'sulk') {
    p.lHip.rotation.x = 0; p.rHip.rotation.x = 0; p.lKnee.rotation.x = 0; p.rKnee.rotation.x = 0; p.hips.position.y = 0.95 * H;
    p.torso.rotation.x = 0.2; p.lShoulder.rotation.x = 0.1; p.rShoulder.rotation.x = 0.1; p.lElbow.rotation.x = -1.4; p.rElbow.rotation.x = -1.4; // arms crossed-ish
    p.lShoulder.rotation.z = -0.3; p.rShoulder.rotation.z = 0.3;
    p.head.rotation.x = 0.25; p.head.rotation.y = Math.sin(t * 0.4) * 0.3;
  } else { // idle: breathing, a look around now and then
    p.lHip.rotation.x = 0; p.rHip.rotation.x = 0; p.lKnee.rotation.x = 0; p.rKnee.rotation.x = 0;
    p.hips.position.y = 0.95 * H + Math.sin(t * 1.5) * 0.004;
    p.torso.rotation.x = 0.02 + slump + Math.sin(t * 1.5) * 0.01;
    p.lShoulder.rotation.x = Math.sin(t * 1.5) * 0.03; p.rShoulder.rotation.x = Math.sin(t * 1.5 + 1) * 0.03;
    p.lElbow.rotation.x = -0.25; p.rElbow.rotation.x = -0.25;
    p.lShoulder.rotation.z = -0.08; p.rShoulder.rotation.z = 0.08;
    p.head.rotation.x = -slump * 0.4; p.head.rotation.y = Math.sin(t * 0.35) * 0.45 + Math.sin(t * 1.7) * 0.05;
  }
}
