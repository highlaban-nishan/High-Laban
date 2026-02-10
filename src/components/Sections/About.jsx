import React from 'react';
import Container from '../UI/Container';
import styles from './Sections.module.css';
import aboutCow from '../../assets/about_cow.png';

export default function About() {
    return (
        <section className={styles.section}>
            <Container>
                <div className={styles.aboutGrid}>
                    <div className={styles.aboutContent}>
                        <h2 className={styles.sectionTitle}>A Taste of <br /> <span className={styles.highlight}>Egyptian Tradition</span></h2>
                        <p className={styles.sectionText}>
                            Experience the rich Egyptian tradition with High Laban. We provide silky smooth desserts like Pistachio Lotus, Cheese Bomb, and Nutella Salankatia.
                            Discover why High Laban is the ultimate destination for authentic and creative Egyptian treats.
                        </p>
                        <ul className={styles.featureList}>
                            <li>Authentic Family Recipes</li>
                            <li>Freshly Made Daily</li>
                            <li>Premium Ingredients Only</li>
                        </ul>
                    </div>
                    <div className={styles.aboutVisual}>
                        <div className={styles.aboutImageContainer}>
                            <img src={aboutCow} alt="High Laban Cow Chef" />
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}
