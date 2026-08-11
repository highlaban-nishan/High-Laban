import React, { useState, useEffect } from 'react';
import db from '../../utils/db';

const DAILY_ITEMS = [
    { key: 'opening_store', label: '1. Opening Store & Systems (Phone charged, POS connected, Delivery apps active)' },
    { key: 'opening_cleaning', label: '2. Opening Cleaning (Shop entrance swept, perfume diffuser on, fly catcher on)' },
    { key: 'stock_prep', label: '3. Stock & Prep (Refill ingredients/sauces, organize display, check expiry dates)' },
    { key: 'mid_shift', label: '4. Mid-Shift Duties (Clean tables, wipe counters, refill packaging, check stock levels)' },
    { key: 'closing_accounts', label: '5. Closing Accounts & Stock (Update stock, close daily accounts, report low stock)' },
    { key: 'closing_cleaning', label: '6. Closing Cleaning & Lockup (Empty bins, mop floor, clean fly catcher, lock all doors)' },
    { key: 'marketing_daily', label: '7. Marketing (Zaid) (Instagram poster/reel/collab, WhatsApp channel, YouTube)' }
];

export default function DailyChecklistTab() {
    const [outlets, setOutlets] = useState([]);
    const [selectedOutlet, setSelectedOutlet] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [staffOnDuty, setStaffOnDuty] = useState('');
    const [checklistItems, setChecklistItems] = useState(() => {
        const initial = {};
        DAILY_ITEMS.forEach(item => {
            initial[item.key] = false;
        });
        return initial;
    });
    const [saving, setSaving] = useState(false);
    const [records, setRecords] = useState([]);

    useEffect(() => {
        loadOutletsAndLogs();
    }, []);

    const loadOutletsAndLogs = async () => {
        try {
            const list = await db.getFranchises();
            setOutlets(list);
            if (list.length > 0) {
                setSelectedOutlet(list[0].outletName);
            }
            const logs = await db.getChecklists('daily_outlet');
            setRecords(logs);
        } catch (err) {
            console.error("Error fetching outlets/logs:", err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedOutlet) {
            alert('Please select an outlet!');
            return;
        }
        setSaving(true);
        try {
            const data = {
                type: 'daily_outlet',
                outletName: selectedOutlet,
                date,
                staffOnDuty,
                checklistItems,
                updatedAt: new Date().toISOString()
            };
            // Check if there is an existing record for this outlet and date
            const existing = records.find(r => r.outletName === selectedOutlet && r.date === date);
            await db.saveChecklist(existing?.id || null, data);
            alert('Daily checklist saved successfully!');
            // Reload logs
            const logs = await db.getChecklists('daily_outlet');
            setRecords(logs);
        } catch (err) {
            alert('Error saving log: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLoadExisting = (outlet, targetDate) => {
        const match = records.find(r => r.outletName === outlet && r.date === targetDate);
        if (match) {
            setChecklistItems(match.checklistItems);
            setStaffOnDuty(match.staffOnDuty || '');
        } else {
            const resetItems = {};
            DAILY_ITEMS.forEach(item => {
                resetItems[item.key] = false;
            });
            setChecklistItems(resetItems);
            setStaffOnDuty('');
        }
    };

    return (
        <div style={{ color: 'white', padding: '1.5rem', background: '#1e293b', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#38bdf8' }}>Daily Outlet Checklist</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <form onSubmit={handleSave} style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Select Outlet</label>
                        <select
                            value={selectedOutlet}
                            onChange={(e) => { setSelectedOutlet(e.target.value); handleLoadExisting(e.target.value, date); }}
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                            required
                        >
                            <option value="">-- Choose Outlet --</option>
                            {outlets.map(o => (
                                <option key={o.id} value={o.outletName}>{o.outletName}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => { setDate(e.target.value); handleLoadExisting(selectedOutlet, e.target.value); }}
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Staff / Workers on Duty</label>
                        <input
                            type="text"
                            value={staffOnDuty}
                            onChange={(e) => setStaffOnDuty(e.target.value)}
                            placeholder="e.g. Rahul Sharma, Nihal Khan"
                            style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>Checklist Items</span>
                        {DAILY_ITEMS.map(item => (
                            <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={checklistItems[item.key]}
                                    onChange={(e) => setChecklistItems({ ...checklistItems, [item.key]: e.target.checked })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                {item.label}
                            </label>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
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
                        {saving ? 'Saving...' : 'Save Daily Logs'}
                    </button>
                </form>

                {/* History list */}
                <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#818cf8' }}>Recent Logs</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {records.length > 0 ? (
                            records.map(rec => (
                                <div key={rec.id} style={{ background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>{rec.outletName}</span>
                                        <span style={{ color: '#38bdf8' }}>{rec.date}</span>
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Staff on duty: {rec.staffOnDuty || 'None specified'}</div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#94a3b8' }}>No daily checklist logs found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
