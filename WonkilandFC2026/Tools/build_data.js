#!/usr/bin/env node
// Data/ 폴더의 JSON 원본을 검증한 뒤 Prototype/js/data_bundle.js 로 묶는다.
// (브라우저에서 file:// 로 직접 열 때 fetch가 막히므로 번들 방식 사용)
// 사용법: node Tools/build_data.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'Data');

const RATING_KEYS = ['overall', 'speed', 'acceleration', 'shooting', 'finishing', 'long_shots', 'passing',
  'dribbling', 'ball_control', 'skill_moves', 'heading', 'defending', 'tackling', 'physical', 'stamina',
  'jumping', 'free_kick', 'penalty', 'goalkeeping'];
const VERIFY = new Set(['confirmed', 'needs_citation', 'unknown', 'not_used_in_1930']);

function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8')); }
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.json') ? [path.join(dir, e.name)] : []);
}

function validatePlayer(p, errors) {
  const where = p.version_id || '(no id)';
  for (const k of ['version_id', 'person_id', 'name_ko', 'name_en', 'nationality', 'tournament_year', 'position_group'])
    if (p[k] === undefined || p[k] === '') errors.push(`${where}: missing ${k}`);
  if (!['GK', 'FB', 'HB', 'FW', 'DF', 'MF'].includes(p.position_group)) errors.push(`${where}: bad position_group`);
  for (const k of RATING_KEYS) {
    const v = p.ratings && p.ratings[k];
    if (!Number.isInteger(v) || v < 1 || v > 99) errors.push(`${where}: rating ${k} must be 1..99`);
  }
  if (!p.ratings_meta || typeof p.ratings_meta.estimated !== 'boolean') errors.push(`${where}: ratings_meta.estimated required`);
  for (const [k, v] of Object.entries(p.verification || {}))
    if (!VERIFY.has(v)) errors.push(`${where}: verification.${k} invalid "${v}"`);
  // 확인되지 않은 값은 비워둬야 함
  for (const k of ['birth_date', 'height_cm', 'weight_kg', 'preferred_foot'])
    if (p.verification && p.verification[k] === 'unknown' && p[k] !== null) errors.push(`${where}: ${k} marked unknown but has a value`);
}

function build() {
  const errors = [];
  const files = walk(DATA);
  const all = {};
  for (const f of files) all[path.relative(DATA, f).replace(/\\/g, '/')] = JSON.parse(fs.readFileSync(f, 'utf8'));
  const tournaments = {}; const squads = {}; const kits = {}; const stadiums = {}; const rules = {};
  for (const [rel, j] of Object.entries(all)) {
    if (rel.startsWith('tournaments/')) tournaments[j.year] = j;
    else if (rel.startsWith('players/')) {
      squads[`${j.team_id}-${j.tournament_year}`] = j;
      j.players.forEach(p => validatePlayer(p, errors));
      if (j.players.length < 11) errors.push(`${rel}: needs at least 11 players`);
      if (j.players.filter(p => p.position_group === 'GK').length < 1) errors.push(`${rel}: needs a GK`);
    } else if (rel.startsWith('kits/')) j.kits.forEach(k => { kits[k.kit_id] = k; });
    else if (rel.startsWith('stadiums/')) stadiums[j.stadium_id] = j;
    else if (rel.startsWith('rules/')) rules[j.id] = j;
  }
  const ids = new Set();
  Object.values(squads).forEach(s => s.players.forEach(p => {
    if (ids.has(p.version_id)) errors.push(`duplicate version_id ${p.version_id}`);
    ids.add(p.version_id);
    if (p.kit_ref && !kits[p.kit_ref]) errors.push(`${p.version_id}: kit ${p.kit_ref} not found`);
  }));
  Object.values(tournaments).forEach(t => t.matches.forEach(m => {
    if (!stadiums[m.stadium_id]) errors.push(`${m.match_id}: stadium missing`);
    m.goals.forEach(g => { if (!ids.has(g.player)) errors.push(`${m.match_id}: goal scorer ${g.player} not in data`); });
  }));
  const bundle = { generated: new Date().toISOString(), tournaments, squads, kits, stadiums, rules, host: all['host/host_character.json'] };
  return { errors, bundle };
}

if (require.main === module) {
  const { errors, bundle } = build();
  if (errors.length) { console.error('데이터 검증 실패:\n - ' + errors.join('\n - ')); process.exit(1); }
  const out = path.join(ROOT, 'Prototype', 'js', 'data_bundle.js');
  fs.writeFileSync(out, '// 자동 생성 파일 - 직접 수정하지 말고 Data/*.json 수정 후 node Tools/build_data.js 실행\nwindow.WFC_DATA = ' + JSON.stringify(bundle) + ';\n');
  const n = Object.values(bundle.squads).reduce((a, s) => a + s.players.length, 0);
  console.log(`OK: 선수 버전 ${n}명, 스쿼드 ${Object.keys(bundle.squads).length}개 → ${path.relative(ROOT, out)}`);
}
module.exports = { build, RATING_KEYS };
