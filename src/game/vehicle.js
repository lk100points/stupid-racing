import * as THREE from 'three';
import { CARS, SKINS, WHEELS } from './catalog.js';

const mat = (color, metalness = .2, roughness = .55, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
const box = (parent, size, position, material, rotation = null, bevel = false) => {
  const geometry = bevel ? new THREE.BoxGeometry(...size, 2, 2, 2) : new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position); if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
};
const cyl = (parent, r1, r2, h, position, material, rotation = null, radial = 16) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, radial), material);
  mesh.position.set(...position); if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true; parent.add(mesh); return mesh;
};

function createCarModel(car, save) {
  const root = new THREE.Group();
  const skin = SKINS.find(s => s.id === save.selectedSkin);
  const baseColor = skin?.color || car.color;
  const primary = mat(baseColor, .35, .34);
  const dark = mat('#20252c', .55, .42);
  const rubber = mat('#111318', .02, .92);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#8eb7ce', metalness: .28, roughness: .12, transparent: true, opacity: .82, clearcoat: .8 });
  const chrome = mat('#bdc7cd', .88, .2);
  const white = mat('#edf1ec', .12, .3);
  const gold = mat('#d6af55', .82, .22);
  const wheelStyle = WHEELS.find(w => w.id === save.selectedWheels) || WHEELS[0];
  const wheelMat = mat(wheelStyle.color, .5, .32);
  const wheels = [];
  const wheelPositions = [[-1.05, -.02, 1.18], [1.05, -.02, 1.18], [-1.05, -.02, -1.18], [1.05, -.02, -1.18]];
  for (const p of wheelPositions) {
    const wheel = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(.52, .52, .34, 24), rubber);
    tire.rotation.z = Math.PI / 2; tire.castShadow = true; wheel.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .36, 20), wheelMat);
    rim.rotation.z = Math.PI / 2; wheel.add(rim);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .38, 12), chrome);
    cap.rotation.z = Math.PI / 2; wheel.add(cap);
    wheel.position.set(...p); root.add(wheel); wheels.push(wheel);
  }

  if (car.shape === 'cart') {
    // A recognisable wire basket with a tubular handle and real caster geometry.
    for (let x = -1.05; x <= 1.05; x += 2.1) {
      cyl(root, .055, .055, 2.35, [x, .42, -.15], chrome, [Math.PI / 2, 0, 0], 8);
      cyl(root, .045, .045, 1.5, [x, .42, .98], chrome, [0, 0, Math.PI / 2], 8);
    }
    for (let y = .1; y <= 1.25; y += .28) box(root, [2.1, .045, 1.5], [0, y, .2], chrome);
    for (let z = -.55; z <= .95; z += .3) box(root, [2.1, 1.12, .045], [0, .68, z], chrome);
    cyl(root, .09, .09, 2.4, [0, 1.55, -1.4], dark, [0, 0, Math.PI / 2]);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(.78, .08, 8, 24, Math.PI), chrome);
    handle.position.set(0, 1.6, -1.4); handle.rotation.z = Math.PI; root.add(handle);
    box(root, [1.75, .1, 1.35], [0, .12, .15], primary);
  } else if (car.shape === 'sofa') {
    box(root, [2.7, .66, 3.3], [0, .05, 0], primary, null, true);
    box(root, [2.85, 1.22, .55], [0, .72, -1.38], primary, null, true);
    box(root, [.48, .95, 2.55], [-1.18, .5, 0], primary, null, true);
    box(root, [.48, .95, 2.55], [1.18, .5, 0], primary, null, true);
    for (const x of [-.58, .58]) {
      const cushion = box(root, [1.08, .23, 1.45], [x, .53, .05], mat('#e0b3a0', .05, .82), null, true);
      cushion.rotation.x = -.04;
      const back = box(root, [1.08, .84, .24], [x, 1.04, -1.05], mat('#d9937d', .04, .88), null, true);
      back.rotation.x = -.1;
    }
    for (let i = 0; i < 4; i++) cyl(root, .14, .19, .4, [i < 2 ? -.95 : .95, -.32, i % 2 ? -1.1 : 1.1], dark);
  } else if (car.shape === 'fridge') {
    box(root, [2.25, 3.05, 3.05], [0, .5, 0], primary, null, true);
    box(root, [2.28, .08, 3.12], [0, -.28, 0], chrome);
    box(root, [.04, 2.5, .04], [.86, .55, 1.54], dark);
    box(root, [.12, 1.06, .12], [.86, .7, 1.25], chrome);
    box(root, [.9, .3, .08], [0, 1.9, 1.56], glass);
    for (const x of [-.58, .58]) box(root, [.36, .28, .2], [x, -1.05, 1.42], dark);
    box(root, [1.6, .16, .08], [0, -1.13, 1.53], gold);
  } else if (car.shape === 'bus') {
    box(root, [2.7, 2.15, 4.6], [0, .35, 0], primary, null, true);
    box(root, [2.72, .55, 4.55], [0, 1.23, 0], mat('#f5c849', .2, .35));
    for (let z = -1.62; z <= 1.63; z += 1.08) box(root, [2.76, .82, .82], [0, .92, z], glass);
    box(root, [2.8, .12, 4.7], [0, -.72, 0], dark);
    box(root, [2.75, .27, .12], [0, -.18, 2.32], white);
    box(root, [.9, .1, .13], [0, -.25, 2.4], mat('#e33a35', .2, .35, { emissive: '#8a1818', emissiveIntensity: .6 }));
    box(root, [.08, .85, .06], [1.2, .15, -.2], dark);
  } else if (car.shape === 'tub') {
    const tub = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.2, 1.45, 32, 1, true), white);
    tub.scale.set(1, 1, 1.35); tub.position.y = .05; tub.rotation.z = Math.PI; root.add(tub);
    const bottom = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, .18, 32), white); bottom.scale.z = 1.35; bottom.position.y = -.57; root.add(bottom);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.18, 32), new THREE.MeshPhysicalMaterial({ color: '#7dcfe0', roughness: .08, metalness: .06, transparent: true, opacity: .75, clearcoat: 1 }));
    water.rotation.x = -Math.PI / 2; water.scale.set(1, 1.32, 1); water.position.y = .48; root.add(water);
    for (const x of [-.7, .7]) cyl(root, .07, .09, .4, [x, -.85, 1.2], gold);
    cyl(root, .12, .12, .32, [0, .91, -1.2], chrome);
  } else if (car.shape === 'ikea') {
    box(root, [2.6, .9, 3.8], [0, -.02, 0], mat('#265a9e', .28, .4), null, true);
    box(root, [2.62, .25, 3.82], [0, .48, 0], mat('#f4c943', .18, .4));
    box(root, [2.55, .12, 3.5], [0, .67, -.04], primary);
    box(root, [.08, .16, 3.1], [-.92, .71, 0], gold);
    box(root, [.08, .16, 3.1], [.92, .71, 0], gold);
    const key = new THREE.Mesh(new THREE.TorusGeometry(.38, .12, 8, 18), gold);
    key.position.set(0, 1.05, -.8); key.rotation.x = Math.PI / 2; root.add(key);
    box(root, [1.2, .12, .18], [0, 1.02, -.42], gold);
  } else if (car.shape === 'ufo') {
    const saucer = new THREE.Mesh(new THREE.SphereGeometry(1.8, 32, 18), primary);
    saucer.scale.set(1.65, .32, 1.65); saucer.position.y = .1; root.add(saucer);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.05, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), glass);
    dome.position.y = .24; root.add(dome);
    const under = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.25, .4, 32), dark); under.position.y = -.32; root.add(under);
    const glowMat = new THREE.MeshStandardMaterial({ color: '#75f8ed', emissive: '#33e5d8', emissiveIntensity: 1.6 });
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), glowMat);
      lamp.position.set(Math.cos(a) * 2.45, -.22, Math.sin(a) * 2.45); root.add(lamp);
    }
    wheels.forEach(w => { w.visible = false; });
  } else if (car.shape === 'toilet') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.9, .7, 1.2, 28), primary); base.position.set(0, -.12, .2); root.add(base);
    const bowl = new THREE.Mesh(new THREE.TorusGeometry(.9, .32, 12, 32), gold); bowl.position.set(0, .42, .55); bowl.rotation.x = Math.PI / 2; bowl.scale.z = 1.35; root.add(bowl);
    const seat = new THREE.Mesh(new THREE.TorusGeometry(.67, .16, 12, 32), white); seat.position.set(0, .48, .55); seat.rotation.x = Math.PI / 2; seat.scale.z = 1.35; root.add(seat);
    box(root, [1.65, 1.25, .55], [0, .75, -1.15], primary, null, true);
    box(root, [.8, .8, .08], [0, 1.45, -1.44], gold);
    const flush = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), gold); flush.position.set(0, 1.45, -1.5); root.add(flush);
  }

  // Shared underbody, front lamp accents, and suspension detail tie all builds together.
  box(root, [1.45, .28, 2.7], [0, -.40, 0], dark);
  for (const x of [-.78, .78]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(.34, .2, .07), new THREE.MeshStandardMaterial({ color: '#f5efd5', emissive: '#ffe5ad', emissiveIntensity: .4 }));
    lamp.position.set(x, .06, 1.81); root.add(lamp);
  }
  return { root, wheels };
}

export function createVehicle(scene, physicsWorld, RAPIER, save) {
  const car = CARS.find(c => c.id === save.selectedCar) || CARS[0];
  const { root, wheels } = createCarModel(car, save);
  scene.add(root);
  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0, 1.5, 0)
    .setLinearDamping(.18)
    .setAngularDamping(4.2)
    .setCanSleep(false);
  const body = physicsWorld.createRigidBody(bodyDesc);
  const collider = RAPIER.ColliderDesc.cuboid(1.18, .58, 1.95)
    .setDensity(1.1 + car.mass * .3)
    .setFriction(1.25)
    .setRestitution(.08);
  physicsWorld.createCollider(collider, body);
  return {
    car, body, root, wheels,
    speed: 0, nitro: 100, abilityTimer: 0, abilityDuration: 0,
    jumpCooldown: 0, onGround: false, airTime: 0, damage: 0,
    boostFlash: 0, lastVy: 0, drift: 0
  };
}

export function syncVehicle(vehicle, dt) {
  const p = vehicle.body.translation();
  const r = vehicle.body.rotation();
  vehicle.root.position.set(p.x, p.y, p.z);
  vehicle.root.quaternion.set(r.x, r.y, r.z, r.w);
  const v = vehicle.body.linvel();
  vehicle.speed = Math.hypot(v.x, v.z);
  const spin = vehicle.speed * dt * 1.4;
  vehicle.wheels.forEach((wheel, i) => {
    wheel.rotation.x += spin * (i < 2 ? 1 : 1);
    wheel.rotation.y = 0;
  });
  vehicle.boostFlash = Math.max(0, vehicle.boostFlash - dt * 2.5);
}

export function respawnVehicle(vehicle, track) {
  const p = track.start;
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), track.yaw);
  vehicle.body.setTranslation({ x: p.x, y: 1.6, z: p.z }, true);
  vehicle.body.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
  vehicle.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  vehicle.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  vehicle.damage = 0;
}
