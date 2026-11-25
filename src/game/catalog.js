export const CARS = [
  { id: 'shopping-cart', name: 'SHOPPING CART', type: 'THE ORIGINAL', price: 0, speed: 5, accel: 7, handling: 8, mass: 0.72, ability: 'AISLE DRIFT', description: 'A retail classic. Turns on a dime, dignity not included.', color: '#aeb9c6', shape: 'cart' },
  { id: 'sofa-gt', name: 'SOFA GT', type: 'LIVING ROOM LEGEND', price: 1800, speed: 6, accel: 5, handling: 5, mass: 1.5, ability: 'COUCH LOCK', description: 'Suspension by upholstery. Surprisingly comfortable at 140.', color: '#c76b56', shape: 'sofa' },
  { id: 'fridge-3000', name: 'FRIDGE 3000', type: 'COLD BLOODED', price: 2600, speed: 4, accel: 8, handling: 5, mass: 1.65, ability: 'FROST BURST', description: 'Heavy doors. Heavier consequences. Chills the competition.', color: '#b8d2df', shape: 'fridge' },
  { id: 'school-bus', name: 'SCHOOL BUS', type: 'DETENTION EXPRESS', price: 3400, speed: 6, accel: 4, handling: 4, mass: 1.9, ability: 'HALL PASS', description: 'The last bell rings at 200 kilometres per bad decision.', color: '#f4b52e', shape: 'bus' },
  { id: 'bathtub-x', name: 'BATHTUB X', type: 'WET WORK', price: 4100, speed: 7, accel: 6, handling: 6, mass: 1.1, ability: 'BUBBLE JET', description: 'Bath time is over. The plumbing is not road legal.', color: '#e5e8eb', shape: 'tub' },
  { id: 'ikea-runner', name: 'IKEA RUNNER', type: 'FLAT-PACK FURY', price: 5200, speed: 7, accel: 7, handling: 7, mass: 0.85, ability: 'ALLEN KEY', description: 'Some assembly required. All acceleration included.', color: '#2867b5', shape: 'ikea' },
  { id: 'ufo-car', name: 'UFO CAR', type: 'UNIDENTIFIED VEHICLE', price: 6800, speed: 9, accel: 8, handling: 9, mass: 0.55, ability: 'ABDUCT', description: 'No wheels. No paperwork. No respect for gravity.', color: '#6de2d3', shape: 'ufo' },
  { id: 'golden-toilet', name: 'GOLDEN TOILET', type: 'ROYAL FLUSH', price: 9500, speed: 10, accel: 9, handling: 7, mass: 0.9, ability: 'ROYAL FLUSH', description: 'An absolutely unnecessary throne with absolutely necessary speed.', color: '#e5bd55', shape: 'toilet' }
];

export const TRACKS = [
  { id: 'broken-city', name: 'BROKEN CITY', subtitle: 'THE TRAFFIC KING', location: 'DISTRICT 0 / 03:14 AM', sky: '#101d34', fog: '#18243a', road: '#353b46', accent: '#ee6c4d', ground: '#18232c', theme: 'city', difficulty: 'ROOKIE', length: 1 },
  { id: 'lost-prehistory', name: 'LOST PREHISTORY', subtitle: 'REX-9000', location: 'JURASSIC SERVICE ROAD', sky: '#1a352a', fog: '#35513b', road: '#42483d', accent: '#a9ca68', ground: '#30412e', theme: 'prehistoric', difficulty: 'CHAOTIC', length: 1.15 },
  { id: 'plastic-desert', name: 'PLASTIC DESERT', subtitle: 'THE INFLATABLE', location: 'SYNTHETIC BADLANDS', sky: '#603b34', fog: '#9b6650', road: '#66564d', accent: '#ffbb7b', ground: '#8d624b', theme: 'desert', difficulty: 'TRICKY', length: 1.1 },
  { id: 'night-protocol', name: 'NIGHT PROTOCOL', subtitle: 'MOTHERBOARD', location: 'SERVER FARM / CLOSED', sky: '#11162e', fog: '#28244c', road: '#20283d', accent: '#8f82ff', ground: '#19182c', theme: 'neon', difficulty: 'EXPERT', length: 1.2 },
  { id: 'wrong-place', name: 'THE WRONG PLACE', subtitle: 'THE MANAGER', location: 'CORPORATE CAMPUS, SOMEWHERE', sky: '#343941', fog: '#646b72', road: '#555c63', accent: '#f1d56b', ground: '#41474b', theme: 'office', difficulty: 'UNFAIR', length: 1.25 },
  { id: 'the-abyss', name: 'THE ABYSS', subtitle: 'NO RETURN ADDRESS', location: 'BELOW THE LAST CHECKPOINT', sky: '#09050d', fog: '#1b080f', road: '#24151b', accent: '#ed4639', ground: '#10090e', theme: 'abyss', difficulty: '???', length: 6.5, secret: true }
];

export const MODES = [
  { id: 'world-race', name: 'WORLD RACE', detail: '2 LAPS / FINISH FIRST', icon: '🏁' },
  { id: 'boss-rush', name: 'BOSS RUSH', detail: '3 PHASES / BREAK THE ROUTINE', icon: '👑' },
  { id: 'endless-chaos', name: 'ENDLESS CHAOS', detail: 'SURVIVE THE ROAD / BUILD SCORE', icon: '⚡' },
  { id: 'time-attack', name: 'TIME ATTACK', detail: '90 SECONDS / BEAT YOUR GHOST', icon: '⏱' },
  { id: 'stunt-mode', name: 'STUNT MODE', detail: 'AIRTIME + DRIFT + BIG NUMBERS', icon: '🛞' },
  { id: 'daily-challenge', name: 'DAILY CHALLENGE', detail: 'ONE SEED / ONE REWARD', icon: '✦' }
];

export const UPGRADE_TYPES = [
  { id: 'engine', name: 'ENGINE', icon: '✦', description: 'More pull out of every corner.', base: 420 },
  { id: 'nitro', name: 'NITRO', icon: '↗', description: 'Longer boost and quicker refill.', base: 460 },
  { id: 'handling', name: 'HANDLING', icon: '⌁', description: 'Sharper steering response.', base: 390 },
  { id: 'suspension', name: 'SUSPENSION', icon: '⌗', description: 'Better landings and less bounce.', base: 410 },
  { id: 'ability', name: 'ABILITY', icon: '✧', description: 'Shorter cooldown for your special.', base: 580 }
];

export const SKINS = [
  { id: 'factory', name: 'FACTORY', price: 0, color: null },
  { id: 'volt', name: 'VOLT', price: 650, color: '#b9fa46' },
  { id: 'ice', name: 'ICE BREAKER', price: 900, color: '#83dff5' },
  { id: 'sunset', name: 'SUNSET SHIFT', price: 1100, color: '#ff795d' },
  { id: 'gold', name: 'GOLD STANDARD', price: 2200, color: '#eacb73' }
];

export const WHEELS = [
  { id: 'standard', name: 'STANDARD', price: 0, color: '#252a31' },
  { id: 'whitewall', name: 'WHITEWALL', price: 500, color: '#e8e7df' },
  { id: 'neon', name: 'NEON RIM', price: 950, color: '#a78bff' },
  { id: 'gold', name: '24K SPIN', price: 1600, color: '#d6ad54' }
];
