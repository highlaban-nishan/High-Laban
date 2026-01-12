import React, { useState, useEffect, useRef } from 'react';
import Container from '../UI/Container';
import styles from './Highlights.module.css';
import { FaCheckCircle } from 'react-icons/fa';
import cowIcon from '../../assets/cow.png';

import db from '../../utils/db';

export default function Highlights({ manualContent }) {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);
    const [content, setContent] = useState({
        storyTitle: 'Our Story',
        storyBadge: 'HL',
        storyBadgeImage: '',
        storyText1: 'Rooted in time-honored Egyptian recipes and crafted with only the finest ingredients, our signature desserts are rich, creamy and irresistibly delicious. HIGHLABAN brings you authentic Egyptian desserts that celebrate tradition while creating unforgettable flavor experiences.',
        storyText2: 'Every bite is a journey through tradition and indulgence, made with love by our passionate, expertly trained team.',
        rightLabel: 'ABOUT US',
        rightHeadline: 'Where Tradition Meets Innovation',
        rightDescription: "We don't just make desserts; we craft experiences. By combining centuries-old recipes with modern culinary techniques, we deliver a taste that is both nostalgic and excitingly new.",
        features: ['Authentic Recipes', 'Premium Ingredients', 'Freshly Made Daily', 'Zero Preservatives', 'Innovative Fusions', 'New Arrival']
    });

    useEffect(() => {
        if (manualContent) {
            setContent(prev => ({ ...prev, ...manualContent }));
            setIsVisible(true); // Always visible in preview
            return;
        }

        // Real-time subscription
        console.log("Subscribing to site content...");
        const unsubscribe = db.subscribeToSiteContent('highlights', (data) => {
            console.log("Highlights received update:", data);
            if (data) {
                // Ensure features is an array just in case
                if (!Array.isArray(data.features)) data.features = [];
                setContent(prev => ({ ...prev, ...data }));
            }
        });

        // Cleanup subscription on unmount
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [manualContent]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Animate only once
                }
            },
            { threshold: 0.2 } // Trigger when 20% of the section is visible
        );

        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    const handleImageError = () => {
        console.log("Badge image failed to load, falling back to text.");
        setContent(prev => ({ ...prev, storyBadgeImage: '' }));
    };

    return (
        <section id="story-section" className={styles.section} ref={sectionRef}>
            <Container>
                <div className={styles.splitLayout}>
                    {/* Left Card */}
                    <div className={`${styles.storyCard} ${isVisible ? styles.visible : styles.hiddenLeft}`}>
                        <div className={styles.storyCardTitle}>
                            {content.storyTitle}
                            <div className={styles.hlLogoContainer}>
                                {content.storyBadgeImage ? (
                                    <img
                                        src={content.storyBadgeImage}
                                        alt="Story Badge"
                                        className={styles.badgeImage}
                                        style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                                        onError={handleImageError}
                                    />
                                ) : (
                                    <span className={styles.hlText}>{content.storyBadge}</span>
                                )}
                            </div>
                        </div>
                        <p className={styles.storyCardText}>
                            {content.storyText1}
                        </p>
                        <p className={styles.storyCardText}>
                            {content.storyText2}
                        </p>
                    </div>

                    {/* Right Content */}
                    <div className={`${styles.storyRight} ${isVisible ? styles.visible : styles.hiddenRight}`}>
                        <span className={styles.labelSmall}>{content.rightLabel}</span>
                        <h2 className={styles.storyHeadline}>{content.rightHeadline}</h2>
                        <p className={styles.storyDescription}>
                            {content.rightDescription}
                        </p>

                        <div className={styles.storyGrid}>
                            {content.features && content.features.map((feature, index) => (
                                <div key={index} className={styles.featureItem}>
                                    <span className={styles.featureIcon}><FaCheckCircle /></span>
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}
