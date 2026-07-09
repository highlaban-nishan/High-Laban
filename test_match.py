import re

mapping = {}
with open('d:/ANTI/highlaban/High-Laban/mapping.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line.startswith('"') and '": "' in line:
            parts = line.split('": "')
            key = parts[0][1:]
            val = parts[1][:-2]
            mapping[key] = val

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

count = 0
for k, v in mapping.items():
    if k in content:
        print(f'Match found for {repr(k)}')
        count += 1
print(f'Total matches: {count}')
