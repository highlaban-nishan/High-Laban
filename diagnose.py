import re

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

corrupted = set(re.findall(r'[^\x00-\x7F]+', content))

mapping = {}
with open('d:/ANTI/highlaban/High-Laban/mapping.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line.startswith('"') and '": "' in line:
            parts = line.split('": "')
            key = parts[0][1:]
            val = parts[1][:-2]
            mapping[key] = val

with open('d:/ANTI/highlaban/High-Laban/diagnose.txt', 'w', encoding='utf-8') as f:
    for c in corrupted:
        if c in mapping:
            f.write(f'{repr(c)} is exactly in mapping! Why was it not replaced?\n')
        else:
            found = False
            for k in mapping:
                if k in c:
                    f.write(f'{repr(k)} is a substring of {repr(c)}\n')
                    found = True
                    break
            if not found:
                f.write(f'{repr(c)} is NOT in mapping at all!\n')
