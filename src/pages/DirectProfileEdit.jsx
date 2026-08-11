import React, { useState, useEffect } from 'react';
import db from '../utils/db';
import styles from './Complaint.module.css'; // Reuse same layout styling
import SEO from '../components/SEO/SEO';
import { FiUser, FiCheckCircle } from 'react-icons/fi';

export default function DirectProfileEdit() {
    const [lookupVal, setLookupVal] = useState('');
    const [staffInfo, setStaffInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Form fields
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [currentAddress, setCurrentAddress] = useState('');
    const [permanentAddress, setPermanentAddress] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [upiId, setUpiId] = useState('');
    const [tShirtSize, setTShirtSize] = useState('M');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleLookup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearched(true);
        try {
            const allStaff = await db.getStaff();
            const cleanLookup = lookupVal.toLowerCase().trim();
            const match = allStaff.find(
                (s) => (s.email || '').toLowerCase().trim() === cleanLookup || 
                       (s.phone || '').replace(/\D/g, '').includes(cleanLookup.replace(/\D/g, ''))
            );

            if (match) {
                setStaffInfo(match);
                setNickname(match.nickname || '');
                setPhone(match.phone || '');
                setDob(match.dob || '');
                setBloodGroup(match.bloodGroup || '');
                setCurrentAddress(match.currentAddress || '');
                setPermanentAddress(match.permanentAddress || '');
                setEmergencyContact(match.emergencyContact || '');
                setEmergencyPhone(match.emergencyPhone || '');
                setBankName(match.bankName || '');
                setAccountNumber(match.accountNumber || '');
                setIfscCode(match.ifscCode || '');
                setUpiId(match.upiId || '');
                setTShirtSize(match.tShirtSize || 'M');
            } else {
                setStaffInfo(null);
            }
        } catch (err) {
            alert('Lookup failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const editRequest = {
                staffId: staffInfo?.id || '',
                staffName: staffInfo?.fullName || '',
                email: staffInfo?.email || '',
                requestedChanges: {
                    nickname,
                    phone,
                    dob,
                    bloodGroup,
                    currentAddress,
                    permanentAddress,
                    emergencyContact,
                    emergencyPhone,
                    bankName,
                    accountNumber,
                    ifscCode,
                    upiId,
                    tShirtSize
                }
            };
            await db.addProfileEditRequest(editRequest);
            setSuccess(true);
        } catch (err) {
            alert('Error submitting request: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <SEO title="Fast Profile Edit | High Laban" description="Quickly edit and update your worker profile." />

            <div className={styles.card}>
                {success ? (
                    <div className={styles.successState}>
                        <div className={styles.successIcon}>
                            <FiCheckCircle />
                        </div>
                        <h2 className={styles.title}>Update Request Submitted</h2>
                        <p className={styles.subtitle} style={{ marginBottom: 0 }}>
                            Thank you. Your profile change request has been recorded. It will update in the system once approved by the HR administrator.
                        </p>
                    </div>
                ) : !staffInfo ? (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#38bdf8' }}>
                            <FiUser size={32} />
                        </div>
                        <h2 className={styles.title}>Fast Profile Edit</h2>
                        <p className={styles.subtitle}>
                            Enter your registered Email address or Phone number to find and edit your profile.
                        </p>

                        <form onSubmit={handleLookup}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email ID or Phone Number</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={lookupVal}
                                    onChange={(e) => setLookupVal(e.target.value)}
                                    placeholder="e.g. employee@gmail.com or 9876543210"
                                    required
                                />
                            </div>

                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? 'Looking up...' : 'Find Profile'}
                            </button>
                        </form>

                        {searched && !staffInfo && !loading && (
                            <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '1.5rem' }}>
                                No active employee record found. Please double check the details or contact Admin.
                            </p>
                        )}
                    </div>
                 ) : (
                    <div>
                        <h2 className={styles.title}>Edit Details: {staffInfo.fullName}</h2>
                        <p className={styles.subtitle}>Update the fields below. Admin approval is required for updates.</p>

                        {(() => {
                            const missing = [];
                            if (!nickname) missing.push('Nickname');
                            if (!dob) missing.push('Date of Birth');
                            if (!bloodGroup) missing.push('Blood Group');
                            if (!phone) missing.push('Phone');
                            if (!currentAddress) missing.push('Current Address');
                            if (!permanentAddress) missing.push('Permanent Address');
                            if (!emergencyContact) missing.push('Emergency Contact Name');
                            if (!emergencyPhone) missing.push('Emergency Phone');
                            if (!bankName) missing.push('Bank Name');
                            if (!accountNumber) missing.push('Account Number');
                            if (!ifscCode) missing.push('IFSC Code');
                            if (!upiId) missing.push('UPI ID');

                            return (
                                <>
                                    {missing.length > 0 && (
                                        <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                                            <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#fecaca' }}>⚠️ Profile Incomplete!</strong>
                                            Please fill in the missing fields: {missing.join(', ')}
                                        </div>
                                    )}

                                    <form onSubmit={handleSave}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Nickname {!nickname && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>(⚠️ Missing)</span>}</label>
                                                <input className={styles.input} type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Phone Number {!phone && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>(⚠️ Missing)</span>}</label>
                                                <input className={styles.input} type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Date of Birth {!dob && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>(⚠️ Missing)</span>}</label>
                                                <input className={styles.input} type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Blood Group {!bloodGroup && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>(⚠️ Missing)</span>}</label>
                                                <select className={styles.select} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} required>
                                                    <option value="">Select Group</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A-">A-</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B-">B-</option>
                                                    <option value="AB+">AB+</option>
                                                    <option value="AB-">AB-</option>
                                                    <option value="O+">O+</option>
                                                    <option value="O-">O-</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                            <label className={styles.label}>Current Address {!currentAddress && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>(⚠️ Missing)</span>}</label>
                                            <textarea className={styles.textarea} value={currentAddress} onChange={(e) => setCurrentAddress(e.target.value)} required />
                                        </div>

                                        <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                            <label className={styles.label}>Permanent Address {!permanentAddress && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>(⚠️ Missing)</span>}</label>
                                            <textarea className={styles.textarea} value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} required />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Emergency Contact Name {!emergencyContact && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>(⚠️ Missing)</span>}</label>
                                                <input className={styles.input} type="text" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} required />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Emergency Phone {!emergencyPhone && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>(⚠️ Missing)</span>}</label>
                                                <input className={styles.input} type="text" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} required />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>T-Shirt Size</label>
                                                <select className={styles.select} value={tShirtSize} onChange={(e) => setTShirtSize(e.target.value)}>
                                                    <option value="S">Small (S)</option>
                                                    <option value="M">Medium (M)</option>
                                                    <option value="L">Large (L)</option>
                                                    <option value="XL">Extra Large (XL)</option>
                                                    <option value="XXL">Double Extra Large (XXL)</option>
                                                </select>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>UPI ID for Quick Payouts {!upiId && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>(⚠️ Missing)</span>}</label>
                                                <input className={styles.input} type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} required placeholder="e.g. employee@okaxis" />
                                            </div>
                                        </div>

                                        <h3 style={{ marginTop: '2rem', color: '#818cf8', fontSize: '1.1rem', borderBottom: '1px solid #475569', paddingBottom: '0.5rem' }}>Bank Account Details</h3>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Bank Name {!bankName && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>(⚠️ Missing)</span>}</label>
                                                <input className={styles.input} type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Account Number {!accountNumber && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>(⚠️ Missing)</span>}</label>
                                                <input className={styles.input} type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
                                            </div>
                                        </div>

                                        <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                            <label className={styles.label}>IFSC Code {!ifscCode && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>(⚠️ Missing)</span>}</label>
                                            <input className={styles.input} type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} required />
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                            <button type="submit" disabled={submitting} className={styles.submitBtn} style={{ flex: 2, marginTop: 0 }}>
                                                {submitting ? 'Submitting...' : 'Request Changes'}
                                            </button>
                                            <button type="button" onClick={() => setStaffInfo(null)} className={styles.submitBtn} style={{ flex: 1, marginTop: 0, background: '#64748b' }}>
                                                Back
                                            </button>
                                        </div>
                                    </form>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}
