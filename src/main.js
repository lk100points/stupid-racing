import './ui/style.css';
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { loadSave, saveGame } from './core/save.js';
import { GameAudio } from './core/audio.js';
import { createTrack, animateWorld } from './game/world.js';
import { createVehicle, syncVehicle, respawnVehicle } from './game/vehicle.js';
import { Effects } from './game/effects.js';
import { spawnChaosEvent, updateChaosEvent, removeChaosEvent } from './game/events.js';
import { GameUI } from './ui/ui.js';
import { CARS, TRACKS, MODES, UPGRADE_TYPES, SKINS, WHEELS } from './game/catalog.js';

const canvas = document.querySelector('#game-canvas');
const loading = document.querySelector('#loading');
const uiRoot = document.querySelector('#ui-root');
const save = loadSave();
const audio = new GameAudio();

let renderer, scene, camera, physicsWorld, vehicle, worldData, effects, ui;
let running = false, paused = false, finished = false, initialized = false;
let lastTime = 0, accumulator = 0, elapsed = 0, raceTime = 0, score = 0, progress = 0, previousProgress = 0;
let lap = 1, bossPhase = 0, gateCooldown = 0, abilityCooldown = 0, messageTimer = 0, raceReward = 0;
let abyssEnding = false, abyssCutsceneTime = 0, abyssChestOpened = false, dailyUsed = false, lastCarPosition = new THREE.Vector3();
let chaosEvent = null, nextEventAt = 18, eventMessage = '';
let cameraShake = 0;
const input = { forward: false, reverse: false, left: false, right: false, jump: false, nitro: false, ability: false };
const pointerToKey = new Map();
const pointerHolders = new Map();
const keyboardKeys = new Set();
let modeDef = MODES[0], trackDef = TRACKS[0], currentQuality = save.quality;
const clock = new THREE.Clock();
const tmpForward = new THREE.Vector3(), tmpRight = new THREE.Vector3(), tmpPos = new THREE.Vector3(), tmpTarget = new THREE.Vector3();
let cameraLook = new THREE.Vector3();

function setMessage(text, duration = 1.5) {
  if (!ui) return;
  ui.updateHUD({ message: text });
  messageTimer = duration;
}

function showScreen(screen) {
  ui.showScreen(screen);
  if (screen !== 'game' && screen !== 'pause' && screen !== 'results') {
    running = false; paused = false;
    for (const key of Object.keys(input)) input[key] = false;
  }
}

function persist() { saveGame(save); }

function newRenderer() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, save.quality === 'high' ? 1.75 : 1.25));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = true;
}

function cleanWorld() {
  if (worldData?.staticBody && physicsWorld) {
    try { physicsWorld.removeRigidBody(worldData.staticBody); } catch { /* world is about to be recreated */ }
  }
  if (vehicle?.body && physicsWorld) {
    try { physicsWorld.removeRigidBody(vehicle.body); } catch { /* ignore disposal race */ }
  }
  if (effects) effects.clear();
  if (scene) {
    while (scene.children.length) {
      const child = scene.children[0]; scene.remove(child);
      child.traverse?.(node => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) (Array.isArray(node.material) ? node.material : [node.material]).forEach(m => {
          if (m.map) m.map.dispose(); m.dispose();
        });
      });
    }
  }
  vehicle = null; worldData = null; effects = null;
}

function setRendererQuality() {
  if (!renderer) return;
  const high = save.quality === 'high';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 1.75 : 1.15));
  renderer.shadowMap.enabled = high;
  if (worldData?.sun) worldData.sun.castShadow = high;
}

function initScene() {
  if (!renderer) newRenderer();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(63, window.innerWidth / window.innerHeight, .1, 2500);
  camera.position.set(0, 9, -17);
  cameraLook.set(0, 1, 0);
  setRendererQuality();
}

async function initPhysics() {
  await RAPIER.init();
  physicsWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  physicsWorld.timestep = 1 / 60;
}

function selectedTrack() {
  return TRACKS.find(t => t.id === save.selectedTrack) || TRACKS[0];
}

function resetGameState() {
  elapsed = 0; raceTime = 0; score = 0; progress = 0; previousProgress = 0;
  lap = 1; bossPhase = 0; gateCooldown = 0; abilityCooldown = 0; messageTimer = 0;
  finished = false; paused = false; abyssEnding = false; abyssCutsceneTime = 0; abyssChestOpened = false; raceReward = 0;
  chaosEvent = null; nextEventAt = 19; cameraShake = 0;
  for (const key of Object.keys(input)) input[key] = false;
  pointerToKey.clear(); pointerHolders.clear(); keyboardKeys.clear();
}

function buildMenuScene() {
  if (scene) cleanWorld();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(63, window.innerWidth / window.innerHeight, .1, 3000);
  trackDef = TRACKS[0];
  worldData = createTrack(scene, physicsWorld, RAPIER, trackDef, save.infernal);
  vehicle = createVehicle(scene, physicsWorld, RAPIER, save);
  respawnVehicle(vehicle, worldData);
  effects = new Effects(scene);
  elapsed = 0;
  const p = vehicle.body.translation();
  camera.position.set(p.x, p.y + 7.5, p.z - 17);
  cameraLook.set(p.x, p.y + 1.3, p.z + 2);
  camera.lookAt(cameraLook);
  setRendererQuality();
}

function startGame() {
  if (!initialized) return;
  audio.unlock();
  trackDef = selectedTrack();
  modeDef = trackDef.secret ? { id: 'abyss-story', name: 'ABYSS RUN', detail: 'ONE WAY / NO MAP' } : (MODES.find(m => m.id === save.selectedMode) || MODES[0]);
  resetGameState();
  nextEventAt = modeDef.id === 'endless-chaos' ? 11 : 19;
  cleanWorld();
  physicsWorld.free();
  physicsWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  physicsWorld.timestep = 1 / 60;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(63, window.innerWidth / window.innerHeight, .1, 3000);
  worldData = createTrack(scene, physicsWorld, RAPIER, trackDef, save.infernal);
  vehicle = createVehicle(scene, physicsWorld, RAPIER, save);
  respawnVehicle(vehicle, worldData);
  effects = new Effects(scene);
  setRendererQuality();
  const p = vehicle.body.translation();
  lastCarPosition.set(p.x, p.y, p.z);
  cameraLook.set(p.x, p.y + 1.5, p.z + 2);
  ui.setScreen('game');
  ui.updateHUD({ speed: 0, nitro: 100, progress: 0, timeText: '00:00.00', lapText: trackDef.secret ? 'ABYSS' : '1 / 2', score: 0, trackName: trackDef.name, modeName: modeDef.name, showBoss: !trackDef.secret, bossName: trackDef.subtitle, bossPhase: 1 });
  running = true;
  lastTime = performance.now();
  audio.setInfernal(save.infernal);
  audio.boss();
  setMessage(trackDef.secret ? 'THE ROAD ENDS WHERE THE MAP STOPS.' : `${trackDef.name} / ${modeDef.name}`, 2.1);
}

function nearestProgress(position) {
  const pts = worldData.points;
  let best = Infinity, bestIndex = 0;
  // Coarse search near previous progress first, then fall back to full track.
  const expected = Math.floor(progress * (pts.length - 1));
  const search = trackDef.secret ? pts.length : 58;
  for (let k = -Math.floor(search / 2); k <= Math.floor(search / 2); k++) {
    let i = expected + k;
    if (trackDef.secret) i = Math.max(0, Math.min(pts.length - 1, i));
    else i = (i + pts.length - 1) % (pts.length - 1);
    const dx = position.x - pts[i].x, dz = position.z - pts[i].z;
    const d = dx * dx + dz * dz;
    if (d < best) { best = d; bestIndex = i; }
  }
  if (best > 3500) {
    for (let i = 0; i < pts.length; i++) {
      const dx = position.x - pts[i].x, dz = position.z - pts[i].z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; bestIndex = i; }
    }
  }
  return { value: bestIndex / (pts.length - 1), distance: Math.sqrt(best) };
}

function activeUpgrade(id) {
  return (save.upgrades[vehicle.car.id] || {})[id] || 0;
}

function setBodyRotationYaw(body, yaw) {
  const half = yaw / 2;
  body.setRotation({ x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) }, true);
}

function physicsStep(dt) {
  if (!vehicle || finished) return;
  const body = vehicle.body;
  const vel = body.linvel();
  const rot = body.rotation();
  const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
  tmpForward.set(0, 0, 1).applyQuaternion(quat).setY(0).normalize();
  tmpRight.set(1, 0, 0).applyQuaternion(quat).setY(0).normalize();
  const car = vehicle.car;
  const engineLevel = activeUpgrade('engine');
  const handlingLevel = activeUpgrade('handling');
  const suspensionLevel = activeUpgrade('suspension');
  const nitroLevel = activeUpgrade('nitro');
  const abilityLevel = activeUpgrade('ability');
  const abilityBoost = vehicle.abilityDuration > 0 && ['school-bus', 'ikea-runner', 'golden-toilet'].includes(car.id) ? 1.34 : 1;
  const maxSpeed = (16 + car.speed * 3.2 + engineLevel * 1.25) * abilityBoost * (input.nitro && vehicle.nitro > 0 ? 1.48 : 1);
  const speedForward = vel.x * tmpForward.x + vel.z * tmpForward.z;
  const throttle = input.forward ? 1 : input.reverse ? -0.72 : 0;
  if (throttle) {
    const engineForce = (10 + car.accel * 2.6 + engineLevel * 2.0) * (input.nitro && vehicle.nitro > 0 ? 1.65 : 1);
    body.applyImpulse({ x: tmpForward.x * throttle * engineForce * dt, y: 0, z: tmpForward.z * throttle * engineForce * dt }, true);
  }
  if (!input.forward && !input.reverse) {
    body.applyImpulse({ x: -vel.x * .035, y: 0, z: -vel.z * .035 }, true);
  }
  if (input.reverse && speedForward > 2) body.applyImpulse({ x: -vel.x * .04, y: 0, z: -vel.z * .04 }, true);
  if (input.reverse && speedForward <= 2) body.applyImpulse({ x: tmpForward.x * -7 * dt, y: 0, z: tmpForward.z * -7 * dt }, true);
  if (input.forward && input.reverse) body.applyImpulse({ x: -vel.x * .06, y: 0, z: -vel.z * .06 }, true);
  if (input.nitro && vehicle.nitro > 0) {
    vehicle.nitro = Math.max(0, vehicle.nitro - dt * (18 - nitroLevel * 1.7));
    body.applyImpulse({ x: tmpForward.x * 18 * dt, y: 0, z: tmpForward.z * 18 * dt }, true);
    vehicle.boostFlash = 1;
  } else vehicle.nitro = Math.min(100, vehicle.nitro + dt * (4.3 + nitroLevel * .9));

  const steerInput = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  const speedFactor = Math.min(1, Math.abs(speedForward) / 8);
  const driftFactor = input.reverse ? 1.8 : 1;
  vehicle.drift = Math.abs(steerInput) * speedFactor * (input.reverse ? 1 : .25);
  if (steerInput) {
    const abilitySteer = vehicle.abilityDuration > 0 && ['shopping-cart', 'ikea-runner'].includes(car.id) ? 1.7 : 1;
    const steerStrength = (2.8 + car.handling * .26 + handlingLevel * .34) * speedFactor * abilitySteer;
    body.applyTorqueImpulse({ x: 0, y: steerInput * steerStrength * dt * driftFactor * (speedForward < 0 ? -1 : 1), z: 0 }, true);
  }
  // Arcade tire grip: scrub lateral velocity while preserving a little drift at high steering input.
  const lateral = vel.x * tmpRight.x + vel.z * tmpRight.z;
  const couchGrip = vehicle.abilityDuration > 0 && car.id === 'sofa-gt' ? 1.7 : 1;
  const grip = (input.reverse ? .045 : .115 + handlingLevel * .008) * couchGrip;
  const traction = Math.min(1, grip * (input.left || input.right ? .72 : 1.15));
  body.applyImpulse({ x: -tmpRight.x * lateral * traction * (car.mass + 1) * 8 * dt, y: 0, z: -tmpRight.z * lateral * traction * (car.mass + 1) * 8 * dt }, true);

  if (input.jump && vehicle.jumpCooldown <= 0) {
    body.applyImpulse({ x: tmpForward.x * 1.2, y: 8.8 + suspensionLevel * .85, z: tmpForward.z * 1.2 }, true);
    vehicle.jumpCooldown = .6;
    audio.jump();
    effects.burst(new THREE.Vector3(body.translation().x, .5, body.translation().z), 7, 2, 3);
    setMessage('HANG TIME!', .8);
  }
  vehicle.jumpCooldown = Math.max(0, vehicle.jumpCooldown - dt);
  vehicle.abilityTimer = Math.max(0, vehicle.abilityTimer - dt);
  vehicle.abilityDuration = Math.max(0, vehicle.abilityDuration - dt);
  abilityCooldown = Math.max(0, abilityCooldown - dt);
  if (input.ability && abilityCooldown <= 0) {
    abilityCooldown = Math.max(8, 18 - abilityLevel * 1.6);
    vehicle.abilityDuration = (car.id === 'school-bus' ? 3.6 : car.id === 'ufo-car' ? 3.2 : 2.7) + abilityLevel * .35;
    vehicle.abilityTimer = abilityCooldown;
    vehicle.nitro = Math.min(100, vehicle.nitro + (car.id === 'golden-toilet' ? 38 : 20));
    switch (car.id) {
      case 'shopping-cart': // AISLE DRIFT: handling window, quick charge.
        body.applyImpulse({ x: tmpForward.x * 5, y: 1.1, z: tmpForward.z * 5 }, true);
        break;
      case 'sofa-gt': // COUCH LOCK: settle the chassis and hold a clean line.
        body.setLinvel({ x: vel.x * .62, y: vel.y, z: vel.z * .62 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        break;
      case 'fridge-3000': // FROST BURST: heavy forward shove and a snow-like burst.
        body.applyImpulse({ x: tmpForward.x * 9, y: 4, z: tmpForward.z * 9 }, true);
        effects.burst(new THREE.Vector3(body.translation().x, body.translation().y, body.translation().z), 32, 2, 12);
        break;
      case 'school-bus': // HALL PASS: short speed window with a strong launch.
        body.applyImpulse({ x: tmpForward.x * 14, y: 2.5, z: tmpForward.z * 14 }, true);
        break;
      case 'bathtub-x': // BUBBLE JET: upward water-jet hop.
        body.applyImpulse({ x: tmpForward.x * 6, y: 12.5, z: tmpForward.z * 6 }, true);
        effects.burst(new THREE.Vector3(body.translation().x, body.translation().y, body.translation().z), 24, 2, 10);
        break;
      case 'ikea-runner': // ALLEN KEY: a sharp torque-assisted launch.
        body.applyImpulse({ x: tmpForward.x * 12, y: 2, z: tmpForward.z * 12 }, true);
        body.applyTorqueImpulse({ x: 0, y: 1.8, z: 0 }, true);
        break;
      case 'ufo-car': // ABDUCT: float above the road for a few seconds.
        body.applyImpulse({ x: 0, y: 13, z: 0 }, true);
        break;
      case 'golden-toilet': // ROYAL FLUSH: maximum forward kick and a golden burst.
        body.applyImpulse({ x: tmpForward.x * 18, y: 4, z: tmpForward.z * 18 }, true);
        effects.burst(new THREE.Vector3(body.translation().x, body.translation().y, body.translation().z), 40, 0, 16);
        break;
    }
    effects.burst(new THREE.Vector3(body.translation().x, body.translation().y, body.translation().z), 12, save.infernal ? 1 : 3, 7);
    audio.boss(); setMessage(`${car.ability} ACTIVATED`, 1.2);
    input.ability = false;
  }
  if (vehicle.abilityDuration > 0 && car.id === 'ufo-car') body.applyImpulse({ x: 0, y: 3.7 * dt, z: 0 }, true);
  const current = body.linvel();
  const planar = Math.hypot(current.x, current.z);
  if (planar > maxSpeed) {
    const scale = maxSpeed / planar;
    body.setLinvel({ x: current.x * scale, y: current.y, z: current.z * scale }, true);
  }
  // A stronger landing response keeps the vehicle readable after jumps.
  if (body.translation().y < 1.1 && current.y < -2) {
    body.applyImpulse({ x: -current.x * .002, y: Math.min(2, -current.y * .12 * (1 + suspensionLevel * .1)), z: -current.z * .002 }, true);
  }
  physicsWorld.step();
  const p = body.translation();
  if (p.y < -24 || Math.abs(p.x) > 2000 || Math.abs(p.z) > 6000) {
    respawnVehicle(vehicle, worldData);
    vehicle.nitro = Math.max(20, vehicle.nitro - 15);
    setMessage('RESET TO THE LAST GOOD DECISION', 1.7);
    audio.hit();
  }
  syncVehicle(vehicle, dt);
}

function updateRace(dt) {
  if (!vehicle || finished) return;
  raceTime += dt; elapsed += dt;
  const p = vehicle.body.translation();
  const currentPosition = new THREE.Vector3(p.x, p.y, p.z);
  const move = currentPosition.distanceTo(lastCarPosition);
  score += move * (modeDef.id === 'stunt-mode' ? 4 : 1.1);
  if (vehicle.drift > .35 && vehicle.speed > 8) score += dt * vehicle.drift * 50;
  if (p.y > 3) { vehicle.airTime += dt; score += dt * 65; }
  else if (vehicle.airTime > 1.2) { score += vehicle.airTime * 180; setMessage('QUESTIONABLE AIRTIME +', 1.2); if (!save.achievements.includes('sky-high')) save.achievements.push('sky-high'); vehicle.airTime = 0; }
  else vehicle.airTime = 0;
  lastCarPosition.copy(currentPosition);
  const near = nearestProgress(currentPosition);
  progress = near.value;
  if (!trackDef.secret && previousProgress > .88 && progress < .12) {
    lap++;
    audio.collect();
    effects.burst(currentPosition, 24, 0, 9);
  }
  if (trackDef.secret && progress > .997 && !abyssEnding) {
    finishAbyss(); return;
  }
  previousProgress = progress;

  if (worldData.coins?.length) {
    for (const coin of worldData.coins) {
      if (coin.collected) continue;
      if (currentPosition.distanceTo(coin.position) < 4.2) {
        coin.collected = true; scene.remove(coin.mesh);
        save.coins += 1529; persist(); score += 1529;
        audio.collect(); effects?.burst(coin.position.clone(), 16, 0, 10);
        setMessage('+1,529 / INFERNAL COIN', 1.1);
      }
    }
  }
  if (gateCooldown <= 0 && worldData.gates) {
    for (const gate of worldData.gates) {
      if (gate.hit) continue;
      if (currentPosition.distanceTo(gate.position) < 9) {
        gate.hit = true; bossPhase++; gateCooldown = .75;
        gate.mesh.material.color.set(save.infernal ? '#ffe3a0' : '#ffffff');
        gate.mesh.scale.setScalar(1.35);
        audio.boss(); effects.burst(gate.position.clone().add(new THREE.Vector3(0, 4, 0)), 30, 0, 13);
        score += 1200;
        setMessage(`BOSS PHASE ${bossPhase} / WEAKPOINT TAGGED`, 1.5);
        if (bossPhase >= 3 && !save.achievements.includes('boss-breaker')) save.achievements.push('boss-breaker');
      }
    }
  }
  gateCooldown = Math.max(0, gateCooldown - dt);
  if (!trackDef.secret && raceTime >= nextEventAt && !chaosEvent) {
    const q = vehicle.body.rotation();
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w)).setY(0).normalize();
    chaosEvent = spawnChaosEvent(scene, currentPosition, forward, save.infernal);
    nextEventAt = raceTime + (modeDef.id === 'endless-chaos' ? 14 + Math.random() * 8 : 23 + Math.random() * 13);
    const names = { dinosaur: 'DINOSAUR CROSSING', meteor: 'METEOR SHOWER', ufo: 'UNIDENTIFIED AIRSPACE', earthquake: 'GROUND CONTROL LOST', gravity: 'GRAVITY MALFUNCTION', wave: 'GIANT WAVE INCOMING', 'road-chaos': 'ROAD CHAOS / TAKE A LANE' };
    setMessage(names[chaosEvent.type] || 'RANDOM EVENT', 2.2);
    if (chaosEvent.type === 'earthquake') cameraShake = 4.5;
    if (chaosEvent.type === 'gravity') setMessage('LOW GRAVITY / HOLD ON', 2.2);
    audio.hit();
  }
  if (chaosEvent) {
    const eventResult = updateChaosEvent(chaosEvent, dt, currentPosition, vehicle, effects);
    if (chaosEvent.type === 'gravity' && chaosEvent.age < 5.5) vehicle.body.applyImpulse({ x: 0, y: 2.2 * dt, z: 0 }, true);
    if (chaosEvent.type === 'earthquake') cameraShake = Math.max(0, cameraShake - dt);
    if (eventResult.collision && !chaosEvent.hit) {
      chaosEvent.hit = true;
      const shielded = vehicle.car.id === 'school-bus' && vehicle.abilityDuration > 0;
      const q = vehicle.body.rotation();
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w));
      vehicle.body.applyImpulse({ x: -fwd.x * 12 + (Math.random() - .5) * 5, y: 4.2, z: -fwd.z * 12 + (Math.random() - .5) * 5 }, true);
      if (!shielded) { vehicle.damage = Math.min(1, vehicle.damage + .22); vehicle.nitro = Math.max(0, vehicle.nitro - 18); }
      effects?.burst(currentPosition.clone(), 28, save.infernal ? 1 : 0, 14);
      audio.hit(); setMessage(shielded ? 'HALL PASS / COLLISION IGNORED' : 'COLLISION / KEEP IT TOGETHER', 1.8);
    }
    if (eventResult.done) { removeChaosEvent(scene, chaosEvent); chaosEvent = null; }
  }
  if (messageTimer > 0) messageTimer -= dt;
  const timeText = `${String(Math.floor(raceTime / 60)).padStart(2,'0')}:${String(Math.floor(raceTime % 60)).padStart(2,'0')}.${String(Math.floor((raceTime % 1) * 100)).padStart(2,'0')}`;
  const showBoss = !trackDef.secret && (modeDef.id === 'boss-rush' || progress > .58);
  const lapText = trackDef.secret ? 'ABYSS' : modeDef.id === 'endless-chaos' ? '∞' : `${Math.min(lap, 2)} / 2`;
  ui.updateHUD({ speed: vehicle.speed, nitro: vehicle.nitro, progress, timeText, lapText, score, trackName: trackDef.name, modeName: modeDef.name, showBoss, bossName: trackDef.subtitle, bossPhase: Math.min(3, bossPhase + 1), message: messageTimer > 0 ? undefined : '' });

  if (modeDef.id === 'time-attack' && raceTime >= 90) endRace();
  else if (modeDef.id === 'endless-chaos' && raceTime >= 120) endRace();
  else if (modeDef.id === 'stunt-mode' && raceTime >= 100) endRace();
  else if (modeDef.id === 'boss-rush' && bossPhase >= 3 && progress > .86) endRace();
  else if ((modeDef.id === 'world-race' || modeDef.id === 'daily-challenge') && lap > 2) endRace();
}

function finishAbyss() {
  if (finished || abyssEnding) return;
  // Leave the road before the final reveal: a brief, controllable physics
  // cutaway makes the end of the route feel like an actual fall.
  running = false; paused = false; abyssEnding = true;
  abyssCutsceneTime = 0; abyssChestOpened = false;
  audio.stopMusic();
  audio.abyss();
  touchUpAll();
}

function updateAbyssCutscene(dt) {
  abyssCutsceneTime += dt;
  if (abyssCutsceneTime < 1.55 && vehicle) {
    const body = vehicle.body;
    const r = body.rotation();
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(new THREE.Quaternion(r.x, r.y, r.z, r.w)).setY(0).normalize();
    body.applyImpulse({ x: forward.x * 7.5 * dt, y: -13.5 * dt, z: forward.z * 7.5 * dt }, true);
    physicsWorld.timestep = dt;
    physicsWorld.step();
    physicsWorld.timestep = 1 / 60;
    syncVehicle(vehicle, dt);
    cameraUpdate(dt);
  } else {
    if (!abyssChestOpened && worldData?.chest) {
      abyssChestOpened = true;
      worldData.chest.userData.opened = true;
      worldData.chest.userData.lidPivot.rotation.x = -1.6;
      effects?.burst(worldData.chest.position.clone().add(new THREE.Vector3(0, 4, 0)), 50, 0, 18);
    }
    if (worldData?.chest) {
      const chestPos = worldData.chest.position;
      const shot = new THREE.Vector3(chestPos.x + 18, 13, chestPos.z - 28);
      camera.position.lerp(shot, 1 - Math.pow(.0008, dt));
      cameraLook.lerp(new THREE.Vector3(chestPos.x, 4, chestPos.z), 1 - Math.pow(.0005, dt));
      camera.lookAt(cameraLook);
    }
  }
  effects?.update(dt);
  animateWorld(worldData, raceTime + abyssCutsceneTime, bossPhase);
  if (abyssCutsceneTime >= 2.55) {
    abyssEnding = false; finished = true; running = false;
    let reward = 0;
    if (!save.abyssRewardClaimed) {
      reward = 999999999;
      save.coins += reward;
      save.abyssRewardClaimed = true;
      save.achievements = [...new Set([...save.achievements, 'abyss'])];
      persist();
    }
    ui.setGameData({ abyss: true, win: true, reward });
    ui.setScreen('results');
  }
}

function endRace() {
  if (finished) return;
  finished = true; running = false;
  const completed = modeDef.id === 'world-race' || modeDef.id === 'daily-challenge' || modeDef.id === 'boss-rush';
  const win = completed ? (modeDef.id !== 'boss-rush' || bossPhase >= 3) : score > 4500;
  raceReward = Math.round(220 + Math.min(1400, score * .07) + (win ? 260 : 0));
  if (modeDef.id === 'daily-challenge') raceReward += 250;
  save.coins += raceReward;
  save.races += 1;
  if (win && !save.achievements.includes('first-run')) save.achievements.push('first-run');
  if (save.ownedCars.length >= 4 && !save.achievements.includes('collector')) save.achievements.push('collector');
  const oldBest = save.bestTimes[trackDef.id];
  if (!oldBest || raceTime < oldBest) save.bestTimes[trackDef.id] = raceTime;
  persist(); audio.win();
  ui.setGameData({ win, reward: raceReward });
  ui.setScreen('results');
}

function cameraUpdate(dt) {
  if (!vehicle) return;
  const p = vehicle.body.translation(), r = vehicle.body.rotation();
  const quat = new THREE.Quaternion(r.x, r.y, r.z, r.w);
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
  const speedFactor = Math.min(1, vehicle.speed / 42);
  const desired = new THREE.Vector3(p.x, p.y + 5.3 + speedFactor * 1.0, p.z).addScaledVector(forward, -10.8 - speedFactor * 2.8).addScaledVector(right, 0);
  camera.position.lerp(desired, 1 - Math.pow(.001, dt));
  const look = new THREE.Vector3(p.x, p.y + 1.25, p.z).addScaledVector(forward, 4 + speedFactor * 3);
  cameraLook.lerp(look, 1 - Math.pow(.0005, dt));
  if (cameraShake > 0) {
    const strength = Math.min(.5, cameraShake * .1);
    camera.position.x += (Math.random() - .5) * strength;
    camera.position.y += (Math.random() - .5) * strength;
  }
  camera.lookAt(cameraLook);
  camera.fov = 63 + speedFactor * 5 + (vehicle.boostFlash > 0 ? 3 : 0);
  camera.updateProjectionMatrix();
  camera.position.y += Math.sin(elapsed * 7) * .02 * speedFactor;
}

function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  const dt = Math.min(.04, Math.max(.001, (now - lastTime) / 1000 || 1 / 60));
  lastTime = now;
  if (abyssEnding && vehicle) {
    updateAbyssCutscene(dt);
  } else if (running && !paused && vehicle) {
    // Physics integrates at a stable fixed step, while presentation follows actual frame delta.
    accumulator += dt;
    let steps = 0;
    while (accumulator >= 1 / 60 && steps < 4) {
      physicsStep(1 / 60);
      accumulator -= 1 / 60; steps++;
    }
    updateRace(dt);
    syncVehicle(vehicle, dt);
    cameraUpdate(dt);
    animateWorld(worldData, elapsed, bossPhase);
    effects?.update(dt);
    if (!abyssEnding) audio.update(vehicle.speed, input.nitro && vehicle.nitro > 0, elapsed);
  } else if (worldData && !finished) {
    animateWorld(worldData, elapsed, bossPhase);
    cameraUpdate(dt * .4);
  }
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function onResize() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, save.quality === 'high' ? 1.75 : 1.15));
}

function isTouchHeld(action) {
  return (pointerHolders.get(action)?.size || 0) > 0;
}

function keyChange(e, pressed) {
  const key = e.key.toLowerCase();
  const map = { w: 'forward', arrowup: 'forward', s: 'reverse', arrowdown: 'reverse', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', ' ': 'jump', shift: 'nitro', e: 'ability' };
  if (key === 'escape' && pressed) {
    e.preventDefault();
    if (running && !paused) pauseGame();
    else if (paused) resumeGame();
    return;
  }
  const action = map[key];
  if (action) {
    e.preventDefault();
    if (pressed) keyboardKeys.add(action); else keyboardKeys.delete(action);
    input[action] = keyboardKeys.has(action) || isTouchHeld(action);
    if (pressed && action === 'jump') input.jump = true;
    if (pressed && action === 'ability') input.ability = true;
  }
}

function touchDown(control, pointerId = -1) {
  const map = { gas: 'forward', brake: 'reverse', left: 'left', right: 'right', jump: 'jump', nitro: 'nitro', ability: 'ability' };
  const key = map[control]; if (!key) return;
  const previous = pointerToKey.get(pointerId);
  if (previous && previous !== key) touchPointerUp(pointerId);
  pointerToKey.set(pointerId, key);
  if (!pointerHolders.has(key)) pointerHolders.set(key, new Set());
  pointerHolders.get(key).add(pointerId);
  input[key] = true;
}

function touchPointerUp(pointerId) {
  const key = pointerToKey.get(pointerId);
  if (!key) return;
  pointerToKey.delete(pointerId);
  const holders = pointerHolders.get(key);
  holders?.delete(pointerId);
  if (!holders?.size) pointerHolders.delete(key);
  input[key] = keyboardKeys.has(key) || isTouchHeld(key);
}

function touchUpAll() {
  pointerToKey.clear(); pointerHolders.clear(); keyboardKeys.clear();
  for (const key of Object.keys(input)) input[key] = false;
}

function pauseGame() {
  if (!running || paused) return;
  paused = true; running = false; touchUpAll(); ui.setScreen('pause');
}
function resumeGame() { if (finished) return; paused = false; running = true; ui.setScreen('game'); lastTime = performance.now(); }
function exitGame() {
  running = false; paused = false; finished = false;
  if (chaosEvent) removeChaosEvent(scene, chaosEvent); chaosEvent = null;
  cleanWorld();
  if (physicsWorld) { physicsWorld.free(); physicsWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 }); }
  save.coins = Math.max(0, save.coins); persist();
  buildMenuScene(); ui.updateSave(save); ui.setScreen('home');
}

const actions = {
  start: startGame,
  pause: pauseGame,
  resume: resumeGame,
  exit: exitGame,
  restart: startGame,
  selectTrack: id => { if (id === 'the-abyss' && !save.abyssUnlocked) return; save.selectedTrack = id; persist(); ui.updateSave(save); },
  selectMode: id => { save.selectedMode = id; persist(); ui.updateSave(save); },
  selectCar: id => { if (!save.ownedCars.includes(id)) return; save.selectedCar = id; persist(); ui.updateSave(save); },
  buyCar: id => { const c = CARS.find(v => v.id === id); if (!c || save.ownedCars.includes(id) || save.coins < c.price) { setMessage('NOT ENOUGH COINS', 1); return; } save.coins -= c.price; save.ownedCars.push(id); save.selectedCar = id; persist(); ui.updateSave(save); audio.collect(); },
  upgrade: id => {
    const current = CARS.find(c => c.id === save.selectedCar); if (!current) return;
    const item = UPGRADE_TYPES.find(u => u.id === id); if (!item) return;
    const upgrades = save.upgrades[current.id] || {}; const level = upgrades[id] || 0;
    const price = Math.round(item.base * (1 + level * .72) * (current.price ? .9 : 1));
    if (level >= 5 || save.coins < price) { setMessage(level >= 5 ? 'SYSTEM MAXED OUT' : 'NOT ENOUGH COINS', 1); return; }
    save.coins -= price; upgrades[id] = level + 1; save.upgrades[current.id] = upgrades; persist(); ui.updateSave(save); audio.collect();
  },
  buySkin: id => { const item = SKINS.find(s => s.id === id); if (!item || save.ownedSkins.includes(id) || save.coins < item.price) return setMessage('NOT ENOUGH COINS', 1); save.coins -= item.price; save.ownedSkins.push(id); save.selectedSkin = id; persist(); ui.updateSave(save); },
  selectSkin: id => { if (save.ownedSkins.includes(id)) { save.selectedSkin = id; persist(); ui.updateSave(save); } },
  buyWheel: id => { const item = WHEELS.find(w => w.id === id); if (!item || save.ownedWheels.includes(id) || save.coins < item.price) return setMessage('NOT ENOUGH COINS', 1); save.coins -= item.price; save.ownedWheels.push(id); save.selectedWheels = id; persist(); ui.updateSave(save); },
  selectWheel: id => { if (save.ownedWheels.includes(id)) { save.selectedWheels = id; persist(); ui.updateSave(save); } },
  code: code => {
    if (code === '1529') {
      const firstUnlock = !save.infernal;
      save.infernal = true; save.abyssUnlocked = true;
      if (!save.unlockedTracks.includes('the-abyss')) save.unlockedTracks.push('the-abyss');
      if (firstUnlock) { save.coins += 1529; save.gems += 5; }
      persist(); audio.setInfernal(true); audio.tone(148, .75, 'sawtooth', .1, 470);
      buildMenuScene(); ui.updateSave(save);
      setMessage(firstUnlock ? '1529 / INFERNAL PROTOCOL UNLOCKED' : 'INFERNAL PROTOCOL ALREADY ACTIVE', 2);
    } else { audio.tone(110, .18, 'square', .04, -40); setMessage('ACCESS DENIED / NICE TRY', 1.3); }
  },
  claimDaily: () => {
    const today = new Date().toISOString().slice(0, 10);
    if (save.dailyClaim === today) return setMessage('DAILY DROP ALREADY CLAIMED', 1.1);
    save.dailyClaim = today; save.coins += 250; save.gems += 1; persist(); ui.updateSave(save); audio.collect(); setMessage('+250 COINS / +1 GEM', 1.5);
  },
  toggleSound: () => { save.sound = !save.sound; audio.setEnabled(save.sound); persist(); ui.updateSave(save); },
  quality: value => { save.quality = value; persist(); setRendererQuality(); ui.updateSave(save); },
  touchDown,
  touchUp: touchPointerUp,
};

async function boot() {
  try {
    initScene();
    await initPhysics();
    // Render a full 3D showroom track and the selected vehicle behind the menu.
    buildMenuScene();
    ui = new GameUI(uiRoot, save, actions);
    audio.setEnabled(save.sound); audio.setInfernal(save.infernal);
    initialized = true;
    requestAnimationFrame(() => loading.classList.add('done'));
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('keydown', e => keyChange(e, true));
    window.addEventListener('keyup', e => keyChange(e, false));
    window.addEventListener('blur', touchUpAll);
    window.addEventListener('pointerup', e => touchPointerUp(e.pointerId));
    window.addEventListener('pointercancel', e => touchPointerUp(e.pointerId));
    lastTime = performance.now();
    animate(lastTime);
  } catch (error) {
    console.error('STUPID RACING failed to initialise:', error);
    loading.innerHTML = `<div class="loading-mark">SR<span>!</span></div><p>ENGINE FAILED TO START</p><pre style="max-width:80vw;color:#e88;font:11px monospace;white-space:pre-wrap">${String(error?.stack || error)}</pre>`;
  }
}

boot();
