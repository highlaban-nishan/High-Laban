import React, { useState, useEffect } from 'react';
import db from '../../utils/db';
import { FiCheckSquare, FiClipboard, FiShield, FiSmile, FiAlertCircle } from 'react-icons/fi';

export default function SupervisorChecklistTab() {
    const user = db.getUser();
    const [staffList, setStaffList] = useState([]);
    const [audits, setAudits] = useState([]);
    const [branch, setBranch] = useState(user?.branch || 'Connaught Place');
    
    // Form fields
    const [nailCheckPass, setNailCheckPass] = useState(true);
    const [uniformCheckPass, setUniformCheckPass] = useState(true);
    const [openingChecklistVerified, setOpeningChecklistVerified] = useState(true);
    const [closingChecklistVerified, setClosingChecklistVerified] = useState(true);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadStaffAndAudits = async () => {
            try {
                const list = await db.getStaff();
                setStaffList(list.filter(s => s.branch === branch));
                // Load past audits if saved (otherwise load default log)
                const storedAudits = localStorage.getItem('supervisor_audits');
                if (storedAudits) {
                    setAudits(JSON.parse(storedAudits));
                } else {
                    const defaultAudits = [
                        { id: 1, date: '2026-08-10', branch: 'Connaught Place', auditor: 'Nour (Supervisor)', nailCheck: 'Passed', uniformCheck: 'Passed', openingVerified: 'Yes', closingVerified: 'Yes', notes: 'All staff looking clean. Nail check passed by everyone.' },
                        { id: 2, date: '2026-08-09', branch: 'Connaught Place', auditor: 'Nour (Supervisor)', nailCheck: 'Passed', uniformCheck: 'Needs Improvement (1 missing cap)', openingVerified: 'Yes', closingVerified: 'Yes', notes: 'Reminded Ahmed to wear his cap.' }
                    ];
                    setAudits(defaultAudits);
                }
            } catch (err) {
                console.error("Error loading supervisor checklist resources:", err);
            }
        };
        loadStaffAndAudits();
    }, [branch]);

    const handleSubmitAudit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const newAudit = {
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                branch,
                auditor: user?.name || 'Nour (Supervisor)',
                nailCheck: nailCheckPass ? 'Passed' : 'Needs Action',
                uniformCheck: uniformCheckPass ? 'Passed' : 'Needs Action',
                openingVerified: openingChecklistVerified ? 'Yes' : 'No',
                closingVerified: closingChecklistVerified ? 'Yes' : 'No',
                notes
            };

            const updated = [newAudit, ...audits];
            setAudits(updated);
            localStorage.setItem('supervisor_audits', JSON.stringify(updated));
            alert("Supervisor Master Audit saved successfully! All outlet tasks verified.");
            setNotes('');
        } catch (err) {
            alert("Error saving audit: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ color: 'white', padding: '1.5rem', background: '#1e293b', borderRadius: '12px', fontFamily: 'Inter, sans-serif' }}>
            <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem' }}>🛡️ Supervisor Master Audit & Verification</h3>
            <p style={{ margin: '4px 0 1.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                Verify shift compliance, daily checklists, uniform status, and nail hygiene for all outlet workers.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                
                {/* Audit Input Form */}
                <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '10px', border: '1px solid #334155' }}>
                    <h4 style={{ margin: '0 0 1.25rem 0', color: '#38bdf8', fontSize: '1.1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                        Create Shift Verification Audit
                    </h4>

                    <form onSubmit={handleSubmitAudit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Outlet / Branch</label>
                            <select 
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '0.6rem', borderRadius: '6px' }}
                            >
                                <option value="Connaught Place">Connaught Place</option>
                                <option value="Cyber City">Cyber City</option>
                                <option value="Saket District">Saket District</option>
                            </select>
                        </div>

                        {/* Hygiene Section */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#38bdf8', fontWeight: 'bold', marginBottom: '8px' }}>🧼 Weekly Nail & Hygiene Audit</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input type="radio" checked={nailCheckPass} onChange={() => setNailCheckPass(true)} />
                                    <span>All Passed (Clipped & Clean)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input type="radio" checked={!nailCheckPass} onChange={() => setNailCheckPass(false)} />
                                    <span style={{ color: '#f87171' }}>Needs Action</span>
                                </label>
                            </div>
                        </div>

                        {/* Uniform Compliance */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#38bdf8', fontWeight: 'bold', marginBottom: '8px' }}>👕 Staff Uniform Check</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input type="radio" checked={uniformCheckPass} onChange={() => setUniformCheckPass(true)} />
                                    <span>All Staff in Active Pieces</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input type="radio" checked={!uniformCheckPass} onChange={() => setUniformCheckPass(false)} />
                                    <span style={{ color: '#f87171' }}>Missing Uniforms</span>
                                </label>
                            </div>
                        </div>

                        {/* Checklist Verification */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#38bdf8', fontWeight: 'bold', marginBottom: '8px' }}>📋 Daily Checklist Verification</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={openingChecklistVerified} onChange={(e) => setOpeningChecklistVerified(e.target.checked)} />
                                    <span>Verify Opening Checklist Done</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={closingChecklistVerified} onChange={(e) => setClosingChecklistVerified(e.target.checked)} />
                                    <span>Verify Closing Checklist Done</span>
                                </label>
                            </div>
                        </div>

                        {/* Audit Notes */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Shift Notes & Observations</label>
                            <textarea 
                                rows="3"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="E.g., Reminded crew about cap rules, hygiene log is clean..."
                                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '0.6rem', borderRadius: '6px', resize: 'vertical' }}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', marginTop: '4px' }}
                        >
                            {isSubmitting ? 'Saving Audit...' : 'Submit Verification Audit'}
                        </button>

                    </form>
                </div>

                {/* Past Verification Logs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '10px', border: '1px solid #334155', flex: 1 }}>
                        <h4 style={{ margin: '0 0 1.25rem 0', color: '#38bdf8', fontSize: '1.1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                            Recent Audit Logs ({branch})
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                            {audits.filter(a => a.branch === branch).map((a) => (
                                <div key={a.id} style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <strong style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{a.auditor}</strong>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{a.date}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                                        <div>Nails: <span style={{ color: a.nailCheck === 'Passed' ? '#34d399' : '#f87171', fontWeight: 'bold' }}>{a.nailCheck}</span></div>
                                        <div>Uniform: <span style={{ color: a.uniformCheck === 'Passed' ? '#34d399' : '#f87171', fontWeight: 'bold' }}>{a.uniformCheck}</span></div>
                                        <div>Opening Verified: <span style={{ color: '#cbd5e1' }}>{a.openingVerified}</span></div>
                                        <div>Closing Verified: <span style={{ color: '#cbd5e1' }}>{a.closingVerified}</span></div>
                                    </div>
                                    {a.notes && <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px dashed #334155', paddingTop: '6px' }}>{a.notes}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
