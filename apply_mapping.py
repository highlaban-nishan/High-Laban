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

# Sort keys by length descending
keys_sorted = sorted(mapping.keys(), key=len, reverse=True)

for key in keys_sorted:
    if key in content:
        content = content.replace(key, mapping[key])

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced corrupted symbols!')
