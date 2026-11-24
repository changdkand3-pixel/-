// 경기 엔진: 선수 이동, 볼 소유/드리블, 패스/슈팅, 골키퍼, AI, 규칙(오프사이드/세트피스/파울/카드), 시간, 통계.
// 렌더링과 분리되어 있어 Node에서 전체 경기를 헤드리스로 시뮬레이션/테스트할 수 있다.
(function (root) {
  'use strict';
  const Phys = (typeof module !== 'undefined' && module.exports) ? require('./physics.js') : root.WFCPhysics;
  const PH = Phys.PITCH, BR = Phys.BALL.radius;

  // ---------------- 포메이션 (fx: 자기 골라인 0 → 상대 골라인 1, fz: 오른쪽 +) ----------------
  // 슬롯 순서는 데이터 순서(GK, RB, LB, RH, CH, LH, OR, IR, CF, IL, OL)와 대응
  const FORMATIONS = {
    '2-3-5': [[0.02, 0], [0.22, 0.32], [0.22, -0.32], [0.40, 0.62], [0.37, 0], [0.40, -0.62], [0.68, 0.84], [0.64, 0.36], [0.70, 0], [0.64, -0.36], [0.68, -0.84]],
    'WM (3-2-2-3)': [[0.02, 0], [0.22, 0.5], [0.22, -0.5], [0.36, 0.3], [0.2, 0], [0.36, -0.3], [0.7, 0.8], [0.52, 0.3], [0.72, 0], [0.52, -0.3], [0.7, -0.8]],
    '4-4-2': [[0.02, 0], [0.22, 0.6], [0.22, -0.6], [0.2, 0.2], [0.42, 0.15], [0.2, -0.2], [0.45, 0.75], [0.66, 0.18], [0.66, -0.18], [0.42, -0.15], [0.45, -0.75]],
    '4-3-3': [[0.02, 0], [0.22, 0.6], [0.22, -0.6], [0.2, 0.2], [0.38, 0], [0.2, -0.2], [0.7, 0.75], [0.48, 0.35], [0.74, 0], [0.48, -0.35], [0.7, -0.75]],
    '3-5-2': [[0.02, 0], [0.22, 0.4], [0.22, -0.4], [0.42, 0.8], [0.2, 0], [0.42, -0.8], [0.5, 0.35], [0.68, 0.18], [0.68, -0.18], [0.5, -0.35], [0.4, 0]]
  };
  const MENTALITY = { defensive: -0.08, balanced: 0, attacking: 0.08 };
  const BUSY = new Set(['kick', 'volley', 'bicycle', 'header', 'slide', 'fall', 'getup', 'gk_dive', 'gk_ground', 'throw', 'tackle', 'gk_punch', 'gk_roll_throw', 'celebrate']);
  const DUR = { kick: 0.42, volley: 0.5, bicycle: 0.9, header: 0.55, slide: 0.9, fall: 0.9, getup: 0.8, gk_dive: 0.9, gk_ground: 0.7, throw: 0.6, tackle: 0.35, gk_punch: 0.45, gk_roll_throw: 0.6, celebrate: 99 };

  function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const d2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const lerp = (a, b, t) => a + (b - a) * t;

  class Match {
    constructor(opts) {
      this.o = Object.assign({ halfSeconds: 180, rules: null, knockout: true, seed: 1930, homeSquad: null, awaySquad: null, kits: {}, formation: ['2-3-5', '2-3-5'] }, opts);
      this.R = rng(this.o.seed);
      this.rules = this.o.rules;
      this.ball = Phys.createBall();
      this.time = 0; this.half = 1; this.clockSec = 0; this.added = 0;
      this.events = []; this.listeners = [];
      this.teams = [0, 1].map(i => this.makeTeam(i, i === 0 ? this.o.homeSquad : this.o.awaySquad));
      this.possessor = null; this.lastTouch = null; this.lastKicker = null; this.pendingPass = null; this.offsideFlags = new Set();
      this.phase = 'pre'; this.phaseT = 0; this.setPiece = null; this.shootout = null; this.result = null;
      this.slowmo = 1;
      this.kickoffTeam = 0;
      this.resetKickoff(0);
    }
    on(fn) { this.listeners.push(fn); }
    emit(type, data) {
      const e = Object.assign({ type, minute: this.minute(), half: this.half }, data || {});
      this.events.push(e); this.listeners.forEach(f => f(e));
    }
    minute() {
      const per = this.half <= 2 ? 45 : 15, base = [0, 0, 45, 90, 105][this.half];
      return base + Math.floor(this.clockSec / this.halfLen() * per);
    }
    halfLen() { return this.half <= 2 ? this.o.halfSeconds : this.o.halfSeconds / 3; }

    makeTeam(i, squad) {
      const players = squad.players.slice(0, 11);
      const t = { i, id: squad.team_id, squad, side: i === 0 ? 1 : -1, score: 0, formation: this.o.formation[i], mentality: 'balanced', controller: null, controlled: null,
        stats: { shots: 0, onTarget: 0, passes: 0, passesOk: 0, possession: 0, fouls: 0, corners: 0, offsides: 0, yellow: 0, red: 0, saves: 0 }, bench: squad.players.slice(11) };
      t.players = players.map((pd, k) => ({
        data: pd, r: pd.ratings, team: t, idx: k, gk: pd.position_group === 'GK', name: pd.name_ko,
        p: { x: 0, z: 0 }, v: { x: 0, z: 0 }, facing: 0, state: 'idle', stateT: 0, cd: 0, decideT: 0,
        anim: { state: 'idle', phase: this.R() * 6, speed: 0, t: 0 }, stamina: 100, injured: false, sentOff: false, yellow: 0,
        stats: { goals: 0, assists: 0, shots: 0, passes: 0, passesOk: 0, tackles: 0, saves: 0, fouls: 0 }, holdT: 0
      }));
      return t;
    }
    other(t) { return this.teams[1 - t.i]; }
    allPlayers() { return this.teams[0].players.concat(this.teams[1].players).filter(p => !p.sentOff); }
    active(t) { return t.players.filter(p => !p.sentOff); }
    goalX(t) { return t.side * PH.halfLength; } // 공격 방향 골
    ownGoalX(t) { return -t.side * PH.halfLength; }
    toWorld(t, fx, fz) { return { x: t.side * (-PH.halfLength + fx * PH.halfLength * 2), z: t.side * fz * PH.halfWidth }; }
    fxOf(t, x) { return (x * t.side + PH.halfLength) / (PH.halfLength * 2); }

    // ---------------- 킥오프 / 세트피스 ----------------
    resetKickoff(teamIdx) {
      this.kickoffTeam = teamIdx;
      Phys.place(this.ball, 0, 0);
      this.possessor = null; this.pendingPass = null; this.offsideFlags.clear();
      for (const t of this.teams) {
        const f = FORMATIONS[t.formation];
        this.active(t).forEach(p => {
          const s = f[p.idx]; const w = this.toWorld(t, Math.min(s[0] * 0.75, 0.47), s[1]);
          p.p.x = w.x; p.p.z = w.z; p.v.x = p.v.z = 0; p.state = 'idle'; p.stateT = 0; p.facing = t.side > 0 ? 0 : Math.PI; p.cd = 0;
        });
      }
      const kt = this.teams[teamIdx], cf = kt.players[8].sentOff ? this.active(kt)[this.active(kt).length - 1] : kt.players[8];
      cf.p.x = -kt.side * 0.4; cf.p.z = 0;
      const ir = kt.players[7]; if (!ir.sentOff) { ir.p.x = -kt.side * 0.6; ir.p.z = 2.5; }
      this.phase = 'kickoff'; this.phaseT = 0;
      this.setPiece = { type: 'kickoff', team: kt, taker: cf, spot: { x: 0, z: 0 } };
    }

    startSetPiece(type, team, spot) {
      this.possessor = null; this.pendingPass = null; this.offsideFlags.clear();
      const opp = this.other(team);
      let taker;
      if (type === 'goal_kick') taker = team.players.find(p => p.gk && !p.sentOff);
      else if (type === 'penalty') taker = this.bestBy(this.active(team).filter(p => !p.gk), p => p.r.penalty);
      else taker = this.nearest(this.active(team).filter(p => !p.gk || type === 'free_kick' && Math.abs(spot.x - this.ownGoalX(team)) < 20), spot);
      if (!taker) taker = this.active(team)[0];
      if (type === 'free_kick' && Math.abs(this.goalX(team) - spot.x) < 32) taker = this.bestBy(this.active(team).filter(p => !p.gk), p => p.r.free_kick);
      const s = { x: spot.x, z: spot.z };
      if (type === 'throw_in') s.z = Math.sign(spot.z) * (PH.halfWidth + 0.3);
      if (type === 'corner') { s.x = Math.sign(spot.x) * (PH.halfLength - 0.3); s.z = Math.sign(spot.z || 1) * (PH.halfWidth - 0.3); }
      if (type === 'goal_kick') { s.x = this.ownGoalX(team) + team.side * 5.5; s.z = (spot.z > 0 ? 1 : -1) * 4; }
      if (type === 'penalty') { s.x = this.goalX(team) - team.side * 11; s.z = 0; }
      Phys.place(this.ball, s.x, s.z);
      // 선수 배치
      taker.p.x = s.x - team.side * (type === 'throw_in' ? 0 : 0.6) ; taker.p.z = s.z + (type === 'throw_in' ? Math.sign(s.z) * 0.4 : 0);
      taker.facing = Math.atan2(-(type === 'throw_in' ? -Math.sign(s.z) : 0), team.side); taker.v.x = taker.v.z = 0;
      for (const p of this.allPlayers()) {
        if (p === taker) continue;
        if (type === 'penalty' && !this.shootout) {
          if (p.gk && p.team === opp) { p.p.x = this.goalX(team) - team.side * 0.3; p.p.z = 0; }
          else if (Math.abs(p.p.x - this.goalX(team)) < 18 && Math.abs(p.p.z) < 22) { p.p.x = this.goalX(team) - team.side * 19.5; }
        } else if (type === 'free_kick' || type === 'corner') {
          if (p.team === opp && d2(p.p, s) < 9.15) { const a = Math.atan2(p.p.z - s.z, p.p.x - s.x); p.p.x = s.x + Math.cos(a) * 9.2; p.p.z = s.z + Math.sin(a) * 9.2; }
        }
      }
      if (type === 'corner') { // 공격수들 박스 안으로
        this.active(team).filter(p => !p.gk && p !== taker && p.idx >= 6).forEach((p, k) => { p.p.x = this.goalX(team) - team.side * (6 + k * 2.2); p.p.z = -4 + k * 2.5; });
      }
      this.phase = 'setpiece'; this.phaseT = 0; this.setPiece = { type, team, taker, spot: s };
      if (type === 'corner') team.stats.corners++;
      this.emit('setpiece', { kind: type, team: team.id, player: taker.name });
    }

    // ---------------- 메인 업데이트 ----------------
    update(dt, inputs) {
      dt = Math.min(dt, 1 / 30) * this.slowmo;
      this.time += dt; this.phaseT += dt;
      const ph = this.phase;
      if (ph === 'fulltime') { this.allPlayers().forEach(p => this.tickPlayer(p, dt, null)); return; }
      if (ph === 'halftime') { if (this.phaseT > 3) this.startNextPeriod(); return; }
      if (ph === 'goal') {
        if (this.phaseT > 4.5) {
          if (this.shootout) this.nextShootoutKick();
          else this.resetKickoff(this.lastGoalAgainst);
        }
        this.allPlayers().forEach(p => this.tickPlayer(p, dt, null));
        this.stepBall(dt, true);
        return;
      }
      if (ph === 'pre') return;
      // 시계 (킥오프/세트피스 대기 중에도 경기 시간은 흐름. 단 승부차기는 시계 없음)
      if (!this.shootout && (ph === 'play' || ph === 'setpiece' || ph === 'kickoff')) {
        this.clockSec += dt;
        if (this.clockSec >= this.halfLen() + this.added) { this.endPeriod(); return; }
        if (!this.addedSet && this.clockSec >= this.halfLen() - 0.01) { this.addedSet = true; this.added = this.halfLen() / 45 * (1 + Math.floor(this.R() * 4)); this.emit('added_time', { mins: Math.round(this.added / this.halfLen() * 45), shown: !!this.rules.added_time_display }); }
      }
      // 사람 컨트롤러
      for (const t of this.teams) if (t.controller) this.handleHuman(t, inputs && inputs[t.i], dt);
      if (ph === 'kickoff' || ph === 'setpiece') this.updateSetPiece(dt, inputs);
      // AI
      for (const p of this.allPlayers()) {
        const human = p.team.controller && p.team.controlled === p;
        if (!human) this.ai(p, dt);
        this.tickPlayer(p, dt, human);
      }
      this.separate();
      if (this.phase === 'play') { this.updatePossession(dt); this.stepBall(dt, false); this.checkOut(); }
      else this.stepBall(dt, true);
      if (this.possessor) this.possessor.team.stats.possession += dt;
    }

    startNextPeriod() {
      this.half++; this.clockSec = 0; this.added = 0; this.addedSet = false;
      this.teams.forEach(t => { t.side = -t.side; });
      this.resetKickoff(this.half % 2 === 0 ? 1 : 0);
      this.emit('period_start', { half: this.half });
    }
    endPeriod() {
      const [a, b] = [this.teams[0].score, this.teams[1].score];
      this.emit('whistle', { kind: 'period_end', half: this.half });
      if (this.half === 1 || this.half === 3) { this.phase = 'halftime'; this.phaseT = 0; this.emit('half_time'); return; }
      if (a === b && this.o.knockout && this.half === 2) { this.phase = 'halftime'; this.phaseT = 0; this.emit('extra_time'); return; }
      if (a === b && this.o.knockout && this.half === 4) {
        if (this.rules.penalty_shootout) { this.beginShootout(); return; }
        this.finish('replay_required'); return;
      }
      this.finish(a === b ? 'draw' : 'win');
    }
    finish(kind) {
      this.phase = 'fulltime'; this.phaseT = 0;
      const [a, b] = this.teams;
      let winner = null;
      if (kind === 'win') winner = a.score > b.score ? a : b;
      if (kind === 'shootout') winner = this.shootout.score[0] > this.shootout.score[1] ? a : b;
      this.result = { kind, winner: winner && winner.id, score: [a.score, b.score], shootout: this.shootout && this.shootout.score.slice() };
      this.computeRatings();
      this.emit('full_time', this.result);
    }

    // ---------------- 승부차기 ----------------
    beginShootout() {
      this.shootout = { round: 0, kicks: [[], []], score: [0, 0], turn: 0 };
      this.emit('shootout_start');
      this.nextShootoutKick(true);
    }
    nextShootoutKick(first) {
      const so = this.shootout;
      if (!first) {
        const [k0, k1] = so.kicks.map(k => k.length), [s0, s1] = so.score;
        const rem0 = Math.max(0, 5 - k0), rem1 = Math.max(0, 5 - k1);
        if ((k0 <= 5 && k1 <= 5) && (s0 + rem0 < s1 || s1 + rem1 < s0)) return this.finish('shootout');
        if (k0 >= 5 && k0 === k1 && s0 !== s1) return this.finish('shootout');
      }
      const t = this.teams[so.turn];
      const order = this.active(t).filter(p => !p.gk).sort((x, y) => y.r.penalty - x.r.penalty);
      const taker = order[so.kicks[so.turn].length % order.length];
      // 승부차기는 한쪽 골대에서 진행
      const goalSide = 1;
      for (const p of this.allPlayers()) { p.state = 'idle'; p.v.x = p.v.z = 0; p.p.x = 0; p.p.z = (p.team.i ? 1 : -1) * (3 + p.idx); p.facing = goalSide > 0 ? 0 : Math.PI; }
      t.side = goalSide; this.other(t).side = -goalSide;
      const gk = this.other(t).players.find(p => p.gk && !p.sentOff) || this.active(this.other(t))[0];
      gk.p.x = goalSide * (PH.halfLength - 0.3); gk.p.z = 0; gk.facing = Math.PI;
      this.startSetPiece('penalty', t, { x: 0, z: 0 });
      this.setPiece.taker.p.x = this.setPiece.spot.x - 1.2; this.setPiece.taker.p.z = 0;
      this.setPiece.shootoutKick = true;
      this.phase = 'setpiece';
    }
    recordShootout(scored) {
      const so = this.shootout; so.kicks[so.turn].push(scored); if (scored) so.score[so.turn]++;
      this.emit('shootout_kick', { team: this.teams[so.turn].id, scored, score: so.score.slice() });
      so.turn = 1 - so.turn;
      this.phase = 'goal'; this.phaseT = 2; // 짧은 대기 후 다음 키커
    }

    updateSetPiece(dt, inputs) {
      const sp = this.setPiece; if (!sp) return;
      const tk = sp.taker;
      tk.v.x = tk.v.z = 0; tk.p.x = lerp(tk.p.x, sp.spot.x - tk.team.side * (sp.type === 'throw_in' ? 0 : 0.6), 0.2);
      if (sp.type === 'throw_in') { tk.p.z = sp.spot.z; tk.facing = Math.atan2(0, 0) + (sp.spot.z > 0 ? -Math.PI / 2 : Math.PI / 2); tk.facing = sp.spot.z > 0 ? Math.PI * 1.5 : Math.PI / 2; }
      Phys.place(this.ball, sp.spot.x, sp.spot.z, sp.type === 'throw_in' ? 2.1 : BR);
      const human = tk.team.controller && tk.team.controlled === tk;
      const wait = sp.type === 'kickoff' ? 1.2 : 1.6;
      if (this.phaseT < wait) return;
      if (human && this.phaseT < wait + 8) return; // 사람 입력 대기 (handleHuman이 실행)
      this.executeSetPiece(null);
    }
    executeSetPiece(cmd) {
      const sp = this.setPiece, tk = sp.taker, t = tk.team;
      this.phase = 'play'; this.setPiece = null;
      if (sp.type !== 'kickoff') this.emit('whistle', { kind: 'restart' });
      else this.emit('whistle', { kind: 'kickoff' });
      const exemptOffside = sp.type === 'throw_in' || sp.type === 'goal_kick' || sp.type === 'corner';
      if (sp.type === 'penalty') { this.penaltyKick = true; this.doShoot(tk, (cmd && cmd.power) || 0.75, cmd && cmd.aimZ, false, true); this.penaltyTimer = 0; this.penaltyShootout = !!sp.shootoutKick; return; }
      if (sp.type === 'throw_in') { const r = this.bestPassTarget(tk, cmd && cmd.dir, 22, false, true) || this.bestPassTarget(tk, null, 40, false, true); this.doThrow(tk, r); return; }
      if (sp.type === 'kickoff') { const r = this.active(t).filter(p => p !== tk).sort((a, b) => d2(a.p, tk.p) - d2(b.p, tk.p))[0]; this.doPass(tk, r, 'ground', true); return; }
      if (sp.type === 'corner') { this.doCross(tk, null, true); return; }
      if (sp.type === 'goal_kick') { const r = this.bestPassTarget(tk, cmd && cmd.dir, 60, true); this.doPass(tk, r, 'lob', true); return; }
      // 프리킥: 가까우면 직접 슈팅
      const dist = Math.abs(this.goalX(t) - sp.spot.x) + Math.abs(sp.spot.z) * 0.4;
      if (cmd && cmd.kind === 'shoot' || (!cmd && dist < 28 && this.R() < 0.7)) { this.doShoot(tk, (cmd && cmd.power) || 0.8, cmd && cmd.aimZ, true); return; }
      const r = this.bestPassTarget(tk, cmd && cmd.dir, 40);
      this.doPass(tk, r, cmd && cmd.kind === 'lob' ? 'lob' : 'ground', exemptOffside);
    }

    // ---------------- 사람 입력 ----------------
    handleHuman(t, inp, dt) {
      if (!inp) return;
      const pl = t.controlled && !t.controlled.sentOff ? t.controlled : null;
      if (!pl || !this.active(t).includes(pl)) { t.controlled = this.nearest(this.active(t).filter(p => !p.gk), this.ball.p); return; }
      // 공 소유자가 우리 팀이면 자동 전환
      if (this.possessor && this.possessor.team === t && this.possessor !== pl && !this.possessor.gk) t.controlled = this.possessor;
      if (inp.switchPressed) {
        const cands = this.active(t).filter(p => p !== t.controlled && !p.gk);
        t.controlled = cands.sort((a, b) => d2(a.p, this.ball.p) - d2(b.p, this.ball.p))[0];
        this.emit('switch', { team: t.id });
      }
      const c = t.controlled; c.humanMove = inp.move; c.humanSprint = inp.sprint;
      const dir = (inp.move.x || inp.move.z) ? inp.move : null;
      // 세트피스 키커
      if ((this.phase === 'setpiece' || this.phase === 'kickoff') && this.setPiece && this.setPiece.taker === c) {
        if (this.phaseT < (this.setPiece.type === 'kickoff' ? 0.5 : 0.8)) return;
        if (inp.shootReleased) this.executeSetPiece({ kind: 'shoot', power: inp.shootPower, aimZ: dir ? dir.z * t.side * -1 : 0, dir });
        else if (inp.passPressed) this.executeSetPiece({ kind: 'pass', dir });
        else if (inp.lobPressed || inp.throughPressed) this.executeSetPiece({ kind: 'lob', dir });
        return;
      }
      if (this.phase !== 'play' || BUSY.has(c.state)) return;
      const hasBall = this.possessor === c;
      const air = this.ball.p.y > 0.7 && d2(c.p, this.ball.p) < 1.6 && !this.possessor;
      if (hasBall) {
        if (inp.shootReleased) this.doShoot(c, inp.shootPower, dir ? -dir.z * t.side : null, inp.curl);
        else if (inp.passPressed) this.doPass(c, this.bestPassTarget(c, dir, 45), 'ground');
        else if (inp.throughPressed) this.doPass(c, this.bestPassTarget(c, dir, 50, true), 'through');
        else if (inp.lobPressed) { const wing = Math.abs(c.p.z) > 18 && this.fxOf(t, c.p.x) > 0.72; if (wing) this.doCross(c, null); else this.doPass(c, this.bestPassTarget(c, dir, 60, true), 'lob'); }
      } else if (air && (inp.shootReleased || inp.passPressed)) {
        this.airStrike(c, inp.shootReleased ? 'shoot' : 'pass', dir);
      } else if (!hasBall) {
        if (inp.passPressed) this.standTackle(c);
        else if (inp.shootPressed && this.possessor && this.possessor.team !== t) this.slideTackle(c);
      }
    }

    // ---------------- 선수 물리/애니메이션 ----------------
    maxSpeed(p, sprint) {
      const top = 6.2 + p.r.speed / 99 * 3.3;
      let s = sprint ? top : top * 0.78;
      if (this.possessor === p) s *= 0.9 + p.r.dribbling / 99 * 0.06;
      if (p.injured) s *= 0.8;
      s *= 0.85 + 0.15 * p.stamina / 100;
      return s;
    }
    tickPlayer(p, dt, human) {
      p.cd = Math.max(0, p.cd - dt);
      if (BUSY.has(p.state)) {
        p.stateT += dt;
        const dur = DUR[p.state] * (p.stateDurMul || 1);
        if (p.state === 'slide') { p.v.x *= Math.exp(-2.2 * dt); p.v.z *= Math.exp(-2.2 * dt); this.slideContact(p); }
        else if (p.state === 'gk_dive') { p.v.x *= Math.exp(-3 * dt); p.v.z *= Math.exp(-3 * dt); this.gkSave(p, true); }
        else { p.v.x *= Math.exp(-6 * dt); p.v.z *= Math.exp(-6 * dt); }
        if (p.stateT >= dur) {
          const next = p.state === 'fall' ? 'getup' : p.state === 'gk_dive' ? 'getup' : p.state === 'slide' ? 'getup' : 'idle';
          p.state = p.state === 'celebrate' ? 'celebrate' : next; p.stateT = 0; p.stateDurMul = next === 'getup' ? 0.6 : 1;
        }
      } else {
        // 목표 속도로 가속
        const des = human ? this.humanDesired(p) : (p.desired || { x: 0, z: 0, sprint: false });
        const len = Math.hypot(des.x, des.z);
        const ms = this.maxSpeed(p, des.sprint);
        const tv = len > 0.05 ? { x: des.x / Math.max(1, len) * ms * Math.min(1, len), z: des.z / Math.max(1, len) * ms * Math.min(1, len) } : { x: 0, z: 0 };
        const acc = 7 + p.r.acceleration / 99 * 9;
        const dvx = tv.x - p.v.x, dvz = tv.z - p.v.z, dl = Math.hypot(dvx, dvz), m = Math.min(dl, acc * dt);
        if (dl > 1e-6) { p.v.x += dvx / dl * m; p.v.z += dvz / dl * m; }
        if (des.sprint && len > 0.5) p.stamina = Math.max(0, p.stamina - dt * (1.2 - p.r.stamina / 120)); else p.stamina = Math.min(100, p.stamina + dt * 0.5);
      }
      p.p.x += p.v.x * dt; p.p.z += p.v.z * dt;
      p.p.x = clamp(p.p.x, -PH.halfLength - 4, PH.halfLength + 4); p.p.z = clamp(p.p.z, -PH.halfWidth - 3, PH.halfWidth + 3);
      const sp = Math.hypot(p.v.x, p.v.z);
      // 방향 회전 (부드럽게)
      if (!BUSY.has(p.state)) {
        let want = p.facing;
        if (sp > 0.6) want = Math.atan2(p.v.z, p.v.x);
        else if (this.ball) want = Math.atan2(this.ball.p.z - p.p.z, this.ball.p.x - p.p.x);
        let dA = ((want - p.facing + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        p.facing += dA * Math.min(1, dt * 10);
        p.state = p.gk && sp < 1.5 && Math.abs(this.ball.p.x - p.p.x) < 35 ? 'gk_ready' : sp < 0.4 ? 'idle' : sp < 2.5 ? 'walk' : 'run';
        if (this.phase === 'fulltime') p.state = p.team === this.winnerTeam() ? 'celebrate' : 'idle';
      }
      const a = p.anim; a.state = p.state; a.speed = sp; a.phase += dt * (2 + sp * 1.25); a.t = Math.min(1, p.stateT / ((DUR[p.state] || 1) * (p.stateDurMul || 1)));
    }
    winnerTeam() { return this.result && this.result.winner ? this.teams.find(t => t.id === this.result.winner) : null; }
    humanDesired(p) {
      const m = p.humanMove || { x: 0, z: 0 };
      return { x: m.x, z: m.z, sprint: !!p.humanSprint };
    }
    setState(p, s, extra) { p.state = s; p.stateT = 0; p.stateDurMul = 1; Object.assign(p.anim, { foot: 'R', power: 0.7, dir: 1, high: false }, extra || {}); }

    separate() { // 몸싸움/충돌: 겹친 선수 밀어내기
      const ps = this.allPlayers();
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j], dx = b.p.x - a.p.x, dz = b.p.z - a.p.z, d = Math.hypot(dx, dz);
        if (d < 0.7 && d > 1e-4) {
          const wa = b.r.physical / (a.r.physical + b.r.physical), push = (0.7 - d);
          a.p.x -= dx / d * push * wa; a.p.z -= dz / d * push * wa; b.p.x += dx / d * push * (1 - wa); b.p.z += dz / d * push * (1 - wa);
          // 볼 소유자와 상대의 몸싸움
          if (this.phase === 'play' && this.possessor && (this.possessor === a || this.possessor === b) && a.team !== b.team) {
            const pos = this.possessor, def = pos === a ? b : a;
            if (this.R() < 0.012 * (def.r.physical - pos.r.physical * 0.8 + 20) / 20) { this.looseBall(pos, 3); this.emit('duel', { winner: def.name }); }
          }
        }
      }
    }

    // ---------------- 볼 소유/드리블 ----------------
    updatePossession(dt) {
      const b = this.ball;
      if (this.possessor) {
        const p = this.possessor;
        if (BUSY.has(p.state) && p.state !== 'tackle') { this.possessor = null; return; }
        // 드리블: 공을 발 앞에 유지 (볼컨트롤이 낮을수록 공이 멀리 튐)
        const ctrl = p.r.ball_control / 99, sp = Math.hypot(p.v.x, p.v.z);
        const lead = 0.45 + (1 - ctrl) * 0.25 + sp * 0.03;
        const tx = p.p.x + Math.cos(p.facing) * lead, tz = p.p.z + Math.sin(p.facing) * lead;
        const k = 10 + ctrl * 8;
        b.v.x = p.v.x + (tx - b.p.x) * k * 0.5; b.v.z = p.v.z + (tz - b.p.z) * k * 0.5; b.v.y = 0; b.p.y = BR;
        b.spin.x = b.spin.z = 0;
        if (d2(p.p, b.p) > 1.6) this.possessor = null;
        return;
      }
      // 소유권 획득
      let best = null, bd = 1e9;
      for (const p of this.allPlayers()) {
        if (p.cd > 0 || (BUSY.has(p.state) && p.state !== 'tackle')) continue;
        const d = d2(p.p, b.p), reach = p.gk && this.inOwnBox(p, b.p) ? 1.1 : 0.75;
        const ballSp = Math.hypot(b.v.x, b.v.z);
        if (d < reach && b.p.y < (p.gk ? 2.3 : 1.0)) {
          // 빠른 공은 볼컨트롤에 따라 튕겨 나갈 수 있음
          if (!p.gk && ballSp > 16 && this.R() > p.r.ball_control / 99 * 0.85) { b.v.x *= -0.3; b.v.z *= -0.3; p.cd = 0.25; continue; }
          if (d < bd) { bd = d; best = p; }
        }
      }
      // 골키퍼 선방 판정 (손으로)
      for (const t of this.teams) { const gk = t.players.find(p => p.gk && !p.sentOff); if (gk && !BUSY.has(gk.state)) this.gkSave(gk, false); }
      if (best && !this.possessor) this.gainPossession(best);
    }
    gainPossession(p) {
      const prev = this.lastTouch;
      // 오프사이드 판정
      if (this.offsideFlags.has(p)) { this.offsideFlags.clear(); this.call('offside', p); return; }
      this.offsideFlags.clear();
      this.possessor = p; this.touch(p);
      if (this.pendingPass) {
        const pp = this.pendingPass;
        if (pp.from.team === p.team && pp.from !== p) { p.team.stats.passesOk++; pp.from.stats.passesOk++; this.lastPasser = pp.from; this.lastPasserTime = this.time; }
        else if (pp.from.team !== p.team) this.emit('interception', { player: p.name, team: p.team.id });
        this.pendingPass = null;
      }
      if (p.gk && this.inOwnBox(p, p.p)) { p.holdT = 0; }
      if (prev && prev.team !== p.team) this.emit('possession_change', { team: p.team.id, player: p.name });
    }
    touch(p) { this.lastTouch = p; if (this.penaltyKick && p !== this.lastKicker) { this.endPenaltyIfShootout(p); if (!this.shootout) this.penaltyKick = false; } }
    looseBall(from, speed) {
      const a = this.R() * Math.PI * 2; this.ball.v.x = Math.cos(a) * speed; this.ball.v.z = Math.sin(a) * speed;
      if (this.possessor === from) this.possessor = null; from.cd = 0.5;
    }
    inOwnBox(p, pos) { const gx = this.ownGoalX(p.team); return Math.abs(pos.x - gx) < 16.5 && Math.abs(pos.z) < 20.16; }
    inBoxOf(t, pos) { const gx = this.ownGoalX(t); return Math.abs(pos.x - gx) < 16.5 && Math.abs(pos.z) < 20.16; }

    stepBall(dt, frozen) {
      if (frozen && this.phase !== 'goal') return;
      const evs = Phys.step(this.ball, dt);
      for (const e of evs) {
        if (e === 'post' || e === 'crossbar') this.emit('woodwork', { kind: e });
        if (e === 'bounce') this.emit('bounce', {});
        if (e === 'net') this.emit('net', {});
        if (this.phase === 'play' && (e === 'goal+x' || e === 'goal-x')) this.goal(e === 'goal+x' ? 1 : -1);
      }
      if (this.penaltyShootout && this.phase === 'play') {
        this.penaltyTimer += dt;
        const b = this.ball, sp = Math.hypot(b.v.x, b.v.z);
        if (this.penaltyTimer > 3 || (this.penaltyTimer > 0.6 && sp < 2) || Math.abs(b.p.x) > PH.halfLength + 0.5 || Math.abs(b.p.z) > PH.halfWidth) { this.penaltyShootout = false; this.penaltyKick = false; this.recordShootout(false); }
      }
    }
    endPenaltyIfShootout(p) {
      if (this.penaltyShootout && p.team !== this.lastKicker.team && p.gk) { this.penaltyShootout = false; this.penaltyKick = false; this.recordShootout(false); this.emit('save', { player: p.name, team: p.team.id }); }
    }
    goal(sideX) {
      // sideX: 공이 들어간 골대가 +x(1) / -x(-1)
      const scoringTeam = this.teams.find(t => t.side === sideX);
      if (this.penaltyShootout || this.shootout) { this.penaltyShootout = false; this.penaltyKick = false; this.recordShootout(true); this.emit('goal_shootout', { team: scoringTeam.id }); return; }
      this.penaltyKick = false;
      scoringTeam.score++;
      let scorer = this.lastTouch;
      // 골키퍼/수비수에 맞고 들어간 슈팅은 슈터의 골로 기록 (자책골 아님)
      if (scorer && scorer.team !== scoringTeam && this.lastShot && this.lastShot.team === scoringTeam && this.time - this.lastShot.time < 4) scorer = this.lastShot.player;
      const own = scorer && scorer.team !== scoringTeam;
      let assist = null;
      if (!own && scorer) { scorer.stats.goals++; if (this.lastPasser && this.lastPasser.team === scoringTeam && this.lastPasser !== scorer && this.time - this.lastPasserTime < 12) { assist = this.lastPasser; assist.stats.assists++; } }
      this.lastGoalAgainst = this.other(scoringTeam).i;
      this.possessor = null; this.phase = 'goal'; this.phaseT = 0;
      this.goals = this.goals || [];
      const rec = { team: scoringTeam.id, scorer: scorer ? scorer.name : '?', scorer_id: scorer ? scorer.data.version_id : null, own, assist: assist ? assist.name : null, minute: this.minute() + 1 };
      this.goals.push(rec);
      if (scorer && !own) { this.setState(scorer, 'celebrate'); }
      this.active(scoringTeam).forEach(p => { if (p !== scorer && !p.gk && this.R() < 0.5) this.setState(p, 'celebrate'); });
      this.emit('goal', rec);
    }
    checkOut() {
      const b = this.ball.p;
      if (Math.abs(b.z) > PH.halfWidth + BR) {
        const lt = this.lastTouch || this.possessor; const team = lt ? this.other(lt.team) : this.teams[0];
        this.emit('out', { kind: 'throw_in' });
        this.startSetPiece('throw_in', team, { x: clamp(b.x, -PH.halfLength + 1, PH.halfLength - 1), z: b.z }); return;
      }
      if (Math.abs(b.x) > PH.halfLength + BR && !(Math.abs(b.z) < PH.goalHalfWidth && b.y < PH.goalHeight)) {
        const lt = this.lastTouch;
        const defending = this.teams.find(t => this.ownGoalX(t) * Math.sign(b.x) > 0);
        if (this.penaltyShootout) return;
        if (lt && lt.team === defending) this.startSetPiece('corner', this.other(defending), { x: b.x, z: b.z });
        else this.startSetPiece('goal_kick', defending, { x: b.x, z: b.z });
      }
    }
    call(kind, p, extra) {
      // 반칙/오프사이드 → 세트피스
      const opp = this.other(p.team);
      if (kind === 'offside') {
        p.team.stats.offsides++;
        this.emit('offside', { player: p.name, team: p.team.id });
        this.startSetPiece('free_kick', opp, { x: p.p.x, z: p.p.z });
      } else if (kind === 'foul') {
        const victim = extra.victim; p.team.stats.fouls++; p.stats.fouls++;
        this.emit('foul', { player: p.name, team: p.team.id, victim: victim.name });
        this.setState(victim, 'fall');
        if (this.R() < 0.06) { victim.injured = true; this.emit('injury', { player: victim.name, team: victim.team.id, sub_possible: this.subsAllowed(victim.team) }); }
        // 카드 (현대 규칙만)
        if (this.rules.cards) {
          const r = this.R();
          if (r < 0.03 || (r < 0.35 && p.yellow === 1)) { this.sendOff(p, p.yellow === 1 ? 'second_yellow' : 'red'); }
          else if (r < 0.35) { p.yellow++; p.team.stats.yellow++; this.emit('card', { color: 'yellow', player: p.name, team: p.team.id }); }
        } else if (this.R() < 0.2) this.emit('referee_warning', { player: p.name });
        const spot = { x: victim.p.x, z: victim.p.z };
        if (this.inBoxOf(p.team, spot)) this.startSetPiece('penalty', opp, spot);
        else this.startSetPiece('free_kick', opp, spot);
      }
    }
    sendOff(p, why) {
      p.sentOff = true; p.team.stats.red++; this.emit('card', { color: 'red', player: p.name, team: p.team.id, why });
      if (p.team.controlled === p) p.team.controlled = null;
      if (this.possessor === p) this.possessor = null;
      p.p.x = 0; p.p.z = PH.halfWidth + 6;
    }
    subsAllowed(t) { return (this.rules.substitutions || 0) > (t.subsUsed || 0) && t.bench.length > 0; }
    substitute(t, outIdx, benchIdx) {
      if (!this.subsAllowed(t)) return { ok: false, reason: t.bench.length === 0 ? 'bench_data_missing' : 'rules_forbid' };
      const out = t.players[outIdx], pd = t.bench.splice(benchIdx, 1)[0];
      t.bench.push(out.data);
      out.data = pd; out.r = pd.ratings; out.name = pd.name_ko; out.injured = false; out.stamina = 100; out.stats = { goals: 0, assists: 0, shots: 0, passes: 0, passesOk: 0, tackles: 0, saves: 0, fouls: 0 };
      t.subsUsed = (t.subsUsed || 0) + 1; this.emit('substitution', { team: t.id, in: pd.name_ko });
      return { ok: true };
    }

    // ---------------- 킥 동작들 ----------------
    flagOffsides(kicker) {
      const t = kicker.team, opp = this.other(t);
      const xs = this.active(opp).map(p => p.p.x * t.side).sort((a, b) => b - a);
      const secondLast = xs[1] !== undefined ? xs[1] : xs[0];
      const ballX = this.ball.p.x * t.side;
      const tol = this.rules.offside.level_is_onside ? 0.25 : -0.25; // 역사 모드: 동일선상도 오프사이드
      for (const p of this.active(t)) {
        if (p === kicker) continue;
        const x = p.p.x * t.side;
        if (x > 0 && x > ballX + tol && x > secondLast + tol) this.offsideFlags.add(p);
      }
    }
    kickFx(p, kind, power) { this.setState(p, kind === 'header' ? 'header' : kind === 'volley' ? 'volley' : kind === 'bicycle' ? 'bicycle' : kind === 'throw' ? 'throw' : 'kick', { power }); }
    release(p, exempt) {
      this.lastKicker = p; if (!exempt) this.flagOffsides(p); else this.offsideFlags.clear();
      this.possessor = null; p.cd = 0.35; this.touch(p);
    }
    bestPassTarget(p, dir, maxDist, forward, noGK) {
      const t = p.team, opp = this.active(this.other(t));
      let best = null, bs = -1e9;
      const fdir = dir && (dir.x || dir.z) ? { x: dir.x, z: dir.z } : { x: Math.cos(p.facing), z: Math.sin(p.facing) };
      const fl = Math.hypot(fdir.x, fdir.z) || 1;
      for (const q of this.active(t)) {
        if (q === p) continue;
        const dx = q.p.x - p.p.x, dz = q.p.z - p.p.z, d = Math.hypot(dx, dz);
        if (d < 3 || d > maxDist || (noGK && q.gk)) continue;
        const align = (dx * fdir.x + dz * fdir.z) / (d * fl);
        // 패스 경로상 상대 선수와의 최소 거리
        let open = 10;
        for (const o of opp) {
          const tt = clamp(((o.p.x - p.p.x) * dx + (o.p.z - p.p.z) * dz) / (d * d), 0, 1);
          open = Math.min(open, Math.hypot(p.p.x + dx * tt - o.p.x, p.p.z + dz * tt - o.p.z));
        }
        const progress = (q.p.x - p.p.x) * t.side;
        const s = align * (dir ? 6 : 1.5) + Math.min(open, 5) * 1.2 + progress * (forward ? 0.25 : 0.1) - d * 0.05 + (q.gk ? -8 : 0) + (this.offsideRisk(q) ? -6 : 0);
        if (s > bs) { bs = s; best = q; }
      }
      return best;
    }
    offsideRisk(q) {
      const t = q.team, xs = this.active(this.other(t)).map(o => o.p.x * t.side).sort((a, b) => b - a);
      const x = q.p.x * t.side; return x > 0 && x > xs[1] && x > this.ball.p.x * t.side;
    }
    doPass(p, target, kind, exempt) {
      const b = this.ball, t = p.team;
      if (!target) target = this.active(t).find(q => q !== p);
      const acc = (p.r.passing / 99);
      let tp = { x: target.p.x, z: target.p.z };
      if (kind === 'through') { tp.x += target.team.side * 7 + target.v.x * 0.8; tp.z += target.v.z * 0.8; }
      else { tp.x += target.v.x * 0.5; tp.z += target.v.z * 0.5; }
      tp.x = clamp(tp.x, -PH.halfLength + 1, PH.halfLength - 1); tp.z = clamp(tp.z, -PH.halfWidth + 1, PH.halfWidth - 1);
      const err = (1 - acc) * 0.12 + (p.injured ? 0.05 : 0);
      const ang = Math.atan2(tp.z - b.p.z, tp.x - b.p.x) + (this.R() - 0.5) * 2 * err;
      const dist = Math.hypot(tp.x - b.p.x, tp.z - b.p.z);
      p.facing = ang;
      if (kind === 'lob' || dist > 32) {
        const v = Phys.loftVelocity(b.p, { x: b.p.x + Math.cos(ang) * dist, z: b.p.z + Math.sin(ang) * dist }, clamp(dist / 18, 0.9, 2.4));
        Object.assign(b.v, v);
      } else {
        const sp = clamp(Phys.groundPassSpeed(dist, kind === 'through' ? 4 : 5), 6, 26);
        b.v.x = Math.cos(ang) * sp; b.v.z = Math.sin(ang) * sp; b.v.y = 0.3;
      }
      b.spin.x = b.spin.y = b.spin.z = 0;
      this.kickFx(p, 'kick', 0.5);
      this.release(p, exempt);
      t.stats.passes++; p.stats.passes++;
      this.pendingPass = { from: p, to: target, time: this.time };
      target.receiving = this.time;
      this.emit('pass', { player: p.name, to: target.name, kind, team: t.id });
    }
    doThrow(p, target) {
      const b = this.ball; target = target || this.active(p.team).find(q => q !== p && !q.gk);
      Phys.place(b, b.p.x, clamp(b.p.z, -PH.halfWidth + 0.2, PH.halfWidth - 0.2), 2.0);
      const v = Phys.loftVelocity(b.p, { x: target.p.x, z: target.p.z, y: 0.4 }, 0.9); Object.assign(b.v, v);
      this.kickFx(p, 'throw'); this.release(p, true);
      this.pendingPass = { from: p, to: target, time: this.time }; p.team.stats.passes++;
      this.emit('throw_in_taken', { player: p.name });
    }
    doCross(p, target, exempt) {
      const t = p.team, gx = this.goalX(t);
      const tz = (this.R() - 0.5) * 10, tx = gx - t.side * (6 + this.R() * 7);
      const b = this.ball;
      const v = Phys.loftVelocity(b.p, { x: tx, z: tz, y: 1.6 }, 1.25 + this.R() * 0.3);
      Object.assign(b.v, v); b.spin.y = (b.p.z > 0 ? 1 : -1) * t.side * 12 * (p.r.passing / 99);
      this.kickFx(p, 'kick', 0.8); this.release(p, exempt);
      t.stats.passes++; p.stats.passes++;
      this.pendingPass = { from: p, to: null, time: this.time };
      this.emit('cross', { player: p.name, team: t.id });
    }
    doShoot(p, power, aimZ, curl, isPenalty) {
      const t = p.team, b = this.ball, gx = this.goalX(t);
      power = clamp(power === undefined ? 0.7 : power, 0.15, 1);
      const dist = Math.hypot(gx - b.p.x, b.p.z);
      const opgk = this.other(t).players.find(q => q.gk && !q.sentOff);
      // 조준: 입력이 없으면 골키퍼 반대편 구석
      let z = aimZ !== null && aimZ !== undefined ? clamp(aimZ, -1, 1) * 3.1 : (opgk && opgk.p.z > 0 ? -1 : 1) * (2.2 + this.R() * 1.0);
      if (aimZ === 0) z = (this.R() - 0.5) * 4;
      const fin = (dist > 22 ? p.r.long_shots : isPenalty ? p.r.penalty : p.r.finishing) / 99;
      const err = (1 - fin) * 0.11 + power * power * 0.05 + (dist > 25 ? 0.03 : 0) + (p.injured ? 0.04 : 0);
      const ty = 0.3 + power * 1.6 + (this.R() - 0.5) * 0.6;
      const ang = Math.atan2(z - b.p.z, gx - b.p.x) + (this.R() - 0.5) * 2 * err;
      const speed = 15 + power * 15 + p.r.shooting * 0.06;
      const tt = dist / speed;
      b.v.x = Math.cos(ang) * speed; b.v.z = Math.sin(ang) * speed;
      b.v.y = clamp((ty - b.p.y + 0.5 * 9.81 * tt * tt) / tt + (this.R() - 0.5) * err * 20, 0, 14);
      b.spin.x = b.spin.z = 0; b.spin.y = curl ? (z > b.p.z ? -1 : 1) * t.side * -18 * (p.r.skill_moves / 99) * (t.side) : 0;
      if (curl) b.spin.y = -Math.sign(z - b.p.z || 1) * Math.sign(gx - b.p.x) * 20 * (0.5 + p.r.free_kick / 200);
      this.kickFx(p, 'kick', power);
      this.release(p, true);
      t.stats.shots++; p.stats.shots++;
      // 유효슈팅 여부 예측
      const pr = Phys.predict(b, Math.min(2, tt + 0.3), 1 / 60);
      this.lastShot = { team: t, player: p, time: this.time, onTarget: Math.abs(pr.z) < PH.goalHalfWidth + 0.5 };
      if (this.lastShot.onTarget) t.stats.onTarget++;
      this.pendingPass = null;
      this.emit('shot', { player: p.name, team: t.id, dist: Math.round(dist), curl: !!curl, long: dist > 22, penalty: !!isPenalty });
    }
    airStrike(p, intent, dir) {
      const b = this.ball, t = p.team, gx = this.goalX(t), y = b.p.y;
      const facingGoal = Math.cos(p.facing) * t.side > 0;
      const near = Math.abs(gx - b.p.x) < 28;
      let kind = y > 1.45 ? 'header' : 'volley';
      if (y > 1.2 && y < 2.3 && !facingGoal && p.r.skill_moves > 70 && near && intent === 'shoot') kind = 'bicycle';
      this.possessor = null;
      if (intent === 'shoot' && near) {
        const stat = kind === 'header' ? p.r.heading : p.r.finishing;
        const z = (this.R() - 0.5) * 5.6, ang = Math.atan2(z - b.p.z, gx - b.p.x) + (this.R() - 0.5) * (1 - stat / 99) * 0.4;
        const sp = kind === 'header' ? 12 + p.r.heading * 0.08 : 20 + p.r.shooting * 0.08;
        b.v.x = Math.cos(ang) * sp; b.v.z = Math.sin(ang) * sp; b.v.y = kind === 'header' ? -1.5 + this.R() * 3 : 1 + this.R() * 2;
        t.stats.shots++; p.stats.shots++;
        const pr = Phys.predict(b, 1.2, 1 / 60); const on = Math.abs(pr.z) < PH.goalHalfWidth; if (on) t.stats.onTarget++;
        this.lastShot = { team: t, player: p, time: this.time, onTarget: on };
        this.emit('shot', { player: p.name, team: t.id, kind });
      } else {
        const tg = this.bestPassTarget(p, dir, 30);
        if (tg) { const ang = Math.atan2(tg.p.z - b.p.z, tg.p.x - b.p.x); b.v.x = Math.cos(ang) * 12; b.v.z = Math.sin(ang) * 12; b.v.y = 2; this.pendingPass = { from: p, to: tg, time: this.time }; t.stats.passes++; }
      }
      this.kickFx(p, kind, 0.8); this.release(p, intent === 'shoot');
      if (kind === 'bicycle') this.emit('bicycle', { player: p.name });
    }

    // ---------------- 태클 ----------------
    standTackle(p) {
      if (p.cd > 0) return;
      this.setState(p, 'tackle'); p.cd = 0.8;
      const c = this.possessor;
      if (c && c.team !== p.team && d2(c.p, p.p) < 1.7) {
        const chance = 0.4 + (p.r.tackling - c.r.dribbling) / 120;
        if (this.R() < chance) { this.looseBall(c, 2.5); p.stats.tackles++; c.cd = 0.8; this.emit('tackle', { player: p.name, team: p.team.id }); }
        else if (this.R() < 0.12) this.call('foul', p, { victim: c });
      }
    }
    slideTackle(p) {
      if (p.cd > 0) return;
      const tgt = this.possessor ? this.possessor.p : this.ball.p;
      const ang = Math.atan2(tgt.z - p.p.z, tgt.x - p.p.x);
      p.facing = ang; this.setState(p, 'slide'); p.cd = 1.5; p.slideHit = false;
      const sp = 7 + p.r.speed * 0.02; p.v.x = Math.cos(ang) * sp; p.v.z = Math.sin(ang) * sp;
      this.emit('slide', { player: p.name, team: p.team.id });
    }
    slideContact(p) {
      if (p.slideHit || this.phase !== 'play') return;
      const foot = { x: p.p.x + Math.cos(p.facing) * 0.9, z: p.p.z + Math.sin(p.facing) * 0.9 };
      const b = this.ball;
      if (d2(foot, b.p) < 0.7 && b.p.y < 0.5) {
        p.slideHit = true;
        const owner = this.possessor; if (owner) { owner.cd = 0.9; this.possessor = null; }
        b.v.x = Math.cos(p.facing) * 6 + (this.R() - 0.5) * 4; b.v.z = Math.sin(p.facing) * 6 + (this.R() - 0.5) * 4;
        this.touch(p); p.stats.tackles++; this.emit('tackle', { player: p.name, team: p.team.id, slide: true });
        return;
      }
      for (const q of this.active(this.other(p.team))) {
        if (BUSY.has(q.state)) continue;
        if (d2(foot, q.p) < 0.6) {
          p.slideHit = true;
          // 공보다 사람을 먼저 건드림 → 반칙 (태클 능력이 높을수록 확률 낮음)
          if (this.R() < 0.85 - p.r.tackling / 200) this.call('foul', p, { victim: q });
          else this.setState(q, 'fall');
          return;
        }
      }
    }

    // ---------------- 골키퍼 ----------------
    gkSave(gk, diving) {
      if (this.phase !== 'play' || this.possessor) return;
      const b = this.ball, sp = Math.hypot(b.v.x, b.v.z, b.v.y);
      if (this.lastTouch === gk && this.time - (gk.lastSaveT || 0) < 0.5) return;
      // 손이 닿는 범위: 다이빙 중이면 몸 전체
      const hx = gk.p.x, hz = gk.p.z + (diving ? gk.anim.dir * 0.6 * Math.min(1, gk.stateT * 3) * (gk.team.side) : 0);
      const reach = diving ? 0.95 + gk.r.goalkeeping / 99 * 0.35 : 0.85;
      const dz = b.p.z - hz, dx = b.p.x - hx, dy = b.p.y - (diving ? (gk.anim.high ? 1.5 : 0.7) : 1.0);
      if (Math.hypot(dx, dz) > reach || Math.abs(dy) > (diving ? 1.1 : 1.5)) return;
      if (!this.inOwnBox(gk, b.p)) return;
      if (this.lastTouch && this.lastTouch.team === gk.team && !diving && sp < 15) return; // 백패스는 일반 소유로
      gk.lastSaveT = this.time;
      const skill = gk.r.goalkeeping / 99;
      const catchP = clamp(skill * 1.05 - sp / 50 - (diving ? 0.2 : 0), 0.05, 0.95);
      const stopP = clamp(0.25 + skill * 0.75 - sp / 80, 0.15, 0.95);
      const shot = this.lastShot && this.time - this.lastShot.time < 3;
      if (this.R() < catchP) {
        Phys.place(b, gk.p.x + gk.team.side * 0.4, gk.p.z, 1.0); this.possessor = gk; this.touch(gk); gk.holdT = 0;
        if (shot) { gk.stats.saves++; gk.team.stats.saves++; this.emit('save', { player: gk.name, team: gk.team.id, kind: 'catch' }); }
        if (!diving) this.setState(gk, 'gk_catch'), gk.state = 'idle';
      } else if (this.R() < stopP / (1 - catchP + 1e-6) * 0.9) {
        // 펀칭/쳐내기
        const out = gk.team.side; b.v.x = Math.abs(b.v.x) * 0.35 * out + out * 3; b.v.z = (this.R() - 0.5) * 14; b.v.y = 3 + this.R() * 4;
        this.touch(gk); gk.cd = 0.6;
        if (!diving) this.setState(gk, 'gk_punch');
        if (shot) { gk.stats.saves++; gk.team.stats.saves++; this.emit('save', { player: gk.name, team: gk.team.id, kind: 'punch' }); }
      } else {
        this.touch(gk); b.v.x *= 0.7; b.v.z *= 0.7; // 손끝 맞고 통과
      }
    }
    gkAI(p, dt) {
      const t = p.team, b = this.ball, gx = this.ownGoalX(t);
      // 공을 잡고 있으면 배급
      if (this.possessor === p) {
        p.holdT += dt; p.desired = { x: 0, z: 0 };
        const human = t.controller && t.controlled === p;
        if (!human && p.holdT > 1.4) {
          const tg = this.bestPassTarget(p, null, 50);
          if (this.R() < 0.5) { this.setState(p, 'gk_roll_throw'); this.doThrowGK(p, tg); }
          else this.doPass(p, tg, 'lob', true);
        }
        return;
      }
      // 페널티킥: 키커가 차는 순간 방향을 예측해 미리 다이빙 (실제처럼 반응이 아닌 '예측')
      if (this.penaltyKick && this.lastShot && this.lastShot.team !== t && this.time - this.lastShot.time < 0.2 && !BUSY.has(p.state) && !p.pkCommitted) {
        p.pkCommitted = true;
        const pr = Phys.predict(b, 0.4, 1 / 60), actual = Math.abs(pr.z) < 0.9 ? 0 : Math.sign(pr.z);
        const read = this.R() < 0.30 + p.r.goalkeeping / 99 * 0.12; // 방향을 읽을 확률
        const guess = read ? actual : [-1, 0, 1][Math.floor(this.R() * 3)];
        if (guess !== 0) { this.setState(p, 'gk_dive', { dir: guess * t.side, high: pr.y > 1.4 }); p.v.z = guess * 5.5; p.v.x = 0; this.emit('dive', { player: p.name }); }
        return;
      }
      if (!this.penaltyKick) p.pkCommitted = false;
      // 슛 방어: 공이 골문으로 오는지 예측
      const toward = (b.v.x * -t.side) > 4;
      const fromOpp = this.lastTouch && this.lastTouch.team !== t; // 우리 팀이 보낸 공에는 다이빙하지 않음
      if (toward && fromOpp && Math.abs(b.p.x - gx) < 35 && !BUSY.has(p.state) && !this.penaltyKick) {
        const tReach = Math.abs((p.p.x - b.p.x) / (b.v.x || 1e-3));
        if (tReach < 1.2 && tReach > 0) {
          const pr = Phys.predict(b, tReach, 1 / 60);
          const dz = pr.z - p.p.z;
          if (Math.abs(pr.z) < PH.goalHalfWidth + 0.6 && pr.y < PH.goalHeight + 0.4) {
            const react = 0.75 + p.r.goalkeeping / 99 * 0.25;
            if (Math.abs(dz) > 0.9 && tReach < 0.55 && this.R() < react) {
              const dir = Math.sign(dz);
              this.setState(p, 'gk_dive', { dir: dir * t.side, high: pr.y > 1.4 });
              const dv = clamp(Math.abs(dz) / Math.max(0.2, tReach), 3, 6.5 + p.r.jumping / 99 * 1.5);
              p.v.z = dir * dv; p.v.x = 0; this.emit('dive', { player: p.name });
              return;
            }
            p.desired = { x: 0, z: clamp(dz * 3, -1, 1), sprint: true };
            return;
          }
        }
      }
      // 일대일: 상대가 박스 안에서 공을 몰고 오면 각도 좁히며 전진
      const c = this.possessor;
      if (c && c.team !== t && this.inOwnBox(p, c.p) && d2(c.p, p.p) < 14 && !this.penaltyKick) {
        const tx = lerp(p.p.x, c.p.x, 0.6), tz = lerp(p.p.z, c.p.z, 0.6);
        p.desired = this.seek(p, { x: tx, z: tz }, true);
        if (d2(c.p, p.p) < 1.8 && this.R() < 0.06) { this.setState(p, 'gk_dive', { dir: 1, high: false }); p.v.x = (c.p.x - p.p.x) * 3; p.v.z = (c.p.z - p.p.z) * 3; }
        return;
      }
      // 느슨한 공이 박스 안이면 처리
      if (!this.possessor && this.inOwnBox(p, b.p) && d2(b.p, p.p) < 9 && Math.hypot(b.v.x, b.v.z) < 9) { p.desired = this.seek(p, b.p, true); return; }
      // 기본 위치: 공과 골문 중앙을 잇는 선 위
      const bd = Math.hypot(b.p.x - gx, b.p.z);
      const off = clamp(bd * 0.08, 0.4, 5.5);
      const a = Math.atan2(b.p.z, b.p.x - gx);
      const tx = gx + Math.cos(a) * off, tz = clamp(Math.sin(a) * off, -PH.goalHalfWidth + 0.4, PH.goalHalfWidth - 0.4);
      if (this.penaltyKick) { p.desired = this.seek(p, { x: gx + t.side * 0.2, z: 0 }, false); return; }
      p.desired = this.seek(p, { x: tx, z: tz }, false, 0.6);
    }
    doThrowGK(p, tg) {
      const b = this.ball; tg = tg || this.active(p.team).find(q => q !== p);
      const d = d2(tg.p, b.p), ang = Math.atan2(tg.p.z - b.p.z, tg.p.x - b.p.x), sp = clamp(Phys.groundPassSpeed(d, 4), 8, 22);
      b.p.y = 0.6; b.v.x = Math.cos(ang) * sp; b.v.z = Math.sin(ang) * sp; b.v.y = 1;
      this.release(p, true); this.pendingPass = { from: p, to: tg, time: this.time }; p.team.stats.passes++;
      this.emit('gk_throw', { player: p.name });
    }

    // ---------------- 필드 플레이어 AI ----------------
    seek(p, tgt, sprint, slow) {
      const dx = tgt.x - p.p.x, dz = tgt.z - p.p.z, d = Math.hypot(dx, dz);
      if (d < 0.25) return { x: 0, z: 0, sprint: false };
      const s = Math.min(1, d / (slow || 2.5));
      return { x: dx / d * s, z: dz / d * s, sprint: sprint && d > 4 };
    }
    nearest(list, pos) { let b = null, bd = 1e9; for (const p of list) { const d = d2(p.p, pos); if (d < bd) { bd = d; b = p; } } return b; }
    bestBy(list, f) { return list.slice().sort((a, b) => f(b) - f(a))[0]; }
    homePos(p) {
      const t = p.team, f = FORMATIONS[t.formation][p.idx], b = this.ball.p;
      const bfx = this.fxOf(t, b.x);
      const attacking = this.possessor && this.possessor.team === t;
      let fx = f[0] + (bfx - 0.5) * 0.5 + MENTALITY[t.mentality] + (attacking ? 0.07 : -0.03);
      if (p.idx <= 2) fx = Math.min(fx, Math.max(0.12, bfx - 0.05));
      // 수비라인(두 번째 마지막 수비수) 넘지 않기 → 오프사이드 회피
      const opp = this.active(this.other(t)).map(o => this.fxOf(t, o.p.x)).sort((a, b) => b - a);
      const line = Math.max(opp[1] || 0.5, bfx);
      fx = clamp(fx, 0.05, Math.min(0.97, line - 0.008));
      const fz = f[1] * 0.92 + (b.z / PH.halfWidth) * 0.22;
      return this.toWorld(t, fx, clamp(fz, -0.97, 0.97));
    }
    ai(p, dt) {
      if (this.phase === 'kickoff' || this.phase === 'setpiece') {
        if (this.setPiece && this.setPiece.taker === p) { p.desired = { x: 0, z: 0 }; return; }
        const keep = this.setPiece && (this.setPiece.type === 'corner' || this.setPiece.type === 'penalty' || this.setPiece.type === 'kickoff');
        if (p.gk) { this.gkAI(p, dt); return; }
        p.desired = keep ? { x: 0, z: 0 } : this.seek(p, this.homePos(p), false, 3);
        // 킥오프: 자기 진영 유지
        if (this.phase === 'kickoff' && (p.p.x + p.desired.x) * p.team.side > -0.2) p.desired.x = Math.min(p.desired.x * p.team.side, 0) * p.team.side;
        return;
      }
      if (this.phase !== 'play') { p.desired = { x: 0, z: 0 }; return; }
      if (p.gk) { this.gkAI(p, dt); return; }
      const t = p.team, b = this.ball;
      if (this.possessor === p) { this.aiWithBall(p, dt); return; }
      const mine = this.possessor && this.possessor.team === t;
      // 공 쫓기: 팀에서 공에 가장 빨리 도달하는 1명(+수비 시 1명 추가 압박)
      const chasers = this.active(t).filter(q => !q.gk && !(t.controller && t.controlled === q)).sort((a, c) => this.arrival(a) - this.arrival(c));
      const human = t.controller ? t.controlled : null;
      const humanChasing = human && this.arrival(human) < this.arrival(chasers[0] || human);
      const isChaser = !mine && (chasers[0] === p && !humanChasing || (!this.possessor && chasers[0] === p) || (this.possessor && !mine && chasers[1] === p && this.fxOf(t, b.p.x) < 0.35));
      const receiving = this.pendingPass && this.pendingPass.to === p && this.time - this.pendingPass.time < 3;
      if (receiving || isChaser) {
        const tt = clamp(d2(p.p, b.p) / 8, 0, 1.2);
        const pr = Phys.predict(b, tt, 1 / 30);
        p.desired = this.seek(p, pr, true, 1);
        // 수비 시 태클 결정
        const c = this.possessor;
        if (c && c.team !== t && d2(c.p, p.p) < 1.6 && p.cd <= 0 && this.R() < dt * (1.5 + p.r.tackling / 60)) this.standTackle(p);
        else if (c && c.team !== t && d2(c.p, p.p) < 3.2 && d2(c.p, p.p) > 1.8 && p.cd <= 0 && this.R() < dt * 0.25 * (p.r.tackling / 99)) this.slideTackle(p);
        // 공중볼 처리 (헤딩/발리)
        if (!this.possessor && b.p.y > 0.8 && b.p.y < 2.6 && d2(p.p, b.p) < 1.1 && p.cd <= 0) {
          const near = Math.abs(this.goalX(t) - b.p.x) < 22;
          this.airStrike(p, near ? 'shoot' : 'pass', null);
        }
        return;
      }
      const hp = this.homePos(p);
      // 공격 시 전방 선수는 공간으로 침투
      if (mine && p.idx >= 6 && this.R() < 0.02) p.runOffset = (this.R() - 0.3) * 8;
      if (mine && p.idx >= 6 && p.runOffset) hp.x += t.side * p.runOffset * 0.6;
      p.desired = this.seek(p, hp, d2(p.p, hp) > 10, 3);
    }
    arrival(p) { return d2(p.p, this.ball.p) / this.maxSpeed(p, true) + (BUSY.has(p.state) ? 1 : 0); }
    aiWithBall(p, dt) {
      const t = p.team, gx = this.goalX(t);
      p.decideT -= dt;
      const opp = this.active(this.other(t));
      const nearestOpp = this.nearest(opp, p.p), pressure = nearestOpp ? d2(nearestOpp.p, p.p) : 99;
      const dist = Math.hypot(gx - p.p.x, p.p.z * 0.8);
      // 드리블 방향: 골문 쪽, 가장 가까운 상대를 피해서
      let dx = gx - p.p.x, dz = -p.p.z * 0.5;
      if (nearestOpp && pressure < 4) { const ax = p.p.x - nearestOpp.p.x, az = p.p.z - nearestOpp.p.z; dx += ax * 2.5 / pressure; dz += az * 3 / pressure; }
      const l = Math.hypot(dx, dz) || 1;
      p.desired = { x: dx / l, z: dz / l, sprint: pressure > 3 && dist > 20 };
      if (p.decideT > 0) return;
      p.decideT = 0.22 + this.R() * 0.2;
      const shootChance = dist < 11 ? 0.6 : dist < 18 ? 0.25 : dist < 28 ? 0.05 * p.r.long_shots / 80 : 0;
      if (this.R() < shootChance && Math.abs(p.p.z) < 20) { this.doShoot(p, dist < 12 ? 0.55 + this.R() * 0.3 : 0.75 + this.R() * 0.25, null, this.R() < 0.3); return; }
      const fx = this.fxOf(t, p.p.x);
      if (fx > 0.8 && Math.abs(p.p.z) > 16 && this.R() < 0.5) { this.doCross(p); return; }
      if (pressure < 2.6 || this.R() < 0.18) {
        const tg = this.bestPassTarget(p, null, 40, this.R() < 0.5);
        if (tg) {
          const far = d2(tg.p, p.p) > 28;
          const kind = far ? 'lob' : (this.fxOf(t, tg.p.x) > 0.62 && this.R() < 0.35 ? 'through' : 'ground');
          this.doPass(p, tg, kind);
        }
      }
    }

    // ---------------- 평점 ----------------
    computeRatings() {
      for (const t of this.teams) for (const p of t.players) {
        const s = p.stats; const conceded = this.other(t).score;
        let r = 6.0 + s.goals * 1.0 + s.assists * 0.6 + s.passesOk * 0.02 + s.tackles * 0.15 + s.saves * 0.35 - s.fouls * 0.1 + (s.shots - s.goals) * 0.02;
        if (p.gk || p.idx <= 2) r -= conceded * 0.25;
        if (t.score > this.other(t).score) r += 0.3;
        if (p.sentOff) r -= 1.5;
        p.rating = Math.round(clamp(r, 3, 10) * 10) / 10;
      }
    }
    summary() {
      return { teams: this.teams.map(t => ({ id: t.id, score: t.score, stats: Object.assign({}, t.stats), players: t.players.map(p => ({ id: p.data.version_id, name: p.name, rating: p.rating, ...p.stats })) })), goals: this.goals || [], result: this.result };
    }
  }

  const api = { Match, FORMATIONS, MENTALITY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WFCMatch = api;
})(typeof window !== 'undefined' ? window : globalThis);
