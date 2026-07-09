import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import logo from '../../assets/logo.png';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const goHome = (e) => {
        e.preventDefault();
        if (location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/');
        }
    };

    const goToMenu = (e) => {
        e.preventDefault();
        if (location.pathname === '/') {
            const el = document.getElementById('menu-title');
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        } else {
            navigate('/', { state: { scrollTo: 'menu-title' } });
        }
    };

    return (
        <nav className={styles.navbar}>
            {/* Logo — visible only in hero area, fades out on scroll */}
            <Link
                to="/"
                className={`${styles.logoOutside} ${isScrolled ? styles.logoHidden : ''}`}
                onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
            >
                <img src={logo} alt="High Laban" />
            </Link>

            {/* Floating Pill */}
            <div className={`${styles.navPill} ${isScrolled ? styles.scrolled : ''}`}>
                {/* Centered nav links */}
                <div className={styles.links}>
                    <Link to="/" onClick={goHome}>HOME</Link>
                    <Link to="/about-us">ABOUT US</Link>
                    <a href="#menu" onClick={goToMenu}>MENU</a>
                </div>

                {/* Franchise CTA — blue filled */}
                <a
                    href="/franchise-inquiry"
                    className={styles.franchiseButton}
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/franchise-inquiry');
                    }}
                >
                    FRANCHISE
                </a>
            </div>
        </nav>
    );
}
