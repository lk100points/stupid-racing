import * as THREE from 'three';

const material = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .72, ...options });

function makeDinosaur() {
  const group = new THREE.Group();
  const skin = material('#668e4b', { roughness: .9 });
  const belly = material('#c1a66f');
  const eye = material('#f2d46b', { emissive: '#b88b27', emissiveIntensity: .2 });
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), skin); body.scale.set(1.5, .85, 1); body.position.y = 2.5; group.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.75, 1.1, 3.4, 12), skin); neck.position.set(2.7, 3.8, .1); neck.rotation.z = -.62; group.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.35, 1.5), skin); head.position.set(4, 5.1, .1); group.add(head);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(1.9, .35, 1.4), belly); jaw.position.set(4.1, 4.55, .1); group.add(jaw);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.9, 6, 8), skin); tail.position.set(-5, 2.9, 0); tail.rotation.z = Math.PI / 2; group.add(tail);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.45, .55, 2.7, 10), skin); leg.position.set(-.9, .45, side * 1.3); group.add(leg);
    const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), eye); eyeMesh.position.set(4.7, 5.4, side * .68); group.add(eyeMesh);
  }
  group.scale.setScalar(1.5);
  return group;
}

function makeUfo(infernal) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(3, 24, 14), material(infernal ? '#7f2630' : '#929ca9', { metalness: .78, roughness: .2 }));
  body.scale.y = .22; group.add(body);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), material('#8ee9e7', { emissive: '#47c9d4', emissiveIntensity: .7, transparent: true, opacity: .72 })); dome.position.y = .45; group.add(dome);
  const lights = new THREE.Mesh(new THREE.TorusGeometry(2.6, .18, 8, 36), material(infernal ? '#ffc36b' : '#a3ffed', { emissive: infernal ? '#ff622f' : '#50ffed', emissiveIntensity: 1.4 }));
  lights.rotation.x = Math.PI / 2; lights.position.y = -.25; group.add(lights);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(4.2, 13, 28, 1, true), new THREE.MeshBasicMaterial({ color: infernal ? '#ff5b38' : '#78f8d6', transparent: true, opacity: .13, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.y = -6.5; beam.rotation.x = Math.PI; group.add(beam);
  return group;
}

function makeMeteor(infernal) {
  const group = new THREE.Group();
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(3.4, 2), material(infernal ? '#6b2528' : '#64564d', { roughness: 1, emissive: infernal ? '#a42a20' : '#211a15', emissiveIntensity: .7 }));
  group.add(rock);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(4.5, 16, 12), new THREE.MeshBasicMaterial({ color: infernal ? '#ff6431' : '#ffbb72', transparent: true, opacity: .18 }));
  flame.scale.z = 1.4; group.add(flame);
  return group;
}

function makeWave(infernal) {
  const group = new THREE.Group();
  const water = new THREE.Mesh(new THREE.BoxGeometry(28, 17, 4), new THREE.MeshPhysicalMaterial({ color: infernal ? '#762c35' : '#45aabe', roughness: .18, metalness: .05, transparent: true, opacity: .68, clearcoat: 1, side: THREE.DoubleSide }));
  water.position.y = 8; group.add(water);
  const crest = new THREE.Mesh(new THREE.TorusGeometry(11, .4, 10, 40, Math.PI), material('#c5f5f4', { emissive: '#4bc7e3', emissiveIntensity: .6 }));
  crest.position.y = 16; crest.rotation.z = Math.PI; group.add(crest);
  return group;
}

function makeRoadChaos(infernal) {
  const group = new THREE.Group();
  const coneMat = material(infernal ? '#b13b29' : '#ef8b39');
  const stripeMat = material('#f3e8d4');
  for (let i = 0; i < 7; i++) {
    const x = -9 + i * 3;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(.85, 2.4, 8), coneMat);
    cone.position.set(x, 1.2, (i % 2) * 1.5 - .7); group.add(cone);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(.58, .68, .18, 8), stripeMat);
    stripe.position.set(x, .75, (i % 2) * 1.5 - .7); group.add(stripe);
  }
  return group;
}

export function spawnChaosEvent(scene, position, forward, infernal = false) {
  const choices = ['dinosaur', 'meteor', 'ufo', 'earthquake', 'gravity', 'wave', 'road-chaos'];
  const type = choices[Math.floor(Math.random() * choices.length)];
  const distance = type === 'meteor' ? 52 : type === 'ufo' ? 36 : 32;
  const at = position.clone().addScaledVector(forward, distance);
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  at.addScaledVector(right, (Math.random() - .5) * (type === 'road-chaos' ? 1 : 8));
  let object = null;
  if (type === 'dinosaur') object = makeDinosaur();
  if (type === 'meteor') object = makeMeteor(infernal);
  if (type === 'ufo') object = makeUfo(infernal);
  if (type === 'wave') object = makeWave(infernal);
  if (type === 'road-chaos') object = makeRoadChaos(infernal);
  if (object) {
    object.position.copy(at);
    if (type === 'dinosaur') { object.position.y = 0; object.rotation.y = Math.atan2(forward.x, forward.z) + Math.PI / 2; }
    if (type === 'meteor') object.position.y = 42;
    if (type === 'ufo') object.position.y = 15;
    if (type === 'wave') { object.position.y = 0; object.rotation.y = Math.atan2(forward.x, forward.z); }
    if (type === 'road-chaos') { object.position.y = 0; object.rotation.y = Math.atan2(forward.x, forward.z); }
    scene.add(object);
  }
  return { type, object, position: at, life: type === 'earthquake' ? 4.5 : type === 'gravity' ? 7 : 8, age: 0, direction: forward.clone(), hit: false, seed: Math.random() * 10, impacted: false };
}

export function updateChaosEvent(event, dt, vehiclePosition, vehicle, effects) {
  if (!event) return { done: true, collision: false };
  event.age += dt;
  let collision = false;
  const object = event.object;
  if (event.type === 'dinosaur' && object) {
    object.position.x += Math.sin(event.age * 2.3 + event.seed) * dt * 5;
    object.rotation.z = Math.sin(event.age * 3.2) * .035;
  }
  if (event.type === 'meteor' && object) {
    object.position.y = Math.max(1.3, 42 - event.age * 22);
    object.rotation.x += dt * 1.1; object.rotation.z += dt * .7;
    if (object.position.y <= 1.31 && !event.impacted) { event.impacted = true; effects?.burst(object.position.clone(), 34, 1, 15); }
  }
  if (event.type === 'ufo' && object) {
    object.position.y = 14 + Math.sin(event.age * 2.6) * 1.8;
    object.rotation.y += dt * .8;
  }
  if (event.type === 'wave' && object) {
    object.position.addScaledVector(event.direction, -dt * 12);
    object.position.y = Math.sin(event.age * 4) * .3;
  }
  if (event.type === 'earthquake' || event.type === 'gravity') {
    // No extra mesh: camera/vehicle response is handled by the game loop.
  }
  if (event.type === 'road-chaos' && object) object.rotation.y += dt * .05;
  if (object) {
    const dx = vehiclePosition.x - object.position.x, dz = vehiclePosition.z - object.position.z;
    const distance = Math.hypot(dx, dz);
    const threshold = event.type === 'dinosaur' ? 8.5 : event.type === 'meteor' ? 5.5 : event.type === 'wave' ? 18 : event.type === 'road-chaos' ? 8 : 6.5;
    if (distance < threshold && Math.abs(vehiclePosition.y - object.position.y) < (event.type === 'ufo' ? 16 : 9)) collision = true;
  }
  if (event.type === 'meteor' && event.impacted && event.age > 3.4) return { done: true, collision, type: event.type };
  return { done: event.age > event.life, collision, type: event.type };
}

export function removeChaosEvent(scene, event) {
  if (event?.object) {
    scene.remove(event.object);
    event.object.traverse(node => {
      node.geometry?.dispose();
      if (node.material) (Array.isArray(node.material) ? node.material : [node.material]).forEach(m => m.dispose());
    });
  }
}
