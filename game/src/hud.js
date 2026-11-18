(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;
  const P = C.PALETTE;
  const WIDTH = 1280;
  const HEIGHT = 720;

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function spaced(ctx, text, x, y, spacing, align) {
    const chars = String(text).split('');
    let total = 0;
    for (let i = 0; i < chars.length; i += 1) total += ctx.measureText(chars[i]).width + (i < chars.length - 1 ? spacing : 0);
    let cx = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
    ctx.textAlign = 'left';
    for (let i = 0; i < chars.length; i += 1) {
      ctx.fillText(chars[i], cx, y);
      cx += ctx.measureText(chars[i]).width + spacing;
    }
    return total;
  }

  function wrap(ctx, text, maxWidth) {
    const words = String(text).split(' ');
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i += 1) {
      const attempt = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(attempt).width > maxWidth && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = attempt;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function starPath(ctx, cx, cy, outer, inner, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const r = i % 2 === 0 ? outer : inner;
      const a = -Math.PI / 2 + (i * Math.PI) / points;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawStars(ctx, game, x, y, size) {
    for (let i = 0; i < C.WANTED.max; i += 1) {
      const on = i < game.wanted;
      const cx = x + i * (size * 1.42);
      if (on) {
        ctx.save();
        ctx.shadowColor = 'rgba(243, 185, 63, 0.85)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = P.gold;
        starPath(ctx, cx, y, size * 0.5, size * 0.22, 5);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(15, 20, 24, 0.45)';
        starPath(ctx, cx, y, size * 0.5, size * 0.22, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(230, 212, 170, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  function drawBrand(ctx, game) {
    ctx.save();
    ctx.translate(38, 38);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = P.gold;
    ctx.fillRect(-10, -10, 20, 20);
    ctx.fillStyle = '#151d22';
    ctx.fillRect(-6.5, -6.5, 13, 13);
    ctx.fillStyle = P.gold;
    ctx.fillRect(-2.5, -2.5, 5, 5);
    ctx.restore();
    ctx.fillStyle = P.cream;
    ctx.font = '700 21px "Arial Narrow", "Helvetica Neue", sans-serif';
    spaced(ctx, 'COSTA SOL', 58, 35, 2.6);
    ctx.fillStyle = P.gold;
    ctx.font = '700 9px "Helvetica Neue", sans-serif';
    spaced(ctx, 'HEATWAVE', 59, 49, 5.4);
    drawStars(ctx, game, 28, 73, 17);
  }

  function drawMoney(ctx, game) {
    const pulse = game.cashFlash || 0;
    const w = 184 + pulse * 8;
    ctx.fillStyle = 'rgba(14, 19, 23, 0.72)';
    roundRect(ctx, 24, 92, w, 48, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(243, 185, 63, 0.24)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(243, 185, 63, 0.8)';
    ctx.font = '700 8px "Helvetica Neue", sans-serif';
    spaced(ctx, 'CASH', 38, 108, 2.4);
    ctx.fillStyle = P.cream;
    ctx.font = '700 23px "Arial Narrow", "Helvetica Neue", sans-serif';
    ctx.fillText(U.formatMoney(game.cash), 37, 131);
    ctx.fillStyle = 'rgba(247, 238, 217, 0.45)';
    ctx.font = '600 8px "Helvetica Neue", sans-serif';
    spaced(ctx, C.VERSION, 24 + w - 12, 108, 1.3, 'right');
  }

  function drawMission(ctx, game) {
    const status = game.missions.objectiveStatus();
    const active = game.missions.active;
    const x = 24;
    let y = 154;
    const w = 344;
    ctx.font = '600 12px "Helvetica Neue", sans-serif';
    const lines = wrap(ctx, status.text, w - 34);
    const h = 66 + lines.length * 16 + (status.timer > 0 ? 14 : 0);
    ctx.fillStyle = 'rgba(14, 19, 23, 0.74)';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = active ? P.gold : 'rgba(247, 238, 217, 0.55)';
    ctx.fillRect(x, y, 4, h);
    ctx.fillStyle = active ? P.gold : 'rgba(247, 238, 217, 0.45)';
    ctx.font = '700 8px "Helvetica Neue", sans-serif';
    spaced(ctx, active ? 'CURRENT JOB' : 'NEXT JOB', x + 18, y + 20, 3);
    ctx.fillStyle = P.cream;
    ctx.font = '700 17px "Arial Narrow", "Helvetica Neue", sans-serif';
    ctx.fillText(status.title, x + 18, y + 42);
    ctx.fillStyle = active ? 'rgba(247, 238, 217, 0.92)' : 'rgba(247, 238, 217, 0.66)';
    ctx.font = '600 12px "Helvetica Neue", sans-serif';
    for (let i = 0; i < lines.length; i += 1) ctx.fillText(lines[i], x + 18, y + 62 + i * 16);
    const distY = y + 62 + lines.length * 16 + 2;
    if (status.distance !== undefined) {
      const dist = status.distance < 1000 ? Math.round(status.distance) + ' M' : (status.distance / 1000).toFixed(1) + ' KM';
      ctx.fillStyle = P.gold;
      ctx.font = '700 10px "Helvetica Neue", sans-serif';
      spaced(ctx, dist, x + 18, distY + 8, 1.8);
      ctx.fillStyle = 'rgba(247, 238, 217, 0.4)';
      spaced(ctx, 'DISTANCE', x + 84, distY + 8, 1.6);
    }
    if (status.timer > 0) {
      const frac = U.clamp(status.timer / 90, 0, 1);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(x + 18, distY + 18, w - 36, 4);
      ctx.fillStyle = status.timer < 15 ? P.red : P.gold;
      ctx.fillRect(x + 18, distY + 18, (w - 36) * frac, 4);
    }
  }

  function drawBars(ctx, game) {
    const player = game.player;
    const x = 24;
    const y = 646;
    const w = 226;
    const hp = player.health / player.maxHealth;
    const armor = player.armor / 100;
    ctx.fillStyle = 'rgba(14, 19, 23, 0.65)';
    roundRect(ctx, x - 8, y - 18, w + 58, 52, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(247, 238, 217, 0.45)';
    ctx.font = '700 7px "Helvetica Neue", sans-serif';
    spaced(ctx, 'HEALTH', x, y - 6, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fillRect(x, y, w, 7);
    const hpColor = hp < 0.3 ? P.red : hp < 0.55 ? '#e3a13d' : '#77bd6a';
    ctx.fillStyle = hpColor;
    ctx.fillRect(x, y, w * U.clamp(hp, 0, 1), 7);
    ctx.fillStyle = 'rgba(247, 238, 217, 0.45)';
    spaced(ctx, 'ARMOR', x, y + 19, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fillRect(x, y + 25, w, 5);
    ctx.fillStyle = '#6ba7d8';
    ctx.fillRect(x, y + 25, w * U.clamp(armor, 0, 1), 5);
    ctx.fillStyle = P.cream;
    ctx.font = '700 20px "Arial Narrow", "Helvetica Neue", sans-serif';
    ctx.fillText(String(Math.ceil(player.health)), x + w + 12, y + 9);
    ctx.fillStyle = 'rgba(247, 238, 217, 0.5)';
    ctx.font = '600 8px "Helvetica Neue", sans-serif';
    ctx.fillText('RICO VELA', x, y + 45);
    ctx.fillStyle = P.gold;
    ctx.fillText('· ' + C.CHARACTERS.hero.tag, x + 60, y + 45);
  }

  function drawNotifications(ctx, game) {
    const list = game.notifications;
    if (!list || list.length === 0) return;
    let y = 30;
    for (let i = list.length - 1; i >= 0 && i >= list.length - 4; i -= 1) {
      const note = list[i];
      const age = game.time - note.time;
      const alpha = U.clamp(Math.min(1, (note.life - age) * 2), 0, 1);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '700 11px "Helvetica Neue", sans-serif';
      const text = note.text;
      const tw = ctx.measureText(text).width;
      const w = Math.min(460, tw + 54);
      const x = WIDTH / 2 - w / 2;
      ctx.fillStyle = 'rgba(14, 19, 23, 0.78)';
      roundRect(ctx, x, y, w, 26, 6);
      ctx.fill();
      let tone = P.gold;
      if (note.kind === 'bad' || note.kind === 'crime') tone = P.red;
      else if (note.kind === 'good') tone = P.green;
      else if (note.kind === 'info') tone = '#8fb9c5';
      ctx.fillStyle = tone;
      ctx.fillRect(x, y + 4, 3, 18);
      ctx.beginPath();
      ctx.arc(x + 16, y + 13, 3, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = P.cream;
      ctx.textAlign = 'center';
      ctx.fillText(text, WIDTH / 2 + 6, y + 17);
      ctx.textAlign = 'left';
      y += 32;
      ctx.restore();
    }
  }

  function drawMinimap(ctx, game) {
    const w = 214;
    const h = 214;
    const x = WIDTH - w - 24;
    const y = 22;
    const pad = 9;
    const size = w - pad * 2;
    const scale = size / 4060;
    ctx.save();
    ctx.fillStyle = 'rgba(11, 17, 21, 0.88)';
    roundRect(ctx, x, y, w, h + 28, 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(243, 185, 63, 0.32)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    roundRect(ctx, x + pad, y + pad, size, size, 5);
    ctx.clip();
    ctx.fillStyle = '#14515d';
    ctx.fillRect(x + pad, y + pad, size, size);
    function mp(wx, wy) {
      return { x: x + pad + wx * scale, y: y + pad + wy * scale };
    }
    const land = mp(0, 0);
    ctx.fillStyle = '#d9c395';
    ctx.fillRect(land.x, land.y, 4060 * scale, 4060 * scale);
    ctx.fillStyle = '#847c6d';
    ctx.fillRect(land.x + 40 * scale, land.y + 40 * scale, 3980 * scale, 3980 * scale);
    const city = game.city;
    for (let i = 0; i < city.blocks.length; i += 1) {
      const b = city.blocks[i];
      const p0 = mp(b.x, b.y);
      if (b.type === 'park') ctx.fillStyle = '#56834f';
      else if (b.type === 'plaza') ctx.fillStyle = '#b6a889';
      else if (b.type === 'parking') ctx.fillStyle = '#777164';
      else ctx.fillStyle = '#a69880';
      ctx.fillRect(p0.x, p0.y, b.w * scale, b.h * scale);
    }
    ctx.strokeStyle = 'rgba(30, 32, 32, 0.55)';
    ctx.lineWidth = Math.max(1.4, 90 * scale);
    for (let i = 0; i <= 7; i += 1) {
      const c = mp(120 + i * 550, 120 + i * 550);
      ctx.beginPath();
      ctx.moveTo(c.x, land.y);
      ctx.lineTo(c.x, land.y + 4060 * scale);
      ctx.moveTo(land.x, c.y);
      ctx.lineTo(land.x + 4060 * scale, c.y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(196, 154, 97, 0.9)';
    for (let p = 0; p < city.piers.length; p += 1) {
      const pier = city.piers[p];
      const b = mp(pier.x, pier.y);
      ctx.fillRect(b.x, b.y, pier.w * scale, pier.h * scale);
    }
    const px = CC.Player.footX(game.player);
    const py = CC.Player.footY(game.player);
    const marker = game.missions.marker;
    if (marker) {
      const a = mp(px, py);
      const b = mp(marker.x, marker.y);
      ctx.strokeStyle = 'rgba(243, 185, 63, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = P.gold;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
    for (let i = 0; i < game.enemies.length; i += 1) {
      const e = game.enemies[i];
      if (e.dead) continue;
      const p = mp(e.x, e.y);
      ctx.fillStyle = e.kind === 'cop' ? '#7fb2ea' : '#e0553f';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.6, 0, U.TAU);
      ctx.fill();
    }
    for (let i = 0; i < game.policeUnits.length; i += 1) {
      const car = game.policeUnits[i];
      if (car.disabled) continue;
      const p = mp(car.x, car.y);
      const phase = Math.floor(game.time * 6) % 2;
      ctx.fillStyle = phase === 0 ? '#ff5140' : '#5b8fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.2, 0, U.TAU);
      ctx.fill();
    }
    const safe = mp(game.safehouse.x, game.safehouse.y);
    ctx.fillStyle = '#7bd88a';
    ctx.beginPath();
    ctx.arc(safe.x, safe.y, 3.5, 0, U.TAU);
    ctx.fill();
    const pp = mp(px, py);
    ctx.save();
    ctx.translate(pp.x, pp.y);
    ctx.rotate((game.player.mode === 'car' && game.player.car ? game.player.car.angle : game.player.angle) + Math.PI / 2);
    ctx.fillStyle = P.cream;
    ctx.strokeStyle = 'rgba(15, 20, 24, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 2.5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    const district = game.city.districtAt(px, py);
    ctx.fillStyle = P.gold;
    ctx.font = '700 8px "Helvetica Neue", sans-serif';
    spaced(ctx, district, x + 12, y + h + 18, 2.1);
    ctx.fillStyle = 'rgba(247, 238, 217, 0.55)';
    ctx.font = '600 8px "Helvetica Neue", sans-serif';
    spaced(ctx, 'COSTA SOL ISLAND', x + w - 12, y + h + 18, 1.4, 'right');
    ctx.fillStyle = 'rgba(14, 19, 23, 0.7)';
    ctx.beginPath();
    ctx.arc(x + w - 18, y + 18, 11, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = P.cream;
    ctx.font = '700 10px "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', x + w - 18, y + 22);
    ctx.textAlign = 'left';
  }

  function drawSpeedo(ctx, game) {
    const car = game.player.car;
    if (!car) return;
    const x = WIDTH - 118;
    const y = HEIGHT - 84;
    const mph = Math.round(Math.abs(car.speed) * 0.62);
    ctx.save();
    ctx.fillStyle = 'rgba(14, 19, 23, 0.74)';
    roundRect(ctx, x - 68, y - 58, 172, 96, 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(243, 185, 63, 0.24)';
    ctx.lineWidth = 1;
    ctx.stroke();
    const cx = x - 6;
    const cy = y + 4;
    const r = 38;
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.76, Math.PI * 2.24);
    ctx.stroke();
    const ratio = U.clamp(Math.abs(car.speed) / car.spec.max, 0, 1);
    ctx.strokeStyle = ratio > 0.82 ? P.red : P.gold;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.76, Math.PI * (0.76 + 1.48 * ratio));
    ctx.stroke();
    const angle = Math.PI * 0.76 + Math.PI * 1.48 * ratio;
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
    ctx.lineTo(cx + Math.cos(angle) * (r - 9), cy + Math.sin(angle) * (r - 9));
    ctx.stroke();
    ctx.fillStyle = P.cream;
    ctx.font = '700 22px "Arial Narrow", "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(mph), cx, cy + 4);
    ctx.font = '700 7px "Helvetica Neue", sans-serif';
    ctx.fillStyle = 'rgba(247, 238, 217, 0.55)';
    spaced(ctx, 'MPH', cx, cy + 17, 1.6, 'center');
    ctx.textAlign = 'left';
    ctx.fillStyle = P.gold;
    ctx.font = '700 8px "Helvetica Neue", sans-serif';
    spaced(ctx, car.name.toUpperCase(), x + 52, y - 18, 1.6);
    ctx.fillStyle = 'rgba(247, 238, 217, 0.5)';
    ctx.font = '600 8px "Helvetica Neue", sans-serif';
    ctx.fillText(car.hp + ' / ' + car.maxHp + ' BODY', x + 52, y - 5);
    const maxHp = car.maxHp || 3;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x + 52, y + 2, 44, 4);
    ctx.fillStyle = car.hp <= 1 ? P.red : P.green;
    ctx.fillRect(x + 52, y + 2, 44 * U.clamp(car.hp / maxHp, 0, 1), 4);
    if (car.disabled) {
      ctx.fillStyle = P.red;
      ctx.font = '700 9px "Helvetica Neue", sans-serif';
      spaced(ctx, 'WRECKED', x + 52, y + 20, 2);
    }
    ctx.restore();
  }

  function drawPrompt(ctx, game) {
    if (game.player.dead) return;
    const label = CC.Player.interactionLabel(game);
    if (!label) return;
    ctx.font = '700 11px "Helvetica Neue", sans-serif';
    const tw = ctx.measureText(label).width;
    const w = tw + 58;
    const x = WIDTH / 2 - w / 2;
    const y = HEIGHT - 92;
    ctx.fillStyle = 'rgba(14, 19, 23, 0.82)';
    roundRect(ctx, x, y, w, 30, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(243, 185, 63, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = P.gold;
    roundRect(ctx, x + 7, y + 7, 17, 17, 4);
    ctx.fill();
    ctx.fillStyle = '#151d22';
    ctx.font = '700 10px "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('E', x + 15.5, y + 19);
    ctx.textAlign = 'left';
    ctx.fillStyle = P.cream;
    ctx.font = '700 10px "Helvetica Neue", sans-serif';
    ctx.fillText(label.replace(/^E\s+/, ''), x + 32, y + 19);
  }

  function drawControls(ctx, game) {
    if (game.player.dead || game.dialogue) return;
    ctx.fillStyle = 'rgba(247, 238, 217, 0.34)';
    ctx.font = '600 8px "Helvetica Neue", sans-serif';
    const text = game.player.mode === 'car'
      ? 'WASD DRIVE · SPACE HANDBRAKE · E EXIT · H HORN · Z/C LOOK · TAB PAUSE'
      : 'WASD MOVE · MOUSE AIM/FIRE · E VEHICLE · SHIFT SPRINT · SPACE JUMP · F MELEE · Q WEAPON · TAB PAUSE';
    spaced(ctx, text, WIDTH / 2, HEIGHT - 16, 1.15, 'center');
  }

  function drawDialogue(ctx, game) {
    const d = game.dialogue;
    if (!d || !d.lines || !d.lines.length) return;
    const line = d.lines[Math.min(d.index, d.lines.length - 1)];
    if (!line) return;
    const w = 724;
    const h = 112;
    const x = WIDTH / 2 - w / 2;
    const y = HEIGHT - h - 34;
    ctx.fillStyle = 'rgba(12, 17, 21, 0.9)';
    roundRect(ctx, x, y, w, h, 9);
    ctx.fill();
    ctx.fillStyle = P.gold;
    ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = P.gold;
    ctx.font = '700 10px "Helvetica Neue", sans-serif';
    spaced(ctx, String(line.who || '').toUpperCase(), x + 26, y + 28, 2.6);
    ctx.fillStyle = P.cream;
    ctx.font = '600 16px "Georgia", "Times New Roman", serif';
    const lines = wrap(ctx, '“' + line.text + '”', w - 52);
    for (let i = 0; i < lines.length && i < 3; i += 1) ctx.fillText(lines[i], x + 26, y + 54 + i * 21);
    ctx.fillStyle = 'rgba(247, 238, 217, 0.5)';
    ctx.font = '600 9px "Helvetica Neue", sans-serif';
    spaced(ctx, 'ENTER  CONTINUE', x + w - 26, y + h - 14, 1.6, 'right');
    for (let i = 0; i < d.lines.length; i += 1) {
      ctx.fillStyle = i === d.index ? P.gold : 'rgba(247, 238, 217, 0.25)';
      ctx.fillRect(x + 26 + i * 16, y + h - 17, 11, 3);
    }
  }

  function drawMarkerArrow(ctx, game) {
    const marker = game.missions.marker;
    if (!marker) return;
    const p = CC.Camera.project(game.camera, marker.x, marker.y);
    const margin = 54;
    if (p.x > margin && p.x < WIDTH - margin && p.y > margin && p.y < HEIGHT - margin) return;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const angle = Math.atan2(p.y - cy, p.x - cx);
    const rx = WIDTH / 2 - 68;
    const ry = HEIGHT / 2 - 68;
    const t = Math.min(Math.abs(rx / Math.cos(angle)), Math.abs(ry / Math.sin(angle)));
    const ex = cx + Math.cos(angle) * t;
    const ey = cy + Math.sin(angle) * t;
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(243, 185, 63, 0.88)';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    const dist = U.dist(CC.Player.footX(game.player), CC.Player.footY(game.player), marker.x, marker.y);
    ctx.fillStyle = P.cream;
    ctx.font = '700 9px "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((dist < 1000 ? Math.round(dist) + ' M' : (dist / 1000).toFixed(1) + ' KM'), ex + Math.cos(angle) * 22, ey + Math.sin(angle) * 22 + 3);
    ctx.textAlign = 'left';
  }

  function drawReticle(ctx, game) {
    if (game.state !== 'play' || game.player.dead || game.shotMode) return;
    const mx = game.input.mouseX;
    const my = game.input.mouseY;
    ctx.save();
    ctx.strokeStyle = 'rgba(247, 238, 217, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(mx, my, 8, 0, U.TAU);
    ctx.stroke();
    ctx.fillStyle = P.gold;
    ctx.beginPath();
    ctx.arc(mx, my, 1.8, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(247, 238, 217, 0.55)';
    ctx.beginPath();
    ctx.moveTo(mx - 13, my);
    ctx.lineTo(mx - 6, my);
    ctx.moveTo(mx + 6, my);
    ctx.lineTo(mx + 13, my);
    ctx.moveTo(mx, my - 13);
    ctx.lineTo(mx, my - 6);
    ctx.moveTo(mx, my + 6);
    ctx.lineTo(mx, my + 13);
    ctx.stroke();
    ctx.restore();
  }

  function drawTopCenter(ctx, game) {
    const x = WIDTH / 2;
    ctx.fillStyle = 'rgba(247, 238, 217, 0.5)';
    ctx.font = '700 8px "Helvetica Neue", sans-serif';
    const hour = 16.5 + (game.time / 60) % 3.2;
    const hh = Math.floor(hour);
    const mm = Math.floor((hour - hh) * 60);
    const time = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
    spaced(ctx, 'GOLDEN HOUR  ·  ' + time, x, 21, 2.4, 'center');
  }

  function drawDamage(ctx, game) {
    const player = game.player;
    const hurt = Math.max(player.hurtFlash || 0, player.health < 30 && !player.dead ? 0.28 + Math.sin(game.time * 5) * 0.1 : 0);
    if (hurt <= 0.01) return;
    const grad = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, HEIGHT * 0.35, WIDTH / 2, HEIGHT / 2, HEIGHT * 0.8);
    grad.addColorStop(0, 'rgba(150, 20, 15, 0)');
    grad.addColorStop(1, 'rgba(150, 20, 15, ' + U.clamp(hurt * 0.55, 0, 0.6) + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  function drawDeath(ctx, game) {
    if (game.state !== 'dead') return;
    ctx.fillStyle = 'rgba(10, 8, 8, 0.55)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = P.cream;
    ctx.font = '700 54px "Arial Narrow", "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    spaced(ctx, 'FLATLINED', WIDTH / 2, HEIGHT / 2 - 18, 6, 'center');
    ctx.fillStyle = P.gold;
    ctx.font = '700 12px "Helvetica Neue", sans-serif';
    spaced(ctx, 'COSTA SOL MEDICAL IS ON THE WAY', WIDTH / 2, HEIGHT / 2 + 18, 2.4, 'center');
    const remain = U.clamp(1 - game.deathTimer / 4.2, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(WIDTH / 2 - 130, HEIGHT / 2 + 42, 260, 4);
    ctx.fillStyle = P.gold;
    ctx.fillRect(WIDTH / 2 - 130, HEIGHT / 2 + 42, 260 * remain, 4);
    ctx.textAlign = 'left';
  }

  function draw(ctx, game) {
    if (game.state === 'menu' || game.hudHidden) return;
    if (game.camera) {
      game.camera.width = WIDTH;
      game.camera.height = HEIGHT;
    }
    drawTopCenter(ctx, game);
    drawBrand(ctx, game);
    drawMoney(ctx, game);
    drawMission(ctx, game);
    drawNotifications(ctx, game);
    drawMinimap(ctx, game);
    drawBars(ctx, game);
    if (game.player.mode === 'car') drawSpeedo(ctx, game);
    drawMarkerArrow(ctx, game);
    drawPrompt(ctx, game);
    drawControls(ctx, game);
    drawDialogue(ctx, game);
    drawReticle(ctx, game);
    drawDamage(ctx, game);
    drawDeath(ctx, game);
  }

  CC.Hud = {
    draw: draw,
    roundRect: roundRect,
    spaced: spaced,
    wrap: wrap,
  };
})();
