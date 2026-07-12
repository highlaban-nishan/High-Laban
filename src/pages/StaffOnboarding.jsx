import React, { useState } from 'react';
import { FiUploadCloud, FiCheckCircle, FiFileText } from 'react-icons/fi';
import { Helmet } from 'react-helmet-async';
import styles from './StaffOnboarding.module.css';
import db from '../utils/db';
import { uploadMedia } from '../utils/storage';
import logo from '../assets/logo.png';

const StaffOnboarding = () => {
    // Form fields
    const [fullName, setFullName] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('Female');
    const [bloodGroup, setBloodGroup] = useState('O+');
    const [mobile, setMobile] = useState('');
    const [alternateMobile, setAlternateMobile] = useState('');
    const [currentAddress, setCurrentAddress] = useState('');
    const [permanentAddress, setPermanentAddress] = useState('');
    const [sameAddress, setSameAddress] = useState(false);
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyRelation, setEmergencyRelation] = useState('Parent');
    const [emergencyNumber, setEmergencyNumber] = useState('');
    const [position, setPosition] = useState('Staff');
    
    // Bank Details
    const [bankName, setBankName] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankIfsc, setBankIfsc] = useState('');

    // Document files
    const [photoFile, setPhotoFile] = useState(null);
    const [aadhaarFile, setAadhaarFile] = useState(null);
    const [panFile, setPanFile] = useState(null);
    const [medicalFile, setMedicalFile] = useState(null);
    const [otherFiles, setOtherFiles] = useState([]);

    // Page states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e, setFile) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleOtherFilesChange = (e) => {
        if (e.target.files) {
            const chosen = Array.from(e.target.files).map(file => ({
                name: file.name,
                file: file
            }));
            setOtherFiles(prev => [...prev, ...chosen]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        
        try {
            // Upload Photo File
            let photoUrl = '';
            if (photoFile) {
                setSubmitStatus('Uploading employee profile photo...');
                photoUrl = await uploadMedia(photoFile);
            }

            // 1. Upload Aadhaar Card
            let aadhaarUrl = '';
            if (aadhaarFile) {
                setSubmitStatus('Uploading Aadhaar card document...');
                aadhaarUrl = await uploadMedia(aadhaarFile);
            }

            // 2. Upload PAN Card
            let panUrl = '';
            if (panFile) {
                setSubmitStatus('Uploading PAN card document...');
                panUrl = await uploadMedia(panFile);
            }

            // 3. Upload Medical Certificate
            let medicalUrl = '';
            if (medicalFile) {
                setSubmitStatus('Uploading medical certificate...');
                medicalUrl = await uploadMedia(medicalFile);
            }

            // Upload Other Documents
            const uploadedOtherDocs = [];
            for (let i = 0; i < otherFiles.length; i++) {
                setSubmitStatus(`Uploading additional document ${i + 1} of ${otherFiles.length}...`);
                const url = await uploadMedia(otherFiles[i].file);
                uploadedOtherDocs.push({ name: otherFiles[i].name, url });
            }

            // 4. Save to Firestore
            setSubmitStatus('Saving employee profile to HR directory...');
            
            const documents = [];
            if (photoUrl) documents.push({ name: 'Profile Photo', url: photoUrl });
            if (aadhaarUrl) documents.push({ name: 'Aadhaar Card', url: aadhaarUrl });
            if (panUrl) documents.push({ name: 'PAN Card', url: panUrl });
            if (medicalUrl) documents.push({ name: 'Medical Certificate', url: medicalUrl });
            uploadedOtherDocs.forEach(doc => documents.push(doc));

            const newEmployee = {
                fullName: fullName.trim(),
                nickname: (nickname.trim() || fullName.trim().split(' ')[0]).toUpperCase(),
                email: email.trim(),
                dob,
                gender,
                bloodGroup,
                phone: mobile.trim(),
                alternatePhone: alternateMobile.trim(),
                currentAddress: currentAddress.trim(),
                permanentAddress: sameAddress ? currentAddress.trim() : permanentAddress.trim(),
                emergencyContact: `${emergencyName.trim()} (${emergencyRelation})`,
                emergencyPhone: emergencyNumber.trim(),
                bankName: bankName.trim(),
                accountNumber: bankAccount.trim(),
                ifscCode: bankIfsc.trim(),
                photoUrl: photoUrl,
                aadhaarDocUrl: aadhaarUrl,
                aadhaarCollected: !!aadhaarUrl,
                panCollected: !!panUrl,
                medicalDocUrl: medicalUrl,
                medicalCollected: !!medicalUrl,
                documents: documents,
                status: 'Onboarding', // Mark as onboarding/review state
                position: position,
                joinDate: new Date().toISOString().split('T')[0]
            };

            await db.addStaff(newEmployee);
            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to submit onboarding form. Please check your network connection and try again.');
        } finally {
            setIsSubmitting(false);
            setSubmitStatus('');
        }
    };

    if (success) {
        return (
            <div className={styles.container}>
                <Helmet>
                    <title>Submission Successful | highlaban</title>
                </Helmet>
                <div className={styles.formCard}>
                    <div className={styles.successCard}>
                        <div className={styles.successIcon}>
                            <FiCheckCircle />
                        </div>
                        <h2 className={styles.successTitle}>Onboarding Form Submitted</h2>
                        <p className={styles.successDesc}>
                            Thank you, <strong>{fullName}</strong>. Your profile details and uploaded files have been safely registered with highlaban HR system. Our administration team will review your records shortly.
                        </p>
                        <a href="/" className={styles.backHomeBtn}>Go back to home</a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Helmet>
                <title>Staff Onboarding | highlaban</title>
                <meta name="description" content="Register your details as an employee with highlaban." />
            </Helmet>

            <div className={styles.formCard}>
                <div className={styles.header}>
                    <img src={logo} alt="highlaban Logo" className={styles.logo} />
                    <h1 className={styles.title}>Staff Onboarding Registry</h1>
                    <p className={styles.subtitle}>Please fill out the following details to register your profile with highlaban HR.</p>
                </div>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', border: '1px solid #fca5a5' }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* SECTION 1: PERSONAL DETAILS */}
                    <div className={styles.sectionTitle}>1. Personal Details</div>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Full Name *</label>
                            <input className={styles.input} type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="e.g. Rosemary Sangeipuinath" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nickname / Call Name</label>
                            <input className={styles.input} type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g. Rose" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email ID *</label>
                            <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="e.g. Rosemary@gmail.com" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Date of Birth *</label>
                            <input className={styles.input} type="date" value={dob} onChange={e => setDob(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Gender *</label>
                            <select className={styles.input} value={gender} onChange={e => setGender(e.target.value)}>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Blood Group *</label>
                            <select className={styles.input} value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                                <option value="O+">O+ (Positive)</option>
                                <option value="O-">O- (Negative)</option>
                                <option value="A+">A+ (Positive)</option>
                                <option value="A-">A- (Negative)</option>
                                <option value="B+">B+ (Positive)</option>
                                <option value="B-">B- (Negative)</option>
                                <option value="AB+">AB+ (Positive)</option>
                                <option value="AB-">AB- (Negative)</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Position *</label>
                            <select className={styles.input} value={position} onChange={e => setPosition(e.target.value)}>
                                <option value="Staff">Staff</option>
                                <option value="Chef">Chef / Cook</option>
                                <option value="Cashier">Cashier</option>
                                <option value="Manager">Manager</option>
                                <option value="Waiter">Waiter</option>
                                <option value="Delivery">Delivery Boy</option>
                                <option value="Helper">Kitchen Helper</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* SECTION 2: CONTACT DETAILS */}
                    <div className={styles.sectionTitle}>2. Contact Details</div>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Mobile Number *</label>
                            <input className={styles.input} type="tel" pattern="[0-9]{10}" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))} required placeholder="10-digit number" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Alternate Contact Number</label>
                            <input className={styles.input} type="tel" pattern="[0-9]{10}" value={alternateMobile} onChange={e => setAlternateMobile(e.target.value.replace(/\D/g, ''))} placeholder="10-digit number" />
                        </div>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>Current Address *</label>
                            <textarea className={`${styles.input} ${styles.textarea}`} value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} required placeholder="Full current residential address" />
                        </div>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <label className={styles.label}>Permanent Address *</label>
                                <label className={styles.checkboxContainer}>
                                    <input className={styles.checkbox} type="checkbox" checked={sameAddress} onChange={e => setSameAddress(e.target.checked)} />
                                    Same as current address
                                </label>
                            </div>
                            {!sameAddress && (
                                <textarea className={`${styles.input} ${styles.textarea}`} value={permanentAddress} onChange={e => setPermanentAddress(e.target.value)} required={!sameAddress} placeholder="Full permanent address" />
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: EMERGENCY CONTACT */}
                    <div className={styles.sectionTitle}>3. Emergency Contact Details</div>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Emergency Contact Name *</label>
                            <input className={styles.input} type="text" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} required placeholder="Parent, spouse, or relative's name" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Relation *</label>
                            <select className={styles.input} value={emergencyRelation} onChange={e => setEmergencyRelation(e.target.value)}>
                                <option value="Parent">Parent (Father / Mother)</option>
                                <option value="Spouse">Spouse (Husband / Wife)</option>
                                <option value="Sibling">Sibling (Brother / Sister)</option>
                                <option value="Relative">Relative</option>
                                <option value="Friend">Friend / Other</option>
                            </select>
                        </div>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>Emergency Contact Mobile Number *</label>
                            <input className={styles.input} type="tel" value={emergencyNumber} onChange={e => setEmergencyNumber(e.target.value)} required placeholder="Emergency mobile number" />
                        </div>
                    </div>

                    {/* SECTION 4: BANK ACCOUNT DETAILS */}
                    <div className={styles.sectionTitle}>4. Bank Account Details</div>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Bank Name</label>
                            <input className={styles.input} type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Account Number</label>
                            <input className={styles.input} type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value.replace(/\D/g, ''))} placeholder="Account Number" />
                        </div>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>IFSC Code</label>
                            <input className={styles.input} type="text" value={bankIfsc} onChange={e => setBankIfsc(e.target.value.toUpperCase())} placeholder="IFSC Code" />
                        </div>
                    </div>

                    {/* SECTION 5: DOCUMENT UPLOADS */}
                    <div className={styles.sectionTitle}>5. Required Documentation</div>
                    <div className={styles.grid}>
                        <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                            <label className={styles.label}>Profile Photo / Picture *</label>
                            <div className={styles.fileUploadZone} onClick={() => document.getElementById('photo-file-input').click()}>
                                <FiUploadCloud className={styles.fileIcon} />
                                {photoFile ? (
                                    <span className={styles.fileName}>{photoFile.name}</span>
                                ) : (
                                    <>
                                        <span className={styles.fileText}>Choose Profile Picture</span>
                                        <span className={styles.fileSubtext}>JPEG, PNG accepted</span>
                                    </>
                                )}
                                <input id="photo-file-input" type="file" accept="image/*" onChange={e => handleFileChange(e, setPhotoFile)} style={{ display: 'none' }} required />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Aadhaar Card Copy *</label>
                            <div className={styles.fileUploadZone} onClick={() => document.getElementById('aadhaar-file-input').click()}>
                                <FiUploadCloud className={styles.fileIcon} />
                                {aadhaarFile ? (
                                    <span className={styles.fileName}>{aadhaarFile.name}</span>
                                ) : (
                                    <>
                                        <span className={styles.fileText}>Choose File / Photo</span>
                                        <span className={styles.fileSubtext}>JPEG, PNG, or PDF</span>
                                    </>
                                )}
                                <input id="aadhaar-file-input" type="file" onChange={e => handleFileChange(e, setAadhaarFile)} style={{ display: 'none' }} required />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>PAN Card Copy (If Available)</label>
                            <div className={styles.fileUploadZone} onClick={() => document.getElementById('pan-file-input').click()}>
                                <FiUploadCloud className={styles.fileIcon} />
                                {panFile ? (
                                    <span className={styles.fileName}>{panFile.name}</span>
                                ) : (
                                    <>
                                        <span className={styles.fileText}>Choose File / Photo</span>
                                        <span className={styles.fileSubtext}>JPEG, PNG, or PDF</span>
                                    </>
                                )}
                                <input id="pan-file-input" type="file" onChange={e => handleFileChange(e, setPanFile)} style={{ display: 'none' }} />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Medical Certificate (If Available)</label>
                            <div className={styles.fileUploadZone} onClick={() => document.getElementById('medical-file-input').click()}>
                                <FiUploadCloud className={styles.fileIcon} />
                                {medicalFile ? (
                                    <span className={styles.fileName}>{medicalFile.name}</span>
                                ) : (
                                    <>
                                        <span className={styles.fileText}>Choose File / Photo</span>
                                        <span className={styles.fileSubtext}>Required for restaurant health records</span>
                                    </>
                                )}
                                <input id="medical-file-input" type="file" onChange={e => handleFileChange(e, setMedicalFile)} style={{ display: 'none' }} />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Other Documents / Certificates (If Available)</label>
                            <div className={styles.fileUploadZone} onClick={() => document.getElementById('other-files-input').click()}>
                                <FiUploadCloud className={styles.fileIcon} />
                                <span className={styles.fileText}>Choose Multiple Files / Photos</span>
                                <span className={styles.fileSubtext}>PDF, JPEG, PNG accepted</span>
                                <input
                                    id="other-files-input"
                                    type="file"
                                    onChange={handleOtherFilesChange}
                                    style={{ display: 'none' }}
                                    multiple
                                />
                            </div>
                            {otherFiles.length > 0 && (
                                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {otherFiles.map((f, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#64748b' }}>
                                            <FiFileText /> <span>{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button className={styles.submitBtn} type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '6px' }}></span>
                                {submitStatus || 'Registering Employee...'}
                            </>
                        ) : (
                            'Submit Onboarding Details'
                        )}
                    </button>
                </form>
            </div>
            
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default StaffOnboarding;
