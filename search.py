target = "src/pages/AdminDashboard.jsx"
with open(target, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f, 1):
        if "activeTab === 'staff'" in line or "activeTab === \"staff\"" in line:
            print(f"{idx}: {line.strip()}")
