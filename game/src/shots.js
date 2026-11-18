(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;

  function resetWorld(game) {
    game.vehicles.length = 0;
    game.peds.length = 0;
    game.enemies.length = 0;
    game.policeUnits.length = 0;
    game.particles.length = 0;
    game.tracers.length = 0;
    game.decals.length = 0;
  }

  function addPed(game, block, corner, x, y, angle, shirt, skin) {
    const ped = CC.People.createPed(game, block, corner, 0);
    ped.x = x;
    ped.y = y;
    ped.angle = angle;
    ped.bob = Math.random() * 6;
    ped.pause = 999;
    ped.target = { x: x, y: y };
    ped.shirt = shirt || ped.shirt;
    ped.skin = skin || ped.skin;
    game.peds.push(ped);
    return ped;
  }

  function addCar(game, type, x, y, angle, color) {
    const car = CC.Vehicles.create(type, x, y, angle, { color: color, parked: true });
    car.ai = null;
    car.traffic = false;
    car.brake = false;
    game.vehicles.push(car);
    return car;
  }

  function addCruiser(game, x, y, angle) {
    const car = CC.Vehicles.create(1, x, y, angle, { police: true, hp: C.WANTED.policeHealth });
    car.spec = CC.Police.CRUISER;
    car.name = CC.Police.CRUISER.name;
    car.color = '#e9e1cd';
    car.police = true;
    car.siren = true;
    car.sirenPhase = Math.random() * 7;
    car.hp = C.WANTED.policeHealth;
    car.maxHp = C.WANTED.policeHealth;
    car.ai = { chase: true, stuck: 0, reverse: 0, shootCd: 99, spawnTime: game.time };
    game.vehicles.push(car);
    game.policeUnits.push(car);
    return car;
  }

  function clearNotifications(game) {
    game.notifications.length = 0;
    game.dialogue = null;
  }

  function placeCamera(game, x, y, yaw, zoom) {
    const camera = game.camera;
    camera.x = x;
    camera.y = y;
    camera.yaw = yaw;
    camera.zoom = zoom;
    camera.targetX = x;
    camera.targetY = y;
    camera.shake = 0;
    camera.shakeX = 0;
    camera.shakeY = 0;
    camera.override = { x: x, y: y, yaw: yaw, zoom: zoom };
    camera.width = 1280;
    camera.height = 720;
  }

  function stageCover(game) {
    resetWorld(game);
    game.time = 41;
    game.cash = 1240;
    game.wanted = 4;
    game.evadeTimer = 0;
    game.lastShotTime = game.time - 2;
    game.player.health = 84;
    game.player.armor = 40;
    game.player.weapon = 'pistol';
    const blocks = game.city.blocks;
    const blockSE = blocks[2 * 7 + 3];
    const blockNE = blocks[1 * 7 + 3];
    addCar(game, 1, 1900, 1240, Math.PI, '#7d8b95');
    addCar(game, 4, 1935, 1190, Math.PI, '#e3d5b5');
    addPed(game, blockSE, 0, 1832, 1286, -0.6, '#c96b52');
    addPed(game, blockSE, 0, 1858, 1306, 2.1, '#d6c9a8', '#b97c52');
    addPed(game, blockNE, 3, 1700, 1298, 0.4, '#5e8f9a');
    addPed(game, blockNE, 2, 1680, 1290, 2.8, '#d9d2c0');
    addPed(game, blockNE, 1, 1810, 1140, 1.2, '#8a6e5a');
    addPed(game, blockSE, 0, 1718, 1232, 1.9, '#e8b04c', '#5a3a26');
    addPed(game, blockSE, 0, 1808, 1218, -1.2, '#5e8f9a', '#d8a578');
    addPed(game, blockNE, 2, 1742, 1278, 2.6, '#c96b52', '#8d5a3b');
    addPed(game, blockNE, 1, 1788, 1188, 0.8, '#b78ba8', '#6b432c');
    addCar(game, 0, 1120, 1240, 0, '#c8452f');
    addCar(game, 3, 1500, 1200, 0, '#e8b04c');
    const car = CC.Vehicles.create(0, 1765, 1240, 0.03, { color: '#2f8f8a' });
    car.occupied = true;
    game.vehicles.push(car);
    game.player.mode = 'car';
    game.player.car = car;
    game.player.x = car.x;
    game.player.y = car.y;
    game.player.angle = car.angle;
    game.player.aim = car.angle;
    car.speed = 138;
    addCruiser(game, 1662, 1243, 0.02);
    addCruiser(game, 1648, 1192, 0.36);
    addCruiser(game, 1846, 1238, Math.PI);
    game.missions.loadState(0, false);
    game.missions.debugStart(0);
    game.dialogue = null;
    game.notifications.length = 0;
    game.notify('CRIME · RECKLESS DRIVING', 'crime');
    game.notify('MISSION · WAKE UP CALL', 'mission');
    placeCamera(game, 1734, 1256, 0.34, 0.94);
    game.hudHidden = false;
  }

  function stageCity(game) {
    game.time = 74;
    game.player.health = 100;
    game.player.armor = 50;
    game.wanted = 0;
    game.cash = 920;
    const rng = game.rng;
    const city = game.city;
    const centerBlocks = [16, 17, 23, 24, 25, 30, 31, 32];
    for (let n = 0; n < 14; n += 1) {
      const block = city.blocks[centerBlocks[n % centerBlocks.length]];
      const corner = n % 4;
      const point = CC.People.cornerPoint(block, corner);
      addPed(game, block, corner, point.x + rng.range(-40, 40), point.y + rng.range(-10, 10), rng() * U.TAU);
    }
    for (let n = 0; n < 8; n += 1) {
      const vertical = n % 2 === 0;
      const lane = n % 4 < 2 ? 20 : -20;
      if (vertical) {
        addCar(game, n % 6, 1770 + lane, 950 + n * 310, Math.PI / 2 * (lane > 0 ? 1 : -1), null);
      } else {
        addCar(game, n % 6, 1250 + n * 280, 2320 + lane, lane > 0 ? 0 : Math.PI, null);
      }
    }
    for (let n = 0; n < 10; n += 1) {
      const block = city.blocks[(n * 5 + 23) % city.blocks.length];
      const corner = n % 4;
      const point = CC.People.cornerPoint(block, corner);
      addPed(game, block, corner, point.x + rng.range(-30, 30), point.y + rng.range(-8, 8), rng() * U.TAU);
    }
    placeCamera(game, 2020, 2000, 0.04, 0.32);
    game.hudHidden = false;
  }

  function stageOnFoot(game) {
    resetWorld(game);
    game.time = 100;
    game.cash = 640;
    game.wanted = 0;
    game.player.health = 93;
    game.player.armor = 20;
    game.player.weapon = 'pistol';
    game.player.mode = 'foot';
    game.player.car = null;
    game.player.x = 1278;
    game.player.y = 1656;
    game.player.angle = -Math.PI / 2;
    game.player.aim = -Math.PI / 2 + 0.1;
    game.player.walkPhase = 1.2;
    game.missions.loadState(0, false);
    const blocks = game.city.blocks;
    addPed(game, blocks[2 * 7 + 2], 0, 1274, 1596, -Math.PI / 2, '#e3b25e', '#8d5a3b');
    addPed(game, blocks[2 * 7 + 2], 0, 1258, 1712, 2.5, '#c96b52', '#d8a578');
    addPed(game, blocks[2 * 7 + 2], 0, 1198, 1600, 0.2, '#5e8f9a', '#b97c52');
    addPed(game, blocks[1 * 7 + 2], 3, 1150, 1544, 0.9, '#b78ba8', '#6b432c');
    addPed(game, blocks[1 * 7 + 1], 1, 1262, 1320, 2.2, '#d6c9a8', '#c98f63');
    addPed(game, blocks[3 * 7 + 2], 3, 1208, 1888, -0.4, '#4f7a62', '#5a3a26');
    addCar(game, 1, 1240, 1490, -Math.PI / 2, '#e6dcc6');
    addCar(game, 4, 1200, 1790, Math.PI / 2, '#71918f');
    addCar(game, 0, 1210, 1885, -Math.PI / 2, '#c8452f');
    addCar(game, 5, 1350, 1770, Math.PI, '#2f8f8a');
    addCar(game, 2, 1860, 1220, 0, '#5f7a52');
    addCar(game, 3, 1490, 1220, Math.PI, '#23262e');
    game.notifications.length = 0;
    game.dialogue = null;
    placeCamera(game, 1310, 1628, 0.28, 1.08);
    game.hudHidden = false;
  }

  function stageMission(game) {
    resetWorld(game);
    game.time = 188;
    game.cash = 2450;
    game.player.health = 76;
    game.player.armor = 20;
    game.player.weapon = 'smg';
    game.player.mode = 'foot';
    game.player.car = null;
    game.player.x = 2732;
    game.player.y = 3948;
    game.player.angle = Math.atan2(4004 - 3948, 2598 - 2732);
    game.player.aim = game.player.angle;
    game.missions.loadState(2, false);
    game.missions.debugStart(2);
    game.dialogue = null;
    game.wanted = 2;
    game.evadeTimer = 0;
    const blocks = game.city.blocks;
    addPed(game, blocks[6 * 7 + 5], 1, 2638, 3928, -2.2, '#d6c9a8', '#b97c52');
    addPed(game, blocks[6 * 7 + 6], 2, 2790, 3980, 1.6, '#b78ba8', '#8d5a3b');
    addPed(game, blocks[6 * 7 + 5], 2, 2570, 3925, -2.8, '#7c8dbb', '#d8a578');
    addPed(game, blocks[6 * 7 + 4], 2, 2890, 3920, 2.4, '#a65a4d', '#c98f63');
    const peds = game.peds;
    for (let i = 0; i < peds.length; i += 1) peds[i].panic = 2.4;
    addCar(game, 1, 2950, 3970, Math.PI, '#e6dcc6');
    addCar(game, 2, 3040, 3925, Math.PI, '#8e3f35');
    addCar(game, 5, 2600, 3920, 0, '#2f8f8a');
    addCruiser(game, 3010, 3958, Math.PI);
    const first = game.enemies[0];
    if (first) {
      first.alert = true;
      first.angle = Math.atan2(game.player.y - first.y, game.player.x - first.x);
      first.shooting = 0.16;
    }
    game.lastShotTime = game.time;
    game.player.muzzle = 0.06;
    game.notifications.length = 0;
    game.notify('MISSION · BOARDWALK SHAKEDOWN', 'mission');
    game.notify('CRIME · DISCHARGING A FIREARM', 'crime');
    const aim = game.player.aim;
    const px = game.player.x + Math.cos(aim) * 22;
    const py = game.player.y + Math.sin(aim) * 22;
    const ex = 2598;
    const ey = 4004;
    CC.Combat.addTracer(game, px, py, ex, ey, '#ffe3a0', 2.4);
    if (first) CC.Combat.addTracer(game, first.x, first.y, game.player.x, game.player.y, '#ff8f6a', 1.8);
    CC.Combat.spawnParticles(game, 'spark', ex, ey, 7, { speed: 80, life: 999, size: 3, color: '#ffd28a' });
    placeCamera(game, 2662, 3972, 0.22, 1.1);
    game.hudHidden = false;
  }

  function stage(name, game) {
    game.shotMode = true;
    game.state = 'play';
    game.player.dead = false;
    game.deathTimer = 0;
    if (name === 'city') stageCity(game);
    else if (name === 'onfoot') stageOnFoot(game);
    else if (name === 'mission') stageMission(game);
    else stageCover(game);
    game.state = 'play';
    game.shotMode = true;
    return true;
  }

  CC.Shots = {
    stage: stage,
  };
})();
