import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiUpload, FiDollarSign, FiCalendar, FiFileText } from 'react-icons/fi';

export default function LocationPL({ locationId, locationName }) {
    const [isOpen, setIsOpen] = useState(false);
    const [records, setRecords] = useState([]);
    const [month, setMonth] = useState('August');
    const [year, setYear] = useState('2026');
    const [revenue, setRevenue] = useState('');
    const [expenses, setExpenses] = useState('');
    const [docLink, setDocLink] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem(`pl_records_${locationId}`);
        if (stored) {
            setRecords(JSON.parse(stored));
        } else {
            // Load dummy P&L records for realism
            const dummy = [
                { id: 1, month: 'June', year: '2026', revenue: 450000, expenses: 310000, profit: 140000, docLink: 'https://docs.google.com/spreadsheets/d/dummy-june' },
                { id: 2, month: 'July', year: '2026', revenue: 520000, expenses: 340000, profit: 180000, docLink: 'https://docs.google.com/spreadsheets/d/dummy-july' }
            ];
            setRecords(dummy);
            localStorage.setItem(`pl_records_${locationId}`, JSON.stringify(dummy));
        }
    }, [locationId]);

    const handleSavePL = (e) => {
        e.preventDefault();
        if (!revenue || !expenses) {
            alert("Please enter revenue and expenses!");
            return;
        }

        const revNum = parseFloat(revenue);
        const expNum = parseFloat(expenses);
        const newRecord = {
            id: Date.now(),
            month,
            year,
            revenue: revNum,
            expenses: expNum,
            profit: revNum - expNum,
            docLink: docLink || '#'
        };

        const updated = [newRecord, ...records];
        setRecords(updated);
        localStorage.setItem(`pl_records_${locationId}`, JSON.stringify(updated));
        alert(`P&L Statement for ${month} ${year} saved successfully!`);
        setRevenue('');
        setExpenses('');
        setDocLink('');
    };

    return (
        <div style={{ marginTop: '0.75rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    color: '#1e293b',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                }}
            >
                <FiTrendingUp style={{ color: '#10b981' }} /> {isOpen ? 'Hide P&L Sheets' : '📊 View & Upload P&L Sheets'}
            </button>

            {isOpen && (
                <div style={{ marginTop: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                    
                    {/* Upload Form */}
                    <form onSubmit={handleSavePL} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Month</label>
                                <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: '100%', fontSize: '0.8rem', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Year</label>
                                <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', fontSize: '0.8rem', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                                    {['2025', '2026', '2027', '2028'].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Revenue (₹)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 500000"
                                    value={revenue}
                                    onChange={(e) => setRevenue(e.target.value)}
                                    style={{ width: '100%', fontSize: '0.8rem', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Expenses (₹)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 350000"
                                    value={expenses}
                                    onChange={(e) => setExpenses(e.target.value)}
                                    style={{ width: '100%', fontSize: '0.8rem', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Spreadsheet / Doc Link</label>
                            <input
                                type="url"
                                placeholder="https://docs.google.com/..."
                                value={docLink}
                                onChange={(e) => setDocLink(e.target.value)}
                                style={{ width: '100%', fontSize: '0.8rem', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '6px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                marginTop: '4px'
                            }}
                        >
                            <FiUpload /> Save & Upload P&L
                        </button>
                    </form>

                    {/* Records List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                        {records.map((r) => (
                            <div key={r.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '0.8rem', color: '#1e293b' }}>📅 {r.month} {r.year}</strong>
                                    {r.docLink && r.docLink !== '#' && (
                                        <a href={r.docLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
                                            <FiFileText /> spreadsheet
                                        </a>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                    <div>Rev: ₹{r.revenue.toLocaleString()}</div>
                                    <div>Exp: ₹{r.expenses.toLocaleString()}</div>
                                    <div style={{ color: r.profit >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                        Net: ₹{r.profit.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            )}
        </div>
    );
}
