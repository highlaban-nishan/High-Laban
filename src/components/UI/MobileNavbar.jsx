import React, { useState, useEffect } from 'react';
import { FaHome, FaUtensils, FaUser } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './MobileNavbar.module.css';
import logo from '../../assets/logo.png';

export default function MobileNavbar({ onOpenFranchise }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    // Map location to active index on mount/update
    useEffect(() => {
        if (location.pathname === '/') {
            if (location.state?.scrollTo === 'products' || location.hash === '#products') setActiveIndex(1);
            else if (onOpenFranchise && location.state?.openForm) setActiveIndex(2);
            else setActiveIndex(0);
        }
    }, [location, onOpenFranchise]);

    const menuItems = [
        { icon: <FaHome />, label: 'Home', id: 'home' },
        { icon: <FaUtensils />, label: 'Menu', id: 'menu' },
        { icon: <FaUser />, label: 'FRANCHISE', id: 'franchise' },
    ];

    const handleNavigation = (index, id) => {
        setActiveIndex(index);

        if (id === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (location.pathname !== '/') navigate('/');
        } else if (id === 'menu') {
            scrollToSection('products');
        } else if (id === 'franchise') {
            scrollToSection('franchise-section');
        }
    };

    const scrollToSection = (id) => {
        const state = id === 'franchise-section' ? { scrollTo: id, openForm: true } : { scrollTo: id };

        if (location.pathname !== '/') {
            navigate('/', { state });
        } else {
            navigate('/', { state, replace: true });

            const element = document.getElementById(id);
            if (element) {
                const y = element.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    };

    return (
        <>
            {/* Mobile Top Logo */}
            <div className={styles.mobileTopLogo} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src={logo} alt="High Laban" />
            </div>

            <nav className={styles.mobileNav}>
                {menuItems.map((item, index) => (
                    <button
                        key={item.id}
                        className={`${styles.navItem} ${activeIndex === index ? styles.active : ''}`}
                        onClick={() => handleNavigation(index, item.id)}
                    >
                        <span className={styles.icon}>{item.icon}</span>
                        <span className={styles.text}>{item.label}</span>
                    </button>
                ))}
            </nav>
        </>
    );
}
