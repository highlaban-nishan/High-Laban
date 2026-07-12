import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Footer.module.css';
import logo from '../../assets/footer.png';
import db from '../../utils/db';
import { FaInstagram, FaFacebookF, FaWhatsapp, FaArrowUp, FaPaperPlane, FaLinkedinIn } from 'react-icons/fa';
import { FiPhone, FiMail, FiMapPin, FiX } from 'react-icons/fi';

export default function Footer() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
    const [contactSent, setContactSent] = useState(false);
    const footerRef = useRef(null);

    const handleContactChange = (e) => {
        setContactForm({ ...contactForm, [e.target.name]: e.target.value });
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        try {
            await db.addContactMessage({
                name: contactForm.name.trim(),
                email: contactForm.email.trim(),
                phone: contactForm.phone.trim(),
                message: contactForm.message.trim(),
                status: 'New'
            });
        } catch (err) {
            console.error("Failed to save contact message to database:", err);
        }
        
        const msg = encodeURIComponent(
            `*New HQ Contact Enquiry*\nName: ${contactForm.name}\nEmail: ${contactForm.email}\nPhone: ${contactForm.phone}\nMessage: ${contactForm.message}`
        );
        window.open(`https://wa.me/917353100100?text=${msg}`, '_blank');
        setContactSent(true);
        setContactForm({ name: '', email: '', phone: '', message: '' });
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;
        setIsSubmitting(true);
        try {
            await db.saveSubscriber(email);
            alert("Thanks for subscribing! Stay sweet.");
            setEmail('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); }
            },
            { threshold: 0.1 }
        );
        if (footerRef.current) observer.observe(footerRef.current);
        return () => observer.disconnect();
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollToSection = (e, id) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <footer className={styles.footer}>
            <div
                className={`${styles.container} ${isVisible ? styles.visible : styles.hidden}`}
                ref={footerRef}
            >
                {/* ── Row 1: Brand + Social ─────────────── */}
                <div className={styles.brandRow}>
                    <img src={logo} alt="High Laban" className={styles.logo} onClick={scrollToTop} />
                    <p className={styles.tagline}>
                        Crafting authentic Egyptian happiness, one droplet at a time.
                    </p>
                    <div className={styles.socials}>
                        <a href="https://www.instagram.com/highlaban/" target="_blank" rel="noopener noreferrer" className={styles.socialBtn}><FaInstagram /></a>
                        <a href="#" className={styles.socialBtn}><FaFacebookF /></a>
                        <a href="https://wa.me/917353100100" target="_blank" rel="noopener noreferrer" className={styles.socialBtn}><FaWhatsapp /></a>
                        <a href="https://www.linkedin.com/company/highlaban" target="_blank" rel="noopener noreferrer" className={styles.socialBtn}><FaLinkedinIn /></a>
                    </div>
                </div>

                {/* ── Row 2: Two Cards ──────────────────── */}
                <div className={styles.twoCards}>

                    {/* Card A — Explore */}
                    <div className={styles.card}>
                        <p className={styles.cardHeading}>Explore</p>
                        <a className={styles.navLink} href="/about-us"       onClick={(e) => { e.preventDefault(); navigate('/about-us'); }}>About Us</a>
                        <a className={styles.navLink} href="#story-section"  onClick={(e) => scrollToSection(e, 'story-section')}>Our Story</a>
                        <a className={styles.navLink} href="#menu-title"     onClick={(e) => scrollToSection(e, 'menu-title')}>Menu</a>
                        <a className={styles.navLink} href="/franchise-inquiry" onClick={(e) => { e.preventDefault(); navigate('/franchise-inquiry'); }}>Franchise</a>
                        <a className={styles.navLink} href="/blog"           onClick={(e) => { e.preventDefault(); navigate('/blog'); }}>Blog</a>
                    </div>

                    {/* Card B — Quick Links */}
                    <div className={styles.card}>
                        <p className={styles.cardHeading}>Quick Links</p>
                        <a className={styles.navLink} href="/connect"        onClick={(e) => { e.preventDefault(); navigate('/connect'); }}>Social Profile</a>
                        <a className={styles.navLink} href="https://www.google.com/maps/search/High+Laban" target="_blank" rel="noopener noreferrer">Find Us</a>
                        <a className={styles.navLink} href="/apply"          onClick={(e) => { e.preventDefault(); navigate('/apply'); }}>Careers</a>
                        <span className={styles.navLink} style={{ cursor: 'pointer' }} onClick={() => setIsContactOpen(true)}>Contact Us</span>
                    </div>

                </div>

                {/* ── Row 3: Subscribe ─────────────────── */}
                <div className={styles.subscribeBox}>
                    <p className={styles.subscribeTitle}>STAY SWEET</p>
                    <p className={styles.subscribeSubtitle}>Get the latest drops and secret menu alerts.</p>
                    <form className={styles.subscribeForm} onSubmit={handleSubscribe}>
                        <input
                            type="email"
                            placeholder="Your email address"
                            className={styles.emailInput}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button className={styles.sendBtn} disabled={isSubmitting}>
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>

                {/* ── Bottom Bar ───────────────────────── */}
                <div className={styles.bottomBar}>
                    <span className={styles.copyright}>© 2025 HighLaban · All Rights Reserved</span>
                    <button className={styles.topBtn} onClick={scrollToTop} aria-label="Back to top">
                        <FaArrowUp />
                    </button>
                </div>

            </div>

            {/* ── Contact Us Pop Card Modal ── */}
            {isContactOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsContactOpen(false)}>
                    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Contact High Laban HQ</h3>
                            <button className={styles.modalCloseBtn} onClick={() => setIsContactOpen(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            
                            {/* Left Column: Contact Items + Map */}
                            <div className={styles.modalColLeft}>
                                <a href="tel:+917353100100" className={styles.modalItem}>
                                    <div className={styles.modalIcon}><FiPhone /></div>
                                    <div>
                                        <div className={styles.modalLabel}>Phone Call</div>
                                        <div className={styles.modalValue}>+91 73531 00100</div>
                                    </div>
                                </a>

                                <a href="https://wa.me/917353100100" target="_blank" rel="noopener noreferrer" className={styles.modalItem}>
                                    <div className={styles.modalIcon} style={{ color: '#25d366' }}><FaWhatsapp /></div>
                                    <div>
                                        <div className={styles.modalLabel}>WhatsApp Chat</div>
                                        <div className={styles.modalValue}>+91 73531 00100</div>
                                    </div>
                                </a>

                                <a href="mailto:info@highlaban.com" className={styles.modalItem}>
                                    <div className={styles.modalIcon} style={{ color: '#818cf8' }}><FiMail /></div>
                                    <div>
                                        <div className={styles.modalLabel}>Email Inbox</div>
                                        <div className={styles.modalValue}>info@highlaban.com</div>
                                    </div>
                                </a>

                                <div className={styles.modalMapBox}>
                                    <iframe
                                        title="HQ Map"
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d497699.9973874144!2d77.35073573359375!3d12.95407654101731!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                    />
                                </div>
                            </div>

                            {/* Right Column: Contact Form */}
                            <div className={styles.modalColRight}>
                                <h4 className={styles.modalFormTitle}>Send Message</h4>
                                {contactSent ? (
                                    <div className={styles.modalSuccess}>
                                        Message sent! We will contact you soon.
                                    </div>
                                ) : (
                                    <form className={styles.modalForm} onSubmit={handleContactSubmit}>
                                        <div className={styles.modalField}>
                                            <label>Name</label>
                                            <input className={styles.modalInput} name="name" value={contactForm.name} onChange={handleContactChange} required placeholder="Your name" />
                                        </div>
                                        <div className={styles.modalField}>
                                            <label>Phone</label>
                                            <input className={styles.modalInput} name="phone" value={contactForm.phone} onChange={handleContactChange} placeholder="Phone number" />
                                        </div>
                                        <div className={styles.modalField}>
                                            <label>Email</label>
                                            <input className={styles.modalInput} name="email" type="email" value={contactForm.email} onChange={handleContactChange} placeholder="Email address" />
                                        </div>
                                        <div className={styles.modalField}>
                                            <label>Message</label>
                                            <textarea className={styles.modalTextarea} name="message" value={contactForm.message} onChange={handleContactChange} rows={3} placeholder="Write message..." required />
                                        </div>
                                        <button type="submit" className={styles.modalSubmitBtn}>
                                            Send via WhatsApp
                                        </button>
                                    </form>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
}

