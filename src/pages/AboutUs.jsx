import React, { useLayoutEffect } from 'react';
import SEO from '../components/SEO/SEO';

export default function AboutUs() {
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const founders = [
        { name: 'Mohammed Nishan P', role: 'Co-Founder' },
        { name: 'Muhammed Marshad PPTK', role: 'Co-Founder & Director' },
        { name: 'Muhammed Nufoor MK', role: 'Co-Founder & Chief Product Officer' }
    ];

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
                padding: '8rem 2rem 4rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={{ maxWidth: '800px', width: '100%' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0ea5e9', letterSpacing: '3px', textTransform: 'uppercase' }}>Our Story</span>
                        <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'white', margin: '10px 0 0 0' }}>About High Laban</h1>
                        <div style={{ width: '60px', height: '4px', background: '#0ea5e9', margin: '20px auto 0', borderRadius: '2px' }}></div>
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
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0ea5e9', margin: '0 0 1rem 0' }}>🎯 Our Mission</h3>
                                <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#cbd5e1', margin: 0 }}>
                                    Our mission is to create desserts that celebrate Egypt’s rich heritage while connecting with modern global tastes. We stay rooted in authentic techniques and ingredients, yet continue to explore new flavour combinations and textures. High Laban stands for quality, passion, and the joy of cultural food experiences. We aim to share the beauty of Egyptian dessert culture across the world and make it a part of every dessert lover’s story.
                                </p>
                            </div>
                        </div>

                        {/* Vision */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0ea5e9', margin: '0 0 1rem 0' }}>👁️ Our Vision</h3>
                                <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#cbd5e1', margin: 0 }}>
                                    To redefine how Indian dessert lovers experience Egyptian and Middle Eastern sweets — by blending authenticity, creativity, and global inspiration in every bite.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Founders */}
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'white', textAlign: 'center', marginBottom: '2.5rem' }}>👥 Meet Our Founders</h2>
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
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: '#0ea5e9',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 1.25rem',
                                        fontSize: '1.5rem',
                                        fontWeight: '800',
                                        color: 'white'
                                    }}>
                                        {f.name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').slice(0, 2)}
                                    </div>
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
