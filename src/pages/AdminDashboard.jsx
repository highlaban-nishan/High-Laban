import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Container from '../components/UI/Container';
import db from '../utils/db';

import ImageCropper from '../components/UI/ImageCropper';
import { uploadMedia } from '../utils/storage';
import SalesChart from '../components/Dashboard/SalesChart';
import POS from '../components/Dashboard/POS';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [stats, setStats] = useState({
        totalOrders: { value: '0', change: '0%' },
        totalRevenue: { value: '₹0', change: '0%' },
        activeUsers: { value: '0', change: '0%' },
        pendingReview: { value: '0', change: '0%' }
    });
    const [newProduct, setNewProduct] = useState({ name: '', flavor: '', img: '' });

    // Edit Modal State
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);

    // Header Dropdown State
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Cropper State
    const [croppingImage, setCroppingImage] = useState(null);
    const [cropTarget, setCropTarget] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // const [isSimulating, setIsSimulating] = useState(false); // Removed simulation

    // Helper to fetch data
    const refreshData = async () => {
        if (activeTab === 'dashboard') {
            const ords = await db.getOrders();
            setOrders(ords);
            const sts = await db.getStats();
            setStats(sts);
        } else if (activeTab === 'products') {
            const prods = await db.getProducts();
            setProducts(prods);
        } else if (activeTab === 'customers') {
            const custs = await db.getCustomers();
            setCustomers(custs);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 3000);
        return () => clearInterval(interval);
    }, [activeTab]);

    const handleResetData = async () => {
        if (window.confirm("Are you sure you want to RESET all data? This will clear all orders and revenue.")) {
            await db.resetOrders();
            refreshData();
            alert("All sales data has been reset to 0.");
        }
    };

    const handleLogout = () => {
        db.logout();
        window.location.href = '/login'; // Or navigate logic if using router hook
    };

    // ... (rest of product handlers remain same) ...
    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.img) {
            alert('Please select and crop an image for the product.');
            return;
        }
        try {
            await db.addProduct(newProduct);
            setNewProduct({ name: '', flavor: '', img: '' });
            alert('Product added successfully!');
            refreshData();
        } catch (error) {
            console.error(error);
            alert('Error adding product');
        }
    };

    const handleProductClick = (product, index) => {
        setEditingIndex(product.id); // Use ID for Cloud
        setEditingProduct({ ...product });
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        try {
            await db.updateProduct(editingProduct.id, editingProduct); // Use ID
            setEditingProduct(null);
            setEditingIndex(null);
            refreshData();
        } catch (error) {
            console.error(error);
            alert('Error updating product');
        }
    };

    const handleDeleteProduct = async () => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await db.deleteProduct(editingProduct.id); // Use ID
                setEditingProduct(null);
                setEditingIndex(null);
                refreshData();
            } catch (error) {
                console.error(error);
                alert('Error deleting product');
            }
        }
    };

    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileUpload = async (e, target) => {
        const file = e.target.files[0];
        if (!file) return;

        const isVideo = file.type.startsWith('video/');

        if (isVideo) {
            // Upload Video Immediately
            setIsUploading(true);
            try {
                const url = await uploadMedia(file);
                if (target === 'new') setNewProduct({ ...newProduct, img: url });
                else if (target === 'edit') setEditingProduct({ ...editingProduct, img: url });
            } catch (e) {
                alert(e.message);
            } finally {
                setIsUploading(false);
            }
        } else {
            // Processing Image for Cropper
            try {
                const base64 = await convertFileToBase64(file);
                setCroppingImage(base64);
                setCropTarget(target);
            } catch (error) {
                console.error("Error converting file:", error);
                alert("Error reading file");
            }
        }
        e.target.value = null; // Reset input
    };

    const handleCropComplete = async (croppedImage) => {
        setIsUploading(true);
        try {
            // uploadMedia handles base64 too via fallback if configured, but storage.js expects File object or logic adjustment
            // Our storage.js 'uploadMedia' expects a FILE object for Firebase, or handles Base64 internally?
            // Actually storage.js handles FILE.
            // But croppedImage is Base64.
            // We need to convert Base64 to Blob/File to upload to Firebase Storage perfectly.

            const res = await fetch(croppedImage);
            const blob = await res.blob();
            const file = new File([blob], "product_image.jpg", { type: "image/jpeg" });

            const imageUrl = await uploadMedia(file);

            if (cropTarget === 'new') {
                setNewProduct({ ...newProduct, img: imageUrl });
            } else if (cropTarget === 'edit') {
                setEditingProduct({ ...editingProduct, img: imageUrl });
            }
        } catch (error) {
            alert('Failed to upload image. Please try again.');
            console.error(error);
        } finally {
            setIsUploading(false);
            setCroppingImage(null);
            setCropTarget(null);
        }
    };

    const handleCropCancel = () => {
        setCroppingImage(null);
        setCropTarget(null);
    };

    // Mobile Menu State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close sidebar when route changes or on mobile selection
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ... (keep existing helper functions like handleLogout, etc.)

    return (
        <div className="admin-container" style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }} onClick={() => setShowUserMenu(false)}>
            <style>{`
                /* Print Styles */
                @media print {
                    aside, header, .no-print { display: none !important; }
                    main { padding: 0 !important; }
                }

                /* Mobile Responsive Styles */
                @media (max-width: 768px) {
                    .admin-sidebar {
                        position: fixed;
                        top: 0;
                        left: 0;
                        height: 100vh;
                        z-index: 1000;
                        transform: translateX(-100%);
                        transition: transform 0.3s ease-in-out;
                    }
                    .admin-sidebar.open {
                        transform: translateX(0);
                    }
                    .sidebar-overlay {
                        display: block;
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: rgba(0,0,0,0.5);
                        z-index: 999;
                    }
                    .mobile-menu-btn {
                        display: block !important;
                    }
                    main {
                        padding: 1rem !important;
                    }
                }
                
                @media (min-width: 769px) {
                    .sidebar-overlay { display: none; }
                    .mobile-menu-btn { display: none !important; }
                    .hide-on-mobile { display: inline-block; }
                }

                @media (max-width: 768px) {
                    .hide-on-mobile { display: none !important; }
                }
            `}</style>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside
                className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}
                style={{
                    width: '260px',
                    background: 'var(--color-bg-dark)',
                    borderRight: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '2rem 1rem',
                    flexShrink: 0  // Prevent shrinking
                }}
            >
                <div style={{ marginBottom: '3rem', paddingLeft: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', margin: 0 }}>High Laban</h2>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Admin Panel</span>
                        {!import.meta.env.VITE_FIREBASE_API_KEY && (
                            <div style={{
                                marginTop: '10px',
                                background: '#dc2626',
                                color: 'white',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                ⚠️ OFFLINE MODE <br />
                                (Missing Config)
                            </div>
                        )}
                    </div>
                    {/* Close button for mobile */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        &times;
                    </button>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <NavItem active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}>Dashboard</NavItem>
                    <NavItem active={activeTab === 'pos'} onClick={() => { setActiveTab('pos'); setIsSidebarOpen(false); }}>POS System</NavItem>
                    <NavItem active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}>Products</NavItem>
                    {/* <NavItem>Orders</NavItem> */}
                    <NavItem active={activeTab === 'customers'} onClick={() => { setActiveTab('customers'); setIsSidebarOpen(false); }}>Customers</NavItem>
                    <NavItem>Settings</NavItem>
                </nav>

                <div style={{ marginTop: 'auto', paddingLeft: '1rem' }}>
                    <Link to="/" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>&larr; Back to Website</Link>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem' }}>
                <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Mobile Menu Toggle */}
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsSidebarOpen(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                padding: '0',
                                display: 'none', // Hidden by default, shown via CSS
                                marginRight: '0.5rem'
                            }}
                        >
                            ☰
                        </button>

                        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: 'clamp(1.2rem, 4vw, 2rem)' }}>
                            {activeTab === 'pos' ? 'POS' :
                                activeTab === 'customers' ? 'Customers' :
                                    activeTab === 'products' ? 'Products' :
                                        'Dashboard'}
                        </h1>
                        {activeTab === 'dashboard' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleResetData(); }}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    background: '#ef4444',
                                    color: 'white',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    whiteSpace: 'nowrap'
                                }}
                                title="Reset Data"
                            >
                                <span style={{ fontSize: '1.2rem' }}>↻</span>
                                <span className="hide-on-mobile">Reset All</span>
                            </button>
                        )}
                    </div>

                    <div
                        style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
                        onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                    >
                        <span className="hide-on-mobile" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Admin User</span>
                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>A</div>

                        {/* User Dropdown */}
                        {showUserMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '10px',
                                background: 'white',
                                border: '1px solid #eee',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                width: '150px',
                                overflow: 'hidden',
                                zIndex: 100
                            }}>
                                <div
                                    onClick={handleLogout}
                                    style={{ padding: '10px 15px', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                    onMouseLeave={(e) => e.target.style.background = 'white'}
                                >
                                    <span>🚪</span> Logout
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <>
                        {/* Stats Grid - Adjusted for Mobile 2-Column */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <StatCard title="Total Orders" value={stats.totalOrders.value} change={stats.totalOrders.change} />
                            <StatCard title="Total Revenue" value={stats.totalRevenue.value} change={stats.totalRevenue.change} />
                            <StatCard title="Active Users" value={stats.activeUsers.value} change={stats.activeUsers.change} />
                            <StatCard title="Pending Review" value={stats.pendingReview.value} change={stats.pendingReview.change} />
                        </div>

                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '3rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Revenue Overview</h3>
                            <SalesChart orders={orders} />
                        </div>

                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Recent Orders</h3>
                            <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflowX: 'auto' }}>
                                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: '#f9fafb' }}>
                                        <tr>
                                            <th style={thStyle}>Order ID</th>
                                            <th style={thStyle}>Customer</th>
                                            <th style={thStyle}>Date</th>
                                            <th style={thStyle}>Status</th>
                                            <th style={thStyle}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order, index) => (
                                            <tr key={index} style={trStyle}>
                                                <td style={tdStyle}>{order.id}</td>
                                                <td style={tdStyle}>{order.customer}</td>
                                                <td style={tdStyle}>{order.date}</td>
                                                <td style={tdStyle}>
                                                    <span style={badgeStyle(order.status)}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                                                </td>
                                                <td style={tdStyle}>{'₹' + order.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'pos' && (
                    <POS />
                )}

                {activeTab === 'customers' && (
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Registered Customers</h3>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                Total: {customers.length}
                            </div>
                        </div>

                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f9fafb' }}>
                                    <tr>
                                        <th style={thStyle}>Customer ID</th>
                                        <th style={thStyle}>Name</th>
                                        <th style={thStyle}>Phone Number</th>
                                        <th style={thStyle}>Last Active</th>
                                        <th style={thStyle}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                                                No customers found. Make a sale in POS to add one!
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.map((c, index) => (
                                            <tr key={index} style={trStyle}>
                                                <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 'bold', color: '#666' }}>
                                                    {c.id || 'CUST-NEW'}
                                                </td>
                                                <td style={{ ...tdStyle, fontWeight: '500' }}>{c.name}</td>
                                                <td style={tdStyle}>{c.phone}</td>
                                                <td style={tdStyle}>{c.lastOrder ? new Date(c.lastOrder).toLocaleDateString() : 'N/A'}</td>
                                                <td style={tdStyle}>
                                                    <button style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>View History</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        {/* ... (product tab content remains same) ... */}
                        {/* Add Product Form */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', height: 'fit-content' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Add New Product</h3>
                            <form onSubmit={handleAddProduct}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Product Name</label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        required
                                        style={inputStyle}
                                        placeholder="e.g. Delicious Cake"
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Flavor</label>
                                    <input
                                        type="text"
                                        value={newProduct.flavor}
                                        onChange={(e) => setNewProduct({ ...newProduct, flavor: e.target.value })}
                                        required
                                        style={inputStyle}
                                        placeholder="e.g. Chocolate"
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Product Media (Image or Video)</label>
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={(e) => handleFileUpload(e, 'new')}
                                        style={inputStyle}
                                    />
                                    {isUploading ? (
                                        <div style={{ marginTop: '0.8rem', color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>Uploading media... ⏳</div>
                                    ) : newProduct.img ? (
                                        <div style={{ marginTop: '0.8rem', position: 'relative', width: 'fit-content' }}>
                                            {/* Simple check for video extensions or if URL has 'video' (robustness improvement needed later maybe) */}
                                            {newProduct.img.match(/\.(mp4|webm|ogg|mov)/i) || newProduct.img.includes('video') ? (
                                                <video src={newProduct.img} controls style={{ height: '150px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                            ) : (
                                                <img
                                                    src={newProduct.img}
                                                    alt="Preview"
                                                    style={{ height: '80px', borderRadius: '8px', border: '1px solid #ddd' }}
                                                />
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setNewProduct({ ...newProduct, img: '' })}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '24px',
                                                    height: '24px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>No media chosen</div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    style={{ ...buttonStyle, opacity: isUploading ? 0.7 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Uploading...' : 'Add Product'}
                                </button>
                            </form>
                        </div>

                        {/* Product List */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Current Products</h3>
                            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {products.map((product, index) => (
                                    <div key={index}
                                        onClick={() => handleProductClick(product, index)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1rem',
                                            borderBottom: '1px solid #eee',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        {product.img && (product.img.includes('video') || product.img.match(/\.(mp4|webm|ogg|mov)$/i)) ? (
                                            <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '1.2rem' }}>🎥</span>
                                            </div>
                                        ) : (
                                            <img src={product.img} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                                        )}
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{product.name}</h4>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{product.flavor}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


                {/* Edit Modal */}
                {
                    editingProduct && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}>
                            <div style={{
                                background: 'white',
                                padding: '2rem',
                                borderRadius: '12px',
                                width: '90%',
                                maxWidth: '500px',
                                position: 'relative'
                            }}>
                                <h3 style={{ marginBottom: '1.5rem', marginTop: 0 }}>Edit Product</h3>
                                <button
                                    onClick={() => setEditingProduct(null)}
                                    style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.5rem',
                                        cursor: 'pointer'
                                    }}
                                >&times;</button>

                                <form onSubmit={handleUpdateProduct}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Product Name</label>
                                        <input
                                            type="text"
                                            value={editingProduct.name}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                            required
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Flavor</label>
                                        <input
                                            type="text"
                                            value={editingProduct.flavor}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, flavor: e.target.value })}
                                            required
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Product Image</label>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={(e) => handleFileUpload(e, 'edit')}
                                            style={inputStyle}
                                        />
                                        <div style={{ marginTop: '0.5rem', height: '150px', width: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', overflow: 'hidden' }}>
                                            {editingProduct.img && (editingProduct.img.includes('video') || editingProduct.img.match(/\.(mp4|webm|ogg|mov)$/i)) ? (
                                                <video src={editingProduct.img} controls style={{ maxHeight: '100%', maxWidth: '100%' }} />
                                            ) : (
                                                <img src={editingProduct.img} alt="Preview" style={{ maxHeight: '100%', objectFit: 'contain' }} />
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="submit" style={buttonStyle}>Save Changes</button>
                                        <button type="button" onClick={handleDeleteProduct} style={{ ...buttonStyle, background: '#ef4444' }}>Delete Product</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Image Cropper Modal */}
                {croppingImage && (
                    <ImageCropper
                        imageSrc={croppingImage}
                        onCropComplete={handleCropComplete}
                        onCancel={handleCropCancel}
                    />
                )}
            </main >
        </div >
    );
};

// Sub-components for AdminDashboard
const NavItem = ({ children, active, ...props }) => (
    <div style={{
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        background: active ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s'
    }}
        {...props}
    >
        {children}
    </div>
);

const StatCard = ({ title, value, change }) => (
    <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        <h4 style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h4>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem', fontFamily: 'var(--font-display)' }}>{value}</div>
        <span style={{ fontSize: '0.75rem', color: change.startsWith('+') ? '#10b981' : '#ef4444' }}>{change} from last month</span>
    </div>
);

// Styles
const thStyle = { padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '600' };
const tdStyle = { padding: '1rem', fontSize: '0.9rem', borderTop: '1px solid #e5e7eb' };
const trStyle = { transition: 'background 0.2s' };
const badgeStyle = (status) => ({
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    background: status === 'completed' ? '#d1fae5' : '#dbeafe',
    color: status === 'completed' ? '#065f46' : '#1e40af'
});

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '0.9rem'
};

const buttonStyle = {
    width: '100%',
    padding: '10px',
    background: 'var(--color-accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
};

export default AdminDashboard;
