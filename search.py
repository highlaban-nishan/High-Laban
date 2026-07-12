target = "src/pages/AdminDashboard.jsx"
with open(target, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx in range(1679, min(1705, len(lines))):
    safe_line = lines[idx].strip().encode('ascii', 'replace').decode('ascii')
    print(f"{idx+1}: {safe_line[:120]}")
