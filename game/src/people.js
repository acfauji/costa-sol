(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;
  const M = C.MAP;

  function cornerPoint(block, corner) {
    const inset = 15;
    if (corner === 0) return { x: block.x + inset, y: block.y + inset };
    if (corner === 1) return { x: block.x + block.w - inset, y: block.y + inset };
    if (corner === 2) return { x: block.x + block.w - inset, y: block.y + block.h - inset };
    return { x: block.x + inset, y: block.y + block.h - inset };
  }

  function crossChoices(block, corner) {
    const options = [];
    if (corner === 0) {
      if (block.j > 0) options.push({ bi: block.i, bj: block.j - 1, corner: 1 });
      if (block.i > 0) options.push({ bi: block.i - 1, bj: block.j, corner: 3 });
    } else if (corner === 1) {
      if (block.j < M.grid - 1) options.push({ bi: block.i, bj: block.j + 1, corner: 0 });
      if (block.i > 0) options.push({ bi: block.i - 1, bj: block.j, corner: 2 });
    } else if (corner === 2) {
      if (block.j < M.grid - 1) options.push({ bi: block.i, bj: block.j + 1, corner: 3 });
      if (block.i < M.grid - 1) options.push({ bi: block.i + 1, bj: block.j, corner: 0 });
    } else {
      if (block.j > 0) options.push({ bi: block.i, bj: block.j - 1, corner: 2 });
      if (block.i < M.grid - 1) options.push({ bi: block.i + 1, bj: block.j, corner: 1 });
    }
    return options;
  }

  function createPed(game, block, corner, along) {
    const blockList = game.city.blocks;
    const point = cornerPoint(block, corner);
    const x = point.x + (along || 0);
    const y = point.y;
    const ped = {
      kind: 'ped',
      x: x,
      y: y,
      angle: Math.random() * U.TAU,
      blockIndex: blockList.indexOf(block),
      block: block,
      corner: corner,
      target: cornerPoint(block, (corner + 1) % 4),
      crossing: false,
      pause: Math.random() * 1.2,
      speed: 22 + Math.random() * 16,
      phase: Math.random() * 20,
      bob: 0,
      panic: 0,
      panicAngle: 0,
      fleeTimer: 0,
      skin: C.SKIN[Math.floor(Math.random() * C.SKIN.length)],
      shirt: C.PED_COLORS[Math.floor(Math.random() * C.PED_COLORS.length)],
      pants: Math.random() < 0.5 ? '#333f4a' : '#5c4b3d',
      hair: Math.random() < 0.75 ? '#2c211b' : '#d7b56d',
      bag: Math.random() < 0.3,
      hat: Math.random() < 0.18,
      dead: false,
      deadTimer: 0,
      hitFlash: 0,
      radius: 10,
    };
    if (game.city.solidAt(ped.x, ped.y, 9)) {
      ped.x = point.x + 3;
      ped.y = point.y + 18;
    }
    return ped;
  }

  function createEnemy(x, y, options) {
    const opts = options || {};
    const gang = opts.gang || C.GANGS[0];
    const angle = opts.angle || Math.random() * U.TAU;
    return {
      kind: opts.cop ? 'cop' : 'gang',
      x: x,
      y: y,
      angle: angle,
      homeX: x,
      homeY: y,
      hp: opts.cop ? 55 : 70,
      maxHp: opts.cop ? 55 : 70,
      speed: opts.cop ? 92 : 78,
      alert: !!opts.alert,
      fireTimer: 0.5 + Math.random() * 0.9,
      dead: false,
      deadTimer: 0,
      hitFlash: 0,
      phase: Math.random() * 10,
      bob: 0,
      skin: C.SKIN[Math.floor(Math.random() * C.SKIN.length)],
      shirt: opts.cop ? '#3f6fb5' : gang.color,
      pants: opts.cop ? '#232b3a' : '#30363f',
      gang: gang,
      strafe: Math.random() < 0.5 ? 1 : -1,
      radius: 11,
      aimX: x,
      aimY: y,
      shooting: 0,
      missionTag: opts.missionTag || null,
    };
  }

  function spawnPeds(game, count) {
    const rng = game.rng;
    const blocks = game.city.blocks;
    const peds = [];
    for (let n = 0; n < count; n += 1) {
      const block = blocks[Math.floor(rng() * blocks.length)];
      const corner = Math.floor(rng() * 4);
      const ped = createPed(game, block, corner, (rng.range(-60, 60)));
      peds.push(ped);
    }
    return peds;
  }

  function panicAt(game, x, y, radius, force) {
    const r2 = radius * radius;
    for (let i = 0; i < game.peds.length; i += 1) {
      const ped = game.peds[i];
      if (ped.dead) continue;
      if (U.dist2(x, y, ped.x, ped.y) < r2) {
        ped.panic = Math.max(ped.panic, (force || 2.6) + Math.random() * 1.6);
        ped.panicAngle = Math.atan2(ped.y - y, ped.x - x) + (Math.random() - 0.5) * 0.7;
        ped.fleeTimer = 0;
      }
    }
  }

  function updatePed(game, ped, dt) {
    if (ped.dead) {
      ped.deadTimer += dt;
      return;
    }
    ped.phase += dt;
    ped.hitFlash = Math.max(0, ped.hitFlash - dt * 4);
    const player = game.player;

    if (ped.panic <= 0 && game.time - game.lastShotTime < 2.2 && U.dist2(player.x, player.y, ped.x, ped.y) < 430 * 430) {
      ped.panic = 2.2 + Math.random() * 1.4;
      ped.panicAngle = Math.atan2(ped.y - player.y, ped.x - player.x) + (Math.random() - 0.5) * 0.8;
      ped.fleeTimer = 0;
    }
    if (ped.panic <= 0 && player.mode === 'car' && player.car && Math.abs(player.car.speed) > 60) {
      const d = U.dist(player.car.x, player.car.y, ped.x, ped.y);
      if (d < 155) {
        const heading = Math.atan2(ped.y - player.car.y, ped.x - player.car.x);
        if (Math.abs(U.angleWrap(heading - player.car.angle)) < 0.7) {
          ped.panic = 1.3;
          ped.panicAngle = heading + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
          ped.fleeTimer = 0;
        }
      }
    }

    if (ped.panic > 0) {
      ped.panic -= dt;
      ped.fleeTimer -= dt;
      if (ped.fleeTimer <= 0) {
        ped.fleeTimer = 0.55;
        ped.panicAngle += (Math.random() - 0.5) * 0.6;
      }
      ped.angle = U.angleDamp(ped.angle, ped.panicAngle, 7, dt);
      const step = C.PEDS.run * dt;
      game.city.moveCircle(ped, Math.cos(ped.angle) * step, Math.sin(ped.angle) * step, 9);
      ped.bob += dt * 12;
      return;
    }

    if (ped.pause > 0) {
      ped.pause -= dt;
      ped.bob += dt * 1.5;
      return;
    }

    const dx = ped.target.x - ped.x;
    const dy = ped.target.y - ped.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 3) {
      if (ped.crossing) {
        ped.crossing = false;
      } else {
        ped.corner = (ped.corner + 1) % 4;
      }
      if (Math.random() < 0.19 && !ped.crossing) {
        const choices = crossChoices(ped.block, ped.corner);
        if (choices.length > 0) {
          const choice = choices[Math.floor(Math.random() * choices.length)];
          const destBlock = game.city.blocks[choice.bi * M.grid + choice.bj];
          if (destBlock) {
            ped.block = destBlock;
            ped.blockIndex = choice.bi * M.grid + choice.bj;
            ped.corner = choice.corner;
            ped.target = cornerPoint(destBlock, choice.corner);
            ped.crossing = true;
            ped.pause = 0.25 + Math.random() * 0.6;
            return;
          }
        }
      }
      ped.target = cornerPoint(ped.block, (ped.corner + 1) % 4);
      if (Math.random() < 0.15) ped.pause = 0.4 + Math.random() * 1.2;
      return;
    }
    const speed = ped.crossing ? 34 : ped.speed;
    ped.angle = U.angleDamp(ped.angle, Math.atan2(dy, dx), 6, dt);
    const step = Math.min(distance, speed * dt);
    game.city.moveCircle(ped, Math.cos(ped.angle) * step, Math.sin(ped.angle) * step, 9);
    ped.bob += dt * speed * 0.28;
  }

  function updatePeds(game, dt) {
    for (let i = 0; i < game.peds.length; i += 1) updatePed(game, game.peds[i], dt);
  }

  function updateEnemy(game, enemy, dt) {
    if (enemy.dead) {
      enemy.deadTimer += dt;
      return;
    }
    enemy.phase += dt;
    enemy.bob += dt;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 4);
    enemy.shooting = Math.max(0, enemy.shooting - dt);
    const player = game.player;
    const px = player.mode === 'car' && player.car ? player.car.x : player.x;
    const py = player.mode === 'car' && player.car ? player.car.y : player.y;
    const d = U.dist(enemy.x, enemy.y, px, py);
    if (!enemy.alert && d < 530) enemy.alert = true;
    if (!enemy.alert && game.time - game.lastShotTime < 1.6 && d < 760) enemy.alert = true;
    if (!enemy.alert) {
      enemy.angle += Math.sin(enemy.phase * 0.7) * dt * 0.4;
      return;
    }
    enemy.angle = U.angleDamp(enemy.angle, Math.atan2(py - enemy.y, px - enemy.x), 8, dt);
    let moveAngle = enemy.angle;
    let moving = false;
    if (d > 215) {
      moving = true;
    } else if (d < 115) {
      moveAngle = enemy.angle + Math.PI;
      moving = true;
    } else {
      moveAngle = enemy.angle + Math.PI / 2 * enemy.strafe;
      moving = Math.abs(Math.sin(enemy.phase * 0.8)) > 0.35;
    }
    if (moving) {
      const step = enemy.speed * dt;
      game.city.moveCircle(enemy, Math.cos(moveAngle) * step, Math.sin(moveAngle) * step, 10);
      enemy.bob += dt * 9;
    }
    if (d < 570) {
      enemy.fireTimer -= dt;
      if (enemy.fireTimer <= 0) {
        enemy.fireTimer = (enemy.kind === 'cop' ? 1.15 : 1.35) + Math.random() * 0.8;
        if (CC.Combat && CC.Combat.enemyFire) CC.Combat.enemyFire(game, enemy, d);
      }
    }
  }

  function updateEnemies(game, dt) {
    for (let i = 0; i < game.enemies.length; i += 1) updateEnemy(game, game.enemies[i], dt);
  }

  function nearestEnemy(game, x, y, range) {
    let best = null;
    let bestD = range * range;
    for (let i = 0; i < game.enemies.length; i += 1) {
      const e = game.enemies[i];
      if (e.dead) continue;
      const d = U.dist2(x, y, e.x, e.y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  CC.People = {
    createPed: createPed,
    createEnemy: createEnemy,
    spawnPeds: spawnPeds,
    updatePeds: updatePeds,
    updateEnemies: updateEnemies,
    panicAt: panicAt,
    nearestEnemy: nearestEnemy,
    cornerPoint: cornerPoint,
  };
})();
