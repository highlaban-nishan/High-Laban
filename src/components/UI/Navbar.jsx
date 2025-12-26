import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Container from '../UI/Container';
import styles from './Navbar.module.css';
import logo from '../../assets/logo.png';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <Container className={styles.navContainer}>
                <Link to="/login" className={styles.logo}>
                    <img src={logo} alt="High Laban" style={{ height: '48px' }} />
                </Link>

                <button
                    className={styles.menuToggle}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle navigation"
                >
                    <span className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}></span>
                </button>

                <div className={`${styles.links} ${menuOpen ? styles.menuOpen : ''}`}>
                    <a href="#" onClick={() => setMenuOpen(false)}>Home</a>
                    <a href="#" onClick={() => setMenuOpen(false)}>Menu</a>
                    <a href="#location-map" onClick={() => setMenuOpen(false)}>Locations</a>
                    <a href="#" onClick={() => setMenuOpen(false)}>Contact</a>

                </div>


            </Container>
        </nav>
    );
}
