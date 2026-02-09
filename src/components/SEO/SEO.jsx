import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, keywords, type = 'website', name = 'High Laban Community' }) {
    return (
        <Helmet>
            {/* Standard metadata */}
            <title>{title}</title>
            <meta name='description' content={description} />
            {keywords && <meta name='keywords' content={keywords} />}

            {/* Open Graph / Facebook */}
            <meta property='og:type' content={type} />
            <meta property='og:title' content={title} />
            <meta property='og:description' content={description} />
            {/* og:image and og:url are often page specific, but we can default or let them cascade if not overridden, 
                for now we'll stick to what was in index.html or let Helmet override if we pass them.
                If we want per-page images, we can add image prop.
            */}

            {/* Twitter */}
            <meta name='twitter:card' content='summary_large_image' />
            <meta name='twitter:title' content={title} />
            <meta name='twitter:description' content={description} />
        </Helmet>
    );
}
