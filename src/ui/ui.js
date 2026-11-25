import { CARS, TRACKS, MODES, UPGRADE_TYPES, SKINS, WHEELS } from '../game/catalog.js';

const money = n => Math.max(0, Math.floor(n)).toLocaleString('en-US');
const safeText = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class GameUI {
  constructor(root, save, actions) {
    this.root = root;
    this.save = save;
    this.actions = actions;
    this.root.classList.toggle('infernal-theme', !!save.infernal);
    this.screen = 'home';
    this.gameData = {};
    this.root.addEventListener('click', e => this.handleClick(e));
    this.root.addEventListener('submit', e => this.handleSubmit(e));
    this.root.addEventListener('pointerdown', e => this.handlePointerDown(e));
    this.render();
  }

  handleClick(event) {
    const target = event.target.closest('[data-action], [data-nav]');
    if (!target) return;
    if (target.dataset.nav) { this.setScreen(target.dataset.nav); return; }
    const action = target.dataset.action;
    if (action === 'start') this.actions.start?.();
    else if (action === 'back') this.setScreen('home');
    else if (action === 'pause') this.actions.pause?.();
    else if (action === 'resume') this.actions.resume?.();
    else if (action === 'exit') this.actions.exit?.();
    else if (action === 'restart') this.actions.restart?.();
    else if (action === 'select-track') this.actions.selectTrack?.(target.dataset.id);
    else if (action === 'select-mode') this.actions.selectMode?.(target.dataset.id);
    else if (action === 'buy-car') this.actions.buyCar?.(target.dataset.id);
    else if (action === 'select-car') this.actions.selectCar?.(target.dataset.id);
    else if (action === 'upgrade') this.actions.upgrade?.(target.dataset.id);
    else if (action === 'buy-skin') this.actions.buySkin?.(target.dataset.id);
    else if (action === 'select-skin') this.actions.selectSkin?.(target.dataset.id);
    else if (action === 'buy-wheel') this.actions.buyWheel?.(target.dataset.id);
    else if (action === 'select-wheel') this.actions.selectWheel?.(target.dataset.id);
    else if (action === 'toggle-sound') this.actions.toggleSound?.();
    else if (action === 'quality') this.actions.quality?.(target.dataset.value);
    else if (action === 'claim-daily') this.actions.claimDaily?.();
  }

  handlePointerDown(event) {
    const target = event.target.closest('[data-action="touch"]');
    if (!target) return;
    event.preventDefault();
    target.setPointerCapture?.(event.pointerId);
    this.actions.touchDown?.(target.dataset.control, event.pointerId);
  }

  handleSubmit(event) {
    const form = event.target.closest('#secret-form');
    if (!form) return;
    event.preventDefault();
    const code = form.querySelector('input').value.trim();
    this.actions.code?.(code);
  }

  setScreen(name) {
    this.screen = name;
    this.render();
  }

  updateSave(save) { this.save = save; this.root.classList.toggle('infernal-theme', !!save.infernal); this.render(); }

  nav() {
    const links = [['home', 'RACE'], ['garage', 'GARAGE'], ['shop', 'SHOP'], ['upgrades', 'TUNE'], ['records', 'RECORDS'], ['settings', 'SETTINGS']];
    return `<header class="topbar">
      <button class="brand" data-nav="home"><span class="brand-mark">SR</span><span>STUPID<span class="brand-light">RACING</span></span></button>
      <nav class="main-nav">${links.map(([id, label]) => `<button class="nav-link ${this.screen === id ? 'active' : ''}" data-nav="${id}">${label}</button>`).join('')}</nav>
      <div class="wallet"><span class="coin-icon">◆</span>${money(this.save.coins)} <i></i><span class="gem-icon">✦</span>${money(this.save.gems)}</div>
    </header>`;
  }

  renderHome() {
    const track = TRACKS.find(t => t.id === this.save.selectedTrack) || TRACKS[0];
    const mode = MODES.find(m => m.id === this.save.selectedMode) || MODES[0];
    return `${this.nav()}<main class="page home-page">
      <section class="hero-panel">
        <div class="hero-copy">
          <div class="eyebrow"><span class="live-dot"></span> ARCADE MOTORSPORT / EST. BAD DECISIONS</div>
          <h1>STUPID<br><em>RACING</em><span class="hero-star">✳</span></h1>
          <p>Real physics. Unreal vehicles. Questionable life choices.<br>Pick a machine and make the road regret it.</p>
          <div class="hero-actions"><button class="btn btn-primary btn-large" data-action="start">START RACE <span>↗</span></button><button class="btn btn-quiet" data-nav="garage">ENTER GARAGE <span>→</span></button></div>
          <div class="hero-stats"><div><b>08</b><span>ODD VEHICLES</span></div><div><b>05</b><span>MAIN TRACKS</span></div><div><b>06</b><span>GAME MODES</span></div></div>
        </div>
        <div class="hero-art"><div class="hero-ring ring-one"></div><div class="hero-ring ring-two"></div><div class="hero-cross">✳</div><div class="hero-label label-top">NO RULES<br>NO REFUNDS</div><div class="hero-label label-bottom">${safeText(CARS.find(c => c.id === this.save.selectedCar)?.name || 'SHOPPING CART')}<br><small>YOUR CURRENT RIDE</small></div><div class="hero-car-mark">${this.save.infernal ? '1529' : 'SR—08'}</div></div>
      </section>
      <section class="selection-section">
        <div class="section-heading"><div><div class="eyebrow">01 / DESTINATION</div><h2>CHOOSE YOUR <em>BAD IDEA</em></h2></div><span class="section-side">SELECT TRACK <b>↘</b></span></div>
        <div class="track-grid">${TRACKS.filter(t => !t.secret || this.save.abyssUnlocked).map((t, i) => `<button class="track-card ${this.save.selectedTrack === t.id ? 'selected' : ''} ${t.secret ? 'secret-track' : ''}" data-action="select-track" data-id="${t.id}" style="--track-accent:${this.save.infernal ? '#c9493c' : t.accent};--track-bg:${t.sky}"><span class="track-index">0${i + 1}</span><span class="track-symbol">${['▥', '♜', '◉', '⌘', '▤', '✦'][i]}</span><span class="track-name">${t.name}</span><span class="track-sub">${t.location}</span><span class="track-diff">${t.difficulty}</span></button>`).join('')}</div>
      </section>
      <section class="mode-section"><div class="section-heading"><div><div class="eyebrow">02 / RULES OF ENGAGEMENT</div><h2>HOW DO WE <em>LOSE?</em></h2></div><span class="section-side">GAME MODE <b>↘</b></span></div>
        <div class="mode-grid">${MODES.map(m => `<button class="mode-card ${this.save.selectedMode === m.id ? 'selected' : ''}" data-action="select-mode" data-id="${m.id}"><span class="mode-icon">${m.icon}</span><b>${m.name}</b><small>${m.detail}</small><span class="mode-check">${this.save.selectedMode === m.id ? '●' : '○'}</span></button>`).join('')}</div>
      </section>
      <section class="bottom-grid"><div class="code-panel"><div class="eyebrow">CLASSIFIED / DEV ACCESS</div><h3>GOT A <em>SECRET?</em></h3><p>Some doors only open when you know the number.</p><form id="secret-form" class="code-form"><input maxlength="12" autocomplete="off" spellcheck="false" placeholder="ENTER SECRET CODE" aria-label="Secret code"><button class="btn btn-outline" type="submit">UNLOCK ↗</button></form><span class="code-status">${this.save.infernal ? 'INFERNAL PROTOCOL ACTIVE' : 'ACCESS LEVEL: PUBLIC'}</span></div>
      <div class="daily-panel"><div class="eyebrow">DAILY / FREE DROP</div><h3>DAILY <em>CHAOS</em></h3><p>One challenge. One reward. Zero sensible decisions.</p><button class="btn btn-outline" data-action="claim-daily">${this.save.dailyClaim === new Date().toISOString().slice(0,10) ? 'CLAIMED ✓' : 'CLAIM DAILY REWARD +250'}</button></div></section>
    </main>`;
  }

  renderGarage() {
    return `${this.nav()}<main class="page subpage"><div class="page-title"><div><div class="eyebrow">VEHICLE COLLECTION / 08 BUILDS</div><h1>THE <em>GARAGE</em></h1><p>Every machine is road legal in at least one questionable country.</p></div><div class="garage-current"><span>CURRENTLY DRIVING</span><b>${safeText(CARS.find(c => c.id === this.save.selectedCar)?.name || 'SHOPPING CART')}</b></div></div>
      <div class="car-grid">${CARS.map((car, i) => { const owned = this.save.ownedCars.includes(car.id), selected = this.save.selectedCar === car.id; return `<article class="car-card ${selected ? 'selected' : ''}"><div class="car-card-art" style="--car-color:${car.color}"><span class="car-number">0${i + 1}</span><span class="car-art-shape">${['▤','▰','▣','▥','◡','▱','◉','♜'][i]}</span><span class="car-art-type">${car.type}</span></div><div class="car-card-content"><h3>${car.name}</h3><p>${car.description}</p><div class="stat-bars">${[['SPD',car.speed],['ACC',car.accel],['TURN',car.handling]].map(([label,v])=>`<div><span>${label}</span><i><b style="width:${v*10}%"></b></i></div>`).join('')}</div><div class="car-card-footer"><span class="ability-tag">✦ ${car.ability}</span>${owned ? `<button class="btn ${selected ? 'btn-selected' : 'btn-outline'}" data-action="select-car" data-id="${car.id}">${selected ? 'SELECTED ✓' : 'SELECT'}</button>` : `<button class="btn btn-primary" data-action="buy-car" data-id="${car.id}">◆ ${money(car.price)}</button>`}</div></div></article>`; }).join('')}</div>
    </main>`;
  }

  renderShop() {
    const skinCards = SKINS.map(s => { const owned = this.save.ownedSkins.includes(s.id), selected = this.save.selectedSkin === s.id; return `<article class="item-card"><div class="swatch" style="--swatch:${s.color || '#aeb9c6'}"><span>✦</span></div><div><b>${s.name}</b><small>VEHICLE FINISH</small></div>${owned ? `<button class="btn ${selected ? 'btn-selected' : 'btn-outline'}" data-action="select-skin" data-id="${s.id}">${selected ? 'EQUIPPED' : 'EQUIP'}</button>` : `<button class="btn btn-outline" data-action="buy-skin" data-id="${s.id}">◆ ${money(s.price)}</button>`}</article>`; }).join('');
    const wheelCards = WHEELS.map(w => { const owned = this.save.ownedWheels.includes(w.id), selected = this.save.selectedWheels === w.id; return `<article class="item-card"><div class="wheel-swatch" style="--swatch:${w.color}"><span>◉</span></div><div><b>${w.name}</b><small>WHEEL SET</small></div>${owned ? `<button class="btn ${selected ? 'btn-selected' : 'btn-outline'}" data-action="select-wheel" data-id="${w.id}">${selected ? 'EQUIPPED' : 'EQUIP'}</button>` : `<button class="btn btn-outline" data-action="buy-wheel" data-id="${w.id}">◆ ${money(w.price)}</button>`}</article>`; }).join('');
    return `${this.nav()}<main class="page subpage"><div class="page-title"><div><div class="eyebrow">PERSONALISATION / NO TASTE REQUIRED</div><h1>THE <em>SHOP</em></h1><p>Cosmetics do not make you faster. Confidence is free.</p></div><div class="garage-current"><span>AVAILABLE CREDIT</span><b>◆ ${money(this.save.coins)}</b></div></div><section class="shop-section"><div class="section-heading"><div><div class="eyebrow">01 / PAINTWORK</div><h2>FRESH <em>COATS</em></h2></div></div><div class="item-grid">${skinCards}</div></section><section class="shop-section"><div class="section-heading"><div><div class="eyebrow">02 / ROTATING OBJECTS</div><h2>WHEEL <em>DEAL</em></h2></div></div><div class="item-grid">${wheelCards}</div></section></main>`;
  }

  renderUpgrades() {
    const current = CARS.find(c => c.id === this.save.selectedCar) || CARS[0];
    const owned = this.save.ownedCars.includes(current.id);
    return `${this.nav()}<main class="page subpage"><div class="page-title"><div><div class="eyebrow">PERFORMANCE DIVISION / FIVE SYSTEMS</div><h1>THE <em>TUNER</em></h1><p>Give your favourite bad idea an unfair advantage.</p></div><div class="garage-current"><span>ACTIVE BUILD</span><b>${current.name}</b></div></div>
      <div class="tune-layout"><aside class="tune-aside"><div class="tune-car-icon" style="--car-color:${current.color}">${current.name.split(' ').map(w=>w[0]).join('')}</div><h3>${current.name}</h3><p>${current.ability}</p><div class="eyebrow">SELECTED VEHICLE</div><button class="btn btn-outline" data-nav="garage">CHANGE VEHICLE ↗</button></aside><div class="upgrade-list">${UPGRADE_TYPES.map(u => { const level = (this.save.upgrades[current.id] || {})[u.id] || 0; const price = Math.round(u.base * (1 + level * .72) * (current.price ? .9 : 1)); return `<article class="upgrade-card"><div class="upgrade-icon">${u.icon}</div><div class="upgrade-copy"><b>${u.name}</b><p>${u.description}</p><div class="level-track">${Array.from({length:5},(_,i)=>`<i class="${i < level ? 'filled' : ''}"></i>`).join('')}</div></div><div class="upgrade-buy"><span>LVL ${level}/5</span><button class="btn ${level >= 5 || !owned ? 'btn-disabled' : 'btn-outline'}" data-action="upgrade" data-id="${u.id}" ${level >= 5 || !owned ? 'disabled' : ''}>${!owned ? 'LOCKED' : level >= 5 ? 'MAXED' : `◆ ${money(price)}`}</button></div></article>`; }).join('')}</div></div></main>`;
  }

  renderRecords() {
    const achievements = [
      ['first-run','FIRST BAD IDEA','Complete your first race.','🏁',this.save.races > 0],
      ['collector','HOARDER','Own four vehicles.','🛒',this.save.ownedCars.length >= 4],
      ['boss-breaker','BOSS BREAKER','Touch all three boss gates.','👑',(this.save.achievements || []).includes('boss-breaker')],
      ['sky-high','QUESTIONABLE FLIGHT','Get serious airtime in Stunt Mode.','✈',(this.save.achievements || []).includes('sky-high')],
      ['secret','NUMBERS PERSON','Find the 1529 protocol.','✦',this.save.infernal],
      ['abyss','BOTTOM OF THE MAP','Open the chest at the end of The Abyss.','♜',this.save.abyssRewardClaimed]
    ];
    return `${this.nav()}<main class="page subpage"><div class="page-title"><div><div class="eyebrow">CAREER / PERSONAL LOWLIGHTS</div><h1>YOUR <em>LEGACY</em></h1><p>Statistics the insurance company would rather not see.</p></div><div class="garage-current"><span>RACES FINISHED</span><b>${money(this.save.races)}</b></div></div><div class="record-stats"><div><small>TOTAL COINS</small><b>${money(this.save.coins)}</b></div><div><small>VEHICLES OWNED</small><b>${this.save.ownedCars.length}/8</b></div><div><small>BEST LAPS SAVED</small><b>${Object.keys(this.save.bestTimes || {}).length}</b></div></div><section class="achievement-section"><div class="section-heading"><div><div class="eyebrow">TROPHIES / ACCIDENTS WITH BENEFITS</div><h2>ACHIEVE <em>LESS</em></h2></div></div><div class="achievement-grid">${achievements.map(a=>`<article class="achievement ${a[4]?'unlocked':''}"><span>${a[3]}</span><div><b>${a[1]}</b><p>${a[2]}</p></div><small>${a[4]?'UNLOCKED':'LOCKED'}</small></article>`).join('')}</div></section></main>`;
  }

  renderSettings() {
    return `${this.nav()}<main class="page subpage"><div class="page-title"><div><div class="eyebrow">SYSTEM PREFERENCES / BUILD ${this.save.quality.toUpperCase()}</div><h1>THE <em>SETTINGS</em></h1><p>Make the chaos look and sound the way you like.</p></div></div><div class="settings-list"><article class="setting-row"><div><b>GAME AUDIO</b><p>Engine, boost, effects and interface tones.</p></div><button class="toggle ${this.save.sound?'on':''}" data-action="toggle-sound">${this.save.sound?'ON':'OFF'}</button></article><article class="setting-row"><div><b>RENDER QUALITY</b><p>High uses sharper shadows. Balanced favours battery and frame rate.</p></div><div class="segmented"><button data-action="quality" data-value="high" class="${this.save.quality==='high'?'active':''}">HIGH</button><button data-action="quality" data-value="balanced" class="${this.save.quality==='balanced'?'active':''}">BALANCED</button></div></article><article class="setting-row"><div><b>TOUCH CONTROL LAYOUT</b><p>Mobile controls appear automatically on touch screens in landscape.</p></div><span class="setting-note">AUTO</span></article><article class="setting-row"><div><b>LOCAL PROGRESS</b><p>Progress is stored in this browser using LocalStorage.</p></div><span class="setting-note">ACTIVE</span></article></div></main>`;
  }

  renderGame() {
    return `<div class="hud"><div class="hud-top"><div class="hud-brand"><span>SR</span> STUPID RACING</div><div class="race-meta"><span id="hud-track">BROKEN CITY</span><i></i><span id="hud-mode">WORLD RACE</span></div><button class="hud-pause" data-action="pause">Ⅱ</button></div><div class="hud-left"><div class="lap-label">LAP <b id="hud-lap">1 / 2</b></div><div class="timer" id="hud-time">00:00.00</div><div class="progress-rail"><i id="hud-progress"></i></div><div class="boss-status" id="boss-status"><span class="boss-dot"></span><span id="boss-name">BOSS DETECTED</span><b id="boss-phase">PHASE 01</b></div></div><div class="speed-panel"><div class="speed-number"><b id="hud-speed">000</b><span>KM/H</span></div><div class="nitro-box"><div><span>NITRO</span><b id="hud-nitro-label">100%</b></div><i><b id="hud-nitro"></b></i></div><div class="score-line">SCORE <b id="hud-score">000000</b></div></div><div class="hud-message" id="hud-message"></div><div class="mobile-controls" id="mobile-controls"><div class="steer-pad"><button data-action="touch" data-control="left">◀</button><button data-action="touch" data-control="right">▶</button></div><div class="action-pad"><button class="touch-small" data-action="touch" data-control="ability">E</button><button class="touch-small" data-action="touch" data-control="jump">↟</button><button class="touch-nitro" data-action="touch" data-control="nitro">N₂O</button><button class="touch-brake" data-action="touch" data-control="brake">BRAKE</button><button class="touch-gas" data-action="touch" data-control="gas">GO</button></div></div></div>`;
  }

  renderPause() {
    return `<div class="modal-shade"><div class="modal-card"><div class="eyebrow">RACE INTERRUPTED</div><h2>TAKE A <em>BREATHER.</em></h2><p>The road will still be a terrible idea when you get back.</p><div class="modal-actions"><button class="btn btn-primary" data-action="resume">BACK TO IT ↗</button><button class="btn btn-outline" data-action="restart">RESTART</button><button class="btn btn-quiet" data-action="exit">QUIT TO MENU</button></div></div></div>`;
  }

  renderResults(data = {}) {
    const abyss = data.abyss || false;
    return `<div class="modal-shade result-shade"><div class="modal-card result-card"><div class="eyebrow">${abyss ? 'THE LAST DOOR / CHEST OPENED' : 'RACE COMPLETE / DAMAGE QUESTIONABLE'}</div><h2>${abyss ? 'YOU ARE THE<br><em>GOD OF THIS GAME.</em>' : data.win ? 'ABSOLUTELY<br><em>UNNECESSARY.</em>' : 'THAT WAS<br><em>EXPENSIVE.</em>'}</h2><p>${abyss ? 'The game has accepted your terms. The balance is yours.' : data.win ? 'The scoreboard is confused. You are victorious.' : 'The road won this round. It happens.'}</p><div class="result-reward"><span>${abyss ? 'CHEST REWARD' : 'RACE REWARD'}</span><b>◆ ${money(data.reward || 0)}</b></div><div class="modal-actions"><button class="btn btn-primary" data-action="restart">RACE AGAIN ↗</button><button class="btn btn-outline" data-action="exit">MAIN MENU</button></div></div></div>`;
  }

  render() {
    if (this.screen === 'game') { this.root.innerHTML = this.renderGame(); return; }
    if (this.screen === 'pause') { this.root.innerHTML = this.renderGame() + this.renderPause(); return; }
    if (this.screen === 'results') { this.root.innerHTML = this.renderGame() + this.renderResults(this.gameData); return; }
    const page = this.screen === 'garage' ? this.renderGarage() : this.screen === 'shop' ? this.renderShop() : this.screen === 'upgrades' ? this.renderUpgrades() : this.screen === 'records' ? this.renderRecords() : this.screen === 'settings' ? this.renderSettings() : this.renderHome();
    this.root.innerHTML = `<div class="menu-wrap">${page}</div>`;
  }

  updateHUD(data) {
    const set = (id, value) => {
      if (value === undefined || value === null) return;
      const el = this.root.querySelector(`#${id}`);
      if (el) el.textContent = value;
    };
    if (Number.isFinite(data.progress)) {
      const bar = this.root.querySelector('#hud-progress');
      if (bar) bar.style.width = `${Math.max(0, Math.min(100, data.progress * 100))}%`;
    }
    if (Number.isFinite(data.nitro)) {
      const nitro = this.root.querySelector('#hud-nitro');
      if (nitro) nitro.style.width = `${Math.max(0, Math.min(100, data.nitro))}%`;
      set('hud-nitro-label', `${Math.round(data.nitro)}%`);
    }
    if (Number.isFinite(data.speed)) set('hud-speed', String(Math.round(data.speed * 3.6)).padStart(3, '0'));
    if (Number.isFinite(data.score)) set('hud-score', money(data.score).padStart(6, '0'));
    set('hud-time', data.timeText);
    set('hud-lap', data.lapText);
    set('hud-track', data.trackName);
    set('hud-mode', data.modeName);
    if (data.bossName !== undefined) set('boss-name', data.bossName || 'BOSS DETECTED');
    if (data.bossPhase !== undefined) set('boss-phase', `PHASE ${String(data.bossPhase || 1).padStart(2, '0')}`);
    if (data.showBoss !== undefined) {
      const boss = this.root.querySelector('#boss-status');
      if (boss) boss.classList.toggle('hidden', !data.showBoss);
    }
    if (Object.hasOwn(data, 'message') && data.message !== undefined) {
      const msg = this.root.querySelector('#hud-message');
      if (msg) {
        if (data.message) { msg.textContent = data.message; msg.classList.add('visible'); }
        else msg.classList.remove('visible');
      }
    }
  }

  setGameData(data) { this.gameData = data; }
  showScreen(screen) { this.setScreen(screen); }
}
