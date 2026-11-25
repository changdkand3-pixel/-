// AI vs AI 전체 경기 헤드리스 시뮬레이션: node Tests/match_sim.test.js
'use strict';
const assert = require('assert');
const { build } = require('../Tools/build_data.js');
const { Match } = require('../Prototype/js/match.js');
const { bundle, errors } = build();
assert.deepStrictEqual(errors, [], '데이터 검증 오류');
const W = require('../Prototype/js/data.js').create(bundle);
const sq = key => { const t = W.matchTeam({ type: 'national', key }); return { team_id: t.team_id, players: t.players, formation: t.formation }; };
const URY = sq('URY-1930'), ARGs = sq('ARG-1930');

function play(seed, rulesId, halfSeconds, knockout) {
  const m = new Match({ homeSquad: URY, awaySquad: ARGs, rules: bundle.rules[rulesId], halfSeconds, seed, knockout });
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
  const m = new Match({ homeSquad: URY, awaySquad: ARGs, rules: bundle.rules.modern, halfSeconds: 60, seed: 3, knockout: true });
  m.phase = 'kickoff'; m.half = 4; m.clockSec = 0; m.teams[0].score = m.teams[1].score = 1;
  let n = 0; while (m.phase !== 'fulltime' && n < 120000) { m.update(1 / 60, null); n++; }
  if (m.teams[0].score === m.teams[1].score) { assert.strictEqual(m.result.kind, 'shootout'); assert(m.result.shootout[0] !== m.result.shootout[1]); console.log('  shootout:', m.result.shootout.join('-')); }
}
// 1930 규칙: 연장 후 무승부 → 재경기
{
  const m = new Match({ homeSquad: URY, awaySquad: ARGs, rules: bundle.rules.historical_1930, halfSeconds: 60, seed: 5, knockout: true });
  m.phase = 'play'; m.half = 4; m.clockSec = m.halfLen() + 100; m.addedSet = true;
  m.update(1 / 60, null);
  if (m.teams[0].score === m.teams[1].score) assert.strictEqual(m.result.kind, 'replay_required');
}
// 교체: 현대 규칙은 후보 선수로 교체 가능, 1930 규칙은 불가
{
  const m = new Match({ homeSquad: URY, awaySquad: ARGs, rules: bundle.rules.modern, halfSeconds: 60, seed: 5 });
  assert.strictEqual(m.substitute(m.teams[0], 5, 0).ok, true);
  const h = new Match({ homeSquad: URY, awaySquad: ARGs, rules: bundle.rules.historical_1930, halfSeconds: 60, seed: 5 });
  assert.strictEqual(h.substitute(h.teams[0], 5, 0).ok, false);
}
console.log(`match_sim: OK (${N} matches, goals ${totalGoals}, shots ${totalShots}, offsides ${offsides})`);
// 오프사이드 판정: 동일선상(level) 처리 차이 - 1930(오프사이드) vs 현대(온사이드)
for (const [rid, expectLevelOffside] of [['historical_1930', true], ['modern', false]]) {
  const m = new Match({ homeSquad: URY, awaySquad: ARGs, rules: bundle.rules[rid], halfSeconds: 60, seed: 9 });
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

// 시대 초월 대전 + 드림팀: 무작위 연도/국가 조합으로 경기 완주
{
  const keys = Object.keys(bundle.squads); let n = 0;
  const R = (i => () => (i = (i * 16807) % 2147483647) / 2147483647)(42);
  for (let k = 0; k < 6; k++) {
    const a = keys[Math.floor(R() * keys.length)], b = keys[Math.floor(R() * keys.length)];
    const A = sq(a), Bq = sq(b); if (A.team_id === Bq.team_id) Bq.team_id += '-B';
    const m = new Match({ homeSquad: A, awaySquad: Bq, rules: bundle.rules.modern, halfSeconds: 60, seed: k + 1, knockout: true, formation: [A.formation, Bq.formation] });
    m.phase = 'kickoff'; let s = 0; while (m.phase !== 'fulltime' && s < 120000) { m.update(1 / 60, null); s++; }
    assert.strictEqual(m.phase, 'fulltime', a + ' vs ' + b); assert(m.result.winner, 'knockout must have winner'); n++;
    console.log(`  cross-era: ${a} ${m.teams[0].score}-${m.teams[1].score} ${b}${m.result.shootout ? ' PK ' + m.result.shootout.join('-') : ''}`);
  }
  const pool = W.search({ onePerPerson: true, limit: 300 });
  const { xi, bench } = W.arrange(pool, '4-3-3');
  assert.strictEqual(xi[0].position_group, 'GK');
  assert.strictEqual(new Set(xi.map(p => p.person_id)).size, 11, '드림팀 중복 인물 없음');
  const dream = W.matchTeam({ type: 'custom', id: 't', name: '테스트 드림팀', slots: xi.map(p => p.version_id), bench: bench.slice(0, 12).map(p => p.version_id), ids: [], formation: '4-3-3' });
  const all = W.nationAllStars('KOR');
  assert.strictEqual(all.xi.length, 11); assert(all.xi.every(p => p.nationality === 'KOR'));
  const m = new Match({ homeSquad: { team_id: dream.team_id, players: dream.players }, awaySquad: sq('BRA-1970'), rules: bundle.rules.modern, halfSeconds: 60, seed: 7, knockout: true, formation: ['4-3-3', '4-4-2'] });
  m.phase = 'kickoff'; let s = 0; while (m.phase !== 'fulltime' && s < 120000) { m.update(1 / 60, null); s++; }
  assert.strictEqual(m.phase, 'fulltime');
  console.log(`  dream team (${xi.map(p => p.name_en.split(' ').pop()).join(', ')}) ${m.teams[0].score}-${m.teams[1].score} BRA-1970`);
  console.log(`  korea all-stars: ${all.xi.map(p => p.name_en + ' ' + p.tournament_year).join(', ')}`);
}
// 데이터 무결성
{
  const t = bundle.tournaments;
  assert.strictEqual(Object.keys(t).length, 22);
  const total = Object.values(bundle.squads).reduce((a, s) => a + s.p.length, 0);
  assert.strictEqual(total, 10973);
  const ury = W.matchTeam({ type: 'national', key: 'URY-1930' });
  assert.deepStrictEqual(ury.players.slice(0, 11).map(p => p.name_en.split(' ').pop()), ['Ballesteros', 'Nasazzi', 'Mascheroni', 'Andrade', 'Fernández', 'Gestido', 'Dorado', 'Scarone', 'Castro', 'Cea', 'Iriarte'], '1930 결승 선발 순서');
  const fin = t[1930].matches.find(m => m.stage === 'final');
  assert.deepStrictEqual(fin.score, [4, 2]); assert.strictEqual(fin.home, 'URY');
  const f22 = t[2022].matches.find(m => m.stage === 'final');
  assert.deepStrictEqual(f22.pens, [4, 2]);
  console.log(`  data: 22 tournaments, ${total} player versions, 1930 final 4-2, 2022 final PK 4-2 ✓`);
}
