import re
with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix Prep bundle text
text = re.sub(r'\'[^\x00-\x7F]+\s*Edit Prep Sub-Recipe\'', "'✏️ Edit Prep Sub-Recipe'", text)

# Fix Final product text
text = re.sub(r'\'[^\x00-\x7F]+\s*Edit Final Recipe\'', "'✏️ Edit Final Recipe'", text)

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Done fixing other text!')
