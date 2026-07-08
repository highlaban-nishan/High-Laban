import React from 'react';
import FranchiseForm from '../components/Franchise/FranchiseForm';
import SEO from '../components/SEO/SEO';

export default function FranchiseInquiry() {
    return (
        <div style={{ background: 'var(--color-bg-dark)', minHeight: '100vh', padding: '120px 1rem 80px 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <SEO 
                title="Franchise Application Form | High Laban"
                description="Apply now to start your High Laban Egyptian Desserts Franchise outlet."
            />
            <div style={{ maxWidth: '750px', width: '100%', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '2rem', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                <FranchiseForm isOpen={true} onClose={() => window.location.href = '/'} isModal={false} />
            </div>
        </div>
    );
}
