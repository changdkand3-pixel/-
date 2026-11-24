// AI vs AI 전체 경기 헤드리스 시뮬레이션: node Tests/match_sim.test.js
'use strict';
const assert = require('assert');
const { build } = require('../Tools/build_data.js');
const { Match } = require('../Prototype/js/match.js');
const { bundle, errors } = build();
assert.deepStrictEqual(errors, [], '데이터 검증 오류');

function play(seed, rulesId, halfSeconds, knockout) {
  const m = new Match({ homeSquad: bundle.squads['URU-1930'], awaySquad: bundle.squads['ARG-1930'], rules: bundle.rules[rulesId], halfSeconds, seed, knockout });
  const counts = {};
  m.on(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
  m.phase = 'kickoff';
  let steps = 0;
  while (m.phase !== 'fulltime' && steps < 200000) {
    m.update(1 / 60, null); steps++;
    const b = m.ball.p;
    assert(Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.z), 'ball NaN at step ' + steps);
    for (const p of m.allPlayers()) assert(Number.isFinite(p.p.x) && Number.isFinite(p.p.z), 'player NaN ' + p.name);
  }
  return { m, counts, steps };
}

let totalGoals = 0, totalShots = 0, totalPasses = 0, offsides = 0, sp = 0;
const N = 6;
for (let s = 1; s <= N; s++) {
  const { m, counts, steps } = play(s * 7919, s % 2 ? 'historical_1930' : 'modern', 90, true);
  assert.strictEqual(m.phase, 'fulltime', 'match must finish');
  const sum = m.summary();
  const [a, b] = sum.teams;
  totalGoals += a.score + b.score; totalShots += a.stats.shots + b.stats.shots; totalPasses += a.stats.passes + b.stats.passes;
  offsides += counts.offside || 0; sp += counts.setpiece || 0;
  if (m.rules.id === 'historical_1930') { assert(!counts.card, '1930 규칙에는 카드 없음'); assert(m.result.kind !== 'shootout', '1930 규칙에는 승부차기 없음'); }
  sum.teams.forEach(t => t.players.forEach(p => assert(p.rating >= 3 && p.rating <= 10)));
  console.log(`  seed ${s}: ${a.id} ${a.score}-${b.score} ${b.id} (${m.rules.id}, ${m.result.kind}${m.result.shootout ? ' PK ' + m.result.shootout.join('-') : ''}) shots ${a.stats.shots}/${b.stats.shots} passes ${a.stats.passes}/${b.stats.passes} ok ${a.stats.passesOk}/${b.stats.passesOk} setpieces ${counts.setpiece || 0} offside ${counts.offside || 0} fouls ${counts.foul || 0} saves ${counts.save || 0} [${(steps / 60).toFixed(0)}s sim]`);
}
assert(totalShots > N * 4, 'AI가 슈팅을 해야 함: ' + totalShots);
assert(totalPasses > N * 40, 'AI가 패스를 해야 함: ' + totalPasses);
assert(totalGoals > 0, '골이 나와야 함');
assert(sp > 0, '세트피스가 발생해야 함');

// 승부차기 강제 테스트 (현대 규칙)
{
  const m = new Match({ homeSquad: bundle.squads['URU-1930'], awaySquad: bundle.squads['ARG-1930'], rules: bundle.rules.modern, halfSeconds: 60, seed: 3, knockout: true });
  m.phase = 'kickoff'; m.half = 4; m.clockSec = 0; m.teams[0].score = m.teams[1].score = 1;
  let n = 0; while (m.phase !== 'fulltime' && n < 120000) { m.update(1 / 60, null); n++; }
  if (m.teams[0].score === m.teams[1].score) { assert.strictEqual(m.result.kind, 'shootout'); assert(m.result.shootout[0] !== m.result.shootout[1]); console.log('  shootout:', m.result.shootout.join('-')); }
}
// 1930 규칙: 연장 후 무승부 → 재경기
{
  const m = new Match({ homeSquad: bundle.squads['URU-1930'], awaySquad: bundle.squads['ARG-1930'], rules: bundle.rules.historical_1930, halfSeconds: 60, seed: 5, knockout: true });
  m.phase = 'play'; m.half = 4; m.clockSec = m.halfLen() + 100; m.addedSet = true;
  m.update(1 / 60, null);
  if (m.teams[0].score === m.teams[1].score) assert.strictEqual(m.result.kind, 'replay_required');
}
// 교체: 1930 규칙은 불가, 현대 규칙도 벤치 데이터가 없으면 불가
{
  const m = new Match({ homeSquad: bundle.squads['URU-1930'], awaySquad: bundle.squads['ARG-1930'], rules: bundle.rules.modern, halfSeconds: 60, seed: 5 });
  assert.strictEqual(m.substitute(m.teams[0], 5, 0).reason, 'bench_data_missing');
}
console.log(`match_sim: OK (${N} matches, goals ${totalGoals}, shots ${totalShots}, offsides ${offsides})`);
// 오프사이드 판정: 동일선상(level) 처리 차이 - 1930(오프사이드) vs 현대(온사이드)
for (const [rid, expectLevelOffside] of [['historical_1930', true], ['modern', false]]) {
  const m = new Match({ homeSquad: bundle.squads['URU-1930'], awaySquad: bundle.squads['ARG-1930'], rules: bundle.rules[rid], halfSeconds: 60, seed: 9 });
  m.phase = 'play';
  const uru = m.teams[0], arg = m.teams[1]; // URU 전반 +x 공격
  arg.players.forEach((p, i) => { p.p.x = -10; p.p.z = i - 5; });
  arg.players[0].p.x = 50; arg.players[1].p.x = 30; arg.players[1].p.z = 5; // GK + 두 번째 마지막 수비수 x=30
  const kicker = uru.players[4]; kicker.p.x = 10; kicker.p.z = 0; m.ball.p.x = 10.5; m.ball.p.z = 0;
  const level = uru.players[8]; level.p.x = 30; level.p.z = -5;   // 동일선상
  const ahead = uru.players[6]; ahead.p.x = 35; ahead.p.z = -12;  // 명백한 오프사이드
  const behind = uru.players[7]; behind.p.x = 20; behind.p.z = 10; // 온사이드
  m.flagOffsides(kicker);
  assert(m.offsideFlags.has(ahead), rid + ': ahead must be offside');
  assert(!m.offsideFlags.has(behind), rid + ': behind must be onside');
  assert.strictEqual(m.offsideFlags.has(level), expectLevelOffside, rid + ': level handling');
  // 오프사이드 위치 선수가 공을 받으면 상대 프리킥
  m.gainPossession(ahead);
  assert.strictEqual(m.phase, 'setpiece'); assert.strictEqual(m.setPiece.team, arg); assert.strictEqual(m.setPiece.type, 'free_kick');
  console.log(`  offside rule ${rid}: level=${expectLevelOffside ? 'offside' : 'onside'} ✓`);
}
