(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;

  function createCamera() {
    return {
      x: 2030,
      y: 2030,
      yaw: 0,
      zoom: C.CAMERA.footZoom,
      targetX: 2030,
      targetY: 2030,
      targetZoom: C.CAMERA.footZoom,
      shake: 0,
      shakeX: 0,
      shakeY: 0,
      followCar: false,
      lookHold: 0,
      override: null,
      width: 1280,
      height: 720,
    };
  }

  function update(camera, game, dt) {
    if (camera.override) {
      camera.x = camera.override.x;
      camera.y = camera.override.y;
      camera.yaw = camera.override.yaw || 0;
      camera.zoom = camera.override.zoom;
      camera.shake = 0;
      camera.shakeX = 0;
      camera.shakeY = 0;
      return;
    }
    const player = game.player;
    const inCar = player.mode === 'car' && player.car;
    const px = inCar ? player.car.x : player.x;
    const py = inCar ? player.car.y : player.y;
    let leadX = 0;
    let leadY = 0;
    if (inCar) {
      leadX = Math.cos(player.car.angle) * player.car.speed * 0.24;
      leadY = Math.sin(player.car.angle) * player.car.speed * 0.24;
    } else {
      leadX = Math.cos(player.aim) * 26;
      leadY = Math.sin(player.aim) * 26;
    }
    camera.targetX = px + leadX;
    camera.targetY = py + leadY;
    const desiredZoom = inCar
      ? C.CAMERA.carZoom - U.clamp(Math.abs(player.car.speed) / player.car.spec.max, 0, 1) * 0.09
      : C.CAMERA.footZoom;
    camera.zoom = U.damp(camera.zoom, desiredZoom, 3.2, dt);

    if (inCar) {
      const desiredYaw = player.car.angle + Math.PI / 2;
      if (game.input.down('Mouse2')) {
        camera.yaw += game.input.lookDelta * 0.0052;
        camera.lookHold = 2.2;
      } else if (game.input.down('KeyZ')) {
        camera.yaw -= 2.2 * dt;
        camera.lookHold = 2.2;
      } else if (game.input.down('KeyC')) {
        camera.yaw += 2.2 * dt;
        camera.lookHold = 2.2;
      } else if (camera.lookHold > 0) {
        camera.lookHold -= dt;
      } else {
        camera.yaw = U.angleDamp(camera.yaw, desiredYaw, 3.4, dt);
      }
    } else {
      if (game.input.down('Mouse2')) {
        camera.yaw += game.input.lookDelta * 0.0052;
      } else if (game.input.down('KeyZ')) {
        camera.yaw -= 2.1 * dt;
      } else if (game.input.down('KeyC')) {
        camera.yaw += 2.1 * dt;
      }
    }
    camera.yaw = U.angleWrap(camera.yaw);
    const rate = inCar ? 5.4 : 7.5;
    camera.x = U.damp(camera.x, camera.targetX, rate, dt);
    camera.y = U.damp(camera.y, camera.targetY, rate, dt);

    camera.shake = Math.max(0, camera.shake - dt * 2.4);
    if (camera.shake > 0.01) {
      camera.shakeX = (Math.random() - 0.5) * camera.shake * 22;
      camera.shakeY = (Math.random() - 0.5) * camera.shake * 22;
    } else {
      camera.shakeX = 0;
      camera.shakeY = 0;
    }
  }

  function screenToWorld(camera, sx, sy) {
    const x = (sx - camera.width / 2) / camera.zoom;
    const y = (sy - camera.height / 2) / camera.zoom;
    const world = U.rotate(x, y, camera.yaw);
    return { x: camera.x + world.x, y: camera.y + world.y };
  }

  function worldToScreen(camera, wx, wy) {
    const dx = wx - camera.x;
    const dy = wy - camera.y;
    const c = Math.cos(-camera.yaw);
    const s = Math.sin(-camera.yaw);
    return {
      x: dx * c - dy * s,
      y: dx * s + dy * c,
    };
  }

  function project(camera, wx, wy) {
    const p = worldToScreen(camera, wx, wy);
    return {
      x: camera.width / 2 + p.x * camera.zoom + camera.shakeX,
      y: camera.height / 2 + p.y * camera.zoom + camera.shakeY,
    };
  }

  function viewRadius(camera) {
    const w = camera.width / camera.zoom;
    const h = camera.height / camera.zoom;
    return Math.hypot(w, h) * 0.58;
  }

  function snap(camera, x, y, yaw, zoom) {
    camera.x = x;
    camera.y = y;
    if (yaw !== undefined) camera.yaw = yaw;
    if (zoom !== undefined) camera.zoom = zoom;
    camera.targetX = x;
    camera.targetY = y;
  }

  CC.Camera = {
    create: createCamera,
    update: update,
    screenToWorld: screenToWorld,
    worldToScreen: worldToScreen,
    project: project,
    viewRadius: viewRadius,
    snap: snap,
  };
})();
