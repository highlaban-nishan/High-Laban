import re

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
mapping = {}
with open('d:/ANTI/highlaban/High-Laban/mapping.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line.startswith('"') and '": "' in line:
            parts = line.split('": "')
            key = parts[0][1:]
            val = parts[1][:-2]
            mapping[key] = val

c_in_file = set(re.findall(r'[^\x00-\x7F]+', content))

with open('d:/ANTI/highlaban/High-Laban/hex_out.txt', 'w', encoding='utf-8') as f:
    f.write('First few in file:\n')
    for c in list(c_in_file)[:10]:
        f.write(f"{repr(c)} {[hex(ord(char)) for char in c]}\n")

    f.write('\nFirst few in mapping keys:\n')
    for k in list(mapping.keys())[:10]:
        f.write(f"{repr(k)} {[hex(ord(char)) for char in k]}\n")
