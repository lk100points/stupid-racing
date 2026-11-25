const KEY = 'stupid-racing-save-v1';

export const freshSave = () => ({
  coins: 2400,
  gems: 12,
  selectedCar: 'shopping-cart',
  selectedTrack: 'broken-city',
  selectedMode: 'world-race',
  ownedCars: ['shopping-cart'],
  upgrades: {},
  ownedSkins: ['factory'],
  selectedSkin: 'factory',
  ownedWheels: ['standard'],
  selectedWheels: 'standard',
  unlockedTracks: ['broken-city', 'lost-prehistory', 'plastic-desert', 'night-protocol', 'wrong-place'],
  abyssUnlocked: false,
  infernal: false,
  abyssRewardClaimed: false,
  achievements: [],
  races: 0,
  bestTimes: {},
  dailyClaim: '',
  sound: true,
  quality: 'high'
});

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshSave();
    const parsed = JSON.parse(raw);
    return { ...freshSave(), ...parsed, upgrades: parsed.upgrades || {} };
  } catch (error) {
    console.warn('Save data could not be read; starting a fresh garage.', error);
    return freshSave();
  }
}

export function saveGame(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('Progress could not be saved in this browser.', error);
    return false;
  }
}
