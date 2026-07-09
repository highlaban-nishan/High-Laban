import React, { useState, useEffect, useRef } from 'react';
import Container from '../UI/Container';
import styles from './Highlights.module.css';
import { FaCheckCircle } from 'react-icons/fa';

import db from '../../utils/db';

// ── Locked story content ──────────────────────────────────────────────────────
// These values are ALWAYS shown regardless of what Firebase returns.
// Edit here to update the section copy.
const STORY_TITLE = 'Our Story';

const STORY_TEXT_1 =
    "For most people in India, Middle Eastern desserts begin and end with Kunafa and Baklava. But Egypt has a much richer dessert culture waiting to be discovered. That's why High Laban was created. Founded by Nishan, Nufoor, and Marshad, three passionate food lovers, High Laban was born from a dream of introducing India to authentic Egyptian desserts like Umm Ali, Heba Cake, Qashtoota, Salankatia, and many more.";

const STORY_TEXT_2 =
    "Our journey began in Indiranagar, Bangalore, where we combine traditional Egyptian recipes with premium ingredients and a modern touch inspired by Indian taste preferences. Every dessert is crafted to preserve its authentic roots while creating a new experience for today's generation. This is only the beginning. Our vision is to take High Laban across Kerala, Chennai, Hyderabad, Mumbai, Delhi, and beyond, sharing Egypt's rich dessert heritage with every city we visit.";

const LOCKED_FEATURES = [
    'Authentic Egyptian Recipes',
    'Freshly Crafted Every Day',
    'Premium Ingredients',
    'Unforgettable Flavours',
    'Innovative Fusions',
    'Pure Passion',
];
// ─────────────────────────────────────────────────────────────────────────────

export default function Highlights({ manualContent }) {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    // Only 'features' can be overridden from Firebase in admin mode
    const [features, setFeatures] = useState(LOCKED_FEATURES);

    useEffect(() => {
        if (manualContent) {
            setIsVisible(true);
            return;
        }

        // Subscribe only to pull features list from Firebase (other fields are locked)
        const unsubscribe = db.subscribeToSiteContent('highlights', (data) => {
            if (data && Array.isArray(data.features) && data.features.length > 0) {
                setFeatures(data.features);
            }
        });

        // Sync locked values back to Firebase so admin panel is consistent
        db.updateSiteContent('highlights', {
            storyTitle: STORY_TITLE,
            storyText1: STORY_TEXT_1,
            storyText2: STORY_TEXT_2,
        }).catch(() => {});

        return () => { if (unsubscribe) unsubscribe(); };
    }, [manualContent]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    // Use manualContent features if in admin preview
    const displayFeatures = manualContent?.features ?? features;

    return (
        <section id="story-section" className={styles.section} ref={sectionRef}>
            <Container>
                <div className={`${styles.storyRight} ${isVisible ? styles.visible : styles.hiddenRight}`}>
                    <span className={styles.labelSmall} style={{
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: '900',
                        fontSize: '0.8rem',
                        letterSpacing: '3px', 
                        display: 'block', 
                        marginBottom: '6px',
                        textTransform: 'uppercase'
                    }}>
                        CREATING THE VIRAL SENSATION
                    </span>

                    <h2 className={styles.storyHeadline} style={{
                        fontSize: '2.25rem', fontWeight: '900',
                        color: '#0f172a', margin: '0 0 1.5rem 0', lineHeight: '1.2'
                    }}>
                        {STORY_TITLE}
                    </h2>

                    <p style={{ fontSize: '1rem', color: '#475569', lineHeight: '1.85', margin: '0 0 1.25rem 0' }}>
                        {STORY_TEXT_1}
                    </p>
                    <p style={{ fontSize: '1rem', color: '#475569', lineHeight: '1.85', margin: '0 0 2rem 0' }}>
                        {STORY_TEXT_2}
                    </p>

                    <div className={styles.storyGrid}>
                        {displayFeatures.map((feature, index) => (
                            <div
                                key={index}
                                className={styles.featureItem}
                                style={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '10px 16px',
                                    background: '#f8fafc',
                                    fontWeight: '700',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <span className={styles.featureIcon} style={{ color: '#0ea5e9' }}>
                                    <FaCheckCircle />
                                </span>
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>
            </Container>
        </section>
    );
}
