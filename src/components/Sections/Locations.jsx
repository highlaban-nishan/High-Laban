import React, { useState, useEffect } from 'react';
import Container from '../UI/Container';
import styles from './Locations.module.css';
import { FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import db from '../../utils/db';

export default function Locations() {
    const [locations, setLocations] = useState([]);
    const [franchises, setFranchises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLoc, setSelectedLoc] = useState(null);
    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    useEffect(() => {
        const unsubscribe = db.subscribeToLocations((fetched) => {
            setLocations(fetched);
            setLoading(false);
        });
        db.getFranchises().then(fetchedFrans => {
            setFranchises(fetchedFrans || []);
        });
        return () => unsubscribe && unsubscribe();
    }, []);

    // Reset carousel index when selected location changes
    useEffect(() => {
        setCurrentImgIndex(0);
    }, [selectedLoc]);

    if (loading) return null;

    // Deduplicate any images between legacy imageUrl and imageUrls array
    const getAllImages = (loc) => {
        if (!loc) return [];
        const imgs = [];
        if (loc.imageUrl) imgs.push(loc.imageUrl);
        if (loc.imageUrls && Array.isArray(loc.imageUrls)) {
            loc.imageUrls.forEach(url => {
                if (url && !imgs.includes(url)) imgs.push(url);
            });
        }
        return imgs;
    };

    return (
        <section className={styles.section}>
            <Container>
                <div className={styles.header}>
                    <p className={styles.subtitle}>FIND US</p>
                    <h2 className={styles.title}>Our Locations</h2>
                    <p className={styles.description}>Find your nearest HighLaban and experience the taste of Egypt.</p>
                </div>

                <div className={styles.grid}>
                    {locations.map(loc => {
                        return (
                            <div 
                                key={loc.id} 
                                className={styles.card}
                                onClick={() => setSelectedLoc(loc)}
                                style={{ cursor: 'pointer', overflow: 'hidden', padding: '0', display: 'flex', flexDirection: 'column', border: '1px solid rgba(0,0,0,0.07)', background: '#fff', borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                            >
                                {loc.imageUrl ? (
                                    <img 
                                        src={loc.imageUrl} 
                                        alt={loc.name} 
                                        style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} 
                                    />
                                ) : null}
                                
                                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                                    {/* Icon when no image */}
                                    {!loc.imageUrl && (
                                        <div style={{ width: '48px', height: '48px', background: '#f0f9ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                                            <FaMapMarkerAlt style={{ color: '#0ea5e9', fontSize: '1.2rem' }} />
                                        </div>
                                    )}
                                    <h3 className={styles.locationName} style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#0f172a' }}>{loc.name}</h3>
                                    <p className={styles.locationAddress} style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#64748b' }}>{loc.area}</p>

                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {loc.status === 'Coming Soon' ? (
                                            <span style={{ color: '#f97316', fontSize: '0.8rem', fontWeight: 'bold' }}>Coming Soon</span>
                                        ) : loc.status === 'Closed' ? (
                                            <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold' }}>Closed</span>
                                        ) : (
                                            <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 'bold' }}>Open</span>
                                        )}
                                        <span style={{ fontSize: '0.8rem', color: '#0ea5e9', fontWeight: 'bold' }}>View Details ➔</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Container >

            {/* POPUP MODAL */}
            {selectedLoc && (() => {
                const locImages = getAllImages(selectedLoc);
                return (
                    <div 
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9999,
                            background: 'rgba(0,0,0,0.85)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem'
                        }}
                        onClick={() => setSelectedLoc(null)}
                    >
                        <div 
                            style={{
                                background: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '20px',
                                maxWidth: '480px',
                                width: '100%',
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                position: 'relative'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button 
                                onClick={() => setSelectedLoc(null)}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: 'rgba(0,0,0,0.5)',
                                    color: 'white',
                                    border: 'none',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 10
                                }}
                            >
                                <FaTimes />
                            </button>

                            {/* Carousel Slider */}
                            {locImages.length > 0 ? (
                                <div style={{ position: 'relative', width: '100%', height: '220px', background: '#0f172a', overflow: 'hidden' }}>
                                    <img 
                                        src={locImages[currentImgIndex]} 
                                        alt={`${selectedLoc.name} View ${currentImgIndex + 1}`} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                    
                                    {locImages.length > 1 && (
                                        <>
                                            {/* Prev Button */}
                                            <button 
                                                onClick={() => setCurrentImgIndex(prev => (prev - 1 + locImages.length) % locImages.length)}
                                                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5, fontSize: '0.8rem' }}
                                            >
                                                ◀
                                            </button>
                                            
                                            {/* Next Button */}
                                            <button 
                                                onClick={() => setCurrentImgIndex(prev => (prev + 1) % locImages.length)}
                                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5, fontSize: '0.8rem' }}
                                            >
                                                ▶
                                            </button>

                                            {/* Dot Indicators */}
                                            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 5 }}>
                                                {locImages.map((_, i) => (
                                                    <div 
                                                        key={i}
                                                        onClick={() => setCurrentImgIndex(i)}
                                                        style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === currentImgIndex ? '#0ea5e9' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'background 0.2s' }}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div style={{ width: '100%', height: '160px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                                    📍
                                </div>
                            )}

                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1.4rem', fontWeight: '800' }}>{selectedLoc.name}</h3>
                                <p style={{ margin: '0 0 1rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>{selectedLoc.area}</p>

                                {/* Linked Franchise Owner & Contact Info */}
                                {(() => {
                                    const linkedFranchise = franchises.find(f => f.id === selectedLoc.franchiseId || f.locationId === selectedLoc.id);
                                    if (linkedFranchise) {
                                        return (
                                            <div style={{
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '12px',
                                                padding: '12px 16px',
                                                marginBottom: '1.25rem',
                                                fontSize: '0.85rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px'
                                            }}>
                                                <div style={{ color: '#0ea5e9', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '2px' }}>🏪 Store Details</div>
                                                <div style={{ color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Owner:</span> <strong>{linkedFranchise.ownerName}</strong></div>
                                                <div style={{ color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Contact:</span> <strong>{linkedFranchise.phone}</strong></div>
                                                {linkedFranchise.email && <div style={{ color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Email:</span> <strong>{linkedFranchise.email}</strong></div>}
                                                <div style={{ color: '#e2e8f0', display: 'flex', gap: '4px' }}>
                                                    <span style={{ color: '#94a3b8', flexShrink: 0 }}>Address:</span>
                                                    <strong style={{ color: '#f1f5f9' }}>{linkedFranchise.address || selectedLoc.name}</strong>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            marginBottom: '1.25rem',
                                            fontSize: '0.85rem'
                                        }}>
                                            <div style={{ color: '#0ea5e9', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '6px' }}>🏪 Store Details</div>
                                            <div style={{ color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Contact:</span> <strong>{selectedLoc.whatsapp || 'N/A'}</strong></div>
                                            <div style={{ color: '#e2e8f0', marginTop: '4px', display: 'flex', gap: '4px' }}>
                                                <span style={{ color: '#94a3b8', flexShrink: 0 }}>Address:</span>
                                                <strong style={{ color: '#f1f5f9' }}>{selectedLoc.area}</strong>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.25rem' }}></div>

                                <h4 style={{ margin: '0 0 10px 0', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ Connect & Order Online</h4>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {/* Map Link */}
                                    {selectedLoc.mapUrl && (
                                        <a 
                                            href={selectedLoc.mapUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#0284c7', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            📍 Navigate on Google Maps
                                        </a>
                                    )}

                                    {/* WhatsApp Link */}
                                    {selectedLoc.whatsapp && (
                                        <a 
                                            href={selectedLoc.whatsapp.startsWith('http') ? selectedLoc.whatsapp : `https://wa.me/${selectedLoc.whatsapp.replace(/\D/g, '')}`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25d366', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            💬 Order via WhatsApp
                                        </a>
                                    )}

                                    {/* Zomato Link */}
                                    {selectedLoc.zomato && (
                                        <a 
                                            href={selectedLoc.zomato} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#cb202d', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            🔴 Order on Zomato
                                        </a>
                                    )}

                                    {/* Swiggy Link */}
                                    {selectedLoc.swiggy && (
                                        <a 
                                            href={selectedLoc.swiggy} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fc8019', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            🧡 Order on Swiggy
                                        </a>
                                    )}

                                    {/* Magicpin Link */}
                                    {selectedLoc.magicpin && (
                                        <a 
                                            href={selectedLoc.magicpin} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#ec4899', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            ✨ Order on Magicpin
                                        </a>
                                    )}

                                    {/* ONDC Link */}
                                    {selectedLoc.ondc && (
                                        <a 
                                            href={selectedLoc.ondc} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#6366f1', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            🛍️ Order via ONDC Shop
                                        </a>
                                    )}

                                    {/* If no links are configured */}
                                    {!selectedLoc.mapUrl && !selectedLoc.whatsapp && !selectedLoc.zomato && !selectedLoc.swiggy && !selectedLoc.magicpin && !selectedLoc.ondc && (
                                        <p style={{ margin: 0, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem', padding: '10px' }}>
                                            No delivery or booking links configured for this store yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </section >
    );
}
