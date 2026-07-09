import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReactDOM from 'react-dom';
import Container from '../UI/Container';
import styles from './Products.module.css';
import db from '../../utils/db';
import useScrollReveal from '../../hooks/useScrollReveal'; // Import DB
import { FaTimes } from 'react-icons/fa';

/* ─── Smooth auto-scrolling marquee row ─── */
const MarqueeRow = ({ items, renderItem, speed = 40 }) => {
    const trackRef = useRef(null);
    const animRef  = useRef(null);
    const posRef   = useRef(0);
    const pausedRef = useRef(false);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        const step = () => {
            if (!pausedRef.current) {
                const halfW = track.scrollWidth / 2;
                posRef.current -= speed / 60;
                if (Math.abs(posRef.current) >= halfW) posRef.current = 0;
                track.style.transform = `translateX(${posRef.current}px)`;
            }
            animRef.current = requestAnimationFrame(step);
        };
        animRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animRef.current);
    }, [speed]);

    return (
        <div
            style={{ overflow: 'hidden', width: '100%', cursor: 'default' }}
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
        >
            <div ref={trackRef} style={{ display: 'flex', gap: '10px', willChange: 'transform', paddingRight: '10px' }}>
                {/* duplicated for seamless loop */}
                {items.map((item, i) => renderItem(item, i))}
                {items.map((item, i) => renderItem(item, `d${i}`))}
            </div>
        </div>
    );
};

const ProductCard = ({ product, index, isModal = false, onOrderClick }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTopping, setActiveTopping] = useState(null);

    // Normalize images: use array if exists, else fallback to single img, else empty array
    // Also ensure all items are treated as objects with {url, tag} for internal consistency in this component
    const rawImages = product.images && product.images.length > 0
        ? product.images
        : (product.img || product.image ? [product.img || product.image] : []);

    const images = rawImages.map(img => typeof img === 'string' ? { url: img, tag: '' } : img);

    const handleNextImage = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrevImage = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const goToSlide = (index, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setCurrentImageIndex(index);
    }

    // Auto-slide effect
    useEffect(() => {
        if (images.length <= 1 || isHovering) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 3000); // 3 seconds interval for smooth reading

        return () => clearInterval(interval);
    }, [images.length, isHovering]);

    // Bidirectional sync: current slide change highlights corresponding topping
    useEffect(() => {
        const currentImage = images[currentImageIndex];
        if (currentImage && currentImage.tag) {
            const normalizedTag = currentImage.tag.toLowerCase().trim();
            const toppingsList = Array.isArray(product.toppings) 
                ? product.toppings 
                : (product.toppings ? product.toppings.split(',').map(t => t.trim()) : []);
            const matchedTopping = toppingsList.find(t => t.toLowerCase().trim() === normalizedTag);
            if (matchedTopping) {
                setActiveTopping(matchedTopping);
            } else {
                setActiveTopping(null);
            }
        } else {
            setActiveTopping(null);
        }
    }, [currentImageIndex, images, product.toppings]);

    // Determine current tag: if specific image tag exists, use it; otherwise fallback to general product tag
    const currentTag = images[currentImageIndex]?.tag || product.tag;

    return (
        <div
            className={`${styles.card} ${!isModal ? `reveal reveal-delay-${(index % 4) * 100}` : ''}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {product.badge && (
                <span className={`${styles.badge} ${product.badge === 'NEW ARRIVAL' ? styles.badgeNewArrival : ''}`}>
                    {product.badge}
                </span>
            )}

            <div className={styles.imageContainer}>
                {/* Sliding Track */}
                <div
                    className={styles.carouselTrack}
                    style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                >
                    {images.length > 0 ? (
                        images.map((imgObj, index) => (
                            <div key={index} className={styles.carouselSlide}>
                                <img src={imgObj.url} alt={`${product.name} - ${index + 1}`} className={styles.productImage} />
                            </div>
                        ))
                    ) : (
                        <div className={styles.carouselSlide}>
                            <img src='https://placehold.co/200' alt={product.name} className={styles.productImage} />
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                {images.length > 1 && (
                    <>
                        <button className={`${styles.carouselBtn} ${styles.prev}`} onClick={handlePrevImage}>&lt;</button>
                        <button className={`${styles.carouselBtn} ${styles.next}`} onClick={handleNextImage}>&gt;</button>
                    </>
                )}
            </div>

            <span className={styles.tag}>{currentTag}</span>

            <div onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className={styles.productName}>{product.name}</h3>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    style={{
                        width: '20px',
                        height: '20px',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        color: '#64748b'
                    }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </div>

            {product.ingredients && (() => {
                const layerText = 'Layers: ' + product.ingredients.split(/[-•,]/).map(s => s.trim()).filter(Boolean).join(' • ');
                return (
                    <div style={{ marginBottom: '0.5rem' }}>
                        <MarqueeRow
                            items={[layerText]}
                            speed={35}
                            renderItem={(txt, i) => (
                                <span
                                    key={i}
                                    style={{
                                        fontSize: '0.75rem',
                                        color: '#64748b',
                                        background: '#f1f5f9',
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '20px',
                                        fontWeight: '600',
                                        border: '1px solid #e2e8f0',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                    }}
                                >
                                    {txt}
                                </span>
                            )}
                        />
                    </div>
                );
            })()}

            {product.toppings && (Array.isArray(product.toppings) ? product.toppings : product.toppings.split(',')).filter(t => t.trim()).length > 0 && (() => {
                const chips = (Array.isArray(product.toppings) ? product.toppings : product.toppings.split(',')).filter(t => t.trim());
                return (
                    <div style={{ marginBottom: '0.75rem', minWidth: 0 }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Toppings:</span>
                        <MarqueeRow
                            items={chips}
                            speed={30}
                            renderItem={(topping, tIdx) => {
                                const hasMatchingPic = images.some(img =>
                                    img.tag && img.tag.toLowerCase().trim() === topping.trim().toLowerCase()
                                );
                                const isActive = activeTopping && activeTopping.toLowerCase().trim() === topping.toLowerCase().trim();
                                return (
                                    <span
                                        key={tIdx}
                                        onClick={() => {
                                            if (hasMatchingPic) {
                                                const matchingIdx = images.findIndex(img =>
                                                    img.tag && img.tag.toLowerCase().trim() === topping.trim().toLowerCase()
                                                );
                                                if (matchingIdx !== -1) goToSlide(matchingIdx);
                                            }
                                        }}
                                        style={{
                                            fontSize: '0.65rem',
                                            color: isActive ? '#ffffff' : '#009ceb',
                                            background: isActive ? '#009ceb' : '#f0f9ff',
                                            border: isActive ? '1px solid #009ceb' : '1px solid #cbd5e1',
                                            padding: '3px 10px',
                                            borderRadius: '50px',
                                            fontWeight: '800',
                                            cursor: hasMatchingPic ? 'pointer' : 'default',
                                            flexShrink: 0,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {topping.trim()}
                                    </span>
                                );
                            }}
                        />
                    </div>
                );
            })()}

            <div className={`${styles.dropdownWrapper} ${isExpanded ? styles.expanded : ''}`}>
                <div className={styles.dropdownInner}>
                    <p className={styles.productDescription}>{product.description}</p>
                </div>
            </div>

            <div className={styles.cardFooter}>
                <div className={styles.priceContainer}>
                    {product.originalPrice && (
                        <span className={styles.originalPrice}>
                            <span style={{ fontSize: '0.8em' }}>₹</span>{product.originalPrice}
                        </span>
                    )}
                    <div className={styles.price}>
                        <span className={styles.priceCurrency}>₹</span>{product.price}
                    </div>
                </div>
                <button
                    className={styles.orderButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isModal && typeof onOrderClick === 'function') {
                            onOrderClick();
                        } else {
                            const element = document.getElementById('story-section');
                            if (element) {
                                const y = element.getBoundingClientRect().top + window.scrollY - 100;
                                window.scrollTo({ top: y, behavior: 'smooth' });
                            }
                        }
                    }}
                >
                    Order Now
                </button>
            </div>
        </div>
    );
};

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isFullMenuOpen, setIsFullMenuOpen] = useState(false);
    const location = useLocation();

    // Check for hash to open full menu
    useEffect(() => {
        if (location.hash === '#full-menu') {
            setIsFullMenuOpen(true);
            // Optional: scroll to the section as well
            const element = document.getElementById('products');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location]);

    // Disable background scroll when modal is open
    useEffect(() => {
        if (isFullMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isFullMenuOpen]);

    useScrollReveal([products]);

    useEffect(() => {
        const fetchProducts = async () => {
            const data = await db.getProducts();
            setProducts(data);
        };
        fetchProducts();
    }, []);

    const handleOrderClick = () => {
        setIsFullMenuOpen(false);
        setTimeout(() => {
            const element = document.getElementById('locations');
            if (element) {
                const y = element.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }, 150);
    };

    return (
        <section id="products" className={styles.section}>
            <Container>
                <div className={styles.header}>
                    <div className={styles.menuButton}>Full Menu</div>
                    <h2 id="menu-title" className={styles.title}>Crush the craving.</h2>
                    <p className={styles.description}>
                        17 drops of heaven. Authentic egyptian recipes with a modern twist.
                    </p>
                </div>

                <div className={styles.grid}>
                    {products.slice(0, 6).map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} onOrderClick={handleOrderClick} />
                    ))}
                </div>

                <div className={styles.viewMoreContainer}>
                    <button className={styles.viewMoreButton} onClick={() => setIsFullMenuOpen(true)}>View More</button>
                </div>
            </Container>

            {/* Full Menu Overlay - Portal to Body */}
            {isFullMenuOpen && ReactDOM.createPortal(
                <div className={styles.fullMenuOverlay}>
                    <div className={styles.fullMenuContainer}>
                        <div className={styles.fullMenuHeader}>
                            <h2 className={styles.fullMenuTitle}>Full Menu</h2>
                            <button className={styles.closeButton} onClick={() => setIsFullMenuOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className={styles.fullMenuContent}>
                            <div className={styles.modalGrid}>
                                {products.map((product, index) => (
                                    <ProductCard key={product.id} product={product} index={index} isModal={true} onOrderClick={handleOrderClick} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </section>
    );
}
