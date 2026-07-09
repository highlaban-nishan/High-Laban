import re

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

imports = "import { FiShoppingBag, FiFileText, FiMapPin, FiUsers, FiBriefcase, FiUserCheck, FiDollarSign, FiTruck, FiShoppingCart, FiPieChart } from 'react-icons/fi';\n"
text = re.sub(r"import SEO from '\.\./components/SEO/SEO';\n", "import SEO from '../components/SEO/SEO';\n" + imports, text)

replacements = {
    r"<span style={{ fontSize: '1\.2rem' }}>🖼️</span> Products": "<FiShoppingBag style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Products",
    r"<span style={{ fontSize: '1\.2rem' }}>🖼️</span> Content": "<FiFileText style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Content",
    r"<span style={{ fontSize: '1\.2rem' }}>🖼️</span> Locations": "<FiMapPin style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Locations",
    r"<span style={{ fontSize: '1\.2rem' }}>🖼️</span> Users": "<FiUsers style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Users",
    r"<span style={{ fontSize: '1\.2rem' }}>🖼️</span> Franchise": "<FiBriefcase style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Franchise",
    r"<span style={{ fontSize: '1\.2rem' }}>🖼️</span> HR Staff": "<FiUserCheck style={{ fontSize: '1.2rem', marginRight: '8px' }} /> HR Staff",
    r"<span style={{ fontSize: '1\.2rem' }}>🖼️</span> Payroll": "<FiDollarSign style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Payroll",
    r"<span style={{ fontSize: '1\.2rem' }}>🖼️</span> Vendors": "<FiTruck style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Vendors",
    r"<span style={{ fontSize: '1\.2rem' }}>🖼️</span> Purchases": "<FiShoppingCart style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Purchases",
    r"<span style={{ fontSize: '1\.2rem' }}>🖼️</span> Food Costing": "<FiPieChart style={{ fontSize: '1.2rem', marginRight: '8px' }} /> Food Costing"
}

for pattern, repl in replacements.items():
    text = re.sub(pattern, repl, text)

with open('d:/ANTI/highlaban/High-Laban/src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Done applying vector icons!')
