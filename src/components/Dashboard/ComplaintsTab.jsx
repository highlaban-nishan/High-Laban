import React, { useState, useEffect } from 'react';
import db from '../../utils/db';

export default function ComplaintsTab() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadComplaints();
    }, []);

    const loadComplaints = async () => {
        setLoading(true);
        try {
            const list = await db.getComplaints();
            setComplaints(list);
        } catch (err) {
            console.error("Error fetching complaints:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this complaint log?")) return;
        try {
            await db.deleteComplaint(id);
            loadComplaints();
        } catch (err) {
            alert('Error deleting complaint: ' + err.message);
        }
    };

    if (loading) {
        return <div style={{ color: 'white' }}>Loading anonymous hotline complaints...</div>;
    }

    return (
        <div style={{ color: 'white', padding: '1.5rem', background: '#1e293b', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#38bdf8' }}>Anonymous Hotline & Workplace Complaints</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {complaints.length > 0 ? (
                    complaints.map(item => (
                        <div key={item.id} style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                                <div>
                                    <span style={{
                                        background: '#7f1d1d',
                                        color: '#f87171',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        marginRight: '0.75rem'
                                    }}>
                                        {item.category}
                                    </span>
                                    {item.branch && <span style={{ color: '#38bdf8', fontSize: '0.9rem', fontWeight: '500' }}>Branch: {item.branch}</span>}
                                    <span style={{ color: '#e2e8f0', fontSize: '0.9rem', marginLeft: '0.75rem', background: '#334155', padding: '2px 8px', borderRadius: '4px' }}>
                                        By: {item.reporterName || 'Anonymous'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Logged: {new Date(item.createdAt).toLocaleString()}</span>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                {item.description}
                            </p>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No anonymous complaints reported.</p>
                )}
            </div>
        </div>
    );
}
