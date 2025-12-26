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
                            High Laban brings you the authentic flavors of Egypt.
                            Our desserts are committed to quality, using only the freshest ingredients
                            to create creamy, dreamy treats that delight your senses.
                        </p>
                        <ul className={styles.featureList}>
                            <li>Authentic Family Recipes</li>
                            <li>Freshly Made Daily</li>
                            <li>Premium Ingredients Only</li>
                        </ul>
                    </div>
                    <div className={styles.aboutVisual}>
                        <img src={aboutCow} alt="High Laban Cow Chef" style={{ width: '100%', height: 'auto', borderRadius: '20px' }} />
                    </div>
                </div>
            </Container>
        </section>
    );
}
