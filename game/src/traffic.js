(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;
  const M = C.MAP;
  const DIRS = [
    { x: 0, y: -1, di: -1, dj: 0 },
    { x: 1, y: 0, di: 0, dj: 1 },
    { x: 0, y: 1, di: 1, dj: 0 },
    { x: -1, y: 0, di: 0, dj: -1 },
  ];

  function lanePoint(node, dir) {
    return {
      x: node.x + -dir.y * C.TRAFFIC.lane,
      y: node.y + dir.x * C.TRAFFIC.lane,
    };
  }

  function chooseDirection(node, previous, rng) {
    const valid = [];
    for (let d = 0; d < DIRS.length; d += 1) {
      const ni = node.i + DIRS[d].di;
      const nj = node.j + DIRS[d].dj;
      if (ni < 0 || ni > M.grid || nj < 0 || nj > M.grid) continue;
      if (previous && DIRS[d].di === -previous.di && DIRS[d].dj === -previous.dj) continue;
      valid.push(DIRS[d]);
    }
    if (valid.length === 0) return DIRS[(DIRS.indexOf(previous) + 2) % 4];
    if (previous) {
      const straightIndex = valid.findIndex(function (dir) {
        return dir.x === previous.x && dir.y === previous.y;
      });
      if (straightIndex >= 0 && rng() < 0.62) return valid[straightIndex];
    }
    return valid[Math.floor(rng() * valid.length)];
  }

  function setSegment(game, car, from, dir) {
    const to = game.city.nodes[from.i + dir.di][from.j + dir.dj];
    const target = lanePoint(to, dir);
    car.ai = car.ai || {};
    car.ai.from = from;
    car.ai.dir = dir;
    car.ai.to = to;
    car.ai.targetX = target.x;
    car.ai.targetY = target.y;
    car.ai.turnPause = 0;
    car.angle = Math.atan2(dir.y, dir.x);
  }

  function createTrafficCar(game) {
    const rng = game.rng;
    const grid = game.city.nodes;
    let from = null;
    let dir = null;
    for (let tries = 0; tries < 30 && !from; tries += 1) {
      const i = rng.int(0, M.grid);
      const j = rng.int(0, M.grid);
      const node = grid[i][j];
      const choices = [];
      for (let d = 0; d < DIRS.length; d += 1) {
        const ni = i + DIRS[d].di;
        const nj = j + DIRS[d].dj;
        if (ni >= 0 && ni <= M.grid && nj >= 0 && nj <= M.grid) choices.push(DIRS[d]);
      }
      if (choices.length > 0) {
        from = node;
        dir = choices[Math.floor(rng() * choices.length)];
      }
    }
    if (!from) return null;
    const start = lanePoint(from, dir);
    const typeIndex = CC.Vehicles.pickTypeIndex(rng);
    const car = CC.Vehicles.create(typeIndex, start.x, start.y, Math.atan2(dir.y, dir.x), { traffic: true, parked: false });
    car.ai = { cruise: rng.range(C.TRAFFIC.cruiseMin, C.TRAFFIC.cruiseMax), stuck: 0 };
    setSegment(game, car, from, dir);
    return car;
  }

  function spawnTraffic(game, count) {
    for (let n = 0; n < count; n += 1) {
      const car = createTrafficCar(game);
      if (car) game.vehicles.push(car);
    }
  }

  function spawnParked(game) {
    const spots = game.city.parkingSpots;
    const limit = Math.min(spots.length, 26);
    for (let n = 0; n < limit; n += 1) {
      const spot = spots[n];
      const typeIndex = CC.Vehicles.pickTypeIndex(game.rng);
      const car = CC.Vehicles.create(typeIndex, spot.x, spot.y, spot.angle, { parked: !spot.inLot });
      car.color = car.spec.colors[Math.floor(game.rng() * car.spec.colors.length)];
      game.vehicles.push(car);
    }
  }

  function aheadObstacle(game, car) {
    const dx = Math.cos(car.angle);
    const dy = Math.sin(car.angle);
    const look = 55 + car.speed * 0.4;
    const vehicles = game.vehicles;
    for (let i = 0; i < vehicles.length; i += 1) {
      const other = vehicles[i];
      if (other === car) continue;
      const ox = other.x - car.x;
      const oy = other.y - car.y;
      const forward = ox * dx + oy * dy;
      if (forward < 0 || forward > look) continue;
      const side = Math.abs(ox * -dy + oy * dx);
      if (side < 26) return true;
    }
    const player = game.player;
    if (player.mode === 'foot' && U.dist(player.x, player.y, car.x, car.y) < 58) {
      const ox = player.x - car.x;
      const oy = player.y - car.y;
      const forward = ox * dx + oy * dy;
      const side = Math.abs(ox * -dy + oy * dx);
      if (forward > 0 && forward < 48 && side < 20) return true;
    }
    for (let p = 0; p < game.peds.length; p += 1) {
      const ped = game.peds[p];
      if (ped.dead) continue;
      const ox = ped.x - car.x;
      const oy = ped.y - car.y;
      const forward = ox * dx + oy * dy;
      if (forward > 0 && forward < 54) {
        const side = Math.abs(ox * -dy + oy * dx);
        if (side < 18) return true;
      }
    }
    return false;
  }

  function updateTraffic(game, dt) {
    const rng = game.rng;
    for (let i = 0; i < game.vehicles.length; i += 1) {
      const car = game.vehicles[i];
      if (!car.traffic || car.ai === null) continue;
      if (car.occupied) continue;
      if (car === (game.player && game.player.car)) continue;
      if (car.disabled) {
        car.speed = 0;
        car.smoke = Math.min(1, (car.smoke || 0) + dt * 0.4);
        continue;
      }
      const ai = car.ai;
      const dx = ai.targetX - car.x;
      const dy = ai.targetY - car.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 8) {
        const node = ai.to;
        const nextDir = chooseDirection(node, ai.dir, rng);
        setSegment(game, car, node, nextDir);
        const lane = lanePoint(node, nextDir);
        car.x = lane.x;
        car.y = lane.y;
        continue;
      }
      const desired = aheadObstacle(game, car) ? 0 : ai.cruise;
      const accel = desired > car.speed ? 65 : 190;
      car.speed = U.damp(car.speed, desired, desired > car.speed ? 1.8 : 5.4, dt);
      car.brake = desired < car.speed - 4;
      const step = Math.min(distance, car.speed * dt);
      const dirX = dx / distance;
      const dirY = dy / distance;
      car.x += dirX * step;
      car.y += dirY * step;
      car.angle = Math.atan2(dirY, dirX);
      car.bob += dt;
      if (car.speed < 4) ai.stuck += dt;
      else ai.stuck = 0;
      if (ai.stuck > 9) {
        ai.stuck = 0;
        car.speed = 40;
      }
      car.damageFlash = Math.max(0, car.damageFlash - dt * 3);
    }
  }

  CC.Traffic = {
    spawnTraffic: spawnTraffic,
    spawnParked: spawnParked,
    update: updateTraffic,
    chooseDirection: chooseDirection,
    lanePoint: lanePoint,
  };
})();
