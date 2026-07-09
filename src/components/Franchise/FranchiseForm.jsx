import React, { useState, useEffect, useRef } from 'react';
import styles from './FranchiseForm.module.css';
import db from '../../utils/db';
import { FaTimes } from 'react-icons/fa';

const INDIA_STATES = [
    { code: 'AP', name: 'Andhra Pradesh' }, { code: 'AR', name: 'Arunachal Pradesh' },
    { code: 'AS', name: 'Assam' }, { code: 'BR', name: 'Bihar' },
    { code: 'CG', name: 'Chhattisgarh' }, { code: 'DL', name: 'Delhi' },
    { code: 'GA', name: 'Goa' }, { code: 'GJ', name: 'Gujarat' },
    { code: 'HR', name: 'Haryana' }, { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'JH', name: 'Jharkhand' }, { code: 'JK', name: 'Jammu & Kashmir' },
    { code: 'KA', name: 'Karnataka' }, { code: 'KL', name: 'Kerala' },
    { code: 'MP', name: 'Madhya Pradesh' }, { code: 'MH', name: 'Maharashtra' },
    { code: 'MN', name: 'Manipur' }, { code: 'ML', name: 'Meghalaya' },
    { code: 'MZ', name: 'Mizoram' }, { code: 'NL', name: 'Nagaland' },
    { code: 'OD', name: 'Odisha' }, { code: 'PB', name: 'Punjab' },
    { code: 'RJ', name: 'Rajasthan' }, { code: 'SK', name: 'Sikkim' },
    { code: 'TN', name: 'Tamil Nadu' }, { code: 'TS', name: 'Telangana' },
    { code: 'TR', name: 'Tripura' }, { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'UK', name: 'Uttarakhand' }, { code: 'WB', name: 'West Bengal' },
];

const INITIAL_FORM = {
    name: '', email: '', phone: '', city: '', state: '',
    currentJob: '', ownedBusiness: 'no', franchisee: 'no', franchiseType: '',
};

export default function FranchiseForm({ isOpen, onClose, isModal = true }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [targetLocations, setTargetLocations] = useState([]);
    const [tempCity, setTempCity] = useState('');
    const [tempState, setTempState] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null); // { type: 'success'|'error'|'info', text }
    const [duplicateRecord, setDuplicateRecord] = useState(null); // existing DB record
    const [pendingFormData, setPendingFormData] = useState(null); // held while conflict shown
    const formRef = useRef(null);

    const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    useEffect(() => {
        if (isModal) {
            document.body.style.overflow = isOpen ? 'hidden' : 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, isModal]);

    const showStatus = (text, type = 'success') => {
        setStatusMsg({ text, type });
        if (type !== 'conflict') setTimeout(() => setStatusMsg(null), 5000);
    };

    const resetAll = () => {
        setForm(INITIAL_FORM);
        setTargetLocations([]);
        setTempCity('');
        setTempState('');
        setDuplicateRecord(null);
        setPendingFormData(null);
        setStatusMsg(null);
    };

    const sendWhatsAppRedirect = (data) => {
        const textTemplate = `Hey I like to enquire about franchise.%0A%0AHere are my details:%0A• *Name:* ${data.name}%0A• *Phone:* ${data.phone}%0A• *Email:* ${data.email}%0A• *City:* ${data.city || 'N/A'}%0A• *State:* ${data.state || 'N/A'}%0A• *Current Job/Business:* ${data.currentJob || 'N/A'}%0A• *Owned Business Before:* ${data.ownedBusiness || 'no'}%0A• *Been a Franchisee:* ${data.franchisee || 'no'}%0A• *Type:* ${data.franchiseType || 'N/A'}%0A• *Target Locations:* ${(data.targetLocations || []).map(l => `${l.city} (${l.state})`).join(', ') || 'N/A'}`;
        const whatsappNumber = '917353100100'; // Updated WhatsApp
        window.open(`https://wa.me/${whatsappNumber}?text=${textTemplate}`, '_blank');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Manual validation since button might be outside form or type="button"
        if (!form.name || !form.email || !form.phone) {
            showStatus('Please fill in all mandatory fields (Name, Email, Phone).', 'error');
            return;
        }

        const formData = { ...form, targetLocations };

        setIsSubmitting(true);
        try {
            // ── DUPLICATE CHECK ──
            const duplicate = await db.checkFranchiseDuplicate(form.phone, form.email);
            if (duplicate) {
                setDuplicateRecord(duplicate);
                setPendingFormData(formData);
                showStatus('conflict');
                setIsSubmitting(false);
                return;
            }

            // No duplicate — proceed
            await db.addFranchiseInquiry(formData);
            sendWhatsAppRedirect(formData);
            showStatus('Thank you! Redirecting to WhatsApp to complete your application...', 'success');
            resetAll();
            if (onClose) setTimeout(onClose, 2500);
        } catch (error) {
            console.error(error);
            showStatus('Submission failed. Please try again or contact us directly.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Merge into existing record
    const handleMerge = async () => {
        setIsSubmitting(true);
        try {
            await db.mergeFranchiseInquiry(duplicateRecord.id, pendingFormData);
            sendWhatsAppRedirect(pendingFormData);
            showStatus('Application updated! Redirecting to WhatsApp to complete...', 'success');
            resetAll();
            if (onClose) setTimeout(onClose, 2500);
        } catch (err) {
            showStatus('Update failed. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit as brand-new inquiry anyway
    const handleSubmitNew = async () => {
        setIsSubmitting(true);
        try {
            await db.addFranchiseInquiry(pendingFormData);
            sendWhatsAppRedirect(pendingFormData);
            showStatus('Inquiry submitted! Redirecting to WhatsApp...', 'success');
            resetAll();
            if (onClose) setTimeout(onClose, 2500);
        } catch (err) {
            showStatus('Submission failed. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isModal && !isOpen) return null;

    const statusColors = {
        success: { bg: '#f0fdf4', border: '#86efac', color: '#15803d', icon: '✅' },
        error:   { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626', icon: '❌' },
        info:    { bg: '#f0f9ff', border: '#7dd3fc', color: '#0369a1', icon: 'ℹ️' },
    };

    return (
        <>
            {isModal && <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose}></div>}
            <div className={isModal ? `${styles.drawer} ${isOpen ? styles.open : ''}` : styles.inlineContainer}>
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title} style={{
                            fontSize: '2rem',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.03em',
                            marginBottom: '0.25rem'
                        }}>Franchise Queries</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Submit your application to partner with High Laban</p>
                    </div>
                    {onClose && (
                        <button className={styles.closeBtn} onClick={onClose} aria-label="Close" title="Go Back">
                            <FaTimes />
                        </button>
                    )}
                </div>

                {/* Status Message Banner */}
                {statusMsg && statusMsg.type !== 'conflict' && (
                    <div style={{
                        margin: '0 1.5rem 1rem', padding: '12px 16px', borderRadius: '12px',
                        background: statusColors[statusMsg.type]?.bg || '#f0fdf4',
                        border: `1px solid ${statusColors[statusMsg.type]?.border || '#86efac'}`,
                        color: statusColors[statusMsg.type]?.color || '#15803d',
                        fontWeight: '600', fontSize: '0.875rem',
                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                    }}>
                        <span>{statusColors[statusMsg.type]?.icon}</span>
                        <span>{statusMsg.text}</span>
                    </div>
                )}

                {/* ── DUPLICATE CONFLICT CARD ── */}
                {statusMsg?.type === 'conflict' && duplicateRecord && (
                    <div style={{
                        margin: '0 1.5rem 1.25rem', padding: '1.25rem', borderRadius: '16px',
                        background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
                        border: '2px solid #f59e0b', boxShadow: '0 4px 20px rgba(245,158,11,0.15)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '1rem', color: '#92400e' }}>
                                    Existing Application Found
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '2px' }}>
                                    We found an inquiry already registered with this phone/email.
                                </div>
                            </div>
                        </div>

                        {/* Existing record summary */}
                        <div style={{
                            background: 'white', borderRadius: '10px', padding: '10px 14px',
                            marginBottom: '14px', fontSize: '0.82rem', color: '#374151',
                            border: '1px solid #fde68a',
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <div><span style={{ color: '#9ca3af' }}>Name:</span> <strong>{duplicateRecord.name}</strong></div>
                                <div><span style={{ color: '#9ca3af' }}>Phone:</span> <strong>{duplicateRecord.phone}</strong></div>
                                <div><span style={{ color: '#9ca3af' }}>Email:</span> <strong>{duplicateRecord.email}</strong></div>
                                <div><span style={{ color: '#9ca3af' }}>Status:</span>{' '}
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: '700',
                                        background: duplicateRecord.status === 'New' ? '#dbeafe' : duplicateRecord.status === 'Approved' ? '#dcfce7' : '#f3f4f6',
                                        color: duplicateRecord.status === 'New' ? '#1d4ed8' : duplicateRecord.status === 'Approved' ? '#15803d' : '#374151',
                                    }}>{duplicateRecord.status}</span>
                                </div>
                                <div><span style={{ color: '#9ca3af' }}>Applied On:</span> <strong>{duplicateRecord.date ? new Date(duplicateRecord.date).toLocaleDateString('en-IN') : 'N/A'}</strong></div>
                                {duplicateRecord.reapplyCount > 0 && (
                                    <div><span style={{ color: '#9ca3af' }}>Re-applied:</span> <strong>{duplicateRecord.reapplyCount}x</strong></div>
                                )}
                            </div>
                            {duplicateRecord.targetLocations?.length > 0 && (
                                <div style={{ marginTop: '8px' }}>
                                    <span style={{ color: '#9ca3af' }}>Existing Targets:</span>{' '}
                                    <strong>{duplicateRecord.targetLocations.map(l => `${l.city} (${l.state})`).join(', ')}</strong>
                                </div>
                            )}
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#78350f', marginBottom: '14px', fontWeight: '500' }}>
                            What would you like to do?
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={handleMerge}
                                disabled={isSubmitting}
                                style={{
                                    padding: '10px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: 'white', fontWeight: '700', fontSize: '0.875rem',
                                    boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                }}
                            >
                                🔄 Update My Existing Application
                                <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>(Merges new locations & info)</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitNew}
                                disabled={isSubmitting}
                                style={{
                                    padding: '10px 16px', border: '1.5px solid #d97706', borderRadius: '10px', cursor: 'pointer',
                                    background: 'white', color: '#92400e', fontWeight: '600', fontSize: '0.875rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                }}
                            >
                                ➕ Submit as New Inquiry (Separate Thread)
                            </button>
                            <button
                                type="button"
                                onClick={() => { setDuplicateRecord(null); setPendingFormData(null); setStatusMsg(null); }}
                                style={{
                                    padding: '8px', border: 'none', background: 'none',
                                    color: '#78350f', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline',
                                }}
                            >
                                ← Cancel & Edit My Form
                            </button>
                        </div>
                    </div>
                )}

                <div className={styles.formContent} style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                    <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                        {/* General Information */}
                        <div>
                            <h3 className={styles.sectionTitle}>General Information</h3>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Your Name</label>
                                    <input type="text" className={styles.input} placeholder="Enter your full name"
                                        value={form.name} onChange={e => setField('name', e.target.value)} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Your Email</label>
                                    <input type="email" className={styles.input} placeholder="Enter your email address"
                                        value={form.email} onChange={e => setField('email', e.target.value)} required />
                                </div>
                            </div>
                            <div className={styles.fullWidth}>
                                <label className={styles.label}>Your Phone</label>
                                <input 
                                    type="tel" 
                                    className={styles.input} 
                                    placeholder="e.g. 9876543210"
                                    value={form.phone} 
                                    onChange={e => setField('phone', e.target.value.replace(/[^0-9+\s-]/g, ''))} 
                                    required 
                                />
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>City</label>
                                    <input type="text" className={styles.input} placeholder="City"
                                        value={form.city} onChange={e => setField('city', e.target.value)} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>State</label>
                                    <select className={styles.select} value={form.state} onChange={e => setField('state', e.target.value)}>
                                        <option value="">Select State</option>
                                        {INDIA_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Target Locations */}
                            <div style={{ marginTop: '1.25rem', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <h4 style={{ color: '#000', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>📍 Target Locations for Franchise</h4>
                                <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '12px' }}>
                                    Add the cities or states where you are interested in opening the franchise outlet.
                                </p>
                                {targetLocations.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                        {targetLocations.map((loc, idx) => (
                                            <div key={idx} style={{ background: '#0ea5e9', color: '#fff', padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                                <span>{loc.city}, {loc.state}</span>
                                                <button type="button" onClick={() => setTargetLocations(prev => prev.filter((_, i) => i !== idx))}
                                                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center' }}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                                    <div className={styles.formGroup} style={{ margin: 0 }}>
                                        <label className={styles.label} style={{ fontSize: '0.7rem' }}>City</label>
                                        <input type="text" value={tempCity} onChange={e => setTempCity(e.target.value)}
                                            placeholder="e.g. Bangalore" className={styles.input} style={{ height: '36px', fontSize: '0.85rem', margin: 0 }} />
                                    </div>
                                    <div className={styles.formGroup} style={{ margin: 0 }}>
                                        <label className={styles.label} style={{ fontSize: '0.7rem' }}>State</label>
                                        <select value={tempState} onChange={e => setTempState(e.target.value)}
                                            className={styles.select} style={{ height: '36px', padding: '0 8px', fontSize: '0.85rem', margin: 0 }}>
                                            <option value="">Select State</option>
                                            {INDIA_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <button type="button" onClick={() => {
                                        if (tempCity.trim() && tempState) {
                                            setTargetLocations(prev => [...prev, { city: tempCity.trim(), state: tempState }]);
                                            setTempCity(''); setTempState('');
                                        }
                                    }} style={{ background: '#25d366', color: '#fff', border: 'none', height: '36px', padding: '0 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                        + Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Business Experience */}
                        <div>
                            <h3 className={styles.sectionTitle}>Business / Work Experience</h3>
                            <div className={styles.fullWidth}>
                                <label className={styles.label}>Current Job / Business</label>
                                <input type="text" className={styles.input} placeholder="Describe your current role"
                                    value={form.currentJob} onChange={e => setField('currentJob', e.target.value)} />
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label} style={{ marginBottom: '0.5rem' }}>Have You Ever Owned A Business?</label>
                                    <div className={styles.radioGroup}>
                                        <label className={styles.radioLabel}><input type="radio" name="ownedBusiness" value="yes" checked={form.ownedBusiness === 'yes'} onChange={() => setField('ownedBusiness', 'yes')} /> Yes</label>
                                        <label className={styles.radioLabel}><input type="radio" name="ownedBusiness" value="no" checked={form.ownedBusiness === 'no'} onChange={() => setField('ownedBusiness', 'no')} /> No</label>
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label} style={{ marginBottom: '0.5rem' }}>Have You Ever Been A Franchisee?</label>
                                    <div className={styles.radioGroup}>
                                        <label className={styles.radioLabel}><input type="radio" name="franchisee" value="yes" checked={form.franchisee === 'yes'} onChange={() => setField('franchisee', 'yes')} /> Yes</label>
                                        <label className={styles.radioLabel}><input type="radio" name="franchisee" value="no" checked={form.franchisee === 'no'} onChange={() => setField('franchisee', 'no')} /> No</label>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.fullWidth}>
                                <label className={styles.label}>If Yes, What Type?</label>
                                <input type="text" className={styles.input} placeholder="e.g. Food & Beverage"
                                    value={form.franchiseType} onChange={e => setField('franchiseType', e.target.value)} />
                            </div>
                        </div>
                    </form>
                </div>

                <div className={styles.actions} style={{ 
                    padding: '0.8rem 1.5rem', 
                    borderTop: '1px solid #f1f5f9', 
                    background: '#f8fafc',
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    flexShrink: 0
                }}>
                    <button type="button" className={styles.resetBtn} style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }} onClick={resetAll}>Reset</button>
                    {onClose && (
                        <button type="button" className={styles.resetBtn} style={{ border: '1px solid #cbd5e1', padding: '0.5rem 0.9rem', fontSize: '0.9rem', fontWeight: 'bold' }} onClick={onClose} title="Close Form">✕</button>
                    )}
                    <button type="button" className={styles.submitBtn} style={{ padding: '0.6rem 1.8rem', fontSize: '0.88rem' }} disabled={isSubmitting} onClick={handleSubmit}>
                        {isSubmitting ? 'Checking...' : 'Submit'}
                    </button>
                </div>
            </div>
        </>
    );
}
