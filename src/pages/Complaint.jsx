import React, { useState, useEffect } from 'react';
import db from '../utils/db';
import styles from './Complaint.module.css';
import SEO from '../components/SEO/SEO';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

export default function Complaint() {
    const [category, setCategory] = useState('Workplace Condition');
    const [branch, setBranch] = useState('');
    const [reporterName, setReporterName] = useState('');
    const [description, setDescription] = useState('');
    const [outlets, setOutlets] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        db.getFranchises().then(list => setOutlets(list)).catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = {
                category,
                branch,
                reporterName: reporterName.trim() || 'Anonymous',
                description,
                status: 'Unresolved'
            };
            await db.addComplaint(data);
            setSuccess(true);
        } catch (err) {
            alert('Error submitting complaint: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <SEO title="Anonymous Complaint | High Laban" description="Submit an anonymous concern to High Laban Administration." />
            
            <div className={styles.card}>
                {success ? (
                    <div className={styles.successState}>
                        <div className={styles.successIcon}>
                            <FiCheckCircle />
                        </div>
                        <h2 className={styles.title}>Complaint Submitted Anonymously</h2>
                        <p className={styles.subtitle} style={{ marginBottom: 0 }}>
                            Thank you for sharing your concern. It has been recorded securely and will be reviewed by senior administration. No personal details were tracked.
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#f59e0b' }}>
                            <FiAlertTriangle size={32} />
                        </div>
                        <h2 className={styles.title}>Anonymous Hotline / Complaint</h2>
                        <p className={styles.subtitle}>
                            Your identity is completely protected. Use this form to report workplace issues, safety concerns, or feedback directly to administration.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Concern Category *</label>
                                <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option value="Workplace Condition">Workplace Condition / Safety</option>
                                    <option value="Food Quality / Hygiene">Food Quality / Hygiene Standards</option>
                                    <option value="Co-worker Behavior">Harassment / Co-worker Behavior</option>
                                    <option value="Compensation & Hours">Salary / Punctuality / Hours</option>
                                    <option value="Other / General Concern">Other / General Feedback</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Your Name (Optional - Leave blank to remain completely anonymous)</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={reporterName}
                                    onChange={(e) => setReporterName(e.target.value)}
                                    placeholder="Enter your name (Optional)"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        color: 'white',
                                        outline: 'none',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Associated Branch / Outlet (Optional)</label>
                                <select className={styles.select} value={branch} onChange={(e) => setBranch(e.target.value)}>
                                    <option value="">-- General / Corporate --</option>
                                    {outlets.map(o => (
                                        <option key={o.id} value={o.outletName}>{o.outletName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Description of Concern *</label>
                                <textarea
                                    className={styles.textarea}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Please provide as much detail as possible to help us investigate..."
                                    required
                                />
                            </div>

                            <button type="submit" disabled={submitting} className={styles.submitBtn}>
                                {submitting ? 'Submitting securely...' : 'Submit Complaint'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
