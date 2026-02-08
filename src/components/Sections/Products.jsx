import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactDOM from 'react-dom';
import Container from '../UI/Container';
import styles from './Products.module.css';
import db from '../../utils/db';
import useScrollReveal from '../../hooks/useScrollReveal'; // Import DB
import { FaTimes } from 'react-icons/fa';

const ProductCard = ({ product, index, isModal = false }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

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
        }, 2000);

        return () => clearInterval(interval);
    }, [images.length, isHovering]);

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

            {product.ingredients && (
                <div style={{ marginBottom: '0.5rem' }}>
                    <span className={styles.ingredientsTag}>{product.ingredients}</span>
                </div>
            )}

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
                        <ProductCard key={product.id} product={product} index={index} />
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
                                    <ProductCard key={product.id} product={product} index={index} isModal={true} />
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
