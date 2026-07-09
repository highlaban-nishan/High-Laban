import React from 'react';
import Container from '../UI/Container';
import styles from './VideoSection.module.css';
import cheesePullKunafa from '../../assets/cheese_pull_kunafa.png';

export default function VideoSection() {
    return (
        <section id="video-features-section" className={styles.section}>
            <Container>
                <div className={styles.grid}>
                    {/* Card 1 - Brand Story (White) */}
                    <div className={`${styles.card} ${styles.whiteCard} ${styles.card1}`}>
                        <div className={styles.cardContent}>
                            <span style={{ fontSize: '12px', uppercase: true, fontWeight: '700', letterSpacing: '1.5px', color: '#27AAE1', display: 'block', marginBottom: '8px' }}>
                                OUR STORY
                            </span>
                            <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#17324A', margin: '0 0 12px 0', lineHeight: '1.2' }}>
                                Egypt's Sweet Legacy
                            </h2>
                            <p style={{ fontSize: '16px', color: '#5F7285', lineHeight: '1.7', margin: 0 }}>
                                High Laban brings Egypt's most loved desserts to India, blending authentic recipes, premium craftsmanship and a modern dessert experience inspired by Egyptian culture.
                            </p>
                        </div>
                    </div>

                    {/* Card 2 - Hero Feature (Brand Blue) */}
                    <div className={`${styles.card} ${styles.blueCard} ${styles.card2}`}>
                        <div className={styles.cardContent}>
                            <span style={{ fontSize: '12px', uppercase: true, fontWeight: '700', letterSpacing: '1.5px', color: 'rgba(255,255,255,.75)', display: 'block', marginBottom: '8px' }}>
                                EGYPTIAN HERITAGE
                            </span>
                            <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 12px 0', lineHeight: '1.2' }}>
                                Beyond Kunafa
                            </h2>
                            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.90)', lineHeight: '1.7', margin: 0 }}>
                                Egyptian desserts are much more than Kunafa. Explore timeless favourites like Umm Ali, Roz Bel Laban, Basbousa, Ash Ali and Salankati, each carrying generations of flavour and culture.
                            </p>
                        </div>
                    </div>

                    {/* Stack: Ingredients (Card 9) + Prepared Fresh Daily (Card 3) */}
                    <div className={styles.col1Stack}>
                        {/* Card 9 - Ingredients (Soft Blue) */}
                        <div className={`${styles.card} ${styles.card9}`} style={{ background: '#F5FAFD', color: '#17324A', border: '1px solid #EAECEF' }}>
                            <div className={styles.cardContent}>
                                <span style={{ fontSize: '12px', uppercase: true, fontWeight: '700', letterSpacing: '1.5px', color: '#27AAE1', display: 'block', marginBottom: '8px' }}>
                                    QUALITY FIRST
                                </span>
                                <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#17324A', margin: '0 0 12px 0', lineHeight: '1.2' }}>
                                    Every Ingredient Matters
                                </h2>
                                <p style={{ fontSize: '16px', color: '#5F7285', lineHeight: '1.7', margin: 0 }}>
                                    From premium dairy to carefully selected nuts, chocolate and butter, every ingredient is chosen to deliver exceptional taste and texture.
                                </p>
                            </div>
                        </div>

                        {/* Card 3 - Prepared Fresh Daily (Small Card) */}
                        <div className={`${styles.card} ${styles.card3}`} style={{ background: '#17324A', color: '#FFFFFF', border: '1px solid #EAECEF' }}>
                            <div className={styles.cardContent}>
                                <span style={{ fontSize: '12px', uppercase: true, fontWeight: '700', letterSpacing: '1.5px', color: '#8AD7FF', display: 'block', marginBottom: '8px' }}>
                                    MADE FRESH DAILY
                                </span>
                                <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 12px 0', lineHeight: '1.2' }}>
                                    Prepared Throughout The Day
                                </h2>
                                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.85)', lineHeight: '1.7', margin: 0 }}>
                                    Every dessert is freshly prepared in small batches to ensure perfect warmth, texture and consistency in every serving.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card 4 - Bangalore Story (Warm Neutral) */}
                    <div className={`${styles.card} ${styles.card4}`} style={{ background: '#F7F7F5', color: '#17324A', border: '1px solid #EAECEF' }}>
                        <div className={styles.cardContent}>
                            <span style={{ fontSize: '12px', uppercase: true, fontWeight: '700', letterSpacing: '1.5px', color: '#27AAE1', display: 'block', marginBottom: '8px' }}>
                                FIRST CITY
                            </span>
                            <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#17324A', margin: '0 0 12px 0', lineHeight: '1.2' }}>
                                Hello Bangalore
                            </h2>
                            <p style={{ fontSize: '16px', color: '#5F7285', lineHeight: '1.7', margin: 0 }}>
                                Our journey begins in Bangalore, introducing authentic Egyptian dessert culture to a city that loves discovering unforgettable food experiences.
                            </p>
                        </div>
                    </div>

                    {/* Card 5 - Dessert Experience (White) */}
                    <div className={`${styles.card} ${styles.whiteCard} ${styles.card5}`}>
                        <div className={styles.cardContent}>
                            <span style={{ fontSize: '12px', uppercase: true, fontWeight: '700', letterSpacing: '1.5px', color: '#27AAE1', display: 'block', marginBottom: '8px' }}>
                                THE EXPERIENCE
                            </span>
                            <h2 style={{ fontSize: '34px', fontWeight: '800', color: '#17324A', margin: '0 0 12px 0', lineHeight: '1.2' }}>
                                Every Bite Tells A Story
                            </h2>
                            <p style={{ fontSize: '16px', color: '#5F7285', lineHeight: '1.7', margin: 0 }}>
                                Every dessert is crafted to deliver rich flavours, beautiful presentation and memorable moments worth sharing with friends and family.
                            </p>
                        </div>
                    </div>

                    {/* Card 6 - Story Video One (Floating text layout) */}
                    <div className={`${styles.card} ${styles.imageCard} ${styles.card6}`} style={{ position: 'relative' }}>
                        <video
                            src="/video/story_card_6.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            padding: '24px',
                            zIndex: 3
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                AUTHENTIC EGYPTIAN DESSERTS
                            </span>
                            <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: 0, lineHeight: '1.2' }}>
                                From Egypt<br/>to Bangalore
                            </h3>
                        </div>
                    </div>

                    {/* Card 7 - Story Video Two (Floating text layout) */}
                    <div className={`${styles.card} ${styles.imageCard} ${styles.card7}`} style={{ position: 'relative' }}>
                        <video
                            src="/video/story_card_7.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            padding: '24px',
                            zIndex: 3
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                MADE FRESH DAILY
                            </span>
                            <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: 0, lineHeight: '1.2' }}>
                                Crafted<br/>Every Day
                            </h3>
                        </div>
                    </div>

                    {/* Card 8 - Dessert Photography (Food Hero Kunafa Image) */}
                    <div className={`${styles.card} ${styles.imageCard} ${styles.card8}`} style={{ overflow: 'hidden' }}>
                        <img 
                            src={cheesePullKunafa} 
                            alt="Cheese Pull Kunafa" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                    </div>
                </div>
            </Container>
        </section>
    );
}
