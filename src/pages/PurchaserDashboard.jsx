import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../utils/db';
import { uploadMedia } from '../utils/storage';
import logo from '../assets/logo.png';

const CATEGORIES = [
    'Dairy & Milk', 'Eggs', 'Fruits & Vegetables', 'Dry Fruits & Nuts',
    'Sweeteners & Flavours', 'Packaging', 'Cleaning & Supplies',
    'Gas & Fuel', 'Equipment & Tools', 'Other'
];

const TODAY = () => new Date().toISOString().split('T')[0];

const formatCurrency = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const formatDate = (d) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
};

const PaymentBadge = ({ mode }) => {
    const isCash = mode === 'Cash';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 10px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: '700',
            background: isCash ? '#fef9c3' : '#ede9fe',
            color: isCash ? '#92400e' : '#5b21b6',
            border: isCash ? '1px solid #fde68a' : '1px solid #c4b5fd'
        }}>
            {isCash ? '💵' : '📱'} {mode}
        </span>
    );
};

export default function PurchaserDashboard() {
    const navigate = useNavigate();
    const user = db.getUser();
    const isAdmin = user?.role === 'admin';
    const isAccounts = user?.role === 'accounts';
    const isReadOnly = isAccounts; // accounts can see but not add

    const [purchases, setPurchases] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [runningOutlets, setRunningOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingBill, setUploadingBill] = useState(false);
    const [toast, setToast] = useState(null);

    // Form state
    const [form, setForm] = useState({
        date: TODAY(), item: '', category: CATEGORIES[0],
        vendorId: '', amount: '', paymentMode: 'Cash',
        notes: '', billUrl: '', location: 'Main Kitchen'
    });

    // Filters (for admin/accounts view)
    const [filterDate, setFilterDate] = useState('');
    const [filterPurchaser, setFilterPurchaser] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterPayment, setFilterPayment] = useState('All');
    const [filterLocation, setFilterLocation] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const billInputRef = useRef(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        if (user.role === 'admin') { navigate('/dashboard'); return; }
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, v, f] = await Promise.all([db.getPurchases(), db.getVendors(), db.getFranchises()]);
            setPurchases(p);
            setVendors(v);
            setRunningOutlets(f.filter(item => item.status === 'Running'));
        } catch (e) {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBillUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingBill(true);
        try {
            const url = await uploadMedia(file);
            setForm(f => ({ ...f, billUrl: url }));
            showToast('Bill uploaded!');
        } catch {
            showToast('Failed to upload bill', 'error');
        } finally {
            setUploadingBill(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.item.trim()) { showToast('Item name is required', 'error'); return; }
        if (!form.amount || parseFloat(form.amount) <= 0) { showToast('Enter a valid amount', 'error'); return; }

        setSubmitting(true);
        try {
            const selectedVendor = vendors.find(v => v.id === form.vendorId);
            const data = {
                ...form,
                amount: parseFloat(form.amount),
                purchaserName: user.name,
                purchaserEmail: user.email,
                vendorName: selectedVendor?.name || '',
            };
            const newP = await db.addPurchase(data);
            setPurchases(prev => [newP, ...prev]);
            setForm({ date: TODAY(), item: '', category: CATEGORIES[0], vendorId: '', amount: '', paymentMode: 'Cash', notes: '', billUrl: '', location: 'Main Kitchen' });
            if (billInputRef.current) billInputRef.current.value = '';
            showToast('Purchase logged successfully! ✅');
        } catch {
            showToast('Failed to log purchase', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this purchase entry?')) return;
        try {
            await db.deletePurchase(id);
            setPurchases(prev => prev.filter(p => p.id !== id));
            showToast('Purchase deleted');
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    const handleLogout = () => { db.logout(); navigate('/login'); };

    // Export CSV
    const handleExport = () => {
        const rows = filteredPurchases;
        if (!rows.length) { showToast('No data to export', 'error'); return; }
        const headers = ['Date', 'Purchaser', 'Item', 'Category', 'Vendor', 'Amount (₹)', 'Payment Mode', 'Notes'];
        const csvRows = [headers.join(','), ...rows.map(p =>
            [p.date, p.purchaserName, `"${p.item}"`, `"${p.category}"`, `"${p.vendorName || ''}"`,
                p.amount, p.paymentMode, `"${p.notes || ''}"`].join(',')
        )];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `purchases_${TODAY()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Report exported!');
    };

    // Filter logic
    const myPurchases = isReadOnly || isAdmin
        ? purchases
        : purchases.filter(p => p.purchaserEmail === user.email);

    const filteredPurchases = myPurchases.filter(p => {
        if (filterLocation !== 'All' && (p.location || 'Main Kitchen') !== filterLocation) return false;
        if (filterDate && p.date !== filterDate) return false;
        if (filterPurchaser !== 'All' && p.purchaserName !== filterPurchaser) return false;
        if (filterCategory !== 'All' && p.category !== filterCategory) return false;
        if (filterPayment !== 'All' && p.paymentMode !== filterPayment) return false;
        if (searchQuery && !p.item.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !(p.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const todayTotal = filteredPurchases
        .filter(p => p.date === TODAY())
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const allTotal = filteredPurchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const uniquePurchasers = [...new Set(purchases.map(p => p.purchaserName).filter(Boolean))];

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    padding: '12px 20px', borderRadius: '12px', fontWeight: '600',
                    background: toast.type === 'error' ? '#ef4444' : '#22c55e',
                    color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    animation: 'slideIn 0.3s ease'
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <header style={{
                background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logo} alt="High Laban" style={{ height: '36px', borderRadius: '8px' }} />
                    <div>
                        <div style={{ color: 'white', fontWeight: '800', fontSize: '1rem', lineHeight: 1 }}>Daily Purchases</div>
                        <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {isAccounts ? 'Accounts View' : `Logged in as ${user?.name}`}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {(isReadOnly || isAdmin) && (
                        <button onClick={handleExport}
                            style={{ background: '#059669', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📊 Export CSV
                        </button>
                    )}
                    <button onClick={handleLogout}
                        style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 16px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}>
                        Sign Out
                    </button>
                </div>
            </header>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: "Today's Spend", value: formatCurrency(todayTotal), icon: '📅', color: '#0ea5e9' },
                        { label: 'Total (Filtered)', value: formatCurrency(allTotal), icon: '💰', color: '#10b981' },
                        { label: 'Entries', value: filteredPurchases.length, icon: '📋', color: '#f59e0b' },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: 'rgba(255,255,255,0.05)', borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.08)', padding: '1.25rem',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{s.icon}</div>
                            <div style={{ color: s.color, fontSize: '1.5rem', fontWeight: '800', lineHeight: 1 }}>{s.value}</div>
                            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isReadOnly ? '1fr' : '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>

                    {/* Log Form — Purchasers only */}
                    {!isReadOnly && (
                        <div style={{
                            background: 'rgba(255,255,255,0.06)', borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem',
                            backdropFilter: 'blur(20px)'
                        }}>
                            <h2 style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ➕ Log a Purchase
                            </h2>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                {/* Date */}
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                </div>

                                {/* Item */}
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Item Purchased *</label>
                                    <input type="text" placeholder="e.g. Eggs, Milk, Pistachio..." value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} required
                                        style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                </div>

                                {/* Category */}
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Category</label>
                                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* Location */}
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Location / Outlet</label>
                                    <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }}>
                                        <option value="Main Kitchen">🍳 Main Kitchen (Default)</option>
                                        {runningOutlets.map(o => (
                                            <option key={o.id} value={o.outletName}>🏪 {o.outletName.replace('High Laban - ', '')}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Vendor */}
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Vendor (Optional)</label>
                                    <select value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }}>
                                        <option value="">-- Select Vendor --</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.category})</option>)}
                                    </select>
                                </div>

                                {/* Amount + Payment */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Amount (₹) *</label>
                                        <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required
                                            style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Payment</label>
                                        <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
                                            style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }}>
                                            <option value="Cash">💵 Cash</option>
                                            <option value="GPay">📱 GPay</option>
                                            <option value="Bank Transfer">🏦 Bank Transfer</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Notes (Optional)</label>
                                    <textarea rows={2} placeholder="Any extra details..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                                </div>

                                {/* Bill Upload */}
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Upload Bill / Screenshot</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button type="button" onClick={() => billInputRef.current?.click()}
                                            style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', flex: 1 }}>
                                            {uploadingBill ? 'Uploading...' : form.billUrl ? '✅ Bill Uploaded' : '📷 Choose File'}
                                        </button>
                                        {form.billUrl && (
                                            <a href={form.billUrl} target="_blank" rel="noopener noreferrer"
                                                style={{ color: '#0ea5e9', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none' }}>View</a>
                                        )}
                                    </div>
                                    <input ref={billInputRef} type="file" accept="image/*,application/pdf" onChange={handleBillUpload} style={{ display: 'none' }} />
                                </div>

                                <button type="submit" disabled={submitting}
                                    style={{
                                        background: submitting ? '#334155' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                        color: 'white', border: 'none', borderRadius: '12px',
                                        padding: '14px', fontSize: '1rem', fontWeight: '800',
                                        cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '4px',
                                        transition: 'all 0.2s ease'
                                    }}>
                                    {submitting ? 'Logging...' : '✅ Log Purchase'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Purchases List */}
                    <div>
                        {/* Filters */}
                        <div style={{
                            background: 'rgba(255,255,255,0.05)', borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.08)', padding: '1rem',
                            marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center'
                        }}>
                            <input type="text" placeholder="🔍 Search item / vendor..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                style={{ flex: '1 1 180px', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }} />
                            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                                style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }} />
                            {(isReadOnly || isAdmin) && (
                                <select value={filterPurchaser} onChange={e => setFilterPurchaser(e.target.value)}
                                    style={{ padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}>
                                    <option value="All">All Purchasers</option>
                                    {uniquePurchasers.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            )}
                            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                                style={{ padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}>
                                <option value="All">All Categories</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
                                style={{ padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}>
                                <option value="All">All Locations</option>
                                <option value="Main Kitchen">Main Kitchen</option>
                                {runningOutlets.map(o => (
                                    <option key={o.id} value={o.outletName}>{o.outletName.replace('High Laban - ', '')}</option>
                                ))}
                            </select>
                            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
                                style={{ padding: '8px 12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}>
                                <option value="All">All Payments</option>
                                <option value="Cash">Cash</option>
                                <option value="GPay">GPay</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                            {(filterDate || filterPurchaser !== 'All' || filterCategory !== 'All' || filterLocation !== 'All' || filterPayment !== 'All' || searchQuery) && (
                                <button onClick={() => { setFilterDate(''); setFilterPurchaser('All'); setFilterCategory('All'); setFilterLocation('All'); setFilterPayment('All'); setSearchQuery(''); }}
                                    style={{ padding: '8px 12px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Purchase Entries */}
                        {loading ? (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Loading purchases...</div>
                        ) : filteredPurchases.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                                <div style={{ fontWeight: '700', color: '#475569' }}>No purchases found</div>
                                <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px' }}>
                                    {!isReadOnly ? 'Use the form on the left to log your first purchase.' : 'No entries match your filters.'}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {filteredPurchases.map(p => (
                                    <div key={p.id} style={{
                                        background: 'rgba(255,255,255,0.05)', borderRadius: '14px',
                                        border: '1px solid rgba(255,255,255,0.08)', padding: '1rem 1.25rem',
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        transition: 'background 0.2s ease'
                                    }}>
                                        {/* Category icon */}
                                        <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>
                                            {p.category?.startsWith('Dairy') ? '🥛' :
                                             p.category === 'Eggs' ? '🥚' :
                                             p.category?.startsWith('Fruit') ? '🍎' :
                                             p.category?.startsWith('Dry') ? '🥜' :
                                             p.category?.startsWith('Sweet') ? '🍯' :
                                             p.category === 'Packaging' ? '📦' :
                                             p.category?.startsWith('Gas') ? '🔥' :
                                             p.category?.startsWith('Equip') ? '🔧' :
                                             p.category?.startsWith('Clean') ? '🧹' : '🛒'}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ color: 'white', fontWeight: '800', fontSize: '0.95rem' }}>{p.item}</span>
                                                <PaymentBadge mode={p.paymentMode} />
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '3px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                <span>📅 {formatDate(p.date)}</span>
                                                {(isReadOnly || isAdmin) && <span>👤 {p.purchaserName}</span>}
                                                <span>📍 {p.location || 'Main Kitchen'}</span>
                                                <span>🏷️ {p.category}</span>
                                                {p.vendorName && <span>🏪 {p.vendorName}</span>}
                                            </div>
                                            {p.notes && <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '4px', fontStyle: 'italic' }}>"{p.notes}"</div>}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                                            <span style={{ color: '#10b981', fontWeight: '900', fontSize: '1.1rem' }}>{formatCurrency(p.amount)}</span>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {p.billUrl && (
                                                    <a href={p.billUrl} target="_blank" rel="noopener noreferrer"
                                                        style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', textDecoration: 'none' }}>
                                                        📷 Bill
                                                    </a>
                                                )}
                                                {(!isReadOnly && p.purchaserEmail === user.email || isAdmin) && (
                                                    <button onClick={() => handleDelete(p.id)}
                                                        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}>
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                * { box-sizing: border-box; }
                input, select, textarea { outline: none; }
                input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
                @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
            `}</style>
        </div>
    );
}
