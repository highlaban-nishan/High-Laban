import React from 'react';
import Container from '../UI/Container';
import styles from './VideoSection.module.css';

// Placeholder Assets - You can replace these with real imports or URIs later
import project1 from '../../assets/project_preview_1.png'; // Using as placeholder
import project2 from '../../assets/project_preview_2.png';
import alwaysFreshBg from '../../assets/box.png';


export default function VideoSection() {
    return (
        <section id="video-features-section" className={styles.section}>
            <Container>
                <div className={styles.grid}>
                    {/* 1. Title Card */}
                    {/* 1. Title Card */}
                    <div className={`${styles.card} ${styles.whiteCard} ${styles.card1}`}>
                        <div className={styles.cardContent}>
                            <h2 style={{ 
                                fontSize: '1.95rem', 
                                fontWeight: '950', 
                                background: 'linear-gradient(135deg, #0f172a 20%, #27AAE1 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                margin: '0 0 6px 0', 
                                lineHeight: '1.15',
                                letterSpacing: '-0.8px'
                            }}>
                                The Heart of High Laban
                            </h2>
                            <span style={{ 
                                fontSize: '0.78rem', 
                                fontWeight: '900', 
                                color: '#27AAE1', 
                                textTransform: 'uppercase', 
                                display: 'block', 
                                marginBottom: '12px',
                                letterSpacing: '1.5px',
                                textShadow: '0 1px 2px rgba(39, 170, 225, 0.05)'
                            }}>
                                Where Egypt Meets Every Bite
                            </span>
                            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                                High Laban was born to introduce India to the true world of Egyptian desserts. We blend authentic recipes, premium ingredients, and modern creativity to create unforgettable dessert experiences.
                            </p>
                        </div>
                    </div>

                    {/* 2. Bangalore Launch Card */}
                    <div className={`${styles.card} ${styles.blueCard} ${styles.card2}`} style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white' }}>
                        <div className={styles.cardContent}>
                            <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'white', margin: '0 0 4px 0' }}>Hey Bangalore...</h2>
                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#e0f2fe', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>A New Dessert Journey Begins</span>
                            <p style={{ fontSize: '0.85rem', color: '#f0f9ff', lineHeight: '1.5', margin: 0 }}>Bangalore, you're the first to experience Egypt beyond Kunafa and Baklava. Discover iconic desserts like Umm Ali, Heba Cake, Qashtoota, Salankatia, and many more, crafted to surprise every dessert lover.</p>
                        </div>
                    </div>

                    {/* Stack: Finest Quality Ingredients + Expertly Crafted */}
                    <div className={styles.col1Stack}>
                        {/* 9. Finest Quality Ingredients (White) */}
                        <div className={`${styles.card} ${styles.whiteCard} ${styles.card9}`}>
                            <div className={styles.cardContent}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div className={styles.cardIcon} style={{ margin: 0 }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                    </div>
                                    <h3 className={styles.cardTitle} style={{ margin: 0, fontSize: '1.25rem' }}>Finest Quality Ingredients</h3>
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0ea5e9', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Only the Finest, Nothing Less</span>
                                <p className={styles.cardText} style={{ margin: 0 }}>Every dessert begins with carefully selected dairy, nuts, chocolate, and premium ingredients to deliver exceptional taste, texture, and freshness.</p>
                            </div>
                        </div>

                        {/* 3. Expertly Crafted (Blue) */}
                        <div className={`${styles.card} ${styles.blueCard} ${styles.card3}`}>
                            <div className={styles.cardContent}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div className={styles.cardIcon} style={{ margin: 0 }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                        </svg>
                                    </div>
                                    <h3 className={styles.cardTitle} style={{ margin: 0, fontSize: '1.25rem' }}>Expertly Crafted</h3>
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#e0f2fe', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Handcrafted with Passion</span>
                                <p className={styles.cardText} style={{ margin: 0 }}>Every dessert is prepared fresh by skilled chefs who combine authentic Egyptian techniques with modern presentation to create something truly unforgettable.</p>
                            </div>
                        </div>
                    </div>

                    {/* 4. True Egyptian Flavors (Blue) */}
                    <div className={`${styles.card} ${styles.blueCard} ${styles.card4}`}>
                        <div className={styles.cardContent}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className={styles.cardIcon} style={{ margin: 0 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                                    </svg>
                                </div>
                                <h3 className={styles.cardTitle} style={{ margin: 0, fontSize: '1.25rem' }}>True Egyptian Flavors</h3>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#e0f2fe', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Beyond Kunafa & Baklava</span>
                            <p className={styles.cardText} style={{ margin: 0 }}>Middle Eastern desserts are far more than what most people know. From Umm Ali, Heba Cake, Qashtoota, Salankatia, Roz Bel Laban and more, we're bringing Egypt's most loved desserts to India for the very first time.</p>
                        </div>
                    </div>

                    {/* 5. Celebrating Tradition (White) */}
                    <div className={`${styles.card} ${styles.whiteCard} ${styles.card5}`}>
                        <div className={styles.cardContent}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className={styles.cardIcon} style={{ margin: 0 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12" />
                                    </svg>
                                </div>
                                <h3 className={styles.cardTitle} style={{ margin: 0, fontSize: '1.25rem' }}>Celebrating Tradition</h3>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0ea5e9', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Honouring Heritage, Inspiring Innovation</span>
                            <p className={styles.cardText} style={{ margin: 0 }}>We preserve the soul of traditional Egyptian recipes while adding modern flavors and creative twists that today's dessert lovers will fall in love with.</p>
                        </div>
                    </div>

                    {/* 6. Pouring Video / Image (Tall/Square) */}
                    <div className={`${styles.card} ${styles.imageCard} ${styles.card6}`}>
                        <video
                            src="/video/story_card_6.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>

                    {/* 7. Box Image (Tall) */}
                    <div className={`${styles.card} ${styles.imageCard} ${styles.card7}`}>
                        <video
                            src="/video/story_card_7.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>

                    {/* 8. Always Fresh (Blue) */}
                    <div className={`${styles.card} ${styles.blueCard} ${styles.card8}`} style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url('${alwaysFreshBg}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(4px) brightness(0.6)',
                            zIndex: 0
                        }}></div>
                        <div className={styles.cardContent} style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className={styles.cardIcon} style={{ margin: 0 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                                <h3 className={styles.cardTitle} style={{ margin: 0, fontSize: '1.25rem' }}>Always Fresh</h3>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#e0f2fe', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Freshly Made, Every Day</span>
                            <p className={styles.cardText} style={{ margin: 0 }}>Every dessert is prepared fresh in small batches to ensure the perfect balance of flavour, texture, and quality in every bite.</p>
                        </div>
                    </div>





                </div>
            </Container>
        </section>
    );
}
