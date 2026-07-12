import React, { useState } from 'react';
import { FiUploadCloud, FiCheckCircle, FiFileText, FiTrash2 } from 'react-icons/fi';
import { Helmet } from 'react-helmet-async';
import styles from './WorkerApplication.module.css';
import db from '../utils/db';
import { uploadMedia } from '../utils/storage';
import logo from '../assets/logo.png';

const POSITIONS = [
    'Waiter / Waitress',
    'Chef / Cook',
    'Cashier',
    'Manager',
    'Kitchen Helper',
    'Delivery Boy',
    'Cleaner / Steward',
    'Other (Custom)',
];

const EDUCATION_LEVELS = [
    'Below 10th',
    '10th Pass (SSLC)',
    '12th / Plus Two (HSC)',
    'Diploma',
    'Graduation (Bachelor\'s Degree)',
    'Post-Graduation (Master\'s Degree)',
    'Other',
];

const ALL_LANGUAGES = [
    'English', 'Hindi', 'Malayalam', 'Tamil', 'Kannada',
    'Telugu', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi',
    'Urdu', 'Arabic', 'Other',
];

const WorkerApplication = () => {
    // ── Personal Info ──────────────────────────────
    const [fullName, setFullName]         = useState('');
    const [mobile, setMobile]             = useState('');
    const [age, setAge]                   = useState('');
    const [gender, setGender]             = useState('Male');
    const [nativePlace, setNativePlace]   = useState('');
    const [currentPlace, setCurrentPlace] = useState('');

    // ── Position ───────────────────────────────────
    const [positionsList, setPositionsList]     = useState(POSITIONS);
    const [appliedPosition, setAppliedPosition] = useState(POSITIONS[0]);
    const [customPosition, setCustomPosition]   = useState('');

    useEffect(() => {
        db.getSiteContent('jobs').then(data => {
            if (data && data.positions && data.positions.length > 0) {
                setPositionsList([...data.positions, 'Other (Custom)']);
                setAppliedPosition(data.positions[0]);
            }
        }).catch(err => console.error("Error loading positions:", err));
    }, []);

    // ── Experience ────────────────────────────────
    const [hasExperience, setHasExperience]   = useState('No');
    const [expYears, setExpYears]             = useState('');
    const [expRole, setExpRole]               = useState('');
    const [expCompany, setExpCompany]         = useState('');
    const [expDescription, setExpDescription] = useState('');

    // ── Education ─────────────────────────────────
    const [educationLevel, setEducationLevel] = useState('');

    // ── Languages ────────────────────────────────
    const [languages, setLanguages] = useState([]);

    const toggleLanguage = (lang) => {
        setLanguages(prev =>
            prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
        );
    };

    // ── Files ────────────────────────────────────
    const [selectedFiles, setSelectedFiles] = useState([]);

    // ── Page states ──────────────────────────────
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('');
    const [success, setSuccess]           = useState(false);
    const [error, setError]               = useState('');

    const handleFileChange = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                name: file.name,
            }));
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (id) => setSelectedFiles(prev => prev.filter(f => f.id !== id));

    const finalPosition = appliedPosition === 'Other (Custom)' ? (customPosition.trim() || 'Other') : appliedPosition;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const uploadedDocs = [];
            for (let i = 0; i < selectedFiles.length; i++) {
                const item = selectedFiles[i];
                setSubmitStatus(`Uploading document ${i + 1} of ${selectedFiles.length}: ${item.name}...`);
                const url = await uploadMedia(item.file);
                uploadedDocs.push({ name: item.name, url });
            }

            setSubmitStatus('Saving application profile...');
            const applicationData = {
                fullName: fullName.trim(),
                phone: mobile.trim(),
                age: parseInt(age) || 18,
                gender,
                nativePlace: nativePlace.trim(),
                currentPlace: currentPlace.trim(),
                appliedPosition: finalPosition,
                hasExperience: hasExperience === 'Yes',
                experience: hasExperience === 'Yes' ? {
                    years: expYears,
                    role: expRole.trim(),
                    company: expCompany.trim(),
                    description: expDescription.trim(),
                } : null,
                education: {
                    level: educationLevel,
                },
                languages,
                documents: uploadedDocs,
                status: 'Pending',
                interviewScore: '',
                interviewNotes: '',
                createdAt: new Date().toISOString(),
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
                        <div className={styles.successIcon}><FiCheckCircle /></div>
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

                {error && <div className={styles.alert}>⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>

                    {/* ══ SECTION 1: PERSONAL INFO ══ */}
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

                    {/* ══ SECTION 2: ADDRESS ══ */}
                    <div className={styles.sectionTitle}>2. Address &amp; Background</div>
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

                    {/* ══ SECTION 3: POSITION APPLIED ══ */}
                    <div className={styles.sectionTitle}>3. Position Applied For</div>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Select Position *</label>
                            <select className={styles.input} value={appliedPosition} onChange={e => setAppliedPosition(e.target.value)}>
                                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        {appliedPosition === 'Other (Custom)' && (
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Specify Position *</label>
                                <input className={styles.input} type="text" value={customPosition} onChange={e => setCustomPosition(e.target.value)} required placeholder="e.g. Social Media Manager" />
                            </div>
                        )}
                    </div>

                    {/* ══ SECTION 4: EXPERIENCE ══ */}
                    <div className={styles.sectionTitle}>4. Work Experience</div>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Do you have prior work experience? *</label>
                            <select className={styles.input} value={hasExperience} onChange={e => setHasExperience(e.target.value)}>
                                <option value="No">No – I'm a fresher</option>
                                <option value="Yes">Yes – I have experience</option>
                            </select>
                        </div>
                    </div>

                    {hasExperience === 'Yes' && (
                        <div className={styles.experienceBlock}>
                            <div className={styles.grid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Years of Experience *</label>
                                    <select className={styles.input} value={expYears} onChange={e => setExpYears(e.target.value)} required={hasExperience === 'Yes'}>
                                        <option value="">Select</option>
                                        <option value="Less than 1 year">Less than 1 year</option>
                                        <option value="1 year">1 year</option>
                                        <option value="2 years">2 years</option>
                                        <option value="3 years">3 years</option>
                                        <option value="4 years">4 years</option>
                                        <option value="5+ years">5+ years</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Previous Job Role / Position *</label>
                                    <input className={styles.input} type="text" value={expRole} onChange={e => setExpRole(e.target.value)} required={hasExperience === 'Yes'} placeholder="e.g. Waiter at ABC Restaurant" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Company / Restaurant Name</label>
                                    <input className={styles.input} type="text" value={expCompany} onChange={e => setExpCompany(e.target.value)} placeholder="e.g. Pizza Palace, Koramangala" />
                                </div>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label className={styles.label}>Brief Description of Your Experience</label>
                                    <textarea
                                        className={styles.input}
                                        rows={3}
                                        value={expDescription}
                                        onChange={e => setExpDescription(e.target.value)}
                                        placeholder="Describe your duties, achievements, or skills gained in that role..."
                                        style={{ resize: 'vertical', minHeight: '80px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══ SECTION 5: EDUCATION ══ */}
                    <div className={styles.sectionTitle}>5. Education</div>
                    <div className={styles.grid}>
                        <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                            <label className={styles.label}>Highest Education Level *</label>
                            <select className={styles.input} value={educationLevel} onChange={e => setEducationLevel(e.target.value)} required>
                                <option value="">Select your qualification</option>
                                {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* ══ SECTION 6: LANGUAGES ══ */}
                    <div className={styles.sectionTitle}>6. Languages Known</div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Select all languages you can speak *</label>
                        <div className={styles.languageGrid}>
                            {ALL_LANGUAGES.map(lang => (
                                <label key={lang} className={`${styles.languageChip} ${languages.includes(lang) ? styles.languageChipActive : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={languages.includes(lang)}
                                        onChange={() => toggleLanguage(lang)}
                                        style={{ display: 'none' }}
                                    />
                                    {lang}
                                </label>
                            ))}
                        </div>
                        {languages.length === 0 && <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.4rem' }}>Please select at least one language.</p>}
                    </div>

                    {/* ══ SECTION 7: DOCUMENTS ══ */}
                    <div className={styles.sectionTitle}>7. Documents &amp; CV / Resume</div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Upload CV, Resume, or ID copies (Aadhaar, PAN, etc.)</label>
                        <div className={styles.fileUploadZone} onClick={() => document.getElementById('multiple-file-input').click()}>
                            <FiUploadCloud className={styles.fileIcon} />
                            <span className={styles.fileText}>Choose Multiple Files / Photos</span>
                            <span className={styles.fileSubtext}>PDF, JPEG, PNG accepted</span>
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
                                        <button type="button" className={styles.fileRemoveBtn} onClick={() => removeFile(item.id)}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        className={styles.submitBtn}
                        type="submit"
                        disabled={isSubmitting || languages.length === 0}
                    >
                        {isSubmitting ? (
                            <>
                                <span className={styles.spinner}></span>
                                {submitStatus || 'Sending Application...'}
                            </>
                        ) : (
                            'Submit Application 🚀'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WorkerApplication;
