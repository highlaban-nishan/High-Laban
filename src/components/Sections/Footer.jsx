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
                        <p className={styles.cardHeading}>🧭 Explore</p>
                        <a className={styles.navLink} href="/about-us"       onClick={(e) => { e.preventDefault(); navigate('/about-us'); }}>About Us</a>
                        <a className={styles.navLink} href="#story-section"  onClick={(e) => scrollToSection(e, 'story-section')}>Our Story</a>
                        <a className={styles.navLink} href="#menu-title"     onClick={(e) => scrollToSection(e, 'menu-title')}>Menu</a>
                        <a className={styles.navLink} href="/franchise-inquiry" onClick={(e) => { e.preventDefault(); navigate('/franchise-inquiry'); }}>Franchise</a>
                        <a className={styles.navLink} href="/blog"           onClick={(e) => { e.preventDefault(); navigate('/blog'); }}>Blog</a>
                    </div>

                    {/* Card B — Quick Links */}
                    <div className={styles.card}>
                        <p className={styles.cardHeading}>⚡ Quick Links</p>
                        <a className={styles.navLink} href="/connect"        onClick={(e) => { e.preventDefault(); navigate('/connect'); }}>Social Profile</a>
                        <a className={styles.navLink} href="https://www.google.com/maps/search/High+Laban" target="_blank" rel="noopener noreferrer">Find Us</a>
                        <a className={styles.navLink} href="/apply"          onClick={(e) => { e.preventDefault(); navigate('/apply'); }}>Careers</a>
                        <a className={styles.navLink} href="/onboarding"     onClick={(e) => { e.preventDefault(); navigate('/onboarding'); }}>Staff Portal</a>
                        <a className={styles.navLink} href="tel:+917353100100">📞 +91 73531 00100</a>
                    </div>

                </div>

                {/* ── Row 3: Subscribe ─────────────────── */}
                <div className={styles.subscribeBox}>
                    <p className={styles.subscribeTitle}>STAY SWEET 🍯</p>
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
        </footer>
    );
}
