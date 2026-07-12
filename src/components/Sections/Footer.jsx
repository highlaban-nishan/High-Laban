import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Footer.module.css';
import logo from '../../assets/footer.png';
import db from '../../utils/db';
import { FaInstagram, FaFacebookF, FaWhatsapp, FaArrowUp, FaPaperPlane, FaLinkedinIn } from 'react-icons/fa';

export default function Footer() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const footerRef = useRef(null);

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
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        if (footerRef.current) observer.observe(footerRef.current);
        return () => observer.disconnect();
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const scrollToSection = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <footer className={styles.footer}>
            <div className={`${styles.container} ${isVisible ? styles.contentVisible : styles.contentHidden}`} ref={footerRef}>

                {/* ── Brand Row ─────────────────────────────── */}
                <div className={styles.brandRow}>
                    <img src={logo} alt="High Laban" className={styles.logo} onClick={scrollToTop} style={{ cursor: 'pointer' }} />
                    <p className={styles.tagline}>
                        Crafting authentic Egyptian happiness, one droplet at a time. Experience the sweet revolution.
                    </p>
                    <div className={styles.socialIcons}>
                        <a href="https://www.instagram.com/highlaban/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}><FaInstagram /></a>
                        <a href="#" className={styles.socialIcon}><FaFacebookF /></a>
                        <a href="https://wa.me/917353100100" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}><FaWhatsapp /></a>
                        <a href="https://www.linkedin.com/company/highlaban" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}><FaLinkedinIn /></a>
                    </div>
                </div>

                {/* ── Two Card Grid ──────────────────────────── */}
                <div className={styles.cardGrid}>

                    {/* Card 1 — Explore */}
                    <div className={styles.linkCard}>
                        <div className={styles.cardLabel}>🧭 Explore</div>
                        <a href="/about-us" className={styles.cardLink} onClick={(e) => { e.preventDefault(); navigate('/about-us'); }}>About Us</a>
                        <a href="#story-section" className={styles.cardLink} onClick={(e) => scrollToSection(e, 'story-section')}>Our Story</a>
                        <a href="#products" className={styles.cardLink} onClick={(e) => scrollToSection(e, 'menu-title')}>Menu</a>
                        <a href="/franchise-inquiry" className={styles.cardLink} onClick={(e) => { e.preventDefault(); navigate('/franchise-inquiry'); }}>Franchise</a>
                        <a href="/blog" className={styles.cardLink} onClick={(e) => { e.preventDefault(); navigate('/blog'); }}>Blog</a>
                        <a href="/about-us" className={styles.cardLink} onClick={(e) => { e.preventDefault(); navigate('/about-us'); }}>About Us</a>
                    </div>

                    {/* Card 2 — Quick Links */}
                    <div className={styles.linkCard}>
                        <div className={styles.cardLabel}>⚡ Quick Links</div>
                        <a href="/connect" className={styles.cardLink} onClick={(e) => { e.preventDefault(); navigate('/connect'); }}>Social Profile</a>
                        <a href="https://www.google.com/maps/search/High+Laban" target="_blank" rel="noopener noreferrer" className={styles.cardLink}>Find Us</a>
                        <a href="/apply" className={styles.cardLink} onClick={(e) => { e.preventDefault(); navigate('/apply'); }}>Careers</a>
                        <a href="/onboarding" className={styles.cardLink} onClick={(e) => { e.preventDefault(); navigate('/onboarding'); }}>Staff Portal</a>
                        <a href="tel:+917353100100" className={`${styles.cardLink} ${styles.phoneLink}`}>📞 +91 73531 00100</a>
                    </div>

                </div>

                {/* ── Subscribe Row ──────────────────────────── */}
                <div className={styles.subscribeRow}>
                    <div className={styles.subscribeInner}>
                        <h4 className={styles.columnTitle}>STAY SWEET 🍯</h4>
                        <p className={styles.subscribeText}>Subscribe to get the latest drops and secret menu alerts.</p>
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
                                <FaPaperPlane style={{ fontSize: '0.9rem' }} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Bottom Bar ─────────────────────────────── */}
                <div className={styles.bottomBar}>
                    <p className={styles.copyright}>© 2025 HighLaban. All Rights Reserved. Made with 💜 in India</p>
                    <button className={styles.scrollTopBtn} onClick={scrollToTop} aria-label="Scroll to top">
                        <FaArrowUp />
                    </button>
                </div>

            </div>
        </footer>
    );
}
