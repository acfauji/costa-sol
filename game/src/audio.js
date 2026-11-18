(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;

  function createAudio() {
    let ctx = null;
    let master = null;
    let engine = null;
    let engineGain = null;
    let siren = null;
    let sirenGain = null;
    let ambientGain = null;
    let musicGain = null;
    let noiseBuffer = null;
    let muted = false;
    let started = false;
    let gullTimer = 7;
    let musicTimer = 0;
    let musicStep = 0;

    try {
      muted = window.localStorage.getItem(C.MUTE_KEY) === '1';
    } catch (error) {
      muted = false;
    }

    function makeNoise(seconds) {
      const length = Math.floor(ctx.sampleRate * seconds);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      return buffer;
    }

    function noise(duration, filterHz, volume, type) {
      if (!ctx || muted) return;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = type || 'lowpass';
      filter.frequency.value = filterHz;
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      src.connect(filter).connect(gain).connect(master);
      src.start(now);
      src.stop(now + duration);
    }

    function tone(freq, duration, type, volume, delay, slideTo) {
      if (!ctx || muted) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime + (delay || 0);
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    function startAmbience() {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      filter.Q.value = 0.6;
      ambientGain = ctx.createGain();
      ambientGain.gain.value = 0.028;
      src.connect(filter).connect(ambientGain).connect(master);
      src.start();

      const pad = ctx.createOscillator();
      pad.type = 'triangle';
      pad.frequency.value = 110;
      const pad2 = ctx.createOscillator();
      pad2.type = 'sine';
      pad2.frequency.value = 164.81;
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.013;
      pad.connect(musicGain);
      pad2.connect(musicGain);
      musicGain.connect(master);
      pad.start();
      pad2.start();

      engine = ctx.createOscillator();
      engine.type = 'sawtooth';
      engine.frequency.value = 52;
      const engine2 = ctx.createOscillator();
      engine2.type = 'square';
      engine2.frequency.value = 26;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      const engineFilter = ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 520;
      engine.connect(engineFilter);
      engine2.connect(engineFilter);
      engineFilter.connect(engineGain).connect(master);
      engine.start();
      engine2.start();

      siren = ctx.createOscillator();
      siren.type = 'triangle';
      siren.frequency.value = 720;
      sirenGain = ctx.createGain();
      sirenGain.gain.value = 0;
      siren.connect(sirenGain).connect(master);
      siren.start();
    }

    const audio = {
      init: function () {
        if (started) {
          if (ctx && ctx.state === 'suspended') ctx.resume();
          return;
        }
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;
        try {
          ctx = new Ctor();
          master = ctx.createGain();
          master.gain.value = muted ? 0 : 0.62;
          master.connect(ctx.destination);
          noiseBuffer = makeNoise(2);
          startAmbience();
          started = true;
        } catch (error) {
          ctx = null;
        }
      },
      isMuted: function () {
        return muted;
      },
      setMuted: function (value) {
        muted = !!value;
        if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.62, ctx.currentTime, 0.05);
        try {
          window.localStorage.setItem(C.MUTE_KEY, muted ? '1' : '0');
        } catch (error) {
          /* storage may be unavailable on file:// */
        }
      },
      toggleMute: function () {
        audio.setMuted(!muted);
        if (!muted) audio.click();
        return muted;
      },
      update: function (game, dt) {
        if (!ctx || !started) return;
        const now = ctx.currentTime;
        let speed = 0;
        let driving = false;
        if (game.player.mode === 'car' && game.player.car) {
          driving = true;
          speed = Math.abs(game.player.car.speed);
          engine.frequency.setTargetAtTime(48 + speed * 1.15, now, 0.08);
          engineGain.gain.setTargetAtTime(muted ? 0 : 0.018 + Math.min(0.05, speed * 0.00018), now, 0.1);
        } else {
          engineGain.gain.setTargetAtTime(0, now, 0.2);
        }
        if (siren && sirenGain) {
          const policeNear = game.wanted > 0;
          sirenGain.gain.setTargetAtTime(policeNear && !muted ? 0.012 : 0, now, 0.2);
          const phase = Math.sin(game.time * 5.4);
          siren.frequency.setTargetAtTime(660 + (phase > 0 ? 210 : 0), now, 0.09);
        }
        gullTimer -= dt;
        if (gullTimer <= 0) {
          gullTimer = 9 + Math.random() * 14;
          tone(1350 + Math.random() * 280, 0.16, 'sine', 0.008);
          tone(1150 + Math.random() * 200, 0.22, 'sine', 0.006, 0.18);
        }
        musicTimer -= dt;
        if (musicTimer <= 0) {
          musicTimer = 2.4;
          const chords = [146.83, 174.61, 196.0, 130.81];
          const root = chords[musicStep % chords.length];
          musicStep += 1;
          tone(root, 2.1, 'sine', 0.006);
          tone(root * 1.5, 2.2, 'triangle', 0.004, 0.12);
        }
        if (driving && speed > 4 && Math.random() < dt * 2) {
          noise(0.05, 900, 0.006, 'bandpass');
        }
      },
      click: function () {
        tone(880, 0.05, 'square', 0.02);
      },
      door: function () {
        noise(0.08, 900, 0.06);
        tone(180, 0.06, 'square', 0.018);
      },
      horn: function () {
        tone(392, 0.35, 'square', 0.03);
        tone(523, 0.35, 'square', 0.024);
      },
      shot: function (weapon, volume) {
        const gain = volume || 1;
        noise(0.14, 1600, 0.15 * gain, 'highpass');
        tone(130, 0.09, 'square', 0.05 * gain, 0, 55);
      },
      whoosh: function () {
        noise(0.12, 500, 0.025, 'bandpass');
      },
      thud: function () {
        tone(90, 0.16, 'sine', 0.06, 0, 45);
        noise(0.1, 500, 0.05);
      },
      hurt: function () {
        tone(160, 0.16, 'sawtooth', 0.03, 0, 80);
      },
      pickup: function () {
        tone(660, 0.09, 'sine', 0.04);
        tone(990, 0.14, 'sine', 0.035, 0.09);
      },
      missionStart: function () {
        tone(392, 0.18, 'triangle', 0.035);
        tone(523, 0.22, 'triangle', 0.032, 0.16);
        tone(659, 0.32, 'triangle', 0.03, 0.32);
      },
      missionChime: function () {
        tone(784, 0.13, 'sine', 0.03);
        tone(1046, 0.22, 'sine', 0.026, 0.12);
      },
      fanfare: function () {
        tone(523, 0.2, 'triangle', 0.04);
        tone(659, 0.2, 'triangle', 0.04, 0.18);
        tone(784, 0.2, 'triangle', 0.04, 0.36);
        tone(1046, 0.55, 'triangle', 0.045, 0.54);
      },
      explosion: function () {
        noise(0.75, 900, 0.32);
        tone(70, 0.6, 'sawtooth', 0.12, 0, 28);
      },
      explosionSmall: function () {
        noise(0.35, 700, 0.16);
        tone(110, 0.3, 'square', 0.05, 0, 40);
      },
      sirenBlip: function () {
        tone(760, 0.16, 'triangle', 0.03);
        tone(980, 0.16, 'triangle', 0.026, 0.16);
      },
      death: function () {
        tone(330, 0.4, 'triangle', 0.04, 0, 120);
        tone(220, 0.6, 'triangle', 0.03, 0.3, 80);
      },
    };
    return audio;
  }

  CC.Audio = {
    create: createAudio,
  };
})();
