(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;
  const M = C.MAP;

  const CRUISER = { name: 'CSPD Cruiser', len: 74, wid: 32, max: 252, accel: 218, turn: 2.5, mass: 1.2, colors: ['#e9e1cd'], style: 'police' };

  function activeUnits(game) {
    return game.policeUnits.filter(function (car) {
      return !car.disabled;
    });
  }

  function spawnUnit(game, forceNear) {
    const player = game.player;
    const px = player.mode === 'car' && player.car ? player.car.x : player.x;
    const py = player.mode === 'car' && player.car ? player.car.y : player.y;
    const city = game.city;
    const rng = game.rng;
    let best = null;
    let bestScore = -Infinity;
    for (let n = 0; n < city.nodeList.length; n += 1) {
      const node = city.nodeList[n];
      const d = U.dist(px, py, node.x, node.y);
      if (d < 340 || d > 1250) continue;
      let score = 0;
      if (forceNear) score += 300 - Math.abs(d - 520);
      else score += 200 - Math.abs(d - 800);
      score += rng() * 160;
      if (score > bestScore) {
        bestScore = score;
        best = node;
      }
    }
    if (!best) best = city.randomNode(150, 150, 2400, 2400);
    const car = CC.Vehicles.create(1, best.x + 24, best.y + 24, Math.atan2(py - best.y, px - best.x), {
      police: true,
      hp: C.WANTED.policeHealth,
    });
    car.spec = CRUISER;
    car.name = CRUISER.name;
    car.color = '#e9e1cd';
    car.police = true;
    car.siren = true;
    car.hp = C.WANTED.policeHealth;
    car.maxHp = C.WANTED.policeHealth;
    car.ai = { chase: true, stuck: 0, reverse: 0, shootCd: 0.8 + rng() * 0.6, spawnTime: game.time };
    game.vehicles.push(car);
    game.policeUnits.push(car);
    if (game.audio) game.audio.sirenBlip();
    return car;
  }

  function clearUnits(game) {
    for (let i = 0; i < game.policeUnits.length; i += 1) {
      const car = game.policeUnits[i];
      if (!car.disabled) {
        car.retire = true;
      }
    }
    game.policeUnits.length = 0;
    for (let i = 0; i < game.enemies.length; i += 1) {
      const e = game.enemies[i];
      if (e.kind === 'cop' && !e.dead) e.retreat = true;
    }
  }

  function reportCrime(game, stars, x, y, label) {
    if (stars <= 0) return;
    const before = game.wanted;
    game.wanted = Math.min(C.WANTED.max, game.wanted + stars);
    game.evadeTimer = 0;
    game.lastCrimeTime = game.time;
    if (game.wanted > before) {
      if (game.audio) game.audio.sirenBlip();
      game.notify('CRIME · ' + (label || 'DISTURBING THE PEACE'), 'crime');
      if (game.wanted === C.WANTED.max) game.notify('MAXIMUM WANTED LEVEL', 'bad');
      if (before === 0) game.policeSpawnCd = 0.4;
    }
  }

  function onVehicleDisabled(game, car) {
    if (!car.police) return;
    car.siren = false;
    car.retire = false;
    car.wrecked = true;
    if (game.stats) game.stats.takedowns += 1;
    game.addCash(75, 'CRUISER DISABLED');
    game.notify('POLICE CRUISER DISABLED', 'good');
    if (game.audio) game.audio.explosionSmall();
    const cop = CC.People.createEnemy(car.x + Math.cos(car.angle + Math.PI / 2) * 28, car.y + Math.sin(car.angle + Math.PI / 2) * 28, { cop: true, alert: true });
    game.enemies.push(cop);
    CC.Combat.spawnParticles(game, 'smoke', car.x, car.y, 10, { speed: 30, life: 1.4, size: 12, color: 'rgba(40,40,40,0.5)' });
  }

  function nearPolice(game, x, y, range) {
    const r2 = range * range;
    for (let i = 0; i < game.policeUnits.length; i += 1) {
      const car = game.policeUnits[i];
      if (!car.disabled && U.dist2(x, y, car.x, car.y) < r2) return true;
    }
    for (let i = 0; i < game.enemies.length; i += 1) {
      const e = game.enemies[i];
      if (e.kind === 'cop' && !e.dead && U.dist2(x, y, e.x, e.y) < r2) return true;
    }
    return false;
  }

  function updateUnit(game, car, dt) {
    if (car.disabled) return;
    const player = game.player;
    const px = player.mode === 'car' && player.car ? player.car.x : player.x;
    const py = player.mode === 'car' && player.car ? player.car.y : player.y;
    const d = U.dist(car.x, car.y, px, py);
    const targetAngle = Math.atan2(py - car.y, px - car.x);
    let diff = U.angleWrap(targetAngle - car.angle);
    const ai = car.ai;
    ai.stuck = (car.speed < 18 && d > 90) ? ai.stuck + dt : 0;
    if (ai.reverse > 0) ai.reverse -= dt;
    else if (ai.stuck > 1.1) {
      ai.reverse = 0.9;
      ai.stuck = 0;
    }
    const controls = { throttle: 1, steer: U.clamp(diff * 1.8, -1, 1), handbrake: false };
    if (ai.reverse > 0) {
      controls.throttle = -1;
      controls.steer = -U.clamp(diff * 1.8, -1, 1);
    } else if (d < 46 && Math.abs(car.speed) > 90) {
      controls.throttle = -0.8;
    } else if (Math.abs(diff) > 1.15 && Math.abs(car.speed) > 130) {
      controls.throttle = 0.2;
    }
    CC.Vehicles.stepPhysics(game, car, dt, controls);
    car.siren = game.wanted > 0;
    car.sirenPhase += dt * 7;
    ai.shootCd -= dt;
    if (ai.shootCd <= 0 && d < 470 && game.wanted > 0) {
      ai.shootCd = 1.2 + Math.random() * 0.9;
      CC.Combat.enemyFire(game, car, d);
    }
    if (car.y < 20 || car.y > M.land - 20 || car.x < 20 || car.x > M.land - 20) {
      ccClamp(car);
    }
  }

  function ccClamp(car) {
    car.x = U.clamp(car.x, 24, M.land - 24);
    car.y = U.clamp(car.y, 24, M.land - 24);
  }

  function update(game, dt) {
    if (game.wanted > 0) {
      game.policeSpawnCd -= dt;
      const units = activeUnits(game);
      const target = Math.min(game.wanted + 1, 6);
      if (units.length < target && game.policeSpawnCd <= 0) {
        spawnUnit(game, units.length === 0);
        game.policeSpawnCd = units.length === 0 ? 1.2 : 3.4;
      }
      let close = false;
      for (let i = 0; i < game.policeUnits.length; i += 1) {
        const car = game.policeUnits[i];
        if (car.disabled) continue;
        if (U.dist(playerX(game), playerY(game), car.x, car.y) < 760) close = true;
      }
      for (let i = 0; i < game.enemies.length; i += 1) {
        const e = game.enemies[i];
        if (e.kind === 'cop' && !e.dead && U.dist(playerX(game), playerY(game), e.x, e.y) < 620) close = true;
      }
      if (!close && game.time - game.lastShotTime > 1.5) game.evadeTimer += dt;
      else game.evadeTimer = 0;
      if (game.evadeTimer > C.WANTED.decayAfter) {
        game.wanted -= 1;
        game.evadeTimer = 0;
        if (game.wanted < 0) game.wanted = 0;
        game.notify(game.wanted > 0 ? 'LOST THE HEAT · ' + game.wanted + ' STAR' + (game.wanted === 1 ? '' : 'S') : 'YOU ARE CLEAN', game.wanted > 0 ? 'good' : 'good');
        if (game.audio) game.audio.missionChime();
        if (game.wanted === 0) clearUnits(game);
      }
    } else if (game.policeUnits.length > 0) {
      clearUnits(game);
    }
    for (let i = 0; i < game.policeUnits.length; i += 1) updateUnit(game, game.policeUnits[i], dt);
    for (let i = game.policeUnits.length - 1; i >= 0; i -= 1) {
      const car = game.policeUnits[i];
      if (car.disabled && game.time - (car.disabledAt || 0) > 16) {
        car.remove = true;
        game.policeUnits.splice(i, 1);
      }
      if (car.retire && U.dist(playerX(game), playerY(game), car.x, car.y) > 900) {
        car.remove = true;
        game.policeUnits.splice(i, 1);
      }
    }
    for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
      const e = game.enemies[i];
      if (e.retreat && U.dist(playerX(game), playerY(game), e.x, e.y) > 500) game.enemies.splice(i, 1);
    }
  }

  function playerX(game) {
    const p = game.player;
    return p.mode === 'car' && p.car ? p.car.x : p.x;
  }

  function playerY(game) {
    const p = game.player;
    return p.mode === 'car' && p.car ? p.car.y : p.y;
  }

  CC.Police = {
    CRUISER: CRUISER,
    spawnUnit: spawnUnit,
    clearUnits: clearUnits,
    reportCrime: reportCrime,
    onVehicleDisabled: onVehicleDisabled,
    nearPolice: nearPolice,
    update: update,
    playerX: playerX,
    playerY: playerY,
  };
})();
