import json, re, sys
d = '/tmp/claude-0/-home-user--/5a7f4e02-8167-5b41-9e5e-5931ec1b1330/scratchpad/'
cur = {c['key']: c for c in json.load(open(d + 'cur_full.json'))}
new = json.load(open(d + 'eng51.json'))
bad = 0
def err(*a):
    global bad; bad += 1; print('!!', *a)
for k, x in new.items():
    c = cur[k]
    en = {v[0].lower() for v in c['vocab']}; ko = {v[1] for v in c['vocab']}
    for e, kk in x['v']:
        if e.lower() in en: err(k, 'dup en', e)
        if kk in ko: err(k, 'dup ko', kk, e)
        en.add(e.lower()); ko.add(kk)
    pen = {p['en'] for p in c['patterns']}; pko = {p['ko'] for p in c['patterns']}
    for row in x['p']:
        s, kk, t, w, rule = row
        if len(w) != 3 or t in w or len(set(w)) != 3: err(k, 'wrong opts', s)
        i = s.find(t)
        if i < 0: err(k, 'target missing', s, t)
        else:
            before = s[i-1] if i > 0 else ' '; after = s[i+len(t)] if i+len(t) < len(s) else ' '
            if before.isalpha() or after.isalpha(): err(k, 'target not word-boundary', s, t)
        if s in pen: err(k, 'dup pattern en', s)
        if kk in pko: err(k, 'dup pattern ko', kk)
        pen.add(s); pko.add(kk)
    for r in x['r']:
        p, a, w, ex = r
        if len(w) != 3 or a in w or len(set(w)) != 3: err(k, 'reading opts', p)
    # counts
    V = len(c['vocab']) + len(x['v']); P = len(c['patterns']) + len(x['p']); R = len(c['reading']) + len(x['r']); L = len(c.get('listening') or [])
    allv = c['vocab'] + x['v']
    spell = sum(1 for e, _ in allv if re.fullmatch(r'[A-Za-z]{4,}', e))
    if k.startswith('h'):
        pool = 3 * 0 + V + V + spell + P + R + L
    else:
        pool = V * 2 + spell + V + P * 3 + R
    print(k, 'V', V, 'P', P, 'R', R, 'L', L, 'spell~', spell, 'pool~', pool, '' if pool >= 150 else '<150!')
print('problems', bad)
