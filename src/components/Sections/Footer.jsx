import React, { useState, useEffect, useRef } from 'react';
import styles from './Footer.module.css';
import logo from '../../assets/footer.png';
import db from '../../utils/db';
import { FaInstagram, FaFacebookF, FaWhatsapp, FaArrowUp, FaPaperPlane } from 'react-icons/fa';

export default function Footer() {
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

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const scrollToSection = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className={styles.footer}>
            <div className={`${styles.container} ${isVisible ? styles.contentVisible : styles.contentHidden}`} ref={footerRef}>
                {/* Top Section */}
                <div className={styles.topSection}>
                    {/* Brand Column */}
                    <div className={styles.brandCol}>
                        <img src={logo} alt="High Laban" className={styles.logo} onClick={scrollToTop} style={{ cursor: 'pointer' }} />
                        <p className={styles.tagline}>
                            Crafting authentic Egyptian happiness, one droplet at a time. Experience the sweet revolution.
                        </p>
                    </div>

                    {/* Explore Column */}
                    <div className={styles.linkList}>
                        <h4 className={styles.columnTitle}>EXPLORE</h4>
                        <a href="#story-section" className={styles.link} onClick={(e) => scrollToSection(e, 'story-section')}>Our Story</a>
                        <a href="#products" className={styles.link}>Menu</a>
                        <a href="#franchise-section" className={styles.link} onClick={(e) => scrollToSection(e, 'franchise-section')}>Franchise</a>
                        <a href="https://www.google.com/maps/search/High+Laban" target="_blank" rel="noopener noreferrer" className={styles.link}>Find Us</a>
                    </div>

                    {/* Connect Column */}
                    <div className={styles.connectCol}>
                        <h4 className={styles.columnTitle}>CONNECT</h4>
                        <div className={styles.socialIcons}>
                            <a href="https://www.instagram.com/highlaban/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                                <FaInstagram />
                            </a>
                            <a href="#" className={styles.socialIcon}>
                                <FaFacebookF />
                            </a>
                            <a href="https://wa.me/919037783864" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                                <FaWhatsapp />
                            </a>
                        </div>
                    </div>

                    {/* Stay Sweet Column */}
                    <div className={styles.subscribeCol}>
                        <h4 className={styles.columnTitle}>STAY SWEET</h4>
                        <p className={styles.subscribeText}>
                            Subscribe to get the latest drops and secret menu alerts.
                        </p>
                        <form className={styles.subscribeForm} onSubmit={handleSubscribe}>
                            <input
                                type="email"
                                placeholder="Your email"
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

                {/* Bottom Bar */}
                <div className={styles.bottomBar}>
                    <p className={styles.copyright}>
                        © 2024 HighLaban. All Rights Reserved. Made with 💜 in Egypt
                    </p>
                    <button className={styles.scrollTopBtn} onClick={scrollToTop} aria-label="Scroll to top">
                        <FaArrowUp />
                    </button>
                </div>
            </div>
        </footer>
    );
}
