(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;

  function specFor(index) {
    return C.VEHICLES[((index % C.VEHICLES.length) + C.VEHICLES.length) % C.VEHICLES.length];
  }

  function createVehicle(typeIndex, x, y, angle, options) {
    const spec = specFor(typeIndex);
    const opts = options || {};
    const color = opts.color || spec.colors[Math.floor(Math.random() * spec.colors.length)];
    const car = {
      x: x,
      y: y,
      angle: angle || 0,
      speed: 0,
      steer: 0,
      spec: spec,
      name: spec.name,
      color: color,
      hp: opts.hp || 3,
      maxHp: opts.hp || 3,
      disabled: false,
      exploded: false,
      occupied: false,
      parked: !!opts.parked,
      traffic: !!opts.traffic,
      police: !!opts.police,
      mission: !!opts.mission,
      playerCar: !!opts.playerCar,
      siren: false,
      sirenPhase: Math.random() * 10,
      brake: false,
      impact: 0,
      damageFlash: 0,
      smoke: 0,
      fire: 0,
      ai: null,
      angleOffset: 0,
      bob: Math.random() * 10,
      wheel: 0,
      horn: 0,
      stuck: 0,
    };
    return car;
  }

  function pickTypeIndex(rng) {
    const roll = rng();
    if (roll < 0.34) return 1;
    if (roll < 0.55) return 0;
    if (roll < 0.7) return 2;
    if (roll < 0.8) return 3;
    if (roll < 0.9) return 4;
    return 5;
  }

  function randomVehicle(rng, x, y, angle, options) {
    return createVehicle(pickTypeIndex(rng), x, y, angle, options);
  }

  function stepCarPhysics(game, car, dt, controls) {
    const city = game.city;
    const spec = car.spec;
    const throttle = controls.throttle || 0;
    const steerInput = controls.steer || 0;
    const handbrake = !!controls.handbrake;
    car.steer = U.damp(car.steer, steerInput, 9, dt);
    let forward = car.speed;
    const maxSpeed = spec.max * (car.disabled ? 0.1 : 1);

    if (throttle > 0) {
      if (forward < -4) forward += C.CAR.brake * dt;
      else forward += spec.accel * throttle * dt;
    } else if (throttle < 0) {
      if (forward > 8) forward -= C.CAR.brake * dt;
      else forward -= spec.accel * 0.58 * dt;
    } else {
      forward -= forward * C.CAR.drag * dt;
    }
    if (handbrake) forward -= forward * 3.4 * dt;
    forward = U.clamp(forward, -maxSpeed * C.CAR.reverseFactor, maxSpeed);
    car.brake = throttle < 0 || handbrake;

    const speedRatio = U.clamp(Math.abs(forward) / 62, 0, 1);
    const direction = forward < 0 ? -1 : 1;
    const turn = car.steer * spec.turn * dt * speedRatio * direction * (handbrake ? 1.45 : 1);
    car.angle += turn;

    const dx = Math.cos(car.angle) * forward * dt;
    const dy = Math.sin(car.angle) * forward * dt;
    const hit = city.moveCircle(car, dx, dy, spec.wid * 0.62);
    car.speed = forward;
    if ((hit.hitX || hit.hitY) && Math.abs(forward) > 42) {
      car.impact = Math.max(car.impact, Math.min(1, Math.abs(forward) / 220));
      if (game.time > (car.bumpCooldown || 0)) {
        car.bumpCooldown = game.time + 0.6;
        damageVehicle(game, car, 1);
        game.camera.shake = Math.max(game.camera.shake, Math.min(0.38, Math.abs(forward) / 900));
      }
      car.speed = -forward * 0.18;
    }
    if (Math.abs(forward) > 14) {
      car.wheel += (forward / spec.len) * dt * 8;
      car.angleOffset = Math.sin(car.wheel) * 0.012;
    } else {
      car.angleOffset *= 0.9;
    }
    car.bob += dt;
    return Math.abs(forward);
  }

  function damageVehicle(game, car, amount) {
    if (car.disabled) return;
    car.hp -= amount;
    car.damageFlash = 1;
    if (car.hp <= 0) {
      car.hp = 0;
      car.disabled = true;
      car.speed *= 0.15;
      car.smoke = 1;
      car.fire = 1;
      if (game && game.onVehicleDisabled) game.onVehicleDisabled(car);
    }
  }

  function nearestCar(game, x, y, range, options) {
    const opts = options || {};
    let best = null;
    let bestD = range * range;
    const list = game.vehicles;
    for (let i = 0; i < list.length; i += 1) {
      const car = list[i];
      if (car.disabled && !opts.allowDisabled) continue;
      if (car === opts.ignore) continue;
      const d = U.dist2(x, y, car.x, car.y);
      if (d < bestD) {
        bestD = d;
        best = car;
      }
    }
    return best;
  }

  function carOccupiedByPlayer(game, car) {
    return game.player.mode === 'car' && game.player.car === car;
  }

  CC.Vehicles = {
    create: createVehicle,
    random: randomVehicle,
    pickTypeIndex: pickTypeIndex,
    stepPhysics: stepCarPhysics,
    damage: damageVehicle,
    nearest: nearestCar,
    occupiedByPlayer: carOccupiedByPlayer,
  };
})();
