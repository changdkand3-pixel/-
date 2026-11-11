"""원기랜드 HTML 안의 큰 그림·음악을 images/, music/ 폴더의 파일로 꺼냅니다.

사용법:  python3 build-tools/split.py 입력.html 출력폴더
결과:    출력폴더/wonkiland.html (작아진 HTML), 출력폴더/images/*, 출력폴더/music/*
같은 그림은 한 파일만 만듭니다. 파일 이름은 내용으로 정해져서, 내용이 같으면 차수가 바뀌어도 이름이 같습니다.
"""
import base64, hashlib, os, re, sys

EXT = {'webp': 'webp', 'png': 'png', 'jpeg': 'jpg', 'jpg': 'jpg', 'gif': 'gif', 'svg+xml': 'svg',
       'mpeg': 'mp3', 'mp3': 'mp3', 'wav': 'wav', 'ogg': 'ogg', 'mp4': 'm4a', 'aac': 'aac'}
MIN_CHARS = 8000  # 이보다 작은 그림(아이콘 등)은 HTML에 그대로 둡니다


def split(src, out_dir, html_name='wonkiland.html'):
    t = open(src, encoding='utf-8').read()
    os.makedirs(os.path.join(out_dir, 'images'), exist_ok=True)
    os.makedirs(os.path.join(out_dir, 'music'), exist_ok=True)
    made = {}
    stats = {'images': [0, 0], 'music': [0, 0]}

    def repl(m):
        kind, sub, data = m.group(1), m.group(2), m.group(3)
        if len(m.group(0)) < MIN_CHARS or sub not in EXT:
            return m.group(0)
        if m.group(0) in made:
            return made[m.group(0)]
        raw = base64.b64decode(data + '=' * (-len(data) % 4))
        folder = 'images' if kind == 'image' else 'music'
        name = hashlib.sha1(raw).hexdigest()[:14] + '.' + EXT[sub]
        path = os.path.join(out_dir, folder, name)
        if not os.path.exists(path):
            open(path, 'wb').write(raw)
            stats[folder][0] += 1
            stats[folder][1] += len(raw)
        made[m.group(0)] = folder + '/' + name
        return made[m.group(0)]

    t2 = re.sub(r'data:(image|audio)/([a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)', repl, t)
    open(os.path.join(out_dir, html_name), 'w', encoding='utf-8').write(t2)
    return len(t.encode()), len(t2.encode()), stats


if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    name = sys.argv[3] if len(sys.argv) > 3 else os.path.basename(src)
    before, after, st = split(src, out, name)
    print('HTML %.1fMB → %.1fMB' % (before / 1e6, after / 1e6))
    print('images %d개 %.1fMB · music %d개 %.1fMB' % (st['images'][0], st['images'][1] / 1e6, st['music'][0], st['music'][1] / 1e6))
