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
    const [products, setProducts] = useState([]);
    const [openCardId, setOpenCardId] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showStoryModal, setShowStoryModal] = useState(false);
    
    // About Slide Index (0: About, 1: Vision, 2: Mission)
    const [aboutSlideIndex, setAboutSlideIndex] = useState(0);

    const locationsRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const [locationsData, socialData, productsData] = await Promise.all([
                db.getLocations(),
                db.getSocialLinks(),
                db.getProducts()
            ]);
            
            // Format existing locations to match Connect Page card structure
            const activeLocs = (locationsData || []).filter(l => l.status === 'Open').map(l => ({
                id: l.id,
                title: l.area || l.name,
                address: l.address || l.name,
                phone: l.phone || '',
                zomato: l.zomato || '',
                swiggy: l.swiggy || '',
                magicpin: l.magicpin || '',
                ownly: l.ondc || '',
                whatsapp: l.whatsapp ? (l.whatsapp.startsWith('http') ? l.whatsapp : `https://wa.me/${l.whatsapp.replace(/\D/g, '')}`) : '',
                mapUrl: l.mapUrl || '',
                imageUrl: l.imageUrl || '',
                imageUrls: l.imageUrls || []
            }));

            // HQ Fallback if locations is empty
            const finalLocs = activeLocs.length > 0 ? activeLocs : [
                {
                    id: 'hq',
                    title: 'HQ - Indiranagar',
                    address: '17, Jeevan Bima Nagar Main Rd, HAL 3rd Stage, Bengaluru',
                    phone: '7483837201',
                    zomato: 'https://zomato.com',
                    swiggy: 'https://swiggy.com',
                    whatsapp: 'https://wa.me/917483837201',
                    mapUrl: 'https://maps.google.com'
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

    const finalGalleryImages = outletImages.length > 0 ? outletImages : [kunafaImg, cupImg, boxImg];

    return (
        <div className={styles.container}>
            <Helmet>
                <title>Connect | highlaban</title>
                <meta name="description" content="Connect with highlaban. Premium Egyptian Desserts in India. Find our locations, order online, and follow us on social media." />
            </Helmet>

            {/* 3D Flowy Background Blobs */}
            <div className={styles.blob1}></div>
            <div className={styles.blob2}></div>
            <div className={styles.blob3}></div>

            <div className={styles.contentWrapper}>
                {/* Header: Gradient Glassy Hero Banner */}
                <div className={styles.profileHeader}>
                    <div className={styles.logoContainer}>
                        <img src={logo} alt="highlaban Logo" className={styles.logo} />
                    </div>
                    <h1 className={styles.brandName}>
                        {socialLinks?.bannerTitle || 'highlaban'}
                    </h1>
                    <p className={styles.description}>
                        {socialLinks?.bannerDescription || 'Premium Egyptian Desserts in India'}
                    </p>
                    
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
                    <div onClick={() => { setShowAboutModal(true); setAboutSlideIndex(0); }} className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer'}}>
                        <h3 className={styles.cardTitle}>About Us</h3>
                    </div>
                    <div onClick={() => setShowStoryModal(true)} className={styles.glassCard} style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer'}}>
                        <h3 className={styles.cardTitle}>Our Story</h3>
                    </div>
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
                                            Order on ONDC
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

                {/* Dynamic Image Gallery Slider (Bottom placement) */}
                <div className={styles.galleryContainer}>
                    <h4 className={styles.galleryLabel}>Our Outlets Gallery</h4>
                    <div className={styles.gallerySlider}>
                        {finalGalleryImages.map((img, idx) => (
                            <img key={idx} src={img} alt={`Outlet ${idx + 1}`} className={styles.galleryImg} />
                        ))}
                    </div>
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
                                            src={product.imageUrl || product.image || getProductImage(product.id)} 
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

            </div>
        </div>
    );
};

export default Connect;
