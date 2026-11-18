(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;

  const STORY = [
    {
      id: 'wake-up-call',
      name: 'WAKE UP CALL',
      client: 'Mara Voss',
      reward: 180,
      start: { x: 1500, y: 1288 },
      intro: [
        { who: 'Mara Voss', text: 'Rook. You look like a man who owes everybody. Good. That is my favourite kind.' },
        { who: 'Mara Voss', text: 'Take the pearl Vela by the diner. Do not scratch it. The buyer has already paid.' },
      ],
      steps: [
        { type: 'takeCar', x: 1790, y: 1352, carX: 1790, carY: 1352, carAngle: Math.PI, label: 'Steal the pearl Vela GT at the diner curb', kind: 'gold' },
        { type: 'drive', x: 4046, y: 2101, radius: 70, label: 'Drive the Vela to Pier 9', kind: 'gold' },
      ],
      outro: [{ who: 'Mara Voss', text: 'Not a scratch. Maybe you are not a total disaster. Here is your cut.' }],
    },
    {
      id: 'supply-run',
      name: 'SUPPLY RUN',
      client: 'Serge Okonkwo',
      reward: 280,
      start: { x: 1836, y: 2252 },
      intro: [
        { who: 'Serge Okonkwo', text: 'The Cobalts are moving product through my alley. I want it back before the dinner rush.' },
        { who: 'Serge Okonkwo', text: 'Two of Krane boys are watching the stash. Quiet is fine. Loud is also fine, if you are fast.' },
      ],
      steps: [
        { type: 'goto', x: 1288, y: 2402, radius: 46, label: 'Collect the package in the alley off Palm Row' },
        { type: 'kill', x: 1360, y: 2430, radius: 60, label: 'Deal with the Cobalt lookouts', spawn: [{ x: 1358, y: 2392 }, { x: 1342, y: 2462 }], tag: 'culprits' },
        { type: 'goto', x: 1836, y: 2252, radius: 70, label: 'Deliver the package to the Coral Room' },
      ],
      outro: [{ who: 'Serge Okonkwo', text: 'You are a problem solver. I like problem solvers. Come back when you need work.' }],
    },
    {
      id: 'boardwalk-shakedown',
      name: 'BOARDWALK SHAKEDOWN',
      client: 'Mara Voss',
      reward: 450,
      start: { x: 2600, y: 4034 },
      intro: [
        { who: 'Mara Voss', text: 'The Cobalts are shaking down every stall on the south boardwalk. Remind them who owns this coast.' },
        { who: 'Mara Voss', text: 'Three lookouts. Make sure none of them calls it in.' },
      ],
      steps: [
        { type: 'kill', x: 2635, y: 4002, radius: 70, label: 'Take out the boardwalk lookouts', spawn: [{ x: 2548, y: 3996, gang: 0 }, { x: 2632, y: 4016, gang: 0 }, { x: 2702, y: 3998, gang: 0 }], tag: 'lookouts', heat: 1 },
        { type: 'evade', x: 2600, y: 3900, label: 'Lose the CSPD patrol', heat: 2 },
      ],
      outro: [{ who: 'Mara Voss', text: 'The boardwalk is quiet again. Quiet is expensive. Here is your cut.' }],
    },
    {
      id: 'causeway-getaway',
      name: 'CAUSEWAY GETAWAY',
      client: 'Mara Voss',
      reward: 700,
      start: { x: 2900, y: 4036 },
      intro: [
        { who: 'Mara Voss', text: 'Krane lawyers are moving the ledger north. The Sirocco at the seawall is our ride.' },
        { who: 'Mara Voss', text: 'Ninety seconds to the north causeway. CSPD will pick you up on the bridge.' },
      ],
      steps: [
        { type: 'takeCar', x: 2900, y: 3988, carX: 2900, carY: 3988, carAngle: Math.PI, label: 'Boost the Sirocco at the seawall', kind: 'gold' },
        { type: 'drive', x: 2350, y: 62, radius: 84, timer: 90, label: 'Reach the north causeway in 90 seconds', kind: 'gold' },
        { type: 'evade', x: 2350, y: 300, label: 'Shake the CSPD tail', heat: 2 },
      ],
      outro: [{ who: 'Mara Voss', text: 'That ledger is worth more than the car. And the car was worth plenty.' }],
    },
    {
      id: 'kingpins-yacht',
      name: "THE KINGPIN'S YACHT",
      client: 'Mara Voss',
      reward: 1500,
      start: { x: 4024, y: 2101 },
      intro: [
        { who: 'Mara Voss', text: 'This is the one, Rook. Nadia Krane is on her yacht at Pier 9, counting money that should be ours.' },
        { who: 'Mara Voss', text: 'Go through her crew. Do not let the yacht leave the dock.' },
      ],
      steps: [
        { type: 'kill', x: 4090, y: 2101, radius: 80, label: 'Clear the pier guards', spawn: [{ x: 4072, y: 2088, gang: 0 }, { x: 4104, y: 2118, gang: 0 }, { x: 4148, y: 2086, gang: 0 }, { x: 4180, y: 2120, gang: 0 }], tag: 'pier-guards', heat: 1 },
        { type: 'goto', x: 4208, y: 2101, radius: 44, label: 'Board the Kingpin yacht at the end of Pier 9' },
        { type: 'kill', x: 4195, y: 2101, radius: 70, label: 'Take down Nadia Krane and her crew', spawn: [{ x: 4176, y: 2084, gang: 2 }, { x: 4200, y: 2118, gang: 2 }, { x: 4212, y: 2088, gang: 2, boss: true }, { x: 4224, y: 2120, gang: 2 }, { x: 4188, y: 2126, gang: 2 }], tag: 'yacht-crew', heat: 1 },
        { type: 'goto', x: 4012, y: 2240, radius: 70, label: 'Get off the pier before the CSPD locks it down' },
      ],
      outro: [{ who: 'Mara Voss', text: 'Costa Sol is yours, Rook. Try not to spend it all on bail.' }],
      ending: true,
    },
    {
      id: 'hot-cargo',
      name: 'HOT CARGO',
      client: 'Serge Okonkwo',
      reward: 240,
      repeatable: true,
      start: { x: 1836, y: 2252 },
      intro: [{ who: 'Serge Okonkwo', text: 'Got a crate that needs to be somewhere else. Quietly. The Coral Room pays same day.' }],
      steps: [
        { type: 'goto', x: 3420, y: 2900, radius: 58, label: 'Pick up the crate at Cobalt Docks' },
        { type: 'goto', x: 1836, y: 2252, radius: 70, label: 'Bring the crate back to the Coral Room' },
      ],
      outro: [{ who: 'Serge Okonkwo', text: 'Clean hands, full pockets. That is the Costa Sol way.' }],
    },
  ];

  function makeManager(game) {
    const mgr = {
      index: 0,
      active: false,
      state: 'idle',
      stepIndex: 0,
      step: null,
      spawnedTag: null,
      spawnedEnemies: 0,
      timer: 0,
      startCd: 0,
      marker: null,
      completed: 0,
      total: STORY.length - 1,
    };

    function storyMission() {
      return STORY[Math.min(mgr.index, STORY.length - 1)];
    }

    function markerForIdle() {
      const mission = storyMission();
      return {
        x: mission.start.x,
        y: mission.start.y,
        label: mgr.index >= STORY.length - 1 && game.storyDone ? 'HOT CARGO' : mission.name,
        kind: 'start',
        mission: mission.name,
        client: mission.client,
      };
    }

    function setMarker() {
      if (!mgr.active) {
        mgr.marker = markerForIdle();
      } else if (mgr.step) {
        let x = mgr.step.x;
        let y = mgr.step.y;
        if (mgr.step.type === 'takeCar' && mgr.step.missionCar) {
          x = mgr.step.missionCar.x;
          y = mgr.step.missionCar.y;
        }
        if (mgr.step.type === 'kill' && mgr.spawnedTag) {
          const alive = aliveForTag(mgr.spawnedTag);
          if (alive.length > 0) {
            x = alive[0].x;
            y = alive[0].y;
          }
        }
        mgr.marker = { x: x, y: y, label: mgr.step.label, kind: 'objective', mission: storyMission().name };
      }
    }

    function aliveForTag(tag) {
      const list = [];
      for (let i = 0; i < game.enemies.length; i += 1) {
        const e = game.enemies[i];
        if (!e.dead && e.missionTag === tag) list.push(e);
      }
      return list;
    }

    function clearMissionActors() {
      if (!mgr.step || !mgr.step.tag) return;
      const prefix = storyMission().id + ':' + mgr.step.tag;
      for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
        const e = game.enemies[i];
        if (!e.dead && e.missionTag && e.missionTag.indexOf(prefix) === 0) e.retreat = true;
      }
    }

    function spawnStepEnemies(step) {
      if (!step.spawn) return;
      const mission = storyMission();
      const tag = mission.id + ':' + step.tag;
      mgr.spawnedTag = tag;
      mgr.spawnedEnemies = 0;
      for (let i = 0; i < step.spawn.length; i += 1) {
        const spot = step.spawn[i];
        const gang = C.GANGS[spot.gang || 0];
        const enemy = CC.People.createEnemy(spot.x, spot.y, {
          gang: gang,
          alert: false,
          missionTag: tag,
          angle: Math.random() * U.TAU,
        });
        if (spot.boss) {
          enemy.hp = 150;
          enemy.maxHp = 150;
          enemy.speed = 88;
          enemy.boss = true;
          enemy.name = 'Nadia Krane';
        }
        game.enemies.push(enemy);
        mgr.spawnedEnemies += 1;
      }
    }

    function spawnMissionCar(step) {
      const car = CC.Vehicles.create(step.carType || (mgr.index === 3 ? 3 : 0), step.carX || step.x, step.carY || step.y, step.carAngle || 0, {
        mission: true,
        color: mgr.index === 0 ? '#efe7d5' : '#e8b04c',
      });
      car.mission = true;
      game.vehicles.push(car);
      step.missionCar = car;
    }

    function beginStep(index) {
      const mission = storyMission();
      mgr.stepIndex = index;
      mgr.step = mission.steps[index];
      mgr.timer = mgr.step.timer || 0;
      mgr.spawnedTag = null;
      mgr.spawnedEnemies = 0;
      if (mgr.step.type === 'takeCar' && !mgr.step.missionCar) spawnMissionCar(mgr.step);
      if (mgr.step.type === 'kill') spawnStepEnemies(mgr.step);
      if (mgr.step.type === 'evade') {
        const px = CC.Player.footX(game.player);
        const py = CC.Player.footY(game.player);
        game.reportCrime(mgr.step.heat || 2, px, py, 'MISSION HEAT');
        game.notify('LOSE THE POLICE', 'info');
      }
      if (mgr.step.type === 'kill' && mgr.step.heat) {
        game.reportCrime(mgr.step.heat, CC.Player.footX(game.player), CC.Player.footY(game.player), 'GANG SHOOTOUT');
      }
      setMarker();
    }

    function startMission(index) {
      mgr.index = index;
      const mission = storyMission();
      mgr.active = true;
      mgr.state = 'active';
      mgr.startCd = 0;
      mgr.completed = 0;
      beginStep(0);
      game.showDialogue(mission.intro || [], 6.2);
      game.notify('MISSION · ' + mission.name, 'mission');
      if (game.audio) game.audio.missionStart();
      if (game.saveGame) game.saveGame(true);
    }

    function completeMission() {
      const mission = storyMission();
      mgr.active = false;
      mgr.state = 'idle';
      mgr.step = null;
      mgr.timer = 0;
      mgr.startCd = 4;
      game.addCash(mission.reward, 'MISSION PAY');
      game.notify('MISSION COMPLETE · ' + U.formatMoney(mission.reward), 'good');
      if (game.audio) game.audio.missionChime();
      if (mission.outro) game.showDialogue(mission.outro, 6.5);
      if (game.stats) game.stats.missions += 1;
      if (mission.ending) {
        game.storyDone = true;
        mgr.index = STORY.length - 1;
        game.notify('COSTA SOL IS YOURS · FREE ROAM UNLOCKED', 'gold');
        if (game.audio) game.audio.fanfare();
      } else if (mission.repeatable) {
        mgr.index = STORY.length - 1;
      } else {
        mgr.index = Math.min(STORY.length - 1, mgr.index + 1);
      }
      mgr.marker = markerForIdle();
      if (game.saveGame) game.saveGame(true);
    }

    function failMission(reason) {
      if (!mgr.active) return;
      clearMissionActors();
      mgr.active = false;
      mgr.state = 'idle';
      mgr.step = null;
      mgr.timer = 0;
      mgr.startCd = 3;
      game.notify('MISSION FAILED · ' + reason, 'bad');
      mgr.marker = markerForIdle();
    }

    function stepComplete() {
      const mission = storyMission();
      if (mgr.stepIndex >= mission.steps.length - 1) {
        completeMission();
        return;
      }
      beginStep(mgr.stepIndex + 1);
      game.notify('OBJECTIVE UPDATED', 'info');
      if (game.audio) game.audio.missionChime();
    }

    function objectiveStatus() {
      if (!mgr.active || !mgr.step) {
        const mission = storyMission();
        return {
          title: game.storyDone && mgr.index >= STORY.length - 1 ? 'HOT CARGO' : mission.name,
          text: 'Reach the ' + (mission.repeatable ? 'Coral Room' : 'mission marker') + ' to start · ' + mission.client,
          distance: U.dist(CC.Player.footX(game.player), CC.Player.footY(game.player), mission.start.x, mission.start.y),
          timer: 0,
        };
      }
      let text = mgr.step.label;
      if (mgr.step.type === 'kill') {
        const alive = mgr.spawnedTag ? aliveForTag(mgr.spawnedTag).length : 0;
        const done = Math.max(0, mgr.spawnedEnemies - alive);
        text += '  ' + done + '/' + mgr.spawnedEnemies;
      }
      if (mgr.step.type === 'evade') text += '  ·  WANTED ' + game.wanted;
      let distance = 0;
      if (mgr.marker) distance = U.dist(CC.Player.footX(game.player), CC.Player.footY(game.player), mgr.marker.x, mgr.marker.y);
      return {
        title: storyMission().name,
        text: text,
        distance: distance,
        timer: mgr.timer,
      };
    }

    function update(dt) {
      mgr.startCd = Math.max(0, mgr.startCd - dt);
      if (!mgr.active) {
        mgr.marker = markerForIdle();
        if (mgr.startCd <= 0 && game.state === 'play') {
          const px = CC.Player.footX(game.player);
          const py = CC.Player.footY(game.player);
          const mission = storyMission();
          if (U.dist(px, py, mission.start.x, mission.start.y) < 52) startMission(mgr.index);
        }
        return;
      }
      const step = mgr.step;
      if (!step) return;
      if (mgr.timer > 0) {
        mgr.timer -= dt;
        if (mgr.timer <= 0) {
          failMission('OUT OF TIME');
          return;
        }
      }
      const px = CC.Player.footX(game.player);
      const py = CC.Player.footY(game.player);
      let done = false;
      if (step.type === 'goto' || step.type === 'drive') {
        const inCar = game.player.mode === 'car';
        const within = U.dist(px, py, step.x, step.y) < (step.radius || 50);
        if (within && (step.type !== 'drive' || inCar)) done = true;
      } else if (step.type === 'takeCar') {
        if (step.missionCar && game.player.mode === 'car' && game.player.car === step.missionCar) {
          step.missionCar.mission = true;
          done = true;
        }
      } else if (step.type === 'kill') {
        if (mgr.spawnedTag && aliveForTag(mgr.spawnedTag).length === 0 && mgr.spawnedEnemies > 0) done = true;
      } else if (step.type === 'evade') {
        if (game.wanted === 0) done = true;
      }
      if (done) stepComplete();
      setMarker();
    }

    function notifyCarEntered(g, car) {
      if (mgr.active && mgr.step && mgr.step.type === 'takeCar' && car.mission) {
        game.notify('VEHICLE SECURED · ' + car.name.toUpperCase(), 'good');
      }
    }

    function notifyKill(enemy) {
      if (!mgr.active || !mgr.step || mgr.step.type !== 'kill') return;
      if (enemy.boss) {
        game.notify('NADIA KRANE IS DOWN', 'gold');
      }
    }

    function onPlayerDeath(g) {
      if (mgr.active) {
        clearMissionActors();
        mgr.active = false;
        mgr.state = 'idle';
        mgr.step = null;
        mgr.timer = 0;
        mgr.startCd = 4;
        mgr.marker = markerForIdle();
      }
    }

    function debugStart(index, stepIndex) {
      startMission(index);
      if (stepIndex && stepIndex > 0) beginStep(stepIndex);
      game.dialogue = null;
    }

    function reset() {
      mgr.index = 0;
      mgr.active = false;
      mgr.state = 'idle';
      mgr.step = null;
      mgr.stepIndex = 0;
      mgr.timer = 0;
      mgr.startCd = 2;
      mgr.marker = markerForIdle();
    }

    function loadState(index, storyDone) {
      mgr.index = U.clamp(index || 0, 0, STORY.length - 1);
      mgr.active = false;
      mgr.state = 'idle';
      mgr.step = null;
      mgr.stepIndex = 0;
      mgr.timer = 0;
      mgr.startCd = 2.5;
      game.storyDone = !!storyDone;
      if (game.storyDone) mgr.index = STORY.length - 1;
      mgr.marker = markerForIdle();
    }

    function routePoints() {
      if (!mgr.marker) return [];
      const startX = CC.Player.footX(game.player);
      const startY = CC.Player.footY(game.player);
      const end = mgr.marker;
      const city = game.city;
      const a = city.nearestNode(startX, startY);
      const b = city.nearestNode(end.x, end.y);
      const points = [{ x: startX, y: startY }];
      if (U.dist(startX, startY, a.x, a.y) < 520 || true) points.push({ x: a.x, y: a.y });
      points.push({ x: a.x, y: b.y });
      points.push({ x: b.x, y: b.y });
      points.push({ x: end.x, y: end.y });
      return points;
    }

    mgr.startMission = startMission;
    mgr.update = update;
    mgr.beginStep = beginStep;
    mgr.objectiveStatus = objectiveStatus;
    mgr.notifyCarEntered = notifyCarEntered;
    mgr.notifyKill = notifyKill;
    mgr.onPlayerDeath = onPlayerDeath;
    mgr.failMission = failMission;
    mgr.debugStart = debugStart;
    mgr.reset = reset;
    mgr.loadState = loadState;
    mgr.routePoints = routePoints;
    mgr.story = STORY;
    mgr.marker = markerForIdle();
    return mgr;
  }

  CC.Missions = {
    create: makeManager,
    story: STORY,
  };
})();
