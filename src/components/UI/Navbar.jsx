// Removed Container import as we control width with .navPill in CSS and flex in .navbar
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import logo from '../../assets/logo.png';

export default function Navbar({ onOpenFranchise }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

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
            <Link to="/" className={styles.logoOutside} onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
                <img src={logo} alt="High Laban" />
            </Link>

            <div className={`${styles.navPill} ${isScrolled ? styles.scrolled : ''}`}>
                <div className={`${styles.links} ${menuOpen ? styles.menuOpen : ''}`}>
                    <Link to="/about-us" onClick={() => setMenuOpen(false)}>ABOUT US</Link>
                    <a href="#products" onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(false);
                        const element = document.getElementById('menu-title');
                        if (element) {
                            const y = element.getBoundingClientRect().top + window.scrollY - 100; // 100px offset for navbar
                            window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                    }}>MENU</a>
                </div>

                <div className={styles.actionButtons}>
                    <a href="/franchise-inquiry" className={styles.franchiseButton} onClick={(e) => {
                        e.preventDefault();
                        navigate('/franchise-inquiry');
                    }}>
                        FRANCHISE
                    </a>
                </div>

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
