import re

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacements = [
    (r'[^\x00-\x7F]+\s*\{city\}', '📍 {city}'),
    (r'[^\x00-\x7F]+\s*\{outlet\.address\}', '📍 {outlet.address}'),
    (r'[^\x00-\x7F]+\s*\{v\.address\}', '📍 {v.address}'),
    (r'[^\x00-\x7F]+\s*\{staff\.assignedOutlet\}', '📍 {staff.assignedOutlet}'),
    (r'[^\x00-\x7F]+\s*\{outlet\.outletName', '🍕 {outlet.outletName'),
    (r'[^\x00-\x7F]+\s*\{vendorObj\.name\}', '🏪 {vendorObj.name}'),
    (r'[^\x00-\x7F]+\s*\{p\.vendorName\}', '🏪 {p.vendorName}'),
    (r'[^\x00-\x7F]+\s*\{p\.category\}', '🏷️ {p.category}'),
    (r'[^\x00-\x7F]+\s*Used in:', '🧠 Used in:'),
    (r'[^\x00-\x7F]+\s*Store Location:', '📍 Store Location:'),
]

for pattern, repl in replacements:
    text = re.sub(pattern, repl, text)

# Stray elements
text = re.sub(r'>[^\x00-\x7F]+</span>', '>🖼️</span>', text)
text = re.sub(r'\'Dairy & Milk\': \'[^\x00-\x7F]+\'', "'Dairy & Milk': '🥛'", text)
text = re.sub(r'\'Eggs\': \'[^\x00-\x7F]+\'', "'Eggs': '🥚'", text)
text = re.sub(r'\'Fruits & Vegetables\': \'[^\x00-\x7F]+\'', "'Fruits & Vegetables': '🍎'", text)
text = re.sub(r'\'Dry Fruits & Nuts\': \'[^\x00-\x7F]+\'', "'Dry Fruits & Nuts': '🥜'", text)
text = re.sub(r'\'Sweeteners & Flavours\': \'[^\x00-\x7F]+\'', "'Sweeteners & Flavours': '🍯'", text)
text = re.sub(r'icon: \'[^\x00-\x7F]+\'', "icon: '🏦'", text)

# Just to make absolutely sure any remaining strings at the start of tags
# e.g., <div className={styles.mapIcon}>ðŸ“ </div>
text = re.sub(r'>[^\x00-\x7F]+</div>', '>📍</div>', text)
text = re.sub(r'>\s*[^\x00-\x7F]+\s*</div>', '>📍</div>', text)

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Done smaller replacements!')
