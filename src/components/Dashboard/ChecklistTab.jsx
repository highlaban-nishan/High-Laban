import React, { useState, useEffect } from 'react';
import db from '../../utils/db';

const FRANCHISE_STEPS = [
    { key: 'paperwork', label: '01. Paperwork & Documentation (FOFO/FOCO Agreement, Bank A/C, GST, FSSAI)' },
    { key: 'communication', label: '02. Communication Groups (Outlet Staff, Branch, Owner, Accounts WhatsApp groups)' },
    { key: 'civil_work', label: '03. Construction & Civil Work (Layout, subway tiles, plumbing, electrical points)' },
    { key: 'equipment', label: '04. Buying — Equipment & Machinery (Water purifier, VC cooler, Freezer)' },
    { key: 'furniture', label: '05. Buying — Furniture (Standing stool, standing seat, outdoor seating, mats)' },
    { key: 'smallwares', label: '06. Buying — Kitchen Smallwares & SS steel containers, tray, spread bottles' },
    { key: 'hygiene', label: '07. Buying — Cleaning & Hygiene (Mop, brooms, waste baskets, fly catcher)' },
    { key: 'technology', label: '08. Buying — Technology & Power (POS machine, bill/KOT printer, router, CCTV, inverter)' },
    { key: 'branding', label: '09. Buying — Signage & Branding (Signboard, LED frames, flag, menu cards)' },
    { key: 'ambience', label: '10. Buying — Comfort & Ambience (Fan, perfume diffuser)' },
    { key: 'uniform', label: '11. Buying — Uniform (T-shirts, caps, aprons)' },
    { key: 'packaging', label: '12. Buying — Packaging & Consumables (Tissues, boxes, cups, carry bags)' },
    { key: 'systems', label: '13. Systems Setup (POS installation, menu upload, Google Maps verified, Instagram/FB)' },
    { key: 'platform_onboarding', label: '14. Delivery Platform Onboarding (Zomato, Zomato Dining, Swiggy, Ownly, Pluxee)' },
    { key: 'quality_check', label: '15. Delivery Platform — Quality Check (Photos, timing, integration with POS)' },
    { key: 'billing_setup', label: '16. Petpooja / Billing Setup (GST bill, address, logo, dual screen)' },
    { key: 'training_modules', label: '17. Staff Training Modules (Food prep, recipes, greet, POS remote support)' },
    { key: 'staffing_accommodation', label: '18. Staffing & Accommodation (Hiring, rooms arranged, food setup)' },
    { key: 'gmb_maintenance', label: '19. Google My Business — Ongoing Maintenance (Timing, catalog, reviews)' },
    { key: 'whatsapp_setup', label: '20. WhatsApp Business Setup (GMB, Catalog, links)' },
    { key: 'opening_readiness', label: '21. Pre-Opening Readiness (RM/packaging delivered, live test billing, deep clean)' },
    { key: 'pre_inauguration', label: '22. Pre-Inauguration Promotion & Invites (MLA, neighborhood shops, posters)' },
    { key: 'event_setup', label: '23. Grand Opening Day Event Setup (Anchor, sound, balloon arch, sweet tray)' },
    { key: 'opening_day', label: '24. Opening Day Execution (Rituals, inaugural offer, report daily sales)' },
    { key: 'marketing_checklist', label: '25. Marketing Checklist (IG Reels/Collab, WhatsApp Channel, influencer visits)' }
];

const TRAINING_MODULES = [
    { key: 'brand_awareness', label: 'Brand Awareness (Mission, Sourcing, Vision)' },
    { key: 'product_knowledge', label: 'Product & Menu Knowledge' },
    { key: 'food_making', label: 'Food Making (Exact quantity/portioning per recipe)' },
    { key: 'packaging_guide', label: 'Packaging Guide & Presentation' },
    { key: 'greeting_guide', label: 'Customer Greeting & Hospitality Guide' },
    { key: 'customer_deal', label: 'Customer Deal & Pricing Guide' },
    { key: 'escalation_guide', label: 'Customer Issue & Escalation Handling' },
    { key: 'pos_training', label: 'Petpooja / POS Billing & Operations' },
    { key: 'stock_taking', label: 'Stock Taking, Inventory & Replenishment' },
    { key: 'checklists_sop', label: 'Opening & Closing Checklists (SOP)' },
    { key: 'hygiene_standards', label: 'Cleaning Procedures & Hygiene Checklist' },
    { key: 'payroll_shifts', label: 'Payroll, Shift Timing & Rotation' },
    { key: 'delivery_platforms', label: 'Online Delivery Platforms order management' },
    { key: 'remote_support', label: 'HQ Remote support tools (AnyDesk connection)' },
    { key: 'complaint_register', label: 'Complaint Register & Online Reporting' },
    { key: 'soft_run', label: 'Soft-run / Dry-run trial execution' }
];

export default function ChecklistTab() {
    const [subTab, setSubTab] = useState('franchise');
    const [franchises, setFranchises] = useState([]);
    const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
    const [franchiseChecklist, setFranchiseChecklist] = useState({});
    
    const [staffList, setStaffList] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [staffChecklist, setStaffChecklist] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInitialData();
    }, [subTab]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            if (subTab === 'franchise') {
                const list = await db.getFranchises();
                setFranchises(list);
                if (list.length > 0) {
                    setSelectedFranchiseId(list[0].id);
                    await loadFranchiseChecklist(list[0].id);
                }
            } else {
                const list = await db.getStaff();
                setStaffList(list);
                if (list.length > 0) {
                    setSelectedStaffId(list[0].id);
                    await loadStaffChecklist(list[0].id);
                }
            }
        } catch (err) {
            console.error("Error loading checklists:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadFranchiseChecklist = async (franchiseId) => {
        const checklists = await db.getChecklists('franchise');
        const current = checklists.find(c => c.franchiseId === franchiseId);
        if (current) {
            setFranchiseChecklist(current);
        } else {
            const initialSteps = {};
            FRANCHISE_STEPS.forEach(step => {
                initialSteps[step.key] = { completed: false, date: '' };
            });
            setFranchiseChecklist({
                franchiseId,
                type: 'franchise',
                steps: initialSteps
            });
        }
    };

    const loadStaffChecklist = async (staffId) => {
        const checklists = await db.getChecklists('worker_training');
        const current = checklists.filter(c => c.workerId === staffId);
        setStaffChecklist(current);
    };

    const handleFranchiseSelect = async (id) => {
        setSelectedFranchiseId(id);
        await loadFranchiseChecklist(id);
    };

    const handleStaffSelect = async (id) => {
        setSelectedStaffId(id);
        await loadStaffChecklist(id);
    };

    const toggleFranchiseStep = async (stepKey) => {
        const steps = { ...franchiseChecklist.steps };
        const isCompleted = !steps[stepKey]?.completed;
        steps[stepKey] = {
            completed: isCompleted,
            date: isCompleted ? new Date().toISOString().split('T')[0] : ''
        };

        const updated = {
            ...franchiseChecklist,
            steps,
            updatedAt: new Date().toISOString()
        };

        const saved = await db.saveChecklist(franchiseChecklist.id, updated);
        setFranchiseChecklist(saved);
    };

    const toggleStaffModule = async (moduleKey, moduleName) => {
        const existing = staffChecklist.find(c => c.moduleKey === moduleKey);
        const nextCompleted = !existing?.completed;

        const data = {
            workerId: selectedStaffId,
            type: 'worker_training',
            moduleKey,
            moduleName,
            completed: nextCompleted,
            updatedAt: new Date().toISOString()
        };

        await db.saveChecklist(existing?.id || null, data);
        await loadStaffChecklist(selectedStaffId);
    };

    return (
        <div style={{ color: 'white', padding: '1.5rem', background: '#1e293b', borderRadius: '12px' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                <button
                    onClick={() => setSubTab('franchise')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: subTab === 'franchise' ? '#38bdf8' : '#334155',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    🤝 Franchise Onboarding
                </button>
                <button
                    onClick={() => setSubTab('training')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: subTab === 'training' ? '#38bdf8' : '#334155',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    🧑‍🍳 Workers Training
                </button>
            </div>

            {loading ? (
                <div>Loading checklists...</div>
            ) : subTab === 'franchise' ? (
                <div>
                    <h3 style={{ marginBottom: '1rem', color: '#38bdf8' }}>Franchise Onboarding Checklist</h3>
                    {franchises.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Select Franchise</label>
                                <select
                                    value={selectedFranchiseId}
                                    onChange={(e) => handleFranchiseSelect(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                                >
                                    {franchises.map(f => (
                                        <option key={f.id} value={f.id}>{f.outletName} ({f.city})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {FRANCHISE_STEPS.map(step => {
                                        const completed = franchiseChecklist.steps?.[step.key]?.completed || false;
                                        const date = franchiseChecklist.steps?.[step.key]?.date || '';
                                        return (
                                            <div key={step.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                                                <div>
                                                    <span style={{ fontWeight: 'bold' }}>{step.label}</span>
                                                    {completed && <span style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#10b981' }}>Done ({date})</span>}
                                                </div>
                                                <button
                                                    onClick={() => toggleFranchiseStep(step.key)}
                                                    style={{
                                                        padding: '0.4rem 0.8rem',
                                                        background: completed ? '#10b981' : '#334155',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {completed ? '✓ Completed' : 'Mark Done'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: '#94a3b8' }}>No franchises available.</p>
                    )}
                </div>
            ) : (
                <div>
                    <h3 style={{ marginBottom: '1rem', color: '#38bdf8' }}>Workers Training Log</h3>
                    {staffList.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Select Worker</label>
                                <select
                                    value={selectedStaffId}
                                    onChange={(e) => handleStaffSelect(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                                >
                                    {staffList.map(s => (
                                        <option key={s.id} value={s.id}>{s.fullName} ({s.position || 'Staff'})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {TRAINING_MODULES.map(mod => {
                                        const record = staffChecklist.find(c => c.moduleKey === mod.key);
                                        const completed = record?.completed || false;
                                        return (
                                            <div key={mod.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                                                <div>
                                                    <span style={{ fontWeight: 'bold' }}>{mod.label}</span>
                                                    {completed && <span style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#10b981' }}>✓ Completed</span>}
                                                </div>
                                                <button
                                                    onClick={() => toggleStaffModule(mod.key, mod.label)}
                                                    style={{
                                                        padding: '0.4rem 0.8rem',
                                                        background: completed ? '#10b981' : '#334155',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {completed ? '✓ Trained' : 'Mark Trained'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: '#94a3b8' }}>No workers registered.</p>
                    )}
                </div>
            )}
        </div>
    );
}
