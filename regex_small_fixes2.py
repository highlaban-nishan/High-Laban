import re

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacements = [
    (r'[^\x00-\x7F]+\s*\{staff\.assignedOutlet\.replace', '📍 {staff.assignedOutlet.replace'),
    (r'\'[^\x00-\x7F]+\'\s*:\s*`#\$\{i \+ 1\}`', "'🏆' : `#${i + 1}`"),
    (r'[^\x00-\x7F]+\s*Select Outlet to Manage Purchases', '🏪 Select Outlet to Manage Purchases'),
    (r'isMain \? \'[^\x00-\x7F]+\' : \'[^\x00-\x7F]+\'', "isMain ? '🍳' : '🏪'"),
    (r'[^\x00-\x7F]+\s*\$\{group\.label\}', '📍 ${group.label}'),
    (r'[^\x00-\x7F]+\s*Vendor:', '🏪 Vendor:'),
    (r'[^\x00-\x7F]+\s*Select Kitchen Hub', '🏭 Select Kitchen Hub'),
    (r'[^\x00-\x7F]+\s*\{kitchen\.city\}', '📍 {kitchen.city}'),
    (r'>[^\x00-\x7F]+</button>', '>🗑️</button>'),
    (r'[^\x00-\x7F]+\s*Outlet:', '📍 Outlet:'),
    (r'[^\x00-\x7F]+\s*Bank Account Details', '🏦 Bank Account Details'),
    (r'[^\x00-\x7F]+\s*Compliance Documents Download', '📄 Compliance Documents Download'),
    (r'[^\x00-\x7F]+\s*Address Coordinates', '🏡 Address Coordinates'),
]

for pattern, repl in replacements:
    text = re.sub(pattern, repl, text)

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Done smaller replacements!')
