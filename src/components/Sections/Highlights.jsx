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
        storyText1: "For most people in India, Middle Eastern desserts begin and end with Kunafa and Baklava. But Egypt has a much richer dessert culture waiting to be discovered. That's why High Laban was created. Founded by Nishan, Nufoor, and Marsha, three passionate food lovers, High Laban was born from a dream of introducing India to authentic Egyptian desserts like Umm Ali, Heba Cake, Qashtoota, Salankatia, and many more.",
        storyText2: "Our journey began in Indiranagar, Bangalore, where we combine traditional Egyptian recipes with premium ingredients and a modern touch inspired by Indian taste preferences. Every dessert is crafted to preserve its authentic roots while creating a new experience for today's generation. This is only the beginning. Our vision is to take High Laban across Kerala, Chennai, Hyderabad, Mumbai, Delhi, and beyond, sharing Egypt's rich dessert heritage with every city we visit.",
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
                    {/* Left Decorative Visual Card */}
                    <div 
                        className={`${styles.storyCard} ${isVisible ? styles.visible : styles.hiddenLeft}`}
                        style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', 
                            borderRadius: '32px', 
                            padding: '4rem 2rem', 
                            textAlign: 'center', 
                            color: 'white', 
                            boxShadow: '0 20px 40px rgba(14, 165, 233, 0.15)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            maxWidth: '100%'
                        }}
                    >
                        <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                            <span style={{ fontSize: '2.5rem' }}>🩵</span>
                        </div>
                        <h3 style={{ fontSize: '2rem', fontWeight: '900', color: 'white', margin: '0 0 10px 0' }}>High Laban</h3>
                        <p style={{ fontSize: '0.95rem', opacity: '0.9', margin: 0, lineHeight: '1.6', color: '#e0f2fe', fontWeight: '600' }}>Authentic Egyptian Desserts & Modern Indulgence</p>
                    </div>

                    {/* Right Narrative Story Content */}
                    <div className={`${styles.storyRight} ${isVisible ? styles.visible : styles.hiddenRight}`}>
                        <span className={styles.labelSmall} style={{ color: '#0ea5e9', fontWeight: '800', letterSpacing: '2px', display: 'block', marginBottom: '10px' }}>OUR STORY</span>
                        <h2 className={styles.storyHeadline} style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a', margin: '0 0 1.5rem 0', lineHeight: '1.2' }}>Where Tradition Meets Innovation</h2>
                        
                        <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.8', margin: '0 0 1.25rem 0' }}>
                            {content.storyText1}
                        </p>
                        <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.8', margin: '0 0 2rem 0' }}>
                            {content.storyText2}
                        </p>

                        <div className={styles.storyGrid}>
                            {(content.features || []).map((feature, index) => (
                                <div key={index} className={styles.featureItem} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 16px', background: '#f8fafc', fontWeight: '700', fontSize: '0.85rem' }}>
                                    <span className={styles.featureIcon} style={{ color: '#0ea5e9' }}><FaCheckCircle /></span>
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
