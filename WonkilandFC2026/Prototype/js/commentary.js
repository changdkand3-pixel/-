// 경기 중계/해설: 경기 이벤트 → 한국어 문장 (텍스트 + 선택적 음성)
(function () {
  'use strict';
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function make(teamName) {
    const T = id => teamName(id);
    return function (e) {
      switch (e.type) {
        case 'whistle': return e.kind === 'kickoff' ? { text: e.half === 1 && e.minute === 0 ? '심판의 휘슬과 함께 경기가 시작됩니다!' : '킥오프!', speak: true } : null;
        case 'period_start': return { text: e.half === 2 ? '후반전이 시작됩니다.' : e.half === 3 ? '연장 전반이 시작됩니다.' : '연장 후반!', speak: true };
        case 'half_time': return { text: '전반전 종료.', speak: true };
        case 'extra_time': return { text: '동점! 연장전으로 갑니다.', speak: true, prio: true };
        case 'added_time': return e.shown ? { text: `추가시간 ${e.mins}분이 주어집니다.` } : null;
        case 'shot': return { text: e.penalty ? `${e.player}, 페널티킥!` : e.kind === 'header' ? `${e.player}의 헤딩슛!` : e.kind === 'bicycle' ? `${e.player}, 오버헤드킥!` : e.kind === 'volley' ? `${e.player}의 발리슛!` : e.curl ? `${e.player}, 감아찹니다!` : e.long ? `${e.player}의 중거리 슈팅!` : pick([`${e.player}, 슈팅!`, `${e.player} 때립니다!`]), speak: true };
        case 'goal': return { text: e.own ? `자책골! ${e.scorer}의 몸에 맞고 들어갑니다. ${T(e.team)} 득점!` : `골! ${T(e.team)}의 ${e.scorer}!${e.assist ? ` (도움 ${e.assist})` : ''} ${e.minute}분`, speak: true, prio: true };
        case 'save': return { text: e.kind === 'punch' ? `${e.player}, 펀칭으로 걷어냅니다!` : `${e.player}의 선방!`, speak: true };
        case 'woodwork': return { text: e.kind === 'crossbar' ? '크로스바를 때립니다!' : '골대 맞고 나옵니다!', speak: true };
        case 'tackle': return Math.random() < 0.5 ? { text: e.slide ? `${e.player}의 슬라이딩 태클!` : `${e.player}, 공을 빼앗습니다.` } : null;
        case 'foul': return { text: `반칙! ${e.player}의 태클에 ${e.victim}가 쓰러집니다.`, speak: true };
        case 'card': return { text: e.color === 'yellow' ? `${e.player}에게 경고 (옐로카드).` : `${e.player} 퇴장! (레드카드)`, speak: true, prio: true };
        case 'referee_warning': return { text: `심판이 ${e.player}에게 구두 경고를 줍니다. (1930년엔 카드 제도가 없었습니다)` };
        case 'offside': return { text: `${e.player}, 오프사이드.`, speak: true };
        case 'injury': return { text: `${e.player} 부상으로 고통을 호소합니다.${e.sub_possible ? '' : ' (교체 불가 — 경기 계속)'}` };
        case 'setpiece': return e.kind === 'corner' ? { text: `${T(e.team)}의 코너킥.` } : e.kind === 'penalty' ? { text: `페널티킥! ${e.player}가 키커로 나섭니다.`, speak: true, prio: true } : e.kind === 'free_kick' ? { text: `${T(e.team)} 프리킥.` } : e.kind === 'goal_kick' ? { text: '골킥.' } : e.kind === 'throw_in' ? { text: `${T(e.team)} 스로인.` } : null;
        case 'cross': return { text: `${e.player}, 크로스!` };
        case 'dive': return null;
        case 'bicycle': return null;
        case 'duel': return Math.random() < 0.4 ? { text: `${e.winner}, 몸싸움에서 이깁니다.` } : null;
        case 'shootout_start': return { text: '승부차기가 시작됩니다!', speak: true, prio: true };
        case 'shootout_kick': return { text: `${T(e.team)} ${e.scored ? '성공!' : '실축!'}  (${e.score[0]} - ${e.score[1]})`, speak: true, prio: true };
        case 'full_time': return { text: e.kind === 'replay_required' ? '경기 종료. 무승부 — 1930년 규정에 따라 재경기가 필요합니다.' : '경기 종료!', speak: true, prio: true };
        case 'substitution': return { text: `${T(e.team)} 선수 교체: ${e.in} 투입.` };
        default: return null;
      }
    };
  }
  window.WFCCommentary = { make };
})();
