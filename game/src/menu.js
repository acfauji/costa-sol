(function () {
  const CC = (window.CC = window.CC || {});
  const C = CC.C;
  const U = CC.util;
  const P = C.PALETTE;
  const WIDTH = 1280;
  const HEIGHT = 720;

  function createMenu(game, callbacks) {
    const menu = {
      screen: 'main',
      index: 0,
      hover: -1,
      toast: '',
      toastTime: 0,
    };

    function mainOptions() {
      return [
        { id: 'continue', label: 'CONTINUE CAREER', note: 'LOAD YOUR LAST SAVE', disabled: !CC.Save.has() },
        { id: 'start', label: 'START STORY', note: 'FIVE JOBS · ONE BAD DEBT' },
        { id: 'free', label: 'FREE ROAM', note: 'THE CITY IS YOURS' },
        { id: 'sound', label: 'SOUND: ' + (game.audio.isMuted() ? 'OFF' : 'ON'), note: 'TOGGLE AUDIO' },
      ];
    }

    function pauseOptions() {
      return [
        { id: 'resume', label: 'RESUME', note: 'BACK TO THE HEAT' },
        { id: 'save', label: 'SAVE GAME', note: 'WRITE TO THIS BROWSER' },
        { id: 'load', label: 'LOAD LAST SAVE', note: 'RETURN TO YOUR LAST SAVE', disabled: !CC.Save.has() },
        { id: 'restart', label: 'RESTART STORY', note: 'BEGIN AGAIN FROM THE SAFEHOUSE' },
        { id: 'quit', label: 'MAIN MENU', note: 'LEAVE COSTA SOL' },
        { id: 'sound', label: 'SOUND: ' + (game.audio.isMuted() ? 'OFF' : 'ON'), note: 'TOGGLE AUDIO' },
      ];
    }

    function currentOptions() {
      return menu.screen === 'pause' ? pauseOptions() : mainOptions();
    }

    function layout() {
      if (menu.screen === 'pause') {
        const panelW = 470;
        const panelH = 486;
        const px = WIDTH / 2 - panelW / 2;
        const py = HEIGHT / 2 - panelH / 2;
        return { x: px + 60, y: py + 120, w: panelW - 120, h: 44, gap: 10, panel: { x: px, y: py, w: panelW, h: panelH } };
      }
      return { x: 846, y: 196, w: 356, h: 52, gap: 12, panel: null };
    }

    function openMain() {
      menu.screen = 'main';
      menu.index = CC.Save.has() ? 0 : 1;
      menu.hover = -1;
      menu.toast = '';
      menu.toastTime = 0;
    }

    function openPause() {
      menu.screen = 'pause';
      menu.index = 0;
      menu.hover = -1;
      menu.toast = '';
      menu.toastTime = 0;
    }

    function clampIndex() {
      const options = currentOptions();
      if (menu.index < 0) menu.index = options.length - 1;
      if (menu.index >= options.length) menu.index = 0;
      let guard = 0;
      while (options[menu.index].disabled && guard < options.length) {
        menu.index = (menu.index + 1) % options.length;
        guard += 1;
      }
    }

    function move(direction) {
      const options = currentOptions();
      let guard = 0;
      do {
        menu.index = (menu.index + direction + options.length) % options.length;
        guard += 1;
      } while (options[menu.index].disabled && guard < options.length);
      if (game.audio) game.audio.click();
    }

    function showToast(text) {
      menu.toast = text;
      menu.toastTime = 2.4;
    }

    function activate(id) {
      if (game.audio) game.audio.click();
      if (id === 'continue' && callbacks.continueCareer) callbacks.continueCareer();
      else if (id === 'start' && callbacks.startStory) callbacks.startStory();
      else if (id === 'free' && callbacks.freeRoam) callbacks.freeRoam();
      else if (id === 'sound' && callbacks.toggleSound) callbacks.toggleSound();
      else if (id === 'resume' && callbacks.resume) callbacks.resume();
      else if (id === 'save' && callbacks.save) {
        if (callbacks.save()) showToast('GAME SAVED');
      } else if (id === 'load' && callbacks.load) callbacks.load();
      else if (id === 'restart' && callbacks.restart) callbacks.restart();
      else if (id === 'quit' && callbacks.quit) callbacks.quit();
    }

    function update(dt) {
      menu.toastTime = Math.max(0, menu.toastTime - dt);
      const input = game.input;
      if (!input) return;
      if (input.pressed('ArrowUp') || input.pressed('KeyW')) move(-1);
      if (input.pressed('ArrowDown') || input.pressed('KeyS')) move(1);
      if (input.pressed('Enter') || input.pressed('NumpadEnter')) {
        const option = currentOptions()[menu.index];
        if (option && !option.disabled) activate(option.id);
      }
      if (input.pressed('Escape') && menu.screen === 'pause' && callbacks.resume) callbacks.resume();
      const options = currentOptions();
      const box = layout();
      let hovered = -1;
      for (let i = 0; i < options.length; i += 1) {
        const y = box.y + i * (box.h + box.gap);
        if (input.mouseX >= box.x && input.mouseX <= box.x + box.w && input.mouseY >= y && input.mouseY <= y + box.h) hovered = i;
      }
      if (hovered >= 0 && hovered !== menu.hover && !options[hovered].disabled) {
        menu.index = hovered;
        if (game.audio) game.audio.click();
      }
      menu.hover = hovered;
      if (hovered >= 0 && input.pressed('Mouse0') && !options[hovered].disabled) activate(options[hovered].id);
    }

    function drawMain(ctx) {
      const Grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      Grad.addColorStop(0, 'rgba(9, 14, 18, 0.6)');
      Grad.addColorStop(0.5, 'rgba(9, 14, 18, 0.32)');
      Grad.addColorStop(1, 'rgba(9, 14, 18, 0.83)');
      ctx.fillStyle = Grad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      const left = ctx.createLinearGradient(0, 0, 720, 0);
      left.addColorStop(0, 'rgba(8, 13, 17, 0.78)');
      left.addColorStop(1, 'rgba(8, 13, 17, 0)');
      ctx.fillStyle = left;
      ctx.fillRect(0, 0, 720, HEIGHT);

      ctx.strokeStyle = 'rgba(243, 185, 63, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(66, 76);
      ctx.lineTo(310, 76);
      ctx.moveTo(66, 96);
      ctx.lineTo(196, 96);
      ctx.stroke();
      ctx.fillStyle = 'rgba(247, 238, 217, 0.55)';
      ctx.font = '700 8px "Helvetica Neue", sans-serif';
      CC.Hud.spaced(ctx, 'AN ORIGINAL COSTA SOL CRIME SAGA', 68, 90, 3);
      ctx.fillStyle = P.gold;
      ctx.font = '700 9px "Helvetica Neue", sans-serif';
      CC.Hud.spaced(ctx, 'CASE FILE 06 · HEATWAVE', 68, 114, 2.2);

      ctx.fillStyle = P.cream;
      ctx.font = '900 106px "Arial Narrow", "Helvetica Neue", sans-serif';
      CC.Hud.spaced(ctx, 'COSTA', 62, 262, 2);
      const goldGrad = ctx.createLinearGradient(0, 286, 0, 392);
      goldGrad.addColorStop(0, '#ffe2a0');
      goldGrad.addColorStop(0.55, P.gold);
      goldGrad.addColorStop(1, '#b87516');
      ctx.fillStyle = goldGrad;
      ctx.font = '900 122px "Arial Narrow", "Helvetica Neue", sans-serif';
      CC.Hud.spaced(ctx, 'SOL', 62, 376, 4);
      ctx.fillStyle = 'rgba(15, 20, 24, 0.55)';
      ctx.font = '900 122px "Arial Narrow", "Helvetica Neue", sans-serif';
      ctx.fillText('HEATWAVE', 68, 390);

      ctx.fillStyle = 'rgba(247, 238, 217, 0.9)';
      ctx.font = '700 20px "Helvetica Neue", sans-serif';
      CC.Hud.spaced(ctx, 'HEATWAVE', 66, 424, 9.5);
      ctx.fillStyle = P.gold;
      ctx.fillRect(66, 442, 96, 3);
      ctx.fillStyle = 'rgba(247, 238, 217, 0.78)';
      ctx.font = '600 15px Georgia, serif';
      ctx.fillText('Three districts. One bad debt. No clean hands.', 66, 478);

      const save = CC.Save.read();
      if (save) {
        ctx.fillStyle = 'rgba(14, 19, 23, 0.62)';
        CC.Hud.roundRect(ctx, 66, 510, 360, 58, 7);
        ctx.fill();
        ctx.fillStyle = P.gold;
        ctx.font = '700 8px "Helvetica Neue", sans-serif';
        CC.Hud.spaced(ctx, 'CAREER ON FILE', 82, 529, 2.4);
        ctx.fillStyle = P.cream;
        ctx.font = '700 13px "Helvetica Neue", sans-serif';
        ctx.fillText((save.cash ? U.formatMoney(save.cash) : '$0') + '  ·  ' + (save.stats && save.stats.missions ? save.stats.missions : 0) + ' JOBS  ·  CHAPTER ' + Math.min(5, (save.missionIndex || 0) + 1), 82, 550);
      } else {
        ctx.fillStyle = 'rgba(14, 19, 23, 0.55)';
        CC.Hud.roundRect(ctx, 66, 510, 360, 58, 7);
        ctx.fill();
        ctx.fillStyle = P.gold;
        ctx.font = '700 8px "Helvetica Neue", sans-serif';
        CC.Hud.spaced(ctx, 'NEW CAREER', 82, 529, 2.4);
        ctx.fillStyle = 'rgba(247, 238, 217, 0.72)';
        ctx.font = '600 12px "Helvetica Neue", sans-serif';
        ctx.fillText('Start at the safehouse with $120 and a borrowed pistol.', 82, 550);
      }

      const options = mainOptions();
      const box = layout();
      ctx.fillStyle = 'rgba(243, 185, 63, 0.85)';
      ctx.font = '700 8px "Helvetica Neue", sans-serif';
      CC.Hud.spaced(ctx, 'SELECT A JOB', box.x, box.y - 22, 3);
      ctx.fillStyle = 'rgba(247, 238, 217, 0.32)';
      ctx.fillRect(box.x, box.y - 12, box.w, 1);
      for (let i = 0; i < options.length; i += 1) {
        const option = options[i];
        const y = box.y + i * (box.h + box.gap);
        const selected = i === menu.index;
        ctx.fillStyle = selected ? P.gold : option.disabled ? 'rgba(14, 19, 23, 0.38)' : 'rgba(14, 19, 23, 0.72)';
        CC.Hud.roundRect(ctx, box.x, y, box.w, box.h, 7);
        ctx.fill();
        if (selected) {
          ctx.strokeStyle = 'rgba(255, 232, 170, 0.9)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(247, 238, 217, 0.12)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.fillStyle = selected ? 'rgba(20, 26, 30, 0.85)' : option.disabled ? 'rgba(247, 238, 217, 0.26)' : 'rgba(243, 185, 63, 0.8)';
        ctx.font = '700 9px "Helvetica Neue", sans-serif';
        ctx.fillText(('0' + (i + 1)).slice(-2), box.x + 18, y + 21);
        ctx.fillStyle = selected ? '#151d22' : option.disabled ? 'rgba(247, 238, 217, 0.28)' : P.cream;
        ctx.font = '700 15px "Arial Narrow", "Helvetica Neue", sans-serif';
        CC.Hud.spaced(ctx, option.label, box.x + 48, y + 25, 1.6);
        ctx.fillStyle = selected ? 'rgba(21, 29, 34, 0.62)' : option.disabled ? 'rgba(247, 238, 217, 0.18)' : 'rgba(247, 238, 217, 0.38)';
        ctx.font = '600 8px "Helvetica Neue", sans-serif';
        CC.Hud.spaced(ctx, option.note, box.x + 48, y + 39, 1.1);
        if (selected) {
          ctx.fillStyle = '#151d22';
          ctx.beginPath();
          ctx.moveTo(box.x + box.w - 24, y + box.h / 2);
          ctx.lineTo(box.x + box.w - 32, y + box.h / 2 - 6);
          ctx.lineTo(box.x + box.w - 32, y + box.h / 2 + 6);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.fillStyle = 'rgba(247, 238, 217, 0.35)';
      ctx.font = '600 8px "Helvetica Neue", sans-serif';
      CC.Hud.spaced(ctx, '↑↓ SELECT   ·   ENTER CONFIRM   ·   MOUSE SUPPORTED', box.x, box.y + options.length * (box.h + box.gap) + 22, 1.2);

      ctx.fillStyle = 'rgba(14, 19, 23, 0.7)';
      CC.Hud.roundRect(ctx, 66, 604, 620, 72, 7);
      ctx.fill();
      ctx.fillStyle = P.gold;
      ctx.font = '700 8px "Helvetica Neue", sans-serif';
      CC.Hud.spaced(ctx, 'FIELD MANUAL', 84, 624, 2.6);
      ctx.fillStyle = 'rgba(247, 238, 217, 0.74)';
      ctx.font = '600 10px "Helvetica Neue", sans-serif';
      ctx.fillText('WASD move or drive   ·   Mouse aim and fire   ·   E enter / exit vehicles', 84, 645);
      ctx.fillText('Shift sprint   ·   Space jump or handbrake   ·   F melee   ·   Q switch weapon   ·   Tab pause', 84, 662);

      ctx.fillStyle = 'rgba(247, 238, 217, 0.35)';
      ctx.font = '600 8px "Helvetica Neue", sans-serif';
      CC.Hud.spaced(ctx, 'COSTA SOL STUDIO  ·  AN ORIGINAL WORK  ·  ' + C.VERSION, 66, 704, 1.6);
      CC.Hud.spaced(ctx, 'SEED ' + game.seed + '  ·  1280 × 720', WIDTH - 66, 704, 1.6, 'right');
    }

    function drawPause(ctx) {
      ctx.fillStyle = 'rgba(7, 11, 14, 0.74)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      const box = layout();
      const panel = box.panel;
      ctx.fillStyle = 'rgba(13, 18, 22, 0.95)';
      CC.Hud.roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(243, 185, 63, 0.36)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = P.gold;
      ctx.fillRect(panel.x, panel.y, panel.w, 4);
      ctx.fillStyle = P.cream;
      ctx.font = '900 42px "Arial Narrow", "Helvetica Neue", sans-serif';
      CC.Hud.spaced(ctx, 'PAUSED', panel.x + 42, panel.y + 72, 4);
      ctx.fillStyle = 'rgba(247, 238, 217, 0.5)';
      ctx.font = '700 9px "Helvetica Neue", sans-serif';
      CC.Hud.spaced(ctx, 'COSTA SOL  ·  ' + game.city.districtAt(CC.Player.footX(game.player), CC.Player.footY(game.player)), panel.x + 44, panel.y + 94, 2);
      const options = pauseOptions();
      for (let i = 0; i < options.length; i += 1) {
        const option = options[i];
        const y = box.y + i * (box.h + box.gap);
        const selected = i === menu.index;
        ctx.fillStyle = selected ? P.gold : option.disabled ? 'rgba(8, 12, 15, 0.45)' : 'rgba(8, 12, 15, 0.72)';
        CC.Hud.roundRect(ctx, box.x, y, box.w, box.h, 6);
        ctx.fill();
        ctx.strokeStyle = selected ? 'rgba(255, 232, 170, 0.85)' : 'rgba(247, 238, 217, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = selected ? '#151d22' : option.disabled ? 'rgba(247, 238, 217, 0.26)' : P.cream;
        ctx.font = '700 14px "Arial Narrow", "Helvetica Neue", sans-serif';
        CC.Hud.spaced(ctx, option.label, box.x + 20, y + 20, 1.5);
        ctx.fillStyle = selected ? 'rgba(21, 29, 34, 0.6)' : 'rgba(247, 238, 217, 0.34)';
        ctx.font = '600 8px "Helvetica Neue", sans-serif';
        CC.Hud.spaced(ctx, option.note, box.x + 20, y + 34, 1);
      }
      ctx.fillStyle = 'rgba(247, 238, 217, 0.4)';
      ctx.font = '600 8px "Helvetica Neue", sans-serif';
      CC.Hud.spaced(ctx, 'ENTER CONFIRM   ·   ESC RESUME', panel.x + panel.w / 2, panel.y + panel.h - 22, 1.8, 'center');
    }

    function draw(ctx) {
      if (menu.screen === 'pause') drawPause(ctx);
      else drawMain(ctx);
      if (menu.toastTime > 0) {
        const alpha = U.clamp(menu.toastTime, 0, 1);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(14, 19, 23, 0.9)';
        CC.Hud.roundRect(ctx, WIDTH / 2 - 130, HEIGHT - 156, 260, 34, 7);
        ctx.fill();
        ctx.strokeStyle = 'rgba(243, 185, 63, 0.55)';
        ctx.stroke();
        ctx.fillStyle = P.gold;
        ctx.font = '700 9px "Helvetica Neue", sans-serif';
        CC.Hud.spaced(ctx, menu.toast, WIDTH / 2, HEIGHT - 135, 2.4, 'center');
        ctx.restore();
      }
    }

    openMain();

    return {
      update: update,
      draw: draw,
      openMain: openMain,
      openPause: openPause,
      showToast: showToast,
      screen: function () {
        return menu.screen;
      },
      index: function () {
        return menu.index;
      },
    };
  }

  CC.Menu = {
    create: createMenu,
  };
})();
