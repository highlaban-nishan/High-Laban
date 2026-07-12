import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import styles from './Hero.module.css';
import db from '../../utils/db';

// Configuration
const CONFIG = {
    mobile: {
        frames: 210,
        baseUrl: 'https://pwhyyqvqxmjkbwqlcipn.supabase.co/storage/v1/object/public/scroll%20image/frame_',
        suffix: '_delay-0.04s.webp'
    },
    desktop: {
        frames: 198,
        baseUrl: 'https://pwhyyqvqxmjkbwqlcipn.supabase.co/storage/v1/object/public/webp%20sequence/frame_',
        suffix: '_delay-0.03s.webp'
    }
};

export default function Hero() {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [imagesLoaded, setImagesLoaded] = useState(0);
    const [isMobile, setIsMobile] = useState(true); // Default to mobile first (or check logic below)

    // Dynamic Hero configurations from DB
    const [heroSettings, setHeroSettings] = useState({
        badge: 'Premium Egyptian Desserts in India',
        title: 'GET HIGH ON BITE',
        subtitle: "Experience Egypt's Finest Creamy Desserts",
        btn1Text: 'FRANCHISE',
        btn2Text: 'Our Story',
        gradientStart: '#27aae1',
        gradientEnd: '#7c3aed',
        glassOpacity: '0.15'
    });

    // Subscribe to Hero Custom Configuration from Firestore
    useEffect(() => {
        const unsubscribe = db.subscribeToSiteContent('hero', (data) => {
            if (data) {
                setHeroSettings(prev => ({ ...prev, ...data }));
            }
        });
        return () => unsubscribe && unsubscribe();
    }, []);

    // Progress determines the frame
    const progress = useScrollProgress(containerRef);

    // 1. Detect Screen Size
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768; // Standard breakpoint
            setIsMobile(mobile);
        };

        checkMobile(); // Initial check
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 2. Select Config based on mode
    const activeConfig = isMobile ? CONFIG.mobile : CONFIG.desktop;

    // 3. Preload Images (Reloads when isMobile changes)
    const images = useMemo(() => {
        setImagesLoaded(0); // Reset counter on switch
        const imgs = [];
        const { frames, baseUrl, suffix } = activeConfig;

        for (let i = 0; i < frames; i++) {
            const img = new Image();
            const frameNum = String(i).padStart(3, '0');
            img.src = `${baseUrl}${frameNum}${suffix}`;

            img.onload = () => setImagesLoaded(prev => prev + 1);
            img.onerror = () => console.warn(`Failed to load frame ${i}`); // Debug help
            imgs.push(img);
        }
        return imgs;
    }, [activeConfig.frames, activeConfig.baseUrl, activeConfig.suffix]); // Re-run if config changes


    // 4. Handle Canvas Resize
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                setDimensions({ width: window.innerWidth, height: window.innerHeight });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 5. Render Frame to Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        // Map progress (0-1) to frame index
        const frameIndex = Math.floor(progress * (activeConfig.frames - 1));
        const currentImage = images[frameIndex];

        // Draw only if image is fully loaded
        if (currentImage && currentImage.complete && currentImage.naturalWidth > 0) {
            const { width, height } = canvas;
            const imgRatio = currentImage.width / currentImage.height;
            const canvasRatio = width / height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgRatio > canvasRatio) {
                drawHeight = height;
                drawWidth = height * imgRatio;
                offsetX = (width - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = width;
                drawHeight = width / imgRatio;
                offsetX = 0;
                offsetY = (height - drawHeight) / 2;
            }

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(currentImage, offsetX, offsetY, drawWidth, drawHeight);
        }
        // Else: keep previous frame (prevents blinking)

    }, [progress, images, imagesLoaded, dimensions, activeConfig.frames]);

    const renderTitle = () => {
        const text = heroSettings.title || 'GET HIGH ON BITE';
        const lastSpaceIndex = text.lastIndexOf(' ');
        if (lastSpaceIndex === -1) return text;
        const firstPart = text.substring(0, lastSpaceIndex);
        const lastWord = text.substring(lastSpaceIndex + 1);
        return (
            <>
                {firstPart}{' '}
                <span className={styles.highlight}>{lastWord}</span>
            </>
        );
    };

    return (
        <div className={styles.heroContainer} ref={containerRef}>
            <div className={styles.stickyWrapper}>
                <canvas ref={canvasRef} className={styles.heroCanvas} />

                <div className={styles.overlayContent}>
                <div
                        style={{
                            pointerEvents: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            textAlign: 'left',
                            maxWidth: '650px',
                        }}
                    >
                        <div className={styles.topBadge}>
                            {heroSettings.badge}
                        </div>

                        <h1 className={styles.mainTitle}>
                            {renderTitle()}
                        </h1>

                        <p className={styles.subHeadline}>
                            {heroSettings.subtitle}
                        </p>

                        <div className={styles.buttonGroup}>
                            <button className={styles.btnPrimary} onClick={() => document.getElementById('franchise-section')?.scrollIntoView({ behavior: 'smooth' })}>
                                {heroSettings.btn1Text}
                            </button>
                            <button className={styles.btnSecondary} onClick={() => {
                                const element = document.getElementById('story-section');
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }}>
                                {heroSettings.btn2Text}
                            </button>
                            <div className={styles.playWrapper} onClick={() => {
                                const element = document.getElementById('story-section');
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }} style={{ cursor: 'pointer' }}>
                                <div className={styles.rotatingText}>
                                    <svg viewBox="0 0 100 100">
                                        <defs>
                                            <path id="circle" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
                                        </defs>
                                        <text>
                                            <textPath xlinkHref="#circle">
                                                PLAY VIDEO • PLAY VIDEO •
                                            </textPath>
                                        </text>
                                    </svg>
                                </div>
                                <div className={styles.playCenter}>
                                    <span className={styles.playIcon}>▶</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
