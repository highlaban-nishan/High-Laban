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
        storyText1: "For many people in India, Middle Eastern desserts mean only Kunafa and Baklava. But that's just the beginning.. Egypt is home to a world of incredible desserts like Umm Ali, Heba Cake, Qashtoota, Salankatia, and many more, each with its own story, tradition, and unforgettable flavor. We created High Laban to bring these hidden gems to India and introduce a dessert experience unlike anything you've had before.",
        storyText2: "Founded by Nishan, Nufoor, and Marshad, High Laban started with a shared passion for food and a dream of bringing authentic Egyptian desserts to India. Our journey began in Indiranagar, Bangalore, where we blend traditional recipes, premium ingredients, and modern creativity to craft desserts that stay true to their roots while delighting Indian taste buds. This is only the beginning. Our vision is to take High Laban to Kerala, Chennai, Hyderabad, Mumbai, Delhi, and beyond, sharing the rich flavors and culture of Egypt with every city.",
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
