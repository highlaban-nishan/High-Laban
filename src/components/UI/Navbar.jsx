import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import logo from '../../assets/logo.png';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <nav className={styles.navbar}>
            {/* Logo — fixed top-left outside pill */}
            <Link to="/" className={styles.logoOutside} onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
                <img src={logo} alt="High Laban" />
            </Link>

            {/* Floating Pill */}
            <div className={`${styles.navPill} ${isScrolled ? styles.scrolled : ''}`}>
                {/* Centered nav links */}
                <div className={styles.links}>
                    <Link to="/" onClick={(e) => {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}>HOME</Link>
                    <Link to="/about-us">ABOUT US</Link>
                    <a href="#menu" onClick={(e) => {
                        e.preventDefault();
                        scrollTo('menu-title');
                    }}>MENU</a>
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
