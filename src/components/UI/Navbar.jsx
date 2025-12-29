// Removed Container import as we control width with .navPill in CSS and flex in .navbar
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import logo from '../../assets/logo.png';

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={styles.navbar}>
            <div className={`${styles.navPill} ${isScrolled ? styles.scrolled : ''}`}>
                <Link to="/login" className={styles.logo}>
                    <img src={logo} alt="High Laban" />
                </Link>

                <div className={`${styles.links} ${menuOpen ? styles.menuOpen : ''}`}>
                    <a href="#story" onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(false);
                        const element = document.getElementById('story-section');
                        if (element) {
                            const y = element.getBoundingClientRect().top + window.scrollY - 100; // Offset for navbar
                            window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                    }}>OUR STORY</a>
                    <a href="#products" onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(false);
                        const element = document.getElementById('menu-title');
                        if (element) {
                            const y = element.getBoundingClientRect().top + window.scrollY - 100; // 100px offset for navbar
                            window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                    }}>MENU</a>
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(false);
                    }}>FRANCHISE</a>
                </div>

                <a href="#" className={styles.ctaButton}>
                    SHOP NOW <span>🛍️</span>
                </a>

                <button
                    className={styles.menuToggle}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle navigation"
                >
                    <span className={styles.hamburger}></span>
                </button>
            </div>
        </nav>
    );
}
