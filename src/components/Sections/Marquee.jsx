import React from 'react';
import styles from './Marquee.module.css';

const items = [
    "High Laban: Authentic Egyptian Desserts",
    "Try our Pistachio Lotus",
    "Experience the Cheese Bomb",
    "Indulge in Nutella Salankatia",
    "Silky Smooth & Creamy",
    "Made with Love in Egypt",
];

const Marquee = () => {
    return (
        <section className={styles.marqueeSection}>
            <div className={styles.marqueeTrack}>
                <div className={styles.marqueeContent}>
                    {items.map((item, index) => (
                        <React.Fragment key={index}>
                            <span className={styles.text}>{item}</span>
                            <span className={styles.star}>★</span>
                        </React.Fragment>
                    ))}
                </div>
                {/* Duplicate for seamless scrolling */}
                <div className={styles.marqueeContent}>
                    {items.map((item, index) => (
                        <React.Fragment key={`dup-${index}`}>
                            <span className={styles.text}>{item}</span>
                            <span className={styles.star}>★</span>
                        </React.Fragment>
                    ))}
                </div>
                {/* Triplicate for extra safety on wide screens if needed, or just rely on CSS calc */}
                <div className={styles.marqueeContent}>
                    {items.map((item, index) => (
                        <React.Fragment key={`dup2-${index}`}>
                            <span className={styles.text}>{item}</span>
                            <span className={styles.star}>★</span>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Marquee;
