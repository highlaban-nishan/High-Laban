import React, { useState, useEffect, useRef } from 'react';
import { FiInstagram, FiMapPin, FiChevronDown, FiPhoneCall, FiTwitter, FiYoutube, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaWhatsapp, FaLinkedinIn, FaFacebookF } from 'react-icons/fa';
import styles from './Connect.module.css';
import db from '../utils/db';
import logo from '../assets/logo.png';
import kunafaImg from '../assets/cheese_pull_kunafa.png';
import cupImg from '../assets/cup.png';
import boxImg from '../assets/box.png';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import FranchiseForm from '../components/Franchise/FranchiseForm';

const ensureAbsoluteUrl = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
        return trimmed;
    }
    return `https://${trimmed}`;
};

// Always produce a valid https://wa.me/<digits> URL from any input
const ensureWaUrl = (val) => {
    if (!val) return '';
    const v = val.trim();
    // Already a full wa.me or whatsapp URL
    if (v.startsWith('https://wa.me') || v.startsWith('https://api.whatsapp') || v.startsWith('https://whatsapp.com')) return v;
    // Full https URL to something else — return as-is
    if (v.startsWith('http')) return v;
    // It's a raw phone number — strip non-digits and build wa.me
    const digits = v.replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : '';
};

const getWebsiteUrl = (socialLinks) => {
    if (socialLinks?.website && !socialLinks.website.includes('highlaban.web.app') && socialLinks.website.trim() !== '') {
        return ensureAbsoluteUrl(socialLinks.website);
    }
    return 'https://highlaban.com';
};

const getProductImage = (productId) => {
    switch (productId) {
        case 1: // Lou'a
        case 5: // Qashtuta
        case 7: // Velour Mango Cream
            return cupImg;
        case 2: // Basbousa
        case 8: // Salankatia
        case 9: // Koushri
            return kunafaImg;
        case 3: // Habba Cake
        case 4: // Ambalyh
        case 6: // Choco Crepe
            return boxImg;
        default:
            return cupImg;
    }
};

const getProductCoverImage = (product) => {
    if (product.images && product.images.length > 0) {
        const firstImg = product.images[0];
        return typeof firstImg === 'string' ? firstImg : firstImg.url;
    }
    return product.img || product.image || product.imageUrl || getProductImage(product.id);
};

const Connect = () => {
    const [locations, setLocations] = useState([]);
    const [socialLinks, setSocialLinks] = useState(null);
    const [products, setProducts] = useState([]);
    const [openCardId, setOpenCardId] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [showFranchiseModal, setShowFranchiseModal] = useState(false);
    
    // About Slide Index (0: About, 1: Vision, 2: Mission)
    const [aboutSlideIndex, setAboutSlideIndex] = useState(0);

    const locationsRef = useRef(null);
    const galleryRef = useRef(null);
    const navigate = useNavigate();



    useEffect(() => {
        const fetchData = async () => {
            const [locationsData, socialData, productsData, franchisesData] = await Promise.all([
                db.getLocations(),
                db.getSocialLinks(),
                db.getProducts(),
                db.getFranchises()
            ]);
            
            // Format all locations, linking with franchise details if matched
            const allLocs = (locationsData || []).map(l => {
                const linkedFranchise = (franchisesData || []).find(f => f.id === l.franchiseId || f.locationId === l.id);
                
                const phone = l.phone || (linkedFranchise ? linkedFranchise.phone : '');
                const address = l.address || (linkedFranchise ? linkedFranchise.address : l.area);
                const mapUrl = l.mapUrl || (linkedFranchise ? linkedFranchise.mapUrl : '');
                
                return {
                    id: l.id,
                    title: l.area || l.name,
                    address: address || l.area || l.name,
                    phone: phone || '',
                    zomato: l.zomato || (linkedFranchise ? linkedFranchise.zomato : ''),
                    swiggy: l.swiggy || (linkedFranchise ? linkedFranchise.swiggy : ''),
                    magicpin: l.magicpin || (linkedFranchise ? linkedFranchise.magicpin : ''),
                    ownly: l.ownly || (linkedFranchise ? linkedFranchise.ownly : ''),
                    ondc: l.ondc || (linkedFranchise ? linkedFranchise.ondc : ''),
                    whatsapp: (() => {
                        const raw = l.whatsapp || (linkedFranchise?.whatsapp) || '';
                        return ensureWaUrl(raw);
                    })(),
                    mapUrl: mapUrl || '',
                    imageUrl: l.imageUrl || '',
                    imageUrls: l.imageUrls || [],
                    status: l.status || 'Open' // 'Open', 'Coming Soon', 'Closed'
                };
            });

            // HQ Fallback if locations is empty
            const finalLocs = allLocs.length > 0 ? allLocs : [
                {
                    id: 'hq',
                    title: 'HQ - Indiranagar',
                    address: '17, Jeevan Bima Nagar Main Rd, HAL 3rd Stage, Bengaluru',
                    phone: '7483837201',
                    zomato: 'https://zomato.com',
                    swiggy: 'https://swiggy.com',
                    whatsapp: 'https://wa.me/917483837201',
                    mapUrl: 'https://maps.google.com',
                    status: 'Open'
                }
            ];

            setLocations(finalLocs);
            setSocialLinks(socialData);
            setProducts(productsData || []);
            setLoading(false);
        };
        fetchData();
    }, []);

    const toggleCard = (id) => {
        setOpenCardId(openCardId === id ? null : id);
    };

    const scrollToLocations = () => {
        locationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0ea5e9', fontWeight: 'bold' }}>Loading Premium Experience...</div>;

    // Collect all outlet images dynamically for the scrolling gallery
    const outletImages = locations.flatMap(l => [
        ...(l.imageUrl ? [l.imageUrl] : []),
        ...(l.imageUrls || [])
    ]).filter((val, index, self) => self.indexOf(val) === index && val.trim() !== '');
    const finalGalleryImages = outletImages;

    return (
        <div className={styles.container}>
            <Helmet>
                <title>Connect | highlaban</title>
                <meta name="description" content="Connect with highlaban. Premium Egyptian Desserts in India. Find our locations, order online, and follow us on social media." />
            </Helmet>



            <div className={styles.contentWrapper}>
                {/* Header: Gradient Glassy Hero Banner */}
                <div className={styles.profileHeader}>
                    <div className={styles.logoContainer}>
                        <img src={logo} alt="High Laban Logo" className={styles.logo} />
                    </div>
                    <p className={styles.description}>
                        {socialLinks?.bannerDescription || 'Premium Egyptian Desserts with a Modern Twist'}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '340px', justifyContent: 'center', marginTop: '0.5rem', zIndex: 2 }}>
                        <button onClick={scrollToLocations} className={styles.orderNowTopBtn} style={{ flex: 1, margin: 0 }}>
                            ORDER NOW
                        </button>
                        <a 
                            href="https://wa.me/917353100100" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.orderNowTopBtn} 
                            style={{ 
                                flex: 1, 
                                background: '#25D366', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '8px',
                                textDecoration: 'none',
                                padding: '0.75rem 1rem',
                                fontSize: '0.9rem',
                                fontWeight: '800',
                                margin: 0
                            }}
                        >
                            <FaWhatsapp style={{ fontSize: '1.1rem' }} /> WHATSAPP
                        </a>
                    </div>
                </div>

                {/* Grid Links (Menu, Website, About, Story, Franchise) */}
                <div className={styles.gridList} style={{ gap: '0.65rem', marginBottom: '1.25rem' }}>
                    <div onClick={() => setShowMenuModal(true)} className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer', padding: '0.9rem 0.5rem'}}>
                        <h3 className={styles.cardTitle} style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>Menu</h3>
                    </div>
                    <a href={getWebsiteUrl(socialLinks)} target="_blank" rel="noopener noreferrer" className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0.9rem 0.5rem'}}>
                        <h3 className={styles.cardTitle} style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>Website</h3>
                    </a>
                    
                    <div onClick={() => { setShowAboutModal(true); setAboutSlideIndex(0); }} className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer', padding: '0.9rem 0.5rem'}}>
                        <h3 className={styles.cardTitle} style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>About Us</h3>
                    </div>
                    <div onClick={() => setShowStoryModal(true)} className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer', padding: '0.9rem 0.5rem'}}>
                        <h3 className={styles.cardTitle} style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>Our Story</h3>
                    </div>
                    
                    <div onClick={() => setShowFranchiseModal(true)} className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer', gridColumn: '1 / -1', padding: '1rem 0.5rem'}}>
                        <h3 className={styles.cardTitle} style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>Franchise Inquiry</h3>
                    </div>
                </div>

                {/* Locations Section */}
                <div className={styles.sectionTitle} ref={locationsRef} style={{marginTop: '2rem'}}>Select Location</div>
                <div className={styles.cardList}>
                    {locations.filter(loc => loc.status === 'Open').map((loc) => (
                        <div key={loc.id} className={styles.glassCard} onClick={() => toggleCard(loc.id)}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitleWrap}>
                                    <div className={styles.cardIcon}><FiMapPin /></div>
                                    <div className={styles.cardText}>
                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                            <h3 className={styles.cardTitle} style={{ margin: 0 }}>{loc.title}</h3>
                                            {loc.status !== 'Open' && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 'bold',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    background: loc.status === 'Coming Soon' ? '#fef3c7' : '#fee2e2',
                                                    color: loc.status === 'Coming Soon' ? '#d97706' : '#ef4444',
                                                    display: 'inline-block'
                                                }}>
                                                    {loc.status}
                                                </span>
                                            )}
                                        </div>
                                        <p className={styles.cardSubtitle}>{loc.address}</p>
                                    </div>
                                </div>
                                <FiChevronDown className={`${styles.chevron} ${openCardId === loc.id ? styles.chevronOpen : ''}`} />
                            </div>
                            
                            {/* Expandable Content */}
                            <div className={`${styles.cardContent} ${openCardId === loc.id ? styles.cardContentOpen : ''}`} onClick={e => e.stopPropagation()}>
                                {loc.status !== 'Open' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', padding: '15px 0', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                            {loc.status === 'Coming Soon' ? '⏳ We are setting up our kitchen! Opening shortly.' : '🚫 This outlet is temporarily closed.'}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            {loc.phone && (
                                                <a href={`tel:${loc.phone}`} className={`${styles.actionBtn} ${styles.btnSecondary}`}>
                                                    <FiPhoneCall /> Call Info
                                                </a>
                                            )}
                                            {loc.mapUrl && (
                                                <a href={ensureAbsoluteUrl(loc.mapUrl)} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnSecondary}`}>
                                                    <FiMapPin /> Map Location
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.actionGrid}>
                                        {loc.zomato && (
                                            <a href={ensureAbsoluteUrl(loc.zomato)} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnPrimary}`}>
                                                Order on Zomato
                                            </a>
                                        )}
                                        {loc.swiggy && (
                                            <a href={ensureAbsoluteUrl(loc.swiggy)} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnPrimary}`} style={{background: '#fc8019'}}>
                                                Order on Swiggy
                                            </a>
                                        )}
                                        {loc.magicpin && (
                                            <a href={ensureAbsoluteUrl(loc.magicpin)} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnPrimary}`} style={{background: '#e11d48'}}>
                                                Order on MagicPin
                                            </a>
                                        )}
                                        {loc.ownly && (
                                            <div className={styles.ownlyWrapper}>
                                                <span className={styles.recommendedTag}>⭐ Recommended</span>
                                                <a href={ensureAbsoluteUrl(loc.ownly)} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnOwnly}`}>
                                                    🛵 Order on Ownly Food
                                                </a>
                                            </div>
                                        )}
                                        {loc.ondc && (
                                            <a href={ensureAbsoluteUrl(loc.ondc)} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnPrimary}`} style={{background: '#0ea5e9'}}>
                                                🔗 Order on ONDC
                                            </a>
                                        )}
                                        {loc.whatsapp && (
                                            <a href={ensureAbsoluteUrl(loc.whatsapp)} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnWhatsapp}`}>
                                                <FaWhatsapp /> WhatsApp
                                            </a>
                                        )}
                                        {loc.phone && (
                                            <a href={`tel:${loc.phone}`} className={`${styles.actionBtn} ${styles.btnSecondary}`}>
                                                <FiPhoneCall /> Call Now
                                            </a>
                                        )}
                                        {loc.mapUrl && (
                                            <a href={ensureAbsoluteUrl(loc.mapUrl)} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnSecondary}`} style={{gridColumn: '1 / -1'}}>
                                                <FiMapPin /> Open in Maps
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dynamic Image Gallery Slider (Bottom placement) */}
                {finalGalleryImages.length > 0 && (
                    <div className={styles.galleryContainer}>
                        <h4 className={styles.galleryLabel}>Our Outlets Gallery</h4>
                        <div className={styles.gallerySlider} ref={galleryRef}>
                            {finalGalleryImages.map((img, idx) => (
                                <img key={idx} src={img} alt={`Outlet ${idx + 1}`} className={styles.galleryImg} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom Social Icons */}
                <div className={styles.socialRowBottom} style={{marginTop: '1rem'}}>
                    {socialLinks?.instagram && (
                        <a href={ensureAbsoluteUrl(socialLinks.instagram)} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                            <FiInstagram />
                        </a>
                    )}
                    {socialLinks?.facebook && (
                        <a href={ensureAbsoluteUrl(socialLinks.facebook)} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                            <FaFacebookF />
                        </a>
                    )}
                    {socialLinks?.twitter && (
                        <a href={ensureAbsoluteUrl(socialLinks.twitter)} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                            <FiTwitter />
                        </a>
                    )}
                    {socialLinks?.youtube && (
                        <a href={ensureAbsoluteUrl(socialLinks.youtube)} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                            <FiYoutube />
                        </a>
                    )}
                    {socialLinks?.linkedin && (
                        <a href={ensureAbsoluteUrl(socialLinks.linkedin)} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                            <FaLinkedinIn />
                        </a>
                    )}
                    {socialLinks?.whatsapp && (
                        <a href={ensureAbsoluteUrl(socialLinks.whatsapp)} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                            <FaWhatsapp />
                        </a>
                    )}
                </div>

                {/* WhatsApp Channel Join */}
                <a
                    href="https://whatsapp.com/channel/0029Vb8I2pm2v1Im3k3Iez1e"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '18px',
                        padding: '1rem 1.5rem',
                        marginTop: '1rem',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        boxShadow: '0 6px 24px rgba(37,211,102,0.3)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        width: '100%',
                        justifyContent: 'space-between',
                        boxSizing: 'border-box',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(37,211,102,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(37,211,102,0.3)'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            flexShrink: 0
                        }}>
                            <FaWhatsapp />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>Join Our WhatsApp Channel</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 500 }}>Offers, updates &amp; exclusive drops</div>
                        </div>
                    </div>
                    <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>→</span>
                </a>

                <a href={getWebsiteUrl(socialLinks)} target="_blank" rel="noopener noreferrer" className={styles.joinBtn}>Visit Official Website</a>
                <div style={{height: '40px'}}></div>


                {/* 1. SYNCED MENU MODAL */}
                {showMenuModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowMenuModal(false)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>Our Premium Menu</h2>
                                <button className={styles.closeBtn} onClick={() => setShowMenuModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                {products.map(product => (
                                    <div key={product.id} className={styles.menuItemCard}>
                                        <img 
                                            src={getProductCoverImage(product)} 
                                            alt={product.name} 
                                            className={styles.menuItemImg} 
                                            onError={(e) => { e.target.src = cupImg; }}
                                        />
                                        <div className={styles.menuItemInfo}>
                                            <span className={styles.menuItemTag}>{product.tag}</span>
                                            <h3 className={styles.menuItemName}>{product.name}</h3>
                                            <p className={styles.menuItemDesc}>{product.description}</p>
                                            <div className={styles.menuItemRow}>
                                                <span className={styles.menuItemPrice}>₹{product.price}</span>
                                                {product.badge && (
                                                    <span className={styles.menuBadge} style={{
                                                        background: product.badge === 'NEW ARRIVAL' ? '#f5f3ff' : '#eff6ff',
                                                        color: product.badge === 'NEW ARRIVAL' ? '#7c3aed' : '#1d4ed8'
                                                    }}>{product.badge}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. ABOUT US SLIDING TABS MODAL */}
                {showAboutModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowAboutModal(false)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>About Us</h2>
                                <button className={styles.closeBtn} onClick={() => setShowAboutModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            
                            {/* Slide option tabs */}
                            <div className={styles.sliderTabs}>
                                <button className={`${styles.sliderTabBtn} ${aboutSlideIndex === 0 ? styles.activeTabBtn : ''}`} onClick={() => setAboutSlideIndex(0)}>About</button>
                                <button className={`${styles.sliderTabBtn} ${aboutSlideIndex === 1 ? styles.activeTabBtn : ''}`} onClick={() => setAboutSlideIndex(1)}>Vision</button>
                                <button className={`${styles.sliderTabBtn} ${aboutSlideIndex === 2 ? styles.activeTabBtn : ''}`} onClick={() => setAboutSlideIndex(2)}>Mission</button>
                            </div>

                            <div className={styles.modalBody}>
                                <div className={styles.slideContainer}>
                                    <button 
                                        className={styles.slideNavBtn} 
                                        disabled={aboutSlideIndex === 0} 
                                        onClick={() => setAboutSlideIndex(prev => prev - 1)}
                                    >
                                        <FiChevronLeft />
                                    </button>

                                    <div className={styles.slideView}>
                                        {aboutSlideIndex === 0 && (
                                            <div className={styles.slideContent}>
                                                <h3 className={styles.slideHeader}>About High Laban</h3>
                                                <p className={styles.slideText}>
                                                    High Laban is where Egypt’s classic desserts meet modern indulgence. Born from a love for Middle Eastern sweets and inspired by global dessert trends, we blend authentic Egyptian recipes with a fresh twist that connects with today’s taste buds. From Kunafa and Umm Ali to new-age fusion creations layered with chocolate, cream, and pistachio, every bite is handcrafted to balance tradition and innovation. We believe in honest ingredients, real textures, and the kind of sweetness that makes you pause and smile. At High Laban, you don’t just eat dessert — you get high on bites.
                                                </p>
                                            </div>
                                        )}
                                        {aboutSlideIndex === 1 && (
                                            <div className={styles.slideContent}>
                                                <h3 className={styles.slideHeader}>Our Vision</h3>
                                                <p className={styles.slideText}>
                                                    To redefine how Indian dessert lovers experience Egyptian and Middle Eastern sweets — by blending authenticity, creativity, and global inspiration in every bite.
                                                </p>
                                            </div>
                                        )}
                                        {aboutSlideIndex === 2 && (
                                            <div className={styles.slideContent}>
                                                <h3 className={styles.slideHeader}>Our Mission</h3>
                                                <p className={styles.slideText}>
                                                    Our mission is to create desserts that celebrate Egypt’s rich heritage while connecting with modern global tastes. We stay rooted in authentic techniques and ingredients, yet continue to explore new flavour combinations and textures. High Laban stands for quality, passion, and the joy of cultural food experiences. We aim to share the beauty of Egyptian dessert culture across the world and make it a part of every dessert lover’s story.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        className={styles.slideNavBtn} 
                                        disabled={aboutSlideIndex === 2} 
                                        onClick={() => setAboutSlideIndex(prev => prev + 1)}
                                    >
                                        <FiChevronRight />
                                    </button>
                                </div>
                                
                                {/* Bullet indicators */}
                                <div className={styles.slideBullets}>
                                    {[0, 1, 2].map(idx => (
                                        <span 
                                            key={idx} 
                                            className={`${styles.bullet} ${aboutSlideIndex === idx ? styles.activeBullet : ''}`}
                                            onClick={() => setAboutSlideIndex(idx)}
                                        ></span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. OUR STORY POPUP MODAL */}
                {showStoryModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowStoryModal(false)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>Our Story</h2>
                                <button className={styles.closeBtn} onClick={() => setShowStoryModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <span className={styles.storySublabel}>CREATING THE VIRAL SENSATION</span>
                                <p className={styles.storyParagraph}>
                                    For most people in India, Middle Eastern desserts begin and end with Kunafa and Baklava. But Egypt has a much richer dessert culture waiting to be discovered. That's why High Laban was created. Founded by Nishan, Nufoor, and Marshad, three passionate food lovers, High Laban was born from a dream of introducing India to authentic Egyptian desserts like Umm Ali, Heba Cake, Qashtoota, Salankatia, and many more.
                                </p>
                                <p className={styles.storyParagraph}>
                                    Our journey began in Indiranagar, Bangalore, where we combine traditional Egyptian recipes with premium ingredients and a modern touch inspired by Indian taste preferences. Every dessert is crafted to preserve its authentic roots while creating a new experience for today's generation. This is only the beginning. Our vision is to take High Laban across Kerala, Chennai, Hyderabad, Mumbai, Delhi, and beyond, sharing Egypt's rich dessert heritage with every city we visit.
                                </p>

                                <div className={styles.storyBadgeGrid}>
                                    {['Authentic Recipes', 'Freshly Crafted', 'Premium Ingredients', 'Unforgettable Flavours', 'Innovative Fusions', 'Pure Passion'].map((feature, index) => (
                                        <span key={index} className={styles.storyFeatureBadge}>
                                            ✓ {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. FRANCHISE INQUIRY FORM MODAL */}
                <FranchiseForm isOpen={showFranchiseModal} onClose={() => setShowFranchiseModal(false)} isModal={true} />

            </div>

            {/* Infinite Rotating Text Circle Badge (Floating on the bottom-right side) */}
            <div className={styles.rotatingBadgeContainer}>
                <svg viewBox="0 0 100 100" width="85" height="85" className={styles.rotatingSvg}>
                    <path 
                        id="circlePath" 
                        d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" 
                        fill="none"
                    />
                    <text fill="#0ea5e9" fontSize="7.2" fontWeight="900" letterSpacing="1.8">
                        <textPath href="#circlePath">
                            GET HIGH ON BITES • GET HIGH ON BITES •
                        </textPath>
                    </text>
                </svg>
                <div className={styles.badgeCenterStar}>✨</div>
            </div>
        </div>
    );
};

export default Connect;
