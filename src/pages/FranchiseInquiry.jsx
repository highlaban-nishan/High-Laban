import React, { useLayoutEffect } from 'react';
import FranchiseForm from '../components/Franchise/FranchiseForm';
import SEO from '../components/SEO/SEO';

export default function FranchiseInquiry() {
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div style={{ background: 'var(--color-bg-dark)', minHeight: '100vh', padding: '4rem 1rem 5rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <SEO 
                title="Franchise Application Form | High Laban"
                description="Apply now to start your High Laban Egyptian Desserts Franchise outlet."
            />
            <div style={{ maxWidth: '800px', width: '100%' }}>
                <FranchiseForm isOpen={true} onClose={() => window.location.href = '/'} isModal={false} />
            </div>
        </div>
    );
}
