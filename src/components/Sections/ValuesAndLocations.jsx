import React, { useState, useEffect } from 'react';
import styles from './ValuesAndLocations.module.css';
import { FaMapMarkerAlt } from 'react-icons/fa';
import db from '../../utils/db';

import useScrollReveal from '../../hooks/useScrollReveal';
import useCountUp from '../../hooks/useCountUp';

const StatItem = ({ label, target, suffix, start }) => {
    const count = useCountUp(target, 2500, start);
    return (
        <div className={`${styles.statItem} reveal`}>
            <div className={styles.statValue}>{count}{suffix}</div>
            <div className={styles.statLabel}>{label}</div>
        </div>
    );
};

export default function ValuesAndLocations() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [startCounting, setStartCounting] = useState(false);

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

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const locs = await db.getLocations();
                setLocations(locs);
            } catch (error) {
                console.error("Error fetching locations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, []);



    return (
        <section className={styles.section}>
            <div className={styles.container}>
                {/* Top Section - Values */}
                {/* Top Section - Stats */}
                {/* Top Section - Stats */}
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

                {/* Bottom Section - Locations */}
                <div id="locations" className={styles.locationsWrapper}>
                    <span className={styles.smallLabel}>FIND US</span>
                    <h2 className={styles.sectionTitle}>Our Locations</h2>
                    <p className={styles.sectionSubtitle}>Find your nearest HighLaban and experience the taste of Egypt.</p>

                    <div className={styles.locationsGrid}>
                        {loading ? (
                            <p style={{ color: '#94a3b8' }}>Loading locations...</p>
                        ) : locations.length > 0 ? (
                            locations.map((loc) => {
                                // Card is clickable if it has a Map URL
                                const mapUrl = loc.mapUrl || '';
                                const isClickable = mapUrl.trim() !== '';

                                const CardTag = isClickable ? 'a' : 'div';
                                const cardProps = isClickable ? {
                                    href: mapUrl,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    className: styles.locationCard
                                } : {
                                    className: styles.locationCard
                                };

                                return (
                                    <CardTag key={loc.id} {...cardProps}>
                                        <div className={styles.locationIconWrapper}>
                                            <FaMapMarkerAlt />
                                        </div>
                                        {/* Area Name (Big Title) e.g., Bangalore */}
                                        <h3 className={styles.locationName}>{loc.area || loc.name}</h3>

                                        {/* Full Name / Subtitle e.g., Bangalore - India */}
                                        {loc.area && <p className={styles.locationAddress}>{loc.name}</p>}

                                        <div className={styles.divider}></div>

                                        {/* Status */}
                                        <span className={styles.locationStatus} style={{
                                            color: loc.status === 'Coming Soon' ? '#f97316' :
                                                loc.status === 'Closed' ? '#ef4444' : '#0ea5e9'
                                        }}>
                                            {loc.status}
                                        </span>
                                    </CardTag>
                                );
                            })
                        ) : (
                            <div className={styles.locationCard}>
                                <div className={styles.locationIconWrapper}>
                                    <FaMapMarkerAlt />
                                </div>
                                <h3 className={styles.locationName}>New Locations</h3>
                                <p className={styles.locationAddress}>Coming Soon</p>
                                <div className={styles.divider}></div>
                                <span className={styles.locationStatus}>Stay Tuned</span>
                            </div>
                        )}
                    </div>
                </div>


            </div>
        </section>
    );
}
