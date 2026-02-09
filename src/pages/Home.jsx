import React, { useEffect, useLayoutEffect } from 'react';
import Hero from '../components/Hero/Hero';
import About from '../components/Sections/About'; // Import About
import Highlights from '../components/Sections/Highlights';
import VideoSection from '../components/Sections/VideoSection';
import Products from '../components/Sections/Products';
import Marquee from '../components/Sections/Marquee';
import { useLocation } from 'react-router-dom';
import FranchiseSection from '../components/Sections/FranchiseSection';

import ValuesAndLocations from '../components/Sections/ValuesAndLocations';
import SEO from '../components/SEO/SEO';

const Home = () => {
    const location = useLocation();

    useLayoutEffect(() => {
        // Prevent browser from restoring scroll position
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        // Force scroll to top on refresh (before unload)
        const handleBeforeUnload = () => {
            window.scrollTo(0, 0);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        if (location.state?.scrollTo) {
            const element = document.getElementById(location.state.scrollTo);
            if (element) {
                // Small delay to ensure render
                setTimeout(() => {
                    const y = element.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                    // Clear state to prevent scroll on refresh
                    window.history.replaceState({}, document.title);
                }, 100);
            }
        } else if (location.hash) {
            // Handle hash scrolling
            const elementId = location.hash.replace('#', '');
            const element = document.getElementById(elementId);
            if (element) {
                setTimeout(() => {
                    const y = element.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }, 100);
            }
        } else {
            // Aggressive scroll to top only if no hash
            window.scrollTo(0, 0);

            // Double check after a small tick
            setTimeout(() => window.scrollTo(0, 0), 0);
            setTimeout(() => window.scrollTo(0, 0), 50);
        }

        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [location]);


    return (
        <>
            <SEO
                title="High Laban Community | Premium Egyptian Desserts"
                description="Experience the authentic taste of Egyptian desserts in India. Join the High Laban community and discover our premium products and franchise opportunities."
                keywords="Egyptian desserts, High Laban, premium desserts, franchise, India"
            />
            <Hero />
            <main style={{ position: 'relative', zIndex: 10, background: 'var(--color-bg-dark)' }}>
                <Marquee />
                <About /> {/* Added Static About Section */}
                <Products />
                <VideoSection />
                <Highlights />
                <FranchiseSection />
                <ValuesAndLocations />
            </main>
        </>
    );
};

export default Home;
