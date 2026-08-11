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
    const [currentAddress, setCurrentAddress] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
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
                setCurrentAddress(match.currentAddress || '');
                setEmergencyContact(match.emergencyContact || '');
                setEmergencyPhone(match.emergencyPhone || '');
                setBankName(match.bankName || '');
                setAccountNumber(match.accountNumber || '');
                setIfscCode(match.ifscCode || '');
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
                    currentAddress,
                    emergencyContact,
                    emergencyPhone,
                    bankName,
                    accountNumber,
                    ifscCode,
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

                        <form onSubmit={handleSave}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nickname</label>
                                <input className={styles.input} type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Phone Number</label>
                                <input className={styles.input} type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Current Address</label>
                                <textarea className={styles.textarea} value={currentAddress} onChange={(e) => setCurrentAddress(e.target.value)} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Emergency Contact Name</label>
                                <input className={styles.input} type="text" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Emergency Phone</label>
                                <input className={styles.input} type="text" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} required />
                            </div>
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

                            <h3 style={{ marginTop: '1.5rem', color: '#818cf8', fontSize: '1.1rem' }}>Bank Account</h3>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Bank Name</label>
                                <input className={styles.input} type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Account Number</label>
                                <input className={styles.input} type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>IFSC Code</label>
                                <input className={styles.input} type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} required />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" disabled={submitting} className={styles.submitBtn} style={{ flex: 2, marginTop: 0 }}>
                                    {submitting ? 'Submitting...' : 'Request Changes'}
                                </button>
                                <button type="button" onClick={() => setStaffInfo(null)} className={styles.submitBtn} style={{ flex: 1, marginTop: 0, background: '#64748b' }}>
                                    Back
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
