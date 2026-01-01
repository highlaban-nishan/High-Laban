import React, { useState, useEffect } from 'react';
import { FaHome, FaUtensils, FaUser } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './MobileNavbar.module.css';

export default function MobileNavbar({ onOpenFranchise }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    // Map location to active index on mount/update
    useEffect(() => {
        if (location.pathname === '/') {
            // Logic to detect section scroll could be added here, 
            // but simplified for now: default to Home.
            if (location.state?.scrollTo === 'products' || location.hash === '#products') setActiveIndex(1);
            else if (onOpenFranchise && location.state?.openForm) setActiveIndex(2); // Keep active if form triggered
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
            if (onOpenFranchise) onOpenFranchise();
        }
    };

    const scrollToSection = (id) => {
        const state = id === 'franchise-section' ? { scrollTo: id, openForm: true } : { scrollTo: id };

        if (location.pathname !== '/') {
            navigate('/', { state });
        } else {
            // Even if on home, we might need to trigger the state update for the listener
            // to catch it? React Router state doesn't update if we don't navigate.
            // But we can navigate to current path with state.
            navigate('/', { state, replace: true });

            const element = document.getElementById(id);
            if (element) {
                const y = element.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    };

    return (
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
    );
}
