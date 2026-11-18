(function () {
  const CC = (window.CC = window.CC || {});
  const TAU = Math.PI * 2;

  function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function damp(a, b, rate, dt) {
    return lerp(a, b, 1 - Math.exp(-rate * dt));
  }

  function angleWrap(angle) {
    while (angle > Math.PI) angle -= TAU;
    while (angle < -Math.PI) angle += TAU;
    return angle;
  }

  function angleLerp(a, b, t) {
    return angleWrap(a + angleWrap(b - a) * clamp(t, 0, 1));
  }

  function angleDamp(a, b, rate, dt) {
    return angleLerp(a, b, 1 - Math.exp(-rate * dt));
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(bx - ax, by - ay);
  }

  function dist2(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    return dx * dx + dy * dy;
  }

  function rotate(x, y, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return { x: x * c - y * s, y: x * s + y * c };
  }

  function makeRng(seed) {
    let a = seed | 0;
    const rng = function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    rng.range = function (min, max) {
      return min + (max - min) * rng();
    };
    rng.int = function (min, max) {
      return Math.floor(min + (max - min + 1) * rng());
    };
    rng.chance = function (p) {
      return rng() < p;
    };
    rng.pick = function (list) {
      return list[Math.floor(rng() * list.length) % list.length];
    };
    rng.sign = function () {
      return rng() < 0.5 ? -1 : 1;
    };
    return rng;
  }

  function circleRect(cx, cy, radius, rect) {
    const nx = clamp(cx, rect.x, rect.x + rect.w);
    const ny = clamp(cy, rect.y, rect.y + rect.h);
    return dist2(cx, cy, nx, ny) < radius * radius;
  }

  function pointRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
  }

  function rectOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function segNearest(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy;
    let t = len > 0 ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
    t = clamp(t, 0, 1);
    return { x: ax + dx * t, y: ay + dy * t, t: t };
  }

  function formatMoney(value) {
    const n = Math.max(0, Math.round(value));
    const s = String(n);
    let out = '';
    for (let i = 0; i < s.length; i += 1) {
      if (i > 0 && (s.length - i) % 3 === 0) out += ',';
      out += s[i];
    }
    return '$' + out;
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600) % 24;
    const m = Math.floor((total % 3600) / 60);
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function pickWeighted(rng, list) {
    let total = 0;
    for (let i = 0; i < list.length; i += 1) total += list[i].weight || 1;
    let roll = rng() * total;
    for (let i = 0; i < list.length; i += 1) {
      roll -= list[i].weight || 1;
      if (roll <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  CC.util = {
    TAU: TAU,
    clamp: clamp,
    lerp: lerp,
    damp: damp,
    angleWrap: angleWrap,
    angleLerp: angleLerp,
    angleDamp: angleDamp,
    dist: dist,
    dist2: dist2,
    rotate: rotate,
    makeRng: makeRng,
    circleRect: circleRect,
    pointRect: pointRect,
    rectOverlap: rectOverlap,
    segNearest: segNearest,
    formatMoney: formatMoney,
    formatTime: formatTime,
    pickWeighted: pickWeighted,
  };
})();
