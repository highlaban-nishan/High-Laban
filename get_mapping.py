import re

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard_original.jsx', 'r', encoding='utf-8') as f:
    orig = f.read()

words_orig = set(re.findall(r'[^\x00-\x7F]+', orig))

corrupt_to_orig = {}
for w in words_orig:
    try:
        corrupt = w.encode('utf-8').decode('cp1252')
        corrupt_to_orig[corrupt] = w
    except:
        pass
    
    try:
        corrupt = w.encode('utf-8').decode('latin1')
        corrupt_to_orig[corrupt] = w
    except:
        pass

with open('d:/ANTI/highlaban/High-Laban/mapping.txt', 'w', encoding='utf-8') as f:
    for c, o in corrupt_to_orig.items():
        f.write(f'"{c}": "{o}",\n')
