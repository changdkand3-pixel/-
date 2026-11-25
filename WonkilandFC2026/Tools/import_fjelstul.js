#!/usr/bin/env node
// Fjelstul World Cup Database (CC-BY-SA 4.0) → 게임 데이터 변환기
//   입력: Data/sources/fjelstul/*.csv (원본 그대로 보관)
//         Data/curated/**  (사람이 직접 입력한 보정값: 한글 이름, 1930 결승 능력치 등)
//         Data/nations/nations.json
//   출력: Data/players/<연도>/<팀코드>.json, Data/tournaments/<연도>.json
// 사용법: node Tools/import_fjelstul.js
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), DATA = path.join(ROOT, 'Data'), SRC = path.join(DATA, 'sources', 'fjelstul');

// ---------- CSV (RFC 4180) ----------
function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const head = rows.shift();
  return rows.filter(r => r.length === head.length).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const load = f => parseCSV(fs.readFileSync(path.join(SRC, f + '.csv'), 'utf8'));

// ---------- 공통 ----------
const NA = v => v === 'not applicable' || v === 'not available' || v === '' ? null : v;
const ascii = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/g, 'o').replace(/Ø/g, 'O').replace(/ß/g, 'ss').replace(/ł/g, 'l').replace(/đ/g, 'd').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const EAST_ASIAN = new Set(['KOR', 'PRK', 'JPN', 'CHN']);
function displayName(family, given, code) {
  family = NA(family); given = NA(given);
  if (!given) return family; if (!family) return given;
  return EAST_ASIAN.has(code) ? `${family} ${given}` : `${given} ${family}`;
}
function rulesFor(year) {
  if (year <= 1966) return 'historical_1930';
  if (year <= 1978) return 'historical_1970';
  if (year <= 1986) return 'historical_1982';
  if (year <= 1994) return 'historical_1990';
  if (year <= 2018) return 'historical_1998';
  return 'modern';
}

// ---------- 능력치 추정 (공식 기록 아님) ----------
const KEYS = ['overall', 'speed', 'acceleration', 'shooting', 'finishing', 'long_shots', 'passing', 'dribbling', 'ball_control', 'skill_moves', 'heading', 'defending', 'tackling', 'physical', 'stamina', 'jumping', 'free_kick', 'penalty', 'goalkeeping'];
// 포지션별 overall 대비 오프셋
const TEMPLATE = {
  GK: { speed: -22, acceleration: -18, shooting: -50, finishing: -55, long_shots: -55, passing: -25, dribbling: -45, ball_control: -28, skill_moves: -45, heading: -35, defending: -45, tackling: -55, physical: -6, stamina: -10, jumping: 0, free_kick: -55, penalty: -50 },
  DF: { speed: -6, acceleration: -7, shooting: -25, finishing: -30, long_shots: -26, passing: -10, dribbling: -14, ball_control: -8, skill_moves: -20, heading: 0, defending: 3, tackling: 3, physical: 1, stamina: -1, jumping: -2, free_kick: -25, penalty: -22 },
  MF: { speed: -4, acceleration: -3, shooting: -8, finishing: -10, long_shots: -4, passing: 3, dribbling: 0, ball_control: 2, skill_moves: -5, heading: -12, defending: -12, tackling: -12, physical: -6, stamina: 2, jumping: -10, free_kick: -8, penalty: -10 },
  FW: { speed: 0, acceleration: 1, shooting: 2, finishing: 3, long_shots: -4, passing: -6, dribbling: 0, ball_control: 0, skill_moves: -3, heading: -6, defending: -40, tackling: -40, physical: -6, stamina: -4, jumping: -8, free_kick: -12, penalty: -6 }
};
const FINISH_SCORE = { 1: 10, 2: 8, 3: 7, 4: 6.5, QF: 5, R16: 4, R2: 4, GROUP: 2 };
const AWARD_BONUS = { 'Golden Ball': 9, 'Silver Ball': 6, 'Bronze Ball': 4, 'Golden Boot': 5, 'Silver Boot': 3, 'Bronze Boot': 2, 'Golden Glove': 6, 'Best Young Player': 3 };
function estimateRatings(o) {
  // o: {pos, finish, usage(0~1|null), goals, awards[], tournaments, vid}
  const usage = o.usage === null ? 0.55 : o.usage;
  const raw = FINISH_SCORE[o.finish] * 1.1 + usage * 10 + Math.min(o.goals, 8) * 1.6
    + o.awards.reduce((a, w) => a + (AWARD_BONUS[w] || 0), 0) + Math.min(o.tournaments - 1, 3) * 1.2 + (o.prestige || 0);
  const h = hash(o.vid);
  const overall = clamp(Math.round(56 + 38 * (1 - Math.exp(-raw / 22)) + ((h % 5) - 2)), 45, 94);
  const r = { overall };
  const t = TEMPLATE[o.pos] || TEMPLATE.MF;
  KEYS.slice(1).forEach((k, i) => {
    if (k === 'goalkeeping') { r[k] = o.pos === 'GK' ? clamp(overall + 2, 1, 99) : 10 + ((h >> i) % 6); return; }
    const jitter = ((h >> (i % 24)) % 9) - 4;
    let v = overall + (t[k] || 0) + jitter;
    if ((k === 'finishing' || k === 'shooting') && o.pos !== 'GK') v += Math.min(o.goals, 6) * 1.2;
    r[k] = clamp(Math.round(v), 5, 97);
  });
  return r;
}

// ---------- 실행 ----------
function main() {
  const T = load('tournaments').filter(t => /Men's/.test(t.tournament_name));
  const mids = new Set(T.map(t => t.tournament_id));
  const keep = rows => rows.filter(r => mids.has(r.tournament_id));
  const squads = keep(load('squads')), apps = keep(load('player_appearances')), goals = keep(load('goals'));
  const matches = keep(load('matches')), awards = keep(load('award_winners')), standings = keep(load('tournament_standings'));
  const players = Object.fromEntries(load('players').map(p => [p.player_id, p]));
  const stadiums = Object.fromEntries(load('stadiums').map(s => [s.stadium_id, s]));
  const nations = JSON.parse(fs.readFileSync(path.join(DATA, 'nations', 'nations.json'), 'utf8')).nations;
  const curated = loadCurated();

  // 인덱스
  const key = (tid, team, pid) => `${tid}|${team}|${pid}`;
  const appStat = {}, teamMatches = {}, lastMatchStarters = {};
  const matchById = Object.fromEntries(matches.map(m => [m.match_id, m]));
  for (const a of apps) {
    const k = key(a.tournament_id, a.team_code, a.player_id);
    const s = appStat[k] || (appStat[k] = { apps: 0, starts: 0 });
    s.apps++; if (a.starter === '1') s.starts++;
  }
  for (const m of matches) for (const c of [m.home_team_code, m.away_team_code]) {
    const k = `${m.tournament_id}|${c}`; (teamMatches[k] = teamMatches[k] || []).push(m);
  }
  for (const k in teamMatches) teamMatches[k].sort((a, b) => a.match_date.localeCompare(b.match_date) || a.match_id.localeCompare(b.match_id));
  const startersByMatchTeam = {};
  for (const a of apps) if (a.starter === '1') { const k = `${a.match_id}|${a.team_code}`; (startersByMatchTeam[k] = startersByMatchTeam[k] || []).push(a.player_id); }
  const goalCount = {};
  for (const g of goals) if (g.own_goal === '0') { const k = key(g.tournament_id, g.player_team_code, g.player_id); goalCount[k] = (goalCount[k] || 0) + 1; }
  const awardsBy = {};
  for (const a of awards) { const k = `${a.tournament_id}|${a.player_id}`; (awardsBy[k] = awardsBy[k] || []).push(a.award_name); }
  const tournamentsByPerson = {};
  for (const s of squads) (tournamentsByPerson[s.player_id] = tournamentsByPerson[s.player_id] || new Set()).add(s.tournament_id);
  // 경력 전체 월드컵 기록(득점·수상·선발) → 모든 연도 버전에 공통 반영 (부진했던 대회의 스타 선수 보정)
  const career = {};
  for (const g of goals) if (g.own_goal === '0') career[g.player_id] = (career[g.player_id] || 0) + 1.2;
  for (const a of awards) career[a.player_id] = (career[a.player_id] || 0) + (AWARD_BONUS[a.award_name] || 0) * 0.8;
  for (const k in appStat) { const pid = k.split('|')[2]; career[pid] = (career[pid] || 0) + appStat[k].starts * 0.3; }
  const prestigeOf = pid => Math.min(10, (career[pid] || 0) * 0.25);
  const finishOf = {};
  for (const s of standings) finishOf[`${s.tournament_id}|${s.team_code}`] = +s.position;
  const STAGE_RANK = { 'group stage': 'GROUP', 'second group stage': 'R2', 'round of 16': 'R16', 'quarter-finals': 'QF', 'final round': 4, 'semi-finals': 4, 'third-place match': 4, final: 2 };
  function finish(tid, code) {
    if (finishOf[`${tid}|${code}`]) return finishOf[`${tid}|${code}`];
    const ms = teamMatches[`${tid}|${code}`] || []; const last = ms[ms.length - 1];
    const r = last ? STAGE_RANK[last.stage_name] : 'GROUP';
    return r === 4 || r === 2 ? 'QF' : (r || 'GROUP');
  }

  // 기존 생성물 정리 (curated 제외)
  for (const d of ['players', 'tournaments']) fs.rmSync(path.join(DATA, d), { recursive: true, force: true });

  const summary = { tournaments: 0, squads: 0, versions: 0, persons: new Set(), curatedApplied: 0 };
  for (const t of T) {
    const year = +t.year, tid = t.tournament_id;
    const teamCodes = [...new Set(squads.filter(s => s.tournament_id === tid).map(s => s.team_code))].sort();
    const vidByPid = {}; // 이 대회에서 player_id → version_id
    const teamsOut = [];
    for (const code of teamCodes) {
      const rows = squads.filter(s => s.tournament_id === tid && s.team_code === code);
      const teamName = rows[0].team_name, nat = nations[code];
      const used = new Set();
      const tm = teamMatches[`${tid}|${code}`] || [];
      const fin = finish(tid, code);
      const cur = curated[`${code}-${year}`] || null;
      const plist = rows.map(s => {
        const p = players[s.player_id] || {};
        let slug = ascii(NA(s.family_name) || NA(s.given_name) || s.player_id);
        if (used.has(slug)) slug = ascii((NA(s.family_name) || '') + (NA(s.given_name) || '').slice(0, 3));
        while (used.has(slug)) slug += 'X';
        used.add(slug);
        const vid = `${code}-${year}-${slug}`; vidByPid[s.player_id] = vid;
        const st = appStat[key(tid, code, s.player_id)];
        const hasApps = year >= 1970;
        const usage = hasApps ? (tm.length ? (st ? (st.starts + (st.apps - st.starts) * 0.4) / tm.length : 0) : 0) : null;
        const g = goalCount[key(tid, code, s.player_id)] || 0;
        const aw = awardsBy[`${tid}|${s.player_id}`] || [];
        const pos = s.position_code;
        const birth = NA(p.birth_date);
        const age = birth ? ageAt(birth, t.start_date) : null;
        const out = {
          version_id: vid, person_id: s.player_id, name_en: displayName(s.family_name, s.given_name, code), name_ko: null,
          family_name: NA(s.family_name), given_name: NA(s.given_name),
          nationality: code, tournament_year: year, position_group: pos,
          shirt_number: +s.shirt_number > 0 ? +s.shirt_number : null, birth_date: birth, age_at_tournament: age,
          height_cm: null, weight_kg: null, preferred_foot: null, captain: false,
          record: { apps: hasApps ? (st ? st.apps : 0) : null, starts: hasApps ? (st ? st.starts : 0) : null, goals: g, awards: aw },
          ratings: estimateRatings({ pos, finish: fin, usage, goals: g, awards: aw, tournaments: tournamentsByPerson[s.player_id].size, prestige: prestigeOf(s.player_id), vid })
        };
        out.verification = { shirt_number: year < 1950 || out.shirt_number === null ? (year < 1950 ? 'not_used_in_1930' : 'unknown') : 'confirmed', birth_date: birth ? 'confirmed' : 'unknown' };
        if (year < 1950) out.verification.shirt_number = 'not_used_in_1930';
        // 사람이 직접 보정한 값 적용
        const c = cur && cur.players.find(c => matchCurated(c.match, out.family_name, out.given_name, out.version_id));
        if (c) {
          Object.assign(out, { name_ko: c.name_ko || null, captain: !!c.captain, position_role: c.position_role_1930 || null });
          if (c.name_note) out.name_note = c.name_note;
          if (c.ratings) { out.ratings = c.ratings; out.ratings_source = 'curated'; }
          summary.curatedApplied++;
        }
        return out;
      });
      plist.sort((a, b) => ['GK', 'DF', 'MF', 'FW'].indexOf(a.position_group) - ['GK', 'DF', 'MF', 'FW'].indexOf(b.position_group) || b.ratings.overall - a.ratings.overall);
      // 기본 선발: 마지막 경기 선발 11명(1970~), 또는 보정 데이터
      let lineup = null, lineupSource = null;
      const lastM = tm[tm.length - 1];
      const st = lastM && startersByMatchTeam[`${lastM.match_id}|${code}`];
      if (st && st.length === 11) { lineup = st.map(pid => vidByPid[pid]).filter(Boolean); lineupSource = `starting XI of ${lastM.match_id}`; }
      if (cur && cur.lineup) { lineup = cur.lineup.map(m => plist.find(p => matchCurated(m, p.family_name, p.given_name, p.version_id))).filter(Boolean).map(p => p.version_id); lineupSource = cur.lineup_source; }
      const teamOut = {
        schema: 'wfc.squad.v2', team_id: code, fifa_code: nat ? nat.fifa_code : code, team_name_en: teamName,
        team_name_ko: nat && nat.names_ko[teamName] || null, tournament_year: year, finish: fin,
        coaches_ko: cur && cur.coaches_ko || null,
        default_lineup: lineup && lineup.length === 11 ? lineup : null, default_lineup_source: lineup && lineup.length === 11 ? lineupSource : null,
        source: { dataset: 'Fjelstul World Cup Database', license: 'CC-BY-SA 4.0', url: 'https://github.com/jfjelstul/worldcup' },
        field_status: { name: 'confirmed', position_group: 'confirmed', record: year >= 1970 ? 'confirmed' : 'goals_only_confirmed', height_cm: 'unknown', weight_kg: 'unknown', preferred_foot: 'unknown', appearance: 'unknown' },
        ratings_meta: { estimated: true, basis: '실제 기록(출전·득점·팀 성적·수상·대회 경험) 기반 자동 추정치. 공식 능력치 아님.' + (year < 1970 ? ' 1970년 이전은 출전 기록이 없어 출전 비중을 일괄 추정.' : '') },
        players: plist
      };
      writeSquad(path.join(DATA, 'players', String(year), code + '.json'), teamOut);
      const grp = (tm.find(m => m.group_name && m.group_name !== 'not applicable') || {}).group_name || null;
      teamsOut.push({ team_id: code, fifa_code: teamOut.fifa_code, name_en: teamName, name_ko: teamOut.team_name_ko, group: grp, finish: fin });
      summary.squads++; summary.versions += plist.length; plist.forEach(p => summary.persons.add(p.person_id));
    }
    const ms = matches.filter(m => m.tournament_id === tid).sort((a, b) => a.match_date.localeCompare(b.match_date) || a.match_id.localeCompare(b.match_id)).map(m => ({
      match_id: m.match_id, stage: m.stage_name, group: NA(m.group_name), date: m.match_date, stadium: NA(m.stadium_name), city: NA(m.city_name),
      capacity: stadiums[m.stadium_id] ? +stadiums[m.stadium_id].stadium_capacity || null : null,
      home: m.home_team_code, away: m.away_team_code, score: [+m.home_team_score, +m.away_team_score], extra_time: m.extra_time === '1', replay: m.replay === '1',
      penalties: m.penalty_shootout === '1' ? [+m.home_team_score_penalties, +m.away_team_score_penalties] : null,
      goals: goals.filter(g => g.match_id === m.match_id).map(g => ({ team: g.team_code, player: vidByPid[g.player_id] || null, name: displayName(g.family_name, g.given_name, g.player_team_code), minute: g.minute_label, own_goal: g.own_goal === '1', penalty: g.penalty === '1' }))
    }));
    const tourOut = {
      schema: 'wfc.tournament.v2', id: tid, year, name: t.tournament_name, host_country: t.host_country, winner: t.winner, start_date: t.start_date, end_date: t.end_date,
      rules_profile: rulesFor(year), teams: teamsOut,
      standings: standings.filter(s => s.tournament_id === tid).map(s => ({ position: +s.position, team: s.team_code })),
      awards: awards.filter(a => a.tournament_id === tid).map(a => ({ award: a.award_name, player: vidByPid[a.player_id] || null, team: a.team_code })),
      matches: ms, source: { dataset: 'Fjelstul World Cup Database', license: 'CC-BY-SA 4.0' }
    };
    fs.mkdirSync(path.join(DATA, 'tournaments'), { recursive: true });
    fs.writeFileSync(path.join(DATA, 'tournaments', `${year}.json`), JSON.stringify(tourOut, null, 1));
    summary.tournaments++;
  }
  console.log(`대회 ${summary.tournaments}개 · 스쿼드 ${summary.squads}개 · 선수 버전 ${summary.versions}명 · 실제 인물 ${summary.persons.size}명 · 수동 보정 적용 ${summary.curatedApplied}명`);
}
function ageAt(birth, date) {
  const b = new Date(birth), d = new Date(date); let a = d.getFullYear() - b.getFullYear();
  if (d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())) a--; return a;
}
function writeSquad(file, obj) { // 선수 1명 = 1줄 (git diff 가독성 + 용량 절약)
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const { players, ...head } = obj;
  const h = JSON.stringify(head, null, 1).replace(/\n}$/, '');
  fs.writeFileSync(file, h + ',\n "players": [\n' + players.map(p => '  ' + JSON.stringify(p)).join(',\n') + '\n ]\n}\n');
}
function loadCurated() {
  const dir = path.join(DATA, 'curated'), out = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const sq of j.squads || []) {
      const k = `${sq.team_id}-${sq.tournament_year}`;
      if (out[k]) { out[k].players = out[k].players.concat(sq.players); if (sq.lineup) out[k].lineup = sq.lineup; } // 여러 보정 파일 병합
      else out[k] = Object.assign({}, sq);
    }
  }
  return out;
}
// 보정 항목 ↔ 데이터셋 선수 매칭: 성(family) 일치 + (지정 시) 이름(given) 앞부분 일치
function matchCurated(m, family, given, vid) {
  if (m.version_id) return m.version_id === vid; // 편집 모드에서 내보낸 보정값
  if (ascii(m.family) !== ascii(family || given || '')) return false;
  return !m.given || ascii(given || '').startsWith(ascii(m.given));
}
if (require.main === module) main();
module.exports = { parseCSV, estimateRatings, rulesFor };
