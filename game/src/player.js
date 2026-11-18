(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;

  function createPlayer(x, y) {
    return {
      x: x,
      y: y,
      angle: 0,
      aim: 0,
      health: C.PLAYER.health,
      armor: C.PLAYER.armor,
      maxHealth: C.PLAYER.health,
      mode: 'foot',
      car: null,
      weapon: 'pistol',
      fireTimer: 0,
      punchTimer: 0,
      punchAnim: 0,
      muzzle: 0,
      dead: false,
      deadTimer: 0,
      hurtFlash: 0,
      stepTimer: 0,
      walkPhase: 0,
      sprinting: false,
      jumping: false,
      jumpZ: 0,
      jumpV: 0,
      shotCrimeCd: 0,
      radius: C.PLAYER.radius,
      enterCd: 0,
      inCarTime: 0,
    };
  }

  function footX(player) {
    return player.mode === 'car' && player.car ? player.car.x : player.x;
  }

  function footY(player) {
    return player.mode === 'car' && player.car ? player.car.y : player.y;
  }

  function damagePlayer(game, amount, source) {
    const player = game.player;
    if (player.dead || game.godMode) return;
    let remaining = amount;
    if (player.armor > 0) {
      const absorbed = Math.min(player.armor, remaining * 0.62);
      player.armor -= absorbed;
      remaining -= absorbed;
    }
    player.health -= remaining;
    player.hurtFlash = 1;
    game.camera.shake = Math.max(game.camera.shake, 0.32);
    if (game.audio) game.audio.hurt();
    if (player.health <= 0) {
      player.health = 0;
      killPlayer(game, source);
    }
  }

  function killPlayer(game, source) {
    const player = game.player;
    if (player.dead) return;
    player.dead = true;
    player.deadTimer = 0;
    player.health = 0;
    if (player.mode === 'car' && player.car) {
      player.car.occupied = false;
      player.car.speed = 0;
    }
    player.mode = 'foot';
    player.car = null;
    game.wanted = 0;
    CC.Police.clearUnits(game);
    game.notify('YOU WERE FLATTENED', 'bad');
    game.state = 'dead';
    game.deathTimer = 0;
    if (game.audio) game.audio.death();
    if (game.missions) game.missions.onPlayerDeath(game);
  }

  function respawn(game) {
    const player = game.player;
    const safe = game.safehouse;
    player.health = player.maxHealth;
    player.armor = 25;
    player.dead = false;
    player.deadTimer = 0;
    player.mode = 'foot';
    player.car = null;
    player.x = safe.x - 55;
    player.y = safe.y + 40;
    player.angle = 0;
    player.aim = 0;
    player.jumpZ = 0;
    player.jumping = false;
    game.addCash(-C.ECONOMY.deathCost, 'HOSPITAL BILL');
    game.wanted = 0;
    game.state = 'play';
    game.deathTimer = 0;
    game.camera.x = player.x;
    game.camera.y = player.y;
    game.notify('PATCHED UP AT THE SAFEHOUSE', 'good');
  }

  function blockByCars(game, player) {
    for (let i = 0; i < game.vehicles.length; i += 1) {
      const car = game.vehicles[i];
      if (car === player.car) continue;
      const r = car.spec.wid * 0.6 + player.radius - 3;
      const d = U.dist(player.x, player.y, car.x, car.y);
      if (d < r && d > 0.001) {
        const push = (r - d) / d;
        const nx = (player.x - car.x) * push;
        const ny = (player.y - car.y) * push;
        if (!game.city.solidAt(player.x + nx, player.y + ny, player.radius)) {
          player.x += nx;
          player.y += ny;
        }
      }
    }
  }

  function updateFoot(game, dt) {
    const player = game.player;
    const input = game.input;
    const camera = game.camera;
    const forward = (input.down('KeyW') || input.down('ArrowUp') ? 1 : 0) - (input.down('KeyS') || input.down('ArrowDown') ? 1 : 0);
    const strafe = (input.down('KeyD') || input.down('ArrowRight') ? 1 : 0) - (input.down('KeyA') || input.down('ArrowLeft') ? 1 : 0);
    player.sprinting = input.down('ShiftLeft') || input.down('ShiftRight');
    const speed = player.sprinting ? C.PLAYER.sprint : C.PLAYER.speed;
    let mx = 0;
    let my = 0;
    if (forward !== 0 || strafe !== 0) {
      const fwd = U.rotate(0, -1, camera.yaw);
      const right = U.rotate(1, 0, camera.yaw);
      mx = fwd.x * forward + right.x * strafe;
      my = fwd.y * forward + right.y * strafe;
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
      const step = speed * dt;
      const hit = game.city.moveCircle(player, mx * step, my * step, player.radius);
      player.walkPhase += dt * (player.sprinting ? 13 : 8);
      player.stepTimer -= dt;
      if (player.stepTimer <= 0) {
        player.stepTimer = player.sprinting ? 0.15 : 0.25;
        CC.Combat.spawnParticles(game, 'dust', player.x, player.y + 6, 1, { speed: 10, life: 0.32, size: 4, color: 'rgba(210,196,160,0.5)' });
      }
      if (hit.hitX || hit.hitY) player.walkPhase += dt * 3;
    }
    if (input.pressed('Space') && !player.jumping) {
      player.jumping = true;
      player.jumpV = 250;
    }
    if (player.jumping) {
      player.jumpZ += player.jumpV * dt;
      player.jumpV -= 780 * dt;
      if (player.jumpZ <= 0) {
        player.jumpZ = 0;
        player.jumping = false;
      }
    }
    blockByCars(game, player);

    const mouse = CC.Camera.screenToWorld(camera, input.mouseX, input.mouseY);
    player.aim = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    player.angle = U.angleDamp(player.angle, player.aim, 14, dt);
    if (input.down('Mouse0')) CC.Combat.playerFire(game);
    player.fireTimer = Math.max(0, player.fireTimer - dt);
    player.punchTimer = Math.max(0, player.punchTimer - dt);
    player.punchAnim = Math.max(0, player.punchAnim - dt);
    player.muzzle = Math.max(0, player.muzzle - dt);
    player.enterCd = Math.max(0, player.enterCd - dt);
  }

  function updateCar(game, dt) {
    const player = game.player;
    const car = player.car;
    if (!car) {
      player.mode = 'foot';
      return;
    }
    const input = game.input;
    const throttle = (input.down('KeyW') || input.down('ArrowUp') ? 1 : 0) - (input.down('KeyS') || input.down('ArrowDown') ? 1 : 0);
    const steer = (input.down('KeyD') || input.down('ArrowRight') ? 1 : 0) - (input.down('KeyA') || input.down('ArrowLeft') ? 1 : 0);
    const controls = {
      throttle: throttle,
      steer: steer,
      handbrake: input.down('Space'),
    };
    if (!car.disabled) {
      CC.Vehicles.stepPhysics(game, car, dt, controls);
    } else {
      car.speed = U.damp(car.speed, 0, 3, dt);
      car.x += Math.cos(car.angle) * car.speed * dt;
      car.y += Math.sin(car.angle) * car.speed * dt;
    }
    player.x = car.x;
    player.y = car.y;
    player.angle = car.angle;
    player.aim = car.angle;
    player.inCarTime += dt;
    player.fireTimer = Math.max(0, player.fireTimer - dt);
    if (car.disabled && game.time > (car.ejectAt || 0)) {
      car.ejectAt = game.time + 99;
      exitCar(game, true);
      game.notify('THE CAR IS DONE — GET OUT', 'bad');
    }
    if (Math.abs(car.speed) > 90 && Math.random() < dt * 20) {
      CC.Combat.spawnParticles(game, 'dust', car.x - Math.cos(car.angle) * 20, car.y - Math.sin(car.angle) * 20, 1, { speed: 12, life: 0.4, size: 5, color: 'rgba(210,196,160,0.35)' });
    }
    if ((Math.abs(car.speed) > 120 && Math.abs(steer) > 0) || input.down('Space')) {
      if (Math.random() < dt * 24) {
        CC.Combat.addDecal(game, 'skid', car.x - Math.cos(car.angle) * 18, car.y - Math.sin(car.angle) * 18, car.angle, 8, 'rgba(24,22,20,0.35)');
      }
    }
  }

  function enterCar(game, car, silent) {
    const player = game.player;
    if (!car || player.mode === 'car' || player.dead) return false;
    if (U.dist(player.x, player.y, car.x, car.y) > 92) return false;
    player.mode = 'car';
    player.car = car;
    player.inCarTime = 0;
    car.occupied = true;
    car.traffic = false;
    car.parked = false;
    car.ai = null;
    car.speed *= 0.5;
    car.ejectAt = 0;
    game.camera.followCar = true;
    if (!silent) {
      if (car.police) game.reportCrime(2, car.x, car.y, 'STEALING A POLICE CRUISER');
      else if (!car.mission && !car.stolen) {
        car.stolen = true;
        game.reportCrime(1, car.x, car.y, 'GRAND THEFT AUTO');
        game.addCash(0, null);
      }
      if (game.audio) game.audio.door();
      game.notify('STOLE ' + car.name.toUpperCase(), 'info');
      if (game.missions) game.missions.notifyCarEntered(game, car);
    }
    return true;
  }

  function exitCar(game, force) {
    const player = game.player;
    const car = player.car;
    if (!car) return;
    const right = { x: -Math.sin(car.angle), y: Math.cos(car.angle) };
    let ox = car.x + right.x * (car.spec.wid / 2 + 22);
    let oy = car.y + right.y * (car.spec.wid / 2 + 22);
    let side = 1;
    if (game.city.solidAt(ox, oy, player.radius)) {
      ox = car.x - right.x * (car.spec.wid / 2 + 22);
      oy = car.y - right.y * (car.spec.wid / 2 + 22);
      side = -1;
    }
    if (game.city.solidAt(ox, oy, player.radius)) {
      ox = car.x;
      oy = car.y + 30;
    }
    car.occupied = false;
    car.speed *= 0.2;
    player.mode = 'foot';
    player.car = null;
    player.x = ox;
    player.y = oy;
    player.angle = car.angle;
    player.aim = car.angle;
    player.enterCd = 0.35;
    game.camera.followCar = false;
    if (!force && game.audio) game.audio.door();
  }

  function interact(game) {
    const player = game.player;
    if (player.dead) return;
    if (player.mode === 'car') {
      exitCar(game, false);
      return;
    }
    const safe = game.safehouse;
    if (U.dist(player.x, player.y, safe.x, safe.y) < 70) {
      healAtSafehouse(game);
      return;
    }
    const car = CC.Vehicles.nearest(game, player.x, player.y, 90, { allowDisabled: false });
    if (car) enterCar(game, car, false);
  }

  function healAtSafehouse(game) {
    const player = game.player;
    if (player.health >= player.maxHealth && player.armor >= 100) {
      game.notify('SAFEHOUSE · YOU ARE ALREADY PATCHED UP', 'info');
      return;
    }
    if (game.cash < C.ECONOMY.healCost) {
      game.notify('SAFEHOUSE · NEED ' + U.formatMoney(C.ECONOMY.healCost), 'bad');
      return;
    }
    game.addCash(-C.ECONOMY.healCost, 'SAFEHOUSE PATCH-UP');
    player.health = player.maxHealth;
    player.armor = 100;
    if (game.audio) game.audio.pickup();
    game.notify('PATCHED UP · HEALTH AND ARMOR FULL', 'good');
    if (game.saveGame) game.saveGame(true);
  }

  function nearPedestrian(game, x, y, range) {
    const r2 = range * range;
    for (let i = 0; i < game.peds.length; i += 1) {
      const p = game.peds[i];
      if (!p.dead && U.dist2(x, y, p.x, p.y) < r2) return true;
    }
    return false;
  }

  function interactionLabel(game) {
    const player = game.player;
    if (player.mode === 'car') return 'E  EXIT VEHICLE   ·   H  HORN';
    const safe = game.safehouse;
    if (U.dist(player.x, player.y, safe.x, safe.y) < 70) return 'E  SAFEHOUSE · HEAL ' + U.formatMoney(C.ECONOMY.healCost);
    const car = CC.Vehicles.nearest(game, player.x, player.y, 90, { allowDisabled: false });
    if (car) return 'E  STEAL ' + car.name.toUpperCase();
    return '';
  }

  function update(game, dt) {
    const player = game.player;
    player.hurtFlash = Math.max(0, player.hurtFlash - dt * 3.5);
    if (player.dead) {
      player.deadTimer += dt;
      return;
    }
    if (player.mode === 'car') updateCar(game, dt);
    else updateFoot(game, dt);
  }

  CC.Player = {
    create: createPlayer,
    update: update,
    updateFoot: updateFoot,
    updateCar: updateCar,
    enterCar: enterCar,
    exitCar: exitCar,
    interact: interact,
    damage: damagePlayer,
    kill: killPlayer,
    respawn: respawn,
    healAtSafehouse: healAtSafehouse,
    nearPedestrian: nearPedestrian,
    interactionLabel: interactionLabel,
    footX: footX,
    footY: footY,
  };
})();
