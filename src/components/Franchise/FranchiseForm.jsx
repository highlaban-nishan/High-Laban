import React, { useState, useEffect } from 'react';
import styles from './FranchiseForm.module.css';
import db from '../../utils/db';
import { FaTimes } from 'react-icons/fa';

export default function FranchiseForm({ isOpen, onClose, isModal = true }) {
    // Prevent background scrolling when open
    useEffect(() => {
        if (isModal) {
            if (isOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, isModal]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Collect form data
        const formData = {
            name: e.target.querySelector('input[placeholder="vazir"]').value,
            email: e.target.querySelector('input[placeholder="vazir@example.com"]').value,
            phone: e.target.querySelector('input[placeholder="+91 98765 43210"]').value,
            street: e.target.querySelector('input[placeholder="Street Address"]').value,
            city: e.target.querySelectorAll('input[placeholder="City"]')[0].value,
            state: e.target.querySelector('select').value,
            pincode: e.target.querySelector('input[placeholder="110001"]').value,
            currentJob: e.target.querySelector('input[placeholder="Describe your current role"]').value,
            ownedBusiness: e.target.querySelector('input[name="ownedBusiness"]:checked')?.value || 'no',
            franchisee: e.target.querySelector('input[name="franchisee"]:checked')?.value || 'no',
            franchiseType: e.target.querySelector('input[placeholder="e.g. Food & Beverage"]').value,
            locationCity: e.target.querySelectorAll('input[placeholder="City"]')[1].value,
            preference: e.target.querySelector('input[placeholder="Preferred area"]').value,
            ownSpace: e.target.querySelector('#ownSpace').checked ? 'yes' : 'no',
            shopDescription: e.target.querySelector('textarea').value,
            area: e.target.querySelector('input[placeholder="e.g. 500"]').value,
            frontage: e.target.querySelector('input[placeholder="e.g. 20 ft"]').value,
            demographics: e.target.querySelector('input[placeholder="Residential, Commercial, Student area..."]').value,
        };

        try {
            // 1. Save to Database
            await db.addFranchiseInquiry(formData);

            // 2. Open Mail Client (as per request)
            const subject = `Franchise Inquiry from ${formData.name}`;
            const body = `Name: ${formData.name}%0D%0AEmail: ${formData.email}%0D%0APhone: ${formData.phone}%0D%0ACity: ${formData.city}%0D%0AState: ${formData.state}`;
            window.location.href = `mailto:wazeert13@gmail.com?subject=${subject}&body=${body}`;

            alert("Thank you! Your inquiry has been submitted.");
            if (onClose) onClose();
            e.target.reset(); // Reset form if inline
        } catch (error) {
            console.error(error);
            alert("Error submitting form. Please try again.");
        }
    };

    // If modal is closed, don't render anything (unless inline, which always renders)
    if (isModal && !isOpen) return null;

    return (
        <>
            {isModal && <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose}></div>}
            <div className={isModal ? `${styles.drawer} ${isOpen ? styles.open : ''}` : styles.inlineContainer}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Franchise Queries</h2>
                    {isModal && (
                        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                            <FaTimes />
                        </button>
                    )}
                </div>

                <form className={styles.formContent} onSubmit={handleSubmit}>
                    {/* General Information */}
                    <div>
                        <h3 className={styles.sectionTitle}>General Information</h3>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Your Name</label>
                                <input type="text" className={styles.input} placeholder="vazir" required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Your Email</label>
                                <input type="email" className={styles.input} placeholder="vazir@example.com" required />
                            </div>
                        </div>
                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Your Phone</label>
                            <input type="tel" className={styles.input} placeholder="+91 98765 43210" required />
                        </div>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Street</label>
                                <input type="text" className={styles.input} placeholder="Street Address" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>City</label>
                                <input type="text" className={styles.input} placeholder="City" />
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>State</label>
                                <select className={styles.select}>
                                    <option value="">Select State</option>
                                    <option value="DL">Delhi</option>
                                    <option value="MH">Maharashtra</option>
                                    <option value="KA">Karnataka</option>
                                    <option value="TN">Tamil Nadu</option>
                                    <option value="KL">Kerala</option>
                                    {/* Add more as needed */}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Pincode</label>
                                <input type="text" className={styles.input} placeholder="110001" />
                            </div>
                        </div>
                    </div>

                    {/* Business Experience */}
                    <div>
                        <h3 className={styles.sectionTitle}>Business / Work Experience</h3>
                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Current Job / Business</label>
                            <input type="text" className={styles.input} placeholder="Describe your current role" />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label className={styles.label} style={{ marginBottom: '0.5rem' }}>Have You Ever Owned A Business?</label>
                                <div className={styles.radioGroup}>
                                    <label className={styles.radioLabel}><input type="radio" name="ownedBusiness" value="yes" /> Yes</label>
                                    <label className={styles.radioLabel}><input type="radio" name="ownedBusiness" value="no" defaultChecked /> No</label>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label} style={{ marginBottom: '0.5rem' }}>Have You Ever Been A Franchisee?</label>
                                <div className={styles.radioGroup}>
                                    <label className={styles.radioLabel}><input type="radio" name="franchisee" value="yes" /> Yes</label>
                                    <label className={styles.radioLabel}><input type="radio" name="franchisee" value="no" defaultChecked /> No</label>
                                </div>
                            </div>
                        </div>

                        <div className={styles.fullWidth}>
                            <label className={styles.label}>If Yes, What Type?</label>
                            <input type="text" className={styles.input} placeholder="e.g. Food & Beverage" />
                        </div>
                    </div>

                    {/* Location Information */}
                    <div>
                        <h3 className={styles.sectionTitle}>Location Information</h3>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>City</label>
                                <input type="text" className={styles.input} placeholder="City" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Location Preference</label>
                                <input type="text" className={styles.input} placeholder="Preferred area" />
                            </div>
                        </div>

                        <div className={styles.checkboxGroup}>
                            <input type="checkbox" id="ownSpace" />
                            <label htmlFor="ownSpace" className={styles.checkboxLabel}>Do you own an existing commercial space?</label>
                        </div>

                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Describe The Shop Location</label>
                            <textarea className={styles.textarea} placeholder="Corner Shop, Main Road facing, etc."></textarea>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Retail Space Area (sq ft)</label>
                                <input type="number" className={styles.input} placeholder="e.g. 500" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Frontage of the Retail Space</label>
                                <input type="text" className={styles.input} placeholder="e.g. 20 ft" />
                            </div>
                        </div>

                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Demographics of the Location</label>
                            <input type="text" className={styles.input} placeholder="Residential, Commercial, Student area..." />
                        </div>
                    </div>

                    {/* Agreement */}
                    <div style={{ marginTop: '1rem' }}>
                        <div className={styles.checkboxGroup}>
                            <input type="checkbox" id="certify" required />
                            <label htmlFor="certify" className={styles.checkboxLabel} style={{ fontSize: '0.8rem' }}>By submitting this form, I certify that the information provided is true and correct.</label>
                        </div>
                        <div className={styles.checkboxGroup}>
                            <input type="checkbox" id="promo" />
                            <label htmlFor="promo" className={styles.checkboxLabel} style={{ fontSize: '0.8rem' }}>I agree to receive promotions and newsletters related to HighLaban.</label>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.resetBtn} onClick={() => document.querySelector('form').reset()}>Reset</button>
                        <button type="submit" className={styles.submitBtn}>Submit</button>
                    </div>
                </form>
            </div>
        </>
    );
}
