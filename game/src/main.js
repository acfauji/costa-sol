(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;
  const WIDTH = 1280;
  const HEIGHT = 720;

  const canvas = document.getElementById('game');
  const statusEl = document.getElementById('status');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  function fitCanvas() {
    const scale = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
    canvas.style.width = WIDTH * scale + 'px';
    canvas.style.height = HEIGHT * scale + 'px';
  }
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  function parseSeed() {
    const params = new URLSearchParams(window.location.search);
    const raw = parseInt(params.get('seed'), 10);
    if (Number.isFinite(raw)) return raw;
    return C.SEED_DEFAULT;
  }

  function parseShot() {
    const params = new URLSearchParams(window.location.search);
    const shot = (params.get('shot') || '').toLowerCase();
    if (shot === 'cover' || shot === 'city' || shot === 'onfoot' || shot === 'mission') return shot;
    return null;
  }

  function buildWorld(game) {
    game.city = CC.buildCity(game.seed);
    game.player = CC.Player.create(game.safehouse.x + 30, game.safehouse.y + 50);
    game.camera = CC.Camera.create();
    game.camera.x = game.player.x;
    game.camera.y = game.player.y;
    game.camera.targetX = game.player.x;
    game.camera.targetY = game.player.y;
    game.camera.yaw = 0;
    game.camera.zoom = C.CAMERA.footZoom;
    game.vehicles = [];
    game.peds = [];
    game.enemies = [];
    game.policeUnits = [];
    game.particles = [];
    game.tracers = [];
    game.decals = [];
    game.notifications = [];
    game.dialogue = null;
    game.missions = CC.Missions.create(game);
    game.missions.loadState(0, false);
    CC.Traffic.spawnTraffic(game, C.TRAFFIC.count);
    CC.Traffic.spawnParked(game);
    game.peds = CC.People.spawnPeds(game, C.PEDS.count);
  }

  function createGame() {
    const game = {
      seed: parseSeed(),
      rng: null,
      city: null,
      player: null,
      camera: null,
      vehicles: [],
      peds: [],
      enemies: [],
      policeUnits: [],
      particles: [],
      tracers: [],
      decals: [],
      notifications: [],
      dialogue: null,
      missions: null,
      audio: CC.Audio.create(),
      input: null,
      renderer: null,
      safehouse: { x: 760, y: 1360, name: 'THE CORAL ROOM' },
      state: 'menu',
      shotMode: false,
      hudHidden: false,
      godMode: false,
      storyDone: false,
      cash: 120,
      cashFlash: 0,
      wanted: 0,
      evadeTimer: 0,
      policeSpawnCd: 0,
      lastShotTime: -20,
      lastCrimeTime: -20,
      time: 0,
      deathTimer: 0,
      menuOrbit: 0,
      autosaveTimer: 0,
      stats: { kills: 0, peds: 0, missions: 0, takedowns: 0 },
    };
    game.rng = U.makeRng(game.seed);
    buildWorld(game);
    game.input = CC.Input.create(canvas);
    game.renderer = CC.Render.create(canvas);

    game.notify = function (text, kind) {
      const note = { text: text, kind: kind || 'info', time: game.time, life: game.shotMode ? 9999 : 4.4 };
      if (game.notifications.length && game.notifications[game.notifications.length - 1].text === text && game.time - game.notifications[game.notifications.length - 1].time < 2) return;
      game.notifications.push(note);
      while (game.notifications.length > 6) game.notifications.shift();
    };

    game.addCash = function (amount, label) {
      const value = Math.round(amount);
      game.cash = Math.max(0, game.cash + value);
      game.cashFlash = 1;
      if (value < 0) game.notify('-' + U.formatMoney(-value) + ' · ' + (label || 'EXPENSE'), 'bad');
      else if (value >= 50 && label && label !== 'MISSION PAY' && !game.shotMode) game.notify('+' + U.formatMoney(value) + ' · ' + label, 'good');
    };

    game.showDialogue = function (lines, duration) {
      if (!lines || !lines.length) {
        game.dialogue = null;
        return;
      }
      game.dialogue = { lines: lines.slice(), index: 0, lineTime: duration || 5.4, timer: duration || 5.4 };
    };

    game.reportCrime = function (stars, x, y, label) {
      CC.Police.reportCrime(game, stars, x, y, label);
    };

    game.nearPedestrian = function (x, y, range) {
      return CC.Player.nearPedestrian(game, x, y, range);
    };

    game.nearPolice = function (x, y, range) {
      return CC.Police.nearPolice(game, x, y, range);
    };

    game.damagePlayer = function (amount, source) {
      CC.Player.damage(game, amount, source);
    };

    game.onVehicleDisabled = function (car) {
      if (car.police) {
        CC.Police.onVehicleDisabled(game, car);
      } else {
        game.notify('VEHICLE DISABLED', 'bad');
        if (game.audio) game.audio.explosionSmall();
      }
    };

    game.saveGame = function (silent) {
      if (game.shotMode) return false;
      const ok = CC.Save.write(game);
      if (ok && !silent) game.notify('GAME SAVED', 'good');
      return ok;
    };

    return game;
  }

  const game = createGame();
  window.__COSTA_SOL__ = game;
  let menu = null;

  function announce(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function initAudio() {
    if (game.audio) game.audio.init();
  }

  function toggleSound() {
    initAudio();
    const muted = game.audio.toggleMute();
    if (menu) menu.showToast(muted ? 'SOUND OFF' : 'SOUND ON');
    game.notify(muted ? 'AUDIO MUTED' : 'AUDIO ON', 'info');
  }

  function advanceDialogue() {
    const d = game.dialogue;
    if (!d) return;
    if (d.index < d.lines.length - 1) {
      d.index += 1;
      d.lineTime = 5.2;
      if (game.audio) game.audio.click();
    } else {
      game.dialogue = null;
    }
  }

  function openPause() {
    if (game.state !== 'play') return;
    game.state = 'pause';
    game.camera.override = null;
    menu.openPause();
    announce('Paused.');
  }

  function resumeGame() {
    if (game.state !== 'pause') return;
    game.state = 'play';
    game.camera.override = null;
    announce('Playing COSTA SOL.');
  }

  function menuCamera() {
    const camera = game.camera;
    const yaw = 0.15 + Math.sin(game.menuOrbit) * 0.055;
    camera.x = 2030;
    camera.y = 2020;
    camera.yaw = yaw;
    camera.zoom = 0.285;
    camera.shake = 0;
    camera.shakeX = 0;
    camera.shakeY = 0;
    camera.override = { x: 2030, y: 2020, yaw: yaw, zoom: 0.285 };
  }

  function backToMenu() {
    game.state = 'menu';
    game.hudHidden = false;
    game.shotMode = false;
    game.dialogue = null;
    game.notifications.length = 0;
    game.wanted = 0;
    game.evadeTimer = 0;
    CC.Police.clearUnits(game);
    menu.openMain();
    menuCamera();
    announce('COSTA SOL. Main menu.');
  }

  function startNew(mode) {
    initAudio();
    game.seed = game.seed || C.SEED_DEFAULT;
    game.time = 0;
    game.rng = U.makeRng(game.seed + (mode === 'free' ? 7 : 0));
    game.storyDone = mode === 'free';
    buildWorld(game);
    game.cash = mode === 'free' ? 900 : 120;
    game.cashFlash = 0;
    game.wanted = 0;
    game.evadeTimer = 0;
    game.policeSpawnCd = 0;
    game.deathTimer = 0;
    game.lastShotTime = -20;
    game.stats = { kills: 0, peds: 0, missions: 0, takedowns: 0 };
    game.autosaveTimer = 0;
    game.hudHidden = false;
    game.shotMode = false;
    game.state = 'play';
    game.camera.override = null;
    game.camera.followCar = false;
    game.dialogue = null;
    game.notifications.length = 0;
    if (mode === 'free') {
      game.missions.loadState(5, true);
      game.player.weapon = 'smg';
      game.player.armor = 70;
      game.notify('FREE ROAM · COSTA SOL IS YOURS', 'gold');
    } else {
      game.missions.loadState(0, false);
      game.notify('NEW CAREER · RICO VELA IS BACK IN TOWN', 'mission');
    }
    announce('Playing COSTA SOL. ' + (mode === 'free' ? 'Free roam.' : 'Story mode.'));
  }

  function continueCareer() {
    const data = CC.Save.read();
    if (!data) {
      menu.showToast('NO SAVE FOUND');
      return;
    }
    initAudio();
    const ok = CC.Save.apply(game, data);
    if (!ok) {
      menu.showToast('SAVE COULD NOT BE READ');
      return;
    }
    game.hudHidden = false;
    game.shotMode = false;
    game.state = 'play';
    game.camera.override = null;
    game.notifications.length = 0;
    announce('Save loaded. Playing COSTA SOL.');
  }

  const callbacks = {
    startStory: function () {
      startNew('story');
    },
    freeRoam: function () {
      startNew('free');
    },
    continueCareer: continueCareer,
    toggleSound: toggleSound,
    resume: resumeGame,
    save: function () {
      return game.saveGame(true);
    },
    load: function () {
      const data = CC.Save.read();
      if (!data) {
        menu.showToast('NO SAVE FOUND');
        return;
      }
      initAudio();
      if (CC.Save.apply(game, data)) {
        game.hudHidden = false;
        game.shotMode = false;
        game.camera.override = null;
        game.notifications.length = 0;
        announce('Save loaded. Playing COSTA SOL.');
      }
    },
    restart: function () {
      startNew('story');
    },
    quit: backToMenu,
  };

  menu = CC.Menu.create(game, callbacks);

  function toggleWeapon() {
    const player = game.player;
    player.weapon = player.weapon === 'pistol' ? 'smg' : 'pistol';
    const weapon = C.WEAPONS[player.weapon];
    game.notify(weapon.name.toUpperCase() + ' EQUIPPED', 'info');
    if (game.audio) game.audio.click();
  }

  function handleActions() {
    const input = game.input;
    const player = game.player;
    if (player.dead) return;
    if (input.pressed('Enter') || input.pressed('NumpadEnter')) {
      if (game.dialogue) {
        advanceDialogue();
        return;
      }
    }
    if (input.pressed('KeyE') && player.enterCd <= 0) {
      CC.Player.interact(game);
    }
    if (input.pressed('KeyF')) CC.Combat.melee(game);
    if (input.pressed('KeyQ')) toggleWeapon();
    if (input.pressed('KeyH') && player.mode === 'car' && player.car) {
      if (game.time > (player.car.horn || 0)) {
        player.car.horn = game.time + 0.8;
        if (game.audio) game.audio.horn();
        CC.People.panicAt(game, player.car.x, player.car.y, 210, 1.4);
      }
    }
    if (input.pressed('Tab') || input.pressed('KeyP') || input.pressed('Escape')) openPause();
  }

  function updateDialogue(dt) {
    const d = game.dialogue;
    if (!d) return;
    d.lineTime -= dt;
    d.timer = Math.max(0, d.lineTime);
    if (d.lineTime <= 0) advanceDialogue();
  }

  function updateVehicles(dt) {
    const player = game.player;
    for (let i = game.vehicles.length - 1; i >= 0; i -= 1) {
      const car = game.vehicles[i];
      if (car.remove) {
        game.vehicles.splice(i, 1);
        continue;
      }
      car.damageFlash = Math.max(0, car.damageFlash - dt * 3);
      if (car.disabled) {
        if (!car.disabledAt) car.disabledAt = game.time;
        if (!car.exploded && !car.police && game.time - car.disabledAt > 2.6) {
          car.exploded = true;
          CC.Combat.explode(game, car.x, car.y, 92, car === (player.mode === 'car' ? player.car : null));
        }
        if (Math.random() < dt * (car.exploded ? 8 : 5)) {
          CC.Combat.spawnParticles(game, car.exploded ? 'flame' : 'smoke', car.x + (Math.random() - 0.5) * 30, car.y + (Math.random() - 0.5) * 30, 1, {
            speed: 14,
            life: car.exploded ? 0.6 : 1.4,
            size: car.exploded ? 9 : 8,
            color: car.exploded ? '#ff9b3f' : 'rgba(40,40,40,0.55)',
          });
        }
        if (!car.police && !car.mission && game.time - car.disabledAt > 32 && car !== player.car) car.remove = true;
      }
    }
  }

  function vehicleContacts(dt) {
    const player = game.player;
    if (player.mode === 'car' && player.car) {
      const car = player.car;
      const speed = Math.abs(car.speed);
      if (speed > 46) {
        const reach = car.spec.wid * 0.62 + 10;
        for (let i = 0; i < game.peds.length; i += 1) {
          const ped = game.peds[i];
          if (ped.dead) continue;
          if (U.dist(car.x, car.y, ped.x, ped.y) < reach) {
            CC.Combat.killPed(game, ped, 'car');
            car.speed *= 0.88;
            game.camera.shake = Math.max(game.camera.shake, 0.35);
            if (game.audio) game.audio.thud();
          }
        }
        for (let i = 0; i < game.enemies.length; i += 1) {
          const enemy = game.enemies[i];
          if (enemy.dead) continue;
          if (U.dist(car.x, car.y, enemy.x, enemy.y) < reach + 2) {
            CC.Combat.damageEnemy(game, enemy, 55 + speed * 0.18, 'player');
            enemy.x += Math.cos(car.angle) * 18;
            enemy.y += Math.sin(car.angle) * 18;
            car.speed *= 0.9;
          }
        }
      }
    } else if (!player.dead) {
      for (let i = 0; i < game.vehicles.length; i += 1) {
        const car = game.vehicles[i];
        if (car.disabled || Math.abs(car.speed) < 42) continue;
        if (U.dist(player.x, player.y, car.x, car.y) < car.spec.wid * 0.62 + 12) {
          game.damagePlayer(16 + Math.abs(car.speed) * 0.08, car);
          car.speed *= 0.45;
          game.camera.shake = Math.max(game.camera.shake, 0.4);
          if (game.audio) game.audio.thud();
          const push = Math.atan2(player.y - car.y, player.x - car.x);
          player.x += Math.cos(push) * 18;
          player.y += Math.sin(push) * 18;
        }
      }
    }
  }

  function cleanup(game) {
    if (game.decals.length > 170) game.decals.splice(0, game.decals.length - 170);
    if (game.particles.length > 520) game.particles.splice(0, game.particles.length - 520);
    for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
      const e = game.enemies[i];
      if (e.dead && e.deadTimer > 15) game.enemies.splice(i, 1);
      else if (e.retreat && U.dist(game.player.x, game.player.y, e.x, e.y) > 620) game.enemies.splice(i, 1);
    }
    for (let i = game.peds.length - 1; i >= 0; i -= 1) {
      const p = game.peds[i];
      if (p.dead && p.deadTimer > 30) game.peds.splice(i, 1);
    }
  }

  function updatePlay(dt) {
    game.time += dt;
    game.cashFlash = Math.max(0, game.cashFlash - dt * 2.4);
    game.autosaveTimer += dt;
    updateDialogue(dt);
    handleActions();
    if (game.state !== 'play') return;
    CC.Player.update(game, dt);
    if (game.state === 'dead') {
      CC.Combat.updateEffects(game, dt);
      CC.Camera.update(game.camera, game, dt);
      return;
    }
    vehicleContacts(dt);
    CC.Traffic.update(game, dt);
    CC.People.updatePeds(game, dt);
    CC.People.updateEnemies(game, dt);
    CC.Police.update(game, dt);
    if (CC.Vehicles && CC.Vehicles.resolveVehicleContacts) CC.Vehicles.resolveVehicleContacts(game);
    game.missions.update(dt);
    updateVehicles(dt);
    CC.Combat.updateEffects(game, dt);
    CC.Camera.update(game.camera, game, dt);
    game.audio.update(game, dt);
    cleanup(game);
    if (game.autosaveTimer > 75) {
      game.autosaveTimer = 0;
      game.saveGame(true);
    }
  }

  function updateDead(dt) {
    game.time += dt;
    game.deathTimer += dt;
    CC.Combat.updateEffects(game, dt);
    CC.Traffic.update(game, dt);
    CC.People.updatePeds(game, dt);
    if (game.deathTimer >= 4.2) {
      CC.Player.respawn(game);
      announce('Playing COSTA SOL.');
    }
  }

  function updateMenu(dt) {
    game.time += dt;
    game.menuOrbit += dt * 0.05;
    menuCamera();
    menu.update(dt);
  }

  function tick(dt) {
    const input = game.input;
    input.sync();
    if (input.pressed('KeyM')) toggleSound();
    if (game.state === 'menu') updateMenu(dt);
    else if (game.state === 'pause') {
      game.time += dt;
      menu.update(dt);
    } else if (game.state === 'dead') updateDead(dt);
    else if (game.state === 'play') updatePlay(dt);
    input.endFrame();
  }

  function drawFrame() {
    game.renderer.draw(game);
    if (game.state === 'menu' || game.state === 'pause') menu.draw(game.renderer.ctx);
  }

  const shot = parseShot();
  if (shot) {
    game.shotMode = true;
    game.state = 'play';
    CC.Shots.stage(shot, game);
    game.hudHidden = shot === 'city';
    game.renderer.draw(game);
    window.__shotReady = true;
    drawFrame();
  } else {
    game.state = 'menu';
    menu.openMain();
    menuCamera();
    game.renderer.draw(game);
    announce('COSTA SOL. Main menu.');
  }

  let last = performance.now();
  let accumulator = 0;
  function frame(now) {
    const raw = Math.min(0.06, Math.max(0, (now - last) / 1000));
    last = now;
    if (game.shotMode) {
      game.time += raw;
      drawFrame();
      requestAnimationFrame(frame);
      return;
    }
    accumulator += raw;
    let steps = 0;
    while (accumulator >= C.STEP && steps < 5) {
      tick(C.STEP);
      accumulator -= C.STEP;
      steps += 1;
    }
    if (steps === 5) accumulator = 0;
    drawFrame();
    requestAnimationFrame(frame);
  }

  window.addEventListener('keydown', initAudio, { once: true });
  window.addEventListener('pointerdown', initAudio, { once: true });
  window.addEventListener('focus', function () {
    last = performance.now();
  });

  requestAnimationFrame(frame);
})();
