import React, { useState, useEffect } from 'react';
import Container from '../UI/Container';
import styles from './Products.module.css';
import db from '../../utils/db'; // Import DB

const ProductCard = ({ product }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);

    // Normalize images: use array if exists, else fallback to single img, else empty array
    const images = product.images && product.images.length > 0
        ? product.images
        : (product.img || product.image ? [product.img || product.image] : []);

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

    return (
        <div
            className={styles.card}
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
                        images.map((img, index) => (
                            <div key={index} className={styles.carouselSlide}>
                                <img src={img} alt={`${product.name} - ${index + 1}`} className={styles.productImage} />
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

            <span className={styles.tag}>{product.tag}</span>

            <h3 className={styles.productName}>{product.name}</h3>
            <span className={styles.productTagLine}>{product.tag}</span>
            <p className={styles.productDescription}>{product.description}</p>

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
                <button className={styles.orderButton}>Order</button>
            </div>
        </div>
    );
};

export default function Products() {
    const [products, setProducts] = useState([]);

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
                    <div className={styles.menuButton}>Our Menu</div>
                    <h2 id="menu-title" className={styles.title}>Crush the craving.</h2>
                    <p className={styles.description}>
                        17 drops of heaven. Authentic egyptian recipes with a modern twist.
                    </p>
                </div>

                <div className={styles.grid}>
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                <div className={styles.viewMoreContainer}>
                    <button className={styles.viewMoreButton}>View More</button>
                </div>
            </Container>
        </section>
    );
}
