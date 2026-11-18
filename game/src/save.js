(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;

  function readRaw() {
    try {
      return window.localStorage.getItem(C.SAVE_KEY);
    } catch (error) {
      return null;
    }
  }

  function readSave() {
    const raw = readRaw();
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (!data || data.version !== 1) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  function capture(game) {
    const player = game.player;
    const x = player.mode === 'car' && player.car ? player.car.x : player.x;
    const y = player.mode === 'car' && player.car ? player.car.y : player.y;
    return {
      version: 1,
      savedAt: Date.now(),
      time: game.time,
      cash: game.cash,
      x: x,
      y: y,
      health: Math.max(35, player.health),
      armor: player.armor,
      missionIndex: game.missions.index,
      storyDone: !!game.storyDone,
      stats: game.stats,
      seed: game.seed,
    };
  }

  function writeSave(game) {
    try {
      window.localStorage.setItem(C.SAVE_KEY, JSON.stringify(capture(game)));
      return true;
    } catch (error) {
      return false;
    }
  }

  function hasSave() {
    return !!readSave();
  }

  function clearSave() {
    try {
      window.localStorage.removeItem(C.SAVE_KEY);
    } catch (error) {
      /* ignore */
    }
  }

  function applySave(game, data) {
    if (!data) return false;
    const player = game.player;
    if (player.mode === 'car' && player.car) {
      player.car.occupied = false;
      player.mode = 'foot';
      player.car = null;
    }
    player.health = Math.max(35, Math.min(player.maxHealth, data.health || player.maxHealth));
    player.armor = Math.max(0, Math.min(100, data.armor || 0));
    player.dead = false;
    player.deadTimer = 0;
    player.jumpZ = 0;
    player.jumping = false;
    game.cash = Math.max(0, data.cash || 0);
    game.wanted = 0;
    game.storyDone = !!data.storyDone;
    if (data.stats) game.stats = Object.assign({ kills: 0, peds: 0, missions: 0, takedowns: 0 }, data.stats);
    let x = data.x || game.safehouse.x;
    let y = data.y || game.safehouse.y;
    if (game.city.solidAt(x, y, player.radius)) {
      x = game.safehouse.x - 55;
      y = game.safehouse.y + 40;
    }
    player.x = x;
    player.y = y;
    player.angle = 0;
    player.aim = 0;
    CC.Police.clearUnits(game);
    for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
      if (game.enemies[i].missionTag || game.enemies[i].kind === 'cop') game.enemies.splice(i, 1);
    }
    if (game.missions.loadState) game.missions.loadState(data.missionIndex || 0, !!data.storyDone);
    game.camera.x = x;
    game.camera.y = y;
    game.camera.yaw = 0;
    game.camera.followCar = false;
    game.state = 'play';
    game.notify('SAVE LOADED · ' + (game.storyDone ? 'COSTA SOL IS YOURS' : 'CAREER RESTORED'), 'good');
    if (game.audio) game.audio.pickup();
    return true;
  }

  CC.Save = {
    read: readSave,
    write: writeSave,
    has: hasSave,
    clear: clearSave,
    apply: applySave,
    capture: capture,
  };
})();
