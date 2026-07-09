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
                            Most people know Middle Eastern desserts for Kunafa and Baklava. But Egypt has an entire world of iconic desserts waiting to be discovered. At High Laban, we bring authentic Egyptian classics like Umm Ali, Heba Cake, Qashtoota, and Salankatia, alongside modern creations crafted for today's dessert lovers.
                        </p>
                        <ul className={styles.featureList}>
                            <li>Authentic Egyptian Recipes</li>
                            <li>Freshly Crafted Every Day</li>
                            <li>Premium Ingredients, Unforgettable Flavours</li>
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
