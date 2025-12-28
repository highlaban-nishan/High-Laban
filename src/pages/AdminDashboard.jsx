import React, { useState, useEffect } from 'react';
import db from '../utils/db';
import { uploadMedia } from '../utils/storage';
import styles from './AdminDashboard.module.css';

import ImageCropper from '../components/UI/ImageCropper';
import SalesChart from '../components/Dashboard/SalesChart';
import POS from '../components/Dashboard/POS'; // Kept primarily for reference if needed, or if user wants it back in Dashboard

// Icons
const LoopIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const TrashIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const LogoutIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const SaveIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const EditIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;

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
    const [newProduct, setNewProduct] = useState({ name: '', tag: '', price: '', description: '', badge: '', img: '' });



    // Header Dropdown State
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Cropper State
    const [croppingImage, setCroppingImage] = useState(null);
    const [cropTarget, setCropTarget] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null); // For crop target identification

    // For inline editing tracking
    const [editingProduct, setEditingProduct] = useState(null);


    // Mobile Menu State
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Helper to fetch data
    const refreshData = async () => {
        if (activeTab === 'dashboard') {
            const ords = await db.getOrders();
            setOrders(ords);
            const sts = await db.getStats();
            // Assuming db.getStats returns object, if mocking ensure keys exist
            setStats(sts || { totalOrders: { value: '0', change: '0%' }, totalRevenue: { value: '₹0', change: '0%' }, activeUsers: { value: '0', change: '0%' }, pendingReview: { value: '0', change: '0%' } });
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
        const interval = setInterval(refreshData, 5000); // Polling every 5s
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
        window.location.href = '/login';
    };

    // --- Product Handlers ---

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            // Race condition to prevent hanging (increased to 60s)
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Network Timeout: Database is not responding. Check your internet connection or Firebase Quota.")), 60000));
            await Promise.race([db.addProduct(newProduct), timeoutPromise]);
            setNewProduct({ name: '', tag: '', price: '', description: '', badge: '', img: '' });
            setShowAddForm(false);
            alert('Product added successfully!');
            refreshData();
        } catch (error) {
            console.error(error);
            alert(`Error adding product: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdateProduct = async (id, field, value) => {
        const updatedProducts = products.map(p => {
            if (p.id === id) return { ...p, [field]: value };
            return p;
        });
        setProducts(updatedProducts); // Optimistic UI update

        const productToUpdate = updatedProducts.find(p => p.id === id);
        try {
            // In a real app we might debounce this
            await db.updateProduct(id, productToUpdate);
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await db.deleteProduct(id);
                refreshData();
            } catch (error) {
                console.error(error);
                alert('Error deleting product');
            }
        }
    };



    // File Upload Logic
    const handleFileUpload = async (e, target, productId = null) => {
        const file = e.target.files[0];
        if (!file) return;

        const isVideo = file.type.startsWith('video/');

        if (isVideo) {
            setIsUploading(true);
            try {
                const url = await uploadMedia(file);
                if (target === 'new') {
                    setNewProduct({ ...newProduct, img: url });
                } else if (target === 'edit' && productId) {
                    if (productId === editingProduct?.id) {
                        setEditingProduct({ ...editingProduct, img: url });
                    } else {
                        handleUpdateProduct(productId, 'img', url);
                        handleUpdateProduct(productId, 'image', url);
                    }
                }
            } catch (e) {
                alert(e.message);
            } finally {
                setIsUploading(false);
            }
        } else {
            const reader = new FileReader();
            reader.onload = () => {
                setCroppingImage(reader.result);
                setCropTarget(target);
                setEditingProductId(productId);
            };
            reader.readAsDataURL(file);
            e.target.value = null;
        }
    };

    const onCropComplete = async (croppedBlob) => {
        setIsUploading(true);
        try {
            const url = await uploadMedia(croppedBlob);
            if (cropTarget === 'new') {
                setNewProduct({ ...newProduct, img: url });
            } else if (cropTarget === 'edit' && editingProductId) {
                if (editingProductId === editingProduct?.id) {
                    setEditingProduct({ ...editingProduct, img: url });
                } else {
                    handleUpdateProduct(editingProductId, 'img', url);
                    handleUpdateProduct(editingProductId, 'image', url);
                }
            }
            setCroppingImage(null);
            setCropTarget(null);
            setEditingProductId(null);
        } catch (e) {
            alert(e.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditClick = (product) => {
        setEditingProduct({ ...product });
    };

    const handleSaveEdit = async () => {
        if (!editingProduct) return;
        setIsUploading(true);
        try {
            // Race condition to prevent hanging
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Network Timeout: Check your internet or Vercel config.")), 15000));
            await Promise.race([db.updateProduct(editingProduct.id, editingProduct), timeoutPromise]);
            // Update local state
            setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
            setEditingProduct(null);
            alert("Changes saved successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to save changes.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div className={styles.overlay} onClick={() => setIsMobileOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isMobileOpen ? styles.open : ''}`}>
                <div className={styles.logo}>
                    <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>HL</div>
                    <div className={styles.logoText}>
                        HighLaban
                        <span className={styles.logoSub}>ADMIN</span>
                    </div>
                </div>

                <nav className={styles.nav}>
                    <div className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`} onClick={() => { setActiveTab('dashboard'); setIsMobileOpen(false); }}>
                        <span style={{ fontSize: '1.2rem' }}>📊</span> Overview
                        {activeTab === 'dashboard' && <div className={styles.activeDot}></div>}
                    </div>
                    <div className={`${styles.navItem} ${activeTab === 'pos' ? styles.active : ''}`} onClick={() => { setActiveTab('pos'); setIsMobileOpen(false); }}>
                        <span style={{ fontSize: '1.2rem' }}>🏧</span> POS
                        {activeTab === 'pos' && <div className={styles.activeDot}></div>}
                    </div>
                    <div className={`${styles.navItem} ${activeTab === 'products' ? styles.active : ''}`} onClick={() => { setActiveTab('products'); setIsMobileOpen(false); }}>
                        <span style={{ fontSize: '1.2rem' }}>🛍️</span> Products
                        {activeTab === 'products' && <div className={styles.activeDot}></div>}
                    </div>

                    <div className={`${styles.navItem} ${activeTab === 'orders' ? styles.active : ''}`} onClick={() => { setActiveTab('orders'); setIsMobileOpen(false); }}>
                        <span style={{ fontSize: '1.2rem' }}>✉️</span> Orders
                        {activeTab === 'orders' && <div className={styles.activeDot}></div>}
                    </div>
                    <div className={`${styles.navItem} ${activeTab === 'customers' ? styles.active : ''}`} onClick={() => { setActiveTab('customers'); setIsMobileOpen(false); }}>
                        <span style={{ fontSize: '1.2rem' }}>👥</span> Users
                        {activeTab === 'customers' && <div className={styles.activeDot}></div>}
                    </div>
                </nav>

                <div className={styles.signOut} onClick={handleLogout}>
                    <LogoutIcon /> Sign Out
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {/* Header */}
                <header className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button className={styles.mobileToggle} onClick={() => setIsMobileOpen(!isMobileOpen)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </button>
                        <h1 className={styles.pageTitle}>
                            {activeTab === 'dashboard' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h1>
                    </div>

                    <div className={styles.headerActions}>
                        <div className={styles.searchBar} style={{ visibility: activeTab === 'pos' ? 'hidden' : 'visible' }}>
                            <LoopIcon />
                            <input type="text" placeholder="Search..." className={styles.searchInput} />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className={styles.profileAvatar}>
                                HL
                            </div>
                            {showUserMenu && (
                                <div style={{ position: 'absolute', top: '110%', right: 0, width: '180px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '0.5rem', zIndex: 10 }}>
                                    <button onClick={handleResetData} style={{ width: '100%', padding: '0.8rem', color: '#ef4444', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}>⚠️ Reset Data</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* --- DASHBOARD TAB --- */}
                {activeTab === 'dashboard' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className={styles.statsGrid}>
                            {[
                                { label: 'Total Revenue', value: stats.totalRevenue.value, change: stats.totalRevenue.change, color: '#10b981' },
                                { label: 'Total Orders', value: stats.totalOrders.value, change: stats.totalOrders.change, color: '#3b82f6' },
                                { label: 'Active Users', value: stats.activeUsers.value, change: stats.activeUsers.change, color: '#f59e0b' },
                                { label: 'Pending Review', value: stats.pendingReview.value, change: stats.pendingReview.change, color: '#6366f1' }
                            ].map((stat, i) => (
                                <div key={i} className={styles.card} style={{ padding: '1.5rem' }}>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{stat.label}</p>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>{stat.value}</h3>
                                    <span style={{ color: stat.color, background: `${stat.color}15`, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                                        {stat.change} from last month
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.dashboardLayout}>
                            <div className={styles.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Revenue Overview</h3>
                                    <select style={{ border: 'none', background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                                        <option>This Year</option>
                                    </select>
                                </div>
                                <div style={{ height: '300px' }}>
                                    <SalesChart orders={orders} />
                                </div>
                            </div>
                            <div className={styles.card}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Quick Actions</h3>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <button style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Download Reports</button>
                                    <button style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Manage Inventory</button>
                                    <button style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Customer Issues (0)</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- POS TAB --- */}
                {activeTab === 'pos' && (
                    <POS />
                )}

                {/* --- PRODUCTS TAB --- */}
                {activeTab === 'products' && (
                    <section>
                        <div className={styles.catalogHeader}>
                            <h2 className={styles.sectionTitle}>Products Catalog</h2>
                            <button
                                className={styles.addButton}
                                onClick={() => setShowAddForm(!showAddForm)}
                            >
                                <span>{showAddForm ? '−' : '+'}</span> {showAddForm ? 'CLOSE FORM' : 'ADD PRODUCT'}
                            </button>
                        </div>

                        {/* Add Product Form (Slide Open) */}
                        <div style={{
                            maxHeight: showAddForm ? '800px' : '0',
                            opacity: showAddForm ? 1 : 0,
                            marginBottom: showAddForm ? '2rem' : 0,
                            borderBottom: showAddForm ? '1px solid #e2e8f0' : 'none',
                            paddingBottom: showAddForm ? '2rem' : 0
                        }} className={styles.slideOpen}>
                            <div className={styles.card} style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <h3 style={{ marginBottom: '1.5rem' }}>Add New Product</h3>
                                <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                                    {/* ... Inputs ... */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>Name</label>
                                        <input type="text" placeholder="e.g. Basbousa" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className={styles.footerField} style={{ background: '#f8fafc', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', outline: 'none' }} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>Tag</label>
                                        <input type="text" placeholder="e.g. SWEET CLASSIC" value={newProduct.tag || ''} onChange={e => setNewProduct({ ...newProduct, tag: e.target.value })} className={styles.footerField} style={{ background: '#f8fafc', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>Price (₹)</label>
                                        <input type="number" placeholder="220" value={newProduct.price || ''} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className={styles.footerField} style={{ background: '#f8fafc', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', outline: 'none' }} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>Badge</label>
                                        <input type="text" placeholder="e.g. Trending" value={newProduct.badge || ''} onChange={e => setNewProduct({ ...newProduct, badge: e.target.value })} className={styles.footerField} style={{ background: '#f8fafc', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', outline: 'none' }} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>Description</label>
                                        <textarea placeholder="Write a short description..." value={newProduct.description || ''} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} style={{ background: '#f8fafc', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', minHeight: '80px', outline: 'none' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1/-1' }}>
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8' }}>Product Image</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {newProduct.img ? (
                                                    <img src={newProduct.img} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>🖼️</span>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <input type="file" onChange={(e) => handleFileUpload(e, 'new')} style={{ fontSize: '0.9rem' }} id="new-product-file" />
                                            </div>
                                            <button type="submit" className={styles.saveButton} disabled={isUploading}>{isUploading ? 'SAVING...' : 'ADD NOW'}</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className={styles.grid}>
                            {products.map((product) => (
                                <div key={product.id} className={styles.card}>
                                    <div className={styles.imageArea} style={{ position: 'relative' }}>
                                        <img src={product.img || product.image || 'https://placehold.co/200'} alt={product.name} className={styles.productImg} />
                                    </div>

                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardTitle} style={{ width: '70%' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{product.name}</h4>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className={styles.editBtn} onClick={() => handleEditClick(product)} title="Edit Product">
                                                <EditIcon />
                                            </button>
                                            <button className={styles.deleteBtn} onClick={() => handleDeleteProduct(product.id)} title="Delete Product">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.cardTag}>
                                        <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#64748b' }}>{product.tag || 'No Tag'}</span>
                                    </div>

                                    <div className={styles.cardDescription}>
                                        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>{product.description?.slice(0, 60) || 'No description'}...</p>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.footerField}>
                                            <label>PRICE</label>
                                            <span style={{ fontWeight: 'bold' }}>₹{product.price}</span>
                                        </div>
                                        <div className={styles.footerField}>
                                            <label>BADGE</label>
                                            <span style={{ fontSize: '0.8rem' }}>{product.badge || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}



                {/* ... Orders & Customers tabs ... */}

            </main>

            {/* EDIT MODAL */}
            {editingProduct && (
                <div className={styles.modalOverlay} onClick={() => setEditingProduct(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Edit Product</h2>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {/* Image Edit */}
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <img
                                    src={editingProduct.img || editingProduct.image || 'https://placehold.co/200'}
                                    alt="Preview"
                                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem', cursor: 'pointer' }}
                                    onClick={() => document.getElementById(`edit-file-${editingProduct.id}`).click()}
                                />
                                <br />
                                <input type="file" id={`edit-file-${editingProduct.id}`} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'edit', editingProduct.id)} />
                                <button type="button" onClick={() => document.getElementById(`edit-file-${editingProduct.id}`).click()} className={styles.cancelBtn} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>Change Image</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Name</label>
                                    <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className={styles.footerField} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Price (₹)</label>
                                    <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} className={styles.footerField} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Tag</label>
                                    <input type="text" value={editingProduct.tag || ''} onChange={e => setEditingProduct({ ...editingProduct, tag: e.target.value })} className={styles.footerField} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Badge</label>
                                    <input type="text" value={editingProduct.badge || ''} onChange={e => setEditingProduct({ ...editingProduct, badge: e.target.value })} className={styles.footerField} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Description</label>
                                <textarea rows={4} value={editingProduct.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontFamily: 'inherit' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button onClick={() => setEditingProduct(null)} className={styles.cancelBtn}>Cancel</button>
                                <button onClick={handleSaveEdit} className={styles.saveChangesBtn} disabled={isUploading}>
                                    <SaveIcon />
                                    {isUploading ? 'Saving...' : 'SAVE CHANGES'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Image Cropper Modal */}
            {croppingImage && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '600px' }}>
                        <ImageCropper imageSrc={croppingImage} onCropComplete={onCropComplete} />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button onClick={() => setCroppingImage(null)} style={{ padding: '0.8rem 1.5rem', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
