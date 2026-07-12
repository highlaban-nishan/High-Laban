import React, { useState } from 'react';
import { FiUploadCloud, FiCheckCircle, FiFileText, FiTrash2 } from 'react-icons/fi';
import { Helmet } from 'react-helmet-async';
import styles from './WorkerApplication.module.css';
import db from '../utils/db';
import { uploadMedia } from '../utils/storage';
import logo from '../assets/logo.png';

const WorkerApplication = () => {
    // Form fields
    const [fullName, setFullName] = useState('');
    const [mobile, setMobile] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Male');
    const [nativePlace, setNativePlace] = useState('');
    const [currentPlace, setCurrentPlace] = useState('');
    const [currentlyWorking, setCurrentlyWorking] = useState('No');
    const [currentPosition, setCurrentPosition] = useState('');
    const [appliedPosition, setAppliedPosition] = useState('Waiter');
    
    // File upload state (Multiple files support)
    const [selectedFiles, setSelectedFiles] = useState([]); // Array of { id, file, name }
    
    // Page states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const newFiles = filesArray.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file: file,
                name: file.name
            }));
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (id) => {
        setSelectedFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        
        try {
            // 1. Upload all documents
            const uploadedDocs = [];
            for (let i = 0; i < selectedFiles.length; i++) {
                const item = selectedFiles[i];
                setSubmitStatus(`Uploading document ${i + 1} of ${selectedFiles.length}: ${item.name}...`);
                const url = await uploadMedia(item.file);
                uploadedDocs.push({
                    name: item.name,
                    url: url
                });
            }

            // 2. Save Application Record in Firestore
            setSubmitStatus('Saving application profile...');
            const applicationData = {
                fullName: fullName.trim(),
                phone: mobile.trim(),
                age: parseInt(age) || 18,
                gender,
                nativePlace: nativePlace.trim(),
                currentPlace: currentPlace.trim(),
                currentlyWorking: currentlyWorking === 'Yes',
                currentPosition: currentlyWorking === 'Yes' ? currentPosition.trim() : '',
                appliedPosition,
                documents: uploadedDocs,
                status: 'Pending', // Pending, Interview Scheduled, Not Fit, Selected, Coming, Joined
                interviewScore: '',
                interviewNotes: '',
                createdAt: new Date().toISOString()
            };

            await db.addWorkerApplication(applicationData);
            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to submit application. Please check your internet connection.');
        } finally {
            setIsSubmitting(false);
            setSubmitStatus('');
        }
    };

    if (success) {
        return (
            <div className={styles.container}>
                <Helmet>
                    <title>Application Submitted | highlaban</title>
                </Helmet>
                <div className={styles.formCard}>
                    <div className={styles.successCard}>
                        <div className={styles.successIcon}>
                            <FiCheckCircle />
                        </div>
                        <h2 className={styles.successTitle}>Application Received!</h2>
                        <p className={styles.successDesc}>
                            Thank you, <strong>{fullName}</strong>. Your details and documents have been successfully sent to the highlaban HR department. Our team will review your application and contact you soon.
                        </p>
                        <a href="/" className={styles.backHomeBtn}>Go back to Home</a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Helmet>
                <title>Apply for a Position | highlaban</title>
                <meta name="description" content="Apply for worker and staff positions at highlaban." />
            </Helmet>

            <div className={styles.formCard}>
                <div className={styles.header}>
                    <img src={logo} alt="highlaban Logo" className={styles.logo} />
                    <h1 className={styles.title}>Work With Us</h1>
                    <p className={styles.subtitle}>Join our growing highlaban dessert family! Fill out this form to apply.</p>
                </div>

                {error && (
                    <div className={styles.alert}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* SECTION 1: PERSONAL INFO */}
                    <div className={styles.sectionTitle}>1. Personal Info</div>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Full Name *</label>
                            <input className={styles.input} type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Your full name" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Mobile Number *</label>
                            <input className={styles.input} type="tel" pattern="[0-9]{10}" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))} required placeholder="10-digit number" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Age *</label>
                            <input className={styles.input} type="number" min="18" max="70" value={age} onChange={e => setAge(e.target.value)} required placeholder="e.g. 24" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Gender *</label>
                            <select className={styles.input} value={gender} onChange={e => setGender(e.target.value)}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* SECTION 2: LOCATION & ORIGIN */}
                    <div className={styles.sectionTitle}>2. Address & Background</div>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Native Place / Hometown *</label>
                            <input className={styles.input} type="text" value={nativePlace} onChange={e => setNativePlace(e.target.value)} required placeholder="e.g. Guwahati, Assam" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Current City / Location *</label>
                            <input className={styles.input} type="text" value={currentPlace} onChange={e => setCurrentPlace(e.target.value)} required placeholder="e.g. Indiranagar, Bangalore" />
                        </div>
                    </div>

                    {/* SECTION 3: WORK HISTORY & POSITION */}
                    <div className={styles.sectionTitle}>3. Professional Details</div>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Are you currently working? *</label>
                            <select className={styles.input} value={currentlyWorking} onChange={e => setCurrentlyWorking(e.target.value)}>
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                        
                        {currentlyWorking === 'Yes' && (
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Current Position / Job Role *</label>
                                <input className={styles.input} type="text" value={currentPosition} onChange={e => setCurrentPosition(e.target.value)} required={currentlyWorking === 'Yes'} placeholder="e.g. Helper at Cafe" />
                            </div>
                        )}

                        <div className={`${styles.formGroup} ${currentlyWorking !== 'Yes' ? styles.fullWidth : ''}`}>
                            <label className={styles.label}>Position Applied For *</label>
                            <select className={styles.input} value={appliedPosition} onChange={e => setAppliedPosition(e.target.value)}>
                                <option value="Waiter">Waiter / Waitress</option>
                                <option value="Chef">Chef / Cook</option>
                                <option value="Cashier">Cashier</option>
                                <option value="Manager">Manager</option>
                                <option value="Helper">Kitchen Helper</option>
                                <option value="Delivery">Delivery Boy</option>
                                <option value="Cleaner">Cleaner / Steward</option>
                                <option value="Other">Other Position</option>
                            </select>
                        </div>
                    </div>

                    {/* SECTION 4: FILE UPLOADS */}
                    <div className={styles.sectionTitle}>4. Documents & CV/Resume</div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Upload CV, Resume, or Aadhaar/ID copies *</label>
                        <div className={styles.fileUploadZone} onClick={() => document.getElementById('multiple-file-input').click()}>
                            <FiUploadCloud className={styles.fileIcon} />
                            <span className={styles.fileText}>Choose Multiple Files / Photos</span>
                            <span className={styles.fileSubtext}>Select all files to upload (PDF, JPEG, PNG)</span>
                            <input 
                                id="multiple-file-input" 
                                type="file" 
                                onChange={handleFileChange} 
                                style={{ display: 'none' }} 
                                multiple 
                            />
                        </div>
                        
                        {selectedFiles.length > 0 && (
                            <div className={styles.fileList}>
                                {selectedFiles.map((item) => (
                                    <div key={item.id} className={styles.fileItem}>
                                        <div className={styles.fileInfo}>
                                            <FiFileText className={styles.fileItemIcon} />
                                            <span className={styles.fileItemName}>{item.name}</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            className={styles.fileRemoveBtn} 
                                            onClick={() => removeFile(item.id)}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className={styles.submitBtn} type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <span className={styles.spinner}></span>
                                {submitStatus || 'Sending Application...'}
                            </>
                        ) : (
                            'Submit Application'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WorkerApplication;
