import re

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Since some emojis might be mapped to the same corrupted sequence (e.g., ðŸ“  can be 📝 or 📍),
# I will use specific context replacement first for the known ones.
fixes_specific = {
    'ðŸ“  Content': '📝 Content',
    'ðŸ“  Locations': '📍 Locations',
    'ðŸ“  Store Location': '📍 Store Location',
    'ðŸ“  {outlet.address}': '📍 {outlet.address}',
    'ðŸ“  {city}': '📍 {city}',
    'ðŸ“  Documents': '📄 Documents',
    'ðŸ“  {v.address}': '📍 {v.address}',
    'ðŸ“  {staff.assignedOutlet}': '📍 {staff.assignedOutlet}',
    'ðŸ› ï¸  Products': '🛍️ Products',
    'ðŸ› ï¸  Online': '🛒 Online',
}

for k, v in fixes_specific.items():
    text = text.replace(k, v)

fixes = {
    'ðŸ› ï¸ ': '🛍️',
    'ðŸ“ ': '📝',
    'ðŸ‘¥': '👥',
    'ðŸ¤ ': '🤝',
    '🧑â€ ðŸ ³': '🧑‍🍳',
    'ðŸ’µ': '💵',
    'ðŸ ª': '🏪',
    'ðŸ›’': '🛒',
    'ðŸ§®': '🧮',
    'ðŸ–¼ï¸ ': '🖼️',
    'ðŸ” ': '🔐',
    'ðŸ—‘ï¸ ': '🗑️',
    'ðŸŒ ': '🌍',
    'ðŸ ¦': '🏦',
    'ðŸ –ï¸ ': '🍔',
    'ðŸ •': '🍕',
    'ðŸ †': '🏆',
    'ðŸ Ž': '🍎',
    'ðŸ ¯': '🍯',
    'ðŸ ³': '🍳',
    'ðŸ ·ï¸ ': '🏷️',
    'ðŸ ¨': '🍲',
    'ðŸ§ ': '🧠',
    'â‚¹': '₹',
    'â†—': '↗',
    'â€”': '—',
    'â€¢': '•',
    'ðŸ“§': '📧',
    'ðŸ“ž': '📞',
    'ðŸ”—': '🔗',
    'ðŸ“¥': '📥',
    'ðŸ’¡': '💡',
    'ðŸ“Š': '📊',
    'âœ‰ï¸ ': '✉️',
    'âœ ï¸ ': '✏️',
    'â Œ': '❌',
}

for k, v in fixes.items():
    text = text.replace(k, v)

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Done manual fixes!')
