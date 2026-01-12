import React, { useState, useEffect } from 'react';
import Container from '../UI/Container';
import styles from './Locations.module.css'; // Creating new css file
import { FaMapMarkerAlt } from 'react-icons/fa';
import db from '../../utils/db';

export default function Locations() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = db.subscribeToLocations((fetched) => {
            setLocations(fetched);
            setLoading(false);
        });
        return () => unsubscribe && unsubscribe();
    }, []);

    if (loading) return null; // Or a loader

    return (
        <section className={styles.section}>
            <Container>
                <div className={styles.header}>
                    <p className={styles.subtitle}>FIND US</p>
                    <h2 className={styles.title}>Our Locations</h2>
                    <p className={styles.description}>Find your nearest HighLaban and experience the taste of Egypt.</p>
                </div>

                <div className={styles.grid}>
                    {locations.map(loc => {
                        // Card is clickable if it has a Map URL (Safely check string)
                        const mapUrl = loc.mapUrl || '';
                        const isClickable = mapUrl.trim() !== '';

                        const CardTag = isClickable ? 'a' : 'div';
                        const cardProps = isClickable ? {
                            href: mapUrl,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            className: styles.card
                        } : {
                            className: styles.card
                        };

                        return (
                            <CardTag key={loc.id} {...cardProps}>
                                <div className={styles.iconWrapper}>
                                    <FaMapMarkerAlt />
                                </div>
                                <h3 className={styles.locationName}>{loc.name}</h3>
                                <p className={styles.locationAddress}>{loc.area}</p>



                                <div className={styles.divider}></div>

                                {/* Status Handling */}
                                {loc.status === 'Coming Soon' ? (
                                    <span className={styles.locationStatus} style={{ color: '#f97316' }}>Coming Soon</span>
                                ) : loc.status === 'Closed' ? (
                                    <span className={styles.locationStatus} style={{ color: '#ef4444' }}>Closed</span>
                                ) : (
                                    <span className={styles.locationStatus} style={{ color: '#0ea5e9' }}>Open</span>
                                )}
                            </CardTag>
                        );
                    })}
                </div>
            </Container >
        </section >
    );
}

