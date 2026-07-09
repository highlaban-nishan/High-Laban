import React, { useLayoutEffect, useState, useEffect } from 'react';
import SEO from '../components/SEO/SEO';
import db from '../utils/db';

export default function AboutUs() {
    const [founders, setFounders] = useState([
        { name: 'Mohammed Nishan P', role: 'Co-Founder', imageUrl: '' },
        { name: 'Muhammed Marshad PPTK', role: 'Co-Founder & Director', imageUrl: '' },
        { name: 'Muhammed Nufoor MK', role: 'Co-Founder & Chief Product Officer', imageUrl: '' }
    ]);

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        // Load dynamically from site content highlights or customizable table
        const unsubscribe = db.subscribeToSiteContent('about_founders', (data) => {
            if (data && Array.isArray(data.foundersList)) {
                setFounders(data.foundersList);
            }
        });
        return () => unsubscribe && unsubscribe();
    }, []);

    return (
        <>
            <SEO
                title="About Us | High Laban - Egyptian Desserts"
                description="Learn about the founders, mission, and vision of High Laban Egyptian Desserts."
                keywords="about us, High Laban, mission, vision, founders, Nishan, Marshad, Nufoor"
            />
            <div style={{
                background: 'var(--color-bg-dark, #0f172a)',
                color: '#fff',
                fontFamily: "'Outfit', sans-serif",
                minHeight: '100vh',
                padding: '1.5rem 1.25rem 4rem', // Highly reduced top padding to remove empty space on mobile
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={{ maxWidth: '800px', width: '100%' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <span style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: '900', 
                            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', 
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '3px', 
                            textTransform: 'uppercase' 
                        }}>
                            ABOUT US
                        </span>
                        <h1 style={{ 
                            fontSize: '2.5rem', 
                            fontWeight: '950', 
                            background: 'linear-gradient(135deg, #ffffff 40%, #bae6fd 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            margin: '8px 0 0 0',
                            letterSpacing: '-1px'
                        }}>
                            About High Laban
                        </h1>
                        <div style={{ width: '50px', height: '4px', background: '#0ea5e9', margin: '12px auto 0', borderRadius: '2px' }}></div>
                    </div>

                    {/* About section */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '24px', marginBottom: '2.5rem', backdropFilter: 'blur(10px)' }}>
                        <p style={{ fontSize: '1.15rem', lineHeight: '1.8', color: '#cbd5e1', margin: 0, fontWeight: '400' }}>
                            High Laban is where Egypt’s classic desserts meet modern indulgence. Born from a love for Middle Eastern sweets and inspired by global dessert trends, we blend authentic Egyptian recipes with a fresh twist that connects with today’s taste buds. From Kunafa and Umm Ali to new-age fusion creations layered with chocolate, cream, and pistachio, every bite is handcrafted to balance tradition and innovation. We believe in honest ingredients, real textures, and the kind of sweetness that makes you pause and smile. At High Laban, you don’t just eat dessert — you get high on bites.
                        </p>
                    </div>

                    {/* Mission & Vision grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                        
                        {/* Mission */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0ea5e9', margin: '0 0 1rem 0' }}>Our Mission</h3>
                                <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#cbd5e1', margin: 0 }}>
                                    Our mission is to create desserts that celebrate Egypt’s rich heritage while connecting with modern global tastes. We stay rooted in authentic techniques and ingredients, yet continue to explore new flavour combinations and textures. High Laban stands for quality, passion, and the joy of cultural food experiences. We aim to share the beauty of Egyptian dessert culture across the world and make it a part of every dessert lover’s story.
                                </p>
                            </div>
                        </div>

                        {/* Vision */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0ea5e9', margin: '0 0 1rem 0' }}>Our Vision</h3>
                                <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#cbd5e1', margin: 0 }}>
                                    To redefine how Indian dessert lovers experience Egyptian and Middle Eastern sweets — by blending authenticity, creativity, and global inspiration in every bite.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Founders */}
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'white', textAlign: 'center', marginBottom: '2.5rem' }}>Meet Our Founders</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                            {founders.map((f, i) => (
                                <div key={i} style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '20px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    transition: 'transform 0.3s ease',
                                    cursor: 'default'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                >
                                    {f.imageUrl ? (
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            margin: '0 auto 1.25rem',
                                            border: '2px solid #0ea5e9',
                                            boxShadow: '0 4px 10px rgba(14,165,233,0.2)'
                                        }}>
                                            <img src={f.imageUrl} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            background: '#0ea5e9',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1.25rem',
                                            fontSize: '1.75rem',
                                            fontWeight: '800',
                                            color: 'white',
                                            boxShadow: '0 4px 10px rgba(14,165,233,0.2)'
                                        }}>
                                            {f.name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                    )}
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '800', color: 'white' }}>{f.name}</h4>
                                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>{f.role}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
