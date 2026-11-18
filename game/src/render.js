(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;
  const P = C.PALETTE;

  function parseHex(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  const shadeCache = {};
  function shade(hex, factor) {
    const key = hex + ':' + factor.toFixed(2);
    if (shadeCache[key]) return shadeCache[key];
    const rgb = parseHex(hex);
    const out = 'rgb(' + rgb.map(function (v) {
      return Math.max(0, Math.min(255, Math.round(factor >= 0 ? v + (255 - v) * factor : v * (1 + factor))));
    }).join(',') + ')';
    shadeCache[key] = out;
    return out;
  }

  function upWorld(camera) {
    return { x: Math.sin(camera.yaw), y: -Math.cos(camera.yaw) };
  }

  function createRenderer(canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    const width = 1280;
    const height = 720;

    function drawWater(game, bounds) {
      const t = game.time;
      ctx.fillStyle = P.waterDeep;
      ctx.fillRect(-3000, -3000, 11000, 11000);
      ctx.strokeStyle = 'rgba(160, 235, 232, 0.07)';
      ctx.lineWidth = 2;
      const startX = Math.floor((bounds.x - bounds.r) / 110) * 110;
      const endX = bounds.x + bounds.r;
      const startY = Math.floor((bounds.y - bounds.r) / 90) * 90;
      const endY = bounds.y + bounds.r;
      for (let y = startY; y < endY; y += 90) {
        ctx.beginPath();
        for (let x = startX; x < endX; x += 26) {
          const wy = y + Math.sin((x + t * 14) * 0.012 + y * 0.01) * 6;
          if (x === startX) ctx.moveTo(x, wy);
          else ctx.lineTo(x, wy);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(220, 255, 245, 0.14)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const coast = 4060;
      for (let y = 0; y <= coast; y += 20) {
        ctx.moveTo(coast + Math.sin(y * 0.02 + t * 0.8) * 3, y);
        ctx.lineTo(coast + 10 + Math.sin(y * 0.02 + t * 0.8) * 3, y);
      }
      for (let x = 0; x <= coast; x += 20) {
        ctx.moveTo(x, coast + Math.sin(x * 0.02 + t * 0.9) * 3);
        ctx.lineTo(x, coast + 10 + Math.sin(x * 0.02 + t * 0.9) * 3);
      }
      ctx.stroke();
    }

    function drawLand(game) {
      const M = C.MAP;
      ctx.fillStyle = P.sand;
      ctx.fillRect(0, 0, M.land, M.land);
      ctx.fillStyle = P.sandDark;
      ctx.fillRect(0, 0, 46, M.land);
      ctx.fillRect(0, 0, M.land, 46);
      ctx.fillRect(M.land - 46, 0, 46, M.land);
      ctx.fillRect(0, M.land - 46, M.land, 46);
      ctx.fillStyle = P.asphalt;
      ctx.fillRect(40, 40, M.land - 80, M.land - 80);
      ctx.fillStyle = 'rgba(255, 220, 160, 0.035)';
      ctx.fillRect(40, 40, M.land - 80, M.land - 80);
    }

    function drawRoads(game) {
      const M = C.MAP;
      ctx.save();
      ctx.strokeStyle = P.laneSoft;
      ctx.lineWidth = 3;
      ctx.setLineDash([24, 22]);
      for (let j = 1; j < M.grid; j += 1) {
        const x = game.city.roadCoord(j);
        for (let i = 0; i < M.grid; i += 1) {
          const y0 = game.city.roadCoord(i) + 52;
          const y1 = game.city.roadCoord(i + 1) - 52;
          ctx.beginPath();
          ctx.moveTo(x, y0);
          ctx.lineTo(x, y1);
          ctx.stroke();
        }
      }
      for (let i = 1; i < M.grid; i += 1) {
        const y = game.city.roadCoord(i);
        for (let j = 0; j < M.grid; j += 1) {
          const x0 = game.city.roadCoord(j) + 52;
          const x1 = game.city.roadCoord(j + 1) - 52;
          ctx.beginPath();
          ctx.moveTo(x0, y);
          ctx.lineTo(x1, y);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(230, 214, 171, 0.14)';
      ctx.lineWidth = 2;
      for (let j = 0; j <= M.grid; j += 1) {
        const x = game.city.roadCoord(j);
        ctx.beginPath();
        ctx.moveTo(x - 30, 40);
        ctx.lineTo(x - 30, M.land - 40);
        ctx.moveTo(x + 30, 40);
        ctx.lineTo(x + 30, M.land - 40);
        ctx.stroke();
      }
      for (let i = 0; i <= M.grid; i += 1) {
        const y = game.city.roadCoord(i);
        ctx.beginPath();
        ctx.moveTo(40, y - 30);
        ctx.lineTo(M.land - 40, y - 30);
        ctx.moveTo(40, y + 30);
        ctx.lineTo(M.land - 40, y + 30);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(238, 222, 184, 0.42)';
      for (let i = 0; i <= M.grid; i += 1) {
        for (let j = 0; j <= M.grid; j += 1) {
          const x = game.city.roadCoord(j);
          const y = game.city.roadCoord(i);
          for (let k = -3; k <= 3; k += 1) {
            ctx.fillRect(x + k * 11 - 2.5, y - 67, 5, 22);
            ctx.fillRect(x + k * 11 - 2.5, y + 45, 5, 22);
            ctx.fillRect(x - 67, y + k * 11 - 2.5, 22, 5);
            ctx.fillRect(x + 45, y + k * 11 - 2.5, 22, 5);
          }
        }
      }
      ctx.restore();
    }

    function drawBlock(game, block) {
      const x = block.x;
      const y = block.y;
      const w = block.w;
      const h = block.h;
      ctx.fillStyle = block.i % 2 === block.j % 2 ? P.sidewalk : P.sidewalkAlt;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = P.curb;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      ctx.strokeStyle = P.sidewalkLine;
      ctx.lineWidth = 1;
      for (let k = 1; k < 7; k += 1) {
        ctx.beginPath();
        ctx.moveTo(x + k * 66, y + 2);
        ctx.lineTo(x + k * 66, y + 22);
        ctx.moveTo(x + k * 66, y + h - 22);
        ctx.lineTo(x + k * 66, y + h - 2);
        ctx.moveTo(x + 2, y + k * 66);
        ctx.lineTo(x + 22, y + k * 66);
        ctx.moveTo(x + w - 22, y + k * 66);
        ctx.lineTo(x + w - 2, y + k * 66);
        ctx.stroke();
      }
      const lot = block.lot;
      ctx.fillStyle = block.type === 'park' ? P.park : block.type === 'plaza' ? shade(P.sidewalk, 0.1) : P.lot;
      ctx.fillRect(lot.x, lot.y, lot.w, lot.h);
      ctx.strokeStyle = 'rgba(50, 45, 38, 0.22)';
      ctx.strokeRect(lot.x, lot.y, lot.w, lot.h);
      if (block.type === 'park') {
        ctx.fillStyle = P.parkLight;
        ctx.fillRect(lot.x + 8, lot.y + 8, lot.w - 16, lot.h - 16);
        ctx.fillStyle = P.path;
        ctx.fillRect(lot.x + lot.w / 2 - 13, lot.y, 26, lot.h);
        ctx.fillRect(lot.x, lot.y + lot.h / 2 - 13, lot.w, 26);
        ctx.fillStyle = 'rgba(255, 240, 200, 0.25)';
        ctx.beginPath();
        ctx.arc(lot.x + lot.w / 2, lot.y + lot.h / 2, 36, 0, U.TAU);
        ctx.fill();
      } else if (block.type === 'parking') {
        ctx.fillStyle = P.asphaltLight;
        ctx.fillRect(lot.x + 6, lot.y + 6, lot.w - 12, lot.h - 12);
        ctx.strokeStyle = 'rgba(238, 224, 188, 0.5)';
        ctx.lineWidth = 2;
        for (let r = 0; r < 2; r += 1) {
          for (let col = 0; col < 4; col += 1) {
            const px = lot.x + 42 + col * (lot.w - 80) / 3;
            const py = lot.y + 70 + r * (lot.h - 128);
            ctx.strokeRect(px, py - 30, 38, 62);
          }
        }
      } else if (block.type === 'plaza') {
        ctx.fillStyle = 'rgba(255, 245, 220, 0.2)';
        for (let k = 0; k < 8; k += 1) {
          ctx.fillRect(lot.x + 16 + k * 48, lot.y + 16, 22, lot.h - 32);
        }
        ctx.fillStyle = 'rgba(70, 60, 50, 0.16)';
        ctx.fillRect(lot.x + lot.w / 2 - 40, lot.y + lot.h / 2 - 40, 80, 80);
      }
    }

    function drawPiers(game) {
      const piers = game.city.piers;
      for (let p = 0; p < piers.length; p += 1) {
        const pier = piers[p];
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#a57a4e';
        ctx.fillRect(pier.x, pier.y, pier.w, pier.h);
        ctx.restore();
        ctx.fillStyle = '#b98a59';
        ctx.fillRect(pier.x + 2, pier.y + 2, pier.w - 4, pier.h - 4);
        ctx.strokeStyle = 'rgba(80, 52, 30, 0.5)';
        ctx.lineWidth = 1.5;
        for (let x = pier.x + 10; x < pier.x + pier.w; x += 16) {
          ctx.beginPath();
          ctx.moveTo(x, pier.y + 2);
          ctx.lineTo(x, pier.y + pier.h - 2);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(245, 230, 200, 0.75)';
        ctx.fillRect(pier.x + pier.w - 34, pier.y + 10, 24, 42);
        ctx.fillStyle = '#5a3b22';
        ctx.font = '700 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pier.name, pier.x + pier.w - 22, pier.y + 34);
      }
    }

    function drawBeachProps(game) {
      const city = game.city;
      for (let i = 0; i < city.props.length; i += 1) {
        const prop = city.props[i];
        if (prop.type === 'umbrella') {
          ctx.save();
          ctx.translate(prop.x + 5, prop.y + 7);
          ctx.fillStyle = 'rgba(40, 30, 20, 0.25)';
          ctx.beginPath();
          ctx.ellipse(0, 0, 17, 10, 0.4, 0, U.TAU);
          ctx.fill();
          ctx.restore();
          ctx.strokeStyle = '#7a583a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(prop.x, prop.y + 4);
          ctx.lineTo(prop.x, prop.y - 10);
          ctx.stroke();
          ctx.fillStyle = prop.tone;
          ctx.beginPath();
          ctx.arc(prop.x, prop.y - 12, 17, 0, U.TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath();
          ctx.moveTo(prop.x, prop.y - 12);
          ctx.arc(prop.x, prop.y - 12, 17, 0.2, 1.1);
          ctx.fill();
        }
      }
    }

    function drawBuilding(game, b, camera) {
      const up = upWorld(camera);
      const height = b.height;
      const stretch = height * 0.32;
      const liftX = up.x * stretch;
      const liftY = up.y * stretch;
      if (!b._shade) {
        b._shade = {
          wall: shade(b.color, -0.42),
          wallLight: shade(b.color, -0.08),
          wallTop: shade(b.color, 0.06),
          roof: b.roof,
          roofEdge: shade(b.roof, -0.18),
          trim: b.trim,
        };
      }
      const sh = b._shade;
      ctx.fillStyle = 'rgba(22, 30, 34, 0.26)';
      const sx = height * 0.52;
      const sy = height * 0.72;
      ctx.fillRect(b.x + sx, b.y + sy, b.w, b.h);
      ctx.fillStyle = 'rgba(18, 24, 28, 0.14)';
      ctx.fillRect(b.x + sx * 0.55, b.y + sy * 0.55, b.w, b.h);

      const layers = height > 55 ? 7 : height > 32 ? 5 : 4;
      for (let k = 1; k <= layers; k += 1) {
        const t = k / layers;
        const ox = liftX * t;
        const oy = liftY * t;
        ctx.fillStyle = k === layers ? sh.wallTop : shade(b.color, -0.55 + t * 0.4);
        ctx.fillRect(b.x + ox, b.y + oy, b.w, b.h);
        ctx.strokeStyle = 'rgba(30, 26, 22, 0.28)';
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x + ox + 0.5, b.y + oy + 0.5, b.w - 1, b.h - 1);
      }
      const rx = b.x + liftX;
      const ry = b.y + liftY;
      ctx.fillStyle = sh.roof;
      ctx.fillRect(rx, ry, b.w, b.h);
      ctx.strokeStyle = sh.roofEdge;
      ctx.lineWidth = 3;
      ctx.strokeRect(rx + 1.5, ry + 1.5, b.w - 3, b.h - 3);
      ctx.strokeStyle = 'rgba(255, 245, 220, 0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + 7, ry + 7, b.w - 14, b.h - 14);
      for (let d = 0; d < b.details.length; d += 1) {
        const det = b.details[d];
        if (det.type === 'ac') {
          ctx.fillStyle = shade(b.roof, 0.28);
          ctx.fillRect(rx + (det.x - b.x), ry + (det.y - b.y), det.w, det.h);
          ctx.fillStyle = 'rgba(40, 44, 46, 0.45)';
          ctx.fillRect(rx + (det.x - b.x) + 2, ry + (det.y - b.y) + 2, det.w - 4, 2);
        } else if (det.type === 'vent') {
          ctx.fillStyle = shade(b.roof, -0.22);
          ctx.beginPath();
          ctx.arc(rx + (det.x - b.x), ry + (det.y - b.y), 7, 0, U.TAU);
          ctx.fill();
        } else if (det.type === 'tank') {
          ctx.fillStyle = '#8b7a62';
          ctx.beginPath();
          ctx.arc(rx + (det.x - b.x), ry + (det.y - b.y), 13, 0, U.TAU);
          ctx.fill();
          ctx.strokeStyle = '#5f5140';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#a89574';
          ctx.beginPath();
          ctx.arc(rx + (det.x - b.x) - 2, ry + (det.y - b.y) - 2, 8, 0, U.TAU);
          ctx.fill();
        } else if (det.type === 'helipad') {
          ctx.fillStyle = 'rgba(30, 32, 34, 0.28)';
          ctx.beginPath();
          ctx.arc(rx + b.w * 0.5, ry + b.h * 0.5, Math.min(b.w, b.h) * 0.26, 0, U.TAU);
          ctx.fill();
          ctx.strokeStyle = 'rgba(245, 225, 170, 0.6)';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = 'rgba(245, 225, 170, 0.75)';
          ctx.font = '700 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('H', rx + b.w * 0.5, ry + b.h * 0.5);
        } else if (det.type === 'sign') {
          ctx.fillStyle = det.tone;
          ctx.shadowColor = det.tone;
          ctx.shadowBlur = 14;
          ctx.fillRect(rx + 16, ry + 10, Math.min(b.w - 32, 82), 8);
          ctx.shadowBlur = 0;
        }
      }
      if (b.awning) {
        ctx.fillStyle = b.awning;
        ctx.fillRect(b.x + 8, b.y + b.h - 12, b.w - 16, 8);
        ctx.fillStyle = 'rgba(255, 248, 225, 0.5)';
        for (let s = 0; s < Math.floor((b.w - 16) / 18); s += 1) {
          ctx.fillRect(b.x + 8 + s * 18, b.y + b.h - 12, 8, 8);
        }
      }
    }

    function drawPalm(ctx, palm, time) {
      ctx.save();
      ctx.translate(palm.x + 8, palm.y + 10);
      ctx.fillStyle = 'rgba(30, 40, 30, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 9, 0.7, 0, U.TAU);
      ctx.fill();
      ctx.restore();
      const sway = Math.sin(time * 1.1 + palm.x * 0.01) * 0.12;
      ctx.strokeStyle = P.trunk;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(palm.x, palm.y + 6);
      ctx.quadraticCurveTo(palm.x + sway * 12, palm.y - palm.size * 0.45, palm.x + sway * 24, palm.y - palm.size);
      ctx.stroke();
      ctx.save();
      ctx.translate(palm.x + sway * 24, palm.y - palm.size);
      for (let f = 0; f < 7; f += 1) {
        const a = f * (U.TAU / 7) + sway;
        ctx.strokeStyle = f % 2 === 0 ? P.palm : P.palmLight;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(Math.cos(a) * 18, Math.sin(a) * 18 - 4, Math.cos(a) * 30, Math.sin(a) * 30 + 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#4a7a44';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, U.TAU);
      ctx.fill();
      ctx.restore();
    }

    function drawTree(tree, time) {
      ctx.save();
      ctx.translate(tree.x + 7, tree.y + 8);
      ctx.fillStyle = 'rgba(20, 40, 25, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, tree.size * 0.8, tree.size * 0.45, 0.5, 0, U.TAU);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = P.trunk;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tree.x, tree.y + 4);
      ctx.lineTo(tree.x, tree.y - tree.size * 0.25);
      ctx.stroke();
      ctx.fillStyle = tree.hue === 0 ? '#4f854c' : tree.hue === 1 ? '#5d9a54' : '#3f7445';
      for (let c = 0; c < 4; c += 1) {
        const a = c * 1.6 + tree.angle;
        ctx.beginPath();
        ctx.arc(tree.x + Math.cos(a) * tree.size * 0.28, tree.y - tree.size * 0.35 + Math.sin(a) * tree.size * 0.2, tree.size * 0.5, 0, U.TAU);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(180, 230, 140, 0.22)';
      ctx.beginPath();
      ctx.arc(tree.x - tree.size * 0.2, tree.y - tree.size * 0.55, tree.size * 0.26, 0, U.TAU);
      ctx.fill();
    }

    function drawLamp(lamp, game) {
      ctx.fillStyle = 'rgba(30, 30, 30, 0.2)';
      ctx.beginPath();
      ctx.ellipse(lamp.x + 6, lamp.y + 8, 10, 5, 0.4, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = '#4b4a44';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lamp.x, lamp.y + 2);
      ctx.lineTo(lamp.x, lamp.y - 24);
      ctx.lineTo(lamp.x + 12, lamp.y - 24);
      ctx.stroke();
      const glow = ctx.createRadialGradient(lamp.x + 12, lamp.y - 22, 2, lamp.x + 12, lamp.y - 22, 34);
      glow.addColorStop(0, 'rgba(255, 214, 130, 0.42)');
      glow.addColorStop(1, 'rgba(255, 214, 130, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lamp.x + 12, lamp.y - 22, 34, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#ffe2a0';
      ctx.beginPath();
      ctx.arc(lamp.x + 12, lamp.y - 22, 3.5, 0, U.TAU);
      ctx.fill();
    }

    function drawBench(bench) {
      ctx.save();
      ctx.translate(bench.x, bench.y);
      ctx.rotate(bench.angle);
      ctx.fillStyle = 'rgba(30, 25, 20, 0.2)';
      ctx.fillRect(-14, 4, 28, 6);
      ctx.fillStyle = '#8b6440';
      ctx.fillRect(-14, -5, 28, 5);
      ctx.fillRect(-14, 1, 28, 5);
      ctx.fillStyle = '#5b4632';
      ctx.fillRect(-12, -7, 3, 12);
      ctx.fillRect(9, -7, 3, 12);
      ctx.restore();
    }

    function drawKiosk(prop) {
      ctx.fillStyle = 'rgba(30, 25, 20, 0.25)';
      ctx.fillRect(prop.x - prop.w / 2 + 6, prop.y - prop.h / 2 + 8, prop.w, prop.h);
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(prop.x - prop.w / 2, prop.y - prop.h / 2, prop.w, prop.h);
      ctx.fillStyle = prop.tone;
      ctx.fillRect(prop.x - prop.w / 2, prop.y - prop.h / 2, prop.w, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let s = 0; s < 6; s += 1) ctx.fillRect(prop.x - prop.w / 2 + s * 11, prop.y - prop.h / 2, 6, 12);
      ctx.fillStyle = '#5d4a35';
      ctx.fillRect(prop.x - 6, prop.y + prop.h / 2 - 12, 12, 12);
    }

    function drawFountain(f) {
      ctx.fillStyle = 'rgba(30, 40, 40, 0.2)';
      ctx.beginPath();
      ctx.arc(f.x + 6, f.y + 8, f.r + 4, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#b9ac92';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r + 5, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#4c9aa2';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(220, 250, 245, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 0.55, 0, U.TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(230, 255, 250, 0.55)';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 4, 0, U.TAU);
      ctx.fill();
    }

    function drawBoat(boat, time) {
      ctx.save();
      ctx.translate(boat.x, boat.y);
      ctx.rotate(boat.angle);
      ctx.fillStyle = 'rgba(5, 30, 35, 0.25)';
      ctx.beginPath();
      ctx.ellipse(3, 7, boat.len * 0.55, 24, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = boat.tone;
      ctx.beginPath();
      ctx.moveTo(-boat.len / 2, -18);
      ctx.quadraticCurveTo(boat.len / 2 + 8, -20, boat.len / 2 + 18, 0);
      ctx.quadraticCurveTo(boat.len / 2 + 8, 20, -boat.len / 2, 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(30, 40, 45, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = boat.yacht ? '#f8f2e2' : 'rgba(250, 246, 232, 0.75)';
      ctx.fillRect(-boat.len * 0.15, -10, boat.len * 0.3, 20);
      if (boat.yacht) {
        ctx.fillStyle = '#d9cfb6';
        ctx.fillRect(boat.len * 0.02, -8, boat.len * 0.24, 16);
        ctx.strokeStyle = 'rgba(120, 140, 140, 0.5)';
        ctx.strokeRect(boat.len * 0.02, -8, boat.len * 0.24, 16);
      }
      ctx.restore();
      if (time % 4 < 2) {
        ctx.strokeStyle = 'rgba(230, 250, 245, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(boat.x, boat.y, boat.len * 0.65, 0.2, 2.2);
        ctx.stroke();
      }
    }

    function drawVehicle(game, car) {
      const spec = car.spec;
      ctx.save();
      ctx.translate(car.x + 6, car.y + 8);
      ctx.rotate(car.angle);
      ctx.fillStyle = 'rgba(15, 20, 22, 0.28)';
      ctx.beginPath();
      roundRect(ctx, -spec.len / 2, -spec.wid / 2, spec.len, spec.wid, 7);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle + (car.angleOffset || 0));
      const len = spec.len;
      const wid = spec.wid;
      ctx.fillStyle = car.disabled && car.exploded ? '#3d3430' : car.color;
      ctx.strokeStyle = 'rgba(20, 22, 24, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      roundRect(ctx, -len / 2, -wid / 2, len, wid, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.beginPath();
      roundRect(ctx, -len / 2 + 4, -wid / 2 + 3, len - 8, wid * 0.22, 4);
      ctx.fill();
      ctx.fillStyle = shade(car.color, -0.32);
      ctx.fillRect(-len * 0.32, -wid / 2 + 1, 4, wid - 2);
      ctx.fillRect(len * 0.29, -wid / 2 + 1, 4, wid - 2);
      ctx.fillStyle = car.police ? 'rgba(30, 40, 55, 0.9)' : 'rgba(48, 64, 68, 0.85)';
      ctx.beginPath();
      roundRect(ctx, -len * 0.18, -wid * 0.38, len * 0.38, wid * 0.76, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(180, 224, 224, 0.72)';
      ctx.beginPath();
      roundRect(ctx, -len * 0.11, -wid * 0.32, len * 0.18, wid * 0.64, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(185, 225, 226, 0.6)';
      ctx.fillRect(len * 0.22, -wid * 0.3, len * 0.05, wid * 0.6);
      ctx.fillStyle = '#ffe1a0';
      ctx.beginPath();
      ctx.arc(len / 2 - 4, -wid * 0.3, 3, 0, U.TAU);
      ctx.arc(len / 2 - 4, wid * 0.3, 3, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = car.brake ? '#ff4034' : '#a8392f';
      ctx.beginPath();
      ctx.arc(-len / 2 + 4, -wid * 0.3, 3, 0, U.TAU);
      ctx.arc(-len / 2 + 4, wid * 0.3, 3, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(20, 20, 22, 0.8)';
      ctx.fillRect(-len * 0.34, -wid / 2 - 2, len * 0.12, 4);
      ctx.fillRect(-len * 0.34, wid / 2 - 2, len * 0.12, 4);
      ctx.fillRect(len * 0.22, -wid / 2 - 2, len * 0.12, 4);
      ctx.fillRect(len * 0.22, wid / 2 - 2, len * 0.12, 4);
      if (car.police) {
        ctx.fillStyle = 'rgba(32, 52, 90, 0.9)';
        ctx.fillRect(-len * 0.4, -wid / 2 + 4, len * 0.8, 5);
        ctx.fillRect(-len * 0.4, wid / 2 - 9, len * 0.8, 5);
        const phase = Math.floor(game.time * 6) % 2;
        ctx.fillStyle = phase === 0 ? '#ff3b2f' : '#3b7bff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, -wid * 0.18, 4.5, 0, U.TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = phase === 0 ? '#3b7bff' : '#ff3b2f';
        ctx.beginPath();
        ctx.arc(0, wid * 0.18, 4.5, 0, U.TAU);
        ctx.fill();
      }
      if (car.mission) {
        ctx.strokeStyle = 'rgba(243, 185, 63, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundRect(ctx, -len / 2 + 2, -wid / 2 + 2, len - 4, wid - 4, 6);
        ctx.stroke();
      }
      if (car.disabled) {
        ctx.fillStyle = 'rgba(30, 26, 24, 0.55)';
        ctx.beginPath();
        roundRect(ctx, -len / 2, -wid / 2, len, wid, 7);
        ctx.fill();
      }
      if (car.damageFlash > 0) {
        ctx.fillStyle = 'rgba(255, 220, 160, ' + (car.damageFlash * 0.45) + ')';
        ctx.beginPath();
        roundRect(ctx, -len / 2, -wid / 2, len, wid, 7);
        ctx.fill();
      }
      ctx.restore();
    }

    function roundRect(context, x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      context.moveTo(x + radius, y);
      context.arcTo(x + w, y, x + w, y + h, radius);
      context.arcTo(x + w, y + h, x, y + h, radius);
      context.arcTo(x, y + h, x, y, radius);
      context.arcTo(x, y, x + w, y, radius);
      context.closePath();
    }

    function drawPedFigure(game, ped) {
      const dead = ped.dead;
      const alpha = dead ? Math.max(0.3, 1 - ped.deadTimer / 90) : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      if (!dead) {
        ctx.fillStyle = 'rgba(20, 25, 22, 0.25)';
        ctx.beginPath();
        ctx.ellipse(ped.x + 5, ped.y + 7, 10, 5, Math.atan2(Math.sin(ped.angle), Math.cos(ped.angle)), 0, U.TAU);
        ctx.fill();
      }
      ctx.translate(ped.x, ped.y);
      ctx.rotate(dead ? ped.angle : ped.angle);
      if (dead) {
        ctx.fillStyle = ped.shirt;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 7, 0, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = ped.skin;
        ctx.beginPath();
        ctx.arc(11, 0, 5, 0, U.TAU);
        ctx.fill();
        ctx.restore();
        return;
      }
      const swing = Math.sin(ped.bob) * 4;
      ctx.strokeStyle = ped.pants;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-1, 1);
      ctx.lineTo(-1 + swing * 0.4, 8);
      ctx.moveTo(1, 1);
      ctx.lineTo(1 - swing * 0.4, 8);
      ctx.stroke();
      ctx.fillStyle = ped.shirt;
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 11, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = ped.skin;
      ctx.beginPath();
      ctx.arc(3.5, 0, 6.5, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = ped.hair;
      ctx.beginPath();
      ctx.arc(2.5, 0, 5.6, Math.PI * 0.55, Math.PI * 1.45);
      ctx.fill();
      if (ped.hat) {
        ctx.fillStyle = '#e8d8b4';
        ctx.beginPath();
        ctx.arc(2.5, 0, 6.6, 0, U.TAU);
        ctx.fill();
      }
      if (ped.bag) {
        ctx.fillStyle = '#6a4f38';
        ctx.fillRect(-7, -5, 4, 10);
      }
      ctx.restore();
      if (ped.panic > 0) {
        ctx.fillStyle = '#ffe3a0';
        ctx.font = '700 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', ped.x, ped.y - 20);
      }
    }

    function drawEnemy(game, enemy) {
      const dead = enemy.dead;
      if (dead) {
        ctx.save();
        ctx.globalAlpha = Math.max(0.35, 1 - enemy.deadTimer / 90);
        ctx.fillStyle = enemy.shirt;
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y, 15, 7, enemy.angle, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = enemy.skin;
        ctx.beginPath();
        ctx.arc(enemy.x + Math.cos(enemy.angle) * 12, enemy.y + Math.sin(enemy.angle) * 12, 5, 0, U.TAU);
        ctx.fill();
        ctx.restore();
        return;
      }
      ctx.save();
      ctx.fillStyle = 'rgba(20, 25, 22, 0.26)';
      ctx.beginPath();
      ctx.ellipse(enemy.x + 5, enemy.y + 7, 11, 6, enemy.angle, 0, U.TAU);
      ctx.fill();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.angle);
      ctx.strokeStyle = enemy.pants;
      ctx.lineWidth = 4;
      const swing = Math.sin(enemy.bob * 9) * 3;
      ctx.beginPath();
      ctx.moveTo(-1, 1);
      ctx.lineTo(-2 + swing, 8);
      ctx.moveTo(1, 1);
      ctx.lineTo(2 - swing, 8);
      ctx.stroke();
      ctx.fillStyle = enemy.shirt;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 10, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = enemy.skin;
      ctx.beginPath();
      ctx.arc(4, 0, 5.4, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#20242a';
      ctx.beginPath();
      ctx.arc(3.2, 0, 4.6, Math.PI * 0.55, Math.PI * 1.45);
      ctx.fill();
      if (enemy.kind === 'cop') {
        ctx.fillStyle = '#1f2b40';
        ctx.fillRect(-6, -10, 12, 4);
        ctx.fillStyle = '#f0d37a';
        ctx.fillRect(1, -6, 3, 2);
      }
      ctx.strokeStyle = '#25282c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(3, -4);
      ctx.lineTo(15, -1);
      ctx.stroke();
      ctx.fillStyle = '#2b2e32';
      ctx.fillRect(13, -3, 8, 3);
      if (enemy.shooting > 0) {
        ctx.fillStyle = 'rgba(255, 220, 130, 0.9)';
        ctx.beginPath();
        ctx.arc(23, -1.5, 4, 0, U.TAU);
        ctx.fill();
      }
      if (enemy.boss) {
        ctx.strokeStyle = '#f3b93f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, U.TAU);
        ctx.stroke();
      }
      ctx.restore();
      if (enemy.hp < enemy.maxHp) {
        const w = 34;
        ctx.fillStyle = 'rgba(10, 12, 14, 0.7)';
        ctx.fillRect(enemy.x - w / 2, enemy.y - 22, w, 4);
        ctx.fillStyle = enemy.kind === 'cop' ? '#5c9be0' : '#e0553f';
        ctx.fillRect(enemy.x - w / 2, enemy.y - 22, w * (enemy.hp / enemy.maxHp), 4);
      }
      if (enemy.boss) {
        ctx.fillStyle = '#f3b93f';
        ctx.font = '700 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('KRANE', enemy.x, enemy.y - 26);
      }
      if (enemy.alert && enemy.hp === enemy.maxHp) {
        ctx.fillStyle = 'rgba(255, 120, 90, 0.8)';
        ctx.font = '700 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', enemy.x, enemy.y - 20);
      }
    }

    function drawPlayer(game) {
      const player = game.player;
      const px = player.x;
      const py = player.y - player.jumpZ * 0.06;
      ctx.fillStyle = 'rgba(20, 25, 22, 0.28)';
      ctx.beginPath();
      ctx.ellipse(px + 5, py + 8, 11, 6, player.angle, 0, U.TAU);
      ctx.fill();
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(player.angle);
      const move = player.walkPhase;
      const swing = Math.sin(move) * 4;
      ctx.strokeStyle = '#4b4034';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-1, 1);
      ctx.lineTo(-2 + swing, 9);
      ctx.moveTo(1, 1);
      ctx.lineTo(2 - swing, 9);
      ctx.stroke();
      ctx.fillStyle = '#2e7476';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 10, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#e2b48b';
      ctx.beginPath();
      ctx.arc(4, 0, 5.5, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#2c211b';
      ctx.beginPath();
      ctx.arc(3.2, 0, 4.7, Math.PI * 0.55, Math.PI * 1.45);
      ctx.fill();
      ctx.fillStyle = '#d8a85c';
      ctx.fillRect(-4, -9, 3, 18);
      ctx.strokeStyle = '#6b4f35';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(3, -5);
      ctx.lineTo(15, -3);
      ctx.stroke();
      ctx.strokeStyle = '#24272b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(14, -3);
      ctx.lineTo(22, -2);
      ctx.stroke();
      if (player.muzzle > 0) {
        ctx.fillStyle = 'rgba(255, 224, 140, 0.95)';
        ctx.beginPath();
        ctx.arc(26, -2, 6 * (player.muzzle / 0.08), 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 180, 70, 0.6)';
        ctx.beginPath();
        ctx.arc(26, -2, 10 * (player.muzzle / 0.08), 0, U.TAU);
        ctx.fill();
      }
      if (player.punchAnim > 0) {
        ctx.fillStyle = '#e2b48b';
        ctx.beginPath();
        ctx.arc(18, -1, 4, 0, U.TAU);
        ctx.fill();
      }
      ctx.restore();
      if (player.hurtFlash > 0) {
        ctx.fillStyle = 'rgba(230, 50, 40, ' + player.hurtFlash * 0.28 + ')';
        ctx.beginPath();
        ctx.arc(px, py, 24, 0, U.TAU);
        ctx.fill();
      }
    }

    function drawMarker(game, camera) {
      const marker = game.missions.marker;
      if (!marker) return;
      const up = upWorld(camera);
      const pulse = 0.5 + 0.5 * Math.sin(game.time * 3.2);
      ctx.save();
      ctx.strokeStyle = 'rgba(243, 185, 63, 0.55)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(marker.x, marker.y, 34 + pulse * 9, 18 + pulse * 5, 0, 0, U.TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(243, 185, 63, 0.16)';
      ctx.beginPath();
      ctx.ellipse(marker.x, marker.y, 30 + pulse * 8, 16 + pulse * 4, 0, 0, U.TAU);
      ctx.fill();
      const topX = marker.x + up.x * 92;
      const topY = marker.y + up.y * 92;
      const grad = ctx.createLinearGradient(marker.x, marker.y, topX, topY);
      grad.addColorStop(0, 'rgba(243, 185, 63, 0)');
      grad.addColorStop(1, 'rgba(243, 185, 63, ' + (0.22 + pulse * 0.16) + ')');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(marker.x - 14, marker.y);
      ctx.lineTo(topX - 7, topY);
      ctx.lineTo(topX + 7, topY);
      ctx.lineTo(marker.x + 14, marker.y);
      ctx.closePath();
      ctx.fill();
      const dx = marker.x + up.x * 68;
      const dy = marker.y + up.y * 68;
      ctx.translate(dx, dy);
      ctx.rotate(camera.yaw);
      ctx.fillStyle = 'rgba(243, 185, 63, 0.95)';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 16);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(90, 60, 15, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 245, 220, 0.9)';
      ctx.beginPath();
      ctx.arc(-2, -3, 3, 0, U.TAU);
      ctx.fill();
      ctx.restore();
    }

    function drawRoute(game, camera) {
      if (!game.missions.active) return;
      const points = game.missions.routePoints();
      if (!points || points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = 'rgba(243, 185, 63, 0.22)';
      ctx.lineWidth = 5;
      ctx.setLineDash([18, 16]);
      ctx.lineDashOffset = -game.time * 20;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
      ctx.restore();
    }

    function drawDecals(game) {
      for (let i = 0; i < game.decals.length; i += 1) {
        const d = game.decals[i];
        if (d.type === 'blood') {
          ctx.fillStyle = 'rgba(85, 24, 20, 0.4)';
          ctx.beginPath();
          ctx.ellipse(d.x, d.y, d.size * 0.7, d.size * 0.42, d.angle, 0, U.TAU);
          ctx.fill();
        } else if (d.type === 'skid') {
          ctx.strokeStyle = 'rgba(28, 26, 24, 0.3)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(d.x - Math.cos(d.angle) * 6, d.y - Math.sin(d.angle) * 6);
          ctx.lineTo(d.x + Math.cos(d.angle) * 6, d.y + Math.sin(d.angle) * 6);
          ctx.stroke();
        } else if (d.type === 'scorch') {
          ctx.fillStyle = 'rgba(25, 22, 20, 0.32)';
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.size, 0, U.TAU);
          ctx.fill();
        }
      }
    }

    function drawTracers(game) {
      for (let i = 0; i < game.tracers.length; i += 1) {
        const t = game.tracers[i];
        const alpha = Math.max(0, t.life / t.max);
        ctx.strokeStyle = 'rgba(255, 232, 160, ' + alpha + ')';
        ctx.lineWidth = t.width;
        ctx.beginPath();
        ctx.moveTo(t.x1, t.y1);
        ctx.lineTo(t.x2, t.y2);
        ctx.stroke();
      }
      for (let i = 0; i < game.particles.length; i += 1) {
        const p = game.particles[i];
        const alpha = Math.max(0, p.life / p.max);
        if (p.type === 'smoke') {
          ctx.fillStyle = 'rgba(70, 70, 68, ' + alpha * 0.35 + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, U.TAU);
          ctx.fill();
        } else if (p.type === 'dust') {
          ctx.fillStyle = 'rgba(215, 200, 165, ' + alpha * 0.35 + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, U.TAU);
          ctx.fill();
        } else if (p.type === 'flame') {
          ctx.fillStyle = 'rgba(255, ' + Math.round(120 + 100 * alpha) + ', 50, ' + alpha + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.6 + alpha * 0.6), 0, U.TAU);
          ctx.fill();
        } else if (p.type === 'blood') {
          ctx.fillStyle = 'rgba(120, 32, 26, ' + alpha * 0.85 + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, U.TAU);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(255, 214, 138, ' + alpha + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, U.TAU);
          ctx.fill();
        }
      }
    }

    function drawSunOverlay(game) {
      const sun = ctx.createRadialGradient(width * 0.82, height * 0.08, 20, width * 0.82, height * 0.08, 900);
      sun.addColorStop(0, 'rgba(255, 205, 120, 0.26)');
      sun.addColorStop(0.35, 'rgba(255, 180, 90, 0.1)');
      sun.addColorStop(1, 'rgba(255, 170, 80, 0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, width, height);
      const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.35, width / 2, height / 2, height * 0.95);
      vignette.addColorStop(0, 'rgba(20, 24, 30, 0)');
      vignette.addColorStop(1, 'rgba(20, 22, 28, 0.34)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 196, 110, 0.06)';
      ctx.beginPath();
      ctx.ellipse(width * 0.82, height * 0.08, 150, 90, 0.3, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 150, 0.09)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width * 0.5, height * 0.0);
      ctx.lineTo(width * 0.72, height * 0.55);
      ctx.moveTo(width * 0.62, height * 0.0);
      ctx.lineTo(width * 0.82, height * 0.5);
      ctx.stroke();
    }

    function draw(game) {
      const camera = game.camera;
      camera.width = width;
      camera.height = height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = P.waterDeep;
      ctx.fillRect(0, 0, width, height);
      const radius = CC.Camera.viewRadius(camera);
      const bounds = { x: camera.x, y: camera.y, r: radius + 260 };

      ctx.save();
      ctx.translate(width / 2 + camera.shakeX, height / 2 + camera.shakeY);
      ctx.rotate(-camera.yaw);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);

      drawWater(game, bounds);
      drawLand(game);
      drawRoads(game);
      for (let i = 0; i < game.city.blocks.length; i += 1) {
        const block = game.city.blocks[i];
        if (U.dist(camera.x, camera.y, block.x + block.w / 2, block.y + block.h / 2) > radius + 400) continue;
        drawBlock(game, block);
      }
      drawBeachProps(game);
      drawPiers(game);
      drawDecals(game);
      drawRoute(game, camera);

      const drawables = [];
      for (let i = 0; i < game.city.buildings.length; i += 1) {
        const b = game.city.buildings[i];
        if (U.dist(camera.x, camera.y, b.x + b.w / 2, b.y + b.h / 2) > radius + 480) continue;
        drawables.push({ depth: b.y + b.h, kind: 'building', ref: b });
      }
      for (let i = 0; i < game.city.palms.length; i += 1) {
        const p = game.city.palms[i];
        if (U.dist(camera.x, camera.y, p.x, p.y) > radius + 120) continue;
        drawables.push({ depth: p.y, kind: 'palm', ref: p });
      }
      for (let i = 0; i < game.city.trees.length; i += 1) {
        const t = game.city.trees[i];
        if (U.dist(camera.x, camera.y, t.x, t.y) > radius + 120) continue;
        drawables.push({ depth: t.y, kind: 'tree', ref: t });
      }
      for (let i = 0; i < game.city.lamps.length; i += 1) {
        const l = game.city.lamps[i];
        if (U.dist(camera.x, camera.y, l.x, l.y) > radius + 120) continue;
        drawables.push({ depth: l.y, kind: 'lamp', ref: l });
      }
      for (let i = 0; i < game.city.benches.length; i += 1) {
        const b = game.city.benches[i];
        if (U.dist(camera.x, camera.y, b.x, b.y) > radius + 120) continue;
        drawables.push({ depth: b.y, kind: 'bench', ref: b });
      }
      for (let i = 0; i < game.city.props.length; i += 1) {
        const p = game.city.props[i];
        if (p.type === 'bollard') continue;
        if (U.dist(camera.x, camera.y, p.x, p.y) > radius + 120) continue;
        if (p.type === 'kiosk') drawables.push({ depth: p.y + p.h / 2, kind: 'kiosk', ref: p });
      }
      for (let i = 0; i < game.city.fountains.length; i += 1) {
        const f = game.city.fountains[i];
        if (U.dist(camera.x, camera.y, f.x, f.y) > radius + 120) continue;
        drawables.push({ depth: f.y, kind: 'fountain', ref: f });
      }
      for (let i = 0; i < game.city.boats.length; i += 1) {
        const b = game.city.boats[i];
        if (U.dist(camera.x, camera.y, b.x, b.y) > radius + 240) continue;
        drawables.push({ depth: b.y, kind: 'boat', ref: b });
      }
      for (let i = 0; i < game.vehicles.length; i += 1) {
        const car = game.vehicles[i];
        if (car.remove) continue;
        if (U.dist(camera.x, camera.y, car.x, car.y) > radius + 160) continue;
        drawables.push({ depth: car.y, kind: 'vehicle', ref: car });
      }
      for (let i = 0; i < game.peds.length; i += 1) {
        const ped = game.peds[i];
        if (U.dist(camera.x, camera.y, ped.x, ped.y) > radius + 100) continue;
        drawables.push({ depth: ped.y, kind: 'ped', ref: ped });
      }
      for (let i = 0; i < game.enemies.length; i += 1) {
        const enemy = game.enemies[i];
        if (U.dist(camera.x, camera.y, enemy.x, enemy.y) > radius + 100) continue;
        drawables.push({ depth: enemy.y, kind: 'enemy', ref: enemy });
      }
      if (game.player.mode === 'foot') drawables.push({ depth: game.player.y, kind: 'player', ref: game.player });

      drawables.sort(function (a, b) {
        return a.depth - b.depth;
      });
      for (let i = 0; i < drawables.length; i += 1) {
        const d = drawables[i];
        if (d.kind === 'building') drawBuilding(game, d.ref, camera);
        else if (d.kind === 'palm') drawPalm(ctx, d.ref, game.time);
        else if (d.kind === 'tree') drawTree(d.ref, game.time);
        else if (d.kind === 'lamp') drawLamp(d.ref, game);
        else if (d.kind === 'bench') drawBench(d.ref);
        else if (d.kind === 'kiosk') drawKiosk(d.ref);
        else if (d.kind === 'fountain') drawFountain(d.ref);
        else if (d.kind === 'boat') drawBoat(d.ref, game.time);
        else if (d.kind === 'vehicle') drawVehicle(game, d.ref);
        else if (d.kind === 'ped') drawPedFigure(game, d.ref);
        else if (d.kind === 'enemy') drawEnemy(game, d.ref);
        else if (d.kind === 'player') drawPlayer(game);
      }
      drawMarker(game, camera);
      drawTracers(game);
      ctx.restore();
      drawSunOverlay(game);
      if (CC.Hud) CC.Hud.draw(ctx, game);
    }

    return { draw: draw, canvas: canvas, ctx: ctx, width: width, height: height };
  }

  CC.Render = {
    create: createRenderer,
    shade: shade,
    upWorld: upWorld,
  };
})();
