import React, { useState, useEffect } from 'react';
import styles from './ValuesAndLocations.module.css';
import { FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import db from '../../utils/db';

import useScrollReveal from '../../hooks/useScrollReveal';
import useCountUp from '../../hooks/useCountUp';

const StatItem = ({ label, target, suffix, start }) => {
    const count = useCountUp(target, 2500, start);
    return (
        <div className={`${styles.statItem} reveal`}>
            <div className={styles.statValue}>{count}{suffix}</div>
            <div className={styles.statLabel}>{label}</div>
        </div>
    );
};

export default function ValuesAndLocations() {
    const [locations, setLocations] = useState([]);
    const [products, setProducts] = useState([]);
    const [franchises, setFranchises] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedLoc, setSelectedLoc] = useState(null);
    const [visibleGalleryCount, setVisibleGalleryCount] = useState(3);

    const [startCounting, setStartCounting] = useState(false);

    useScrollReveal();

    // Intersection Observer to start counting when stats are visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setStartCounting(true);
                    observer.disconnect(); // Only trigger once
                }
            },
            { threshold: 0.2 }
        );

        const section = document.getElementById('stats-section');
        if (section) observer.observe(section);

        return () => observer.disconnect();
    }, []);

    const [customStats, setCustomStats] = useState({
        happyCustomersVal: 10,
        happyCustomersSuffix: 'K+',
        varietiesVal: 30,
        varietiesSuffix: '+'
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await db.getSiteContent('stats');
                if (data) {
                    setCustomStats({
                        happyCustomersVal: parseInt(data.happyCustomersVal) || 10,
                        happyCustomersSuffix: data.happyCustomersSuffix || 'K+',
                        varietiesVal: parseInt(data.varietiesVal) || 30,
                        varietiesSuffix: data.varietiesSuffix || '+'
                    });
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const locs = await db.getLocations();
                setLocations(locs);
                const prods = await db.getProducts();
                setProducts(prods || []);
                const frans = await db.getFranchises();
                setFranchises(frans || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const calculatedVarieties = products.reduce((acc, p) => {
        let count = 1;
        if (p.images && p.images.length > 0) {
            count += p.images.length - 1;
        }
        const toppingsCount = Array.isArray(p.toppings) 
            ? p.toppings.length 
            : (p.toppings ? p.toppings.split(',').map(t => t.trim()).filter(Boolean).length : 0);
        count += toppingsCount;
        return acc + count;
    }, 0);
    const varietiesCount = calculatedVarieties || customStats.varietiesVal;

    const openLocationsCount = locations.filter(l => l.status === 'Open').length || 1;
    const stats = [
        { label: "LOCATIONS", target: openLocationsCount, suffix: "+" },
        { label: "HAPPY CUSTOMERS", target: customStats.happyCustomersVal, suffix: customStats.happyCustomersSuffix },
        { label: "VARIETIES", target: varietiesCount, suffix: "+" }
    ];

    const handleCardClick = (loc) => {
        setSelectedLoc(loc);
        setVisibleGalleryCount(3); // Show 3 images initially
    };

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                {/* Top Section - Stats */}
                <div id="stats-section" className={styles.statsWrapper}>
                    {stats.map((stat, index) => (
                        <React.Fragment key={index}>
                            <StatItem
                                label={stat.label}
                                target={stat.target}
                                suffix={stat.suffix}
                                start={startCounting}
                            />
                            {index < stats.length - 1 && <div className={`${styles.separator} reveal reveal-delay-200`}></div>}
                        </React.Fragment>
                    ))}
                </div>

                {/* Bottom Section - Locations */}
                <div id="locations" className={styles.locationsWrapper}>
                    <span className={styles.smallLabel}>FIND US</span>
                    <h2 className={styles.sectionTitle}>Our Locations</h2>
                    <p className={styles.sectionSubtitle}>Find your nearest HighLaban and experience the taste of Egypt.</p>

                    <div className={styles.locationsGrid}>
                        {loading ? (
                            <p style={{ color: '#94a3b8' }}>Loading locations...</p>
                        ) : locations.length > 0 ? (
                            locations.map((loc) => {
                                return (
                                    <div 
                                        key={loc.id} 
                                        onClick={() => handleCardClick(loc)}
                                        className={styles.locationCard}
                                    >
                                        {loc.imageUrl ? (
                                            <div style={{ width: '100%', height: '150px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                                                <img src={loc.imageUrl} alt={loc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ) : (
                                            <div className={styles.locationIconWrapper}>
                                                <FaMapMarkerAlt />
                                            </div>
                                        )}
                                        {/* Area Name (Big Title) e.g., Bangalore */}
                                        <h3 className={styles.locationName}>{loc.area || loc.name}</h3>

                                        {/* Full Name / Subtitle e.g., Bangalore - India */}
                                        {loc.area && <p className={styles.locationAddress}>{loc.name}</p>}

                                        <div className={styles.divider}></div>

                                        {/* Status */}
                                        <span className={styles.locationStatus} style={{
                                            color: loc.status === 'Coming Soon' ? '#f97316' :
                                                loc.status === 'Closed' ? '#ef4444' : '#0ea5e9'
                                        }}>
                                            {loc.status}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles.locationCard}>
                                <div className={styles.locationIconWrapper}>
                                    <FaMapMarkerAlt />
                                </div>
                                <h3 className={styles.locationName}>New Locations</h3>
                                <p className={styles.locationAddress}>Coming Soon</p>
                                <div className={styles.divider}></div>
                                <span className={styles.locationStatus}>Stay Tuned</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Location Details Popup Modal Overlay */}
            {selectedLoc && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    animation: 'fadeIn 0.25s ease-out'
                }} onClick={() => setSelectedLoc(null)}>
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes slideUp {
                            from { transform: translateY(20px); opacity: 0; }
                            to { transform: translateY(0); opacity: 1; }
                        }
                    `}</style>

                    <div style={{
                        background: 'white',
                        width: '100%',
                        maxWidth: '550px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '90vh'
                    }} onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
                                    {selectedLoc.name}
                                </h3>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                                    📍 {selectedLoc.area}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedLoc(null)}
                                style={{
                                    background: '#f8fafc',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = '#f8fafc'; }}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            
                            {/* Store Details Card (Owner Details, Address, Phone) */}
                            {(() => {
                                const linkedFranchise = franchises.find(f => f.id === selectedLoc.franchiseId || f.locationId === selectedLoc.id);
                                if (linkedFranchise) {
                                    return (
                                        <div style={{
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '16px',
                                            padding: '16px',
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px'
                                        }}>
                                            <div style={{ color: '#0ea5e9', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '2px' }}>🏪 Store Details</div>
                                            <div style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Owner Name:</span> <strong>{selectedLoc.ownerName || linkedFranchise.ownerName}</strong></div>
                                            {selectedLoc.phone && <div style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Store Phone:</span> <strong>{selectedLoc.phone}</strong></div>}
                                            <div style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Franchise Contact:</span> <strong>{linkedFranchise.phone}</strong></div>
                                            {(selectedLoc.ownerEmail || linkedFranchise.email) && <div style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Email:</span> <strong>{selectedLoc.ownerEmail || linkedFranchise.email}</strong></div>}
                                            <div style={{ color: '#334155', display: 'flex', gap: '4px' }}>
                                                <span style={{ color: '#64748b', flexShrink: 0 }}>Address:</span>
                                                <strong style={{ color: '#1e293b' }}>{selectedLoc.address || linkedFranchise.address || selectedLoc.name}</strong>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '16px',
                                        padding: '16px',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}>
                                        <div style={{ color: '#0ea5e9', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '6px' }}>🏪 Store Details</div>
                                        {selectedLoc.ownerName && <div style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Owner Name:</span> <strong>{selectedLoc.ownerName}</strong></div>}
                                        {selectedLoc.phone && <div style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Store Phone:</span> <strong>{selectedLoc.phone}</strong></div>}
                                        <div style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Contact Phone:</span> <strong>{selectedLoc.whatsapp || 'N/A'}</strong></div>
                                        {selectedLoc.ownerEmail && <div style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Email:</span> <strong>{selectedLoc.ownerEmail}</strong></div>}
                                        <div style={{ color: '#334155', marginTop: '4px', display: 'flex', gap: '4px' }}>
                                            <span style={{ color: '#64748b', flexShrink: 0 }}>Address:</span>
                                            <strong style={{ color: '#1e293b' }}>{selectedLoc.address || selectedLoc.area}</strong>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Delivery & Ordering Links */}
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ Order Online & Navigate</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    
                                    {/* Direct Phone Call Button */}
                                    {selectedLoc.phone && (
                                        <a 
                                            href={`tel:${selectedLoc.phone}`}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#0f172a', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            📞 Call Store ({selectedLoc.phone})
                                        </a>
                                    )}

                                    {/* Maps Navigation */}
                                    {selectedLoc.mapUrl && (
                                        <a 
                                            href={selectedLoc.mapUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#0284c7', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            📍 Navigate on Google Maps
                                        </a>
                                    )}

                                    {/* WhatsApp */}
                                    {selectedLoc.whatsapp && (
                                        <a 
                                            href={selectedLoc.whatsapp.startsWith('http') ? selectedLoc.whatsapp : `https://wa.me/${selectedLoc.whatsapp.replace(/\D/g, '')}`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25d366', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            💬 Order via WhatsApp
                                        </a>
                                    )}

                                    {/* Zomato */}
                                    {selectedLoc.zomato && (
                                        <a 
                                            href={selectedLoc.zomato} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#cb202d', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            🔴 Order on Zomato
                                        </a>
                                    )}

                                    {/* Swiggy */}
                                    {selectedLoc.swiggy && (
                                        <a 
                                            href={selectedLoc.swiggy} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fc8019', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            🧡 Order on Swiggy
                                        </a>
                                    )}

                                    {/* MagicPin */}
                                    {selectedLoc.magicpin && (
                                        <a 
                                            href={selectedLoc.magicpin} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#ec4899', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            ✨ Order on Magicpin
                                        </a>
                                    )}

                                    {/* ONDC */}
                                    {selectedLoc.ondc && (
                                        <a 
                                            href={selectedLoc.ondc} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#6366f1', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'background 0.2s' }}
                                        >
                                            🛍️ Order via ONDC
                                        </a>
                                    )}

                                    {!selectedLoc.mapUrl && !selectedLoc.whatsapp && !selectedLoc.zomato && !selectedLoc.swiggy && !selectedLoc.magicpin && !selectedLoc.ondc && (
                                        <p style={{ margin: 0, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem', padding: '10px' }}>
                                            No delivery links configured for this location yet.
                                        </p>
                                    )}

                                </div>
                            </div>

                            {/* Gallery Section with Load More */}
                            {(() => {
                                const galleryImages = [
                                    ...(selectedLoc.imageUrl ? [selectedLoc.imageUrl] : []),
                                    ...(selectedLoc.imageUrls || [])
                                ].filter((val, index, self) => self.indexOf(val) === index && val.trim() !== '');

                                if (galleryImages.length === 0) return null;

                                const displayedImages = galleryImages.slice(0, visibleGalleryCount);

                                return (
                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📸 Gallery</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                                            {displayedImages.map((img, idx) => (
                                                <a 
                                                    key={idx} 
                                                    href={img} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ display: 'block', height: '90px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1' }}
                                                >
                                                    <img src={img} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </a>
                                            ))}
                                        </div>

                                        {galleryImages.length > visibleGalleryCount && (
                                            <button 
                                                onClick={() => setVisibleGalleryCount(prev => prev + 3)}
                                                style={{
                                                    width: '100%',
                                                    background: 'transparent',
                                                    border: '1.5px dashed #cbd5e1',
                                                    color: '#009ceb',
                                                    padding: '8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#009ceb'; e.currentTarget.style.background = '#f0f9ff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                + Load More Images ({galleryImages.length - visibleGalleryCount} left)
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}

                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderTop: '1px solid #f1f5f9',
                            background: '#f8fafc',
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}>
                            <button 
                                onClick={() => setSelectedLoc(null)}
                                style={{
                                    background: '#0f172a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 24px',
                                    borderRadius: '50px',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(15,23,42,0.15)'
                                }}
                            >
                                Close Details
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </section>
    );
}
