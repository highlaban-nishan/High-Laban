import React, { useState, useEffect } from 'react';
import db from '../utils/db';
import styles from './WorkerDashboard.module.css';
import SEO from '../components/SEO/SEO';

const WorkerDashboard = () => {
    const user = db.getUser();
    const [staffInfo, setStaffInfo] = useState(null);
    const [trainingList, setTrainingList] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Edit form state
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [currentAddress, setCurrentAddress] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [tShirtSize, setTShirtSize] = useState('M');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowInstallBtn(false);
        }
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!user) return;
                const allStaff = await db.getStaff();
                const currentStaff = allStaff.find(
                    (s) => (s.email || '').toLowerCase().trim() === (user.email || '').toLowerCase().trim()
                );
                
                if (currentStaff) {
                    setStaffInfo(currentStaff);
                    // Initialize edit state
                    setNickname(currentStaff.nickname || '');
                    setPhone(currentStaff.phone || '');
                    setCurrentAddress(currentStaff.currentAddress || '');
                    setEmergencyContact(currentStaff.emergencyContact || '');
                    setEmergencyPhone(currentStaff.emergencyPhone || '');
                    setBankName(currentStaff.bankName || '');
                    setAccountNumber(currentStaff.accountNumber || '');
                    setIfscCode(currentStaff.ifscCode || '');
                    setTShirtSize(currentStaff.tShirtSize || 'M');
                }

                // Fetch checklists to filter training status
                const allChecklists = await db.getChecklists('worker_training');
                // Find training info for this worker
                const workerTraining = allChecklists.filter(c => c.workerId === (currentStaff?.id || ''));
                setTrainingList(workerTraining);
            } catch (err) {
                console.error("Error loading worker data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = () => {
        db.logout();
        window.location.href = '/login';
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const editRequest = {
                staffId: staffInfo?.id || '',
                staffName: staffInfo?.fullName || user?.name || '',
                email: user.email,
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
            alert("Your profile edit request has been submitted for Admin approval!");
            setIsEditModalOpen(false);
        } catch (err) {
            alert("Error submitting request: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.dashboardContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <h3>Loading worker dashboard...</h3>
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            <SEO title="Worker Portal | High Laban" description="View and manage your worker profile and training log." />
            
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Worker Portal</h1>
                    <p style={{ color: '#94a3b8' }}>Welcome, {staffInfo?.fullName || user?.name || 'Worker'}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {showInstallBtn && (
                        <button
                            onClick={async () => {
                                if (deferredPrompt) {
                                    deferredPrompt.prompt();
                                    const { outcome } = await deferredPrompt.userChoice;
                                    if (outcome === 'accepted') {
                                        setDeferredPrompt(null);
                                        setShowInstallBtn(false);
                                    }
                                } else {
                                    if (Notification.permission === 'default') {
                                        const status = await Notification.requestPermission();
                                        if (status === 'granted') {
                                            alert('Notifications enabled successfully!');
                                        }
                                    } else {
                                        alert('App is already installed or shortcuts are configured!');
                                    }
                                }
                            }}
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                border: 'none',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                            }}
                        >
                            📲 Install App & Alerts
                        </button>
                    )}
                    <a href="/complaint" className={styles.editBtn} style={{ margin: 0, textDecoration: 'none', display: 'flex', alignItems: 'center', backgroundColor: '#dc2626', color: '#fff' }}>
                        ⚠️ File Anonymous Complaint
                    </a>
                    <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
                </div>
            </header>

            <div className={styles.grid}>
                {/* Profile Card */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>My Profile Details</h2>
                    {staffInfo ? (
                        <>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Full Name:</span>
                                <span className={styles.infoValue}>{staffInfo.fullName}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Nickname / Alias:</span>
                                <span className={styles.infoValue}>{staffInfo.nickname || 'N/A'}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Role / Position:</span>
                                <span className={styles.infoValue}>{staffInfo.position || 'N/A'}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Phone:</span>
                                <span className={styles.infoValue}>{staffInfo.phone}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Current Address:</span>
                                <span className={styles.infoValue}>{staffInfo.currentAddress || 'N/A'}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Emergency Contact:</span>
                                <span className={styles.infoValue}>{staffInfo.emergencyContact || 'N/A'}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>T-Shirt Size:</span>
                                <span className={styles.infoValue}>{staffInfo.tShirtSize || 'M'}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Portal Email:</span>
                                <span className={styles.infoValue}>{staffInfo.email || 'N/A'}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Portal Password:</span>
                                <span className={styles.infoValue} style={{ color: '#009ceb', fontWeight: 'bold', fontFamily: 'monospace' }}>{staffInfo.password || 'Laban@Staff2026'}</span>
                            </div>
                            
                            <h3 style={{ marginTop: '1.5rem', color: '#818cf8', fontSize: '1.1rem' }}>Bank details</h3>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Bank Name:</span>
                                <span className={styles.infoValue}>{staffInfo.bankName || 'N/A'}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>Account Number:</span>
                                <span className={styles.infoValue}>{staffInfo.accountNumber || 'N/A'}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.infoLabel}>IFSC Code:</span>
                                <span className={styles.infoValue}>{staffInfo.ifscCode || 'N/A'}</span>
                            </div>

                            <button onClick={() => setIsEditModalOpen(true)} className={styles.editBtn}>
                                Edit Details & Bank Account
                            </button>
                        </>
                    ) : (
                        <p style={{ color: '#ef4444' }}>No active staff record found matching {user.email}. Please ask an Admin to register you in HR Staff.</p>
                    )}
                </div>

                {/* Training Checklist Card */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>My Training Checklist</h2>
                    <div className={styles.checklistGrid}>
                        {trainingList.length > 0 ? (
                            trainingList.map((item) => (
                                <div key={item.id} className={styles.checklistItem}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold' }}>{item.moduleName || 'Training Module'}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Updated: {new Date(item.updatedAt).toLocaleDateString()}</div>
                                    </div>
                                    <span className={`${styles.checklistStatus} ${item.completed ? styles.statusDone : styles.statusPending}`}>
                                        {item.completed ? 'Completed' : 'Pending'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>
                                No active training checklists assigned yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>Request Profile Changes</h2>
                        <form onSubmit={handleSubmitEdit}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Nickname</label>
                                <input className={styles.input} type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Phone</label>
                                <input className={styles.input} type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Current Address</label>
                                <input className={styles.input} type="text" value={currentAddress} onChange={(e) => setCurrentAddress(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Emergency Contact Name</label>
                                <input className={styles.input} type="text" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Emergency Phone</label>
                                <input className={styles.input} type="text" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>T-Shirt Size</label>
                                <select className={styles.input} value={tShirtSize} onChange={(e) => setTShirtSize(e.target.value)}>
                                    <option value="S">Small (S)</option>
                                    <option value="M">Medium (M)</option>
                                    <option value="L">Large (L)</option>
                                    <option value="XL">Extra Large (XL)</option>
                                    <option value="XXL">Double Extra Large (XXL)</option>
                                </select>
                            </div>

                            <h3 style={{ marginTop: '1.5rem', color: '#818cf8', fontSize: '1rem' }}>Bank Account Information</h3>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Bank Name</label>
                                <input className={styles.input} type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Account Number</label>
                                <input className={styles.input} type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>IFSC Code</label>
                                <input className={styles.input} type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} required />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkerDashboard;
