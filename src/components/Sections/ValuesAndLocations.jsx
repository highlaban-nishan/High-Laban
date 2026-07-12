import React, { useState, useEffect } from 'react';
import styles from './ValuesAndLocations.module.css';
import { FaMapMarkerAlt, FaTimes, FaWhatsapp, FaMapMarkedAlt, FaStore } from 'react-icons/fa';
import { FiPhone, FiShoppingBag, FiExternalLink, FiZap } from 'react-icons/fi';
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
                const sorted = [...(locs || [])].sort((a, b) => {
                    const statusA = (a.status || '').toLowerCase();
                    const statusB = (b.status || '').toLowerCase();
                    if (statusA === 'open' && statusB !== 'open') return -1;
                    if (statusA !== 'open' && statusB === 'open') return 1;
                    return 0;
                });
                setLocations(sorted);
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
                                        <div className={styles.cardInner}>
                                            {/* Front Side */}
                                            <div className={styles.cardFront}>
                                                <div>
                                                    {loc.imageUrl ? (
                                                        <div style={{ width: '100%', height: '140px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                                                            <img src={loc.imageUrl} alt={loc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                    ) : (
                                                        <div className={styles.locationIconWrapper}>
                                                            <FaMapMarkerAlt />
                                                        </div>
                                                    )}
                                                    <h3 className={styles.locationName}>{loc.area || loc.name}</h3>
                                                    {loc.area && <p className={styles.locationAddress}>{loc.name}</p>}
                                                </div>
                                                <div>
                                                    <div className={styles.divider} style={{ margin: '0.75rem 0' }}></div>
                                                    <span className={styles.locationStatus} style={{
                                                        color: loc.status === 'Coming Soon' ? '#f97316' :
                                                            loc.status === 'Closed' ? '#ef4444' : '#0ea5e9',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        {loc.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Back Side */}
                                            <div className={styles.cardBack}>
                                                <div>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Info</span>
                                                    <h3 className={styles.locationName} style={{ color: 'white', marginTop: '4px' }}>{loc.area || loc.name}</h3>
                                                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '12px 0 0', lineHeight: '1.4' }}>
                                                        <strong>Address:</strong> {loc.address || 'India Store'}
                                                    </p>
                                                    {loc.phone && (
                                                        <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '8px 0 0' }}>
                                                            📞 {loc.phone}
                                                        </p>
                                                    )}
                                                </div>
                                                <div style={{ textAlign: 'center', width: '100%' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0284c7', color: 'white', padding: '8px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        View & Order ➔
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
                                     const contactPhone = selectedLoc.phone || linkedFranchise.phone;
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
                                             <div style={{ color: '#0ea5e9', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}><FaStore /> Store Details</div>
                                             <div style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Owner Name:</span> <strong>{selectedLoc.ownerName || linkedFranchise.ownerName}</strong></div>
                                             {contactPhone && <div style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Contact:</span> <strong>{contactPhone}</strong></div>}
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
                                         <div style={{ color: '#0ea5e9', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><FaStore /> Store Details</div>
                                         {selectedLoc.ownerName && <div style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Owner Name:</span> <strong>{selectedLoc.ownerName}</strong></div>}
                                         {(selectedLoc.phone || selectedLoc.whatsapp) && <div style={{ color: '#334155' }}><span style={{ color: '#64748b' }}>Contact:</span> <strong>{selectedLoc.phone || selectedLoc.whatsapp}</strong></div>}
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
                                 <h4 style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}><FiZap style={{color:'#f59e0b'}}/> Order Online &amp; Navigate</h4>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                     
                                     {/* Direct Phone Call Button */}
                                     {selectedLoc.phone && (
                                         <a 
                                             href={`tel:${selectedLoc.phone}`}
                                             style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', color: 'white', textDecoration: 'none', padding: '11px 16px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', transition: 'all 0.2s ease' }}
                                         >
                                             <FiPhone style={{fontSize:'1rem'}}/> Call Store ({selectedLoc.phone})
                                         </a>
                                     )}
 
                                     {/* Maps Navigation */}
                                     {selectedLoc.mapUrl && (
                                         <a 
                                             href={selectedLoc.mapUrl} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', background: 'rgba(2, 132, 199, 0.15)', border: '1px solid rgba(2, 132, 199, 0.3)', backdropFilter: 'blur(4px)', color: '#0284c7', textDecoration: 'none', padding: '11px 16px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', transition: 'all 0.2s ease' }}
                                         >
                                             <FaMapMarkedAlt style={{fontSize:'1rem'}}/> Navigate on Google Maps
                                         </a>
                                     )}
 
                                     {/* WhatsApp */}
                                     {selectedLoc.whatsapp && (
                                         <a 
                                             href={selectedLoc.whatsapp.startsWith('http') ? selectedLoc.whatsapp : `https://wa.me/${selectedLoc.whatsapp.replace(/\D/g, '')}`}
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', background: 'rgba(37, 211, 102, 0.15)', border: '1px solid rgba(37, 211, 102, 0.3)', backdropFilter: 'blur(4px)', color: '#25d366', textDecoration: 'none', padding: '11px 16px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', transition: 'all 0.2s ease' }}
                                         >
                                             <FaWhatsapp style={{fontSize:'1.1rem'}}/> Order via WhatsApp
                                         </a>
                                     )}
 
                                     {/* Zomato */}
                                     {selectedLoc.zomato && (
                                         <a 
                                             href={selectedLoc.zomato} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', background: 'rgba(203, 32, 45, 0.12)', border: '1px solid rgba(203, 32, 45, 0.25)', backdropFilter: 'blur(4px)', color: '#cb202d', textDecoration: 'none', padding: '11px 16px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', transition: 'all 0.2s ease' }}
                                         >
                                             <FiShoppingBag style={{fontSize:'1rem'}}/> Order on Zomato
                                         </a>
                                     )}
 
                                     {/* Swiggy */}
                                     {selectedLoc.swiggy && (
                                         <a 
                                             href={selectedLoc.swiggy} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', background: 'rgba(252, 128, 25, 0.12)', border: '1px solid rgba(252, 128, 25, 0.25)', backdropFilter: 'blur(4px)', color: '#fc8019', textDecoration: 'none', padding: '11px 16px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', transition: 'all 0.2s ease' }}
                                         >
                                             <FiShoppingBag style={{fontSize:'1rem'}}/> Order on Swiggy
                                         </a>
                                     )}
 
                                     {/* MagicPin */}
                                     {selectedLoc.magicpin && (
                                         <a 
                                             href={selectedLoc.magicpin} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', background: 'rgba(236, 72, 153, 0.12)', border: '1px solid rgba(236, 72, 153, 0.25)', backdropFilter: 'blur(4px)', color: '#ec4899', textDecoration: 'none', padding: '11px 16px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', transition: 'all 0.2s ease' }}
                                         >
                                             <FiExternalLink style={{fontSize:'1rem'}}/> Order on Magicpin
                                         </a>
                                     )}
 
                                     {/* ONDC */}
                                     {selectedLoc.ondc && (
                                         <a 
                                             href={selectedLoc.ondc} 
                                             target="_blank" 
                                             rel="noopener noreferrer"
                                             style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', backdropFilter: 'blur(4px)', color: '#6366f1', textDecoration: 'none', padding: '11px 16px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', transition: 'all 0.2s ease' }}
                                         >
                                             <FiShoppingBag style={{fontSize:'1rem'}}/> Order via ONDC
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
