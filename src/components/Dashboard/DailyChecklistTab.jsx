import React, { useState, useEffect } from 'react';
import db from '../../utils/db';

const DAILY_ITEMS = [
    // Opening — Store & Systems
    { key: 'open_store_time', label: '☐ Open the store on time', section: 'opening' },
    { key: 'charge_phone', label: '☐ Charge the store phone', section: 'opening' },
    { key: 'connect_pos_internet', label: '☐ Connect POS/system to the internet; connect hotspot if required', section: 'opening' },
    { key: 'unmute_phone', label: '☐ Remove the store phone from silent mode', section: 'opening' },
    { key: 'check_whatsapp', label: '☐ Check all WhatsApp messages, missed calls & customer inquiries — reply promptly', section: 'opening' },
    { key: 'delivery_platforms_active', label: '☐ Ensure all online delivery platforms are active and accepting orders', section: 'opening' },
    { key: 'pos_printer_ok', label: '☐ Check POS, payment machine, and printer are working', section: 'opening' },
    // Opening — Stock & Prep
    { key: 'verify_stock', label: '☐ Verify stock against previous day closing stock; check delivery notes', section: 'stock' },
    { key: 'refill_toppings', label: '☐ Refill toppings, nuts, crumbles, sauces, spreads, syrups, and other ingredients', section: 'stock' },
    { key: 'fill_display', label: '☐ Fill and organize display/cooler — never leave empty spaces', section: 'stock' },
    { key: 'organize_packaging', label: '☐ Organize packaging materials (tissues, bags, spoons, forks, napkins, cups, lids)', section: 'stock' },
    { key: 'check_expiry', label: '☐ Check expiry dates of prepared items', section: 'stock' },
    { key: 'report_low_stock_open', label: '☐ Inform manager immediately if any item is low or unavailable', section: 'stock' },
    // Opening — Cleaning
    { key: 'sweep_entrance', label: '☐ Sweep/broom the shop front and entrance area', section: 'opening' },
    { key: 'perfume_diffuser', label: '☐ Turn on the perfume diffuser', section: 'opening' },
    { key: 'fly_catcher_on', label: '☐ Turn on the fly catcher', section: 'opening' },
    { key: 'empty_bins_open', label: '☐ Empty waste bins and fit new liners', section: 'opening' },
    { key: 'sweep_mop_open', label: '☐ Sweep and mop the floor if required', section: 'opening' },
    { key: 'clean_entrance_glass', label: '☐ Clean the entrance glass and handles', section: 'opening' },
    { key: 'wipe_counters_open', label: '☐ Wipe all counters and workstations', section: 'opening' },
    { key: 'clean_wash_basin_open', label: '☐ Ensure the wash basin is clean', section: 'opening' },
    // Mid-Shift
    { key: 'mid_clean_tables', label: '☐ Mid-Shift: Clean tables and chairs', section: 'midshift' },
    { key: 'mid_wipe_counters', label: '☐ Mid-Shift: Wipe counters', section: 'midshift' },
    { key: 'mid_organize_display', label: '☐ Mid-Shift: Organize the display', section: 'midshift' },
    { key: 'mid_refill_packaging', label: '☐ Mid-Shift: Refill packaging materials', section: 'midshift' },
    { key: 'mid_check_basin', label: '☐ Mid-Shift: Check the wash basin', section: 'midshift' },
    { key: 'mid_remove_waste', label: '☐ Mid-Shift: Remove waste', section: 'midshift' },
    { key: 'mid_internet_ok', label: '☐ Mid-Shift: Check internet connection — no issues', section: 'midshift' },
    { key: 'mid_delivery_ok', label: '☐ Mid-Shift: Check all delivery platforms are active — no issues', section: 'midshift' },
    { key: 'mid_devices_charging', label: '☐ Mid-Shift: Check phone and payment machine are charged/charging', section: 'midshift' },
    { key: 'mid_stock_levels', label: '☐ Mid-Shift: Check stock levels and inform manager if low', section: 'midshift' },
    { key: 'mid_whatsapp', label: '☐ Mid-Shift: Check WhatsApp messages and reply to any new ones', section: 'midshift' },
    // Closing
    { key: 'closing_update_stock', label: '☐ Closing: Update stock records', section: 'closing' },
    { key: 'closing_check_reviews', label: '☐ Closing: Check online delivery app reviews (Zomato, Swiggy) & Google reviews — reply to all', section: 'closing' },
    { key: 'closing_accounts', label: '☐ Closing: Close daily accounts', section: 'closing' },
    { key: 'closing_charge_phone', label: '☐ Closing: Charge the store phone', section: 'closing' },
    { key: 'closing_charge_payment', label: '☐ Closing: Charge the payment machine', section: 'closing' },
    { key: 'closing_report_low_stock', label: '☐ Closing: Inform manager of any low stock', section: 'closing' },
    { key: 'closing_check_fridge_expiry', label: '☐ Closing: Check fridge/cooler for items nearing expiry — inform manager at least 2 days before expiry', section: 'closing' },
    { key: 'closing_turn_off_equipment', label: '☐ Closing: Turn off required equipment', section: 'closing' },
    { key: 'closing_empty_bins', label: '☐ Closing: Empty bins', section: 'closing' },
    { key: 'closing_mop_floor', label: '☐ Closing: Mop the floor', section: 'closing' },
    { key: 'closing_clean_basin', label: '☐ Closing: Clean the wash basin', section: 'closing' },
    { key: 'closing_clean_fly_catcher', label: '☐ Closing: Clean the fly catcher', section: 'closing' },
    { key: 'closing_lock_doors', label: '☐ Closing: Lock all doors', section: 'closing' },
    // Marketing (Zaid)
    { key: 'marketing_post', label: '☐ Marketing: Post one poster or reel/collab (Instagram)', section: 'marketing' },
    { key: 'marketing_whatsapp_channel', label: '☐ Marketing: Update the WhatsApp Channel', section: 'marketing' },
    { key: 'marketing_instagram_dms', label: '☐ Marketing: Check Instagram DMs and comments — reply', section: 'marketing' },
    { key: 'marketing_instagram_engage', label: '☐ Marketing: Engage on the Instagram Channel', section: 'marketing' },
    { key: 'marketing_youtube', label: '☐ Marketing: Post/engage on YouTube', section: 'marketing' },
    { key: 'marketing_monitor_replies', label: '☐ Marketing: Monitor that counter staff replied to WhatsApp, delivery app reviews & Google reviews', section: 'marketing' },
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
