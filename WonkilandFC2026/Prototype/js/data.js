// 런타임 데이터 계층: 압축 번들 → 선수 객체, 검색, 포메이션별 선발 구성, 유니폼, 드림팀
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;

  // 포메이션 슬롯 역할 (match.js FORMATIONS 좌표 순서와 1:1)
  const ROLES = {
    '2-3-5': ['GK', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW', 'FW', 'FW'],
    'WM (3-2-2-3)': ['GK', 'DF', 'DF', 'MF', 'DF', 'MF', 'FW', 'MF', 'FW', 'MF', 'FW'],
    '4-4-2': ['GK', 'DF', 'DF', 'DF', 'MF', 'DF', 'MF', 'FW', 'FW', 'MF', 'MF'],
    '4-3-3': ['GK', 'DF', 'DF', 'DF', 'MF', 'DF', 'FW', 'MF', 'FW', 'MF', 'FW'],
    '3-5-2': ['GK', 'DF', 'DF', 'MF', 'DF', 'MF', 'MF', 'FW', 'FW', 'MF', 'MF']
  };
  const ROLE_KO = { GK: '골키퍼', DF: '수비수', MF: '미드필더', FW: '공격수' };
  function eraFormation(year) { return year < 1950 ? '2-3-5' : year < 1966 ? 'WM (3-2-2-3)' : year < 2006 ? '4-4-2' : '4-3-3'; }

  function create(D) {
    const T = D.tuple, RK = D.rating_keys, I = Object.fromEntries(T.map((k, i) => [k, i]));
    const index = {}; // version_id → [squadKey, i]
    for (const [key, sq] of Object.entries(D.squads)) sq.p.forEach((t, i) => { index[t[0]] = [key, i]; });
    const cache = {};

    function expand(t, sq) {
      const ratings = {}; RK.forEach((k, i) => { ratings[k] = t[I.ratings][i]; });
      return {
        version_id: t[I.version_id], person_id: t[I.person_id], name_en: t[I.name_en], name_ko: t[I.name_ko] || null,
        display_name: t[I.name_ko] || t[I.name_en], nationality: sq.team_id, team_name: sq.name_ko || sq.name_en, tournament_year: sq.year,
        position_group: t[I.position_group], shirt_number: t[I.shirt_number] || null, birth_date: t[I.birth_date] || null, age_at_tournament: t[I.age_at_tournament] || null,
        captain: !!t[I.captain], record: { apps: t[I.apps] < 0 ? null : t[I.apps], starts: t[I.starts] < 0 ? null : t[I.starts], goals: t[I.goals], awards: t[I.awards] ? t[I.awards].split('/') : [] },
        ratings, ratings_meta: { estimated: true, basis: sq.ratings_basis }, name_note: t[I.note] || null,
        height_cm: null, weight_kg: null, preferred_foot: null, appearance: {}
      };
    }
    function player(vid) {
      if (cache[vid]) return cache[vid];
      const ix = index[vid]; if (!ix) return null;
      const sq = D.squads[ix[0]];
      return (cache[vid] = expand(sq.p[ix[1]], sq));
    }
    function squad(key) { const sq = D.squads[key]; return sq ? { meta: sq, players: sq.p.map(t => player(t[0])) } : null; }
    function nation(code) { return D.nations[code]; }
    function teamLabel(code, year) { const sq = D.squads[`${code}-${year}`]; const n = sq ? (sq.name_ko || sq.name_en) : code; return year ? `${n} ${year}` : n; }

    // 검색 (전체 10,000명 이상 → 튜플 단계에서 걸러서 상위 N개만 확장)
    function search(o) {
      const q = (o.q || '').trim().toLowerCase(), res = [];
      for (const [key, sq] of Object.entries(D.squads)) {
        if (o.team && sq.team_id !== o.team) continue;
        if (o.year && sq.year !== +o.year) continue;
        for (const t of sq.p) {
          if (o.pos && t[I.position_group] !== o.pos) continue;
          if (q && !(t[I.name_en].toLowerCase().includes(q) || (t[I.name_ko] && t[I.name_ko].includes(q)))) continue;
          res.push(t);
        }
      }
      res.sort((a, b) => b[I.ratings][0] - a[I.ratings][0]);
      const out = [], seen = new Set();
      for (const t of res) { // 같은 인물은 가장 높은 버전만 (onePerPerson 옵션)
        if (o.onePerPerson) { if (seen.has(t[I.person_id])) continue; seen.add(t[I.person_id]); }
        out.push(player(t[0])); if (out.length >= (o.limit || 150)) break;
      }
      return out;
    }

    // 포메이션 슬롯에 맞게 11명 배치. preferred(실제 선발)가 있으면 우선 사용.
    function arrange(pool, formation, preferred) {
      const roles = ROLES[formation] || ROLES['4-4-2'];
      const avail = pool.slice();
      const prefSet = new Set(preferred || []);
      const take = (pred) => {
        let best = -1, bs = -1e9;
        avail.forEach((p, i) => { if (!pred(p)) return; const s = p.ratings.overall + (prefSet.has(p.version_id) ? 1000 : 0); if (s > bs) { bs = s; best = i; } });
        return best >= 0 ? avail.splice(best, 1)[0] : null;
      };
      // 실제 선발 명단이 포메이션 역할 순서와 정확히 일치하면 그 순서를 그대로 사용 (예: 1930 결승 2-3-5)
      if (preferred && preferred.length === 11) {
        const pl = preferred.map(v => avail.find(p => p.version_id === v));
        if (pl.every(Boolean) && pl.every((p, i) => p.position_group === roles[i])) {
          pl.forEach(p => avail.splice(avail.indexOf(p), 1));
          return { xi: pl, bench: avail.sort((a, b) => b.ratings.overall - a.ratings.overall) };
        }
      }
      const xi = roles.map(() => null);
      roles.forEach((r, i) => { xi[i] = take(p => p.position_group === r && (prefSet.size === 0 || prefSet.has(p.version_id))); });
      roles.forEach((r, i) => { if (!xi[i]) xi[i] = take(p => prefSet.has(p.version_id) && (r === 'GK') === (p.position_group === 'GK')); });
      roles.forEach((r, i) => { if (!xi[i]) xi[i] = take(p => p.position_group === r); });
      roles.forEach((r, i) => { if (!xi[i]) xi[i] = take(p => (r === 'GK') === (p.position_group === 'GK')); });
      roles.forEach((r, i) => { if (!xi[i]) xi[i] = take(() => true); });
      const bench = avail.sort((a, b) => b.ratings.overall - a.ratings.overall);
      return { xi, bench };
    }

    // 유니폼 (국가 대표 색상 근사치). which: 'home' | 'away'
    function kit(code, which, year) {
      const n = D.nations[code]; const k = n ? n[which] : { pattern: 'solid', colors: ['#888888'], shorts: '#222222', socks: '#888888' };
      return { kit_id: `kit-${code}-${which}-${(year || 2022) < 1960 ? 'old' : 'new'}`, shirt: { pattern: k.pattern, colors: k.colors }, shorts: { colors: [k.shorts] }, socks: { colors: [k.socks] }, era: year || 2022 };
    }
    function customKit(id, color, shorts) { return { kit_id: `kit-custom-${id}-${color}`, shirt: { pattern: 'solid', colors: [color] }, shorts: { colors: [shorts || '#111111'] }, socks: { colors: [color] }, era: 2022 }; }
    function hexDist(a, b) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); }
    function clash(k1, k2) { return hexDist(k1.shirt.colors[0], k2.shirt.colors[0]) < 120; }

    // 경기용 팀 생성. src: {type:'national', key} | {type:'custom', id, name, ids:[...], kitColor}
    function matchTeam(src, formation) {
      if (src.type === 'national') {
        const s = squad(src.key); const m = s.meta;
        formation = formation || eraFormation(m.year);
        const { xi, bench } = arrange(s.players, formation, m.lineup);
        return { team_id: src.key, code: m.team_id, label: `${m.name_ko || m.name_en} ${m.year}`, short: `${m.fifa_code}'${String(m.year).slice(2)}`, year: m.year, formation,
          players: xi.concat(bench), coaches_ko: m.coaches_ko, lineup_source: m.lineup_source, kitHome: kit(m.team_id, 'home', m.year), kitAway: kit(m.team_id, 'away', m.year) };
      }
      const pool = src.ids.map(player).filter(Boolean);
      formation = formation || src.formation || '4-3-3';
      // 드림팀: 사용자가 정한 순서(슬롯) 그대로 사용, 부족하면 자동 배치
      let xi, bench;
      if (src.slots && src.slots.length === 11 && src.slots.every(Boolean)) { xi = src.slots.map(player); bench = (src.bench || []).map(player).filter(Boolean); }
      else ({ xi, bench } = arrange(pool, formation));
      return { team_id: 'DRM-' + src.id, code: 'DRM', label: src.name || '드림팀', short: (src.name || 'DREAM').slice(0, 6), year: 0, formation, players: xi.concat(bench),
        coaches_ko: null, lineup_source: '사용자 구성', kitHome: customKit(src.id, src.kitColor || '#d4af37', src.kitShorts), kitAway: customKit(src.id + 'b', '#ffffff', '#111111') };
    }
    // 국가별 역대 올스타: 같은 인물은 최고 버전 1개만
    function nationAllStars(code, formation) {
      const pool = search({ team: code, onePerPerson: true, limit: 400 });
      const { xi, bench } = arrange(pool, formation || '4-3-3');
      return { xi, bench: bench.slice(0, 12) };
    }
    return { D, ROLES, ROLE_KO, eraFormation, player, squad, nation, teamLabel, search, arrange, kit, customKit, clash, matchTeam, nationAllStars,
      years: () => Object.keys(D.tournaments).map(Number).sort((a, b) => a - b),
      teamsOf: year => D.tournaments[year].teams.slice().sort((a, b) => (a.name_ko || a.name_en).localeCompare(b.name_ko || b.name_en, 'ko')) };
  }
  const api = { create, ROLES, eraFormation };
  if (isNode) module.exports = api; else root.WFCDataAPI = api;
})(typeof window !== 'undefined' ? window : globalThis);
