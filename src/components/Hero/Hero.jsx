import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import styles from './Hero.module.css';

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

    return (
        <div className={styles.heroContainer} ref={containerRef}>
            <div className={styles.stickyWrapper}>
                <canvas ref={canvasRef} className={styles.heroCanvas} />

                <div className={styles.overlayContent}>
                    <div className={styles.topBadge}>
                        Premium Egyptian Desserts in India
                    </div>

                    <h1 className={styles.mainTitle}>
                        GET HIGH <span className={styles.highlight}>ON BITE</span>
                    </h1>

                    <p className={styles.subHeadline}>
                        Experience Egypt's Finest Creamy Desserts
                    </p>

                    <div className={styles.buttonGroup}>
                        <button className={styles.btnPrimary} onClick={() => document.getElementById('menu-title')?.scrollIntoView({ behavior: 'smooth' })}>Our Flavors</button>
                        <button className={styles.btnSecondary} onClick={() => document.getElementById('story-section')?.scrollIntoView({ behavior: 'smooth' })}>Our Story</button>
                        <div className={styles.playWrapper} onClick={() => document.getElementById('nature')?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
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
    );
}
