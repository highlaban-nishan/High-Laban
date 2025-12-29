import React from 'react';
import Container from '../UI/Container';
import styles from './Highlights.module.css';
import { FaCheckCircle } from 'react-icons/fa';

export default function Highlights() {
    return (
        <section id="story-section" className={styles.section}>
            <Container>
                <div className={styles.splitLayout}>
                    {/* Left Card */}
                    <div className={styles.storyCard}>
                        <div className={styles.storyCardTitle}>
                            Our Story
                            <div className={styles.hlLogo}>HL</div>
                        </div>
                        <p className={styles.storyCardText}>
                            Rooted in time-honored Egyptian recipes and crafted with only the finest ingredients, our signature desserts are rich, creamy and irresistibly delicious. HIGHLABAN brings you authentic Egyptian desserts that celebrate tradition while creating unforgettable flavor experiences.
                        </p>
                        <p className={styles.storyCardText}>
                            Every bite is a journey through tradition and indulgence, made with love by our passionate, expertly trained team.
                        </p>
                    </div>

                    {/* Right Content */}
                    <div className={styles.storyRight}>
                        <span className={styles.labelSmall}>Why Choose Us</span>
                        <h2 className={styles.storyHeadline}>Where Tradition Meets Innovation</h2>
                        <p className={styles.storyDescription}>
                            We don't just make desserts; we craft experiences. By combining centuries-old recipes with modern culinary techniques, we deliver a taste that is both nostalgic and excitingly new.
                        </p>

                        <div className={styles.storyGrid}>
                            <div className={styles.featureItem}>
                                <span className={styles.featureIcon}><FaCheckCircle /></span>
                                Authentic Recipes
                            </div>
                            <div className={styles.featureItem}>
                                <span className={styles.featureIcon}><FaCheckCircle /></span>
                                Premium Ingredients
                            </div>
                            <div className={styles.featureItem}>
                                <span className={styles.featureIcon}><FaCheckCircle /></span>
                                Fresh Daily
                            </div>
                            <div className={styles.featureItem}>
                                <span className={styles.featureIcon}><FaCheckCircle /></span>
                                100% Vegetarian
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}
