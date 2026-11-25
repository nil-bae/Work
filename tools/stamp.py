# 배포 전에 실행: index.html의 src 파일들에 새 번호(?v=)를 붙여서
# 휴대폰이 예전 파일과 새 파일을 섞어 쓰지 않고, 새로 고침 한 번에 전부 최신으로 받게 함.
# 사용: python3 tools/stamp.py   (번호 = 지금 시각)
import re, os, time, json
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(root, 'index.html'); s = open(p, encoding='utf-8').read()
v = time.strftime('%m%d%H%M%S')
mods = sorted(f for f in os.listdir(os.path.join(root, 'src')) if f.endswith('.js'))
imports = {"three": "./vendor/three/three.module.js", "three/addons/": "./vendor/three/addons/"}
for f in mods: imports[f"./src/{f}"] = f"./src/{f}?v={v}"
s = re.sub(r'<script type="importmap">.*?</script>', '<script type="importmap">\n    ' + json.dumps({"imports": imports}, ensure_ascii=False) + '\n  </script>', s, flags=re.S)
s = re.sub(r'href="src/style\.css(\?v=\w+)?"', f'href="src/style.css?v={v}"', s)
s = re.sub(r'<script type="module" src="src/main\.js(\?v=\w+)?"></script>', f'<script type="module" src="./src/main.js?v={v}"></script>', s)
open(p, 'w', encoding='utf-8').write(s)
print('stamped', v, len(mods), 'modules')
