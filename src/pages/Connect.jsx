import React, { useState, useEffect, useRef } from 'react';
import { FiInstagram, FiMapPin, FiChevronDown, FiPhoneCall, FiTwitter, FiYoutube, FiX } from 'react-icons/fi';
import { FaWhatsapp, FaLinkedinIn, FaFacebookF } from 'react-icons/fa';
import styles from './Connect.module.css';
import db from '../utils/db';
import logo from '../assets/logo.png';
import kunafaImg from '../assets/cheese_pull_kunafa.png';
import cupImg from '../assets/cup.png';
import boxImg from '../assets/box.png';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { productsData } from '../components/Sections/ProductsData';

const ensureAbsoluteUrl = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
        return trimmed;
    }
    return `https://${trimmed}`;
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

const Connect = () => {
    const [locations, setLocations] = useState([]);
    const [socialLinks, setSocialLinks] = useState(null);
    const [openCardId, setOpenCardId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const locationsRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const [franchisesData, socialData] = await Promise.all([
                db.getFranchises(),
                db.getSocialLinks()
            ]);
            
            // Format existing franchises to match the card style
            const runningLocs = franchisesData.filter(f => f.status === 'Running').map(f => ({
                id: f.id,
                title: f.outletName, // CLEAN NAME
                address: f.address,
                phone: f.phone,
                zomato: f.zomatoUrl || '',
                swiggy: f.swiggyUrl || '',
                magicpin: f.magicPinUrl || '',
                ownly: f.ownlyUrl || '',
                whatsapp: `https://wa.me/91${(f.phone || '').replace(/\D/g, '')}`,
                mapUrl: f.mapUrl || ''
            }));

            // Make sure HQ is there if not in franchises
            const hasHQ = runningLocs.some(l => l.title.toUpperCase().includes('INDIRANAGAR') || l.title.toUpperCase().includes('HQ'));
            const finalLocs = hasHQ ? runningLocs : [
                {
                    id: 'hq',
                    title: 'HQ - Indiranagar',
                    address: '17, Jeevan Bima Nagar Main Rd, HAL 3rd Stage, Bengaluru',
                    phone: '7483837201',
                    zomato: 'https://zomato.com',
                    swiggy: 'https://swiggy.com',
                    whatsapp: 'https://wa.me/917483837201',
                    mapUrl: 'https://maps.google.com'
                },
                ...runningLocs
            ];

            setLocations(finalLocs);
            setSocialLinks(socialData);
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

    if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

    return (
        <div className={styles.container}>
            <Helmet>
                <title>Connect | highlaban</title>
                <meta name="description" content="Connect with highlaban. Premium Egyptian Desserts in India. Find our locations, order online, and follow us on social media." />
            </Helmet>

            <div className={styles.contentWrapper}>
                {/* Header */}
                <div className={styles.profileHeader}>
                    <div className={styles.logoContainer}>
                        <img src={logo} alt="highlaban Logo" className={styles.logo} />
                    </div>
                    <h1 className={styles.brandName}>highlaban</h1>
                    <p className={styles.description}>Premium Egyptian Desserts in India</p>
                    
                    <button onClick={scrollToLocations} className={styles.orderNowTopBtn}>
                        ORDER NOW
                    </button>
                </div>

                {/* Grid Links (Menu, Website, About, Story) */}
                <div className={styles.gridList}>
                    {socialLinks?.menu && (
                        <div onClick={() => setShowMenuModal(true)} className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer'}}>
                            <h3 className={styles.cardTitle}>Menu</h3>
                        </div>
                    )}
                    {socialLinks?.website && (
                        <a href={ensureAbsoluteUrl(socialLinks.website)} target="_blank" rel="noopener noreferrer" className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
                            <h3 className={styles.cardTitle}>Website</h3>
                        </a>
                    )}
                    <a href="/about-us" onClick={(e) => { e.preventDefault(); navigate('/about-us'); }} className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
                        <h3 className={styles.cardTitle}>About Us</h3>
                    </a>
                    <a href="/#story-section" onClick={(e) => { e.preventDefault(); navigate('/'); setTimeout(() => { document.getElementById('story-section')?.scrollIntoView({behavior:'smooth'}); }, 500); }} className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
                        <h3 className={styles.cardTitle}>Our Story</h3>
                    </a>
                </div>

                {/* Locations Section */}
                <div className={styles.sectionTitle} ref={locationsRef} style={{marginTop: '2rem'}}>Select Location</div>
                <div className={styles.cardList}>
                    {locations.map((loc) => (
                        <div key={loc.id} className={styles.glassCard} onClick={() => toggleCard(loc.id)}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitleWrap}>
                                    <div className={styles.cardIcon}><FiMapPin /></div>
                                    <div className={styles.cardText}>
                                        <h3 className={styles.cardTitle}>{loc.title}</h3>
                                        <p className={styles.cardSubtitle}>{loc.address}</p>
                                    </div>
                                </div>
                                <FiChevronDown className={`${styles.chevron} ${openCardId === loc.id ? styles.chevronOpen : ''}`} />
                            </div>
                            
                            {/* Expandable Content */}
                            <div className={`${styles.cardContent} ${openCardId === loc.id ? styles.cardContentOpen : ''}`} onClick={e => e.stopPropagation()}>
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
                                        <a href={ensureAbsoluteUrl(loc.ownly)} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnPrimary}`} style={{background: '#0ea5e9'}}>
                                            Order on Ownly
                                        </a>
                                    )}
                                    <a href={ensureAbsoluteUrl(loc.whatsapp)} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnWhatsapp}`}>
                                        <FaWhatsapp /> WhatsApp
                                    </a>
                                    <a href={`tel:${loc.phone}`} className={`${styles.actionBtn} ${styles.btnSecondary}`}>
                                        <FiPhoneCall /> Call Now
                                    </a>
                                    {loc.mapUrl && (
                                        <a href={ensureAbsoluteUrl(loc.mapUrl)} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnSecondary}`} style={{gridColumn: '1 / -1'}}>
                                            <FiMapPin /> Open in Maps
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Gallery Slider (Moved to Bottom) */}
                <div className={styles.gallerySlider} style={{marginTop: '2rem'}}>
                    <img src={kunafaImg} alt="Kunafa" className={styles.galleryImg} />
                    <img src={cupImg} alt="Dessert Cup" className={styles.galleryImg} />
                    <img src={boxImg} alt="Box" className={styles.galleryImg} />
                </div>

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

                <a href={ensureAbsoluteUrl(socialLinks?.website || '/')} target="_blank" rel="noopener noreferrer" className={styles.joinBtn}>Visit Official Website</a>
                <div style={{height: '40px'}}></div>

                {/* Menu Modal (Popup on highlaban/connect page) */}
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
                                {productsData.map(product => (
                                    <div key={product.id} className={styles.menuItemCard}>
                                        <img src={getProductImage(product.id)} alt={product.name} className={styles.menuItemImg} />
                                        <div className={styles.menuItemInfo}>
                                            <span className={styles.menuItemTag}>{product.tag}</span>
                                            <h3 className={styles.menuItemName}>{product.name}</h3>
                                            <p className={styles.menuItemDesc}>{product.description}</p>
                                            <div className={styles.menuItemRow}>
                                                <span className={styles.menuItemPrice}>₹{product.price}</span>
                                                {product.badge && (
                                                    <span className={styles.menuBadge} style={{
                                                        background: product.badgeColor === 'purple' ? '#f5f3ff' : '#eff6ff',
                                                        color: product.badgeColor === 'purple' ? '#7c3aed' : '#1d4ed8'
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
            </div>
        </div>
    );
};

export default Connect;
