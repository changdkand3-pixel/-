#!/usr/bin/env node
// Data/ JSON 원본을 검증한 뒤 Prototype/js/data_bundle.js (압축 형식)로 묶는다.
// 사용법: node Tools/build_data.js    (원본 갱신 시 먼저 node Tools/import_fjelstul.js)
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'Data');

const RATING_KEYS = ['overall', 'speed', 'acceleration', 'shooting', 'finishing', 'long_shots', 'passing',
  'dribbling', 'ball_control', 'skill_moves', 'heading', 'defending', 'tackling', 'physical', 'stamina',
  'jumping', 'free_kick', 'penalty', 'goalkeeping'];
// 번들 선수 튜플 필드 순서 (Prototype/js/data.js와 일치해야 함)
const TUPLE = ['version_id', 'person_id', 'name_en', 'name_ko', 'position_group', 'shirt_number', 'birth_date', 'age_at_tournament', 'captain', 'apps', 'starts', 'goals', 'awards', 'ratings', 'note'];
const VERIFY = new Set(['confirmed', 'needs_citation', 'unknown', 'not_used_in_1930', 'goals_only_confirmed']);
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const listJson = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => path.join(dir, f)) : [];

function validatePlayer(p, where, errors) {
  for (const k of ['version_id', 'person_id', 'name_en', 'nationality', 'tournament_year', 'position_group'])
    if (p[k] === undefined || p[k] === null || p[k] === '') errors.push(`${where}/${p.version_id}: missing ${k}`);
  if (!['GK', 'DF', 'MF', 'FW'].includes(p.position_group)) errors.push(`${where}/${p.version_id}: bad position_group ${p.position_group}`);
  for (const k of RATING_KEYS) {
    const v = p.ratings && p.ratings[k];
    if (!Number.isInteger(v) || v < 1 || v > 99) errors.push(`${where}/${p.version_id}: rating ${k}=${v} must be 1..99`);
  }
  for (const [k, v] of Object.entries(p.verification || {})) if (!VERIFY.has(v)) errors.push(`${where}/${p.version_id}: verification.${k} "${v}"`);
  // 확인되지 않은 값은 비워둬야 함 (임의 생성 금지)
  for (const k of ['height_cm', 'weight_kg', 'preferred_foot']) if (p[k] !== null && p[k] !== undefined) errors.push(`${where}/${p.version_id}: ${k} has value but no source`);
  if (p.verification && p.verification.birth_date === 'unknown' && p.birth_date) errors.push(`${where}/${p.version_id}: birth_date unknown but set`);
}

function build() {
  const errors = [];
  const nations = readJson(path.join(DATA, 'nations', 'nations.json')).nations;
  const rules = {}; listJson(path.join(DATA, 'rules')).forEach(f => { const r = readJson(f); rules[r.id] = r; });
  const stadiums = {}; listJson(path.join(DATA, 'stadiums')).forEach(f => { const s = readJson(f); stadiums[s.stadium_id] = s; });
  const notes = {}; listJson(path.join(DATA, 'curated')).forEach(f => { const j = readJson(f); if (j.schema === 'wfc.match_notes.v1') notes[path.basename(f, '.json')] = j; });
  const squads = {}, ids = new Set(), persons = new Set();
  const playersDir = path.join(DATA, 'players');
  for (const year of fs.readdirSync(playersDir).sort()) {
    for (const f of listJson(path.join(playersDir, year))) {
      const sq = readJson(f), where = `${year}/${path.basename(f)}`;
      if (!nations[sq.team_id]) errors.push(`${where}: nation ${sq.team_id} missing in nations.json`);
      if (sq.players.length < 11) errors.push(`${where}: needs >= 11 players`);
      if (!sq.players.some(p => p.position_group === 'GK')) errors.push(`${where}: no GK`);
      if (!sq.ratings_meta || sq.ratings_meta.estimated !== true) errors.push(`${where}: ratings_meta.estimated must be true`);
      const tuples = [];
      for (const p of sq.players) {
        validatePlayer(p, where, errors);
        if (ids.has(p.version_id)) errors.push(`duplicate version_id ${p.version_id}`);
        ids.add(p.version_id); persons.add(p.person_id);
        tuples.push([p.version_id, p.person_id, p.name_en, p.name_ko || 0, p.position_group, p.shirt_number || 0, p.birth_date || 0, p.age_at_tournament || 0,
          p.captain ? 1 : 0, p.record.apps === null ? -1 : p.record.apps, p.record.starts === null ? -1 : p.record.starts, p.record.goals,
          p.record.awards.join('/'), RATING_KEYS.map(k => p.ratings[k]), p.name_note || 0]);
      }
      if (sq.default_lineup) {
        if (sq.default_lineup.length !== 11) errors.push(`${where}: default_lineup must have 11`);
        sq.default_lineup.forEach(v => { if (!sq.players.some(p => p.version_id === v)) errors.push(`${where}: lineup ${v} not in squad`); });
      }
      squads[`${sq.team_id}-${sq.tournament_year}`] = {
        team_id: sq.team_id, fifa_code: sq.fifa_code, name_en: sq.team_name_en, name_ko: sq.team_name_ko, year: sq.tournament_year, finish: sq.finish,
        coaches_ko: sq.coaches_ko, lineup: sq.default_lineup, lineup_source: sq.default_lineup_source, ratings_basis: sq.ratings_meta.basis, p: tuples
      };
    }
  }
  const tournaments = {};
  for (const f of listJson(path.join(DATA, 'tournaments'))) {
    const t = readJson(f);
    if (!rules[t.rules_profile]) errors.push(`tournament ${t.year}: rules ${t.rules_profile} missing`);
    t.matches.forEach(m => m.goals.forEach(g => { if (g.player && !ids.has(g.player)) errors.push(`${m.match_id}: scorer ${g.player} not in data`); }));
    t.teams.forEach(tm => { if (!squads[`${tm.team_id}-${t.year}`]) errors.push(`tournament ${t.year}: squad ${tm.team_id} missing`); });
    tournaments[t.year] = { year: t.year, host: t.host_country, winner: t.winner, rules_profile: t.rules_profile, teams: t.teams, standings: t.standings, awards: t.awards,
      matches: t.matches.map(m => ({ id: m.match_id, stage: m.stage, group: m.group, date: m.date, stadium: m.stadium, city: m.city, home: m.home, away: m.away, score: m.score, et: m.extra_time, pens: m.penalties, goals: m.goals.map(g => [g.team, g.player, g.name, g.minute, g.own_goal ? 1 : 0, g.penalty ? 1 : 0]) })) };
  }
  const bundle = { generated: new Date().toISOString(), tuple: TUPLE, rating_keys: RATING_KEYS, nations, rules, stadiums, notes, tournaments, squads, host: readJson(path.join(DATA, 'host', 'host_character.json')),
    source: { dataset: 'Fjelstul World Cup Database', license: 'CC-BY-SA 4.0', url: 'https://github.com/jfjelstul/worldcup' } };
  return { errors, bundle, stats: { versions: ids.size, persons: persons.size, squads: Object.keys(squads).length, tournaments: Object.keys(tournaments).length } };
}

if (require.main === module) {
  const { errors, bundle, stats } = build();
  if (errors.length) { console.error(`데이터 검증 실패 (${errors.length}건):\n - ` + errors.slice(0, 40).join('\n - ')); process.exit(1); }
  const out = path.join(ROOT, 'Prototype', 'js', 'data_bundle.js');
  const text = '// 자동 생성 파일 - 직접 수정하지 말 것. Data/*.json 수정 후 node Tools/build_data.js 실행\n// 선수 데이터 출처: Fjelstul World Cup Database (CC-BY-SA 4.0) https://github.com/jfjelstul/worldcup\nwindow.WFC_DATA = ' + JSON.stringify(bundle) + ';\n';
  fs.writeFileSync(out, text);
  console.log(`OK: 대회 ${stats.tournaments}개, 스쿼드 ${stats.squads}개, 선수 버전 ${stats.versions}명 (실제 인물 ${stats.persons}명) → ${path.relative(ROOT, out)} (${(text.length / 1048576).toFixed(1)} MB)`);
}
module.exports = { build, RATING_KEYS, TUPLE };
