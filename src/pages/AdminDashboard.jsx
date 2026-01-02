import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../utils/db';
import { uploadMedia } from '../utils/storage';
import styles from './AdminDashboard.module.css';
import logo from '../assets/logo.png';

import ImageCropper from '../components/UI/ImageCropper';
// import SalesChart from '../components/Dashboard/SalesChart'; // Removed as per request
// import POS from '../components/Dashboard/POS'; // Removed as per user request

// Icons
const LoopIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const TrashIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const LogoutIcon = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const SaveIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const EditIcon = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;

const AdminDashboard = () => {
    const navigate = useNavigate();
    const user = db.getUser(); // Check auth immediately
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [franchiseInquiries, setFranchiseInquiries] = useState([]);
    /* Stats removed */
    const [newProduct, setNewProduct] = useState({ name: '', ingredients: '', tag: '', price: '', description: '', badge: '', img: '', images: [] });

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
        if (activeTab === 'products') {
            const prods = await db.getProducts();
            setProducts(prods);
        } else if (activeTab === 'customers') {
            const custs = await db.getCustomers();
            setCustomers(custs);
            const subs = await db.getSubscribers();
            setSubscribers(subs);
        } else if (activeTab === 'franchise') {
            const inquiries = await db.getFranchiseInquiries();
            setFranchiseInquiries(inquiries);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        refreshData();
        const interval = setInterval(refreshData, 5000); // Polling every 5s
        return () => clearInterval(interval);
    }, [activeTab, navigate]);

    // Prevent rendering if not logged in (stops flash of content)
    if (!user) return null;

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
            setNewProduct({ name: '', ingredients: '', tag: '', price: '', description: '', badge: '', img: '', images: [] });
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

    // Helper: Add image to product state
    const addImageToState = (url, target, productId) => {
        const imageObj = { url, tag: '' }; // New image structure
        if (target === 'new') {
            const currentImages = newProduct.images || (newProduct.img ? [typeof newProduct.img === 'string' ? { url: newProduct.img, tag: '' } : newProduct.img] : []);
            const newImages = [...currentImages, imageObj];
            // Backward compat: keep 'img' as the first URL string for now if needed by other components, or just rely on images array
            setNewProduct({ ...newProduct, images: newImages, img: newImages[0].url });
        } else if (target === 'edit' && editingProduct) {
            // Ensure current images are objects
            const currentImages = (editingProduct.images || (editingProduct.img ? [editingProduct.img] : [])).map(img =>
                typeof img === 'string' ? { url: img, tag: '' } : img
            );
            const newImages = [...currentImages, imageObj];
            setEditingProduct({ ...editingProduct, images: newImages, img: newImages[0].url });
        }
    };

    // Helper: Update image tag
    const handleImageTagChange = (index, value, target) => {
        if (target === 'new') {
            const newImages = [...newProduct.images];
            // Ensure object
            if (typeof newImages[index] === 'string') {
                newImages[index] = { url: newImages[index], tag: value };
            } else {
                newImages[index] = { ...newImages[index], tag: value };
            }
            setNewProduct({ ...newProduct, images: newImages });
        } else if (target === 'edit' && editingProduct) {
            const newImages = [...editingProduct.images];
            // Ensure object
            if (typeof newImages[index] === 'string') {
                newImages[index] = { url: newImages[index], tag: value };
            } else {
                newImages[index] = { ...newImages[index], tag: value };
            }
            setEditingProduct({ ...editingProduct, images: newImages });
        }
    };

    // Helper: Remove image
    const handleRemoveImage = (index, target) => {
        if (target === 'new') {
            const currentImages = newProduct.images || (newProduct.img ? [typeof newProduct.img === 'string' ? { url: newProduct.img, tag: '' } : newProduct.img] : []);
            const newImages = currentImages.filter((_, i) => i !== index);
            setNewProduct({ ...newProduct, images: newImages, img: newImages.length > 0 ? newImages[0].url || newImages[0] : '' });
        } else if (target === 'edit' && editingProduct) {
            const currentImages = (editingProduct.images || (editingProduct.img ? [editingProduct.img] : [])).map(img =>
                typeof img === 'string' ? { url: img, tag: '' } : img
            );
            const newImages = currentImages.filter((_, i) => i !== index);
            setEditingProduct({ ...editingProduct, images: newImages, img: newImages.length > 0 ? newImages[0].url || newImages[0] : '' });
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
                addImageToState(url, target, productId);
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
            addImageToState(url, cropTarget, editingProductId);
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
        // Ensure images array exists and normalize to objects for editing state
        let images = product.images || (product.img ? [product.img] : []);
        // Normalize strings to objects
        images = images.map(img => typeof img === 'string' ? { url: img, tag: '' } : img);

        setEditingProduct({ ...product, images });
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
                    <img src={logo} alt="HighLaban Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <div className={styles.logoText}>
                        HighLaban
                        <span className={styles.logoSub}>ADMIN</span>
                    </div>
                </div>

                <nav className={styles.nav}>


                    <div className={`${styles.navItem} ${activeTab === 'products' ? styles.active : ''}`} onClick={() => { setActiveTab('products'); setIsMobileOpen(false); }}>
                        <span style={{ fontSize: '1.2rem' }}>🛍️</span> Products
                        {activeTab === 'products' && <div className={styles.activeDot}></div>}
                    </div>


                    <div className={`${styles.navItem} ${activeTab === 'customers' ? styles.active : ''}`} onClick={() => { setActiveTab('customers'); setIsMobileOpen(false); }}>
                        <span style={{ fontSize: '1.2rem' }}>👥</span> Users
                        {activeTab === 'customers' && <div className={styles.activeDot}></div>}
                    </div>
                    <div className={`${styles.navItem} ${activeTab === 'franchise' ? styles.active : ''}`} onClick={() => { setActiveTab('franchise'); setIsMobileOpen(false); }}>
                        <span style={{ fontSize: '1.2rem' }}>🤝</span> Franchise
                        {activeTab === 'franchise' && <div className={styles.activeDot}></div>}
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
                        <div className={styles.searchBar} style={{ visibility: 'visible' }}>
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
                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.5rem' }}>Ingredients</label>
                                        <input type="text" placeholder="e.g. Milk, Nuts, Honey" value={newProduct.ingredients || ''} onChange={e => setNewProduct({ ...newProduct, ingredients: e.target.value })} className={styles.footerField} style={{ background: '#f8fafc', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', outline: 'none' }} />
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
                                            {/* Image List */}
                                            {/* Image List */}
                                            {newProduct.images && newProduct.images.length > 0 ? (
                                                newProduct.images.map((imgObj, index) => {
                                                    const url = typeof imgObj === 'string' ? imgObj : imgObj.url;
                                                    const tag = typeof imgObj === 'string' ? '' : imgObj.tag;
                                                    return (
                                                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                                            <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                                <img src={url} alt={`Product ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveImage(index, 'new')}
                                                                    style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                                    ✕
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder="Tag"
                                                                value={tag}
                                                                onChange={(e) => handleImageTagChange(index, e.target.value, 'new')}
                                                                style={{ width: '80px', fontSize: '0.7rem', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                            />
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span style={{ fontSize: '1.5rem', opacity: 0.3 }}>🖼️</span>
                                                </div>
                                            )}

                                            {/* Add Button */}
                                            <div
                                                onClick={() => document.getElementById('new-product-file').click()}
                                                style={{ width: '80px', height: '80px', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc' }}>
                                                <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>+</span>
                                            </div>
                                            <div style={{ flex: 1, display: 'none' }}>
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



                {/* --- CUSTOMERS / USERS TAB --- */}
                {activeTab === 'customers' && (
                    <div className={styles.grid}>
                        {/* Subscribers Section */}
                        <div className={styles.card} style={{ gridColumn: '1/-1', marginBottom: '2rem' }}>
                            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>Newsletter Subscribers</h3>
                            {subscribers.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                    {subscribers.map(sub => (
                                        <div key={sub.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{sub.email}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                                                Signed up: {new Date(sub.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#94a3b8' }}>No subscribers yet.</p>
                            )}
                        </div>


                    </div>
                )}



                {/* --- FRANCHISE TAB --- */}
                {activeTab === 'franchise' && (
                    <div className={styles.grid}>
                        {franchiseInquiries.length > 0 ? (
                            franchiseInquiries.map((inquiry) => (
                                <div key={inquiry.id} className={styles.card} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{inquiry.name}</h3>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(inquiry.date).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ color: '#009ceb', fontWeight: '600', fontSize: '0.9rem' }}>{inquiry.email}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>📞 {inquiry.phone}</div>

                                    <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
                                        <p style={{ margin: '0 0 5px 0' }}><strong>Location:</strong> {inquiry.city}, {inquiry.state}</p>
                                        <p style={{ margin: '0 0 5px 0' }}><strong>Type:</strong> {inquiry.franchiseType}</p>
                                        <p style={{ margin: '0' }}><strong>Own Space:</strong> {inquiry.ownSpace === 'yes' ? 'Yes' : 'No'}</p>
                                    </div>

                                    {inquiry.shopDescription && (
                                        <p style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', margin: 0 }}>"{inquiry.shopDescription}"</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className={styles.card} style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                                <p style={{ color: '#94a3b8' }}>No franchise inquiries yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* EDIT MODAL */}
            {
                editingProduct && (
                    <div className={styles.modalOverlay} onClick={() => setEditingProduct(null)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Edit Product</h2>

                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {/* Image Edit */}
                                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
                                        {editingProduct.images && editingProduct.images.length > 0 ? (
                                            editingProduct.images.map((imgObj, index) => {
                                                const url = typeof imgObj === 'string' ? imgObj : imgObj.url;
                                                const tag = typeof imgObj === 'string' ? '' : imgObj.tag;
                                                return (
                                                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                                        <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                            <img src={url} alt={`Product ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveImage(index, 'edit')}
                                                                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                                ✕
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Tag"
                                                            value={tag}
                                                            onChange={(e) => handleImageTagChange(index, e.target.value, 'edit')}
                                                            style={{ width: '80px', fontSize: '0.7rem', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                                        />
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            // Fallback for legacy data without images array
                                            <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                <img src={editingProduct.img || 'https://placehold.co/200'} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        {/* Add Button */}
                                        <div
                                            onClick={() => document.getElementById(`edit-file-${editingProduct.id}`).click()}
                                            style={{ width: '80px', height: '80px', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc' }}>
                                            <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>+</span>
                                        </div>
                                    </div>
                                    <br />
                                    <input type="file" id={`edit-file-${editingProduct.id}`} style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'edit', editingProduct.id)} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Name</label>
                                        <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className={styles.footerField} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem' }}>Ingredients</label>
                                        <input type="text" value={editingProduct.ingredients || ''} onChange={e => setEditingProduct({ ...editingProduct, ingredients: e.target.value })} className={styles.footerField} style={{ width: '100%', padding: '0.8rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
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
                )
            }



            {/* Image Cropper Modal */}
            {
                croppingImage && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '600px' }}>
                            <ImageCropper imageSrc={croppingImage} onCropComplete={onCropComplete} />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button onClick={() => setCroppingImage(null)} style={{ padding: '0.8rem 1.5rem', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminDashboard;
