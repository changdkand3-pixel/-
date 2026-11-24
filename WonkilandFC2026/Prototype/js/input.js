// 입력: 키보드(1P/2P) + 게임패드/조이스틱 (Gamepad API)
(function () {
  'use strict';
  const down = new Set(), pressed = new Set(), released = new Set();
  addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!down.has(e.code)) pressed.add(e.code); down.add(e.code);
  });
  addEventListener('keyup', e => { down.delete(e.code); released.add(e.code); });
  addEventListener('blur', () => down.clear());

  const SCHEMES = {
    p1: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], sprint: ['ShiftLeft'], pass: ['KeyJ'], shoot: ['KeyK'], through: ['KeyL'], lob: ['KeyI'], switch: ['KeyU'], curl: ['KeyO'] },
    p1solo: { up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], sprint: ['ShiftLeft', 'ShiftRight'], pass: ['KeyJ', 'KeyZ'], shoot: ['KeyK', 'KeyX', 'Space'], through: ['KeyL', 'KeyC'], lob: ['KeyI', 'KeyV'], switch: ['KeyU', 'KeyQ'], curl: ['KeyO', 'KeyE'] },
    p2: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], sprint: ['ShiftRight', 'Numpad0'], pass: ['Numpad1', 'Comma'], shoot: ['Numpad2', 'Period'], through: ['Numpad3', 'Slash'], lob: ['Numpad5', 'Semicolon'], switch: ['Numpad4', 'KeyM'], curl: ['Numpad6', 'Quote'] }
  };
  const any = (set, codes) => codes.some(c => set.has(c));

  // 표준 게임패드 매핑: A=패스/태클, B=슈팅/슬라이딩, X=로빙/크로스, Y=스루패스, LB=선수전환, RB=감아차기, RT=질주, Start=일시정지
  const padPrev = [{}, {}, {}, {}];
  function readPad(i) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && pads[i];
    if (!gp) return null;
    const b = k => !!(gp.buttons[k] && (gp.buttons[k].pressed || gp.buttons[k].value > 0.5));
    let x = gp.axes[0] || 0, y = gp.axes[1] || 0;
    if (Math.hypot(x, y) < 0.18) { x = 0; y = 0; }
    if (b(12)) y = -1; if (b(13)) y = 1; if (b(14)) x = -1; if (b(15)) x = 1; // D-pad
    const cur = { pass: b(0), shoot: b(1), lob: b(2), through: b(3), switch: b(4), curl: b(5), sprint: b(7) || b(6), start: b(9) };
    const prev = padPrev[i]; padPrev[i] = cur;
    const edge = k => cur[k] && !prev[k], rel = k => !cur[k] && prev[k];
    return { x, y, cur, edge, rel, id: gp.id };
  }

  const shootHold = [0, 0];
  // slot: 0 또는 1, scheme: 'p1solo' | 'p1' | 'p2', pad: 게임패드 인덱스
  function poll(slot, scheme, padIndex, dt) {
    const s = SCHEMES[scheme];
    let x = (any(down, s.right) ? 1 : 0) - (any(down, s.left) ? 1 : 0);
    let y = (any(down, s.down) ? 1 : 0) - (any(down, s.up) ? 1 : 0);
    let sprint = any(down, s.sprint), curl = any(down, s.curl);
    let passP = any(pressed, s.pass), throughP = any(pressed, s.through), lobP = any(pressed, s.lob), switchP = any(pressed, s.switch);
    let shootDown = any(down, s.shoot), shootP = any(pressed, s.shoot), shootR = any(released, s.shoot);
    const pad = readPad(padIndex);
    if (pad) {
      if (pad.x || pad.y) { x = pad.x; y = pad.y; }
      sprint = sprint || pad.cur.sprint; curl = curl || pad.cur.curl;
      passP = passP || pad.edge('pass'); throughP = throughP || pad.edge('through'); lobP = lobP || pad.edge('lob'); switchP = switchP || pad.edge('switch');
      shootDown = shootDown || pad.cur.shoot; shootP = shootP || pad.edge('shoot'); shootR = shootR || pad.rel('shoot');
    }
    if (shootDown) shootHold[slot] = Math.min(1, shootHold[slot] + dt * 1.1);
    const power = shootR ? Math.max(0.2, shootHold[slot]) : shootHold[slot];
    if (shootR || !shootDown) { if (!shootDown) shootHold[slot] = shootR ? shootHold[slot] : 0; }
    const out = { sx: x, sy: y, sprint, curl, passPressed: passP, throughPressed: throughP, lobPressed: lobP, switchPressed: switchP, shootPressed: shootP, shootReleased: shootR, shootPower: power, charging: shootDown ? shootHold[slot] : 0, pad: pad && pad.id };
    if (shootR) shootHold[slot] = 0;
    return out;
  }
  function endFrame() { pressed.clear(); released.clear(); }
  function keyPressed(code) { return pressed.has(code); }
  function padStart() { const p = readPad(0); return p && p.edge('start'); }
  function padsConnected() { return (navigator.getGamepads ? Array.from(navigator.getGamepads()) : []).filter(Boolean).map(g => g.id); }
  window.WFCInput = { poll, endFrame, keyPressed, padStart, padsConnected, SCHEMES, _down: down, _pressed: pressed, _released: released };
})();
