import React, { useState, useEffect } from 'react';
import styles from './ValuesAndLocations.module.css'; // Reusing styles for consistency

import useScrollReveal from '../../hooks/useScrollReveal';
import useCountUp from '../../hooks/useCountUp';
import db from '../../utils/db';
import FranchiseForm from '../Franchise/FranchiseForm';
import { useLocation } from 'react-router-dom';

const StatItem = ({ label, target, suffix, start }) => {
    const count = useCountUp(target, 2500, start);
    return (
        <div className={`${styles.statItem} reveal`}>
            <div className={styles.statValue}>{count}{suffix}</div>
            <div className={styles.statLabel}>{label}</div>
        </div>
    );
};

export default function FranchiseSection() {

    const [startCounting, setStartCounting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const location = useLocation();

    // Auto-open form via navigation state
    useEffect(() => {
        if (location.state?.openForm) {
            setShowForm(true);
        }
    }, [location.state]);

    useScrollReveal();

    // Intersection Observer to start counting when stats are visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setStartCounting(true);
                    observer.disconnect(); // Only trigger once
                }
            },
            { threshold: 0.2 }
        );

        const section = document.getElementById('stats-section');
        if (section) observer.observe(section);

        return () => observer.disconnect();
    }, []);

    const stats = [
        { label: "LOCATIONS", target: 1, suffix: "+" },
        { label: "HAPPY CUSTOMERS", target: 10, suffix: "K+" },
        { label: "VARIETIES", target: 30, suffix: "+" }
    ];



    return (
        <section className={styles.section} id="franchise-section">
            <div className={styles.container}>

                {/* Stats Section */}
                <div id="stats-section" className={styles.statsWrapper}>
                    {stats.map((stat, index) => (
                        <React.Fragment key={index}>
                            <StatItem
                                label={stat.label}
                                target={stat.target}
                                suffix={stat.suffix}
                                start={startCounting}
                            />
                            {index < stats.length - 1 && <div className={`${styles.separator} reveal reveal-delay-200`}></div>}
                        </React.Fragment>
                    ))}
                </div>

                {/* Inline Franchise Form */}
                <div style={{ margin: '4rem 0', textAlign: 'center' }}>
                    <span className={styles.smallLabel}>PARTNER WITH US</span>
                    <h2 className={styles.sectionTitle} style={{ marginBottom: '2rem' }}>Franchise Opportunities</h2>

                    {!startCounting ? (
                        // Placeholder to prevent layout shift before interaction if needed, or just null
                        null
                    ) : (
                        // Logic for form display 
                        null
                    )}

                    {!showForm ? (
                        <div className={styles.ctaCard} style={{
                            maxWidth: '600px',
                            margin: '0 auto',
                            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                            padding: '3rem',
                            borderRadius: '24px',
                            color: 'white',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                        }}>
                            <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Ready to join the revolution?</h3>
                            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6' }}>
                                Join the HighLaban family and bring authentic happiness to your city.
                                We provide full support, training, and a proven business model.
                            </p>
                            <button
                                onClick={() => setShowForm(true)}
                                style={{
                                    background: 'white',
                                    color: 'black',
                                    padding: '1rem 2.5rem',
                                    borderRadius: '50px',
                                    border: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    boxShadow: '0 4px 15px rgba(255,255,255,0.2)'
                                }}
                                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                            >
                                APPLY NOW
                            </button>
                        </div>
                    ) : (
                        <div style={{ animation: 'fadeInUp 0.5s ease-out forwards' }}>
                            <style>{`
                                @keyframes fadeInUp {
                                    from { opacity: 0; transform: translateY(20px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                            `}</style>
                            <FranchiseForm isModal={false} />
                            <button
                                onClick={() => setShowForm(false)}
                                style={{
                                    marginTop: '2rem',
                                    background: 'transparent',
                                    color: '#94a3b8',
                                    padding: '0.8rem 2rem',
                                    borderRadius: '50px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => {
                                    e.target.style.borderColor = '#000';
                                    e.target.style.color = '#000';
                                }}
                                onMouseLeave={e => {
                                    e.target.style.borderColor = '#cbd5e1';
                                    e.target.style.color = '#94a3b8';
                                }}
                            >
                                Close Form
                            </button>
                        </div>
                    )}
                </div>


            </div>
        </section>
    );
}
