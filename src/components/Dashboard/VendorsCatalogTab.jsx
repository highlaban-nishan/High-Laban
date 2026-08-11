import React, { useState, useEffect } from 'react';
import db from '../../utils/db';
import { uploadMedia } from '../../utils/storage';

export default function VendorsCatalogTab() {
    const [vendors, setVendors] = useState([]);
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [itemName, setItemName] = useState('');
    const [price, setPrice] = useState('');
    const [file, setFile] = useState(null);
    const [catalogues, setCatalogues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const vList = await db.getVendors();
            const cList = await db.getVendorCatalogues();
            setVendors(vList);
            setCatalogues(cList);
            if (vList.length > 0) {
                setSelectedVendorId(vList[0].id);
            }
        } catch (err) {
            console.error("Error loading vendors/catalogues:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedVendorId) {
            alert('Please select a vendor!');
            return;
        }
        setUploading(true);
        try {
            let fileUrl = '';
            if (file) {
                fileUrl = await uploadMedia(file);
            }
            const vendorObj = vendors.find(v => v.id === selectedVendorId);
            const data = {
                vendorId: selectedVendorId,
                vendorName: vendorObj?.name || 'Unknown',
                itemName,
                price: parseFloat(price) || 0,
                fileUrl,
                fileName: file ? file.name : ''
            };
            await db.addVendorCatalogue(data);
            alert('Catalogue item added successfully!');
            setItemName('');
            setPrice('');
            setFile(null);
            loadData();
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this catalog item?")) return;
        try {
            await db.deleteVendorCatalogue(id);
            loadData();
        } catch (err) {
            alert('Error deleting: ' + err.message);
        }
    };

    if (loading) {
        return <div style={{ color: 'white' }}>Loading catalogs...</div>;
    }

    return (
        <div style={{ color: 'white', padding: '1.5rem', background: '#1e293b', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#38bdf8' }}>Vendor Catalogues & Pricing Matrix</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Upload Form */}
                <form onSubmit={handleUpload} style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#38bdf8' }}>Upload Catalogue / Package</h4>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Select Vendor</label>
                        <select
                            value={selectedVendorId}
                            onChange={(e) => setSelectedVendorId(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                            required
                        >
                            <option value="">-- Choose Vendor --</option>
                            {vendors.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Item Name / Package Label</label>
                        <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="e.g. Premium Kunafa Syrup, Packaging Boxes"
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Price (INR / EGP)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="e.g. 150.00"
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Catalogue PDF / Doc (Optional)</label>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            style={{ width: '100%', color: '#94a3b8' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        {uploading ? 'Uploading...' : 'Upload & Save'}
                    </button>
                </form>

                {/* Listing */}
                <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', overflowX: 'auto' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#818cf8' }}>Active Catalogues & Price Matrix</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #334155' }}>
                                <th style={{ padding: '0.5rem' }}>Vendor</th>
                                <th style={{ padding: '0.5rem' }}>Item / Package</th>
                                <th style={{ padding: '0.5rem' }}>Price</th>
                                <th style={{ padding: '0.5rem' }}>Catalogue PDF</th>
                                <th style={{ padding: '0.5rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {catalogues.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '0.5rem' }}>{item.vendorName}</td>
                                    <td style={{ padding: '0.5rem' }}>{item.itemName}</td>
                                    <td style={{ padding: '0.5rem' }}>₹{item.price.toFixed(2)}</td>
                                    <td style={{ padding: '0.5rem' }}>
                                        {item.fileUrl ? (
                                            <a href={item.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                                                View Catalog
                                            </a>
                                        ) : (
                                            <span style={{ color: '#64748b' }}>No File</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
