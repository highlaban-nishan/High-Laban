import React, { useState, useEffect } from 'react';
import db from '../../utils/db';

export default function UniformsTab() {
    const [staffList, setStaffList] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [uniformType, setUniformType] = useState('T-shirt');
    const [size, setSize] = useState('M');
    const [status, setStatus] = useState('Issued');
    const [quantity, setQuantity] = useState(1);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [comments, setComments] = useState('');
    const [saving, setSaving] = useState(false);

    const [activeSubTab, setActiveSubTab] = useState('logs');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const staff = await db.getStaff();
            const unifLogs = await db.getUniformLogs();
            setStaffList(staff);
            setLogs(unifLogs);
        } catch (err) {
            console.error("Error loading uniforms:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStaffId) {
            alert('Please select a worker!');
            return;
        }
        setSaving(true);
        const staffObj = staffList.find(s => s.id === selectedStaffId);
        try {
            const data = {
                workerId: selectedStaffId,
                workerName: staffObj?.fullName || 'Unknown',
                uniformType,
                size,
                status,
                quantity: parseInt(quantity) || 1,
                issueDate,
                comments
            };
            await db.addUniformLog(data);
            alert('Uniform log added successfully!');
            // Reset form
            setComments('');
            loadData();
        } catch (err) {
            alert('Error adding log: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this log?")) return;
        try {
            await db.deleteUniformLog(id);
            loadData();
        } catch (err) {
            alert('Error deleting log: ' + err.message);
        }
    };

    const totalIssued = logs.filter(l => l.status === 'Issued').reduce((acc, c) => acc + (c.quantity || 0), 0);
    const totalReplaced = logs.filter(l => l.status === 'Replaced').reduce((acc, c) => acc + (c.quantity || 0), 0);
    const totalDamaged = logs.filter(l => l.status === 'Damaged').reduce((acc, c) => acc + (c.quantity || 0), 0);

    const getStaffUniformSummary = () => {
        return staffList.map(staff => {
            const workerLogs = logs.filter(l => l.workerId === staff.id);
            const itemsWithWorker = {};
            workerLogs.forEach(l => {
                const type = l.uniformType || 'Other';
                if (!itemsWithWorker[type]) {
                    itemsWithWorker[type] = 0;
                }
                if (l.status === 'Issued' || l.status === 'Replaced') {
                    itemsWithWorker[type] += (l.quantity || 0);
                } else if (l.status === 'Damaged') {
                    // Damaged items are not considered in-use
                }
            });
            const totalPieces = Object.values(itemsWithWorker).reduce((a, b) => a + b, 0);
            return {
                id: staff.id,
                name: staff.fullName,
                nickname: staff.nickname,
                position: staff.position || 'Staff',
                tShirtSize: staff.tShirtSize || 'M',
                items: itemsWithWorker,
                totalPieces
            };
        });
    };

    if (loading) {
        return <div style={{ color: 'white' }}>Loading uniforms database...</div>;
    }

    return (
        <div style={{ color: 'white', padding: '1.5rem', background: '#1e293b', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#38bdf8' }}>Uniform Section & Inventory logs</h3>

            {/* Sub-tab Navigation */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
                <button
                    onClick={() => setActiveSubTab('logs')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: activeSubTab === 'logs' ? '#38bdf8' : 'transparent',
                        color: activeSubTab === 'logs' ? '#0f172a' : '#94a3b8',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Log Registry & Issue Form
                </button>
                <button
                    onClick={() => setActiveSubTab('staff-totals')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: activeSubTab === 'staff-totals' ? '#38bdf8' : 'transparent',
                        color: activeSubTab === 'staff-totals' ? '#0f172a' : '#94a3b8',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Staff Uniform Assignments (Active Pieces)
                </button>
            </div>

            {/* Summary Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid #38bdf8', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Total Issued</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totalIssued}</span>
                </div>
                <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid #10b981', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Total Replaced</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totalReplaced}</span>
                </div>
                <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid #ef4444', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Total Damaged</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totalDamaged}</span>
                </div>
            </div>

            {activeSubTab === 'logs' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Form */}
                <form onSubmit={handleSubmit} style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#38bdf8' }}>Issue/Log Uniform</h4>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Select Worker</label>
                        <select
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                            required
                        >
                            <option value="">-- Choose Worker --</option>
                            {staffList.map(s => (
                                <option key={s.id} value={s.id}>{s.fullName} ({s.position || 'Staff'})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Uniform Item</label>
                        <select
                            value={uniformType}
                            onChange={(e) => setUniformType(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                        >
                            <option value="T-shirt">T-shirt</option>
                            <option value="Cap">Cap</option>
                            <option value="Apron">Apron</option>
                            <option value="Chef Coat">Chef Coat</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Size</label>
                        <select
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                        >
                            <option value="S">Small (S)</option>
                            <option value="M">Medium (M)</option>
                            <option value="L">Large (L)</option>
                            <option value="XL">Extra Large (XL)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Quantity</label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Status / Event</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                        >
                            <option value="Issued">Issued</option>
                            <option value="Replaced">Replaced (Exchange)</option>
                            <option value="Damaged">Damaged / Log only</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Log Date</label>
                        <input
                            type="date"
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Comments / Details</label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="e.g. T-shirt torn during shift, requested XL size replacement"
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px', resize: 'vertical' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: '#38bdf8',
                            color: '#0f172a',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        {saving ? 'Adding...' : 'Add Log'}
                    </button>
                </form>

                {/* Table of logs */}
                <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', overflowX: 'auto' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#818cf8' }}>Log Registry</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #334155' }}>
                                <th style={{ padding: '0.5rem' }}>Worker</th>
                                <th style={{ padding: '0.5rem' }}>Item</th>
                                <th style={{ padding: '0.5rem' }}>Size</th>
                                <th style={{ padding: '0.5rem' }}>Qty</th>
                                <th style={{ padding: '0.5rem' }}>Status</th>
                                <th style={{ padding: '0.5rem' }}>Date</th>
                                <th style={{ padding: '0.5rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '0.5rem' }}>{log.workerName}</td>
                                    <td style={{ padding: '0.5rem' }}>{log.uniformType}</td>
                                    <td style={{ padding: '0.5rem' }}>{log.size}</td>
                                    <td style={{ padding: '0.5rem' }}>{log.quantity}</td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.4rem',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            background: log.status === 'Issued' ? '#1e3a8a' : log.status === 'Replaced' ? '#064e3b' : '#7f1d1d',
                                            color: log.status === 'Issued' ? '#60a5fa' : log.status === 'Replaced' ? '#34d399' : '#f87171'
                                        }}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>{log.issueDate}</td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <button
                                            onClick={() => handleDelete(log.id)}
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
            ) : (
                <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', overflowX: 'auto' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#38bdf8' }}>Staff Active Uniform Quantities</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '0.9rem' }}>
                                <th style={{ padding: '0.75rem' }}>Staff Name</th>
                                <th style={{ padding: '0.75rem' }}>Nickname</th>
                                <th style={{ padding: '0.75rem' }}>Role / Position</th>
                                <th style={{ padding: '0.75rem' }}>T-Shirt Size</th>
                                <th style={{ padding: '0.75rem' }}>Uniform Summary (Active Pieces)</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Total Pieces With Staff</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getStaffUniformSummary().map(summary => (
                                <tr key={summary.id} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{summary.name}</td>
                                    <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{summary.nickname || '-'}</td>
                                    <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{summary.position}</td>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#38bdf8' }}>{summary.tShirtSize}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {summary.totalPieces > 0 ? (
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {Object.entries(summary.items).map(([type, qty]) => qty > 0 ? (
                                                    <span key={type} style={{ background: '#1e293b', border: '1px solid #475569', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                                                        {type}: {qty}
                                                    </span>
                                                ) : null)}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No uniforms currently with staff</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold', fontSize: '1rem', color: summary.totalPieces > 0 ? '#10b981' : '#ef4444', textAlign: 'center' }}>
                                        {summary.totalPieces} {summary.totalPieces === 1 ? 'piece' : 'pieces'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
