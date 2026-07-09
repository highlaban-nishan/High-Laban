import re
with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the 'Edit Raw Material' header corruption
text = re.sub(r'>[^\x00-\x7F]+\s*Edit Raw Material', '>✏️ Edit Raw Material', text)
text = re.sub(r'>[^\x00-\x7F]+\s*Add New Raw Material', '>➕ Add New Raw Material', text)
text = re.sub(r'\'[^\x00-\x7F]+\s*Edit Raw Material\'', "'✏️ Edit Raw Material'", text)
text = re.sub(r'\'[^\x00-\x7F]+\s*Add New Raw Material\'', "'➕ Add New Raw Material'", text)

# Also fix the conditional rendering on line 6628
text = re.sub(r'\{editingRaw \? \'[^\x00-\x7F]+Edit Raw Material\' : \'[^\x00-\x7F]+Add New Raw Material\'\}', "{editingRaw ? '✏️ Edit Raw Material' : '➕ Add New Raw Material'}", text)
text = re.sub(r'\{editingRaw \? \'[^\x00-\x7F]+\s*Edit Raw Material\' : \'[^\x00-\x7F]+\s*Add New Raw Material\'\}', "{editingRaw ? '✏️ Edit Raw Material' : '➕ Add New Raw Material'}", text)

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Done fixing the text!')
