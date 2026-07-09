import React, { useState, useEffect } from 'react';
import { FiInstagram, FiMapPin, FiChevronDown, FiGlobe, FiPhoneCall } from 'react-icons/fi';
import { FaWhatsapp, FaLinkedinIn } from 'react-icons/fa';
import { MdOutlineRestaurantMenu } from 'react-icons/md';
import styles from './Connect.module.css';
import db from '../utils/db';
import logo from '../assets/logo.png';
import { Helmet } from 'react-helmet-async';

const Connect = () => {
    const [locations, setLocations] = useState([]);
    const [socialLinks, setSocialLinks] = useState(null);
    const [openCardId, setOpenCardId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [franchisesData, socialData] = await Promise.all([
                db.getFranchises(),
                db.getSocialLinks()
            ]);
            
            // Format existing franchises to match the card style
            const runningLocs = franchisesData.filter(f => f.status === 'Running').map(f => ({
                id: f.id,
                title: `${f.outletName} - ${f.phone || ''}`.toUpperCase(),
                address: f.address,
                phone: f.phone,
                zomato: f.zomatoUrl || '',
                swiggy: f.swiggyUrl || '',
                whatsapp: `https://wa.me/91${(f.phone || '').replace(/\D/g, '')}`,
                mapUrl: f.mapUrl || ''
            }));

            // Make sure HQ is there if not in franchises
            const hasHQ = runningLocs.some(l => l.title.includes('INDIRANAGAR') || l.title.includes('HQ'));
            const finalLocs = hasHQ ? runningLocs : [
                {
                    id: 'hq',
                    title: 'HQ - INDIRANAGAR - 7483837201',
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
                    <p className={styles.description}>Authentic Recipes • Modern Indulgence</p>
                    
                    <div className={styles.socialRow}>
                        {socialLinks?.instagram && (
                            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                                <FiInstagram />
                            </a>
                        )}
                        {socialLinks?.whatsapp && (
                            <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                                <FaWhatsapp />
                            </a>
                        )}
                        {socialLinks?.linkedin && (
                            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                                <FaLinkedinIn />
                            </a>
                        )}
                    </div>
                </div>

                {/* Locations Section */}
                <div className={styles.sectionTitle}>Location</div>
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
                                        <a href={loc.zomato} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnPrimary}`}>
                                            Order on Zomato
                                        </a>
                                    )}
                                    {loc.swiggy && (
                                        <a href={loc.swiggy} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnPrimary}`} style={{background: '#fc8019'}}>
                                            Order on Swiggy
                                        </a>
                                    )}
                                    {loc.magicpin && (
                                        <a href={loc.magicpin} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnPrimary}`} style={{background: '#e11d48'}}>
                                            Order on MagicPin
                                        </a>
                                    )}
                                    {loc.ownly && (
                                        <a href={loc.ownly} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnPrimary}`} style={{background: '#0ea5e9'}}>
                                            Order on Ownly
                                        </a>
                                    )}
                                    <a href={loc.whatsapp} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnWhatsapp}`}>
                                        <FaWhatsapp /> WhatsApp
                                    </a>
                                    <a href={`tel:${loc.phone}`} className={`${styles.actionBtn} ${styles.btnSecondary}`}>
                                        <FiPhoneCall /> Call Now
                                    </a>
                                    {loc.mapUrl && (
                                        <a href={loc.mapUrl} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.btnSecondary}`} style={{gridColumn: '1 / -1'}}>
                                            <FiMapPin /> Open in Maps
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* General Links */}
                <div className={styles.cardList} style={{marginTop: '1rem'}}>
                    {socialLinks?.website && (
                        <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center'}}>
                            <h3 className={styles.cardTitle}>Website</h3>
                        </a>
                    )}
                    {socialLinks?.menu && (
                        <a href={socialLinks.menu} target="_blank" rel="noopener noreferrer" className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center'}}>
                            <h3 className={styles.cardTitle}>Menu</h3>
                        </a>
                    )}
                </div>

                {/* Order Now Global Section */}
                <div className={styles.sectionTitle} style={{marginTop: '2rem'}}>ORDER NOW</div>
                <div className={styles.cardList}>
                    {socialLinks?.orderOwnly && (
                        <a href={socialLinks.orderOwnly} target="_blank" rel="noopener noreferrer" className={styles.platformCard}>
                            <div className={`${styles.platformIconWrap} ${styles.ownly}`}><MdOutlineRestaurantMenu /></div>
                            Ownly
                        </a>
                    )}
                    {socialLinks?.orderZomato && (
                        <a href={socialLinks.orderZomato} target="_blank" rel="noopener noreferrer" className={styles.platformCard}>
                            <div className={`${styles.platformIconWrap} ${styles.zomato}`} style={{fontWeight: 900}}>Z</div>
                            Zomato
                        </a>
                    )}
                    {socialLinks?.orderSwiggy && (
                        <a href={socialLinks.orderSwiggy} target="_blank" rel="noopener noreferrer" className={styles.platformCard}>
                            <div className={`${styles.platformIconWrap} ${styles.swiggy}`} style={{fontWeight: 900}}>S</div>
                            Swiggy
                        </a>
                    )}
                    {socialLinks?.orderMagicPin && (
                        <a href={socialLinks.orderMagicPin} target="_blank" rel="noopener noreferrer" className={styles.platformCard}>
                            <div className={`${styles.platformIconWrap} ${styles.magicpin}`} style={{fontWeight: 900}}>M</div>
                            Magic Pin
                        </a>
                    )}
                </div>

                <a href="/" className={styles.joinBtn}>Visit Official Website</a>
                <div style={{height: '40px'}}></div>
            </div>
        </div>
    );
};

export default Connect;
