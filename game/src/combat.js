(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;

  function addTracer(game, x1, y1, x2, y2, color, width) {
    game.tracers.push({ x1: x1, y1: y1, x2: x2, y2: y2, life: 0.09, max: 0.09, color: color || '#ffe7a8', width: width || 2 });
  }

  function spawnParticles(game, type, x, y, count, options) {
    const opts = options || {};
    for (let i = 0; i < count; i += 1) {
      const angle = opts.angle !== undefined ? opts.angle + (Math.random() - 0.5) * (opts.spread || 1.6) : Math.random() * U.TAU;
      const speed = (opts.speed || 40) * (0.35 + Math.random() * 0.9);
      const life = (opts.life || 0.6) * (0.6 + Math.random() * 0.7);
      game.particles.push({
        type: type,
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life,
        max: life,
        size: (opts.size || 4) * (0.6 + Math.random() * 0.9),
        color: opts.color || '#ffffff',
        gravity: opts.gravity || 0,
      });
    }
  }

  function addDecal(game, type, x, y, angle, size, color) {
    game.decals.push({ type: type, x: x, y: y, angle: angle || 0, size: size || 20, color: color || '#260f0f', life: 120 });
    if (game.decals.length > 160) game.decals.shift();
  }

  function rayWallDistance(game, x, y, dx, dy, range) {
    const step = 12;
    for (let d = step; d <= range; d += step) {
      if (game.city.solidAt(x + dx * d, y + dy * d, 2)) return d;
    }
    return range;
  }

  function rayHit(game, x, y, dx, dy, range, source) {
    let wall = rayWallDistance(game, x, y, dx, dy, range);
    let best = null;
    let bestDist = wall;
    const player = game.player;
    const targets = [];

    for (let i = 0; i < game.enemies.length; i += 1) {
      const e = game.enemies[i];
      if (!e.dead) targets.push({ kind: 'enemy', ref: e, x: e.x, y: e.y, r: 13 });
    }
    for (let i = 0; i < game.peds.length; i += 1) {
      const p = game.peds[i];
      if (!p.dead) targets.push({ kind: 'ped', ref: p, x: p.x, y: p.y, r: 12 });
    }
    for (let i = 0; i < game.vehicles.length; i += 1) {
      const v = game.vehicles[i];
      if (v === source || (player.mode === 'car' && v === player.car)) continue;
      targets.push({ kind: 'vehicle', ref: v, x: v.x, y: v.y, r: v.spec.wid * 0.72 + 4 });
    }
    if (source !== 'player' && player.mode === 'foot') {
      targets.push({ kind: 'player', ref: player, x: player.x, y: player.y, r: 12 });
    } else if (source !== 'player' && player.mode === 'car' && player.car) {
      targets.push({ kind: 'playerCar', ref: player.car, x: player.car.x, y: player.car.y, r: player.car.spec.wid * 0.7 + 3 });
    }

    for (let i = 0; i < targets.length; i += 1) {
      const t = targets[i];
      const ox = t.x - x;
      const oy = t.y - y;
      const forward = ox * dx + oy * dy;
      if (forward < 4 || forward > bestDist) continue;
      const side = Math.abs(ox * -dy + oy * dx);
      if (side > t.r) continue;
      best = t;
      bestDist = forward;
    }
    return { target: best, distance: bestDist, wall: !best || bestDist >= wall };
  }

  function playerFire(game) {
    const player = game.player;
    if (player.mode !== 'foot') return false;
    if (player.fireTimer > 0 || player.dead) return false;
    const weapon = C.WEAPONS[player.weapon] || C.WEAPONS.pistol;
    player.fireTimer = weapon.delay;
    player.muzzle = 0.08;
    const dx = Math.cos(player.aim);
    const dy = Math.sin(player.aim);
    const mx = player.x + dx * 22;
    const my = player.y + dy * 22;
    const hit = rayHit(game, mx, my, dx, dy, weapon.range, 'player');
    const ex = mx + dx * hit.distance;
    const ey = my + dy * hit.distance;
    addTracer(game, mx, my, ex, ey, '#ffe3a0', 2.2);
    spawnParticles(game, 'spark', ex, ey, hit.wall ? 6 : 4, { speed: 90, life: 0.25, size: 2.6, color: hit.wall ? '#ffd28a' : '#ff9d6a' });
    game.lastShotTime = game.time;
    game.camera.shake = Math.max(game.camera.shake, 0.12);
    if (game.audio) game.audio.shot(player.weapon);
    CC.People.panicAt(game, player.x, player.y, 470, 2.2);
    if (!player.shotCrimeCd || game.time > player.shotCrimeCd) {
      player.shotCrimeCd = game.time + 5;
      if (game.wanted > 0 || game.nearPedestrian(player.x, player.y, 520) || game.nearPolice(player.x, player.y, 640)) {
        game.reportCrime(1, player.x, player.y, 'DISCHARGING A FIREARM');
      }
    }
    if (hit.target) {
      if (hit.target.kind === 'enemy') damageEnemy(game, hit.target.ref, weapon.damage, 'player');
      else if (hit.target.kind === 'ped') killPed(game, hit.target.ref, 'shot');
      else if (hit.target.kind === 'vehicle') {
        CC.Vehicles.damage(game, hit.target.ref, 1);
        if (hit.target.ref.police) game.reportCrime(1, hit.target.ref.x, hit.target.ref.y, 'ASSAULTING POLICE');
      } else if (hit.target.kind === 'playerCar') {
        CC.Vehicles.damage(game, hit.target.ref, 1);
      }
    }
    return true;
  }

  function enemyFire(game, enemy, distance) {
    const player = game.player;
    const px = player.mode === 'car' && player.car ? player.car.x : player.x;
    const py = player.mode === 'car' && player.car ? player.car.y : player.y;
    const spread = Math.max(0.03, 0.15 - distance / 6000);
    const dx = Math.cos(Math.atan2(py - enemy.y, px - enemy.x) + (Math.random() - 0.5) * spread);
    const dy = Math.sin(Math.atan2(py - enemy.y, px - enemy.x) + (Math.random() - 0.5) * spread);
    enemy.shooting = 0.16;
    const mx = enemy.x + dx * 16;
    const my = enemy.y + dy * 16;
    const hit = rayHit(game, mx, my, dx, dy, 560, enemy);
    const ex = mx + dx * hit.distance;
    const ey = my + dy * hit.distance;
    addTracer(game, mx, my, ex, ey, '#ff8f6a', 1.8);
    spawnParticles(game, 'spark', ex, ey, 3, { speed: 70, life: 0.2, size: 2, color: '#ffb17a' });
    if (game.audio) game.audio.shot('pistol', 0.45);
    if (hit.target) {
      if (hit.target.kind === 'player') game.damagePlayer(7 + Math.random() * 6, enemy);
      else if (hit.target.kind === 'playerCar') {
        CC.Vehicles.damage(game, hit.target.ref, 1);
        if (Math.random() < 0.4) game.damagePlayer(3 + Math.random() * 3, enemy);
      } else if (hit.target.kind === 'ped') {
        killPed(game, hit.target.ref, 'shot');
      }
    }
    CC.People.panicAt(game, enemy.x, enemy.y, 260, 1.6);
  }

  function damageEnemy(game, enemy, amount, source) {
    if (enemy.dead) return;
    enemy.hp -= amount;
    enemy.hitFlash = 1;
    enemy.alert = true;
    spawnParticles(game, 'blood', enemy.x, enemy.y, 5, { speed: 55, life: 0.3, size: 3, color: '#8f2f28', angle: enemy.angle + Math.PI, spread: 1.4 });
    if (enemy.hp <= 0) {
      enemy.dead = true;
      enemy.deadTimer = 0;
      addDecal(game, 'blood', enemy.x, enemy.y, enemy.angle, 34, '#4b1512');
      spawnParticles(game, 'blood', enemy.x, enemy.y, 14, { speed: 90, life: 0.5, size: 4, color: '#7e2620' });
      if (game.stats) game.stats.kills += 1;
      if (source === 'player') {
        game.addCash(enemy.kind === 'cop' ? 60 : 35, enemy.kind === 'cop' ? 'OFFICER DOWN' : 'TAKEDOWN');
        if (enemy.kind === 'cop') game.reportCrime(2, enemy.x, enemy.y, 'COP KILLED');
      }
      if (game.audio) game.audio.thud();
      if (game.missions) game.missions.notifyKill(enemy);
    }
  }

  function killPed(game, ped, cause) {
    if (ped.dead) return;
    ped.dead = true;
    ped.deadTimer = 0;
    addDecal(game, 'blood', ped.x, ped.y, ped.angle, 30, '#4b1512');
    spawnParticles(game, 'blood', ped.x, ped.y, 12, { speed: 80, life: 0.45, size: 3.6, color: '#7e2620' });
    game.lastShotTime = game.time;
    game.reportCrime(2, ped.x, ped.y, cause === 'car' ? 'VEHICULAR MANSLAUGHTER' : 'MURDER');
    CC.People.panicAt(game, ped.x, ped.y, 340, 3.2);
    if (game.stats) game.stats.peds += 1;
    if (game.audio) game.audio.thud();
  }

  function melee(game) {
    const player = game.player;
    if (player.mode !== 'foot' || player.punchTimer > 0 || player.dead) return false;
    player.punchTimer = C.PLAYER.punchDelay;
    player.punchAnim = 0.2;
    if (game.audio) game.audio.whoosh();
    let target = null;
    let best = Infinity;
    const dx = Math.cos(player.aim);
    const dy = Math.sin(player.aim);
    for (let i = 0; i < game.enemies.length; i += 1) {
      const e = game.enemies[i];
      if (e.dead) continue;
      const d = U.dist(player.x, player.y, e.x, e.y);
      if (d < C.PLAYER.punchRange && (e.x - player.x) * dx + (e.y - player.y) * dy > 8 && d < best) {
        best = d;
        target = e;
      }
    }
    let ped = null;
    for (let i = 0; i < game.peds.length; i += 1) {
      const p = game.peds[i];
      if (p.dead) continue;
      const d = U.dist(player.x, player.y, p.x, p.y);
      if (d < C.PLAYER.punchRange && (p.x - player.x) * dx + (p.y - player.y) * dy > 8 && d < best) {
        best = d;
        ped = p;
      }
    }
    if (target) {
      damageEnemy(game, target, 32, 'player');
      target.x += dx * 12;
      target.y += dy * 12;
      spawnParticles(game, 'spark', target.x, target.y, 5, { speed: 60, life: 0.2, size: 2.4, color: '#ffd28a' });
      game.camera.shake = Math.max(game.camera.shake, 0.16);
      return true;
    }
    if (ped) {
      killPed(game, ped, 'melee');
      return true;
    }
    return false;
  }

  function explode(game, x, y, radius, sourcePlayer) {
    spawnParticles(game, 'flame', x, y, 34, { speed: 210, life: 0.8, size: 12, color: '#ff9b3f', gravity: 30 });
    spawnParticles(game, 'smoke', x, y, 20, { speed: 80, life: 1.6, size: 20, color: 'rgba(50,50,50,0.6)' });
    spawnParticles(game, 'spark', x, y, 26, { speed: 260, life: 0.5, size: 3, color: '#ffd28a' });
    addDecal(game, 'scorch', x, y, 0, 60, '#1d1a18');
    game.camera.shake = Math.max(game.camera.shake, 0.9);
    if (game.audio) game.audio.explosion();
    if (U.dist(game.player.x, game.player.y, x, y) < radius) {
      game.damagePlayer(38, null);
    }
    for (let i = 0; i < game.enemies.length; i += 1) {
      const e = game.enemies[i];
      if (!e.dead && U.dist(e.x, e.y, x, y) < radius) damageEnemy(game, e, 140, sourcePlayer ? 'player' : 'world');
    }
    for (let i = 0; i < game.peds.length; i += 1) {
      const p = game.peds[i];
      if (!p.dead && U.dist(p.x, p.y, x, y) < radius) killPed(game, p, 'explosion');
    }
    for (let i = 0; i < game.vehicles.length; i += 1) {
      const v = game.vehicles[i];
      if (v.disabled) continue;
      if (U.dist(v.x, v.y, x, y) < radius) CC.Vehicles.damage(game, v, 3);
    }
    if (sourcePlayer) game.reportCrime(3, x, y, 'EXPLOSIVES');
  }

  function updateEffects(game, dt) {
    for (let i = game.particles.length - 1; i >= 0; i -= 1) {
      const p = game.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        game.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy = p.vy * 0.94 + (p.gravity || 0) * dt;
      if (p.type === 'smoke') p.size += dt * 18;
    }
    for (let i = game.tracers.length - 1; i >= 0; i -= 1) {
      game.tracers[i].life -= dt;
      if (game.tracers[i].life <= 0) game.tracers.splice(i, 1);
    }
    for (let i = game.decals.length - 1; i >= 0; i -= 1) {
      game.decals[i].life -= dt;
      if (game.decals[i].life <= 0) game.decals.splice(i, 1);
    }
  }

  CC.Combat = {
    playerFire: playerFire,
    enemyFire: enemyFire,
    damageEnemy: damageEnemy,
    killPed: killPed,
    melee: melee,
    explode: explode,
    updateEffects: updateEffects,
    spawnParticles: spawnParticles,
    addDecal: addDecal,
    addTracer: addTracer,
    rayHit: rayHit,
  };
})();
