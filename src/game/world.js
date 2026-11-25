import * as THREE from 'three';

function asphaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3d434d'; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 22000; i++) {
    const v = 100 + Math.random() * 95;
    ctx.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.12})`;
    const s = Math.random() * 2.4 + 0.3;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, s, s);
  }
  for (let i = 0; i < 25; i++) {
    ctx.strokeStyle = `rgba(10,12,16,${Math.random() * .12})`;
    ctx.lineWidth = Math.random() * 2 + .5;
    ctx.beginPath();
    const x = Math.random() * 512, y = Math.random() * 512;
    ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() - .5) * 150, y + Math.random() * 90);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 12);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function ribbonGeometry(points, halfWidth, y = 0) {
  const positions = [], uvs = [], indices = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next.x - prev.x, dz = next.z - prev.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = dz / len, nz = -dx / len;
    const p = points[i];
    positions.push(p.x + nx * halfWidth, y, p.z + nz * halfWidth);
    positions.push(p.x - nx * halfWidth, y, p.z - nz * halfWidth);
    uvs.push(0, i / 5, 1, i / 5);
    if (i < points.length - 1) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      indices.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}

function box(scene, x, y, z, sx, sy, sz, material, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.set(x, y, z);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = !!options.shadow;
  mesh.receiveShadow = !!options.receive;
  scene.add(mesh);
  return mesh;
}

function addTree(scene, x, z, scale, palette) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: palette.trunk || '#544337', roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: palette.leaf || '#476849', roughness: .9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.35 * scale, .55 * scale, 4 * scale, 8), trunkMat);
  trunk.position.set(x, 2 * scale, z); scene.add(trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2 * scale, 1), leafMat);
  crown.position.set(x, 5 * scale, z); crown.scale.set(1, 1.1, 1); scene.add(crown);
}

function addBuilding(scene, x, z, h, color, accent, rng) {
  const w = 8 + rng() * 10, d = 8 + rng() * 11;
  const mat = new THREE.MeshStandardMaterial({ color, roughness: .76, metalness: .15 });
  const building = box(scene, x, h / 2, z, w, h, d, mat);
  building.castShadow = true;
  const windowMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: .35, roughness: .45 });
  for (let floor = 1; floor < Math.min(9, Math.floor(h / 5)); floor++) {
    for (let col = -1; col <= 1; col++) {
      const win = box(scene, x + col * w * .25, floor * 4.3, z + d / 2 + .02, w * .13, 1.6, .08, windowMat);
      win.material = windowMat;
    }
  }
  return building;
}

function makeBoss(scene, track, infernal) {
  const boss = new THREE.Group();
  const primaryColor = infernal ? '#651b26' : track.accent;
  const primary = new THREE.MeshStandardMaterial({ color: primaryColor, metalness: .58, roughness: .3, emissive: primaryColor, emissiveIntensity: infernal ? .32 : .09 });
  const dark = new THREE.MeshStandardMaterial({ color: infernal ? '#18090f' : '#171b25', metalness: .74, roughness: .28 });
  const eye = new THREE.MeshStandardMaterial({ color: infernal ? '#ffd47b' : '#d9f5ff', emissive: infernal ? '#ff4b24' : '#77cfff', emissiveIntensity: 1.7 });
  const gold = new THREE.MeshStandardMaterial({ color: infernal ? '#e6b65d' : '#c6a56b', metalness: .9, roughness: .2 });
  const add = (geometry, material, position, rotation = null, scale = null) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    if (rotation) mesh.rotation.set(...rotation);
    if (scale) mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    boss.add(mesh);
    return mesh;
  };
  let core;

  if (track.theme === 'city') {
    // THE TRAFFIC KING: a tyrant built from a reinforced taxi front and signal towers.
    core = add(new THREE.BoxGeometry(12, 4.4, 8), primary, [0, 3.1, 0]);
    add(new THREE.BoxGeometry(9.2, 2.2, 4.7), dark, [0, 6.2, -.4]);
    add(new THREE.BoxGeometry(5.5, .65, 1.2), gold, [0, 7.55, -.2]);
    for (const x of [-4.1, 4.1]) {
      const tower = add(new THREE.BoxGeometry(1.55, 5.4, 1.4), dark, [x, 8.4, .2]);
      for (let j = 0; j < 3; j++) add(new THREE.SphereGeometry(.42, 14, 12), eye, [x, 7.2 + j * 1.15, .98]);
      const wheel = add(new THREE.TorusGeometry(2.05, .48, 10, 28), dark, [x * 1.18, 1.35, 0], [0, Math.PI / 2, 0]);
      wheel.userData.spin = x > 0 ? 1 : -1;
      add(new THREE.BoxGeometry(2.2, .55, .55), gold, [x * 1.13, 3.3, 3.8]);
    }
    add(new THREE.ConeGeometry(1.35, 2.6, 8), gold, [0, 9.85, -.3]);
    for (const x of [-2.1, 2.1]) add(new THREE.BoxGeometry(.65, 1.1, .45), eye, [x, 4.0, 4.1]);
  } else if (track.theme === 'prehistoric') {
    // REX-9000: a mechanical tyrannosaur silhouette, with a heavy tail and jaw.
    const scale = infernal ? '#792c32' : '#71834e';
    const rexSkin = new THREE.MeshStandardMaterial({ color: scale, roughness: .86, metalness: .12 });
    core = add(new THREE.SphereGeometry(3.5, 24, 18), rexSkin, [-.2, 3.7, 0], [0, 0, -.08], [1.55, .88, 1.05]);
    add(new THREE.CylinderGeometry(1.1, 1.6, 5.4, 14), rexSkin, [3.1, 5.7, .1], [0, 0, -.68]);
    add(new THREE.BoxGeometry(4.1, 1.8, 2.4), rexSkin, [5.4, 7.2, .15]);
    add(new THREE.BoxGeometry(3.9, .48, 2.2), dark, [5.35, 6.35, .2]);
    for (let i = 0; i < 5; i++) add(new THREE.ConeGeometry(.22, .65, 6), gold, [4.0 + i * .62, 6.15, 1.1], [0, 0, Math.PI]);
    for (const z of [-1.5, 1.5]) {
      add(new THREE.SphereGeometry(.26, 12, 10), eye, [6.1, 7.55, z]);
      add(new THREE.CylinderGeometry(.55, .7, 3.2, 10), rexSkin, [-1.55, 1.25, z], [0, 0, -.12]);
      add(new THREE.CylinderGeometry(.38, .53, 2.5, 10), rexSkin, [1.0, 1.15, z], [0, 0, .22]);
    }
    const tail = add(new THREE.ConeGeometry(1.55, 9, 10), rexSkin, [-7.6, 3.2, 0], [0, 0, Math.PI / 2]);
    tail.scale.set(1, 1, .72);
    add(new THREE.ConeGeometry(1.1, 2.4, 8), gold, [0, 7.7, -.4]);
  } else if (track.theme === 'desert') {
    // THE INFLATABLE: a giant stitched vinyl creature with a valve and balloon limbs.
    const vinyl = new THREE.MeshPhysicalMaterial({ color: infernal ? '#8c3039' : '#e8a7b9', roughness: .18, metalness: .05, clearcoat: 1, clearcoatRoughness: .08 });
    core = add(new THREE.SphereGeometry(5.1, 32, 24), vinyl, [0, 5.4, 0], null, [1.45, 1.1, 1]);
    add(new THREE.TorusGeometry(4.2, .12, 8, 56), gold, [0, 5.4, 0], [Math.PI / 2, 0, 0], [1.35, 1, 1]);
    add(new THREE.CylinderGeometry(.75, .9, 1.8, 16), gold, [0, 11.2, -.3]);
    add(new THREE.TorusGeometry(.72, .2, 10, 24), dark, [0, 12.1, -.3], [0, 0, 0]);
    for (const x of [-4.8, 4.8]) {
      add(new THREE.SphereGeometry(1.65, 20, 16), vinyl, [x, 3.0, 0], null, [1, 1.45, 1]);
      add(new THREE.CylinderGeometry(.48, .62, 3.1, 12), vinyl, [x * 1.18, .9, 0], [0, 0, x > 0 ? -.2 : .2]);
    }
    for (const x of [-1.45, 1.45]) {
      add(new THREE.SphereGeometry(.58, 16, 12), eye, [x, 6.6, 4.3]);
      add(new THREE.SphereGeometry(.28, 12, 10), dark, [x, 6.6, 4.76]);
    }
    add(new THREE.TorusGeometry(1.2, .18, 10, 28, Math.PI), dark, [0, 4.45, 4.7], [0, 0, Math.PI]);
  } else if (track.theme === 'neon') {
    // MOTHERBOARD: a floating processor with circuit arms and luminous trace paths.
    const chip = new THREE.MeshStandardMaterial({ color: '#171a36', metalness: .85, roughness: .22, emissive: '#4542a2', emissiveIntensity: .5 });
    core = add(new THREE.BoxGeometry(8.2, 8.2, 4.3), chip, [0, 5.3, 0]);
    add(new THREE.BoxGeometry(5.5, 5.5, .24), gold, [0, 5.3, 2.25]);
    add(new THREE.BoxGeometry(4.4, 4.4, .34), eye, [0, 5.3, 2.42]);
    add(new THREE.OctahedronGeometry(1.45, 1), dark, [0, 5.3, 2.75]);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      const x = Math.cos(a), y = Math.sin(a);
      const arm = add(new THREE.BoxGeometry(5.8, .44, .5), primary, [x * 6.4, 5.3 + y * 6.4, 0], [0, 0, a]);
      add(new THREE.SphereGeometry(.62, 12, 10), eye, [x * 9.0, 5.3 + y * 9.0, .15]);
      add(new THREE.BoxGeometry(.45, 1.1, .45), gold, [x * 4.4, 5.3 + y * 4.4, -2.3]);
    }
    for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(.28, 1.3, .25), gold, [-3.6 + i * 1.44, .8, 0]);
    add(new THREE.TorusGeometry(8.6, .18, 8, 64), eye, [0, 5.3, 0], [Math.PI / 2, 0, 0]);
  } else {
    // THE MANAGER: an enormous corporate middle-manager in a suit, carrying a briefcase.
    const suit = new THREE.MeshStandardMaterial({ color: infernal ? '#4d1b25' : '#343e4b', metalness: .25, roughness: .52 });
    core = add(new THREE.BoxGeometry(7.4, 7.6, 3.6), suit, [0, 5.2, 0]);
    add(new THREE.SphereGeometry(2.15, 22, 18), primary, [0, 10.3, .1], null, [1, 1.15, .9]);
    add(new THREE.BoxGeometry(1.5, 2.6, .42), gold, [0, 6.1, 2.02]);
    add(new THREE.ConeGeometry(.8, 1.25, 4), dark, [0, 8.55, 1.65], [0, 0, Math.PI]);
    for (const x of [-.8, .8]) add(new THREE.SphereGeometry(.28, 12, 10), eye, [x, 10.5, 1.95]);
    add(new THREE.BoxGeometry(6.5, .8, .55), dark, [0, 8.4, 2.0]);
    for (const x of [-5.5, 5.5]) {
      add(new THREE.CylinderGeometry(.8, 1.1, 5.5, 12), suit, [x, 4.0, 0], [0, 0, x < 0 ? -.28 : .28]);
      add(new THREE.BoxGeometry(2.6, 2.1, 1.4), gold, [x * 1.25, 1.3, .5]);
    }
    add(new THREE.BoxGeometry(5.2, 3.7, 1.1), dark, [8.1, 2.1, .6]);
    add(new THREE.BoxGeometry(5.5, .22, 1.25), gold, [8.1, 3.1, 1.1]);
  }

  const pointIndex = Math.floor(track.points.length * .77);
  const p = track.points[pointIndex];
  const tangent = track.points[pointIndex + 1] || p;
  const yaw = Math.atan2(tangent.x - p.x, tangent.z - p.z);
  boss.position.set(p.x + Math.cos(yaw) * 18, 0, p.z - Math.sin(yaw) * 18);
  boss.rotation.y = yaw;
  boss.userData.baseYaw = yaw;
  boss.userData.baseY = 0;
  boss.userData.core = core;
  boss.userData.coreBaseScale = core.scale.clone();
  boss.userData.theme = track.theme;
  scene.add(boss);
  return boss;
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function createTrack(scene, physicsWorld, RAPIER, trackDef, infernal = false) {
  const pointsControl = trackDef.secret
    ? [new THREE.Vector3(0, 0, -40), new THREE.Vector3(42, 0, 700), new THREE.Vector3(-25, 0, 1450), new THREE.Vector3(36, 0, 2200), new THREE.Vector3(-18, 0, 3000), new THREE.Vector3(0, 0, 3900), new THREE.Vector3(0, 0, 4800)]
    : [
      new THREE.Vector3(0, 0, -190), new THREE.Vector3(122, 0, -180), new THREE.Vector3(190, 0, -82),
      new THREE.Vector3(181, 0, 75), new THREE.Vector3(90, 0, 177), new THREE.Vector3(-55, 0, 192),
      new THREE.Vector3(-169, 0, 104), new THREE.Vector3(-190, 0, -48), new THREE.Vector3(-104, 0, -163)
    ];
  const curve = new THREE.CatmullRomCurve3(pointsControl, !trackDef.secret, 'catmullrom', .42);
  const count = trackDef.secret ? 320 : 190;
  const points = curve.getPoints(count);
  trackDef.points = points;
  const roadTex = asphaltTexture();
  if (infernal) roadTex.offset.set(.04, .02);
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, color: infernal ? '#a33b31' : trackDef.road, roughness: .88, metalness: .12, side: THREE.DoubleSide });
  const road = new THREE.Mesh(ribbonGeometry(points, 10, -.12), roadMat);
  road.receiveShadow = true; scene.add(road);
  const shoulderMat = new THREE.MeshStandardMaterial({ color: infernal ? '#4a151c' : trackDef.accent, roughness: .8, metalness: .2, side: THREE.DoubleSide });
  const shoulder = new THREE.Mesh(ribbonGeometry(points, 11.15, -.2), shoulderMat);
  shoulder.scale.set(1, 1, 1); shoulder.receiveShadow = true; scene.add(shoulder);
  const stripeMat = new THREE.MeshStandardMaterial({ color: infernal ? '#f4c46e' : '#e5e2d5', roughness: .55, metalness: .08, side: THREE.DoubleSide });
  const stripe = new THREE.Mesh(ribbonGeometry(points, .11, -.045), stripeMat); scene.add(stripe);

  const groundMat = new THREE.MeshStandardMaterial({ color: infernal ? '#160b12' : trackDef.ground, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, trackDef.secret ? 6200 : 3000), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.8; scene.add(ground);

  const staticBody = physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const railMat = new THREE.MeshStandardMaterial({ color: infernal ? '#8e252b' : '#626b78', metalness: .75, roughness: .36 });
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    if (len < .01) continue;
    const yaw = Math.atan2(dx, dz);
    const mid = { x: (a.x + b.x) / 2, y: -.55, z: (a.z + b.z) / 2 };
    const desc = RAPIER.ColliderDesc.cuboid(10.2, .42, len / 2 + .3).setFriction(1.25).setRestitution(.02);
    desc.setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) });
    desc.setTranslation(mid.x, mid.y, mid.z);
    physicsWorld.createCollider(desc, staticBody);
    if (i % 2 === 0 && !trackDef.secret) {
      for (const side of [-1, 1]) {
        const nx = Math.cos(yaw), nz = -Math.sin(yaw);
        const rx = mid.x + nx * side * 10.7, rz = mid.z + nz * side * 10.7;
        const rail = box(scene, rx, .72, rz, .48, 1.2, len / 2 + .2, railMat, { rotation: [0, yaw, 0] });
        rail.castShadow = true;
        const wallDesc = RAPIER.ColliderDesc.cuboid(.28, .72, len / 2 + .25).setFriction(.9).setRestitution(.22);
        wallDesc.setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) });
        wallDesc.setTranslation(rx, .72, rz);
        physicsWorld.createCollider(wallDesc, staticBody);
      }
    }
  }

  const accent = infernal ? '#ff5b37' : trackDef.accent;
  const rng = seeded(trackDef.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const scenery = new THREE.Group();
  const envMat = new THREE.MeshStandardMaterial({ color: infernal ? '#281016' : trackDef.accent, metalness: .25, roughness: .72 });
  const lightMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: infernal ? .72 : .38, roughness: .34 });
  if (trackDef.theme === 'city' || trackDef.theme === 'office') {
    for (let i = 0; i < 62; i++) {
      const p = points[Math.floor(rng() * (points.length - 3))];
      const side = rng() > .5 ? 1 : -1, distance = 30 + rng() * 72;
      const tangent = points[Math.min(points.length - 1, Math.floor(rng() * (points.length - 2)) + 1)];
      const x = p.x + side * (distance + (rng() - .5) * 10), z = p.z + (rng() - .5) * 28;
      const h = trackDef.theme === 'office' ? 10 + rng() * 30 : 18 + rng() * 66;
      addBuilding(scene, x, z, h, infernal ? '#32171c' : (rng() > .5 ? '#333c4c' : '#4b5361'), infernal ? '#d79a46' : (rng() > .5 ? '#f3bd69' : '#80bdd4'), rng);
    }
    for (let i = 0; i < 22; i++) {
      const p = points[Math.floor(rng() * (points.length - 1))];
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, 8, 8), envMat);
      pole.position.set(p.x + (rng() > .5 ? 1 : -1) * (14 + rng() * 8), 4, p.z + (rng() - .5) * 24); scene.add(pole);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(.45, 12, 10), lightMat);
      lamp.position.set(pole.position.x, 8.1, pole.position.z); scene.add(lamp);
    }
  } else if (trackDef.theme === 'prehistoric') {
    for (let i = 0; i < 95; i++) {
      const p = points[Math.floor(rng() * (points.length - 1))], side = rng() > .5 ? 1 : -1;
      addTree(scene, p.x + side * (22 + rng() * 75), p.z + (rng() - .5) * 25, .7 + rng() * 2.5, { trunk: '#4d392b', leaf: infernal ? '#4b1718' : (rng() > .5 ? '#31583d' : '#617a42') });
    }
    for (let i = 0; i < 36; i++) {
      const p = points[Math.floor(rng() * (points.length - 1))], side = rng() > .5 ? 1 : -1;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(3 + rng() * 9, 1), new THREE.MeshStandardMaterial({ color: infernal ? '#38161c' : '#66745b', roughness: 1 }));
      rock.position.set(p.x + side * (24 + rng() * 50), 2 + rng() * 5, p.z + (rng() - .5) * 30); rock.scale.y = .6 + rng(); scene.add(rock);
    }
    // A monumental fossil arch makes the route easy to read at a glance.
    for (const side of [-1, 1]) {
      const bone = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 22, 12), new THREE.MeshStandardMaterial({ color: '#d8c99d', roughness: .8 }));
      bone.position.set(side * 19, 9, 0); bone.rotation.z = side * -.22; scene.add(bone);
    }
  } else if (trackDef.theme === 'desert') {
    const colors = ['#f4a17d', '#f3d0a0', '#e9a3b5', '#78bfd0'];
    for (let i = 0; i < 66; i++) {
      const p = points[Math.floor(rng() * (points.length - 1))], side = rng() > .5 ? 1 : -1;
      const x = p.x + side * (23 + rng() * 85), z = p.z + (rng() - .5) * 24;
      const balloon = new THREE.Mesh(new THREE.SphereGeometry(2 + rng() * 4, 18, 14), new THREE.MeshPhysicalMaterial({ color: infernal ? '#8b2528' : colors[Math.floor(rng() * colors.length)], roughness: .22, metalness: .08, clearcoat: .8 }));
      balloon.position.set(x, 3 + rng() * 9, z); balloon.scale.y = 1.2; scene.add(balloon);
      const string = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 4, 5), envMat); string.position.set(x, 1, z); scene.add(string);
    }
    for (let i = 0; i < 28; i++) {
      const p = points[Math.floor(rng() * (points.length - 1))], side = rng() > .5 ? 1 : -1;
      const mound = new THREE.Mesh(new THREE.SphereGeometry(8 + rng() * 15, 20, 10), new THREE.MeshStandardMaterial({ color: infernal ? '#321316' : '#b87c58', roughness: 1 }));
      mound.position.set(p.x + side * (38 + rng() * 70), -4, p.z + (rng() - .5) * 40); mound.scale.y = .55; scene.add(mound);
    }
  } else if (trackDef.theme === 'neon') {
    for (let i = 0; i < 80; i++) {
      const p = points[Math.floor(rng() * (points.length - 1))], side = rng() > .5 ? 1 : -1;
      const h = 14 + rng() * 48;
      const tower = box(scene, p.x + side * (25 + rng() * 75), h / 2, p.z + (rng() - .5) * 28, 6 + rng() * 10, h, 6 + rng() * 10, envMat);
      tower.material = new THREE.MeshStandardMaterial({ color: '#171b32', metalness: .72, roughness: .25 });
      const stripe = box(scene, tower.position.x, h * .55, tower.position.z + 4, tower.geometry.parameters.width * .74, .22, .16, lightMat); stripe.material = lightMat;
    }
    for (let i = 0; i < 24; i++) {
      const p = points[Math.floor(rng() * (points.length - 1))];
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4 + rng() * 5, .18, 8, 32), lightMat);
      ring.position.set(p.x + (rng() > .5 ? 1 : -1) * 17, 7 + rng() * 14, p.z); scene.add(ring);
    }
  } else if (trackDef.theme === 'abyss') {
    for (let i = 0; i < 82; i++) {
      const p = points[Math.floor(rng() * (points.length - 1))], side = rng() > .5 ? 1 : -1;
      const rock = new THREE.Mesh(new THREE.ConeGeometry(10 + rng() * 24, 55 + rng() * 115, 7, 2), new THREE.MeshStandardMaterial({ color: infernal ? '#2a0d16' : '#15141b', roughness: 1 }));
      rock.position.set(p.x + side * (28 + rng() * 80), 28 + rng() * 12, p.z + (rng() - .5) * 20); rock.rotation.z = (rng() - .5) * .35; scene.add(rock);
    }
    const lava = new THREE.Mesh(new THREE.PlaneGeometry(1600, 6000), new THREE.MeshStandardMaterial({ color: '#5f1511', emissive: '#c02c14', emissiveIntensity: .8, roughness: .6 }));
    lava.rotation.x = -Math.PI / 2; lava.position.y = -26; scene.add(lava);
    for (let z = 500; z < 4700; z += 600) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(15, .7, 10, 48, Math.PI), new THREE.MeshStandardMaterial({ color: '#a13e31', metalness: .7, roughness: .25, emissive: '#4a1117', emissiveIntensity: .5 }));
      arch.position.set(0, 18, z); arch.rotation.z = Math.PI; scene.add(arch);
      const chainMat = new THREE.MeshStandardMaterial({ color: '#5b4b50', metalness: .9, roughness: .3 });
      for (const side of [-1, 1]) {
        const chain = new THREE.Mesh(new THREE.TorusGeometry(1.15, .19, 6, 10), chainMat);
        chain.position.set(side * 17, 7, z); chain.rotation.x = Math.PI / 2; scene.add(chain);
      }
    }
  }

  // Start/finish gantry and route gates.
  const start = points[0];
  const gateMat = new THREE.MeshStandardMaterial({ color: infernal ? '#d9a64c' : trackDef.accent, metalness: .55, roughness: .22, emissive: infernal ? '#ff4b27' : trackDef.accent, emissiveIntensity: .55 });
  const finish = new THREE.Group();
  const postGeo = new THREE.BoxGeometry(.8, 9, .8);
  for (const side of [-1, 1]) { const post = new THREE.Mesh(postGeo, gateMat); post.position.set(side * 10.8, 4.5, 0); finish.add(post); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(22, .9, .9), gateMat); bar.position.y = 9; finish.add(bar);
  finish.position.set(start.x, 0, start.z); finish.rotation.y = Math.atan2(points[1].x - start.x, points[1].z - start.z); scene.add(finish);

  const gates = [];
  const fractions = [.28, .53, .77];
  for (let i = 0; i < fractions.length; i++) {
    const idx = Math.floor(points.length * fractions[i]);
    const p = points[idx], nxt = points[Math.min(points.length - 1, idx + 1)];
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.4, .4, 12, 48), gateMat);
    ring.position.set(p.x, 5.1, p.z); ring.rotation.y = Math.atan2(nxt.x - p.x, nxt.z - p.z); scene.add(ring);
    gates.push({ mesh: ring, position: new THREE.Vector3(p.x, 1.3, p.z), hit: false, phase: i + 1 });
  }
  const boss = trackDef.secret ? null : makeBoss(scene, { ...trackDef, points }, infernal);
  let chest = null;
  if (trackDef.secret) {
    chest = new THREE.Group();
    const chestDark = new THREE.MeshStandardMaterial({ color: '#180b12', metalness: .72, roughness: .24 });
    const chestGold = new THREE.MeshStandardMaterial({ color: '#d7a849', metalness: .88, roughness: .2, emissive: '#6e2717', emissiveIntensity: .4 });
    const chestRed = new THREE.MeshStandardMaterial({ color: '#7e1c27', metalness: .5, roughness: .32 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 4.4, 5.6), chestDark); base.position.y = 2.2; chest.add(base);
    const band = new THREE.Mesh(new THREE.BoxGeometry(8.12, .32, 5.72), chestGold); band.position.y = 2.7; chest.add(band);
    const lidPivot = new THREE.Group(); lidPivot.position.set(0, 4.25, -2.6); chest.add(lidPivot);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(8.15, 2.2, 5.8), chestRed); lid.position.set(0, .95, 2.6); lidPivot.add(lid);
    const lidTrim = new THREE.Mesh(new THREE.BoxGeometry(8.22, .24, 5.88), chestGold); lidTrim.position.set(0, .1, 2.6); lidPivot.add(lidTrim);
    const emblem = new THREE.Mesh(new THREE.TorusGeometry(.9, .18, 12, 32), chestGold); emblem.position.set(0, 4.1, 2.89); chest.add(emblem);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(.72, 1.05, .25), chestGold); lock.position.set(0, 3.2, 2.9); chest.add(lock);
    const end = points[points.length - 1];
    const prev = points[points.length - 3];
    chest.position.set(end.x, 0, end.z - 16);
    chest.rotation.y = Math.atan2(end.x - prev.x, end.z - prev.z);
    chest.userData.lidPivot = lidPivot;
    chest.userData.opened = false;
    scene.add(chest);
  }

  const coins = [];
  if (infernal) {
    const faceCanvas = document.createElement('canvas'); faceCanvas.width = 512; faceCanvas.height = 256;
    const faceCtx = faceCanvas.getContext('2d');
    faceCtx.fillStyle = '#7f1e2a'; faceCtx.fillRect(0, 0, 512, 256);
    faceCtx.strokeStyle = '#f1c56f'; faceCtx.lineWidth = 18; faceCtx.strokeRect(12, 12, 488, 232);
    faceCtx.fillStyle = '#ffdf91'; faceCtx.font = '900 128px Arial'; faceCtx.textAlign = 'center'; faceCtx.textBaseline = 'middle'; faceCtx.fillText('1529', 256, 132);
    const faceTexture = new THREE.CanvasTexture(faceCanvas); faceTexture.colorSpace = THREE.SRGBColorSpace; faceTexture.anisotropy = 8;
    const faceMat = new THREE.MeshStandardMaterial({ map: faceTexture, metalness: .78, roughness: .22, emissive: '#581b21', emissiveIntensity: .25 });
    const sideMat = new THREE.MeshStandardMaterial({ color: '#dba944', metalness: .95, roughness: .18 });
    for (let i = 9; i < points.length - 4; i += Math.max(10, Math.floor(points.length / 17))) {
      const p = points[i], n = points[i + 1] || p;
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, .24, 40), [sideMat, faceMat, faceMat]);
      coin.position.set(p.x, 2.8, p.z); coin.rotation.x = Math.PI / 2;
      coin.rotation.y = Math.atan2(n.x - p.x, n.z - p.z);
      coin.castShadow = true; scene.add(coin);
      coins.push({ mesh: coin, position: new THREE.Vector3(p.x, 2.8, p.z), collected: false });
    }
  }

  scene.background = new THREE.Color(infernal ? '#10070d' : trackDef.sky);
  scene.fog = new THREE.Fog(infernal ? '#1a080d' : trackDef.fog, trackDef.secret ? 90 : 180, trackDef.secret ? 820 : 700);
  const hemi = new THREE.HemisphereLight(infernal ? '#e78f70' : '#c5d5ee', infernal ? '#21080d' : '#29323b', infernal ? 1.2 : 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(infernal ? '#ffc08c' : '#fff0d5', infernal ? 2.8 : 2.5);
  sun.position.set(-100, 180, -80); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.near = 1; sun.shadow.camera.far = 500;
  sun.shadow.camera.left = -220; sun.shadow.camera.right = 220; sun.shadow.camera.top = 220; sun.shadow.camera.bottom = -220;
  scene.add(sun);

  return { curve, points, gates, boss, chest, coins, finish, sun, scenery, start: points[2], yaw: Math.atan2(points[3].x - points[2].x, points[3].z - points[2].z), trackDef, infernal, staticBody };
}

export function animateWorld(world, elapsed, bossPhase = 0) {
  if (world.boss) {
    world.boss.position.y = Math.sin(elapsed * 1.7) * .65;
    world.boss.rotation.y = world.boss.userData.baseYaw + Math.sin(elapsed * .32) * .12;
    const s = 1 + Math.sin(elapsed * (2 + bossPhase * .25)) * .018;
    world.boss.scale.set(s, s, s);
    const core = world.boss.userData.core;
    if (core) {
      const pulse = .5 + .5 * Math.sin(elapsed * (3.2 + bossPhase * .6));
      core.scale.copy(world.boss.userData.coreBaseScale).multiplyScalar(1 + pulse * .018 + bossPhase * .012);
      if (core.material?.emissiveIntensity !== undefined) core.material.emissiveIntensity = .12 + pulse * .3 + bossPhase * .08;
    }
  }
  for (const gate of world.gates) {
    gate.mesh.rotation.z = Math.sin(elapsed * 1.3 + gate.phase) * .06;
    gate.mesh.material.emissiveIntensity = .38 + Math.sin(elapsed * 3 + gate.phase) * .28;
  }
  for (const coin of world.coins || []) {
    if (!coin.collected) { coin.mesh.rotation.z = elapsed * 1.8 + coin.position.z * .03; coin.mesh.position.y = coin.position.y + Math.sin(elapsed * 2.5 + coin.position.z) * .22; }
  }
}
