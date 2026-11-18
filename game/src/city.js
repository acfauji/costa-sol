(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;
  const M = C.MAP;

  function blockOrigin(index) {
    return M.margin + index * M.spacing + M.roadHalf;
  }

  function roadCoord(index) {
    return M.margin + index * M.spacing;
  }

  function districtFor(i, j) {
    if (j >= 5) return 'COBALT DOCKS';
    if (i >= 5) return 'SUNSET VILLAGE';
    if (i <= 1 && j <= 2) return 'PALM HEIGHTS';
    if (i >= 3 && j <= 2) return 'OLD TOWN';
    if (i <= 3 && j >= 3) return 'NEON ROW';
    return 'LA MARINA';
  }

  CC.layout = {
    blockOrigin: blockOrigin,
    roadCoord: roadCoord,
    districtFor: districtFor,
  };

  function buildCity(seed) {
    const rng = U.makeRng(seed ^ 0x51a7c0de);
    const buildings = [];
    const blocks = [];
    const props = [];
    const palms = [];
    const lamps = [];
    const benches = [];
    const trees = [];
    const parkingSpots = [];
    const fountains = [];
    const solids = [];
    const boats = [];
    const piers = [
      { x: 4012, y: 2070, w: 226, h: 62, name: 'PIER 9' },
      { x: 4012, y: 2672, w: 186, h: 54, name: 'CORAL PIER' },
    ];
    const centerX = M.size * 0.5;
    const centerY = M.size * 0.5;

    function addBuilding(rect, colorIndex, tall) {
      const height = 16 + rng() * 24 + tall;
      const color = C.PALETTE.building[colorIndex % C.PALETTE.building.length];
      const roof = C.PALETTE.roof[colorIndex % C.PALETTE.roof.length];
      const building = {
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        color: color,
        roof: roof,
        height: height,
        trim: rng() < 0.5 ? C.PALETTE.cream : C.PALETTE.gold,
        details: [],
        awning: rng() < 0.38 ? rng.pick(['#c8452f', '#2f8f8a', '#e8b04c', '#8f5bb5']) : null,
      };
      const detailCount = rng.int(1, 3);
      for (let d = 0; d < detailCount; d += 1) {
        building.details.push({
          type: rng() < 0.62 ? 'ac' : 'vent',
          x: rect.x + 16 + rng() * Math.max(4, rect.w - 54),
          y: rect.y + 16 + rng() * Math.max(4, rect.h - 54),
          w: 12 + rng() * 16,
          h: 10 + rng() * 14,
        });
      }
      if (height > 54 && rect.w > 120 && rng() < 0.65) building.details.push({ type: 'tank', x: rect.x + rect.w * 0.7, y: rect.y + rect.h * 0.6 });
      if (height > 66 && rect.w > 170 && rect.h > 140 && rng() < 0.5) building.details.push({ type: 'helipad' });
      if (rng() < 0.42) building.details.push({ type: 'sign', side: rng.int(0, 3), tone: rng.pick(['#f3b93f', '#3fc0b0', '#e34b3a', '#8f5bb5']) });
      buildings.push(building);
      return building;
    }

    function lotBuildings(i, j, block) {
      const lot = block.lot;
      const style = rng();
      const gap = 14 + rng() * 8;
      const margin = 4 + rng() * 6;
      if (style < 0.24) {
        addBuilding({ x: lot.x + margin, y: lot.y + margin, w: lot.w - margin * 2, h: lot.h - margin * 2 }, rng.int(0, 11), 34 + rng() * 28);
      } else if (style < 0.56) {
        if (rng() < 0.5) {
          const half = (lot.w - gap) * 0.5;
          addBuilding({ x: lot.x + margin, y: lot.y + margin, w: half - margin, h: lot.h - margin * 2 }, rng.int(0, 11), 18 + rng() * 30);
          addBuilding({ x: lot.x + half + gap, y: lot.y + margin, w: half - margin, h: lot.h - margin * 2 }, rng.int(0, 11), 18 + rng() * 30);
        } else {
          const half = (lot.h - gap) * 0.5;
          addBuilding({ x: lot.x + margin, y: lot.y + margin, w: lot.w - margin * 2, h: half - margin }, rng.int(0, 11), 18 + rng() * 30);
          addBuilding({ x: lot.x + margin, y: lot.y + half + gap, w: lot.w - margin * 2, h: half - margin }, rng.int(0, 11), 18 + rng() * 30);
        }
      } else if (style < 0.82) {
        const halfW = (lot.w - gap) * 0.5;
        const halfH = (lot.h - gap) * 0.5;
        const quads = [
          { x: lot.x + margin, y: lot.y + margin, w: halfW - margin, h: halfH - margin },
          { x: lot.x + halfW + gap, y: lot.y + margin, w: halfW - margin, h: halfH - margin },
          { x: lot.x + margin, y: lot.y + halfH + gap, w: halfW - margin, h: halfH - margin },
          { x: lot.x + halfW + gap, y: lot.y + halfH + gap, w: halfW - margin, h: halfH - margin },
        ];
        for (let q = 0; q < quads.length; q += 1) addBuilding(quads[q], rng.int(0, 11), 14 + rng() * 26);
      } else {
        const lowerH = lot.h * (0.36 + rng() * 0.18);
        addBuilding({ x: lot.x + margin, y: lot.y + margin, w: lot.w - margin * 2, h: lowerH - margin * 2 }, rng.int(0, 11), 16 + rng() * 24);
        const upperW = (lot.w - gap - margin * 2) * 0.55;
        addBuilding({ x: lot.x + margin, y: lot.y + lowerH + gap, w: upperW, h: lot.h - lowerH - gap - margin }, rng.int(0, 11), 30 + rng() * 28);
        addBuilding({ x: lot.x + margin + upperW + gap, y: lot.y + lowerH + gap, w: lot.w - margin * 2 - upperW - gap, h: lot.h - lowerH - gap - margin }, rng.int(0, 11), 20 + rng() * 24);
      }
      const spots = rng.int(0, 2);
      for (let s = 0; s < spots; s += 1) {
        const side = rng.int(0, 3);
        const along = rng.range(0.18, 0.82);
        if (side === 0) parkingSpots.push({ x: block.x + block.w * along, y: block.y - 28, angle: 0 });
        else if (side === 1) parkingSpots.push({ x: block.x + block.w + 28, y: block.y + block.h * along, angle: Math.PI / 2 });
        else if (side === 2) parkingSpots.push({ x: block.x + block.w * along, y: block.y + block.h + 28, angle: Math.PI });
        else parkingSpots.push({ x: block.x - 28, y: block.y + block.h * along, angle: -Math.PI / 2 });
      }
    }

    function plantPark(block) {
      const lot = block.lot;
      for (let t = 0; t < 12; t += 1) {
        const tx = lot.x + 24 + rng() * (lot.w - 48);
        const ty = lot.y + 24 + rng() * (lot.h - 48);
        if (Math.abs(tx - (lot.x + lot.w / 2)) < 46 || Math.abs(ty - (lot.y + lot.h / 2)) < 46) continue;
        trees.push({ x: tx, y: ty, size: 22 + rng() * 16, hue: rng.int(0, 2), angle: rng() * U.TAU });
      }
      fountains.push({ x: lot.x + lot.w / 2, y: lot.y + lot.h / 2, r: 24 });
      solids.push({ x: lot.x + lot.w / 2 - 20, y: lot.y + lot.h / 2 - 20, w: 40, h: 40, kind: 'fountain' });
      for (let b = 0; b < 3; b += 1) benches.push({ x: lot.x + 40 + b * 90, y: lot.y + lot.h - 42, angle: 0 });
    }

    function plantPlaza(block) {
      const lot = block.lot;
      for (let p = 0; p < 4; p += 1) {
        palms.push({ x: lot.x + 30 + p * (lot.w - 60) / 3, y: lot.y + 42, size: 22 + rng() * 10, angle: rng() * U.TAU });
        palms.push({ x: lot.x + 30 + p * (lot.w - 60) / 3, y: lot.y + lot.h - 42, size: 22 + rng() * 10, angle: rng() * U.TAU });
      }
      const kiosk = { x: lot.x + lot.w * 0.42, y: lot.y + lot.h * 0.44, w: 68, h: 52 };
      solids.push({ x: kiosk.x, y: kiosk.y, w: kiosk.w, h: kiosk.h, kind: 'kiosk' });
      props.push({ type: 'kiosk', x: kiosk.x + kiosk.w / 2, y: kiosk.y + kiosk.h / 2, w: kiosk.w, h: kiosk.h, tone: '#c8452f' });
    }

    function plantParking(block) {
      const lot = block.lot;
      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          const px = lot.x + 56 + col * (lot.w - 92) / 2;
          const py = lot.y + 88 + row * (lot.h - 150);
          parkingSpots.push({ x: px, y: py, angle: Math.PI / 2, inLot: true });
        }
      }
    }

    for (let i = 0; i < M.grid; i += 1) {
      for (let j = 0; j < M.grid; j += 1) {
        const x = blockOrigin(j);
        const y = blockOrigin(i);
        const block = {
          i: i,
          j: j,
          x: x,
          y: y,
          w: M.block,
          h: M.block,
          type: 'city',
          district: districtFor(i, j),
          lot: { x: x + 24, y: y + 24, w: M.block - 48, h: M.block - 48 },
        };
        if ((i === 2 && j === 1) || (i === 5 && j === 4)) block.type = 'park';
        else if (i === 3 && j === 2) block.type = 'plaza';
        else if (i === 4 && j === 5) block.type = 'parking';
        blocks.push(block);
        if (block.type === 'park') plantPark(block);
        else if (block.type === 'plaza') plantPlaza(block);
        else if (block.type === 'parking') plantParking(block);
        else {
          const cd = U.dist(x + M.block / 2, y + M.block / 2, centerX, centerY);
          const tall = U.clamp(1 - cd / 2050, 0, 1) * 46;
          block.tall = tall;
          lotBuildings(i, j, block);
        }
        const corners = [
          { x: x + 20, y: y + 20 },
          { x: x + M.block - 20, y: y + 20 },
          { x: x + M.block - 20, y: y + M.block - 20 },
          { x: x + 20, y: y + M.block - 20 },
        ];
        for (let c = 0; c < 4; c += 1) {
          if (rng() < 0.34) palms.push({ x: corners[c].x + rng.range(-8, 8), y: corners[c].y + rng.range(-8, 8), size: 18 + rng() * 12, angle: rng() * U.TAU });
          if (rng() < 0.18) benches.push({ x: corners[c].x + (c === 0 ? 32 : c === 1 ? -32 : 0), y: corners[c].y + (c === 2 ? -8 : 8), angle: rng() * U.TAU });
        }
      }
    }

    for (let j = 0; j <= M.grid; j += 1) {
      for (let i = 0; i <= M.grid; i += 1) {
        if (rng() < 0.4) {
          lamps.push({ x: roadCoord(j) + (j === 0 ? 0 : 54), y: roadCoord(i) + (i === 0 ? 0 : 54), angle: rng() * U.TAU });
        }
      }
    }

    for (let b = 0; b < 15; b += 1) {
      const along = 160 + b * 250;
      palms.push({ x: 4000 + rng() * 34, y: along + rng() * 60, size: 24 + rng() * 14, angle: rng() * U.TAU, beach: true });
      if (b < 12) props.push({ type: 'umbrella', x: 4032 + rng() * 18, y: along + 90 + rng() * 80, tone: rng.pick(['#e34b3a', '#f3b93f', '#3fc0b0', '#8f5bb5']) });
    }
    for (let b = 0; b < 12; b += 1) {
      palms.push({ x: 180 + b * 330 + rng() * 60, y: 4010 + rng() * 36, size: 24 + rng() * 14, angle: rng() * U.TAU, beach: true });
    }
    for (let b = 0; b < 8; b += 1) {
      const bx = 150 + b * 500 + rng() * 120;
      palms.push({ x: bx, y: 12 + rng() * 30, size: 24 + rng() * 12, angle: rng() * U.TAU, beach: true });
      palms.push({ x: 10 + rng() * 34, y: 240 + b * 480 + rng() * 80, size: 24 + rng() * 12, angle: rng() * U.TAU, beach: true });
    }

    for (let b = 0; b < 5; b += 1) {
      boats.push({ x: 4100 + rng() * 260, y: 500 + b * 700 + rng() * 240, angle: rng() * U.TAU, len: 70 + rng() * 50, tone: rng.pick(['#ece3cf', '#2f8f8a', '#c8452f', '#3f6fb5']) });
    }
    boats.push({ x: 4204, y: 2101, angle: Math.PI, len: 112, tone: '#f3e6c9', yacht: true });

    for (let p = 0; p < piers.length; p += 1) {
      const pier = piers[p];
      for (let k = 0; k < 7; k += 1) props.push({ type: 'bollard', x: pier.x + 24 + k * (pier.w - 40) / 6, y: pier.y + pier.h - 8 });
    }

    const nodeList = [];
    const nodes = [];
    for (let i = 0; i <= M.grid; i += 1) {
      const row = [];
      for (let j = 0; j <= M.grid; j += 1) {
        const node = { i: i, j: j, x: roadCoord(j), y: roadCoord(i) };
        row.push(node);
        nodeList.push(node);
      }
      nodes.push(row);
    }

    function inPier(x, y) {
      for (let p = 0; p < piers.length; p += 1) {
        const pier = piers[p];
        if (x >= pier.x && x <= pier.x + pier.w && y >= pier.y && y <= pier.y + pier.h) return true;
      }
      return false;
    }

    function isWalkable(x, y) {
      if (x < 6 || y < 6 || x > M.land - 6 || y > M.land - 6) return inPier(x, y);
      return true;
    }

    function solidAt(x, y, radius) {
      if (!isWalkable(x, y)) return true;
      if (x > M.land - 6 || y > M.land - 6) return false;
      for (let b = 0; b < buildings.length; b += 1) {
        if (U.circleRect(x, y, radius || 1, buildings[b])) return true;
      }
      for (let s = 0; s < solids.length; s += 1) {
        if (U.circleRect(x, y, radius || 1, solids[s])) return true;
      }
      return false;
    }

    function moveCircle(pos, dx, dy, radius) {
      let hitX = false;
      let hitY = false;
      if (dx !== 0) {
        if (!solidAt(pos.x + dx, pos.y, radius)) pos.x += dx;
        else hitX = true;
      }
      if (dy !== 0) {
        if (!solidAt(pos.x, pos.y + dy, radius)) pos.y += dy;
        else hitY = true;
      }
      return { hitX: hitX, hitY: hitY };
    }

    function nearestNode(x, y) {
      let best = null;
      let bestD = Infinity;
      for (let n = 0; n < nodeList.length; n += 1) {
        const node = nodeList[n];
        const d = U.dist2(x, y, node.x, node.y);
        if (d < bestD) {
          bestD = d;
          best = node;
        }
      }
      return best;
    }

    function randomNode(minX, minY, maxX, maxY) {
      let node = nodeList[rng.int(0, nodeList.length - 1)];
      let guard = 0;
      while (guard < 60 && (node.x < minX || node.x > maxX || node.y < minY || node.y > maxY)) {
        node = nodeList[rng.int(0, nodeList.length - 1)];
        guard += 1;
      }
      return node;
    }

    function districtAt(x, y) {
      const j = U.clamp(Math.floor((x - M.margin) / M.spacing), 0, M.grid - 1);
      const i = U.clamp(Math.floor((y - M.margin) / M.spacing), 0, M.grid - 1);
      if (x > 4010 && y > 1980 && y < 2800) return 'COBALT DOCKS';
      return districtFor(i, j);
    }

    return {
      seed: seed,
      size: M.size,
      land: M.land,
      blocks: blocks,
      buildings: buildings,
      solids: solids,
      props: props,
      palms: palms,
      lamps: lamps,
      benches: benches,
      trees: trees,
      fountains: fountains,
      parkingSpots: parkingSpots,
      boats: boats,
      piers: piers,
      nodes: nodes,
      nodeList: nodeList,
      isWalkable: isWalkable,
      inPier: inPier,
      solidAt: solidAt,
      moveCircle: moveCircle,
      nearestNode: nearestNode,
      randomNode: randomNode,
      districtAt: districtAt,
      blockOrigin: blockOrigin,
      roadCoord: roadCoord,
    };
  }

  CC.buildCity = buildCity;
})();
