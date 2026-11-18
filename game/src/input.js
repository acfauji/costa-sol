(function () {
  const CC = (window.CC = window.CC || {});
  const WIDTH = 1280;
  const HEIGHT = 720;
  const BLOCKED = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'KeyE', 'KeyF', 'KeyQ', 'KeyM'];

  function createInput(canvas) {
    const keys = Object.create(null);
    const pressedKeys = Object.create(null);
    const mouse = {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      down: false,
      rightDown: false,
      lookDelta: 0,
      pressed: false,
      released: false,
    };
    let lastX = mouse.x;

    function toLogical(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const rx = (clientX - rect.left) / Math.max(1, rect.width);
      const ry = (clientY - rect.top) / Math.max(1, rect.height);
      return { x: rx * WIDTH, y: ry * HEIGHT };
    }

    window.addEventListener('keydown', function (event) {
      if (BLOCKED.indexOf(event.code) >= 0) event.preventDefault();
      if (!event.repeat) pressedKeys[event.code] = true;
      keys[event.code] = true;
    });
    window.addEventListener('keyup', function (event) {
      keys[event.code] = false;
    });
    window.addEventListener('blur', function () {
      for (const key in keys) keys[key] = false;
      mouse.down = false;
      mouse.rightDown = false;
    });
    canvas.addEventListener('contextmenu', function (event) {
      event.preventDefault();
    });
    canvas.addEventListener('mousemove', function (event) {
      const p = toLogical(event.clientX, event.clientY);
      mouse.lookDelta += p.x - lastX;
      mouse.x = p.x;
      mouse.y = p.y;
      lastX = p.x;
    });
    canvas.addEventListener('mousedown', function (event) {
      event.preventDefault();
      const p = toLogical(event.clientX, event.clientY);
      mouse.x = p.x;
      mouse.y = p.y;
      lastX = p.x;
      if (event.button === 0) {
        mouse.down = true;
        mouse.pressed = true;
      } else if (event.button === 2) {
        mouse.rightDown = true;
      }
    });
    window.addEventListener('mouseup', function (event) {
      if (event.button === 0) {
        mouse.down = false;
        mouse.released = true;
      } else if (event.button === 2) {
        mouse.rightDown = false;
      }
    });
    canvas.addEventListener('mouseleave', function () {
      mouse.down = false;
      mouse.rightDown = false;
    });
    canvas.addEventListener('wheel', function (event) {
      event.preventDefault();
    }, { passive: false });

    const input = {
      mouseX: mouse.x,
      mouseY: mouse.y,
      lookDelta: 0,
      down: function (code) {
        if (code === 'Mouse0') return mouse.down;
        if (code === 'Mouse2') return mouse.rightDown;
        return !!keys[code];
      },
      pressed: function (code) {
        if (code === 'Mouse0') return mouse.pressed;
        return !!pressedKeys[code];
      },
      released: function (code) {
        if (code === 'Mouse0') return mouse.released;
        return false;
      },
      endFrame: function () {
        for (const key in pressedKeys) delete pressedKeys[key];
        mouse.pressed = false;
        mouse.released = false;
        mouse.lookDelta = 0;
        input.mouseX = mouse.x;
        input.mouseY = mouse.y;
        input.lookDelta = mouse.lookDelta;
      },
      sync: function () {
        input.mouseX = mouse.x;
        input.mouseY = mouse.y;
        input.lookDelta = mouse.lookDelta;
      },
      mouse: mouse,
      canvas: canvas,
      width: WIDTH,
      height: HEIGHT,
    };
    return input;
  }

  CC.Input = {
    create: createInput,
    width: WIDTH,
    height: HEIGHT,
  };
})();
